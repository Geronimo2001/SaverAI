import assert from "node:assert/strict"
import { spawn, execFileSync, type ChildProcess } from "node:child_process"
import { createHash, randomUUID } from "node:crypto"
import { mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { createServer } from "node:net"
import { arch, cpus, platform, release } from "node:os"
import { resolve } from "node:path"
import { setTimeout as delay } from "node:timers/promises"
import { Client } from "pg"
import { getTestDatabaseUrl, verifyTestDatabase } from "../../scripts/test-database-config.js"

const backendEntry = resolve(process.env.QUALITY_BACKEND_ENTRY ?? "dist/server/server.js")
const requested = process.argv[2]
const profiles = requested === "all" ? ["load", "stress", "soak"] : requested === "ci" ? ["load", "stress"] : [requested]
assert(profiles.every(p => ["poc", "probe", "load", "stress", "soak"].includes(p)), "Perfil de carga invalido")
const runId = "load-" + randomUUID()
const users = Array.from({ length: 20 }, (_, i) => runId + "-" + (i + 1))
const secret = randomUUID()
const reportDirectory = resolve("reports/performance")
const report = { startedAt: new Date().toISOString(), finishedAt: "", passed: false, cleanupPassed: false,
  environment: { node: process.version, os: platform(), release: release(), arch: arch(), cpus: cpus().length,
    cpu: cpus()[0]?.model, database: "capsaai_quality_test", postgres: "", k6: "", gitCommit: "",
    sourceHashes: {} as Record<string, string> },
  profiles: [] as Record<string, any>[], error: undefined as string | undefined }
let database: Client | undefined
let verified = false
let backend: ChildProcess | undefined
let generator: ChildProcess | undefined
let baseUrl = ""
let interrupted = false
const onInterrupt = () => { interrupted = true; generator?.kill("SIGTERM"); backend?.kill("SIGTERM") }
process.once("SIGINT", onInterrupt)
process.once("SIGTERM", onInterrupt)

async function stop(child: ChildProcess | undefined) {
  if (!child?.pid || child.exitCode !== null || child.signalCode !== null) return
  child.kill("SIGTERM")
  for (let n = 0; n < 50 && child.exitCode === null && child.signalCode === null; n++) await delay(100)
  if (child.exitCode === null && child.signalCode === null) {
    child.kill("SIGKILL")
    throw new Error("Proceso no termino ordenadamente")
  }
}
async function startBackend(connectionString: string) {
  const probe = createServer()
  await new Promise<void>((done, fail) => { probe.once("error", fail); probe.listen(0, "127.0.0.1", done) })
  const address = probe.address()
  assert(address && typeof address !== "string")
  const port = address.port
  await new Promise<void>((done, fail) => probe.close(e => e ? fail(e) : done()))
  baseUrl = "http://127.0.0.1:" + port
  backend = spawn(process.execPath, [backendEntry], {
    env: { ...process.env, DATABASE_URL: connectionString, WHATSAPP_WEBHOOK_SECRET: secret,
      PORT: String(port), DOTENV_CONFIG_PATH: "/dev/null" }, stdio: ["ignore", "pipe", "ignore"],
  })
  const child = backend
  await new Promise<void>((done, fail) => {
    let output = ""
    const timeout = setTimeout(() => finish(new Error("Timeout al iniciar backend")), 10000)
    function finish(error?: Error) {
      clearTimeout(timeout); child.stdout!.off("data", onData); child.off("error", onError); child.off("exit", onExit)
      error ? fail(error) : done()
    }
    function onData(data: Buffer) {
      output = (output + data.toString()).slice(-2000)
      if (output.includes("CapsaAI backend listening on http://localhost:" + port)) finish()
    }
    function onError(error: Error) { finish(error) }
    function onExit() { finish(new Error("Backend termino durante arranque")) }
    child.stdout!.on("data", onData); child.once("error", onError); child.once("exit", onExit)
  })
  child.stdout!.resume()
}
async function runK6(binary: string, profile: string) {
  const original = resolve(reportDirectory, profile + "-k6.json")
  await rm(original, { force: true })
  const args = ["run", "--no-usage-report", "tests/load/" + (profile === "probe" ? "poc" : profile) + ".js"]
  let log = ""
  const code = await new Promise<number>((done, fail) => {
    generator = spawn(binary, args, { env: { PATH: process.env.PATH, K6_NO_USAGE_REPORT: "true",
      LOAD_BASE_URL: baseUrl, LOAD_USERS: JSON.stringify(users), LOAD_PROFILE: profile,
      LOAD_RUN_ID: runId, LOAD_SECRET: secret, LOAD_REPORT: original,
      LOAD_PROBE_FAILURE: profile === "probe" ? "1" : "0" },
      stdio: ["ignore", "pipe", "pipe"] })
    const child = generator
    const timeout = setTimeout(() => child.kill("SIGTERM"), profile === "soak" ? 160000 : 90000)
    child.stdout!.on("data", chunk => { log += chunk.toString() })
    child.stderr!.on("data", chunk => { log += chunk.toString() })
    child.once("error", error => { clearTimeout(timeout); fail(error) })
    child.once("exit", exit => { clearTimeout(timeout); done(exit ?? 1) })
  })
  await writeFile(resolve(reportDirectory, profile + "-console.log"), log)
  const raw = JSON.parse(await readFile(original, "utf8"))
  // La forma concreta del resumen se verifica en la PoC antes de adoptar.
  const metrics = raw.metrics
  const values = (name: string) => metrics?.[name]?.values ?? metrics?.[name]
  const duration = values("http_req_duration")
  const result = { profile, exitCode: code, passed: code === 0, requests: values("http_reqs")?.count,
    requestsPerSecond: values("http_reqs")?.rate, httpFailureRate: values("http_req_failed")?.rate,
    checksRate: values("checks")?.rate, attemptedCycles: values("attempted_cycles")?.count,
    completedCycles: values("completed_cycles")?.count, iterations: values("iterations")?.count,
    p95Ms: duration?.["p(95)"], p99Ms: duration?.["p(99)"], averageMs: duration?.avg,
    maxVUs: values("vus")?.max, originalReport: "reports/performance/" + profile + "-k6.json" }
  report.profiles.push(result)
  await writeFile(resolve(reportDirectory, profile + "-summary.json"), JSON.stringify(result, null, 2) + "\n")
  console.log(JSON.stringify(result))
  return result
}
async function assertNoResidue() {
  const result = await database!.query<{ expenses: string; messages: string }>(
    "SELECT (SELECT count(*) FROM expenses e JOIN app_users u ON u.id=e.user_id WHERE u.whatsapp_user_id=ANY($1::text[])) AS expenses, " +
    "(SELECT count(*) FROM whatsapp_processed_messages m JOIN app_users u ON u.id=m.user_id WHERE u.whatsapp_user_id=ANY($1::text[])) AS messages", [users])
  assert.equal(Number(result.rows[0]!.expenses), 0, "Quedaron gastos sinteticos sin borrar")
  assert.equal(Number(result.rows[0]!.messages), 0, "Quedaron mensajes sinteticos sin borrar")
}
async function main() {
  await mkdir(reportDirectory, { recursive: true })
  try {
    const url = getTestDatabaseUrl()
    database = new Client({ connectionString: url, connectionTimeoutMillis: 5000, query_timeout: 10000 })
    await database.connect(); await verifyTestDatabase(database); verified = true
    report.environment.postgres = (await database.query("SHOW server_version")).rows[0].server_version
    const installed = JSON.parse(await readFile(".tools/k6-2.3.0/verified.json", "utf8"))
    const folder = installed.filename.replace(/\.(zip|tar\.gz)$/, "")
    const binary = resolve(".tools/k6-2.3.0", folder, "k6")
    report.environment.k6 = execFileSync(binary, ["version"], { encoding: "utf8" }).trim()
    assert(report.environment.k6.startsWith("k6 v2.3.0"), "Version de k6 inesperada")
    report.environment.gitCommit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim()
    for (const file of ["tests/load/workflow.js", "tests/load/run.ts", ...profiles.map(p => "tests/load/" + (p === "probe" ? "poc" : p) + ".js"), backendEntry]) {
      report.environment.sourceHashes[file] = createHash("sha256").update(await readFile(file)).digest("hex")
    }
    for (const user of users) {
      const result = await database.query<{ id: string }>("INSERT INTO app_users (whatsapp_user_id) VALUES ($1) RETURNING id", [user])
      await database.query("INSERT INTO payment_methods (user_id,label,last_four) VALUES ($1,$2,$3)", [result.rows[0]!.id, "Tarjeta carga sintetica", "9999"])
    }
    await startBackend(url)
    const health = await fetch(baseUrl + "/health", { signal: AbortSignal.timeout(5000) })
    assert.equal(health.status, 200)
    for (const profile of profiles) {
      if (interrupted) throw new Error("Ejecucion interrumpida")
      console.log("Ejecutando perfil " + profile)
      const result = await runK6(binary, profile)
      assert(result.requests > 0 && Number.isFinite(result.p95Ms), "Resumen de k6 incompatible o sin muestras")
      assert(result.attemptedCycles > 0 && result.completedCycles === result.attemptedCycles, "Recorridos incompletos")
      assert.equal(result.checksRate, 1, "Hay comprobaciones funcionales fallidas")
      assert.equal(result.httpFailureRate, 0, "Hay solicitudes fallidas")
      if (profile === "probe") assert(result.exitCode !== 0, "k6 debe rechazar el umbral imposible de la PoC")
      else assert.equal(result.exitCode, 0, "k6 rechazo los umbrales")
      await assertNoResidue()
      const recovery = await fetch(baseUrl + "/categories", { signal: AbortSignal.timeout(5000) })
      assert.equal(recovery.status, 200, "Backend no recupero disponibilidad")
    }
    report.passed = true
  } catch (error) {
    report.error = error instanceof assert.AssertionError ? error.message : "Fallo de entorno o ejecucion; revisar reports/performance/*-console.log"
  } finally {
    const stops = await Promise.allSettled([stop(generator), stop(backend)])
    if (stops.some(r => r.status === "rejected")) { report.passed = false; report.error = "Fallo al detener procesos de carga" }
    try {
      if (verified) {
        await verifyTestDatabase(database!)
        await database!.query("DELETE FROM app_users WHERE whatsapp_user_id=ANY($1::text[])", [users])
        const left = await database!.query("SELECT id FROM app_users WHERE whatsapp_user_id=ANY($1::text[])", [users])
        assert.equal(left.rowCount, 0)
      }
      report.cleanupPassed = true
    } catch { report.passed = false; report.error = "Fallo de limpieza de datos sinteticos" }
    try { await database?.end() } catch { report.passed = false; report.cleanupPassed = false }
    if (interrupted) report.passed = false
    report.finishedAt = new Date().toISOString()
    const label = requested === "all" || requested === "ci" ? requested : profiles[0]
    await writeFile(resolve(reportDirectory, label + "-run.json"), JSON.stringify(report, null, 2) + "\n")
    console.log("Carga " + (report.passed ? "APROBADA" : "RECHAZADA") + "; limpieza: " + report.cleanupPassed)
    if (report.error) console.error(report.error)
    process.exitCode = report.passed ? 0 : 1
    process.off("SIGINT", onInterrupt); process.off("SIGTERM", onInterrupt)
  }
}
void main().catch(() => { console.error("No se pudo generar reporte de carga"); process.exitCode = 1 })
