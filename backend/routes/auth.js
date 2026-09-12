const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const { query, getPool } = require('../config/db');
const { createNotification } = require('../utils/notify');
const { sendOtpEmail } = require('../utils/mailer');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
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
    const { phone, email, password, name, role, specialty, hospital, qualifications, experience, address, locality } = req.body;

    // Validate required fields
    if (!phone || !email || !password || !name || !role) {
      return res.status(400).json({ message: 'Name, phone number, email/Gmail, password, and role are all required' });
    }

    // Validate 10-digit Indian phone number
    const cleanPhone = phone.trim().replace(/[^0-9]/g, '').slice(-10);
    if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number (e.g. 9876543210)' });
    }

    // Validate email / Gmail format
    const cleanEmail = email.toLowerCase().trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ message: 'Please enter a valid Email address' });
    }

    if (!['patient', 'doctor'].includes(role)) {
      return res.status(400).json({ message: 'Role must be patient or doctor' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if phone already registered
    const existingByPhone = await query('SELECT id FROM users WHERE phone IN (?, ?, ?, ?)', [
      cleanPhone,
      `+91${cleanPhone}`,
      `+91 ${cleanPhone}`,
      phone.trim()
    ]);
    if (existingByPhone.length > 0) {
      return res.status(400).json({ message: 'An account already exists with this phone number' });
    }

    // Check if email already registered
    const existingByEmail = await query('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existingByEmail.length > 0) {
      return res.status(400).json({ message: 'An account already exists with this Email address' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user — SQL INSERT
    const [result] = await getPool().execute(
      `INSERT INTO users (phone, email, password, name, role, specialty, hospital, qualifications, experience, address, locality)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        phone.trim(),
        email ? email.toLowerCase().trim() : null,
        hashedPassword,
        name.trim(),
        role,
        role === 'doctor' ? (specialty || '') : '',
        role === 'doctor' ? (hospital || '') : '',
        role === 'doctor' ? (qualifications || '') : '',
        role === 'doctor' ? (Number(experience) || 0) : 0,
        role === 'doctor' ? (address || '') : '',
        role === 'doctor' ? (locality || '') : '',
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
    if (phone !== undefined) {
      if (phone && phone.trim() !== '') {
        const cleanPhone = phone.trim().replace(/[^0-9]/g, '').slice(-10);
        if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
          return res.status(400).json({ message: 'Phone number must be a valid 10-digit mobile number' });
        }
        const existingPhone = await query(
          'SELECT id FROM users WHERE phone IN (?, ?, ?, ?) AND id != ?',
          [cleanPhone, `+91${cleanPhone}`, `+91 ${cleanPhone}`, phone.trim(), userId]
        );
        if (existingPhone.length > 0) {
          return res.status(400).json({ message: 'This phone number is already registered to another user' });
        }
        fields.push('phone = ?');
        values.push(cleanPhone);
      }
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

// Helper to mask email for privacy
const maskEmail = (email) => {
  if (!email || !email.includes('@')) return email || '';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `${user[0]}***@${domain}`;
  return `${user.slice(0, 2)}****${user.slice(-1)}@${domain}`;
};

/**
 * @route   POST /api/auth/google
 * @desc    Authenticate with Google ID Token (Sign in / Sign up)
 */
router.post('/google', async (req, res) => {
  try {
    const { credential, role = 'patient' } = req.body;
    if (!credential) {
      return res.status(400).json({ message: 'Google credential token is required' });
    }

    let payload = null;
    try {
      if (process.env.GOOGLE_CLIENT_ID) {
        const ticket = await googleClient.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
      } else {
        // Fallback: decode JWT payload from Google GSI
        const parts = credential.split('.');
        if (parts.length === 3) {
          payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        }
      }
    } catch (verErr) {
      console.warn('Google token verify warning, using decoded payload:', verErr.message);
      const parts = credential.split('.');
      if (parts.length === 3) {
        payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      }
    }

    if (!payload || !payload.email) {
      return res.status(400).json({ message: 'Could not extract profile from Google account' });
    }

    const email = payload.email.toLowerCase().trim();
    const name = payload.name || payload.given_name || 'Google User';
    const avatar = payload.picture || '';

    // Check if user exists with this email
    let users = await query('SELECT * FROM users WHERE email = ?', [email]);
    let user = null;

    let isNewUser = false;
    if (users.length > 0) {
      user = users[0];
      // Update avatar if not present
      if (!user.avatar && avatar) {
        await getPool().execute('UPDATE users SET avatar = ? WHERE id = ?', [avatar, user.id]);
        user.avatar = avatar;
      }
    } else {
      isNewUser = true;
      // Auto-register new user via Google
      const randomPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);
      const [result] = await getPool().execute(
        `INSERT INTO users (name, email, password, role, avatar, is_verified)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [name, email, randomPassword, role === 'doctor' ? 'doctor' : 'patient', avatar]
      );
      const createdUsers = await query('SELECT * FROM users WHERE id = ?', [result.insertId]);
      user = createdUsers[0];
    }

    const isProfileIncomplete = !user.phone;
    const token = generateToken(user.id, user.phone, user.email, user.role);
    res.json({
      ...buildUserResponse(user, token),
      isNewUser,
      isProfileIncomplete,
    });
  } catch (error) {
    console.error('Google Auth error:', error);
    res.status(500).json({ message: 'Error authenticating with Google' });
  }
});

/**
 * @route   POST /api/auth/complete-profile
 * @desc    Complete profile for Google users (set name, phone, password, role)
 */
router.post('/complete-profile', protect, async (req, res) => {
  try {
    const { name, phone, password, role, specialty, hospital, qualifications, experience, address, locality } = req.body;
    const userId = req.user._id;

    if (!phone || !password) {
      return res.status(400).json({ message: '10-digit mobile number and password are required.' });
    }

    const cleanPhone = phone.trim().replace(/[^0-9]/g, '').slice(-10);
    if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit Indian mobile number.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    // Check if phone already registered to another user
    const existing = await query(
      'SELECT id FROM users WHERE phone IN (?, ?, ?, ?) AND id != ?',
      [cleanPhone, `+91${cleanPhone}`, `+91 ${cleanPhone}`, phone.trim(), userId]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: 'This phone number is already registered to another account.' });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userRole = ['patient', 'doctor'].includes(role) ? role : (req.user.role || 'patient');
    const userName = name && name.trim() ? name.trim() : req.user.name;

    await getPool().execute(
      `UPDATE users 
       SET name = ?, phone = ?, password = ?, role = ?, specialty = ?, hospital = ?, qualifications = ?, experience = ?, address = ?, locality = ?
       WHERE id = ?`,
      [
        userName,
        cleanPhone,
        hashedPassword,
        userRole,
        userRole === 'doctor' ? (specialty || '') : '',
        userRole === 'doctor' ? (hospital || '') : '',
        userRole === 'doctor' ? (qualifications || '') : '',
        userRole === 'doctor' ? (Number(experience) || 0) : 0,
        userRole === 'doctor' ? (address || '') : '',
        userRole === 'doctor' ? (locality || '') : '',
        userId
      ]
    );

    const updated = await query('SELECT * FROM users WHERE id = ?', [userId]);
    const updatedUser = updated[0];
    const token = generateToken(updatedUser.id, updatedUser.phone, updatedUser.email, updatedUser.role);
    res.json(buildUserResponse(updatedUser, token));
  } catch (error) {
    console.error('Complete profile error:', error);
    res.status(500).json({ message: 'Server error completing profile.' });
  }
});

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change / update password from Security settings
 */
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    if (!currentPassword) {
      return res.status(400).json({ message: 'Current password is required to change your password.' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
    }

    // Fetch user with password hash
    const users = await query('SELECT * FROM users WHERE id = ?', [userId]);
    if (!users.length) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const user = users[0];

    // Always verify current password before allowing change
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await getPool().execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

    res.json({ success: true, message: 'Password updated successfully!' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error updating password.' });
  }
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send OTP to user's registered Gmail (or phone)
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { identifier, phone, email } = req.body;
    const input = (identifier || email || phone || '').trim();
    if (!input) {
      return res.status(400).json({ message: 'Please provide your registered Gmail address or phone number' });
    }

    let users = [];
    const isEmail = input.includes('@');
    if (isEmail) {
      users = await query('SELECT * FROM users WHERE email = ?', [input.toLowerCase()]);
    } else {
      const cleanPhone = input.replace(/[^0-9]/g, '').slice(-10);
      users = await query(
        'SELECT * FROM users WHERE phone IN (?, ?, ?, ?) OR email = ?',
        [cleanPhone, `+91${cleanPhone}`, `+91 ${cleanPhone}`, input, input.toLowerCase()]
      );
    }

    if (!users.length) {
      return res.status(404).json({ message: 'No account found with this Gmail / phone number' });
    }

    const user = users[0];
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store in tempOtps map by multiple keys for reliable lookup
    const record = { otp, userId: user.id, email: user.email, phone: user.phone, expiresAt };
    if (user.email) tempOtps.set(user.email.toLowerCase(), record);
    if (user.phone) {
      const cleanP = user.phone.replace(/[^0-9]/g, '').slice(-10);
      tempOtps.set(cleanP, record);
      tempOtps.set(user.phone, record);
    }
    tempOtps.set(input.toLowerCase(), record);

    // Send Real OTP Email to Gmail if email exists
    let mailSuccess = false;
    if (user.email) {
      const mailRes = await sendOtpEmail(user.email, otp, user.name, 'password_reset');
      mailSuccess = mailRes.success;
    }

    console.log(`🔑 [OTP Verification Code] Target: ${user.email || user.phone} | Code: ${otp}`);

    res.json({
      message: user.email 
        ? `Verification OTP sent to your Gmail (${maskEmail(user.email)})` 
        : 'OTP generated for your registered account',
      targetEmail: user.email ? maskEmail(user.email) : null,
      identifier: user.email || user.phone,
      // For local testing convenience if mailer is in simulation mode
      simulatedOtp: !process.env.EMAIL_USER ? otp : undefined,
    });
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
    const { identifier, phone, email, otp } = req.body;
    const input = (identifier || email || phone || '').trim().toLowerCase();
    const cleanPhone = input.replace(/[^0-9]/g, '').slice(-10);

    if ((!input && !cleanPhone) || !otp) {
      return res.status(400).json({ message: 'Email/phone and OTP code are required' });
    }

    const record = tempOtps.get(input) || tempOtps.get(cleanPhone);
    if (!record) {
      return res.status(400).json({ message: 'No OTP requested or session expired. Please request a new code.' });
    }
    if (Date.now() > record.expiresAt) {
      tempOtps.delete(input);
      if (cleanPhone) tempOtps.delete(cleanPhone);
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }
    if (record.otp !== otp.trim()) {
      return res.status(400).json({ message: 'Invalid OTP code. Please check your Gmail and try again.' });
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
    const { identifier, phone, email, password, otp } = req.body;
    const input = (identifier || email || phone || '').trim().toLowerCase();
    const cleanPhone = input.replace(/[^0-9]/g, '').slice(-10);

    if ((!input && !cleanPhone) || !password || !otp) {
      return res.status(400).json({ message: 'Email/phone, new password, and OTP are required' });
    }

    const record = tempOtps.get(input) || tempOtps.get(cleanPhone);
    if (!record || record.otp !== otp.trim()) {
      return res.status(400).json({ message: 'Unauthorized password reset. Please verify OTP first.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const userId = record.userId;
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    await getPool().execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

    // Clear OTP records
    tempOtps.delete(input);
    if (cleanPhone) tempOtps.delete(cleanPhone);
    if (record.email) tempOtps.delete(record.email.toLowerCase());
    if (record.phone) tempOtps.delete(record.phone);

    res.json({ message: 'Password has been reset successfully. You can now sign in.' });
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
