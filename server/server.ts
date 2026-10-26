import { getConfig } from "./config.js"
import { pool } from "./db.js"
import { createCapsaServer } from "./app.js"

const config = getConfig()
const server = createCapsaServer(config.webhookSecret)

server.listen(config.port, () => {
  console.log(`CapsaAI backend listening on http://localhost:${config.port}`)
})

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)

async function shutdown() {
  server.close()
  await pool.end()
  process.exit(0)
}
