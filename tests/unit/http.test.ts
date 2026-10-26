import { createHmac } from "node:crypto"
import { describe, expect, it } from "vitest"
import { readJsonBody, verifyWebhookSignature } from "../../server/http.js"
import { request } from "../fixtures/http.js"

describe("Contrato HTTP y firmas", () => {
  const body = Buffer.from('{"amount":1500}')
  const secret = "quality-secret"
  const digest = createHmac("sha256", secret).update(body).digest("hex")
  it.each([digest, "sha256=" + digest, ["sha256=" + digest]])("CP-018: acepta firma valida %j", (header) => {
    expect(verifyWebhookSignature(body, header, secret)).toBe(true)
  })
  it.each([undefined, "sha256=00", "otra-firma", "sha256=" + "a".repeat(64)])("CP-018: rechaza firma invalida %j", (header) => {
    expect(verifyWebhookSignature(body, header, secret)).toBe(false)
  })
  it("CP-018: detecta cuerpo alterado", () => {
    expect(verifyWebhookSignature(Buffer.from("alterado"), digest, secret)).toBe(false)
  })
  it("rechaza un cuerpo mayor a 64 KiB", async () => {
    await expect(readJsonBody(request("POST", "/", "x".repeat(65 * 1024)))).rejects.toThrow("Request body too large")
  })
})
