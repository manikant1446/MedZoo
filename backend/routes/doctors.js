const express = require('express');
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Consultation = require('../models/Consultation');

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const { specialty, search } = req.query;
    const filter = { role: 'doctor' };
    if (specialty) filter.specialty = { $regex: specialty, $options: 'i' };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { specialty: { $regex: search, $options: 'i' } },
        { hospital: { $regex: search, $options: 'i' } }
      ];
    }
    const doctors = await User.find(filter)
      .select('name email specialty hospital qualifications walletAddress isVerified did avatar experience address locality rating ratingsCount');
    const doctorsWithStats = await Promise.all(
      doctors.map(async (doc) => {
        const patients = await Consultation.distinct('patientId', { doctorId: doc._id });
        return { ...doc.toObject(), patientCount: patients.length };
      })
    );
    res.json(doctorsWithStats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching doctors' });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const doctor = await User.findById(req.params.id)
      .select('name email specialty hospital qualifications walletAddress isVerified did avatar experience address locality rating ratingsCount');
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    const patients = await Consultation.distinct('patientId', { doctorId: doctor._id });
    res.json({ ...doctor.toObject(), patientCount: patients.length });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching doctor' });
  }
});

module.exports = router;
