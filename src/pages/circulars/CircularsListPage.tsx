import { useState, useMemo } from "react";
import { Plus, Search, X, ChevronRight, Eye, AlertTriangle } from "lucide-react";
import type { User, Circular, Page, CircularStatus, Role } from "../../lib/types";
import { visibleTo, canAct, fmtDate, typeLabel, typeCls, priorityCls, priorityLabel } from "../../lib/helpers";
import StatusBadge from "../../components/shared/StatusBadge";
import CircularDocumentModal from "../../components/shared/CircularDocumentModal";

interface Props {
  user: User;
  circulars: Circular[];
  onSelectCircular: (id: string) => void;
  onNavigate: (p: Page) => void;
  onUpdateCircular: (c: Circular) => void;
}

// ── Tab configuration per role ───────────────────────────────
type TabId = "action" | "all" | "processing" | "approved" | "changes" | "issued";

interface TabConfig {
  id: TabId;
  label: string;
  description: string;
  filter: (c: Circular, user: User) => boolean;
}

const PENDING_STATUSES: CircularStatus[] = [
  "pending_hod", "pending_principal",
  "pending_placement_director", "pending_event_coordinator",
];

function getTabsForRole(role: Role): TabConfig[] {
  if (role === "hod" || role === "principal" || role === "placement_director" || role === "event_coordinator") {
    return [
      {
        id: "action",
        label: role === "hod" ? "Needs My Review" : role === "principal" ? "Pending Approval" : "Pending My Review",
        description: "Circulars waiting for your action",
        filter: (c, u) => canAct(u, c),
      },
      {
        id: "issued",
        label: "Forwarded / All",
        description: "Circulars you have processed or can see",
        filter: () => true,
      },
      {
        id: "approved",
        label: "Approved",
        description: "Fully approved circulars",
        filter: c => c.status === "approved",
      },
    ];
  }
  // staff, placement_coordinator, event_coordinator as creator
  return [
    {
      id: "all",
      label: "All Circulars",
      description: "All circulars visible to you",
      filter: () => true,
    },
    {
      id: "processing",
      label: "Processing",
      description: "Awaiting approval from authorities",
      filter: c => PENDING_STATUSES.includes(c.status),
    },
    {
      id: "approved",
      label: "Approved",
      description: "Fully approved and signed",
      filter: c => c.status === "approved",
    },
    {
      id: "changes",
      label: "Changes Requested",
      description: "Returned for revision",
      filter: c => c.status === "changes_requested",
    },
  ];
}

export default function CircularsListPage({
  user, circulars, onSelectCircular, onNavigate, onUpdateCircular,
}: Props) {
  const tabs = getTabsForRole(user.role);
  const [activeTab, setActiveTab] = useState<TabId>(tabs[0].id);
  const [search, setSearch] = useState("");
  const [modalCircular, setModalCircular] = useState<Circular | null>(null);

  const myCirculars = visibleTo(user, circulars);

  // Counts per tab
  const counts = useMemo(() => {
    const result: Record<string, number> = {};
    tabs.forEach(tab => {
      result[tab.id] = myCirculars.filter(c => tab.filter(c, user)).length;
    });
    return result;
  }, [myCirculars, tabs, user]);

  const currentTab = tabs.find(t => t.id === activeTab) ?? tabs[0];

  const filtered = useMemo(() => {
    let list = myCirculars.filter(c => currentTab.filter(c, user));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => c.title.toLowerCase().includes(q) || c.refNo.toLowerCase().includes(q) || c.department.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [myCirculars, currentTab, search, user]);

  const canCreate = ["staff", "hod", "placement_coordinator", "event_coordinator"].includes(user.role);

  // Changes-requested items (shown prominently for creator roles)
  const changesItems = myCirculars.filter(c => c.status === "changes_requested" && c.createdById === user.id);

  return (
    <div className="p-6 space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-bold text-[#0f1c3f]">
            {user.role === "hod" ? "HOD Review Dashboard"
             : user.role === "principal" ? "Principal Approval Dashboard"
             : user.role === "placement_director" ? "Placement Director Dashboard"
             : user.role === "event_coordinator" ? "Event Coordinator Dashboard"
             : "My Circulars"}
          </h2>
          <p className="text-xs text-[#6b7597] mt-0.5">{filtered.length} of {myCirculars.length} circulars shown</p>
        </div>
        {canCreate && (
          <button
            onClick={() => onNavigate("create")}
            className="flex items-center gap-2 bg-[#1a3567] hover:bg-[#152d58] active:scale-[0.98] text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            <Plus size={15} /> New Circular
          </button>
        )}
      </div>

      {/* ── Changes-requested banner (creator roles) ── */}
      {changesItems.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-orange-500 shrink-0" />
            <p className="text-sm font-semibold text-orange-800">
              {changesItems.length} circular{changesItems.length > 1 ? "s" : ""} need{changesItems.length === 1 ? "s" : ""} your attention
            </p>
          </div>
          <div className="space-y-2">
            {changesItems.map(c => (
              <div key={c.id} className="flex items-center justify-between bg-white border border-orange-100 rounded-lg px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#0f1c3f] truncate">{c.title}</p>
                  <p className="text-[10px] text-orange-600 mt-0.5 leading-snug">
                    {c.comments.filter(cm => cm.type === "changes_requested").slice(-1)[0]?.message?.slice(0, 80)}…
                  </p>
                </div>
                <button
                  onClick={() => onSelectCircular(c.id)}
                  className="ml-3 text-xs font-medium text-orange-700 hover:text-orange-900 border border-orange-200 hover:border-orange-300 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                >
                  Revise
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Main card ── */}
      <div className="bg-white rounded-xl border border-[#eaecf5] overflow-hidden shadow-sm">

        {/* Search */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-2 bg-[#f4f6fc] rounded-lg px-3 py-2">
            <Search size={13} className="text-[#a8b3d0] shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, reference number, or department…"
              className="bg-transparent text-xs text-[#0f1c3f] placeholder:text-[#a8b3d0] outline-none flex-1"
            />
            {search && (
              <button onClick={() => setSearch("")}>
                <X size={12} className="text-[#a8b3d0] hover:text-[#0f1c3f]" />
              </button>
            )}
          </div>
        </div>

        {/* ── Pill tabs ── */}
        <div className="px-4 pb-3 flex items-center gap-3 flex-wrap">
          <div className="inline-flex items-center bg-[#f0f3fa] rounded-full p-1 gap-1 border border-[#e2e7f0]">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-[#1a3567] text-white shadow-sm"
                    : "text-[#6b7597] hover:text-[#0f1c3f] hover:bg-white/80"
                }`}
              >
                {tab.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold min-w-[18px] text-center ${
                  activeTab === tab.id ? "bg-white/20 text-white" : "bg-[#e2e7f0] text-[#6b7597]"
                }`}>
                  {counts[tab.id] ?? 0}
                </span>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-[#a8b3d0] hidden sm:block">{currentTab.description}</p>
        </div>

        {/* ── Table ── */}
        <div className="overflow-x-auto border-t border-[#f0f2f8]">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f8faff]">
                {["Reference No.", "Title", "Type", "Department", "Date", "Priority", "Status", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-[#a8b3d0] uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f4f6fb]">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2 text-[#a8b3d0]">
                      <div className="w-12 h-12 rounded-full bg-[#f0f3fa] flex items-center justify-center mb-1">
                        <Search size={20} className="text-[#c8d0e8]" />
                      </div>
                      <p className="text-sm font-medium">No circulars found</p>
                      <p className="text-xs">Try adjusting the filters or search query</p>
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map(c => {
                const isActionable = canAct(user, c);
                return (
                  <tr
                    key={c.id}
                    className={`hover:bg-[#f8faff] transition-colors group ${isActionable ? "bg-amber-50/30" : ""}`}
                  >
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="text-xs text-[#5a6483]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {c.refNo}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 max-w-[220px]">
                      <p className="text-xs font-semibold text-[#0f1c3f] truncate">{c.title}</p>
                      <p className="text-[10px] text-[#a8b3d0] mt-0.5 truncate">{c.subject}</p>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${typeCls(c.type)}`}>{typeLabel(c.type)}</span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="text-xs text-[#5a6483]">{c.department}</span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="text-xs text-[#5a6483]">{fmtDate(c.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${priorityCls(c.priority)}`}>
                        {priorityLabel(c.priority)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {/* Open in document modal */}
                        <button
                          onClick={e => { e.stopPropagation(); setModalCircular(c); }}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                            isActionable
                              ? "bg-[#1a3567] text-white hover:bg-[#152d58] shadow-sm"
                              : "bg-[#f0f3fa] text-[#5a6483] hover:bg-[#e6eaf5] hover:text-[#0f1c3f] border border-[#e2e7f0]"
                          }`}
                        >
                          <Eye size={11} />
                          {isActionable ? "Review" : "View"}
                        </button>
                        {/* Navigate to detail */}
                        <button
                          onClick={() => onSelectCircular(c.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#eaecf5] text-[#c8d0e8] hover:text-[#1a3567] transition-colors"
                          title="View details"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        {filtered.length > 0 && (
          <div className="px-4 py-2.5 border-t border-[#f0f2f8] bg-[#f8faff]">
            <p className="text-[10px] text-[#a8b3d0]">
              Showing {filtered.length} of {myCirculars.length} circulars
              {search && ` matching "${search}"`}
            </p>
          </div>
        )}
      </div>

      {/* ── Document modal ── */}
      {modalCircular && (
        <CircularDocumentModal
          circular={modalCircular}
          user={user}
          onClose={() => setModalCircular(null)}
          onUpdateCircular={updated => { onUpdateCircular(updated); }}
        />
      )}
    </div>
  );
}
