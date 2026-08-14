import { Pressable, StyleSheet, Text, View } from "react-native"
import { AppRoute } from "../components/BottomTabs"
import { CalendarHeatmap } from "../components/CalendarHeatmap"
import { Card, cardStyles } from "../components/Card"
import { AppIcon } from "../components/Icon"
import { IconBadge } from "../components/IconBadge"
import { Screen, SectionTitle } from "../components/Screen"
import {
  CapsaDashboardData,
  formatCurrency,
  getCategory,
} from "../data/capsa-data"
import { colors } from "../theme"

interface ExpensesScreenProps {
  data: CapsaDashboardData
  onNavigate: (tab: AppRoute) => void
  onMonthChange: (offset: number) => void
  canGoNext: boolean
  monthLoading?: boolean
}

export function ExpensesScreen({ data, onNavigate, onMonthChange, canGoNext, monthLoading = false }: ExpensesScreenProps) {
  const { calendarDays, categories, currentMonth, linkedCards, spendingSummary, transactions } = data
  const topDay = calendarDays.reduce((max, day) => (day.amount > max.amount ? day : max), calendarDays[0])

  return (
    <Screen
      title="Gastos"
      right={
        <Pressable style={styles.addButton} onPress={() => onNavigate("nuevo-gasto")}>
          <AppIcon name="receipt-text" color="#06120c" size={20} />
        </Pressable>
      }
    >
      <Pressable style={styles.primaryAction} onPress={() => onNavigate("nuevo-gasto")}>
        <View style={styles.primaryIcon}>
          <AppIcon name="receipt-text" color={colors.primary} size={22} strokeWidth={2.4} />
        </View>
        <Text style={styles.primaryActionText}>Cargar gasto</Text>
        <AppIcon name="chevron-right" color="#06120c" size={20} />
      </Pressable>

      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Text style={styles.muted}>Mayor dia</Text>
          <Text style={styles.statValue}>{topDay.date} {currentMonth.shortName}</Text>
          <Text style={styles.primary}>{formatCurrency(topDay.amount)}</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.muted}>Promedio diario</Text>
          <Text style={styles.statValue}>{formatCurrency(spendingSummary.dailyAverage)}</Text>
          <Text style={styles.muted}>segun patron actual</Text>
        </Card>
      </View>

      <CalendarHeatmap
        month={currentMonth.month}
        year={currentMonth.year}
        days={calendarDays}
        cards={linkedCards}
        categories={categories}
        onMonthChange={onMonthChange}
        canGoNext={canGoNext}
        loading={monthLoading}
      />

      <SectionTitle title="Categorias disponibles" />
      <View style={styles.categoryWrap}>
        {categories.map((category) => (
          <View key={category.key} style={styles.categoryPill}>
            <IconBadge icon={category.icon} color={category.color} size={30} />
            <Text style={styles.categoryText}>{category.label}</Text>
          </View>
        ))}
      </View>

      <SectionTitle title="Transacciones" aside={`${transactions.length} recientes`} />
      <View style={styles.transactionStack}>
        {transactions.map((transaction) => {
          const category = getCategory(categories, transaction.category)

          return (
            <Card key={transaction.id} style={styles.transactionCard}>
              <View style={cardStyles.row}>
                <View style={styles.transactionLeft}>
                  <IconBadge icon={category.icon} color={category.color} size={40} />
                  <View style={styles.transactionText}>
                    <Text style={styles.transactionName} numberOfLines={1}>{transaction.merchant}</Text>
                    <Text style={styles.transactionMeta} numberOfLines={1}>{category.label} / {transaction.card} / {transaction.time}</Text>
                  </View>
                </View>
                <Text style={styles.transactionAmount}>-{formatCurrency(transaction.amount)}</Text>
              </View>
            </Card>
          )
        })}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    minHeight: 92,
  },
  muted: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  statValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
    marginTop: 5,
  },
  primary: {
    color: colors.primary,
    fontSize: 12,
    marginTop: 3,
  },
  categoryWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryPill: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  transactionStack: {
    gap: 10,
  },
  transactionCard: {
    padding: 12,
  },
  transactionLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  transactionText: {
    flex: 1,
  },
  transactionName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  transactionMeta: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 3,
  },
  transactionAmount: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryAction: {
    minHeight: 58,
    borderRadius: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  primaryIcon: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: "#07120d",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryActionText: {
    flex: 1,
    color: "#06120c",
    fontSize: 18,
    fontWeight: "900",
  },
})
