import { IncomingMessage, ServerResponse } from "http"
import { createHmac, timingSafeEqual } from "crypto"

const maxBodyBytes = 64 * 1024

export async function readJsonBody(request: IncomingMessage) {
  const rawBody = await readRawBody(request)

  try {
    return { rawBody, body: JSON.parse(rawBody.toString("utf8")) as unknown }
  } catch {
    return { rawBody, body: null }
  }
}

export function sendJson(response: ServerResponse, statusCode: number, body: unknown) {
  const payload = JSON.stringify(body)
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
  })
  response.end(payload)
}

export function verifyWebhookSignature(rawBody: Buffer, signatureHeader: string | string[] | undefined, secret: string) {
  const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader
  if (!signature) return false

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex")
  const received = signature.startsWith("sha256=") ? signature.slice("sha256=".length) : signature

  const expectedBuffer = Buffer.from(expected, "hex")
  const receivedBuffer = Buffer.from(received, "hex")
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer)
}

function readRawBody(request: IncomingMessage) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = []
    let totalBytes = 0

    request.on("data", (chunk: Buffer) => {
      totalBytes += chunk.length
      if (totalBytes > maxBodyBytes) {
        reject(new Error("Request body too large."))
        request.destroy()
        return
      }
      chunks.push(chunk)
    })

    request.on("end", () => resolve(Buffer.concat(chunks)))
    request.on("error", reject)
  })
}
