import { ReactNode } from "react"
import { Pressable, StyleSheet, Text, ViewStyle } from "react-native"
import { colors } from "../theme"

interface PrimaryButtonProps {
  label: string
  onPress: () => void
  disabled?: boolean
  variant?: "primary" | "secondary" | "ghost"
  icon?: ReactNode
  style?: ViewStyle
}

export function PrimaryButton({ label, onPress, disabled, variant = "primary", icon, style }: PrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" && styles.primary,
        variant === "secondary" && styles.secondary,
        variant === "ghost" && styles.ghost,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {icon}
      <Text
        style={[
          styles.label,
          variant === "primary" && styles.primaryLabel,
          variant !== "primary" && styles.secondaryLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    minHeight: 46,
    borderRadius: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  disabled: {
    opacity: 0.48,
  },
  pressed: {
    opacity: 0.76,
  },
  label: {
    fontSize: 14,
    fontWeight: "800",
  },
  primaryLabel: {
    color: "#06120c",
  },
  secondaryLabel: {
    color: colors.primary,
  },
})

