import { describe, expect, it } from "vitest"
import { addedLines, lcovLines, meetsMinimum } from "../../scripts/quality-metrics.js"

describe("Contrato del quality gate", () => {
  it("distingue lineas agregadas/modificadas de contexto y borrados", () => {
    const diff = "@@ -2,2 +2,3 @@\n@@ -8 +9 @@\n@@ -12,2 +13,0 @@\n"
    expect([...addedLines(diff)]).toEqual([2, 3, 4, 9])
  })
  it("rechaza 79 % de codigo nuevo aunque la cobertura global sea alta", () => {
    expect(meetsMinimum(79, 100, 80)).toBe(false)
    expect(meetsMinimum(80, 100, 80)).toBe(true)
    expect(meetsMinimum(49, 100, 50)).toBe(false)
    expect(meetsMinimum(50, 100, 50)).toBe(true)
  })
  it("no redondea un porcentaje inferior para aprobar", () => {
    expect(meetsMinimum(7999, 10000, 80)).toBe(false)
  })
  it("lee lineas ejecutables cubiertas y no cubiertas de LCOV", () => {
    const coverage = lcovLines("SF:server/a.ts\nDA:3,1\nDA:7,0\nend_of_record\n")
    expect([...coverage.get("server/a.ts")!]).toEqual([[3, 1], [7, 0]])
  })
  it("falla sin fuentes de cobertura o con fuentes duplicadas", () => {
    expect(() => lcovLines("")).toThrow()
    expect(() => lcovLines("SF:a.ts\nSF:a.ts")).toThrow()
  })
})
