import { useEffect, useState, useCallback } from 'react';
import { authApi } from '../lib/api';

export function useAuth() {
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

  return { token, username, checking, login, logout, isAuthed: !!token };
}
