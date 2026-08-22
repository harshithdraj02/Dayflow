# Dayflow HRMS - Problem Statement & Excalidraw Checklist

This checklist tracks already-implemented features alongside the outstanding requirements directly derived from the original project specification and Excalidraw wireframes.

---

## ✅ 1. Completed Implementations (Validated)

### 🏢 Multi-Tenant Company Onboarding
*   [x] **Register Company UI & Route**: Custom brand onboarding page at `/register-company` linked from the LoginPage.
*   [x] **Custom Header Logos**: Dynamically fetches and binds company brand text and logo URLs in the main template header (`Layout.jsx`).
*   [x] **Isolation Rules**: Enforces SQL matching on `company_id` for database records (attendance, leaves, payroll) to isolate tenant databases.

### 📁 Leave Applications & Medical Attachments
*   [x] **Medical Proof Uploads**: Integrated local asset uploading (`multer`) into `server/uploads/leaves`.
*   [x] **Dynamic Modal validation**: Requires file attachments only for `sick` leave types in `LeavePage.jsx`.
*   [x] **Admin Verification Link**: Renders clickable `[View]` certificate attachments securely inside the Admin leaves table.

### 💰 Salary & Loss-of-Pay (LOP) Deductions
*   [x] **Dynamic LOP calculations**: Tracks current month's approved unpaid leave days and deducts from basic compensation at a **1.25x penalty multiplier** rate.
*   [x] **Employee Portrait Payslip**: Read-only print sheets rendered inside the employee-visible Profile.
*   [x] **Standard Corporate print layout**: CSS `@media print` rules hide sidebars, headers, and dashboard widgets when requesting print/PDF.

### ⚙️ Leave Allocation Adjustments
*   [x] **Quotas Adjustment Board**: List grid of staff leave balances under leave management with live quota updating.
*   [x] **Quota Safety Checks**: Warns and blocks admins if they adjust a total below already taken leave counts.

### 🔔 Notifications System
*   [x] **Navigation bell and panel drawer**: Renders alert list with status styling.
*   [x] **Background Polling**: Frontend fetches dynamic warning/success alerts from backend every 20 seconds.

### 🚪 Employee Account Offboarding
*   [x] **Backend Offboard Endpoint**: Added `DELETE /api/employees/:id` (Admin only) to safely offboard employees.
    *   *Constraint*: Utilizes the database constraints mapping `ON DELETE CASCADE` to discard associated skills, certifications, leaves, attendance, and salary profiles.
    *   *Safety Guard*: Throws `403 Forbidden` if an Admin attempts to delete their own account.
*   [x] **Offboard UI Button**: Added red **"Delete Employee Account"** button in `ProfilePage.jsx` sidebar (restricted to Admins, hidden for self-account). Prompts for confirmation box, calls API, and redirects to directory `/`.

### 📜 Certification Deletion (Completing CRUD)
*   [x] **Backend Route**: Added `DELETE /api/employees/:id/certifications/:certId` in `server/routes/employees.js`.
    *   *Access*: Owner employee (`req.user.id === id`) or Admin.
*   [x] **Resume UI deletion**: Added remove `X` icon button over certifications in the resume section of `ProfilePage.jsx` when edit permissions (`canEdit`) are allowed, mirroring skills.

### 📅 Weekend & Overlap Leave Guardrails
*   [x] **0-Day Working Range Block**: Added validation rules to reject leave submissions when computed working days count is `0` (e.g. range spans only Saturday and Sunday).
*   [x] **Future Date Validation**: Guards against applying for leave dates that have already passed, except for retrospectively logging Sick Leave.
