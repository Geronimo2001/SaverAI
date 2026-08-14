import { Pressable, StyleSheet, Text, View } from "react-native"
import { AppRoute } from "../components/BottomTabs"
import { Card } from "../components/Card"
import { AppIcon } from "../components/Icon"
import { IconBadge } from "../components/IconBadge"
import { Screen } from "../components/Screen"
import { AlertView } from "../data/capsa-data"
import { colors } from "../theme"

const toneBySeverity: Record<string, { border: string; background: string; color: string }> = {
  Alta: { border: "rgba(255, 138, 91, 0.42)", background: "rgba(255, 138, 91, 0.1)", color: colors.danger },
  Media: { border: "rgba(245, 197, 66, 0.38)", background: "rgba(245, 197, 66, 0.1)", color: colors.warning },
  Oportunidad: { border: "rgba(94, 230, 168, 0.38)", background: "rgba(94, 230, 168, 0.1)", color: colors.primary },
}

interface AlertsScreenProps {
  alerts: AlertView[]
  onNavigate: (tab: AppRoute) => void
}

export function AlertsScreen({ alerts, onNavigate }: AlertsScreenProps) {
  return (
    <Screen title="Alertas">
      <Card>
        <Text style={styles.muted}>Estado de gasto</Text>
        <Text style={styles.hero}>{alerts.length} eventos requieren revision</Text>
        <Text style={styles.body}>Priorizadas por impacto en objetivo, duplicados y oportunidad cercana.</Text>
      </Card>

      <View style={styles.stack}>
        {alerts.map((alert) => {
          const tone = toneBySeverity[alert.severity] ?? toneBySeverity.Media

          return (
            <View key={alert.title} style={[styles.alertCard, { borderColor: tone.border, backgroundColor: tone.background }]}>
              <IconBadge icon={alert.icon} color={tone.color} backgroundColor="rgba(15, 21, 18, 0.42)" size={42} />
              <View style={styles.alertContent}>
                <View style={styles.alertHeader}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={[styles.severity, { color: tone.color }]}>{alert.severity}</Text>
                </View>
                <Text style={styles.body}>{alert.detail}</Text>
                <Text style={styles.time}>{alert.time}</Text>
              </View>
            </View>
          )
        })}
      </View>

      <Pressable style={styles.reviewCard} onPress={() => onNavigate("gastos")}>
        <View>
          <Text style={styles.itemTitle}>Revisar transacciones</Text>
          <Text style={styles.bodySmall}>Ver calendario y detalle por categoria</Text>
        </View>
        <AppIcon name="chevron-right" color={colors.muted} size={20} />
      </Pressable>
    </Screen>
  )
}

const styles = StyleSheet.create({
  stack: {
    gap: 10,
  },
  muted: {
    color: colors.muted,
    fontSize: 12,
  },
  body: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  bodySmall: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  hero: {
    color: colors.text,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    marginTop: 4,
  },
  alertCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    gap: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  alertTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  severity: {
    fontSize: 11,
    fontWeight: "800",
  },
  time: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 10,
  },
  reviewCard: {
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
  itemTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
})
