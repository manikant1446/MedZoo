const express = require('express');
const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');
const User = require('../models/User');

const router = express.Router();

const generateToken = (id, email, role, walletAddress) => {
  return jwt.sign(
    { id, email, role, walletAddress },
    process.env.JWT_SECRET || 'medzoo_super_secret_key_2026',
    { expiresIn: '30d' }
  );
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (patient or doctor) — auto-generates ETH wallet
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role, specialty, hospital, qualifications } = req.body;

    // Validate
    if (!email || !password || !name || !role) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }
    if (!['patient', 'doctor'].includes(role)) {
      return res.status(400).json({ message: 'Role must be patient or doctor' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Generate managed Ethereum wallet
    const wallet = ethers.Wallet.createRandom();
    const did = `did:ethr:${wallet.address}`;

    // Create user
    const user = await User.create({
      email: email.toLowerCase(),
      password,
      name,
      role,
      walletAddress: wallet.address.toLowerCase(),
      walletPrivateKey: wallet.privateKey,
      specialty: role === 'doctor' ? (specialty || '') : '',
      hospital: role === 'doctor' ? (hospital || '') : '',
      qualifications: role === 'doctor' ? (qualifications || '') : '',
      did,
    });

    const token = generateToken(user._id, user.email, user.role, user.walletAddress);

    res.status(201).json({
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      walletAddress: user.walletAddress,
      did: user.did,
      specialty: user.specialty,
      hospital: user.hospital,
      qualifications: user.qualifications,
      avatar: user.avatar,
      experience: user.experience,
      address: user.address,
      locality: user.locality,
      rating: user.rating,
      ratingsCount: user.ratingsCount,
      contactsPermissionStatus: user.contactsPermissionStatus,
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id, user.email, user.role, user.walletAddress);

    res.json({
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      walletAddress: user.walletAddress,
      did: user.did,
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
      token,
    });
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
 * @desc    Update user profile details (avatar, name, address, locality, experience, hospital)
 */
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, avatar, address, locality, experience, hospital } = req.body;

    if (name) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;
    if (address !== undefined) user.address = address;
    if (locality !== undefined) user.locality = locality;

    if (user.role === 'doctor') {
      if (experience !== undefined) {
        user.experience = Number(experience) || 0;
      }
      if (hospital !== undefined) {
        user.hospital = hospital;
      }
    }

    await user.save();

    const updatedUser = await User.findById(user._id).select('-password');
    res.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error during profile update' });
  }
});

module.exports = router;
