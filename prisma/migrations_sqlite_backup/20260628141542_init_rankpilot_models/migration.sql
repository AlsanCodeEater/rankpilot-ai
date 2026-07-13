-- CreateTable
CREATE TABLE "Shop" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopDomain" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "plan" TEXT,
    "currency" TEXT,
    "timezone" TEXT,
    "lastSyncAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProductSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" TEXT NOT NULL,
    "shopifyProductId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "handle" TEXT,
    "vendor" TEXT,
    "productType" TEXT,
    "tags" TEXT,
    "status" TEXT,
    "bodyHtml" TEXT,
    "imageUrl" TEXT,
    "totalInventory" INTEGER NOT NULL DEFAULT 0,
    "variantsCount" INTEGER NOT NULL DEFAULT 0,
    "qualityScore" REAL,
    "qualityIssues" TEXT,
    "lastSyncAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductSnapshot_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CollectionSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" TEXT NOT NULL,
    "shopifyCollectionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "handle" TEXT,
    "bodyHtml" TEXT,
    "sortOrder" TEXT,
    "productsCount" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "lastSyncAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CollectionSnapshot_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AiSuggestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" TEXT NOT NULL,
    "productSnapshotId" TEXT,
    "type" TEXT NOT NULL,
    "issue" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "suggestedChange" TEXT NOT NULL,
    "confidenceScore" REAL NOT NULL,
    "applyActionType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "appliedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AiSuggestion_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AiSuggestion_productSnapshotId_fkey" FOREIGN KEY ("productSnapshotId") REFERENCES "ProductSnapshot" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Shop_shopDomain_key" ON "Shop"("shopDomain");

-- CreateIndex
CREATE INDEX "ProductSnapshot_shopId_idx" ON "ProductSnapshot"("shopId");

-- CreateIndex
CREATE INDEX "ProductSnapshot_qualityScore_idx" ON "ProductSnapshot"("qualityScore");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSnapshot_shopId_shopifyProductId_key" ON "ProductSnapshot"("shopId", "shopifyProductId");

-- CreateIndex
CREATE INDEX "CollectionSnapshot_shopId_idx" ON "CollectionSnapshot"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionSnapshot_shopId_shopifyCollectionId_key" ON "CollectionSnapshot"("shopId", "shopifyCollectionId");

-- CreateIndex
CREATE INDEX "AiSuggestion_shopId_idx" ON "AiSuggestion"("shopId");

-- CreateIndex
CREATE INDEX "AiSuggestion_status_idx" ON "AiSuggestion"("status");

-- CreateIndex
CREATE INDEX "AiSuggestion_productSnapshotId_idx" ON "AiSuggestion"("productSnapshotId");
