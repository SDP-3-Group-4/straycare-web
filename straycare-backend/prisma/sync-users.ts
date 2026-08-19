import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
import * as path from 'path';
import * as fs from 'fs';
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const serviceAccountPath = 'F:\\SW_Development\\straycare-dev-firebase-adminsdk-fbsvc-e1b44fa237.json';
  
  if (!fs.existsSync(serviceAccountPath)) {
    console.error(`❌ Could not find service account key at ${serviceAccountPath}`);
    process.exit(1);
  }

  const serviceAccount = require(serviceAccountPath);

  initializeApp({
    credential: cert(serviceAccount)
  });

  const db = getFirestore();

  console.log('Fetching users from Firebase Firestore...');
  const usersSnapshot = await db.collection('users').get();
  
  if (usersSnapshot.empty) {
    console.log('No users found in Firestore.');
    return;
  }

  console.log(`Found ${usersSnapshot.size} users. Syncing to PostgreSQL...`);

  let count = 0;
  for (const doc of usersSnapshot.docs) {
    const data = doc.data();
    
    // Map Firestore fields to our Prisma schema
    try {
      await prisma.user.upsert({
        where: { id: doc.id }, // Firebase UID is the document ID
        update: {
          email: data.email || `${doc.id}@example.com`,
          displayName: data.displayName || data.name || 'Unknown User',
          handle: data.handle || data.username || doc.id,
          photoUrl: data.photoUrl || data.photoURL || data.avatarUrl || null,
          bio: data.bio || null,
          location: data.location || null,
          verifiedStatus: data.verifiedStatus || data.isVerified || false,
        },
        create: {
          id: doc.id,
          email: data.email || `${doc.id}@example.com`,
          displayName: data.displayName || data.name || 'Unknown User',
          handle: data.handle || data.username || doc.id,
          photoUrl: data.photoUrl || data.photoURL || data.avatarUrl || null,
          bio: data.bio || null,
          location: data.location || null,
          verifiedStatus: data.verifiedStatus || data.isVerified || false,
        }
      });
      console.log(`✅ Synced user: ${data.email || doc.id}`);
      count++;
    } catch (err: any) {
      console.error(`❌ Failed to sync user ${doc.id}: ${err.message}`);
    }
  }

  console.log(`\n🎉 Successfully synced ${count} users into PostgreSQL!`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('Fatal Error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
