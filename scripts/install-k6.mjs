import { createHash } from "node:crypto"
import { execFileSync } from "node:child_process"
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"

const version = "2.3.0"
const distributions = {
  "darwin-arm64": ["macos-arm64.zip", "b2417a3038edc5fe81dc178a889237724b595c5c9cfed875822008e46e862c7d"],
  "darwin-x64": ["macos-amd64.zip", "c83bb16f54f0676afa4ea235fd757f3892d307dbd1bd201450de83af31986654"],
  "linux-x64": ["linux-amd64.tar.gz", "39c3117b6af817592dcd0ce4242105c0a7af10948c2a425306f0be8f7a8a8ab1"],
  "linux-arm64": ["linux-arm64.tar.gz", "5ca3433e8201da72a284aaa241a1bb5fb47f4abb4e384d39410ddd8062f49b90"],
}
const distribution = distributions[process.platform + "-" + process.arch]
if (!distribution) throw new Error("Instalador de k6 del TP: usar macOS o Linux (x64/arm64).")
const [suffix, digest] = distribution
const filename = `k6-v${version}-${suffix}`
const folder = filename.replace(/\.(zip|tar\.gz)$/, "")
const output = resolve(".tools", "k6-" + version)
const binary = join(output, folder, "k6")
const manifest = join(output, "verified.json")
try {
  const cached = JSON.parse(await readFile(manifest, "utf8"))
  const binaryHash = createHash("sha256").update(await readFile(binary)).digest("hex")
  if (cached.version !== version || cached.archiveSha256 !== digest || cached.binarySha256 !== binaryHash) throw new Error("Cache incompatible")
  console.log(`k6 ${version} verificado en .tools/`)
} catch {
  const temporary = await mkdtemp(join(tmpdir(), "capsa-k6-"))
  try {
    const response = await fetch(`https://github.com/grafana/k6/releases/download/v${version}/${filename}`, { signal: AbortSignal.timeout(120000) })
    if (!response.ok) throw new Error("No se pudo descargar k6: HTTP " + response.status)
    const archive = Buffer.from(await response.arrayBuffer())
    if (createHash("sha256").update(archive).digest("hex") !== digest) throw new Error("SHA-256 de k6 no coincide")
    const path = join(temporary, filename)
    await writeFile(path, archive)
    await mkdir(output, { recursive: true })
    if (suffix.endsWith(".zip")) execFileSync("unzip", ["-q", "-o", path, "-d", output])
    else execFileSync("tar", ["-xzf", path, "-C", output])
    await chmod(binary, 0o755)
    const binarySha256 = createHash("sha256").update(await readFile(binary)).digest("hex")
    await writeFile(manifest, JSON.stringify({ version, filename, archiveSha256: digest, binarySha256 }, null, 2) + "\n")
    console.log(`k6 ${version} descargado y verificado en .tools/`)
  } finally {
    await rm(temporary, { recursive: true, force: true })
  }
}
