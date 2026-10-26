import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const label = process.argv[2]
if (!["rojo", "verde"].includes(label)) {
  console.error("Uso: npm run test:evidence -- rojo|verde")
  process.exit(2)
}

const directory = "docs/calidad/evidencias/def-001"
mkdirSync(directory, { recursive: true })
if (existsSync(join(directory, `${label}-metadata.json`))) {
  console.error("La evidencia historica ya existe y no se sobrescribe. Para ejecutar la suite actual: npm test.")
  process.exit(2)
}
const hash = (path) => createHash("sha256").update(readFileSync(path)).digest("hex")
const startedAt = new Date().toISOString()
const source = "server/confirmed-expense-validation.ts"
const test = "tests/unit/confirmed-expense-validation.test.ts"
const run = spawnSync(process.execPath, [
  "node_modules/vitest/vitest.mjs", "run", "--config", "vitest.config.mts",
  "--outputFile.json=" + join(directory, `${label}.json`),
], { encoding: "utf8", env: { ...process.env, NO_COLOR: "1" } })

writeFileSync(join(directory, `${label}.log`), (run.stdout ?? "") + (run.stderr ?? ""))
writeFileSync(join(directory, `${label}-metadata.json`), JSON.stringify({
  startedAt, finishedAt: new Date().toISOString(), node: process.version,
  command: "npm run test:evidence -- " + label, exitCode: run.status,
  source, sourceSha256: hash(source), test, testSha256: hash(test),
  scope: "Pruebas unitarias locales; no es una ejecución CI",
  error: run.error?.message,
}, null, 2) + "\n")
process.stdout.write(run.stdout ?? "")
process.stderr.write(run.stderr ?? "")
process.exit(run.status ?? 1)
