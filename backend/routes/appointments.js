const express = require('express');
const { protect, doctorOnly, doctorOrStaff } = require('../middleware/auth');
const { query, getPool } = require('../config/db');
const { createNotification } = require('../utils/notify');

const router = express.Router();

const VALID_CATEGORIES = ['Cardiology','Dermatology','Neurology','Orthopedics','Pediatrics','General','Oncology','Psychiatry','Other'];

function parseSlotHour(timeSlot) {
  if (!timeSlot) return 12;
  const match = timeSlot.match(/^(\d+):(\d+)\s*(AM|PM)?/i);
  if (!match) return 12;
  let h = parseInt(match[1], 10);
  const isPM = match[3] && match[3].toUpperCase() === 'PM';
  if (isPM && h < 12) h += 12;
  if (!isPM && h === 12) h = 0;
  return h;
}

// Helper: format appointment row to match frontend shape
function formatAppointment(row) {
  return {
    _id: row.id,
    patientId: {
      _id:    row.patient_id,
      name:   row.patient_name,
      email:  row.patient_email,
      avatar: row.patient_avatar,
      phone:  row.patient_phone_num,
    },
    doctorId: {
      _id:            row.doctor_id,
      name:           row.doctor_name,
      email:          row.doctor_email,
      specialty:      row.doctor_specialty,
      hospital:       row.doctor_hospital,
      qualifications: row.doctor_qualifications,
      avatar:         row.doctor_avatar,
      experience:     row.doctor_experience,
      address:        row.doctor_address,
      locality:       row.doctor_locality,
      rating:         row.doctor_rating,
      ratingsCount:   row.doctor_ratings_count,
    },
    date:               row.date,
    timeSlot:           row.time_slot,
    reason:             row.reason,
    status:             row.status,
    paymentStatus:      row.payment_status,
    isEmergency:        !!row.is_emergency,
    cancellationReason: row.cancellation_reason,
    notes:              row.notes,
    rating:             row.rating,
    createdAt:          row.created_at,
    updatedAt:          row.updated_at,
  };
}

async function canManageAppointment(appt, userId) {
  if (appt.doctor_id === userId) return true;
  try {
    const staff = await query(
      "SELECT id FROM doctor_staff WHERE doctor_id = ? AND user_id = ? AND status = 'active'",
      [appt.doctor_id, userId]
    );
    return staff.length > 0;
  } catch (err) {
    console.error('Check manage access error:', err);
    return false;
  }
}

const APPOINTMENT_JOIN = `
  SELECT a.*,
         p.name  AS patient_name, p.email AS patient_email, p.avatar AS patient_avatar, p.phone AS patient_phone_num,
         d.name  AS doctor_name,  d.email AS doctor_email,  d.avatar AS doctor_avatar,
         d.specialty AS doctor_specialty, d.hospital AS doctor_hospital,
         d.qualifications AS doctor_qualifications, d.experience AS doctor_experience,
         d.address AS doctor_address, d.locality AS doctor_locality,
         d.rating AS doctor_rating, d.ratings_count AS doctor_ratings_count
  FROM appointments a
  LEFT JOIN users p ON a.patient_id = p.id
  LEFT JOIN users d ON a.doctor_id  = d.id
`;

/**
 * @route   POST /api/appointments
 * @desc    Book an appointment (patient)
 */
router.post('/', protect, async (req, res) => {
  try {
    const { doctorId, date, timeSlot, reason } = req.body;

    if (!doctorId || !date || !timeSlot) {
      return res.status(400).json({ message: 'Doctor, date, and time slot are required' });
    }

    // Verify doctor exists
    const doctors = await query("SELECT id FROM users WHERE id = ? AND role = 'doctor'", [doctorId]);
    if (!doctors.length) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Check for double booking
    const existing = await query(
      `SELECT id FROM appointments
       WHERE doctor_id = ? AND DATE(date) = DATE(?) AND time_slot = ?
         AND status IN ('pending','confirmed')`,
      [doctorId, date, timeSlot]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'This time slot is already booked' });
    }

    const [result] = await getPool().execute(
      'INSERT INTO appointments (patient_id, doctor_id, date, time_slot, reason) VALUES (?, ?, ?, ?, ?)',
      [req.user._id, doctorId, date, timeSlot, reason || '']
    );
    const appointmentId = result.insertId;

    // Auto-create consultation so appointed patients appear in "All Consultations"
    try {
      const patientPhone = req.user.phone || '';
      const doctorSpecialty = VALID_CATEGORIES.includes(doctors[0]?.specialty) ? doctors[0].specialty : 'General';
      const consultationHour = parseSlotHour(timeSlot);

      await getPool().execute(
        `INSERT INTO consultations 
         (patient_id, doctor_id, patient_phone, date, diagnosis, status, category, notes, consultation_hour, appointment_id)
         VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
        [
          req.user._id,
          doctorId,
          patientPhone,
          date,
          reason || 'Appointment Consultation',
          doctorSpecialty,
          `Booked via appointments for ${timeSlot}.${reason ? ' Reason: ' + reason : ''}`,
          consultationHour,
          appointmentId
        ]
      );
    } catch (consErr) {
      console.error('Auto-create consultation from appointment error:', consErr);
    }

    const rows = await query(`${APPOINTMENT_JOIN} WHERE a.id = ?`, [appointmentId]);
    const formatted = formatAppointment(rows[0]);

    const io = req.app.get('io');
    if (io) {
      io.emit('appointment_update', formatted);
      try {
        // 1. Notify doctor
        await createNotification(io, {
          userId: doctorId,
          type: 'appointment_booked',
          title: '📅 New Appointment Booked',
          message: `${req.user.name} booked an appointment for ${date} at ${timeSlot}.${reason ? ' Reason: ' + reason : ''}`,
          data: { appointmentId, date, timeSlot }
        });

        // 2. Notify doctor's active staff
        const staffList = await query("SELECT user_id FROM doctor_staff WHERE doctor_id = ? AND status = 'active'", [doctorId]);
        for (const s of staffList) {
          await createNotification(io, {
            userId: s.user_id,
            type: 'appointment_booked',
            title: '📅 New Clinic Appointment',
            message: `New booking for Dr. ${formatted.doctorId?.name || 'Doctor'} by ${req.user.name} for ${date} at ${timeSlot}.`,
            data: { appointmentId, date, timeSlot }
          });
        }

        // 3. Notify patient
        await createNotification(io, {
          userId: req.user._id,
          type: 'appointment_booked',
          title: '✅ Appointment Scheduled',
          message: `Your appointment with Dr. ${formatted.doctorId?.name || 'Doctor'} on ${date} at ${timeSlot} has been scheduled.`,
          data: { appointmentId, date, timeSlot }
        });
      } catch (notifErr) {
        console.error('Error sending appointment notifications:', notifErr);
      }
    }

    res.status(201).json(formatted);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'This time slot is already booked' });
    }
    console.error('Book appointment error:', error);
    res.status(500).json({ message: 'Error booking appointment' });
  }
});

/**
 * @route   GET /api/appointments/patient
 */
router.get('/patient', protect, async (req, res) => {
  try {
    const rows = await query(`${APPOINTMENT_JOIN} WHERE a.patient_id = ? ORDER BY a.date DESC`, [req.user._id]);
    res.json(rows.map(formatAppointment));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointments' });
  }
});

/**
 * @route   GET /api/appointments/doctor
 */
router.get('/doctor', protect, doctorOrStaff, async (req, res) => {
  try {
    let doctorIds = [];
    if (req.user.role === 'doctor') {
      doctorIds.push(req.user._id);
    }
    const staffRows = await query(
      "SELECT doctor_id FROM doctor_staff WHERE user_id = ? AND status = 'active'",
      [req.user._id]
    );
    staffRows.forEach(r => {
      if (!doctorIds.includes(r.doctor_id)) doctorIds.push(r.doctor_id);
    });

    if (doctorIds.length === 0) {
      return res.json([]);
    }

    const placeholders = doctorIds.map(() => '?').join(',');
    const rows = await query(
      `${APPOINTMENT_JOIN} WHERE a.doctor_id IN (${placeholders}) ORDER BY a.date DESC`,
      doctorIds
    );
    res.json(rows.map(formatAppointment));
  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    res.status(500).json({ message: 'Error fetching appointments' });
  }
});

/**
 * @route   GET /api/appointments/slots/:doctorId/:date
 */
router.get('/slots/:doctorId/:date', protect, async (req, res) => {
  try {
    const { doctorId, date } = req.params;
    const allSlots = [
      '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
      '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
      '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
      '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
    ];

    const booked = await query(
      `SELECT time_slot FROM appointments
       WHERE doctor_id = ? AND DATE(date) = DATE(?) AND status IN ('pending','confirmed')`,
      [doctorId, date]
    );
    const bookedSlots = booked.map(b => b.time_slot);

    const slots = allSlots.map(slot => ({
      time: slot,
      available: !bookedSlots.includes(slot)
    }));

    res.json(slots);
  } catch (error) {
    console.error('Slots error:', error);
    res.status(500).json({ message: 'Error fetching slots' });
  }
});

/**
 * @route   PUT /api/appointments/:id/status
 */
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const VALID_STATUSES = ['pending', 'confirmed', 'in-progress', 'critical', 'completed', 'cancelled'];

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid status provided' });
    }

    const appts = await query('SELECT * FROM appointments WHERE id = ?', [req.params.id]);
    if (!appts.length) return res.status(404).json({ message: 'Appointment not found' });

    const appt = appts[0];
    const canManage      = await canManageAppointment(appt, req.user._id);
    const isPatientOwner = appt.patient_id === req.user._id;

    if (!canManage && !isPatientOwner) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (isPatientOwner && !canManage && status !== 'cancelled') {
      return res.status(403).json({ message: 'Patients can only cancel appointments' });
    }

    await getPool().execute('UPDATE appointments SET status = ? WHERE id = ?', [status, req.params.id]);

    // Keep linked consultation in sync
    try {
      if (status === 'completed') {
        await getPool().execute("UPDATE consultations SET status = 'treated' WHERE appointment_id = ?", [req.params.id]);
      } else if (status === 'cancelled') {
        await getPool().execute("DELETE FROM consultations WHERE appointment_id = ?", [req.params.id]);
      } else if (status === 'confirmed' || status === 'in-progress' || status === 'pending') {
        await getPool().execute("UPDATE consultations SET status = 'pending' WHERE appointment_id = ?", [req.params.id]);
      }
    } catch (syncErr) {
      console.error('Error syncing consultation status:', syncErr);
    }

    const rows = await query(`${APPOINTMENT_JOIN} WHERE a.id = ?`, [req.params.id]);
    const formatted = formatAppointment(rows[0]);

    const io = req.app.get('io');
    if (io) {
      io.emit('appointment_update', formatted);
      try {
        const targetUserId = (req.user._id === appt.patient_id) ? appt.doctor_id : appt.patient_id;
        await createNotification(io, {
          userId: targetUserId,
          type: 'appointment_update',
          title: `Appointment ${status.toUpperCase()}`,
          message: `Appointment #${appt.id} on ${formatted.date} (${formatted.timeSlot}) is now marked as ${status}.`,
          data: { appointmentId: appt.id, status }
        });
      } catch (ne) {}
    }

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Error updating appointment' });
  }
});

/**
 * @route   POST /api/appointments/:id/rate
 */
router.post('/:id/rate', protect, async (req, res) => {
  try {
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const appts = await query('SELECT * FROM appointments WHERE id = ?', [req.params.id]);
    if (!appts.length) return res.status(404).json({ message: 'Appointment not found' });

    const appt = appts[0];
    if (appt.patient_id !== req.user._id) {
      return res.status(403).json({ message: 'Not authorized to rate this appointment' });
    }

    await getPool().execute('UPDATE appointments SET rating = ? WHERE id = ?', [Number(rating), req.params.id]);
    await getPool().execute('UPDATE consultations SET rating = ? WHERE appointment_id = ?', [Number(rating), req.params.id]);

    // Recalculate doctor average rating
    const consRatings = await query('SELECT rating FROM consultations WHERE doctor_id = ? AND rating > 0', [appt.doctor_id]);
    const apptRatings = await query('SELECT rating FROM appointments  WHERE doctor_id = ? AND rating > 0', [appt.doctor_id]);

    let totalSum = 0, totalCount = 0;
    [...consRatings, ...apptRatings].forEach(r => { totalSum += r.rating; totalCount++; });
    const average = totalCount > 0 ? Math.round((totalSum / totalCount) * 10) / 10 : 5.0;

    await getPool().execute('UPDATE users SET rating = ?, ratings_count = ? WHERE id = ?', [average, totalCount, appt.doctor_id]);

    const rows = await query(`${APPOINTMENT_JOIN} WHERE a.id = ?`, [req.params.id]);
    res.json(formatAppointment(rows[0]));
  } catch (error) {
    console.error('Rate appointment error:', error);
    res.status(500).json({ message: 'Server error during rating submission' });
  }
});

/**
 * @route   PUT /api/appointments/:id/payment
 */
router.put('/:id/payment', protect, async (req, res) => {
  try {
    const appts = await query('SELECT * FROM appointments WHERE id = ?', [req.params.id]);
    if (!appts.length) return res.status(404).json({ message: 'Appointment not found' });

    const appt = appts[0];
    const canManage = await canManageAppointment(appt, req.user._id);
    if (!canManage) {
      return res.status(403).json({ message: 'Not authorized to update payment status' });
    }

    const newStatus = appt.payment_status === 'Paid' ? 'Unpaid' : 'Paid';
    await getPool().execute('UPDATE appointments SET payment_status = ? WHERE id = ?', [newStatus, req.params.id]);

    const rows = await query(`${APPOINTMENT_JOIN} WHERE a.id = ?`, [req.params.id]);
    const formatted = formatAppointment(rows[0]);

    const io = req.app.get('io');
    if (io) io.emit('appointment_update', formatted);

    res.json(formatted);
  } catch (error) {
    console.error('Toggle payment error:', error);
    res.status(500).json({ message: 'Server error during payment update' });
  }
});

/**
 * @route   PUT /api/appointments/:id/emergency
 */
router.put('/:id/emergency', protect, async (req, res) => {
  try {
    const appts = await query('SELECT * FROM appointments WHERE id = ?', [req.params.id]);
    if (!appts.length) return res.status(404).json({ message: 'Appointment not found' });

    const appt = appts[0];
    const canManage = await canManageAppointment(appt, req.user._id);
    const isPatientOwner = appt.patient_id === req.user._id;
    if (!canManage && !isPatientOwner) {
      return res.status(403).json({ message: 'Not authorized to update emergency status' });
    }

    const newEmergency = appt.is_emergency ? 0 : 1;
    await getPool().execute('UPDATE appointments SET is_emergency = ? WHERE id = ?', [newEmergency, req.params.id]);

    const rows = await query(`${APPOINTMENT_JOIN} WHERE a.id = ?`, [req.params.id]);
    const formatted = formatAppointment(rows[0]);

    const io = req.app.get('io');
    if (io) {
      io.emit('appointment_update', formatted);
      if (formatted.isEmergency) {
        io.emit('emergency_trigger', formatted);
        try {
          // Notify doctor
          await createNotification(io, {
            userId: appt.doctor_id,
            type: 'emergency',
            title: '🚨 EMERGENCY CARE PROTOCOL',
            message: `URGENT: Emergency protocol triggered for patient ${formatted.patientId?.name || 'Patient'} on appointment #${appt.id}!`,
            data: { appointmentId: appt.id }
          });
          // Notify doctor's active staff
          const staff = await query("SELECT user_id FROM doctor_staff WHERE doctor_id = ? AND status = 'active'", [appt.doctor_id]);
          for (const s of staff) {
            await createNotification(io, {
              userId: s.user_id,
              type: 'emergency',
              title: '🚨 EMERGENCY CARE PROTOCOL',
              message: `URGENT: Emergency protocol triggered for patient ${formatted.patientId?.name || 'Patient'} on appointment #${appt.id}!`,
              data: { appointmentId: appt.id }
            });
          }
        } catch (ne) {}
      }
    }

    res.json(formatted);
  } catch (error) {
    console.error('Toggle emergency error:', error);
    res.status(500).json({ message: 'Server error during emergency status update' });
  }
});

/**
 * @route   PUT /api/appointments/:id/cancel-with-reason
 */
router.put('/:id/cancel-with-reason', protect, async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ message: 'Cancellation reason is required' });

    const appts = await query('SELECT * FROM appointments WHERE id = ?', [req.params.id]);
    if (!appts.length) return res.status(404).json({ message: 'Appointment not found' });

    const appt = appts[0];
    const canManage = await canManageAppointment(appt, req.user._id);
    const isPatientOwner = appt.patient_id === req.user._id;
    if (!canManage && !isPatientOwner) {
      return res.status(403).json({ message: 'Not authorized to cancel this appointment' });
    }

    await getPool().execute(
      "UPDATE appointments SET status = 'cancelled', cancellation_reason = ? WHERE id = ?",
      [reason, req.params.id]
    );

    // Remove from consultations so cancelled appointments don't clutter active records
    try {
      await getPool().execute("DELETE FROM consultations WHERE appointment_id = ?", [req.params.id]);
    } catch (delErr) {
      console.error('Error deleting cancelled consultation:', delErr);
    }

    const rows = await query(`${APPOINTMENT_JOIN} WHERE a.id = ?`, [req.params.id]);
    const formatted = formatAppointment(rows[0]);

    const io = req.app.get('io');
    if (io) io.emit('appointment_update', formatted);

    res.json(formatted);
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ message: 'Server error during cancellation' });
  }
});

/**
 * @route   PUT /api/appointments/:id/edit
 */
router.put('/:id/edit', protect, async (req, res) => {
  try {
    const { date, timeSlot, reason } = req.body;
    if (!date || !timeSlot) {
      return res.status(400).json({ message: 'Date and time slot are required' });
    }

    const appts = await query('SELECT * FROM appointments WHERE id = ?', [req.params.id]);
    if (!appts.length) return res.status(404).json({ message: 'Appointment not found' });

    const appt = appts[0];
    const canManage = await canManageAppointment(appt, req.user._id);
    const isPatientOwner = appt.patient_id === req.user._id;
    if (!canManage && !isPatientOwner) {
      return res.status(403).json({ message: 'Not authorized to reschedule this appointment' });
    }

    // Check for double booking (exclude self)
    const existing = await query(
      `SELECT id FROM appointments
       WHERE doctor_id = ? AND DATE(date) = DATE(?) AND time_slot = ?
         AND status IN ('pending','confirmed') AND id != ?`,
      [appt.doctor_id, date, timeSlot, appt.id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Reschedule failed: this time slot is already booked' });
    }

    const updates = ['date = ?', 'time_slot = ?'];
    const values = [date, timeSlot];
    if (reason !== undefined) { updates.push('reason = ?'); values.push(reason); }
    values.push(req.params.id);

    await getPool().execute(`UPDATE appointments SET ${updates.join(', ')} WHERE id = ?`, values);

    // Sync consultation date and notes
    try {
      const consultationHour = parseSlotHour(timeSlot);
      await getPool().execute(
        `UPDATE consultations 
         SET date = ?, 
             notes = CONCAT('Rescheduled for ', ?, ' (', ?, '). Reason: ', COALESCE(?, diagnosis)),
             consultation_hour = ?
         WHERE appointment_id = ?`,
        [date, date, timeSlot, reason || null, consultationHour, req.params.id]
      );
    } catch (syncErr) {
      console.error('Error syncing consultation edit:', syncErr);
    }

    const rows = await query(`${APPOINTMENT_JOIN} WHERE a.id = ?`, [req.params.id]);
    const formatted = formatAppointment(rows[0]);

    const io = req.app.get('io');
    if (io) io.emit('appointment_update', formatted);

    res.json(formatted);
  } catch (error) {
    console.error('Reschedule appointment error:', error);
    res.status(500).json({ message: 'Server error during rescheduling' });
  }
});

module.exports = router;
