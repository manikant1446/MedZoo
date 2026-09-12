const express = require('express');
const { protect } = require('../middleware/auth');
const { query, getPool } = require('../config/db');

const router = express.Router();

/**
 * Helper: Normalize phone numbers (strip spaces, dashes, +91 etc.)
 */
const normalizePhone = (raw) => {
  if (!raw) return '';
  const digits = String(raw).replace(/\D/g, '');
  return digits.slice(-10);
};

/**
 * @route   GET /api/contacts
 * @desc    Get all contacts for the current user
 */
router.get('/', protect, async (req, res) => {
  try {
    const contacts = await query(
      `SELECT c.id, c.nickname, c.trust_level, c.created_at,
              u.id AS contact_user_id, u.name, u.email, u.role,
              u.specialty, u.hospital, u.avatar
       FROM contacts c
       LEFT JOIN users u ON c.contact_user_id = u.id
       WHERE c.user_id = ?`,
      [req.user._id]
    );
    res.json(contacts.map(c => ({
      _id:           c.id,
      userId:        req.user._id,
      contactUserId: {
        _id:           c.contact_user_id,
        name:          c.name,
        email:         c.email,
        role:          c.role,
        specialty:     c.specialty,
        hospital:      c.hospital,
        avatar:        c.avatar,

      },
      nickname:   c.nickname,
      trustLevel: c.trust_level,
      createdAt:  c.created_at,
    })));
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ message: 'Error fetching contacts' });
  }
});

/**
 * @route   POST /api/contacts
 * @desc    Add a contact by email
 */
router.post('/', protect, async (req, res) => {
  try {
    const { email, nickname, trustLevel } = req.body;

    const users = await query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    if (!users.length) {
      return res.status(404).json({ message: 'User not found with that email' });
    }
    const contactUser = users[0];

    if (contactUser.id === req.user._id) {
      return res.status(400).json({ message: 'Cannot add yourself as a contact' });
    }

    const existing = await query(
      'SELECT id FROM contacts WHERE user_id = ? AND contact_user_id = ?',
      [req.user._id, contactUser.id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Contact already exists' });
    }

    const [result] = await getPool().execute(
      'INSERT INTO contacts (user_id, contact_user_id, nickname, trust_level) VALUES (?, ?, ?, ?)',
      [req.user._id, contactUser.id, nickname || contactUser.name, trustLevel || 3]
    );

    res.status(201).json({
      _id: result.insertId,
      userId: req.user._id,
      contactUserId: {
        _id:       contactUser.id,
        name:      contactUser.name,
        email:     contactUser.email,
        role:      contactUser.role,
        specialty: contactUser.specialty,
        hospital:  contactUser.hospital,
        avatar:    contactUser.avatar,
      },
      nickname:   nickname || contactUser.name,
      trustLevel: trustLevel || 3,
    });
  } catch (error) {
    console.error('Add contact error:', error);
    res.status(500).json({ message: 'Error adding contact' });
  }
});

/**
 * @route   DELETE /api/contacts/:id
 * @desc    Remove a contact
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    await getPool().execute(
      'DELETE FROM contacts WHERE id = ? AND user_id = ?',
      [req.params.id, req.user._id]
    );
    res.json({ message: 'Contact removed' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing contact' });
  }
});

/**
 * @route   GET /api/contacts/trust-check/:doctorId
 * @desc    Check if any contacts visited a specific doctor
 */
router.get('/trust-check/:doctorId', protect, async (req, res) => {
  try {
    const doctorId = req.params.doctorId;

    // Get all contact user IDs
    const contacts = await query(
      'SELECT contact_user_id FROM contacts WHERE user_id = ?',
      [req.user._id]
    );
    if (!contacts.length) {
      return res.json({ hasTrustedVisits: false, count: 0, contacts: [] });
    }

    const contactIds = contacts.map(c => c.contact_user_id);
    const placeholders = contactIds.map(() => '?').join(',');

    const trustedVisits = await query(
      `SELECT c.date, c.category, u.name
       FROM consultations c
       LEFT JOIN users u ON c.patient_id = u.id
       WHERE c.patient_id IN (${placeholders})
         AND c.doctor_id = ?
         AND c.status = 'treated'`,
      [...contactIds, doctorId]
    );

    res.json({
      hasTrustedVisits: trustedVisits.length > 0,
      count: trustedVisits.length,
      contacts: trustedVisits.map(v => ({ name: v.name, date: v.date, category: v.category }))
    });
  } catch (error) {
    console.error('Trust check error:', error);
    res.status(500).json({ message: 'Error performing trust check' });
  }
});

/**
 * @route   GET /api/contacts/recommended-doctors
 * @desc    Find doctors trusted by the user's contacts
 */
router.get('/recommended-doctors', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    const contacts = await query(
      `SELECT c.contact_user_id, c.nickname, c.trust_level,
              u.name, u.phone, u.email, u.avatar
       FROM contacts c
       LEFT JOIN users u ON c.contact_user_id = u.id
       WHERE c.user_id = ?`,
      [userId]
    );

    if (!contacts.length) {
      return res.json({ hasContactsSynced: false, totalContactsCount: 0, recommendations: [] });
    }

    const contactIds = contacts.map(c => c.contact_user_id);
    const contactMap = new Map();
    contacts.forEach(c => contactMap.set(c.contact_user_id, c));

    const placeholders = contactIds.map(() => '?').join(',');

    const treatedConsultations = await query(
      `SELECT c.patient_id, c.date, c.category, c.diagnosis, c.rating,
              d.id AS doctor_id, d.name AS doctor_name, d.email AS doctor_email,
              d.specialty, d.hospital, d.qualifications, d.avatar AS doctor_avatar,
              d.experience, d.address, d.locality, d.rating AS doctor_rating,
              d.ratings_count AS doctor_ratings_count
       FROM consultations c
       LEFT JOIN users d ON c.doctor_id = d.id
       WHERE c.patient_id IN (${placeholders})
         AND c.status IN ('treated','completed','follow-up')
       ORDER BY c.date DESC`,
      contactIds
    );

    const doctorGroupMap = new Map();
    for (const record of treatedConsultations) {
      const docId = record.doctor_id;
      if (!docId) continue;
      const contactInfo = contactMap.get(record.patient_id);

      if (!doctorGroupMap.has(docId)) {
        doctorGroupMap.set(docId, {
          doctor: {
            _id:            docId,
            name:           record.doctor_name,
            email:          record.doctor_email,
            specialty:      record.specialty,
            hospital:       record.hospital,
            qualifications: record.qualifications,
            avatar:         record.doctor_avatar,
            experience:     record.experience,
            address:        record.address,
            locality:       record.locality,
            rating:         record.doctor_rating,
            ratingsCount:   record.doctor_ratings_count,
          },
          treatedContacts: [],
          uniquePatients: new Set(),
          categoriesTreated: new Set(),
          latestTreatedDate: record.date
        });
      }

      const entry = doctorGroupMap.get(docId);
      entry.uniquePatients.add(record.patient_id);
      if (record.category) entry.categoriesTreated.add(record.category);
      entry.treatedContacts.push({
        contactName: contactInfo?.nickname || contactInfo?.name || 'Contact',
        contactPhone: contactInfo?.phone || '',
        category: record.category || 'General',
        diagnosis: record.diagnosis || 'Treatment Completed',
        date: record.date,
        rating: record.rating || 5
      });
    }

    const recommendations = [];
    for (const [, entry] of doctorGroupMap) {
      const uniqueCount = entry.uniquePatients.size;
      const baseRating = entry.doctor.rating || 5.0;
      const trustScore = (uniqueCount * 10) + baseRating;
      recommendations.push({
        doctor: entry.doctor,
        trustScore,
        trustedContactsCount: uniqueCount,
        categories: Array.from(entry.categoriesTreated),
        latestTreatedDate: entry.latestTreatedDate,
        treatedContacts: entry.treatedContacts.slice(0, 5)
      });
    }
    recommendations.sort((a, b) => b.trustScore - a.trustScore);

    res.json({ hasContactsSynced: true, totalContactsCount: contacts.length, recommendations });
  } catch (error) {
    console.error('Recommended doctors error:', error);
    res.status(500).json({ message: 'Error computing doctor recommendations' });
  }
});

/**
 * @route   POST /api/contacts/sync
 * @desc    Bulk sync contacts from mobile (phone numbers) or web
 */
router.post('/sync', protect, async (req, res) => {
  try {
    const { emails, phones, contacts } = req.body;
    let searchPhones = [];
    let searchEmails = [];

    if (phones && Array.isArray(phones)) {
      searchPhones = phones.map(normalizePhone).filter(p => p.length >= 10);
    }
    if (contacts && Array.isArray(contacts)) {
      for (const c of contacts) {
        if (c.phone) { const n = normalizePhone(c.phone); if (n.length >= 10) searchPhones.push(n); }
        if (c.phoneNumbers && Array.isArray(c.phoneNumbers)) {
          c.phoneNumbers.forEach(pn => {
            const raw = typeof pn === 'string' ? pn : pn.number;
            const n = normalizePhone(raw); if (n.length >= 10) searchPhones.push(n);
          });
        }
        if (c.email) searchEmails.push(c.email.toLowerCase().trim());
        if (c.emails && Array.isArray(c.emails)) {
          c.emails.forEach(em => { const raw = typeof em === 'string' ? em : em.email; if (raw) searchEmails.push(raw.toLowerCase().trim()); });
        }
      }
    }
    if (emails && Array.isArray(emails)) {
      emails.forEach(e => searchEmails.push(e.toLowerCase().trim()));
    }

    searchPhones = [...new Set(searchPhones)];
    searchEmails = [...new Set(searchEmails)];

    // Build WHERE clause for MySQL
    const conditions = [];
    const vals = [];
    if (searchPhones.length > 0) {
      conditions.push(`phone IN (${searchPhones.map(() => '?').join(',')})`);
      vals.push(...searchPhones);
    }
    if (searchEmails.length > 0) {
      conditions.push(`email IN (${searchEmails.map(() => '?').join(',')})`);
      vals.push(...searchEmails);
    }

    let matchedUsers = [];
    if (conditions.length > 0) {
      vals.push(req.user._id);
      matchedUsers = await query(
        `SELECT id, name, phone, email, role, specialty, hospital, avatar
         FROM users WHERE (${conditions.join(' OR ')}) AND id != ?`,
        vals
      );
    }

    const syncedContacts = [];
    const matchesList = [];

    for (const u of matchedUsers) {
      const existing = await query(
        'SELECT id FROM contacts WHERE user_id = ? AND contact_user_id = ?',
        [req.user._id, u.id]
      );
      if (!existing.length) {
        await getPool().execute(
          'INSERT INTO contacts (user_id, contact_user_id, nickname, trust_level) VALUES (?, ?, ?, 3)',
          [req.user._id, u.id, u.name]
        );
      }

      const treatedVisits = await query(
        `SELECT c.category, c.date, d.id AS doctor_id, d.name AS doctor_name, d.specialty, d.hospital
         FROM consultations c
         LEFT JOIN users d ON c.doctor_id = d.id
         WHERE c.patient_id = ? AND c.status IN ('treated','completed','follow-up')`,
        [u.id]
      );

      matchesList.push({
        name: u.name, phone: u.phone, email: u.email,
        treatedRecords: treatedVisits.map(v => ({
          doctorId: v.doctor_id, doctorName: v.doctor_name, specialty: v.specialty,
          category: v.category, date: v.date
        })).filter(d => d.doctorName)
      });
      syncedContacts.push(u);
    }

    res.status(200).json({
      message: `Successfully synced ${syncedContacts.length} contacts`,
      contactsCount: syncedContacts.length,
      matches: matchesList
    });
  } catch (error) {
    console.error('Contacts sync error:', error);
    res.status(500).json({ message: 'Server error during contacts synchronization' });
  }
});

/**
 * @route   POST /api/contacts/deny
 * @desc    Deny contacts permission access
 */
router.post('/deny', protect, async (req, res) => {
  try {
    res.json({ message: 'Contacts permission status updated to denied' });
  } catch (error) {
    console.error('Deny contacts permission error:', error);
    res.status(500).json({ message: 'Server error during permission update' });
  }
});

module.exports = router;
