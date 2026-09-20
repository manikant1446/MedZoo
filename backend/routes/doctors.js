const express = require('express');
const { protect } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimit');
const { query } = require('../config/db');

const router = express.Router();

const formatDoctor = (d) => ({
  ...d,
  _id: d.id,
  rating: d.rating != null ? parseFloat(d.rating) : 5.0,
  ratingsCount: parseInt(d.ratingsCount, 10) || 0,
  patientCount: parseInt(d.patientCount, 10) || 0,
  experience: parseInt(d.experience, 10) || 0,
  isVerified: !!d.isVerified,
});

/**
 * @route   GET /api/doctors/public/:id
 * @desc    Public, minimal doctor profile for QR-code landing pages.
 *          No auth required. Does NOT expose email/phone.
 *          Rate limited to discourage enumeration.
 */
router.get('/public/:id', rateLimit({ prefix: 'public-doctor', max: 60 }), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid doctor id' });
    }

    const rows = await query(
      `SELECT u.id, u.name, u.specialty, u.hospital, u.qualifications,
              u.is_verified AS isVerified, u.avatar, u.experience,
              u.address, u.locality, u.rating, u.ratings_count AS ratingsCount
       FROM users u
       WHERE u.id = ? AND u.role = 'doctor'`,
      [id]
    );

    if (!rows.length) return res.status(404).json({ message: 'Doctor not found' });

    res.json(formatDoctor(rows[0]));
  } catch (error) {
    console.error('Fetch public doctor error:', error);
    res.status(500).json({ message: 'Error fetching doctor' });
  }
});

/**
 * @route   GET /api/doctors
 * @desc    Get all doctors with optional search/filter
 */
router.get('/', protect, async (req, res) => {
  try {
    const { specialty, search } = req.query;

    let sql = `
      SELECT u.id, u.name, u.specialty, u.hospital, u.qualifications,
             u.is_verified AS isVerified,
             u.avatar, u.experience, u.address, u.locality, u.rating, u.ratings_count AS ratingsCount,
             COUNT(DISTINCT c.patient_id) AS patientCount
      FROM users u
      LEFT JOIN consultations c ON c.doctor_id = u.id
      WHERE u.role = 'doctor'
    `;
    const params = [];

    if (specialty) {
      sql += ' AND u.specialty LIKE ?';
      params.push(`%${specialty}%`);
    }
    if (search) {
      sql += ' AND (u.name LIKE ? OR u.specialty LIKE ? OR u.hospital LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' GROUP BY u.id ORDER BY u.rating DESC';

    const doctors = await query(sql, params);
    res.json(doctors.map(formatDoctor));
  } catch (error) {
    console.error('Fetch doctors error:', error);
    res.status(500).json({ message: 'Error fetching doctors' });
  }
});

/**
 * @route   GET /api/doctors/:id
 * @desc    Get single doctor by ID (authenticated)
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const rows = await query(
      `SELECT u.id, u.name, u.specialty, u.hospital, u.qualifications,
              u.is_verified AS isVerified,
              u.avatar, u.experience, u.address, u.locality, u.rating, u.ratings_count AS ratingsCount,
              COUNT(DISTINCT c.patient_id) AS patientCount
       FROM users u
       LEFT JOIN consultations c ON c.doctor_id = u.id
       WHERE u.id = ? AND u.role = 'doctor'
       GROUP BY u.id`,
      [req.params.id]
    );

    if (!rows.length) return res.status(404).json({ message: 'Doctor not found' });

    const d = rows[0];
    res.json(formatDoctor(d));
  } catch (error) {
    console.error('Fetch doctor error:', error);
    res.status(500).json({ message: 'Error fetching doctor' });
  }
});

module.exports = router;
