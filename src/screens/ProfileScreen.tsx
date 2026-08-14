import { Pressable, StyleSheet, Text, View } from "react-native"
import { useLocalAuth } from "../auth/LocalAuthContext"
import { AppRoute } from "../components/BottomTabs"
import { Card, cardStyles } from "../components/Card"
import { AppIcon } from "../components/Icon"
import { IconBadge } from "../components/IconBadge"
import { ProgressBar } from "../components/ProgressBar"
import { Screen, SectionTitle } from "../components/Screen"
import {
  BudgetPlan,
  CapsaDashboardData,
  TransactionRecord,
  budgetTypes,
  formatCurrency,
} from "../data/capsa-data"
import { colors } from "../theme"

interface ProfileScreenProps {
  data: CapsaDashboardData
  onNavigate: (tab: AppRoute) => void
}

function getBudgetSpent(budget: BudgetPlan, transactions: TransactionRecord[]) {
  if (budget.type === "category" && budget.category) {
    return transactions.filter((tx) => tx.category === budget.category).reduce((sum, tx) => sum + tx.amount, 0)
  }
  if (budget.type === "card" && budget.cardLastFour) {
    return transactions.filter((tx) => tx.card.includes(budget.cardLastFour ?? "")).reduce((sum, tx) => sum + tx.amount, 0)
  }
  return transactions.reduce((sum, tx) => sum + tx.amount, 0)
}

export function ProfileScreen({ data, onNavigate }: ProfileScreenProps) {
  const { budgets, linkedCards, profileSettings, spendingSummary, transactions } = data
  const { user, signOut } = useLocalAuth()
  const mainBudget = budgets.find((budget) => budget.type === "monthly_total") ?? budgets[0]
  const spent = mainBudget ? getBudgetSpent(mainBudget, transactions) : spendingSummary.totalSpend
  const budgetAmount = mainBudget?.amount ?? profileSettings.monthlyBudget
  const budgetProgress = budgetAmount > 0 ? Math.round((spent / budgetAmount) * 100) : 0
  const displayName = spendingSummary.user || user?.username || "usuario"
  const displayEmail = "Usuario local de desarrollo"

  return (
    <Screen
      title="Perfil"
      right={
        <Pressable style={styles.logoutButton} onPress={() => signOut()}>
          <Text style={styles.logoutText}>Salir</Text>
        </Pressable>
      }
    >
      <Card>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{displayName.slice(0, 1).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.itemTitle}>{displayName}</Text>
            <Text style={styles.bodySmall}>{displayEmail}</Text>
          </View>
        </View>
      </Card>

      <SectionTitle title="Presupuesto" />
      <Card>
        <View style={cardStyles.row}>
          <View>
            <Text style={styles.muted}>{mainBudget?.name ?? "Objetivo mensual"}</Text>
            <Text style={styles.hero}>{formatCurrency(budgetAmount)}</Text>
          </View>
          <IconBadge icon="target" />
        </View>
        <View style={styles.progressWrap}>
          <ProgressBar value={budgetProgress} />
        </View>
        <Text style={styles.body}>
          {formatCurrency(spent)} gastado. Alertar cuando llegue al {mainBudget?.alertThreshold ?? profileSettings.alertThreshold}% del objetivo.
        </Text>
      </Card>

      <Pressable style={styles.manageBudgets} onPress={() => onNavigate("presupuesto")}>
        <View style={styles.row}>
          <IconBadge icon="target" size={38} />
          <View>
            <Text style={styles.itemTitle}>Administrar presupuestos</Text>
            <Text style={styles.bodySmall}>General, categoria, tarjeta, esenciales o variables</Text>
          </View>
        </View>
        <AppIcon name="chevron-right" color={colors.muted} size={20} />
      </Pressable>

      <SectionTitle title="Presupuestos activos" aside={`${budgets.length}`} />
      <View style={styles.stack}>
        {budgets.slice(0, 3).map((budget) => {
          const typeLabel = budgetTypes.find((item) => item.type === budget.type)?.label ?? budget.type
          return (
            <Card key={budget.id} style={styles.cardRowPadding}>
              <View style={cardStyles.row}>
                <View>
                  <Text style={styles.itemTitle}>{budget.name}</Text>
                  <Text style={styles.bodySmall}>{typeLabel}</Text>
                </View>
                <Text style={styles.cardUse}>{formatCurrency(budget.amount)}</Text>
              </View>
            </Card>
          )
        })}
      </View>

      <SectionTitle title="Tarjetas" />
      <View style={styles.stack}>
        {linkedCards.map((card) => (
          <Card key={card.lastFour} style={styles.cardRowPadding}>
            <View style={cardStyles.row}>
              <View style={styles.row}>
                <IconBadge icon="credit-card" size={38} />
                <View>
                  <Text style={styles.itemTitle}>{card.name}</Text>
                  <Text style={styles.bodySmall}>terminada en {card.lastFour}</Text>
                </View>
              </View>
              <Text style={styles.cardUse}>{card.bestFor}</Text>
            </View>
          </Card>
        ))}
      </View>

      <SectionTitle title="Preferencias" />
      <Card style={styles.listCard}>
        {[
          ["Promos geolocalizadas", profileSettings.locationPromos],
          ["Detectar gasto duplicado", profileSettings.duplicateDetection],
          ["Alertas de patron", profileSettings.patternAlerts],
        ].map(([label, enabled], index) => (
          <View key={String(label)} style={[styles.preferenceRow, index > 0 && styles.divider]}>
            <View style={styles.row}>
              <IconBadge icon="sliders-horizontal" size={38} />
              <Text style={styles.itemTitle}>{label}</Text>
            </View>
            <View style={[styles.switchTrack, enabled ? styles.switchOn : styles.switchOff]}>
              <View style={[styles.switchThumb, enabled ? styles.switchThumbOn : styles.switchThumbOff]} />
            </View>
          </View>
        ))}
      </Card>

      <Card>
        <View style={styles.privacyRow}>
          <IconBadge icon="shield-check" size={40} />
          <View style={styles.flex}>
            <Text style={styles.itemTitle}>Privacidad</Text>
            <Text style={styles.body}>{profileSettings.privacyStatus}</Text>
          </View>
        </View>
      </Card>
    </Screen>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  stack: {
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#06120c",
    fontSize: 20,
    fontWeight: "900",
  },
  muted: {
    color: colors.muted,
    fontSize: 12,
  },
  body: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
  },
  bodySmall: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  itemTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  hero: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
    marginTop: 5,
  },
  progressWrap: {
    marginTop: 18,
  },
  cardRowPadding: {
    padding: 12,
  },
  cardUse: {
    color: colors.muted,
    fontSize: 12,
    maxWidth: 110,
    textAlign: "right",
  },
  listCard: {
    padding: 0,
    overflow: "hidden",
  },
  preferenceRow: {
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  switchTrack: {
    width: 42,
    height: 26,
    borderRadius: 999,
    padding: 4,
  },
  switchOn: {
    backgroundColor: colors.primary,
  },
  switchOff: {
    backgroundColor: colors.cardSoft,
  },
  switchThumb: {
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: colors.background,
  },
  switchThumbOn: {
    marginLeft: 16,
  },
  switchThumbOff: {
    marginLeft: 0,
  },
  privacyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  logoutButton: {
    minHeight: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "900",
  },
  manageBudgets: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
})
