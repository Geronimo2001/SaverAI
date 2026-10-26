export function addedLines(diff: string): Set<number> {
  const result = new Set<number>()
  for (const match of diff.matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm)) {
    const start = Number(match[1]), count = match[2] === undefined ? 1 : Number(match[2])
    for (let offset = 0; offset < count; offset++) result.add(start + offset)
  }
  return result
}

export function coveragePercentage(covered: number, total: number): number | null {
  return total === 0 ? null : (covered / total) * 100
}

export function meetsMinimum(covered: number, total: number, minimum: number) {
  return total === 0 || covered * 100 >= total * minimum
}

export function lcovLines(input: string) {
  const files = new Map<string, Map<number, number>>()
  let current: Map<number, number> | undefined
  for (const line of input.split(/\r?\n/)) {
    if (line.startsWith("SF:")) {
      const path = line.slice(3)
      if (files.has(path)) throw new Error("Fuente duplicada en LCOV: " + path)
      current = new Map()
      files.set(path, current)
    } else if (line.startsWith("DA:")) {
      const [number, hits] = line.slice(3).split(",").map(Number)
      if (!current || !Number.isInteger(number) || number! <= 0 || !Number.isFinite(hits) || hits! < 0) {
        throw new Error("Entrada LCOV invalida")
      }
      current.set(number!, hits!)
    }
  }
  if (files.size === 0) throw new Error("LCOV no contiene fuentes")
  return files
}
