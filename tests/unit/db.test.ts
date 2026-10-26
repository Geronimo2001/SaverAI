import { beforeEach, describe, expect, it, vi } from "vitest"

const fake = vi.hoisted(() => ({ query: vi.fn(), release: vi.fn(), connect: vi.fn() }))
vi.mock("../../server/config.js", () => ({ getConfig: () => ({ databaseUrl: "unused-test-url" }) }))
vi.mock("pg", () => ({ Pool: class { connect = fake.connect } }))
import { withTransaction } from "../../server/db.js"

describe("CP-012/013/019: contrato de transacciones con dobles", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    fake.connect.mockResolvedValue({ query: fake.query, release: fake.release })
    fake.query.mockResolvedValue({ rows: [] })
  })

  it("confirma las operaciones y libera el cliente", async () => {
    const result = await withTransaction(async (client) => {
      await client.query("operacion-de-prueba")
      return 42
    })

    expect(result).toBe(42)
    expect(fake.query.mock.calls.map(([sql]) => sql)).toEqual(["BEGIN", "operacion-de-prueba", "COMMIT"])
    expect(fake.release).toHaveBeenCalledOnce()
  })

  it("revierte ante fallo y propaga el error original", async () => {
    const error = new Error("falla sintetica de escritura")

    await expect(withTransaction(async () => { throw error })).rejects.toBe(error)

    expect(fake.query.mock.calls.map(([sql]) => sql)).toEqual(["BEGIN", "ROLLBACK"])
    expect(fake.release).toHaveBeenCalledOnce()
  })

  it("no confirma si falla COMMIT y libera el cliente", async () => {
    const error = new Error("falla sintetica de commit")
    fake.query.mockImplementation(async (sql) => { if (sql === "COMMIT") throw error; return { rows: [] } })

    await expect(withTransaction(async () => "result")).rejects.toBe(error)

    expect(fake.query.mock.calls.map(([sql]) => sql)).toEqual(["BEGIN", "COMMIT", "ROLLBACK"])
    expect(fake.release).toHaveBeenCalledOnce()
  })

  it("un fallo de conexion no ejecuta el callback ni intenta liberar un cliente inexistente", async () => {
    fake.connect.mockRejectedValue(new Error("base no disponible"))
    const callback = vi.fn()

    await expect(withTransaction(callback)).rejects.toThrow("base no disponible")

    expect(callback).not.toHaveBeenCalled()
    expect(fake.release).not.toHaveBeenCalled()
  })

  it("libera el cliente aunque tambien falle ROLLBACK", async () => {
    fake.query.mockImplementation(async (sql) => { if (sql === "ROLLBACK") throw new Error("rollback fallido") })

    await expect(withTransaction(async () => { throw new Error("escritura fallida") })).rejects.toThrow()

    expect(fake.release).toHaveBeenCalledOnce()
  })
})
