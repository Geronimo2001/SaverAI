import {
  BudgetPlan,
  CapsaDashboardData,
  CategoryKey,
  CategoryView,
  CreateBudgetInput,
  CreateTransactionInput,
  AlertView,
  LinkedCard,
  TransactionRecord,
  buildCalendarDays,
  getCurrentMonthMeta,
  getDateFromPeriodKey,
  shiftPeriodKey,
  toLocalISODate,
} from "./capsa-data"
import { IncomingExpenseMessage, normalizeExpenseMessage } from "./expense-normalizer"
import {
  ConfirmedWhatsappExpensePayload,
  WhatsappExpenseValidationError,
  validateConfirmedWhatsappExpense,
} from "./whatsapp-confirmed-expense"

const categories: CategoryView[] = [
  { key: "super", label: "Super", icon: "shopping-bag", color: "#7dd3fc", isEssential: true },
  { key: "comida", label: "Comida", icon: "utensils", color: "#f9a8d4" },
  { key: "transporte", label: "Transporte", icon: "car", color: "#86efac", isEssential: true },
  { key: "servicios", label: "Servicios", icon: "wifi", color: "#c4b5fd", isEssential: true },
  { key: "cafe", label: "Cafe", icon: "coffee", color: "#fcd34d" },
  { key: "compras", label: "Compras", icon: "wallet-cards", color: "#fda4af" },
]

const cardTemplates: LinkedCard[] = [
  { name: "Visa Galicia", lastFour: "1042", spend: 0, limit: 520000, bestFor: "Supermercado y cuotas", nextBenefit: "20% en Coto el jueves" },
  { name: "Master Santander", lastFour: "7781", spend: 0, limit: 380000, bestFor: "Comidas y cafes", nextBenefit: "2x1 en cafeterias" },
  { name: "Mercado Pago", lastFour: "2209", spend: 0, limit: 260000, bestFor: "Compras chicas", nextBenefit: "10% en cercanos" },
]

const baseBudgets: BudgetPlan[] = [
  { id: "budget-total", name: "Presupuesto mensual", type: "monthly_total", amount: 780000, period: "Mensual", alertThreshold: 85 },
  { id: "budget-super", name: "Supermercado", type: "category", amount: 230000, period: "Mensual", category: "super", alertThreshold: 80 },
  { id: "budget-card", name: "Visa Galicia", type: "card", amount: 360000, period: "Mensual", cardLastFour: "1042", alertThreshold: 90 },
]

let budgets = [...baseBudgets]
let transactions = seedTransactions(new Date())
const createdWhatsappExpenseResults = new Map<string, CreateConfirmedWhatsappExpenseResult>()

export type CreateConfirmedWhatsappExpenseResult =
  | {
      status: "created"
      action: "show_created"
      expense: CreateTransactionInput
      sourceMessageIds: string[]
    }
  | {
      status: "invalid"
      action: "show_errors"
      errors: WhatsappExpenseValidationError[]
    }
  | {
      status: "duplicate"
      action: "ignore_duplicate"
      duplicateOfMessageId: string
      expense: CreateTransactionInput
      sourceMessageIds: string[]
    }

function getCardLabel(lastFour: string) {
  const card = cardTemplates.find((item) => item.lastFour === lastFour)
  return card ? `${card.name} ${card.lastFour}` : lastFour
}

function transaction(
  id: string,
  day: number,
  merchant: string,
  amount: number,
  category: CategoryKey,
  cardLastFour: string,
  periodKey: string,
  time = "12:30",
): TransactionRecord {
  const date = getDateFromPeriodKey(periodKey)

  return {
    id: `${periodKey}-${id}`,
    day,
    date: toLocalISODate(new Date(date.getFullYear(), date.getMonth(), day)),
    merchant,
    amount,
    category,
    card: getCardLabel(cardLastFour),
    time,
    source: "mock",
  }
}

function seedTransactions(referenceDate: Date) {
  const current = getCurrentMonthMeta(referenceDate).periodKey
  const previous = shiftPeriodKey(current, -1)

  return [
    transaction("001", 2, "Coto", 84200, "super", "1042", current, "18:10"),
    transaction("002", 3, "YPF", 41800, "transporte", "2209", current, "09:20"),
    transaction("003", 5, "Netflix", 12200, "servicios", "7781", current, "07:00"),
    transaction("004", 7, "Rappi", 28900, "comida", "7781", current, "21:35"),
    transaction("005", 9, "Cafe Martinez", 9400, "cafe", "2209", current, "10:15"),
    transaction("006", 11, "Farmacity", 36500, "compras", "1042", current, "16:40"),
    transaction("007", 13, "Carrefour", 69200, "super", "1042", current, "19:05"),
    transaction("008", 15, "Sube", 15800, "transporte", "2209", current, "08:30"),
    transaction("009", 18, "Edenor", 55400, "servicios", "1042", current, "11:00"),
    transaction("010", 20, "Mostaza", 18600, "comida", "7781", current, "13:25"),
    transaction("011", 4, "Disco", 76200, "super", "1042", previous, "17:50"),
    transaction("012", 8, "Uber", 32600, "transporte", "2209", previous, "23:10"),
    transaction("013", 12, "Personal", 28100, "servicios", "7781", previous, "07:00"),
    transaction("014", 17, "PedidosYa", 24800, "comida", "7781", previous, "22:05"),
    transaction("015", 22, "Zara", 118000, "compras", "1042", previous, "18:35"),
  ]
}

function samePeriod(transactionRecord: TransactionRecord, periodKey: string) {
  return transactionRecord.date?.startsWith(`${periodKey}-`) ?? false
}

function getPeriodTransactions(periodKey: string) {
  return transactions
    .filter((item) => samePeriod(item, periodKey))
    .sort((first, second) => second.day - first.day)
}

function sum(records: TransactionRecord[]) {
  return records.reduce((total, item) => total + item.amount, 0)
}

function buildTrend(totalSpend: number, budget: number, daysInMonth: number) {
  const today = Math.min(new Date().getDate(), daysInMonth)
  const projectedClosing = Math.max(Math.round((totalSpend / Math.max(today, 1)) * daysInMonth), totalSpend)

  return {
    trend: Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1
      const target = Math.round((budget / daysInMonth) * day)
      const projected = Math.round((projectedClosing / daysInMonth) * day)
      const actual = day <= today ? Math.round((totalSpend / Math.max(today, 1)) * day) : null

      return {
        day,
        actual,
        target,
        projected,
        lowerBound: day > today ? Math.round(projected * 0.9) : null,
        upperBound: day > today ? Math.round(projected * 1.12) : null,
        range: day > today ? [Math.round(projected * 0.9), Math.round(projected * 1.12)] as [number, number] : null,
      }
    }),
    forecast: {
      projectedClosing,
      lowerClosing: Math.round(projectedClosing * 0.9),
      upperClosing: Math.round(projectedClosing * 1.12),
      overspendProbability: projectedClosing > budget ? 74 : 28,
      recommendedDailySpend: Math.max(Math.round((budget - totalSpend) / Math.max(daysInMonth - today, 1)), 0),
      confidence: "Media" as const,
      historyMonths: 2,
      fixedCommitted: 95600,
      variableProjected: Math.max(projectedClosing - 95600, 0),
      asOfDay: today,
      method: "Proyeccion local",
    },
  }
}

function buildCategorySpend(periodTransactions: TransactionRecord[]) {
  return categories.map((category) => {
    const amount = sum(periodTransactions.filter((item) => item.category === category.key))
    const budget = budgets.find((item) => item.type === "category" && item.category === category.key)
    const pct = budget?.amount ? Math.round((amount / budget.amount) * 100) : undefined

    return {
      key: category.key,
      amount,
      delta: amount > 50000 ? "+8%" : "-4%",
      projected: Math.round(amount * 1.25),
      limit: budget?.amount,
      pct,
      isOverLimit: pct != null ? pct >= budget!.alertThreshold : false,
      limitSource: budget ? "Presupuesto" : undefined,
    }
  })
}

function buildLinkedCards(periodTransactions: TransactionRecord[]) {
  return cardTemplates.map((card) => ({
    ...card,
    spend: sum(periodTransactions.filter((item) => item.card.includes(card.lastFour))),
  }))
}

function buildAlerts(totalSpend: number, budget: number, categorySpend: ReturnType<typeof buildCategorySpend>) {
  const alerts: AlertView[] = categorySpend
    .filter((category) => category.isOverLimit)
    .map((category) => ({
      title: `${categories.find((item) => item.key === category.key)?.label ?? "Categoria"} cerca del limite`,
      detail: `Ya usaste ${category.pct}% del presupuesto configurado.`,
      severity: "Media" as const,
      time: "Hoy",
      icon: "alert-triangle",
    }))

  if (totalSpend >= budget * 0.85) {
    alerts.unshift({
      title: "Presupuesto mensual en zona de alerta",
      detail: "Conviene revisar gastos variables antes del cierre.",
      severity: "Alta" as const,
      time: "Ahora",
      icon: "gauge",
    })
  }

  alerts.push({
    title: "Promo disponible cerca",
    detail: "Hay beneficios activos para supermercado y cafe.",
    severity: "Oportunidad",
    time: "Hace 20 min",
    icon: "shopping-bag",
  })

  return alerts
}

function buildDashboard(periodKey = getCurrentMonthMeta().periodKey): CapsaDashboardData {
  const referenceDate = getDateFromPeriodKey(periodKey)
  const currentMonth = getCurrentMonthMeta(referenceDate)
  const periodTransactions = getPeriodTransactions(currentMonth.periodKey)
  const previousTransactions = getPeriodTransactions(shiftPeriodKey(currentMonth.periodKey, -1))
  const monthlyBudget = budgets.find((item) => item.type === "monthly_total")?.amount ?? 780000
  const totalSpend = sum(periodTransactions)
  const categorySpend = buildCategorySpend(periodTransactions)
  const { trend, forecast } = buildTrend(totalSpend, monthlyBudget, currentMonth.daysInMonth)

  return {
    currentMonth,
    categories,
    spendingSummary: {
      user: "Gero",
      period: currentMonth.period,
      totalSpend,
      budget: monthlyBudget,
      projectedSpend: forecast.projectedClosing,
      dailyAverage: Math.round(totalSpend / Math.max(new Date().getDate(), 1)),
      lastMonthSpend: sum(previousTransactions),
      patternMessage: forecast.projectedClosing > monthlyBudget ? "El cierre proyectado supera el presupuesto." : "El mes viene dentro del objetivo.",
    },
    categorySpend,
    linkedCards: buildLinkedCards(periodTransactions),
    subscriptions: [
      { name: "Netflix", amount: 12200, card: "Master Santander 7781", nextDate: "5 del mes", status: "Activa" },
      { name: "Personal", amount: 28100, card: "Master Santander 7781", nextDate: "12 del mes", status: "Activa" },
    ],
    transactions: periodTransactions,
    spendingTrend: trend,
    spendingForecast: forecast,
    calendarDays: buildCalendarDays(periodTransactions, referenceDate),
    budgets,
    nearbyPromos: [
      {
        place: "Coto",
        distance: "450 m",
        category: "Supermercado",
        benefit: "20% jueves",
        card: "Visa Galicia",
        reason: "Es tu categoria de mayor gasto y esa tarjeta tiene margen disponible.",
        saving: 11200,
      },
      {
        place: "Cafe Martinez",
        distance: "700 m",
        category: "Cafe",
        benefit: "2x1",
        card: "Master Santander",
        reason: "Tus consumos chicos convienen por esta tarjeta.",
        saving: 4800,
      },
    ],
    alerts: buildAlerts(totalSpend, monthlyBudget, categorySpend),
    profileSettings: {
      monthlyBudget,
      alertThreshold: 85,
      locationPromos: true,
      duplicateDetection: true,
      patternAlerts: true,
      privacyStatus: "Datos guardados localmente en este prototipo mobile.",
      privacyIcon: "shield-check",
    },
  }
}

export async function fetchCapsaDashboard(periodKey?: string) {
  return buildDashboard(periodKey)
}

export async function normalizeCapsaExpenseMessage(message: IncomingExpenseMessage) {
  return normalizeExpenseMessage(message, {
    categories,
    linkedCards: cardTemplates,
    referenceDate: message.sentAt ? new Date(message.sentAt) : new Date(),
  })
}

export async function createConfirmedWhatsappExpenseFromBot(
  payload: ConfirmedWhatsappExpensePayload,
): Promise<CreateConfirmedWhatsappExpenseResult> {
  const duplicate = findCreatedWhatsappExpense(payload)
  if (duplicate) return duplicate

  const validation = validateConfirmedWhatsappExpense(payload, {
    categories,
    linkedCards: cardTemplates,
    referenceDate: payload.confirmedAt ? new Date(payload.confirmedAt) : new Date(),
  })

  if (validation.valid === false) {
    return {
      status: "invalid",
      action: "show_errors",
      errors: validation.errors,
    }
  }

  await createCapsaTransaction(validation.transaction)
  const result: CreateConfirmedWhatsappExpenseResult = {
    status: "created",
    action: "show_created",
    expense: validation.transaction,
    sourceMessageIds: validation.sourceMessageIds,
  }

  validation.sourceMessageIds.forEach((messageId) => {
    createdWhatsappExpenseResults.set(messageId, result)
  })

  return result
}

export async function createCapsaTransaction(input: CreateTransactionInput) {
  const date = new Date(`${input.date}T12:00:00`)
  const periodKey = input.periodKey ?? getCurrentMonthMeta(date).periodKey
  const id = `manual-${Date.now()}`

  transactions = [
    {
      id,
      day: date.getDate(),
      date: input.date,
      merchant: input.merchant,
      amount: input.amount,
      category: input.category,
      card: getCardLabel(input.card),
      time: "Ahora",
      description: input.description,
      source: input.source ?? "manual",
      externalMessageId: input.externalMessageId,
    },
    ...transactions,
  ]

  return buildDashboard(periodKey)
}

export async function createCapsaBudget(input: CreateBudgetInput) {
  const nextBudget: BudgetPlan = {
    id: input.id ?? `budget-${Date.now()}`,
    name: input.name ?? "Presupuesto",
    type: input.type,
    amount: input.amount,
    period: "Mensual",
    category: input.category,
    cardLastFour: input.cardLastFour,
    alertThreshold: input.alertThreshold,
  }

  budgets = input.id
    ? budgets.map((budget) => (budget.id === input.id ? nextBudget : budget))
    : [nextBudget, ...budgets]

  return buildDashboard(input.periodKey)
}

function findCreatedWhatsappExpense(payload: ConfirmedWhatsappExpensePayload): CreateConfirmedWhatsappExpenseResult | null {
  const messageIds = [payload.messageId, ...(payload.sourceMessageIds ?? [])]
    .filter((messageId): messageId is string => typeof messageId === "string" && messageId.trim().length > 0)
    .map((messageId) => messageId.trim())

  for (const messageId of messageIds) {
    const result = createdWhatsappExpenseResults.get(messageId)
    if (result?.status === "created") {
      return {
        status: "duplicate",
        action: "ignore_duplicate",
        duplicateOfMessageId: messageId,
        expense: result.expense,
        sourceMessageIds: result.sourceMessageIds,
      }
    }
  }

  return null
}
