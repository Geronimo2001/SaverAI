import "dotenv/config"
import {
  CardBrand,
  CardType,
  PrismaClient,
  type TransactionSource,
} from "../lib/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const connectionString = process.env.DATABASE_URL ?? "postgresql://gero@localhost:5432/capsaai"
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

const userId = "00000000-0000-4000-8000-000000000001"
const batchTag = "varied-last-3-months-v1"

type CardSeed = {
  issuerBank: string
  brand: CardBrand
  cardType: CardType
  lastFour: string
  alias: string
  creditLimitCents?: bigint
}

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
  count: number
  cardLastFours: string[]
  sourceWeights: Partial<Record<TransactionSource, number>>
  descriptions: string[]
}

const extraCards: CardSeed[] = [
  {
    issuerBank: "Naranja X",
    brand: CardBrand.VISA,
    cardType: CardType.CREDIT,
    lastFour: "1122",
    alias: "Visa Naranja X",
    creditLimitCents: BigInt(95000000),
  },
  {
    issuerBank: "Mercado Pago",
    brand: CardBrand.MASTERCARD,
    cardType: CardType.PREPAID,
    lastFour: "9031",
    alias: "Mastercard Mercado Pago",
  },
  {
    issuerBank: "Uala",
    brand: CardBrand.MASTERCARD,
    cardType: CardType.PREPAID,
    lastFour: "6677",
    alias: "Mastercard Uala",
  },
  {
    issuerBank: "Santander",
    brand: CardBrand.VISA,
    cardType: CardType.DEBIT,
    lastFour: "9910",
    alias: "Visa Debito Santander",
  },
]

const merchants: MerchantSeed[] = [
  { name: "Disco", slug: "disco", categoryKey: "super", rawNames: ["DISCO", "DISCO SUPERMERCADO"] },
  { name: "Jumbo", slug: "jumbo", categoryKey: "super", rawNames: ["JUMBO"] },
  { name: "Cordiez", slug: "cordiez", categoryKey: "super", rawNames: ["CORDIEZ"] },
  { name: "Verduleria del barrio", slug: "verduleria-del-barrio", categoryKey: "super", rawNames: ["VERDULERIA"] },
  { name: "Carniceria Don Julio", slug: "carniceria-don-julio", categoryKey: "super", rawNames: ["CARNICERIA DON JULIO"] },
  { name: "PedidosYa", slug: "pedidosya", categoryKey: "comida", rawNames: ["PEDIDOSYA"] },
  { name: "SushiClub", slug: "sushiclub", categoryKey: "comida", rawNames: ["SUSHICLUB"] },
  { name: "McDonald's", slug: "mcdonalds", categoryKey: "comida", rawNames: ["MCDONALDS"] },
  { name: "Mostaza", slug: "mostaza", categoryKey: "comida", rawNames: ["MOSTAZA"] },
  { name: "Betos", slug: "betos", categoryKey: "comida", rawNames: ["BETOS"] },
  { name: "Bonafide", slug: "bonafide", categoryKey: "cafe", rawNames: ["BONAFIDE"] },
  { name: "Le Dureau", slug: "le-dureau", categoryKey: "cafe", rawNames: ["LE DUREAU"] },
  { name: "The Coffee Store", slug: "the-coffee-store", categoryKey: "cafe", rawNames: ["THE COFFEE STORE"] },
  { name: "Uber", slug: "uber", categoryKey: "transporte", rawNames: ["UBER"] },
  { name: "Cabify", slug: "cabify", categoryKey: "transporte", rawNames: ["CABIFY"] },
  { name: "Axion", slug: "axion", categoryKey: "transporte", rawNames: ["AXION"] },
  { name: "Estacionamiento Centro", slug: "estacionamiento-centro", categoryKey: "transporte", rawNames: ["ESTACIONAMIENTO CENTRO"] },
  { name: "EPEC", slug: "epec", categoryKey: "servicios", rawNames: ["EPEC"] },
  { name: "Aguas Cordobesas", slug: "aguas-cordobesas", categoryKey: "servicios", rawNames: ["AGUAS CORDOBESAS"] },
  { name: "Claro", slug: "claro", categoryKey: "servicios", rawNames: ["CLARO"] },
  { name: "Flow", slug: "flow", categoryKey: "servicios", rawNames: ["FLOW"] },
  { name: "OSDE", slug: "osde", categoryKey: "servicios", rawNames: ["OSDE"] },
  { name: "Easy", slug: "easy", categoryKey: "hogar", rawNames: ["EASY"] },
  { name: "Sodimac", slug: "sodimac", categoryKey: "hogar", rawNames: ["SODIMAC"] },
  { name: "IKEA Online", slug: "ikea-online", categoryKey: "hogar", rawNames: ["IKEA ONLINE"] },
  { name: "Lavanderia Express", slug: "lavanderia-express", categoryKey: "hogar", rawNames: ["LAVANDERIA EXPRESS"] },
  { name: "Zara", slug: "zara", categoryKey: "compras", rawNames: ["ZARA"] },
  { name: "Dexter", slug: "dexter", categoryKey: "compras", rawNames: ["DEXTER"] },
  { name: "Open Sports", slug: "open-sports", categoryKey: "compras", rawNames: ["OPEN SPORTS"] },
  { name: "Fravega", slug: "fravega", categoryKey: "compras", rawNames: ["FRAVEGA"] },
  { name: "Musimundo", slug: "musimundo", categoryKey: "compras", rawNames: ["MUSIMUNDO"] },
]

const profiles: SpendProfile[] = [
  {
    slug: "disco",
    categoryKey: "super",
    min: 12500,
    max: 68000,
    count: 12,
    cardLastFours: ["4582", "9910", "9031"],
    sourceWeights: { MANUAL: 7, IMPORT: 3 },
    descriptions: ["Compra semanal", "Supermercado", "Reposicion de alimentos"],
  },
  {
    slug: "jumbo",
    categoryKey: "super",
    min: 18000,
    max: 92000,
    count: 8,
    cardLastFours: ["1122", "4582", "3344"],
    sourceWeights: { MANUAL: 8, IMPORT: 2 },
    descriptions: ["Compra grande", "Supermercado", "Limpieza y almacen"],
  },
  {
    slug: "verduleria-del-barrio",
    categoryKey: "super",
    min: 2800,
    max: 16500,
    count: 10,
    cardLastFours: ["9031", "9910", "6677"],
    sourceWeights: { MANUAL: 9, WHATSAPP: 1 },
    descriptions: ["Frutas y verduras", "Compra de verduleria"],
  },
  {
    slug: "pedidosya",
    categoryKey: "comida",
    min: 8500,
    max: 29000,
    count: 12,
    cardLastFours: ["7891", "9031", "6677"],
    sourceWeights: { WHATSAPP: 7, IMPORT: 3 },
    descriptions: ["Delivery", "Cena pedida", "Almuerzo por app"],
  },
  {
    slug: "sushiclub",
    categoryKey: "comida",
    min: 24500,
    max: 78000,
    count: 5,
    cardLastFours: ["3344", "1122", "7891"],
    sourceWeights: { MANUAL: 8, WHATSAPP: 2 },
    descriptions: ["Cena", "Salida a comer", "Pedido especial"],
  },
  {
    slug: "mostaza",
    categoryKey: "comida",
    min: 6200,
    max: 21000,
    count: 7,
    cardLastFours: ["9031", "7891", "6677"],
    sourceWeights: { WHATSAPP: 6, MANUAL: 4 },
    descriptions: ["Comida rapida", "Almuerzo", "Cena rapida"],
  },
  {
    slug: "bonafide",
    categoryKey: "cafe",
    min: 2500,
    max: 9800,
    count: 9,
    cardLastFours: ["9031", "7891", "9910"],
    sourceWeights: { WHATSAPP: 6, MANUAL: 4 },
    descriptions: ["Cafe", "Desayuno", "Merienda"],
  },
  {
    slug: "the-coffee-store",
    categoryKey: "cafe",
    min: 3200,
    max: 12500,
    count: 6,
    cardLastFours: ["7891", "6677", "1122"],
    sourceWeights: { WHATSAPP: 5, MANUAL: 5 },
    descriptions: ["Cafe de trabajo", "Merienda", "Cafe"],
  },
  {
    slug: "uber",
    categoryKey: "transporte",
    min: 2300,
    max: 16500,
    count: 13,
    cardLastFours: ["4582", "9031", "9910"],
    sourceWeights: { IMPORT: 9, MANUAL: 1 },
    descriptions: ["Viaje urbano", "Traslado", "Movilidad"],
  },
  {
    slug: "axion",
    categoryKey: "transporte",
    min: 26000,
    max: 76000,
    count: 6,
    cardLastFours: ["4582", "1122", "9910"],
    sourceWeights: { MANUAL: 7, IMPORT: 3 },
    descriptions: ["Combustible", "Carga de nafta"],
  },
  {
    slug: "estacionamiento-centro",
    categoryKey: "transporte",
    min: 1500,
    max: 9800,
    count: 8,
    cardLastFours: ["9031", "9910", "6677"],
    sourceWeights: { MANUAL: 6, IMPORT: 4 },
    descriptions: ["Estacionamiento", "Cochera por hora"],
  },
  {
    slug: "epec",
    categoryKey: "servicios",
    min: 26000,
    max: 52000,
    count: 3,
    cardLastFours: ["3344", "9910"],
    sourceWeights: { IMPORT: 10 },
    descriptions: ["Servicio de luz"],
  },
  {
    slug: "osde",
    categoryKey: "servicios",
    min: 89000,
    max: 138000,
    count: 3,
    cardLastFours: ["3344", "1122"],
    sourceWeights: { IMPORT: 10 },
    descriptions: ["Medicina prepaga"],
  },
  {
    slug: "claro",
    categoryKey: "servicios",
    min: 9000,
    max: 18500,
    count: 4,
    cardLastFours: ["7891", "9910", "9031"],
    sourceWeights: { IMPORT: 10 },
    descriptions: ["Linea movil", "Servicio celular"],
  },
  {
    slug: "easy",
    categoryKey: "hogar",
    min: 7800,
    max: 83000,
    count: 7,
    cardLastFours: ["3344", "1122", "4582"],
    sourceWeights: { MANUAL: 7, IMPORT: 3 },
    descriptions: ["Hogar", "Ferreteria", "Mantenimiento casa"],
  },
  {
    slug: "lavanderia-express",
    categoryKey: "hogar",
    min: 3500,
    max: 14500,
    count: 6,
    cardLastFours: ["9031", "6677", "9910"],
    sourceWeights: { MANUAL: 8, WHATSAPP: 2 },
    descriptions: ["Lavanderia", "Tintoreria"],
  },
  {
    slug: "zara",
    categoryKey: "compras",
    min: 18000,
    max: 138000,
    count: 5,
    cardLastFours: ["3344", "1122", "7891"],
    sourceWeights: { MANUAL: 6, IMPORT: 4 },
    descriptions: ["Indumentaria", "Compra de ropa"],
  },
  {
    slug: "fravega",
    categoryKey: "compras",
    min: 42000,
    max: 220000,
    count: 4,
    cardLastFours: ["1122", "3344", "4582"],
    sourceWeights: { IMPORT: 7, MANUAL: 3 },
    descriptions: ["Electrodomestico", "Compra tecnologia"],
  },
  {
    slug: "open-sports",
    categoryKey: "compras",
    min: 21000,
    max: 98000,
    count: 5,
    cardLastFours: ["7891", "1122", "9031"],
    sourceWeights: { MANUAL: 7, IMPORT: 3 },
    descriptions: ["Zapatillas", "Ropa deportiva", "Indumentaria deportiva"],
  },
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

const random = seededRandom(2026072801)

function pick<T>(items: T[]) {
  return items[Math.floor(random() * items.length)]
}

function weightedPick<T extends string>(weights: Partial<Record<T, number>>) {
  const entries = Object.entries(weights) as [T, number][]
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0)
  let roll = random() * total

  for (const [value, weight] of entries) {
    roll -= weight
    if (roll <= 0) return value
  }

  return entries[entries.length - 1][0]
}

function randomInt(min: number, max: number) {
  return Math.round(min + random() * (max - min))
}

function roundAmount(amount: number) {
  if (amount >= 50000) return Math.round(amount / 500) * 500
  if (amount >= 10000) return Math.round(amount / 100) * 100
  return Math.round(amount / 50) * 50
}

function daysBetween(start: Date, end: Date) {
  return Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
}

function dateInArgentina(year: number, month: number, day: number, hour: number, minute: number) {
  return new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00-03:00`)
}

function randomDate(start: Date, end: Date) {
  const date = new Date(start)
  date.setUTCDate(start.getUTCDate() + randomInt(0, daysBetween(start, end)))

  const dayOfWeek = date.getUTCDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  const hour = isWeekend ? randomInt(10, 23) : randomInt(7, 22)
  const minute = pick([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55])

  return dateInArgentina(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), hour, minute)
}

async function main() {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
  })

  const existingCount = await prisma.transaction.count({
    where: { notes: batchTag },
  })

  if (existingCount > 0) {
    console.log(`Skipped: ${existingCount} transactions already exist for ${batchTag}`)
    return
  }

  const categories = await prisma.category.findMany()
  const categoriesByKey = new Map(categories.map((category) => [category.key, category]))

  for (const card of extraCards) {
    await prisma.card.upsert({
      where: {
        userId_issuerBank_brand_lastFour: {
          userId: user.id,
          issuerBank: card.issuerBank,
          brand: card.brand,
          lastFour: card.lastFour,
        },
      },
      update: {
        alias: card.alias,
        cardType: card.cardType,
        creditLimitCents: card.creditLimitCents,
        active: true,
      },
      create: {
        userId: user.id,
        issuerBank: card.issuerBank,
        brand: card.brand,
        cardType: card.cardType,
        lastFour: card.lastFour,
        alias: card.alias,
        creditLimitCents: card.creditLimitCents,
      },
    })
  }

  for (const merchant of merchants) {
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
        source: merchant.source ?? "seed",
      },
    })
  }

  const cards = await prisma.card.findMany({
    where: {
      userId: user.id,
      active: true,
    },
  })
  const cardsByLastFour = new Map(cards.map((card) => [card.lastFour, card]))

  const allMerchants = await prisma.merchant.findMany()
  const merchantsBySlug = new Map(allMerchants.map((merchant) => [merchant.slug, merchant]))

  const start = new Date("2026-04-28T00:00:00-03:00")
  const end = new Date("2026-07-28T23:59:59-03:00")
  const transactions = []

  for (const profile of profiles) {
    const merchant = merchantsBySlug.get(profile.slug)
    const category = categoriesByKey.get(profile.categoryKey)
    if (!merchant || !category) throw new Error(`Missing relation for ${profile.slug}`)

    for (let index = 0; index < profile.count; index += 1) {
      const card = cardsByLastFour.get(pick(profile.cardLastFours))
      if (!card) throw new Error(`Missing card for ${profile.slug}`)

      const source = weightedPick(profile.sourceWeights)
      const amount = roundAmount(randomInt(profile.min, profile.max))
      const occurredAt = randomDate(start, end)

      transactions.push({
        amountCents: cents(amount),
        cardId: card.id,
        categoryId: category.id,
        description: pick(profile.descriptions),
        merchantId: merchant.id,
        occurredAt,
        source,
        status: "CONFIRMED" as const,
      })
    }
  }

  transactions.sort((first, second) => first.occurredAt.getTime() - second.occurredAt.getTime())

  let whatsappJobs = 0

  for (const transaction of transactions) {
    const merchant = allMerchants.find((item) => item.id === transaction.merchantId)
    const category = categories.find((item) => item.id === transaction.categoryId)
    const card = cards.find((item) => item.id === transaction.cardId)

    if (transaction.source === "WHATSAPP") {
      const rawText = `gaste ${Number(transaction.amountCents) / 100} en ${merchant?.name ?? "comercio"} con ${card?.alias ?? "tarjeta"}`
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
          modelConfidence: "0.8600",
          status: "PROCESSED",
          receivedAt: transaction.occurredAt,
          processedAt: new Date(transaction.occurredAt.getTime() + randomInt(6, 40) * 1000),
          events: [
            { nombre: "recibido", detalle: { canal: "whatsapp" } },
            { nombre: "normalizado", detalle: { confianza: 0.86 } },
            { nombre: "transaccion_creada", detalle: { estado: "CONFIRMED" } },
          ],
        },
      })

      await prisma.transaction.create({
        data: {
          ...transaction,
          userId: user.id,
          currency: user.currency,
          confidence: "0.8600",
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
  console.log(`Created ${extraCards.length} extra cards if missing`)
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
