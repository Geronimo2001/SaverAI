import "dotenv/config"
import { PrismaClient, type TransactionSource } from "../lib/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const connectionString = process.env.DATABASE_URL ?? "postgresql://gero@localhost:5432/capsaai"
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

const batchTag = "random-2026-last-3-months-v1"
const userId = "00000000-0000-4000-8000-000000000001"

type MerchantSeed = {
  name: string
  slug: string
  categoryKey: string
  rawNames: string[]
  source?: string
}

type SpendProfile = {
  slug: string
  categoryKey: string
  min: number
  max: number
  weight: number
  cards: string[]
  source: "MANUAL" | "WHATSAPP" | "IMPORT"
  descriptions: string[]
}

type GeneratedTransaction = {
  amountCents: bigint
  cardId: string
  categoryId: string
  description: string
  merchantId: string
  occurredAt: Date
  source: TransactionSource
  status: "CONFIRMED"
}

const extraMerchants: MerchantSeed[] = [
  { name: "Cordiez", slug: "cordiez", categoryKey: "super", rawNames: ["CORDIEZ"] },
  { name: "Disco", slug: "disco", categoryKey: "super", rawNames: ["DISCO"] },
  { name: "Jumbo", slug: "jumbo", categoryKey: "super", rawNames: ["JUMBO"] },
  { name: "Verduleria del barrio", slug: "verduleria-del-barrio", categoryKey: "super", rawNames: ["VERDULERIA"] },
  { name: "PedidosYa", slug: "pedidosya", categoryKey: "comida", rawNames: ["PEDIDOSYA"] },
  { name: "SushiClub", slug: "sushiclub", categoryKey: "comida", rawNames: ["SUSHICLUB"] },
  { name: "McDonald's", slug: "mcdonalds", categoryKey: "comida", rawNames: ["MCDONALDS"] },
  { name: "Bonafide", slug: "bonafide", categoryKey: "cafe", rawNames: ["BONAFIDE"] },
  { name: "Le Dureau", slug: "le-dureau", categoryKey: "cafe", rawNames: ["LE DUREAU"] },
  { name: "Uber", slug: "uber", categoryKey: "transporte", rawNames: ["UBER"] },
  { name: "Cabify", slug: "cabify", categoryKey: "transporte", rawNames: ["CABIFY"] },
  { name: "Axion", slug: "axion", categoryKey: "transporte", rawNames: ["AXION"] },
  { name: "EPEC", slug: "epec", categoryKey: "servicios", rawNames: ["EPEC"] },
  { name: "Aguas Cordobesas", slug: "aguas-cordobesas", categoryKey: "servicios", rawNames: ["AGUAS CORDOBESAS"] },
  { name: "Claro", slug: "claro", categoryKey: "servicios", rawNames: ["CLARO"] },
  { name: "Easy", slug: "easy", categoryKey: "hogar", rawNames: ["EASY"] },
  { name: "Sodimac", slug: "sodimac", categoryKey: "hogar", rawNames: ["SODIMAC"] },
  { name: "Zara", slug: "zara", categoryKey: "compras", rawNames: ["ZARA"] },
  { name: "Dexter", slug: "dexter", categoryKey: "compras", rawNames: ["DEXTER"] },
  { name: "Open Sports", slug: "open-sports", categoryKey: "compras", rawNames: ["OPEN SPORTS"] },
]

const profiles: SpendProfile[] = [
  {
    slug: "coto",
    categoryKey: "super",
    min: 18000,
    max: 62000,
    weight: 7,
    cards: ["4582", "7891"],
    source: "MANUAL",
    descriptions: ["Compra semanal", "Reposicion de alimentos", "Supermercado"],
  },
  {
    slug: "carrefour-market",
    categoryKey: "super",
    min: 12000,
    max: 47000,
    weight: 5,
    cards: ["4582"],
    source: "MANUAL",
    descriptions: ["Compra de almacen", "Super cercano", "Compra con promo"],
  },
  {
    slug: "cordiez",
    categoryKey: "super",
    min: 9000,
    max: 38000,
    weight: 4,
    cards: ["4582", "7891"],
    source: "MANUAL",
    descriptions: ["Super barrial", "Compra rapida", "Almacen y limpieza"],
  },
  {
    slug: "verduleria-del-barrio",
    categoryKey: "super",
    min: 3500,
    max: 14500,
    weight: 4,
    cards: ["4582"],
    source: "MANUAL",
    descriptions: ["Frutas y verduras", "Compra de verduleria"],
  },
  {
    slug: "rappi",
    categoryKey: "comida",
    min: 8500,
    max: 27000,
    weight: 5,
    cards: ["7891"],
    source: "WHATSAPP",
    descriptions: ["Delivery", "Cena pedida", "Almuerzo por app"],
  },
  {
    slug: "pedidosya",
    categoryKey: "comida",
    min: 7200,
    max: 24000,
    weight: 4,
    cards: ["7891", "4582"],
    source: "WHATSAPP",
    descriptions: ["Delivery", "Comida a domicilio"],
  },
  {
    slug: "la-parolaccia",
    categoryKey: "comida",
    min: 22000,
    max: 62000,
    weight: 2,
    cards: ["7891", "3344"],
    source: "MANUAL",
    descriptions: ["Cena", "Salida a comer"],
  },
  {
    slug: "mcdonalds",
    categoryKey: "comida",
    min: 5200,
    max: 18000,
    weight: 3,
    cards: ["7891"],
    source: "WHATSAPP",
    descriptions: ["Comida rapida", "Almuerzo"],
  },
  {
    slug: "starbucks",
    categoryKey: "cafe",
    min: 3200,
    max: 11500,
    weight: 5,
    cards: ["7891"],
    source: "WHATSAPP",
    descriptions: ["Cafe", "Merienda", "Cafe de trabajo"],
  },
  {
    slug: "havanna",
    categoryKey: "cafe",
    min: 2900,
    max: 9800,
    weight: 4,
    cards: ["7891"],
    source: "WHATSAPP",
    descriptions: ["Cafe", "Merienda"],
  },
  {
    slug: "bonafide",
    categoryKey: "cafe",
    min: 2600,
    max: 8500,
    weight: 3,
    cards: ["4582", "7891"],
    source: "WHATSAPP",
    descriptions: ["Cafe", "Desayuno"],
  },
  {
    slug: "uber",
    categoryKey: "transporte",
    min: 2300,
    max: 15500,
    weight: 5,
    cards: ["4582", "7891"],
    source: "IMPORT",
    descriptions: ["Viaje urbano", "Traslado"],
  },
  {
    slug: "cabify",
    categoryKey: "transporte",
    min: 2500,
    max: 14500,
    weight: 3,
    cards: ["4582"],
    source: "IMPORT",
    descriptions: ["Viaje urbano", "Traslado"],
  },
  {
    slug: "ypf",
    categoryKey: "transporte",
    min: 24000,
    max: 68000,
    weight: 3,
    cards: ["4582"],
    source: "MANUAL",
    descriptions: ["Combustible", "Carga de nafta"],
  },
  {
    slug: "shell",
    categoryKey: "transporte",
    min: 24000,
    max: 72000,
    weight: 2,
    cards: ["4582"],
    source: "MANUAL",
    descriptions: ["Combustible", "Carga con descuento"],
  },
  {
    slug: "mercado-libre",
    categoryKey: "compras",
    min: 9500,
    max: 98000,
    weight: 4,
    cards: ["4582", "3344"],
    source: "IMPORT",
    descriptions: ["Compra online", "Mercado Libre"],
  },
  {
    slug: "zara",
    categoryKey: "compras",
    min: 18000,
    max: 125000,
    weight: 2,
    cards: ["3344", "7891"],
    source: "MANUAL",
    descriptions: ["Indumentaria", "Compra de ropa"],
  },
  {
    slug: "farmacity",
    categoryKey: "super",
    min: 5000,
    max: 26000,
    weight: 3,
    cards: ["4582"],
    source: "MANUAL",
    descriptions: ["Farmacia", "Perfumeria"],
  },
  {
    slug: "easy",
    categoryKey: "hogar",
    min: 8500,
    max: 78000,
    weight: 2,
    cards: ["3344", "4582"],
    source: "MANUAL",
    descriptions: ["Hogar", "Ferreteria y hogar"],
  },
]

const recurring = [
  { slug: "netflix", categoryKey: "servicios", amount: 5499, card: "3344", day: 22, description: "Suscripcion Netflix" },
  { slug: "spotify", categoryKey: "servicios", amount: 2499, card: "4582", day: 28, description: "Suscripcion Spotify" },
  { slug: "icloud", categoryKey: "servicios", amount: 1299, card: "4582", day: 1, description: "Suscripcion iCloud" },
  { slug: "youtube-premium", categoryKey: "servicios", amount: 1899, card: "7891", day: 5, description: "Suscripcion YouTube Premium" },
  { slug: "personal-flow", categoryKey: "servicios", amount: 21400, card: "3344", day: 11, description: "Internet y telefono" },
  { slug: "epec", categoryKey: "servicios", amount: 32600, card: "3344", day: 9, description: "Servicio de luz" },
  { slug: "aguas-cordobesas", categoryKey: "servicios", amount: 14800, card: "4582", day: 17, description: "Servicio de agua" },
  { slug: "claro", categoryKey: "servicios", amount: 11900, card: "7891", day: 13, description: "Linea movil" },
]

function cents(amountPesos: number) {
  return BigInt(Math.round(amountPesos * 100))
}

function seededRandom(seed: number) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

const random = seededRandom(20260727)

function pick<T>(items: T[]) {
  return items[Math.floor(random() * items.length)]
}

function randomInt(min: number, max: number) {
  return Math.round(min + random() * (max - min))
}

function weightedPick(items: SpendProfile[]) {
  const total = items.reduce((sum, item) => sum + item.weight, 0)
  let roll = random() * total

  for (const item of items) {
    roll -= item.weight
    if (roll <= 0) return item
  }

  return items[items.length - 1]
}

function daysBetween(start: Date, end: Date) {
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.floor((end.getTime() - start.getTime()) / msPerDay)
}

function dateInArgentina(year: number, month: number, day: number, hour: number, minute: number) {
  return new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00-03:00`)
}

function randomDate(start: Date, end: Date) {
  const offset = randomInt(0, daysBetween(start, end))
  const date = new Date(start)
  date.setUTCDate(start.getUTCDate() + offset)
  const isWeekend = [0, 6].includes(date.getUTCDay())
  const hour = isWeekend ? randomInt(11, 23) : randomInt(8, 22)
  const minute = pick([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55])
  return dateInArgentina(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), hour, minute)
}

function maybeRoundAmount(amount: number) {
  if (amount > 25000) return Math.round(amount / 100) * 100
  if (amount > 8000) return Math.round(amount / 50) * 50
  return Math.round(amount / 10) * 10
}

async function main() {
  const existingGenerated = await prisma.transaction.count({
    where: {
      notes: batchTag,
    },
  })

  if (existingGenerated > 0) {
    console.log(`Skipped: ${existingGenerated} generated transactions already exist for ${batchTag}`)
    return
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
  })

  const categories = await prisma.category.findMany()
  const categoriesByKey = new Map(categories.map((category) => [category.key, category]))

  for (const merchant of extraMerchants) {
    const category = categoriesByKey.get(merchant.categoryKey)
    if (!category) throw new Error(`Missing category ${merchant.categoryKey}`)

    await prisma.merchant.upsert({
      where: { slug: merchant.slug },
      update: {
        categoryId: category.id,
        rawNames: merchant.rawNames,
      },
      create: {
        name: merchant.name,
        slug: merchant.slug,
        categoryId: category.id,
        rawNames: merchant.rawNames,
        source: merchant.source ?? "manual",
      },
    })
  }

  const cards = await prisma.card.findMany({
    where: {
      userId: user.id,
      active: true,
    },
  })
  const cardByLastFour = new Map(cards.map((card) => [card.lastFour, card]))

  const merchants = await prisma.merchant.findMany()
  const merchantBySlug = new Map(merchants.map((merchant) => [merchant.slug, merchant]))

  const start = new Date("2026-04-27T00:00:00-03:00")
  const end = new Date("2026-07-27T23:59:59-03:00")
  const transactions: GeneratedTransaction[] = []

  for (let index = 0; index < 155; index += 1) {
    const profile = weightedPick(profiles)
    const merchant = merchantBySlug.get(profile.slug)
    const category = categoriesByKey.get(profile.categoryKey)
    const card = cardByLastFour.get(pick(profile.cards))

    if (!merchant || !category || !card) {
      throw new Error(`Missing relation for ${profile.slug}`)
    }

    const amount = maybeRoundAmount(randomInt(profile.min, profile.max))
    const occurredAt = randomDate(start, end)
    const description = pick(profile.descriptions)
    const source: TransactionSource = profile.source === "WHATSAPP" && random() < 0.72 ? "WHATSAPP" : profile.source === "IMPORT" ? "IMPORT" : "MANUAL"

    transactions.push({
      amountCents: cents(amount),
      cardId: card.id,
      categoryId: category.id,
      description,
      merchantId: merchant.id,
      occurredAt,
      source,
      status: "CONFIRMED" as const,
    })
  }

  for (const month of [5, 6, 7]) {
    for (const item of recurring) {
      const merchant = merchantBySlug.get(item.slug)
      const category = categoriesByKey.get(item.categoryKey)
      const card = cardByLastFour.get(item.card)
      if (!merchant || !category || !card) throw new Error(`Missing recurring relation for ${item.slug}`)

      const day = Math.min(item.day, new Date(2026, month, 0).getDate())
      const occurredAt = dateInArgentina(2026, month, day, randomInt(7, 10), pick([0, 15, 30, 45]))
      if (occurredAt > end) continue

      transactions.push({
        amountCents: cents(item.amount),
        cardId: card.id,
        categoryId: category.id,
        description: item.description,
        merchantId: merchant.id,
        occurredAt,
        source: "IMPORT" as const,
        status: "CONFIRMED" as const,
      })
    }
  }

  transactions.sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime())

  let whatsappJobs = 0
  for (const transaction of transactions) {
    const merchant = merchants.find((item) => item.id === transaction.merchantId)
    const card = cards.find((item) => item.id === transaction.cardId)
    const category = categories.find((item) => item.id === transaction.categoryId)

    if (transaction.source === "WHATSAPP") {
      const rawText = `gaste ${Number(transaction.amountCents) / 100} en ${merchant?.name ?? "un comercio"} con ${card?.alias ?? "tarjeta"}`
      const ingestionJob = await prisma.ingestionJob.create({
        data: {
          userId: user.id,
          channel: "WHATSAPP",
          inputType: "TEXT",
          rawText,
          extractedPayload: {
            amountCents: Number(transaction.amountCents),
            merchantName: merchant?.name,
            categoryKey: category?.key,
            cardLastFour: card?.lastFour,
            occurredAt: transaction.occurredAt.toISOString(),
          },
          normalizedPayload: {
            amountCents: Number(transaction.amountCents),
            currency: user.currency,
            merchantId: transaction.merchantId,
            categoryId: transaction.categoryId,
            cardId: transaction.cardId,
            source: "WHATSAPP",
          },
          modelName: "expense-normalizer",
          modelVersion: "v1",
          modelConfidence: "0.8300",
          status: "PROCESSED",
          receivedAt: transaction.occurredAt,
          processedAt: new Date(transaction.occurredAt.getTime() + randomInt(4, 35) * 1000),
        },
      })

      await prisma.transaction.create({
        data: {
          ...transaction,
          userId: user.id,
          currency: user.currency,
          confidence: "0.8300",
          ingestionJobId: ingestionJob.id,
          notes: batchTag,
        },
      })
      whatsappJobs += 1
    } else {
      await prisma.transaction.create({
        data: {
          ...transaction,
          userId: user.id,
          currency: user.currency,
          notes: batchTag,
        },
      })
    }
  }

  console.log(`Inserted ${transactions.length} transactions for ${batchTag}`)
  console.log(`Created ${whatsappJobs} WhatsApp ingestion jobs`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
