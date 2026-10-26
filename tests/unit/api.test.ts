import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { request, response, signature, testSecret } from "../fixtures/http.js"
import { validExpense } from "../fixtures/confirmed-expense.js"

const fake = vi.hoisted(() => ({ query: vi.fn(), create: vi.fn() }))
vi.mock("../../server/db.js", () => ({ pool: { query: fake.query } }))
vi.mock("../../server/expenses-repository.js", () => ({ createConfirmedWhatsappExpense: fake.create }))
import { handleCapsaRequest } from "../../server/app.js"

async function call(method: string, path: string, body = "", sign: string | undefined = signature(body)) {
  const output = response()
  await handleCapsaRequest(request(method, path, body, sign ? { "x-capsa-signature": sign } : {}), output.reply, testSecret)
  return { ...output.state, json: output.state.body ? JSON.parse(output.state.body) : undefined }
}
const confirmed = "/webhooks/whatsapp/expenses/confirmed"
const deleted = "/webhooks/whatsapp/expenses/deleted"

describe("API con dobles del repositorio y PostgreSQL", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    fake.query.mockResolvedValue({ rows: [] })
    fake.create.mockResolvedValue({ status: "created", action: "show_created", expense: { id: 1 } })
    vi.spyOn(console, "error").mockImplementation(() => {})
  })
  afterEach(() => vi.restoreAllMocks())

  it("CP-021: health informa servidor activo sin consultar la base", async () => {
    const result = await call("GET", "/health")
    expect(result).toMatchObject({ status: 200, json: { status: "ok" } })
    expect(fake.query).not.toHaveBeenCalled()
  })
  it("devuelve 404 para ruta desconocida", async () => {
    expect((await call("PUT", "/missing")).status).toBe(404)
  })
  it("devuelve 404 para GET desconocido", async () => {
    expect((await call("GET", "/missing")).status).toBe(404)
  })
  it("atiende preflight CORS", async () => {
    expect(await call("OPTIONS", "/expenses")).toMatchObject({ status: 204, headers: { "access-control-allow-origin": "*" } })
  })
  it.each([confirmed, deleted])("CP-018: rechaza firma invalida en %s sin acceder a datos", async (path) => {
    const result = await call("POST", path, "{}", "sha256=00")
    expect(result.status).toBe(401)
    expect(fake.query).not.toHaveBeenCalled()
    expect(fake.create).not.toHaveBeenCalled()
  })
  it("CP-018: rechaza firma ausente", async () => {
    const output = response()
    await handleCapsaRequest(request("POST", confirmed, "{}"), output.reply, testSecret)
    expect(output.state.status).toBe(401)
  })
  it("rechaza JSON roto firmado", async () => {
    expect((await call("POST", confirmed, "{roto")).status).toBe(400)
  })
  it("CP-003: rechaza monto que se redondea a cero sin invocar repositorio", async () => {
    const input = validExpense(); input.expense.amount = 0.1
    const result = await call("POST", confirmed, JSON.stringify(input))
    expect(result.status).toBe(422)
    expect(fake.create).not.toHaveBeenCalled()
  })
  it.each([["created", 201], ["duplicate", 200], ["invalid", 422]])("traduce resultado %s a HTTP %i", async (status, expected) => {
    fake.create.mockResolvedValue({ status })
    expect((await call("POST", confirmed, JSON.stringify(validExpense()))).status).toBe(expected)
  })
  it("CP-019: fallo de persistencia devuelve error sin confirmar alta", async () => {
    fake.create.mockRejectedValue(new Error("base no disponible"))
    expect(await call("POST", confirmed, JSON.stringify(validExpense()))).toMatchObject({ status: 500, json: { status: "error" } })
  })
  it.each(["/expenses", "/payment-methods"])("CP-015: exige userId en %s", async (path) => {
    expect((await call("GET", path)).status).toBe(400)
    expect(fake.query).not.toHaveBeenCalled()
  })
  it("CP-014: transforma filas de gastos y mantiene parametros separados del SQL", async () => {
    fake.query.mockResolvedValue({ rows: [{ id: "9", amount: 1500, merchant: "Comercio", category_code: "super",
      card_label: "Tarjeta", last_four: "9999", spent_at: "2026-10-25", description: null,
      source: "whatsapp", external_message_id: "m1", created_at: "2026-10-25" }] })
    const userId = "quality-' OR 1=1 --"
    const result = await call("GET", "/expenses?" + new URLSearchParams({ userId, period: "2026-10" }))
    expect(result).toMatchObject({ status: 200, json: { expenses: [{ id: "9", cardLastFour: "9999", amount: 1500 }] } })
    expect(fake.query.mock.calls[0]![1]).toEqual([userId, "2026-10-01"])
    expect(fake.query.mock.calls[0]![0]).not.toContain(userId)
  })
  it("CP-014: admite consulta sin periodo y sin gastos", async () => {
    expect(await call("GET", "/expenses?userId=quality")).toMatchObject({ status: 200, json: { expenses: [] } })
  })
  it.each(["2026-13", "0000-01", "texto", ""])("CP-015: periodo invalido %s no llega a la base", async (period) => {
    expect((await call("GET", "/expenses?" + new URLSearchParams({ userId: "quality", period }))).status).toBe(400)
    expect(fake.query).not.toHaveBeenCalled()
  })
  it("consulta categorias", async () => {
    fake.query.mockResolvedValue({ rows: [{ code: "super", label: "Super" }] })
    expect((await call("GET", "/categories")).json).toEqual({ categories: [{ code: "super", label: "Super" }] })
  })
  it("consulta medios de pago", async () => {
    fake.query.mockResolvedValue({ rows: [{ label: "Tarjeta", last_four: "9999" }] })
    expect((await call("GET", "/payment-methods?userId=quality")).json).toEqual({ paymentMethods: [{ label: "Tarjeta", lastFour: "9999" }] })
  })
  it.each(["{}", "null", "{", '{"userId":12,"externalMessageId":false}'])("CP-017: rechaza borrado con cuerpo invalido %s", async (body) => {
    expect((await call("POST", deleted, body)).status).toBe(400)
    expect(fake.query).not.toHaveBeenCalled()
  })
  it("CP-017: borrado inexistente devuelve 404", async () => {
    expect((await call("POST", deleted, JSON.stringify({ userId: "quality", externalMessageId: "unknown" }))).status).toBe(404)
  })
  it("CP-016: borrado valido devuelve el gasto eliminado", async () => {
    fake.query.mockResolvedValue({ rows: [{ id: "9", amount: 1500, merchant: "Comercio", category_code: "super", external_message_id: "m1" }] })
    expect(await call("POST", deleted, JSON.stringify({ userId: "quality", externalMessageId: "m1" })))
      .toMatchObject({ status: 200, json: { status: "deleted", expense: { id: 9, category: "super" } } })
  })
})
