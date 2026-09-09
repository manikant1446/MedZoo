const express = require('express');
const bcrypt = require('bcryptjs');
const { protect, doctorOnly } = require('../middleware/auth');
const { query, getPool } = require('../config/db');

const router = express.Router();

/**
 * @route   POST /api/consultations
 * @desc    Create a new consultation (doctor only)
 *          Auto-registers the patient if they don't exist yet
 */
router.post('/', protect, doctorOnly, async (req, res) => {
  try {
    const { patientEmail, patientPhone, patientName, diagnosis, status, category, notes, prescriptions } = req.body;

    if (!patientPhone) {
      return res.status(400).json({ message: 'Patient phone number is required' });
    }

    // Find or auto-register the patient
    let patient = null;

    if (patientEmail) {
      const rows = await query(
        "SELECT * FROM users WHERE email = ? AND role = 'patient'",
        [patientEmail.toLowerCase().trim()]
      );
      if (rows.length) patient = rows[0];
    }

    if (!patient && patientPhone) {
      const rows = await query(
        "SELECT * FROM users WHERE phone = ? AND role = 'patient'",
        [patientPhone.trim()]
      );
      if (rows.length) patient = rows[0];
    }

    if (!patient) {
      // Auto-register new patient
      const name = patientName?.trim() || (patientEmail ? patientEmail.split('@')[0] : `Patient_${patientPhone}`);
      const salt = await bcrypt.genSalt(12);
      const hashedPwd = await bcrypt.hash('password123', salt);

      const [result] = await getPool().execute(
        "INSERT INTO users (email, phone, password, name, role) VALUES (?, ?, ?, ?, 'patient')",
        [
          patientEmail ? patientEmail.toLowerCase().trim() : null,
          patientPhone.trim(),
          hashedPwd,
          name,
        ]
      );
      const rows = await query('SELECT * FROM users WHERE id = ?', [result.insertId]);
      patient = rows[0];
      console.log(`✅ Auto-registered patient: ${name} (${patientPhone})`);
    }

    // Insert consultation
    const [consResult] = await getPool().execute(
      `INSERT INTO consultations (patient_id, doctor_id, patient_phone, diagnosis, status, category, notes, consultation_hour)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        patient.id,
        req.user._id,
        patientPhone.trim(),
        diagnosis || '',
        status || 'pending',
        category || 'General',
        notes || '',
        new Date().getHours()
      ]
    );
    const consultationId = consResult.insertId;

    // Insert prescriptions if any
    if (prescriptions && prescriptions.length > 0) {
      for (const p of prescriptions) {
        await getPool().execute(
          'INSERT INTO prescriptions (consultation_id, medicine, dosage, duration) VALUES (?, ?, ?, ?)',
          [consultationId, p.medicine || '', p.dosage || '', p.duration || '']
        );
      }
    }

    // Return consultation with patient and doctor info (like Mongoose populate)
    const populated = await getConsultationById(consultationId);
    res.status(201).json(populated);
  } catch (error) {
    console.error('Create consultation error:', error);
    res.status(500).json({ message: 'Error creating consultation' });
  }
});

/**
 * @route   GET /api/consultations/doctor
 * @desc    Get all consultations for the logged-in doctor
 */
router.get('/doctor', protect, doctorOnly, async (req, res) => {
  try {
    const consultations = await query(
      `SELECT c.*,
              p.name AS patient_name, p.email AS patient_email, p.phone AS patient_user_phone,
              p.avatar AS patient_avatar, p.address AS patient_address, p.locality AS patient_locality,
              p.wallet_address AS patient_wallet, p.did AS patient_did, p.created_at AS patient_since,
              d.name AS doctor_name, d.email AS doctor_email, d.specialty AS doctor_specialty
       FROM consultations c
       LEFT JOIN users p ON c.patient_id = p.id
       LEFT JOIN users d ON c.doctor_id  = d.id
       WHERE c.doctor_id = ?
       ORDER BY c.date DESC`,
      [req.user._id]
    );

    if (consultations.length > 0) {
      const ids = consultations.map(c => c.id);
      const allPrescriptions = await query(
        `SELECT * FROM prescriptions WHERE consultation_id IN (${ids.map(() => '?').join(',')})`,
        ids
      );
      const prescMap = {};
      allPrescriptions.forEach(p => {
        if (!prescMap[p.consultation_id]) prescMap[p.consultation_id] = [];
        prescMap[p.consultation_id].push(p);
      });
      consultations.forEach(c => {
        c.prescriptions = prescMap[c.id] || [];
      });
    }

    res.json(consultations.map(formatConsultation));
  } catch (error) {
    console.error('Fetch consultations error:', error);
    res.status(500).json({ message: 'Error fetching consultations' });
  }
});

/**
 * @route   GET /api/consultations/patient
 * @desc    Get all consultations for the logged-in patient
 */
router.get('/patient', protect, async (req, res) => {
  try {
    const consultations = await query(
      `SELECT c.*,
              d.name AS doctor_name, d.email AS doctor_email, d.specialty AS doctor_specialty,
              d.hospital AS doctor_hospital, d.qualifications AS doctor_qualifications,
              d.avatar AS doctor_avatar, d.experience AS doctor_experience,
              d.address AS doctor_address, d.locality AS doctor_locality,
              d.rating AS doctor_rating, d.ratings_count AS doctor_ratings_count
       FROM consultations c
       LEFT JOIN users d ON c.doctor_id = d.id
       WHERE c.patient_id = ?
       ORDER BY c.date DESC`,
      [req.user._id]
    );
    res.json(consultations.map(formatConsultation));
  } catch (error) {
    console.error('Fetch patient consultations error:', error);
    res.status(500).json({ message: 'Error fetching consultations' });
  }
});

/**
 * @route   PUT /api/consultations/:id
 * @desc    Update consultation (doctor only)
 */
router.put('/:id', protect, doctorOnly, async (req, res) => {
  try {
    const { diagnosis, status, category, notes, prescriptions } = req.body;

    // Check ownership
    const existing = await query(
      'SELECT id, appointment_id FROM consultations WHERE id = ? AND doctor_id = ?',
      [req.params.id, req.user._id]
    );
    if (!existing.length) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    const fields = [];
    const values = [];
    if (diagnosis  !== undefined) { fields.push('diagnosis = ?');  values.push(diagnosis); }
    if (status     !== undefined) { fields.push('status = ?');     values.push(status); }
    if (category   !== undefined) { fields.push('category = ?');   values.push(category); }
    if (notes      !== undefined) { fields.push('notes = ?');      values.push(notes); }

    if (fields.length) {
      values.push(req.params.id);
      await getPool().execute(`UPDATE consultations SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    // Update prescriptions: delete old, insert new
    if (prescriptions !== undefined) {
      await getPool().execute('DELETE FROM prescriptions WHERE consultation_id = ?', [req.params.id]);
      if (Array.isArray(prescriptions) && prescriptions.length > 0) {
        for (const p of prescriptions) {
          if (p.medicine || p.dosage || p.duration) {
            await getPool().execute(
              'INSERT INTO prescriptions (consultation_id, medicine, dosage, duration) VALUES (?, ?, ?, ?)',
              [req.params.id, p.medicine || '', p.dosage || '', p.duration || '']
            );
          }
        }
      }
    }

    // If linked to an appointment, keep appointment status in sync
    if (existing[0]?.appointment_id && status !== undefined) {
      try {
        if (status === 'treated') {
          await getPool().execute("UPDATE appointments SET status = 'completed' WHERE id = ?", [existing[0].appointment_id]);
        } else if (status === 'pending' || status === 'follow-up') {
          await getPool().execute("UPDATE appointments SET status = 'confirmed' WHERE id = ?", [existing[0].appointment_id]);
        }
      } catch (syncErr) {
        console.error('Error syncing appointment status on consultation update:', syncErr);
      }
    }

    const populated = await getConsultationById(req.params.id);
    res.json(populated);
  } catch (error) {
    console.error('Update consultation error:', error);
    res.status(500).json({ message: 'Error updating consultation' });
  }
});

/**
 * @route   DELETE /api/consultations/:id
 * @desc    Delete consultation (doctor only)
 */
router.delete('/:id', protect, doctorOnly, async (req, res) => {
  try {
    const existing = await query(
      'SELECT id FROM consultations WHERE id = ? AND doctor_id = ?',
      [req.params.id, req.user._id]
    );
    if (!existing.length) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    await getPool().execute('DELETE FROM consultations WHERE id = ?', [req.params.id]);
    res.json({ message: 'Consultation deleted successfully' });
  } catch (error) {
    console.error('Delete consultation error:', error);
    res.status(500).json({ message: 'Error deleting consultation' });
  }
});

/**
 * @route   GET /api/consultations/analytics
 * @desc    Analytics for the doctor's dashboard
 */
router.get('/analytics', protect, doctorOnly, async (req, res) => {
  try {
    const doctorId = req.user._id;

    // Total unique patients
    const totalPatientsRows = await query(
      'SELECT COUNT(DISTINCT patient_id) AS total FROM consultations WHERE doctor_id = ?',
      [doctorId]
    );
    const totalPatients = totalPatientsRows[0].total;

    // Total consultations
    const totalConsRows = await query(
      'SELECT COUNT(*) AS total FROM consultations WHERE doctor_id = ?',
      [doctorId]
    );
    const totalConsultations = totalConsRows[0].total;

    // Status breakdown  →  [{ _id: 'pending', count: 5 }, ...]
    const statusBreakdown = await query(
      'SELECT status AS _id, COUNT(*) AS count FROM consultations WHERE doctor_id = ? GROUP BY status',
      [doctorId]
    );

    // Category breakdown
    const categoryBreakdown = await query(
      'SELECT category AS _id, COUNT(*) AS count FROM consultations WHERE doctor_id = ? GROUP BY category',
      [doctorId]
    );

    // Daily counts — last 30 days
    const dailyCounts = await query(
      `SELECT DATE_FORMAT(date, '%Y-%m-%d') AS _id, COUNT(*) AS count
       FROM consultations
       WHERE doctor_id = ? AND date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE_FORMAT(date, '%Y-%m-%d')
       ORDER BY _id ASC`,
      [doctorId]
    );

    // Hourly breakdown
    const hourlyBreakdown = await query(
      'SELECT consultation_hour AS _id, COUNT(*) AS count FROM consultations WHERE doctor_id = ? GROUP BY consultation_hour ORDER BY _id ASC',
      [doctorId]
    );

    // Weekly counts — last 12 weeks
    const weeklyCounts = await query(
      `SELECT DATE_FORMAT(date, '%Y-W%v') AS _id, COUNT(*) AS count
       FROM consultations
       WHERE doctor_id = ? AND date >= DATE_SUB(NOW(), INTERVAL 84 DAY)
       GROUP BY DATE_FORMAT(date, '%Y-W%v')
       ORDER BY _id ASC`,
      [doctorId]
    );

    res.json({
      totalPatients,
      totalConsultations,
      statusBreakdown,
      categoryBreakdown,
      dailyCounts,
      weeklyCounts,
      hourlyBreakdown
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Error fetching analytics' });
  }
});

/**
 * @route   POST /api/consultations/:id/rate
 * @desc    Submit rating for a doctor after consultation
 */
router.post('/:id/rate', protect, async (req, res) => {
  try {
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const consultations = await query('SELECT * FROM consultations WHERE id = ?', [req.params.id]);
    if (!consultations.length) {
      return res.status(404).json({ message: 'Consultation record not found' });
    }
    const consultation = consultations[0];

    if (consultation.patient_id !== req.user._id) {
      return res.status(403).json({ message: 'Not authorized to rate this consultation' });
    }

    // Update rating on consultation
    await getPool().execute('UPDATE consultations SET rating = ? WHERE id = ?', [Number(rating), req.params.id]);

    // Recalculate doctor's average rating across consultations AND appointments
    const consRatings = await query(
      'SELECT rating FROM consultations WHERE doctor_id = ? AND rating > 0',
      [consultation.doctor_id]
    );
    const apptRatings = await query(
      'SELECT rating FROM appointments WHERE doctor_id = ? AND rating > 0',
      [consultation.doctor_id]
    );

    let totalSum = 0;
    let totalCount = 0;
    [...consRatings, ...apptRatings].forEach(r => { totalSum += r.rating; totalCount++; });

    const average = totalCount > 0 ? Math.round((totalSum / totalCount) * 10) / 10 : 5.0;
    await getPool().execute(
      'UPDATE users SET rating = ?, ratings_count = ? WHERE id = ?',
      [average, totalCount, consultation.doctor_id]
    );

    const populated = await getConsultationById(req.params.id);
    res.json(populated);
  } catch (error) {
    console.error('Rate consultation error:', error);
    res.status(500).json({ message: 'Server error during rating submission' });
  }
});

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────

/** Fetch a single consultation with JOINed patient & doctor data + prescriptions */
async function getConsultationById(id) {
  const rows = await query(
    `SELECT c.*,
            p.name AS patient_name, p.email AS patient_email, p.phone AS patient_user_phone,
            p.avatar AS patient_avatar, p.address AS patient_address, p.locality AS patient_locality,
            p.wallet_address AS patient_wallet, p.did AS patient_did, p.created_at AS patient_since,
            d.name AS doctor_name, d.email AS doctor_email, d.specialty AS doctor_specialty,
            d.rating AS doctor_rating, d.ratings_count AS doctor_ratings_count
     FROM consultations c
     LEFT JOIN users p ON c.patient_id = p.id
     LEFT JOIN users d ON c.doctor_id  = d.id
     WHERE c.id = ?`,
    [id]
  );
  if (!rows.length) return null;
  const prescriptions = await query('SELECT * FROM prescriptions WHERE consultation_id = ?', [id]);
  return formatConsultation({ ...rows[0], prescriptions });
}

/** Shape MySQL row to match the Mongoose-populated shape the frontend expects */
function formatConsultation(row) {
  return {
    _id:           row.id,
    patientId: {
      _id:           row.patient_id,
      name:          row.patient_name,
      email:         row.patient_email,
      phone:         row.patient_user_phone || row.patient_phone,
      avatar:        row.patient_avatar,
      address:       row.patient_address,
      locality:      row.patient_locality,
      walletAddress: row.patient_wallet,
      did:           row.patient_did,
      createdAt:     row.patient_since,
    },
    doctorId: {
      _id:          row.doctor_id,
      name:         row.doctor_name,
      email:        row.doctor_email,
      specialty:    row.doctor_specialty,
      hospital:     row.doctor_hospital,
      qualifications: row.doctor_qualifications,
      avatar:       row.doctor_avatar,
      experience:   row.doctor_experience,
      address:      row.doctor_address,
      locality:     row.doctor_locality,
      rating:       row.doctor_rating,
      ratingsCount: row.doctor_ratings_count,
    },
    patientPhone:      row.patient_user_phone || row.patient_phone,
    date:              row.date,
    diagnosis:         row.diagnosis,
    status:            row.status,
    category:          row.category,
    notes:             row.notes,
    appointmentId:     row.appointment_id,
    referralId:        row.referral_id,
    ipfsCid:           row.ipfs_cid,
    rating:            row.rating,
    consultationHour:  row.consultation_hour,
    prescriptions:     row.prescriptions || [],
    createdAt:         row.created_at,
    updatedAt:         row.updated_at,
  };
}

module.exports = router;
