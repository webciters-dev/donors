import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { isTokenExpired } from "./tokenUtils";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("auth_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("auth_token") || "");

  // ✅ NEW: Validate token on app load (fix for persistent expired tokens)
  useEffect(() => {
    if (!token) return;
    
    if (isTokenExpired(token)) {
      console.warn("[AUTH] Stored token is expired. Clearing authentication.");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      setToken("");
      setUser(null);
    }
  }, []); // Run once on app mount

  useEffect(() => {
    if (user) localStorage.setItem("auth_user", JSON.stringify(user));
    else localStorage.removeItem("auth_user");
  }, [user]);

  useEffect(() => {
    if (token) localStorage.setItem("auth_token", token);
    else localStorage.removeItem("auth_token");
  }, [token]);

  function login({ token, user }) {
    setToken(token);
    setUser(user);
  }

  function logout() {
    setToken("");
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,              // { id, email, role }
      token,             // string
      role: user?.role,  // convenience
      isAuthed: Boolean(token),
      login,
      logout,
    }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  

  
  return ctx;
}
