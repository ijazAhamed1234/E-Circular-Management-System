/**
 * App.tsx – Root component (Next.js-style layout router)
 *
 * Structure mirrors a Next.js app/:
 *   pages/login/LoginPage
 *   pages/dashboard/DashboardPage
 *   pages/circulars/CircularsListPage
 *   pages/circulars/CircularDetailPage
 *   pages/circulars/CreateCircularPage
 *   pages/notifications/NotificationsPage
 *   components/layout/Sidebar
 *   components/layout/TopBar
 *   lib/types  lib/data  lib/helpers
 */

import { useState } from "react";
import type { User, Circular, Page } from "../lib/types";
import { INITIAL_CIRCULARS } from "../lib/data";

import Sidebar from "../components/layout/Sidebar";
import TopBar from "../components/layout/TopBar";
import LoginPage from "../pages/login/LoginPage";
import DashboardPage from "../pages/dashboard/DashboardPage";
import CircularsListPage from "../pages/circulars/CircularsListPage";
import CircularDetailPage from "../pages/circulars/CircularDetailPage";
import CreateCircularPage from "../pages/circulars/CreateCircularPage";
import NotificationsPage from "../pages/notifications/NotificationsPage";

const PAGE_TITLE: Record<Page, string> = {
  dashboard: "Dashboard",
  circulars: "Circulars",
  create: "New Circular",
  detail: "Circular Details",
  notifications: "Notifications",
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [page, setPage] = useState<Page>("dashboard");
  const [selectedCircularId, setSelectedCircularId] = useState<string | null>(null);
  const [circulars, setCirculars] = useState<Circular[]>(INITIAL_CIRCULARS);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ── Auth handlers ──────────────────────────────────────────
  function handleLogin(user: User) {
    setCurrentUser(user);
    setPage("dashboard");
  }

  function handleLogout() {
    setCurrentUser(null);
    setPage("dashboard");
    setSelectedCircularId(null);
  }

  // ── Navigation ─────────────────────────────────────────────
  function navigateTo(p: Page) {
    setPage(p);
    if (p !== "detail") setSelectedCircularId(null);
  }

  function openCircular(id: string) {
    setSelectedCircularId(id);
    setPage("detail");
  }

  // ── Circular mutations ─────────────────────────────────────
  function updateCircular(updated: Circular) {
    setCirculars(prev => prev.map(c => (c.id === updated.id ? updated : c)));
  }

  function createCircular(newCircular: Circular) {
    setCirculars(prev => [...prev, newCircular]);
    navigateTo("circulars");
  }

  // ── Unauthenticated: show login ────────────────────────────
  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const selectedCircular = selectedCircularId
    ? circulars.find(c => c.id === selectedCircularId) ?? null
    : null;

  // ── Authenticated: main layout ─────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-[#f0f2f8]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Sidebar
        user={currentUser}
        page={page}
        circulars={circulars}
        collapsed={sidebarCollapsed}
        onNavigate={navigateTo}
        onLogout={handleLogout}
        onToggle={() => setSidebarCollapsed(v => !v)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          user={currentUser}
          title={PAGE_TITLE[page]}
          circulars={circulars}
          onNavigate={navigateTo}
        />

        <main className="flex-1 overflow-y-auto">
          {page === "dashboard" && (
            <DashboardPage
              user={currentUser}
              circulars={circulars}
              onNavigate={navigateTo}
              onSelectCircular={openCircular}
            />
          )}

          {page === "circulars" && (
            <CircularsListPage
              user={currentUser}
              circulars={circulars}
              onSelectCircular={openCircular}
              onNavigate={navigateTo}
              onUpdateCircular={updateCircular}
            />
          )}

          {page === "create" && (
            <CreateCircularPage
              user={currentUser}
              onSubmit={createCircular}
              onCancel={() => navigateTo("circulars")}
            />
          )}

          {page === "detail" && selectedCircular && (
            <CircularDetailPage
              circular={selectedCircular}
              user={currentUser}
              onBack={() => navigateTo("circulars")}
              onUpdateCircular={updateCircular}
            />
          )}

          {page === "notifications" && (
            <NotificationsPage
              user={currentUser}
              circulars={circulars}
              onSelectCircular={openCircular}
            />
          )}
        </main>
      </div>
    </div>
  );
}
