import { createServer, IncomingMessage } from "http"
import { getBotConfig } from "./config"
import {
  downloadMedia,
  isValidMetaSignature,
  sendText,
  toPhoneE164,
  toWhatsappUserId,
  verifyChallenge,
} from "./meta"
import { transcribeAudio } from "./transcribe"
import { describeExpense, handleIncomingMessage } from "./session"
import { getBotContext } from "./context"
import { publishConfirmedExpense } from "./backend"

/**
 * Bot de WhatsApp de CapsaAI.
 *
 * Es el canal de entrada, no la autoridad: recibe el audio, lo transcribe,
 * completa el gasto conversando con el usuario y, una vez confirmado, se lo
 * manda firmado al backend, que decide si se publica.
 *
 *   GET  /webhooks/whatsapp/inbound  -> verificacion de Meta
 *   POST /webhooks/whatsapp/inbound  -> mensajes entrantes
 *   GET  /health
 */

const config = getBotConfig()

// Anti-reproceso: Meta reintenta si tardamos. En produccion deberia persistirse.
const seenMessageIds = new Set<string>()

const INBOUND_PATH = "/webhooks/whatsapp/inbound"

interface WhatsAppMessage {
  id: string
  from: string
  type: string
  text?: { body?: string }
  audio?: { id?: string; mime_type?: string }
}

function readRawBody(request: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let total = 0
    request.on("data", (chunk: Buffer) => {
      total += chunk.length
      if (total > 1024 * 1024) {
        reject(new Error("Cuerpo demasiado grande"))
        request.destroy()
        return
      }
      chunks.push(chunk)
    })
    request.on("end", () => resolve(Buffer.concat(chunks)))
    request.on("error", reject)
  })
}

function collectMessages(payload: unknown): WhatsAppMessage[] {
  const messages: WhatsAppMessage[] = []
  const root = payload as { entry?: Array<{ changes?: Array<{ value?: { messages?: WhatsAppMessage[] } }> }> }

  for (const entry of root?.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const message of change.value?.messages ?? []) {
        messages.push(message)
      }
    }
  }

  return messages
}

/** Convierte el mensaje de WhatsApp en texto (transcribiendo si es audio). */
async function resolveText(message: WhatsAppMessage): Promise<string | null> {
  if (message.type === "text" && message.text?.body) {
    return message.text.body
  }

  if (message.type === "audio" && message.audio?.id) {
    if (!config.ai) {
      throw new Error("Llego un audio pero no hay proveedor de IA configurado (falta GROQ_API_KEY)")
    }
    const media = await downloadMedia(message.audio.id, config)
    return transcribeAudio(media.buffer, media.mimeType, config.ai)
  }

  return null
}

function describeBackendResult(
  result: Awaited<ReturnType<typeof publishConfirmedExpense>>,
  detail: string,
): string {
  if (result.status === "created") {
    return `✅ Registré ${detail}.`
  }
  if (result.status === "duplicate") {
    return "Ese gasto ya estaba cargado, no lo dupliqué 👍"
  }
  if (result.status === "invalid") {
    const detail = result.errors?.map((item) => `• ${item.detail}`).join("\n")
    return `El backend rechazó el gasto:\n${detail ?? "no cumple las reglas."}`
  }
  if (result.httpStatus === 401) {
    return "No pude autenticarme con el backend. Avisale al equipo (firma invalida)."
  }
  return "Hubo un problema al guardarlo. Probá de nuevo en un rato."
}

async function handleMessage(message: WhatsAppMessage): Promise<void> {
  const phone = toPhoneE164(message.from)
  const userId = toWhatsappUserId(message.from)

  let text: string | null
  try {
    text = await resolveText(message)
  } catch (error) {
    console.error("No se pudo leer el mensaje:", error)
    await sendText(phone, "No pude escuchar ese audio, ¿probás de nuevo?", config)
    return
  }

  if (!text) {
    await sendText(phone, 'Mandame un audio o un texto con el gasto, por ejemplo: "gasté 2000 en sushi en Tepanyaki".', config)
    return
  }

  console.log(`  texto: "${text}"  (userId ${userId})`)

  // Categorias y tarjetas salen del backend (con respaldo fijo si no responde).
  const context = await getBotContext(userId, config.backendUrl)
  const outcome = await handleIncomingMessage({ userId, messageId: message.id, text }, config.ai, context)

  if (!outcome.confirmed) {
    console.log(`  respuesta al usuario: "${outcome.reply}"`)
    await sendText(phone, outcome.reply, config)
    return
  }

  try {
    console.log(`  publicando en el backend: ${JSON.stringify(outcome.confirmed.expense)}`)
    const result = await publishConfirmedExpense(outcome.confirmed, config)
    console.log(`  backend respondio: HTTP ${result.httpStatus} status=${result.status}`)
    const detail = describeExpense(outcome.confirmed.expense)
    await sendText(phone, describeBackendResult(result, detail), config)
  } catch (error) {
    console.error("No se pudo publicar el gasto:", error)
    await sendText(phone, "No pude comunicarme con el backend. ¿Está levantado el servidor?", config)
  }
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://localhost:${config.port}`)

    // Traza de TODAS las requests que llegan (util para diagnosticar el webhook).
    console.log(`[${new Date().toISOString()}] ${request.method} ${url.pathname}`)

    if (request.method === "GET" && url.pathname === "/health") {
      response.writeHead(200, { "content-type": "application/json" })
      response.end(JSON.stringify({ status: "ok", backend: config.backendUrl, ia: config.ai?.provider ?? null }))
      return
    }

    if (request.method === "GET" && url.pathname === INBOUND_PATH) {
      const challenge = verifyChallenge(url.searchParams, config)
      if (challenge === null) {
        response.writeHead(403).end("Forbidden")
        return
      }
      response.writeHead(200, { "content-type": "text/plain" }).end(challenge)
      return
    }

    if (request.method === "POST" && url.pathname === INBOUND_PATH) {
      const rawBody = await readRawBody(request)

      if (!isValidMetaSignature(rawBody, request.headers["x-hub-signature-256"] as string | undefined, config)) {
        response.writeHead(401, { "content-type": "application/json" }).end(JSON.stringify({ status: "unauthorized" }))
        return
      }

      // Se responde 200 enseguida: Meta reintenta si tardamos mas de unos segundos.
      response.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({ status: "ok" }))

      let payload: unknown
      try {
        payload = JSON.parse(rawBody.toString("utf8"))
      } catch {
        console.log("  cuerpo no era JSON valido")
        return
      }

      const incoming = collectMessages(payload)
      console.log(`  mensajes en el payload: ${incoming.length}`)
      for (const message of incoming) {
        if (seenMessageIds.has(message.id)) {
          console.log(`  mensaje ${message.id} ya procesado, salteado`)
          continue
        }
        seenMessageIds.add(message.id)
        console.log(`  procesando mensaje ${message.type} de ${message.from}`)
        handleMessage(message).catch((error) => console.error("Error procesando mensaje:", error))
      }
      return
    }

    console.log(`  -> 404 (ruta no atendida por el bot)`)
    response.writeHead(404, { "content-type": "application/json" }).end(JSON.stringify({ status: "not_found" }))
  } catch (error) {
    console.error(error)
    if (!response.headersSent) {
      response.writeHead(500, { "content-type": "application/json" }).end(JSON.stringify({ status: "error" }))
    }
  }
})

server.listen(config.port, () => {
  console.log(`Bot de WhatsApp escuchando en http://localhost:${config.port}${INBOUND_PATH}`)
  console.log(`  backend: ${config.backendUrl}`)
  console.log(`  IA: ${config.ai ? `${config.ai.provider} (${config.ai.whisperModel})` : "sin configurar - no va a poder transcribir audios"}`)
})
