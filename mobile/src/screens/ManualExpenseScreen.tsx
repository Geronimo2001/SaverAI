import { useMemo, useState } from "react"
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native"
import { Card } from "../components/Card"
import { AppIcon } from "../components/Icon"
import { PrimaryButton } from "../components/PrimaryButton"
import { Screen, SectionTitle } from "../components/Screen"
import { CategoryKey, CategoryView, CreateTransactionInput, LinkedCard, toLocalISODate } from "../data/capsa-data"
import { colors } from "../theme"

interface ManualExpenseScreenProps {
  categories: CategoryView[]
  linkedCards: LinkedCard[]
  onBack: () => void
  onCreate: (transaction: CreateTransactionInput) => void | Promise<void>
  saving?: boolean
}

function parseAmount(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, "")
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? Math.round(parsed) : 0
}

const monthNames = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

const weekDays = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"]

function formatDateLabel(date: Date) {
  return `${date.getDate()} de ${monthNames[date.getMonth()]} de ${date.getFullYear()}`
}

function getCalendarCells(monthDate: Date) {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  return [
    ...Array.from({ length: adjustedFirstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => new Date(year, month, index + 1)),
  ]
}

function isSameDay(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  )
}

export function ManualExpenseScreen({ categories, linkedCards, onBack, onCreate, saving = false }: ManualExpenseScreenProps) {
  const [amount, setAmount] = useState("")
  const [merchant, setMerchant] = useState("")
  const [description, setDescription] = useState("")
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [category, setCategory] = useState<CategoryKey>(() => categories[0]?.key ?? "")
  const [card, setCard] = useState(() => linkedCards[0]?.lastFour ?? "")
  const parsedAmount = useMemo(() => parseAmount(amount), [amount])
  const calendarCells = useMemo(() => getCalendarCells(calendarMonth), [calendarMonth])
  const canSubmit = parsedAmount > 0 && merchant.trim().length >= 2 && category.length > 0 && card.length > 0

  function shiftCalendarMonth(offset: number) {
    setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1))
  }

  function selectDate(date: Date) {
    setSelectedDate(date)
    setCalendarMonth(date)
    setDatePickerOpen(false)
  }

  function submit() {
    if (!canSubmit) return
    onCreate({
      date: toLocalISODate(selectedDate),
      merchant: merchant.trim(),
      amount: parsedAmount,
      category,
      card,
      description: description.trim() || undefined,
    })
  }

  return (
    <Screen
      title="Nuevo gasto"
      right={
        <Pressable onPress={onBack} style={styles.closeButton}>
          <AppIcon name="chevron-right" color={colors.muted} size={20} />
        </Pressable>
      }
    >
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Card style={styles.form}>
          <Text style={styles.help}>
            Carga un consumo manual ingresando monto, comercio, categoria, fecha y medio de pago.
          </Text>

          <Text style={styles.label}>Monto deseado registrar</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="$ 0"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />

          <Text style={styles.label}>Comercio o descripcion corta</Text>
          <TextInput
            value={merchant}
            onChangeText={setMerchant}
            placeholder="Ej: Coto, YPF, Rappi"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />

          <Text style={styles.label}>Fecha</Text>
          <Pressable style={styles.dateButton} onPress={() => setDatePickerOpen(true)}>
            <View style={styles.dateTextWrap}>
              <Text style={styles.dateValue}>{formatDateLabel(selectedDate)}</Text>
              <Text style={styles.dateHint}>Tocar para cambiar en calendario</Text>
            </View>
            <AppIcon name="calendar-days" color={colors.primary} size={20} />
          </Pressable>

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

          <Text style={styles.label}>Medio de pago</Text>
          <View style={styles.cardOptions}>
            {linkedCards.map((item) => {
              const value = item.lastFour
              const selected = value === card
              return (
                <Pressable key={item.lastFour} onPress={() => setCard(value)} style={[styles.option, selected && styles.optionActive]}>
                  <Text style={styles.optionTitle}>{item.name}</Text>
                  <Text style={styles.optionMeta}>terminada en {item.lastFour}</Text>
                </Pressable>
              )
            })}
          </View>

          <Text style={styles.label}>Notas opcionales</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Detalle interno del gasto"
            placeholderTextColor={colors.muted}
            style={[styles.input, styles.textarea]}
            multiline
          />

          <PrimaryButton label={saving ? "Guardando..." : "Guardar gasto"} onPress={submit} disabled={!canSubmit || saving} />
        </Card>
      </KeyboardAvoidingView>

      <Modal transparent animationType="fade" visible={datePickerOpen} onRequestClose={() => setDatePickerOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.calendarModal}>
            <View style={styles.modalHeader}>
              <Pressable style={[styles.monthButton, styles.previousMonthButton]} onPress={() => shiftCalendarMonth(-1)} accessibilityLabel="Mes anterior">
                <AppIcon name="chevron-right" color={colors.text} size={20} />
              </Pressable>
              <View style={styles.modalTitleWrap}>
                <Text style={styles.modalTitle}>{monthNames[calendarMonth.getMonth()]}</Text>
                <Text style={styles.modalSubtitle}>{calendarMonth.getFullYear()}</Text>
              </View>
              <Pressable style={styles.monthButton} onPress={() => shiftCalendarMonth(1)} accessibilityLabel="Mes siguiente">
                <AppIcon name="chevron-right" color={colors.text} size={20} />
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {weekDays.map((dayName) => (
                <Text key={dayName} style={styles.weekDay}>{dayName}</Text>
              ))}
            </View>
            <View style={styles.calendarGrid}>
              {calendarCells.map((date, index) => {
                if (!date) return <View key={`empty-${index}`} style={styles.calendarCell} />
                const selected = isSameDay(date, selectedDate)
                const today = isSameDay(date, new Date())

                return (
                  <Pressable
                    key={date.toISOString()}
                    style={[styles.calendarDay, selected && styles.calendarDaySelected, today && !selected && styles.calendarDayToday]}
                    onPress={() => selectDate(date)}
                  >
                    <Text style={[styles.calendarDayText, selected && styles.calendarDayTextSelected]}>{date.getDate()}</Text>
                  </Pressable>
                )
              })}
            </View>

            <View style={styles.modalActions}>
              <Pressable style={styles.todayButton} onPress={() => selectDate(new Date())}>
                <Text style={styles.todayText}>Hoy</Text>
              </Pressable>
              <Pressable style={styles.cancelButton} onPress={() => setDatePickerOpen(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <SectionTitle title="Como se va a usar" />
      <View style={styles.infoGrid}>
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>Analisis</Text>
          <Text style={styles.infoText}>Impacta en dashboard, calendario, categorias y proyecciones.</Text>
        </Card>
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>Presupuesto</Text>
          <Text style={styles.infoText}>Se compara contra presupuestos generales, por categoria y por tarjeta.</Text>
        </Card>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
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
  form: {
    gap: 12,
  },
  help: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
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
  dateButton: {
    minHeight: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardSoft,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  dateTextWrap: {
    flex: 1,
    gap: 3,
  },
  dateValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  dateHint: {
    color: colors.muted,
    fontSize: 12,
  },
  textarea: {
    minHeight: 86,
    paddingTop: 12,
    textAlignVertical: "top",
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
  infoGrid: {
    flexDirection: "row",
    gap: 10,
  },
  infoCard: {
    flex: 1,
  },
  infoTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  infoText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 5,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.62)",
    justifyContent: "center",
    padding: 20,
  },
  calendarModal: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 16,
    gap: 14,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  modalTitleWrap: {
    alignItems: "center",
  },
  modalTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "900",
  },
  modalSubtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  monthButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  previousMonthButton: {
    transform: [{ rotate: "180deg" }],
  },
  weekRow: {
    flexDirection: "row",
  },
  weekDay: {
    flex: 1,
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarCell: {
    width: "14.2857%",
    aspectRatio: 1,
    padding: 3,
  },
  calendarDay: {
    width: "14.2857%",
    aspectRatio: 1,
    padding: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  calendarDaySelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  calendarDayToday: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryDark,
  },
  calendarDayText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  calendarDayTextSelected: {
    color: "#06120c",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
  },
  todayButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  todayText: {
    color: "#06120c",
    fontSize: 14,
    fontWeight: "900",
  },
  cancelButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
})
