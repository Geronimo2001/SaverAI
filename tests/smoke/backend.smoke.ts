import assert from "node:assert/strict"
import { spawn, type ChildProcess } from "node:child_process"
import { createHash, createHmac, randomUUID } from "node:crypto"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { createServer } from "node:net"
import { resolve } from "node:path"
import { setTimeout as delay } from "node:timers/promises"
import { Client } from "pg"
import { getTestDatabaseUrl, verifyTestDatabase } from "../../scripts/test-database-config.js"

// CP-021: ejecutar el artefacto compilado en un proceso real, sin dobles.
const startedAt = new Date().toISOString()
const backendEntry = resolve(process.env.QUALITY_BACKEND_ENTRY ?? "dist/server/server.js")
const steps: { name: string; passed: boolean; durationMs: number; error?: string }[] = []
const userId = `smoke-${randomUUID()}`
const messageId = `smoke-${randomUUID()}`
const secret = randomUUID()
let database: Client | undefined
let userDatabaseId: string | undefined
let backend: ChildProcess | undefined
let baseUrl = ""
let passed = true

async function step(name: string, action: () => Promise<void>) {
  const start = Date.now()
  try {
    await action()
    steps.push({ name, passed: true, durationMs: Date.now() - start })
    console.log(`OK: ${name}`)
  } catch (error) {
    passed = false
    // No volcar errores de conexión, variables de entorno ni salida del servidor.
    const detail = error instanceof assert.AssertionError ? error.message : "Fallo de operacion; revisar el entorno de pruebas."
    steps.push({ name, passed: false, durationMs: Date.now() - start, error: detail })
    console.error(`FALLO: ${name}. ${detail}`)
    throw error
  }
}

async function freePort() {
  const probe = createServer()
  await new Promise<void>((resolve, reject) => {
    probe.once("error", reject)
    probe.listen(0, "127.0.0.1", resolve)
  })
  const address = probe.address()
  assert(address && typeof address !== "string", "No se pudo reservar un puerto local")
  await new Promise<void>((resolve, reject) => probe.close(error => error ? reject(error) : resolve()))
  return address.port
}

async function startBackend(connectionString: string) {
  const port = await freePort()
  baseUrl = `http://127.0.0.1:${port}`
  backend = spawn(process.execPath, [backendEntry], {
    env: { ...process.env, DATABASE_URL: connectionString, WHATSAPP_WEBHOOK_SECRET: secret,
      PORT: String(port), DOTENV_CONFIG_PATH: "/dev/null" },
    stdio: ["ignore", "pipe", "ignore"],
  })
  const child = backend
  await new Promise<void>((resolve, reject) => {
    let output = ""
    const timeout = setTimeout(() => finish(new Error("Tiempo de arranque agotado")), 10_000)
    function finish(error?: Error) {
      clearTimeout(timeout)
      child.stdout!.off("data", onData)
      child.off("error", onError)
      child.off("exit", onExit)
      error ? reject(error) : resolve()
    }
    function onData(chunk: Buffer) {
      output = (output + chunk.toString()).slice(-2000)
      if (output.includes(`CapsaAI backend listening on http://localhost:${port}`)) finish()
    }
    function onError(error: Error) { finish(error) }
    function onExit() { finish(new Error("El backend termino antes de iniciar")) }
    child.stdout!.on("data", onData)
    child.once("error", onError)
    child.once("exit", onExit)
  })
  child.stdout!.resume()
}

async function request(path: string, expectedStatus: number, payload?: unknown): Promise<Record<string, any>> {
  const body = payload === undefined ? undefined : JSON.stringify(payload)
  const response = await fetch(baseUrl + path, {
    method: body === undefined ? "GET" : "POST", body, redirect: "error",
    signal: AbortSignal.timeout(5000),
    headers: body === undefined ? {} : { "content-type": "application/json",
      "x-capsa-signature": "sha256=" + createHmac("sha256", secret).update(body).digest("hex") },
  })
  assert.equal(response.status, expectedStatus, `${path}: HTTP esperado ${expectedStatus}, obtenido ${response.status}`)
  return await response.json() as Record<string, any>
}

async function main() {
  try {
    let connectionString = ""
    await step("Destino aislado y fixtures sinteticos", async () => {
      connectionString = getTestDatabaseUrl()
      database = new Client({ connectionString, connectionTimeoutMillis: 5000, query_timeout: 5000 })
      await database.connect()
      await verifyTestDatabase(database)
      const result = await database.query<{ id: string }>(
        "INSERT INTO app_users (whatsapp_user_id) VALUES ($1) RETURNING id", [userId])
      userDatabaseId = result.rows[0]!.id
      await database.query("INSERT INTO payment_methods (user_id, label, last_four) VALUES ($1, $2, $3)",
        [userDatabaseId, "Tarjeta smoke sintetica", "9999"])
    })
    await step("Arranque del backend compilado", () => startBackend(connectionString))
    await step("GET /health: backend disponible", async () => {
      assert.equal((await request("/health", 200)).status, "ok")
    })
    await step("GET /categories: acceso real a PostgreSQL", async () => {
      const body = await request("/categories", 200)
      assert(Array.isArray(body.categories) && body.categories.some((item: { code: string }) => item.code === "super"),
        "Debe estar disponible la categoria super")
    })
    await step("Alta firmada: gasto persistido", async () => {
      const body = await request("/webhooks/whatsapp/expenses/confirmed", 201, {
        userId, messageId, sourceMessageIds: [messageId],
        expense: { amount: 1500, merchant: "Comercio smoke", category: "super", card: "9999", date: "2026-01-01" },
      })
      assert.equal(body.status, "created")
      assert.equal(body.expense?.amount, 1500)
    })
    const listPath = "/expenses?" + new URLSearchParams({ userId, period: "2026-01" })
    await step("Consulta: recupera el gasto creado", async () => {
      const body = await request(listPath, 200)
      assert.equal(body.expenses?.length, 1)
      assert.equal(body.expenses[0].externalMessageId, messageId)
      assert.equal(body.expenses[0].amount, 1500)
    })
    await step("Borrado firmado y consulta vacia", async () => {
      const body = await request("/webhooks/whatsapp/expenses/deleted", 200, { userId, externalMessageId: messageId })
      assert.equal(body.status, "deleted")
      assert.deepEqual((await request(listPath, 200)).expenses, [])
      const messages = await database!.query("SELECT message_id FROM whatsapp_processed_messages WHERE message_id = $1", [messageId])
      assert.equal(messages.rowCount, 0, "El borrado debe limpiar el mensaje asociado")
    })
  } catch {
    passed = false
  } finally {
    await step("Detener proceso de backend", async () => {
      if (!backend?.pid || backend.exitCode !== null || backend.signalCode !== null) return
      backend.kill("SIGTERM")
      for (let attempt = 0; attempt < 50 && backend.exitCode === null && backend.signalCode === null; attempt++) await delay(100)
      if (backend.exitCode === null && backend.signalCode === null) {
        backend.kill("SIGKILL")
        assert.fail("El backend no termino ordenadamente en 5 segundos")
      }
      assert.equal(backend.exitCode, 0, "El backend debe finalizar sin errores")
    }).catch(() => {})
    await step("Eliminar solo el usuario sintetico de esta ejecucion", async () => {
      if (!userDatabaseId) return
      await verifyTestDatabase(database!)
      await database!.query("DELETE FROM app_users WHERE id = $1", [userDatabaseId])
      const result = await database!.query("SELECT id FROM app_users WHERE id = $1", [userDatabaseId])
      assert.equal(result.rowCount, 0)
    }).catch(() => {})
    await step("Cerrar conexion de pruebas", async () => { await database?.end() }).catch(() => {})
    const hashes: Record<string, string> = {}
    for (const path of ["tests/smoke/backend.smoke.ts", backendEntry]) {
      try { hashes[path] = createHash("sha256").update(await readFile(path)).digest("hex") } catch { passed = false }
    }
    await mkdir("reports", { recursive: true })
    await writeFile("reports/smoke-results.json", JSON.stringify({ case: "CP-021", requirement: "REQ-12",
      mode: process.env.QUALITY_BACKEND_ENTRY ? "local-deployed-backend" : "local-compiled-backend", database: "capsaai_quality_test", startedAt, finishedAt: new Date().toISOString(),
      passed, steps, hashes }, null, 2) + "\n")
    console.log(`Smoke ${passed ? "APROBADO" : "RECHAZADO"}. Reporte: reports/smoke-results.json`)
    process.exitCode = passed ? 0 : 1
  }
}

void main().catch(() => { console.error("No se pudo completar el reporte de smoke."); process.exitCode = 1 })
