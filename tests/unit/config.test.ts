import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getConfig } from "../../server/config.js"

describe("Configuracion del backend", () => {
  beforeEach(() => {
    vi.stubEnv("DATABASE_URL", "postgresql://localhost/test-unused")
    vi.stubEnv("WHATSAPP_WEBHOOK_SECRET", "quality-test-secret")
    vi.stubEnv("PORT", undefined)
  })
  afterEach(() => vi.unstubAllEnvs())

  it("usa el puerto predeterminado con configuracion valida", () => {
    expect(getConfig()).toEqual({ databaseUrl: "postgresql://localhost/test-unused", webhookSecret: "quality-test-secret", port: 4010 })
  })
  it("lee un puerto explicito", () => {
    vi.stubEnv("PORT", "5010")
    expect(getConfig().port).toBe(5010)
  })
  it.each(["DATABASE_URL", "WHATSAPP_WEBHOOK_SECRET"])("rechaza variable obligatoria ausente %s", (name) => {
    vi.stubEnv(name, undefined)
    expect(() => getConfig()).toThrow("Missing " + name)
  })
  it.each(["0", "-1", "1.5", "abc"])("rechaza puerto invalido %s", (value) => {
    vi.stubEnv("PORT", value)
    expect(() => getConfig()).toThrow("PORT must be a positive integer")
  })
})
