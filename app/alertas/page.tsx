import Link from "next/link"
import { BottomNav } from "@/components/dashboard/bottom-nav"
import { getWebIcon } from "@/components/dashboard/web-icon"
import { getCapsaDashboardData } from "@/lib/capsa-db"
import { ChevronRight } from "lucide-react"

const toneBySeverity: Record<string, string> = {
  Alta: "border-[#ff8a5b]/40 bg-[#ff8a5b]/10 text-[#ffb090]",
  Media: "border-[#f5c542]/35 bg-[#f5c542]/10 text-[#f5c542]",
  Oportunidad: "border-primary/35 bg-primary/10 text-primary",
}

export const dynamic = "force-dynamic"

export default async function AlertasPage() {
  const { alerts } = await getCapsaDashboardData()

  return (
    <main className="min-h-screen bg-background pb-28 text-foreground md:pb-10 md:pl-24">
      <div className="mx-auto max-w-md md:grid md:max-w-5xl md:grid-cols-12 md:gap-5 md:px-8">
        <header className="sticky top-0 z-40 bg-background/92 px-5 pb-3 pt-4 backdrop-blur md:static md:col-span-12 md:bg-transparent md:px-0 md:pb-1 md:pt-8 md:backdrop-blur-none">
          <p className="text-xs text-muted-foreground">CapsaAI</p>
          <h1 className="text-xl font-semibold md:text-3xl">Alertas</h1>
        </header>

        <section className="px-5 pt-2 md:col-span-4 md:px-0 md:pt-0">
          <div className="rounded-lg border border-border bg-card p-4 md:sticky md:top-8">
            <p className="text-xs text-muted-foreground">Estado de gasto</p>
            <h2 className="mt-1 text-2xl font-semibold">{alerts.length} eventos requieren revision</h2>
            <p className="mt-2 text-sm text-muted-foreground">Priorizadas por impacto en objetivo, duplicados y oportunidad cercana.</p>
          </div>
        </section>

        <section className="px-5 pt-5 md:col-span-8 md:px-0 md:pt-0">
          <div className="space-y-2">
            {alerts.map((alert) => {
              const Icon = getWebIcon(alert.icon)
              const tone = toneBySeverity[alert.severity] ?? toneBySeverity.Media

              return (
                <article key={alert.title} className={`rounded-lg border p-4 ${tone}`}>
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background/40">
                      <Icon className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">{alert.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{alert.detail}</p>
                        </div>
                        <span className="shrink-0 text-[11px] font-medium">{alert.severity}</span>
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">{alert.time}</p>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section className="px-5 pt-5 md:col-span-8 md:col-start-5 md:px-0">
          <Link href="/gastos" className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
            <div>
              <p className="font-medium">Revisar transacciones</p>
              <p className="text-xs text-muted-foreground">Ver calendario y detalle por categoria</p>
            </div>
            <ChevronRight className="size-5 text-muted-foreground" />
          </Link>
        </section>
      </div>

      <BottomNav activeTab="alertas" />
    </main>
  )
}
