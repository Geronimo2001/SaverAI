import { config } from "dotenv"
import type { Client, Pool, PoolClient } from "pg"

export const testDatabaseName = "capsaai_quality_test"
export const testDatabaseMarker = "CapsaAI quality TP: isolated synthetic test database"

export function assertTestDatabaseUrl(value: string | undefined) {
  if (!value) throw new Error("Falta TEST_DATABASE_URL. Copiar .env.test.example a .env.test.local.")
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error("TEST_DATABASE_URL no es una URL valida.")
  }
  if (!["postgres:", "postgresql:"].includes(url.protocol)) {
    throw new Error("La base de pruebas debe usar PostgreSQL.")
  }
  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    throw new Error("Las pruebas de esta etapa requieren un servidor local explicito.")
  }
  if (decodeURIComponent(url.pathname.slice(1)) !== testDatabaseName || url.search || url.hash) {
    throw new Error("Destino rechazado: usar exclusivamente capsaai_quality_test sin parametros adicionales.")
  }
  return url.toString()
}

export function getTestDatabaseUrl() {
  // No cargar .env: DATABASE_URL nunca debe ser el fallback de una prueba.
  config({ path: ".env.test.local", quiet: true })
  return assertTestDatabaseUrl(process.env.TEST_DATABASE_URL)
}

export async function verifyTestDatabase(client: Client | Pool | PoolClient) {
  const result = await client.query<{ name: string; marker: string | null }>(`
    SELECT current_database() AS name,
      shobj_description(oid, 'pg_database') AS marker
    FROM pg_database WHERE datname = current_database()
  `)
  if (result.rows[0]?.name !== testDatabaseName || result.rows[0]?.marker !== testDatabaseMarker) {
    throw new Error("Base sin identificacion de pruebas: se cancela antes de ejecutar migraciones o fixtures.")
  }
}
