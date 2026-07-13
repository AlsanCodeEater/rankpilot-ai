-- CreateTable
CREATE TABLE "CollectionSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "shopifyCollectionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "handle" TEXT,
    "bodyHtml" TEXT,
    "sortOrder" TEXT,
    "productsCount" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "lastSyncAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProductSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "lastSyncAt" DATETIME,
    "lastScannedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ProductSnapshot" ("aiScore", "createdAt", "description", "handle", "id", "imageUrl", "issueCount", "lastScannedAt", "productType", "seoDescription", "seoTitle", "shop", "shopifyProductId", "status", "tags", "title", "totalInventory", "updatedAt", "vendor") SELECT "aiScore", "createdAt", "description", "handle", "id", "imageUrl", "issueCount", "lastScannedAt", "productType", "seoDescription", "seoTitle", "shop", "shopifyProductId", "status", "tags", "title", "totalInventory", "updatedAt", "vendor" FROM "ProductSnapshot";
DROP TABLE "ProductSnapshot";
ALTER TABLE "new_ProductSnapshot" RENAME TO "ProductSnapshot";
CREATE INDEX "ProductSnapshot_shop_idx" ON "ProductSnapshot"("shop");
CREATE INDEX "ProductSnapshot_aiScore_idx" ON "ProductSnapshot"("aiScore");
CREATE UNIQUE INDEX "ProductSnapshot_shop_shopifyProductId_key" ON "ProductSnapshot"("shop", "shopifyProductId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "CollectionSnapshot_shop_idx" ON "CollectionSnapshot"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionSnapshot_shop_shopifyCollectionId_key" ON "CollectionSnapshot"("shop", "shopifyCollectionId");
