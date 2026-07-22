import {
  LayoutDashboard, FileText, Plus, Bell, Briefcase,
  LogOut, ChevronLeft, ChevronRight, CalendarDays,
  Shield, Building2, Users, Star,
} from "lucide-react";
import type { User, Circular, Role } from "../../lib/types";
import { canAct, visibleTo } from "../../lib/helpers";
import { COLLEGE_SHORT } from "../../lib/data";
import kiotLogo from "../../imports/images.png";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  section?: string;
}

interface Props {
  collapsed: boolean;
  onToggle: () => void;
}

const ROLE_META: Record<Role, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  staff:                { label: "Faculty Portal",          color: "#60a5fa", bg: "rgba(96,165,250,0.18)",  icon: <Users size={12} /> },
  hod:                  { label: "HOD Portal",            color: "#c084fc", bg: "rgba(192,132,252,0.18)", icon: <Building2 size={12} /> },
  principal:            { label: "Principal's Office",    color: "#fbbf24", bg: "rgba(251,191,36,0.18)",  icon: <Shield size={12} /> },
  placement_coordinator:{ label: "Placement Portal",      color: "#34d399", bg: "rgba(52,211,153,0.18)",  icon: <Briefcase size={12} /> },
  placement_director:   { label: "Placement Director",    color: "#fb7185", bg: "rgba(251,113,133,0.18)", icon: <Star size={12} /> },
  event_coordinator:    { label: "Events Portal",         color: "#f472b6", bg: "rgba(244,114,182,0.18)", icon: <CalendarDays size={12} /> },
};

function buildNavItems(user: User, circulars: Circular[]): NavItem[] {
  const mine = visibleTo(user, circulars);
  const actionCount = mine.filter(c => canAct(user, c)).length;
  const changesCount = mine.filter(c => c.status === "changes_requested" && c.createdById === user.id).length;
  const notifCount = changesCount + actionCount;

  const base = (badge?: number): Omit<NavItem, "id" | "label" | "icon"> => ({ badge });

  switch (user.role) {
    case "staff":
      return [
        { id: "/dashboard",     label: "Dashboard",     icon: <LayoutDashboard size={17} />, section: "OVERVIEW" },
        { id: "/circulars",     label: "My Circulars",  icon: <FileText size={17} />,        section: "CIRCULARS" },
        { id: "/circulars/create", label: "New Circular",  icon: <Plus size={17} /> },
        { id: "/notifications", label: "Notifications", icon: <Bell size={17} />,             badge: changesCount },
      ];
    case "hod":
      return [
        { id: "/dashboard",     label: "Dashboard",       icon: <LayoutDashboard size={17} />, section: "OVERVIEW" },
        { id: "/circulars",     label: "Review Circulars",icon: <FileText size={17} />,         badge: actionCount, section: "CIRCULARS" },
        { id: "/circulars/create", label: "New Circular",    icon: <Plus size={17} /> },
        { id: "/notifications", label: "Notifications",   icon: <Bell size={17} /> },
      ];
    case "principal":
      return [
        { id: "/dashboard",     label: "Dashboard",       icon: <LayoutDashboard size={17} />, section: "OVERVIEW" },
        { id: "/circulars",     label: "Pending Approvals",icon: <FileText size={17} />,        badge: actionCount, section: "APPROVALS" },
        { id: "/notifications", label: "Notifications",   icon: <Bell size={17} /> },
      ];
    case "placement_coordinator":
      return [
        { id: "/dashboard",     label: "Dashboard",         icon: <LayoutDashboard size={17} />, section: "OVERVIEW" },
        { id: "/circulars",     label: "Placement Circulars",icon: <Briefcase size={17} />,       section: "CIRCULARS" },
        { id: "/circulars/create", label: "New Circular",      icon: <Plus size={17} /> },
        { id: "/notifications", label: "Notifications",     icon: <Bell size={17} /> },
      ];
    case "placement_director":
      return [
        { id: "/dashboard",     label: "Dashboard",         icon: <LayoutDashboard size={17} />, section: "OVERVIEW" },
        { id: "/circulars",     label: "Placement Approvals",icon: <Briefcase size={17} />,       badge: actionCount, section: "APPROVALS" },
        { id: "/notifications", label: "Notifications",     icon: <Bell size={17} /> },
      ];
    case "event_coordinator":
      return [
        { id: "/dashboard",     label: "Dashboard",       icon: <LayoutDashboard size={17} />, section: "OVERVIEW" },
        { id: "/circulars",     label: "Event Circulars", icon: <CalendarDays size={17} />,     badge: actionCount, section: "CIRCULARS" },
        { id: "/circulars/create", label: "New Circular",    icon: <Plus size={17} /> },
        { id: "/notifications", label: "Notifications",   icon: <Bell size={17} /> },
      ];
    default:
      return [];
  }
}

import { useAppContext } from "../../lib/context/AppContext";
import { useRouter, usePathname } from "next/navigation";

export default function Sidebar({ collapsed, onToggle }: Props) {
  const { currentUser: user, circulars, logout } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();
  
  if (!user) return null;
  const navItems = buildNavItems(user, circulars);
  const meta = ROLE_META[user.role];
  const initials = user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const totalBadge = navItems.reduce((sum, n) => sum + (n.badge ?? 0), 0);

  // Group nav items by section
  const sections: { heading: string | null; items: NavItem[] }[] = [];
  navItems.forEach(item => {
    const last = sections[sections.length - 1];
    if (item.section || !last) {
      sections.push({ heading: item.section ?? null, items: [item] });
    } else {
      last.items.push(item);
    }
  });

  return (
    <>
      <style>{`
        .sidebar-bg { background: linear-gradient(180deg, #08122e 0%, #0f1d40 40%, #152f5c 100%); }
        .nav-active  { background: rgba(255,255,255,0.10); }
        .nav-hover:hover { background: rgba(255,255,255,0.06); }
      `}</style>

      <aside
        className={`sidebar-bg flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out shrink-0 z-30 select-none ${
          collapsed ? "w-[68px]" : "w-[230px]"
        }`}
      >
        {/* ── Header ── */}
        <div className={`flex items-center border-b border-white/8 ${collapsed ? "flex-col py-4 gap-2 px-2" : "px-4 py-4 gap-3 justify-between"}`}>
          {!collapsed && (
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Logo mark */}
              <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 shadow-md bg-white flex items-center justify-center p-0.5">
                <img src={kiotLogo.src} alt="KIOT Logo" className="w-full h-full object-contain p-0.5" />
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-extrabold tracking-widest leading-tight">{COLLEGE_SHORT}</p>
                <p className="text-[10px] leading-tight truncate" style={{ color: meta.color }}>
                  {meta.label}
                </p>
              </div>
            </div>
          )}

          {/* Collapsed logo */}
          {collapsed && (
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-white flex items-center justify-center shadow-md p-0.5">
              <img src={kiotLogo.src} alt="KIOT Logo" className="w-full h-full object-contain p-0.5" />
            </div>
          )}

          {/* Toggle button */}
          <button
            onClick={onToggle}
            className={`flex items-center justify-center rounded-lg transition-all text-white/40 hover:text-white hover:bg-white/8 ${
              collapsed ? "w-8 h-8" : "w-7 h-7 ml-auto"
            }`}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {sections.map((section, si) => (
            <div key={si} className={si > 0 ? "mt-3" : ""}>
              {/* Section heading */}
              {section.heading && !collapsed && (
                <p className="text-[9px] font-bold tracking-[0.2em] text-white/25 px-3 py-1.5 uppercase">
                  {section.heading}
                </p>
              )}
              {section.heading && collapsed && <div className="my-1 border-t border-white/8 mx-2" />}

              {section.items.map(item => {
                const active = pathname === item.id || (item.id === "/circulars" && pathname?.startsWith("/circulars") && pathname !== "/circulars/create");
                return (
                  <button
                    key={item.id}
                    onClick={() => router.push(item.id)}
                    title={collapsed ? item.label : undefined}
                    className={`nav-hover w-full flex items-center rounded-xl text-sm font-medium transition-all duration-150 relative group
                      ${collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"}
                      ${active ? "nav-active text-white" : "text-white/55 hover:text-white/90"}
                    `}
                  >
                    {/* Active left indicator */}
                    {active && (
                      <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                        style={{ background: "linear-gradient(180deg, #c8a84b, #e8c96a)" }}
                      />
                    )}

                    {/* Icon container */}
                    <span
                      className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
                        active ? "" : "group-hover:bg-white/5"
                      }`}
                      style={active ? { background: meta.bg } : {}}
                    >
                      <span style={active ? { color: meta.color } : {}}>{item.icon}</span>
                    </span>

                    {/* Label */}
                    {!collapsed && <span className="flex-1 text-left text-xs leading-snug">{item.label}</span>}

                    {/* Badge */}
                    {!collapsed && item.badge != null && item.badge > 0 && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                        style={{ background: meta.color, color: "#0a1628" }}
                      >
                        {item.badge}
                      </span>
                    )}
                    {collapsed && item.badge != null && item.badge > 0 && (
                      <span
                        className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-2 border-[#08122e]"
                        style={{ background: meta.color }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* ── Divider ── */}
        <div className="mx-3 border-t border-white/8" />

        {/* ── User Card ── */}
        <div className={`p-3 ${collapsed ? "flex flex-col items-center gap-2" : ""}`}>
          {collapsed ? (
            <>
              {/* Avatar only */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-extrabold shadow-md"
                style={{ background: meta.bg, color: meta.color, border: `1.5px solid ${meta.color}40` }}
              >
                {initials}
              </div>
              <button
                onClick={logout}
                title="Sign Out"
                className="w-9 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut size={14} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2.5">
              {/* Avatar */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-extrabold shrink-0 shadow-md"
                style={{ background: meta.bg, color: meta.color, border: `1.5px solid ${meta.color}40` }}
              >
                {initials}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-semibold truncate leading-tight">{user.name}</p>
                <p className="text-[10px] truncate leading-tight mt-0.5" style={{ color: meta.color + "bb" }}>
                  {user.designation}
                </p>
                <p className="text-[9px] text-white/25 leading-tight mt-0.5 truncate" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {user.employeeId}
                </p>
              </div>

              {/* Logout */}
              <button
                onClick={logout}
                title="Sign Out"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
