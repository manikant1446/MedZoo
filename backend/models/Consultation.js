const mongoose = require('mongoose');

const ConsultationSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  diagnosis: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'treated', 'referred', 'follow-up'],
    default: 'pending'
  },
  category: {
    type: String,
    enum: ['Cardiology', 'Dermatology', 'Neurology', 'Orthopedics', 'Pediatrics', 'General', 'Oncology', 'Psychiatry', 'Other'],
    default: 'General'
  },
  notes: {
    type: String,
    default: ''
  },
  ipfsCid: {
    type: String,
    default: ''
  },
  rating: {
    type: Number,
    default: 0
  },
  prescriptions: [{
    medicine: String,
    dosage: String,
    duration: String
  }],
  consultationHour: {
    type: Number,
    min: 0,
    max: 23
  }
}, {
  timestamps: true
});

// Index for analytics queries
ConsultationSchema.index({ doctorId: 1, date: -1 });
ConsultationSchema.index({ doctorId: 1, status: 1 });
ConsultationSchema.index({ doctorId: 1, category: 1 });

module.exports = mongoose.model('Consultation', ConsultationSchema);
