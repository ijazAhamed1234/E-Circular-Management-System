import { useState } from "react";
import {
  FileText, Download, Eye, PenLine, RotateCcw, XCircle,
  Check, X, Send, CheckCircle, ChevronRight, FileDown, FileImage
} from "lucide-react";
import type { User, Circular, ActivityComment } from "../../lib/types";
import { downloadDocx, downloadPdf } from "../../lib/docGenerator";
import {
  canAct, nextStatus, initStatus, getWorkflowSteps,
  fmtDate, fmtDateTime, typeLabel, typeCls, priorityCls, priorityLabel
} from "../../lib/helpers";
import { USERS, COLLEGE_NAME, COLLEGE_ADDRESS, COLLEGE_CONTACT, COLLEGE_AFFILIATION } from "../../lib/data";
import kiotLogo from "../../imports/images.png";
import StatusBadge from "../../components/shared/StatusBadge";
import { SignatureSVG, ApprovedStamp } from "../../components/shared/SignatureSVG";
import CircularDocumentModal from "../../components/shared/CircularDocumentModal";
import { useAppContext } from "../../lib/context/AppContext";
import { useRouter } from "next/navigation";

interface Props {
  circular: Circular;
}

export default function CircularDetailPage({ circular: c }: Props) {
  const { currentUser: user, updateCircular } = useAppContext();
  const router = useRouter();
  
  const [showAction, setShowAction] = useState(false);

  const [actionType, setActionType] = useState<"approve" | "changes" | "reject" | "remove_signature">("approve");
  const [comment, setComment] = useState("");
  const [showDoc, setShowDoc] = useState(false);
  const [showModal, setShowModal] = useState(false);

  if (!user) return null;

  const userCanAct = canAct(user, c);
  const isCreator = c.createdById === user.id;

  const hasSigned = (c.signatures || []).some(s => s.userId === user.id);
  const isFullyApproved = c.status === "approved";
  const canRemoveSignature = hasSigned && !isFullyApproved;

  async function handleAction() {
    if (!comment.trim() && actionType !== "approve") return;
    
    const res = await fetch(`/api/circulars/${c.id}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: actionType === "changes" ? "changes_requested" : actionType,
        comment: comment.trim() || undefined
      })
    });

    if (res.ok) {
      // Re-fetch the circular to get the latest state including comments & signatures
      const updatedRes = await fetch(`/api/circulars/${c.id}`);
      if (updatedRes.ok) {
        const updatedData = await updatedRes.json();
        updateCircular(updatedData);
      }
    }
    setShowAction(false);
    setComment("");
  }



  const steps = getWorkflowSteps(c, []);

  const COMMENT_ICON: Record<string, React.ReactNode> = {
    submitted: <Send size={12} className="text-blue-500" />,
    approval: <CheckCircle size={12} className="text-emerald-500" />,
    changes_requested: <RotateCcw size={12} className="text-orange-500" />,
    rejected: <XCircle size={12} className="text-red-500" />,
    resubmitted: <RotateCcw size={12} className="text-purple-500" />,
  };
  const COMMENT_BG: Record<string, string> = {
    submitted: "bg-blue-50 border-blue-100",
    approval: "bg-emerald-50 border-emerald-100",
    changes_requested: "bg-orange-50 border-orange-100",
    rejected: "bg-red-50 border-red-100",
    resubmitted: "bg-purple-50 border-purple-100",
  };

  return (
    <div className="p-6 space-y-5">
      {/* Top controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button onClick={() => router.push("/circulars")} className="flex items-center gap-1.5 text-sm text-[#5a6483] hover:text-[#0f1c3f] transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Circulars
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 text-xs bg-[#1a3567] text-white hover:bg-[#152d58] px-3 py-1.5 rounded-lg transition-all shadow-sm font-medium"
          >
            <FileText size={13} /> View Document
          </button>
          <button
            onClick={() => setShowDoc(v => !v)}
            className="flex items-center gap-1.5 text-xs border border-[#d0d8ee] text-[#5a6483] hover:text-[#0f1c3f] hover:border-[#b0bcd8] px-3 py-1.5 rounded-lg transition-all"
          >
            {showDoc ? <Eye size={13} /> : <Eye size={13} />}
            {showDoc ? "View Summary" : "Full Summary"}
          </button>
          <button
            onClick={() => downloadDocx(c)}
            className="flex items-center gap-1.5 text-xs border border-[#d0d8ee] text-[#1a3567] hover:bg-[#eef2ff] px-3 py-1.5 rounded-lg transition-all"
            title="Download as DOCX"
          >
            <FileDown size={13} /> DOCX
          </button>
          <button
            onClick={() => downloadPdf(c)}
            className="flex items-center gap-1.5 text-xs border border-[#d0d8ee] text-[#1a3567] hover:bg-[#eef2ff] px-3 py-1.5 rounded-lg transition-all"
            title="Download as PDF"
          >
            <FileImage size={13} /> PDF
          </button>
        </div>
      </div>

      {showDoc ? (
        /* ── Formal Document View ── */
        <div className="bg-white rounded-xl border border-[#eaecf5] p-8 max-w-4xl mx-auto shadow-sm">
          {/* Letterhead */}
          <div className="text-center border-b-2 border-[#1a3567] pb-5 mb-6">
            <div className="flex items-center justify-center gap-4 mb-3">
              <div className="w-14 h-14 rounded-xl bg-white border border-[#e2e7f0] flex items-center justify-center shadow-sm overflow-hidden shrink-0">
                <img src={kiotLogo.src} alt="KIOT Logo" className="w-full h-full object-contain p-0.5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#1a3567]" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {COLLEGE_NAME}
                </h1>
                <p className="text-xs text-[#5a6483]">{COLLEGE_ADDRESS}</p>
                <p className="text-xs text-[#5a6483]">{COLLEGE_CONTACT}</p>
                <p className="text-xs text-[#9aa3bf]">{COLLEGE_AFFILIATION}</p>
              </div>
            </div>
            <div className="bg-[#f0f2f8] rounded px-4 py-1.5 inline-block">
              <p className="text-xs font-bold text-[#1a3567] tracking-widest uppercase">C I R C U L A R</p>
            </div>
          </div>

          {/* Ref + Date */}
          <div className="grid grid-cols-2 gap-4 mb-5 text-xs">
            <div>
              <span className="text-[#9aa3bf]">Ref No: </span>
              <span className="font-semibold text-[#0f1c3f]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{c.refNo}</span>
            </div>
            <div className="text-right">
              <span className="text-[#9aa3bf]">Date: </span>
              <span className="font-semibold text-[#0f1c3f]">{fmtDate(c.createdAt)}</span>
            </div>
          </div>

          <div className="mb-4 text-xs space-y-1.5">
            <div>
              <span className="text-[#9aa3bf]">To: </span>
              <span className="font-semibold text-[#0f1c3f]">
                {c.targetDepts.map(d => `All Students & Faculty – ${d}`).join("; ")}
              </span>
            </div>
            <div>
              <span className="text-[#9aa3bf]">Sub: </span>
              <span className="font-semibold text-[#0f1c3f]">{c.subject}</span>
            </div>
          </div>
          <hr className="border-[#eaecf5] mb-5" />

          <div className="text-sm text-[#0f1c3f] leading-relaxed whitespace-pre-line mb-8">{c.content}</div>

          {(c.attachments || []).length > 0 && (
            <div className="mb-8 bg-[#f8faff] rounded-lg p-3">
              <p className="text-xs font-semibold text-[#5a6483] mb-2">Enclosures:</p>
              {(c.attachments || []).map((a, i) => (
                <p key={a} className="text-xs text-[#5a6483]">{i + 1}. {a}</p>
              ))}
            </div>
          )}

          {/* Signature blocks */}
          <div className="mt-8 pt-6 border-t border-[#eaecf5]">
            {(c.signatures || []).length === 0 ? (
              <p className="text-xs text-[#9aa3bf] italic text-center py-4">Awaiting digital signatures</p>
            ) : (
              <div className={`grid gap-6 ${(c.signatures || []).length > 1 ? "grid-cols-2" : "grid-cols-1 max-w-xs"}`}>
                {(c.signatures || []).map(sig => (
                  <div key={sig.userId} className="border border-[#eaecf5] rounded-2xl p-4 text-center relative overflow-hidden shadow-sm hover:shadow transition-shadow">
                    {c.status === "approved" && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <ApprovedStamp />
                      </div>
                    )}
                    <div className="relative">
                      <div className="bg-[#f8faff] rounded-lg p-3 mb-2 inline-block">
                        <SignatureSVG userId={sig.userId} />
                      </div>
                      <div className="h-px bg-[#eaecf5] w-full mb-2" />
                      <p className="text-xs font-bold text-[#0f1c3f]">{sig.userName}</p>
                      <p className="text-[10px] text-[#5a6483]">{sig.designation}</p>
                      <p className="text-[10px] text-[#9aa3bf] mt-0.5">{sig.department}</p>
                      <p className="text-[10px] text-[#9aa3bf] mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        Signed: {fmtDateTime(sig.signedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── Summary View ── */
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-5">
            {/* Header card */}
            <div className="bg-white rounded-2xl border border-[#eaecf5] p-6 shadow-sm">
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeCls(c.type)}`}>{typeLabel(c.type)}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityCls(c.priority)}`}>{priorityLabel(c.priority)}</span>
                <StatusBadge status={c.status} />
              </div>
              <h2 className="text-base font-bold text-[#0f1c3f] leading-snug mb-1">{c.title}</h2>
              <p className="text-xs text-[#5a6483] mb-4">{c.subject}</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                {[
                  { label: "Reference No.", value: c.refNo, mono: true },
                  { label: "Issued By", value: c.createdByName },
                  { label: "Date", value: fmtDate(c.createdAt) },
                  { label: "Department", value: c.department },
                  { label: "Target Dept(s)", value: c.targetDepts.length > 2 ? `${c.targetDepts.slice(0, 2).join(", ")} +${c.targetDepts.length - 2}` : c.targetDepts.join(", ") },
                  { label: "Signatures", value: `${(c.signatures || []).length} applied` },
                ].map(item => (
                  <div key={item.label} className="bg-[#f8faff] rounded-lg p-2.5">
                    <p className="text-[10px] text-[#9aa3bf] uppercase tracking-wide mb-0.5">{item.label}</p>
                    <p
                      className={`font-semibold text-[#0f1c3f] truncate ${item.mono ? "text-[11px]" : ""}`}
                      style={item.mono ? { fontFamily: "'JetBrains Mono', monospace" } : {}}
                    >
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              {(c.attachments || []).length > 0 && (
                <div className="mt-4 flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-[#9aa3bf] uppercase tracking-wide">Attachments:</span>
                  {(c.attachments || []).map(a => (
                    <span key={a} className="flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded text-[10px] font-medium">
                      <FileText size={10} />{a}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl border border-[#eaecf5] overflow-hidden shadow-sm p-6">
              <h3 className="text-xs font-semibold text-[#9aa3bf] uppercase tracking-wider mb-3">Circular Content</h3>
              {c.contentHtml ? (
                <div
                  className="text-sm text-[#0f1c3f] leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: c.contentHtml }}
                />
              ) : (
                <div className="text-sm text-[#0f1c3f] leading-relaxed whitespace-pre-line">{c.content}</div>
              )}
            </div>

            {/* Action area */}
            {(userCanAct || (isCreator && c.status === "changes_requested") || canRemoveSignature) && !showAction && (
              <div className="bg-white rounded-2xl border border-[#eaecf5] p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-[#0f1c3f] mb-3">Your Action</h3>
                {userCanAct && !hasSigned && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => { setActionType("approve"); setShowAction(true); }}
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all shadow-sm">
                      <PenLine size={14} /> Approve & Sign
                    </button>
                    <button onClick={() => { setActionType("changes"); setShowAction(true); }}
                      className="flex items-center gap-2 border border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100 text-sm font-medium px-4 py-2 rounded-lg transition-all">
                      <RotateCcw size={14} /> Request Changes
                    </button>
                    <button onClick={() => { setActionType("reject"); setShowAction(true); }}
                      className="flex items-center gap-2 border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 text-sm font-medium px-4 py-2 rounded-lg transition-all">
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                )}
                {canRemoveSignature && (
                  <div className="mb-3">
                    <p className="text-xs text-[#5a6483] mb-3">
                      You have signed this circular. You can remove your signature if you need to resign or request changes.
                    </p>
                    <button onClick={() => { setActionType("remove_signature"); setShowAction(true); }}
                      className="flex items-center gap-2 border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 text-sm font-medium px-4 py-2 rounded-lg transition-all">
                      <XCircle size={14} /> Remove Signature
                    </button>
                  </div>
                )}
                {isCreator && c.status === "changes_requested" && (
                  <div>
                    <p className="text-xs text-[#5a6483] mb-3">
                      Changes have been requested. Review the comments, make revisions, then resubmit.
                    </p>
                    <button onClick={() => router.push(`/circulars/create?edit=${c.id}`)}
                      className="flex items-center gap-2 bg-[#1a3567] hover:bg-[#152d58] text-white text-sm font-medium px-4 py-2 rounded-lg transition-all shadow-sm">
                      <PenLine size={14} /> Edit & Resubmit Circular
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Action form */}
            {showAction && (
              <div className="bg-white rounded-2xl border border-[#eaecf5] p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-[#0f1c3f]">
                    {actionType === "approve" ? "Approve & Apply Digital Signature" : actionType === "changes" ? "Request Changes" : actionType === "remove_signature" ? "Remove Signature" : "Reject Circular"}
                  </h3>
                  <button onClick={() => { setShowAction(false); setComment(""); }} className="text-[#9aa3bf] hover:text-[#0f1c3f]">
                    <X size={16} />
                  </button>
                </div>

                {actionType === "approve" && (
                  <div className="mb-4 p-4 bg-[#f8faff] border border-[#eaecf5] rounded-xl">
                    <p className="text-xs font-semibold text-[#5a6483] mb-2">Your Digital Signature Preview</p>
                    <div className="flex items-center gap-4">
                      <div className="bg-white border border-[#d0d8ee] rounded-lg p-3 inline-block">
                        <SignatureSVG userId={user.id} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#0f1c3f]">{user.name}</p>
                        <p className="text-xs text-[#5a6483]">{user.designation}</p>
                        <p className="text-xs text-[#9aa3bf]">{user.department}</p>
                        <p className="text-[10px] text-[#9aa3bf] mt-1 font-medium uppercase tracking-wide">
                          Digital Signature · {user.employeeId}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {actionType !== "remove_signature" && (
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-[#0f1c3f] mb-1.5">
                      {actionType === "approve" ? "Remarks (optional)" : "Comments (required)"}
                    </label>
                    <textarea
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      rows={3}
                      placeholder={actionType === "approve" ? "Add any remarks…" : "Describe the changes needed or reason for rejection…"}
                      className="w-full px-4 py-2.5 rounded-lg border border-[#d0d8ee] bg-[#f8faff] text-sm text-[#0f1c3f] placeholder:text-[#9aa3bf] focus:outline-none focus:ring-2 focus:ring-[#1a3567]/30 focus:border-[#1a3567] resize-none transition-all"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {actionType === "approve" && (
                    <button onClick={handleAction}
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-all shadow-sm">
                      <Check size={14} /> Confirm & Sign
                    </button>
                  )}
                  {actionType === "changes" && (
                    <button onClick={handleAction} disabled={!comment.trim()}
                      className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-all shadow-sm">
                      <RotateCcw size={14} /> Send for Revision
                    </button>
                  )}
                  {actionType === "reject" && (
                    <button onClick={handleAction} disabled={!comment.trim()}
                      className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-all shadow-sm">
                      <XCircle size={14} /> Confirm Rejection
                    </button>
                  )}
                  {actionType === "remove_signature" && (
                    <button onClick={handleAction}
                      className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-all shadow-sm">
                      <XCircle size={14} /> Confirm Removal
                    </button>
                  )}
                  <button onClick={() => { setShowAction(false); setComment(""); }}
                    className="text-sm text-[#5a6483] hover:text-[#0f1c3f] px-4 py-2.5 rounded-lg hover:bg-[#f4f6fc] transition-all">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* Workflow steps */}
            <div className="bg-white rounded-2xl border border-[#eaecf5] p-5 shadow-sm">
              <h3 className="text-xs font-semibold text-[#9aa3bf] uppercase tracking-wider mb-4">Approval Workflow</h3>
              <div className="space-y-0">
                {steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                        step.done ? "bg-emerald-500" :
                        i === steps.findIndex(s => !s.done) && c.status !== "rejected" && c.status !== "changes_requested"
                          ? "bg-amber-400" : "bg-[#eaecf5]"
                      }`}>
                        {step.done
                          ? <Check size={12} className="text-white" />
                          : <span className="text-[10px] font-bold text-[#9aa3bf]">{i + 1}</span>
                        }
                      </div>
                      {i < steps.length - 1 && (
                        <div className={`w-0.5 h-6 ${step.done ? "bg-emerald-200" : "bg-[#eaecf5]"}`} />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className={`text-xs font-semibold ${step.done ? "text-emerald-700" : "text-[#5a6483]"}`}>
                        {step.label}
                      </p>
                    </div>
                  </div>
                ))}

                {c.status === "changes_requested" && (
                  <div className="mt-2 flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
                    <RotateCcw size={13} className="text-orange-500 shrink-0" />
                    <p className="text-xs text-orange-700">Changes requested – awaiting revision</p>
                  </div>
                )}
                {c.status === "rejected" && (
                  <div className="mt-2 flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    <XCircle size={13} className="text-red-500 shrink-0" />
                    <p className="text-xs text-red-700">Circular rejected</p>
                  </div>
                )}
              </div>
            </div>

            {/* Applied signatures */}
            <div className="bg-white rounded-2xl border border-[#eaecf5] p-5 shadow-sm">
              <h3 className="text-xs font-semibold text-[#9aa3bf] uppercase tracking-wider mb-3">Digital Signatures</h3>
              {(c.signatures || []).length === 0 ? (
                <p className="text-xs text-[#9aa3bf] italic">No signatures applied yet</p>
              ) : (
                <div className="space-y-3">
                  {(c.signatures || []).map(sig => (
                    <div key={sig.userId} className="border border-[#eaecf5] rounded-lg p-3">
                      <div className="bg-[#f8faff] rounded p-2 mb-2">
                        <SignatureSVG userId={sig.userId} />
                      </div>
                      <p className="text-xs font-semibold text-[#0f1c3f]">{sig.userName}</p>
                      <p className="text-[10px] text-[#5a6483]">{sig.designation}</p>
                      <p className="text-[10px] text-[#9aa3bf] mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {fmtDateTime(sig.signedAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Activity timeline */}
            <div className="bg-white rounded-2xl border border-[#eaecf5] p-5 shadow-sm">
              <h3 className="text-xs font-semibold text-[#9aa3bf] uppercase tracking-wider mb-3">Activity Timeline</h3>
              <div className="space-y-3">
                {[...(c.comments || [])].reverse().map(cm => (
                  <div key={cm.id} className={`rounded-xl p-3.5 border text-xs ${COMMENT_BG[cm.type] || "bg-gray-50 border-gray-100"}`}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5">
                        {COMMENT_ICON[cm.type]}
                        <span className="font-bold text-[#0f1c3f]">{cm.authorName}</span>
                      </div>
                      <span className="text-[9px] text-[#9aa3bf] shrink-0" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {fmtDateTime(cm.timestamp)}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#5a6483] mb-1.5">{cm.designation}</p>
                    {cm.type === "changes_requested" ? (
                      <div className="bg-orange-100/60 border border-orange-200 rounded-lg px-3 py-2 mt-1">
                        <p className="text-[11px] text-orange-800 font-medium leading-snug">{cm.message}</p>
                      </div>
                    ) : cm.type === "rejected" ? (
                      <div className="bg-red-100/60 border border-red-200 rounded-lg px-3 py-2 mt-1">
                        <p className="text-[11px] text-red-800 font-medium leading-snug">{cm.message}</p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-[#0f1c3f] leading-snug">{cm.message}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document modal */}
      {showModal && (
        <CircularDocumentModal
          circular={c}
          user={user}
          onClose={() => setShowModal(false)}
          onUpdateCircular={updated => { updateCircular(updated); setShowModal(false); }}
        />
      )}
    </div>
  );
}
