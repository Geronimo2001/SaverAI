import { describe, expect, it } from "vitest"
import { assertTestDatabaseUrl } from "../../scripts/test-database-config.js"

describe("Proteccion del entorno de pruebas", () => {
  it("acepta la base local exclusiva de pruebas", () => {
    expect(assertTestDatabaseUrl("postgresql://localhost:5432/capsaai_quality_test"))
      .toBe("postgresql://localhost:5432/capsaai_quality_test")
  })

  it.each([
    undefined, "no-url", "postgresql:///capsaai_quality_test",
    "postgresql://localhost:5432/capsaai", "postgresql://localhost:5432/postgres",
    "postgresql://remote.example/capsaai_quality_test", "https://localhost/capsaai_quality_test",
    "postgresql://localhost/capsaai_quality_test?dbname=capsaai",
    "postgresql://localhost/capsaai_quality_test?host=remote.example",
    "postgresql://localhost/capsaai_quality_test#otra-base",
  ])("rechaza destino inseguro %j antes de conectar", (url) => {
    expect(() => assertTestDatabaseUrl(url)).toThrow()
  })
})
