const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'medzoo_super_secret_key_2026');

      // SQL replace: User.findById(decoded.id).select('-password')
      let users;
      try {
        users = await query(
          'SELECT id, name, email, phone, role, specialty, hospital, qualifications, experience, address, locality, age, gender, blood_group, rating, ratings_count, is_verified, avatar, contacts_permission_status FROM users WHERE id = ?',
          [decoded.id]
        );
      } catch (dbErr) {
        // Fallback if age/gender/blood_group columns don't exist yet on DB
        users = await query(
          'SELECT id, name, email, phone, role, specialty, hospital, qualifications, experience, address, locality, rating, ratings_count, is_verified, avatar, contacts_permission_status FROM users WHERE id = ?',
          [decoded.id]
        );
      }

      if (!users.length) {
        return res.status(401).json({ message: 'User not found. Please log in again.' });
      }

      // Normalize field names to match what frontend expects (_id instead of id)
      const u = users[0];
      req.user = {
        _id: u.id,
        id:  u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        specialty: u.specialty || '',
        hospital: u.hospital || '',
        qualifications: u.qualifications || '',
        experience: u.experience || 0,
        address: u.address || '',
        locality: u.locality || '',
        age: u.age || null,
        gender: u.gender || '',
        bloodGroup: u.blood_group || '',
        rating: u.rating,
        ratingsCount: u.ratings_count,
        isVerified: !!u.is_verified,
        avatar: u.avatar,
        contactsPermissionStatus: u.contacts_permission_status
      };

      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  return res.status(401).json({ message: 'Not authorized, no token' });
};

const doctorOnly = (req, res, next) => {
  if (req.user && req.user.role === 'doctor') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Doctors only.' });
  }
};

const doctorOrStaff = async (req, res, next) => {
  if (req.user && (req.user.role === 'doctor' || req.user.role === 'staff')) {
    return next();
  }
  if (req.user) {
    try {
      const staffRows = await query(
        "SELECT id FROM doctor_staff WHERE user_id = ? AND status = 'active'",
        [req.user._id]
      );
      if (staffRows.length > 0) {
        return next();
      }
    } catch (e) {}
  }
  return res.status(403).json({ message: 'Access denied. Doctors or clinic staff only.' });
};

const patientOnly = (req, res, next) => {
  if (req.user && req.user.role === 'patient') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Patients only.' });
  }
};

module.exports = { protect, doctorOnly, doctorOrStaff, patientOnly };

