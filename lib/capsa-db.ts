import { prisma } from "@/lib/prisma"
import {
  AlertView,
  BudgetPlan,
  BudgetType,
  CapsaDashboardData,
  CategoryView,
  CreateBudgetInput,
  CreateTransactionInput,
  LinkedCard,
  NearbyPromo,
  SpendingForecastSummary,
  SpendingTrendPoint,
  TransactionRecord,
  buildCalendarDays,
  getCurrentMonthMeta,
  getDateFromPeriodKey,
  getPreviousMonthMeta,
  toLocalISODate,
} from "@/lib/capsa-data"
import { predecir, PredictorMovement, PredictorResult } from "@/lib/monthly-predictor"

const DEFAULT_USER_EMAIL = process.env.CAPSA_DEFAULT_USER_EMAIL ?? "geronimo@example.com"
const FIXED_PREDICTOR_CATEGORY = "__fijos__"

function centsToAmount(cents: bigint | number | null | undefined) {
  if (cents == null) return 0
  return Number(cents) / 100
}

function amountToCents(amount: number) {
  return BigInt(Math.round(amount * 100))
}

function formatDayMonth(date: Date) {
  return `${date.getDate()} ${getCurrentMonthMeta(date).shortName}`
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
}

function average(values: number[]) {
  if (values.length === 0) return 0
  return values.reduce((total, value) => total + value, 0) / values.length
}

function standardDeviation(values: number[]) {
  if (values.length < 2) return 0
  const mean = average(values)
  const variance = average(values.map((value) => (value - mean) ** 2))
  return Math.sqrt(variance)
}

function median(values: number[]) {
  if (values.length === 0) return 0
  const sorted = [...values].sort((first, second) => first - second)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle]
}

function daysInMonthForPeriodKey(periodKey: string) {
  const [year, month] = periodKey.split("-").map(Number)
  return new Date(year, month, 0).getDate()
}

type ForecastTransaction = {
  amountCents: bigint | number
  occurredAt: Date
  merchantId?: string | null
  category?: { key: string } | null
}

type ForecastSubscription = {
  amountCents: bigint | number
  frequency: string
  nextExpectedAt: Date
  merchantId: string
  merchant?: { name: string } | null
}

type ForecastBudget = {
  budgetType: string
  limitCents: bigint | number
  category?: { key: string } | null
}

function getFixedMerchantIds(
  currentTransactions: ForecastTransaction[],
  historicalTransactions: ForecastTransaction[],
  subscriptions: ForecastSubscription[],
) {
  const fixedMerchantIds = new Set(subscriptions.map((subscription) => subscription.merchantId))
  const serviceMerchantMonths = new Map<string, Set<string>>()

  for (const transaction of [...historicalTransactions, ...currentTransactions]) {
    if (!transaction.merchantId || transaction.category?.key !== "servicios") continue

    const months = serviceMerchantMonths.get(transaction.merchantId) ?? new Set<string>()
    months.add(getCurrentMonthMeta(transaction.occurredAt).periodKey)
    serviceMerchantMonths.set(transaction.merchantId, months)
  }

  for (const [merchantId, months] of serviceMerchantMonths) {
    if (months.size >= 2) fixedMerchantIds.add(merchantId)
  }

  return fixedMerchantIds
}

function buildFixedSpendingConfig({
  currentMonth,
  currentTransactions,
  historicalTransactions,
  subscriptions,
  fixedMerchantIds,
}: {
  currentMonth: ReturnType<typeof getCurrentMonthMeta>
  currentTransactions: ForecastTransaction[]
  historicalTransactions: ForecastTransaction[]
  subscriptions: ForecastSubscription[]
  fixedMerchantIds: Set<string>
}) {
  const fixedSpending = new Map<string, number>()
  const explicitSubscriptionMerchantIds = new Set(subscriptions.map((subscription) => subscription.merchantId))

  for (const subscription of subscriptions) {
    const schedule = getSubscriptionDayWeights(subscription, currentMonth)
    const monthlyAmount = schedule.reduce((total, amount) => total + amount, 0)
    const key = subscription.merchant?.name ?? subscription.merchantId
    fixedSpending.set(key, (fixedSpending.get(key) ?? 0) + monthlyAmount)
  }

  for (const merchantId of fixedMerchantIds) {
    if (explicitSubscriptionMerchantIds.has(merchantId)) continue

    const currentFixedTransactions = currentTransactions.filter((transaction) => transaction.merchantId === merchantId)
    if (currentFixedTransactions.length > 0) {
      fixedSpending.set(
        merchantId,
        currentFixedTransactions.reduce((total, transaction) => total + centsToAmount(transaction.amountCents), 0),
      )
      continue
    }

    const merchantHistory = historicalTransactions.filter((transaction) => transaction.merchantId === merchantId)
    const inferredAmount = Math.round(average(merchantHistory.map((transaction) => centsToAmount(transaction.amountCents))))
    if (inferredAmount > 0) fixedSpending.set(merchantId, inferredAmount)
  }

  return Object.fromEntries(fixedSpending)
}

function buildPredictorMovements(transactions: ForecastTransaction[], fixedMerchantIds: Set<string>): PredictorMovement[] {
  return transactions.map((transaction) => ({
    fecha: toLocalISODate(transaction.occurredAt),
    monto: centsToAmount(transaction.amountCents),
    categoria: transaction.merchantId && fixedMerchantIds.has(transaction.merchantId)
      ? FIXED_PREDICTOR_CATEGORY
      : transaction.category?.key ?? "sin-categoria",
  }))
}

function buildCategoryBudgetConfig(budgets: ForecastBudget[]) {
  return Object.fromEntries(
    budgets
      .filter((budget) => budget.budgetType === "CATEGORY" && budget.category?.key)
      .map((budget) => [budget.category?.key as string, centsToAmount(budget.limitCents)]),
  )
}

function buildPredictionCutoffDate(currentMonth: ReturnType<typeof getCurrentMonthMeta>, referenceDate: Date) {
  const monthStart = new Date(currentMonth.year, currentMonth.monthIndex, 1)
  const monthEnd = new Date(currentMonth.year, currentMonth.monthIndex + 1, 1)
  const today = new Date()
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)

  if (today >= monthStart && today < monthEnd) {
    return new Date(currentMonth.year, currentMonth.monthIndex, today.getDate())
  }

  if (monthStart < currentMonthStart) {
    return new Date(currentMonth.year, currentMonth.monthIndex, Math.min(today.getDate(), currentMonth.daysInMonth))
  }

  const referenceInMonth = referenceDate >= monthStart && referenceDate < monthEnd
  if (referenceInMonth && referenceDate.getDate() > 1) {
    return new Date(currentMonth.year, currentMonth.monthIndex, referenceDate.getDate())
  }

  return new Date(currentMonth.year, currentMonth.monthIndex, 1)
}

function isHistoricalMonth(currentMonth: ReturnType<typeof getCurrentMonthMeta>) {
  const today = new Date()
  const selectedMonthStart = new Date(currentMonth.year, currentMonth.monthIndex, 1)
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)

  return selectedMonthStart < currentMonthStart
}

function isOnOrBeforeCutoff(transaction: ForecastTransaction, cutoffDate: Date) {
  return (
    transaction.occurredAt.getFullYear() === cutoffDate.getFullYear() &&
    transaction.occurredAt.getMonth() === cutoffDate.getMonth() &&
    transaction.occurredAt.getDate() <= cutoffDate.getDate()
  )
}

function getHistoryMonthCount(transactions: ForecastTransaction[]) {
  return new Set(transactions.map((transaction) => getCurrentMonthMeta(transaction.occurredAt).periodKey)).size
}

function buildTrendFromPrediction({
  actualThroughDay,
  currentMonth,
  currentTransactions,
  fixedMerchantIds,
  monthlyBudget,
  prediction,
}: {
  actualThroughDay: number
  currentMonth: ReturnType<typeof getCurrentMonthMeta>
  currentTransactions: ForecastTransaction[]
  fixedMerchantIds: Set<string>
  monthlyBudget: number
  prediction: PredictorResult
}): SpendingTrendPoint[] {
  const asOfDay = clamp(prediction.corte.dia, 1, currentMonth.daysInMonth)
  const dailyTotals = Array.from({ length: currentMonth.daysInMonth + 1 }, () => 0)
  dailyTotals[1] += prediction.resumen.fijos

  for (const transaction of currentTransactions) {
    if (transaction.merchantId && fixedMerchantIds.has(transaction.merchantId)) continue

    const day = clamp(transaction.occurredAt.getDate(), 1, currentMonth.daysInMonth)
    dailyTotals[day] += centsToAmount(transaction.amountCents)
  }

  const cumulative = Array.from({ length: currentMonth.daysInMonth + 1 }, () => 0)
  for (let day = 1; day <= currentMonth.daysInMonth; day += 1) {
    cumulative[day] = cumulative[day - 1] + dailyTotals[day]
  }

  const actualAtCutoff = cumulative[asOfDay]
  const projectedClosing = Math.max(prediction.resumen.total_proyectado, actualAtCutoff)
  const targetClosing = monthlyBudget > 0 ? monthlyBudget : projectedClosing
  const uncertainty = clamp((1 - prediction.corte.peso_datos) * 0.22 + 0.12, 0.12, 0.34)
  const lowerClosing = Math.max(actualAtCutoff, projectedClosing * (1 - uncertainty))
  const upperClosing = Math.max(projectedClosing * (1 + uncertainty), lowerClosing + 1)
  const remainingDays = Math.max(currentMonth.daysInMonth - asOfDay, 1)

  return Array.from({ length: currentMonth.daysInMonth }, (_, index) => {
    const day = index + 1
    const hasActual = day <= actualThroughDay
    const isPredictionKnown = day <= asOfDay
    const futureShare = isPredictionKnown ? 0 : (day - asOfDay) / remainingDays
    const projected = isPredictionKnown ? cumulative[day] : actualAtCutoff + (projectedClosing - actualAtCutoff) * futureShare
    const lowerBound = isPredictionKnown ? null : actualAtCutoff + (lowerClosing - actualAtCutoff) * futureShare
    const upperBound = isPredictionKnown ? null : actualAtCutoff + (upperClosing - actualAtCutoff) * futureShare

    return {
      day,
      actual: hasActual ? Math.round(cumulative[day]) : null,
      target: Math.round(targetClosing * (day / currentMonth.daysInMonth)),
      projected: Math.round(projected),
      lowerBound: lowerBound == null ? null : Math.round(lowerBound),
      upperBound: upperBound == null ? null : Math.round(upperBound),
      range: lowerBound == null || upperBound == null ? null : [Math.round(lowerBound), Math.round(upperBound)],
    }
  })
}

function buildForecastFromPrediction(
  prediction: PredictorResult,
  monthlyBudget: number,
  historyMonths: number,
): SpendingForecastSummary {
  const projectedClosing = Math.round(prediction.resumen.total_proyectado)
  const uncertainty = clamp((1 - prediction.corte.peso_datos) * 0.22 + (historyMonths >= 2 ? 0.1 : 0.18), 0.1, 0.42)
  const lowerClosing = Math.round(Math.max(prediction.resumen.total_gastado, projectedClosing * (1 - uncertainty)))
  const upperClosing = Math.round(Math.max(projectedClosing * (1 + uncertainty), lowerClosing + 1))
  const daysRemaining = Math.max(prediction.corte.dias_mes - prediction.corte.dia, 1)
  const recommendedDailySpend = monthlyBudget > 0
    ? Math.max(Math.round((monthlyBudget - prediction.resumen.total_gastado) / daysRemaining), 0)
    : 0
  const overspendProbability =
    monthlyBudget <= 0
      ? 0
      : lowerClosing >= monthlyBudget
        ? 95
        : upperClosing <= monthlyBudget
          ? 8
          : Math.round(((upperClosing - monthlyBudget) / Math.max(upperClosing - lowerClosing, 1)) * 100)

  return {
    projectedClosing,
    lowerClosing,
    upperClosing,
    overspendProbability,
    recommendedDailySpend,
    confidence: historyMonths >= 4 ? "Alta" : historyMonths >= 2 ? "Media" : "Baja",
    historyMonths,
    fixedCommitted: Math.round(prediction.resumen.fijos),
    variableProjected: Math.round(prediction.resumen.variable_proyectado),
    asOfDay: prediction.corte.dia,
    method: "Predictor Tesis Saver IA: ritmo diario + picos + prior historico",
  }
}

function buildPredictionModel({
  activeBudgets,
  currentMonth,
  currentTransactions,
  historicalTransactions,
  monthlyBudget,
  referenceDate,
  subscriptions,
  totalSpend,
}: {
  activeBudgets: ForecastBudget[]
  currentMonth: ReturnType<typeof getCurrentMonthMeta>
  currentTransactions: ForecastTransaction[]
  historicalTransactions: ForecastTransaction[]
  monthlyBudget: number
  referenceDate: Date
  subscriptions: ForecastSubscription[]
  totalSpend: number
}) {
  const fixedMerchantIds = getFixedMerchantIds(currentTransactions, historicalTransactions, subscriptions)
  const fixedSpending = buildFixedSpendingConfig({
    currentMonth,
    currentTransactions,
    historicalTransactions,
    subscriptions,
    fixedMerchantIds,
  })
  const cutoffDate = buildPredictionCutoffDate(currentMonth, referenceDate)
  const currentTransactionsForPrediction = currentTransactions.filter((transaction) => isOnOrBeforeCutoff(transaction, cutoffDate))
  const movements = buildPredictorMovements([...historicalTransactions, ...currentTransactionsForPrediction], fixedMerchantIds)
  const fixedTotal = Object.values(fixedSpending).reduce((total, amount) => total + amount, 0)
  const actualVariableSpend = currentTransactions
    .filter((transaction) => !(transaction.merchantId && fixedMerchantIds.has(transaction.merchantId)))
    .reduce((total, transaction) => total + centsToAmount(transaction.amountCents), 0)
  const actualTotalSpend = Math.round(fixedTotal + actualVariableSpend)
  const projectedBaseline = Math.max(
    totalSpend,
    fixedTotal,
    1,
  )
  const prediction = predecir(
    movements,
    {
      ingreso_mensual: monthlyBudget > 0 ? monthlyBudget : projectedBaseline,
      gastos_fijos: fixedSpending,
      presupuesto_categoria: buildCategoryBudgetConfig(activeBudgets),
      categorias_fijas: [FIXED_PREDICTOR_CATEGORY],
      spike_percentil: 90,
    },
    cutoffDate,
  )
  const historyMonths = getHistoryMonthCount(historicalTransactions)

  return {
    actualTotalSpend,
    fixedMerchantIds,
    prediction,
    trend: buildTrendFromPrediction({
      actualThroughDay: isHistoricalMonth(currentMonth) ? currentMonth.daysInMonth : prediction.corte.dia,
      currentMonth,
      currentTransactions,
      fixedMerchantIds,
      monthlyBudget,
      prediction,
    }),
    forecast: buildForecastFromPrediction(prediction, monthlyBudget, historyMonths),
    patternMessage: prediction.resumen.mensaje,
  }
}

function getSubscriptionDayWeights(
  subscription: { frequency: string; nextExpectedAt: Date; amountCents: bigint | number },
  currentMonth: { year: number; monthIndex: number; daysInMonth: number },
) {
  const schedule = Array.from({ length: currentMonth.daysInMonth + 1 }, () => 0)
  const amount = centsToAmount(subscription.amountCents)
  const anchor = subscription.nextExpectedAt

  if (subscription.frequency === "WEEKLY") {
    for (let day = 1; day <= currentMonth.daysInMonth; day += 1) {
      const candidate = new Date(currentMonth.year, currentMonth.monthIndex, day)
      if (candidate.getDay() === anchor.getDay()) schedule[day] += amount
    }
    return schedule
  }

  if (subscription.frequency === "YEARLY" && anchor.getMonth() !== currentMonth.monthIndex) {
    return schedule
  }

  const day = Math.min(anchor.getDate(), currentMonth.daysInMonth)
  schedule[day] += amount
  return schedule
}

function buildForecastModel({
  currentMonth,
  currentTransactions,
  historicalTransactions,
  subscriptions,
  monthlyBudget,
  totalSpend,
  elapsedDays,
}: {
  currentMonth: ReturnType<typeof getCurrentMonthMeta>
  currentTransactions: {
    amountCents: bigint | number
    occurredAt: Date
    merchantId?: string | null
    category?: { key: string } | null
  }[]
  historicalTransactions: {
    amountCents: bigint | number
    occurredAt: Date
    merchantId?: string | null
    category?: { key: string } | null
  }[]
  subscriptions: {
    amountCents: bigint | number
    frequency: string
    nextExpectedAt: Date
    merchantId: string
  }[]
  monthlyBudget: number
  totalSpend: number
  elapsedDays: number
}): { trend: SpendingTrendPoint[]; forecast: SpendingForecastSummary; patternMessage: string } {
  const asOfDay = clamp(elapsedDays, 1, currentMonth.daysInMonth)
  const fixedMerchantIds = new Set(subscriptions.map((subscription) => subscription.merchantId))
  const serviceMerchantMonths = new Map<string, Set<string>>()
  for (const transaction of [...historicalTransactions, ...currentTransactions]) {
    if (!transaction.merchantId || transaction.category?.key !== "servicios") continue

    const months = serviceMerchantMonths.get(transaction.merchantId) ?? new Set<string>()
    months.add(getCurrentMonthMeta(transaction.occurredAt).periodKey)
    serviceMerchantMonths.set(transaction.merchantId, months)
  }
  for (const [merchantId, months] of serviceMerchantMonths) {
    if (months.size >= 2) fixedMerchantIds.add(merchantId)
  }
  const isFixedTransaction = (transaction: { merchantId?: string | null }) =>
    Boolean(transaction.merchantId && fixedMerchantIds.has(transaction.merchantId))
  const currentDailyTotals = Array.from({ length: currentMonth.daysInMonth + 1 }, () => 0)
  const currentVariableDailyTotals = Array.from({ length: currentMonth.daysInMonth + 1 }, () => 0)
  for (const transaction of currentTransactions) {
    const day = clamp(transaction.occurredAt.getDate(), 1, currentMonth.daysInMonth)
    const amount = centsToAmount(transaction.amountCents)
    currentDailyTotals[day] += amount
    if (!isFixedTransaction(transaction)) {
      currentVariableDailyTotals[day] += amount
    }
  }

  const currentCumulative = Array.from({ length: currentMonth.daysInMonth + 1 }, () => 0)
  const currentVariableCumulative = Array.from({ length: currentMonth.daysInMonth + 1 }, () => 0)
  for (let day = 1; day <= currentMonth.daysInMonth; day += 1) {
    currentCumulative[day] = currentCumulative[day - 1] + currentDailyTotals[day]
    currentVariableCumulative[day] = currentVariableCumulative[day - 1] + currentVariableDailyTotals[day]
  }

  const monthlyBuckets = new Map<string, number[]>()
  for (const transaction of historicalTransactions) {
    if (isFixedTransaction(transaction)) continue

    const meta = getCurrentMonthMeta(transaction.occurredAt)
    const dailyTotals = monthlyBuckets.get(meta.periodKey) ?? Array.from({ length: meta.daysInMonth + 1 }, () => 0)
    dailyTotals[transaction.occurredAt.getDate()] += centsToAmount(transaction.amountCents)
    monthlyBuckets.set(meta.periodKey, dailyTotals)
  }

  const historicalProfiles = Array.from(monthlyBuckets)
    .map(([periodKey, dailyTotals]) => {
      const daysInMonth = daysInMonthForPeriodKey(periodKey)
      const total = dailyTotals.reduce((sum, value) => sum + value, 0)
      const cumulative = Array.from({ length: daysInMonth + 1 }, () => 0)
      for (let day = 1; day <= daysInMonth; day += 1) {
        cumulative[day] = cumulative[day - 1] + (dailyTotals[day] ?? 0)
      }
      return { periodKey, daysInMonth, total, cumulative }
    })
    .filter((profile) => profile.total > 0)

  const historyMonths = historicalProfiles.length
  const historicalVariableTotals = historicalProfiles.map((profile) => profile.total)
  const averageHistoricalVariableTotal = average(historicalVariableTotals)
  const cumulativePace = Array.from({ length: currentMonth.daysInMonth + 1 }, (_, day) => {
    if (day === 0) return 0
    if (historyMonths === 0) return day / currentMonth.daysInMonth

    const ratios = historicalProfiles.map((profile) => {
      const mappedDay = clamp(Math.ceil((day / currentMonth.daysInMonth) * profile.daysInMonth), 1, profile.daysInMonth)
      return profile.cumulative[mappedDay] / profile.total
    })
    return clamp(average(ratios), day === currentMonth.daysInMonth ? 1 : 0.01, 1)
  })

  for (let day = 1; day <= currentMonth.daysInMonth; day += 1) {
    cumulativePace[day] = Math.max(cumulativePace[day], cumulativePace[day - 1])
  }
  cumulativePace[currentMonth.daysInMonth] = 1

  const fixedDailyTotals = Array.from({ length: currentMonth.daysInMonth + 1 }, () => 0)
  for (const subscription of subscriptions) {
    const schedule = getSubscriptionDayWeights(subscription, currentMonth)
    for (let day = 1; day <= currentMonth.daysInMonth; day += 1) {
      fixedDailyTotals[day] += schedule[day]
    }
  }

  const explicitSubscriptionMerchantIds = new Set(subscriptions.map((subscription) => subscription.merchantId))
  for (const merchantId of fixedMerchantIds) {
    if (explicitSubscriptionMerchantIds.has(merchantId)) continue

    const currentFixedTransactions = currentTransactions.filter((transaction) => transaction.merchantId === merchantId)
    if (currentFixedTransactions.length > 0) {
      for (const transaction of currentFixedTransactions) {
        const day = clamp(transaction.occurredAt.getDate(), 1, currentMonth.daysInMonth)
        fixedDailyTotals[day] += centsToAmount(transaction.amountCents)
      }
      continue
    }

    const merchantHistory = historicalTransactions.filter((transaction) => transaction.merchantId === merchantId)
    const inferredAmount = Math.round(average(merchantHistory.map((transaction) => centsToAmount(transaction.amountCents))))
    const inferredDay = clamp(Math.round(median(merchantHistory.map((transaction) => transaction.occurredAt.getDate()))), 1, currentMonth.daysInMonth)
    fixedDailyTotals[inferredDay] += inferredAmount
  }

  const fixedCumulative = Array.from({ length: currentMonth.daysInMonth + 1 }, () => 0)
  for (let day = 1; day <= currentMonth.daysInMonth; day += 1) {
    fixedCumulative[day] = fixedCumulative[day - 1] + fixedDailyTotals[day]
  }

  const fixedCommitted = fixedCumulative[currentMonth.daysInMonth]
  const objectiveBase = monthlyBudget > 0
    ? monthlyBudget
    : Math.max(Math.round(fixedCommitted + averageHistoricalVariableTotal), totalSpend)
  const variableBudget = Math.max(objectiveBase - fixedCommitted, 0)
  const targetCurve = Array.from({ length: currentMonth.daysInMonth + 1 }, (_, day) => {
    if (day === 0) return 0
    return Math.round(fixedCumulative[day] + variableBudget * cumulativePace[day])
  })

  const currentTotalAtAsOf = currentCumulative[asOfDay]
  const currentVariableAtAsOf = currentVariableCumulative[asOfDay]
  const observedPace = clamp(cumulativePace[asOfDay], 0.05, 1)
  const projectedVariableByHistory = historyMonths > 0
    ? currentVariableAtAsOf / observedPace
    : (currentVariableAtAsOf / asOfDay) * currentMonth.daysInMonth
  const projectedVariableByRolling = (currentVariableAtAsOf / asOfDay) * currentMonth.daysInMonth
  const historicalPaceClosing = fixedCommitted + projectedVariableByHistory
  const rollingClosing = fixedCommitted + projectedVariableByRolling
  const budgetAnchoredClosing = Math.max(currentTotalAtAsOf, objectiveBase + (currentTotalAtAsOf - targetCurve[asOfDay]) * 1.15)
  const projectedClosingRaw = historyMonths > 0
    ? historicalPaceClosing * 0.58 + rollingClosing * 0.27 + budgetAnchoredClosing * 0.15
    : rollingClosing * 0.7 + budgetAnchoredClosing * 0.3
  const fixedFuture = Math.max(fixedCumulative[currentMonth.daysInMonth] - fixedCumulative[asOfDay], 0)
  const projectedClosing = Math.round(Math.max(projectedClosingRaw, currentTotalAtAsOf + fixedFuture))
  const variableProjected = Math.max(projectedClosing - fixedCommitted, 0)

  const historicalSpread = averageHistoricalVariableTotal > 0 ? standardDeviation(historicalVariableTotals) / averageHistoricalVariableTotal : 0.2
  const uncertainty = clamp(clamp(historicalSpread, 0.08, 0.28) + (1 - asOfDay / currentMonth.daysInMonth) * 0.18, 0.1, 0.42)
  const lowerClosing = Math.round(Math.max(currentTotalAtAsOf + fixedFuture * 0.85, projectedClosing * (1 - uncertainty)))
  const upperClosing = Math.round(Math.max(projectedClosing * (1 + uncertainty), lowerClosing + 1))
  const daysRemaining = Math.max(currentMonth.daysInMonth - asOfDay, 1)
  const recommendedDailySpend = monthlyBudget > 0
    ? Math.max(Math.round((monthlyBudget - currentTotalAtAsOf) / daysRemaining), 0)
    : 0

  const overspendProbability =
    monthlyBudget <= 0
      ? 0
      : lowerClosing >= monthlyBudget
        ? 95
        : upperClosing <= monthlyBudget
          ? 8
          : Math.round(((upperClosing - monthlyBudget) / Math.max(upperClosing - lowerClosing, 1)) * 100)

  const remainingWeightTotal = Math.max(targetCurve[currentMonth.daysInMonth] - targetCurve[asOfDay], 1)
  const trend: SpendingTrendPoint[] = Array.from({ length: currentMonth.daysInMonth }, (_, index) => {
    const day = index + 1
    const isObserved = day <= asOfDay
    const futureShare = isObserved ? 0 : clamp((targetCurve[day] - targetCurve[asOfDay]) / remainingWeightTotal, 0, 1)
    const projected = isObserved
      ? currentCumulative[day]
      : currentTotalAtAsOf + (projectedClosing - currentTotalAtAsOf) * futureShare
    const lowerBound = isObserved ? null : currentTotalAtAsOf + (lowerClosing - currentTotalAtAsOf) * futureShare
    const upperBound = isObserved ? null : currentTotalAtAsOf + (upperClosing - currentTotalAtAsOf) * futureShare

    return {
      day,
      actual: isObserved ? Math.round(currentCumulative[day]) : null,
      target: Math.round(targetCurve[day]),
      projected: Math.round(projected),
      lowerBound: lowerBound == null ? null : Math.round(lowerBound),
      upperBound: upperBound == null ? null : Math.round(upperBound),
      range: lowerBound == null || upperBound == null ? null : [Math.round(lowerBound), Math.round(upperBound)],
    }
  })

  const confidence: SpendingForecastSummary["confidence"] =
    historyMonths >= 4 ? "Alta" : historyMonths >= 2 ? "Media" : "Baja"
  const patternMessage =
    monthlyBudget <= 0
      ? "Todavia no hay un presupuesto mensual configurado; CapsaAI usa el patron historico como referencia temporal."
      : projectedClosing > monthlyBudget
        ? `CapsaAI proyecta un cierre ${Math.round(((projectedClosing - monthlyBudget) / monthlyBudget) * 100)}% sobre el presupuesto, considerando historial, suscripciones y ritmo actual.`
        : `CapsaAI proyecta un cierre dentro del presupuesto, con ${overspendProbability}% de probabilidad de superar el objetivo.`

  return {
    trend,
    forecast: {
      projectedClosing,
      lowerClosing,
      upperClosing,
      overspendProbability,
      recommendedDailySpend,
      confidence,
      historyMonths,
      fixedCommitted: Math.round(fixedCommitted),
      variableProjected: Math.round(variableProjected),
      asOfDay,
      method: "Patron historico variable + fijos programados + ritmo actual",
    },
    patternMessage,
  }
}

function getNextExpectedDate(date: Date, frequency: string, referenceDate = new Date()) {
  const nextDate = new Date(date)
  const referenceDay = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate())

  while (nextDate < referenceDay) {
    if (frequency === "WEEKLY") nextDate.setDate(nextDate.getDate() + 7)
    else if (frequency === "YEARLY") nextDate.setFullYear(nextDate.getFullYear() + 1)
    else nextDate.setMonth(nextDate.getMonth() + 1)
  }

  return nextDate
}

function formatTimeLabel(date: Date) {
  const today = new Date()
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (dateOnly.getTime() === new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) return "Hoy"
  if (dateOnly.getTime() === yesterday.getTime()) return "Ayer"

  return new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" }).format(date)
}

function budgetTypeToView(type: string): BudgetType {
  const map: Record<string, BudgetType> = {
    MONTHLY_TOTAL: "monthly_total",
    CATEGORY: "category",
    CARD: "card",
    ESSENTIAL: "essential",
    DISCRETIONARY: "discretionary",
  }
  return map[type] ?? "monthly_total"
}

function budgetTypeToDb(type: BudgetType) {
  const map = {
    monthly_total: "MONTHLY_TOTAL",
    category: "CATEGORY",
    card: "CARD",
    essential: "ESSENTIAL",
    discretionary: "DISCRETIONARY",
  } as const

  return map[type]
}

function sourceToView(source: string): TransactionRecord["source"] {
  const normalized = source.toLowerCase()
  if (normalized === "import") return "import"
  if (normalized === "api") return "api"
  if (normalized === "email") return "email"
  if (normalized === "receipt") return "receipt"
  if (normalized === "whatsapp") return "whatsapp"
  return "manual"
}

function promotionBenefit(promotion: {
  benefitType: string
  benefitValue: unknown
  title: string
}) {
  const value = Number(promotion.benefitValue)
  if (promotion.benefitType === "CASHBACK") return `${Math.round(value)}% reintegro`
  if (promotion.benefitType === "DISCOUNT") return `${Math.round(value)}% descuento`
  if (promotion.benefitType === "INSTALLMENTS") return `${Math.round(value)} cuotas`
  if (promotion.benefitType === "TWO_FOR_ONE") return "2x1"
  if (promotion.benefitType === "FIXED_AMOUNT") return `$${Math.round(value).toLocaleString("es-AR")}`
  return promotion.title
}

function haversineMeters(
  origin: { latitude: number; longitude: number } | null,
  destination: { latitude: number; longitude: number } | null,
) {
  if (!origin || !destination) return null
  const earthRadius = 6371000
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180
  const dLat = toRadians(destination.latitude - origin.latitude)
  const dLng = toRadians(destination.longitude - origin.longitude)
  const lat1 = toRadians(origin.latitude)
  const lat2 = toRadians(destination.latitude)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return Math.round(earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

function formatDistance(distanceMeters: number | null) {
  if (distanceMeters == null) return "Sin ubicacion"
  if (distanceMeters < 1000) return `${distanceMeters} m`
  return `${(distanceMeters / 1000).toFixed(1)} km`
}

async function getActiveUser() {
  const byEmail = await prisma.user.findFirst({
    where: { email: DEFAULT_USER_EMAIL, status: "ACTIVE", deletedAt: null },
    include: { preferences: true },
  })

  if (byEmail) return byEmail

  return prisma.user.findFirst({
    where: { status: "ACTIVE", deletedAt: null },
    orderBy: { createdAt: "asc" },
    include: { preferences: true },
  })
}

export async function getCapsaDashboardData(referenceDate = new Date()): Promise<CapsaDashboardData> {
  const user = await getActiveUser()
  if (!user) {
    throw new Error("No hay usuarios activos en la base de datos de CapsaAI. Ejecutá npm run db:seed o creá un usuario.")
  }

  const currentMonth = getCurrentMonthMeta(referenceDate)
  const previousMonth = getPreviousMonthMeta(referenceDate)
  const currentMonthStart = new Date(currentMonth.year, currentMonth.monthIndex, 1)
  const currentMonthEnd = new Date(currentMonth.year, currentMonth.monthIndex + 1, 1)
  const previousMonthStart = new Date(previousMonth.year, previousMonth.monthIndex, 1)
  const previousMonthEnd = new Date(previousMonth.year, previousMonth.monthIndex + 1, 1)
  const historyStart = addMonths(currentMonthStart, -6)
  const today = new Date()
  const elapsedDays =
    today >= currentMonthStart && today < currentMonthEnd
      ? Math.max(today.getDate(), 1)
      : currentMonth.daysInMonth

  const [
    categoriesFromDb,
    cardsFromDb,
    currentTransactions,
    previousTransactions,
    historicalTransactions,
    budgetsFromDb,
    subscriptionsFromDb,
    latestLocation,
    promotionsFromDb,
  ] = await Promise.all([
    prisma.category.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
    prisma.card.findMany({
      where: { userId: user.id, active: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.transaction.findMany({
      where: {
        userId: user.id,
        status: "CONFIRMED",
        deletedAt: null,
        occurredAt: { gte: currentMonthStart, lt: currentMonthEnd },
      },
      orderBy: { occurredAt: "desc" },
      include: { card: true, category: true, merchant: true },
    }),
    prisma.transaction.findMany({
      where: {
        userId: user.id,
        status: "CONFIRMED",
        deletedAt: null,
        occurredAt: { gte: previousMonthStart, lt: previousMonthEnd },
      },
      include: { category: true },
    }),
    prisma.transaction.findMany({
      where: {
        userId: user.id,
        status: "CONFIRMED",
        deletedAt: null,
        occurredAt: { gte: historyStart, lt: currentMonthStart },
      },
      include: { category: true },
    }),
    prisma.budget.findMany({
      where: { userId: user.id, period: currentMonth.periodKey, active: true },
      orderBy: { createdAt: "asc" },
      include: { category: true, card: true },
    }),
    prisma.subscription.findMany({
      where: { userId: user.id, status: { in: ["ACTIVE", "SUSPECTED"] } },
      orderBy: { nextExpectedAt: "asc" },
      include: { merchant: true, card: true },
    }),
    prisma.userLocationSnapshot.findFirst({
      where: { userId: user.id },
      orderBy: { capturedAt: "desc" },
    }),
    prisma.promotion.findMany({
      where: {
        status: "ACTIVE",
        validFrom: { lte: referenceDate },
        validUntil: { gte: referenceDate },
      },
      include: { merchant: true, category: true, merchantLocation: true },
      take: 8,
    }),
  ])

  let activeBudgets = budgetsFromDb
  if (activeBudgets.length === 0 && currentMonth.periodKey === getCurrentMonthMeta().periodKey) {
    const latestBudget = await prisma.budget.findFirst({
      where: { userId: user.id, active: true },
      orderBy: { period: "desc" },
    })

    if (latestBudget) {
      activeBudgets = await prisma.budget.findMany({
        where: { userId: user.id, period: latestBudget.period, active: true },
        orderBy: { createdAt: "asc" },
        include: { category: true, card: true },
      })
    }
  }

  const categories: CategoryView[] = categoriesFromDb.map((category) => ({
    key: category.key,
    label: category.name,
    icon: category.icon,
    color: category.color,
    isEssential: category.isEssential,
  }))

  const transactions: TransactionRecord[] = currentTransactions.map((transaction) => ({
    id: transaction.id,
    day: transaction.occurredAt.getDate(),
    date: toLocalISODate(transaction.occurredAt),
    merchant: transaction.merchant?.name ?? transaction.description ?? "Gasto sin comercio",
    amount: centsToAmount(transaction.amountCents),
    category: transaction.category?.key ?? "sin-categoria",
    card: transaction.card ? `${transaction.card.alias} ${transaction.card.lastFour}` : "Sin tarjeta",
    time: formatTimeLabel(transaction.occurredAt),
    description: transaction.description ?? undefined,
    source: sourceToView(transaction.source),
  }))

  const totalSpend = transactions.reduce((total, transaction) => total + transaction.amount, 0)
  const previousSpend = previousTransactions.reduce((total, transaction) => total + centsToAmount(transaction.amountCents), 0)
  const mainBudget = activeBudgets.find((budget) => budget.budgetType === "MONTHLY_TOTAL")
  const monthlyBudget = centsToAmount(mainBudget?.limitCents)
  const dailyAverage = elapsedDays > 0 ? Math.round(totalSpend / elapsedDays) : 0
  const forecastModel = buildPredictionModel({
    activeBudgets,
    currentMonth,
    currentTransactions,
    historicalTransactions,
    monthlyBudget,
    referenceDate,
    subscriptions: subscriptionsFromDb,
    totalSpend,
  })
  const projectedSpend = forecastModel.forecast.projectedClosing
  const patternMessage = forecastModel.patternMessage

  const currentByCategory = new Map<string, number>()
  const previousByCategory = new Map<string, number>()
  for (const transaction of currentTransactions) {
    const key = transaction.category?.key ?? "sin-categoria"
    currentByCategory.set(key, (currentByCategory.get(key) ?? 0) + centsToAmount(transaction.amountCents))
  }
  for (const transaction of previousTransactions) {
    const key = transaction.category?.key ?? "sin-categoria"
    previousByCategory.set(key, (previousByCategory.get(key) ?? 0) + centsToAmount(transaction.amountCents))
  }

  const predictedByCategory = new Map(forecastModel.prediction.categorias.map((category) => [category.categoria, category]))
  const categorySpend = categories
    .map((category) => {
      const amount = currentByCategory.get(category.key) ?? 0
      const previousAmount = previousByCategory.get(category.key) ?? 0
      const predicted = predictedByCategory.get(category.key)
      const delta =
        predicted
          ? `${predicted.pct}%`
          : previousAmount <= 0 && amount <= 0
          ? "sin gasto"
          : previousAmount <= 0
            ? "nuevo"
            : `${amount >= previousAmount ? "+" : ""}${Math.round(((amount - previousAmount) / previousAmount) * 100)}%`

      return {
        key: category.key,
        amount: predicted?.gastado ?? amount,
        delta,
        projected: predicted?.proyectado,
        limit: predicted?.tope,
        pct: predicted?.pct,
        isOverLimit: predicted?.se_pasa,
        limitSource: predicted?.fuente_tope,
      }
    })
    .sort((first, second) => (second.projected ?? second.amount) - (first.projected ?? first.amount))

  const spendByCard = new Map<string, number>()
  const topCategoryByCard = new Map<string, Map<string, number>>()
  for (const transaction of currentTransactions) {
    if (!transaction.card) continue
    spendByCard.set(transaction.card.id, (spendByCard.get(transaction.card.id) ?? 0) + centsToAmount(transaction.amountCents))
    const categoryMap = topCategoryByCard.get(transaction.card.id) ?? new Map<string, number>()
    const label = transaction.category?.name ?? "Gastos"
    categoryMap.set(label, (categoryMap.get(label) ?? 0) + centsToAmount(transaction.amountCents))
    topCategoryByCard.set(transaction.card.id, categoryMap)
  }

  const linkedCards: LinkedCard[] = cardsFromDb.map((card) => {
    const categoryMap = topCategoryByCard.get(card.id)
    const bestCategory = categoryMap
      ? Array.from(categoryMap).sort((first, second) => second[1] - first[1])[0]?.[0]
      : null
    const matchingPromotion = promotionsFromDb.find((promotion) => {
      const matchesBank = !promotion.issuerBank || promotion.issuerBank === card.issuerBank
      const matchesBrand = !promotion.cardBrand || promotion.cardBrand === card.brand
      const matchesType = !promotion.cardType || promotion.cardType === card.cardType
      return matchesBank && matchesBrand && matchesType
    })

    return {
      name: card.alias,
      lastFour: card.lastFour,
      spend: spendByCard.get(card.id) ?? 0,
      limit: centsToAmount(card.creditLimitCents),
      bestFor: bestCategory ? `Mayor uso: ${bestCategory}` : "Sin consumos este mes",
      nextBenefit: matchingPromotion ? promotionBenefit(matchingPromotion) : "Sin promo activa detectada",
    }
  })

  const spendingTrend = forecastModel.trend

  const budgets: BudgetPlan[] = activeBudgets.map((budget) => ({
    id: budget.id,
    name: budget.name,
    type: budgetTypeToView(budget.budgetType),
    amount: centsToAmount(budget.limitCents),
    period: currentMonth.period,
    category: budget.category?.key,
    cardLastFour: budget.card?.lastFour,
    alertThreshold: budget.alertThresholdPercent,
  }))

  const subscriptions = subscriptionsFromDb.map((subscription) => ({
    name: subscription.merchant.name,
    amount: centsToAmount(subscription.amountCents),
    card: subscription.card ? `${subscription.card.alias} ${subscription.card.lastFour}` : "Sin tarjeta",
    nextDate: formatDayMonth(getNextExpectedDate(subscription.nextExpectedAt, subscription.frequency, referenceDate)),
    status: subscription.note ?? subscription.status,
  }))

  const origin = latestLocation
    ? {
        latitude: Number(latestLocation.latitude),
        longitude: Number(latestLocation.longitude),
      }
    : null

  const nearbyPromos: NearbyPromo[] = promotionsFromDb
    .map((promotion) => {
      const destination = promotion.merchantLocation?.latitude && promotion.merchantLocation?.longitude
        ? {
            latitude: Number(promotion.merchantLocation.latitude),
            longitude: Number(promotion.merchantLocation.longitude),
          }
        : null
      const distanceMeters = haversineMeters(origin, destination)
      const matchingCard = cardsFromDb.find((card) => {
        const matchesBank = !promotion.issuerBank || promotion.issuerBank === card.issuerBank
        const matchesBrand = !promotion.cardBrand || promotion.cardBrand === card.brand
        const matchesType = !promotion.cardType || promotion.cardType === card.cardType
        return matchesBank && matchesBrand && matchesType
      })

      return {
        place: promotion.merchant?.name ?? promotion.title,
        distance: formatDistance(distanceMeters),
        category: promotion.category?.name ?? "General",
        benefit: promotionBenefit(promotion),
        card: matchingCard?.alias ?? promotion.issuerBank ?? "Tarjeta compatible",
        reason: promotion.conditions ?? "Beneficio vigente para este comercio.",
        saving: centsToAmount(promotion.capCents) || Math.round(totalSpend * (Number(promotion.benefitValue) / 100)),
        distanceMeters,
      }
    })
    .sort((first, second) => (first.distanceMeters ?? Number.MAX_SAFE_INTEGER) - (second.distanceMeters ?? Number.MAX_SAFE_INTEGER))
    .map(({ distanceMeters: _distanceMeters, ...promo }) => promo)

  const alerts: AlertView[] = []

  if (monthlyBudget > 0 && projectedSpend >= monthlyBudget * ((user.preferences?.alertThresholdPercent ?? 85) / 100)) {
    alerts.push({
      title: projectedSpend > monthlyBudget ? "Objetivo mensual en riesgo" : "Cerca del umbral mensual",
      detail: `Proyeccion actual: $${projectedSpend.toLocaleString("es-AR")} sobre objetivo de $${monthlyBudget.toLocaleString("es-AR")}.`,
      severity: projectedSpend > monthlyBudget ? "Alta" : "Media",
      time: "Calculado ahora",
      icon: "receipt-text",
    })
  }

  const duplicateCandidate = Array.from(
    currentTransactions.reduce((map, transaction) => {
      const key = `${transaction.merchant?.name ?? transaction.description}-${transaction.card?.lastFour}-${transaction.amountCents}`
      const group = map.get(key) ?? []
      group.push(transaction)
      map.set(key, group)
      return map
    }, new Map<string, typeof currentTransactions>()),
  )
    .map(([, group]) => group)
    .find((group) => group.length > 1)

  if (duplicateCandidate) {
    const sample = duplicateCandidate[0]
    alerts.push({
      title: "Posible cobro duplicado",
      detail: `${sample.merchant?.name ?? sample.description ?? "Un comercio"} aparece ${duplicateCandidate.length} veces con el mismo monto en ${currentMonth.month.toLowerCase()}.`,
      severity: "Alta",
      time: "Calculado ahora",
      icon: "alert-triangle",
    })
  }

  const risingCategory = categorySpend.find((category) => category.delta.startsWith("+") && Number.parseInt(category.delta, 10) >= 20)
  if (risingCategory) {
    const category = categories.find((item) => item.key === risingCategory.key)
    alerts.push({
      title: `${category?.label ?? "Una categoria"} sube contra el mes anterior`,
      detail: `El gasto en ${category?.label.toLowerCase() ?? "esta categoria"} va ${risingCategory.delta} contra ${previousMonth.month.toLowerCase()}.`,
      severity: "Media",
      time: "Calculado ahora",
      icon: "sparkles",
    })
  }

  if (nearbyPromos[0]) {
    alerts.push({
      title: "Promo cercana disponible",
      detail: `${nearbyPromos[0].place} tiene ${nearbyPromos[0].benefit} con ${nearbyPromos[0].card}.`,
      severity: "Oportunidad",
      time: "Calculado ahora",
      icon: "map-pin",
    })
  }

  const profileSettings = {
    monthlyBudget,
    alertThreshold: user.preferences?.alertThresholdPercent ?? mainBudget?.alertThresholdPercent ?? 85,
    locationPromos: user.preferences?.locationPromosEnabled ?? false,
    duplicateDetection: user.preferences?.duplicateDetectionEnabled ?? true,
    patternAlerts: user.preferences?.patternAlertsEnabled ?? true,
    privacyStatus: "Tarjetas vinculadas solo para analisis de gastos",
    privacyIcon: "shield-check",
  }

  return {
    currentMonth,
    monthlyPrediction: forecastModel.prediction,
    categories,
    spendingSummary: {
      user: user.fullName,
      period: currentMonth.period,
      totalSpend: forecastModel.actualTotalSpend,
      budget: monthlyBudget,
      projectedSpend,
      dailyAverage,
      lastMonthSpend: previousSpend,
      patternMessage,
    },
    categorySpend,
    linkedCards,
    subscriptions,
    transactions,
    spendingTrend,
    spendingForecast: forecastModel.forecast,
    calendarDays: buildCalendarDays(transactions, referenceDate),
    budgets,
    nearbyPromos,
    alerts,
    profileSettings,
  }
}

export async function getCapsaPredictionData(referenceDate = new Date()): Promise<PredictorResult> {
  const dashboardData = await getCapsaDashboardData(referenceDate)
  return dashboardData.monthlyPrediction as PredictorResult
}

export async function createCapsaTransaction(input: CreateTransactionInput) {
  const user = await getActiveUser()
  if (!user) throw new Error("No hay usuario activo para registrar el gasto.")

  const [category, card] = await Promise.all([
    prisma.category.findFirst({ where: { key: input.category, active: true } }),
    prisma.card.findFirst({
      where: {
        userId: user.id,
        active: true,
        OR: [{ lastFour: input.card }, { alias: input.card }],
      },
    }),
  ])

  const merchantName = input.merchant.trim()
  const slug = merchantName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48)
  const merchant = await prisma.merchant.upsert({
    where: { slug },
    update: { categoryId: category?.id },
    create: {
      name: merchantName,
      slug,
      categoryId: category?.id,
      rawNames: [merchantName],
      source: "manual",
    },
  })

  await prisma.transaction.create({
    data: {
      userId: user.id,
      cardId: card?.id,
      categoryId: category?.id,
      merchantId: merchant.id,
      amountCents: amountToCents(input.amount),
      occurredAt: new Date(`${input.date}T12:00:00-03:00`),
      description: input.description || merchantName,
      source: "MANUAL",
      status: "CONFIRMED",
    },
  })

  return getCapsaDashboardData(getDateFromPeriodKey(input.periodKey))
}

export async function createCapsaBudget(input: CreateBudgetInput) {
  const user = await getActiveUser()
  if (!user) throw new Error("No hay usuario activo para registrar el presupuesto.")

  const currentMonthDate = getDateFromPeriodKey(input.periodKey)
  const currentMonth = getCurrentMonthMeta(currentMonthDate)
  const dbType = budgetTypeToDb(input.type)
  const [category, card] = await Promise.all([
    input.category ? prisma.category.findFirst({ where: { key: input.category, active: true } }) : null,
    input.cardLastFour
      ? prisma.card.findFirst({ where: { userId: user.id, active: true, lastFour: input.cardLastFour } })
      : null,
  ])

  const existingBudget = input.id
    ? await prisma.budget.findFirst({
        where: {
          id: input.id,
          userId: user.id,
          active: true,
        },
      })
    : await prisma.budget.findFirst({
        where: {
          userId: user.id,
          period: currentMonth.periodKey,
          budgetType: dbType,
          categoryId: input.type === "category" ? category?.id ?? null : null,
          cardId: input.type === "card" ? card?.id ?? null : null,
          active: true,
        },
      })

  if (input.id && !existingBudget) {
    throw new Error("No se encontro el presupuesto para editar.")
  }

  const data = {
    userId: user.id,
    categoryId: input.type === "category" ? category?.id ?? null : null,
    cardId: input.type === "card" ? card?.id ?? null : null,
    budgetType: dbType,
    name: input.name?.trim() || "Presupuesto",
    period: currentMonth.periodKey,
    limitCents: amountToCents(input.amount),
    alertThresholdPercent: input.alertThreshold,
    active: true,
  }

  if (existingBudget) {
    await prisma.budget.update({
      where: { id: existingBudget.id },
      data,
    })
  } else {
    await prisma.budget.create({ data })
  }

  return getCapsaDashboardData(currentMonthDate)
}
