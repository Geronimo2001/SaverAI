import { randomUUID } from "node:crypto"
import type { Server } from "node:http"
import { Client, type Pool } from "pg"
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { getTestDatabaseUrl, verifyTestDatabase } from "../../scripts/test-database-config.js"
import { signature, testSecret } from "../fixtures/http.js"
import type { ConfirmedBotExpensePayload } from "../../server/confirmed-expense-validation.js"

describe("API HTTP y repositorio contra PostgreSQL aislado", () => {
  let pool: Pool
  let server: Server | undefined
  let baseUrl: string
  let createExpense: typeof import("../../server/expenses-repository.js").createConfirmedWhatsappExpense
  let transaction: typeof import("../../server/db.js").withTransaction
  let userA: string, userB: string
  let createdUsers: string[] = []

  beforeAll(async () => {
    const url = getTestDatabaseUrl()
    const verification = new Client({ connectionString: url, connectionTimeoutMillis: 5000 })
    try { await verification.connect(); await verifyTestDatabase(verification) } finally { await verification.end() }
    vi.stubEnv("DATABASE_URL", url)
    vi.stubEnv("WHATSAPP_WEBHOOK_SECRET", testSecret)
    pool = (await import("../../server/db.js")).pool
    transaction = (await import("../../server/db.js")).withTransaction
    createExpense = (await import("../../server/expenses-repository.js")).createConfirmedWhatsappExpense
    const { createCapsaServer } = await import("../../server/app.js")
    server = createCapsaServer(testSecret)
    await new Promise<void>((resolve, reject) => {
      server!.once("error", reject)
      server!.listen(0, "127.0.0.1", resolve)
    })
    const address = server.address()
    if (!address || typeof address === "string") throw new Error("Servidor de prueba sin puerto TCP")
    baseUrl = `http://127.0.0.1:${address.port}`
  })

  beforeEach(async () => {
    createdUsers = []
    userA = `quality-a-${randomUUID()}`
    userB = `quality-b-${randomUUID()}`
    for (const [user, lastFour] of [[userA, "9999"], [userB, "7777"]]) {
      const result = await pool.query<{ id: string }>("INSERT INTO app_users (whatsapp_user_id) VALUES ($1) RETURNING id", [user])
      const id = result.rows[0]!.id
      createdUsers.push(id)
      await pool.query("INSERT INTO payment_methods (user_id, label, last_four) VALUES ($1, $2, $3)", [id, "Tarjeta sintetica", lastFour])
    }
    await pool.query("INSERT INTO payment_methods (user_id, label, last_four, active) VALUES ($1, $2, $3, false)",
      [createdUsers[0], "Tarjeta inactiva", "8888"])
  })

  afterEach(async () => {
    // Solo IDs creados por este caso, sobre una base ya verificada. Sin limpieza global.
    if (createdUsers.length > 0) await pool.query("DELETE FROM app_users WHERE id = ANY($1::bigint[])", [createdUsers])
  })
  afterAll(async () => {
    if (server?.listening) await new Promise<void>((resolve, reject) => server!.close((error) => error ? reject(error) : resolve()))
    await pool?.end()
    vi.unstubAllEnvs()
  })

  function payload(): ConfirmedBotExpensePayload {
    const messageId = `quality-${randomUUID()}`
    return { userId: userA, messageId, sourceMessageIds: [messageId], expense: {
      amount: 1500, merchant: "Comercio sintetico", category: "super", card: "9999", date: "2026-10-20",
    } }
  }
  async function post(path: string, value: unknown, signed = true) {
    const body = JSON.stringify(value)
    const result = await fetch(baseUrl + path, { method: "POST", body,
      headers: { "content-type": "application/json", ...(signed ? { "x-capsa-signature": signature(body) } : {}) } })
    return { status: result.status, body: await result.json() as Record<string, any> }
  }
  const confirmed = "/webhooks/whatsapp/expenses/confirmed"
  const deleted = "/webhooks/whatsapp/expenses/deleted"

  it("CP-001/014/016: alta HTTP, consulta y borrado con cascada", async () => {
    const input = payload()
    const created = await post(confirmed, input)
    expect(created).toMatchObject({ status: 201, body: { status: "created", expense: { userId: userA, amount: 1500, card: "9999" } } })
    const list = await fetch(baseUrl + "/expenses?" + new URLSearchParams({ userId: userA, period: "2026-10" }))
    expect(await list.json()).toMatchObject({ expenses: [{ externalMessageId: input.messageId, amount: 1500 }] })
    expect(await post(deleted, { userId: userA, externalMessageId: input.messageId })).toMatchObject({ status: 200, body: { status: "deleted" } })
    const messages = await pool.query("SELECT message_id FROM whatsapp_processed_messages WHERE expense_id = $1", [created.body.expense.id])
    expect(messages.rows).toEqual([])
    expect((await post(deleted, { userId: userA, externalMessageId: input.messageId })).status).toBe(404)
  })

  it.each(["usuario", "categoria", "ajeno", "inactivo"])("CP-009: rechaza referencia %s sin persistir", async (reference) => {
    const input = payload()
    if (reference === "usuario") input.userId = "quality-inexistente"
    if (reference === "categoria") input.expense.category = "quality-inexistente"
    if (reference === "ajeno") input.expense.card = "7777"
    if (reference === "inactivo") input.expense.card = "8888"
    expect((await post(confirmed, input)).status).toBe(422)
    const stored = await pool.query("SELECT id FROM expenses WHERE external_message_id = $1", [input.messageId])
    expect(stored.rows).toEqual([])
  })

  it("CP-010: reintento devuelve el mismo gasto y no duplica filas", async () => {
    const input = payload()
    const first = await post(confirmed, input)
    const second = await post(confirmed, input)
    expect(second).toMatchObject({ status: 200, body: { status: "duplicate", expense: { id: first.body.expense.id } } })
    const stored = await pool.query("SELECT id FROM expenses WHERE external_message_id = $1", [input.messageId])
    expect(stored.rowCount).toBe(1)
  })

  it("CP-011: reintentos simultaneos responden creado o duplicado, nunca error", async () => {
    const input = payload()
    const results = await Promise.all(Array.from({ length: 4 }, () => post(confirmed, input)))
    expect(results.map((r) => r.status).sort()).toEqual([200, 200, 200, 201])
    expect(new Set(results.map((r) => r.body.expense?.id)).size).toBe(1)
    const stored = await pool.query("SELECT id FROM expenses WHERE external_message_id = $1", [input.messageId])
    expect(stored.rowCount).toBe(1)
  })

  it("CP-011: mensajes de origen solapados tampoco crean dos gastos", async () => {
    const first = payload(), second = payload()
    const shared = `quality-shared-${randomUUID()}`
    first.sourceMessageIds.push(shared)
    second.sourceMessageIds.push(shared)
    const results = await Promise.all([post(confirmed, first), post(confirmed, second)])
    expect(results.map((r) => r.status).sort()).toEqual([200, 201])
    const stored = await pool.query("SELECT id FROM expenses WHERE external_message_id = ANY($1::text[])", [[first.messageId, second.messageId]])
    expect(stored.rowCount).toBe(1)
  })

  it("CP-022: un mensaje ya usado por otro usuario no revela su gasto", async () => {
    const input = payload()
    expect((await post(confirmed, input)).status).toBe(201)
    input.userId = userB
    input.expense.card = "7777"
    const result = await post(confirmed, input)
    expect(result.status).toBe(422)
    expect(result.body).not.toHaveProperty("expense")
    expect(JSON.stringify(result.body)).not.toContain(userA)
  })

  it("CP-014/017: filtra usuario y periodo y no permite borrar gasto ajeno", async () => {
    const first = payload(), previous = payload(), other = payload()
    previous.expense.date = "2026-09-20"
    other.userId = userB; other.expense.card = "7777"
    await createExpense(first); await createExpense(previous); await createExpense(other)
    const result = await fetch(baseUrl + "/expenses?" + new URLSearchParams({ userId: userA, period: "2026-10" }))
    const body = await result.json() as { expenses: { externalMessageId: string }[] }
    expect(body.expenses.map((e) => e.externalMessageId)).toEqual([first.messageId])
    expect((await post(deleted, { userId: userB, externalMessageId: first.messageId })).status).toBe(404)
    expect((await pool.query("SELECT id FROM expenses WHERE external_message_id = $1", [first.messageId])).rowCount).toBe(1)
  })

  it.each(["2026-13", "2026-00", "0000-01", "texto", ""])("CP-015: periodo invalido %s devuelve 400", async (period) => {
    const result = await fetch(baseUrl + "/expenses?" + new URLSearchParams({ userId: userA, period }))
    expect(result.status).toBe(400)
  })

  it("CP-013: withTransaction revierte una escritura real ante fallo posterior", async () => {
    const message = `quality-rollback-${randomUUID()}`
    await expect(transaction(async (client) => {
      await client.query("INSERT INTO app_users (whatsapp_user_id) VALUES ($1)", [message])
      throw new Error("fallo posterior a escritura")
    })).rejects.toThrow("fallo posterior a escritura")
    expect((await pool.query("SELECT id FROM app_users WHERE whatsapp_user_id = $1", [message])).rows).toEqual([])
  })

  it("CP-019: fallo al insertar gasto no registra mensajes procesados", async () => {
    const input = payload()
    input.expense.amount = 0 // Contrato interno deliberadamente invalido para forzar CHECK de PostgreSQL.
    await expect(createExpense(input)).rejects.toMatchObject({ code: "23514" })
    expect((await pool.query("SELECT message_id FROM whatsapp_processed_messages WHERE message_id = $1", [input.messageId])).rows).toEqual([])
    expect((await pool.query("SELECT id FROM expenses WHERE external_message_id = $1", [input.messageId])).rows).toEqual([])
  })

  it.each([confirmed, deleted])("CP-018: escritura sin firma en %s no modifica datos", async (path) => {
    const input = payload()
    expect((await post(path, input, false)).status).toBe(401)
    expect((await pool.query("SELECT id FROM expenses WHERE external_message_id = $1", [input.messageId])).rows).toEqual([])
  })

  it("consulta catalogo y medios activos del usuario", async () => {
    const categories = await fetch(baseUrl + "/categories")
    expect((await categories.json() as { categories: unknown[] }).categories).toHaveLength(6)
    const cards = await fetch(baseUrl + "/payment-methods?" + new URLSearchParams({ userId: userA }))
    expect(await cards.json()).toEqual({ paymentMethods: [{ label: "Tarjeta sintetica", lastFour: "9999" }] })
  })
})
