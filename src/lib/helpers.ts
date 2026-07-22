import type { User, Circular, CircularType, CircularStatus, Role, WorkflowStep } from "./types";

// ── Status helpers ──────────────────────────────────────────
export function statusLabel(s: CircularStatus): string {
  const m: Record<CircularStatus, string> = {
    draft: "Draft",
    pending_hod: "Pending HOD",
    pending_principal: "Pending Principal",
    pending_placement_director: "Pending Placement Director",
    pending_event_coordinator: "Pending Event Coordinator",
    approved: "Approved",
    changes_requested: "Changes Requested",
    rejected: "Rejected",
  };
  return m[s];
}

export function statusCls(s: CircularStatus): string {
  if (s === "approved") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (s === "changes_requested") return "bg-orange-50 text-orange-700 border-orange-200";
  if (s === "rejected") return "bg-red-50 text-red-700 border-red-200";
  if (s === "draft") return "bg-gray-50 text-gray-600 border-gray-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

export function statusDot(s: CircularStatus): string {
  if (s === "approved") return "bg-emerald-500";
  if (s === "changes_requested") return "bg-orange-500";
  if (s === "rejected") return "bg-red-500";
  if (s === "draft") return "bg-gray-400";
  return "bg-amber-400";
}

// ── Priority helpers ────────────────────────────────────────
export function priorityCls(p: string): string {
  if (p === "very_urgent") return "bg-red-100 text-red-700";
  if (p === "urgent") return "bg-orange-100 text-orange-700";
  return "bg-blue-50 text-blue-600";
}

export function priorityLabel(p: string): string {
  if (p === "very_urgent") return "Very Urgent";
  if (p === "urgent") return "Urgent";
  return "Normal";
}

// ── Type helpers ────────────────────────────────────────────
export function typeLabel(t: CircularType): string {
  const m: Record<CircularType, string> = {
    departmental: "Departmental",
    inter_department: "Inter-Department",
    all_department: "All Department",
    placement: "Placement",
    examination: "Examination",
    event: "Event",
  };
  return m[t];
}

export function typeCls(t: CircularType): string {
  if (t === "placement") return "bg-purple-50 text-purple-700";
  if (t === "examination") return "bg-blue-50 text-blue-700";
  if (t === "all_department") return "bg-teal-50 text-teal-700";
  if (t === "inter_department") return "bg-sky-50 text-sky-700";
  if (t === "event") return "bg-pink-50 text-pink-700";
  return "bg-indigo-50 text-indigo-700";
}

// ── Date helpers ────────────────────────────────────────────
export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

// ── Role ↔ status maps ──────────────────────────────────────
const ROLE_TO_STATUS: Partial<Record<Role, CircularStatus>> = {
  hod:                  "pending_hod",
  principal:            "pending_principal",
  placement_director:   "pending_placement_director",
  event_coordinator:    "pending_event_coordinator",
};
const STATUS_TO_ROLE: Partial<Record<CircularStatus, Role>> = {
  pending_hod:                  "hod",
  pending_principal:            "principal",
  pending_placement_director:   "placement_director",
  pending_event_coordinator:    "event_coordinator",
};

// ── Access control ──────────────────────────────────────────
export function canAct(user: User, c: Circular): boolean {
  // HOD check: must match department
  if (user.role === "hod" && c.status === "pending_hod") {
    return c.department === user.department;
  }
  if (user.role === "principal"          && c.status === "pending_principal")           return true;
  if (user.role === "placement_director" && c.status === "pending_placement_director")  return true;
  if (user.role === "event_coordinator"  && c.status === "pending_event_coordinator")   return true;
  return false;
}

export function visibleTo(user: User, circulars: Circular[]): Circular[] {
  const inFlow = (c: Circular) => c.approvalFlow?.includes(user.role) ?? false;
  switch (user.role) {
    case "staff":
      return circulars.filter(c => c.createdById === user.id);
    case "hod":
      return circulars.filter(c =>
        c.department === user.department ||
        c.type === "all_department" ||
        c.type === "examination" ||
        inFlow(c)
      );
    case "principal":
      return circulars.filter(c => c.status !== "draft");
    case "placement_coordinator":
      return circulars.filter(c => c.type === "placement" || c.createdById === user.id);
    case "placement_director":
      return circulars.filter(c => c.type === "placement" || inFlow(c));
    case "event_coordinator":
      return circulars.filter(c =>
        c.type === "inter_department" || c.type === "event" || c.createdById === user.id || inFlow(c)
      );
    default:
      return circulars;
  }
}

// ── Workflow state machine ──────────────────────────────────

// Returns the next status after a successful approval
export function nextStatus(c: Circular): CircularStatus {
  // Custom flow: advance to next role in approvalFlow
  if (c.approvalFlow && c.approvalFlow.length > 0) {
    const currentRole = STATUS_TO_ROLE[c.status];
    if (currentRole) {
      const idx = c.approvalFlow.indexOf(currentRole);
      if (idx >= 0 && idx < c.approvalFlow.length - 1) {
        return ROLE_TO_STATUS[c.approvalFlow[idx + 1]] ?? "approved";
      }
    }
    return "approved";
  }

  // Legacy type-based flow
  const { type, status } = c;
  if (type === "departmental" || type === "examination" || type === "all_department") {
    if (status === "pending_hod") return "pending_principal";
    if (status === "pending_principal") return "approved";
  }
  if (type === "inter_department" || type === "event") {
    if (status === "pending_hod") return "pending_event_coordinator";
    if (status === "pending_event_coordinator") return "approved";
  }
  if (type === "placement") {
    if (status === "pending_placement_director") return "pending_principal";
    if (status === "pending_principal") return "approved";
  }
  return "approved";
}

// Returns the first pending status for a newly submitted circular
export function initStatus(type: CircularType, role: Role, approvalFlow?: Role[]): CircularStatus {
  // Custom flow: start with first approver
  if (approvalFlow && approvalFlow.length > 0) {
    return ROLE_TO_STATUS[approvalFlow[0]] ?? "approved";
  }

  if (type === "placement") return "pending_placement_director";
  if (type === "all_department" || type === "examination") {
    if (role === "hod" || role === "principal") return "pending_principal";
    return "pending_hod";
  }
  if (type === "inter_department" || type === "event") {
    if (role === "hod") return "pending_event_coordinator";
    return "pending_hod";
  }
  // departmental
  if (role === "hod") return "pending_principal";
  if (role === "principal") return "approved";
  return "pending_hod";
}

const ROLE_LABEL: Record<Role, string> = {
  hod: "HOD", principal: "Principal",
  placement_director: "Placement Director", event_coordinator: "Event Coordinator",
  staff: "Faculty", placement_coordinator: "Placement Coordinator",
};

// Returns the visual workflow steps for a circular
export function getWorkflowSteps(c: Circular, users: User[]): WorkflowStep[] {
  const hasSigned = (role: Role) =>
    c.signatures.some(s => {
      const u = users.find(u => u.id === s.userId);
      return u?.role === role;
    });

  // Custom flow
  if (c.approvalFlow && c.approvalFlow.length > 0) {
    return [
      { label: "Submitted", role: null, done: true },
      ...c.approvalFlow.map((role, i) => {
        const isLast = i === c.approvalFlow!.length - 1;
        return {
          label: ROLE_LABEL[role],
          role,
          done: hasSigned(role) || (isLast && c.status === "approved"),
        };
      }),
      { label: "Approved", role: null, done: c.status === "approved" },
    ];
  }

  // Legacy type-based steps
  if (c.type === "placement") {
    return [
      { label: "Submitted", role: null, done: true },
      { label: "Placement Director", role: "placement_director", done: hasSigned("placement_director") },
      { label: "Principal", role: "principal", done: hasSigned("principal") || c.status === "approved" },
      { label: "Approved", role: null, done: c.status === "approved" },
    ];
  }
  if (c.type === "inter_department" || c.type === "event") {
    return [
      { label: "Submitted", role: null, done: true },
      { label: "HOD", role: "hod", done: hasSigned("hod") },
      { label: "Event Coordinator", role: "event_coordinator", done: hasSigned("event_coordinator") || c.status === "approved" },
      { label: "Approved", role: null, done: c.status === "approved" },
    ];
  }
  if (c.type === "all_department" || c.type === "examination") {
    return [
      { label: "Submitted", role: null, done: true },
      { label: "Principal", role: "principal", done: hasSigned("principal") || c.status === "approved" },
      { label: "Approved", role: null, done: c.status === "approved" },
    ];
  }
  return [
    { label: "Submitted", role: null, done: true },
    { label: "HOD", role: "hod", done: hasSigned("hod") },
    { label: "Principal", role: "principal", done: hasSigned("principal") || c.status === "approved" },
    { label: "Approved", role: null, done: c.status === "approved" },
  ];
}
