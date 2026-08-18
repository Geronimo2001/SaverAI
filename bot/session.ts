import { CreateTransactionInput, toLocalISODate } from "../src/data/capsa-data"
import { normalizeExpenseMessage } from "../src/data/expense-normalizer"
import { AiConfig } from "./config"
import { BotContext, describeCategories } from "./context"
import { guessExpenseWithLlm } from "./extract"
import { ConfirmedExpensePayload } from "./backend"

/**
 * Conversacion del bot.
 *
 * Al usuario solo se le piden TRES datos: monto, categoria y comercio.
 *   "pague 5000 en comida en Tepanyaki"
 *
 * La tarjeta y la fecha no se preguntan:
 *  - fecha  -> el dia de hoy (o la que se mencione en el mensaje),
 *  - tarjeta-> la primera del usuario, o BOT_DEFAULT_CARD si esta seteada.
 * Se completan igual porque el backend las exige (`payment_method_id` es
 * obligatorio en la tabla `expenses`).
 *
 * Orden de resolucion de cada mensaje:
 *  1. normalizador por reglas del backend (`src/data/expense-normalizer.ts`),
 *  2. ayuda opcional de IA para los campos que quedaron vacios,
 *  3. si sigue faltando alguno de los tres, se pregunta ese campo puntual,
 *  4. completo -> se publica en el backend, que decide si lo acepta.
 *
 * El estado vive en memoria: alcanza para el prototipo, pero con varias
 * instancias del bot habria que moverlo a Redis o a una tabla.
 */

export type ExpenseField = "amount" | "merchant" | "category" | "card" | "date"

/** Lo unico que se le pregunta al usuario, en este orden. */
const ASKABLE_FIELDS: ExpenseField[] = ["amount", "category", "merchant"]

/**
 * Con `false` el gasto se publica apenas estan los tres datos.
 * Poner en `true` para volver al paso de "¿lo confirmo? SI / NO".
 */
const REQUIRE_CONFIRMATION = false

interface Session {
  expense: Partial<CreateTransactionInput>
  startedByMessageId: string
  sourceMessageIds: string[]
  rawTexts: string[]
  askingField?: ExpenseField
  awaitingConfirmation: boolean
}

export interface SessionOutcome {
  /** Texto a responder por WhatsApp (vacio si se publica el gasto). */
  reply: string
  /** Si esta presente, hay que publicarlo en el backend. */
  confirmed?: ConfirmedExpensePayload
}

const sessions = new Map<string, Session>()

export function clearSession(userId: string) {
  sessions.delete(userId)
}

// ---------- helpers de texto ----------

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
}

function normalizeCommand(value: string) {
  return normalizeText(value).replace(/[^\w\s]/g, "")
}

const CONFIRM_WORDS = ["si", "sii", "sip", "ok", "oka", "dale", "confirmo", "confirmar", "correcto", "esta bien", "listo"]
const CANCEL_WORDS = ["no", "nop", "cancelar", "cancela", "cancelalo", "descartar", "descarta", "borrar", "borra", "olvidalo"]

function isConfirm(text: string) {
  return CONFIRM_WORDS.includes(text)
}

function isCancel(text: string) {
  return CANCEL_WORDS.includes(text)
}

// ---------- parsers por campo ----------

function parseAmountAnswer(text: string): number | undefined {
  const clean = normalizeText(text)

  const withUnit = clean.match(/(\d+(?:[.,]\d+)?)\s*(lucas?|k|mil)\b/)
  if (withUnit) {
    const base = Number(withUnit[1].replace(",", "."))
    return Number.isFinite(base) ? Math.round(base * 1000) : undefined
  }

  const plain = clean.match(/\b(\d{1,3}(?:[.\s]\d{3})+|\d+(?:[.,]\d{1,2})?)\b/)
  if (!plain) return undefined

  const raw = plain[1].replace(/\s/g, "")
  const value = raw.includes(",")
    ? Number(raw.replace(/\./g, "").replace(",", "."))
    : Number(raw.replace(/\.(?=\d{3}\b)/g, ""))

  return Number.isFinite(value) && value > 0 ? Math.round(value) : undefined
}

function parseMerchantAnswer(text: string): string | undefined {
  const merchant = text.trim().replace(/\s+/g, " ")
  if (merchant.length < 2 || merchant.length > 80) return undefined
  return merchant
}

const CATEGORY_ALIASES: Record<string, string> = {
  supermercado: "super",
  almacen: "super",
  verduleria: "super",
  restaurante: "comida",
  restaurant: "comida",
  delivery: "comida",
  sushi: "comida",
  parrilla: "comida",
  nafta: "transporte",
  combustible: "transporte",
  taxi: "transporte",
  uber: "transporte",
  colectivo: "transporte",
  luz: "servicios",
  gas: "servicios",
  internet: "servicios",
  cafeteria: "cafe",
  ropa: "compras",
  farmacia: "compras",
}

function parseCategoryAnswer(text: string, context: BotContext): string | undefined {
  const clean = normalizeText(text)

  const direct = context.categories.find(
    (category) => normalizeText(category.key) === clean || normalizeText(category.label) === clean,
  )
  if (direct) return direct.key

  const contained = context.categories.find((category) => clean.includes(normalizeText(category.key)))
  if (contained) return contained.key

  for (const [alias, key] of Object.entries(CATEGORY_ALIASES)) {
    if (clean.includes(alias) && context.categories.some((category) => category.key === key)) return key
  }

  return undefined
}

function parseCardAnswer(text: string, context: BotContext): string | undefined {
  const clean = normalizeText(text)

  const byDigits = clean.match(/\b(\d{4})\b/)
  if (byDigits) {
    const card = context.linkedCards.find((item) => item.lastFour === byDigits[1])
    if (card) return card.name
  }

  const exact = context.linkedCards.find((card) => normalizeText(card.name) === clean)
  if (exact) return exact.name

  const partial = context.linkedCards.find((card) =>
    normalizeText(card.name)
      .split(" ")
      .some((word) => word.length >= 4 && clean.includes(word)),
  )
  return partial?.name
}

function applyAnswer(
  field: ExpenseField,
  text: string,
  expense: Partial<CreateTransactionInput>,
  context: BotContext,
): boolean {
  switch (field) {
    case "amount": {
      const amount = parseAmountAnswer(text)
      if (amount == null) return false
      expense.amount = amount
      return true
    }
    case "merchant": {
      const merchant = parseMerchantAnswer(text)
      if (!merchant) return false
      expense.merchant = merchant
      return true
    }
    case "category": {
      const category = parseCategoryAnswer(text, context)
      if (!category) return false
      expense.category = category
      return true
    }
    default:
      return false
  }
}

// ---------- completado automatico ----------

/** Tarjeta por defecto: BOT_DEFAULT_CARD, o la primera del usuario. */
function resolveDefaultCard(context: BotContext): string | undefined {
  const configured = process.env.BOT_DEFAULT_CARD?.trim()
  if (configured) return configured

  return context.linkedCards[0]?.name
}

function completeHiddenFields(expense: Partial<CreateTransactionInput>, context: BotContext, referenceDate: Date) {
  if (!expense.date) expense.date = toLocalISODate(referenceDate)
  if (!expense.card) expense.card = resolveDefaultCard(context)
}

// ---------- armado de mensajes ----------

function getMissingFields(expense: Partial<CreateTransactionInput>): ExpenseField[] {
  return ASKABLE_FIELDS.filter((field) => {
    if (field === "amount") return !expense.amount || expense.amount <= 0
    return !expense[field]
  })
}

function questionFor(field: ExpenseField, context: BotContext): string {
  switch (field) {
    case "amount":
      return "¿Cuánto gastaste? (solo el monto, por ejemplo 5000)"
    case "category":
      return `¿Qué categoría? Opciones: ${describeCategories(context)}`
    case "merchant":
      return "¿En qué comercio o lugar fue?"
    default:
      return "¿Me lo repetís?"
  }
}

function formatMoney(amount: number): string {
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `$${amount}`
  }
}

export function describeExpense(expense: { amount: number; merchant: string; category: string }): string {
  return `${formatMoney(expense.amount)} en ${expense.merchant} (${expense.category})`
}

function mergeExpense(
  current: Partial<CreateTransactionInput>,
  next: Partial<CreateTransactionInput>,
): Partial<CreateTransactionInput> {
  return {
    ...current,
    amount: current.amount ?? next.amount,
    merchant: current.merchant ?? next.merchant,
    category: current.category ?? next.category,
    card: current.card ?? next.card,
    date: current.date ?? next.date,
  }
}

function buildConfirmedPayload(
  session: Session,
  userId: string,
  lastMessageId: string,
): ConfirmedExpensePayload {
  const expense = session.expense

  return {
    userId,
    messageId: session.startedByMessageId,
    sourceMessageIds: Array.from(new Set([...session.sourceMessageIds, lastMessageId])),
    confirmedAt: new Date().toISOString(),
    expense: {
      amount: expense.amount!,
      merchant: expense.merchant!,
      category: expense.category!,
      card: expense.card!,
      date: expense.date!,
      description: session.rawTexts.join(" / ").slice(0, 500),
    },
  }
}

// ---------- flujo principal ----------

export interface IncomingBotMessage {
  /** Identificador del usuario en el backend: "whatsapp:+549..." */
  userId: string
  messageId: string
  text: string
  receivedAt?: Date
}

export async function handleIncomingMessage(
  message: IncomingBotMessage,
  ai: AiConfig | null,
  context: BotContext,
): Promise<SessionOutcome> {
  const referenceDate = message.receivedAt ?? new Date()
  const command = normalizeCommand(message.text)
  const existing = sessions.get(message.userId)

  if (existing && isCancel(command)) {
    sessions.delete(message.userId)
    return { reply: "Listo, lo descarté. Cuando quieras me contás otro gasto 👍" }
  }

  if (existing?.awaitingConfirmation && isConfirm(command)) {
    sessions.delete(message.userId)
    return { reply: "", confirmed: buildConfirmedPayload(existing, message.userId, message.messageId) }
  }

  const session: Session = existing ?? {
    expense: {},
    startedByMessageId: message.messageId,
    sourceMessageIds: [],
    rawTexts: [],
    awaitingConfirmation: false,
  }

  session.sourceMessageIds.push(message.messageId)
  session.rawTexts.push(message.text.trim())
  session.awaitingConfirmation = false

  let understood = true

  if (session.askingField) {
    // Respuesta a una pregunta puntual: se toma tal cual (permite comercios
    // que el normalizador por reglas no conoce).
    understood = applyAnswer(session.askingField, message.text, session.expense, context)
    session.askingField = undefined
  } else {
    const normalized = normalizeExpenseMessage(
      { userId: message.userId, messageId: message.messageId, rawText: message.text },
      { categories: context.categories, linkedCards: context.linkedCards, referenceDate },
    )
    session.expense = mergeExpense(session.expense, normalized.expense)

    if (ai && getMissingFields(session.expense).length > 0) {
      const guess = await guessExpenseWithLlm(message.text, ai, context)
      session.expense = mergeExpense(session.expense, {
        amount: guess.amount,
        merchant: guess.merchant,
        category: guess.category ? parseCategoryAnswer(guess.category, context) : undefined,
        card: guess.card ? parseCardAnswer(guess.card, context) : undefined,
        date: guess.date,
      })
    }
  }

  const missing = getMissingFields(session.expense)

  if (missing.length > 0) {
    session.askingField = missing[0]
    sessions.set(message.userId, session)

    const prefix = understood ? "" : "No te entendí. "
    return { reply: `${prefix}${questionFor(missing[0], context)}` }
  }

  // Campos que no se preguntan pero el backend necesita.
  completeHiddenFields(session.expense, context, referenceDate)

  if (!session.expense.card) {
    sessions.delete(message.userId)
    return {
      reply:
        "Tengo el gasto pero no encuentro ningún medio de pago cargado para vos. " +
        "Corré `npm run bot:vincular <tu numero>` y volvé a intentar.",
    }
  }

  if (REQUIRE_CONFIRMATION) {
    session.awaitingConfirmation = true
    sessions.set(message.userId, session)

    return {
      reply: `Anoté ${describeExpense({
        amount: session.expense.amount!,
        merchant: session.expense.merchant!,
        category: session.expense.category!,
      })}. ¿Lo confirmo? Respondé SI o NO.`,
    }
  }

  sessions.delete(message.userId)
  return { reply: "", confirmed: buildConfirmedPayload(session, message.userId, message.messageId) }
}
