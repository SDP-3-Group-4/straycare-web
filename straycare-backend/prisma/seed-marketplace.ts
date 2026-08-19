import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const sellerId = 'mock-user-1';

  await prisma.marketplaceItem.createMany({
    data: [
      {
        title: 'Premium Dog Food (Adult) - 5kg',
        description: 'High quality dog food for adult dogs. Rich in protein.',
        price: 3200,
        currency: '৳',
        imageUrl: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119',
        sellerId,
        category: 'Food & Nutrition',
      },
      {
        title: 'Flea & Tick Treatment Spray (250ml)',
        description: 'Effective and safe flea & tick spray for dogs and cats.',
        price: 850,
        currency: '৳',
        imageUrl: '/flea_tick_spray.jpg',
        sellerId,
        category: 'Healthcare',
      }
    ]
  });

  console.log('Seeded 2 marketplace items.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
