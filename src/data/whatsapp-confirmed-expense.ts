import { CategoryKey, CategoryView, CreateTransactionInput, LinkedCard, toLocalISODate } from "./capsa-data"

export interface ConfirmedWhatsappExpensePayload {
  userId: string
  messageId: string
  sourceMessageIds?: string[]
  confirmedAt?: string
  expense: {
    amount: unknown
    merchant: unknown
    category: unknown
    card: unknown
    date: unknown
    description?: unknown
  }
}

export interface WhatsappExpenseValidationContext {
  categories: CategoryView[]
  linkedCards: LinkedCard[]
  referenceDate?: Date
}

export interface WhatsappExpenseValidationError {
  field: string
  code: string
  detail: string
}

export type WhatsappConfirmedExpenseValidation =
  | {
      valid: true
      transaction: CreateTransactionInput
      sourceMessageIds: string[]
    }
  | {
      valid: false
      errors: WhatsappExpenseValidationError[]
    }

const maxAmount = 100_000_000
const maxDescriptionLength = 500

export function validateConfirmedWhatsappExpense(
  payload: ConfirmedWhatsappExpensePayload,
  context: WhatsappExpenseValidationContext,
): WhatsappConfirmedExpenseValidation {
  const errors: WhatsappExpenseValidationError[] = []
  validateIdentity(payload, errors)

  const amount = parseAmount(payload.expense?.amount)
  if (amount == null) {
    errors.push(error("expense.amount", "invalid_amount", "El monto debe ser un numero positivo."))
  }

  const merchant = parseMerchant(payload.expense?.merchant)
  if (!merchant) {
    errors.push(error("expense.merchant", "invalid_merchant", "El comercio es obligatorio."))
  }

  const category = parseCategory(payload.expense?.category, context.categories)
  if (!category) {
    errors.push(error("expense.category", "invalid_category", "La categoria no existe en CapsaAI."))
  }

  const card = parseCard(payload.expense?.card, context.linkedCards)
  if (!card) {
    errors.push(error("expense.card", "invalid_card", "La tarjeta o medio de pago no existe para el usuario."))
  }

  const date = parseDate(payload.expense?.date, context.referenceDate ?? new Date())
  if (!date) {
    errors.push(error("expense.date", "invalid_date", "La fecha debe venir en formato YYYY-MM-DD y no puede ser futura."))
  }

  const description = parseDescription(payload.expense?.description)

  if (errors.length > 0) return { valid: false, errors }

  return {
    valid: true,
    sourceMessageIds: normalizeSourceMessageIds(payload),
    transaction: {
      amount: amount!,
      merchant: merchant!,
      category: category!,
      card: card!.lastFour,
      date: date!,
      description,
      source: "whatsapp",
      externalMessageId: payload.messageId,
    },
  }
}

function validateIdentity(payload: ConfirmedWhatsappExpensePayload, errors: WhatsappExpenseValidationError[]) {
  if (!isNonEmptyString(payload.userId)) {
    errors.push(error("userId", "missing_user_id", "El usuario de WhatsApp es obligatorio."))
  }
  if (!isNonEmptyString(payload.messageId)) {
    errors.push(error("messageId", "missing_message_id", "El id del mensaje confirmado es obligatorio."))
  }
}

function parseAmount(value: unknown) {
  const amount = typeof value === "number" ? value : typeof value === "string" ? Number(value.replace(",", ".")) : NaN
  if (!Number.isFinite(amount) || amount <= 0 || amount > maxAmount) return null

  return Math.round(amount)
}

function parseMerchant(value: unknown) {
  if (!isNonEmptyString(value)) return null

  const merchant = value.trim().replace(/\s+/g, " ")
  return merchant.length >= 2 && merchant.length <= 80 ? merchant : null
}

function parseCategory(value: unknown, categories: CategoryView[]): CategoryKey | null {
  if (!isNonEmptyString(value)) return null

  const normalizedCategory = normalizeText(value)
  const category = categories.find((item) => normalizeText(item.key) === normalizedCategory || normalizeText(item.label) === normalizedCategory)

  return category?.key ?? null
}

function parseCard(value: unknown, linkedCards: LinkedCard[]) {
  if (!isNonEmptyString(value)) return null

  const normalizedCard = normalizeText(value)
  return linkedCards.find((card) => {
    const normalizedName = normalizeText(card.name)
    return normalizedCard === card.lastFour || normalizedCard.includes(card.lastFour) || normalizedName.includes(normalizedCard) || normalizedCard.includes(normalizedName)
  }) ?? null
}

function parseDate(value: unknown, referenceDate: Date) {
  if (!isNonEmptyString(value) || !/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return null

  const [year, month, day] = value.trim().split("-").map(Number)
  const date = new Date(year, month - 1, day)
  const validDate = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
  if (!validDate) return null

  const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate())
  if (date > today) return null

  return toLocalISODate(date)
}

function parseDescription(value: unknown) {
  if (!isNonEmptyString(value)) return undefined

  return value.trim().slice(0, maxDescriptionLength)
}

function normalizeSourceMessageIds(payload: ConfirmedWhatsappExpensePayload) {
  return Array.from(
    new Set([...(payload.sourceMessageIds ?? []), payload.messageId].filter(isNonEmptyString).map((item) => item.trim())),
  )
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
}

function error(field: string, code: string, detail: string): WhatsappExpenseValidationError {
  return { field, code, detail }
}
