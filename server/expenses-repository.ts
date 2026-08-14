import { PoolClient } from "pg"
import { ConfirmedBotExpensePayload, ValidationError } from "./confirmed-expense-validation.js"
import { withTransaction } from "./db.js"

export type CreateExpenseResult =
  | {
      status: "created"
      action: "show_created"
      expense: StoredExpense
    }
  | {
      status: "invalid"
      action: "show_errors"
      errors: ValidationError[]
    }
  | {
      status: "duplicate"
      action: "ignore_duplicate"
      duplicateOfMessageId: string
      expense: StoredExpense
    }

export interface StoredExpense {
  id: number
  userId: string
  amount: number
  currency: "ARS"
  merchant: string
  category: string
  card: string
  date: string
  description?: string
  externalMessageId: string
  sourceMessageIds: string[]
}

interface ExpenseRow {
  id: string
  whatsapp_user_id: string
  amount: number
  currency: "ARS"
  merchant: string
  category_code: string
  card_last_four: string
  spent_at: string
  description: string | null
  external_message_id: string
  source_message_ids: string[]
}

export async function createConfirmedWhatsappExpense(payload: ConfirmedBotExpensePayload): Promise<CreateExpenseResult> {
  return withTransaction(async (client) => {
    const duplicate = await findDuplicateExpense(client, payload.sourceMessageIds)
    if (duplicate) {
      return {
        status: "duplicate",
        action: "ignore_duplicate",
        duplicateOfMessageId: duplicate.externalMessageId,
        expense: duplicate,
      }
    }

    const references = await validateReferences(client, payload)
    if (references.errors.length > 0) {
      return {
        status: "invalid",
        action: "show_errors",
        errors: references.errors,
      }
    }

    const expense = await insertExpense(client, payload, references.userId!, references.categoryCode!, references.paymentMethodId!)
    await insertProcessedMessages(client, payload.sourceMessageIds, references.userId!, expense.id)

    return {
      status: "created",
      action: "show_created",
      expense,
    }
  })
}

async function validateReferences(client: PoolClient, payload: ConfirmedBotExpensePayload) {
  const errors: ValidationError[] = []
  const userId = await findUserId(client, payload.userId)
  if (!userId) {
    errors.push(error("userId", "unknown_user", "El usuario de WhatsApp no esta vinculado a una cuenta."))
    return { errors }
  }

  const categoryCode = await findCategoryCode(client, payload.expense.category)
  if (!categoryCode) {
    errors.push(error("expense.category", "unknown_category", "La categoria no existe."))
  }

  const paymentMethodId = await findPaymentMethodId(client, userId, payload.expense.card)
  if (!paymentMethodId) {
    errors.push(error("expense.card", "unknown_payment_method", "El medio de pago no existe para este usuario."))
  }

  return { errors, userId, categoryCode, paymentMethodId }
}

async function findDuplicateExpense(client: PoolClient, messageIds: string[]) {
  if (messageIds.length === 0) return null

  const result = await client.query<ExpenseRow>(
    `
      SELECT
        e.id,
        u.whatsapp_user_id,
        e.amount,
        e.currency,
        e.merchant,
        e.category_code,
        pm.last_four AS card_last_four,
        e.spent_at::text,
        e.description,
        e.external_message_id,
        e.source_message_ids
      FROM whatsapp_processed_messages wpm
      INNER JOIN expenses e ON e.id = wpm.expense_id
      INNER JOIN app_users u ON u.id = e.user_id
      INNER JOIN payment_methods pm ON pm.id = e.payment_method_id
      WHERE wpm.message_id = ANY($1::text[])
      LIMIT 1
    `,
    [messageIds],
  )

  return result.rows[0] ? mapExpenseRow(result.rows[0]) : null
}

async function findUserId(client: PoolClient, whatsappUserId: string) {
  const result = await client.query<{ id: string }>("SELECT id FROM app_users WHERE whatsapp_user_id = $1 LIMIT 1", [whatsappUserId])
  return result.rows[0]?.id ? Number(result.rows[0].id) : null
}

async function findCategoryCode(client: PoolClient, category: string) {
  const result = await client.query<{ code: string }>(
    "SELECT code FROM expense_categories WHERE lower(code) = lower($1) OR lower(label) = lower($1) LIMIT 1",
    [category],
  )
  return result.rows[0]?.code ?? null
}

async function findPaymentMethodId(client: PoolClient, userId: number, card: string) {
  const result = await client.query<{ id: string }>(
    `
      SELECT id
      FROM payment_methods
      WHERE user_id = $1
        AND active = true
        AND (
          last_four = $2
          OR lower(label) = lower($2)
          OR lower(label) LIKE lower($3)
        )
      LIMIT 1
    `,
    [userId, card, `%${card}%`],
  )
  return result.rows[0]?.id ? Number(result.rows[0].id) : null
}

async function insertExpense(
  client: PoolClient,
  payload: ConfirmedBotExpensePayload,
  userId: number,
  categoryCode: string,
  paymentMethodId: number,
) {
  const result = await client.query<ExpenseRow>(
    `
      INSERT INTO expenses (
        user_id,
        amount,
        currency,
        merchant,
        category_code,
        payment_method_id,
        spent_at,
        description,
        source,
        external_message_id,
        source_message_ids,
        raw_payload
      )
      VALUES ($1, $2, 'ARS', $3, $4, $5, $6, $7, 'whatsapp', $8, $9, $10::jsonb)
      RETURNING
        id,
        (SELECT whatsapp_user_id FROM app_users WHERE id = user_id) AS whatsapp_user_id,
        amount,
        currency,
        merchant,
        category_code,
        (SELECT last_four FROM payment_methods WHERE id = payment_method_id) AS card_last_four,
        spent_at::text,
        description,
        external_message_id,
        source_message_ids
    `,
    [
      userId,
      payload.expense.amount,
      payload.expense.merchant,
      categoryCode,
      paymentMethodId,
      payload.expense.date,
      payload.expense.description,
      payload.messageId,
      payload.sourceMessageIds,
      JSON.stringify(payload),
    ],
  )

  return mapExpenseRow(result.rows[0]!)
}

async function insertProcessedMessages(client: PoolClient, messageIds: string[], userId: number, expenseId: number) {
  for (const messageId of messageIds) {
    await client.query(
      `
        INSERT INTO whatsapp_processed_messages (message_id, user_id, expense_id)
        VALUES ($1, $2, $3)
        ON CONFLICT (message_id) DO NOTHING
      `,
      [messageId, userId, expenseId],
    )
  }
}

function mapExpenseRow(row: ExpenseRow): StoredExpense {
  return {
    id: Number(row.id),
    userId: row.whatsapp_user_id,
    amount: row.amount,
    currency: row.currency,
    merchant: row.merchant,
    category: row.category_code,
    card: row.card_last_four,
    date: row.spent_at,
    description: row.description ?? undefined,
    externalMessageId: row.external_message_id,
    sourceMessageIds: row.source_message_ids,
  }
}

function error(field: string, code: string, detail: string): ValidationError {
  return { field, code, detail }
}
