import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { authApi } from '../lib/api';

interface AuthState {
  token: string | null;
  username: string | null;
  checking: boolean;
  login: (token: string, name: string) => void;
  logout: () => void;
  isAuthed: boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [username, setUsername] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!token) {
      setChecking(false);
      return;
    }
    authApi.me().then((r) => {
      if (r.valid) {
        setUsername(r.username || null);
      } else {
        localStorage.removeItem('token');
        setToken(null);
      }
      setChecking(false);
    }).catch(() => {
      localStorage.removeItem('token');
      setToken(null);
      setChecking(false);
    });
  }, [token]);

  const login = useCallback((newToken: string, name: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUsername(name);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUsername(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, username, checking, login, logout, isAuthed: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
