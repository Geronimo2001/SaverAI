import { BottomNav } from "@/components/dashboard/bottom-nav"
import { formatCurrency } from "@/lib/capsa-data"
import { getCapsaDashboardData } from "@/lib/capsa-db"
import { MapPin, Navigation, Sparkles } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function CercaPage() {
  const { nearbyPromos } = await getCapsaDashboardData()
  const bestPromo = nearbyPromos[0]

  return (
    <main className="min-h-screen bg-background pb-28 text-foreground md:pb-10 md:pl-24">
      <div className="mx-auto max-w-md md:grid md:max-w-5xl md:grid-cols-12 md:gap-5 md:px-8">
        <header className="sticky top-0 z-40 bg-background/92 px-5 pb-3 pt-4 backdrop-blur md:static md:col-span-12 md:bg-transparent md:px-0 md:pb-1 md:pt-8 md:backdrop-blur-none">
          <p className="text-xs text-muted-foreground">CapsaAI</p>
          <h1 className="text-xl font-semibold md:text-3xl">Cerca</h1>
        </header>

        <section className="px-5 pt-2 md:col-span-5 md:px-0 md:pt-0">
          <div className="rounded-lg border border-border bg-card p-4 md:sticky md:top-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Mejor decision cercana</p>
                <h2 className="mt-1 text-2xl font-semibold">{bestPromo?.place ?? "Sin promos activas"}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {bestPromo ? `${bestPromo.distance} · ${bestPromo.category}` : "La DB no tiene promociones vigentes para hoy."}
                </p>
              </div>
              <span className="flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <MapPin className="size-6" />
              </span>
            </div>
            <div className="mt-4 rounded-lg bg-secondary p-3">
              <p className="text-sm font-medium">{bestPromo ? `${bestPromo.benefit} con ${bestPromo.card}` : "Sin recomendacion"}</p>
              <p className="mt-1 text-xs text-muted-foreground">{bestPromo?.reason ?? "Cargá promociones vigentes o corré el seed actualizado."}</p>
            </div>
          </div>
        </section>

        <section className="px-5 pt-5 md:col-span-7 md:px-0 md:pt-0">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">Promociones detectadas</h2>
            <span className="text-xs text-muted-foreground">Radio 800 m</span>
          </div>
          <div className="space-y-2">
            {nearbyPromos.map((promo) => (
              <div key={promo.place} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{promo.place}</p>
                    <p className="text-xs text-muted-foreground">{promo.distance} · {promo.category}</p>
                  </div>
                  <p className="rounded-lg bg-primary/15 px-2 py-1 text-xs font-medium text-primary">{promo.benefit}</p>
                </div>
                <div className="mt-3 flex items-center gap-3 rounded-lg bg-secondary p-3">
                  <Sparkles className="size-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Usar {promo.card}</p>
                    <p className="text-xs text-muted-foreground">{promo.reason}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Navigation className="size-4" />
                    Ahorro estimado
                  </span>
                  <span className="font-semibold">{formatCurrency(promo.saving)}</span>
                </div>
              </div>
            ))}
            {nearbyPromos.length === 0 ? (
              <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
                No hay promociones vigentes en la base de datos para la fecha actual.
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <BottomNav activeTab="cerca" />
    </main>
  )
}
