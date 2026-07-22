import { useState } from "react";
import { X, Check, RotateCcw, XCircle, PenLine, FileText, FileDown, FileImage } from "lucide-react";
import { downloadDocx, downloadPdf, DIST_DEPTS, resolveCheckedDepts } from "../../lib/docGenerator";
import kiotLogo from "../../imports/images.png";
import type { User, Circular, ActivityComment, Sig, Role } from "../../lib/types";
import {
  USERS, COLLEGE_NAME, COLLEGE_ADDRESS, COLLEGE_CONTACT, COLLEGE_AFFILIATION,
} from "../../lib/data";
import {
  canAct, nextStatus, fmtDate, fmtDateTime, typeLabel, typeCls, priorityCls, priorityLabel,
} from "../../lib/helpers";
import { SignatureSVG, ApprovedStamp } from "./SignatureSVG";

interface Props {
  circular: Circular;
  user: User;
  onClose: () => void;
  onUpdateCircular: (updated: Circular) => void;
}

interface SigBoxData {
  label: string;
  role: Role | null;
  sig?: Sig;
  isMyTurn: boolean;
}

function buildSigBoxes(c: Circular, currentUser: User): SigBoxData[] {
  const sigByRole: Record<string, Sig> = {};
  c.signatures.forEach(s => {
    const u = USERS.find(u => u.id === s.userId);
    if (u) sigByRole[u.role] = s;
  });

  const creatorSig: Sig = {
    userId: c.createdById,
    userName: c.createdByName,
    designation: c.createdByRole,
    department: c.department,
    signedAt: c.createdAt,
  };

  const creator: SigBoxData = { label: "Issued By", role: null, sig: creatorSig, isMyTurn: false };

  const box = (label: string, role: Role): SigBoxData => ({
    label,
    role,
    sig: sigByRole[role],
    isMyTurn: currentUser.role === role && canAct(currentUser, c),
  });

  // Custom approval flow takes priority over type-based routing
  if (c.approvalFlow && c.approvalFlow.length > 0) {
    const LABEL: Partial<Record<Role, string>> = {
      hod: "HOD", principal: "Principal",
      placement_director: "Placement Director", event_coordinator: "Event Coordinator",
    };
    return [creator, ...c.approvalFlow.map(role => box(LABEL[role] ?? role, role))];
  }
  if (c.type === "placement") {
    return [creator, box("Placement Director", "placement_director"), box("Principal", "principal")];
  }
  if (c.type === "inter_department" || c.type === "event") {
    return [creator, box("HOD", "hod"), box("Event Coordinator", "event_coordinator")];
  }
  if (c.type === "all_department" || c.type === "examination") {
    return [creator, box("Principal", "principal")];
  }
  return [creator, box("HOD", "hod"), box("Principal", "principal")];
}

type ActionMode = "idle" | "approve" | "changes" | "reject";
type SigPhase = "idle" | "signing" | "signed";

export default function CircularDocumentModal({ circular: c, user, onClose, onUpdateCircular }: Props) {
  const [actionMode, setActionMode] = useState<ActionMode>("idle");
  const [comment, setComment] = useState("");
  const [sigPhase, setSigPhase] = useState<SigPhase>("idle");

  const userCanAct = canAct(user, c);
  const sigBoxes = buildSigBoxes(c, user);

  function handleApprove() {
    if (sigPhase !== "idle") return;
    setSigPhase("signing");
    setTimeout(() => {
      setSigPhase("signed");
      const now = new Date().toISOString();
      const newSig: Sig = {
        userId: user.id,
        userName: user.name,
        designation: user.designation,
        department: user.department,
        signedAt: now,
      };
      const newComment: ActivityComment = {
        id: `cm-${Date.now()}`,
        authorId: user.id,
        authorName: user.name,
        designation: user.designation,
        message: comment.trim() || "Approved and digitally signed.",
        timestamp: now,
        type: "approval",
      };
      onUpdateCircular({
        ...c,
        status: nextStatus(c),
        signatures: [...c.signatures, newSig],
        comments: [...c.comments, newComment],
      });
      setTimeout(() => onClose(), 700);
    }, 1400);
  }

  function handleChanges() {
    if (!comment.trim()) return;
    const now = new Date().toISOString();
    const newComment: ActivityComment = {
      id: `cm-${Date.now()}`,
      authorId: user.id,
      authorName: user.name,
      designation: user.designation,
      message: comment.trim(),
      timestamp: now,
      type: "changes_requested",
    };
    onUpdateCircular({ ...c, status: "changes_requested", comments: [...c.comments, newComment] });
    onClose();
  }

  function handleReject() {
    if (!comment.trim()) return;
    const now = new Date().toISOString();
    const newComment: ActivityComment = {
      id: `cm-${Date.now()}`,
      authorId: user.id,
      authorName: user.name,
      designation: user.designation,
      message: comment.trim(),
      timestamp: now,
      type: "rejected",
    };
    onUpdateCircular({ ...c, status: "rejected", comments: [...c.comments, newComment] });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#08122e]/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-3xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#eaecf5] bg-[#f8faff] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#1a3567] flex items-center justify-center">
              <FileText size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#0f1c3f] leading-tight truncate max-w-[320px]">{c.title}</p>
              <p className="text-[10px] text-[#6b7597] mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {c.refNo}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${typeCls(c.type)}`}>{typeLabel(c.type)}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${priorityCls(c.priority)}`}>{priorityLabel(c.priority)}</span>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-[#eaecf5] flex items-center justify-center text-[#6b7597] hover:text-[#0f1c3f] transition-colors ml-1">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable document */}
        <div className="flex-1 overflow-y-auto px-8 py-6 bg-white">

          {/* KIOT Letterhead */}
          <div className="border-b-2 border-[#1a3567] pb-3 mb-0">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-lg bg-white border border-[#e2e7f0] flex items-center justify-center shadow-sm overflow-hidden shrink-0">
                <img src={kiotLogo} alt="KIOT Logo" className="w-full h-full object-contain p-0.5" />
              </div>
              <div className="flex-1 text-center">
                <h1 className="text-[15px] font-bold text-[#1a3567] leading-tight uppercase tracking-wide">
                  {COLLEGE_NAME}
                </h1>
                <p className="text-[11px] text-[#333] font-medium mt-0.5">(An Autonomous Institution)</p>
                <p className="text-[10px] text-[#6b7597] mt-0.5">{COLLEGE_AFFILIATION}</p>
                <p className="text-[10px] text-[#6b7597]">{COLLEGE_ADDRESS} &nbsp;|&nbsp; www.kiot.ac.in</p>
              </div>
              <div className="w-14 text-right">
                <span className="text-xs font-bold text-[#1a3567]">
                  {c.department.split(" ").map(w => w[0]).join("").toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Circular type title */}
          {(() => {
            const typeMap: Record<string, string> = {
              departmental: "Departmental Circular",
              inter_department: "Intra – Department Circular",
              all_department: "All Department Circular",
              placement: "Placement Circular",
              examination: "Examination Circular",
              event: "Event Circular",
            };
            return (
              <div className="border border-[#1a3567] text-center py-1.5 mb-0">
                <span className="text-[12px] font-bold text-[#1a3567]">{typeMap[c.type] ?? "Circular"}</span>
              </div>
            );
          })()}

          {/* Ref No + Date row */}
          <div className="grid grid-cols-2 border border-[#aaa] border-t-0 text-xs mb-0">
            <div className="px-3 py-1.5 border-r border-[#aaa]">
              <span className="text-[#555]">Circular No.: </span>
              <span className="font-bold text-[#0f1c3f]" style={{ fontFamily: "monospace" }}>{c.refNo}</span>
            </div>
            <div className="px-3 py-1.5">
              <span className="text-[#555]">Date: </span>
              <span className="font-semibold text-[#0f1c3f]">{fmtDate(c.createdAt)}</span>
            </div>
          </div>

          {/* Fields table: To / Subject / Circular issued by */}
          {(() => {
            const creatorUser = USERS.find(u => u.id === c.createdById);
            const issuedBy = `${c.createdByName}${creatorUser?.designation ? `, ${creatorUser.designation}` : ""} – ${c.department}`;
            const fields = [
              { label: "To", value: c.targetDepts.map(d => `All Students & Faculty Members – ${d}`).join("; ") },
              { label: "Subject", value: c.subject },
              { label: "Circular issued by", value: issuedBy },
            ];
            return (
              <div className="border border-[#aaa] border-t-0 mb-4 text-xs">
                {fields.map((f, i) => (
                  <div key={i} className={`flex ${i < fields.length - 1 ? "border-b border-[#aaa]" : ""}`}>
                    <div className="w-32 shrink-0 font-bold text-[#0f1c3f] px-3 py-1.5 border-r border-[#aaa]">{f.label}</div>
                    <div className="flex-1 px-3 py-1.5 text-[#1a2340]">{f.value}</div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Circular body */}
          {c.contentHtml ? (
            <div
              className="text-sm text-[#1a2340] leading-[1.85] mb-6 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: c.contentHtml }}
            />
          ) : (
            <div className="text-sm text-[#1a2340] leading-[1.85] whitespace-pre-line mb-6">{c.content}</div>
          )}

          {/* Attachments */}
          {c.attachments.length > 0 && (
            <div className="mb-8 bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-[#1a3567] mb-2">Enclosures / Attachments:</p>
              {c.attachments.map((a, i) => (
                <p key={a} className="text-xs text-[#5a6483]">{i + 1}. {a}</p>
              ))}
            </div>
          )}

          {/* ── Distribution table ── */}
          {(() => {
            const checked = resolveCheckedDepts(c);
            return (
              <div className="mt-4 mb-2">
                <p className="text-[10px] font-bold text-[#1a3567] uppercase tracking-widest text-center mb-1">Distribution</p>
                <div className="border border-[#aaa] overflow-hidden">
                  {/* Label row */}
                  <div className="flex">
                    {DIST_DEPTS.map((d, i) => (
                      <div
                        key={d.abbr}
                        className={`flex-1 text-center text-[7px] font-bold text-[#1a3567] py-0.5 leading-tight ${i < DIST_DEPTS.length - 1 ? "border-r border-[#aaa]" : ""}`}
                      >
                        {d.abbr}
                      </div>
                    ))}
                  </div>
                  {/* Tick row */}
                  <div className="flex border-t border-[#aaa]">
                    {DIST_DEPTS.map((d, i) => (
                      <div
                        key={d.abbr}
                        className={`flex-1 text-center text-[8px] font-bold py-0.5 leading-tight ${i < DIST_DEPTS.length - 1 ? "border-r border-[#aaa]" : ""} ${checked.has(d.abbr) ? "bg-[#e8f0fe] text-[#1a3567]" : "text-transparent"}`}
                      >
                        ✓
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── Signature blocks ── */}
          <div className="mt-2">
            {/* Header row — role labels */}
            <div
              className="grid"
              style={{ gridTemplateColumns: `repeat(${sigBoxes.length}, 1fr)` }}
            >
              {sigBoxes.map((box, i) => (
                <div
                  key={i}
                  className={`bg-[#1a3567] text-white text-[10px] font-bold uppercase tracking-wider text-center py-1.5 px-2 ${i < sigBoxes.length - 1 ? "border-r border-white/20" : ""}`}
                >
                  {box.label}
                </div>
              ))}
            </div>
            {/* Content row */}
            <div
              className="grid border border-[#aaa] border-t-0"
              style={{ gridTemplateColumns: `repeat(${sigBoxes.length}, 1fr)` }}
            >
              {sigBoxes.map((box, i) => {
                const isAnimating = box.isMyTurn && sigPhase !== "idle";
                const showSignedContent = box.sig || (box.isMyTurn && sigPhase === "signed");

                return (
                  <div
                    key={i}
                    className={`relative p-3 text-center transition-all duration-500 overflow-hidden min-h-[90px] ${
                      i < sigBoxes.length - 1 ? "border-r border-[#aaa]" : ""
                    } ${
                      isAnimating && sigPhase === "signing"
                        ? "bg-blue-50"
                        : showSignedContent
                          ? "bg-emerald-50/30"
                          : box.isMyTurn
                            ? "bg-amber-50/30"
                            : "bg-white"
                    }`}
                  >
                    {/* Approved stamp overlay */}
                    {c.status === "approved" && showSignedContent && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                        <ApprovedStamp />
                      </div>
                    )}

                    {/* Signing animation */}
                    {box.isMyTurn && sigPhase === "signing" && (
                      <div className="flex flex-col items-center gap-2 py-3">
                        <PenLine size={18} className="text-[#1a3567] animate-bounce" />
                        <p className="text-[10px] text-[#1a3567] font-medium">Signing…</p>
                        <div className="h-1 w-20 bg-[#e2e7f0] rounded-full overflow-hidden">
                          <div className="h-full bg-[#1a3567] rounded-full" style={{ animation: "sign-progress 1.4s ease-in-out forwards" }} />
                        </div>
                      </div>
                    )}

                    {/* Signed content */}
                    {showSignedContent && sigPhase !== "signing" && (
                      <div className="relative">
                        <div className="bg-white rounded p-1.5 inline-block border border-[#e2e7f0] mb-1.5">
                          <SignatureSVG userId={box.sig?.userId ?? user.id} />
                        </div>
                        <div className="h-px bg-[#d0d8ee] w-full mb-1.5" />
                        <p className="text-[10px] font-bold text-[#0f1c3f]">
                          {box.sig?.userName ?? user.name}
                        </p>
                        <p className="text-[9px] text-[#5a6483]">
                          {box.sig?.designation ?? user.designation}
                        </p>
                        {box.sig?.signedAt && (
                          <p className="text-[8px] text-[#a8b3d0] mt-0.5" style={{ fontFamily: "monospace" }}>
                            {fmtDateTime(box.sig.signedAt)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Pending placeholder */}
                    {!showSignedContent && !isAnimating && (
                      <div className="py-4">
                        <p className="text-[9px] text-[#a8b3d0] mb-1">Signature: _______________</p>
                        {box.isMyTurn ? (
                          <p className="text-[9px] text-[#c8a84b] font-semibold">Awaiting Your Signature</p>
                        ) : (
                          <p className="text-[9px] text-[#bbbbbb]">Pending</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer verification row */}
            <div className="grid grid-cols-2 border border-[#aaa] border-t-0 text-[10px] text-[#555] mt-4">
              <div className="px-3 py-1.5 border-r border-[#aaa] text-center">Checked by Principal office I/C</div>
              <div className="px-3 py-1.5 text-center">Verified by the sender</div>
            </div>

            {/* File distribution */}
            <div className="mt-3 text-[10px] text-[#555]">
              <span className="font-bold text-[#0f1c3f]">File: </span>
              <span>1) Principal Office &nbsp;&nbsp; 2) Concerned Issuing Department</span>
            </div>
          </div>

          {/* Changes-requested feedback from timeline */}
          {c.status === "changes_requested" && (
            <div className="mt-5 border border-orange-200 bg-orange-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-orange-700 mb-2">Changes Requested</p>
              {c.comments.filter(cm => cm.type === "changes_requested").map(cm => (
                <div key={cm.id} className="text-xs text-orange-800 mb-1">
                  <span className="font-medium">{cm.authorName}</span>
                  <span className="text-orange-600 mx-1">·</span>
                  <span className="text-[10px] text-orange-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {fmtDateTime(cm.timestamp)}
                  </span>
                  <p className="mt-0.5 leading-relaxed">{cm.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer action bar ── */}
        <div className="shrink-0 border-t border-[#eaecf5] bg-white px-6 py-4">
          {/* Download buttons always visible */}
          {!userCanAct && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadDocx(c)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#d0d8ee] bg-[#f8faff] text-[#1a3567] hover:bg-[#eef2ff] text-xs font-medium transition-all"
                title="Download as DOCX"
              >
                <FileDown size={13} /> DOCX
              </button>
              <button
                onClick={() => downloadPdf(c)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#d0d8ee] bg-[#f8faff] text-[#1a3567] hover:bg-[#eef2ff] text-xs font-medium transition-all"
                title="Download as PDF"
              >
                <FileImage size={13} /> PDF
              </button>
            </div>
          )}
          {userCanAct && (
          <div>
            {/* Inline changes/reject form */}
            {(actionMode === "changes" || actionMode === "reject") && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-[#0f1c3f] mb-1.5">
                  {actionMode === "changes" ? "Describe the changes needed" : "Reason for rejection"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={3}
                  placeholder={actionMode === "changes" ? "Specify what needs to be revised or updated…" : "Explain why this circular is being rejected…"}
                  className="w-full px-3 py-2.5 rounded-lg border border-[#d0d8ee] bg-[#f8faff] text-sm text-[#0f1c3f] placeholder:text-[#a8b3d0] focus:outline-none focus:ring-2 focus:ring-[#1a3567]/20 focus:border-[#1a3567] resize-none transition-all"
                />
              </div>
            )}

            {/* Approve optional comment */}
            {actionMode === "approve" && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-[#0f1c3f] mb-1.5">Remarks (optional)</label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={2}
                  placeholder="Add any approval remarks…"
                  className="w-full px-3 py-2.5 rounded-lg border border-[#d0d8ee] bg-[#f8faff] text-sm text-[#0f1c3f] placeholder:text-[#a8b3d0] focus:outline-none focus:ring-2 focus:ring-[#1a3567]/20 focus:border-[#1a3567] resize-none transition-all"
                />
              </div>
            )}

            <div className="flex items-center gap-2 justify-between flex-wrap">
              {/* Download buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadDocx(c)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#d0d8ee] bg-[#f8faff] text-[#1a3567] hover:bg-[#eef2ff] text-xs font-medium transition-all"
                  title="Download as DOCX"
                >
                  <FileDown size={13} /> DOCX
                </button>
                <button
                  onClick={() => downloadPdf(c)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#d0d8ee] bg-[#f8faff] text-[#1a3567] hover:bg-[#eef2ff] text-xs font-medium transition-all"
                  title="Download as PDF"
                >
                  <FileImage size={13} /> PDF
                </button>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
              {/* Cancel action mode */}
              {actionMode !== "idle" && (
                <button
                  onClick={() => { setActionMode("idle"); setComment(""); }}
                  className="px-4 py-2 text-sm text-[#5a6483] hover:text-[#0f1c3f] hover:bg-[#f4f6fc] rounded-lg transition-all"
                >
                  Cancel
                </button>
              )}

              {/* Idle state buttons */}
              {actionMode === "idle" && (
                <>
                  <button
                    onClick={() => setActionMode("reject")}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-medium transition-all"
                  >
                    <XCircle size={13} /> Reject
                  </button>
                  <button
                    onClick={() => setActionMode("changes")}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 text-sm font-medium transition-all"
                  >
                    <RotateCcw size={14} /> Request Changes
                  </button>
                  <button
                    onClick={() => setActionMode("approve")}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-all shadow-sm"
                  >
                    <PenLine size={14} /> Approve & Sign
                  </button>
                </>
              )}

              {/* Changes confirm */}
              {actionMode === "changes" && (
                <button
                  onClick={handleChanges}
                  disabled={!comment.trim()}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all shadow-sm"
                >
                  <RotateCcw size={14} /> Send for Revision
                </button>
              )}

              {/* Reject confirm */}
              {actionMode === "reject" && (
                <button
                  onClick={handleReject}
                  disabled={!comment.trim()}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all shadow-sm"
                >
                  <XCircle size={14} /> Confirm Rejection
                </button>
              )}

              {/* Approve confirm */}
              {actionMode === "approve" && (
                <button
                  onClick={handleApprove}
                  disabled={sigPhase !== "idle"}
                  className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#1a3567] hover:bg-[#152d58] disabled:opacity-60 text-white text-sm font-bold transition-all shadow-md hover:shadow-lg"
                >
                  {sigPhase === "signing" ? (
                    <>
                      <PenLine size={14} className="animate-pulse" /> Signing…
                    </>
                  ) : sigPhase === "signed" ? (
                    <>
                      <Check size={14} /> Signed ✓
                    </>
                  ) : (
                    <>
                      <Check size={14} /> Confirm & Sign
                    </>
                  )}
                </button>
              )}
              </div>
            </div>
          </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes sign-progress {
          from { width: 0; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  );
}
