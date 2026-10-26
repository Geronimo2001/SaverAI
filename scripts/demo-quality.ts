import assert from "node:assert/strict"
import { spawn, execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { cp, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve, relative } from "node:path"

async function main() {
const startedAt = new Date().toISOString()
const destination = await mkdtemp(join(tmpdir(), "capsa-demo-release-"))
const directory = resolve("reports/demo")
await mkdir(directory, { recursive: true })
const report = { startedAt, finishedAt: "", passed: false, releaseRemoved: false,
  mode: "new-local-release", dependencyMode: "existing-node_modules-shared-readonly",
  sourceCommit: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  artifact: {} as Record<string, string>, stages: [] as { name: string; exitCode: number }[],
  error: undefined as string | undefined }

async function files(path: string): Promise<string[]> {
  const result: string[] = []
  for (const item of await readdir(path, { withFileTypes: true })) {
    const full = join(path, item.name)
    if (item.isDirectory()) result.push(...await files(full))
    else result.push(full)
  }
  return result.sort()
}
async function run(name: string, args: string[]) {
  console.log("Demo: " + name)
  let output = ""
  const code = await new Promise<number>((done, fail) => {
    const child = spawn(process.execPath, ["--import", "tsx", ...args], {
      env: { ...process.env, QUALITY_BACKEND_ENTRY: join(destination, "server/server.js") },
      stdio: ["ignore", "pipe", "pipe"],
    })
    child.stdout.on("data", data => { output += data.toString(); process.stdout.write(data) })
    child.stderr.on("data", data => { output += data.toString(); process.stderr.write(data) })
    child.once("error", fail)
    child.once("exit", exit => done(exit ?? 1))
  })
  report.stages.push({ name, exitCode: code })
  await writeFile(join(directory, name + ".log"), output)
  assert.equal(code, 0, "Fallo la etapa de demostracion " + name)
}
try {
  await cp("dist/server", join(destination, "server"), { recursive: true })
  await cp("package.json", join(destination, "package.json"))
  await symlink(resolve("node_modules"), join(destination, "node_modules"), "dir")
  for (const file of await files(join(destination, "server"))) {
    report.artifact[relative(destination, file)] = createHash("sha256").update(await readFile(file)).digest("hex")
  }
  assert(Object.keys(report.artifact).some(file => file === "server/server.js"))
  await run("smoke", ["tests/smoke/backend.smoke.ts"])
  await cp("reports/smoke-results.json", join(directory, "smoke-results.json"))
  await run("performance", ["tests/load/run.ts", "all"])
  await cp("reports/performance/all-run.json", join(directory, "performance-run.json"))
  report.passed = true
} catch (error) {
  report.error = error instanceof assert.AssertionError ? error.message : "No se pudo completar la demostracion local"
} finally {
  try { await rm(destination, { recursive: true, force: true }); report.releaseRemoved = true }
  catch { report.passed = false; report.error = "No se pudo retirar la copia temporal del despliegue" }
  report.finishedAt = new Date().toISOString()
  await writeFile(join(directory, "deployment.json"), JSON.stringify(report, null, 2) + "\n")
  console.log("Demostracion local " + (report.passed ? "APROBADA" : "RECHAZADA"))
  process.exitCode = report.passed ? 0 : 1
}

}
void main().catch(() => { console.error("No se pudo iniciar la demostracion local"); process.exitCode = 1 })
