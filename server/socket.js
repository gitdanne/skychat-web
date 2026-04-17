const { verifyToken } = require('./middleware/auth');
const { findUserById, addMessage, deleteMessage, clearRoomMessages, getRoom, getRoomMessages } = require('./store');

function setupSocket(io) {
  // Authenticate socket connections via JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));

    const decoded = verifyToken(token);
    if (!decoded) return next(new Error('Invalid token'));

    const user = findUserById(decoded.id);
    if (!user) return next(new Error('User not found'));

    socket.user = { id: user.id, username: user.username, role: user.role };
    next();
  });

  io.on('connection', (socket) => {
    console.log(`⚡ ${socket.user.username} connected [${socket.id}]`);

    // ── Join Room ───────────────────────────────────────
    socket.on('joinRoom', (roomId) => {
      const room = getRoom(roomId);
      if (!room) return;

      // Leave all previous rooms (except the socket's own room)
      socket.rooms.forEach((r) => {
        if (r !== socket.id) {
          socket.leave(r);
          socket.to(r).emit('receiveMessage', {
            id: `sys-${Date.now()}`,
            roomId: r,
            userId: 'system',
            username: 'System',
            text: `${socket.user.username} left the room`,
            system: true,
            createdAt: new Date().toISOString(),
          });
        }
      });

      socket.join(roomId);
      socket.currentRoom = roomId;

      // Notify room
      socket.to(roomId).emit('receiveMessage', {
        id: `sys-${Date.now()}`,
        roomId,
        userId: 'system',
        username: 'System',
        text: `${socket.user.username} joined the room`,
        system: true,
        createdAt: new Date().toISOString(),
      });

      console.log(`📌 ${socket.user.username} joined ${room.name}`);
    });

    // ── Leave Room ──────────────────────────────────────
    socket.on('leaveRoom', (roomId) => {
      socket.leave(roomId);
      socket.to(roomId).emit('receiveMessage', {
        id: `sys-${Date.now()}`,
        roomId,
        userId: 'system',
        username: 'System',
        text: `${socket.user.username} left the room`,
        system: true,
        createdAt: new Date().toISOString(),
      });
    });

    // ── Send Message ────────────────────────────────────
    socket.on('sendMessage', ({ roomId, text }) => {
      if (!text || !text.trim() || !roomId) return;

      const room = getRoom(roomId);
      if (!room) return;

      const msg = addMessage({
        roomId,
        userId: socket.user.id,
        username: socket.user.username,
        text: text.trim(),
      });

      io.to(roomId).emit('receiveMessage', msg);
    });

    // ── Delete Message ──────────────────────────────────
    socket.on('deleteMessage', ({ messageId, roomId }) => {
      const result = deleteMessage(messageId, socket.user.id);
      if (result.message) {
        io.to(roomId).emit('messageDeleted', { messageId, roomId });
      }
    });

    // ── Clear Room (Admin) ──────────────────────────────
    socket.on('clearRoom', (roomId) => {
      if (socket.user.role !== 'admin') return;

      const room = getRoom(roomId);
      if (!room) return;

      clearRoomMessages(roomId);
      io.to(roomId).emit('roomCleared', roomId);
      console.log(`🧹 Admin cleared ${room.name}`);
    });

    // ── Disconnect ──────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`💤 ${socket.user.username} disconnected`);
    });
  });
}

module.exports = { setupSocket };
