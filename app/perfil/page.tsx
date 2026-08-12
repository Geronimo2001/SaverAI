import { BottomNav } from "@/components/dashboard/bottom-nav"
import { getWebIcon } from "@/components/dashboard/web-icon"
import { formatCurrency } from "@/lib/capsa-data"
import { getCapsaDashboardData } from "@/lib/capsa-db"
import { CreditCard, SlidersHorizontal, Target } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function PerfilPage() {
  const { linkedCards, profileSettings, spendingSummary } = await getCapsaDashboardData()
  const PrivacyIcon = getWebIcon(profileSettings.privacyIcon)
  const budgetProgress =
    profileSettings.monthlyBudget > 0
      ? Math.round((spendingSummary.totalSpend / profileSettings.monthlyBudget) * 100)
      : 0

  return (
    <main className="min-h-screen bg-background pb-28 text-foreground md:pb-10 md:pl-24">
      <div className="mx-auto max-w-md md:grid md:max-w-5xl md:grid-cols-12 md:gap-5 md:px-8">
        <header className="sticky top-0 z-40 bg-background/92 px-5 pb-3 pt-4 backdrop-blur md:static md:col-span-12 md:bg-transparent md:px-0 md:pb-1 md:pt-8 md:backdrop-blur-none">
          <p className="text-xs text-muted-foreground">CapsaAI</p>
          <h1 className="text-xl font-semibold md:text-3xl">Perfil</h1>
        </header>

        <section className="px-5 pt-2 md:col-span-4 md:px-0 md:pt-0">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
            <div className="flex size-12 items-center justify-center rounded-lg bg-primary text-lg font-semibold text-primary-foreground">
              G
            </div>
            <div>
              <p className="font-medium">Geronimo</p>
              <p className="text-sm text-muted-foreground">Cuenta personal · Cordoba</p>
            </div>
          </div>
        </section>

        <section className="px-5 pt-5 md:col-span-8 md:px-0 md:pt-0">
          <h2 className="mb-3 text-base font-semibold">Presupuesto</h2>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Objetivo mensual</p>
                <p className="mt-1 text-2xl font-semibold">{formatCurrency(profileSettings.monthlyBudget)}</p>
              </div>
              <span className="flex size-10 items-center justify-center rounded-lg bg-secondary">
                <Target className="size-5 text-primary" />
              </span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.min(budgetProgress, 100)}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Alertar cuando el gasto llegue al {profileSettings.alertThreshold}% del objetivo.</p>
          </div>
        </section>

        <section className="px-5 pt-5 md:col-span-6 md:px-0">
          <h2 className="mb-3 text-base font-semibold">Tarjetas</h2>
          <div className="space-y-2">
            {linkedCards.map((card) => (
              <div key={card.lastFour} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-secondary">
                    <CreditCard className="size-4 text-primary" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">{card.name}</p>
                    <p className="text-xs text-muted-foreground">terminada en {card.lastFour}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{card.bestFor}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-5 pt-5 md:col-span-6 md:px-0">
          <h2 className="mb-3 text-base font-semibold">Preferencias</h2>
          <div className="rounded-lg border border-border bg-card">
            {[
              ["Promos geolocalizadas", profileSettings.locationPromos],
              ["Detectar gasto duplicado", profileSettings.duplicateDetection],
              ["Alertas de patron", profileSettings.patternAlerts],
            ].map(([label, enabled], index) => (
              <div key={String(label)} className={`flex items-center justify-between p-3 ${index > 0 ? "border-t border-border" : ""}`}>
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-secondary">
                    <SlidersHorizontal className="size-4 text-primary" />
                  </span>
                  <p className="text-sm font-medium">{label}</p>
                </div>
                <span className={`h-6 w-10 rounded-full p-1 ${enabled ? "bg-primary" : "bg-secondary"}`}>
                  <span className={`block size-4 rounded-full bg-background ${enabled ? "ml-4" : ""}`} />
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="px-5 pt-5 md:col-span-12 md:px-0">
          <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
            <PrivacyIcon className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="font-medium">Privacidad</p>
              <p className="mt-1 text-sm text-muted-foreground">{profileSettings.privacyStatus}</p>
            </div>
          </div>
        </section>
      </div>

      <BottomNav activeTab="perfil" />
    </main>
  )
}
