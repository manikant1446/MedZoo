const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['patient', 'doctor'],
    required: true
  },
  // Managed Ethereum wallet (auto-generated on registration)
  walletAddress: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true
  },
  walletPrivateKey: {
    type: String,
    select: false // Never returned by default
  },
  // Doctor-specific fields
  specialty: {
    type: String,
    default: ''
  },
  hospital: {
    type: String,
    default: ''
  },
  qualifications: {
    type: String,
    default: ''
  },
  experience: {
    type: Number,
    default: 0
  },
  address: {
    type: String,
    default: ''
  },
  locality: {
    type: String,
    default: ''
  },
  rating: {
    type: Number,
    default: 5.0
  },
  ratingsCount: {
    type: Number,
    default: 0
  },
  // DID (Decentralized Identifier)
  did: {
    type: String,
    default: ''
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  phone: {
    type: String,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
