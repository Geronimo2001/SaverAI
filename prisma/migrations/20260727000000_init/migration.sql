-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED', 'DELETED');

-- CreateEnum
CREATE TYPE "CardType" AS ENUM ('CREDIT', 'DEBIT', 'PREPAID');

-- CreateEnum
CREATE TYPE "CardBrand" AS ENUM ('VISA', 'MASTERCARD', 'AMEX', 'OTHER');

-- CreateEnum
CREATE TYPE "TransactionSource" AS ENUM ('MANUAL', 'WHATSAPP', 'RECEIPT', 'EMAIL', 'IMPORT', 'API');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING_CONFIRMATION', 'CONFIRMED', 'REJECTED', 'DELETED');

-- CreateEnum
CREATE TYPE "IngestionChannel" AS ENUM ('APP', 'WHATSAPP', 'EMAIL', 'ADMIN');

-- CreateEnum
CREATE TYPE "IngestionInputType" AS ENUM ('TEXT', 'IMAGE', 'PDF', 'AUDIO', 'CSV', 'API');

-- CreateEnum
CREATE TYPE "IngestionStatus" AS ENUM ('RECEIVED', 'PROCESSING', 'NEEDS_CONFIRMATION', 'PROCESSED', 'FAILED');

-- CreateEnum
CREATE TYPE "BudgetType" AS ENUM ('MONTHLY_TOTAL', 'CATEGORY', 'CARD', 'ESSENTIAL', 'DISCRETIONARY');

-- CreateEnum
CREATE TYPE "SubscriptionFrequency" AS ENUM ('WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('SUSPECTED', 'ACTIVE', 'DISMISSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PromotionBenefitType" AS ENUM ('DISCOUNT', 'CASHBACK', 'INSTALLMENTS', 'TWO_FOR_ONE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "PromotionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'DISABLED', 'DRAFT');

-- CreateEnum
CREATE TYPE "ScraperRunStatus" AS ENUM ('RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "RecommendationType" AS ENUM ('BUDGET_ALERT', 'PROMO_MATCH', 'HABIT_CHANGE', 'SUBSCRIPTION', 'CHEAPER_OPTION', 'DUPLICATE_TRANSACTION');

-- CreateEnum
CREATE TYPE "RecommendationStatus" AS ENUM ('NEW', 'VIEWED', 'APPLIED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('PUSH', 'WHATSAPP', 'EMAIL');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "LocationSource" AS ENUM ('APP', 'WHATSAPP', 'MAPS', 'SCRAPER', 'MANUAL');

-- CreateEnum
CREATE TYPE "GroupRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('INVITED', 'ACTIVE', 'REMOVED');

-- CreateEnum
CREATE TYPE "SplitMethod" AS ENUM ('EQUAL', 'PERCENTAGE', 'AMOUNT', 'SHARES');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "fullName" TEXT NOT NULL,
    "phoneE164" TEXT,
    "country" TEXT NOT NULL DEFAULT 'AR',
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "timezone" TEXT NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "notificationChannels" TEXT[] DEFAULT ARRAY['push']::TEXT[],
    "alertThresholdPercent" INTEGER NOT NULL DEFAULT 85,
    "locationPromosEnabled" BOOLEAN NOT NULL DEFAULT false,
    "patternAlertsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "duplicateDetectionEnabled" BOOLEAN NOT NULL DEFAULT true,
    "whatsappIngestionEnabled" BOOLEAN NOT NULL DEFAULT false,
    "whatsappConfirmEveryCharge" BOOLEAN NOT NULL DEFAULT true,
    "dataRetentionDays" INTEGER,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_accounts" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "provider" TEXT NOT NULL DEFAULT 'meta',
    "phoneE164" TEXT NOT NULL,
    "providerUserId" TEXT,
    "displayName" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "linkedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "whatsapp_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cards" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "issuerBank" TEXT NOT NULL,
    "brand" "CardBrand" NOT NULL,
    "cardType" "CardType" NOT NULL,
    "lastFour" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "creditLimitCents" BIGINT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "isEssential" BOOLEAN NOT NULL DEFAULT false,
    "parentId" UUID,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merchants" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "rawNames" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "categoryId" UUID,
    "country" TEXT NOT NULL DEFAULT 'AR',
    "websiteUrl" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "merchants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merchant_aliases" (
    "id" UUID NOT NULL,
    "merchantId" UUID NOT NULL,
    "alias" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'model',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "merchant_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merchant_locations" (
    "id" UUID NOT NULL,
    "merchantId" UUID NOT NULL,
    "name" TEXT,
    "country" TEXT NOT NULL DEFAULT 'AR',
    "province" TEXT,
    "city" TEXT,
    "addressLine" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "geohash" TEXT,
    "externalPlaceId" TEXT,
    "source" "LocationSource" NOT NULL DEFAULT 'MANUAL',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "merchant_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "cardId" UUID,
    "categoryId" UUID,
    "merchantId" UUID,
    "merchantLocationId" UUID,
    "ingestionJobId" UUID,
    "amountCents" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "occurredAt" TIMESTAMPTZ(6) NOT NULL,
    "description" TEXT,
    "notes" TEXT,
    "source" "TransactionSource" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'CONFIRMED',
    "confidence" DECIMAL(5,4),
    "duplicateOfId" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_items" (
    "id" UUID NOT NULL,
    "transactionId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DECIMAL(10,3),
    "unitAmountCents" BIGINT,
    "totalAmountCents" BIGINT NOT NULL,
    "rawText" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_attachments" (
    "id" UUID NOT NULL,
    "transactionId" UUID NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSizeBytes" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'receipt',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingestion_jobs" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "channel" "IngestionChannel" NOT NULL,
    "inputType" "IngestionInputType" NOT NULL,
    "rawText" TEXT,
    "fileUrl" TEXT,
    "rawPayload" JSONB,
    "extractedPayload" JSONB,
    "normalizedPayload" JSONB,
    "modelName" TEXT,
    "modelVersion" TEXT,
    "modelConfidence" DECIMAL(5,4),
    "status" "IngestionStatus" NOT NULL DEFAULT 'RECEIVED',
    "errorMessage" TEXT,
    "receivedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "processedAt" TIMESTAMPTZ(6),

    CONSTRAINT "ingestion_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingestion_events" (
    "id" UUID NOT NULL,
    "ingestionJobId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "detail" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ingestion_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budgets" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "categoryId" UUID,
    "cardId" UUID,
    "transactionId" UUID,
    "budgetType" "BudgetType" NOT NULL,
    "name" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "limitCents" BIGINT NOT NULL,
    "alertThresholdPercent" INTEGER NOT NULL DEFAULT 85,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "merchantId" UUID NOT NULL,
    "cardId" UUID,
    "transactionId" UUID,
    "amountCents" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "frequency" "SubscriptionFrequency" NOT NULL,
    "nextExpectedAt" DATE NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'SUSPECTED',
    "confidence" DECIMAL(5,4),
    "note" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_sources" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'scraper',
    "baseUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "promotion_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scraper_runs" (
    "id" UUID NOT NULL,
    "sourceId" UUID NOT NULL,
    "status" "ScraperRunStatus" NOT NULL DEFAULT 'RUNNING',
    "startedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMPTZ(6),
    "itemsFound" INTEGER NOT NULL DEFAULT 0,
    "itemsCreated" INTEGER NOT NULL DEFAULT 0,
    "itemsUpdated" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "rawSummary" JSONB,

    CONSTRAINT "scraper_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotions" (
    "id" UUID NOT NULL,
    "sourceId" UUID,
    "merchantId" UUID,
    "merchantLocationId" UUID,
    "categoryId" UUID,
    "title" TEXT NOT NULL,
    "issuerBank" TEXT,
    "cardBrand" "CardBrand",
    "cardType" "CardType",
    "benefitType" "PromotionBenefitType" NOT NULL,
    "benefitValue" DECIMAL(10,2),
    "capCents" BIGINT,
    "minPurchaseCents" BIGINT,
    "validFrom" DATE NOT NULL,
    "validUntil" DATE NOT NULL,
    "weekdays" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "conditions" TEXT,
    "sourceUrl" TEXT,
    "externalId" TEXT,
    "rawPayload" JSONB,
    "status" "PromotionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendations" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "promotionId" UUID,
    "type" "RecommendationType" NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "estimatedSavingCents" BIGINT,
    "score" DECIMAL(8,4) NOT NULL DEFAULT 0,
    "status" "RecommendationStatus" NOT NULL DEFAULT 'NEW',
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "recommendationId" UUID,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'QUEUED',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "errorMessage" TEXT,
    "scheduledAt" TIMESTAMPTZ(6),
    "sentAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_location_snapshots" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "accuracyMeters" INTEGER,
    "geohash" TEXT,
    "city" TEXT,
    "source" "LocationSource" NOT NULL DEFAULT 'APP',
    "capturedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retentionUntil" TIMESTAMPTZ(6),

    CONSTRAINT "user_location_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" UUID NOT NULL,
    "ownerUserId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_members" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "GroupRole" NOT NULL DEFAULT 'MEMBER',
    "status" "MemberStatus" NOT NULL DEFAULT 'INVITED',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_expenses" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "transactionId" UUID,
    "paidByUserId" UUID NOT NULL,
    "splitMethod" "SplitMethod" NOT NULL DEFAULT 'EQUAL',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "shared_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_expense_splits" (
    "id" UUID NOT NULL,
    "sharedExpenseId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "amountCents" BIGINT NOT NULL,
    "percentage" DECIMAL(7,4),
    "settledAt" TIMESTAMPTZ(6),

    CONSTRAINT "shared_expense_splits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phoneE164_key" ON "users"("phoneE164");

-- CreateIndex
CREATE INDEX "users_status_createdAt_idx" ON "users"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");

-- CreateIndex
CREATE INDEX "whatsapp_accounts_userId_idx" ON "whatsapp_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_accounts_provider_phoneE164_key" ON "whatsapp_accounts"("provider", "phoneE164");

-- CreateIndex
CREATE INDEX "cards_userId_active_idx" ON "cards"("userId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "cards_userId_issuerBank_brand_lastFour_key" ON "cards"("userId", "issuerBank", "brand", "lastFour");

-- CreateIndex
CREATE UNIQUE INDEX "categories_key_key" ON "categories"("key");

-- CreateIndex
CREATE INDEX "categories_userId_active_idx" ON "categories"("userId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "merchants_slug_key" ON "merchants"("slug");

-- CreateIndex
CREATE INDEX "merchants_categoryId_idx" ON "merchants"("categoryId");

-- CreateIndex
CREATE INDEX "merchant_aliases_alias_idx" ON "merchant_aliases"("alias");

-- CreateIndex
CREATE UNIQUE INDEX "merchant_aliases_merchantId_alias_key" ON "merchant_aliases"("merchantId", "alias");

-- CreateIndex
CREATE INDEX "merchant_locations_merchantId_active_idx" ON "merchant_locations"("merchantId", "active");

-- CreateIndex
CREATE INDEX "merchant_locations_latitude_longitude_idx" ON "merchant_locations"("latitude", "longitude");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_ingestionJobId_key" ON "transactions"("ingestionJobId");

-- CreateIndex
CREATE INDEX "transactions_userId_occurredAt_idx" ON "transactions"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "transactions_userId_categoryId_occurredAt_idx" ON "transactions"("userId", "categoryId", "occurredAt");

-- CreateIndex
CREATE INDEX "transactions_userId_cardId_occurredAt_idx" ON "transactions"("userId", "cardId", "occurredAt");

-- CreateIndex
CREATE INDEX "transactions_userId_merchantId_occurredAt_idx" ON "transactions"("userId", "merchantId", "occurredAt");

-- CreateIndex
CREATE INDEX "transactions_status_createdAt_idx" ON "transactions"("status", "createdAt");

-- CreateIndex
CREATE INDEX "transaction_items_transactionId_idx" ON "transaction_items"("transactionId");

-- CreateIndex
CREATE INDEX "transaction_attachments_transactionId_idx" ON "transaction_attachments"("transactionId");

-- CreateIndex
CREATE INDEX "ingestion_jobs_status_createdAt_idx" ON "ingestion_jobs"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ingestion_jobs_userId_createdAt_idx" ON "ingestion_jobs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ingestion_events_ingestionJobId_createdAt_idx" ON "ingestion_events"("ingestionJobId", "createdAt");

-- CreateIndex
CREATE INDEX "budgets_userId_period_active_idx" ON "budgets"("userId", "period", "active");

-- CreateIndex
CREATE INDEX "budgets_userId_budgetType_period_idx" ON "budgets"("userId", "budgetType", "period");

-- CreateIndex
CREATE INDEX "subscriptions_userId_status_idx" ON "subscriptions"("userId", "status");

-- CreateIndex
CREATE INDEX "subscriptions_nextExpectedAt_idx" ON "subscriptions"("nextExpectedAt");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_sources_name_sourceType_key" ON "promotion_sources"("name", "sourceType");

-- CreateIndex
CREATE INDEX "scraper_runs_sourceId_startedAt_idx" ON "scraper_runs"("sourceId", "startedAt");

-- CreateIndex
CREATE INDEX "scraper_runs_status_startedAt_idx" ON "scraper_runs"("status", "startedAt");

-- CreateIndex
CREATE INDEX "promotions_status_validUntil_idx" ON "promotions"("status", "validUntil");

-- CreateIndex
CREATE INDEX "promotions_merchantId_status_idx" ON "promotions"("merchantId", "status");

-- CreateIndex
CREATE INDEX "promotions_categoryId_status_idx" ON "promotions"("categoryId", "status");

-- CreateIndex
CREATE INDEX "promotions_issuerBank_cardBrand_cardType_idx" ON "promotions"("issuerBank", "cardBrand", "cardType");

-- CreateIndex
CREATE INDEX "recommendations_userId_status_createdAt_idx" ON "recommendations"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "recommendations_type_createdAt_idx" ON "recommendations"("type", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_status_createdAt_idx" ON "notifications"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_channel_status_scheduledAt_idx" ON "notifications"("channel", "status", "scheduledAt");

-- CreateIndex
CREATE INDEX "user_location_snapshots_userId_capturedAt_idx" ON "user_location_snapshots"("userId", "capturedAt");

-- CreateIndex
CREATE INDEX "user_location_snapshots_latitude_longitude_idx" ON "user_location_snapshots"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "groups_ownerUserId_idx" ON "groups"("ownerUserId");

-- CreateIndex
CREATE INDEX "group_members_userId_groupId_idx" ON "group_members"("userId", "groupId");

-- CreateIndex
CREATE UNIQUE INDEX "group_members_groupId_userId_key" ON "group_members"("groupId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "shared_expenses_transactionId_key" ON "shared_expenses"("transactionId");

-- CreateIndex
CREATE INDEX "shared_expenses_groupId_createdAt_idx" ON "shared_expenses"("groupId", "createdAt");

-- CreateIndex
CREATE INDEX "shared_expenses_paidByUserId_idx" ON "shared_expenses"("paidByUserId");

-- CreateIndex
CREATE INDEX "shared_expense_splits_userId_idx" ON "shared_expense_splits"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "shared_expense_splits_sharedExpenseId_userId_key" ON "shared_expense_splits"("sharedExpenseId", "userId");

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_accounts" ADD CONSTRAINT "whatsapp_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merchants" ADD CONSTRAINT "merchants_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merchant_aliases" ADD CONSTRAINT "merchant_aliases_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merchant_locations" ADD CONSTRAINT "merchant_locations_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_duplicateOfId_fkey" FOREIGN KEY ("duplicateOfId") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_ingestionJobId_fkey" FOREIGN KEY ("ingestionJobId") REFERENCES "ingestion_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_merchantLocationId_fkey" FOREIGN KEY ("merchantLocationId") REFERENCES "merchant_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_attachments" ADD CONSTRAINT "transaction_attachments_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingestion_jobs" ADD CONSTRAINT "ingestion_jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingestion_events" ADD CONSTRAINT "ingestion_events_ingestionJobId_fkey" FOREIGN KEY ("ingestionJobId") REFERENCES "ingestion_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scraper_runs" ADD CONSTRAINT "scraper_runs_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "promotion_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_merchantLocationId_fkey" FOREIGN KEY ("merchantLocationId") REFERENCES "merchant_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "promotion_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "recommendations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_location_snapshots" ADD CONSTRAINT "user_location_snapshots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_expenses" ADD CONSTRAINT "shared_expenses_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_expenses" ADD CONSTRAINT "shared_expenses_paidByUserId_fkey" FOREIGN KEY ("paidByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_expenses" ADD CONSTRAINT "shared_expenses_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_expense_splits" ADD CONSTRAINT "shared_expense_splits_sharedExpenseId_fkey" FOREIGN KEY ("sharedExpenseId") REFERENCES "shared_expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
