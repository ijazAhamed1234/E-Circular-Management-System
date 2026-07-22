"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "../lib/context/AppContext";
import LoginPage from "../views/login/LoginPage";

export default function Home() {
  const { currentUser } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (currentUser) {
      router.push("/dashboard");
    }
  }, [currentUser, router]);

  if (currentUser) return null;

  return <LoginPage />;
}
