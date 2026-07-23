"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import type { User, Circular } from "../types";
import { useRouter } from "next/navigation";

interface AppContextType {
  currentUser: User | null;
  circulars: Circular[];
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  createCircular: (circular: Circular) => void;
  updateCircular: (circular: Circular) => void;
  refreshCirculars: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  async function fetchUser() {
    try {
      const res = await fetch('/api/users/me');
      if (res.ok) {
        const user = await res.json();
        setCurrentUser(user);
        return true;
      }
    } catch (error) {
      console.error(error);
    }
    return false;
  }

  async function refreshCirculars() {
    try {
      const res = await fetch('/api/circulars');
      if (res.ok) {
        const data = await res.json();
        setCirculars(data);
      }
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    async function init() {
      const isLoggedIn = await fetchUser();
      if (isLoggedIn) {
        await refreshCirculars();
      }
      setIsLoading(false);
    }
    init();
  }, []);

  async function login(email: string, password: string = 'password123') {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        await refreshCirculars();
        router.push("/dashboard");
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Login failed');
      }
    } catch (error: any) {
      throw error;
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setCurrentUser(null);
    setCirculars([]);
    router.push("/");
  }

  async function createCircular(newCircular: Circular) {
    // The actual API call is done in CreateCircularPage.
    // Re-fetch all circulars from the backend to ensure all roles see accurate data.
    await refreshCirculars();
    router.push("/circulars");
  }

  function updateCircular(updated: Circular) {
    setCirculars((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }

  return (
    <AppContext.Provider
      value={{
        currentUser,
        circulars,
        isLoading,
        login,
        logout,
        createCircular,
        updateCircular,
        refreshCirculars
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
