<div align="center">
  <img src="./frontend/public/favicon.svg" alt="MedZoo Logo" width="100" />

  <h1>MedZoo</h1>

  <p><strong>Smart Healthcare & Doctor Appointment Booking Platform</strong></p>

  <p>
    <a href="https://medzoo.vercel.app"><img src="https://img.shields.io/badge/🌐_Live-medzoo.vercel.app-00C853?style=for-the-badge" alt="Live" /></a>
    <img src="https://img.shields.io/badge/Version-1.0.0-blue?style=for-the-badge" alt="Version" />
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

## 💡 Overview

MedZoo is a modern, full-stack healthcare management platform that connects patients with verified doctors and specialist clinics. It provides a complete digital ecosystem for healthcare — from doctor discovery and real-time appointment booking to consultation tracking, digital prescriptions, case referrals, and clinic analytics.

The platform supports **three distinct user roles** — **Patients**, **Doctors**, and **Clinic Staff** — each with dedicated dashboards, workflows, and role-based permissions.

---

## 🌐 Live Demo

| Environment | URL |
|:---|:---|
| **Production** | **[https://medzoo.vercel.app](https://medzoo.vercel.app)** |
| Frontend | Vercel Static Hosting (React SPA) |
| Backend API | Vercel Serverless Functions (Express) |
| Database | Aiven Cloud MySQL 8.4 (SSL) |
| WebSockets | Socket.IO Real-Time Layer |

---

## 🔄 User Workflow

### Patient Journey
```
Register/Login → Complete Profile → Discover Doctors → Book Appointment
      ↓                                     ↓
  Google OAuth 1-Tap              Filter by Specialty/Name
      ↓                                     ↓
  Set Medical Info            View Slots → Confirm Booking
  (age, gender, blood            ↓
   group, address)         Get Directions (GPS Location)
                                    ↓
                           Receive Notifications
                                    ↓
                           Visit Doctor → Rate Experience
                                    ↓
                           View Medical History & Dashboard
```

### Doctor Journey
```
Invitation-Only Registration → Set Clinic Profile → Manage Appointments
            ↓                         ↓                      ↓
    Accept Invite Token      Set Specialty, Hospital    Approve/Reject/
            ↓                 Qualifications, Exp.     Start/Complete
    Complete Credentials              ↓                      ↓
                              View Analytics          Mark Critical 🚨
                              Dashboard                     ↓
                                    ↓              Create Consultation
                              Patient Trends,            ↓
                              Disease Charts,     Add Prescriptions
                              Peak Hours                 ↓
                                                  Refer to Specialist
                                                         ↓
                                                  Export PDF Reports
```

### Staff Journey
```
Doctor Sends Invitation → Staff Accepts Token → Linked to Doctor
                                    ↓
                          Manage Appointments on behalf of Doctor
                          (Same appointment lifecycle access)
```

---

## ✨ Features

### 👨‍⚕️ Doctor Portal

| Feature | Description |
|:---|:---|
| **📊 Analytics Dashboard** | Real-time interactive charts — patient trends over time (line chart), disease category distributions (pie/doughnut), peak consultation hours (bar chart), and key metrics (total patients, consultations, appointments, average rating). Powered by Chart.js. |
| **📅 Appointment Manager** | Full appointment lifecycle: approve → start → complete, reject, or escalate to **Critical** status (with flashing visual indicators). Filter by status, search by date, real-time WebSocket status updates. |
| **📋 Consultation Tracking** | Create detailed consultations with diagnosis, category (Cardiology, Dermatology, Neurology, etc.), prescriptions, and clinical notes. Auto-registers unregistered patients by phone number. Supports marking consultations as pending, treated, referred, or follow-up. |
| **💊 Prescription Builder** | Multi-medicine prescription builder per consultation. Records medicine name, dosage instructions, and treatment duration. |
| **🤝 Case Referrals** | Refer patients to specialist doctors with priority tagging (low / medium / high / critical). Lookup referral targets by phone or email. Track referral status: pending → accepted → completed. |
| **📄 PDF Export** | One-click export of complete patient consultation history into professionally formatted PDF reports using jsPDF + AutoTable. |
| **👥 Patient Records** | Searchable patient directory with complete medical history, consultation timeline, and appointment records. |
| **🏥 Staff Management** | Invite clinic staff via secure token-based invitation links. Staff can manage appointments on behalf of the doctor. Role delegation with `doctor_staff` relationship tracking. |
| **🔔 Real-Time Notifications** | WebSocket-powered live notifications for new appointments, referrals, status changes, and emergency alerts. Notification center with read/unread tracking and batch operations. |

### 🧑‍🤝‍🧑 Patient Portal

| Feature | Description |
|:---|:---|
| **🔍 Doctor Discovery** | Search and filter verified doctors by name, medical specialty (General, Cardiologist, Dermatologist, Neurologist, Psychiatrist, Dentist), qualifications, experience, and hospital. View live ratings and patient count. |
| **🗓️ Appointment Booking** | Browse available doctors, view dynamic 30-minute time slots based on doctor calendar availability, and book appointments instantly. Supports appointment notes and reason for visit. |
| **📍 Location-Aware Directions** | Get Directions button requests browser geolocation permission, captures GPS coordinates, and opens Google Maps with turn-by-turn directions from your real-time location to the doctor's clinic. |
| **🩺 Medical Dashboard** | Personalized health dashboard showing upcoming appointments, past consultations with diagnoses, treatment history, and doctor feedback. |
| **🩸 Health Profile** | Complete medical info management — age, gender, blood group, contact phone, residential address, and locality for emergency coordination. |
| **⭐ Doctor Ratings** | Rate doctors with 1–5 stars after completed consultations. Ratings dynamically calculate into the doctor's average score with review count. |
| **🚨 Emergency Protocol** | Trigger urgent care alerts with real-time WebSocket notifications sent directly to the assigned doctor and clinic staff. |

### 🔐 Authentication & Security

| Feature | Description |
|:---|:---|
| **Google OAuth 2.0** | 1-Tap instant login & sign-up via Google accounts with automated `CompleteProfile` onboarding for missing contact & medical details. |
| **Multi-Step Registration** | Two-step onboarding: account credentials (name, email, phone, password, role) → medical/demographic details (age, gender, blood group, address, specialty for doctors). |
| **JWT Authentication** | Stateless token-based auth with bcrypt password hashing (10 salt rounds). Tokens persist across sessions via `localStorage` with 30-day expiry. |
| **Role-Based Access Control** | Three distinct roles (`patient`, `doctor`, `staff`) with route-level guards (`ProtectedRoute` component) and server-side middleware enforcement. Staff inherits appointment permissions from their assigned doctor. |
| **Invitation-Only Onboarding** | Doctors and staff register exclusively through secure, time-limited invitation tokens. Patients can self-register. |
| **Password Recovery** | OTP-based forgot-password flow via email (Nodemailer) for account recovery, plus authenticated password change for logged-in users. |
| **Auto-Logout** | Axios interceptors globally handle 401 responses — automatically logs out users with invalid/expired tokens while preserving sessions for permission-level denials. |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         VERCEL EDGE                              │
│                                                                  │
│   ┌────────────────────┐         ┌────────────────────────┐      │
│   │   Frontend Service │         │   Backend Service      │      │
│   │   (Vite + React)   │  /api/* │   (Express Serverless) │      │
│   │                    │────────▶│                        │      │
│   │   Static Hosting   │         │   Serverless Function  │      │
│   └────────────────────┘         └───────────┬────────────┘      │
│         ▲ /*                                 │                   │
│         │                                    │ SSL               │
└─────────┼────────────────────────────────────┼───────────────────┘
          │                                    ▼
     ┌────┴────┐                    ┌────────────────────┐
     │ Browser │                    │   Aiven Cloud      │
     │ Client  │ ◄──── WebSocket   │   MySQL 8.4        │
     └─────────┘    (Socket.IO)    │   (Managed + SSL)  │
          │                        └────────────────────┘
          │
          ▼
   ┌─────────────┐
   │ Google Maps  │ ← Geolocation API (directions)
   │ Google OAuth │ ← 1-Tap Login
   │ Nodemailer   │ ← OTP Emails
   └─────────────┘
```

### Request Flow

1. All traffic hits **Vercel's edge network**
2. Routes matching `/api/*` are proxied to the **backend serverless function** (Express 5)
3. All other routes (`/*`) serve the **React SPA** from static hosting
4. Backend connects to **Aiven-managed MySQL** over SSL with connection pooling
5. Real-time updates are pushed to connected clients via **Socket.IO WebSockets**
6. **Browser Geolocation API** provides GPS coordinates for clinic directions
7. **Google OAuth** handles 1-Tap authentication with server-side token verification

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|:---|:---:|:---|
| **React** | 19.2 | UI framework with hooks and functional components |
| **Vite** | 8.0 | Build tool and dev server with HMR |
| **React Router** | 7.14 | Client-side routing with nested + protected routes |
| **Axios** | 1.15 | HTTP client with request/response interceptors |
| **Chart.js + react-chartjs-2** | 4.5 / 5.3 | Interactive analytics charts (line, bar, pie, doughnut) |
| **Lucide React** | 1.8 | Consistent SVG icon library |
| **jsPDF + AutoTable** | 4.2 / 5.0 | Client-side PDF generation for medical reports |
| **Socket.IO Client** | 4.8 | Real-time WebSocket communication |
| **@react-oauth/google** | 0.13 | Google 1-Tap OAuth integration |

### Backend

| Technology | Version | Purpose |
|:---|:---:|:---|
| **Express** | 5.2 | Web framework with async route handlers |
| **MySQL2** | 3.9 | MySQL driver with connection pooling and prepared statements |
| **JSON Web Token** | 9.0 | Stateless authentication (30-day expiry) |
| **bcryptjs** | 3.0 | Password hashing (10 salt rounds) |
| **Socket.IO** | 4.8 | Real-time bidirectional event-based communication |
| **Multer** | 2.1 | File upload middleware (avatar images) |
| **Nodemailer** | 10.0 | Email service for OTP-based password recovery |
| **google-auth-library** | 11.0 | Server-side Google OAuth token verification |
| **dotenv** | 17.4 | Environment variable management |

### Infrastructure

| Technology | Purpose |
|:---|:---|
| **Vercel** | Frontend static hosting + backend serverless functions |
| **Aiven** | Managed cloud MySQL 8.4 with SSL encryption |
| **Google Cloud** | OAuth 2.0 identity provider |

---

## 📂 Project Structure

```text
MedZoo/
├── frontend/                          # React SPA (Vite 8)
│   ├── public/
│   │   └── favicon.svg                # App icon
│   ├── src/
│   │   ├── App.jsx                    # Root — route definitions & ProtectedRoute guard
│   │   ├── main.jsx                   # React DOM entry point
│   │   ├── config.js                  # API base URL configuration
│   │   ├── index.css                  # Global styles, design tokens, dark theme
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx        # Auth state, Axios interceptors, staff assignments
│   │   └── components/
│   │       ├── common/                # Shared components (all roles)
│   │       │   ├── Login.jsx          # Email/phone login form
│   │       │   ├── Register.jsx       # Multi-step registration with specialty selection
│   │       │   ├── GoogleAuthButton.jsx # Google 1-Tap OAuth trigger
│   │       │   ├── CompleteProfile.jsx # Post-OAuth onboarding (medical + demographic)
│   │       │   ├── ForgotPasswordOTP.jsx  # OTP-based password recovery via email
│   │       │   ├── AcceptInvitation.jsx   # Token-based staff/doctor onboarding
│   │       │   ├── Profile.jsx        # User profile with specialty dropdown & "Other"
│   │       │   ├── Navbar.jsx         # Role-aware navigation with My Appointments link
│   │       │   ├── NotificationsDropdown.jsx  # Real-time notification center
│   │       │   └── ErrorBoundary.jsx  # React error boundary
│   │       ├── doctor/                # Doctor-only components
│   │       │   ├── DoctorDashboard.jsx    # Analytics charts + key metrics overview
│   │       │   ├── AppointmentManager.jsx # Full appointment lifecycle management
│   │       │   ├── PatientList.jsx        # Patient records + consultation history + PDF
│   │       │   └── ReferralManager.jsx    # Doctor-to-doctor case referral system
│   │       └── patient/               # Patient-only components
│   │           ├── PatientDashboard.jsx     # Health dashboard + consultation history
│   │           └── DoctorDiscovery.jsx      # Doctor search, booking + GPS directions
│   ├── package.json
│   └── vite.config.js
│
├── backend/                           # Express 5 REST API
│   ├── server.js                      # App entry — Express + Socket.IO + HTTP server
│   ├── index.js                       # Vercel serverless entry point
│   ├── config/
│   │   ├── db.js                      # MySQL connection pool + auto schema init
│   │   └── schema.sql                 # Full DDL — 9 tables with FK constraints & indexes
│   ├── middleware/
│   │   └── auth.js                    # JWT verification + role extraction middleware
│   ├── routes/
│   │   ├── auth.js                    # Registration, login, OAuth, password reset, profile
│   │   ├── appointments.js            # CRUD + status transitions + slot availability
│   │   ├── consultations.js           # Medical records + prescriptions + auto-register
│   │   ├── contacts.js                # Trusted contact network management
│   │   ├── doctors.js                 # Doctor lookup, search, filtering
│   │   ├── notifications.js           # Push notification CRUD + batch read
│   │   └── referrals.js               # Doctor-to-doctor referral lifecycle
│   ├── utils/
│   │   ├── notify.js                  # WebSocket notification helper (DB + Socket.IO)
│   │   └── mailer.js                  # Nodemailer email service (OTP, notifications)
│   └── package.json
│
├── vercel.json                        # Vercel services config + API rewrites
├── package.json                       # Root workspace config
├── .npmrc                             # npm config (legacy-peer-deps)
├── .gitignore
└── README.md
```

---

## 🗄️ Database Schema

**9 relational tables** with foreign key constraints, unique indexes, and optimized query indexes:

```
┌──────────────────┐     ┌───────────────────┐     ┌──────────────────┐
│      users       │────▶│   consultations   │────▶│  prescriptions   │
│                  │     │                   │     │                  │
│ id (PK)          │     │ patient_id (FK)   │     │ consultation_id  │
│ name, email      │     │ doctor_id (FK)    │     │ medicine         │
│ phone, password  │     │ diagnosis         │     │ dosage           │
│ role (enum)      │     │ category (enum)   │     │ duration         │
│ specialty        │     │ status (enum)     │     └──────────────────┘
│ hospital         │     │ notes, rating     │
│ qualifications   │     │ consultation_hour │
│ experience       │     │ appointment_id    │
│ age, gender      │     │ referral_id       │
│ blood_group      │     └───────────────────┘
│ address, locality│
│ rating (avg)     │
│ ratings_count    │
│ is_verified      │
│ avatar           │
└──────────────────┘
       │
       ├────▶ appointments     (patient_id, doctor_id, date, time_slot, status,
       │                        payment_status, is_emergency, rating)
       │                        UNIQUE(doctor_id, date, time_slot)
       │
       ├────▶ referrals        (from_doctor_id, to_doctor_id, patient_id,
       │                        reason, priority, status)
       │
       ├────▶ contacts         (user_id, contact_user_id, trust_level)
       │                        UNIQUE(user_id, contact_user_id)
       │
       ├────▶ invitations      (phone, role, token, invited_by,
       │                        status, expires_at)
       │
       ├────▶ doctor_staff     (doctor_id, user_id, role, status)
       │                        UNIQUE(doctor_id, user_id)
       │
       └────▶ notifications    (user_id, type, title, message,
                                data JSON, is_read)
```

### Key Indexes
- `idx_consultations_doctor` / `idx_consultations_patient` — Fast lookup by doctor/patient
- `idx_consultations_status` / `idx_consultations_date` — Filtered queries
- `idx_referrals_from` / `idx_referrals_to` — Referral direction queries
- `idx_contacts_user` — Contact network lookup
- `idx_notifications_user` — Notification retrieval with read/unread filtering

---

## 📡 API Reference

All endpoints are prefixed with `/api` in production. Base URL: `https://medzoo.vercel.app/api`

### Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description |
|:---:|:---|:---:|:---|
| `POST` | `/register` | ❌ | Multi-step registration (credentials + demographics) |
| `POST` | `/google` | ❌ | Google OAuth 2.0 sign-in/sign-up |
| `POST` | `/login` | ❌ | Login with email/phone + password |
| `POST` | `/forgot-password` | ❌ | Send OTP to email for password reset |
| `POST` | `/reset-password` | ❌ | Reset password with verified OTP |
| `PUT` | `/change-password` | 🔒 | Change password (authenticated) |
| `POST` | `/invite` | 🔒 | Generate staff/doctor invitation link |
| `POST` | `/accept-invitation` | ❌ | Register via invitation token |
| `GET` | `/me` | 🔒 | Get current user profile |
| `PUT` | `/profile` | 🔒 | Update profile (phone, email, age, gender, blood group, avatar, etc.) |
| `GET` | `/staff-assignments` | 🔒 | Get staff-to-doctor assignments |

### Appointments (`/api/appointments`)

| Method | Endpoint | Auth | Description |
|:---:|:---|:---:|:---|
| `GET` | `/` | 🔒 | List appointments (filtered by user role) |
| `POST` | `/` | 🔒 | Book a new appointment |
| `GET` | `/patient` | 🔒 | Get patient's own appointments |
| `GET` | `/slots/:doctorId/:date` | 🔒 | Get available 30-min time slots |
| `PUT` | `/:id/status` | 🔒 | Update status (confirm/start/complete/cancel/critical) |
| `POST` | `/:id/rate` | 🔒 | Rate doctor after completed appointment |

### Consultations (`/api/consultations`)

| Method | Endpoint | Auth | Description |
|:---:|:---|:---:|:---|
| `GET` | `/` | 🔒 | List consultations for current user |
| `POST` | `/` | 🔒 | Create a consultation record with prescriptions |
| `PUT` | `/:id` | 🔒 | Update consultation details |
| `GET` | `/patient/:id` | 🔒 | Get patient consultation history |

### Doctors (`/api/doctors`)

| Method | Endpoint | Auth | Description |
|:---:|:---|:---:|:---|
| `GET` | `/` | ❌ | List & filter doctors (search, specialty) |
| `GET` | `/:id` | ❌ | Get doctor profile & statistics |

### Referrals (`/api/referrals`)

| Method | Endpoint | Auth | Description |
|:---:|:---|:---:|:---|
| `GET` | `/` | 🔒 | List referrals (sent/received) |
| `POST` | `/` | 🔒 | Create a new referral with priority |
| `PUT` | `/:id/status` | 🔒 | Accept/decline/complete a referral |

### Contacts (`/api/contacts`)

| Method | Endpoint | Auth | Description |
|:---:|:---|:---:|:---|
| `GET` | `/` | 🔒 | List trusted contacts |
| `POST` | `/` | 🔒 | Add a trusted contact |
| `DELETE` | `/:id` | 🔒 | Remove a contact |

### Notifications (`/api/notifications`)

| Method | Endpoint | Auth | Description |
|:---:|:---|:---:|:---|
| `GET` | `/` | 🔒 | Get user notifications |
| `PUT` | `/:id/read` | 🔒 | Mark notification as read |
| `PUT` | `/read-all` | 🔒 | Mark all notifications as read |

### Health Check

| Method | Endpoint | Description |
|:---:|:---|:---|
| `GET` | `/api/health` | API health check with timestamp |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **MySQL** 8.0+ (local or cloud)
- **npm** ≥ 9

### 1. Clone the Repository

```bash
git clone https://github.com/manikant1446/MedZoo.git
cd MedZoo
```

### 2. Install Dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
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
GOOGLE_CLIENT_ID=your_google_oauth_client_id
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

Create `frontend/.env` (optional):

```env
VITE_API_BASE_URL=http://localhost:5001/api
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
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
cd backend && npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
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
| `GOOGLE_CLIENT_ID` | ❌ | Google OAuth 2.0 Web Client ID |
| `EMAIL_USER` | ❌ | Email address for OTP/notification emails |
| `EMAIL_PASS` | ❌ | App password for email service |
| `PORT` | ❌ | Server port (default: `5001`) |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|:---|:---:|:---|
| `VITE_API_BASE_URL` | ❌ | Backend API base URL (defaults to production) |
| `VITE_GOOGLE_CLIENT_ID` | ❌ | Google OAuth Client ID for 1-Tap sign-in |

---

## 🚢 Deployment

The application is deployed on **Vercel** using the [Services](https://vercel.com/docs/projects/project-configuration#services) architecture:

### Vercel Configuration (`vercel.json`)

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

The frontend build script generates static `index.html` copies in subdirectories for each route (`/login`, `/dashboard`, `/discover`, `/appointments`, etc.) to ensure direct URL navigation works without 404 errors on Vercel static hosting.

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
