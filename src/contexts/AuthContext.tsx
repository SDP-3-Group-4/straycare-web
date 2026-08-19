import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  mockLogin: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateLocalUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  mockLogin: async () => {},
  logout: async () => {},
  updateLocalUser: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
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
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const mockLogin = async (email: string) => {
    // Temporary bypass for frontend dev without Firebase config
    const mockUser = {
      uid: 'ACouYmopY7WSyWYvsZRbzUiLnnq2',
      email: email,
      displayName: 'Shopnil Karmakar',
      photoURL: 'https://res.cloudinary.com/dxpufap96/image/upload/v1765859391/cy4leimp8itbbl4spokh.png',
      emailVerified: true,
    } as unknown as User;
    setUser(mockUser);
  };

  const updateLocalUser = (data: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...data } as User);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, mockLogin, logout, updateLocalUser }}>
      {children}
    </AuthContext.Provider>
  );
};
