const express = require('express');
const { protect, doctorOnly } = require('../middleware/auth');
const { query, getPool } = require('../config/db');

const router = express.Router();

// Helper: format referral row to match frontend shape
function formatReferral(row) {
  return {
    _id:    row.id,
    fromDoctorId: {
      _id:       row.from_doctor_id,
      name:      row.from_doctor_name,
      email:     row.from_doctor_email,
      phone:     row.from_doctor_phone,
      specialty: row.from_doctor_specialty,
      hospital:  row.from_doctor_hospital,
    },
    toDoctorId: {
      _id:       row.to_doctor_id,
      name:      row.to_doctor_name,
      email:     row.to_doctor_email,
      phone:     row.to_doctor_phone,
      specialty: row.to_doctor_specialty,
      hospital:  row.to_doctor_hospital,
    },
    patientId: {
      _id:   row.patient_id,
      name:  row.patient_name,
      email: row.patient_email,
      phone: row.patient_phone_num,
    },
    reason:    row.reason,
    notes:     row.notes,
    status:    row.status,
    priority:  row.priority,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const REFERRAL_JOIN = `
  SELECT r.*,
         fd.name      AS from_doctor_name,  fd.email AS from_doctor_email,
         fd.phone     AS from_doctor_phone, fd.specialty AS from_doctor_specialty,
         fd.hospital  AS from_doctor_hospital,
         td.name      AS to_doctor_name,    td.email AS to_doctor_email,
         td.phone     AS to_doctor_phone,   td.specialty AS to_doctor_specialty,
         td.hospital  AS to_doctor_hospital,
         p.name       AS patient_name,      p.email  AS patient_email,
         p.phone      AS patient_phone_num
  FROM referrals r
  LEFT JOIN users fd ON r.from_doctor_id = fd.id
  LEFT JOIN users td ON r.to_doctor_id   = td.id
  LEFT JOIN users p  ON r.patient_id     = p.id
`;

/**
 * @route   POST /api/referrals
 * @desc    Create a new referral (doctor only)
 */
router.post('/', protect, doctorOnly, async (req, res) => {
  try {
    const { toDoctorEmail, toDoctorPhone, patientEmail, patientPhone, reason, notes, priority } = req.body;

    // Find target doctor
    let toDoctor = null;
    if (toDoctorEmail) {
      const rows = await query("SELECT id FROM users WHERE email = ? AND role = 'doctor'", [toDoctorEmail.toLowerCase()]);
      if (rows.length) toDoctor = rows[0];
    }
    if (!toDoctor && toDoctorPhone) {
      const rows = await query("SELECT id FROM users WHERE phone = ? AND role = 'doctor'", [toDoctorPhone.trim()]);
      if (rows.length) toDoctor = rows[0];
    }
    if (!toDoctor) return res.status(404).json({ message: 'Target doctor not found' });

    if (toDoctor.id === req.user._id) {
      return res.status(400).json({ message: 'Cannot refer to yourself' });
    }

    // Find patient
    let patient = null;
    if (patientEmail) {
      const rows = await query("SELECT id FROM users WHERE email = ? AND role = 'patient'", [patientEmail.toLowerCase()]);
      if (rows.length) patient = rows[0];
    }
    if (!patient && patientPhone) {
      const rows = await query("SELECT id FROM users WHERE phone = ? AND role = 'patient'", [patientPhone.trim()]);
      if (rows.length) patient = rows[0];
    }
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const [result] = await getPool().execute(
      'INSERT INTO referrals (from_doctor_id, to_doctor_id, patient_id, reason, notes, priority) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user._id, toDoctor.id, patient.id, reason, notes || '', priority || 'medium']
    );
    const referralId = result.insertId;

    // Auto-create consultation for receiving doctor so patient appears in "All Consultations"
    try {
      const patientRows = await query('SELECT phone FROM users WHERE id = ?', [patient.id]);
      const patientPhone = patientRows[0]?.phone || '';
      const docRows = await query('SELECT specialty FROM users WHERE id = ?', [toDoctor.id]);
      const docSpecialty = docRows[0]?.specialty || 'General';

      await getPool().execute(
        `INSERT INTO consultations 
         (patient_id, doctor_id, patient_phone, date, diagnosis, status, category, notes, consultation_hour, referral_id)
         VALUES (?, ?, ?, NOW(), ?, 'referred', ?, ?, HOUR(NOW()), ?)`,
        [
          patient.id,
          toDoctor.id,
          patientPhone,
          reason || 'Referral Consultation',
          docSpecialty,
          `Referred by Dr. ${req.user.name} (Priority: ${priority || 'medium'}).${notes ? ' Notes: ' + notes : ''}`,
          referralId
        ]
      );
    } catch (consErr) {
      console.error('Auto-create consultation from referral error:', consErr);
    }

    const rows = await query(`${REFERRAL_JOIN} WHERE r.id = ?`, [referralId]);
    res.status(201).json(formatReferral(rows[0]));
  } catch (error) {
    console.error('Create referral error:', error);
    res.status(500).json({ message: 'Error creating referral' });
  }
});

/**
 * @route   GET /api/referrals/incoming
 */
router.get('/incoming', protect, doctorOnly, async (req, res) => {
  try {
    const rows = await query(
      `${REFERRAL_JOIN} WHERE r.to_doctor_id = ? ORDER BY r.created_at DESC`,
      [req.user._id]
    );
    res.json(rows.map(formatReferral));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching incoming referrals' });
  }
});

/**
 * @route   GET /api/referrals/outgoing
 */
router.get('/outgoing', protect, doctorOnly, async (req, res) => {
  try {
    const rows = await query(
      `${REFERRAL_JOIN} WHERE r.from_doctor_id = ? ORDER BY r.created_at DESC`,
      [req.user._id]
    );
    res.json(rows.map(formatReferral));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching outgoing referrals' });
  }
});

/**
 * @route   PUT /api/referrals/:id/accept
 */
router.put('/:id/accept', protect, doctorOnly, async (req, res) => {
  try {
    const [result] = await getPool().execute(
      "UPDATE referrals SET status = 'accepted' WHERE id = ? AND to_doctor_id = ? AND status = 'pending'",
      [req.params.id, req.user._id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Referral not found or already processed' });
    }

    // Update linked consultation status to pending
    try {
      await getPool().execute("UPDATE consultations SET status = 'pending' WHERE referral_id = ?", [req.params.id]);
    } catch (syncErr) {
      console.error('Error syncing accepted referral status:', syncErr);
    }

    const rows = await query(`${REFERRAL_JOIN} WHERE r.id = ?`, [req.params.id]);
    res.json(formatReferral(rows[0]));
  } catch (error) {
    res.status(500).json({ message: 'Error accepting referral' });
  }
});

/**
 * @route   PUT /api/referrals/:id/decline
 */
router.put('/:id/decline', protect, doctorOnly, async (req, res) => {
  try {
    const [result] = await getPool().execute(
      "UPDATE referrals SET status = 'declined' WHERE id = ? AND to_doctor_id = ? AND status = 'pending'",
      [req.params.id, req.user._id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Referral not found or already processed' });
    }

    // Remove declined referral from recipient doctor's active consultations
    try {
      await getPool().execute("DELETE FROM consultations WHERE referral_id = ?", [req.params.id]);
    } catch (delErr) {
      console.error('Error deleting declined referral consultation:', delErr);
    }

    const rows = await query(`${REFERRAL_JOIN} WHERE r.id = ?`, [req.params.id]);
    res.json(formatReferral(rows[0]));
  } catch (error) {
    res.status(500).json({ message: 'Error declining referral' });
  }
});

/**
 * @route   PUT /api/referrals/:id/complete
 */
router.put('/:id/complete', protect, doctorOnly, async (req, res) => {
  try {
    const [result] = await getPool().execute(
      `UPDATE referrals SET status = 'completed'
       WHERE id = ? AND (from_doctor_id = ? OR to_doctor_id = ?) AND status = 'accepted'`,
      [req.params.id, req.user._id, req.user._id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Referral not found or not accepted' });
    }

    // Update linked consultation status to treated
    try {
      await getPool().execute("UPDATE consultations SET status = 'treated' WHERE referral_id = ?", [req.params.id]);
    } catch (syncErr) {
      console.error('Error syncing completed referral status:', syncErr);
    }

    const rows = await query(`${REFERRAL_JOIN} WHERE r.id = ?`, [req.params.id]);
    res.json(formatReferral(rows[0]));
  } catch (error) {
    res.status(500).json({ message: 'Error completing referral' });
  }
});

module.exports = router;
