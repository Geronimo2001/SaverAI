import { beforeEach, describe, expect, it, vi } from "vitest"
import { request, response } from "../fixtures/http.js"

const fake = vi.hoisted(() => ({ query: vi.fn() }))
vi.mock("../../server/db.js", () => ({ pool: { query: fake.query } }))
import { handleReadRequest } from "../../server/read-routes.js"

describe("CP-015 / DEF-004: rechazo temprano de períodos inválidos", () => {
  beforeEach(() => vi.clearAllMocks())

  it.each(["2026-13", "2026-00", "0000-01", "texto", ""])("rechaza %s sin consultar PostgreSQL", async (period) => {
    const output = response()
    const path = "/expenses?" + new URLSearchParams({ userId: "quality-user", period })

    const handled = await handleReadRequest(request("GET", path), output.reply)

    expect(handled).toBe(true)
    expect(output.state.status).toBe(400)
    expect(JSON.parse(output.state.body)).toMatchObject({ status: "invalid_period" })
    expect(fake.query).not.toHaveBeenCalled()
  })
})
