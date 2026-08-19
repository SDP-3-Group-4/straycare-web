import { AuthenticatedUser } from './firebase-auth.guard';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
