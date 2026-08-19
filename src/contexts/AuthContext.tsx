import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { fetchUserProfile, createUserProfile, fetchUsers, touchPresence } from '../services/api';

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
  verifiedStatus?: boolean;
  isVet?: boolean;
  topContributor?: boolean;
  createdAt?: string;
  pets?: any[];
  [key: string]: any;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  mockLogin: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateLocalUser: (data: Partial<AppUser>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  mockLogin: async () => {},
  logout: async () => {},
  updateLocalUser: () => {},
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Build a unique name-derived handle (e.g. @mujahiduljoy) on account creation
  const buildHandle = async (displayName: string, email: string | null) => {
    const base = displayName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
    const baseSlug = base || 'user';
    let handle = `@${baseSlug}`;
    try {
      const users = await fetchUsers();
      const taken = new Set(users.map((u: any) => u.handle).filter(Boolean));
      let i = 2;
      while (taken.has(handle)) {
        handle = `@${baseSlug}${i}`;
        i += 1;
      }
    } catch {
      // DB unavailable — fall back to a unique-looking suffix so creation can proceed
      handle = `@${baseSlug}${Date.now().toString(36).slice(-4)}`;
    }
    return handle;
  };

  // Syncs with PostgreSQL backend
  const syncWithPostgres = async (uid: string, initialData: { email: string | null; displayName: string | null; photoURL: string | null }): Promise<AppUser> => {
    try {
      let dbUser = await fetchUserProfile(uid);
      if (!dbUser) {
        // Create user in postgres using initial Firebase info
        const displayName = initialData.displayName || initialData.email?.split('@')[0] || 'User';
        // Clean slate: only Google OAuth provides a photo URL; email/password signups start without one
        const photoUrl = initialData.photoURL || null;
        const handle = await buildHandle(displayName, initialData.email);

        dbUser = await createUserProfile({
          id: uid,
          email: initialData.email || `${uid}@straycare.local`,
          displayName,
          handle,
          photoUrl,
          bio: '',
        });
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
        handle: dbUser.handle || '',
        verifiedStatus: dbUser.verifiedStatus || false,
        isVet: dbUser.isVet || false,
        topContributor: dbUser.topContributor || false,
        createdAt: dbUser.createdAt,
        pets: dbUser.pets || [],
      };

      return appUser;
    } catch (e) {
      console.error('Error syncing with backend in AuthContext:', e);
      const fallbackAvatar = initialData.photoURL || null;
      return {
        uid,
        id: uid,
        email: initialData.email,
        displayName: initialData.displayName || 'User',
        photoURL: fallbackAvatar,
        photoUrl: fallbackAvatar,
      };
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const appUser = await syncWithPostgres(currentUser.uid, {
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
        });
        setUser(appUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Presence heartbeat: mark the user online on login and every 30s while the app is open
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
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const mockLogin = async (email: string) => {
    setLoading(true);
    const uid = 'ACouYmopY7WSyWYvsZRbzUiLnnq2';
    const appUser = await syncWithPostgres(uid, {
      email,
      displayName: 'Shopnil Karmakar',
      photoURL: 'https://res.cloudinary.com/dxpufap96/image/upload/v1765859391/cy4leimp8itbbl4spokh.png',
    });
    setUser(appUser);
    setLoading(false);
  };

  const updateLocalUser = useCallback((data: Partial<AppUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
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
    if (!user) return;
    const appUser = await syncWithPostgres(user.uid, {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    });
    setUser(appUser);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, mockLogin, logout, updateLocalUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
