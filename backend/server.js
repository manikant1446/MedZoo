const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const { securityHeaders } = require('./middleware/security');
const { rateLimit } = require('./middleware/rateLimit');

dotenv.config();

// Fail fast: JWT secret must come from the environment
if (!process.env.JWT_SECRET) {
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: JWT_SECRET environment variable is not set. Refusing to start.');
  }
  console.warn('⚠️  JWT_SECRET is not set — using an auto-generated development-only secret (sessions invalidate on restart).');
  process.env.JWT_SECRET = require('crypto').randomBytes(32).toString('hex');
}

connectDB();

const http = require('http');
const socketio = require('socket.io');

// Allowed frontend origins (comma-separated in env). Defaults cover local dev.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ||
  'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const isOriginAllowed = (origin) => {
  if (!origin) return true; // same-origin / curl / mobile apps
  return ALLOWED_ORIGINS.includes(origin);
};

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: (origin, cb) => cb(null, isOriginAllowed(origin)),
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});
app.set('io', io);

io.on('connection', (socket) => {
  // Client joins its private user room after authenticating on the client side.
  // Room events (notification_<id>, team_update_<id>) are then only delivered
  // to sockets that explicitly joined, not broadcast to everyone.
  socket.on('join', (userId) => {
    const id = parseInt(userId, 10);
    if (Number.isInteger(id) && id > 0) {
      socket.join(`user_${id}`);
    }
  });
  socket.on('disconnect', () => {});
});

app.use(securityHeaders);
app.use(cors({
  origin: (origin, cb) => cb(null, isOriginAllowed(origin)),
  credentials: false
}));
app.use(express.json({ limit: '1mb' }));

// Global API rate limit: 300 req / 15 min / IP
app.use(rateLimit({ prefix: 'api', max: 300 }));

// Routes
const apiRouter = express.Router();
apiRouter.use('/auth', require('./routes/auth'));
apiRouter.use('/contacts', require('./routes/contacts'));
apiRouter.use('/consultations', require('./routes/consultations'));
apiRouter.use('/referrals', require('./routes/referrals'));
apiRouter.use('/doctors', require('./routes/doctors'));
apiRouter.use('/appointments', require('./routes/appointments'));
apiRouter.use('/notifications', require('./routes/notifications'));

// Health check
apiRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount on both /api and / so it works with or without /api prefix
app.use('/api', apiRouter);
app.use('/', apiRouter);

// For local development — do NOT listen on Vercel (serverless handles it)
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5001;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🏥 MedZoo API with WebSockets running on port ${PORT} (bound to 0.0.0.0 for network access)`);
  });
}

// Export for Vercel serverless
module.exports = app;
