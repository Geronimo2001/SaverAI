import { createServer } from "http"
import { getConfig } from "./config.js"
import { readJsonBody, sendJson, verifyWebhookSignature } from "./http.js"
import { validateConfirmedBotExpensePayload } from "./confirmed-expense-validation.js"
import { createConfirmedWhatsappExpense } from "./expenses-repository.js"
import { pool } from "./db.js"
import { handleReadRequest } from "./read-routes.js"
import { handleWhatsappUndo } from "./whatsapp-undo-route.js"

const config = getConfig()

const server = createServer(async (request, response) => {
  try {
    if (request.method === "GET" && request.url === "/health") {
      sendJson(response, 200, { status: "ok" })
      return
    }

    if (await handleReadRequest(request, response)) {
      return
    }

    if (await handleWhatsappUndo(request, response, config.webhookSecret)) {
      return
    }

    if (request.method !== "POST" || request.url !== "/webhooks/whatsapp/expenses/confirmed") {
      sendJson(response, 404, { status: "not_found" })
      return
    }

    const { rawBody, body } = await readJsonBody(request)
    if (!verifyWebhookSignature(rawBody, request.headers["x-capsa-signature"], config.webhookSecret)) {
      sendJson(response, 401, { status: "unauthorized" })
      return
    }

    if (!body) {
      sendJson(response, 400, { status: "invalid_json" })
      return
    }

    const validation = validateConfirmedBotExpensePayload(body)
    if (validation.valid === false) {
      sendJson(response, 422, {
        status: "invalid",
        action: "show_errors",
        errors: validation.errors,
      })
      return
    }

    const result = await createConfirmedWhatsappExpense(validation.payload)
    const statusCode = result.status === "created" ? 201 : result.status === "duplicate" ? 200 : 422
    sendJson(response, statusCode, result)
  } catch (error) {
    console.error(error)
    sendJson(response, 500, { status: "error" })
  }
})

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
