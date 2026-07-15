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
 * @route   POST /api/contacts/sync
 * @desc    Bulk sync contact emails from device or mock data
 */
router.post('/sync', protect, async (req, res) => {
  try {
    const { emails, contacts } = req.body;
    let matchingUsers = [];

    // Support email array sync (web app)
    if (emails && Array.isArray(emails)) {
      const lowercaseEmails = emails.map(email => email.toLowerCase().trim());
      const users = await User.find({
        email: { $in: lowercaseEmails },
        _id: { $ne: req.user._id }
      });
      matchingUsers = [...matchingUsers, ...users];
    }

    // Support contacts object array sync (mobile app)
    if (contacts && Array.isArray(contacts)) {
      const phones = contacts.map(c => c.phone?.trim()).filter(Boolean);
      const users = await User.find({
        phone: { $in: phones },
        _id: { $ne: req.user._id }
      });
      // Merge and prevent duplicates
      const existingIds = matchingUsers.map(u => u._id.toString());
      users.forEach(u => {
        if (!existingIds.includes(u._id.toString())) {
          matchingUsers.push(u);
        }
      });
    }

    const syncedContacts = [];
    const matchesList = [];

    for (const u of matchingUsers) {
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

      // Find recommendations: where this contact has been treated
      const treatedVisits = await Consultation.find({
        patientId: u._id,
        status: 'treated'
      }).populate('doctorId', 'name');

      const doctorNames = [...new Set(treatedVisits.map(v => v.doctorId?.name).filter(Boolean))];

      matchesList.push({
        name: u.name,
        phone: u.phone,
        email: u.email,
        treatedAtDoctors: doctorNames
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
