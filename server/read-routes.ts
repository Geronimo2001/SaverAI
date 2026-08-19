import { IncomingMessage, ServerResponse } from "http"
import { pool } from "./db.js"

/**
 * Endpoints de lectura del backend.
 *
 * El webhook de gastos confirmados solo escribe; sin estas rutas la app no
 * tiene forma de mostrar lo que carga el bot. Son de solo lectura y no tocan
 * las reglas de negocio.
 *
 *   GET /expenses?userId=whatsapp:+549...&period=YYYY-MM
 *   GET /categories
 *   GET /payment-methods?userId=whatsapp:+549...
 *
 * Incluyen CORS porque la app corre tambien en el navegador (react-native-web)
 * en otro puerto.
 */

const MAX_EXPENSES = 500

interface ExpenseReadRow {
  id: string
  amount: number
  merchant: string
  category_code: string
  card_label: string
  last_four: string
  spent_at: string
  description: string | null
  source: string
  external_message_id: string
  created_at: string
}

function applyCors(response: ServerResponse) {
  response.setHeader("access-control-allow-origin", "*")
  response.setHeader("access-control-allow-methods", "GET,OPTIONS")
  response.setHeader("access-control-allow-headers", "content-type")
}

function sendReadJson(response: ServerResponse, statusCode: number, body: unknown) {
  const payload = JSON.stringify(body)
  applyCors(response)
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
  })
  response.end(payload)
}

async function listExpenses(whatsappUserId: string, period: string | null) {
  const conditions = ["u.whatsapp_user_id = $1"]
  const params: unknown[] = [whatsappUserId]

  if (period && /^\d{4}-\d{2}$/.test(period)) {
    params.push(`${period}-01`)
    conditions.push(`date_trunc('month', e.spent_at) = date_trunc('month', $${params.length}::date)`)
  }

  const result = await pool.query<ExpenseReadRow>(
    `
      SELECT
        e.id,
        e.amount,
        e.merchant,
        e.category_code,
        pm.label AS card_label,
        pm.last_four,
        e.spent_at::text AS spent_at,
        e.description,
        e.source,
        e.external_message_id,
        e.created_at::text
      FROM expenses e
      INNER JOIN app_users u ON u.id = e.user_id
      INNER JOIN payment_methods pm ON pm.id = e.payment_method_id
      WHERE ${conditions.join(" AND ")}
      ORDER BY e.spent_at DESC, e.id DESC
      LIMIT ${MAX_EXPENSES}
    `,
    params,
  )

  return result.rows.map((row) => ({
    id: String(row.id),
    amount: Number(row.amount),
    merchant: row.merchant,
    category: row.category_code,
    cardLabel: row.card_label,
    cardLastFour: row.last_four,
    date: row.spent_at,
    description: row.description ?? undefined,
    source: row.source,
    externalMessageId: row.external_message_id,
    createdAt: row.created_at,
  }))
}

async function listCategories() {
  const result = await pool.query<{ code: string; label: string }>(
    "SELECT code, label FROM expense_categories ORDER BY label",
  )
  return result.rows
}

async function listPaymentMethods(whatsappUserId: string) {
  const result = await pool.query<{ label: string; last_four: string }>(
    `
      SELECT pm.label, pm.last_four
      FROM payment_methods pm
      INNER JOIN app_users u ON u.id = pm.user_id
      WHERE u.whatsapp_user_id = $1 AND pm.active = true
      ORDER BY pm.label
    `,
    [whatsappUserId],
  )
  return result.rows.map((row) => ({ label: row.label, lastFour: row.last_four }))
}

/**
 * Atiende las rutas de lectura. Devuelve true si la request fue manejada.
 */
export async function handleReadRequest(request: IncomingMessage, response: ServerResponse): Promise<boolean> {
  const url = new URL(request.url ?? "/", "http://localhost")

  if (request.method === "OPTIONS") {
    applyCors(response)
    response.writeHead(204)
    response.end()
    return true
  }

  if (request.method !== "GET") return false

  if (url.pathname === "/expenses") {
    const userId = url.searchParams.get("userId")
    if (!userId) {
      sendReadJson(response, 400, { status: "missing_user_id" })
      return true
    }

    sendReadJson(response, 200, { expenses: await listExpenses(userId, url.searchParams.get("period")) })
    return true
  }

  if (url.pathname === "/categories") {
    sendReadJson(response, 200, { categories: await listCategories() })
    return true
  }

  if (url.pathname === "/payment-methods") {
    const userId = url.searchParams.get("userId")
    if (!userId) {
      sendReadJson(response, 400, { status: "missing_user_id" })
      return true
    }

    sendReadJson(response, 200, { paymentMethods: await listPaymentMethods(userId) })
    return true
  }

  return false
}
