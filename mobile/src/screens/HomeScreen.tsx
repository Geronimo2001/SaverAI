import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { AppRoute } from "../components/BottomTabs"
import { Card } from "../components/Card"
import { IconBadge } from "../components/IconBadge"
import { AppIcon } from "../components/Icon"
import { MiniTrendChart } from "../components/MiniTrendChart"
import { ProgressBar } from "../components/ProgressBar"
import { Screen } from "../components/Screen"
import { CapsaDashboardData, formatCurrency } from "../data/capsa-data"
import { colors } from "../theme"

interface HomeScreenProps {
  data: CapsaDashboardData
  onNavigate: (tab: AppRoute) => void
  onMonthChange?: (offset: number) => void | Promise<void>
  canGoNext?: boolean
  monthLoading?: boolean
}

export function HomeScreen({ data, onNavigate, onMonthChange, canGoNext = true, monthLoading = false }: HomeScreenProps) {
  const { nearbyPromos, spendingSummary } = data
  const [showContextPromo, setShowContextPromo] = useState(true)
  const [promoExpanded, setPromoExpanded] = useState(false)
  const budgetProgress = spendingSummary.budget > 0 ? Math.round((spendingSummary.totalSpend / spendingSummary.budget) * 100) : 0
  const available = Math.max(spendingSummary.budget - spendingSummary.totalSpend, 0)
  const status =
    spendingSummary.totalSpend > spendingSummary.budget
      ? "Presupuesto superado"
      : budgetProgress >= 85
        ? "Cerca del limite"
        : "Dentro del presupuesto"
  const contextPromo = nearbyPromos[0]

  return (
    <Screen
      title={`Hola, ${spendingSummary.user}`}
      subtitle="Resumen del mes"
      right={
        <Pressable style={styles.alertButton} onPress={() => onNavigate("alertas")} accessibilityLabel="Ver alertas">
          <AppIcon name="bell" color={colors.muted} size={20} />
          <View style={styles.alertDot} />
        </Pressable>
      }
    >
      <Pressable style={styles.primaryAction} onPress={() => onNavigate("nuevo-gasto")}>
        <View style={styles.primaryIcon}>
          <AppIcon name="receipt-text" color={colors.primary} size={26} strokeWidth={2.4} />
        </View>
        <Text style={styles.primaryActionText}>Cargar gasto</Text>
        <AppIcon name="chevron-right" color="#06120c" size={22} strokeWidth={2.6} />
      </Pressable>

      <Card style={styles.budgetCard}>
        <View style={styles.budgetHeader}>
          <Text style={styles.cardTitle}>Presupuesto mensual</Text>
          <Text style={styles.muted}>{spendingSummary.period}</Text>
        </View>
        <View style={styles.budgetBody}>
          <View style={styles.progressRing}>
            <Text style={styles.ringValue}>{budgetProgress}%</Text>
            <Text style={styles.ringLabel}>utilizado</Text>
          </View>
          <View style={styles.budgetNumbers}>
            <View style={styles.numberRow}>
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              <Text style={styles.numberLabel}>Gastado</Text>
              <Text style={styles.numberValue}>{formatCurrency(spendingSummary.totalSpend)}</Text>
            </View>
            <View style={styles.numberRow}>
              <View style={[styles.dot, { backgroundColor: colors.blue }]} />
              <Text style={styles.numberLabel}>Disponible</Text>
              <Text style={styles.numberValue}>{formatCurrency(available)}</Text>
            </View>
            <View style={styles.numberRow}>
              <View style={[styles.dot, { backgroundColor: colors.muted }]} />
              <Text style={styles.numberLabel}>Total</Text>
              <Text style={styles.numberValue}>{formatCurrency(spendingSummary.budget)}</Text>
            </View>
          </View>
        </View>
        <View style={styles.progressWrap}>
          <ProgressBar value={budgetProgress} />
        </View>
        <View style={styles.statusRow}>
          <View style={styles.statusIcon}>
            <AppIcon name="gauge" color="#06120c" size={18} strokeWidth={2.4} />
          </View>
          <Text style={styles.statusText}>{status}</Text>
        </View>
        <Pressable style={styles.budgetAction} onPress={() => onNavigate("presupuesto")}>
          <View style={styles.row}>
            <AppIcon name="target" color={colors.primary} size={18} />
            <Text style={styles.budgetActionText}>Administrar presupuesto</Text>
          </View>
          <AppIcon name="chevron-right" color={colors.primary} size={20} />
        </Pressable>
      </Card>

      <MiniTrendChart
        currentMonth={data.currentMonth}
        onMonthChange={onMonthChange}
        canGoNext={canGoNext}
        monthLoading={monthLoading}
        spendingForecast={data.spendingForecast}
        spendingSummary={data.spendingSummary}
        spendingTrend={data.spendingTrend}
      />

      {showContextPromo && contextPromo ? (
        <Pressable style={styles.contextCard} onPress={() => setPromoExpanded((current) => !current)}>
          <View style={styles.contextTop}>
            <View style={styles.contextIcon}>
              <AppIcon name="shopping-bag" color="#06120c" size={22} strokeWidth={2.5} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.contextTitle}>Estas en {contextPromo.place}</Text>
              <Text style={styles.contextMeta}>3 promos para tus compras habituales</Text>
              <Text style={styles.contextPayment}>Pagar con {contextPromo.card}</Text>
            </View>
            <Pressable
              onPress={() => setShowContextPromo(false)}
              accessibilityLabel="Descartar recomendacion"
              hitSlop={10}
              style={styles.dismissButton}
            >
              <Text style={styles.dismissText}>x</Text>
            </Pressable>
          </View>
          {promoExpanded ? (
            <View style={styles.contextDetails}>
              <Text style={styles.bodySmall}>{contextPromo.reason}</Text>
              <Text style={styles.primarySmall}>Ahorro estimado: {formatCurrency(contextPromo.saving)}</Text>
            </View>
          ) : null}
        </Pressable>
      ) : null}

      <Text style={styles.sectionText}>Acciones rapidas</Text>
      <View style={styles.quickGrid}>
        <Pressable style={styles.quickCard} onPress={() => onNavigate("nuevo-gasto")}>
          <IconBadge icon="receipt-text" />
          <View style={styles.quickCopy}>
            <Text style={styles.itemTitle}>Cargar gasto</Text>
            <Text style={styles.bodySmall}>Registro manual</Text>
          </View>
          <AppIcon name="chevron-right" color={colors.muted} size={20} />
        </Pressable>
        <Pressable style={styles.quickCard} onPress={() => onNavigate("gastos")}>
          <IconBadge icon="pie-chart" />
          <View style={styles.quickCopy}>
            <Text style={styles.itemTitle}>Ver ultimos gastos</Text>
            <Text style={styles.bodySmall}>Calendario y movimientos</Text>
          </View>
          <AppIcon name="chevron-right" color={colors.muted} size={20} />
        </Pressable>
        <Pressable style={styles.quickCard} onPress={() => onNavigate("presupuesto")}>
          <IconBadge icon="target" />
          <View style={styles.quickCopy}>
            <Text style={styles.itemTitle}>Categorias</Text>
            <Text style={styles.bodySmall}>Limites por rubro</Text>
          </View>
          <AppIcon name="chevron-right" color={colors.muted} size={20} />
        </Pressable>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  alertButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  alertDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.warning,
  },
  muted: {
    color: colors.muted,
    fontSize: 12,
  },
  bodySmall: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  primaryAction: {
    minHeight: 66,
    borderRadius: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  primaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "#07120d",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryActionText: {
    flex: 1,
    color: "#06120c",
    fontSize: 27,
    fontWeight: "900",
  },
  budgetCard: {
    padding: 0,
    borderRadius: 8,
    overflow: "hidden",
  },
  budgetHeader: {
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  budgetBody: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  progressRing: {
    width: 92,
    height: 92,
    borderRadius: 999,
    borderWidth: 10,
    borderColor: colors.primary,
    backgroundColor: colors.cardSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  ringValue: {
    color: colors.text,
    fontSize: 25,
    fontWeight: "900",
  },
  ringLabel: {
    color: colors.muted,
    fontSize: 11,
  },
  budgetNumbers: {
    flex: 1,
    gap: 11,
  },
  numberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 999,
  },
  numberLabel: {
    flex: 1,
    color: colors.muted,
    fontSize: 13,
  },
  numberValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  progressWrap: {
    paddingHorizontal: 16,
  },
  statusRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  statusIcon: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: "900",
  },
  budgetAction: {
    marginHorizontal: 16,
    marginBottom: 16,
    minHeight: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  budgetActionText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "800",
  },
  contextCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.card,
    padding: 14,
    gap: 12,
  },
  contextTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  contextIcon: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  contextTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  contextMeta: {
    color: colors.primary,
    fontSize: 13,
    marginTop: 4,
  },
  contextPayment: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 6,
    fontWeight: "700",
  },
  dismissButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  dismissText: {
    color: colors.text,
    fontSize: 24,
    lineHeight: 24,
  },
  contextDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    gap: 4,
  },
  sectionText: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
    marginTop: 4,
  },
  primarySmall: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  quickCard: {
    width: "48.5%",
    minHeight: 120,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 12,
    justifyContent: "space-between",
    gap: 10,
  },
  quickCopy: {
    gap: 4,
  },
  itemTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
})
