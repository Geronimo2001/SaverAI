import { Pool, PoolClient } from "pg"
import { getConfig } from "./config.js"

const config = getConfig()

export const pool = new Pool({
  connectionString: config.databaseUrl,
})

export async function withTransaction<T>(callback: (client: PoolClient) => Promise<T>) {
  const client = await pool.connect()

  try {
    await client.query("BEGIN")
    const result = await callback(client)
    await client.query("COMMIT")
    return result
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}
