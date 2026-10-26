import { describe, expect, it } from "vitest"
import { validateConfirmedBotExpensePayload } from "../../server/confirmed-expense-validation.js"
import { referenceDate, validExpense } from "../fixtures/confirmed-expense.js"

describe("Validación de gastos confirmados", () => {
  it("CP-001: acepta un gasto completo e incorpora el mensaje principal", () => {
    // Arrange
    const input = validExpense()
    // Act
    const result = validateConfirmedBotExpensePayload(input, referenceDate)
    // Assert
    expect(result).toMatchObject({ valid: true, payload: {
      expense: { amount: 1500, date: "2026-10-25" },
      sourceMessageIds: ["quality-source", "quality-message"],
    } })
  })

  it.each([0, -1, "no-numero", null, undefined, Infinity, NaN, {}, ""])(
    "CP-002: rechaza monto inválido %j", (amount) => {
      const input = validExpense()
      input.expense.amount = amount

      const result = validateConfirmedBotExpensePayload(input, referenceDate)

      expect(result).toMatchObject({ valid: false, errors: [
        { field: "expense.amount", code: "invalid_amount" },
      ] })
    },
  )

  it.each([0.1, 0.49, "0,1"])("CP-003 / DEF-001: rechaza %j porque se redondea a cero", (amount) => {
    const input = validExpense()
    input.expense.amount = amount

    const result = validateConfirmedBotExpensePayload(input, referenceDate)

    expect(result).toMatchObject({ valid: false, errors: [
      { field: "expense.amount", code: "invalid_amount" },
    ] })
  })

  it.each([1, 100_000_000])("CP-004: acepta límite válido %j", (amount) => {
    const input = validExpense()
    input.expense.amount = amount

    const result = validateConfirmedBotExpensePayload(input, referenceDate)

    expect(result).toMatchObject({ valid: true, payload: { expense: { amount } } })
  })

  it("CP-004: rechaza monto superior al máximo", () => {
    const input = validExpense()
    input.expense.amount = 100_000_001

    const result = validateConfirmedBotExpensePayload(input, referenceDate)

    expect(result).toMatchObject({ valid: false, errors: [{ field: "expense.amount" }] })
  })

  it.each([[0.5, 1], [1.5, 2], ["1500,75", 1501]])(
    "CP-001: conserva redondeo existente de %j a %j", (amount, expected) => {
      const input = validExpense()
      input.expense.amount = amount

      const result = validateConfirmedBotExpensePayload(input, referenceDate)

      expect(result).toMatchObject({ valid: true, payload: { expense: { amount: expected } } })
    },
  )

  it.each([null, [], "texto", {}])("CP-005: rechaza cuerpo incompleto %j sin lanzar excepción", (body) => {
    const result = validateConfirmedBotExpensePayload(body, referenceDate)

    expect(result.valid).toBe(false)
  })

  it("CP-005: rechaza identificadores vacíos y referencias ausentes", () => {
    const input = { ...validExpense(), userId: " ", messageId: "", expense: {
      ...validExpense().expense, category: " ", card: "",
    } }

    const result = validateConfirmedBotExpensePayload(input, referenceDate)

    expect(result).toMatchObject({ valid: false, errors: expect.arrayContaining([
      expect.objectContaining({ field: "userId", code: "required" }),
      expect.objectContaining({ field: "messageId", code: "required" }),
      expect.objectContaining({ field: "expense.category", code: "required" }),
      expect.objectContaining({ field: "expense.card", code: "required" }),
    ]) })
  })

  it.each([[1, false], [2, true], [80, true], [81, false]])(
    "CP-006: comercio de %i caracteres, válido=%s", (length, valid) => {
      const input = validExpense()
      input.expense.merchant = "a".repeat(length)

      const result = validateConfirmedBotExpensePayload(input, referenceDate)

      expect(result.valid).toBe(valid)
    },
  )

  it("CP-006: normaliza espacios y quita espacios externos", () => {
    const input = { ...validExpense(), userId: " quality-user ", expense: {
      ...validExpense().expense, merchant: "  Comercio   prueba  ",
    } }

    const result = validateConfirmedBotExpensePayload(input, referenceDate)

    expect(result).toMatchObject({ valid: true, payload: {
      userId: "quality-user", expense: { merchant: "Comercio prueba" },
    } })
  })

  it.each([
    ["2026-10-25", true], ["2026-10-24", true], ["2026-10-26", false],
    ["2024-02-29", true], ["2025-02-29", false], ["2026-13-01", false],
    ["2026-04-31", false], ["25/10/2026", false], ["", false],
  ])("CP-007/008: fecha %s, válida=%s", (date, valid) => {
    const input = validExpense()
    input.expense.date = date

    const result = validateConfirmedBotExpensePayload(input, referenceDate)

    expect(result.valid).toBe(valid)
  })

  it("CP-010: normaliza mensajes repetidos, vacíos y no textuales", () => {
    const input = { ...validExpense(), sourceMessageIds: [" quality-message ", "", null, 12, "quality-message"] }

    const result = validateConfirmedBotExpensePayload(input, referenceDate)

    expect(result).toMatchObject({ valid: true, payload: { sourceMessageIds: ["quality-message"] } })
  })

  it("CP-010: usa el mensaje principal si no hay lista de origen", () => {
    const { sourceMessageIds: _, ...input } = validExpense()

    const result = validateConfirmedBotExpensePayload(input, referenceDate)

    expect(result).toMatchObject({ valid: true, payload: { sourceMessageIds: ["quality-message"] } })
  })

  it.each(["fecha-invalida", 123])("CP-005: rechaza confirmedAt inválido %j", (confirmedAt) => {
    const input = { ...validExpense(), confirmedAt }

    const result = validateConfirmedBotExpensePayload(input, referenceDate)

    expect(result).toMatchObject({ valid: false, errors: [{ field: "confirmedAt" }] })
  })
})
