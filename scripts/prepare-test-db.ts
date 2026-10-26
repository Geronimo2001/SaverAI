import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { Client } from "pg"
import { getTestDatabaseUrl, testDatabaseMarker, testDatabaseName, verifyTestDatabase } from "./test-database-config.js"

async function main() {
  const connectionString = getTestDatabaseUrl()
  const adminUrl = new URL(connectionString)
  adminUrl.pathname = "/postgres"
  const admin = new Client({ connectionString: adminUrl.toString(), connectionTimeoutMillis: 5000, query_timeout: 10_000 })
  try {
    await admin.connect()
    const existing = await admin.query<{ marker: string | null }>(
      "SELECT shobj_description(oid, 'pg_database') AS marker FROM pg_database WHERE datname = $1",
      [testDatabaseName],
    )
    if (existing.rows.length === 0) {
      // Nombre y comentario constantes; ninguna entrada del usuario se interpola en DDL.
      await admin.query("CREATE DATABASE capsaai_quality_test")
      await admin.query("COMMENT ON DATABASE capsaai_quality_test IS 'CapsaAI quality TP: isolated synthetic test database'")
      console.log("Base de pruebas creada: capsaai_quality_test.")
    } else if (existing.rows[0]?.marker !== testDatabaseMarker) {
      throw new Error("Ya existe capsaai_quality_test sin marca del TP. No se modifica.")
    }
  } finally {
    await admin.end()
  }

  const client = new Client({ connectionString, connectionTimeoutMillis: 5000, query_timeout: 10_000 })
  try {
    await client.connect()
    await verifyTestDatabase(client)
    const migration = await readFile(resolve("server/migrations/001_init.sql"), "utf8")
    await client.query("BEGIN")
    try {
      await client.query(migration)
      await client.query("COMMIT")
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    }
    console.log("Migracion aplicada solo a la base de pruebas. Base capsaai sin cambios.")
  } finally {
    await client.end()
  }
}

main().catch((error: unknown) => {
  const code = error && typeof error === "object" && "code" in error ? error.code : undefined
  console.error("No se pudo preparar la base de pruebas.", code ?? "", error instanceof Error ? error.message : "Error desconocido")
  process.exitCode = 1
})
