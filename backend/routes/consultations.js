const express = require('express');
const { protect, doctorOnly } = require('../middleware/auth');
const Consultation = require('../models/Consultation');
const User = require('../models/User');

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

    const email = patientEmail.toLowerCase().trim();

    // Find or auto-register the patient
    let patient = null;
    if (patientEmail) {
      patient = await User.findOne({ email: patientEmail.toLowerCase().trim(), role: 'patient' });
    }
    if (!patient && patientPhone) {
      patient = await User.findOne({ phone: patientPhone.trim(), role: 'patient' });
    }

    if (!patient) {
      // Auto-register new patient with phone
      const name = patientName?.trim() || (patientEmail ? patientEmail.split('@')[0] : `Patient_${patientPhone}`);
      patient = await User.create({
        email: patientEmail ? patientEmail.toLowerCase().trim() : undefined,
        phone: patientPhone.trim(),
        password: 'password123',
        name,
        role: 'patient',
      });
      console.log(`✅ Auto-registered patient: ${name} (${patientPhone})`);
    }

    const consultation = await Consultation.create({
      patientId: patient._id,
      doctorId: req.user._id,
      patientPhone: patientPhone.trim(),
      diagnosis,
      status: status || 'pending',
      category: category || 'General',
      notes,
      prescriptions: prescriptions || [],
      consultationHour: new Date().getHours()
    });

    const populated = await consultation.populate([
      { path: 'patientId', select: 'name email' },
      { path: 'doctorId', select: 'name email specialty' }
    ]);

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
    const consultations = await Consultation.find({ doctorId: req.user._id })
      .populate('patientId', 'name email avatar')
      .sort({ date: -1 });
    res.json(consultations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching consultations' });
  }
});

/**
 * @route   GET /api/consultations/patient
 * @desc    Get all consultations for the logged-in patient
 */
router.get('/patient', protect, async (req, res) => {
  try {
    const consultations = await Consultation.find({ patientId: req.user._id })
      .populate('doctorId', 'name email specialty hospital qualifications avatar experience address locality rating ratingsCount')
      .sort({ date: -1 });
    res.json(consultations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching consultations' });
  }
});

/**
 * @route   PUT /api/consultations/:id
 * @desc    Update consultation status
 */
router.put('/:id', protect, doctorOnly, async (req, res) => {
  try {
    const consultation = await Consultation.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.user._id },
      req.body,
      { new: true }
    ).populate('patientId', 'name email');
    
    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }
    res.json(consultation);
  } catch (error) {
    res.status(500).json({ message: 'Error updating consultation' });
  }
});

/**
 * @route   GET /api/consultations/analytics
 * @desc    Get analytics data for the doctor's dashboard
 */
router.get('/analytics', protect, doctorOnly, async (req, res) => {
  try {
    const doctorId = req.user._id;

    // Total patients
    const totalPatients = await Consultation.distinct('patientId', { doctorId });

    // Status breakdown
    const statusBreakdown = await Consultation.aggregate([
      { $match: { doctorId: doctorId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Category breakdown
    const categoryBreakdown = await Consultation.aggregate([
      { $match: { doctorId: doctorId } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // Daily counts for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dailyCounts = await Consultation.aggregate([
      { $match: { doctorId: doctorId, date: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Peak consultation hours
    const hourlyBreakdown = await Consultation.aggregate([
      { $match: { doctorId: doctorId } },
      { $group: { _id: '$consultationHour', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Weekly counts for the last 12 weeks
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

    const weeklyCounts = await Consultation.aggregate([
      { $match: { doctorId: doctorId, date: { $gte: twelveWeeksAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-W%V', date: '$date' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      totalPatients: totalPatients.length,
      totalConsultations: await Consultation.countDocuments({ doctorId }),
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
 * @desc    Submit rating for a doctor after a treatment/consultation
 */
router.post('/:id/rate', protect, async (req, res) => {
  try {
    const { rating } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) {
      return res.status(404).json({ message: 'Consultation record not found' });
    }

    // Verify ownership
    if (consultation.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to rate this consultation' });
    }

    // Update rating
    consultation.rating = Number(rating);
    await consultation.save();

    // Recalculate doctor ratings across BOTH consultations and appointments
    const doctorId = consultation.doctorId;
    const Appointment = require('../models/Appointment');
    
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

    const populated = await consultation.populate([
      { path: 'patientId', select: 'name email' },
      { path: 'doctorId', select: 'name email specialty rating ratingsCount' }
    ]);

    res.json(populated);
  } catch (error) {
    console.error('Rate consultation error:', error);
    res.status(500).json({ message: 'Server error during rating submission' });
  }
});

module.exports = router;
