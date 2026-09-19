<div align="center">

  <img src="./frontend/public/favicon.svg" alt="MedZoo Logo" width="120" />

  <br />

  # 🏥 MedZoo

  ### *Smart Healthcare & Doctor Appointment Platform*

  <br />

  [![Live Demo](https://img.shields.io/badge/🌐_LIVE_DEMO-medzoo.vercel.app-00E676?style=for-the-badge&logoColor=white)](https://medzoo.vercel.app)
  [![Version](https://img.shields.io/badge/v1.0.0-Release-7C4DFF?style=for-the-badge)](https://github.com/manikant1446/MedZoo/releases)
  [![License](https://img.shields.io/badge/License-MIT-00B0FF?style=for-the-badge)](LICENSE)
  [![Status](https://img.shields.io/badge/Status-Active-00E676?style=for-the-badge)](https://medzoo.vercel.app)

  <br />

  <a href="https://medzoo.vercel.app">
    <img src="https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black" height="28" />
  </a>
  <a href="https://medzoo.vercel.app">
    <img src="https://img.shields.io/badge/Vite_8-646CFF?style=flat-square&logo=vite&logoColor=white" height="28" />
  </a>
  <a href="https://medzoo.vercel.app">
    <img src="https://img.shields.io/badge/Express_5-000000?style=flat-square&logo=express&logoColor=white" height="28" />
  </a>
  <a href="https://medzoo.vercel.app">
    <img src="https://img.shields.io/badge/MySQL_8-4479A1?style=flat-square&logo=mysql&logoColor=white" height="28" />
  </a>
  <a href="https://medzoo.vercel.app">
    <img src="https://img.shields.io/badge/Socket.IO-010101?style=flat-square&logo=socketdotio&logoColor=white" height="28" />
  </a>
  <a href="https://medzoo.vercel.app">
    <img src="https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white" height="28" />
  </a>
  <a href="https://medzoo.vercel.app">
    <img src="https://img.shields.io/badge/Chart.js-FF6384?style=flat-square&logo=chartdotjs&logoColor=white" height="28" />
  </a>
  <a href="https://medzoo.vercel.app">
    <img src="https://img.shields.io/badge/Google_OAuth-4285F4?style=flat-square&logo=google&logoColor=white" height="28" />
  </a>

  <br /><br />

  > **MedZoo bridges the gap between patients and doctors** — enabling real-time appointment booking, digital consultations, GPS-powered clinic navigation, and complete clinic management — all in one platform.

  <br />

  [🚀 Live Demo](https://medzoo.vercel.app) · [🐛 Report Bug](https://github.com/manikant1446/MedZoo/issues) · [💡 Request Feature](https://github.com/manikant1446/MedZoo/issues)

</div>

<br />

---

<br />

## 🌍 The Real Problem MedZoo Solves

<table>
<tr>
<td width="50%">

### ❌ Before MedZoo

- 📞 Patients call clinics repeatedly for appointment availability
- 🏃 Walk-in visits waste hours in waiting rooms
- 📋 Paper-based medical records get lost or damaged
- 🗺️ Patients struggle to find clinic locations
- 📊 Doctors have no visibility into their practice analytics
- 🔕 No instant communication between doctor and patient
- 📄 Prescriptions are handwritten and often unreadable
- 🔄 Referrals between specialists happen through phone calls

</td>
<td width="50%">

### ✅ With MedZoo

- 🗓️ **Real-time slot availability** — book appointments in seconds
- 🏠 **Book from anywhere** — no more waiting room hassles
- 💾 **Digital medical records** — consultations, prescriptions stored forever
- 📍 **GPS directions** — one tap to navigate to the clinic
- 📊 **Live analytics dashboard** — patient trends, peak hours, ratings
- 🔔 **Instant WebSocket notifications** — real-time appointment updates
- 💊 **Digital prescriptions** — medicine, dosage, duration — all typed & clear
- 🤝 **Digital referral system** — refer patients with priority tagging

</td>
</tr>
</table>

<br />

> [!TIP]
> **MedZoo is not just an appointment app** — it's a complete healthcare operations platform for doctors, patients, and clinic staff, solving real problems that Indian clinics face every day.

<br />

---

<br />

## 🔄 How It Works — User Workflow & 2D Data Flow

<br />

### 🧑‍💻 Patient Journey

```mermaid
flowchart TD
    A["🔐 1. Register / Google Login<br/><sub>Google OAuth or Phone/Password</sub>"]
    B["🔍 2. Discover Doctors<br/><sub>Filter Specialty & Locality</sub>"]
    C["📅 3. Real-Time Slot Picker<br/><sub>Live 30-Min Availability</sub>"]
    D{"⚡ 4. Booking Type"}
    D1["🩺 Scheduled Consultation<br/><sub>Confirmed Slot Booking</sub>"]
    D2["🚨 Emergency Walk-In<br/><sub>Priority Urgent Care</sub>"]
    E["📍 5. 1-Tap GPS Directions<br/><sub>Turn-by-Turn Route to Clinic</sub>"]
    F["🏥 6. Doctor Consultation<br/><sub>Diagnosis & Clinical Notes</sub>"]
    G["💊 7. Digital Prescription<br/><sub>Rx Medicines, Dosages & PDF</sub>"]
    H["⭐ 8. Rate & Review<br/><sub>1–5 Star Doctor Feedback</sub>"]

    A -->|"👤 User Identity & JWT Token"| B
    B -->|"👨‍⚕️ Selected Doctor & Clinic"| C
    C -->|"🗓️ Date & Preferred Slot"| D
    D -->|"Regular Booking"| D1
    D -->|"Urgent Flag"| D2
    D1 -->|"🔔 Real-Time Booking Alert"| E
    D2 -->|"🚨 High-Priority Emergency Alert"| E
    E -->|"📍 Live Patient GPS Coords"| F
    F -->|"📋 Diagnosis & Care Plan"| G
    G -->|"⭐ Post-Visit Rating (Updates Doctor Score)"| H

    style A fill:#7C4DFF,color:#fff,stroke:#5E35B1,stroke-width:2px
    style B fill:#536DFE,color:#fff,stroke:#3949AB,stroke-width:2px
    style C fill:#00B0FF,color:#fff,stroke:#0091EA,stroke-width:2px
    style D fill:#00E5FF,color:#000,stroke:#00B8D4,stroke-width:2px
    style D1 fill:#00E676,color:#000,stroke:#00C853,stroke-width:2px
    style D2 fill:#FF5252,color:#fff,stroke:#D50000,stroke-width:2px
    style E fill:#FFD740,color:#000,stroke:#FFC400,stroke-width:2px
    style F fill:#FF9100,color:#fff,stroke:#FF6D00,stroke-width:2px
    style G fill:#E040FB,color:#fff,stroke:#AA00FF,stroke-width:2px
    style H fill:#9C27B0,color:#fff,stroke:#7B1FA2,stroke-width:2px
```

<br />

### 👨‍⚕️ Doctor Journey

```mermaid
flowchart TD
    A["🏥 1. Setup Clinic Profile<br/><sub>Hospital, Specialty, Fees, Address</sub>"]
    B["🔔 2. Real-Time Patient Stream<br/><sub>Instant WebSocket Notifications</sub>"]
    C["📅 3. Today's Appointment Queue<br/><sub>Live Status: Confirmed / Pending</sub>"]
    D{"📋 4. Clinical Decision"}
    D1["💊 5. Write Digital Rx<br/><sub>Multi-Medicine Builder & Notes</sub>"]
    D2["🤝 6. Specialist Referral<br/><sub>Priority Tag: Low ➔ Critical</sub>"]
    E["👩‍💼 7. Delegate Clinic Staff<br/><sub>Send Invite Token to Receptionist</sub>"]
    F["📊 8. Live Analytics Studio<br/><sub>Patient Trends, Peak Hours & Ratings</sub>"]

    A -->|"🏥 Clinic & Specialty Data"| B
    B -->|"⚡ Real-Time Booking Updates"| C
    C -->|"🔍 Patient Medical History"| D
    D -->|"Direct Treatment"| D1
    D -->|"Complex Case"| D2
    D1 -->|"💾 Stored in Patient Records & PDF"| F
    D2 -->|"📤 Real-Time Transfer to Target Doctor"| F
    A -->|"🔑 Secure Staff Token"| E
    E -->|"🤝 Linked Receptionist Access"| C

    style A fill:#E91E63,color:#fff,stroke:#C2185B,stroke-width:2px
    style B fill:#FF4081,color:#fff,stroke:#F50057,stroke-width:2px
    style C fill:#7C4DFF,color:#fff,stroke:#5E35B1,stroke-width:2px
    style D fill:#536DFE,color:#fff,stroke:#3949AB,stroke-width:2px
    style D1 fill:#00E676,color:#000,stroke:#00C853,stroke-width:2px
    style D2 fill:#FF9100,color:#fff,stroke:#FF6D00,stroke-width:2px
    style E fill:#00BCD4,color:#fff,stroke:#0097A7,stroke-width:2px
    style F fill:#4CAF50,color:#fff,stroke:#388E3C,stroke-width:2px
```

<br />

### 👩‍💼 Staff Journey

```mermaid
flowchart TD
    A["📩 1. Receive Invite Link<br/><sub>One-Time Token via Email / SMS</sub>"]
    B["🔐 2. Register & Verify<br/><sub>Auto-Linked to Doctor's Clinic</sub>"]
    C["🖥️ 3. Reception Desk Portal<br/><sub>Synchronized Live Queue Dashboard</sub>"]
    D{"⚡ 4. Patient Arrival"}
    D1["🩺 Scheduled Check-In<br/><sub>Mark Status: 'In-Progress'</sub>"]
    D2["🚨 Emergency Walk-In<br/><sub>Urgent Flag + Instant Alert</sub>"]
    E["💳 5. Payment Collection<br/><sub>Toggle Status: Unpaid ➔ Paid</sub>"]
    F["✅ 6. Chamber Handoff<br/><sub>Send Patient to Doctor's Desk</sub>"]

    A -->|"🔑 Verification Token"| B
    B -->|"🏥 Doctor-Staff Association"| C
    C -->|"📋 Daily Booking Roster"| D
    D -->|"Pre-booked Visit"| D1
    D -->|"Direct Walk-In"| D2
    D1 -->|"💵 Fee Collection"| E
    D2 -->|"🚨 High-Priority Queue Bump"| E
    E -->|"🔔 Real-Time Consultation Handshake"| F
    F -.->|"🔄 Synchronized Queue"| C

    style A fill:#7C4DFF,color:#fff,stroke:#5E35B1,stroke-width:2px
    style B fill:#536DFE,color:#fff,stroke:#3949AB,stroke-width:2px
    style C fill:#00B0FF,color:#fff,stroke:#0091EA,stroke-width:2px
    style D fill:#00E5FF,color:#000,stroke:#00B8D4,stroke-width:2px
    style D1 fill:#00E676,color:#000,stroke:#00C853,stroke-width:2px
    style D2 fill:#FF5252,color:#fff,stroke:#D50000,stroke-width:2px
    style E fill:#FFD740,color:#000,stroke:#FFC400,stroke-width:2px
    style F fill:#00C853,color:#fff,stroke:#1B5E20,stroke-width:2px
```

<br />

---

<br />

## ✨ Features at a Glance

<br />

<table>
<tr>
<td align="center" width="33%">

### 🔍 Doctor Discovery

Search by **specialty, name, hospital, experience**. View live ratings & patient count. Filter: General, Cardiologist, Dermatologist, Neurologist, Psychiatrist, Dentist.

</td>
<td align="center" width="33%">

### 📅 Smart Booking

Dynamic **30-min time slots** based on real doctor availability. Pick date → see slots → book instantly. No double-booking guaranteed.

</td>
<td align="center" width="33%">

### 📍 GPS Navigation

Click **"Get Directions"** → browser asks location permission → opens Google Maps with **your GPS location → doctor's clinic** route.

</td>
</tr>
<tr>
<td align="center" width="33%">

### 📊 Analytics Dashboard

Interactive **Chart.js** charts: patient trends (line), disease categories (pie), peak hours (bar). Key metrics: total patients, consultations, avg rating.

</td>
<td align="center" width="33%">

### 💊 Digital Prescriptions

Multi-medicine builder per consultation. **Medicine name + dosage + duration** — all digital, searchable, and exportable as PDF.

</td>
<td align="center" width="33%">

### 🔔 Real-Time Alerts

**Socket.IO WebSocket** notifications. Instant updates for bookings, status changes, referrals, and emergency alerts. Read/unread tracking.

</td>
</tr>
<tr>
<td align="center" width="33%">

### 🤝 Case Referrals

Doctor-to-doctor referral with **priority tagging** (low → critical). Track status: pending → accepted → completed. Lookup by phone or email.

</td>
<td align="center" width="33%">

### 🔐 Secure Auth

**Google OAuth 2.0** 1-Tap + JWT + bcrypt. Role-based access (Patient/Doctor/Staff). OTP password recovery via email. Auto-logout on token expiry.

</td>
<td align="center" width="33%">

### 📄 PDF Reports

One-click **patient history export** — consultations, prescriptions, diagnoses — formatted as professional PDF using jsPDF + AutoTable.

</td>
</tr>
</table>

<br />

---

<br />

## 🛠️ Tech Stack

<br />

<table>
<tr>
<td align="center" width="25%">
<h3>⚛️ Frontend</h3>
</td>
<td align="center" width="25%">
<h3>🖥️ Backend</h3>
</td>
<td align="center" width="25%">
<h3>🗄️ Database</h3>
</td>
<td align="center" width="25%">
<h3>☁️ Infrastructure</h3>
</td>
</tr>
<tr>
<td valign="top">

| Tech | Ver |
|:---|:---:|
| React | 19.2 |
| Vite | 8.0 |
| React Router | 7.14 |
| Axios | 1.15 |
| Chart.js | 4.5 |
| Lucide Icons | 1.8 |
| jsPDF | 4.2 |
| Socket.IO Client | 4.8 |
| Google OAuth | 0.13 |

</td>
<td valign="top">

| Tech | Ver |
|:---|:---:|
| Node.js | 18+ |
| Express | 5.2 |
| MySQL2 | 3.9 |
| JWT | 9.0 |
| bcryptjs | 3.0 |
| Socket.IO | 4.8 |
| Multer | 2.1 |
| Nodemailer | 10.0 |
| Google Auth | 11.0 |

</td>
<td valign="top">

| Component | Detail |
|:---|:---|
| Engine | MySQL 8.4 |
| Host | Aiven Cloud |
| Tables | 9 |
| SSL | ✅ Enabled |
| Indexes | Optimized |
| FK | Cascading |

</td>
<td valign="top">

| Service | Provider |
|:---|:---|
| Hosting | Vercel |
| Frontend | Static |
| Backend | Serverless |
| DB | Aiven |
| OAuth | Google |
| Email | Gmail |

</td>
</tr>
</table>

<br />

---

<br />

## 🏗️ Architecture

<br />

```mermaid
graph TB
    subgraph CLIENT["🌐 Browser Client"]
        UI["⚛️ React 19 SPA"]
        GEO["📍 Geolocation API"]
        WS_C["🔌 Socket.IO Client"]
    end

    subgraph VERCEL["☁️ Vercel Edge Network"]
        subgraph FRONTEND["📦 Frontend Service"]
            STATIC["Static Hosting<br/>Vite Build"]
        end
        subgraph BACKEND["📦 Backend Service"]
            API["Express 5<br/>REST API"]
            WS_S["Socket.IO<br/>WebSocket Server"]
            AUTH_MW["JWT Auth<br/>Middleware"]
        end
    end

    subgraph EXTERNAL["🌍 External Services"]
        GOOGLE["🔐 Google OAuth 2.0"]
        GMAIL["📧 Gmail SMTP<br/>Nodemailer"]
        MAPS["🗺️ Google Maps<br/>Directions"]
    end

    subgraph DATABASE["🗄️ Aiven Cloud"]
        MYSQL[("MySQL 8.4<br/>9 Tables<br/>SSL Encrypted")]
    end

    UI -->|"/* routes"| STATIC
    UI -->|"/api/* requests"| API
    UI <-->|"Real-time Events"| WS_C
    WS_C <-->|"WebSocket"| WS_S
    API --> AUTH_MW
    AUTH_MW -->|"SQL Queries"| MYSQL
    API -->|"Token Verify"| GOOGLE
    API -->|"Send OTP"| GMAIL
    GEO -->|"GPS Coords"| MAPS
    WS_S -->|"Notifications"| MYSQL

    style CLIENT fill:#1a1a2e,color:#e0e0e0,stroke:#7C4DFF
    style VERCEL fill:#0a0a1a,color:#e0e0e0,stroke:#536DFE
    style FRONTEND fill:#1a1a3e,color:#e0e0e0,stroke:#448AFF
    style BACKEND fill:#1a1a3e,color:#e0e0e0,stroke:#448AFF
    style EXTERNAL fill:#1a0a2e,color:#e0e0e0,stroke:#E040FB
    style DATABASE fill:#0a1a0a,color:#e0e0e0,stroke:#00E676
    style MYSQL fill:#4479A1,color:#fff,stroke:none
```

<br />

### 🔀 Request Flow

```
1️⃣  User opens medzoo.vercel.app → Vercel Edge serves React SPA
2️⃣  SPA makes API calls → /api/* routed to Express serverless function
3️⃣  Express validates JWT → queries MySQL via connection pool (SSL)
4️⃣  Real-time events (appointments, alerts) → pushed via Socket.IO
5️⃣  Get Directions → Browser Geolocation API → Google Maps with GPS origin
6️⃣  Password Reset → Backend → Nodemailer → Gmail SMTP → User inbox
```

<br />

---

<br />

## 🗄️ Database Design & 2D Data Flow

<br />

### 🔄 1. 2D Dynamic Database Architecture & Data Flow

```mermaid
flowchart TD
    U["👤 USERS<br/><sub>Patients, Doctors & Staff</sub>"]
    INV["📩 INVITATIONS<br/><sub>One-Time Staff Tokens</sub>"]
    DS["🔗 DOCTOR_STAFF<br/><sub>Clinic ➔ Staff Mapping</sub>"]
    A["📅 APPOINTMENTS<br/><sub>Slots & Anti-Double-Booking</sub>"]
    N["🔔 NOTIFICATIONS<br/><sub>WebSocket Real-Time Bus</sub>"]
    C["📋 CONSULTATIONS<br/><sub>Clinical Diagnoses & Notes</sub>"]
    RX["💊 PRESCRIPTIONS<br/><sub>Medicines & Dosages</sub>"]
    R["🤝 REFERRALS<br/><sub>Inter-Doctor Cases</sub>"]
    CNT["👥 CONTACTS<br/><sub>Trusted Doctor Network</sub>"]

    U -->|"🔑 Doctor generates invite"| INV
    INV -->|"✅ Staff accepts token"| DS
    DS -->|"🏥 Links staff to doctor"| U

    U -->|"📅 Patient books slot"| A
    A -->|"⚡ Triggers real-time alert"| N
    N -.->|"📲 Socket.IO push"| U

    A -->|"🩺 Completed visit"| C
    C -->|"💊 Prescribed medicines"| RX

    A -->|"⭐ Patient rates visit (1-5★)"| U

    C -->|"🚨 Specialist needed"| R
    R -->|"📨 Alert target doctor"| N

    U -.->|"🤝 Peer collaboration"| CNT

    style U fill:#7C4DFF,color:#fff,stroke:#5E35B1,stroke-width:2px
    style INV fill:#536DFE,color:#fff,stroke:#3949AB,stroke-width:2px
    style DS fill:#00B0FF,color:#fff,stroke:#0091EA,stroke-width:2px
    style A fill:#00E676,color:#000,stroke:#00C853,stroke-width:2px
    style N fill:#FFD740,color:#000,stroke:#FFC400,stroke-width:2px
    style C fill:#FF9100,color:#fff,stroke:#FF6D00,stroke-width:2px
    style RX fill:#FF5252,color:#fff,stroke:#D50000,stroke-width:2px
    style R fill:#E040FB,color:#fff,stroke:#AA00FF,stroke-width:2px
    style CNT fill:#00E5FF,color:#000,stroke:#00B8D4,stroke-width:2px
```

<br />

### 🗃️ 2. Comprehensive Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS ||--o{ APPOINTMENTS : "books / receives (patient_id, doctor_id)"
    USERS ||--o{ CONSULTATIONS : "participates (patient_id, doctor_id)"
    USERS ||--o{ NOTIFICATIONS : "receives (user_id)"
    USERS ||--o{ CONTACTS : "manages (user_id, contact_user_id)"
    USERS ||--o{ DOCTOR_STAFF : "links (doctor_id, user_id)"
    USERS ||--o{ INVITATIONS : "sends (invited_by)"
    USERS ||--o{ REFERRALS : "refers / receives (from_doctor_id, to_doctor_id)"
    CONSULTATIONS ||--o{ PRESCRIPTIONS : "contains (consultation_id)"
    APPOINTMENTS ||--o| CONSULTATIONS : "links (appointment_id)"

    USERS {
        int id PK
        varchar name
        varchar email UK
        varchar phone UK
        varchar password
        enum role "patient, doctor, staff"
        varchar specialty
        varchar hospital
        varchar qualifications
        int experience
        varchar address
        varchar locality
        int age
        varchar gender
        varchar blood_group
        decimal rating
        int ratings_count
        boolean is_verified
        text avatar
        timestamp created_at
    }

    APPOINTMENTS {
        int id PK
        int patient_id FK
        int doctor_id FK
        date date
        varchar time_slot
        text reason
        enum status "pending, confirmed, in-progress, critical, completed, cancelled"
        enum payment_status "Paid, Unpaid"
        boolean is_emergency
        text cancellation_reason
        text notes
        int rating
        timestamp created_at
    }

    CONSULTATIONS {
        int id PK
        int patient_id FK
        int doctor_id FK
        int appointment_id FK
        varchar patient_phone
        datetime date
        text diagnosis
        enum category "Cardiology, Dermatology, Neurology, Orthopedics, Pediatrics, General, Oncology, Psychiatry, Other"
        enum status "pending, treated, referred, follow-up"
        int consultation_hour
        text notes
        timestamp created_at
    }

    PRESCRIPTIONS {
        int id PK
        int consultation_id FK
        varchar medicine
        varchar dosage
        varchar duration
    }

    REFERRALS {
        int id PK
        int from_doctor_id FK
        int to_doctor_id FK
        int patient_id FK
        enum priority "low, medium, high, critical"
        enum status "pending, accepted, declined, completed"
        text reason
        text notes
        timestamp created_at
    }

    CONTACTS {
        int id PK
        int user_id FK
        int contact_user_id FK
        varchar nickname
        int trust_level
        timestamp created_at
    }

    INVITATIONS {
        int id PK
        varchar phone
        enum role "doctor, staff"
        int invited_by FK
        varchar token UK
        enum status "pending, accepted"
        datetime expires_at
        timestamp created_at
    }

    DOCTOR_STAFF {
        int id PK
        int doctor_id FK
        int user_id FK
        enum role "doctor, staff"
        enum status "active, inactive"
        timestamp created_at
    }

    NOTIFICATIONS {
        int id PK
        int user_id FK
        varchar type
        varchar title
        text message
        boolean is_read
        timestamp created_at
    }
```

<br />

### 📊 3. Data Lifecycle & Transaction Matrix

| Transaction / Event | Triggered By | Primary Table (Write) | Cascading / Affected Tables | DB Constraints Enforced | Real-Time Side-Effects |
|:---|:---|:---|:---|:---|:---|
| **Patient Registration / Google Login** | Patient | `users` (`INSERT`) | — | `email UK`, `phone UK`, bcrypt hash | Issues JWT Token (`role: patient`) |
| **Doctor Profile Setup** | Doctor | `users` (`UPDATE`) | — | Role verification (`role = 'doctor'`) | Updates discovery filters & cache |
| **Staff Invite & Onboarding** | Doctor / Staff | `invitations` (`INSERT`) | `users` (`INSERT`), `doctor_staff` (`INSERT`) | Crypto UUID `token UK`, `expires_at > NOW()` | Sends Invite Link via Nodemailer |
| **Slot Booking** | Patient / Staff | `appointments` (`INSERT`) | `notifications` (`INSERT`) | `no_double_booking (doctor_id, date, time_slot)` | Socket.IO `appointment:created` alert |
| **Consultation & Rx Creation** | Doctor | `consultations` (`INSERT`) | `prescriptions` (Batch `INSERT`), `appointments` (`UPDATE`) | FK `consultation_id ON DELETE CASCADE` | Live medical records update |
| **Doctor Rating & Review** | Patient | `appointments` (`UPDATE`) | `users` (`UPDATE rating, ratings_count`) | Rating bounds check (`1 <= rating <= 5`) | Updates doctor profile public score |
| **Specialist Referral** | Doctor | `referrals` (`INSERT`) | `notifications` (`INSERT`) | FKs `from_doctor_id`, `to_doctor_id`, `patient_id` | Socket.IO `referral:new` push to specialist |
| **Peer Doctor Contacts** | Doctor | `contacts` (`INSERT`) | — | `no_duplicate_contact (user_id, contact_user_id)` | Populates referral quick-pick list |

<br />

---

<br />

## 📡 API Endpoints

<br />

<details>
<summary><b>🔐 Authentication</b> — <code>/api/auth</code></summary>

<br />

| Method | Endpoint | Auth | Description |
|:---:|:---|:---:|:---|
| `POST` | `/register` | ❌ | Multi-step registration |
| `POST` | `/google` | ❌ | Google OAuth 1-Tap |
| `POST` | `/login` | ❌ | Email/phone + password |
| `POST` | `/forgot-password` | ❌ | Send OTP to email |
| `POST` | `/reset-password` | ❌ | Reset with OTP |
| `PUT` | `/change-password` | 🔒 | Authenticated change |
| `POST` | `/invite` | 🔒 | Generate staff invitation |
| `POST` | `/accept-invitation` | ❌ | Register via token |
| `GET` | `/me` | 🔒 | Current user profile |
| `PUT` | `/profile` | 🔒 | Update profile |

</details>

<details>
<summary><b>📅 Appointments</b> — <code>/api/appointments</code></summary>

<br />

| Method | Endpoint | Auth | Description |
|:---:|:---|:---:|:---|
| `GET` | `/` | 🔒 | List by role |
| `POST` | `/` | 🔒 | Book appointment |
| `GET` | `/patient` | 🔒 | My appointments |
| `GET` | `/slots/:doctorId/:date` | 🔒 | Available slots |
| `PUT` | `/:id/status` | 🔒 | Update status |
| `POST` | `/:id/rate` | 🔒 | Rate doctor |

</details>

<details>
<summary><b>📋 Consultations</b> — <code>/api/consultations</code></summary>

<br />

| Method | Endpoint | Auth | Description |
|:---:|:---|:---:|:---|
| `GET` | `/` | 🔒 | List consultations |
| `POST` | `/` | 🔒 | Create with prescriptions |
| `PUT` | `/:id` | 🔒 | Update consultation |
| `GET` | `/patient/:id` | 🔒 | Patient history |

</details>

<details>
<summary><b>👨‍⚕️ Doctors</b> — <code>/api/doctors</code></summary>

<br />

| Method | Endpoint | Auth | Description |
|:---:|:---|:---:|:---|
| `GET` | `/` | ❌ | Search & filter |
| `GET` | `/:id` | ❌ | Doctor profile |

</details>

<details>
<summary><b>🤝 Referrals</b> — <code>/api/referrals</code></summary>

<br />

| Method | Endpoint | Auth | Description |
|:---:|:---|:---:|:---|
| `GET` | `/` | 🔒 | Sent/received |
| `POST` | `/` | 🔒 | Create referral |
| `PUT` | `/:id/status` | 🔒 | Accept/decline |

</details>

<details>
<summary><b>🔔 Notifications</b> — <code>/api/notifications</code></summary>

<br />

| Method | Endpoint | Auth | Description |
|:---:|:---|:---:|:---|
| `GET` | `/` | 🔒 | Get notifications |
| `PUT` | `/:id/read` | 🔒 | Mark as read |
| `PUT` | `/read-all` | 🔒 | Mark all read |

</details>

<br />

---

<br />

## 📂 Project Structure

```
MedZoo/
├── 📁 frontend/                       # ⚛️ React 19 SPA (Vite 8)
│   ├── public/favicon.svg             # App icon
│   ├── src/
│   │   ├── App.jsx                    # Routes + ProtectedRoute guard
│   │   ├── main.jsx                   # Entry point
│   │   ├── config.js                  # API base URL
│   │   ├── index.css                  # Design system + dark theme
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx        # Auth state + Axios interceptors
│   │   └── components/
│   │       ├── 📁 common/             # Shared (Login, Register, Profile, Navbar...)
│   │       ├── 📁 doctor/             # Dashboard, Appointments, Patients, Referrals
│   │       └── 📁 patient/            # Dashboard, Doctor Discovery + GPS Booking
│   └── vite.config.js
│
├── 📁 backend/                        # 🖥️ Express 5 REST API
│   ├── server.js                      # Express + Socket.IO + HTTP server
│   ├── index.js                       # Vercel serverless entry
│   ├── config/
│   │   ├── db.js                      # MySQL pool + auto-schema init
│   │   └── schema.sql                 # 9 tables DDL
│   ├── middleware/auth.js             # JWT verification
│   ├── routes/                        # auth, appointments, consultations,
│   │                                  # contacts, doctors, notifications, referrals
│   └── utils/
│       ├── notify.js                  # WebSocket notification helper
│       └── mailer.js                  # Nodemailer email service
│
├── vercel.json                        # Vercel services + rewrites
└── README.md
```

<br />

---

<br />

## 🚀 Quick Start

### Prerequisites

```
Node.js ≥ 18  •  MySQL 8.0+  •  npm ≥ 9
```

### Setup

```bash
# 1. Clone
git clone https://github.com/manikant1446/MedZoo.git
cd MedZoo

# 2. Install
cd backend && npm install
cd ../frontend && npm install

# 3. Configure backend/.env
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=medzoo
JWT_SECRET=your_secret
GOOGLE_CLIENT_ID=your_google_client_id
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# 4. Initialize DB (or let auto-init handle it)
mysql -u your_user -p < backend/config/schema.sql

# 5. Start
cd backend && npm run dev     # Port 5001
cd frontend && npm run dev    # Port 5173
```

Open **[http://localhost:5173](http://localhost:5173)** 🎉

<br />

---

<br />

## 🚢 Deployment

Deployed on **Vercel** with Services architecture:

```json
{
  "services": {
    "frontend": { "root": "frontend/", "framework": "vite" },
    "backend":  { "root": "backend/",  "entrypoint": "server.js" }
  }
}
```

```bash
npm i -g vercel && vercel --prod
```

> Set environment variables in **Vercel → Settings → Environment Variables**

<br />

---

<br />

## 🤝 Contributing

```
1. Fork → 2. Branch (feature/xyz) → 3. Commit → 4. Push → 5. Pull Request
```

<br />

## 📄 License

MIT License — free to use, modify, and distribute.

<br />

---

<div align="center">

  <br />

  **Built with ❤️ by [Manikant Kumar](https://github.com/manikant1446)**

  <br />

  [![Live](https://img.shields.io/badge/🌐_Live_Demo-medzoo.vercel.app-00E676?style=for-the-badge)](https://medzoo.vercel.app)
  [![GitHub](https://img.shields.io/badge/⭐_Star_on-GitHub-7C4DFF?style=for-the-badge&logo=github)](https://github.com/manikant1446/MedZoo)

  <br />

  If you found this project useful, please consider giving it a ⭐

  <br />

</div>
