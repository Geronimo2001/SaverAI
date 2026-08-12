import { useCallback, useEffect, useState } from "react"
import { StatusBar } from "expo-status-bar"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context"
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native"
import { LocalAuthProvider } from "./src/auth/LocalAuthContext"
import { AppRoute, BottomTabs, MainTab } from "./src/components/BottomTabs"
import { AlertsScreen } from "./src/screens/AlertsScreen"
import { AuthGate } from "./src/screens/AuthScreen"
import { BudgetsScreen } from "./src/screens/BudgetsScreen"
import { ExpensesScreen } from "./src/screens/ExpensesScreen"
import { HomeScreen } from "./src/screens/HomeScreen"
import { ManualExpenseScreen } from "./src/screens/ManualExpenseScreen"
import { NearbyScreen } from "./src/screens/NearbyScreen"
import { ProfileScreen } from "./src/screens/ProfileScreen"
import { createCapsaBudget, createCapsaTransaction, fetchCapsaDashboard } from "./src/data/capsa-api"
import {
  CapsaDashboardData,
  CreateBudgetInput,
  CreateTransactionInput,
  isFuturePeriodKey,
  shiftPeriodKey,
} from "./src/data/capsa-data"
import { colors } from "./src/theme"

export default function App() {
  return (
    <SafeAreaProvider>
      <LocalAuthProvider>
        <AuthGate>
          <FinanceApp />
        </AuthGate>
      </LocalAuthProvider>
    </SafeAreaProvider>
  )
}

function FinanceApp() {
  const [activeTab, setActiveTab] = useState<AppRoute>("inicio")
  const [dashboard, setDashboard] = useState<CapsaDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = useCallback(async (periodKey?: string) => {
    try {
      setError(null)
      const nextDashboard = await fetchCapsaDashboard(periodKey)
      setDashboard(nextDashboard)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudo cargar CapsaAI.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  function goMain(tab: MainTab) {
    setActiveTab(tab)
  }

  async function createTransaction(transaction: CreateTransactionInput) {
    try {
      setSaving(true)
      setError(null)
      const nextDashboard = await createCapsaTransaction({
        ...transaction,
        periodKey: dashboard?.currentMonth.periodKey,
      })
      setDashboard(nextDashboard)
      setActiveTab("gastos")
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "No se pudo guardar el gasto.")
    } finally {
      setSaving(false)
    }
  }

  async function createBudget(budget: CreateBudgetInput) {
    try {
      setSaving(true)
      setError(null)
      const nextDashboard = await createCapsaBudget({
        ...budget,
        periodKey: dashboard?.currentMonth.periodKey,
      })
      setDashboard(nextDashboard)
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "No se pudo guardar el presupuesto.")
      throw createError
    } finally {
      setSaving(false)
    }
  }

  async function changeDashboardMonth(offset: number) {
    if (!dashboard) return

    const nextPeriodKey = shiftPeriodKey(dashboard.currentMonth.periodKey, offset)
    if (offset > 0 && isFuturePeriodKey(nextPeriodKey)) return

    try {
      setSaving(true)
      setError(null)
      const nextDashboard = await fetchCapsaDashboard(nextPeriodKey)
      setDashboard(nextDashboard)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudo cargar ese mes.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <View style={styles.stateScreen}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.stateTitle}>Cargando CapsaAI</Text>
          <Text style={styles.stateBody}>Leyendo datos desde la base de datos.</Text>
        </View>
        <StatusBar style="light" />
      </SafeAreaView>
    )
  }

  if (!dashboard) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <View style={styles.stateScreen}>
          <Text style={styles.stateTitle}>No se pudo cargar la base</Text>
          <Text style={styles.stateBody}>{error ?? "Revisá que el backend Next esté corriendo."}</Text>
          <Pressable style={styles.retryButton} onPress={() => void loadDashboard()}>
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        </View>
        <StatusBar style="light" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        {activeTab === "inicio" ? (
          <HomeScreen
            data={dashboard}
            onNavigate={setActiveTab}
            onMonthChange={changeDashboardMonth}
            canGoNext={!isFuturePeriodKey(shiftPeriodKey(dashboard.currentMonth.periodKey, 1))}
            monthLoading={saving}
          />
        ) : null}
        {activeTab === "gastos" ? (
          <ExpensesScreen
            data={dashboard}
            onNavigate={setActiveTab}
            onMonthChange={changeDashboardMonth}
            canGoNext={!isFuturePeriodKey(shiftPeriodKey(dashboard.currentMonth.periodKey, 1))}
            monthLoading={saving}
          />
        ) : null}
        {activeTab === "cerca" ? <NearbyScreen nearbyPromos={dashboard.nearbyPromos} /> : null}
        {activeTab === "alertas" ? <AlertsScreen alerts={dashboard.alerts} onNavigate={setActiveTab} /> : null}
        {activeTab === "perfil" ? <ProfileScreen data={dashboard} onNavigate={setActiveTab} /> : null}
        {activeTab === "nuevo-gasto" ? (
          <ManualExpenseScreen
            categories={dashboard.categories}
            linkedCards={dashboard.linkedCards}
            onBack={() => setActiveTab("gastos")}
            onCreate={createTransaction}
            saving={saving}
          />
        ) : null}
        {activeTab === "presupuesto" ? (
          <BudgetsScreen
            data={dashboard}
            onBack={() => setActiveTab("inicio")}
            onCreate={createBudget}
            saving={saving}
          />
        ) : null}
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        <BottomTabs activeTab={activeTab} onChange={goMain} />
        <StatusBar style="light" />
      </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  stateScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  stateTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 14,
    textAlign: "center",
  },
  stateBody: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: {
    color: "#06120c",
    fontWeight: "800",
  },
  errorBanner: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 86,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 138, 91, 0.45)",
    backgroundColor: "rgba(255, 138, 91, 0.14)",
    padding: 10,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "700",
  },
})
