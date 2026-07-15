const express = require('express');
const { protect, doctorOnly } = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const User = require('../models/User');

const router = express.Router();

/**
 * @route   POST /api/appointments
 * @desc    Book an appointment (patient)
 */
router.post('/', protect, async (req, res) => {
  try {
    const { doctorId, date, timeSlot, reason } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized. Please log in again.' });
    }

    if (!doctorId || !date || !timeSlot) {
      return res.status(400).json({ message: 'Doctor, date, and time slot are required' });
    }

    // Verify doctor exists
    const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Check if slot is already booked (use date range query)
    const bookingDate = new Date(date);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const existing = await Appointment.findOne({
      doctorId,
      date: { $gte: bookingDate, $lt: nextDay },
      timeSlot,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (existing) {
      return res.status(409).json({ message: 'This time slot is already booked' });
    }

    const appointment = await Appointment.create({
      patientId: req.user._id,
      doctorId,
      date: bookingDate,
      timeSlot,
      reason: reason || ''
    });

    const populated = await appointment.populate([
      { path: 'patientId', select: 'name email avatar' },
      { path: 'doctorId', select: 'name email specialty hospital qualifications avatar experience address locality rating ratingsCount' }
    ]);

    res.status(201).json(populated);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'This time slot is already booked' });
    }
    console.error('Book appointment error:', error);
    res.status(500).json({ message: 'Error booking appointment' });
  }
});

/**
 * @route   GET /api/appointments/patient
 * @desc    Get all appointments for the logged-in patient
 */
router.get('/patient', protect, async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientId: req.user._id })
      .populate('doctorId', 'name email specialty hospital qualifications avatar experience address locality rating ratingsCount')
      .sort({ date: -1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointments' });
  }
});

/**
 * @route   GET /api/appointments/doctor
 * @desc    Get all appointments for the logged-in doctor
 */
router.get('/doctor', protect, doctorOnly, async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctorId: req.user._id })
      .populate('patientId', 'name email')
      .sort({ date: -1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointments' });
  }
});

/**
 * @route   GET /api/appointments/slots/:doctorId/:date
 * @desc    Get available slots for a doctor on a specific date
 */
router.get('/slots/:doctorId/:date', protect, async (req, res) => {
  try {
    const { doctorId, date } = req.params;

    // All possible 30-min slots from 9 AM to 5 PM
    const allSlots = [
      '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
      '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
      '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
      '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
    ];

    // Find booked slots
    const booked = await Appointment.find({
      doctorId,
      date: {
        $gte: new Date(date + 'T00:00:00'),
        $lt: new Date(date + 'T23:59:59')
      },
      status: { $in: ['pending', 'confirmed'] }
    }).select('timeSlot');

    const bookedSlots = booked.map(b => b.timeSlot);

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
 * @desc    Update appointment status (doctor confirms/cancels)
 */
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

  const VALID_STATUSES = ['pending', 'confirmed', 'in-progress', 'critical', 'completed', 'cancelled'];

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid status provided' });
    }

    // Doctor can set any status; Patient can only cancel their own
    const isDoctorOwner = appointment.doctorId.toString() === req.user._id.toString();
    const isPatientOwner = appointment.patientId.toString() === req.user._id.toString();

    if (!isDoctorOwner && !isPatientOwner) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (isPatientOwner && !isDoctorOwner && status !== 'cancelled') {
      return res.status(403).json({ message: 'Patients can only cancel appointments' });
    }

    appointment.status = status;
    await appointment.save();

    const populated = await appointment.populate([
      { path: 'patientId', select: 'name email avatar' },
      { path: 'doctorId', select: 'name email specialty hospital qualifications avatar experience address locality rating ratingsCount' }
    ]);

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating appointment' });
  }
});

/**
 * @route   POST /api/appointments/:id/rate
 * @desc    Submit rating for a doctor after a completed appointment
 */
router.post('/:id/rate', protect, async (req, res) => {
  try {
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Verify ownership
    if (appointment.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to rate this appointment' });
    }

    // Update rating
    appointment.rating = Number(rating);
    await appointment.save();

    // Recalculate doctor ratings across BOTH consultations and appointments
    const doctorId = appointment.doctorId;
    const Consultation = require('../models/Consultation');
    
    const allConsultationRatings = await Consultation.find({ doctorId, rating: { $gt: 0 } }).select('rating');
    const allAppointmentRatings = await Appointment.find({ doctorId, rating: { $gt: 0 } }).select('rating');
    
    let totalSum = 0;
    let totalCount = 0;
    
    allConsultationRatings.forEach(r => { totalSum += r.rating; totalCount++; });
    allAppointmentRatings.forEach(r => { totalSum += r.rating; totalCount++; });
    
    const average = totalCount > 0 ? Math.round((totalSum / totalCount) * 10) / 10 : 5.0;

    await User.findByIdAndUpdate(doctorId, {
      rating: average,
      ratingsCount: totalCount
    });

    const populated = await appointment.populate([
      { path: 'patientId', select: 'name email avatar' },
      { path: 'doctorId', select: 'name email specialty hospital qualifications avatar experience address locality rating ratingsCount' }
    ]);

    res.json(populated);
  } catch (error) {
    console.error('Rate appointment error:', error);
    res.status(500).json({ message: 'Server error during rating submission' });
  }
});

/**
 * @route   PUT /api/appointments/:id/payment
 * @desc    Toggle payment status (doctor/staff only)
 */
router.put('/:id/payment', protect, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    appointment.paymentStatus = appointment.paymentStatus === 'Paid' ? 'Unpaid' : 'Paid';
    await appointment.save();

    const populated = await appointment.populate([
      { path: 'patientId', select: 'name email avatar phone' },
      { path: 'doctorId', select: 'name specialty hospital' }
    ]);

    const io = req.app.get('io');
    if (io) {
      io.emit('appointment_update', populated);
    }

    res.json(populated);
  } catch (error) {
    console.error('Toggle payment error:', error);
    res.status(500).json({ message: 'Server error during payment update' });
  }
});

/**
 * @route   PUT /api/appointments/:id/emergency
 * @desc    Toggle emergency status (doctor/staff only)
 */
router.put('/:id/emergency', protect, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    appointment.isEmergency = !appointment.isEmergency;
    await appointment.save();

    const populated = await appointment.populate([
      { path: 'patientId', select: 'name email avatar phone' },
      { path: 'doctorId', select: 'name specialty hospital' }
    ]);

    const io = req.app.get('io');
    if (io) {
      io.emit('appointment_update', populated);
      if (populated.isEmergency) {
        io.emit('emergency_trigger', populated);
      }
    }

    res.json(populated);
  } catch (error) {
    console.error('Toggle emergency error:', error);
    res.status(500).json({ message: 'Server error during emergency status update' });
  }
});

/**
 * @route   PUT /api/appointments/:id/cancel-with-reason
 * @desc    Cancel appointment with a specific reason
 */
router.put('/:id/cancel-with-reason', protect, async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ message: 'Cancellation reason is required' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    appointment.status = 'cancelled';
    appointment.cancellationReason = reason;
    await appointment.save();

    const populated = await appointment.populate([
      { path: 'patientId', select: 'name email avatar phone' },
      { path: 'doctorId', select: 'name specialty hospital' }
    ]);

    const io = req.app.get('io');
    if (io) {
      io.emit('appointment_update', populated);
    }

    res.json(populated);
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ message: 'Server error during cancellation' });
  }
});

/**
 * @route   PUT /api/appointments/:id/edit
 * @desc    Edit/Reschedule appointment details
 */
router.put('/:id/edit', protect, async (req, res) => {
  try {
    const { date, timeSlot, reason } = req.body;
    if (!date || !timeSlot) {
      return res.status(400).json({ message: 'Date and time slot are required' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const bookingDate = new Date(date);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const existing = await Appointment.findOne({
      _id: { $ne: appointment._id },
      doctorId: appointment.doctorId,
      date: { $gte: bookingDate, $lt: nextDay },
      timeSlot,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (existing) {
      return res.status(409).json({ message: 'Reschedule failed: this time slot is already booked' });
    }

    appointment.date = bookingDate;
    appointment.timeSlot = timeSlot;
    if (reason !== undefined) appointment.reason = reason;
    await appointment.save();

    const populated = await appointment.populate([
      { path: 'patientId', select: 'name email avatar phone' },
      { path: 'doctorId', select: 'name specialty hospital' }
    ]);

    const io = req.app.get('io');
    if (io) {
      io.emit('appointment_update', populated);
    }

    res.json(populated);
  } catch (error) {
    console.error('Reschedule appointment error:', error);
    res.status(500).json({ message: 'Server error during rescheduling' });
  }
});

module.exports = router;
