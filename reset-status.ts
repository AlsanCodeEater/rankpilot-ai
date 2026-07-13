import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const updated = await prisma.aiSuggestion.updateMany({
    where: { status: 'failed' },
    data: { status: 'pending', errorMessage: null }
  })
  console.log(`Reset ${updated.count} failed suggestions back to pending.`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
