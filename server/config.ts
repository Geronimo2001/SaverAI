import "dotenv/config"

export interface ServerConfig {
  databaseUrl: string
  webhookSecret: string
  port: number
}

export function getConfig(): ServerConfig {
  const databaseUrl = process.env.DATABASE_URL
  const webhookSecret = process.env.WHATSAPP_WEBHOOK_SECRET
  const port = Number(process.env.PORT ?? 4010)

  if (!databaseUrl) throw new Error("Missing DATABASE_URL.")
  if (!webhookSecret) throw new Error("Missing WHATSAPP_WEBHOOK_SECRET.")
  if (!Number.isInteger(port) || port <= 0) throw new Error("PORT must be a positive integer.")

  return { databaseUrl, webhookSecret, port }
}
