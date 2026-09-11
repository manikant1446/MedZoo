const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');

dotenv.config();
connectDB();

const http = require('http');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`🔌 WebSocket client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`🔌 WebSocket client disconnected: ${socket.id}`);
  });
});

app.use(cors());
app.use(express.json());

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
