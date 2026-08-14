import { CreateTransactionInput } from "./capsa-data"
import { createCapsaTransaction, normalizeCapsaExpenseMessage } from "./capsa-api"
import { IncomingExpenseMessage, NormalizedExpenseResult } from "./expense-normalizer"

export type WhatsappExpenseStatus =
  | "needs_input"
  | "ready_to_confirm"
  | "needs_review"
  | "created"
  | "cancelled"
  | "duplicate"

export interface WhatsappExpenseResult {
  status: WhatsappExpenseStatus
  expense: Partial<CreateTransactionInput>
  missingFields: Array<keyof CreateTransactionInput>
  confidence: number
  reviewReasons: string[]
  action: "ask_for_input" | "ask_for_confirmation" | "show_created" | "show_cancelled" | "ignore_duplicate"
  pendingId?: string
  duplicateOfMessageId?: string
}

interface PendingWhatsappExpense {
  id: string
  userId: string
  startedByMessageId: string
  expense: Partial<CreateTransactionInput>
  missingFields: Array<keyof CreateTransactionInput>
  confidence: number
  reviewReasons: string[]
  rawTexts: string[]
}

const pendingExpensesByUser = new Map<string, PendingWhatsappExpense>()
const processedMessages = new Map<string, WhatsappExpenseResult>()

export async function processIncomingWhatsappExpense(message: IncomingExpenseMessage): Promise<WhatsappExpenseResult> {
  const previousResult = processedMessages.get(message.messageId)
  if (previousResult) return buildDuplicateResult(message.messageId, previousResult)

  const pending = pendingExpensesByUser.get(message.userId)
  const result = pending
    ? await processPendingMessage(message, pending)
    : await processNewExpenseMessage(message)

  processedMessages.set(message.messageId, result)
  return result
}

export function clearWhatsappExpenseSession(userId: string) {
  pendingExpensesByUser.delete(userId)
}

async function processPendingMessage(message: IncomingExpenseMessage, pending: PendingWhatsappExpense): Promise<WhatsappExpenseResult> {
  const normalizedText = normalizeCommandText(message.rawText)
  if (isCancelCommand(normalizedText)) {
    pendingExpensesByUser.delete(message.userId)
    return {
      status: "cancelled",
      expense: pending.expense,
      missingFields: [],
      confidence: pending.confidence,
      reviewReasons: [],
      action: "show_cancelled",
      pendingId: pending.id,
    }
  }

  if (isConfirmCommand(normalizedText) && isCompleteExpense(pending.expense)) {
    await createCapsaTransaction({
      ...pending.expense,
      source: "whatsapp",
      externalMessageId: pending.startedByMessageId,
      description: pending.rawTexts.join(" / "),
    })
    pendingExpensesByUser.delete(message.userId)

    return {
      status: "created",
      expense: pending.expense,
      missingFields: [],
      confidence: pending.confidence,
      reviewReasons: [],
      action: "show_created",
      pendingId: pending.id,
    }
  }

  const nextNormalization = await normalizeCapsaExpenseMessage(message)
  const merged = mergeExpenses(pending.expense, nextNormalization.expense)
  const nextPending = buildPendingExpense(message, normalizeMergedExpense(nextNormalization, merged, pending), pending)

  pendingExpensesByUser.set(message.userId, nextPending)
  return buildPendingResult(nextPending)
}

async function processNewExpenseMessage(message: IncomingExpenseMessage): Promise<WhatsappExpenseResult> {
  const normalization = await normalizeCapsaExpenseMessage(message)
  const pending = buildPendingExpense(message, normalization)

  pendingExpensesByUser.set(message.userId, pending)
  return buildPendingResult(pending)
}

function buildPendingExpense(
  message: IncomingExpenseMessage,
  normalization: NormalizedExpenseResult,
  previous?: PendingWhatsappExpense,
): PendingWhatsappExpense {
  return {
    id: previous?.id ?? `${message.userId}:${message.messageId}`,
    userId: message.userId,
    startedByMessageId: previous?.startedByMessageId ?? message.messageId,
    expense: normalization.expense,
    missingFields: normalization.missingFields,
    confidence: normalization.confidence,
    reviewReasons: normalization.reviewReasons,
    rawTexts: [...(previous?.rawTexts ?? []), message.rawText.trim()].filter(Boolean),
  }
}

function normalizeMergedExpense(
  normalization: NormalizedExpenseResult,
  expense: Partial<CreateTransactionInput>,
  previous: PendingWhatsappExpense,
): NormalizedExpenseResult {
  const missingFields = getMissingFields(expense)
  const confidence = getMergedConfidence(previous.confidence, normalization.confidence, missingFields)
  const status = missingFields.length > 0 ? "needs_input" : confidence < 0.75 ? "needs_review" : "ready_to_confirm"
  const reviewReasons = getReviewReasons([...previous.reviewReasons, ...normalization.reviewReasons], missingFields, confidence)

  return {
    ...normalization,
    expense,
    confidence,
    missingFields,
    status,
    reviewReasons,
  }
}

function buildPendingResult(pending: PendingWhatsappExpense): WhatsappExpenseResult {
  const status = pending.missingFields.length > 0
    ? "needs_input"
    : pending.confidence < 0.75
      ? "needs_review"
      : "ready_to_confirm"

  return {
    status,
    expense: pending.expense,
    missingFields: pending.missingFields,
    confidence: pending.confidence,
    reviewReasons: pending.reviewReasons,
    action: status === "needs_input" ? "ask_for_input" : "ask_for_confirmation",
    pendingId: pending.id,
  }
}

function buildDuplicateResult(messageId: string, previousResult: WhatsappExpenseResult): WhatsappExpenseResult {
  return {
    ...previousResult,
    status: "duplicate",
    action: "ignore_duplicate",
    duplicateOfMessageId: messageId,
  }
}

function mergeExpenses(
  current: Partial<CreateTransactionInput>,
  next: Partial<CreateTransactionInput>,
): Partial<CreateTransactionInput> {
  return {
    ...current,
    amount: next.amount ?? current.amount,
    merchant: next.merchant ?? current.merchant,
    category: next.category ?? current.category,
    card: next.card ?? current.card,
    date: current.date ?? next.date,
    description: [current.description, next.description].filter(Boolean).join(" / "),
  }
}

function getMissingFields(expense: Partial<CreateTransactionInput>) {
  const missingFields: Array<keyof CreateTransactionInput> = []
  if (!expense.amount || expense.amount <= 0) missingFields.push("amount")
  if (!expense.merchant) missingFields.push("merchant")
  if (!expense.category) missingFields.push("category")
  if (!expense.card) missingFields.push("card")
  if (!expense.date) missingFields.push("date")

  return missingFields
}

function getReviewReasons(existingReasons: string[], missingFields: Array<keyof CreateTransactionInput>, confidence: number) {
  const reasons = new Set(existingReasons.filter((reason) => !reason.startsWith("missing_")))
  missingFields.forEach((field) => reasons.add(`missing_${field}`))
  if (confidence < 0.75) reasons.add("low_confidence")
  if (confidence >= 0.75) reasons.delete("low_confidence")

  return Array.from(reasons)
}

function getMergedConfidence(previousConfidence: number, nextConfidence: number, missingFields: Array<keyof CreateTransactionInput>) {
  if (missingFields.length > 0) return Math.max(previousConfidence, nextConfidence)

  return Math.max(previousConfidence, nextConfidence, 0.82)
}

function isCompleteExpense(expense: Partial<CreateTransactionInput>): expense is CreateTransactionInput {
  return getMissingFields(expense).length === 0
}

function normalizeCommandText(text: string) {
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
}

function isConfirmCommand(text: string) {
  return ["si", "ok", "dale", "confirmo", "confirmar", "correcto", "esta bien"].includes(text)
}

function isCancelCommand(text: string) {
  return ["no", "cancelar", "cancela", "cancelalo", "descartar", "borra", "borrar"].includes(text)
}
