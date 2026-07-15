const express = require('express');
const { protect, doctorOnly } = require('../middleware/auth');
const Referral = require('../models/Referral');
const User = require('../models/User');

const router = express.Router();

/**
 * @route   POST /api/referrals
 * @desc    Create a new referral (doctor only)
 */
router.post('/', protect, doctorOnly, async (req, res) => {
  try {
    const { toDoctorEmail, toDoctorPhone, patientEmail, patientPhone, reason, notes, priority } = req.body;

    // Find target doctor by email or phone
    let toDoctor = null;
    if (toDoctorEmail) toDoctor = await User.findOne({ email: toDoctorEmail?.toLowerCase(), role: 'doctor' });
    if (!toDoctor && toDoctorPhone) toDoctor = await User.findOne({ phone: toDoctorPhone?.trim(), role: 'doctor' });
    if (!toDoctor) {
      return res.status(404).json({ message: 'Target doctor not found' });
    }

    // Find patient by email or phone
    let patient = null;
    if (patientEmail) patient = await User.findOne({ email: patientEmail?.toLowerCase(), role: 'patient' });
    if (!patient && patientPhone) patient = await User.findOne({ phone: patientPhone?.trim(), role: 'patient' });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    if (toDoctor._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot refer to yourself' });
    }

    const referral = await Referral.create({
      fromDoctorId: req.user._id,
      toDoctorId: toDoctor._id,
      patientId: patient._id,
      reason,
      notes: notes || '',
      priority: priority || 'medium'
    });

    const populated = await referral.populate([
      { path: 'fromDoctorId', select: 'name email phone specialty hospital' },
      { path: 'toDoctorId', select: 'name email phone specialty hospital' },
      { path: 'patientId', select: 'name email phone' }
    ]);

    res.status(201).json(populated);
  } catch (error) {
    console.error('Create referral error:', error);
    res.status(500).json({ message: 'Error creating referral' });
  }
});

/**
 * @route   GET /api/referrals/incoming
 * @desc    Get incoming referrals for the logged-in doctor
 */
router.get('/incoming', protect, doctorOnly, async (req, res) => {
  try {
    const referrals = await Referral.find({ toDoctorId: req.user._id })
      .populate('fromDoctorId', 'name email specialty hospital')
      .populate('patientId', 'name email')
      .sort({ createdAt: -1 });
    res.json(referrals);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching incoming referrals' });
  }
});

/**
 * @route   GET /api/referrals/outgoing
 * @desc    Get outgoing referrals for the logged-in doctor
 */
router.get('/outgoing', protect, doctorOnly, async (req, res) => {
  try {
    const referrals = await Referral.find({ fromDoctorId: req.user._id })
      .populate('toDoctorId', 'name email specialty hospital')
      .populate('patientId', 'name email')
      .sort({ createdAt: -1 });
    res.json(referrals);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching outgoing referrals' });
  }
});

/**
 * @route   PUT /api/referrals/:id/accept
 * @desc    Accept a referral
 */
router.put('/:id/accept', protect, doctorOnly, async (req, res) => {
  try {
    const referral = await Referral.findOneAndUpdate(
      { _id: req.params.id, toDoctorId: req.user._id, status: 'pending' },
      { status: 'accepted' },
      { new: true }
    ).populate([
      { path: 'fromDoctorId', select: 'name email specialty' },
      { path: 'patientId', select: 'name email' }
    ]);

    if (!referral) {
      return res.status(404).json({ message: 'Referral not found or already processed' });
    }
    res.json(referral);
  } catch (error) {
    res.status(500).json({ message: 'Error accepting referral' });
  }
});

/**
 * @route   PUT /api/referrals/:id/decline
 * @desc    Decline a referral
 */
router.put('/:id/decline', protect, doctorOnly, async (req, res) => {
  try {
    const referral = await Referral.findOneAndUpdate(
      { _id: req.params.id, toDoctorId: req.user._id, status: 'pending' },
      { status: 'declined' },
      { new: true }
    );

    if (!referral) {
      return res.status(404).json({ message: 'Referral not found or already processed' });
    }
    res.json(referral);
  } catch (error) {
    res.status(500).json({ message: 'Error declining referral' });
  }
});

/**
 * @route   PUT /api/referrals/:id/complete
 * @desc    Mark referral as completed
 */
router.put('/:id/complete', protect, doctorOnly, async (req, res) => {
  try {
    const referral = await Referral.findOneAndUpdate(
      {
        _id: req.params.id,
        $or: [{ fromDoctorId: req.user._id }, { toDoctorId: req.user._id }],
        status: 'accepted'
      },
      { status: 'completed' },
      { new: true }
    );

    if (!referral) {
      return res.status(404).json({ message: 'Referral not found or not accepted' });
    }
    res.json(referral);
  } catch (error) {
    res.status(500).json({ message: 'Error completing referral' });
  }
});

module.exports = router;
