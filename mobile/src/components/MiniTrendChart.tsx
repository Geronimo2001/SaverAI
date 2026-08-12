import { useEffect, useMemo, useState } from "react"
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native"
import Svg, { Circle, G, Line, Polygon, Polyline, Rect, Text as SvgText } from "react-native-svg"
import { AppIcon } from "./Icon"
import { colors } from "../theme"
import {
  CurrentMonthMeta,
  SpendingForecastSummary,
  SpendingSummary,
  SpendingTrendPoint,
  formatCompact,
  formatCurrency,
  getMonthMetaFromPeriodKey,
  shiftPeriodKey,
} from "../data/capsa-data"

type ChartMode = "compact" | "detail"

interface ChartSize {
  width: number
  height: number
}

interface ChartPadding {
  top: number
  right: number
  bottom: number
  left: number
}

interface ChartPoint {
  day: number
  value: number
}

interface MiniTrendChartProps {
  currentMonth: CurrentMonthMeta
  onMonthChange?: (offset: number) => void | Promise<void>
  canGoNext?: boolean
  monthLoading?: boolean
  spendingForecast: SpendingForecastSummary
  spendingSummary: SpendingSummary
  spendingTrend: SpendingTrendPoint[]
}

const compactSize = { width: 320, height: 230 }
const compactPadding = { top: 18, right: 16, bottom: 34, left: 42 }
const detailPadding = { top: 28, right: 36, bottom: 48, left: 62 }

function chartPoint(day: number, value: number, maxValue: number, dayCount: number, size: ChartSize, padding: ChartPadding) {
  const innerWidth = size.width - padding.left - padding.right
  const innerHeight = size.height - padding.top - padding.bottom
  const dayDenominator = Math.max(dayCount - 1, 1)
  const x = padding.left + ((day - 1) / dayDenominator) * innerWidth
  const y = padding.top + innerHeight - (value / maxValue) * innerHeight
  return { x, y }
}

function pointsFor(values: ChartPoint[], maxValue: number, dayCount: number, size: ChartSize, padding: ChartPadding) {
  return values
    .map((item) => {
      const { x, y } = chartPoint(item.day, item.value, maxValue, dayCount, size, padding)
      return `${x},${y}`
    })
    .join(" ")
}

function rangePolygonFor(values: SpendingTrendPoint[], maxValue: number, dayCount: number, size: ChartSize, padding: ChartPadding) {
  const rangeValues = values.filter((item) => item.lowerBound !== null && item.upperBound !== null)
  if (rangeValues.length < 2) return ""

  const upper = rangeValues.map((item) => {
    const { x, y } = chartPoint(item.day, item.upperBound ?? 0, maxValue, dayCount, size, padding)
    return `${x},${y}`
  })
  const lower = [...rangeValues].reverse().map((item) => {
    const { x, y } = chartPoint(item.day, item.lowerBound ?? 0, maxValue, dayCount, size, padding)
    return `${x},${y}`
  })

  return [...upper, ...lower].join(" ")
}

function xLabelsFor(dayCount: number, mode: ChartMode) {
  if (mode === "compact") {
    return Array.from(new Set([1, Math.ceil(dayCount / 2), dayCount]))
  }

  return Array.from(new Set([1, 5, 10, 15, 20, 25, dayCount].filter((day) => day <= dayCount)))
}

function getCurrentTrendPoint(spendingForecast: SpendingForecastSummary, spendingTrend: SpendingTrendPoint[]) {
  return (
    spendingTrend.find((item) => item.day === spendingForecast.asOfDay) ??
    [...spendingTrend].reverse().find((item) => item.actual !== null) ??
    spendingTrend[0]
  )
}

export function MiniTrendChart({
  currentMonth,
  onMonthChange,
  canGoNext = true,
  monthLoading = false,
  spendingForecast,
  spendingSummary,
  spendingTrend,
}: MiniTrendChartProps) {
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState(spendingForecast.asOfDay)
  const { width: windowWidth, height: windowHeight } = useWindowDimensions()
  const currentPoint = getCurrentTrendPoint(spendingForecast, spendingTrend)
  const selectedPoint = spendingTrend.find((item) => item.day === selectedDay) ?? currentPoint
  const previousMonth = getMonthMetaFromPeriodKey(shiftPeriodKey(currentMonth.periodKey, -1))
  const nextMonth = getMonthMetaFromPeriodKey(shiftPeriodKey(currentMonth.periodKey, 1))
  const detailSurfaceWidth = Math.max(windowWidth, windowHeight)
  const detailSurfaceHeight = Math.min(windowWidth, windowHeight)
  const detailWidth = useMemo(
    () => Math.min(detailSurfaceWidth - 28, Math.max(600, currentMonth.daysInMonth * 16 + detailPadding.left + detailPadding.right)),
    [currentMonth.daysInMonth, detailSurfaceWidth],
  )
  const detailChartHeight = Math.max(210, detailSurfaceHeight - 158)

  useEffect(() => {
    setSelectedDay(spendingForecast.asOfDay)
  }, [spendingForecast.asOfDay, currentMonth.periodKey])

  return (
    <View style={styles.shell}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Prediccion mensual</Text>
          <Text style={styles.meta}>{spendingSummary.period} / confianza {spendingForecast.confidence}</Text>
        </View>
        <Text style={styles.closing}>{formatCompact(spendingForecast.projectedClosing)}</Text>
      </View>

      <View style={styles.monthSwitcher}>
        <Pressable
          style={[styles.monthButton, monthLoading ? styles.monthButtonDisabled : null]}
          onPress={() => void onMonthChange?.(-1)}
          disabled={!onMonthChange || monthLoading}
          accessibilityLabel={`Ver ${previousMonth.period}`}
        >
          <AppIcon name="chevron-left" color={colors.text} size={17} strokeWidth={2.6} />
          <Text style={styles.monthButtonText} numberOfLines={1}>{previousMonth.shortName} {previousMonth.year}</Text>
        </Pressable>
        <View style={styles.currentMonthPill}>
          <Text style={styles.currentMonthText} numberOfLines={1} adjustsFontSizeToFit>{currentMonth.month}</Text>
          <Text style={styles.currentMonthYear}>{currentMonth.year}</Text>
        </View>
        <Pressable
          style={[styles.monthButton, (!canGoNext || monthLoading) ? styles.monthButtonDisabled : null]}
          onPress={() => void onMonthChange?.(1)}
          disabled={!onMonthChange || !canGoNext || monthLoading}
          accessibilityLabel={`Ver ${nextMonth.period}`}
        >
          <Text style={styles.monthButtonText} numberOfLines={1}>{nextMonth.shortName} {nextMonth.year}</Text>
          <AppIcon name="chevron-right" color={canGoNext ? colors.text : colors.muted} size={17} strokeWidth={2.6} />
        </Pressable>
      </View>

      <View style={styles.summaryGrid}>
        <SummaryMetric label="Gasto actual" value={formatCompact(spendingSummary.totalSpend)} color={colors.primary} />
        <SummaryMetric label="Objetivo actual" value={formatCompact(currentPoint?.target ?? 0)} color={colors.blue} />
        <SummaryMetric label="Cierre proyectado" value={formatCompact(spendingForecast.projectedClosing)} color={colors.purple} />
      </View>

      <ForecastChartSvg
        mode="compact"
        size={compactSize}
        padding={compactPadding}
        currentMonth={currentMonth}
        spendingForecast={spendingForecast}
        spendingSummary={spendingSummary}
        spendingTrend={spendingTrend}
        selectedDay={currentPoint?.day}
      />

      <View style={styles.compactFooter}>
        <View style={styles.legend}>
          <LegendItem color={colors.primary} label="Real" variant="solid" />
          <LegendItem color={colors.blue} label="Objetivo" variant="dashed" />
          <LegendItem color={colors.purple} label="CapsaAI" variant="dotted" />
          <LegendItem color={colors.purple} label="Rango" variant="range" />
        </View>

        <Pressable style={styles.detailButton} onPress={() => setDetailOpen(true)} accessibilityLabel="Ver grafico en detalle">
          <AppIcon name="expand" color="#06120c" size={17} strokeWidth={2.6} />
          <Text style={styles.detailButtonText}>Ver en detalle</Text>
        </Pressable>
      </View>

      <Modal visible={detailOpen} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setDetailOpen(false)}>
        <View style={styles.modalRoot}>
          <View
            style={[
              styles.rotatedSurface,
              {
                width: detailSurfaceWidth,
                height: detailSurfaceHeight,
                left: (windowWidth - detailSurfaceWidth) / 2,
                top: (windowHeight - detailSurfaceHeight) / 2,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={styles.headerCopy}>
                <Text style={styles.modalTitle}>Evolucion del mes</Text>
                <Text style={styles.modalMeta}>{spendingSummary.period} / Dia {selectedPoint?.day ?? selectedDay}</Text>
              </View>
              <Pressable style={styles.closeButton} onPress={() => setDetailOpen(false)} accessibilityLabel="Cerrar detalle del grafico">
                <AppIcon name="x" color={colors.text} size={22} strokeWidth={2.5} />
              </Pressable>
            </View>

            <View style={styles.detailContent}>
              <View style={styles.chartFrame}>
                <ForecastChartSvg
                  mode="detail"
                  size={{ width: detailWidth, height: detailChartHeight }}
                  padding={detailPadding}
                  currentMonth={currentMonth}
                  spendingForecast={spendingForecast}
                  spendingSummary={spendingSummary}
                  spendingTrend={spendingTrend}
                  selectedDay={selectedPoint?.day}
                  onSelectDay={setSelectedDay}
                />
              </View>

              <View style={styles.detailLegend}>
                <LegendItem color={colors.primary} label="Real" variant="solid" />
                <LegendItem color={colors.blue} label="Objetivo" variant="dashed" />
                <LegendItem color={colors.purple} label="CapsaAI" variant="dotted" />
                <LegendItem color={colors.purple} label="Rango" variant="range" />
              </View>

              <View style={styles.detailMetricStrip}>
                <DetailMetric label="Real" value={selectedPoint?.actual !== null && selectedPoint?.actual !== undefined ? formatCurrency(selectedPoint.actual) : "Sin dato"} color={colors.primary} compact />
                <DetailMetric label="Objetivo" value={formatCurrency(selectedPoint?.target ?? 0)} color={colors.blue} compact />
                <DetailMetric label="CapsaAI" value={formatCurrency(selectedPoint?.projected ?? 0)} color={colors.purple} compact />
                <DetailMetric label="Rango" value={formatRange(selectedPoint)} color={colors.purple} compact />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

interface ForecastChartSvgProps {
  mode: ChartMode
  size: ChartSize
  padding: ChartPadding
  currentMonth: CurrentMonthMeta
  spendingForecast: SpendingForecastSummary
  spendingSummary: SpendingSummary
  spendingTrend: SpendingTrendPoint[]
  selectedDay?: number
  onSelectDay?: (day: number) => void
}

function ForecastChartSvg({
  mode,
  size,
  padding,
  currentMonth,
  spendingForecast,
  spendingSummary,
  spendingTrend,
  selectedDay,
  onSelectDay,
}: ForecastChartSvgProps) {
  const dayCount = currentMonth.daysInMonth
  const dayDenominator = Math.max(dayCount - 1, 1)
  const xLabelDays = xLabelsFor(dayCount, mode)
  const realSeries = spendingTrend
    .filter((item): item is SpendingTrendPoint & { actual: number } => item.actual !== null)
    .map((item) => ({ day: item.day, value: item.actual }))
  const objectiveSeries = spendingTrend.map((item) => ({ day: item.day, value: item.target }))
  const projectionSeries = spendingTrend.map((item) => ({ day: item.day, value: item.projected }))
  const maxValue =
    Math.max(
      spendingForecast.upperClosing,
      spendingSummary.projectedSpend,
      spendingSummary.budget,
      spendingSummary.totalSpend,
      ...spendingTrend.map((item) => item.upperBound ?? item.projected ?? item.target ?? 0),
      1,
    ) * 1.08
  const rangePolygon = rangePolygonFor(spendingTrend, maxValue, dayCount, size, padding)
  const selectedPoint = selectedDay ? spendingTrend.find((item) => item.day === selectedDay) : undefined
  const selectedCoordinates = selectedPoint ? chartPoint(selectedPoint.day, selectedPoint.projected, maxValue, dayCount, size, padding) : null
  const innerWidth = size.width - padding.left - padding.right
  const hitWidth = Math.max(innerWidth / dayDenominator, 22)
  const axisColor = mode === "detail" ? colors.border : `${colors.border}cc`
  const displayWidth = mode === "compact" ? "100%" : size.width
  const actualStrokeWidth = mode === "detail" ? 5 : 4.5
  const supportStrokeWidth = mode === "detail" ? 4 : 3.2

  return (
    <Svg width={displayWidth} height={size.height} viewBox={`0 0 ${size.width} ${size.height}`}>
      {[0.25, 0.5, 0.75, 1].map((step) => {
        const y = padding.top + (size.height - padding.top - padding.bottom) * step
        return <Line key={step} x1={padding.left} x2={size.width - padding.right} y1={y} y2={y} stroke={axisColor} strokeWidth={1} />
      })}
      {xLabelDays.map((day) => {
        const x = padding.left + ((day - 1) / dayDenominator) * (size.width - padding.left - padding.right)
        return (
          <SvgText key={day} x={x} y={size.height - 10} fill={colors.muted} fontSize={mode === "detail" ? "12" : "11"} fontWeight="700" textAnchor="middle">
            {day}
          </SvgText>
        )
      })}
      {[0, 0.5, 1].map((ratio) => {
        const value = Math.round((maxValue * (1 - ratio)) / 1000) * 1000
        const y = padding.top + (size.height - padding.top - padding.bottom) * ratio
        return (
          <SvgText key={ratio} x={mode === "detail" ? 6 : 2} y={y + 4} fill={colors.muted} fontSize={mode === "detail" ? "11" : "10"} fontWeight="700">
            {formatCompact(value)}
          </SvgText>
        )
      })}
      {rangePolygon ? <Polygon points={rangePolygon} fill={colors.purple} opacity={mode === "detail" ? 0.2 : 0.16} /> : null}
      <Polyline
        points={pointsFor(objectiveSeries, maxValue, dayCount, size, padding)}
        fill="none"
        stroke={colors.blue}
        strokeWidth={supportStrokeWidth}
        strokeDasharray={mode === "detail" ? "10 9" : "8 8"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Polyline
        points={pointsFor(projectionSeries, maxValue, dayCount, size, padding)}
        fill="none"
        stroke={colors.purple}
        strokeWidth={supportStrokeWidth}
        strokeDasharray={mode === "detail" ? "3 9" : "3 8"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Polyline
        points={pointsFor(realSeries, maxValue, dayCount, size, padding)}
        fill="none"
        stroke={colors.primary}
        strokeWidth={actualStrokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {mode === "detail"
        ? spendingTrend.map((item) => {
            const actualPoint = item.actual !== null ? chartPoint(item.day, item.actual, maxValue, dayCount, size, padding) : null
            const targetPoint = chartPoint(item.day, item.target, maxValue, dayCount, size, padding)
            const projectedPoint = chartPoint(item.day, item.projected, maxValue, dayCount, size, padding)
            const isSelected = selectedDay === item.day

            return (
              <G key={item.day}>
                {actualPoint ? <Circle cx={actualPoint.x} cy={actualPoint.y} r={isSelected ? 6 : 3.2} fill={colors.primary} /> : null}
                <Circle cx={targetPoint.x} cy={targetPoint.y} r={isSelected ? 5 : 2.8} fill={colors.blue} />
                <Circle cx={projectedPoint.x} cy={projectedPoint.y} r={isSelected ? 5 : 2.8} fill={colors.purple} />
              </G>
            )
          })
        : null}

      {selectedCoordinates ? (
        <>
          <Line x1={selectedCoordinates.x} x2={selectedCoordinates.x} y1={padding.top - 4} y2={size.height - padding.bottom + 4} stroke={colors.text} strokeWidth={1.4} opacity={0.55} />
          <Circle cx={selectedCoordinates.x} cy={selectedCoordinates.y} r={mode === "detail" ? 8 : 6} fill={colors.card} stroke={colors.purple} strokeWidth={2.4} />
        </>
      ) : null}

      {onSelectDay
        ? spendingTrend.map((item) => {
            const { x } = chartPoint(item.day, 0, maxValue, dayCount, size, padding)
            return (
              <Rect
                key={`hit-${item.day}`}
                x={Math.max(padding.left, x - hitWidth / 2)}
                y={padding.top - 8}
                width={hitWidth}
                height={size.height - padding.top - padding.bottom + 16}
                fill="#ffffff"
                opacity={0.01}
                onPress={() => onSelectDay(item.day)}
              />
            )
          })
        : null}
    </Svg>
  )
}

function SummaryMetric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.summaryMetric}>
      <View style={[styles.metricBar, { backgroundColor: color }]} />
      <Text style={styles.summaryLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  )
}

function DetailMetric({ label, value, color, compact = false }: { label: string; value: string; color: string; compact?: boolean }) {
  return (
    <View style={[styles.detailMetric, compact ? styles.detailMetricCompact : null]}>
      <View style={[styles.metricBar, { backgroundColor: color }]} />
      <Text style={styles.detailMetricLabel}>{label}</Text>
      <Text style={styles.detailMetricValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  )
}

function LegendItem({ color, label, variant }: { color: string; label: string; variant: "solid" | "dashed" | "dotted" | "range" }) {
  return (
    <View style={styles.legendItem}>
      {variant === "range" ? (
        <View style={[styles.rangeSample, { backgroundColor: color }]} />
      ) : (
        <View
          style={[
            styles.lineSample,
            {
              borderTopColor: color,
              borderStyle: variant === "solid" ? "solid" : variant,
            },
          ]}
        />
      )}
      <Text style={styles.legendText}>{label}</Text>
    </View>
  )
}

function formatRange(point?: SpendingTrendPoint) {
  if (point?.lowerBound === null || point?.lowerBound === undefined || point.upperBound === null || point.upperBound === undefined) return "Sin rango"
  return `${formatCompact(point.lowerBound)} - ${formatCompact(point.upperBound)}`
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 14,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3,
  },
  closing: {
    color: colors.primary,
    fontSize: 19,
    fontWeight: "900",
  },
  monthSwitcher: {
    minHeight: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardSoft,
    padding: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  monthButton: {
    flex: 1,
    minWidth: 0,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  monthButtonDisabled: {
    opacity: 0.45,
  },
  monthButtonText: {
    minWidth: 0,
    color: colors.text,
    fontSize: 11,
    fontWeight: "900",
  },
  currentMonthPill: {
    width: 92,
    height: 38,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  currentMonthText: {
    color: "#06120c",
    fontSize: 12,
    fontWeight: "900",
    maxWidth: "100%",
  },
  currentMonthYear: {
    color: "rgba(6, 18, 12, 0.72)",
    fontSize: 10,
    fontWeight: "900",
    marginTop: 1,
  },
  summaryGrid: {
    flexDirection: "row",
    gap: 8,
  },
  summaryMetric: {
    flex: 1,
    minHeight: 68,
    borderRadius: 8,
    backgroundColor: colors.cardSoft,
    padding: 10,
  },
  metricBar: {
    width: 30,
    height: 4,
    borderRadius: 999,
    marginBottom: 8,
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "800",
  },
  summaryValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 4,
  },
  compactFooter: {
    gap: 12,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  lineSample: {
    width: 26,
    height: 0,
    borderTopWidth: 4,
    borderRadius: 999,
  },
  rangeSample: {
    width: 26,
    height: 10,
    borderRadius: 4,
    opacity: 0.24,
  },
  legendText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  detailButton: {
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
  },
  detailButtonText: {
    color: "#06120c",
    fontSize: 14,
    fontWeight: "900",
  },
  modalRoot: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  rotatedSurface: {
    position: "absolute",
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 6,
    transform: [{ rotate: "90deg" }],
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 40,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  modalMeta: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  detailMetric: {
    flexBasis: "48%",
    flexGrow: 1,
    minHeight: 72,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
  },
  detailMetricCompact: {
    flexBasis: "23%",
    minHeight: 50,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  detailMetricLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "800",
  },
  detailMetricValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 3,
  },
  detailContent: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  chartFrame: {
    alignItems: "center",
    justifyContent: "center",
  },
  detailMetricStrip: {
    width: "100%",
    flexDirection: "row",
    gap: 6,
  },
  detailLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignSelf: "stretch",
    justifyContent: "center",
    gap: 10,
    minHeight: 22,
  },
})
