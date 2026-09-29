import { createContext, useContext, useState, useCallback } from "react";
import { getStoredUser, saveSession, clearSession } from "../api";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const login = useCallback((token, userData) => {
    saveSession(token, userData);
    setUser(userData);
  }, []);
  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth нь AuthProvider дотор ашиглагдах ёстой.");
  return ctx;
}
