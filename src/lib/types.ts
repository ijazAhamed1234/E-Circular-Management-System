export type Role =
  | "staff"
  | "hod"
  | "principal"
  | "placement_coordinator"
  | "placement_director"
  | "event_coordinator";

export type Dept =
  | "CSE"
  | "ECE"
  | "IT"
  | "AIDS"
  | "ECX"
  | "EEE"
  | "MECH"
  | "CIVIL"
  | "Administration"
  | "Placement Cell";

export type CircularType =
  | "departmental"
  | "inter_department"
  | "all_department"
  | "placement"
  | "examination"
  | "event";

// Workflow per type:
// departmental       : pending_hod → pending_principal → approved
// inter_department   : pending_hod → pending_event_coordinator → approved
// event              : pending_hod → pending_event_coordinator → approved
// placement          : pending_placement_director → pending_principal → approved
// all_department     : pending_principal → approved
// examination        : pending_principal → approved

export type CircularStatus =
  | "draft"
  | "pending_hod"
  | "pending_principal"
  | "pending_placement_director"
  | "pending_event_coordinator"
  | "approved"
  | "changes_requested"
  | "rejected";

export type Page =
  | "dashboard"
  | "circulars"
  | "create"
  | "detail"
  | "notifications";

export interface User {
  id: string;
  name: string;
  designation: string;
  email: string;
  password: string;
  role: Role;
  department: Dept;
  employeeId: string;
}

export interface Sig {
  userId: string;
  userName: string;
  designation: string;
  department: Dept;
  signedAt: string;
}

export interface ActivityComment {
  id: string;
  authorId: string;
  authorName: string;
  designation: string;
  message: string;
  timestamp: string;
  type: "submitted" | "approval" | "changes_requested" | "rejected" | "resubmitted";
}

export interface Circular {
  id: string;
  refNo: string;
  title: string;
  type: CircularType;
  department: Dept;
  targetDepts: Dept[];
  targetUsers?: string[];
  subject: string;
  content: string;
  contentHtml?: string;
  approvalFlow?: Role[];   // ordered list of approver roles chosen at creation
  createdById: string;
  createdByName: string;
  createdByRole: Role;
  createdAt: string;
  status: CircularStatus;
  priority: "normal" | "urgent" | "very_urgent";
  signatures: Sig[];
  comments: ActivityComment[];
  attachments: string[];
}

export interface WorkflowStep {
  label: string;
  role: Role | null;
  done: boolean;
}
