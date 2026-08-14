export interface ConfirmedBotExpensePayload {
  userId: string
  messageId: string
  sourceMessageIds: string[]
  confirmedAt?: string
  expense: {
    amount: number
    merchant: string
    category: string
    card: string
    date: string
    description?: string
  }
}

export interface ValidationError {
  field: string
  code: string
  detail: string
}

export type PayloadValidationResult =
  | { valid: true; payload: ConfirmedBotExpensePayload }
  | { valid: false; errors: ValidationError[] }

const maxAmount = 100_000_000
const maxDescriptionLength = 500

export function validateConfirmedBotExpensePayload(body: unknown, referenceDate = new Date()): PayloadValidationResult {
  const errors: ValidationError[] = []
  const input = isRecord(body) ? body : {}
  const expenseInput = isRecord(input.expense) ? input.expense : {}

  const userId = parseRequiredString(input.userId, "userId", errors)
  const messageId = parseRequiredString(input.messageId, "messageId", errors)
  const amount = parseAmount(expenseInput.amount, errors)
  const merchant = parseMerchant(expenseInput.merchant, errors)
  const category = parseRequiredString(expenseInput.category, "expense.category", errors)
  const card = parseRequiredString(expenseInput.card, "expense.card", errors)
  const date = parseDate(expenseInput.date, referenceDate, errors)
  const description = parseDescription(expenseInput.description, errors)
  const sourceMessageIds = parseSourceMessageIds(input.sourceMessageIds, messageId)
  const confirmedAt = parseOptionalIsoDate(input.confirmedAt, "confirmedAt", errors)

  if (errors.length > 0) return { valid: false, errors }

  return {
    valid: true,
    payload: {
      userId: userId!,
      messageId: messageId!,
      sourceMessageIds,
      confirmedAt,
      expense: {
        amount: amount!,
        merchant: merchant!,
        category: category!,
        card: card!,
        date: date!,
        description,
      },
    },
  }
}

function parseRequiredString(value: unknown, field: string, errors: ValidationError[]) {
  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push(error(field, "required", "Campo obligatorio."))
    return null
  }

  return value.trim()
}

function parseAmount(value: unknown, errors: ValidationError[]) {
  const amount = typeof value === "number" ? value : typeof value === "string" ? Number(value.replace(",", ".")) : NaN
  if (!Number.isFinite(amount) || amount <= 0 || amount > maxAmount) {
    errors.push(error("expense.amount", "invalid_amount", "El monto debe ser un numero positivo razonable."))
    return null
  }

  return Math.round(amount)
}

function parseMerchant(value: unknown, errors: ValidationError[]) {
  const merchant = parseRequiredString(value, "expense.merchant", errors)
  if (!merchant) return null
  if (merchant.length < 2 || merchant.length > 80) {
    errors.push(error("expense.merchant", "invalid_length", "El comercio debe tener entre 2 y 80 caracteres."))
    return null
  }

  return merchant.replace(/\s+/g, " ")
}

function parseDate(value: unknown, referenceDate: Date, errors: ValidationError[]) {
  const text = parseRequiredString(value, "expense.date", errors)
  if (!text) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    errors.push(error("expense.date", "invalid_format", "La fecha debe venir como YYYY-MM-DD."))
    return null
  }

  const [year, month, day] = text.split("-").map(Number)
  const date = new Date(year, month - 1, day)
  const isRealDate = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
  const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate())

  if (!isRealDate || date > today) {
    errors.push(error("expense.date", "invalid_date", "La fecha no existe o es futura."))
    return null
  }

  return text
}

function parseDescription(value: unknown, errors: ValidationError[]) {
  if (value == null || value === "") return undefined
  if (typeof value !== "string") {
    errors.push(error("expense.description", "invalid_type", "La descripcion debe ser texto."))
    return undefined
  }

  return value.trim().slice(0, maxDescriptionLength) || undefined
}

function parseSourceMessageIds(value: unknown, messageId: string | null) {
  const items = Array.isArray(value) ? value : []
  const ids = items.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
  if (messageId) ids.push(messageId)

  return Array.from(new Set(ids.map((item) => item.trim())))
}

function parseOptionalIsoDate(value: unknown, field: string, errors: ValidationError[]) {
  if (value == null || value === "") return undefined
  if (typeof value !== "string" || Number.isNaN(new Date(value).getTime())) {
    errors.push(error(field, "invalid_datetime", "Debe ser una fecha ISO valida."))
    return undefined
  }

  return value
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function error(field: string, code: string, detail: string): ValidationError {
  return { field, code, detail }
}
