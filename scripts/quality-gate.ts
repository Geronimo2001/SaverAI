import { execFileSync, spawnSync } from "node:child_process"
import { mkdtempSync, readFileSync, writeFileSync, rmSync, mkdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, relative, resolve } from "node:path"
import { addedLines, coveragePercentage, lcovLines, meetsMinimum } from "./quality-metrics.js"

const readJson = (path: string) => JSON.parse(readFileSync(path, "utf8"))

function main() {
  const policy = readJson("quality.config.json")
  if (!/^[a-f0-9]{40}$/.test(policy.baseline)) throw new Error("La referencia debe ser un commit SHA completo")
  execFileSync("git", ["cat-file", "-e", policy.baseline + "^{commit}"], { stdio: "pipe" })
  const files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "--", "server"], { encoding: "utf8" })
    .split("\n").filter((path) => path.endsWith(".ts"))
  const coverage = lcovLines(readFileSync("coverage/unit/lcov.info", "utf8"))
  const byPath = new Map([...coverage].map(([path, data]) => [relative(process.cwd(), resolve(path)), data]))
  if (!files.length || files.some((path) => !byPath.has(path)) || byPath.size !== files.length) {
    throw new Error("La cobertura no coincide con todos los archivos TypeScript de server")
  }
  const counts = { existing: { covered: 0, total: 0 }, new: { covered: 0, total: 0 } }
  const details = []
  const temporary = mkdtempSync(join(tmpdir(), "capsa-coverage-"))
  try {
    for (const file of files) {
      const baseline = spawnSync("git", ["show", policy.baseline + ":" + file], { encoding: "utf8" })
      let changed: Set<number>
      if (baseline.status !== 0) {
        // Distinguir archivo nuevo de un fallo de git, despues de verificar el commit.
        const exists = execFileSync("git", ["ls-tree", "--name-only", policy.baseline, "--", file], { encoding: "utf8" }).trim()
        if (exists) throw new Error("No se pudo leer la referencia de " + file)
        changed = new Set(byPath.get(file)!.keys())
      } else {
        writeFileSync(join(temporary, "before.ts"), baseline.stdout)
        writeFileSync(join(temporary, "after.ts"), readFileSync(file))
        const diff = spawnSync("git", ["diff", "--no-index", "--no-ext-diff", "--unified=0", "--", join(temporary, "before.ts"), join(temporary, "after.ts")], { encoding: "utf8" })
        if (diff.status !== 0 && diff.status !== 1) throw new Error("No se pudo comparar " + file)
        changed = addedLines(diff.stdout)
      }
      const fileCounts = { file, existing: { covered: 0, total: 0 }, new: { covered: 0, total: 0 } }
      for (const [line, hits] of byPath.get(file)!) {
        const group = changed.has(line) ? "new" : "existing"
        counts[group].total++; fileCounts[group].total++
        if (hits > 0) { counts[group].covered++; fileCounts[group].covered++ }
      }
      details.push(fileCounts)
    }
  } finally { rmSync(temporary, { recursive: true, force: true }) }

  const lint = readJson("reports/eslint.json") as { errorCount: number; warningCount: number }[]
  const lintErrors = lint.reduce((sum, file) => sum + file.errorCount, 0)
  const lintWarnings = lint.reduce((sum, file) => sum + file.warningCount, 0)
  const duplication = readJson("reports/duplication/jscpd-report.json").statistics.total
  if (!Number.isFinite(duplication.percentage) || duplication.sources !== files.length || duplication.lines <= 0) {
    throw new Error("El analisis de duplicacion no cubre los archivos del backend")
  }
  if (lint.length !== files.length) throw new Error("El analisis estatico no cubre todos los archivos del backend")
  const suites = ["reports/unit-results.json", "reports/integration-results.json"].map(readJson)
  const checks = {
    existingCoverage: meetsMinimum(counts.existing.covered, counts.existing.total, policy.existingLinesMin),
    newCoverage: meetsMinimum(counts.new.covered, counts.new.total, policy.newLinesMin),
    duplication: duplication.percentage <= policy.duplicationMax,
    staticAnalysis: lintErrors <= policy.lintErrorsMax && lintWarnings === 0,
    tests: suites.every((suite) => suite.success === true && suite.numTotalTests > 0 && suite.numFailedTests === 0 && suite.numPendingTests === 0),
  }
  return { passed: Object.values(checks).every(Boolean), baseline: policy.baseline, scope: policy.scope,
    coverage: Object.fromEntries(Object.entries(counts).map(([group, value]) => [group, { ...value, percentage: coveragePercentage(value.covered, value.total) }])),
    duplication: { percentage: duplication.percentage, lines: duplication.duplicatedLines, total: duplication.lines },
    lintErrors, lintWarnings, tests: suites.reduce((sum, suite) => sum + suite.numTotalTests, 0), checks, files: details }
}

mkdirSync("reports", { recursive: true })
let result
try { result = main() } catch (error) {
  result = { passed: false, error: error instanceof Error ? error.message : String(error) }
}
writeFileSync("reports/quality-gate.json", JSON.stringify(result, null, 2) + "\n")
console.log(JSON.stringify(result, null, 2))
process.exitCode = result.passed ? 0 : 1
