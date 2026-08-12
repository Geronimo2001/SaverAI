import { ReactNode } from "react"
import { StyleSheet, View, ViewStyle } from "react-native"
import { colors } from "../theme"

interface CardProps {
  children: ReactNode
  style?: ViewStyle | ViewStyle[]
}

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>
}

export function SoftBox({ children, style }: CardProps) {
  return <View style={[styles.soft, style]}>{children}</View>
}

export const cardStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
})

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 16,
  },
  soft: {
    borderRadius: 8,
    backgroundColor: colors.cardSoft,
    padding: 12,
  },
})
