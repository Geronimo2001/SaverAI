import { CalendarHeatmap } from "@/components/dashboard/calendar-heatmap"
import { BottomNav } from "@/components/dashboard/bottom-nav"
import { getWebIcon } from "@/components/dashboard/web-icon"
import { formatCurrency, getCategory, getDateFromPeriodKey, isFuturePeriodKey, shiftPeriodKey } from "@/lib/capsa-data"
import { getCapsaDashboardData } from "@/lib/capsa-db"

export const dynamic = "force-dynamic"

interface GastosPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function GastosPage({ searchParams }: GastosPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const period = firstParam(resolvedSearchParams.period)
  const {
    calendarDays,
    categories,
    currentMonth,
    linkedCards,
    spendingSummary,
    transactions,
  } = await getCapsaDashboardData(getDateFromPeriodKey(period))
  const topDay = calendarDays.reduce((max, day) => (day.amount > max.amount ? day : max), calendarDays[0])
  const previousPeriod = shiftPeriodKey(currentMonth.periodKey, -1)
  const nextPeriod = shiftPeriodKey(currentMonth.periodKey, 1)

  return (
    <main className="min-h-screen bg-background pb-28 text-foreground md:pb-10 md:pl-24">
      <div className="mx-auto max-w-md md:grid md:max-w-6xl md:grid-cols-12 md:gap-5 md:px-8">
        <header className="sticky top-0 z-40 bg-background/92 px-5 pb-3 pt-4 backdrop-blur md:static md:col-span-12 md:bg-transparent md:px-0 md:pb-1 md:pt-8 md:backdrop-blur-none">
          <p className="text-xs text-muted-foreground">CapsaAI</p>
          <h1 className="text-xl font-semibold md:text-3xl">Gastos</h1>
        </header>

        <section className="px-5 pt-2 md:col-span-4 md:px-0 md:pt-0">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground">Mayor dia</p>
              <p className="mt-1 text-xl font-semibold">{topDay.date} {currentMonth.shortName}</p>
              <p className="text-xs text-primary">{formatCurrency(topDay.amount)}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground">Promedio diario</p>
              <p className="mt-1 text-xl font-semibold">{formatCurrency(spendingSummary.dailyAverage)}</p>
              <p className="text-xs text-muted-foreground">segun patron actual</p>
            </div>
          </div>
        </section>

        <section className="px-5 pt-5 md:col-span-8 md:px-0 md:pt-0">
          <CalendarHeatmap
            month={currentMonth.month}
            year={currentMonth.year}
            days={calendarDays}
            cards={linkedCards}
            previousHref={`/gastos?period=${previousPeriod}`}
            nextHref={`/gastos?period=${nextPeriod}`}
            canGoNext={!isFuturePeriodKey(nextPeriod)}
          />
        </section>

        <section className="px-5 pt-5 md:col-span-12 md:px-0">
          <h2 className="mb-3 text-base font-semibold">Categorias disponibles</h2>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide md:flex-wrap md:overflow-visible">
            {categories.map((category) => {
              const Icon = getWebIcon(category.icon)

              return (
                <div key={category.key} className="flex shrink-0 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                  <Icon className="size-4" style={{ color: category.color }} />
                  <span className="text-sm">{category.label}</span>
                </div>
              )
            })}
          </div>
        </section>

        <section className="px-5 pt-5 md:col-span-12 md:px-0">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">Transacciones</h2>
            <span className="text-xs text-muted-foreground">{transactions.length} recientes</span>
          </div>
          <div className="space-y-2 md:grid md:grid-cols-2 md:gap-2 md:space-y-0">
            {transactions.map((transaction) => {
              const category = getCategory(categories, transaction.category)
              const Icon = getWebIcon(category.icon)

              return (
                <div key={transaction.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                      <Icon className="size-4" style={{ color: category.color }} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{transaction.merchant}</p>
                      <p className="text-xs text-muted-foreground">{category.label} · {transaction.card} · {transaction.time}</p>
                    </div>
                  </div>
                  <p className="shrink-0 text-sm font-semibold">-{formatCurrency(transaction.amount)}</p>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      <BottomNav activeTab="gastos" />
    </main>
  )
}
