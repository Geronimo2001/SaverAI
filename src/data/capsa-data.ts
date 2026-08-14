export type CategoryKey = string

export type BudgetType = "monthly_total" | "category" | "card" | "essential" | "discretionary"

export interface CategoryView {
  key: CategoryKey
  label: string
  icon: string
  color: string
  isEssential?: boolean
}

export interface SpendingSummary {
  user: string
  period: string
  totalSpend: number
  budget: number
  projectedSpend: number
  dailyAverage: number
  lastMonthSpend: number
  patternMessage: string
}

export interface CategorySpend {
  key: CategoryKey
  amount: number
  delta: string
  projected?: number
  limit?: number
  pct?: number
  isOverLimit?: boolean
  limitSource?: string
}

export interface LinkedCard {
  name: string
  lastFour: string
  spend: number
  limit: number
  bestFor: string
  nextBenefit: string
}

export interface SubscriptionView {
  name: string
  amount: number
  card: string
  nextDate: string
  status: string
}

export interface TransactionRecord {
  id: string
  day: number
  date?: string
  merchant: string
  amount: number
  category: CategoryKey
  card: string
  time: string
  description?: string
  source?: "manual" | "whatsapp" | "receipt" | "email" | "import" | "api" | "mock"
  externalMessageId?: string
}

export interface SpendingTrendPoint {
  day: number
  actual: number | null
  target: number
  projected: number
  lowerBound: number | null
  upperBound: number | null
  range: [number, number] | null
}

export interface SpendingForecastSummary {
  projectedClosing: number
  lowerClosing: number
  upperClosing: number
  overspendProbability: number
  recommendedDailySpend: number
  confidence: "Alta" | "Media" | "Baja"
  historyMonths: number
  fixedCommitted: number
  variableProjected: number
  asOfDay: number
  method: string
}

export interface CalendarDay {
  date: number
  amount: number
  transactions: {
    name: string
    amount: number
    category: CategoryKey
    card: string
  }[]
}

export interface BudgetPlan {
  id: string
  name: string
  type: BudgetType
  amount: number
  period: string
  category?: CategoryKey
  cardLastFour?: string
  alertThreshold: number
}

export interface NearbyPromo {
  place: string
  distance: string
  category: string
  benefit: string
  card: string
  reason: string
  saving: number
}

export interface AlertView {
  title: string
  detail: string
  severity: "Alta" | "Media" | "Oportunidad"
  time: string
  icon: string
}

export interface ProfileSettings {
  monthlyBudget: number
  alertThreshold: number
  locationPromos: boolean
  duplicateDetection: boolean
  patternAlerts: boolean
  privacyStatus: string
  privacyIcon: string
}

export interface CurrentMonthMeta {
  month: string
  monthIndex: number
  shortName: string
  year: number
  daysInMonth: number
  period: string
  periodKey: string
}

export interface CapsaDashboardData {
  currentMonth: CurrentMonthMeta
  monthlyPrediction?: unknown
  categories: CategoryView[]
  spendingSummary: SpendingSummary
  categorySpend: CategorySpend[]
  linkedCards: LinkedCard[]
  subscriptions: SubscriptionView[]
  transactions: TransactionRecord[]
  spendingTrend: SpendingTrendPoint[]
  spendingForecast: SpendingForecastSummary
  calendarDays: CalendarDay[]
  budgets: BudgetPlan[]
  nearbyPromos: NearbyPromo[]
  alerts: AlertView[]
  profileSettings: ProfileSettings
}

export interface CreateTransactionInput {
  amount: number
  merchant: string
  category: CategoryKey
  card: string
  date: string
  description?: string
  periodKey?: string
  source?: TransactionRecord["source"]
  externalMessageId?: string
}

export interface CreateBudgetInput {
  id?: string
  name?: string
  type: BudgetType
  amount: number
  category?: CategoryKey
  cardLastFour?: string
  alertThreshold: number
  periodKey?: string
}

export const monthNames = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const

export const budgetTypes: { type: BudgetType; label: string; detail: string }[] = [
  { type: "monthly_total", label: "General mensual", detail: "Tope total de gasto del mes." },
  { type: "category", label: "Por categoria", detail: "Limite para supermercado, comida, transporte u otra categoria." },
  { type: "card", label: "Por tarjeta", detail: "Control de gasto por medio de pago." },
  { type: "essential", label: "Esenciales", detail: "Servicios, salud, transporte y gastos necesarios." },
  { type: "discretionary", label: "Variables", detail: "Comida afuera, cafe, compras y gastos reducibles." },
]

export function getCurrentMonthMeta(referenceDate = new Date()): CurrentMonthMeta {
  const year = referenceDate.getFullYear()
  const monthIndex = referenceDate.getMonth()
  const month = monthNames[monthIndex]

  return {
    month,
    monthIndex,
    shortName: month.slice(0, 3),
    year,
    daysInMonth: new Date(year, monthIndex + 1, 0).getDate(),
    period: `${month} ${year}`,
    periodKey: `${year}-${String(monthIndex + 1).padStart(2, "0")}`,
  }
}

export function getDateFromPeriodKey(periodKey?: string | null) {
  const match = periodKey?.match(/^(\d{4})-(\d{2})$/)
  if (!match) return new Date()

  const year = Number(match[1])
  const monthIndex = Number(match[2]) - 1
  if (!Number.isInteger(year) || monthIndex < 0 || monthIndex > 11) return new Date()

  return new Date(year, monthIndex, 1)
}

export function getMonthMetaFromPeriodKey(periodKey?: string | null) {
  return getCurrentMonthMeta(getDateFromPeriodKey(periodKey))
}

export function shiftPeriodKey(periodKey: string, offset: number) {
  const date = getDateFromPeriodKey(periodKey)
  return getCurrentMonthMeta(new Date(date.getFullYear(), date.getMonth() + offset, 1)).periodKey
}

export function isFuturePeriodKey(periodKey: string, referenceDate = new Date()) {
  const periodDate = getDateFromPeriodKey(periodKey)
  const currentMonthStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1)
  return periodDate > currentMonthStart
}

export function toLocalISODate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

export function buildCalendarDays(sourceTransactions: TransactionRecord[], referenceDate = new Date()) {
  const { year, monthIndex, daysInMonth } = getCurrentMonthMeta(referenceDate)

  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1
    const dayTransactions = sourceTransactions.filter((transaction) => {
      if (!transaction.date) return transaction.day === day

      const [dateYear, dateMonth, dateDay] = transaction.date.split("-").map(Number)
      return dateYear === year && dateMonth === monthIndex + 1 && dateDay === day
    })
    const amount = dayTransactions.reduce((total, transaction) => total + transaction.amount, 0)

    return {
      date: day,
      amount,
      transactions: dayTransactions.map((transaction) => ({
        name: transaction.merchant,
        amount: transaction.amount,
        category: transaction.category,
        card: transaction.card,
      })),
    }
  })
}

export function getCategory(categories: CategoryView[], key: string) {
  return (
    categories.find((category) => category.key === key) ??
    categories[0] ?? {
      key: "sin-categoria",
      label: "Sin categoria",
      icon: "wallet",
      color: "#7dd3fc",
    }
  )
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatCompact(amount: number) {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`
  if (amount >= 1000) return `$${Math.round(amount / 1000)}k`
  return `$${amount}`
}
