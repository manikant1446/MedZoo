const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  timeSlot: { type: String, required: true }, // e.g. "10:00 AM - 10:30 AM"
  reason: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  notes: { type: String, default: '' },
  rating: { type: Number, default: 0 }
}, { timestamps: true });

// Prevent double-booking: same doctor, same date, same time slot
appointmentSchema.index({ doctorId: 1, date: 1, timeSlot: 1 }, { unique: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
