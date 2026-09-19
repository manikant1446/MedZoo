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

## 🔄 How It Works — User Workflow

<br />

### 🧑‍💻 Patient Journey

```mermaid
flowchart LR
    A["🔐 Register / Google Login"] --> B["📋 Complete Health Profile"]
    B --> C["🔍 Discover Doctors"]
    C --> D["📅 Book Appointment"]
    D --> E["📍 Get GPS Directions"]
    E --> F["🏥 Visit Clinic"]
    F --> G["⭐ Rate Doctor"]
    G --> H["📊 View Medical History"]

    style A fill:#7C4DFF,color:#fff,stroke:none
    style B fill:#536DFE,color:#fff,stroke:none
    style C fill:#448AFF,color:#fff,stroke:none
    style D fill:#40C4FF,color:#fff,stroke:none
    style E fill:#18FFFF,color:#000,stroke:none
    style F fill:#00E676,color:#000,stroke:none
    style G fill:#FFD740,color:#000,stroke:none
    style H fill:#FF6D00,color:#fff,stroke:none
```

<br />

### 👨‍⚕️ Doctor Journey

```mermaid
flowchart LR
    A["📩 Accept Invitation"] --> B["🏥 Setup Clinic Profile"]
    B --> C["📅 Manage Appointments"]
    C --> D["📋 Track Consultations"]
    D --> E["💊 Write Prescriptions"]
    E --> F["🤝 Refer to Specialist"]
    F --> G["📊 View Analytics"]
    G --> H["📄 Export PDF Reports"]

    style A fill:#E91E63,color:#fff,stroke:none
    style B fill:#F44336,color:#fff,stroke:none
    style C fill:#FF5722,color:#fff,stroke:none
    style D fill:#FF9800,color:#fff,stroke:none
    style E fill:#FFC107,color:#000,stroke:none
    style F fill:#8BC34A,color:#000,stroke:none
    style G fill:#4CAF50,color:#fff,stroke:none
    style H fill:#009688,color:#fff,stroke:none
```

<br />

### 👩‍💼 Staff Journey

```mermaid
flowchart LR
    A["📩 Doctor Sends Invite"] --> B["🔐 Staff Accepts & Registers"]
    B --> C["🔗 Linked to Doctor"]
    C --> D["📅 Manage Appointments"]
    D --> E["🔔 Real-Time Notifications"]

    style A fill:#7C4DFF,color:#fff,stroke:none
    style B fill:#536DFE,color:#fff,stroke:none
    style C fill:#448AFF,color:#fff,stroke:none
    style D fill:#40C4FF,color:#fff,stroke:none
    style E fill:#00E676,color:#000,stroke:none
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

## 🗄️ Database Design

<br />

```mermaid
erDiagram
    USERS ||--o{ APPOINTMENTS : books
    USERS ||--o{ CONSULTATIONS : has
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ CONTACTS : manages
    USERS ||--o{ DOCTOR_STAFF : employs
    USERS ||--o{ INVITATIONS : sends
    USERS ||--o{ REFERRALS : creates
    CONSULTATIONS ||--o{ PRESCRIPTIONS : contains

    USERS {
        int id PK
        varchar name
        varchar email UK
        varchar phone UK
        varchar password
        enum role
        varchar specialty
        varchar hospital
        int experience
        decimal rating
        int ratings_count
        boolean is_verified
    }

    APPOINTMENTS {
        int id PK
        int patient_id FK
        int doctor_id FK
        date date
        varchar time_slot
        enum status
        int rating
        boolean is_emergency
    }

    CONSULTATIONS {
        int id PK
        int patient_id FK
        int doctor_id FK
        text diagnosis
        enum category
        enum status
        text notes
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
        int from_doctor FK
        int to_doctor FK
        int patient_id FK
        enum priority
        enum status
    }

    NOTIFICATIONS {
        int id PK
        int user_id FK
        varchar type
        varchar title
        text message
        boolean is_read
    }
```

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
