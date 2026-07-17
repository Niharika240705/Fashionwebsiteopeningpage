import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_URL } from '../utils/api';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: 'local' | 'google' | 'apple';
  role?: 'user' | 'admin';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: () => void;
  loginWithApple: () => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function parseError(response: Response, fallback: string): Promise<string> {
  try {
    const error = await response.json();
    return error.message || fallback;
  } catch {
    const text = await response.text();
    return text || fallback;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const refreshSession = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        setUser(null);
        return false;
      }

      const data = await response.json();
      if (data.user) {
        setUser(data.user);
        return true;
      }

      return checkAuthSilent();
    } catch (error) {
      console.error('Token refresh failed:', error);
      setUser(null);
      return false;
    }
  };

  const checkAuthSilent = async (): Promise<boolean> => {
    const response = await fetch(`${API_URL}/auth/me`, {
      credentials: 'include',
    });
    if (!response.ok) {
      setUser(null);
      return false;
    }
    const data = await response.json();
    setUser(data.user);
    return true;
  };

  const checkAuth = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else if (response.status === 401 || response.status === 403) {
        await refreshSession();
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error(await parseError(response, 'Login failed'));
    }

    const data = await response.json();
    setUser(data.user);
  };

  const register = async (email: string, password: string, name: string) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      throw new Error(await parseError(response, 'Registration failed'));
    }

    const data = await response.json();
    setUser(data.user);
  };

  const loginWithGoogle = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  const loginWithApple = async () => {
    alert('Apple Sign In is being configured. Please use Google or email/password for now.');
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        loginWithGoogle,
        loginWithApple,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
