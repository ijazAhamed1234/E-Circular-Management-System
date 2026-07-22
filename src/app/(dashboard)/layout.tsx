"use client";

import { useState } from "react";
import Sidebar from "../../components/layout/Sidebar";
import TopBar from "../../components/layout/TopBar";
import { useAppContext } from "../../lib/context/AppContext";
import { usePathname } from "next/navigation";
import LoginPage from "../../views/login/LoginPage";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/circulars": "Circulars",
  "/circulars/create": "New Circular",
  "/notifications": "Notifications",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAppContext();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  if (!currentUser) {
    return <LoginPage />;
  }

  let title = pathname ? PAGE_TITLES[pathname] : "Details";
  if (title === undefined) title = "Details";
  if (pathname?.startsWith("/circulars/") && pathname !== "/circulars/create") {
    title = "Circular Details";
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f0f2f8]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(v => !v)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title={title} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
