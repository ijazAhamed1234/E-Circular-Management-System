"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { User, Circular } from "../types";
import { INITIAL_CIRCULARS } from "../data";
import { useRouter } from "next/navigation";

interface AppContextType {
  currentUser: User | null;
  circulars: Circular[];
  login: (user: User) => void;
  logout: () => void;
  createCircular: (circular: Circular) => void;
  updateCircular: (circular: Circular) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [circulars, setCirculars] = useState<Circular[]>(INITIAL_CIRCULARS);
  const router = useRouter();

  function login(user: User) {
    setCurrentUser(user);
    router.push("/dashboard");
  }

  function logout() {
    setCurrentUser(null);
    router.push("/");
  }

  function createCircular(newCircular: Circular) {
    setCirculars((prev) => [...prev, newCircular]);
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
        login,
        logout,
        createCircular,
        updateCircular,
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
