import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { fetchUserProfile, createUserProfile } from '../services/api';

export interface AppUser {
  uid: string;
  id: string;
  email: string | null;
  displayName: string;
  photoURL: string;
  photoUrl: string;
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

  // Syncs with PostgreSQL backend
  const syncWithPostgres = async (uid: string, initialData: { email: string | null; displayName: string | null; photoURL: string | null }): Promise<AppUser> => {
    try {
      let dbUser = await fetchUserProfile(uid);
      if (!dbUser) {
        // Create user in postgres using initial Firebase info
        const displayName = initialData.displayName || initialData.email?.split('@')[0] || 'User';
        const handle = `@${displayName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${uid.slice(-4)}`;
        const photoUrl = initialData.photoURL || 'https://res.cloudinary.com/dxpufap96/image/upload/v1765859391/cy4leimp8itbbl4spokh.png';
        
        dbUser = await createUserProfile({
          id: uid,
          email: initialData.email || `${uid}@straycare.local`,
          displayName,
          handle,
          photoUrl,
          bio: '',
        });
      }

      const defaultAvatar = 'https://res.cloudinary.com/dxpufap96/image/upload/v1765859391/cy4leimp8itbbl4spokh.png';
      const resolvedAvatar = dbUser.photoUrl || initialData.photoURL || defaultAvatar;

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
      const fallbackAvatar = initialData.photoURL || 'https://res.cloudinary.com/dxpufap96/image/upload/v1765859391/cy4leimp8itbbl4spokh.png';
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
