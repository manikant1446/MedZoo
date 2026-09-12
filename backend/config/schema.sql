-- MedZoo MySQL Database Schema
-- Run this once: mysql -u manikant1446 -p medzoo < schema.sql

CREATE DATABASE IF NOT EXISTS medzoo;
USE medzoo;

CREATE TABLE IF NOT EXISTS users (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(255) NOT NULL,
  email           VARCHAR(255) UNIQUE DEFAULT NULL,
  phone           VARCHAR(20)  UNIQUE DEFAULT NULL,
  password        VARCHAR(255) NOT NULL,
  role            ENUM('patient', 'doctor', 'staff') NOT NULL DEFAULT 'patient',
  specialty       VARCHAR(255) DEFAULT '',
  hospital        VARCHAR(255) DEFAULT '',
  qualifications  VARCHAR(255) DEFAULT '',
  experience      INT          DEFAULT 0,
  address         VARCHAR(500) DEFAULT '',
  locality        VARCHAR(255) DEFAULT '',
  age             INT          DEFAULT NULL,
  gender          VARCHAR(20)  DEFAULT '',
  blood_group     VARCHAR(10)  DEFAULT '',
  rating          DECIMAL(3,1) DEFAULT 5.0,
  ratings_count   INT          DEFAULT 0,
  is_verified     TINYINT(1)   DEFAULT 0,
  avatar          TEXT,
  created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS consultations (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  patient_id          INT NOT NULL,
  doctor_id           INT NOT NULL,
  patient_phone       VARCHAR(20) NOT NULL,
  date                DATETIME   DEFAULT CURRENT_TIMESTAMP,
  diagnosis           TEXT,
  status              ENUM('pending','treated','referred','follow-up') DEFAULT 'pending',
  category            ENUM('Cardiology','Dermatology','Neurology','Orthopedics','Pediatrics','General','Oncology','Psychiatry','Other') DEFAULT 'General',
  notes               TEXT,

  rating              INT        DEFAULT 0,
  consultation_hour   TINYINT    DEFAULT NULL,
  appointment_id      INT        DEFAULT NULL,
  referral_id         INT        DEFAULT NULL,
  created_at          TIMESTAMP  DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP  DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id)  REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_consultations_doctor  ON consultations(doctor_id);
CREATE INDEX idx_consultations_patient ON consultations(patient_id);
CREATE INDEX idx_consultations_status  ON consultations(doctor_id, status);
CREATE INDEX idx_consultations_date    ON consultations(doctor_id, date);

CREATE TABLE IF NOT EXISTS prescriptions (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  consultation_id INT NOT NULL,
  medicine        VARCHAR(255),
  dosage          VARCHAR(255),
  duration        VARCHAR(255),
  FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS appointments (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  patient_id          INT NOT NULL,
  doctor_id           INT NOT NULL,
  date                DATE NOT NULL,
  time_slot           VARCHAR(50) NOT NULL,
  reason              TEXT,
  status              ENUM('pending','confirmed','in-progress','critical','completed','cancelled') DEFAULT 'pending',
  payment_status      ENUM('Paid','Unpaid') DEFAULT 'Unpaid',
  is_emergency        TINYINT(1)  DEFAULT 0,
  cancellation_reason TEXT,
  notes               TEXT,
  rating              INT         DEFAULT 0,
  created_at          TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP   DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id)  REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY no_double_booking (doctor_id, date, time_slot)
);

CREATE TABLE IF NOT EXISTS referrals (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  from_doctor_id  INT NOT NULL,
  to_doctor_id    INT NOT NULL,
  patient_id      INT NOT NULL,
  reason          TEXT NOT NULL,
  notes           TEXT,
  status          ENUM('pending','accepted','declined','completed') DEFAULT 'pending',
  priority        ENUM('low','medium','high','critical') DEFAULT 'medium',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (from_doctor_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (to_doctor_id)   REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id)     REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_referrals_from ON referrals(from_doctor_id);
CREATE INDEX idx_referrals_to   ON referrals(to_doctor_id);

CREATE TABLE IF NOT EXISTS contacts (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  contact_user_id INT NOT NULL,
  nickname        VARCHAR(255) DEFAULT '',
  trust_level     TINYINT DEFAULT 3,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)         REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY no_duplicate_contact (user_id, contact_user_id)
);

CREATE INDEX idx_contacts_user ON contacts(user_id);

CREATE TABLE IF NOT EXISTS invitations (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  phone       VARCHAR(20) NOT NULL,
  role        ENUM('doctor','staff') NOT NULL,
  invited_by  INT NOT NULL,
  token       VARCHAR(255) NOT NULL UNIQUE,
  status      ENUM('pending','accepted') DEFAULT 'pending',
  expires_at  DATETIME NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS doctor_staff (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  doctor_id   INT NOT NULL,
  user_id     INT NOT NULL,
  role        ENUM('doctor','staff') DEFAULT 'staff',
  status      ENUM('active','inactive') DEFAULT 'active',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)   REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_doctor_staff (doctor_id, user_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  type        VARCHAR(50) NOT NULL DEFAULT 'general',
  title       VARCHAR(255) NOT NULL,
  message     TEXT NOT NULL,
  data        JSON DEFAULT NULL,
  is_read     TINYINT(1) DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at);

