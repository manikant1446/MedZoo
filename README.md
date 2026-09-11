<div align="center">
  <img src="./frontend/public/favicon.svg" alt="MedZoo Logo" width="100" />

  <h1>MedZoo</h1>

  <p><strong>Trust-Network Healthcare Platform — Connecting Patients with Trusted Doctors</strong></p>

  <p>
    <a href="https://medzoo.vercel.app"><img src="https://img.shields.io/badge/🌐_Live-medzoo.vercel.app-00C853?style=for-the-badge" alt="Live" /></a>
    <img src="https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge" alt="Status" />
    <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License" />
  </p>

  <p>
    <img src="https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Vite_8-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/Express_5-000000?style=flat-square&logo=express&logoColor=white" alt="Express" />
    <img src="https://img.shields.io/badge/MySQL_8-4479A1?style=flat-square&logo=mysql&logoColor=white" alt="MySQL" />
    <img src="https://img.shields.io/badge/Socket.IO-010101?style=flat-square&logo=socketdotio&logoColor=white" alt="Socket.IO" />
    <img src="https://img.shields.io/badge/Chart.js-FF6384?style=flat-square&logo=chartdotjs&logoColor=white" alt="Chart.js" />
    <img src="https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel" />
  </p>
</div>

<br />

## 📋 Table of Contents

- [Overview](#-overview)
- [Live Demo](#-live-demo)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Database Schema](#-database-schema)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🔭 Overview

MedZoo is a full-stack healthcare platform built around a **social trust network** model. Instead of blindly choosing doctors from a directory, patients discover trusted doctors through their existing contacts — people they already know and trust who were successfully treated. This creates a decentralized recommendation engine powered by real relationships.

The platform serves three distinct user roles — **Patients**, **Doctors**, and **Clinic Staff** — each with tailored dashboards, workflows, and permissions.

---

## 🌐 Live Demo

| Environment | URL |
|:---|:---|
| **Production** | **[https://medzoo.vercel.app](https://medzoo.vercel.app)** |
| Frontend | Served via Vercel Static Hosting |
| Backend API | Served via Vercel Serverless Functions |
| Database | Aiven Cloud MySQL 8.4 |

---

## ✨ Features

### 👨‍⚕️ Doctor Portal

| Feature | Description |
|:---|:---|
| **📊 Analytics Dashboard** | Real-time visual analytics with interactive charts — patient trends over time, disease category distributions (pie chart), peak consultation hours (bar chart), and key metrics (total patients, consultations, appointments, average rating). Powered by Chart.js. |
| **📅 Appointment Manager** | Full appointment lifecycle management: approve, reject, start, complete, or escalate appointments to **Critical** status (with flashing visual indicators). Supports filtering by status, date search, and real-time status updates via WebSocket. |
| **📋 Consultation Tracking** | Create detailed consultations with diagnosis, category, prescriptions (medicine + dosage + duration), and clinical notes. Auto-registers unregistered patients by phone number. Supports marking consultations as pending, treated, referred, or follow-up. |
| **💊 Prescription Management** | Multi-medicine prescription builder attached to each consultation. Records medicine name, dosage instructions, and treatment duration. |
| **🤝 Case Referrals** | Refer patients to specialist doctors with priority tagging (low / medium / high / critical). Lookup referral targets by phone or email. Track referral status through pending → accepted → completed workflow. |
| **📄 PDF Export** | One-click export of complete patient consultation history into professionally formatted PDF reports using jsPDF + AutoTable. |
| **👥 Patient Records** | Searchable patient directory with complete medical history, consultation timeline, and appointment records per patient. |
| **🏥 Staff Management** | Invite clinic staff via secure token-based invitation links. Staff can manage appointments on behalf of the doctor. Role delegation with `doctor_staff` relationship tracking. |
| **🔔 Real-Time Notifications** | WebSocket-powered live notifications for new appointments, referrals, and status changes. Notification center with read/unread tracking and batch operations. |

### 🧑‍🤝‍🧑 Patient Portal

| Feature | Description |
|:---|:---|
| **🔍 Trust-Based Doctor Discovery** | Core differentiator — patients discover doctors through their contact network. Syncs phonebook contacts to find which doctors treated people the patient already knows and trusts. Ranked by trust score and treatment outcomes. |
| **📱 Contact Sync** | Permission-based contact synchronization that maps phone contacts to registered MedZoo users. Creates a trust graph used for doctor recommendations. Includes granular permission flow (prompt → granted → denied). |
| **🗓️ Appointment Booking** | Browse available doctors, view dynamic 30-minute time slots based on doctor availability, and book appointments instantly. Supports emergency flagging and appointment notes. |
| **🩺 Medical Dashboard** | Personalized health dashboard showing upcoming appointments, past consultations with diagnoses, treatment history, and doctor ratings. |
| **⭐ Doctor Ratings** | Rate doctors after completed consultations. Ratings aggregate into the doctor's overall score visible across the platform. |

### 🔐 Authentication & Security

| Feature | Description |
|:---|:---|
| **JWT Authentication** | Stateless token-based auth with bcrypt password hashing. Tokens persist across sessions via `localStorage`. |
| **Role-Based Access Control** | Three distinct roles (`patient`, `doctor`, `staff`) with route-level and component-level access guards. Staff inherits appointment permissions from their assigned doctor. |
| **Invitation-Only Registration** | Doctors and staff register exclusively through secure, time-limited invitation tokens. Patients can self-register. |
| **Password Recovery** | OTP-based forgot-password flow for account recovery. |
| **Protected Routes** | Client-side route guards (`ProtectedRoute` component) with role validation + server-side middleware enforcement. |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         VERCEL EDGE                              │
│                                                                  │
│   ┌────────────────────┐         ┌────────────────────────┐      │
│   │   Frontend Service │         │   Backend Service      │      │
│   │   (Vite + React)   │  /api   │   (Express Serverless) │      │
│   │                    │────────▶│                        │      │
│   │   Static Hosting   │         │   Serverless Function  │      │
│   └────────────────────┘         └───────────┬────────────┘      │
│         ▲ /*                                 │                   │
│         │                                    │ SSL               │
└─────────┼────────────────────────────────────┼───────────────────┘
          │                                    ▼
     ┌────┴────┐                    ┌────────────────────┐
     │ Browser │                    │   Aiven Cloud      │
     │ Client  │ ◄──── WebSocket    │   MySQL 8.4        │
     └─────────┘    (Socket.IO)     │   (Managed)        │
                                    └────────────────────┘
```

**Request Flow:**
1. All traffic hits Vercel's edge network
2. Routes matching `/api/*` are proxied to the backend serverless function
3. All other routes (`/*`) serve the React SPA from static hosting
4. Backend connects to Aiven-managed MySQL over SSL
5. Real-time updates are pushed to clients via Socket.IO WebSockets

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|:---|:---|
| **React 19** | UI framework with hooks and functional components |
| **Vite 8** | Build tool and dev server with HMR |
| **React Router 7** | Client-side routing with nested + protected routes |
| **Axios** | HTTP client for API communication |
| **Chart.js + react-chartjs-2** | Interactive analytics charts (line, bar, pie, doughnut) |
| **Lucide React** | Consistent SVG icon library |
| **jsPDF + AutoTable** | Client-side PDF generation for medical reports |
| **Socket.IO Client** | Real-time WebSocket communication |

### Backend
| Technology | Purpose |
|:---|:---|
| **Node.js** | Runtime environment |
| **Express 5** | Web framework with async route handlers |
| **MySQL2** | MySQL driver with connection pooling and prepared statements |
| **JSON Web Token** | Stateless authentication |
| **bcryptjs** | Password hashing (10 salt rounds) |
| **Socket.IO** | Real-time bidirectional event-based communication |
| **Multer** | File upload middleware (multipart/form-data) |
| **dotenv** | Environment variable management |

### Infrastructure
| Technology | Purpose |
|:---|:---|
| **Vercel** | Frontend static hosting + backend serverless functions |
| **Aiven** | Managed cloud MySQL 8.4 with SSL |

---

## 📂 Project Structure

```text
MedZoo/
├── frontend/                          # React SPA (Vite)
│   ├── public/
│   │   └── favicon.svg                # App icon
│   ├── src/
│   │   ├── App.jsx                    # Root component with route definitions
│   │   ├── main.jsx                   # React DOM entry point
│   │   ├── config.js                  # API base URL configuration
│   │   ├── index.css                  # Global styles and design tokens
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx        # Authentication state provider
│   │   └── components/
│   │       ├── common/                # Shared components (all roles)
│   │       │   ├── Login.jsx          # Email/phone login form
│   │       │   ├── Register.jsx       # Patient self-registration
│   │       │   ├── ForgotPasswordOTP.jsx  # Password recovery flow
│   │       │   ├── AcceptInvitation.jsx   # Token-based role onboarding
│   │       │   ├── Profile.jsx        # User profile management
│   │       │   ├── Navbar.jsx         # Navigation bar with role-aware menu
│   │       │   ├── NotificationsDropdown.jsx  # Real-time notification center
│   │       │   └── ErrorBoundary.jsx  # React error boundary
│   │       ├── doctor/                # Doctor-only components
│   │       │   ├── DoctorDashboard.jsx    # Analytics + overview
│   │       │   ├── AppointmentManager.jsx # Appointment lifecycle
│   │       │   ├── PatientList.jsx        # Patient records + PDF export
│   │       │   └── ReferralManager.jsx    # Case referral system
│   │       └── patient/               # Patient-only components
│   │           ├── PatientDashboard.jsx     # Patient home + history
│   │           ├── DoctorDiscovery.jsx      # Trust-network doctor search
│   │           ├── ContactManager.jsx       # Phonebook sync
│   │           └── ContactPermissionModal.jsx # Contact permission flow
│   ├── package.json
│   └── vite.config.js
│
├── backend/                           # Express REST API
│   ├── server.js                      # App entry — Express + Socket.IO setup
│   ├── index.js                       # Vercel serverless entry point
│   ├── config/
│   │   ├── db.js                      # MySQL connection pool + schema init
│   │   └── schema.sql                 # Full database DDL (9 tables)
│   ├── middleware/
│   │   └── auth.js                    # JWT verification middleware
│   ├── routes/
│   │   ├── auth.js                    # Registration, login, password reset
│   │   ├── appointments.js            # CRUD + status transitions
│   │   ├── consultations.js           # Medical records + prescriptions
│   │   ├── contacts.js                # Contact sync + trust network
│   │   ├── doctors.js                 # Doctor lookup + profiles
│   │   ├── notifications.js           # Push notification management
│   │   └── referrals.js               # Doctor-to-doctor referrals
│   ├── utils/
│   │   └── notify.js                  # WebSocket notification helper
│   └── package.json
│
├── api/
│   └── index.js                       # Vercel serverless function proxy
│
├── vercel.json                        # Vercel services + rewrite rules
├── package.json                       # Root workspace config
├── .npmrc                             # npm config (legacy-peer-deps)
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **MySQL** 8.0+ (local or cloud instance)
- **npm** ≥ 9

### 1. Clone the Repository

```bash
git clone https://github.com/manikant1446/MedZoo.git
cd MedZoo
```

### 2. Install Dependencies

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### 3. Configure Environment

Create `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=medzoo
JWT_SECRET=your_jwt_secret_key
```

> **Note:** For cloud databases (e.g., Aiven), SSL is automatically enabled in the connection config.

### 4. Initialize Database

```bash
mysql -u your_user -p < backend/config/schema.sql
```

Or let the application auto-initialize — the backend runs `CREATE TABLE IF NOT EXISTS` on startup.

### 5. Start Development Servers

```bash
# Terminal 1 — Backend (port 5001)
cd backend
npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|:---|:---:|:---|
| `DB_HOST` | ✅ | MySQL host address |
| `DB_PORT` | ✅ | MySQL port (default: `3306`) |
| `DB_USER` | ✅ | Database username |
| `DB_PASSWORD` | ✅ | Database password |
| `DB_NAME` | ✅ | Database name (e.g., `medzoo`) |
| `JWT_SECRET` | ✅ | Secret key for JWT token signing |
| `PORT` | ❌ | Server port (default: `5001`) |

---

## 📡 API Reference

All endpoints are prefixed with `/api` in production. Base URL: `https://medzoo.vercel.app/api`

### Authentication

| Method | Endpoint | Description |
|:---:|:---|:---|
| `POST` | `/auth/register` | Register a new patient account |
| `POST` | `/auth/login` | Login with email/phone + password |
| `POST` | `/auth/forgot-password` | Initiate password reset |
| `POST` | `/auth/reset-password` | Reset password with OTP |
| `POST` | `/auth/invite` | Generate staff/doctor invitation link |
| `POST` | `/auth/accept-invitation` | Register via invitation token |
| `GET` | `/auth/me` | Get current user profile |
| `PUT` | `/auth/profile` | Update user profile |

### Appointments

| Method | Endpoint | Description |
|:---:|:---|:---|
| `GET` | `/appointments` | List appointments (filtered by role) |
| `POST` | `/appointments` | Book a new appointment |
| `PUT` | `/appointments/:id/status` | Update appointment status |
| `PUT` | `/appointments/:id/cancel` | Cancel an appointment |
| `GET` | `/appointments/slots` | Get available time slots for a doctor |

### Consultations

| Method | Endpoint | Description |
|:---:|:---|:---|
| `GET` | `/consultations` | List consultations for current user |
| `POST` | `/consultations` | Create a consultation record |
| `PUT` | `/consultations/:id` | Update consultation details |
| `GET` | `/consultations/patient/:id` | Get patient consultation history |

### Contacts & Trust Network

| Method | Endpoint | Description |
|:---:|:---|:---|
| `POST` | `/contacts/sync` | Sync phonebook contacts |
| `GET` | `/contacts` | Get synced contacts list |
| `PUT` | `/contacts/permission` | Update contact sync permission |

### Doctors

| Method | Endpoint | Description |
|:---:|:---|:---|
| `GET` | `/doctors` | List all registered doctors |
| `GET` | `/doctors/discover` | Discover doctors via trust network |

### Referrals

| Method | Endpoint | Description |
|:---:|:---|:---|
| `GET` | `/referrals` | List referrals (sent/received) |
| `POST` | `/referrals` | Create a new referral |
| `PUT` | `/referrals/:id/status` | Accept/decline a referral |

### Notifications

| Method | Endpoint | Description |
|:---:|:---|:---|
| `GET` | `/notifications` | Get user notifications |
| `PUT` | `/notifications/:id/read` | Mark notification as read |
| `PUT` | `/notifications/read-all` | Mark all as read |

### Health Check

| Method | Endpoint | Description |
|:---:|:---|:---|
| `GET` | `/health` | API health check |

---

## 🗄️ Database Schema

The application uses **9 relational tables** with foreign key constraints and indexed queries:

```
┌──────────┐     ┌───────────────┐     ┌──────────────┐
│  users   │────▶│ consultations │────▶│ prescriptions│
│          │     │               │     │              │
│ id       │     │ patient_id FK │     │ consult_id FK│
│ name     │     │ doctor_id  FK │     │ medicine     │
│ email    │     │ diagnosis     │     │ dosage       │
│ phone    │     │ category      │     │ duration     │
│ role     │     │ status        │     └──────────────┘
│ specialty│     └───────────────┘
└──────────┘
     │
     ├────▶ appointments     (patient_id, doctor_id, date, time_slot, status)
     ├────▶ referrals        (from_doctor_id, to_doctor_id, patient_id, priority)
     ├────▶ contacts         (user_id, contact_user_id, trust_level)
     ├────▶ invitations      (phone, role, token, expires_at)
     ├────▶ doctor_staff     (doctor_id, user_id, role, status)
     └────▶ notifications    (user_id, type, title, message, is_read)
```

---

## 🚢 Deployment

The application is deployed on **Vercel** using the [Services](https://vercel.com/docs/projects/project-configuration#services) model:

### Vercel Configuration

```json
{
  "services": {
    "frontend": { "root": "frontend/", "framework": "vite" },
    "backend":  { "root": "backend/",  "entrypoint": "server.js" }
  },
  "rewrites": [
    { "source": "/api",     "destination": { "service": "backend" } },
    { "source": "/api/(.*)", "destination": { "service": "backend" } },
    { "source": "/(.*)",    "destination": { "service": "frontend" } }
  ]
}
```

### SPA Route Handling

The frontend build script generates static `index.html` copies in subdirectories for each route (`/login`, `/dashboard`, `/appointments`, etc.) to ensure direct URL navigation works without 404 errors on Vercel's static hosting.

### Deploy to Vercel

```bash
npm i -g vercel
vercel --prod
```

Set the backend environment variables in **Vercel → Project → Settings → Environment Variables**.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "feat: add your feature"`
4. Push to branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">
  <p>
    <strong>Built with ❤️ by <a href="https://github.com/manikant1446">Manikant Kumar</a></strong>
  </p>
  <p>
    <a href="https://medzoo.vercel.app">🌐 Live Demo</a> •
    <a href="https://github.com/manikant1446/MedZoo/issues">🐛 Report Bug</a> •
    <a href="https://github.com/manikant1446/MedZoo/issues">💡 Request Feature</a>
  </p>
</div>
