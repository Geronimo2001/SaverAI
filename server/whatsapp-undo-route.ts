import { IncomingMessage, ServerResponse } from "http"
import { pool } from "./db.js"
import { readJsonBody, sendJson, verifyWebhookSignature } from "./http.js"

/**
 * Deshacer un gasto cargado por WhatsApp.
 *
 * El bot es un canal, no la autoridad: no escribe ni borra en la base. Cuando
 * el usuario dice "borralo" (porque el bot entendio mal o se arrepintio), el
 * bot manda un POST firmado y el backend elimina el gasto. Usa la MISMA firma
 * HMAC que el webhook de confirmados (`x-capsa-signature`).
 *
 *   POST /webhooks/whatsapp/expenses/deleted
 *   body: { userId: "whatsapp:+549...", externalMessageId: "wamid..." }
 *
 * Borra la fila de `expenses`; `whatsapp_processed_messages` se limpia solo por
 * ON DELETE CASCADE. Es scaffolding local para la demo (igual criterio que
 * `read-routes.ts`): idealmente seria un endpoint propio del backend.
 */

const PATH = "/webhooks/whatsapp/expenses/deleted"

interface DeletedRow {
  id: string
  amount: number
  merchant: string
  category_code: string
  external_message_id: string
}

async function deleteExpense(whatsappUserId: string, externalMessageId: string) {
  const result = await pool.query<DeletedRow>(
    `
      DELETE FROM expenses e
      USING app_users u
      WHERE e.user_id = u.id
        AND u.whatsapp_user_id = $1
        AND e.external_message_id = $2
      RETURNING e.id, e.amount, e.merchant, e.category_code, e.external_message_id
    `,
    [whatsappUserId, externalMessageId],
  )
  return result.rows[0] ?? null
}

/**
 * Atiende el borrado firmado. Devuelve true si la request fue manejada.
 */
export async function handleWhatsappUndo(
  request: IncomingMessage,
  response: ServerResponse,
  webhookSecret: string,
): Promise<boolean> {
  if (request.method !== "POST" || request.url !== PATH) return false

  const { rawBody, body } = await readJsonBody(request)
  if (!verifyWebhookSignature(rawBody, request.headers["x-capsa-signature"], webhookSecret)) {
    sendJson(response, 401, { status: "unauthorized" })
    return true
  }

  const payload = body as { userId?: unknown; externalMessageId?: unknown } | null
  const userId = typeof payload?.userId === "string" ? payload.userId : null
  const externalMessageId = typeof payload?.externalMessageId === "string" ? payload.externalMessageId : null
  if (!userId || !externalMessageId) {
    sendJson(response, 400, { status: "invalid", detail: "userId y externalMessageId son obligatorios" })
    return true
  }

  const deleted = await deleteExpense(userId, externalMessageId)
  if (!deleted) {
    sendJson(response, 404, { status: "not_found" })
    return true
  }

  sendJson(response, 200, {
    status: "deleted",
    expense: {
      id: Number(deleted.id),
      amount: Number(deleted.amount),
      merchant: deleted.merchant,
      category: deleted.category_code,
      externalMessageId: deleted.external_message_id,
    },
  })
  return true
}
