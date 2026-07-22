import { Bell, Clock, AlertCircle, CheckCircle, ChevronRight } from "lucide-react";
import type { User, Circular } from "../../lib/types";
import { canAct, visibleTo, fmtDateTime } from "../../lib/helpers";

interface Props {
  user: User;
  circulars: Circular[];
  onSelectCircular: (id: string) => void;
}

type NotifType = "action" | "changes" | "approved";

interface Notif {
  id: string;
  type: NotifType;
  title: string;
  desc: string;
  date: string;
  circularId: string;
}

export default function NotificationsPage({ user, circulars, onSelectCircular }: Props) {
  const myCirculars = visibleTo(user, circulars);

  const notifs: Notif[] = [
    ...myCirculars
      .filter(c => canAct(user, c))
      .map(c => ({
        id: `${c.id}-action`,
        type: "action" as const,
        title: `Action Required: ${c.title}`,
        desc: `Circular ${c.refNo} is awaiting your digital signature and approval.`,
        date: c.createdAt,
        circularId: c.id,
      })),
    ...myCirculars
      .filter(c => c.status === "changes_requested" && c.createdById === user.id)
      .map(c => ({
        id: `${c.id}-changes`,
        type: "changes" as const,
        title: `Changes Requested: ${c.title}`,
        desc: c.comments[c.comments.length - 1]?.message || "Reviewer has requested changes to your circular.",
        date: c.comments[c.comments.length - 1]?.timestamp || c.createdAt,
        circularId: c.id,
      })),
    ...myCirculars
      .filter(c => c.status === "approved" && c.createdById === user.id)
      .map(c => ({
        id: `${c.id}-approved`,
        type: "approved" as const,
        title: `Approved: ${c.title}`,
        desc: `Circular ${c.refNo} has been fully approved and digitally signed by all authorities.`,
        date: c.signatures[c.signatures.length - 1]?.signedAt || c.createdAt,
        circularId: c.id,
      })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const ICON: Record<NotifType, React.ReactNode> = {
    action: <Clock size={14} className="text-amber-500" />,
    changes: <AlertCircle size={14} className="text-orange-500" />,
    approved: <CheckCircle size={14} className="text-emerald-500" />,
  };

  const BG: Record<NotifType, string> = {
    action: "bg-amber-50 border-amber-100",
    changes: "bg-orange-50 border-orange-100",
    approved: "bg-emerald-50 border-emerald-100",
  };

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-5">
        <h2 className="text-base font-bold text-[#0f1c3f]">Notifications</h2>
        <p className="text-xs text-[#5a6483]">{notifs.length} notification{notifs.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="space-y-3">
        {notifs.length === 0 && (
          <div className="bg-white rounded-xl border border-[#eaecf5] py-16 text-center">
            <Bell size={28} className="text-[#d0d8ee] mx-auto mb-3" />
            <p className="text-sm text-[#9aa3bf]">You are all caught up. No new notifications.</p>
          </div>
        )}

        {notifs.map(n => (
          <button
            key={n.id}
            onClick={() => onSelectCircular(n.circularId)}
            className={`w-full text-left flex items-start gap-4 p-4 rounded-xl border transition-all hover:shadow-sm ${BG[n.type]}`}
          >
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm">
              {ICON[n.type]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#0f1c3f] truncate">{n.title}</p>
              <p className="text-xs text-[#5a6483] mt-0.5 line-clamp-2">{n.desc}</p>
              <p className="text-[10px] text-[#9aa3bf] mt-1.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {fmtDateTime(n.date)}
              </p>
            </div>
            <ChevronRight size={14} className="text-[#9aa3bf] shrink-0 mt-1" />
          </button>
        ))}
      </div>
    </div>
  );
}
