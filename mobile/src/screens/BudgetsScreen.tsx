import { useMemo, useState } from "react"
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native"
import { Card, cardStyles } from "../components/Card"
import { AppIcon } from "../components/Icon"
import { ProgressBar } from "../components/ProgressBar"
import { PrimaryButton } from "../components/PrimaryButton"
import { Screen, SectionTitle } from "../components/Screen"
import {
  BudgetPlan,
  BudgetType,
  CapsaDashboardData,
  CategoryKey,
  CreateBudgetInput,
  TransactionRecord,
  budgetTypes,
  formatCurrency,
  getCategory,
} from "../data/capsa-data"
import { colors } from "../theme"

interface BudgetsScreenProps {
  data: CapsaDashboardData
  onBack: () => void
  onCreate: (budget: CreateBudgetInput) => void | Promise<void>
  saving?: boolean
}

function parseAmount(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, "")
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? Math.round(parsed) : 0
}

function getBudgetSpent(budget: BudgetPlan, transactions: TransactionRecord[]) {
  if (budget.type === "category" && budget.category) {
    return transactions.filter((tx) => tx.category === budget.category).reduce((sum, tx) => sum + tx.amount, 0)
  }
  if (budget.type === "card" && budget.cardLastFour) {
    return transactions.filter((tx) => tx.card.includes(budget.cardLastFour ?? "")).reduce((sum, tx) => sum + tx.amount, 0)
  }
  if (budget.type === "essential") {
    return transactions
      .filter((tx) => ["super", "transporte", "servicios", "hogar"].includes(tx.category))
      .reduce((sum, tx) => sum + tx.amount, 0)
  }
  if (budget.type === "discretionary") {
    return transactions
      .filter((tx) => ["comida", "cafe", "compras"].includes(tx.category))
      .reduce((sum, tx) => sum + tx.amount, 0)
  }
  return transactions.reduce((sum, tx) => sum + tx.amount, 0)
}

export function BudgetsScreen({ data, onBack, onCreate, saving = false }: BudgetsScreenProps) {
  const { budgets, categories, linkedCards, transactions } = data
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [type, setType] = useState<BudgetType>("monthly_total")
  const [category, setCategory] = useState<CategoryKey>(() => categories[0]?.key ?? "")
  const [cardLastFour, setCardLastFour] = useState(() => linkedCards[0]?.lastFour ?? "")
  const [threshold, setThreshold] = useState("85")
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null)
  const parsedAmount = useMemo(() => parseAmount(amount), [amount])
  const parsedThreshold = Math.min(Math.max(Number(threshold) || 85, 1), 100)
  const canSubmit =
    parsedAmount > 0 &&
    (type !== "category" || category.length > 0) &&
    (type !== "card" || cardLastFour.length > 0)

  function resetForm() {
    setEditingBudgetId(null)
    setName("")
    setAmount("")
    setType("monthly_total")
    setCategory(categories[0]?.key ?? "")
    setCardLastFour(linkedCards[0]?.lastFour ?? "")
    setThreshold("85")
  }

  function startEdit(budget: BudgetPlan) {
    setEditingBudgetId(budget.id)
    setName(budget.name)
    setAmount(String(Math.round(budget.amount)))
    setType(budget.type)
    setCategory(budget.category ?? categories[0]?.key ?? "")
    setCardLastFour(budget.cardLastFour ?? linkedCards[0]?.lastFour ?? "")
    setThreshold(String(budget.alertThreshold))
  }

  async function submit() {
    if (!canSubmit) return
    const selectedType = budgetTypes.find((item) => item.type === type)
    const selectedCard = linkedCards.find((card) => card.lastFour === cardLastFour)
    const selectedCategory = getCategory(categories, category)

    try {
      await onCreate({
        id: editingBudgetId ?? undefined,
        name:
          name.trim() ||
          (type === "category"
            ? selectedCategory.label
            : type === "card"
              ? selectedCard?.name ?? "Tarjeta"
              : selectedType?.label ?? "Presupuesto"),
        type,
        amount: parsedAmount,
        category: type === "category" ? category : undefined,
        cardLastFour: type === "card" ? cardLastFour : undefined,
        alertThreshold: parsedThreshold,
      })

      resetForm()
    } catch {
      // El banner global muestra el error; mantenemos el formulario intacto.
    }
  }

  return (
    <Screen
      title="Presupuestos"
      right={
        <Pressable onPress={onBack} style={styles.closeButton}>
          <AppIcon name="chevron-right" color={colors.muted} size={20} />
        </Pressable>
      }
    >
      <SectionTitle title="Activos" aside={`${budgets.length} configurados`} />
      <View style={styles.stack}>
        {budgets.map((budget) => {
          const spent = getBudgetSpent(budget, transactions)
          const progress = budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0
          const typeLabel = budgetTypes.find((item) => item.type === budget.type)?.label ?? budget.type

          return (
            <Card key={budget.id}>
              <View style={cardStyles.row}>
                <View style={styles.flex}>
                  <Text style={styles.itemTitle}>{budget.name}</Text>
                  <Text style={styles.bodySmall}>{typeLabel} / alerta al {budget.alertThreshold}%</Text>
                </View>
                <View style={styles.budgetActions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Editar ${budget.name}`}
                    onPress={() => startEdit(budget)}
                    style={styles.editButton}
                  >
                    <AppIcon name="pencil" color={colors.primary} size={16} />
                  </Pressable>
                  <Text style={[styles.progressText, progress >= budget.alertThreshold && styles.warning]}>{progress}%</Text>
                </View>
              </View>
              <View style={styles.progressWrap}>
                <ProgressBar value={progress} />
              </View>
              <View style={styles.amountRow}>
                <Text style={styles.bodySmall}>{formatCurrency(spent)} gastado</Text>
                <Text style={styles.bodySmall}>objetivo {formatCurrency(budget.amount)}</Text>
              </View>
            </Card>
          )
        })}
      </View>

      <SectionTitle title={editingBudgetId ? "Editar presupuesto" : "Crear presupuesto"} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Card style={styles.form}>
          {editingBudgetId ? (
            <View style={styles.editingBanner}>
              <Text style={styles.editingText}>Editando presupuesto activo</Text>
              <Pressable onPress={resetForm} style={styles.cancelEditButton}>
                <Text style={styles.cancelEditText}>Cancelar</Text>
              </Pressable>
            </View>
          ) : null}
          <Text style={styles.help}>
            Defini el tipo de presupuesto y la cantidad deseada a gastar. Se compara contra gastos manuales y futuros consumos.
          </Text>

          <Text style={styles.label}>Tipo de presupuesto</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
            {budgetTypes.map((item) => {
              const selected = item.type === type
              return (
                <Pressable key={item.type} onPress={() => setType(item.type)} style={[styles.pill, selected && styles.pillActive]}>
                  <Text style={[styles.pillText, selected && styles.pillTextActive]}>{item.label}</Text>
                </Pressable>
              )
            })}
          </ScrollView>
          <Text style={styles.bodySmall}>{budgetTypes.find((item) => item.type === type)?.detail}</Text>

          {type === "category" ? (
            <>
              <Text style={styles.label}>Categoria</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
                {categories.map((item) => {
                  const selected = item.key === category
                  return (
                    <Pressable key={item.key} onPress={() => setCategory(item.key)} style={[styles.pill, selected && styles.pillActive]}>
                      <Text style={[styles.pillText, selected && styles.pillTextActive]}>{item.label}</Text>
                    </Pressable>
                  )
                })}
              </ScrollView>
            </>
          ) : null}

          {type === "card" ? (
            <>
              <Text style={styles.label}>Tarjeta</Text>
              <View style={styles.cardOptions}>
                {linkedCards.map((item) => {
                  const selected = item.lastFour === cardLastFour
                  return (
                    <Pressable key={item.lastFour} onPress={() => setCardLastFour(item.lastFour)} style={[styles.option, selected && styles.optionActive]}>
                      <Text style={styles.optionTitle}>{item.name}</Text>
                      <Text style={styles.optionMeta}>terminada en {item.lastFour}</Text>
                    </Pressable>
                  )
                })}
              </View>
            </>
          ) : null}

          <Text style={styles.label}>Nombre opcional</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Ej: Supermercado mensual"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />

          <Text style={styles.label}>Cantidad deseada a gastar</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="$ 0"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />

          <Text style={styles.label}>Umbral de alerta (%)</Text>
          <TextInput
            value={threshold}
            onChangeText={setThreshold}
            keyboardType="number-pad"
            placeholder="85"
            placeholderTextColor={colors.muted}
            style={styles.input}
            maxLength={3}
          />

          <PrimaryButton
            label={saving ? "Guardando..." : editingBudgetId ? "Guardar cambios" : "Guardar presupuesto"}
            onPress={submit}
            disabled={!canSubmit || saving}
          />
        </Card>
      </KeyboardAvoidingView>
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
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "180deg" }],
  },
  itemTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  bodySmall: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  progressText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "900",
  },
  budgetActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  editButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  warning: {
    color: colors.warning,
  },
  progressWrap: {
    marginTop: 12,
  },
  amountRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  form: {
    gap: 12,
  },
  help: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  editingBanner: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primaryDark,
    backgroundColor: "rgba(94, 230, 168, 0.12)",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  editingText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  cancelEditButton: {
    minHeight: 32,
    borderRadius: 8,
    backgroundColor: colors.card,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelEditText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardSoft,
    color: colors.text,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  pills: {
    gap: 8,
    paddingRight: 20,
  },
  pill: {
    minHeight: 38,
    borderRadius: 999,
    backgroundColor: colors.cardSoft,
    paddingHorizontal: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  pillActive: {
    backgroundColor: colors.primary,
  },
  pillText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "800",
  },
  pillTextActive: {
    color: "#06120c",
  },
  cardOptions: {
    gap: 8,
  },
  option: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardSoft,
    padding: 12,
  },
  optionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryDark,
  },
  optionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  optionMeta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3,
  },
})
