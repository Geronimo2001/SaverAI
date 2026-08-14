import { useMemo, useState } from "react"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { AppIcon } from "./Icon"
import { IconBadge } from "./IconBadge"
import { CategoryView, formatCurrency } from "../data/capsa-data"
import { colors } from "../theme"

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
  categories: CategoryView[]
  cards?: {
    name: string
    lastFour: string
  }[]
  onMonthChange?: (offset: number) => void
  canGoNext?: boolean
  loading?: boolean
}

function getIntensity(amount: number, maxAmount: number) {
  if (amount <= 0) return { backgroundColor: colors.cardSoft, borderColor: colors.border, textColor: colors.muted }
  const ratio = amount / maxAmount
  if (ratio < 0.2) return { backgroundColor: "rgba(94, 230, 168, 0.16)", borderColor: colors.primaryDark, textColor: colors.text }
  if (ratio < 0.4) return { backgroundColor: "rgba(94, 230, 168, 0.28)", borderColor: colors.primaryDark, textColor: colors.text }
  if (ratio < 0.6) return { backgroundColor: "rgba(94, 230, 168, 0.42)", borderColor: colors.primary, textColor: colors.text }
  if (ratio < 0.8) return { backgroundColor: "rgba(94, 230, 168, 0.62)", borderColor: colors.primary, textColor: "#06120c" }
  return { backgroundColor: colors.primary, borderColor: colors.primary, textColor: "#06120c" }
}

function getMonthIndex(monthName: string): number {
  const months: Record<string, number> = {
    Enero: 0,
    Febrero: 1,
    Marzo: 2,
    Abril: 3,
    Mayo: 4,
    Junio: 5,
    Julio: 6,
    Agosto: 7,
    Septiembre: 8,
    Octubre: 9,
    Noviembre: 10,
    Diciembre: 11,
  }
  return months[monthName] ?? 0
}

export function CalendarHeatmap({
  month,
  year,
  days,
  categories,
  cards = [],
  onMonthChange,
  canGoNext = true,
  loading = false,
}: CalendarHeatmapProps) {
  const [selectedDayDate, setSelectedDayDate] = useState<number | null>(null)
  const [activeCategories, setActiveCategories] = useState<string[]>([])
  const [activeCards, setActiveCards] = useState<string[]>([])

  const hasActiveFilters = activeCategories.length > 0 || activeCards.length > 0
  const weekDays = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"]
  const monthIndex = getMonthIndex(month)
  const today = new Date()
  const isCurrentCalendarMonth = today.getFullYear() === year && today.getMonth() === monthIndex
  const firstDayOfMonth = new Date(year, monthIndex, 1).getDay()
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1

  const filteredDays = useMemo(() => {
    return days.map((day) => {
      const filteredTransactions = day.transactions.filter((tx) => {
        const matchesCategory = activeCategories.length === 0 || activeCategories.includes(tx.category.toLowerCase())
        const matchesCard = activeCards.length === 0 || activeCards.some((lastFour) => tx.card.includes(lastFour))
        return matchesCategory && matchesCard
      })
      const filteredAmount = filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0)
      return { ...day, amount: filteredAmount, transactions: filteredTransactions }
    })
  }, [activeCards, activeCategories, days])

  const maxAmount = Math.max(...filteredDays.map((day) => day.amount), 1)
  const totalFiltered = filteredDays.reduce((sum, day) => sum + day.amount, 0)
  const selectedDay = filteredDays.find((day) => day.date === selectedDayDate) ?? null
  const selectedCategoryTotals = selectedDay
    ? categories
        .map((category) => ({
          category,
          amount: selectedDay.transactions
            .filter((tx) => tx.category === category.key)
            .reduce((sum, tx) => sum + tx.amount, 0),
        }))
        .filter((item) => item.amount > 0)
    : []
  const selectedCardTotals = selectedDay
    ? Array.from(
        selectedDay.transactions.reduce((map, tx) => {
          map.set(tx.card, (map.get(tx.card) ?? 0) + tx.amount)
          return map
        }, new Map<string, number>()),
      )
    : []

  function toggleCategory(categoryId: string) {
    setActiveCategories((current) =>
      current.includes(categoryId) ? current.filter((id) => id !== categoryId) : [...current, categoryId],
    )
  }

  function toggleCard(lastFour: string) {
    setActiveCards((current) =>
      current.includes(lastFour) ? current.filter((id) => id !== lastFour) : [...current, lastFour],
    )
  }

  function clearFilters() {
    setActiveCategories([])
    setActiveCards([])
  }

  return (
    <View style={styles.shell}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ver mes anterior"
          disabled={loading}
          onPress={() => onMonthChange?.(-1)}
          style={[styles.monthButton, loading && styles.monthButtonDisabled]}
        >
          <AppIcon name="chevron-left" color={loading ? colors.muted : colors.text} size={20} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.month}>{month} {year}</Text>
          <Text style={styles.total}>
            {hasActiveFilters ? `${activeCategories.length + activeCards.length} filtros` : "Total"}:{" "}
            <Text style={styles.totalValue}>{formatCurrency(totalFiltered)}</Text>
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ver mes siguiente"
          disabled={loading || !canGoNext}
          onPress={() => onMonthChange?.(1)}
          style={[styles.monthButton, (loading || !canGoNext) && styles.monthButtonDisabled]}
        >
          <AppIcon name="chevron-right" color={loading || !canGoNext ? colors.muted : colors.text} size={20} />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        <Pressable onPress={clearFilters} style={[styles.pill, !hasActiveFilters && styles.pillActive]}>
          <AppIcon name="wallet" color={!hasActiveFilters ? "#06120c" : colors.muted} size={16} />
          <Text style={[styles.pillText, !hasActiveFilters && styles.pillTextActive]}>Todos</Text>
        </Pressable>
        {categories.map((category) => {
          const isActive = activeCategories.includes(category.key)
          return (
            <Pressable key={category.key} onPress={() => toggleCategory(category.key)} style={[styles.pill, isActive && styles.pillActive]}>
              <AppIcon name={category.icon} color={isActive ? "#06120c" : colors.muted} size={16} />
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{category.label}</Text>
            </Pressable>
          )
        })}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {cards.map((card) => {
          const isActive = activeCards.includes(card.lastFour)
          return (
            <Pressable key={card.lastFour} onPress={() => toggleCard(card.lastFour)} style={[styles.pill, isActive && styles.pillActive]}>
              <AppIcon name="credit-card" color={isActive ? "#06120c" : colors.muted} size={16} />
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{card.name}</Text>
              <Text style={[styles.pillMeta, isActive && styles.pillTextActive]}>{card.lastFour}</Text>
            </Pressable>
          )
        })}
      </ScrollView>

      <View style={styles.calendarCard}>
        <View style={styles.weekRow}>
          {weekDays.map((day) => (
            <Text key={day} style={styles.weekDay}>{day}</Text>
          ))}
        </View>
        <View style={styles.grid}>
          {Array.from({ length: adjustedFirstDay }).map((_, index) => (
            <View key={`empty-${index}`} style={styles.dayCell}>
              <View style={styles.emptyDay} />
            </View>
          ))}
          {filteredDays.map((day) => {
            const tone = getIntensity(day.amount, maxAmount)
            const isSelected = selectedDayDate === day.date
            const isToday = isCurrentCalendarMonth && day.date === today.getDate()

            return (
              <Pressable
                key={day.date}
                onPress={() => setSelectedDayDate(isSelected ? null : day.date)}
                style={[
                  styles.dayButton,
                  { backgroundColor: tone.backgroundColor, borderColor: tone.borderColor },
                  isToday && styles.dayToday,
                  isSelected && styles.daySelected,
                ]}
              >
                <Text style={[styles.dayNumber, { color: tone.textColor }]}>{day.date}</Text>
                {day.amount > 0 ? <Text style={[styles.dayAmount, { color: tone.textColor }]}>${Math.round(day.amount / 1000)}k</Text> : null}
              </Pressable>
            )
          })}
        </View>
        <View style={styles.legend}>
          <Text style={styles.legendText}>Menos</Text>
          {[0, 0.2, 0.35, 0.5, 0.7, 1].map((step) => (
            <View
              key={step}
              style={[
                styles.legendBox,
                step === 0
                  ? { backgroundColor: colors.cardSoft, borderColor: colors.border }
                  : { backgroundColor: `rgba(94, 230, 168, ${step})`, borderColor: colors.primaryDark },
              ]}
            />
          ))}
          <Text style={styles.legendText}>Mas</Text>
        </View>
      </View>

      {selectedDay ? (
        <View style={styles.detail}>
          <View style={styles.detailHeader}>
            <View>
              <Text style={styles.detailTitle}>{selectedDay.date} de {month}</Text>
              <Text style={styles.detailMeta}>{selectedDay.transactions.length} transacciones</Text>
            </View>
            <Text style={styles.detailAmount}>{formatCurrency(selectedDay.amount)}</Text>
          </View>

          {selectedDay.amount > 0 ? (
            <>
              <View style={styles.summaryBlock}>
                <Text style={styles.summaryTitle}>Por categoria</Text>
                {selectedCategoryTotals.map(({ category, amount }) => (
                  <View key={category.key} style={styles.summaryRow}>
                    <View style={styles.summaryLabel}>
                      <IconBadge icon={category.icon} color={category.color} size={28} />
                      <Text style={styles.transactionMeta}>{category.label}</Text>
                    </View>
                    <Text style={styles.transactionAmount}>{formatCurrency(amount)}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.summaryBlock}>
                <Text style={styles.summaryTitle}>Medio de pago</Text>
                {selectedCardTotals.map(([card, amount]) => (
                  <View key={card} style={styles.summaryRow}>
                    <Text style={styles.transactionMeta}>{card}</Text>
                    <Text style={styles.transactionAmount}>{formatCurrency(amount)}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.transactionStack}>
                {selectedDay.transactions.map((tx, index) => {
                  const category = categories.find((item) => item.key === tx.category) ?? categories[0]
                  return (
                    <View key={`${tx.name}-${index}`} style={styles.transactionRow}>
                      <View style={styles.transactionLeft}>
                        <IconBadge icon={category.icon} color={category.color} size={36} />
                        <View>
                          <Text style={styles.transactionName}>{tx.name}</Text>
                          <Text style={styles.transactionMeta}>{category.label} / {tx.card}</Text>
                        </View>
                      </View>
                      <Text style={styles.transactionAmount}>{formatCurrency(tx.amount)}</Text>
                    </View>
                  )
                })}
              </View>
            </>
          ) : (
            <Text style={styles.empty}>No hay gastos registrados este dia.</Text>
          )}
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  shell: {
    gap: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  headerText: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  monthButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  monthButtonDisabled: {
    opacity: 0.45,
  },
  month: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  total: {
    color: colors.muted,
    fontSize: 13,
  },
  totalValue: {
    color: colors.primary,
    fontWeight: "800",
  },
  filterRow: {
    gap: 8,
    paddingRight: 20,
  },
  pill: {
    minHeight: 38,
    borderRadius: 999,
    backgroundColor: colors.cardSoft,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  pillActive: {
    backgroundColor: colors.primary,
  },
  pillText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
  },
  pillMeta: {
    color: colors.muted,
    fontSize: 11,
  },
  pillTextActive: {
    color: "#06120c",
  },
  calendarCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 12,
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  weekDay: {
    flex: 1,
    textAlign: "center",
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.2857%",
    aspectRatio: 0.86,
    padding: 2,
  },
  emptyDay: {
    flex: 1,
  },
  dayButton: {
    width: "14.2857%",
    aspectRatio: 0.86,
    padding: 2,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  daySelected: {
    borderWidth: 2,
    borderColor: colors.text,
  },
  dayToday: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: "800",
  },
  dayAmount: {
    fontSize: 10,
    fontWeight: "800",
    marginTop: 3,
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 16,
  },
  legendText: {
    color: colors.muted,
    fontSize: 11,
  },
  legendBox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1,
  },
  detail: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 14,
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  detailTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
  },
  detailMeta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3,
  },
  detailAmount: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: "800",
  },
  transactionStack: {
    gap: 8,
  },
  summaryBlock: {
    borderRadius: 8,
    backgroundColor: colors.cardSoft,
    padding: 10,
    gap: 8,
    marginBottom: 8,
  },
  summaryTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  summaryLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  transactionRow: {
    borderRadius: 8,
    backgroundColor: colors.cardSoft,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  transactionName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  transactionMeta: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  transactionAmount: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  empty: {
    color: colors.muted,
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 12,
  },
})
