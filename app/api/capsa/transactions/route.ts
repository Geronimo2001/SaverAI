import { NextResponse } from "next/server"
import { createCapsaTransaction } from "@/lib/capsa-db"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const amount = Number(body.amount)
    const merchant = String(body.merchant ?? "").trim()
    const category = String(body.category ?? "").trim()
    const card = String(body.card ?? "").trim()
    const date = String(body.date ?? "").trim()
    const description = body.description ? String(body.description).trim() : undefined
    const periodKey = body.periodKey ? String(body.periodKey).trim() : undefined

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "El monto debe ser mayor a cero." }, { status: 400 })
    }
    if (!merchant || !category || !card || !date) {
      return NextResponse.json({ error: "Faltan comercio, categoria, tarjeta o fecha." }, { status: 400 })
    }

    const data = await createCapsaTransaction({ amount, merchant, category, card, date, description, periodKey })
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo registrar el gasto."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
