const express = require('express');
const { protect } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimit');
const { query } = require('../config/db');
const {
  isValidLat,
  isValidLng,
  haversineKm,
  matchLocality,
  formatDistanceKm
} = require('../utils/geo');

const router = express.Router();

const formatDoctor = (d) => ({
  ...d,
  _id: d.id,
  rating: d.rating != null ? parseFloat(d.rating) : 5.0,
  ratingsCount: parseInt(d.ratingsCount, 10) || 0,
  patientCount: parseInt(d.patientCount, 10) || 0,
  experience: parseInt(d.experience, 10) || 0,
  isVerified: !!d.isVerified,
  latitude: d.latitude != null ? parseFloat(d.latitude) : null,
  longitude: d.longitude != null ? parseFloat(d.longitude) : null,
  hasLocation: d.latitude != null && d.longitude != null,
});

/**
 * Rank doctors for a patient's current location.
 * Tiered preference — no doctor is ever hidden:
 *   1. doctors with saved coords, closest first (patient coords given)
 *   2. doctors whose locality/address/hospital matches the patient's locality
 *   3. everyone else, by rating (previous default behaviour)
 */
const rankDoctors = (doctors, { lat, lng, locality }) => {
  return doctors.map((doc) => {
    let distanceKm = null;
    let distanceRaw = null;
    if (doc.hasLocation) {
      distanceRaw = haversineKm(lat, lng, doc.latitude, doc.longitude);
      distanceKm = distanceRaw == null ? null : formatDistanceKm(distanceRaw);
    }

    const localityMatch = matchLocality(locality, doc);
    const isNearby = distanceKm != null || localityMatch;

    // Sort rank: 0 = closest GPS match, 1 = locality match, 2 = neither
    let rank;
    if (distanceKm != null) {
      rank = 0;
    } else if (localityMatch) {
      rank = 1;
    } else {
      rank = 2;
    }

    return { ...doc, distanceKm, isNearby, rank, distanceRaw };
  }).sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    // Within the GPS tier, nearest first (unrounded for accuracy)
    if (a.rank === 0 && a.distanceRaw != null && b.distanceRaw != null) {
      return a.distanceRaw - b.distanceRaw;
    }
    // Otherwise keep the existing rating preference
    return (b.rating || 5.0) - (a.rating || 5.0);
  }).map(({ rank, distanceRaw, ...doc }) => doc);
};

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
              u.address, u.locality, u.rating, u.ratings_count AS ratingsCount,
              u.latitude, u.longitude
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
 * @desc    Get all doctors with optional search/filter.
 *          Supports nearby ranking via lat/lng (patient's live, transient
 *          location — never persisted) and locality (patient's saved area).
 */
router.get('/', protect, async (req, res) => {
  try {
    const { specialty, search, lat, lng, locality } = req.query;

    let sql = `
      SELECT u.id, u.name, u.specialty, u.hospital, u.qualifications,
             u.is_verified AS isVerified,
             u.avatar, u.experience, u.address, u.locality, u.rating, u.ratings_count AS ratingsCount,
             u.latitude, u.longitude,
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
      sql += ' AND (u.name LIKE ? OR u.specialty LIKE ? OR u.hospital LIKE ? OR u.locality LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' GROUP BY u.id ORDER BY u.rating DESC';

    const rows = await query(sql, params).catch(async (err) => {
      // Graceful degradation on databases where the location migration has not
      // been applied yet (same pattern as middleware/auth.js). Retry without coords.
      if (err && (err.code === 'ER_BAD_FIELD_ERROR' || /Unknown column/i.test(err.message))) {
        console.warn('Falling back to doctors query without location columns');
        return query(sql.replace('u.latitude, u.longitude,', ''), params);
      }
      throw err;
    });
    const doctors = rows.map(formatDoctor);

    // Patient coords are only used for this response; ignore invalid values
    // so a malformed request simply falls back to locality/rating ordering.
    const hasCoords = isValidLat(lat) && isValidLng(lng);
    const patientLocality =
      typeof locality === 'string' ? locality.trim() : (req.user?.locality || '');

    res.json(
      rankDoctors(doctors, {
        lat: hasCoords ? Number(lat) : null,
        lng: hasCoords ? Number(lng) : null,
        locality: patientLocality
      })
    );
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
              u.latitude, u.longitude,
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
// Exported for unit testing (scratch/test-nearby-ranking.js). The router is a
// function, so attaching this property does not affect route mounting.
module.exports.rankDoctors = rankDoctors;
module.exports.formatDoctor = formatDoctor;
