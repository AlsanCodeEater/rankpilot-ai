-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,
    "refreshToken" TEXT,
    "refreshTokenExpires" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shop" (
    "id" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "plan" TEXT,
    "currency" TEXT,
    "timezone" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSnapshot" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "shopifyProductId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "handle" TEXT,
    "description" TEXT,
    "bodyHtml" TEXT,
    "vendor" TEXT,
    "productType" TEXT,
    "tags" TEXT,
    "status" TEXT,
    "totalInventory" INTEGER,
    "variantsCount" INTEGER NOT NULL DEFAULT 0,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "imageUrl" TEXT,
    "aiScore" INTEGER,
    "issueCount" INTEGER NOT NULL DEFAULT 0,
    "lastSyncAt" TIMESTAMP(3),
    "lastScannedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionSnapshot" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "shopifyCollectionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "handle" TEXT,
    "bodyHtml" TEXT,
    "sortOrder" TEXT,
    "productsCount" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectionSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiSuggestion" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "productSnapshotId" TEXT NOT NULL,
    "shopifyProductId" TEXT NOT NULL,
    "suggestionType" TEXT NOT NULL,
    "issue" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "appliedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopSettings" (
    "id" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "aiProvider" TEXT NOT NULL DEFAULT 'openai',
    "aiApiKey" TEXT,
    "aiModel" TEXT NOT NULL DEFAULT 'gpt-4o-mini',
    "syncFrequency" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopPlan" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "planName" TEXT NOT NULL DEFAULT 'FREE',
    "billingStatus" TEXT NOT NULL DEFAULT 'free',
    "shopifySubscriptionId" TEXT,
    "trialEndsAt" TIMESTAMP(3),
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageRecord" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "periodKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreEvent" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "productId" TEXT,
    "collectionId" TEXT,
    "searchQuery" TEXT,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BetaMerchant" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "email" TEXT,
    "storeName" TEXT,
    "niche" TEXT,
    "productCountEstimate" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'invited',
    "notes" TEXT,
    "betaEndsAt" TIMESTAMP(3),
    "installedAt" TIMESTAMP(3),
    "firstAuditAt" TIMESTAMP(3),
    "firstSuggestionAppliedAt" TIMESTAMP(3),
    "feedbackCollectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BetaMerchant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductAnalyticsDaily" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "productViews" INTEGER NOT NULL DEFAULT 0,
    "addToCarts" INTEGER NOT NULL DEFAULT 0,
    "searchHits" INTEGER NOT NULL DEFAULT 0,
    "collectionHits" INTEGER NOT NULL DEFAULT 0,
    "checkoutStarts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductAnalyticsDaily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PixelInstall" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "webPixelId" TEXT,
    "endpoint" TEXT NOT NULL,
    "secretHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'inactive',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PixelInstall_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shop_shopDomain_key" ON "Shop"("shopDomain");

-- CreateIndex
CREATE INDEX "ProductSnapshot_shop_idx" ON "ProductSnapshot"("shop");

-- CreateIndex
CREATE INDEX "ProductSnapshot_aiScore_idx" ON "ProductSnapshot"("aiScore");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSnapshot_shop_shopifyProductId_key" ON "ProductSnapshot"("shop", "shopifyProductId");

-- CreateIndex
CREATE INDEX "CollectionSnapshot_shop_idx" ON "CollectionSnapshot"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionSnapshot_shop_shopifyCollectionId_key" ON "CollectionSnapshot"("shop", "shopifyCollectionId");

-- CreateIndex
CREATE INDEX "AiSuggestion_shop_idx" ON "AiSuggestion"("shop");

-- CreateIndex
CREATE INDEX "AiSuggestion_status_idx" ON "AiSuggestion"("status");

-- CreateIndex
CREATE INDEX "AiSuggestion_suggestionType_idx" ON "AiSuggestion"("suggestionType");

-- CreateIndex
CREATE UNIQUE INDEX "ShopSettings_shopDomain_key" ON "ShopSettings"("shopDomain");

-- CreateIndex
CREATE UNIQUE INDEX "ShopPlan_shop_key" ON "ShopPlan"("shop");

-- CreateIndex
CREATE INDEX "UsageRecord_shop_idx" ON "UsageRecord"("shop");

-- CreateIndex
CREATE INDEX "UsageRecord_type_idx" ON "UsageRecord"("type");

-- CreateIndex
CREATE INDEX "UsageRecord_periodKey_idx" ON "UsageRecord"("periodKey");

-- CreateIndex
CREATE UNIQUE INDEX "UsageRecord_shop_type_periodKey_key" ON "UsageRecord"("shop", "type", "periodKey");

-- CreateIndex
CREATE INDEX "StoreEvent_shop_idx" ON "StoreEvent"("shop");

-- CreateIndex
CREATE INDEX "StoreEvent_eventName_idx" ON "StoreEvent"("eventName");

-- CreateIndex
CREATE INDEX "StoreEvent_productId_idx" ON "StoreEvent"("productId");

-- CreateIndex
CREATE INDEX "StoreEvent_eventDate_idx" ON "StoreEvent"("eventDate");

-- CreateIndex
CREATE UNIQUE INDEX "BetaMerchant_shop_key" ON "BetaMerchant"("shop");

-- CreateIndex
CREATE INDEX "BetaMerchant_shop_idx" ON "BetaMerchant"("shop");

-- CreateIndex
CREATE INDEX "BetaMerchant_status_idx" ON "BetaMerchant"("status");

-- CreateIndex
CREATE INDEX "ProductAnalyticsDaily_shop_idx" ON "ProductAnalyticsDaily"("shop");

-- CreateIndex
CREATE INDEX "ProductAnalyticsDaily_productId_idx" ON "ProductAnalyticsDaily"("productId");

-- CreateIndex
CREATE INDEX "ProductAnalyticsDaily_dateKey_idx" ON "ProductAnalyticsDaily"("dateKey");

-- CreateIndex
CREATE UNIQUE INDEX "ProductAnalyticsDaily_shop_productId_dateKey_key" ON "ProductAnalyticsDaily"("shop", "productId", "dateKey");

-- CreateIndex
CREATE UNIQUE INDEX "PixelInstall_shop_key" ON "PixelInstall"("shop");

-- AddForeignKey
ALTER TABLE "AiSuggestion" ADD CONSTRAINT "AiSuggestion_productSnapshotId_fkey" FOREIGN KEY ("productSnapshotId") REFERENCES "ProductSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageRecord" ADD CONSTRAINT "UsageRecord_shop_fkey" FOREIGN KEY ("shop") REFERENCES "ShopPlan"("shop") ON DELETE CASCADE ON UPDATE CASCADE;

