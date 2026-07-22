import { useState, useEffect } from "react";
import { Send, FileDown, FileText, Loader2, ChevronRight, UserCheck } from "lucide-react";
import type { User, Circular, CircularType, Dept, Role, ActivityComment } from "../../lib/types";
import { initStatus } from "../../lib/helpers";
import { USERS } from "../../lib/data";
import RichTextEditor from "../../components/shared/RichTextEditor";
import { downloadDocx, stripHtml, DIST_DEPTS, resolveCheckedDepts } from "../../lib/docGenerator";

import { useAppContext } from "../../lib/context/AppContext";
import { useRouter, useSearchParams } from "next/navigation";

const ALL_DEPTS: Dept[] = [
  "CSE",
  "ECE",
  "IT",
  "AIDS",
  "ECX",
  "EEE",
  "MECH",
  "CIVIL",
];

const TYPE_OPTIONS: { value: CircularType; label: string }[] = [
  { value: "departmental",    label: "Departmental" },
  { value: "inter_department",label: "Inter-Department" },
  { value: "all_department",  label: "All Department" },
  { value: "examination",     label: "Examination" },
  { value: "event",           label: "Event" },
  { value: "placement",       label: "Placement" },
];

const PRIORITY_OPTS = [
  { value: "normal",      label: "Normal",      cls: "bg-slate-100 text-slate-600 border-slate-200" },
  { value: "urgent",      label: "Urgent",      cls: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "very_urgent", label: "Very Urgent", cls: "bg-red-50 text-red-700 border-red-200" },
];

// Approver options with display metadata
const APPROVER_OPTIONS: { role: Role; label: string; desc: string; color: string }[] = [
  { role: "hod",                label: "HOD",               desc: "Head of Department",         color: "#7c3aed" },
  { role: "placement_director", label: "Placement Director",desc: "Dept. of Placement",         color: "#db2777" },
  { role: "event_coordinator",  label: "Event Coordinator", desc: "Events & Activities",        color: "#0891b2" },
  { role: "principal",          label: "Principal",         desc: "Principal's Office",         color: "#b45309" },
];

// Fixed signing order — whoever is selected follows this hierarchy
const SIGNING_ORDER: Role[] = ["hod", "placement_director", "event_coordinator", "principal"];

const LABEL_CLS = "block text-[11px] font-bold text-[#0f1c3f] mb-1.5 uppercase tracking-wider";
const INPUT_CLS = "w-full px-3.5 py-2.5 rounded-xl border border-[#d0d8ee] bg-[#f8faff] text-sm text-[#0f1c3f] placeholder:text-[#b0b9d4] focus:outline-none focus:ring-2 focus:ring-[#1a3567]/20 focus:border-[#1a3567] transition-all";

export default function CreateCircularPage() {
  const { currentUser: user, createCircular, circulars, updateCircular } = useAppContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get("edit");

  if (!user) return null;
  const [title,        setTitle]        = useState("");
  const [type,         setType]         = useState<CircularType>(user.role === "placement_coordinator" ? "placement" : "departmental");
  const [subject,      setSubject]      = useState("");
  const [contentHtml,  setContentHtml]  = useState("<p></p>");
  const [priority,     setPriority]     = useState<"normal" | "urgent" | "very_urgent">("normal");
  const [targetDepts,  setTargetDepts]  = useState<Dept[]>([]);
  const [targetUsers,  setTargetUsers]  = useState<string[]>([]);
  const [selectedApprovers, setSelectedApprovers] = useState<Role[]>(["hod", "principal"]);
  const [submitting,   setSubmitting]   = useState(false);

  useEffect(() => {
    if (editId) {
      const existing = circulars.find(c => c.id === editId);
      if (existing) {
        setTitle(existing.title);
        setType(existing.type);
        setSubject(existing.subject);
        setContentHtml(existing.contentHtml || `<p>${existing.content}</p>`);
        setPriority(existing.priority);
        setTargetDepts(existing.targetDepts);
        setTargetUsers(existing.targetUsers || []);
        setSelectedApprovers(existing.approvalFlow);
      }
    }
  }, [editId, circulars]);

  const isPlacement = user.role === "placement_coordinator" || user.role === "placement_director";
  const availableTypes = isPlacement
    ? TYPE_OPTIONS.filter(t => t.value === "placement")
    : TYPE_OPTIONS.filter(t => t.value !== "placement");

  const plainContent = stripHtml(contentHtml);

  // Ordered flow: selected approvers sorted by signing hierarchy
  const approvalFlow: Role[] = SIGNING_ORDER.filter(r => selectedApprovers.includes(r));

  function toggleApprover(role: Role) {
    setSelectedApprovers(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  }

  const toggleDept = (d: Dept) => {
    setTargetDepts(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };

  const toggleUser = (userId: string) => {
    setTargetUsers(prev => prev.includes(userId) ? prev.filter(x => x !== userId) : [...prev, userId]);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !subject.trim() || !plainContent.trim()) return;
    if (approvalFlow.length === 0) return;
    setSubmitting(true);

    const now = new Date().toISOString();

    if (editId) {
      const existing = circulars.find(c => c.id === editId);
      if (existing) {
        const updateComment: ActivityComment = {
          id: `cm-${Date.now()}`,
          authorId: user!.id,
          authorName: user!.name,
          designation: user!.designation,
          message: "Circular revised and resubmitted for approval.",
          timestamp: now,
          type: "resubmitted",
        };
        const updatedCircular: Circular = {
          ...existing,
          title: title.trim(),
          type,
          subject: subject.trim(),
          content: plainContent,
          contentHtml,
          priority,
          targetDepts: targetDepts.length > 0 ? targetDepts : [user!.department as Dept],
          targetUsers,
          approvalFlow,
          status: initStatus(type, user!.role, approvalFlow),
          comments: [...existing.comments, updateComment]
        };
        updateCircular(updatedCircular);
        setSubmitting(false);
        router.push(`/circulars/${existing.id}`);
        return;
      }
    }

    const deptCode = user!.department.split(" ").map(w => w[0]).join("").toUpperCase();
    const year = new Date().getFullYear();
    const seq = String(Math.floor(Math.random() * 900) + 100);
    const refNo = `KIOT/${deptCode}/${year}-${String(year + 1).slice(-2)}/${seq}`;

    const firstComment: ActivityComment = {
      id: `cm-${Date.now()}`,
      authorId: user!.id,
      authorName: user!.name,
      designation: user!.designation,
      message: "Circular submitted for approval.",
      timestamp: now,
      type: "submitted",
    };

    const newCircular: Circular = {
      id: `c-${Date.now()}`,
      refNo,
      title: title.trim(),
      type,
      department: user!.department,
      targetDepts: targetDepts.length > 0 ? targetDepts : [user!.department as Dept],
      targetUsers,
      subject: subject.trim(),
      content: plainContent,
      contentHtml,
      approvalFlow,
      createdById: user!.id,
      createdByName: user!.name,
      createdByRole: user!.role,
      createdAt: now,
      status: initStatus(type, user!.role, approvalFlow),
      priority,
      signatures: [],
      comments: [firstComment],
      attachments: [],
    };

    await downloadDocx(newCircular);
    setSubmitting(false);
    createCircular(newCircular);
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <button
          onClick={() => router.push("/circulars")}
          className="flex items-center gap-1.5 text-sm text-[#5a6483] hover:text-[#0f1c3f] transition-colors mt-0.5 shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="hidden sm:inline">Cancel</span>
        </button>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#0f1c3f] leading-tight">Create New Circular</h2>
          <p className="text-xs text-[#6b7597] mt-0.5">Choose approvers, fill content. A DOCX is auto-downloaded on submit.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">

          {/* Row 1 — Type + Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-[#eaecf5] p-4 shadow-sm">
              <label className={LABEL_CLS}>Circular Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as CircularType)}
                disabled={isPlacement}
                className={INPUT_CLS + " disabled:opacity-60"}
              >
                {availableTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div className="bg-white rounded-2xl border border-[#eaecf5] p-4 shadow-sm">
              <label className={LABEL_CLS}>Priority</label>
              <div className="flex gap-2 flex-wrap">
                {PRIORITY_OPTS.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value as typeof priority)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      priority === p.value
                        ? p.cls + " ring-2 ring-offset-1 ring-current shadow-sm"
                        : "bg-[#f8faff] text-[#8a93b3] border-[#dde3f0] hover:border-[#b0bcd8]"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Approver Picker ── */}
          <div className="bg-white rounded-2xl border border-[#eaecf5] p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <UserCheck size={14} className="text-[#1a3567]" />
              <label className={LABEL_CLS + " mb-0"}>Who needs to sign this circular?</label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {APPROVER_OPTIONS.map(({ role, label, desc, color }) => {
                const selected = selectedApprovers.includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleApprover(role)}
                    className={`relative flex flex-col items-start p-3 rounded-xl border-2 text-left transition-all ${
                      selected
                        ? "shadow-sm"
                        : "border-[#e8ecf5] bg-[#f8faff] hover:border-[#c0cce8]"
                    }`}
                    style={selected ? { borderColor: color, background: color + "0d" } : {}}
                  >
                    {/* Checkmark */}
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mb-2 transition-all ${
                        selected ? "border-current" : "border-[#c8d0e8]"
                      }`}
                      style={selected ? { borderColor: color, background: color } : {}}
                    >
                      {selected && (
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span
                      className="text-xs font-bold leading-tight"
                      style={selected ? { color } : { color: "#0f1c3f" }}
                    >
                      {label}
                    </span>
                    <span className="text-[10px] text-[#8a93b3] mt-0.5 leading-tight">{desc}</span>
                  </button>
                );
              })}
            </div>

            {/* Flow preview */}
            {approvalFlow.length > 0 ? (
              <div className="flex items-center flex-wrap gap-1.5 bg-[#f0f4ff] rounded-lg px-3 py-2">
                <span className="text-[10px] font-semibold text-[#6b7597] uppercase tracking-wide mr-1">Signing order:</span>
                <span className="text-[11px] font-semibold text-[#1a3567] bg-[#1a3567]/10 px-2 py-0.5 rounded-full">
                  You
                </span>
                {approvalFlow.map((role, i) => {
                  const opt = APPROVER_OPTIONS.find(a => a.role === role)!;
                  return (
                    <span key={role} className="flex items-center gap-1">
                      <ChevronRight size={10} className="text-[#a0aabb]" />
                      <span
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ color: opt.color, background: opt.color + "15" }}
                      >
                        {opt.label}
                      </span>
                    </span>
                  );
                })}
                <ChevronRight size={10} className="text-[#a0aabb]" />
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Approved</span>
              </div>
            ) : (
              <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
                Select at least one approver to continue.
              </p>
            )}
          </div>

          {/* Title */}
          <div className="bg-white rounded-2xl border border-[#eaecf5] p-4 shadow-sm">
            <label className={LABEL_CLS}>Circular Title <span className="text-red-400">*</span></label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              placeholder="e.g., Internal Assessment Schedule – Odd Semester 2024-25"
              className={INPUT_CLS}
            />
          </div>

          {/* Subject */}
          <div className="bg-white rounded-2xl border border-[#eaecf5] p-4 shadow-sm">
            <label className={LABEL_CLS}>Subject Line <span className="text-red-400">*</span></label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              required
              placeholder="Formal one-line subject for the circular"
              className={INPUT_CLS}
            />
          </div>

          {/* Target Departments */}
          <div className="bg-white rounded-2xl border border-[#eaecf5] p-4 shadow-sm">
            <label className={LABEL_CLS}>Target Departments</label>
            <div className="flex flex-wrap gap-2">
              {ALL_DEPTS.map(d => (
                <button
                  type="button"
                  key={d}
                  onClick={() => toggleDept(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    targetDepts.includes(d)
                      ? "bg-[#1a3567] text-white border-[#1a3567] shadow-sm"
                      : "bg-[#f8faff] text-[#5a6483] border-[#dde3f0] hover:border-[#b0bcd8]"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-[#b0b9d4] mt-2 mb-4">Leave empty to default to your own department</p>

            <label className={LABEL_CLS}>Target Individuals (Optional)</label>
            <div className="flex flex-wrap gap-2">
              {USERS.filter(u => u.id !== user.id).map(u => (
                <button
                  type="button"
                  key={u.id}
                  onClick={() => toggleUser(u.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    targetUsers.includes(u.id)
                      ? "bg-[#1a3567] text-white border-[#1a3567] shadow-sm"
                      : "bg-[#f8faff] text-[#5a6483] border-[#dde3f0] hover:border-[#b0bcd8]"
                  }`}
                >
                  {u.name} ({u.designation})
                </button>
              ))}
            </div>
            <p className="text-[10px] text-[#b0b9d4] mt-2">Specifically send to these individuals</p>

            {/* Live distribution preview */}
            {(() => {
              const previewCircular = {
                targetDepts: targetDepts.length > 0 ? targetDepts : [user.department as Dept],
                type,
                approvalFlow,
              } as any;
              const checked = resolveCheckedDepts(previewCircular);
              return (
                <div className="mt-3">
                  <p className="text-[10px] font-semibold text-[#6b7597] mb-1 uppercase tracking-wide">Distribution preview</p>
                  <div className="border border-[#d0d8ee] rounded overflow-hidden">
                    <div className="flex">
                      {DIST_DEPTS.map((d, i) => (
                        <div key={d.abbr} className={`flex-1 text-center text-[6.5px] font-bold py-0.5 leading-tight ${i < DIST_DEPTS.length - 1 ? "border-r border-[#d0d8ee]" : ""} ${checked.has(d.abbr) ? "text-[#1a3567]" : "text-[#c0c8e0]"}`}>
                          {d.abbr}
                        </div>
                      ))}
                    </div>
                    <div className="flex border-t border-[#d0d8ee]">
                      {DIST_DEPTS.map((d, i) => (
                        <div key={d.abbr} className={`flex-1 text-center text-[8px] font-bold py-0.5 ${i < DIST_DEPTS.length - 1 ? "border-r border-[#d0d8ee]" : ""} ${checked.has(d.abbr) ? "bg-[#e8f0fe] text-[#1a3567]" : "text-transparent"}`}>
                          ✓
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Rich Text Content */}
          <div className="bg-white rounded-2xl border border-[#eaecf5] p-4 shadow-sm">
            <label className={LABEL_CLS}>
              Circular Content <span className="text-red-400">*</span>
              <span className="ml-2 text-[10px] text-[#b0b9d4] normal-case tracking-normal font-normal">
                Rich text — Bold, Italic, Lists, Headings supported
              </span>
            </label>
            <RichTextEditor
              content={contentHtml}
              onChange={setContentHtml}
              placeholder="Write the full circular body here. Use the toolbar for formatting."
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1 pb-4">
            <button
              type="submit"
              disabled={submitting || !title.trim() || !subject.trim() || !plainContent.trim() || approvalFlow.length === 0}
              className="flex items-center justify-center gap-2 bg-[#1a3567] hover:bg-[#152d58] disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-sm hover:shadow text-sm"
            >
              {submitting
                ? <><Loader2 size={15} className="animate-spin" /> Generating DOCX…</>
                : <><Send size={14} /> Submit &amp; Download DOCX</>
              }
            </button>
            <div className="flex items-center gap-2 text-[10px] text-[#9aa3bf]">
              <FileDown size={12} />
              <span>A .docx file is auto-downloaded on submit</span>
            </div>
            <button
              type="button"
              onClick={() => router.push("/circulars")}
              className="sm:ml-auto text-sm text-[#5a6483] hover:text-[#0f1c3f] px-4 py-2.5 rounded-xl hover:bg-[#f4f6fc] transition-all border border-transparent hover:border-[#dde3f0]"
            >
              Cancel
            </button>
          </div>

        </div>
      </form>
    </div>
  );
}
