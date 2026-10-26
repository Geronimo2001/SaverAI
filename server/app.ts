import { createServer, type IncomingMessage, type ServerResponse } from "http"
import { readJsonBody, sendJson, verifyWebhookSignature } from "./http.js"
import { validateConfirmedBotExpensePayload } from "./confirmed-expense-validation.js"
import { createConfirmedWhatsappExpense } from "./expenses-repository.js"
import { handleReadRequest } from "./read-routes.js"
import { handleWhatsappUndo } from "./whatsapp-undo-route.js"

export async function handleCapsaRequest(request: IncomingMessage, response: ServerResponse, webhookSecret: string) {
  try {
    if (request.method === "GET" && request.url === "/health") {
      sendJson(response, 200, { status: "ok" })
      return
    }

    if (await handleReadRequest(request, response)) {
      return
    }

    if (await handleWhatsappUndo(request, response, webhookSecret)) {
      return
    }

    if (request.method !== "POST" || request.url !== "/webhooks/whatsapp/expenses/confirmed") {
      sendJson(response, 404, { status: "not_found" })
      return
    }

    const { rawBody, body } = await readJsonBody(request)
    if (!verifyWebhookSignature(rawBody, request.headers["x-capsa-signature"], webhookSecret)) {
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
    const statusCodes = { created: 201, duplicate: 200, invalid: 422 }
    sendJson(response, statusCodes[result.status], result)
  } catch (error) {
    console.error(error)
    sendJson(response, 500, { status: "error" })
  }
}

export function createCapsaServer(webhookSecret: string) {
  return createServer((request, response) => {
    void handleCapsaRequest(request, response, webhookSecret)
  })
}
