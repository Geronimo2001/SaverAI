import { NextResponse } from "next/server"
import { getCapsaPredictionData } from "@/lib/capsa-db"
import { getDateFromPeriodKey } from "@/lib/capsa-data"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const period = new URL(request.url).searchParams.get("period")
    const data = await getCapsaPredictionData(getDateFromPeriodKey(period))
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo calcular la prediccion de gasto."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
