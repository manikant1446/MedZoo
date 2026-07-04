const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
// Note: Vercel experimentalServices strips /api prefix before forwarding to backend.
// So routes are registered WITHOUT /api prefix for Vercel compatibility.
// Locally, frontend calls /api/* which goes directly to port 5001 (no stripping).
const prefix = process.env.VERCEL ? '' : '/api';
app.use(`${prefix}/auth`, require('./routes/auth'));
app.use(`${prefix}/contacts`, require('./routes/contacts'));
app.use(`${prefix}/consultations`, require('./routes/consultations'));
app.use(`${prefix}/referrals`, require('./routes/referrals'));
app.use(`${prefix}/doctors`, require('./routes/doctors'));
app.use(`${prefix}/appointments`, require('./routes/appointments'));

// Health check
app.get(`${prefix}/health`, (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// For local development — do NOT listen on Vercel (serverless handles it)
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`🏥 MedZoo API running on port ${PORT}`);
  });
}

// Export for Vercel serverless
module.exports = app;
