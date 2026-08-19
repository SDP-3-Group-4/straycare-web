import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up all existing posts...');
  
  const result = await prisma.post.deleteMany({});
  
  console.log(`Deleted ${result.count} posts.`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
