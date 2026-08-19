import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.post.updateMany({
    data: {
      latitude: 40.7128,
      longitude: -74.0060,
    }
  });
  console.log("Updated all posts with a default location!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
