<div align="center">
  <img src="./frontend/public/favicon.svg" alt="MedZoo Logo" width="120" />
  
  <h1>🏥 MedZoo - Smart Healthcare Platform</h1>
  
  <p><strong>A secure, trust-network-based healthcare platform with Node.js, Java Spring Boot, and React.</strong></p>
  <p>
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=springboot&logoColor=white" alt="Spring Boot" />
    <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
    <img src="https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white" alt="Chart.js" />
  </p>
</div>

<br />

MedZoo introduces a powerful social trust network for transparent healthcare collaboration among patients and doctors. Users register securely with their phone numbers and can find doctor recommendations based on where their synced contacts have been successfully treated.

---

## 🔗 Project Live Links

- **Production Live Website**: [https://medzoo.vercel.app/login](https://medzoo.vercel.app/)

---

## ✨ Key Features

### 🧑‍⚕️ For Doctors
| Feature | Description |
| :--- | :--- |
| **📊 Dynamic Analytics** | Real-time insights, patient trends, disease distributions, and peak hour tracking. |
| **📅 Appointment Manager** | Approve, reject, start, complete, or mark appointments as **Critical** (flashing border indicators). |
| **📋 Consultation Tracking** | Form-based consultation creation requiring patient phone number that auto-registers patients. |
| **🤝 Case Referrals** | Refer critical cases to specialist doctors with phone/email lookups and priority tagging. |
| **📄 PDF Generation** | One-click export of patient consultation history into formatted PDF reports using `jsPDF`. |

### 👨‍👩‍👧‍👦 For Patients
| Feature | Description |
| :--- | :--- |
| **🔍 Trust Network Recommendations** | Find trusted doctors via automatic phonebook contact sync matching. |
| **🗓️ Seamless Booking** | View dynamic 30-minute time slots to book appointments instantly. |
| **🩺 Medical Dashboard** | Securely view past diagnoses, consultation history, and manage upcoming appointments. |
| **📱 React Native App** | Mobile app supporting full patient discovery, booking, and doctor panels. |

---

## 🚀 Quick Start (Web App)

Install dependencies and start the Node Express server + React web client:

```bash
# Start backend
cd backend
npm install
npm run dev

# Start frontend
cd ../frontend
npm install
npm run dev
```

---

## ☕ Java Spring Boot Backend (`/backend-java`)
The backend is migrated to a Java Spring Boot stack connecting to MongoDB:
- Requires **Java 17** & **Maven**.
- Run application with: `mvn spring-boot:run` from the `backend-java` folder.
- Configured with Spring Security stateless JWT filter.

---

## 📂 Project Structure

```text
MedZoo/
├── backend/          # Express REST API engine
├── backend-java/     # Spring Boot Java Backend migration module
├── frontend/         # React Web Client (Vite)
└── api/              # Serverless Vercel function routing
```
