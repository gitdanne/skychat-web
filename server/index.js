const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const messageRoutes = require('./routes/messages');
const { setupSocket } = require('./socket');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'DELETE'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ── Middleware ─────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Ping endpoint ─────────────────────────────────────────────
app.get('/api/ping', (req, res) => {
  res.json({ pong: true, time: Date.now() });
});

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api', messageRoutes);

// ── Serve React build in production ───────────────────────────
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

// ── Socket.io ─────────────────────────────────────────────────
setupSocket(io);

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 SkyChat server running on http://localhost:${PORT}`);
});
