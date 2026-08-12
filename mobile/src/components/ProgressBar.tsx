import { StyleSheet, View } from "react-native"
import { colors } from "../theme"

export function ProgressBar({ value }: { value: number }) {
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${Math.min(Math.max(value, 0), 100)}%` }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: colors.cardSoft,
  },
  fill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
})

