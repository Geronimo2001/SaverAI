import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import * as SQLite from "expo-sqlite"
import * as Crypto from "expo-crypto"
import { pbkdf2Async } from "@noble/hashes/pbkdf2.js"
import { sha256 } from "@noble/hashes/sha2.js"
import { bytesToHex } from "@noble/hashes/utils.js"

export interface LocalUser {
  id: number
  username: string
  createdAt: string
}

interface UserRow {
  id: number
  username: string
  password?: string | null
  password_hash?: string | null
  password_salt?: string | null
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
const passwordColumn = "password"
const passwordHashColumn = "password_hash"
const passwordSaltColumn = "password_salt"
const passwordHashAlgorithm = "pbkdf2-sha256"
const passwordHashIterations = 120_000

function normalizeUsername(username: string) {
  return username.trim().toLowerCase()
}

function validateCredentials(username: string, password: string) {
  if (!username || !password) {
    throw new Error("Ingresa usuario y contrasena.")
  }
  if (username.length < 3 || username.length > 40) {
    throw new Error("El usuario debe tener entre 3 y 40 caracteres.")
  }
  if (!/^[a-z0-9._-]+$/.test(username)) {
    throw new Error("El usuario solo puede usar letras, numeros, punto, guion y guion bajo.")
  }
  if (password.length < 8) {
    throw new Error("La contrasena debe tener al menos 8 caracteres.")
  }
}

async function createPasswordHash(password: string, salt?: string, iterations = passwordHashIterations) {
  const passwordSalt = salt ?? bytesToHex(await Crypto.getRandomBytesAsync(16))
  const derivedKey = await pbkdf2Async(sha256, password, passwordSalt, {
    c: iterations,
    dkLen: 32,
    asyncTick: 10,
  })
  const passwordHash = `${passwordHashAlgorithm}$${iterations}$${bytesToHex(derivedKey)}`

  return { passwordHash, passwordSalt }
}

async function createLegacyShaHash(password: string, salt: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${password}`)
}

function timingSafeEqual(first: string, second: string) {
  if (first.length !== second.length) return false

  let diff = 0
  for (let index = 0; index < first.length; index += 1) {
    diff |= first.charCodeAt(index) ^ second.charCodeAt(index)
  }

  return diff === 0
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
      password TEXT NOT NULL DEFAULT '',
      password_hash TEXT,
      password_salt TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS local_session (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      user_id INTEGER NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `)

  const columns = await db.getAllAsync<{ name: string }>("PRAGMA table_info(users)")
  const columnNames = new Set(columns.map((column) => column.name))
  if (!columnNames.has(passwordColumn)) {
    await db.execAsync("ALTER TABLE users ADD COLUMN password TEXT NOT NULL DEFAULT ''")
  }
  if (!columnNames.has(passwordHashColumn)) {
    await db.execAsync("ALTER TABLE users ADD COLUMN password_hash TEXT")
  }
  if (!columnNames.has(passwordSaltColumn)) {
    await db.execAsync("ALTER TABLE users ADD COLUMN password_salt TEXT")
  }

  return db
}

async function verifyPassword(row: UserRow, password: string) {
  if (row.password_hash && row.password_salt) {
    const [algorithm, iterationsText, storedHash] = row.password_hash.split("$")

    if (algorithm === passwordHashAlgorithm && iterationsText && storedHash) {
      const iterations = Number(iterationsText)
      if (!Number.isInteger(iterations) || iterations <= 0) return { valid: false, needsMigration: false }

      const { passwordHash } = await createPasswordHash(password, row.password_salt, iterations)
      return {
        valid: timingSafeEqual(passwordHash, row.password_hash),
        needsMigration: iterations !== passwordHashIterations,
      }
    }

    const legacyShaHash = await createLegacyShaHash(password, row.password_salt)
    return {
      valid: timingSafeEqual(legacyShaHash, row.password_hash),
      needsMigration: true,
    }
  }

  return { valid: row.password === password, needsMigration: true }
}

async function persistPasswordHash(db: SQLite.SQLiteDatabase, row: UserRow, password: string) {
  const { passwordHash, passwordSalt } = await createPasswordHash(password)
  await db.runAsync(
    "UPDATE users SET password = '', password_hash = ?, password_salt = ? WHERE id = ?",
    passwordHash,
    passwordSalt,
    row.id,
  )
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
          `SELECT users.id, users.username, users.password, users.password_hash, users.password_salt, users.created_at
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
      validateCredentials(normalizedUsername, password)

      const db = await getDb()
      const row = await db.getFirstAsync<UserRow>(
        "SELECT id, username, password, password_hash, password_salt, created_at FROM users WHERE username = ? LIMIT 1",
        normalizedUsername,
      )

      const verification = row ? await verifyPassword(row, password) : { valid: false, needsMigration: false }

      if (!row || !verification.valid) {
        throw new Error("Usuario o contrasena incorrectos.")
      }

      if (verification.needsMigration) {
        await persistPasswordHash(db, row, password)
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
      validateCredentials(normalizedUsername, password)

      const db = await getDb()
      const { passwordHash, passwordSalt } = await createPasswordHash(password)
      await db.runAsync(
        "INSERT INTO users (username, password, password_hash, password_salt) VALUES (?, '', ?, ?)",
        normalizedUsername,
        passwordHash,
        passwordSalt,
      )

      const row = await db.getFirstAsync<UserRow>(
        "SELECT id, username, password, password_hash, password_salt, created_at FROM users WHERE username = ? LIMIT 1",
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
