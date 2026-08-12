import { StyleSheet, View } from "react-native"
import { AppIcon, IconName } from "./Icon"
import { colors } from "../theme"

interface IconBadgeProps {
  icon: IconName | string
  color?: string
  backgroundColor?: string
  size?: number
}

export function IconBadge({ icon, color = colors.primary, backgroundColor = colors.cardSoft, size = 40 }: IconBadgeProps) {
  return (
    <View style={[styles.badge, { width: size, height: size, backgroundColor }]}>
      <AppIcon name={icon} color={color} size={Math.round(size * 0.48)} />
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
})

