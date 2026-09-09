const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// MySQL connection pool (replaces Mongoose connection)
let pool = null;

/**
 * Get the MySQL connection pool.
 * Use this in routes: const { query } = require('../config/db');
 */
const getPool = () => {
  if (!pool) throw new Error('Database not initialized. Call connectDB() first.');
  return pool;
};

/**
 * Helper: run a SQL query easily
 * Usage: const rows = await query('SELECT * FROM users WHERE id = ?', [id]);
 */
const query = async (sql, params = []) => {
  const [rows] = await getPool().execute(sql, params);
  return rows;
};

/**
 * Connect to MySQL and initialize the database schema.
 */
const connectDB = async () => {
  try {
    // Create pool
    pool = mysql.createPool({
      host:     process.env.DB_HOST     || 'localhost',
      port:     process.env.DB_PORT     || 3306,
      user:     process.env.DB_USER     || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME     || 'medzoo',
      waitForConnections: true,
      connectionLimit: 10,
      multipleStatements: true  // needed to run schema.sql
    });

    // Test connection
    const conn = await pool.getConnection();
    console.log('✅ MySQL Connected successfully');
    conn.release();

    // Run schema.sql to create tables (safe — uses IF NOT EXISTS)
    await initSchema();

    // Seed demo data if database is empty
    const users = await query('SELECT id FROM users LIMIT 1');
    if (users.length === 0) {
      console.log('📦 Database empty — seeding demo data...');
      await seedDemoData();
    }

  } catch (error) {
    console.error('❌ MySQL Connection Error:', error.message);
    console.error('👉 Please check: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME in your .env file');
    process.exit(1);
  }
};

/**
 * Run schema.sql to create all tables, then create indexes safely
 */
const initSchema = async () => {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    let schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    // Remove standalone CREATE INDEX lines (we handle them separately below)
    schemaSql = schemaSql.replace(/^CREATE INDEX .+;$/gm, '').trim();

    await getPool().query(schemaSql);

    // Create indexes only if they don't exist already
    const indexes = [
      { name: 'idx_consultations_doctor',  table: 'consultations', cols: '(doctor_id)' },
      { name: 'idx_consultations_patient', table: 'consultations', cols: '(patient_id)' },
      { name: 'idx_consultations_status',  table: 'consultations', cols: '(doctor_id, status)' },
      { name: 'idx_consultations_date',    table: 'consultations', cols: '(doctor_id, date)' },
      { name: 'idx_referrals_from',        table: 'referrals',     cols: '(from_doctor_id)' },
      { name: 'idx_referrals_to',          table: 'referrals',     cols: '(to_doctor_id)' },
      { name: 'idx_contacts_user',         table: 'contacts',      cols: '(user_id)' },
    ];

    for (const idx of indexes) {
      const existing = await query(
        `SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?`,
        [process.env.DB_NAME || 'medzoo', idx.table, idx.name]
      );
      if (!existing.length) {
        await getPool().query(`CREATE INDEX ${idx.name} ON ${idx.table} ${idx.cols}`);
      }
    }

    // Ensure appointment_id column exists in consultations
    const colExists = await query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'consultations' AND COLUMN_NAME = 'appointment_id'`,
      [process.env.DB_NAME || 'medzoo']
    );
    if (!colExists.length) {
      await getPool().query('ALTER TABLE consultations ADD COLUMN appointment_id INT NULL');
    }

    // Auto-sync any existing appointments not yet in consultations
    await getPool().query(`
      INSERT INTO consultations (patient_id, doctor_id, patient_phone, date, diagnosis, status, category, notes, consultation_hour, rating, appointment_id)
      SELECT 
        a.patient_id,
        a.doctor_id,
        COALESCE(p.phone, '0000000000'),
        a.date,
        COALESCE(NULLIF(a.reason, ''), 'Appointment Consultation'),
        CASE WHEN a.status = 'completed' THEN 'treated' ELSE 'pending' END,
        COALESCE(NULLIF(d.specialty, ''), 'General'),
        CONCAT('Booked via appointments for ', a.time_slot, '. Reason: ', COALESCE(a.reason, 'N/A')),
        12,
        a.rating,
        a.id
      FROM appointments a
      JOIN users p ON a.patient_id = p.id
      JOIN users d ON a.doctor_id = d.id
      WHERE a.status != 'cancelled'
        AND a.id NOT IN (SELECT appointment_id FROM consultations WHERE appointment_id IS NOT NULL)
    `);

    // Ensure referral_id column exists in consultations
    const refColExists = await query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'consultations' AND COLUMN_NAME = 'referral_id'`,
      [process.env.DB_NAME || 'medzoo']
    );
    if (!refColExists.length) {
      await getPool().query('ALTER TABLE consultations ADD COLUMN referral_id INT NULL');
    }

    // Auto-sync any existing referrals not yet in consultations
    await getPool().query(`
      INSERT INTO consultations (patient_id, doctor_id, patient_phone, date, diagnosis, status, category, notes, consultation_hour, referral_id)
      SELECT 
        r.patient_id,
        r.to_doctor_id,
        COALESCE(p.phone, '0000000000'),
        r.created_at,
        COALESCE(NULLIF(r.reason, ''), 'Referral Consultation'),
        CASE WHEN r.status = 'completed' THEN 'treated' ELSE 'referred' END,
        COALESCE(NULLIF(td.specialty, ''), 'General'),
        CONCAT('Referred by Dr. ', fd.name, ' (Priority: ', r.priority, '). Notes: ', COALESCE(r.notes, 'N/A')),
        HOUR(r.created_at),
        r.id
      FROM referrals r
      JOIN users p ON r.patient_id = p.id
      JOIN users fd ON r.from_doctor_id = fd.id
      JOIN users td ON r.to_doctor_id = td.id
      WHERE r.status != 'declined'
        AND r.id NOT IN (SELECT referral_id FROM consultations WHERE referral_id IS NOT NULL)
    `);

    console.log('✅ Database schema initialized (tables ready)');
  } catch (err) {
    console.error('❌ Schema initialization error:', err.message);
    throw err;
  }
};

/**
 * Seed demo doctors, patients, and consultations for testing
 */
const seedDemoData = async () => {
  const saltRounds = 12;
  const hashedPwd = await bcrypt.hash('password123', saltRounds);

  // Create demo doctor 1 — Sarah Johnson (Cardiology)
  const [doc1Result] = await getPool().execute(
    `INSERT INTO users (name, email, phone, password, role, specialty, hospital, qualifications, is_verified)
     VALUES (?, ?, ?, ?, 'doctor', ?, ?, ?, 1)`,
    ['Sarah Johnson', 'doctor@medzoo.com', '9000000001', hashedPwd, 'Cardiology', 'City Heart Center', 'MD, DM Cardiology']
  );
  const doctorId1 = doc1Result.insertId;

  // Create demo doctor 2 — Michael Chen (Neurology)
  const [doc2Result] = await getPool().execute(
    `INSERT INTO users (name, email, phone, password, role, specialty, hospital, qualifications, is_verified)
     VALUES (?, ?, ?, ?, 'doctor', ?, ?, ?, 1)`,
    ['Michael Chen', 'neurologist@medzoo.com', '9000000002', hashedPwd, 'Neurology', 'Metro Brain Institute', 'MD, DM Neurology']
  );
  const doctorId2 = doc2Result.insertId;

  // Create demo patient 1 — Alex Thompson
  const [p1Result] = await getPool().execute(
    `INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, 'patient')`,
    ['Alex Thompson', 'patient@medzoo.com', '9111111001', hashedPwd]
  );
  const patientId1 = p1Result.insertId;

  // Create demo patient 2 — Priya Sharma
  const [p2Result] = await getPool().execute(
    `INSERT INTO users (name, phone, password, role) VALUES (?, ?, ?, 'patient')`,
    ['Priya Sharma', '9111111002', hashedPwd]
  );
  const patientId2 = p2Result.insertId;

  // Create demo patient 3 — Rahul Verma
  const [p3Result] = await getPool().execute(
    `INSERT INTO users (name, phone, password, role) VALUES (?, ?, ?, 'patient')`,
    ['Rahul Verma', '9111111003', hashedPwd]
  );
  const patientId3 = p3Result.insertId;

  // Create 35 demo consultations
  const patients   = [patientId1, patientId2, patientId3];
  const phones     = ['9111111001', '9111111002', '9111111003'];
  const doctors    = [doctorId1, doctorId2];
  const categories = ['Cardiology', 'General', 'Neurology', 'Dermatology', 'Orthopedics'];
  const statuses   = ['treated', 'treated', 'treated', 'pending', 'follow-up'];
  const diagnoses  = [
    'Mild hypertension', 'Routine checkup', 'Tension headache',
    'Skin rash evaluation', 'Joint pain assessment'
  ];

  for (let i = 0; i < 35; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    const dateStr = date.toISOString().slice(0, 19).replace('T', ' ');

    await getPool().execute(
      `INSERT INTO consultations 
       (patient_id, doctor_id, patient_phone, date, diagnosis, status, category, notes, consultation_hour)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        patients[i % patients.length],
        doctors[i % doctors.length],
        phones[i % phones.length],
        dateStr,
        diagnoses[i % diagnoses.length],
        statuses[i % statuses.length],
        categories[i % categories.length],
        `Consultation note #${i + 1}`,
        8 + Math.floor(Math.random() * 10)
      ]
    );
  }

  console.log('✅ Demo data seeded:');
  console.log('   Doctors:  doctor@medzoo.com (📞 9000000001) | neurologist@medzoo.com (📞 9000000002)');
  console.log('   Patients: patient@medzoo.com (📞 9111111001) | 📞 9111111002 | 📞 9111111003');
  console.log('   Password: password123 (all accounts)');
  console.log('   Login: use phone number OR email');
};

module.exports = { connectDB, query, getPool };