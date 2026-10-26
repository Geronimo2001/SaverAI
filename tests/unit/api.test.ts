import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { request, response, signature, testSecret } from "../fixtures/http.js"
import { validExpense } from "../fixtures/confirmed-expense.js"

// Las rutas de lectura/borrado se ejercitan completas contra PostgreSQL en integración.
// Aquí se comprueban las decisiones del manejador HTTP y los fallos de persistencia.
const fake = vi.hoisted(() => ({ create: vi.fn(), read: vi.fn(), undo: vi.fn() }))
vi.mock("../../server/expenses-repository.js", () => ({ createConfirmedWhatsappExpense: fake.create }))
vi.mock("../../server/read-routes.js", () => ({ handleReadRequest: fake.read }))
vi.mock("../../server/whatsapp-undo-route.js", () => ({ handleWhatsappUndo: fake.undo }))
import { handleCapsaRequest } from "../../server/app.js"

async function call(method: string, path: string, body = "", sign = signature(body)) {
  const output = response()
  await handleCapsaRequest(request(method, path, body, { "x-capsa-signature": sign }), output.reply, testSecret)
  return { ...output.state, json: output.state.body ? JSON.parse(output.state.body) : undefined }
}
const confirmed = "/webhooks/whatsapp/expenses/confirmed"

describe("Manejador HTTP: casos esenciales con dobles", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    fake.read.mockResolvedValue(false)
    fake.undo.mockResolvedValue(false)
    fake.create.mockResolvedValue({ status: "created", action: "show_created", expense: { id: 1 } })
    vi.spyOn(console, "error").mockImplementation(() => {})
  })
  afterEach(() => vi.restoreAllMocks())

  it("CP-021: health informa servidor activo sin consultar el repositorio", async () => {
    expect(await call("GET", "/health")).toMatchObject({ status: 200, json: { status: "ok" } })
    expect(fake.create).not.toHaveBeenCalled()
  })
  it("devuelve 404 para una ruta desconocida", async () => {
    expect((await call("PUT", "/missing")).status).toBe(404)
  })
  it("delega una solicitud de lectura sin continuar hacia una escritura", async () => {
    fake.read.mockResolvedValue(true)
    await call("GET", "/categories")
    expect(fake.undo).not.toHaveBeenCalled()
    expect(fake.create).not.toHaveBeenCalled()
  })
  it("delega un borrado sin continuar hacia el alta", async () => {
    fake.undo.mockResolvedValue(true)
    await call("POST", "/webhooks/whatsapp/expenses/deleted", "{}")
    expect(fake.create).not.toHaveBeenCalled()
  })
  it("CP-018: rechaza una firma inválida antes de persistir", async () => {
    expect((await call("POST", confirmed, "{}", "sha256=00")).status).toBe(401)
    expect(fake.create).not.toHaveBeenCalled()
  })
  it("rechaza JSON roto firmado", async () => {
    expect((await call("POST", confirmed, "{roto")).status).toBe(400)
  })
  it("CP-003 / DEF-001: rechaza monto que se redondea a cero antes de persistir", async () => {
    const input = validExpense()
    input.expense.amount = 0.1
    expect((await call("POST", confirmed, JSON.stringify(input))).status).toBe(422)
    expect(fake.create).not.toHaveBeenCalled()
  })
  it.each([["created", 201], ["duplicate", 200], ["invalid", 422]])("traduce %s a HTTP %i", async (status, expected) => {
    fake.create.mockResolvedValue({ status })
    expect((await call("POST", confirmed, JSON.stringify(validExpense()))).status).toBe(expected)
  })
  it("CP-019: fallo de persistencia devuelve error sin confirmar alta", async () => {
    fake.create.mockRejectedValue(new Error("base no disponible"))
    expect(await call("POST", confirmed, JSON.stringify(validExpense())))
      .toMatchObject({ status: 500, json: { status: "error" } })
  })
})
