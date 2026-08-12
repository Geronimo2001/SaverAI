import { ReactNode } from "react"
import { ScrollView, StyleSheet, Text, View } from "react-native"
import { colors } from "../theme"

interface ScreenProps {
  title: string
  subtitle?: string
  right?: ReactNode
  children: ReactNode
}

export function Screen({ title, subtitle, right, children }: ScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>{subtitle ?? "CapsaAI"}</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
        {right}
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  )
}

export function SectionTitle({ title, aside }: { title: string; aside?: string }) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionText}>{title}</Text>
      {aside ? <Text style={styles.sectionAside}>{aside}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    minHeight: 64,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.background,
  },
  eyebrow: {
    color: colors.muted,
    fontSize: 12,
    marginBottom: 3,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 132,
    gap: 14,
  },
  sectionTitle: {
    marginBottom: -8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  sectionAside: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
  },
})
