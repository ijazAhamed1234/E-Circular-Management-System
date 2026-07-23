# Backend Endpoint Specifications

This document outlines the API endpoints required to transition the **E-Circular Management System** from a mock, client-side data state to a fully functional client-server architecture.

---

## 1. Data Models & Typings (Reference)

Ensure your database tables/documents align with these types from the frontend schema:

### `Role`
```typescript
type Role = "staff" | "hod" | "principal" | "placement_coordinator" | "placement_director" | "event_coordinator";
```

### `Dept`
```typescript
type Dept = "CSE" | "ECE" | "IT" | "AIDS" | "ECX" | "EEE" | "MECH" | "CIVIL" | "Administration" | "Placement Cell";
```

### `CircularStatus`
```typescript
type CircularStatus = "draft" | "pending_hod" | "pending_principal" | "pending_placement_director" | "pending_event_coordinator" | "approved" | "changes_requested" | "rejected";
```

---

## 2. Authentication Endpoints

### 🔑 User Login
* **Endpoint**: `POST /api/auth/login`
* **Functionality**: Authenticates a user using email and password. Generates a secure session token (JWT or cookie-based).
* **Input Body (`Content-Type: application/json`)**:
  ```json
  {
    "email": "user@kiot.ac.in",
    "password": "user_password_here"
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": "u1",
      "name": "Dr. Rajesh Kumar",
      "designation": "Assistant Professor",
      "email": "rajesh.kumar@kiot.ac.in",
      "role": "staff",
      "department": "CSE",
      "employeeId": "KIOT-CS-001"
    }
  }
  ```
* **Error Response (`401 Unauthorized`)**:
  ```json
  { "error": "Invalid email or password" }
  ```

### 🚪 User Logout
* **Endpoint**: `POST /api/auth/logout`
* **Functionality**: Invalidates the current user session/cookie.
* **Input**: None (Uses authentication header/cookies)
* **Success Response (`200 OK`)**:
  ```json
  { "success": true, "message": "Logged out successfully" }
  ```

---

## 3. Users API

### 👤 Get Current User
* **Endpoint**: `GET /api/users/me`
* **Headers**: `Authorization: Bearer <token>`
* **Functionality**: Retrieves current logged-in user context.
* **Success Response (`200 OK`)**:
  ```json
  {
    "id": "u1",
    "name": "Dr. Rajesh Kumar",
    "designation": "Assistant Professor",
    "email": "rajesh.kumar@kiot.ac.in",
    "role": "staff",
    "department": "CSE",
    "employeeId": "KIOT-CS-001"
  }
  ```

---

## 4. Circulars API

### 📋 Get All Circulars (With Filtering)
* **Endpoint**: `GET /api/circulars`
* **Headers**: `Authorization: Bearer <token>`
* **Functionality**: Retrieves all circulars filtered by user roles, department access, and search parameters.
* **Query Parameters** (Optional):
  * `status`: Filter by circular status (e.g. `approved`, `pending_hod`)
  * `department`: Filter by creating department
  * `type`: Filter by circular type (`departmental`, `placement`, etc.)
* **Success Response (`200 OK`)**:
  ```json
  [
    {
      "id": "c1",
      "refNo": "KIOT/CS/2024-25/001",
      "title": "Internal Assessment Schedule",
      "type": "departmental",
      "department": "CSE",
      "targetDepts": ["CSE"],
      "subject": "Schedule for Internal Assessment Examinations",
      "content": "Full text details...",
      "createdById": "u1",
      "createdByName": "Dr. Rajesh Kumar",
      "createdByRole": "staff",
      "createdAt": "2024-08-15T10:30:00Z",
      "status": "pending_principal",
      "priority": "normal",
      "attachments": ["IA_Schedule_CS_2024.pdf"]
    }
  ]
  ```

### 🔍 Get Circular by ID
* **Endpoint**: `GET /api/circulars/:id`
* **Headers**: `Authorization: Bearer <token>`
* **Functionality**: Returns details of a specific circular, including all comments, approval workflow history, and digital signatures.
* **Success Response (`200 OK`)**:
  ```json
  {
    "id": "c1",
    "refNo": "KIOT/CS/2024-25/001",
    "title": "Internal Assessment Schedule",
    "type": "departmental",
    "department": "CSE",
    "targetDepts": ["CSE"],
    "subject": "Schedule for Internal Assessment Examinations",
    "content": "Full text details...",
    "createdById": "u1",
    "createdByName": "Dr. Rajesh Kumar",
    "createdByRole": "staff",
    "createdAt": "2024-08-15T10:30:00Z",
    "status": "pending_principal",
    "priority": "normal",
    "signatures": [
      {
        "userId": "u3",
        "userName": "Prof. Anil Mehta",
        "designation": "Head of Department – CS",
        "department": "CSE",
        "signedAt": "2024-08-16T14:20:00Z"
      }
    ],
    "comments": [
      {
        "id": "cc1",
        "authorId": "u1",
        "authorName": "Dr. Rajesh Kumar",
        "designation": "Assistant Professor",
        "message": "Submitted for HOD approval.",
        "timestamp": "2024-08-15T10:30:00Z",
        "type": "submitted"
      }
    ],
    "attachments": ["IA_Schedule_CS_2024.pdf"]
  }
  ```

### ➕ Create Circular
* **Endpoint**: `POST /api/circulars`
* **Headers**: `Authorization: Bearer <token>`
* **Functionality**: Submits a new circular. The backend computes the initial status based on the circular type (refer to the workflow comments in `types.ts`).
* **Input Body (`Content-Type: application/json`)**:
  ```json
  {
    "title": "Placement Drive",
    "type": "placement",
    "targetDepts": ["CSE", "IT"],
    "subject": "Infosys Recruitment",
    "content": "Recruitment details...",
    "priority": "urgent",
    "attachments": ["job_description.pdf"]
  }
  ```
* **Success Response (`201 Created`)**:
  ```json
  {
    "id": "c_new_id_123",
    "refNo": "KIOT/PLC/2026-27/001",
    "status": "pending_placement_director",
    "createdAt": "2026-07-23T11:10:00Z"
    // ...other properties populated by backend
  }
  ```

### ✏️ Update Circular
* **Endpoint**: `PUT /api/circulars/:id`
* **Headers**: `Authorization: Bearer <token>`
* **Functionality**: Updates draft/changes-requested circular information.
* **Input Body**: Partially or fully updated `Circular` attributes.
* **Success Response (`200 OK`)**: Updated Circular entity.

---

## 5. Workflow & Signature Actions

### ✍️ Process Workflow Action (Approve / Reject / Changes Requested)
* **Endpoint**: `POST /api/circulars/:id/action`
* **Headers**: `Authorization: Bearer <token>`
* **Functionality**: Updates circular status, appends signature (if approved), and generates activity logs automatically based on the user's role and action.
* **Input Body (`Content-Type: application/json`)**:
  ```json
  {
    "action": "approve" | "changes_requested" | "reject",
    "comment": "Looks good. Forwarding for final approval." // Optional/Required for requests/rejections
  }
  ```
* **Workflow Transitions (Triggered automatically by Backend)**:
  * If **"approve"**:
    * Departmental: `pending_hod` ➡️ `pending_principal` ➡️ `approved`
    * Inter-Departmental: `pending_hod` ➡️ `pending_event_coordinator` ➡️ `approved`
    * Placement: `pending_placement_director` ➡️ `pending_principal` ➡️ `approved`
    * All-Department / Exam: `pending_principal` ➡️ `approved`
  * If **"changes_requested"**:
    * Changes status to `changes_requested`.
  * If **"reject"**:
    * Changes status to `rejected`.
* **Success Response (`200 OK`)**:
  ```json
  {
    "id": "c1",
    "status": "approved",
    "signatures": [
      // ...updated list including the new signature
    ],
    "comments": [
      // ...updated comments showing the action record
    ]
  }
  ```

---

## 6. File Uploads API

### 📎 Upload Attachment
* **Endpoint**: `POST /api/upload`
* **Headers**: `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
* **Functionality**: Uploads a document/file attachment.
* **Multipart Payload**: Key `file` containing binary file data.
* **Success Response (`201 Created`)**:
  ```json
  {
    "filename": "job_description_17112345.pdf",
    "url": "/uploads/job_description_17112345.pdf"
  }
  ```
