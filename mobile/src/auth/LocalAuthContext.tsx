import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import * as SQLite from "expo-sqlite"

export interface LocalUser {
  id: number
  username: string
  createdAt: string
}

interface UserRow {
  id: number
  username: string
  password: string
  created_at: string
}

interface LocalAuthContextValue {
  user: LocalUser | null
  isReady: boolean
  isLoading: boolean
  signIn: (username: string, password: string) => Promise<void>
  signUp: (username: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const LocalAuthContext = createContext<LocalAuthContextValue | null>(null)
const dbPromise = SQLite.openDatabaseAsync("capsaai.db")

function normalizeUsername(username: string) {
  return username.trim().toLowerCase()
}

function mapUser(row: UserRow): LocalUser {
  return {
    id: row.id,
    username: row.username,
    createdAt: row.created_at,
  }
}

async function getDb() {
  const db = await dbPromise
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS local_session (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      user_id INTEGER NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `)
  return db
}

export function LocalAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let active = true

    getDb()
      .then(async (db) => {
        const row = await db.getFirstAsync<UserRow>(
          `SELECT users.id, users.username, users.password, users.created_at
           FROM local_session
           INNER JOIN users ON users.id = local_session.user_id
           WHERE local_session.id = 1
           LIMIT 1`
        )
        if (active && row) setUser(mapUser(row))
      })
      .catch((error) => {
        console.error("No se pudo inicializar la base local de usuarios", error)
      })
      .finally(() => {
        if (active) setIsReady(true)
      })

    return () => {
      active = false
    }
  }, [])

  async function signIn(username: string, password: string) {
    setIsLoading(true)
    try {
      const normalizedUsername = normalizeUsername(username)
      if (!normalizedUsername || !password) {
        throw new Error("Ingresa usuario y contrasena.")
      }
      const db = await getDb()
      const row = await db.getFirstAsync<UserRow>(
        "SELECT id, username, password, created_at FROM users WHERE username = ? AND password = ? LIMIT 1",
        normalizedUsername,
        password
      )

      if (!row) {
        throw new Error("Usuario o contrasena incorrectos.")
      }

      setUser(mapUser(row))
      await db.runAsync(
        "INSERT OR REPLACE INTO local_session (id, user_id, updated_at) VALUES (1, ?, CURRENT_TIMESTAMP)",
        row.id
      )
    } finally {
      setIsLoading(false)
    }
  }

  async function signUp(username: string, password: string) {
    setIsLoading(true)
    try {
      const normalizedUsername = normalizeUsername(username)
      if (!normalizedUsername || !password) {
        throw new Error("Ingresa usuario y contrasena.")
      }
      const db = await getDb()
      await db.runAsync("INSERT INTO users (username, password) VALUES (?, ?)", normalizedUsername, password)

      const row = await db.getFirstAsync<UserRow>(
        "SELECT id, username, password, created_at FROM users WHERE username = ? LIMIT 1",
        normalizedUsername
      )

      if (!row) {
        throw new Error("El usuario se creo, pero no se pudo iniciar la sesion.")
      }

      setUser(mapUser(row))
      await db.runAsync(
        "INSERT OR REPLACE INTO local_session (id, user_id, updated_at) VALUES (1, ?, CURRENT_TIMESTAMP)",
        row.id
      )
    } catch (error) {
      if (error instanceof Error && error.message.includes("UNIQUE")) {
        throw new Error("Ese usuario ya existe.")
      }
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  async function signOut() {
    const db = await getDb()
    await db.runAsync("DELETE FROM local_session WHERE id = 1")
    setUser(null)
  }

  const value = useMemo(
    () => ({ user, isReady, isLoading, signIn, signUp, signOut }),
    [user, isReady, isLoading]
  )

  return <LocalAuthContext.Provider value={value}>{children}</LocalAuthContext.Provider>
}

export function useLocalAuth() {
  const context = useContext(LocalAuthContext)
  if (!context) {
    throw new Error("useLocalAuth debe usarse dentro de LocalAuthProvider.")
  }
  return context
}
