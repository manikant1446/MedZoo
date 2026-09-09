const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { query, getPool } = require('../config/db');
const { createNotification } = require('../utils/notify');

const router = express.Router();

// Temporary store for OTPs: phone -> { otp, expiresAt }
const tempOtps = new Map();

const generateToken = (id, phone, email, role) => {
  return jwt.sign(
    { id, phone, email, role },
    process.env.JWT_SECRET || 'medzoo_super_secret_key_2026',
    { expiresIn: '30d' }
  );
};

/**
 * Helper: Build a clean user response object (same shape as before for frontend compatibility)
 */
const buildUserResponse = (user, token) => ({
  _id: user.id,
  email: user.email || null,
  phone: user.phone || null,
  name: user.name,
  role: user.role,
  specialty: user.specialty || '',
  hospital: user.hospital || '',
  qualifications: user.qualifications || '',
  avatar: user.avatar || '',
  experience: user.experience || 0,
  address: user.address || '',
  locality: user.locality || '',
  rating: user.rating || 5.0,
  ratingsCount: user.ratings_count || 0,
  isVerified: !!user.is_verified,
  contactsPermissionStatus: user.contacts_permission_status || 'prompt',
  ...(token ? { token } : {}),
});

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user — phone number is required, email is optional
 */
router.post('/register', async (req, res) => {
  try {
    const { phone, email, password, name, role, specialty, hospital, qualifications } = req.body;

    // Validate required fields
    if (!phone || !password || !name || !role) {
      return res.status(400).json({ message: 'Phone number, name, password, and role are required' });
    }
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(phone.trim())) {
      return res.status(400).json({ message: 'Invalid phone number. It must contain only digits and be between 10 and 15 digits long.' });
    }
    if (!['patient', 'doctor'].includes(role)) {
      return res.status(400).json({ message: 'Role must be patient or doctor' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if phone already registered
    const existingByPhone = await query('SELECT id FROM users WHERE phone = ?', [phone.trim()]);
    if (existingByPhone.length > 0) {
      return res.status(400).json({ message: 'An account already exists with this phone number' });
    }

    // Check if email already registered (only if email provided)
    if (email) {
      const existingByEmail = await query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
      if (existingByEmail.length > 0) {
        return res.status(400).json({ message: 'An account already exists with this email address' });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user — SQL INSERT
    const [result] = await getPool().execute(
      `INSERT INTO users (phone, email, password, name, role, specialty, hospital, qualifications)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        phone.trim(),
        email ? email.toLowerCase().trim() : null,
        hashedPassword,
        name.trim(),
        role,
        role === 'doctor' ? (specialty || '') : '',
        role === 'doctor' ? (hospital || '') : '',
        role === 'doctor' ? (qualifications || '') : '',
      ]
    );

    // Fetch newly created user
    const users = await query('SELECT * FROM users WHERE id = ?', [result.insertId]);
    const user = users[0];

    const token = generateToken(user.id, user.phone, user.email, user.role);
    res.status(201).json(buildUserResponse(user, token));
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Phone or email already registered' });
    }
    res.status(500).json({ message: 'Server error during registration' });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user — accepts phone number OR email
 */
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Please provide phone/email and password' });
    }

    const cleanIdentifier = identifier.trim();
    const digitsOnly = cleanIdentifier.replace(/[^0-9]/g, '');
    const last10Digits = digitsOnly.slice(-10);

    // Try to find user by email or various phone formats
    let users = await query(
      'SELECT * FROM users WHERE email = ? OR phone = ?',
      [cleanIdentifier.toLowerCase(), cleanIdentifier]
    );

    // Try last 10 digits of phone
    if (!users.length && last10Digits.length === 10) {
      users = await query(
        'SELECT * FROM users WHERE phone IN (?, ?, ?, ?)',
        [last10Digits, `+91${last10Digits}`, `+91 ${last10Digits}`, `91${last10Digits}`]
      );
    }

    if (!users.length) {
      return res.status(401).json({ message: 'No account found with this phone/email' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid phone/email or password' });
    }

    const token = generateToken(user.id, user.phone, user.email, user.role);
    res.json(buildUserResponse(user, token));
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 */
const { protect } = require('../middleware/auth');
router.get('/me', protect, (req, res) => {
  res.json(req.user);
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 */
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, avatar, address, locality, experience, hospital, email, specialty, qualifications } = req.body;

    const userId = req.user._id;

    // Build dynamic SET clause
    const fields = [];
    const values = [];

    if (name)              { fields.push('name = ?');           values.push(name.trim()); }
    if (avatar !== undefined) { fields.push('avatar = ?');      values.push(avatar); }
    if (address !== undefined){ fields.push('address = ?');     values.push(address); }
    if (locality !== undefined){ fields.push('locality = ?');   values.push(locality); }

    // Phone update
    if (phone !== undefined && phone.trim() !== '') {
      const cleanPhone = phone.trim().replace(/[^0-9]/g, '').slice(-10);
      if (cleanPhone.length !== 10) {
        return res.status(400).json({ message: 'Phone number must be a valid 10-digit number' });
      }
      const existingPhone = await query('SELECT id FROM users WHERE phone = ? AND id != ?', [cleanPhone, userId]);
      if (existingPhone.length > 0) {
        return res.status(400).json({ message: 'This phone number is already registered to another user' });
      }
      fields.push('phone = ?');
      values.push(cleanPhone);
    }

    // Email update
    if (email !== undefined) {
      if (email && email.trim() !== '') {
        const existingEmail = await query('SELECT id FROM users WHERE email = ? AND id != ?', [email.toLowerCase().trim(), userId]);
        if (existingEmail.length > 0) {
          return res.status(400).json({ message: 'This email is already used by another account' });
        }
        fields.push('email = ?');
        values.push(email.toLowerCase().trim());
      } else {
        fields.push('email = ?');
        values.push(null); // allow removing email
      }
    }

    // Doctor-only fields
    if (req.user.role === 'doctor') {
      if (specialty !== undefined)     { fields.push('specialty = ?');      values.push(specialty.trim()); }
      if (hospital !== undefined)      { fields.push('hospital = ?');       values.push(hospital.trim()); }
      if (qualifications !== undefined){ fields.push('qualifications = ?'); values.push(qualifications.trim()); }
      if (experience !== undefined)    { fields.push('experience = ?');     values.push(Number(experience) || 0); }
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(userId);
    await getPool().execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);

    const updated = await query('SELECT * FROM users WHERE id = ?', [userId]);
    res.json(buildUserResponse(updated[0]));
  } catch (error) {
    console.error('Update profile error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'This email is already registered' });
    }
    res.status(500).json({ message: 'Server error during profile update' });
  }
});

/**
 * @route   POST /api/auth/forgot-password
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }
    const users = await query('SELECT id FROM users WHERE phone = ?', [phone.trim()]);
    if (!users.length) {
      return res.status(404).json({ message: 'No user registered with this phone number' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    tempOtps.set(phone.trim(), { otp, expiresAt: Date.now() + 10 * 60 * 1000 });

    console.log(`🔑 [OTP Verification] Phone: ${phone.trim()} | Code: ${otp}`);
    res.json({ message: 'Simulated OTP sent successfully', otp });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error during password recovery' });
  }
});

/**
 * @route   POST /api/auth/verify-otp
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone number and OTP are required' });
    }
    const record = tempOtps.get(phone.trim());
    if (!record) {
      return res.status(400).json({ message: 'No OTP requested for this phone number' });
    }
    if (Date.now() > record.expiresAt) {
      tempOtps.delete(phone.trim());
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }
    if (record.otp !== otp.trim()) {
      return res.status(400).json({ message: 'Invalid OTP code. Please check and try again.' });
    }
    res.json({ message: 'OTP verified successfully', verified: true });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
});

/**
 * @route   POST /api/auth/reset-password
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { phone, password, otp } = req.body;
    if (!phone || !password || !otp) {
      return res.status(400).json({ message: 'Phone, password, and OTP are required' });
    }
    const record = tempOtps.get(phone.trim());
    if (!record || record.otp !== otp.trim()) {
      return res.status(400).json({ message: 'Unauthorized password reset. Verify OTP first.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const users = await query('SELECT id FROM users WHERE phone = ?', [phone.trim()]);
    if (!users.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    await getPool().execute('UPDATE users SET password = ? WHERE phone = ?', [hashedPassword, phone.trim()]);

    tempOtps.delete(phone.trim());
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
});

/**
 * @route   POST /api/auth/invite
 * @desc    Create an invitation for team member (Doctor only)
 *          Works for both NEW and ALREADY REGISTERED users
 */
router.post('/invite', protect, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctor accounts can invite collaborators/staff' });
    }
    const { phone, role } = req.body;
    if (!phone || !role) {
      return res.status(400).json({ message: 'Phone number and role are required' });
    }
    if (!['doctor', 'staff'].includes(role)) {
      return res.status(400).json({ message: 'Role must be doctor or staff' });
    }

    const cleanPhone = phone.trim();
    const existing = await query('SELECT id, name, phone, email, role FROM users WHERE phone = ?', [cleanPhone]);
    const isExistingUser = existing.length > 0;
    const existingUser = isExistingUser ? existing[0] : null;

    if (isExistingUser && existingUser.id === req.user._id) {
      return res.status(400).json({ message: 'You cannot invite yourself to your own team' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const expiresAtStr = expiresAt.toISOString().slice(0, 19).replace('T', ' ');

    const [result] = await getPool().execute(
      'INSERT INTO invitations (phone, role, invited_by, token, expires_at, status) VALUES (?, ?, ?, ?, ?, ?)',
      [cleanPhone, role, req.user._id, token, expiresAtStr, 'pending']
    );

    // If invited user is already a registered MedZoo user, send an in-app notification!
    const io = req.app.get('io');
    if (isExistingUser) {
      await createNotification(io, {
        userId: existingUser.id,
        type: 'team_invitation',
        title: '🤝 Clinic Team Invitation',
        message: `Dr. ${req.user.name} invited you to join their clinic team to handle & manage patient appointments.`,
        data: {
          invitationId: result.insertId,
          token,
          doctorId: req.user._id,
          doctorName: req.user.name,
          role,
          status: 'pending'
        }
      });
    }

    const invitations = await query('SELECT * FROM invitations WHERE id = ?', [result.insertId]);
    res.status(201).json({
      message: isExistingUser
        ? `Invitation notification sent to ${existingUser.name}! They can accept it directly from their notifications.`
        : 'Invitation link generated successfully',
      token,
      isExistingUser,
      existingUser: existingUser ? { id: existingUser.id, name: existingUser.name, phone: existingUser.phone } : null,
      invitation: invitations[0]
    });
  } catch (error) {
    console.error('Invite error:', error);
    res.status(500).json({ message: 'Server error during invitation creation' });
  }
});

/**
 * @route   GET /api/auth/invite/:token
 * @desc    Get invitation details and check if user already exists
 */
router.get('/invite/:token', async (req, res) => {
  try {
    const invitations = await query(
      `SELECT i.*, d.name AS doctor_name, d.specialty AS doctor_specialty, d.hospital AS doctor_hospital
       FROM invitations i
       LEFT JOIN users d ON i.invited_by = d.id
       WHERE i.token = ?`,
      [req.params.token]
    );
    if (!invitations.length) {
      return res.status(404).json({ message: 'Invalid or expired invitation token' });
    }
    const invitation = invitations[0];

    if (new Date() > new Date(invitation.expires_at)) {
      return res.status(400).json({ message: 'This invitation link has expired' });
    }

    // Check if user already exists
    const existing = await query('SELECT id, name, phone, email, role FROM users WHERE phone = ?', [invitation.phone]);
    const isExistingUser = existing.length > 0;
    const existingUser = isExistingUser ? existing[0] : null;

    res.json({
      ...invitation,
      isExistingUser,
      existingUser: existingUser ? { id: existingUser.id, name: existingUser.name, phone: existingUser.phone, email: existingUser.email } : null,
      doctorName: invitation.doctor_name,
      doctorSpecialty: invitation.doctor_specialty,
      doctorHospital: invitation.doctor_hospital
    });
  } catch (error) {
    console.error('Get invite error:', error);
    res.status(500).json({ message: 'Server error during invitation check' });
  }
});

/**
 * @route   POST /api/auth/invite/accept
 * @desc    Accept invitation and link to doctor_staff (supports existing & new users)
 */
router.post('/invite/accept', async (req, res) => {
  try {
    const { token, name, password } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    const invitations = await query('SELECT * FROM invitations WHERE token = ?', [token]);
    if (!invitations.length) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    const invite = invitations[0];

    if (new Date() > new Date(invite.expires_at)) {
      return res.status(400).json({ message: 'This invitation link has expired' });
    }

    // Check if user already exists with this phone
    const existing = await query('SELECT id, name, phone, email, role FROM users WHERE phone = ?', [invite.phone]);

    let user;
    const io = req.app.get('io');

    if (existing.length > 0) {
      // Existing user: Link to doctor_staff table directly! Keep original user.role!
      user = existing[0];
      await getPool().execute(
        `INSERT INTO doctor_staff (doctor_id, user_id, role, status)
         VALUES (?, ?, ?, 'active')
         ON DUPLICATE KEY UPDATE role = VALUES(role), status = 'active'`,
        [invite.invited_by, user.id, invite.role]
      );
      await getPool().execute("UPDATE invitations SET status = 'accepted' WHERE id = ?", [invite.id]);

      // Update any notification for this invite
      await getPool().execute(
        "UPDATE notifications SET is_read = 1, title = '🤝 Clinic Team Invitation (Accepted)' WHERE user_id = ? AND type = 'team_invitation' AND JSON_UNQUOTE(JSON_EXTRACT(data, '$.token')) = ?",
        [user.id, token]
      );
    } else {
      // New user: requires name and password
      if (!name || !password) {
        return res.status(400).json({ message: 'Name and password are required for new registration' });
      }
      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }

      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);

      const [result] = await getPool().execute(
        'INSERT INTO users (phone, name, password, role, is_verified) VALUES (?, ?, ?, ?, 1)',
        [invite.phone, name.trim(), hashedPassword, invite.role]
      );
      const newUserId = result.insertId;

      await getPool().execute(
        `INSERT INTO doctor_staff (doctor_id, user_id, role, status)
         VALUES (?, ?, ?, 'active')`,
        [invite.invited_by, newUserId, invite.role]
      );

      await getPool().execute("UPDATE invitations SET status = 'accepted' WHERE id = ?", [invite.id]);

      const users = await query('SELECT * FROM users WHERE id = ?', [newUserId]);
      user = users[0];
    }

    // Notify the inviting doctor
    if (io) {
      await createNotification(io, {
        userId: invite.invited_by,
        type: 'team_accepted',
        title: 'Team Member Joined',
        message: `${user.name} accepted your clinic invitation and can now manage appointments.`,
        data: { staffUserId: user.id, staffName: user.name, role: invite.role }
      });
      io.emit(`team_update_${invite.invited_by}`, { staffUserId: user.id });
    }

    const jwtToken = generateToken(user.id, user.phone, user.email, user.role);
    res.status(201).json(buildUserResponse(user, jwtToken));
  } catch (error) {
    console.error('Accept invite error:', error);
    res.status(500).json({ message: 'Server error during invitation acceptance' });
  }
});

/**
 * @route   GET /api/auth/staff-assignments
 * @desc    Get active doctor clinic assignments for logged-in user
 */
router.get('/staff-assignments', protect, async (req, res) => {
  try {
    const assignments = await query(
      `SELECT ds.id, ds.doctor_id, ds.role, ds.status,
              d.name AS doctor_name, d.specialty, d.hospital, d.avatar, d.email
       FROM doctor_staff ds
       JOIN users d ON ds.doctor_id = d.id
       WHERE ds.user_id = ? AND ds.status = 'active'`,
      [req.user._id]
    );
    res.json({
      isStaff: assignments.length > 0,
      assignments
    });
  } catch (err) {
    console.error('Fetch staff assignments error:', err);
    res.status(500).json({ message: 'Error fetching staff assignments' });
  }
});

/**
 * @route   GET /api/auth/team
 * @desc    Get active team members for doctor's clinic
 */
router.get('/team', protect, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctor accounts can view team members' });
    }
    const rows = await query(
      `SELECT ds.id, ds.role, ds.status, ds.created_at,
              u.id AS user_id, u.name, u.email, u.phone, u.avatar
       FROM doctor_staff ds
       JOIN users u ON ds.user_id = u.id
       WHERE ds.doctor_id = ? AND ds.status = 'active'
       ORDER BY ds.created_at DESC`,
      [req.user._id]
    );
    const pending = await query(
      `SELECT id, phone, role, status, created_at, expires_at
       FROM invitations
       WHERE invited_by = ? AND status = 'pending'
       ORDER BY created_at DESC`,
      [req.user._id]
    );
    res.json({
      teamMembers: rows,
      pendingInvitations: pending,
      count: rows.length
    });
  } catch (error) {
    console.error('Fetch team error:', error);
    res.status(500).json({ message: 'Error fetching team members' });
  }
});

/**
 * @route   DELETE /api/auth/invitations/:id
 * @desc    Cancel a pending invitation
 */
router.delete('/invitations/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctor accounts can manage invitations' });
    }
    await getPool().execute(
      "DELETE FROM invitations WHERE id = ? AND invited_by = ? AND status = 'pending'",
      [req.params.id, req.user._id]
    );
    const io = req.app.get('io');
    if (io) {
      io.emit(`team_update_${req.user._id}`, { action: 'invite_cancelled' });
    }
    res.json({ message: 'Invitation cancelled successfully' });
  } catch (error) {
    console.error('Cancel invite error:', error);
    res.status(500).json({ message: 'Error cancelling invitation' });
  }
});

/**
 * @route   DELETE /api/auth/team/:id
 * @desc    Remove team member from clinic
 */
router.delete('/team/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctor accounts can manage team members' });
    }
    await getPool().execute(
      'DELETE FROM doctor_staff WHERE id = ? AND doctor_id = ?',
      [req.params.id, req.user._id]
    );
    const io = req.app.get('io');
    if (io) {
      io.emit(`team_update_${req.user._id}`, { action: 'removed' });
    }
    res.json({ message: 'Team member removed from your clinic team' });
  } catch (error) {
    console.error('Remove team member error:', error);
    res.status(500).json({ message: 'Error removing team member' });
  }
});

/**
 * @route   POST /api/auth/leave-clinic
 * @desc    Allows an assistant/staff member to voluntarily step down / leave a doctor's clinic
 */
router.post('/leave-clinic', protect, async (req, res) => {
  try {
    const { doctorId } = req.body;
    let targetDoctorId = doctorId;

    if (!targetDoctorId) {
      const activeRows = await query(
        "SELECT doctor_id FROM doctor_staff WHERE user_id = ? AND status = 'active' LIMIT 1",
        [req.user._id]
      );
      if (activeRows.length > 0) {
        targetDoctorId = activeRows[0].doctor_id;
      }
    }

    if (!targetDoctorId) {
      return res.status(400).json({ message: 'No active clinic staff assignment found' });
    }

    // Get doctor name before deleting
    const docRows = await query('SELECT name FROM users WHERE id = ?', [targetDoctorId]);
    const doctorName = docRows[0]?.name || 'Doctor';

    // Remove staff assignment
    await getPool().execute(
      'DELETE FROM doctor_staff WHERE user_id = ? AND doctor_id = ?',
      [req.user._id, targetDoctorId]
    );

    const io = req.app.get('io');
    if (io) {
      await createNotification(io, {
        userId: targetDoctorId,
        type: 'team_left',
        title: 'Staff Member Stepped Down',
        message: `${req.user.name} (${req.user.phone}) has completed their duties and stepped down from your clinic assistant staff.`,
        data: { staffUserId: req.user._id, staffName: req.user.name }
      });
      io.emit(`team_update_${targetDoctorId}`, { staffUserId: req.user._id, action: 'left' });
    }

    res.json({
      message: `You have successfully stepped down from Dr. ${doctorName}'s clinic staff.`,
      doctorName
    });
  } catch (error) {
    console.error('Leave clinic error:', error);
    res.status(500).json({ message: 'Error processing resignation from clinic staff' });
  }
});

module.exports = router;
