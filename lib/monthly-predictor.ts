export interface PredictorMovement {
  fecha: string | Date
  monto: number
  categoria: string
}

export interface PredictorConfig {
  ingreso_mensual: number
  gastos_fijos?: Record<string, number>
  presupuesto_categoria?: Record<string, number>
  categorias_fijas?: string[]
  spike_percentil?: number
}

export interface PredictorCategoryResult {
  categoria: string
  gastado: number
  proyectado: number
  recurrente: number
  picos: number
  prior: number
  tope: number
  pct: number
  se_pasa: boolean
  fuente_tope: "presupuesto" | "prior historico"
}

export interface PredictorResult {
  corte: {
    dia: number
    dias_mes: number
    peso_datos: number
  }
  resumen: {
    fijos: number
    variable_gastado: number
    variable_proyectado: number
    total_gastado: number
    total_proyectado: number
    ingreso: number
    sobrante: number
    se_pasa: boolean
    exceso: number
    mensaje: string
  }
  categorias: PredictorCategoryResult[]
}

interface ParsedMovement {
  fecha: Date
  monto: number
  categoria: string
}

interface NormalizedConfig {
  ingreso_mensual: number
  gastos_fijos: Record<string, number>
  presupuesto_categoria: Record<string, number>
  categorias_fijas: Set<string>
  spike_percentil: number
}

interface CategoryStats {
  umbral_pico: number
  freq_picos_mes: number
  monto_pico_prom: number
  prior_mensual: number
}

export function predecir(movimientos: PredictorMovement[], config: PredictorConfig, hoy?: string | Date | null): PredictorResult {
  const cfg = normalizarConfig(config)
  const movs = parsearMovimientos(movimientos)
  const diaCorte = hoy ? parsearFecha(hoy) : new Date()

  return analizar(movs, diaCorte, cfg)
}

function esFinde(date: Date) {
  return date.getDay() === 0 || date.getDay() === 6
}

function sameMonth(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth()
}

function periodKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

function percentil(valores: number[], p: number) {
  if (valores.length === 0) return 0

  const xs = [...valores].sort((first, second) => first - second)
  const k = (xs.length - 1) * (p / 100)
  const lo = Math.floor(k)
  const hi = Math.min(lo + 1, xs.length - 1)

  return xs[lo] + (xs[hi] - xs[lo]) * (k - lo)
}

function statsHistoricos(movs: ParsedMovement[], cfg: NormalizedConfig) {
  const porCategoria = new Map<string, ParsedMovement[]>()

  for (const movimiento of movs) {
    if (cfg.categorias_fijas.has(movimiento.categoria)) continue

    const items = porCategoria.get(movimiento.categoria) ?? []
    items.push(movimiento)
    porCategoria.set(movimiento.categoria, items)
  }

  const stats = new Map<string, CategoryStats>()

  for (const [categoria, movimientos] of porCategoria) {
    const montos = movimientos.map((movimiento) => movimiento.monto)
    const meses = new Set(movimientos.map((movimiento) => periodKey(movimiento.fecha)))
    const mesesCount = Math.max(1, meses.size)
    const umbral = percentil(montos, cfg.spike_percentil)
    const picos = montos.filter((monto) => monto >= umbral && monto > 0)
    const picosBase = picos.length > 0 ? picos : montos.length > 0 ? [Math.max(...montos)] : [0]

    stats.set(categoria, {
      umbral_pico: umbral,
      freq_picos_mes: picosBase.length / mesesCount,
      monto_pico_prom: picosBase.reduce((total, monto) => total + monto, 0) / picosBase.length,
      prior_mensual: montos.reduce((total, monto) => total + monto, 0) / mesesCount,
    })
  }

  return stats
}

function proyectarRecurrente(
  gastosPorDia: Map<string, number>,
  diasPasadosSemana: number,
  diasPasadosFinde: number,
  diasRestantesSemana: number,
  diasRestantesFinde: number,
) {
  let gastoSemana = 0
  let gastoFinde = 0

  for (const [rawDate, monto] of gastosPorDia) {
    if (esFinde(parsearFecha(rawDate))) gastoFinde += monto
    else gastoSemana += monto
  }

  let promedioSemana = diasPasadosSemana ? gastoSemana / diasPasadosSemana : 0
  let promedioFinde = diasPasadosFinde ? gastoFinde / diasPasadosFinde : 0

  if (diasPasadosFinde === 0) promedioFinde = promedioSemana
  if (diasPasadosSemana === 0) promedioSemana = promedioFinde

  return gastoSemana + gastoFinde + promedioSemana * diasRestantesSemana + promedioFinde * diasRestantesFinde
}

function analizar(movs: ParsedMovement[], hoy: Date, cfg: NormalizedConfig): PredictorResult {
  const anio = hoy.getFullYear()
  const mes = hoy.getMonth()
  const diasMes = new Date(anio, mes + 1, 0).getDate()
  const diaCorte = Math.min(Math.max(hoy.getDate(), 1), diasMes)
  const stats = statsHistoricos(movs, cfg)

  let diasPasadosSemana = 0
  let diasPasadosFinde = 0
  let diasRestantesSemana = 0
  let diasRestantesFinde = 0

  for (let dia = 1; dia <= diasMes; dia += 1) {
    const finde = esFinde(new Date(anio, mes, dia))
    if (dia <= diaCorte) {
      if (finde) diasPasadosFinde += 1
      else diasPasadosSemana += 1
    } else if (finde) diasRestantesFinde += 1
    else diasRestantesSemana += 1
  }

  const fraccionPasada = diaCorte / diasMes
  const fraccionRestante = 1 - fraccionPasada
  const delMes = movs.filter(
    (movimiento) =>
      sameMonth(movimiento.fecha, hoy) &&
      movimiento.fecha.getDate() <= diaCorte &&
      !cfg.categorias_fijas.has(movimiento.categoria),
  )
  const recurrentePorDia = new Map<string, Map<string, number>>()
  const picosSum = new Map<string, number>()

  for (const movimiento of delMes) {
    const umbral = stats.get(movimiento.categoria)?.umbral_pico ?? Number.POSITIVE_INFINITY

    if (movimiento.monto >= umbral && umbral > 0) {
      picosSum.set(movimiento.categoria, (picosSum.get(movimiento.categoria) ?? 0) + movimiento.monto)
      continue
    }

    const porDia = recurrentePorDia.get(movimiento.categoria) ?? new Map<string, number>()
    const key = toLocalISODate(movimiento.fecha)
    porDia.set(key, (porDia.get(key) ?? 0) + movimiento.monto)
    recurrentePorDia.set(movimiento.categoria, porDia)
  }

  const categoriasSet = new Set<string>([
    ...stats.keys(),
    ...delMes.map((movimiento) => movimiento.categoria),
  ])
  const categorias: PredictorCategoryResult[] = []

  for (const categoria of categoriasSet) {
    const st = stats.get(categoria)
    const proyRec = proyectarRecurrente(
      recurrentePorDia.get(categoria) ?? new Map<string, number>(),
      diasPasadosSemana,
      diasPasadosFinde,
      diasRestantesSemana,
      diasRestantesFinde,
    )
    const picosRestantes = st ? st.freq_picos_mes * fraccionRestante : 0
    const proyPicos = (picosSum.get(categoria) ?? 0) + picosRestantes * (st?.monto_pico_prom ?? 0)
    const proyCruda = proyRec + proyPicos
    const prior = st?.prior_mensual ?? proyCruda
    const proyFinal = fraccionPasada * proyCruda + (1 - fraccionPasada) * prior
    const presupuesto = cfg.presupuesto_categoria[categoria]
    const tope = presupuesto ?? prior
    const fuenteTope = presupuesto == null ? "prior historico" : "presupuesto"
    const gastado = (picosSum.get(categoria) ?? 0) + sumMap(recurrentePorDia.get(categoria))

    if (proyFinal <= 0 && gastado <= 0) continue

    categorias.push({
      categoria,
      gastado: roundMoney(gastado),
      proyectado: roundMoney(proyFinal),
      recurrente: roundMoney(proyRec),
      picos: roundMoney(proyPicos),
      prior: roundMoney(prior),
      tope: roundMoney(tope),
      pct: tope ? Math.round((proyFinal / tope) * 100) : 0,
      se_pasa: proyFinal > tope,
      fuente_tope: fuenteTope,
    })
  }

  categorias.sort((first, second) => second.proyectado - first.proyectado)

  const fijos = Object.values(cfg.gastos_fijos).reduce((total, monto) => total + monto, 0)
  const variableGastado = categorias.reduce((total, categoria) => total + categoria.gastado, 0)
  const variableProyectado = categorias.reduce((total, categoria) => total + categoria.proyectado, 0)
  const totalProyectado = fijos + variableProyectado
  const sobrante = cfg.ingreso_mensual - totalProyectado
  const sePasa = sobrante < 0

  return {
    corte: {
      dia: diaCorte,
      dias_mes: diasMes,
      peso_datos: roundMoney(fraccionPasada),
    },
    resumen: {
      fijos: roundMoney(fijos),
      variable_gastado: roundMoney(variableGastado),
      variable_proyectado: roundMoney(variableProyectado),
      total_gastado: roundMoney(fijos + variableGastado),
      total_proyectado: roundMoney(totalProyectado),
      ingreso: cfg.ingreso_mensual,
      sobrante: roundMoney(sobrante),
      se_pasa: sePasa,
      exceso: sePasa ? roundMoney(-sobrante) : 0,
      mensaje: sePasa
        ? `Te vas a pasar por ${money(-sobrante)} si seguis asi.`
        : `Vas bien: te sobrarian ${money(sobrante)}.`,
    },
    categorias,
  }
}

function normalizarConfig(config: PredictorConfig): NormalizedConfig {
  return {
    ingreso_mensual: Number(config.ingreso_mensual),
    gastos_fijos: Object.fromEntries(
      Object.entries(config.gastos_fijos ?? {}).map(([key, value]) => [key, Number(value)]),
    ),
    presupuesto_categoria: Object.fromEntries(
      Object.entries(config.presupuesto_categoria ?? {}).map(([key, value]) => [key, Number(value)]),
    ),
    categorias_fijas: new Set(config.categorias_fijas ?? []),
    spike_percentil: Number(config.spike_percentil ?? 90),
  }
}

function parsearMovimientos(movimientos: PredictorMovement[]): ParsedMovement[] {
  return movimientos.map((movimiento) => ({
    fecha: parsearFecha(movimiento.fecha),
    monto: Math.abs(Number(movimiento.monto)),
    categoria: String(movimiento.categoria).trim(),
  }))
}

function parsearFecha(fecha: string | Date) {
  if (fecha instanceof Date) {
    return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
  }

  const value = fecha.trim()
  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]))
  }

  const localMatch = value.match(/^(\d{2})-(\d{2})-(\d{4})$/)
  if (localMatch) {
    return new Date(Number(localMatch[3]), Number(localMatch[2]) - 1, Number(localMatch[1]))
  }

  throw new Error(`Fecha no reconocida: ${JSON.stringify(fecha)} (usar yyyy-mm-dd o dd-mm-yyyy)`)
}

function toLocalISODate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function sumMap(map?: Map<string, number>) {
  if (!map) return 0
  return Array.from(map.values()).reduce((total, monto) => total + monto, 0)
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100
}

function money(value: number) {
  return `$${Math.round(value).toLocaleString("es-AR")}`
}
