import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.shopPlan.updateMany({
    data: { 
      planName: "PRO",
      billingStatus: "active" 
    }
  });
  console.log(`Upgraded ${result.count} stores to PRO plan.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
