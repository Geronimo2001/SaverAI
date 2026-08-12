import { Pressable, StyleSheet, Text, View } from "react-native"
import { AppIcon, IconName } from "./Icon"
import { colors, shadow } from "../theme"

export type MainTab = "inicio" | "gastos" | "presupuesto" | "alertas" | "perfil"
export type AppRoute = MainTab | "nuevo-gasto" | "cerca"
export type AppTab = AppRoute

const tabs: { id: MainTab; label: string; icon: IconName }[] = [
  { id: "inicio", label: "Inicio", icon: "home" },
  { id: "gastos", label: "Gastos", icon: "pie-chart" },
  { id: "presupuesto", label: "Presupuesto", icon: "target" },
  { id: "alertas", label: "Alertas", icon: "bell" },
  { id: "perfil", label: "Perfil", icon: "user" },
]

interface BottomTabsProps {
  activeTab: AppRoute
  onChange: (tab: MainTab) => void
}

export function BottomTabs({ activeTab, onChange }: BottomTabsProps) {
  return (
    <View style={styles.shell}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id

        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            style={styles.item}
          >
            <View style={[styles.iconBox, isActive && styles.iconBoxActive]}>
              <AppIcon name={tab.icon} color={isActive ? colors.primary : colors.muted} size={20} strokeWidth={isActive ? 2.7 : 2.1} />
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]} numberOfLines={1}>
              {tab.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  shell: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    minHeight: 72,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
    paddingVertical: 8,
    ...shadow,
  },
  item: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  iconBox: {
    width: 34,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  iconBoxActive: {
    backgroundColor: colors.primaryDark,
  },
  label: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "600",
  },
  labelActive: {
    color: colors.primary,
  },
})
