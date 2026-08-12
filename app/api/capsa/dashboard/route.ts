import { NextResponse } from "next/server"
import { getCapsaDashboardData } from "@/lib/capsa-db"
import { getDateFromPeriodKey } from "@/lib/capsa-data"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const period = new URL(request.url).searchParams.get("period")
    const data = await getCapsaDashboardData(getDateFromPeriodKey(period))
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo cargar CapsaAI desde la base de datos."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
