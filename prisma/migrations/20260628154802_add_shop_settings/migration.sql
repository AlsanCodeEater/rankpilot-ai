-- CreateTable
CREATE TABLE "ShopSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopDomain" TEXT NOT NULL,
    "aiProvider" TEXT NOT NULL DEFAULT 'openai',
    "aiApiKey" TEXT,
    "aiModel" TEXT NOT NULL DEFAULT 'gpt-4o-mini',
    "syncFrequency" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopSettings_shopDomain_key" ON "ShopSettings"("shopDomain");
