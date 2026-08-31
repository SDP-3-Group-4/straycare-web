import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth } from '../firebase';
import { fetchUserProfile, createUserProfile, updateUserProfile, fetchUsers, touchPresence } from '../services/api';
import { UNAUTHORIZED_EVENT } from '../services/api';

export interface AppUser {
  uid: string;
  id: string;
  email: string | null;
  displayName: string;
  photoURL: string | null;
  photoUrl: string | null;
  coverImageUrl?: string;
  bio?: string;
  location?: string;
  website?: string;
  handle?: string;
  phone?: string;
  referralCode?: string;
  emailVerified?: boolean;
  verifiedStatus?: boolean;
  isVet?: boolean;
  topContributor?: boolean;
  createdAt?: string;
  pets?: any[];
  [key: string]: any;
}

export interface SignUpParams {
  email: string;
  password: string;
  displayName: string;
  phone?: string;
  referralCode?: string;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUp: (params: SignUpParams) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  reloadAuthUser: () => Promise<void>;
  logout: () => Promise<void>;
  updateLocalUser: (data: Partial<AppUser>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUp: async () => {},
  resetPassword: async () => {},
  sendVerificationEmail: async () => {},
  reloadAuthUser: async () => {},
  logout: async () => {},
  updateLocalUser: () => {},
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const toFirebaseError = (err: any): string => {
  const code: string = err?.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Try logging in instead.';
    case 'auth/invalid-email':
      return 'That email address is not valid.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed before completing.';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by the browser.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    default:
      return err?.message || 'Authentication failed. Please try again.';
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const buildHandle = async (displayName: string, email: string | null) => {
    const base = displayName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
    const baseSlug = base || 'user';
    let handle = baseSlug;
    try {
      const users = await fetchUsers();
      const taken = new Set(users.map((u: any) => (u.handle || '').replace(/^@+/, '')).filter(Boolean));
      let i = 2;
      while (taken.has(handle)) {
        handle = `${baseSlug}${i}`;
        i += 1;
      }
    } catch {
      handle = `${baseSlug}${Date.now().toString(36).slice(-4)}`;
    }
    return handle;
  };

  const syncWithPostgres = async (
    uid: string,
    initialData: {
      email: string | null;
      displayName: string | null;
      photoURL: string | null;
      emailVerified: boolean;
    },
    extra?: { phone?: string; referralCode?: string },
  ): Promise<AppUser> => {
    try {
      let dbUser: any = null;
      try {
        dbUser = await fetchUserProfile(uid);
      } catch (e: any) {
        if (e.status !== 404) {
          throw e; // rethrow if it's not a 404
        }
      }

      if (!dbUser) {
        const displayName = initialData.displayName || initialData.email?.split('@')[0] || 'User';
        const photoUrl = initialData.photoURL || null;
        const handle = await buildHandle(displayName, initialData.email);

        dbUser = await createUserProfile({
          id: uid,
          email: initialData.email || `${uid}@straycare.local`,
          displayName,
          handle,
          photoUrl,
          phone: extra?.phone || undefined,
          referralCode: extra?.referralCode || undefined,
          bio: '',
        });
}
 
  // Update database with Firebase values for empty fields
  const updateData: any = {};
  if (!dbUser.displayName) {
    updateData.displayName = initialData.displayName || '';
  }
  if (!dbUser.photoUrl) {
    updateData.photoUrl = initialData.photoURL ?? null;
  }
  if (!dbUser.phone) {
    updateData.phone = extra?.phone ?? null;
  }
  if (!dbUser.referralCode) {
    updateData.referralCode = extra?.referralCode ?? null;
  }
  if (initialData.emailVerified && !dbUser.emailVerified) {
    updateData.emailVerified = true;
  }
  if (Object.keys(updateData).length > 0) {
    await updateUserProfile(uid, updateData).catch(() => {});
  }

  const resolvedAvatar = dbUser.photoUrl || initialData.photoURL || null;

      const appUser: AppUser = {
        uid,
        id: uid,
        email: dbUser.email || initialData.email,
        displayName: dbUser.displayName || initialData.displayName || 'User',
        photoURL: resolvedAvatar,
        photoUrl: resolvedAvatar,
        coverImageUrl: dbUser.coverImageUrl || '',
        bio: dbUser.bio || '',
        location: dbUser.location || '',
        website: dbUser.website || '',
        handle: (dbUser.handle || '').replace(/^@+/, ''),
        phone: dbUser.phone || extra?.phone || '',
        referralCode: dbUser.referralCode || extra?.referralCode || '',
        emailVerified: initialData.emailVerified || dbUser.emailVerified || false,
        verifiedStatus: dbUser.verifiedStatus || false,
        isVet: dbUser.isVet || false,
        topContributor: dbUser.topContributor || false,
        createdAt: dbUser.createdAt,
        pets: dbUser.pets || [],
      };

      setUser(appUser);
      return appUser;
    } catch (e) {
      console.error('Error syncing with backend in AuthContext:', e);
      const fallbackAvatar = initialData.photoURL || null;
      const fallback: AppUser = {
        uid,
        id: uid,
        email: initialData.email,
        displayName: initialData.displayName || 'User',
        photoURL: fallbackAvatar,
        photoUrl: fallbackAvatar,
        emailVerified: initialData.emailVerified,
        phone: extra?.phone || '',
        referralCode: extra?.referralCode || '',
      };
      setUser(fallback);
      return fallback;
    }
  };

  const refreshFromFirebase = useCallback(async (fbUser: FirebaseUser, extra?: { phone?: string; referralCode?: string }) => {
    await fbUser.reload();
    const emailVerified = fbUser.emailVerified;
    const appUser = await syncWithPostgres(
      fbUser.uid,
      {
        email: fbUser.email,
        displayName: fbUser.displayName,
        photoURL: fbUser.photoURL,
        emailVerified,
      },
      extra,
    );
    if (appUser.emailVerified !== emailVerified) {
      setUser({ ...appUser, emailVerified });
      return { ...appUser, emailVerified };
    }
    return appUser;
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          await refreshFromFirebase(currentUser);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Auth state sync failed:', err);
        if (currentUser) {
          setUser({
            uid: currentUser.uid,
            id: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || 'User',
            photoURL: currentUser.photoURL,
            photoUrl: currentUser.photoURL,
            emailVerified: currentUser.emailVerified,
          });
        } else {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [refreshFromFirebase]);

  // Auto logout when the API rejects our token (401)
  useEffect(() => {
    const onUnauthorized = async () => {
      setUser(null);
      try {
        await signOut(auth);
      } catch { /* already signed out */ }
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  // Presence heartbeat
  useEffect(() => {
    if (!user?.uid) return;

    const heartbeat = () => {
      touchPresence(user.uid).catch(() => {
        // Backend may be down — presence simply stays stale
      });
    };

    heartbeat();
    const interval = setInterval(heartbeat, 30000);
    return () => clearInterval(interval);
  }, [user?.uid]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await signInWithPopup(auth, provider);
  };

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async ({ email, password, displayName, phone, referralCode }: SignUpParams) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    try {
      await sendEmailVerification(credential.user);
    } catch {
      // Verification email best-effort; account is still usable via re-send
    }
    await syncWithPostgres(
      credential.user.uid,
      {
        email: credential.user.email,
        displayName,
        photoURL: credential.user.photoURL,
        emailVerified: false,
      },
      { phone, referralCode },
    );
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const sendVerificationEmail = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not signed in');
    await sendEmailVerification(currentUser);
  };

  const reloadAuthUser = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    await refreshFromFirebase(currentUser);
  }, [refreshFromFirebase]);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const updateLocalUser = useCallback((data: Partial<AppUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      if (data.handle !== undefined) {
        updated.handle = (data.handle || '').replace(/^@+/, '');
      }
      if (data.photoUrl && !data.photoURL) {
        updated.photoURL = data.photoUrl;
      }
      if (data.photoURL && !data.photoUrl) {
        updated.photoUrl = data.photoURL;
      }
      return updated;
    });
  }, []);

  const refreshUser = useCallback(async () => {
    await refreshFromFirebase(auth.currentUser as FirebaseUser);
  }, [refreshFromFirebase]);

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithEmail, signUp, resetPassword, sendVerificationEmail, reloadAuthUser, logout, updateLocalUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export { toFirebaseError };