import "dotenv/config"
import { PrismaClient } from "../lib/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/capsaai"
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

const ids = {
  user: "00000000-0000-4000-8000-000000000001",
  cards: {
    visaGalicia: "00000000-0000-4000-8000-000000000101",
    masterBbva: "00000000-0000-4000-8000-000000000102",
    amexSantander: "00000000-0000-4000-8000-000000000103",
  },
  categories: {
    super: "00000000-0000-4000-8000-000000000201",
    comida: "00000000-0000-4000-8000-000000000202",
    transporte: "00000000-0000-4000-8000-000000000203",
    cafe: "00000000-0000-4000-8000-000000000204",
    hogar: "00000000-0000-4000-8000-000000000205",
    servicios: "00000000-0000-4000-8000-000000000206",
    compras: "00000000-0000-4000-8000-000000000207",
  },
  merchants: {
    mercadoLibre: "00000000-0000-4000-8000-000000000301",
    parolaccia: "00000000-0000-4000-8000-000000000302",
    ypf: "00000000-0000-4000-8000-000000000303",
    coto: "00000000-0000-4000-8000-000000000304",
    starbucks: "00000000-0000-4000-8000-000000000305",
    personalFlow: "00000000-0000-4000-8000-000000000306",
    farmacity: "00000000-0000-4000-8000-000000000307",
    rappi: "00000000-0000-4000-8000-000000000308",
    netflix: "00000000-0000-4000-8000-000000000309",
    spotify: "00000000-0000-4000-8000-000000000310",
    icloud: "00000000-0000-4000-8000-000000000311",
    youtube: "00000000-0000-4000-8000-000000000312",
    carrefour: "00000000-0000-4000-8000-000000000313",
    havanna: "00000000-0000-4000-8000-000000000314",
    shell: "00000000-0000-4000-8000-000000000315",
  },
  locations: {
    carrefour: "00000000-0000-4000-8000-000000000401",
    havanna: "00000000-0000-4000-8000-000000000402",
    shell: "00000000-0000-4000-8000-000000000403",
  },
  ingestionJobs: {
    whatsappCafe: "00000000-0000-4000-8000-000000000501",
  },
  transactions: {
    mercadoLibre: "00000000-0000-4000-8000-000000000601",
    parolaccia: "00000000-0000-4000-8000-000000000602",
    ypf: "00000000-0000-4000-8000-000000000603",
    coto: "00000000-0000-4000-8000-000000000604",
    starbucks: "00000000-0000-4000-8000-000000000605",
    personalFlow: "00000000-0000-4000-8000-000000000606",
    farmacity: "00000000-0000-4000-8000-000000000607",
    rappi: "00000000-0000-4000-8000-000000000608",
    whatsappCafe: "00000000-0000-4000-8000-000000000609",
  },
  promotionSource: "00000000-0000-4000-8000-000000000701",
  promotions: {
    carrefour: "00000000-0000-4000-8000-000000000801",
    havanna: "00000000-0000-4000-8000-000000000802",
    shell: "00000000-0000-4000-8000-000000000803",
  },
}

function date(value: string) {
  return new Date(value)
}

async function clearDatabase() {
  await prisma.sharedExpenseSplit.deleteMany()
  await prisma.sharedExpense.deleteMany()
  await prisma.groupMember.deleteMany()
  await prisma.group.deleteMany()
  await prisma.userLocationSnapshot.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.recommendation.deleteMany()
  await prisma.promotion.deleteMany()
  await prisma.scraperRun.deleteMany()
  await prisma.promotionSource.deleteMany()
  await prisma.subscription.deleteMany()
  await prisma.budget.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.ingestionJob.deleteMany()
  await prisma.merchantLocation.deleteMany()
  await prisma.merchant.deleteMany()
  await prisma.card.deleteMany()
  await prisma.whatsAppAccount.deleteMany()
  await prisma.userPreference.deleteMany()
  await prisma.category.deleteMany()
  await prisma.user.deleteMany()
}

async function seed() {
  await clearDatabase()

  await prisma.user.create({
    data: {
      id: ids.user,
      email: "geronimo@example.com",
      fullName: "Geronimo",
      phoneE164: "+5493510000000",
      country: "AR",
      currency: "ARS",
      timezone: "America/Argentina/Cordoba",
      preferences: {
        create: {
          notificationChannels: ["push", "whatsapp"],
          alertThresholdPercent: 85,
          locationPromosEnabled: true,
          patternAlertsEnabled: true,
          duplicateDetectionEnabled: true,
          whatsappIngestionEnabled: true,
          whatsappConfirmEveryCharge: true,
        },
      },
      whatsappAccounts: {
        create: {
          provider: "meta",
          phoneE164: "+5493510000000",
          displayName: "Geronimo",
          isVerified: true,
          linkedAt: date("2026-04-01T12:00:00-03:00"),
        },
      },
    },
  })

  await prisma.category.createMany({
    data: [
      { id: ids.categories.super, key: "super", name: "Super", color: "#5ee6a8", icon: "shopping-bag", isEssential: true },
      { id: ids.categories.comida, key: "comida", name: "Comida", color: "#ff8a5b", icon: "utensils" },
      { id: ids.categories.transporte, key: "transporte", name: "Transporte", color: "#63b3ff", icon: "car", isEssential: true },
      { id: ids.categories.cafe, key: "cafe", name: "Cafe", color: "#f5c542", icon: "coffee" },
      { id: ids.categories.hogar, key: "hogar", name: "Hogar", color: "#c38cff", icon: "home", isEssential: true },
      { id: ids.categories.servicios, key: "servicios", name: "Servicios", color: "#7dd3fc", icon: "wifi", isEssential: true },
      { id: ids.categories.compras, key: "compras", name: "Compras", color: "#ff6aa2", icon: "wallet-cards" },
    ],
  })

  await prisma.card.createMany({
    data: [
      {
        id: ids.cards.visaGalicia,
        userId: ids.user,
        issuerBank: "Galicia",
        brand: "VISA",
        cardType: "CREDIT",
        lastFour: "4582",
        alias: "Visa Galicia",
        creditLimitCents: BigInt(18000000),
      },
      {
        id: ids.cards.masterBbva,
        userId: ids.user,
        issuerBank: "BBVA",
        brand: "MASTERCARD",
        cardType: "CREDIT",
        lastFour: "7891",
        alias: "Mastercard BBVA",
        creditLimitCents: BigInt(15000000),
      },
      {
        id: ids.cards.amexSantander,
        userId: ids.user,
        issuerBank: "Santander",
        brand: "AMEX",
        cardType: "CREDIT",
        lastFour: "3344",
        alias: "Amex Santander",
        creditLimitCents: BigInt(12000000),
      },
    ],
  })

  const merchants = [
    ["mercadoLibre", "Mercado Libre", "mercado-libre", ids.categories.compras, ["MERCADOLIBRE", "MercadoPago"]],
    ["parolaccia", "La Parolaccia", "la-parolaccia", ids.categories.comida, ["PAROLACCIA"]],
    ["ypf", "YPF", "ypf", ids.categories.transporte, ["YPF SERVICLUB"]],
    ["coto", "Coto", "coto", ids.categories.super, ["COTO CICSA"]],
    ["starbucks", "Starbucks", "starbucks", ids.categories.cafe, ["STARBUCKS COFFEE"]],
    ["personalFlow", "Personal Flow", "personal-flow", ids.categories.servicios, ["TELECOM PERSONAL"]],
    ["farmacity", "Farmacity", "farmacity", ids.categories.super, ["FARMACITY SA"]],
    ["rappi", "Rappi", "rappi", ids.categories.comida, ["RAPPI ARG"]],
    ["netflix", "Netflix", "netflix", ids.categories.servicios, ["NETFLIX.COM"]],
    ["spotify", "Spotify", "spotify", ids.categories.servicios, ["SPOTIFY"]],
    ["icloud", "iCloud", "icloud", ids.categories.servicios, ["APPLE ICLOUD"]],
    ["youtube", "YouTube Premium", "youtube-premium", ids.categories.servicios, ["GOOGLE YOUTUBE"]],
    ["carrefour", "Carrefour Market", "carrefour-market", ids.categories.super, ["CARREFOUR"]],
    ["havanna", "Havanna", "havanna", ids.categories.cafe, ["HAVANNA CAFE"]],
    ["shell", "Shell", "shell", ids.categories.transporte, ["SHELL BOX"]],
  ] as const

  for (const [key, name, slug, categoryId, rawNames] of merchants) {
    await prisma.merchant.create({
      data: {
        id: ids.merchants[key],
        name,
        slug,
        categoryId,
        rawNames: [...rawNames],
        source: key === "carrefour" || key === "havanna" || key === "shell" ? "scraper" : "seed",
      },
    })
  }

  await prisma.merchantLocation.createMany({
    data: [
      {
        id: ids.locations.carrefour,
        merchantId: ids.merchants.carrefour,
        name: "Carrefour Market Nueva Cordoba",
        country: "AR",
        province: "Cordoba",
        city: "Cordoba",
        addressLine: "Nueva Cordoba",
        latitude: "-31.4241000",
        longitude: "-64.1849000",
        geohash: "6d6m5h",
        source: "SCRAPER",
      },
      {
        id: ids.locations.havanna,
        merchantId: ids.merchants.havanna,
        name: "Havanna Nueva Cordoba",
        country: "AR",
        province: "Cordoba",
        city: "Cordoba",
        addressLine: "Nueva Cordoba",
        latitude: "-31.4237000",
        longitude: "-64.1836000",
        geohash: "6d6m5h",
        source: "SCRAPER",
      },
      {
        id: ids.locations.shell,
        merchantId: ids.merchants.shell,
        name: "Shell Cordoba Centro",
        country: "AR",
        province: "Cordoba",
        city: "Cordoba",
        addressLine: "Cordoba Centro",
        latitude: "-31.4200000",
        longitude: "-64.1904000",
        geohash: "6d6m5j",
        source: "SCRAPER",
      },
    ],
  })

  await prisma.userLocationSnapshot.create({
    data: {
      userId: ids.user,
      latitude: "-31.4246000",
      longitude: "-64.1853000",
      accuracyMeters: 180,
      geohash: "6d6m5h",
      city: "Cordoba",
      source: "APP",
      capturedAt: date("2026-04-15T16:10:00-03:00"),
      retentionUntil: date("2026-05-15T16:10:00-03:00"),
    },
  })

  await prisma.ingestionJob.create({
    data: {
      id: ids.ingestionJobs.whatsappCafe,
      userId: ids.user,
      channel: "WHATSAPP",
      inputType: "TEXT",
      rawText: "gaste 6200 en Starbucks con master",
      extractedPayload: {
        amountCents: 620000,
        merchantName: "Starbucks",
        categoryKey: "cafe",
        cardLastFour: "7891",
        occurredAt: "2026-04-12T10:40:00-03:00",
      },
      normalizedPayload: {
        amountCents: 620000,
        currency: "ARS",
        merchantId: ids.merchants.starbucks,
        categoryId: ids.categories.cafe,
        cardId: ids.cards.masterBbva,
        source: "WHATSAPP",
      },
      modelName: "expense-normalizer",
      modelVersion: "v1",
      modelConfidence: "0.8200",
      status: "PROCESSED",
      receivedAt: date("2026-04-12T10:40:00-03:00"),
      processedAt: date("2026-04-12T10:40:09-03:00"),
      events: [
        { nombre: "received", detalle: { channel: "whatsapp" } },
        { nombre: "normalized", detalle: { confidence: 0.82 } },
        { nombre: "transaction_created", detalle: { status: "confirmed" } },
      ],
    },
  })

  await prisma.transaction.createMany({
    data: [
      {
        id: ids.transactions.mercadoLibre,
        userId: ids.user,
        cardId: ids.cards.visaGalicia,
        categoryId: ids.categories.compras,
        merchantId: ids.merchants.mercadoLibre,
        amountCents: BigInt(2450000),
        occurredAt: date("2026-04-15T14:32:00-03:00"),
        description: "Compra en Mercado Libre",
        source: "MANUAL",
        status: "CONFIRMED",
      },
      {
        id: ids.transactions.parolaccia,
        userId: ids.user,
        cardId: ids.cards.masterBbva,
        categoryId: ids.categories.comida,
        merchantId: ids.merchants.parolaccia,
        amountCents: BigInt(1890000),
        occurredAt: date("2026-04-15T13:15:00-03:00"),
        description: "Almuerzo",
        source: "MANUAL",
        status: "CONFIRMED",
      },
      {
        id: ids.transactions.ypf,
        userId: ids.user,
        cardId: ids.cards.visaGalicia,
        categoryId: ids.categories.transporte,
        merchantId: ids.merchants.ypf,
        amountCents: BigInt(4500000),
        occurredAt: date("2026-04-14T18:35:00-03:00"),
        description: "Combustible",
        source: "MANUAL",
        status: "CONFIRMED",
      },
      {
        id: ids.transactions.coto,
        userId: ids.user,
        cardId: ids.cards.visaGalicia,
        categoryId: ids.categories.super,
        merchantId: ids.merchants.coto,
        amountCents: BigInt(3180000),
        occurredAt: date("2026-04-13T19:08:00-03:00"),
        description: "Supermercado",
        source: "MANUAL",
        status: "CONFIRMED",
      },
      {
        id: ids.transactions.starbucks,
        userId: ids.user,
        cardId: ids.cards.masterBbva,
        categoryId: ids.categories.cafe,
        merchantId: ids.merchants.starbucks,
        amountCents: BigInt(620000),
        occurredAt: date("2026-04-12T10:40:00-03:00"),
        description: "Cafe",
        source: "WHATSAPP",
        status: "CONFIRMED",
        confidence: "0.8200",
        ingestionJobId: ids.ingestionJobs.whatsappCafe,
      },
      {
        id: ids.transactions.personalFlow,
        userId: ids.user,
        cardId: ids.cards.amexSantander,
        categoryId: ids.categories.servicios,
        merchantId: ids.merchants.personalFlow,
        amountCents: BigInt(2140000),
        occurredAt: date("2026-04-11T08:00:00-03:00"),
        description: "Servicio internet y telefono",
        source: "IMPORT",
        status: "CONFIRMED",
      },
      {
        id: ids.transactions.farmacity,
        userId: ids.user,
        cardId: ids.cards.visaGalicia,
        categoryId: ids.categories.super,
        merchantId: ids.merchants.farmacity,
        amountCents: BigInt(1280000),
        occurredAt: date("2026-04-10T18:22:00-03:00"),
        description: "Farmacia",
        source: "MANUAL",
        status: "CONFIRMED",
      },
      {
        id: ids.transactions.rappi,
        userId: ids.user,
        cardId: ids.cards.masterBbva,
        categoryId: ids.categories.comida,
        merchantId: ids.merchants.rappi,
        amountCents: BigInt(1570000),
        occurredAt: date("2026-04-08T21:44:00-03:00"),
        description: "Delivery",
        source: "MANUAL",
        status: "CONFIRMED",
      },
    ],
  })

  await prisma.budget.createMany({
    data: [
      {
        userId: ids.user,
        budgetType: "MONTHLY_TOTAL",
        name: "Objetivo mensual",
        period: "2026-04",
        limitCents: BigInt(34000000),
        alertThresholdPercent: 85,
      },
      {
        userId: ids.user,
        categoryId: ids.categories.comida,
        budgetType: "CATEGORY",
        name: "Comida y salidas",
        period: "2026-04",
        limitCents: BigInt(7000000),
        alertThresholdPercent: 80,
      },
      {
        userId: ids.user,
        cardId: ids.cards.visaGalicia,
        budgetType: "CARD",
        name: "Visa Galicia",
        period: "2026-04",
        limitCents: BigInt(18000000),
        alertThresholdPercent: 90,
      },
    ],
  })

  await prisma.subscription.createMany({
    data: [
      {
        userId: ids.user,
        merchantId: ids.merchants.netflix,
        cardId: ids.cards.amexSantander,
        amountCents: BigInt(549900),
        frequency: "MONTHLY",
        nextExpectedAt: date("2026-04-22T00:00:00.000Z"),
        status: "ACTIVE",
        confidence: "0.9400",
        note: "Sube 18% en mayo",
      },
      {
        userId: ids.user,
        merchantId: ids.merchants.spotify,
        cardId: ids.cards.visaGalicia,
        amountCents: BigInt(249900),
        frequency: "MONTHLY",
        nextExpectedAt: date("2026-04-28T00:00:00.000Z"),
        status: "SUSPECTED",
        confidence: "0.7800",
        note: "Posible duplicado",
      },
      {
        userId: ids.user,
        merchantId: ids.merchants.icloud,
        cardId: ids.cards.visaGalicia,
        amountCents: BigInt(129900),
        frequency: "MONTHLY",
        nextExpectedAt: date("2026-05-01T00:00:00.000Z"),
        status: "ACTIVE",
        confidence: "0.9200",
        note: "Normal",
      },
      {
        userId: ids.user,
        merchantId: ids.merchants.youtube,
        cardId: ids.cards.masterBbva,
        amountCents: BigInt(189900),
        frequency: "MONTHLY",
        nextExpectedAt: date("2026-05-05T00:00:00.000Z"),
        status: "ACTIVE",
        confidence: "0.9100",
        note: "Normal",
      },
    ],
  })

  await prisma.promotionSource.create({
    data: {
      id: ids.promotionSource,
      name: "Promociones bancarias seed",
      sourceType: "scraper",
      baseUrl: "https://example.com/promociones",
      scraperRuns: {
        create: {
          status: "SUCCEEDED",
          startedAt: date("2026-04-15T06:00:00-03:00"),
          finishedAt: date("2026-04-15T06:00:21-03:00"),
          itemsFound: 3,
          itemsCreated: 3,
        },
      },
    },
  })

  await prisma.promotion.createMany({
    data: [
      {
        id: ids.promotions.carrefour,
        sourceId: ids.promotionSource,
        merchantId: ids.merchants.carrefour,
        merchantLocationId: ids.locations.carrefour,
        categoryId: ids.categories.super,
        title: "25% reintegro en Carrefour Market",
        issuerBank: "Galicia",
        cardBrand: "VISA",
        cardType: "CREDIT",
        benefitType: "CASHBACK",
        benefitValue: "25.00",
        capCents: BigInt(900000),
        validFrom: date("2026-04-01T00:00:00.000Z"),
        validUntil: date("2026-04-30T00:00:00.000Z"),
        weekdays: [3],
        conditions: "Reintegro semanal con tope por cuenta.",
        sourceUrl: "https://example.com/promociones/carrefour",
        status: "ACTIVE",
      },
      {
        id: ids.promotions.havanna,
        sourceId: ids.promotionSource,
        merchantId: ids.merchants.havanna,
        merchantLocationId: ids.locations.havanna,
        categoryId: ids.categories.cafe,
        title: "2x1 despues de las 16 en Havanna",
        issuerBank: "BBVA",
        cardBrand: "MASTERCARD",
        cardType: "CREDIT",
        benefitType: "TWO_FOR_ONE",
        benefitValue: "2.00",
        validFrom: date("2026-04-01T00:00:00.000Z"),
        validUntil: date("2026-04-30T00:00:00.000Z"),
        weekdays: [1, 2, 3, 4, 5],
        conditions: "Aplica despues de las 16 hs.",
        sourceUrl: "https://example.com/promociones/havanna",
        status: "ACTIVE",
      },
      {
        id: ids.promotions.shell,
        sourceId: ids.promotionSource,
        merchantId: ids.merchants.shell,
        merchantLocationId: ids.locations.shell,
        categoryId: ids.categories.transporte,
        title: "15% combustible en Shell",
        issuerBank: "Galicia",
        cardBrand: "VISA",
        cardType: "CREDIT",
        benefitType: "DISCOUNT",
        benefitValue: "15.00",
        capCents: BigInt(650000),
        validFrom: date("2026-04-01T00:00:00.000Z"),
        validUntil: date("2026-04-30T00:00:00.000Z"),
        weekdays: [2, 4],
        conditions: "Combustible y lubricantes en estaciones adheridas.",
        sourceUrl: "https://example.com/promociones/shell",
        status: "ACTIVE",
      },
    ],
  })

  await prisma.recommendation.createMany({
    data: [
      {
        userId: ids.user,
        type: "DUPLICATE_TRANSACTION",
        title: "Posible cobro duplicado",
        detail: "Spotify aparece dos veces en Visa 4582 durante abril.",
        score: "0.9500",
        status: "NEW",
      },
      {
        userId: ids.user,
        type: "HABIT_CHANGE",
        title: "Comida supera el patron habitual",
        detail: "La categoria subio 18% contra tus ultimas cuatro semanas.",
        score: "0.7200",
        status: "NEW",
      },
      {
        userId: ids.user,
        promotionId: ids.promotions.carrefour,
        type: "PROMO_MATCH",
        title: "Promo cercana disponible",
        detail: "Carrefour Market tiene 25% con Visa Galicia a 180 m.",
        estimatedSavingCents: BigInt(720000),
        score: "0.8800",
        status: "NEW",
      },
      {
        userId: ids.user,
        type: "BUDGET_ALERT",
        title: "Objetivo mensual en riesgo",
        detail: "La proyeccion actual queda $25.800 por encima del objetivo.",
        score: "0.8200",
        status: "NEW",
      },
    ],
  })
}

seed()
  .then(async () => {
    console.log("CapsaAI seed data created")
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
