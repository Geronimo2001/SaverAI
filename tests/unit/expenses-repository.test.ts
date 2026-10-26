import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ConfirmedBotExpensePayload } from "../../server/confirmed-expense-validation.js"

const fake = vi.hoisted(() => ({ query: vi.fn() }))
vi.mock("../../server/db.js", () => ({ withTransaction: (callback: (client: unknown) => unknown) => callback({ query: fake.query }) }))
import { createConfirmedWhatsappExpense } from "../../server/expenses-repository.js"

function payload(): ConfirmedBotExpensePayload {
  return { userId: "quality-user", messageId: "quality-confirm", sourceMessageIds: ["quality-source", "quality-confirm"],
    expense: { amount: 1500, merchant: "Comercio", category: "super", card: "9999", date: "2026-10-25" } }
}
const row = { id: "77", whatsapp_user_id: "quality-user", amount: 1500, currency: "ARS", merchant: "Comercio",
  category_code: "super", card_last_four: "9999", spent_at: "2026-10-25", description: null as string | null,
  external_message_id: "quality-confirm", source_message_ids: ["quality-source", "quality-confirm"] }

describe("CP-009/010/019: repositorio con doble de PostgreSQL", () => {
  let user: boolean, category: boolean, payment: boolean, duplicate: typeof row | null
  beforeEach(() => {
    user = category = payment = true
    duplicate = null
    fake.query.mockReset().mockImplementation(async (sql: string) => {
      if (sql.includes("FROM whatsapp_processed_messages")) return { rows: duplicate ? [duplicate] : [] }
      if (sql.includes("FROM app_users WHERE whatsapp_user_id")) return { rows: user ? [{ id: "1" }] : [] }
      if (sql.includes("FROM expense_categories")) return { rows: category ? [{ code: "super" }] : [] }
      if (sql.includes("SELECT id") && sql.includes("FROM payment_methods")) return { rows: payment ? [{ id: "2" }] : [] }
      if (sql.includes("INSERT INTO expenses")) return { rows: [row] }
      return { rows: [] }
    })
  })

  it("crea un gasto y registra cada mensaje de origen", async () => {
    const result = await createConfirmedWhatsappExpense(payload())

    expect(result).toMatchObject({ status: "created", action: "show_created", expense: { id: 77, userId: "quality-user", description: undefined } })
    expect(fake.query.mock.calls.filter(([sql]) => sql.includes("INSERT INTO whatsapp_processed_messages"))).toHaveLength(2)
  })
  it("devuelve el gasto original ante reintento sin insertar", async () => {
    duplicate = { ...row, description: "descripcion original" }

    const result = await createConfirmedWhatsappExpense(payload())

    expect(result).toMatchObject({ status: "duplicate", expense: { id: 77, description: "descripcion original" } })
    expect(fake.query.mock.calls.some(([sql]) => sql.includes("INSERT INTO"))).toBe(false)
  })
  it("CP-022: un mensaje de otro usuario devuelve conflicto sin revelar el gasto", async () => {
    duplicate = { ...row, whatsapp_user_id: "otro-usuario" }
    const result = await createConfirmedWhatsappExpense(payload())
    expect(result).toMatchObject({ status: "invalid", errors: [{ code: "message_conflict" }] })
    expect(result).not.toHaveProperty("expense")
    expect(fake.query.mock.calls.some(([sql]) => sql.includes("INSERT INTO"))).toBe(false)
  })
  it("acumula errores de categoria y medio de pago sin escribir", async () => {
    category = payment = false
    const result = await createConfirmedWhatsappExpense(payload())
    expect(result).toMatchObject({ status: "invalid", errors: [{ code: "unknown_category" }, { code: "unknown_payment_method" }] })
    expect(fake.query.mock.calls.some(([sql]) => sql.includes("INSERT INTO"))).toBe(false)
  })
  it("propaga fallo del proveedor sin confirmar creacion", async () => {
    fake.query.mockRejectedValue(new Error("proveedor caido"))
    await expect(createConfirmedWhatsappExpense(payload())).rejects.toThrow("proveedor caido")
  })
  it("tolera lista de origen vacia en el contrato interno", async () => {
    const input = payload()
    input.sourceMessageIds = []
    const result = await createConfirmedWhatsappExpense(input)
    expect(result.status).toBe("created")
  })
})
