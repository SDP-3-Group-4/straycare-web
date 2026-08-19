import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { initializeApp, cert, deleteApp, App } from 'firebase-admin/app';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';
import * as fs from 'fs';

@Injectable()
export class FirebaseService implements OnModuleInit, OnModuleDestroy {
  private app: App;

  onModuleInit() {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

    if (!projectId || !serviceAccountPath) {
      throw new Error(
        'FIREBASE_PROJECT_ID and FIREBASE_SERVICE_ACCOUNT_PATH must be set in .env',
      );
    }
    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error(
        `Firebase service account file not found: ${serviceAccountPath}`,
      );
    }

    const serviceAccount = JSON.parse(
      fs.readFileSync(serviceAccountPath, 'utf8'),
    );
    this.app = initializeApp({
      credential: cert(serviceAccount),
      projectId,
    });
  }

  async verifyIdToken(token: string): Promise<DecodedIdToken> {
    return getAuth(this.app).verifyIdToken(token);
  }

  async revokeRefreshTokens(uid: string) {
    return getAuth(this.app).revokeRefreshTokens(uid);
  }

  onModuleDestroy() {
    if (this.app) {
      deleteApp(this.app);
    }
  }
}
