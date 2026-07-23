import type { User, Circular } from "./types";

export const COLLEGE_NAME = "Knowledge Institute of Technology";
export const COLLEGE_SHORT = "KIOT";
export const COLLEGE_ADDRESS = "Kakapalayam (Post), Salem – 637 504, Tamil Nadu";
export const COLLEGE_CONTACT = "Phone: 0427-2365555 | Email: info@kiot.ac.in | www.kiot.ac.in";
export const COLLEGE_AFFILIATION = "Approved by AICTE, New Delhi | Affiliated to Anna University, Chennai";

// ── Users ──────────────────────────────────────────────────
export const USERS: User[] = [
  { id: "u1", name: "CSE Faculty", designation: "Assistant Professor", email: "facultycse@kiot.ac.in", password: "faculty@123", role: "staff", department: "CSE", employeeId: "KIOT-CSE-F01" },
  { id: "u2", name: "CSE HOD", designation: "Head of Department – CSE", email: "hodcse@kiot.ac.in", password: "faculty@123", role: "hod", department: "CSE", employeeId: "KIOT-CSE-H01" },
  { id: "u3", name: "CSE Placement Director", designation: "Placement Director – CSE", email: "placementdirectorcse@kiot.ac.in", password: "faculty@123", role: "placement_director", department: "CSE", employeeId: "KIOT-CSE-P01" },
  { id: "u4", name: "ECE Faculty", designation: "Assistant Professor", email: "facultyece@kiot.ac.in", password: "faculty@123", role: "staff", department: "ECE", employeeId: "KIOT-ECE-F01" },
  { id: "u5", name: "ECE HOD", designation: "Head of Department – ECE", email: "hodece@kiot.ac.in", password: "faculty@123", role: "hod", department: "ECE", employeeId: "KIOT-ECE-H01" },
  { id: "u6", name: "ECE Placement Director", designation: "Placement Director – ECE", email: "placementdirectorece@kiot.ac.in", password: "faculty@123", role: "placement_director", department: "ECE", employeeId: "KIOT-ECE-P01" },
  { id: "u7", name: "Principal", designation: "Principal", email: "principal@kiot.ac.in", password: "faculty@123", role: "principal", department: "Administration", employeeId: "KIOT-PRIN" },
  { id: "u8", name: "Training Coordinator", designation: "Training & Placement Coordinator", email: "trainingcoordinator@kiot.ac.in", password: "faculty@123", role: "training_coordinator", department: "Administration", employeeId: "KIOT-TC-01" },
];

