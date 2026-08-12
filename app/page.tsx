import { HomeDashboard } from "@/components/dashboard/home-dashboard"
import { getCapsaDashboardData } from "@/lib/capsa-db"
import { getDateFromPeriodKey, isFuturePeriodKey, shiftPeriodKey } from "@/lib/capsa-data"

export const dynamic = "force-dynamic"

interface HomePageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const period = firstParam(resolvedSearchParams.period)
  const data = await getCapsaDashboardData(getDateFromPeriodKey(period))
  const previousPeriod = shiftPeriodKey(data.currentMonth.periodKey, -1)
  const nextPeriod = shiftPeriodKey(data.currentMonth.periodKey, 1)

  return (
    <HomeDashboard
      data={data}
      previousHref={`/?period=${previousPeriod}`}
      nextHref={`/?period=${nextPeriod}`}
      canGoNext={!isFuturePeriodKey(nextPeriod)}
    />
  )
}
