import { randomUUID } from "node:crypto"
import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { Pool, type PoolClient } from "pg"
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { getTestDatabaseUrl, verifyTestDatabase } from "../../scripts/test-database-config.js"

describe("Contrato SQL con PostgreSQL aislado", () => {
  let pool: Pool
  let client: PoolClient | undefined
  let userId: string
  let paymentMethodId: string

  beforeAll(async () => {
    pool = new Pool({ connectionString: getTestDatabaseUrl(), max: 1, connectionTimeoutMillis: 5000, query_timeout: 5000 })
    await verifyTestDatabase(pool)
  })

  beforeEach(async () => {
    client = await pool.connect()
    await client.query("BEGIN")
    const user = await client.query<{ id: string }>(
      "INSERT INTO app_users (whatsapp_user_id) VALUES ($1) RETURNING id", [`quality-${randomUUID()}`],
    )
    userId = user.rows[0]!.id
    const payment = await client.query<{ id: string }>(
      "INSERT INTO payment_methods (user_id, label, last_four) VALUES ($1, $2, $3) RETURNING id",
      [userId, "Tarjeta sintetica", "9999"],
    )
    paymentMethodId = payment.rows[0]!.id
  })

  afterEach(async () => {
    if (client) {
      try { await client.query("ROLLBACK") } finally { client.release(); client = undefined }
    }
  })

  afterAll(async () => { await pool?.end() })

  function insertExpense(amount: number, category = "super", message = randomUUID()) {
    return client!.query<{ id: string; amount: number }>(`
      INSERT INTO expenses (user_id, amount, merchant, category_code, payment_method_id,
        spent_at, external_message_id, raw_payload)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
      RETURNING id, amount
    `, [userId, amount, "Comercio sintetico", category, paymentMethodId, "2026-10-25", message, "{}"])
  }

  it("CP-020: la migracion puede repetirse en la base de pruebas", async () => {
    const sql = await readFile(resolve("server/migrations/001_init.sql"), "utf8")

    await client!.query(sql)
    const result = await client!.query("SELECT code FROM expense_categories ORDER BY code")

    expect(result.rows.map((row) => row.code)).toEqual(["cafe", "comida", "compras", "servicios", "super", "transporte"])
  })

  it("CP-001: guarda y permite consultar un gasto sintetico", async () => {
    const inserted = await insertExpense(1500)

    const result = await client!.query("SELECT amount, merchant FROM expenses WHERE id = $1", [inserted.rows[0]!.id])

    expect(result.rows).toEqual([{ amount: 1500, merchant: "Comercio sintetico" }])
  })

  it("CP-003: PostgreSQL rechaza cero por CHECK", async () => {
    await expect(insertExpense(0)).rejects.toMatchObject({ code: "23514" })
  })

  it("CP-009: PostgreSQL rechaza categoria inexistente", async () => {
    await expect(insertExpense(1500, "quality-inexistente")).rejects.toMatchObject({ code: "23503" })
  })

  it("CP-010: la restriccion unica impide repetir el mensaje principal", async () => {
    const message = randomUUID()
    await insertExpense(1500, "super", message)

    await expect(insertExpense(1500, "super", message)).rejects.toMatchObject({ code: "23505" })
  })

  it("CP-013: rollback no deja el gasto insertado", async () => {
    const inserted = await insertExpense(1500)

    await client!.query("ROLLBACK")
    const result = await client!.query("SELECT id FROM expenses WHERE id = $1", [inserted.rows[0]!.id])

    expect(result.rows).toEqual([])
  })

  it("CP-016: borrar el gasto elimina sus mensajes por cascada", async () => {
    const inserted = await insertExpense(1500)
    const id = inserted.rows[0]!.id
    await client!.query("INSERT INTO whatsapp_processed_messages (message_id, user_id, expense_id) VALUES ($1, $2, $3)",
      [randomUUID(), userId, id])

    await client!.query("DELETE FROM expenses WHERE id = $1", [id])
    const result = await client!.query("SELECT message_id FROM whatsapp_processed_messages WHERE expense_id = $1", [id])

    expect(result.rows).toEqual([])
  })
})
