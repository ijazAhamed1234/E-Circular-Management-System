import { FileText, Clock, CheckCircle, AlertCircle, ChevronRight, Inbox, RotateCcw, TrendingUp } from "lucide-react";
import type { User, Circular, Page, Role } from "../../lib/types";
import { canAct, visibleTo, fmtDate, fmtDateTime, typeLabel, typeCls, statusLabel } from "../../lib/helpers";
import StatusBadge from "../../components/shared/StatusBadge";
import { COLLEGE_NAME } from "../../lib/data";

interface Props {
  user: User;
  circulars: Circular[];
  onNavigate: (p: Page) => void;
  onSelectCircular: (id: string) => void;
}

const ROLE_LABEL: Record<Role, string> = {
  staff: "Faculty Member",
  hod: "Head of Department",
  principal: "Principal",
  placement_coordinator: "Placement Coordinator",
  placement_director: "Director of Placements",
  event_coordinator: "Event Coordinator",
};

export default function DashboardPage({ user, circulars, onNavigate, onSelectCircular }: Props) {
  const myCirculars = visibleTo(user, circulars);

  const stats = {
    total: myCirculars.length,
    pending: myCirculars.filter(c => ["pending_hod", "pending_principal", "pending_placement_director", "pending_event_coordinator"].includes(c.status)).length,
    approved: myCirculars.filter(c => c.status === "approved").length,
    changes: myCirculars.filter(c => c.status === "changes_requested").length,
    actionRequired: myCirculars.filter(c => canAct(user, c)).length,
  };

  const recent = [...myCirculars]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const actionItems = myCirculars.filter(c => canAct(user, c)).slice(0, 4);
  const changesItems = myCirculars.filter(c => c.status === "changes_requested" && c.createdById === user.id).slice(0, 3);

  return (
    <div className="p-6 space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-[#1a3567] to-[#243f7a] rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute right-6 top-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-[#c8a84b]" />
          <div className="absolute right-24 top-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-white" />
        </div>
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-white/60 text-sm">Welcome back,</p>
            <h2 className="text-xl font-bold mt-0.5" style={{ fontFamily: "'Playfair Display', serif" }}>
              {user.name}
            </h2>
            <p className="text-[#c8a84b] text-sm mt-1 font-medium">
              {user.designation} · {ROLE_LABEL[user.role]}
            </p>
            <p className="text-white/40 text-xs mt-0.5">{user.department} · {user.employeeId}</p>
          </div>
          {stats.actionRequired > 0 && (
            <div className="bg-white/10 border border-white/20 rounded-xl px-5 py-3 text-center">
              <p className="text-2xl font-bold text-[#c8a84b]">{stats.actionRequired}</p>
              <p className="text-xs text-white/70 mt-0.5">Awaiting Your<br />Action</p>
            </div>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Circulars", value: stats.total, icon: <FileText size={18} />, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Pending Approval", value: stats.pending, icon: <Clock size={18} />, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Approved", value: stats.approved, icon: <CheckCircle size={18} />, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Changes Requested", value: stats.changes, icon: <AlertCircle size={18} />, color: "text-orange-600", bg: "bg-orange-50" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 border border-[#eaecf5] hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-medium text-[#5a6483] leading-tight">{s.label}</p>
              <span className={`p-1.5 rounded-lg ${s.bg} ${s.color}`}>{s.icon}</span>
            </div>
            <p className="text-2xl font-bold text-[#0f1c3f]">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Action required */}
        {actionItems.length > 0 && (
          <div className="bg-white rounded-xl border border-[#eaecf5] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#eaecf5] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#0f1c3f] flex items-center gap-2">
                <Inbox size={15} className="text-amber-500" /> Action Required
              </h3>
              <span className="text-xs text-[#5a6483]">{stats.actionRequired} items</span>
            </div>
            <div className="divide-y divide-[#f0f2f8]">
              {actionItems.map(c => (
                <button key={c.id} onClick={() => onSelectCircular(c.id)}
                  className="w-full px-5 py-3 hover:bg-[#f8faff] transition-colors text-left flex items-start gap-3 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#0f1c3f] leading-snug truncate">{c.title}</p>
                    <p className="text-[10px] text-[#9aa3bf] mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{c.refNo}</p>
                  </div>
                  <ChevronRight size={13} className="text-[#9aa3bf] group-hover:text-[#1a3567] shrink-0 mt-0.5" />
                </button>
              ))}
            </div>
            {stats.actionRequired > 4 && (
              <div className="px-5 py-2.5 border-t border-[#f0f2f8]">
                <button onClick={() => onNavigate("circulars")} className="text-xs text-[#1a3567] font-medium hover:underline">
                  View all {stats.actionRequired} items →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Changes requested */}
        {changesItems.length > 0 && (
          <div className="bg-white rounded-xl border border-[#eaecf5] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#eaecf5]">
              <h3 className="text-sm font-semibold text-[#0f1c3f] flex items-center gap-2">
                <RotateCcw size={15} className="text-orange-500" /> Changes Requested
              </h3>
            </div>
            <div className="divide-y divide-[#f0f2f8]">
              {changesItems.map(c => (
                <button key={c.id} onClick={() => onSelectCircular(c.id)}
                  className="w-full px-5 py-3 hover:bg-[#f8faff] transition-colors text-left flex items-start gap-3 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#0f1c3f] leading-snug truncate">{c.title}</p>
                    <p className="text-[10px] text-[#9aa3bf] mt-0.5">
                      {c.comments[c.comments.length - 1]?.authorName}
                    </p>
                  </div>
                  <ChevronRight size={13} className="text-[#9aa3bf] group-hover:text-[#1a3567] shrink-0 mt-0.5" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recent circulars */}
        <div className={`${actionItems.length > 0 || changesItems.length > 0 ? "lg:col-span-2" : "lg:col-span-3"} bg-white rounded-xl border border-[#eaecf5] overflow-hidden`}>
          <div className="px-5 py-3.5 border-b border-[#eaecf5] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#0f1c3f] flex items-center gap-2">
              <TrendingUp size={15} className="text-[#1a3567]" /> Recent Circulars
            </h3>
            <button onClick={() => onNavigate("circulars")} className="text-xs text-[#1a3567] hover:underline font-medium">
              View all
            </button>
          </div>
          <div className="divide-y divide-[#f0f2f8]">
            {recent.length === 0 && (
              <div className="py-12 text-center text-sm text-[#9aa3bf]">No circulars found</div>
            )}
            {recent.map(c => (
              <button key={c.id} onClick={() => onSelectCircular(c.id)}
                className="w-full px-5 py-3 hover:bg-[#f8faff] transition-colors text-left flex items-center gap-4 group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="text-xs font-semibold text-[#0f1c3f] truncate">{c.title}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-[#9aa3bf]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{c.refNo}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${typeCls(c.type)}`}>{typeLabel(c.type)}</span>
                    <span className="text-[10px] text-[#9aa3bf]">{fmtDate(c.createdAt)}</span>
                  </div>
                </div>
                <StatusBadge status={c.status} />
                <ChevronRight size={13} className="text-[#9aa3bf] group-hover:text-[#1a3567] shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
