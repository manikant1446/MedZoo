const express = require('express');
const { protect } = require('../middleware/auth');
const Contact = require('../models/Contact');
const User = require('../models/User');
const Consultation = require('../models/Consultation');

const router = express.Router();

/**
 * @route   GET /api/contacts
 * @desc    Get all contacts for the current user
 */
router.get('/', protect, async (req, res) => {
  try {
    const contacts = await Contact.find({ userId: req.user._id })
      .populate('contactUserId', 'name email role walletAddress specialty hospital avatar');
    res.json(contacts);
  } catch (error) {
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

    const contactUser = await User.findOne({ email: email.toLowerCase() });
    if (!contactUser) {
      return res.status(404).json({ message: 'User not found with that email' });
    }
    if (contactUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot add yourself as a contact' });
    }

    const existingContact = await Contact.findOne({
      userId: req.user._id,
      contactUserId: contactUser._id
    });
    if (existingContact) {
      return res.status(400).json({ message: 'Contact already exists' });
    }

    const contact = await Contact.create({
      userId: req.user._id,
      contactUserId: contactUser._id,
      nickname: nickname || contactUser.name,
      trustLevel: trustLevel || 3
    });

    const populated = await contact.populate('contactUserId', 'name email role walletAddress specialty hospital avatar');
    res.status(201).json(populated);
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
    await Contact.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ message: 'Contact removed' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing contact' });
  }
});

/**
 * @route   GET /api/contacts/trust-check/:doctorId
 * @desc    Check if any of user's contacts have visited a specific doctor
 *          This implements the Trust-Based Discovery feature
 */
router.get('/trust-check/:doctorId', protect, async (req, res) => {
  try {
    const doctorId = req.params.doctorId;

    // Get all of the user's contacts
    const contacts = await Contact.find({ userId: req.user._id });
    const contactUserIds = contacts.map(c => c.contactUserId);

    // Find consultations where those contacts were treated by this doctor
    const trustedVisits = await Consultation.find({
      patientId: { $in: contactUserIds },
      doctorId: doctorId,
      status: 'treated'
    }).populate('patientId', 'name email');

    // Get the contact names who visited this doctor
    const trustedContacts = trustedVisits.map(v => ({
      name: v.patientId.name,
      date: v.date,
      category: v.category
    }));

    res.json({
      hasTrustedVisits: trustedContacts.length > 0,
      count: trustedContacts.length,
      contacts: trustedContacts
    });
  } catch (error) {
    console.error('Trust check error:', error);
    res.status(500).json({ message: 'Error performing trust check' });
  }
});

/**
 * Helper: Normalize phone numbers (strip spaces, dashes, +91 etc.)
 */
const normalizePhone = (raw) => {
  if (!raw) return '';
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length > 10 && digits.startsWith('91')) {
    return digits.slice(-10);
  }
  if (digits.length > 10 && digits.startsWith('0')) {
    return digits.slice(-10);
  }
  return digits.slice(-10);
};

/**
 * @route   GET /api/contacts/recommended-doctors
 * @desc    Smart Recommendation Algorithm:
 *          Find doctors who have successfully treated people in the user's phone contacts.
 */
router.get('/recommended-doctors', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Fetch user's saved contacts
    const contacts = await Contact.find({ userId }).populate('contactUserId', 'name phone email avatar');
    if (!contacts || contacts.length === 0) {
      return res.json({
        hasContactsSynced: false,
        totalContactsCount: 0,
        recommendations: []
      });
    }

    const contactMap = new Map();
    const contactUserIds = [];
    for (const c of contacts) {
      if (c.contactUserId) {
        contactUserIds.push(c.contactUserId._id);
        contactMap.set(c.contactUserId._id.toString(), {
          name: c.contactUserId.name,
          phone: c.contactUserId.phone,
          nickname: c.nickname || c.contactUserId.name,
          trustLevel: c.trustLevel || 3
        });
      }
    }

    // 2. Query all consultations where these contacts were treated
    const treatedConsultations = await Consultation.find({
      patientId: { $in: contactUserIds },
      status: { $in: ['treated', 'completed', 'follow-up'] }
    })
      .populate('doctorId', 'name email specialty hospital qualifications avatar experience address locality rating ratingsCount')
      .sort({ date: -1 });

    // 3. Group by doctor and build rich trust evidence
    const doctorGroupMap = new Map();

    for (const record of treatedConsultations) {
      const doc = record.doctorId;
      if (!doc) continue;

      const docIdStr = doc._id.toString();
      const patientIdStr = record.patientId.toString();
      const contactInfo = contactMap.get(patientIdStr);

      if (!doctorGroupMap.has(docIdStr)) {
        doctorGroupMap.set(docIdStr, {
          doctor: doc,
          treatedContacts: [],
          uniquePatients: new Set(),
          categoriesTreated: new Set(),
          latestTreatedDate: record.date
        });
      }

      const entry = doctorGroupMap.get(docIdStr);
      entry.uniquePatients.add(patientIdStr);
      if (record.category) entry.categoriesTreated.add(record.category);

      // Add treated contact info if not already added or add specific diagnosis
      entry.treatedContacts.push({
        contactName: contactInfo?.nickname || contactInfo?.name || 'Contact',
        contactPhone: contactInfo?.phone || '',
        category: record.category || 'General',
        diagnosis: record.diagnosis || 'Treatment Completed',
        date: record.date,
        rating: record.rating || 5
      });
    }

    // 4. Calculate Trust Score & rank doctors
    const recommendations = [];
    for (const [docId, entry] of doctorGroupMap.entries()) {
      const uniqueCount = entry.uniquePatients.size;
      const baseRating = entry.doctor.rating || 5.0;
      // Trust score: (unique contacts treated * 10) + doctor rating
      const trustScore = (uniqueCount * 10) + baseRating;

      recommendations.push({
        doctor: entry.doctor,
        trustScore,
        trustedContactsCount: uniqueCount,
        categories: Array.from(entry.categoriesTreated),
        latestTreatedDate: entry.latestTreatedDate,
        treatedContacts: entry.treatedContacts.slice(0, 5) // top 5 recent treated contacts
      });
    }

    // Sort descending by trustScore
    recommendations.sort((a, b) => b.trustScore - a.trustScore);

    res.json({
      hasContactsSynced: true,
      totalContactsCount: contacts.length,
      recommendations
    });
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

    // Array of raw phones
    if (phones && Array.isArray(phones)) {
      searchPhones = phones.map(normalizePhone).filter(p => p.length >= 10);
    }

    // Array of contact objects: [{ name, phone, phoneNumbers, emails }]
    if (contacts && Array.isArray(contacts)) {
      for (const c of contacts) {
        if (c.phone) {
          const norm = normalizePhone(c.phone);
          if (norm.length >= 10) searchPhones.push(norm);
        }
        if (c.phoneNumbers && Array.isArray(c.phoneNumbers)) {
          c.phoneNumbers.forEach(pn => {
            const raw = typeof pn === 'string' ? pn : pn.number;
            const norm = normalizePhone(raw);
            if (norm.length >= 10) searchPhones.push(norm);
          });
        }
        if (c.email) searchEmails.push(c.email.toLowerCase().trim());
        if (c.emails && Array.isArray(c.emails)) {
          c.emails.forEach(em => {
            const raw = typeof em === 'string' ? em : em.email;
            if (raw) searchEmails.push(raw.toLowerCase().trim());
          });
        }
      }
    }

    // Email array fallback
    if (emails && Array.isArray(emails)) {
      emails.forEach(e => searchEmails.push(e.toLowerCase().trim()));
    }

    searchPhones = [...new Set(searchPhones)];
    searchEmails = [...new Set(searchEmails)];

    // Query matched users (exclude self)
    const orConditions = [];
    if (searchPhones.length > 0) {
      orConditions.push({ phone: { $in: searchPhones } });
    }
    if (searchEmails.length > 0) {
      orConditions.push({ email: { $in: searchEmails } });
    }

    let matchedUsers = [];
    if (orConditions.length > 0) {
      matchedUsers = await User.find({
        $or: orConditions,
        _id: { $ne: req.user._id }
      }).select('name phone email role specialty hospital avatar');
    }

    const syncedContacts = [];
    const matchesList = [];

    for (const u of matchedUsers) {
      const existing = await Contact.findOne({
        userId: req.user._id,
        contactUserId: u._id
      });

      if (!existing) {
        await Contact.create({
          userId: req.user._id,
          contactUserId: u._id,
          nickname: u.name,
          trustLevel: 3
        });
      }

      // Check where this contact has been treated
      const treatedVisits = await Consultation.find({
        patientId: u._id,
        status: { $in: ['treated', 'completed', 'follow-up'] }
      }).populate('doctorId', 'name specialty hospital');

      const doctorDetails = treatedVisits.map(v => ({
        doctorId: v.doctorId?._id,
        doctorName: v.doctorId?.name,
        specialty: v.doctorId?.specialty,
        category: v.category,
        date: v.date
      })).filter(d => d.doctorName);

      matchesList.push({
        name: u.name,
        phone: u.phone,
        email: u.email,
        treatedRecords: doctorDetails
      });
      syncedContacts.push(u);
    }

    // Update permission status to granted
    await User.findByIdAndUpdate(req.user._id, { contactsPermissionStatus: 'granted' });

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
    await User.findByIdAndUpdate(req.user._id, { contactsPermissionStatus: 'denied' });
    res.json({ message: 'Contacts permission status updated to denied' });
  } catch (error) {
    console.error('Deny contacts permission error:', error);
    res.status(500).json({ message: 'Server error during permission update' });
  }
});

module.exports = router;
