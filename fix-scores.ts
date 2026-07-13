import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.productSnapshot.updateMany({
    where: { issueCount: 0, aiScore: { lt: 100 } },
    data: { aiScore: 100 }
  });
  console.log(`Updated ${result.count} products to score 100.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
