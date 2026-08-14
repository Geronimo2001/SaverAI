import { useState } from "react"
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from "react-native"
import { useLocalAuth } from "../auth/LocalAuthContext"
import { Card } from "../components/Card"
import { PrimaryButton } from "../components/PrimaryButton"
import { colors } from "../theme"

type AuthMode = "sign-in" | "sign-up"

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message: unknown }).message)
  }
  return "No se pudo completar la operacion. Revisa los datos e intenta nuevamente."
}

export function AuthLoadingScreen() {
  return (
    <View style={styles.centerShell}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.loading}>Preparando base local...</Text>
    </View>
  )
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isReady, user } = useLocalAuth()

  if (!isReady) return <AuthLoadingScreen />
  if (!user) return <AuthScreen />

  return <>{children}</>
}

export function AuthScreen() {
  const { signIn, signUp, isLoading } = useLocalAuth()
  const [mode, setMode] = useState<AuthMode>("sign-in")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [localError, setLocalError] = useState<string | null>(null)

  async function handleSignIn() {
    setLocalError(null)
    try {
      await signIn(username, password)
    } catch (error) {
      setLocalError(getErrorMessage(error))
    }
  }

  async function handleSignUp() {
    setLocalError(null)
    try {
      await signUp(username, password)
    } catch (error) {
      setLocalError(getErrorMessage(error))
    }
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode)
    setPassword("")
    setLocalError(null)
  }

  const title = mode === "sign-in" ? "Iniciar sesion" : "Crear usuario"
  const cta = mode === "sign-in" ? "Entrar" : "Crear usuario"

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.shell}>
      <Card style={styles.card}>
        <Text style={styles.brand}>CapsaAI</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>
          Accede con un usuario local mientras la app esta en etapa temprana de desarrollo.
        </Text>

        <Text style={styles.label}>Usuario</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          value={username}
          onChangeText={setUsername}
          placeholder="geronimo"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
        <Text style={styles.label}>Contrasena</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Minimo 8 caracteres"
          placeholderTextColor={colors.muted}
          secureTextEntry
          style={styles.input}
        />

        {localError ? <Text style={styles.error}>{localError}</Text> : null}

        <PrimaryButton
          label={isLoading ? "Procesando..." : cta}
          onPress={mode === "sign-in" ? handleSignIn : handleSignUp}
          disabled={isLoading || !username.trim() || !password}
        />

        <PrimaryButton
          variant="ghost"
          label={mode === "sign-in" ? "No tengo usuario, crearlo" : "Ya tengo usuario, iniciar sesion"}
          onPress={() => switchMode(mode === "sign-in" ? "sign-up" : "sign-in")}
        />
      </Card>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: colors.background,
  },
  centerShell: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: colors.background,
  },
  card: {
    gap: 12,
  },
  brand: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "900",
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
  },
  body: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 4,
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
  error: {
    color: colors.danger,
    fontSize: 12,
    lineHeight: 17,
  },
  loading: {
    color: colors.muted,
    fontSize: 13,
    textAlign: "center",
    marginTop: 12,
  },
})
