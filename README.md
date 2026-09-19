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

## 🔄 How It Works — 2D Dynamic Workflows & Data Flow

<br />

### 🧑‍💻 1. Patient Journey — End-to-End Data Flow

```mermaid
flowchart TD
    subgraph CLIENT ["📱 Patient Client (React SPA)"]
        P_AUTH["1️⃣ Authentication<br/>Google 1-Tap OAuth or Email/Password"]
        P_SEARCH["2️⃣ Doctor Discovery<br/>Filter Specialty, Name, Locality"]
        P_SLOTS["3️⃣ Slot Picker<br/>Query 30-min live availability"]
        P_BOOK["4️⃣ Book Appointment<br/>Reason, notes, emergency flag"]
        P_GPS["5️⃣ Clinic Directions<br/>Geolocation API lat/lng coordinates"]
        P_RATE["6️⃣ Rate & Review<br/>1 to 5 star rating post-consultation"]
        P_HIST["7️⃣ Medical History<br/>Digital Rx, diagnoses, PDFs"]
    end

    subgraph API ["⚡ Express.js API Gateway"]
        E_AUTH["POST /api/auth/google<br/>POST /api/auth/login"]
        E_DOCS["GET /api/doctors?specialty=..."]
        E_SLOTS["GET /api/appointments/slots/:id/:date"]
        E_BOOK["POST /api/appointments"]
        E_RATE["POST /api/appointments/:id/rate"]
        E_HIST["GET /api/consultations/patient/:id"]
    end

    subgraph DB ["🗄️ MySQL Database Engine"]
        T_USERS[("users<br/>id, name, email, role, rating")]
        T_APPTS[("appointments<br/>UNIQUE(doctor_id, date, time_slot)<br/>status: pending / confirmed")]
        T_CONS[("consultations<br/>diagnosis, category, notes")]
        T_RX[("prescriptions<br/>medicine, dosage, duration")]
        T_NOTIF[("notifications<br/>user_id, type, message, is_read")]
    end

    subgraph SERVICES ["🌐 Real-Time & External APIs"]
        S_GOOGLE["Google OAuth 2.0 API<br/>Token verification"]
        S_MAPS["Google Maps Navigation<br/>Origin: GPS ➔ Destination: Clinic"]
        S_WS["Socket.IO Server<br/>Event: appointment:created"]
    end

    %% Step 1: Auth
    P_AUTH -->|"Send Google Token / Credentials"| E_AUTH
    E_AUTH <-->|"Verify ID Token"| S_GOOGLE
    E_AUTH <-->|"SELECT / INSERT user"| T_USERS
    E_AUTH -->|"Return JWT + User Profile"| P_AUTH

    %% Step 2: Discovery
    P_SEARCH -->|"Query: ?specialty=Cardiology"| E_DOCS
    E_DOCS <-->|"SELECT * FROM users WHERE role='doctor'"| T_USERS
    E_DOCS -->|"Doctor Profiles, Hospital, Avg Rating"| P_SEARCH

    %% Step 3: Slots
    P_SEARCH --> P_SLOTS
    P_SLOTS -->|"Req: doctorId + selectedDate"| E_SLOTS
    E_SLOTS <-->|"SELECT time_slot FROM appointments WHERE date=?"| T_APPTS
    E_SLOTS -->|"16 slots array [available: true/false]"| P_SLOTS

    %% Step 4: Booking
    P_SLOTS --> P_BOOK
    P_BOOK -->|"Payload: { doctorId, date, timeSlot, isEmergency }"| E_BOOK
    E_BOOK -->|"INSERT INTO appointments"| T_APPTS
    E_BOOK -->|"INSERT INTO notifications"| T_NOTIF
    E_BOOK ==>|"Emit 'appointment:created'"| S_WS
    S_WS -.->|"Push Real-Time Alert to Doctor & Staff"| CLIENT

    %% Step 5: GPS Navigation
    P_BOOK --> P_GPS
    P_GPS -->|"navigator.geolocation.getCurrentPosition()"| S_MAPS
    S_MAPS -->|"Open Directions: user lat,lng ➔ clinic address"| P_GPS

    %% Step 6: Rating
    P_GPS --> P_RATE
    P_RATE -->|"Payload: { rating: 5 }"| E_RATE
    E_RATE -->|"UPDATE appointments SET rating = 5"| T_APPTS
    E_RATE -->|"Recalculate users.rating & ratings_count"| T_USERS

    %% Step 7: History & Rx
    P_HIST -->|"Fetch Patient Consultations"| E_HIST
    E_HIST <-->|"SELECT consultations JOIN prescriptions"| T_CONS
    T_CONS -.->|"Include Rx Items"| T_RX
    E_HIST -->|"Structured Medical Records & Rx History"| P_HIST

    %% Visual Styling
    style CLIENT fill:#0d1b2a,color:#e0e1dd,stroke:#415a77,stroke-width:2px
    style API fill:#1b263b,color:#e0e1dd,stroke:#778da9,stroke-width:2px
    style DB fill:#0f2a1d,color:#e0e1dd,stroke:#2a9d8f,stroke-width:2px
    style SERVICES fill:#2b1055,color:#e0e1dd,stroke:#9d4edd,stroke-width:2px
```

<br />

### 👨‍⚕️ 2. Doctor Journey — Clinical & Management Workflow

```mermaid
flowchart TD
    subgraph CLINIC_UI ["👨‍⚕️ Doctor Web Dashboard"]
        D_PROF["1️⃣ Profile Setup<br/>Specialty, Hospital, Qualifications, Address"]
        D_NOTIF["2️⃣ Real-time Alerts<br/>Audio notification & badge update"]
        D_QUEUE["3️⃣ Live Appointment Queue<br/>Filter today's patients & emergency cases"]
        D_DECIDE{"4️⃣ Clinical Decision"}
        D_TREAT["5️⃣ Rx & Consultation<br/>Diagnosis, category, digital prescription"]
        D_REF["6️⃣ Case Referral<br/>Refer to specialist with priority tag"]
        D_STAFF["7️⃣ Clinic Staff Invites<br/>Generate token & delegate queue"]
        D_STATS["8️⃣ Analytics Studio<br/>Patient trends, disease breakdown, peak hours"]
    end

    subgraph API_GATEWAY ["⚡ Backend Services & Middleware"]
        B_PROF["PUT /api/auth/profile"]
        B_APPTS["GET /api/appointments<br/>PUT /api/appointments/:id/status"]
        B_CONS["POST /api/consultations<br/>Atomic consultation + Rx builder"]
        B_REF["POST /api/referrals"]
        B_INV["POST /api/auth/invite"]
        B_STATS["GET /api/consultations/analytics"]
    end

    subgraph MYSQL ["🗄️ MySQL Database Engine"]
        M_USERS[("users<br/>Doctor info, experience, ratings")]
        M_APPTS[("appointments<br/>status: in-progress / completed / cancelled")]
        M_CONS[("consultations<br/>diagnosis, category, notes, consultation_hour")]
        M_RX[("prescriptions<br/>medicine, dosage, duration")]
        M_REF[("referrals<br/>from_doctor_id, to_doctor_id, priority")]
        M_INV[("invitations<br/>phone, token, role='staff', expires_at")]
    end

    subgraph REALTIME_SVC ["📡 WebSocket & Notification Hub"]
        WS_HUB["Socket.IO Server<br/>Rooms: doctor_{id}"]
        MAIL_HUB["Nodemailer (Gmail SMTP)<br/>Staff invite links & OTP delivery"]
    end

    %% Doctor Profile
    D_PROF -->|"Submit Clinic Profile & Address"| B_PROF
    B_PROF -->|"UPDATE users SET hospital, specialty, locality"| M_USERS

    %% Realtime Reception
    WS_HUB -.->|"appointment:created event"| D_NOTIF
    D_NOTIF --> D_QUEUE
    D_QUEUE <-->|"GET /api/appointments?date=today"| B_APPTS
    B_APPTS <-->|"SELECT * FROM appointments WHERE doctor_id=?"| M_APPTS

    %% Queue Handling & Decision
    D_QUEUE --> D_DECIDE
    D_DECIDE -->|"Begin Consultation"| D_TREAT
    D_DECIDE -->|"Refer to Specialist"| D_REF
    D_DECIDE -->|"Status: In-Progress / Cancelled"| B_APPTS

    %% Consultation & Prescription Creation
    D_TREAT -->|"Payload: { patientPhone, diagnosis, category, notes, prescriptions[] }"| B_CONS
    B_CONS -->|"INSERT INTO consultations (auto-registers new patient if needed)"| M_CONS
    B_CONS -->|"Batch INSERT INTO prescriptions"| M_RX
    B_CONS -->|"Sync appointment status = 'completed'"| M_APPTS

    %% Referral Workflow
    D_REF -->|"Payload: { toDoctorId, patientId, priority: 'critical', reason }"| B_REF
    B_REF -->|"INSERT INTO referrals"| M_REF
    B_REF ==>|"Emit 'referral:new' to target doctor"| WS_HUB

    %% Staff Invitation
    D_STAFF -->|"Payload: { phone, role: 'staff' }"| B_INV
    B_INV -->|"Generate crypto token ➔ INSERT INTO invitations"| M_INV
    B_INV -->|"Send Invite URL with token"| MAIL_HUB

    %% Analytics
    D_STATS -->|"Fetch Aggregated Metrics"| B_STATS
    B_STATS <-->|"SELECT COUNT(*), category, consultation_hour FROM consultations"| M_CONS
    B_STATS -->|"Chart.js datasets (Trends line, Disease pie, Hourly bar)"| D_STATS

    %% Styling
    style CLINIC_UI fill:#1a001a,color:#f3e8ff,stroke:#a855f7,stroke-width:2px
    style API_GATEWAY fill:#1b263b,color:#e0e1dd,stroke:#778da9,stroke-width:2px
    style MYSQL fill:#0f2a1d,color:#e0e1dd,stroke:#2a9d8f,stroke-width:2px
    style REALTIME_SVC fill:#2b1055,color:#e0e1dd,stroke:#ec4899,stroke-width:2px
```

<br />

### 👩‍💼 3. Staff Journey — Reception & Operations Workflow

```mermaid
flowchart TD
    subgraph STAFF_PORTAL ["👩‍💼 Staff / Receptionist Desk"]
        S_TOKEN["1️⃣ Receive Invite Link<br/>Secure link with one-time token"]
        S_REGISTER["2️⃣ Accept & Register<br/>Set staff credentials & profile"]
        S_LOGIN["3️⃣ Staff Session<br/>Scoped automatically to assigned doctor"]
        S_QUEUE["4️⃣ Daily Reception Queue<br/>View doctor's upcoming schedule & check-ins"]
        S_ACTION{"5️⃣ Desk Action"}
        S_STATUS["6️⃣ Check-In Patient<br/>Update status: 'confirmed' ➔ 'in-progress'"]
        S_BILL["7️⃣ Payment Collection<br/>Toggle payment: 'Unpaid' ➔ 'Paid'"]
        S_URGENT["8️⃣ Emergency Walk-In<br/>Instant booking with emergency flag"]
    end

    subgraph API_SERVER ["⚡ Backend Verification & RBAC"]
        V_INV["POST /api/auth/accept-invitation<br/>Verify token validity & expiry"]
        V_LOGIN["POST /api/auth/login<br/>doctorOrStaff middleware verification"]
        V_APPTS["GET /api/appointments<br/>Scoped by staff-doctor relation"]
        V_UPDATE["PUT /api/appointments/:id/status<br/>Permission check via canManageAppointment"]
        V_EMERG["POST /api/appointments<br/>Walk-in bypass with isEmergency=true"]
    end

    subgraph DATABASE_STORE ["🗄️ MySQL Database Engine"]
        DB_INV[("invitations<br/>token, status: 'accepted', expires_at")]
        DB_USERS[("users<br/>role: 'staff', assigned hospital")]
        DB_DOCSTAFF[("doctor_staff<br/>doctor_id, user_id (staff), status: 'active'")]
        DB_APPTS[("appointments<br/>status, payment_status, is_emergency")]
        DB_NOTIF[("notifications<br/>Alerts to doctor dashboard")]
    end

    subgraph REALTIME_SOCKET ["📡 Socket.IO Real-Time Synchronization"]
        WS_SYNC["WebSocket Server<br/>Syncs receptionist desk with doctor room"]
    end

    %% Onboarding Flow
    S_TOKEN -->|"Submit Invitation Token + Password"| V_INV
    V_INV <-->|"Validate token status='pending' AND expires_at > NOW()"| DB_INV
    V_INV -->|"INSERT INTO users (role='staff')"| DB_USERS
    V_INV -->|"INSERT INTO doctor_staff (doctor_id, user_id)"| DB_DOCSTAFF
    V_INV -->|"UPDATE invitations SET status='accepted'"| DB_INV
    V_INV --> S_REGISTER

    %% Login & Doctor Linkage
    S_REGISTER --> S_LOGIN
    S_LOGIN -->|"Send Staff Credentials"| V_LOGIN
    V_LOGIN <-->|"SELECT users JOIN doctor_staff ON doctor_staff.user_id = users.id"| DB_DOCSTAFF
    V_LOGIN -->|"Issue JWT with role='staff' + doctorId association"| S_LOGIN

    %% Queue Monitoring
    S_LOGIN --> S_QUEUE
    S_QUEUE <-->|"GET /api/appointments for assigned doctor"| V_APPTS
    V_APPTS <-->|"SELECT * FROM appointments WHERE doctor_id = :assignedDoctor"| DB_APPTS
    WS_SYNC -.->|"Push live updates on new bookings / cancellations"| S_QUEUE

    %% Desk Actions
    S_QUEUE --> S_ACTION
    S_ACTION --> S_STATUS
    S_ACTION --> S_BILL
    S_ACTION --> S_URGENT

    %% Status Update
    S_STATUS -->|"status: 'in-progress'"| V_UPDATE
    S_BILL -->|"payment_status: 'Paid'"| V_UPDATE
    V_UPDATE -->|"UPDATE appointments SET status=?, payment_status=?"| DB_APPTS
    V_UPDATE ==>|"Emit queue change to Doctor screen"| WS_SYNC

    %% Emergency Walk-In
    S_URGENT -->|"Payload: { patientPhone, date: today, timeSlot, isEmergency: true }"| V_EMERG
    V_EMERG -->|"INSERT INTO appointments (is_emergency=1, status='confirmed')"| DB_APPTS
    V_EMERG -->|"INSERT INTO notifications (EMERGENCY ALERT)"| DB_NOTIF
    V_EMERG ==>|"High-priority audio/visual alert to Doctor"| WS_SYNC

    %% Styling
    style STAFF_PORTAL fill:#0c1821,color:#e0e1dd,stroke:#3282b8,stroke-width:2px
    style API_SERVER fill:#1b263b,color:#e0e1dd,stroke:#778da9,stroke-width:2px
    style DATABASE_STORE fill:#0f2a1d,color:#e0e1dd,stroke:#2a9d8f,stroke-width:2px
    style REALTIME_SOCKET fill:#2b1055,color:#e0e1dd,stroke:#00b4d8,stroke-width:2px
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

## 🗄️ Database Design & 2D Dynamic Data Flow

<br />

### 🔄 1. 2D Dynamic Database Architecture & Data Flow Diagram

```mermaid
flowchart TD
    subgraph ACTORS ["👥 System Actors & Clients"]
        ACT_PATIENT["🧑‍💻 Patient Client"]
        ACT_DOCTOR["👨‍⚕️ Doctor Portal"]
        ACT_STAFF["👩‍💼 Staff / Receptionist Desk"]
    end

    subgraph IDENTITY_ACCESS ["🔐 Identity, Linking & Network Entities"]
        TBL_USERS[("users<br/>PK: id | UK: email, phone<br/>role: 'patient'|'doctor'|'staff'<br/>rating, specialty, hospital, address")]
        TBL_INV[("invitations<br/>PK: id | UK: token<br/>FK: invited_by ➔ users.id<br/>status: 'pending'|'accepted'")]
        TBL_DOCSTAFF[("doctor_staff<br/>PK: id<br/>FK: doctor_id ➔ users.id<br/>FK: user_id ➔ users.id<br/>UK: (doctor_id, user_id)")]
        TBL_CONTACTS[("contacts<br/>PK: id<br/>FK: user_id ➔ users.id<br/>FK: contact_user_id ➔ users.id<br/>UK: (user_id, contact_user_id)")]
    end

    subgraph BOOKING_SCHEDULING ["📅 Scheduling & Appointment Engine"]
        TBL_APPTS[("appointments<br/>PK: id<br/>FK: patient_id ➔ users.id<br/>FK: doctor_id ➔ users.id<br/>UK: (doctor_id, date, time_slot)<br/>status: pending|confirmed|in-progress|completed|cancelled<br/>payment_status: Paid|Unpaid<br/>rating: 0-5")]
    end

    subgraph CLINICAL_RECORDS ["📋 Clinical & Prescription Pipeline"]
        TBL_CONS[("consultations<br/>PK: id<br/>FK: patient_id ➔ users.id<br/>FK: doctor_id ➔ users.id<br/>FK: appointment_id ➔ appointments.id<br/>category, diagnosis, notes, consultation_hour")]
        TBL_RX[("prescriptions<br/>PK: id<br/>FK: consultation_id ➔ consultations.id<br/>medicine, dosage, duration")]
    end

    subgraph NETWORK_REFERRAL ["🤝 Inter-Doctor Referrals"]
        TBL_REF[("referrals<br/>PK: id<br/>FK: from_doctor_id ➔ users.id<br/>FK: to_doctor_id ➔ users.id<br/>FK: patient_id ➔ users.id<br/>priority: low|medium|high|critical<br/>status: pending|accepted|declined|completed")]
    end

    subgraph REALTIME_ALERTS ["🔔 Notification & Event Stream"]
        TBL_NOTIF[("notifications<br/>PK: id<br/>FK: user_id ➔ users.id<br/>type, title, message, is_read")]
    end

    %% Actor write operations
    ACT_PATIENT -->|"1️⃣ Register / OAuth<br/>[INSERT INTO users role='patient']"| TBL_USERS
    ACT_DOCTOR -->|"1️⃣ Clinic Setup<br/>[UPDATE users SET hospital, specialty]"| TBL_USERS
    ACT_DOCTOR -->|"Generate Staff Token<br/>[INSERT INTO invitations]"| TBL_INV
    ACT_STAFF -->|"Accept Token & Link Staff<br/>[INSERT INTO doctor_staff]"| TBL_DOCSTAFF
    TBL_INV -.->|"Validates Token & Expiry"| TBL_DOCSTAFF

    %% Appointment Flow
    ACT_PATIENT -->|"2️⃣ Book 30-min Slot<br/>[INSERT INTO appointments status='pending']"| TBL_APPTS
    ACT_STAFF -->|"Check-in / Walk-in<br/>[UPDATE status / INSERT is_emergency]"| TBL_APPTS
    TBL_APPTS ==>|"Trigger Booking Alert<br/>[INSERT INTO notifications]"| TBL_NOTIF
    TBL_NOTIF -.->|"Push WebSocket Alert"| ACT_DOCTOR
    TBL_NOTIF -.->|"Push WebSocket Alert"| ACT_STAFF

    %% Clinical Flow
    ACT_DOCTOR -->|"3️⃣ Record Treatment<br/>[INSERT INTO consultations]"| TBL_CONS
    TBL_APPTS -->|"Link via appointment_id<br/>[UPDATE status='completed']"| TBL_CONS
    TBL_CONS ==>|"Cascade Rx Items<br/>[Batch INSERT INTO prescriptions]"| TBL_RX

    %% Rating Recalculation Flow
    ACT_PATIENT -->|"4️⃣ Submit 1-5 Star Review<br/>[UPDATE appointments.rating = 5]"| TBL_APPTS
    TBL_APPTS ==>|"Recalculate Weighted Average<br/>[UPDATE users SET rating, ratings_count]"| TBL_USERS

    %% Referral Network Flow
    ACT_DOCTOR -->|"5️⃣ Specialist Referral<br/>[INSERT INTO referrals priority='critical']"| TBL_REF
    TBL_REF ==>|"Notify Target Specialist<br/>[INSERT INTO notifications]"| TBL_NOTIF
    TBL_REF -.->|"Access Shared Medical Records<br/>[SELECT FROM consultations]"| TBL_CONS

    %% Contacts Network
    ACT_DOCTOR -.->|"Save Trusted Peer Doctor<br/>[INSERT INTO contacts]"| TBL_CONTACTS

    %% Custom Styles
    style ACTORS fill:#1a1a2e,color:#e0e0e0,stroke:#7C4DFF,stroke-width:2px
    style IDENTITY_ACCESS fill:#0d1b2a,color:#e0e1dd,stroke:#415a77,stroke-width:2px
    style BOOKING_SCHEDULING fill:#0f2a1d,color:#e0e1dd,stroke:#2a9d8f,stroke-width:2px
    style CLINICAL_RECORDS fill:#1a001a,color:#f3e8ff,stroke:#a855f7,stroke-width:2px
    style NETWORK_REFERRAL fill:#2b1055,color:#e0e1dd,stroke:#ec4899,stroke-width:2px
    style REALTIME_ALERTS fill:#0c1821,color:#e0e1dd,stroke:#00b4d8,stroke-width:2px
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
