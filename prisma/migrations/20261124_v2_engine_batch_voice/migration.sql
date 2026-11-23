-- v2-engine: batch audit runs + brand voice + autopilot flag

CREATE TABLE "BatchAuditRun" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "anthropicBatchId" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "requested" INTEGER NOT NULL DEFAULT 0,
    "completed" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "totalSuggestions" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "BatchAuditRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BatchAuditRun_shop_idx" ON "BatchAuditRun"("shop");
CREATE INDEX "BatchAuditRun_shop_status_idx" ON "BatchAuditRun"("shop", "status");

ALTER TABLE "ShopSettings" ADD COLUMN "voiceTone" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ShopSettings" ADD COLUMN "voiceAudience" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ShopSettings" ADD COLUMN "voiceKeywords" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ShopSettings" ADD COLUMN "voiceBannedWords" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ShopSettings" ADD COLUMN "autopilot" BOOLEAN NOT NULL DEFAULT false;
