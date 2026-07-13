/*
  Warnings:

  - You are about to drop the `CollectionSnapshot` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `applyActionType` on the `AiSuggestion` table. All the data in the column will be lost.
  - You are about to drop the column `shopId` on the `AiSuggestion` table. All the data in the column will be lost.
  - You are about to drop the column `suggestedChange` on the `AiSuggestion` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `AiSuggestion` table. All the data in the column will be lost.
  - You are about to drop the column `bodyHtml` on the `ProductSnapshot` table. All the data in the column will be lost.
  - You are about to drop the column `lastSyncAt` on the `ProductSnapshot` table. All the data in the column will be lost.
  - You are about to drop the column `qualityIssues` on the `ProductSnapshot` table. All the data in the column will be lost.
  - You are about to drop the column `qualityScore` on the `ProductSnapshot` table. All the data in the column will be lost.
  - You are about to drop the column `shopId` on the `ProductSnapshot` table. All the data in the column will be lost.
  - You are about to drop the column `variantsCount` on the `ProductSnapshot` table. All the data in the column will be lost.
  - Added the required column `shop` to the `AiSuggestion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shopifyProductId` to the `AiSuggestion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `suggestionType` to the `AiSuggestion` table without a default value. This is not possible if the table is not empty.
  - Made the column `productSnapshotId` on table `AiSuggestion` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `shop` to the `ProductSnapshot` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "CollectionSnapshot_shopId_shopifyCollectionId_key";

-- DropIndex
DROP INDEX "CollectionSnapshot_shopId_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CollectionSnapshot";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AiSuggestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "productSnapshotId" TEXT NOT NULL,
    "shopifyProductId" TEXT NOT NULL,
    "suggestionType" TEXT NOT NULL,
    "issue" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "confidenceScore" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "appliedAt" DATETIME,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AiSuggestion_productSnapshotId_fkey" FOREIGN KEY ("productSnapshotId") REFERENCES "ProductSnapshot" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AiSuggestion" ("appliedAt", "confidenceScore", "createdAt", "id", "issue", "productSnapshotId", "reason", "status", "updatedAt") SELECT "appliedAt", "confidenceScore", "createdAt", "id", "issue", "productSnapshotId", "reason", "status", "updatedAt" FROM "AiSuggestion";
DROP TABLE "AiSuggestion";
ALTER TABLE "new_AiSuggestion" RENAME TO "AiSuggestion";
CREATE INDEX "AiSuggestion_shop_idx" ON "AiSuggestion"("shop");
CREATE INDEX "AiSuggestion_status_idx" ON "AiSuggestion"("status");
CREATE INDEX "AiSuggestion_suggestionType_idx" ON "AiSuggestion"("suggestionType");
CREATE TABLE "new_ProductSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "shopifyProductId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "handle" TEXT,
    "description" TEXT,
    "vendor" TEXT,
    "productType" TEXT,
    "tags" TEXT,
    "status" TEXT,
    "totalInventory" INTEGER,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "imageUrl" TEXT,
    "aiScore" INTEGER,
    "issueCount" INTEGER NOT NULL DEFAULT 0,
    "lastScannedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ProductSnapshot" ("createdAt", "handle", "id", "imageUrl", "productType", "shopifyProductId", "status", "tags", "title", "totalInventory", "updatedAt", "vendor") SELECT "createdAt", "handle", "id", "imageUrl", "productType", "shopifyProductId", "status", "tags", "title", "totalInventory", "updatedAt", "vendor" FROM "ProductSnapshot";
DROP TABLE "ProductSnapshot";
ALTER TABLE "new_ProductSnapshot" RENAME TO "ProductSnapshot";
CREATE INDEX "ProductSnapshot_shop_idx" ON "ProductSnapshot"("shop");
CREATE INDEX "ProductSnapshot_aiScore_idx" ON "ProductSnapshot"("aiScore");
CREATE UNIQUE INDEX "ProductSnapshot_shop_shopifyProductId_key" ON "ProductSnapshot"("shop", "shopifyProductId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
