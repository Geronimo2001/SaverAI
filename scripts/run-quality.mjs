import { spawnSync } from "node:child_process"
import { appendFileSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs"

// Solo directorios de salidas regenerables: evita aprobar usando reportes de otra ejecucion.
rmSync("reports", { recursive: true, force: true })
rmSync("coverage/unit", { recursive: true, force: true })
mkdirSync("reports/logs", { recursive: true })
const startedAt = new Date().toISOString()
const stages = ["typecheck", "server:typecheck", "test:typecheck", "build:server", "lint:report", "duplication", "test:coverage", "test:integration", "quality:gate", "test:performance:ci"]
const results = []
for (const name of stages) {
  console.log(`\nEjecutando ${name}`)
  const started = Date.now()
  const result = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", name], {
    encoding: "utf8", env: { ...process.env, NO_COLOR: "1" }, maxBuffer: 10 * 1024 * 1024,
  })
  const output = (result.stdout ?? "") + (result.stderr ?? "")
  writeFileSync(`reports/logs/${name.replaceAll(":", "-")}.log`, output)
  console.log(output)
  results.push({ name, exitCode: result.status ?? 1, durationMs: Date.now() - started })
}
const passed = results.every((stage) => stage.exitCode === 0)
writeFileSync("reports/pipeline-local.json", JSON.stringify({ startedAt, finishedAt: new Date().toISOString(), passed, stages: results }, null, 2) + "\n")
const gate = JSON.parse(readFileSync("reports/quality-gate.json", "utf8"))
let summary = `# Calidad del backend — ${passed ? "APROBADO" : "RECHAZADO"}\n\n`
summary += "| Etapa | Resultado |\n| --- | --- |\n" + results.map((stage) => `| ${stage.name} | ${stage.exitCode === 0 ? "OK" : "FALLO"} |`).join("\n") + "\n\n"
summary += "```json\n" + JSON.stringify(gate, null, 2) + "\n```\n\nAlcance: backend server/**/*.ts; no es cobertura de toda la app.\n"
try {
  const performance = JSON.parse(readFileSync("reports/performance/ci-run.json", "utf8"))
  summary += "\n## Carga y stress del backend\n\n"
  summary += "| Perfil | Solicitudes | p95 ms | p99 ms | Errores HTTP | Resultado |\n| --- | ---: | ---: | ---: | ---: | --- |\n"
  summary += performance.profiles.map(p => `| ${p.profile} | ${p.requests} | ${p.p95Ms?.toFixed(2)} | ${p.p99Ms?.toFixed(2)} | ${p.httpFailureRate} | ${p.passed ? "OK" : "FALLO"} |`).join("\n") + "\n"
  summary += `\nLimpieza: ${performance.cleanupPassed ? "OK" : "FALLO"}. Entorno local sintetico de CI; soak manual.\n`
} catch { summary += "\nNo se genero el resumen de carga; consultar la etapa test:performance:ci.\n" }
writeFileSync("reports/summary.md", summary)
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary)
process.exitCode = passed ? 0 : 1
