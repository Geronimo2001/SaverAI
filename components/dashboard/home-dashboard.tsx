"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Bell, CalendarDays, ChevronLeft, ChevronRight, CreditCard, Gauge, MapPin, Sparkles, Target } from "lucide-react"
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts"
import { BottomNav } from "@/components/dashboard/bottom-nav"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import {
  formatCompact,
  formatCurrency,
  getCategory,
  getMonthMetaFromPeriodKey,
  shiftPeriodKey,
} from "@/lib/capsa-data"
import type { CapsaDashboardData } from "@/lib/capsa-data"
import { getWebIcon } from "@/components/dashboard/web-icon"

const trendChartConfig = {
  range: {
    label: "Rango esperado",
    color: "var(--color-chart-4)",
  },
  actual: {
    label: "Real",
    color: "var(--color-chart-2)",
  },
  target: {
    label: "Objetivo inteligente",
    color: "var(--color-chart-1)",
  },
  projected: {
    label: "CapsaAI",
    color: "var(--color-chart-4)",
  },
} satisfies ChartConfig

interface HomeDashboardProps {
  data: CapsaDashboardData
  previousHref?: string
  nextHref?: string
  canGoNext?: boolean
}

export function HomeDashboard({ data, previousHref, nextHref, canGoNext = true }: HomeDashboardProps) {
  const {
    categorySpend,
    categories,
    currentMonth,
    linkedCards,
    spendingForecast,
    spendingSummary,
    spendingTrend,
    subscriptions,
  } = data
  const [selectedCardLastFour, setSelectedCardLastFour] = useState<string | null>(null)
  const budgetProgress = spendingSummary.budget > 0 ? Math.round((spendingSummary.totalSpend / spendingSummary.budget) * 100) : 0
  const projectedOverage = spendingSummary.projectedSpend - spendingSummary.budget
  const selectedCard = linkedCards.find((card) => card.lastFour === selectedCardLastFour)
  const periodQuery = `?period=${currentMonth.periodKey}`
  const previousMonth = getMonthMetaFromPeriodKey(shiftPeriodKey(currentMonth.periodKey, -1))
  const nextMonth = getMonthMetaFromPeriodKey(shiftPeriodKey(currentMonth.periodKey, 1))
  const xAxisTicks = Array.from(new Set([1, 5, 10, 15, 20, 25, currentMonth.daysInMonth].filter((day) => day <= currentMonth.daysInMonth)))
  const filteredSubscriptions = useMemo(() => {
    if (!selectedCardLastFour) {
      return subscriptions
    }

    return subscriptions.filter((subscription) => subscription.card.includes(selectedCardLastFour))
  }, [selectedCardLastFour])
  const subscriptionTotal = filteredSubscriptions.reduce((total, subscription) => total + subscription.amount, 0)

  return (
    <main className="min-h-screen overflow-x-hidden bg-background pb-28 text-foreground md:pb-10 md:pl-24">
      <div className="mx-auto w-full max-w-md md:grid md:max-w-6xl md:grid-cols-12 md:gap-5 md:px-8">
        <header className="sticky top-0 z-40 bg-background/92 px-5 pb-3 pt-4 backdrop-blur md:static md:col-span-12 md:bg-transparent md:px-0 md:pb-1 md:pt-8 md:backdrop-blur-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">CapsaAI</p>
              <h1 className="text-xl font-semibold md:text-3xl">Inicio</h1>
            </div>
            <Link
              href="/alertas"
              className="relative flex size-10 items-center justify-center rounded-lg border border-border bg-card"
              aria-label="Ver alertas"
            >
              <Bell className="size-5 text-muted-foreground" />
              <span className="absolute right-2 top-2 size-2 rounded-full bg-[#ff8a5b]" />
            </Link>
          </div>
        </header>

        <section className="px-5 pt-2 md:col-span-4 md:px-0 md:pt-0">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{spendingSummary.period}</p>
                <h2 className="mt-1 text-3xl font-semibold tracking-normal sm:text-4xl">{formatCurrency(spendingSummary.totalSpend)}</h2>
                <p className="mt-2 text-sm text-muted-foreground">Gastado sobre objetivo de {formatCurrency(spendingSummary.budget)}</p>
              </div>
              <div className="shrink-0 rounded-lg bg-primary px-3 py-2 text-right text-primary-foreground">
                <p className="text-xl font-semibold">{budgetProgress}%</p>
                <p className="text-[11px]">usado</p>
              </div>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(budgetProgress, 100)}%` }} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-secondary p-3">
                <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Gauge className="size-4 text-primary" />
                  Proyeccion
                </div>
                <p className="text-lg font-semibold">{formatCurrency(spendingSummary.projectedSpend)}</p>
                <p className={`text-xs ${projectedOverage > 0 ? "text-[#ff8a5b]" : "text-primary"}`}>
                  {projectedOverage > 0 ? "+" : ""}{formatCurrency(projectedOverage)}
                </p>
              </div>
              <div className="rounded-lg bg-secondary p-3">
                <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarDays className="size-4 text-primary" />
                  Promedio diario
                </div>
                <p className="text-lg font-semibold">{formatCurrency(spendingSummary.dailyAverage)}</p>
                <p className="text-xs text-muted-foreground">ultimos 15 dias</p>
              </div>
            </div>
          </div>
        </section>

        <section className="min-w-0 px-5 pt-5 md:col-span-8 md:px-0 md:pt-0">
          <div className="overflow-hidden rounded-lg border border-border bg-card p-4 md:p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold md:text-xl">Prediccion mensual</h2>
                <p className="mt-1 text-xs text-muted-foreground md:text-sm">
                  {currentMonth.period}
                </p>
              </div>
              <div className="min-w-20 shrink-0 text-right">
                <p className="text-xs text-muted-foreground">Confianza {spendingForecast.confidence}</p>
                <p className="text-sm font-semibold">{formatCompact(spendingSummary.projectedSpend)}</p>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-lg border border-border bg-secondary p-2">
              {previousHref ? (
                <Link
                  href={previousHref}
                  className="flex h-10 items-center justify-center gap-1 rounded-lg border border-border bg-card px-2 text-xs font-medium transition hover:border-primary/45"
                  aria-label={`Ver ${previousMonth.period}`}
                >
                  <ChevronLeft className="size-4 shrink-0" />
                  <span className="truncate">{previousMonth.shortName} {previousMonth.year}</span>
                </Link>
              ) : (
                <span className="h-10" />
              )}
              <div className="min-w-24 rounded-lg bg-primary px-3 py-2 text-center text-primary-foreground">
                <p className="text-xs font-medium leading-tight">{currentMonth.month}</p>
                <p className="text-[11px] leading-tight opacity-85">{currentMonth.year}</p>
              </div>
              {nextHref && canGoNext ? (
                <Link
                  href={nextHref}
                  className="flex h-10 items-center justify-center gap-1 rounded-lg border border-border bg-card px-2 text-xs font-medium transition hover:border-primary/45"
                  aria-label={`Ver ${nextMonth.period}`}
                >
                  <span className="truncate">{nextMonth.shortName} {nextMonth.year}</span>
                  <ChevronRight className="size-4 shrink-0" />
                </Link>
              ) : (
                <span
                  className="flex h-10 items-center justify-center gap-1 rounded-lg border border-border bg-background px-2 text-xs text-muted-foreground opacity-55"
                  aria-hidden="true"
                >
                  <span className="truncate">{nextMonth.shortName} {nextMonth.year}</span>
                  <ChevronRight className="size-4 shrink-0" />
                </span>
              )}
            </div>

            <ChartContainer config={trendChartConfig} className="h-72 min-w-0 max-w-full overflow-hidden md:h-[390px]">
              <AreaChart data={spendingTrend} margin={{ top: 8, right: 4, bottom: 0, left: 4 }} accessibilityLayer>
                <defs>
                  <linearGradient id="actualFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-actual)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-actual)" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="projectedFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-projected)" stopOpacity={0.16} />
                    <stop offset="95%" stopColor="var(--color-projected)" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  ticks={xAxisTicks}
                  tickMargin={8}
                />
                <YAxis hide domain={[0, (dataMax: number) => Math.round(dataMax * 1.12)]} />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="line"
                      labelFormatter={(day) => `Dia ${day}`}
                      formatter={(value, name) => (
                        <div className="flex min-w-32 items-center justify-between gap-4">
                          <span className="text-muted-foreground">
                            {name === "actual"
                              ? "Real"
                              : name === "target"
                                ? "Objetivo"
                                : name === "range"
                                  ? "Rango"
                                  : "CapsaAI"}
                          </span>
                          <span className="font-mono font-medium tabular-nums text-foreground">
                            {Array.isArray(value)
                              ? `${formatCompact(Number(value[0]))} - ${formatCompact(Number(value[1]))}`
                              : formatCurrency(Number(value))}
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                <ReferenceLine
                  y={spendingSummary.budget}
                  stroke="var(--color-muted-foreground)"
                  strokeDasharray="3 4"
                  strokeOpacity={0.55}
                />
                <Area
                  type="monotone"
                  dataKey="range"
                  fill="url(#projectedFill)"
                  stroke="transparent"
                  dot={false}
                  activeDot={false}
                  connectNulls={false}
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="target"
                  fill="transparent"
                  stroke="var(--color-target)"
                  strokeDasharray="8 6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="projected"
                  fill="transparent"
                  stroke="var(--color-projected)"
                  strokeDasharray="4 5"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="actual"
                  fill="url(#actualFill)"
                  stroke="var(--color-actual)"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 5 }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ChartContainer>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className="size-2 rounded-full bg-chart-2" />
                Real
              </span>
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className="h-0.5 w-5 border-t border-dashed border-chart-1" />
                Objetivo inteligente
              </span>
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className="h-0.5 w-5 border-t border-dashed border-chart-4" />
                CapsaAI
              </span>
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className="size-2 rounded-full bg-chart-4/30" />
                Rango esperado
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="min-w-0 rounded-lg bg-secondary p-3">
                <p className="text-[11px] text-muted-foreground">Cierre estimado</p>
                <p className="mt-1 text-sm font-semibold md:text-base">{formatCompact(spendingForecast.projectedClosing)}</p>
              </div>
              <div className="min-w-0 rounded-lg bg-secondary p-3">
                <p className="text-[11px] text-muted-foreground">Riesgo de exceso</p>
                <p className="mt-1 text-sm font-semibold md:text-base">{spendingForecast.overspendProbability}%</p>
              </div>
              <div className="min-w-0 rounded-lg bg-secondary p-3">
                <p className="text-[11px] text-muted-foreground">Diario sugerido</p>
                <p className="mt-1 text-sm font-semibold md:text-base">{formatCompact(spendingForecast.recommendedDailySpend)}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 pt-5 md:col-span-12 md:px-0">
          <div className="flex items-center gap-3 rounded-lg border border-primary/25 bg-primary/10 p-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/20">
              <Sparkles className="size-5 text-primary" />
            </div>
            <p className="text-sm leading-5 text-foreground">{spendingSummary.patternMessage}</p>
          </div>
        </section>

        <section className="pt-5 md:col-span-12">
          <div className="mb-3 flex items-center justify-between px-5 md:px-0">
            <h2 className="text-base font-semibold">Categorias que mueven el mes</h2>
            <Link href={`/gastos${periodQuery}`} className="text-xs font-medium text-primary">
              Ver gastos
            </Link>
          </div>
          <div className="flex gap-2 overflow-x-auto px-5 pb-1 scrollbar-hide md:grid md:grid-cols-6 md:overflow-visible md:px-0">
            {categorySpend.slice(0, 6).map((item) => {
              const category = getCategory(categories, item.key)
              const Icon = getWebIcon(category.icon)
              const progress = item.pct == null ? 0 : Math.min(Math.max(item.pct, 0), 100)
              const projectedLabel = item.projected == null ? formatCompact(item.amount) : formatCompact(item.projected)

              return (
                <Link
                  key={item.key}
                  href={`/gastos${periodQuery}`}
                  className="min-w-32 rounded-lg border border-border bg-card p-3 md:min-w-0"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-secondary">
                      <Icon className="size-4" style={{ color: category.color }} />
                    </span>
                    <span className="text-[11px] text-muted-foreground">{item.delta}</span>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">{category.label}</p>
                  <p className="text-lg font-semibold">{projectedLabel}</p>
                  {item.limit != null ? (
                    <div className="mt-2">
                      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                        <div
                          className={`h-full rounded-full ${item.isOverLimit ? "bg-[#ff8a5b]" : "bg-primary"}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">tope {formatCompact(item.limit)}</p>
                    </div>
                  ) : null}
                </Link>
              )
            })}
          </div>
        </section>

        <section className="px-5 pt-5 md:col-span-6 md:px-0">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">Tarjetas vinculadas</h2>
            <span className="text-xs text-muted-foreground">{linkedCards.length} activas</span>
          </div>
          <div className="space-y-2">
            {linkedCards.map((card) => {
              const isSelected = selectedCardLastFour === card.lastFour

              return (
                <button
                  key={card.lastFour}
                  type="button"
                  onClick={() => setSelectedCardLastFour(isSelected ? null : card.lastFour)}
                  className={`w-full rounded-lg border bg-card p-4 text-left transition ${
                    isSelected ? "border-primary ring-1 ring-primary/40" : "border-border hover:border-primary/40"
                  }`}
                  aria-pressed={isSelected}
                  aria-label={`Filtrar suscripciones por ${card.name} terminada en ${card.lastFour}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-lg bg-secondary">
                        <CreditCard className="size-5 text-primary" />
                      </span>
                      <div>
                        <p className="font-medium">{card.name}</p>
                        <p className="text-xs text-muted-foreground">terminada en {card.lastFour}</p>
                      </div>
                    </div>
                    <p className="text-right text-sm font-semibold">{formatCompact(card.spend)}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                    <span className="text-muted-foreground">{card.bestFor}</span>
                    <span className="text-primary">{card.nextBenefit}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        <section className="px-5 pt-5 md:col-span-6 md:px-0">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Suscripciones</h2>
              {selectedCard ? (
                <p className="text-xs text-muted-foreground">Filtradas por {selectedCard.name}</p>
              ) : null}
            </div>
            <div className="text-right">
              <span className="block text-xs font-medium text-primary">{formatCurrency(subscriptionTotal)}/mes</span>
              {selectedCard ? (
                <button
                  type="button"
                  onClick={() => setSelectedCardLastFour(null)}
                  className="text-[11px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Ver todas
                </button>
              ) : null}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card">
            {filteredSubscriptions.slice(0, 3).map((subscription, index) => (
              <div
                key={subscription.name}
                className={`flex items-center justify-between gap-3 p-3 ${index > 0 ? "border-t border-border" : ""}`}
              >
                <div>
                  <p className="text-sm font-medium">{subscription.name}</p>
                  <p className="text-xs text-muted-foreground">{subscription.card} · Prox. {subscription.nextDate}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatCurrency(subscription.amount)}</p>
                  <p className="text-[11px] text-muted-foreground">{subscription.status}</p>
                </div>
              </div>
            ))}
            {filteredSubscriptions.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">No hay suscripciones asociadas a esta tarjeta.</div>
            ) : null}
          </div>
        </section>

        <section className="px-5 pt-5 md:col-span-6 md:px-0">
          <Link
            href="/cerca"
            className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-secondary">
                <MapPin className="size-5 text-primary" />
              </span>
              <div>
                <p className="font-medium">Promos cerca</p>
                <p className="text-xs text-muted-foreground">Elegir tarjeta antes de pagar</p>
              </div>
            </div>
            <ChevronRight className="size-5 text-muted-foreground" />
          </Link>
        </section>

        <section className="px-5 pt-5 md:col-span-6 md:px-0">
          <Link
            href="/perfil"
            className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-secondary">
                <Target className="size-5 text-primary" />
              </span>
              <div>
                <p className="font-medium">Objetivo de gasto</p>
                <p className="text-xs text-muted-foreground">Ajustar presupuesto y alertas</p>
              </div>
            </div>
            <ChevronRight className="size-5 text-muted-foreground" />
          </Link>
        </section>
      </div>

      <BottomNav activeTab="inicio" />
    </main>
  )
}
