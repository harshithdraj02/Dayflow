# Dayflow HRMS - Human Resource Management System

**Dayflow** is a modern, lightweight, full-stack Human Resource Management System (HRMS) developed for the **Odoo x NMIT Hackathon**. It features a premium, responsive dark-themed user interface, role-based access control, real-time daily session attendance logs, time-off requests featuring automatic weekend exclusion, dynamically computed salary components (Indian tax breakdown), and interactive real-time analytics graphs.

## 🚀 Features

### 1. 🔐 Secure Role-Based Authentication
* Login using **Email Address** or **Employee ID**.
* Restricts access to standard employees versus HR Officer / Admin managers.
* Encrypted password hashing with `bcryptjs`.

### 2. 🟢 Attendance Management
* Real-time Check-In / Check-Out global status dot indicator.
* Automatic working hours calculation and **extra overtime hours** tracking based on an 8-hour workday standard.
* Monthly attendance grid logging status for employee (Present, Absent, Leave, or Half-day).
* Administrative daily log tracker table with dynamic date sorting.

### 3. ✈️ Leave / Time Off Module
* Live leave balances (Paid Time Off, Sick Leaves, Unpaid) with visual progress gauges.
* Interactive leave request submission (dates selection automatically **ignores weekends**).
* Overlap checks to prevent multiple requests for the same date ranges.
* Admin panel with custom comment feeds for approving/refusing leaves.
* Built-in listed Public Holidays for the year.

### 4. 💼 Salary / Payroll calculations (Standard Formulations)
* Detailed components computed dynamically from the gross monthly input:
  * **Basic Salary**: 50% of monthly gross
  * **HRA**: 50% of Basic
  * **Standard Allowance**: 16.67% of Basic
  * **Performance Bonus**: 8.33% of Basic
  * **LTA (Leave Travel Allowance)**: 8.33% of Basic
  * **Fixed Allowance**: Remainder of gross monthly budget
  * **Employee PF contribution**: 12% of Basic
  * **Employer PF contribution**: 12% of Basic (matching)
  * **Professional Tax**: Fixed ₹200
  * **Take Home Net Salary**: Gross - Employee PF - Professional Tax
* Interactive sliders/inputs for administrative salary changes.

### 5. 📊 Visual HR Analytics (Dynamic Recharts)
* Live presence rates and employee headcount metrics.
* Weekly attendance trends (excluding weekends) presenting bar aggregations.
* Pie charts breaking down staff member size by departments.
* Department payroll budget shares with progress indicators.

---

## 🏗️ Project Architecture
```text
dayflow-hrms/
├── package.json              # Main root launcher scripts
├── .gitignore                # Rule declarations excluding builds/nodes
├── client/                   # Vite + React (Frontend SPA)
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── context/          # Auth Context providers
│       ├── utils/            # Axios / Fetch API wrappers
│       ├── components/       # Layout layouts, popovers
│       └── pages/            # Dashboard, Attendance, Leave, Payroll, Analytics
└── server/                   # Express + Better-SQLite3 (Backend REST APIs)
    ├── server.js             # API Gateway handler
    ├── db/
    │   ├── database.js       # SQLite database initialization
    │   └── seed.js           # Populates demo users and 30-day attendance history
    └── routes/               # Modular controller endpoints (Auth, Leave, Payroll etc.)
```

---

## ⚡ How to Setup and Run Locally

Ensure you have [Node.js](https://nodejs.org/) installed, then follow these steps:

### 1. Install all dependencies
```powershell
npm run install:all
```

### 2. Seed the database
This automatically compiles the SQLite base schema and populates it with 1 Admin user, 8 demo employee accounts with complete 30-day historical logs, leaves, and certifications.
```powershell
npm run seed
```

### 3. Run the Backend API Server
```powershell
npm run server
```

### 4. Run the Client (Vite Dev Server)
In a new terminal window:
```powershell
npm run client
```

Open your browser to `http://localhost:5173/` to view the application!

### 👤 Demo Access Credentials
* **Admin / HR Officer:**
  * **Email:** `priya.sharma@dayflow.com`
  * **Password:** `Admin@123`
* **Regular Employee:**
  * **Email:** `arjun.patel@dayflow.com`
  * **Password:** `Employee@123`
