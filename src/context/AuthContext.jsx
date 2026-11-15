import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import * as api from '../services/backOfficeApi.js';

const STORAGE_KEY = 'bo_session';
const AuthContext = createContext(null);

const readSession = () => {
  try {
    const session = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
    return session?.accessToken && session?.refreshToken && session.user?.role === 'admin' ? session : null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readSession()?.user ?? null);

  const login = useCallback(async (identifier, password) => {
    const session = await api.login(identifier, password);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    setUser(session.user);
  }, []);

  const logout = useCallback(() => {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
