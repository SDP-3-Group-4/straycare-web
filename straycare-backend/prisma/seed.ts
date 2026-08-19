import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const user1 = await prisma.user.upsert({
    where: { handle: 'sarahj' },
    update: {},
    create: {
      id: 'mock-user-1',
      email: 'sarah@example.com',
      displayName: 'Sarah Jenkins',
      handle: 'sarahj',
      photoUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704b',
      bio: 'Animal lover',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { handle: 'cityrescue' },
    update: {},
    create: {
      id: 'mock-user-2',
      email: 'rescue@example.com',
      displayName: 'City Animal Rescue',
      handle: 'cityrescue',
      photoUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704c',
      verifiedStatus: true,
      bio: 'Official City Rescue Organization',
    },
  });

  const user3 = await prisma.user.upsert({
    where: { handle: 'miked' },
    update: {},
    create: {
      id: 'mock-user-3',
      email: 'mike@example.com',
      displayName: 'Mike Davies',
      handle: 'miked',
      photoUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704e',
      bio: 'Cat dad',
    },
  });

  await prisma.post.create({
    data: {
      authorId: user1.id,
      content: 'Found this sweet stray puppy near the central park. Very friendly and seems to be around 3 months old. Needs a loving home! 🐾',
      category: 'adoption',
      imageUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      likesCount: 24,
      commentsCount: 5,
    },
  });

  await prisma.post.create({
    data: {
      authorId: user2.id,
      content: "🚨 URGENT: We need funds for Max's surgery. He was hit by a car and has a fractured leg. Every little bit helps! Please donate to save him.",
      category: 'fundraise',
      imageUrl: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      likesCount: 156,
      commentsCount: 32,
    },
  });

  await prisma.post.create({
    data: {
      authorId: user3.id,
      content: "My adopted cat Luna just learned how to fetch! Never thought I'd see the day. 😂",
      category: 'fun',
      likesCount: 89,
      commentsCount: 12,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
