import { NextResponse } from "next/server"
import { createCapsaBudget } from "@/lib/capsa-db"
import type { BudgetType } from "@/lib/capsa-data"

export const dynamic = "force-dynamic"

const VALID_TYPES = new Set<BudgetType>(["monthly_total", "category", "card", "essential", "discretionary"])

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const type = String(body.type ?? "") as BudgetType
    const amount = Number(body.amount)
    const alertThreshold = Math.min(Math.max(Number(body.alertThreshold) || 85, 1), 100)

    if (!VALID_TYPES.has(type)) {
      return NextResponse.json({ error: "Tipo de presupuesto invalido." }, { status: 400 })
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "El monto debe ser mayor a cero." }, { status: 400 })
    }

    const data = await createCapsaBudget({
      id: body.id ? String(body.id).trim() : undefined,
      name: body.name ? String(body.name).trim() : undefined,
      type,
      amount,
      category: body.category ? String(body.category).trim() : undefined,
      cardLastFour: body.cardLastFour ? String(body.cardLastFour).trim() : undefined,
      alertThreshold,
      periodKey: body.periodKey ? String(body.periodKey).trim() : undefined,
    })
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo registrar el presupuesto."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
