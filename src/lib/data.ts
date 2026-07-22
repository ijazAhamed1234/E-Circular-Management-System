import type { User, Circular } from "./types";

export const COLLEGE_NAME = "Knowledge Institute of Technology";
export const COLLEGE_SHORT = "KIOT";
export const COLLEGE_ADDRESS = "Kakapalayam (Post), Salem – 637 504, Tamil Nadu";
export const COLLEGE_CONTACT = "Phone: 0427-2365555 | Email: info@kiot.ac.in | www.kiot.ac.in";
export const COLLEGE_AFFILIATION = "Approved by AICTE, New Delhi | Affiliated to Anna University, Chennai";

// ── Users ──────────────────────────────────────────────────
export const USERS: User[] = [
  {
    id: "u1", name: "Dr. Rajesh Kumar", designation: "Assistant Professor",
    email: "rajesh.kumar@kiot.ac.in", password: "staff123", role: "staff",
    department: "CSE", employeeId: "KIOT-CS-001",
  },
  {
    id: "u2", name: "Dr. Priya Sharma", designation: "Associate Professor",
    email: "priya.sharma@kiot.ac.in", password: "staff123", role: "staff",
    department: "IT", employeeId: "KIOT-IT-001",
  },
  {
    id: "u3", name: "Prof. Anil Mehta", designation: "Head of Department – CS",
    email: "hod.cs@kiot.ac.in", password: "hod123", role: "hod",
    department: "CSE", employeeId: "KIOT-HOD-CS",
  },
  {
    id: "u4", name: "Prof. Sunita Rao", designation: "Head of Department – IT",
    email: "hod.it@kiot.ac.in", password: "hod123", role: "hod",
    department: "IT", employeeId: "KIOT-HOD-IT",
  },
  {
    id: "u5", name: "Dr. V.K. Nair", designation: "Principal",
    email: "principal@kiot.ac.in", password: "principal123", role: "principal",
    department: "Administration", employeeId: "KIOT-PRIN",
  },
  {
    id: "u6", name: "Ms. Deepa Krishnan", designation: "Placement Coordinator",
    email: "placement.coord@kiot.ac.in", password: "place123", role: "placement_coordinator",
    department: "Placement Cell", employeeId: "KIOT-PLC-01",
  },
  {
    id: "u7", name: "Mr. Sanjay Patel", designation: "Director of Placements",
    email: "placement.dir@kiot.ac.in", password: "director123", role: "placement_director",
    department: "Placement Cell", employeeId: "KIOT-PLD-01",
  },
  {
    id: "u8", name: "Dr. Meena Iyer", designation: "Event Coordinator",
    email: "events@kiot.ac.in", password: "event123", role: "event_coordinator",
    department: "Administration", employeeId: "KIOT-EVT-01",
  },
];

// ── Sample Circulars ───────────────────────────────────────
export const INITIAL_CIRCULARS: Circular[] = [
  {
    id: "c1",
    refNo: "KIOT/CS/2024-25/001",
    title: "Internal Assessment Schedule – Odd Semester 2024-25",
    type: "departmental",
    department: "CSE",
    targetDepts: ["CSE"],
    subject: "Schedule for Internal Assessment Examinations – Odd Semester 2024-25",
    content:
      "This is to inform all students and faculty of the Computer Science Department that the Internal Assessment Examinations for the Odd Semester 2024-25 are scheduled as follows:\n\nTest 1: September 15–20, 2024\nTest 2: October 28 – November 2, 2024\n\nAll faculty members are requested to prepare question papers as per the prescribed syllabus and submit them to the Department Office at least 3 days prior to the examination date.\n\nStudents must maintain a minimum of 75% attendance to be eligible for the examination.\n\nMake-up examinations will be conducted only with prior approval from the Head of Department.",
    createdById: "u1",
    createdByName: "Dr. Rajesh Kumar",
    createdByRole: "staff",
    createdAt: "2024-08-15T10:30:00",
    status: "pending_principal",
    priority: "normal",
    signatures: [
      {
        userId: "u3", userName: "Prof. Anil Mehta",
        designation: "Head of Department – CS", department: "CSE",
        signedAt: "2024-08-16T14:20:00",
      },
    ],
    comments: [
      {
        id: "cc1", authorId: "u1", authorName: "Dr. Rajesh Kumar",
        designation: "Assistant Professor",
        message: "Submitted for HOD approval. Please review the examination schedule.",
        timestamp: "2024-08-15T10:30:00", type: "submitted",
      },
      {
        id: "cc2", authorId: "u3", authorName: "Prof. Anil Mehta",
        designation: "Head of Department – CS",
        message: "Reviewed and approved. Forwarding to Principal for final approval.",
        timestamp: "2024-08-16T14:20:00", type: "approval",
      },
    ],
    attachments: ["IA_Schedule_CS_2024.pdf"],
  },
  {
    id: "c2",
    refNo: "KIOT/PLC/2024-25/007",
    title: "Campus Recruitment Drive – Infosys Technologies Ltd.",
    type: "placement",
    department: "Placement Cell",
    targetDepts: ["CSE", "IT", "ECE"],
    subject: "Campus Recruitment Drive by Infosys Technologies – Registration & Eligibility Details",
    content:
      "This circular is to inform all eligible students about the upcoming Campus Recruitment Drive by Infosys Technologies Ltd.\n\nEligibility Criteria:\n• B.E/B.Tech (CS, IT, ECE) – 2024 Pass-out batch\n• Minimum 60% aggregate in all semesters\n• No active backlogs at time of registration\n\nDrive Schedule:\nDate: September 5, 2024 | Time: 9:00 AM onwards\nVenue: KIOT Main Auditorium, Block A\n\nSelection Process: Aptitude Test → Technical Interview → HR Interview\n\nPackage Offered: ₹3.6 LPA (Fixed + Variable)\n\nRegistration: Students must register on the Placement Portal by September 1, 2024.\n\nAll shortlisted students must carry 5 copies of updated resume, all academic mark sheets, and a valid government-issued ID proof.",
    createdById: "u6",
    createdByName: "Ms. Deepa Krishnan",
    createdByRole: "placement_coordinator",
    createdAt: "2024-08-10T09:00:00",
    status: "approved",
    priority: "urgent",
    signatures: [
      {
        userId: "u7", userName: "Mr. Sanjay Patel",
        designation: "Director of Placements", department: "Placement Cell",
        signedAt: "2024-08-11T10:00:00",
      },
      {
        userId: "u5", userName: "Dr. V.K. Nair",
        designation: "Principal", department: "Administration",
        signedAt: "2024-08-12T11:00:00",
      },
    ],
    comments: [
      {
        id: "cd1", authorId: "u6", authorName: "Ms. Deepa Krishnan",
        designation: "Placement Coordinator",
        message: "Submitted for Placement Director approval. Drive confirmed with Infosys HR team.",
        timestamp: "2024-08-10T09:00:00", type: "submitted",
      },
      {
        id: "cd2", authorId: "u7", authorName: "Mr. Sanjay Patel",
        designation: "Director of Placements",
        message: "Approved. Forwarding to Principal for final sign-off.",
        timestamp: "2024-08-11T10:00:00", type: "approval",
      },
      {
        id: "cd3", authorId: "u5", authorName: "Dr. V.K. Nair",
        designation: "Principal",
        message: "Approved. Ensure proper arrangements are made for the drive day.",
        timestamp: "2024-08-12T11:00:00", type: "approval",
      },
    ],
    attachments: ["Infosys_JD_2024.pdf", "Eligibility_Criteria.pdf"],
  },
  {
    id: "c3",
    refNo: "KIOT/EVT/2024-25/012",
    title: "Inter-Department Technical Symposium – TECH VISTA 2024",
    type: "inter_department",
    department: "CSE",
    targetDepts: ["CSE", "IT", "ECE", "MECH", "CIVIL"],
    subject: "Inter-Department Technical Symposium TECH VISTA 2024 – Event Guidelines and Participation Details",
    content:
      "The Computer Science Department is organising the Inter-Department Technical Symposium TECH VISTA 2024 on October 18, 2024.\n\nAll departments are invited to participate in the following events:\n\nTechnical Events:\n• Paper Presentation\n• Project Expo\n• Coding Challenge (C, C++, Java, Python)\n• Quiz Competition\n\nNon-Technical Events:\n• Debugging Contest\n• Best Manager\n• Group Discussion\n\nRegistration: Each department may register a maximum of 15 students. Registration deadline: October 10, 2024.\n\nPrize Money:\n1st Prize: ₹5,000 | 2nd Prize: ₹3,000 | 3rd Prize: ₹2,000\n\nAll department HODs are requested to encourage maximum student participation.",
    createdById: "u1",
    createdByName: "Dr. Rajesh Kumar",
    createdByRole: "staff",
    createdAt: "2024-08-18T11:00:00",
    status: "pending_hod",
    priority: "normal",
    signatures: [],
    comments: [
      {
        id: "ce1", authorId: "u1", authorName: "Dr. Rajesh Kumar",
        designation: "Assistant Professor",
        message: "Submitted for HOD review. This is an inter-department symposium circular.",
        timestamp: "2024-08-18T11:00:00", type: "submitted",
      },
    ],
    attachments: ["TECH_VISTA_2024_Brochure.pdf"],
  },
  {
    id: "c4",
    refNo: "KIOT/IT/2024-25/005",
    title: "Computer Lab Upgrade – Temporary Access Restriction Notice",
    type: "departmental",
    department: "IT",
    targetDepts: ["IT"],
    subject: "Temporary Restriction on Access to Computer Labs 301 & 302 during Infrastructure Upgrade",
    content:
      "This is to inform all students and faculty of the IT Department that Computer Labs 301 and 302 will be temporarily closed for infrastructure upgrade from September 10 to September 17, 2024.\n\nDuring this period:\n• All practical classes in Labs 301 & 302 will be relocated to Lab 305\n• Faculty must coordinate with the Lab In-charge (Mr. R. Venkat, Ext. 204) for time slot allocation\n• Students must carry their college ID card for access to alternate lab\n\nNew Equipment being installed:\n• 40 new Dell Workstations (Intel i7, 16GB RAM, 512GB SSD)\n• Upgraded networking infrastructure (1 Gbps fibre)\n• Air conditioning systems upgrade\n\nFor queries, contact the IT Department Office.",
    createdById: "u2",
    createdByName: "Dr. Priya Sharma",
    createdByRole: "staff",
    createdAt: "2024-08-20T09:30:00",
    status: "changes_requested",
    priority: "urgent",
    signatures: [],
    comments: [
      {
        id: "cf1", authorId: "u2", authorName: "Dr. Priya Sharma",
        designation: "Associate Professor",
        message: "Submitted for HOD approval.",
        timestamp: "2024-08-20T09:30:00", type: "submitted",
      },
      {
        id: "cf2", authorId: "u4", authorName: "Prof. Sunita Rao",
        designation: "Head of Department – IT",
        message: "Please include a complete batch-wise schedule for makeup practical sessions and the alternate lab booking confirmation. The circular must be more specific about which batches are affected on which days.",
        timestamp: "2024-08-21T10:15:00", type: "changes_requested",
      },
    ],
    attachments: [],
  },
  {
    id: "c5",
    refNo: "KIOT/EXAM/2024-25/015",
    title: "Hall Ticket Distribution – November 2024 University Examination",
    type: "examination",
    department: "Administration",
    targetDepts: ["CSE", "IT", "ECE", "MECH", "CIVIL"],
    subject: "Distribution of Hall Tickets for November 2024 Anna University End-Semester Examination",
    content:
      "All students appearing for the November 2024 University Examination are hereby informed that Hall Tickets will be distributed as per the following schedule:\n\nB.E. / B.Tech Final Year (VIII Semester): October 25, 2024\nB.E. / B.Tech Third Year (VI Semester): October 26, 2024\nB.E. / B.Tech Second Year (IV Semester): October 27, 2024\nB.E. / B.Tech First Year (II Semester): October 28, 2024\n\nConditions for Receiving Hall Ticket:\n1. Minimum 75% attendance in all subjects\n2. All fee dues must be cleared with the Accounts Office\n3. Original college ID card must be produced at the time of collection\n\nStudents with attendance shortage must submit a petition with supporting documents to their respective departments before October 22, 2024.\n\nAll HoDs must submit the attendance consolidation report to the Examination Cell by October 20, 2024.",
    createdById: "u3",
    createdByName: "Prof. Anil Mehta",
    createdByRole: "hod",
    createdAt: "2024-08-22T14:00:00",
    status: "pending_principal",
    priority: "very_urgent",
    signatures: [],
    comments: [
      {
        id: "cg1", authorId: "u3", authorName: "Prof. Anil Mehta",
        designation: "Head of Department – CS",
        message: "Submitted for Principal approval. This is a time-sensitive examination circular requiring urgent attention.",
        timestamp: "2024-08-22T14:00:00", type: "submitted",
      },
    ],
    attachments: ["Exam_Schedule_Nov2024.pdf"],
  },
  {
    id: "c6",
    refNo: "KIOT/EVT/2024-25/018",
    title: "Annual Cultural Day – KALAITHIRUNAL 2024",
    type: "event",
    department: "Administration",
    targetDepts: ["CSE", "IT", "ECE", "MECH", "CIVIL"],
    subject: "Annual Cultural Day KALAITHIRUNAL 2024 – Programme Schedule and Participation Guidelines",
    content:
      "The Annual Cultural Day KALAITHIRUNAL 2024 is scheduled for November 15, 2024 at the KIT Open Auditorium.\n\nEvents:\n• Classical Dance (Solo & Group)\n• Western Dance (Solo & Group)\n• Singing (Classical, Light Music, Western)\n• Skit & Drama\n• Face Painting & Rangoli\n• Best Costume\n\nRegistration: Each department can send a maximum of 20 participants across all events. Registration deadline: November 5, 2024 to the Cultural Secretary.\n\nPrizes will be awarded for the Best Participating Department.\n\nAll faculty members are requested to motivate and support student participation.",
    createdById: "u8",
    createdByName: "Dr. Meena Iyer",
    createdByRole: "event_coordinator",
    createdAt: "2024-08-25T10:00:00",
    status: "pending_hod",
    priority: "normal",
    signatures: [],
    comments: [
      {
        id: "ch1", authorId: "u8", authorName: "Dr. Meena Iyer",
        designation: "Event Coordinator",
        message: "Cultural day circular submitted for HOD review before final approval.",
        timestamp: "2024-08-25T10:00:00", type: "submitted",
      },
    ],
    attachments: [],
  },
];
