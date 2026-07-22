import { Bell, Search } from "lucide-react";
import type { User, Circular } from "../../lib/types";
import { canAct, visibleTo, fmtDate } from "../../lib/helpers";

interface Props {
  title: string;
}

import { useAppContext } from "../../lib/context/AppContext";
import { useRouter } from "next/navigation";

export default function TopBar({ title }: Props) {
  const { currentUser: user, circulars } = useAppContext();
  const router = useRouter();
  
  if (!user) return null;
  const myCirculars = visibleTo(user, circulars);
  const pendingAlerts = myCirculars.filter(c => canAct(user, c)).length;
  const changesAlerts = myCirculars.filter(c => c.status === "changes_requested" && c.createdById === user.id).length;
  const totalAlerts = pendingAlerts + changesAlerts;

  const initials = user.name.split(" ").map(n => n[0]).join("").slice(0, 2);

  return (
    <header className="bg-white border-b border-[#eaecf5] px-6 py-3.5 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <div>
        <h1 className="text-sm font-bold text-[#0f1c3f]">{title}</h1>
        <p className="text-xs text-[#5a6483]">{fmtDate(new Date().toISOString())} · {user.department}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 bg-[#f4f6fc] rounded-lg px-3 py-2 text-[#9aa3bf]">
          <Search size={13} />
          <span className="text-xs">Search circulars…</span>
        </div>

        <button
          onClick={() => router.push("/notifications")}
          className="relative p-2 rounded-lg hover:bg-[#f4f6fc] transition-colors text-[#5a6483] hover:text-[#0f1c3f]"
        >
          <Bell size={16} />
          {totalAlerts > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#c8a84b] rounded-full" />
          )}
        </button>

        <div className="flex items-center gap-2.5 border-l border-[#eaecf5] pl-3">
          <div className="w-7 h-7 bg-[#1a3567] rounded-lg flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">{initials}</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-[#0f1c3f]">{user.name}</p>
            <p className="text-[10px] text-[#9aa3bf]">{user.designation}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
