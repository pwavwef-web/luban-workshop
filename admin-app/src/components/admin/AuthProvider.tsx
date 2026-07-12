"use client";

import type { User } from "firebase/auth";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { auth } from "@/lib/firebase";
import { isAdminUser } from "@/services/auth";

type AuthStatus = "loading" | "signed-out" | "checking" | "admin" | "denied";

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  error: string;
  signIn(email: string, password: string): Promise<void>;
  signInWithGoogle(): Promise<void>;
  logout(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, async (nextUser) => {
      setError("");
      if (!nextUser) {
        setUser(null);
        setStatus("signed-out");
        return;
      }

      setStatus("checking");
      try {
        const allowed = await isAdminUser(nextUser);
        if (!allowed) {
          setUser(null);
          setStatus("denied");
          setError("Access denied. This account does not have Luban admin privileges.");
          await signOut(auth);
          return;
        }
        setUser(nextUser);
        setStatus("admin");
      } catch (authError) {
        setUser(null);
        setStatus("denied");
        setError(authError instanceof Error ? authError.message : "Could not verify admin access.");
        await signOut(auth).catch(() => undefined);
      }
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      error,
      async signIn(email, password) {
        setError("");
        await signInWithEmailAndPassword(auth, email, password);
      },
      async signInWithGoogle() {
        setError("");
        await signInWithPopup(auth, new GoogleAuthProvider());
      },
      async logout() {
        await signOut(auth);
      },
    }),
    [user, status, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
