import { Readable } from "node:stream"
import { createHmac } from "node:crypto"
import type { IncomingMessage, ServerResponse } from "node:http"

export const testSecret = "quality-http-secret"
export function signature(body: string) {
  return "sha256=" + createHmac("sha256", testSecret).update(body).digest("hex")
}
export function request(method: string, url: string, body = "", headers: Record<string, string | string[]> = {}) {
  const stream = Readable.from([Buffer.from(body)])
  return Object.assign(stream, { method, url, headers }) as unknown as IncomingMessage
}
export function response() {
  const state = { status: 200, headers: {} as Record<string, unknown>, body: "" }
  const reply = {
    setHeader(name: string, value: unknown) { state.headers[name] = value; return reply },
    writeHead(status: number, headers?: Record<string, unknown>) { state.status = status; Object.assign(state.headers, headers); return reply },
    end(body?: string) { state.body = body ?? ""; return reply },
  }
  return { reply: reply as unknown as ServerResponse, state }
}
