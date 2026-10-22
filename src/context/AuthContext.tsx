import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
  updateProfile: (name: string, email: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<{ success: boolean; error?: string }>;
  isAdmin: boolean;
  isEditor: boolean;
}

function isUser(value: unknown): value is User {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.email === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.createdAt === 'string' &&
    (candidate.role === 'admin' || candidate.role === 'editor' || candidate.role === 'viewer')
  );
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ath_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function verifySession() {
      try {
        const storedToken = localStorage.getItem('ath_token');
        if (storedToken) {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (isMounted) {
              setUser(data.user);
              setToken(storedToken);
            }
            return;
          } else {
            localStorage.removeItem('ath_token');
            if (isMounted) {
              setUser(null);
              setToken(null);
            }
          }
        } else {
          if (isMounted) {
            setUser(null);
            setToken(null);
          }
        }
      } catch {
        if (isMounted) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    verifySession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const responseText = await res.text();
      let data: Record<string, unknown>;
      try {
        const parsed: unknown = JSON.parse(responseText);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error('Invalid response format');
        }
        data = parsed as Record<string, unknown>;
      } catch {
        return {
          success: false,
          error: responseText.trim() || `Login service returned an invalid response (HTTP ${res.status}).`,
        };
      }

      if (!res.ok) {
        return {
          success: false,
          error: typeof data.error === 'string' ? data.error : 'Login failed',
        };
      }

      if (typeof data.token !== 'string' || !isUser(data.user)) {
        return { success: false, error: 'Login service returned an incomplete response.' };
      }

      localStorage.setItem('ath_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during login' };
    }
  };

  const logout = () => {
    localStorage.removeItem('ath_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async (): Promise<User | null> => {
    const storedToken = localStorage.getItem('ath_token');
    if (!storedToken) return null;

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${storedToken}` },
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (isUser(data.user)) {
        setUser(data.user);
        return data.user;
      }
    } catch {
      // Session refresh failures leave the current user unchanged.
    }
    return null;
  };

  const updateProfile = async (name: string, email: string) => {
    const storedToken = localStorage.getItem('ath_token');
    if (!storedToken) return { success: false, error: 'Authentication required. Please sign in.' };

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storedToken}`,
        },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, error: data.error || 'Profile update failed.' };
      }
      if (!isUser(data.user)) {
        return { success: false, error: 'Profile update returned an invalid response.' };
      }
      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error while updating profile.' };
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const storedToken = localStorage.getItem('ath_token');
    if (!storedToken) return { success: false, error: 'Authentication required. Please sign in.' };

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storedToken}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, error: data.error || 'Password change failed.' };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error while changing password.' };
    }
  };

  const isAdmin = user?.role === 'admin';
  const isEditor = user?.role === 'admin' || user?.role === 'editor';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        refreshUser,
        updateProfile,
        changePassword,
        isAdmin,
        isEditor,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
