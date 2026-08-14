import { readFile } from "fs/promises"
import { join } from "path"
import { pool } from "./db.js"

async function main() {
  const migration = await readFile(join(process.cwd(), "server", "migrations", "001_init.sql"), "utf8")
  await pool.query(migration)
  await pool.end()
  console.log("Database migrated.")
}

main().catch(async (error) => {
  console.error(error)
  await pool.end()
  process.exit(1)
})
