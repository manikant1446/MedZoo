const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Invitation = require('../models/Invitation');

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
 * Helper: Build a clean user response object
 */
const buildUserResponse = (user, token) => ({
  _id: user._id,
  email: user.email || null,
  phone: user.phone || null,
  name: user.name,
  role: user.role,
  specialty: user.specialty,
  hospital: user.hospital,
  qualifications: user.qualifications,
  avatar: user.avatar,
  experience: user.experience,
  address: user.address,
  locality: user.locality,
  rating: user.rating,
  ratingsCount: user.ratingsCount,
  isVerified: user.isVerified,
  contactsPermissionStatus: user.contactsPermissionStatus,
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
    const existingByPhone = await User.findOne({ phone: phone.trim() });
    if (existingByPhone) {
      return res.status(400).json({ message: 'An account already exists with this phone number' });
    }

    // Check if email already registered (only if email provided)
    if (email) {
      const existingByEmail = await User.findOne({ email: email.toLowerCase().trim() });
      if (existingByEmail) {
        return res.status(400).json({ message: 'An account already exists with this email address' });
      }
    }

    // Create user
    const user = await User.create({
      phone: phone.trim(),
      email: email ? email.toLowerCase().trim() : undefined,
      password,
      name: name.trim(),
      role,
      specialty: role === 'doctor' ? (specialty || '') : '',
      hospital: role === 'doctor' ? (hospital || '') : '',
      qualifications: role === 'doctor' ? (qualifications || '') : '',
    });

    const token = generateToken(user._id, user.phone, user.email, user.role);

    res.status(201).json(buildUserResponse(user, token));
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Phone or email already registered' });
    }
    res.status(500).json({ message: 'Server error during registration' });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user — accepts phone number OR email as identifier
 */
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Please provide phone/email and password' });
    }

    // Determine if identifier is a phone number (digits only) or email
    const isPhone = /^[0-9+\s\-().]{7,15}$/.test(identifier.trim());

    let user;
    if (isPhone) {
      user = await User.findOne({ phone: identifier.trim() });
    } else {
      user = await User.findOne({ email: identifier.toLowerCase().trim() });
    }

    if (!user) {
      return res.status(401).json({ message: 'No account found with this phone/email' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid phone/email or password' });
    }

    const token = generateToken(user._id, user.phone, user.email, user.role);
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
router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile (name, avatar, address, locality, experience, hospital, email)
 */
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, avatar, address, locality, experience, hospital, email } = req.body;

    if (name) user.name = name.trim();
    if (avatar !== undefined) user.avatar = avatar;
    if (address !== undefined) user.address = address;
    if (locality !== undefined) user.locality = locality;

    // Allow adding/updating email from profile
    if (email !== undefined && email !== user.email) {
      if (email) {
        const existingEmail = await User.findOne({ email: email.toLowerCase().trim(), _id: { $ne: user._id } });
        if (existingEmail) {
          return res.status(400).json({ message: 'This email is already used by another account' });
        }
        user.email = email.toLowerCase().trim();
      } else {
        user.email = undefined; // allow removing email
      }
    }

    if (user.role === 'doctor') {
      if (experience !== undefined) user.experience = Number(experience) || 0;
      if (hospital !== undefined) user.hospital = hospital;
    }

    await user.save();

    const updatedUser = await User.findById(user._id).select('-password');
    res.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'This email is already registered' });
    }
    res.status(500).json({ message: 'Server error during profile update' });
  }
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Simulate forgot password OTP request
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }
    const user = await User.findOne({ phone: phone.trim() });
    if (!user) {
      return res.status(404).json({ message: 'No user registered with this phone number' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    tempOtps.set(phone.trim(), {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
    });

    console.log(`🔑 [OTP Verification] Phone: ${phone.trim()} | Code: ${otp}`);
    res.json({ message: 'Simulated OTP sent successfully', otp });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error during password recovery' });
  }
});

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP for password reset
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
 * @desc    Reset password using phone number
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

    const user = await User.findOne({ phone: phone.trim() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.password = password;
    await user.save();

    // Clear OTP
    tempOtps.delete(phone.trim());

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
});

/**
 * @route   POST /api/auth/invite
 * @desc    Create a registration invitation link (DoctorOnly)
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

    // Check if user already exists
    const existing = await User.findOne({ phone: phone.trim() });
    if (existing) {
      return res.status(400).json({ message: 'A user is already registered with this phone number' });
    }

    // Generate random secure token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Set expiry to 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await Invitation.create({
      phone: phone.trim(),
      role,
      invitedBy: req.user._id,
      token,
      expiresAt
    });

    res.status(201).json({
      message: 'Invitation generated successfully',
      token,
      invitation
    });
  } catch (error) {
    console.error('Invite error:', error);
    res.status(500).json({ message: 'Server error during invitation creation' });
  }
});

/**
 * @route   GET /api/auth/invite/:token
 * @desc    Get invitation details by token
 */
router.get('/invite/:token', async (req, res) => {
  try {
    const invitation = await Invitation.findOne({ token: req.params.token });
    if (!invitation) {
      return res.status(404).json({ message: 'Invalid or expired invitation token' });
    }

    if (invitation.status === 'accepted') {
      return res.status(400).json({ message: 'This invitation has already been accepted' });
    }

    if (new Date() > invitation.expiresAt) {
      return res.status(400).json({ message: 'This invitation link has expired' });
    }

    res.json(invitation);
  } catch (error) {
    console.error('Get invite error:', error);
    res.status(500).json({ message: 'Server error during invitation check' });
  }
});

/**
 * @route   POST /api/auth/invite/accept
 * @desc    Accept invitation and register
 */
router.post('/invite/accept', async (req, res) => {
  try {
    const { token, name, password } = req.body;
    if (!token || !name || !password) {
      return res.status(400).json({ message: 'Token, name, and password are required' });
    }

    const invite = await Invitation.findOne({ token });
    if (!invite || invite.status === 'accepted' || new Date() > invite.expiresAt) {
      return res.status(400).json({ message: 'Invalid, accepted, or expired token' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check duplicate phone
    const existing = await User.findOne({ phone: invite.phone });
    if (existing) {
      return res.status(400).json({ message: 'User already exists with this phone number' });
    }

    // Create collaborator
    const user = await User.create({
      phone: invite.phone,
      name: name.trim(),
      password,
      role: invite.role,
      isVerified: true
    });

    // Mark invitation accepted
    invite.status = 'accepted';
    await invite.save();

    const jwtToken = generateToken(user._id, user.phone, user.email, user.role);

    res.status(201).json(buildUserResponse(user, jwtToken));
  } catch (error) {
    console.error('Accept invite error:', error);
    res.status(500).json({ message: 'Server error during invitation acceptance' });
  }
});

module.exports = router;
