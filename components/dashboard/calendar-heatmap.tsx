"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Car, ChevronLeft, ChevronRight, Coffee, CreditCard, Home, ShoppingBag, Utensils, Wallet, Wifi } from "lucide-react"

interface Transaction {
  name: string
  amount: number
  category: string
  card: string
}

interface DayData {
  date: number
  amount: number
  transactions: Transaction[]
}

interface CalendarHeatmapProps {
  month: string
  year: number
  days: DayData[]
  cards?: {
    name: string
    lastFour: string
  }[]
  previousHref?: string
  nextHref?: string
  canGoNext?: boolean
}

const CATEGORIES = [
  { id: "super", label: "Super", icon: ShoppingBag, color: "bg-primary" },
  { id: "compras", label: "Compras", icon: ShoppingBag, color: "bg-pink-500" },
  { id: "transporte", label: "Transporte", icon: Car, color: "bg-blue-500" },
  { id: "comida", label: "Comida", icon: Utensils, color: "bg-orange-500" },
  { id: "cafe", label: "Cafe", icon: Coffee, color: "bg-amber-600" },
  { id: "servicios", label: "Servicios", icon: Wifi, color: "bg-yellow-500" },
  { id: "hogar", label: "Hogar", icon: Home, color: "bg-teal-500" },
]

function getIntensityClass(amount: number, maxAmount: number, hasData: boolean): string {
  if (!hasData || amount === 0) return "bg-secondary border border-border/50"
  const ratio = amount / maxAmount
  if (ratio < 0.2) return "bg-primary/20 border border-primary/30"
  if (ratio < 0.4) return "bg-primary/35 border border-primary/40"
  if (ratio < 0.6) return "bg-primary/50 border border-primary/50"
  if (ratio < 0.8) return "bg-primary/70 border border-primary/60"
  return "bg-primary border border-primary"
}

export function CalendarHeatmap({
  month,
  year,
  days,
  cards = [],
  previousHref,
  nextHref,
  canGoNext = true,
}: CalendarHeatmapProps) {
  const [selectedDayDate, setSelectedDayDate] = useState<number | null>(null)
  const [activeCategories, setActiveCategories] = useState<string[]>([])
  const [activeCards, setActiveCards] = useState<string[]>([])
  
  const weekDays = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"]
  
  const hasActiveFilters = activeCategories.length > 0 || activeCards.length > 0

  const filteredDays = useMemo(() => {
    return days.map(day => {
      const filteredTransactions = day.transactions.filter((tx) => {
        const matchesCategory =
          activeCategories.length === 0 || activeCategories.includes(tx.category.toLowerCase())
        const matchesCard =
          activeCards.length === 0 || activeCards.some((lastFour) => tx.card.includes(lastFour))

        return matchesCategory && matchesCard
      })
      const filteredAmount = filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0)
      return {
        ...day,
        amount: filteredAmount,
        transactions: filteredTransactions,
      }
    })
  }, [days, activeCards, activeCategories])
  
  const maxAmount = Math.max(...filteredDays.map(d => d.amount), 1)
  const totalFiltered = filteredDays.reduce((sum, d) => sum + d.amount, 0)
  const selectedDay = filteredDays.find((day) => day.date === selectedDayDate) ?? null
  
  // Get the first day of month (0 = Sunday, we want Monday = 0)
  const monthIndex = getMonthIndex(month)
  const today = new Date()
  const isCurrentCalendarMonth = today.getFullYear() === year && today.getMonth() === monthIndex
  const firstDayOfMonth = new Date(year, monthIndex, 1).getDay()
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1
  
  function getMonthIndex(monthName: string): number {
    const months: Record<string, number> = {
      "Enero": 0, "Febrero": 1, "Marzo": 2, "Abril": 3,
      "Mayo": 4, "Junio": 5, "Julio": 6, "Agosto": 7,
      "Septiembre": 8, "Octubre": 9, "Noviembre": 10, "Diciembre": 11
    }
    return months[monthName] ?? 0
  }
  
  function toggleCategory(categoryId: string) {
    setActiveCategories((current) =>
      current.includes(categoryId) ? current.filter((id) => id !== categoryId) : [...current, categoryId]
    )
  }

  function toggleCard(lastFour: string) {
    setActiveCards((current) =>
      current.includes(lastFour) ? current.filter((id) => id !== lastFour) : [...current, lastFour]
    )
  }

  function clearFilters() {
    setActiveCategories([])
    setActiveCards([])
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Month Header */}
      <div className="flex items-center justify-between gap-3">
        {previousHref ? (
          <Link
            href={previousHref}
            aria-label="Ver mes anterior"
            className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
          >
            <ChevronLeft className="size-5" />
          </Link>
        ) : (
          <span className="size-10" />
        )}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">{month} {year}</h2>
          <p className="text-sm text-muted-foreground mt-0.5 md:text-base">
            {hasActiveFilters ? `${activeCategories.length + activeCards.length} filtros activos` : "Total gastado"}:{" "}
            <span className="text-primary font-semibold">
              ${totalFiltered.toLocaleString("es-AR")}
            </span>
          </p>
        </div>
        {nextHref && canGoNext ? (
          <Link
            href={nextHref}
            aria-label="Ver mes siguiente"
            className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
          >
            <ChevronRight className="size-5" />
          </Link>
        ) : (
          <button
            type="button"
            aria-label="No hay meses futuros disponibles"
            disabled
            className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground/35"
          >
            <ChevronRight className="size-5" />
          </button>
        )}
      </div>
      
      {/* Filter Pills */}
      <div className="space-y-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
          <button
            onClick={clearFilters}
            className={`
              flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium md:gap-2 md:px-4 md:py-2.5 md:text-base
              whitespace-nowrap transition-all duration-200
              ${!hasActiveFilters 
                ? "bg-primary text-primary-foreground" 
                : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
              }
            `}
          >
            <Wallet className="size-4 md:size-5" />
            <span>Todos</span>
          </button>
          {CATEGORIES.map(category => {
            const Icon = category.icon
            const isActive = activeCategories.includes(category.id)
            return (
              <button
                key={category.id}
                onClick={() => toggleCategory(category.id)}
                className={`
                  flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium md:gap-2 md:px-4 md:py-2.5 md:text-base
                  whitespace-nowrap transition-all duration-200
                  ${isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                  }
                `}
              >
                <Icon className="size-4 md:size-5" />
                <span>{category.label}</span>
              </button>
            )
          })}
        </div>

        {cards.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
            {cards.map((card) => {
              const isActive = activeCards.includes(card.lastFour)

              return (
                <button
                  key={card.lastFour}
                  onClick={() => toggleCard(card.lastFour)}
                  className={`
                    flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium md:gap-2 md:px-4 md:py-2.5 md:text-base
                    whitespace-nowrap transition-all duration-200
                    ${isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                    }
                  `}
                >
                  <CreditCard className="size-4 md:size-5" />
                  <span>{card.name}</span>
                  <span className={isActive ? "text-primary-foreground/75" : "text-muted-foreground"}>
                    {card.lastFour}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
      
      {/* Calendar Card */}
      <div className="rounded-2xl bg-card border border-border p-4 md:p-5">
        {/* Week days header */}
        <div className="grid grid-cols-7 gap-1.5 mb-2 md:mb-3 md:gap-2">
          {weekDays.map(day => (
            <div key={day} className="text-xs font-medium text-muted-foreground text-center py-1 md:text-sm">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1.5 md:gap-2">
          {/* Empty cells for offset */}
          {Array.from({ length: adjustedFirstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          
          {/* Day cells */}
          {filteredDays.map((day) => {
            const hasData = day.amount > 0
            const isToday = isCurrentCalendarMonth && day.date === today.getDate()
            return (
              <button
                key={day.date}
                onClick={() => setSelectedDayDate(selectedDayDate === day.date ? null : day.date)}
                className={`
                  aspect-square rounded-xl flex flex-col items-center justify-center
                  transition-all duration-200 hover:scale-105 
                  ${getIntensityClass(day.amount, maxAmount, hasData)}
                  ${isToday ? "outline outline-2 outline-offset-2 outline-foreground/60" : ""}
                  ${selectedDayDate === day.date ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}
                `}
              >
                <span className={`text-sm font-medium md:text-lg ${day.amount > maxAmount * 0.5 ? "text-primary-foreground" : hasData ? "text-foreground" : "text-muted-foreground"}`}>
                  {day.date}
                </span>
                {day.amount > 0 && (
                  <span className={`text-[8px] font-medium mt-0.5 md:text-xs ${day.amount > maxAmount * 0.5 ? "text-primary-foreground/80" : "text-primary"}`}>
                    ${(day.amount / 1000).toFixed(0)}k
                  </span>
                )}
              </button>
            )
          })}
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-3 mt-4 text-xs text-muted-foreground md:gap-4 md:text-sm">
          <span>Menos</span>
          <div className="flex gap-1 md:gap-1.5">
            <div className="size-4 rounded-md bg-secondary border border-border/50 md:size-5" />
            <div className="size-4 rounded-md bg-primary/20 border border-primary/30 md:size-5" />
            <div className="size-4 rounded-md bg-primary/35 border border-primary/40 md:size-5" />
            <div className="size-4 rounded-md bg-primary/50 border border-primary/50 md:size-5" />
            <div className="size-4 rounded-md bg-primary/70 border border-primary/60 md:size-5" />
            <div className="size-4 rounded-md bg-primary border border-primary md:size-5" />
          </div>
          <span>Mas</span>
        </div>
      </div>
      
      {/* Selected day detail */}
      {selectedDay && (
        <div className="rounded-2xl bg-card border border-border p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-lg font-semibold text-foreground">{selectedDay.date} de {month}</span>
              <p className="text-sm text-muted-foreground">
                {selectedDay.transactions.length} transacciones
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-primary">
                ${selectedDay.amount.toLocaleString("es-AR")}
              </span>
            </div>
          </div>
          
          {selectedDay.amount > 0 ? (
            <div className="space-y-2">
              {selectedDay.transactions.map((tx, i) => {
                const category = CATEGORIES.find(c => c.id === tx.category.toLowerCase()) || CATEGORIES[0]
                const Icon = category.icon
                return (
                  <div 
                    key={i} 
                    className="flex items-center justify-between p-3 rounded-xl bg-secondary/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${category.color}/20`}>
                        <Icon className={`size-4 ${category.color.replace("bg-", "text-")}`} />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-foreground">{tx.name}</span>
                        <p className="text-xs text-muted-foreground">{category.label} · {tx.card}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      ${tx.amount.toLocaleString("es-AR")}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground text-sm">
              No hay gastos registrados este dia
            </div>
          )}
        </div>
      )}
    </div>
  )
}
