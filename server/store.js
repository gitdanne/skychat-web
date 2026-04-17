const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// ── In-memory data store ──────────────────────────────────────

const users = new Map();
const rooms = new Map();
const messages = new Map(); // roomId -> Message[]

// ── Seed global rooms ─────────────────────────────────────────

const GLOBAL_ROOMS = [
  { id: 'general', name: 'General', isGlobal: true },
  { id: 'tech-talk', name: 'Tech Talk', isGlobal: true },
  { id: 'music', name: 'Music', isGlobal: true },
];

GLOBAL_ROOMS.forEach((room) => {
  rooms.set(room.id, { ...room, password: null, createdBy: 'system' });
  messages.set(room.id, []);
});

// ── Seed admin user ───────────────────────────────────────────

const ADMIN_ID = uuidv4();
const adminHash = bcrypt.hashSync('admin123', 10);

users.set(ADMIN_ID, {
  id: ADMIN_ID,
  username: 'admin',
  email: 'admin@skychat.io',
  password: adminHash,
  role: 'admin',
});

// ── Helper functions ──────────────────────────────────────────

function findUserByUsername(username) {
  for (const [, user] of users) {
    if (user.username.toLowerCase() === username.toLowerCase()) return user;
  }
  return null;
}

function findUserByEmail(email) {
  for (const [, user] of users) {
    if (user.email.toLowerCase() === email.toLowerCase()) return user;
  }
  return null;
}

function findUserById(id) {
  return users.get(id) || null;
}

function createUser({ username, email, password }) {
  const id = uuidv4();
  const hash = bcrypt.hashSync(password, 10);
  const user = { id, username, email, password: hash, role: 'user' };
  users.set(id, user);
  return user;
}

function getAllRooms() {
  return Array.from(rooms.values()).map((r) => ({
    id: r.id,
    name: r.name,
    isGlobal: r.isGlobal,
    hasPassword: !!r.password,
    createdBy: r.createdBy,
  }));
}

function getRoom(id) {
  return rooms.get(id) || null;
}

function createRoom({ name, password, createdBy }) {
  const id = uuidv4();
  const room = {
    id,
    name,
    isGlobal: false,
    password: password || null,
    createdBy,
  };
  rooms.set(id, room);
  messages.set(id, []);
  return { id: room.id, name: room.name, isGlobal: false, hasPassword: !!password, createdBy };
}

function getRoomMessages(roomId) {
  return messages.get(roomId) || [];
}

function addMessage({ roomId, userId, username, text }) {
  const msg = {
    id: uuidv4(),
    roomId,
    userId,
    username,
    text,
    deleted: false,
    createdAt: new Date().toISOString(),
  };
  if (!messages.has(roomId)) messages.set(roomId, []);
  messages.get(roomId).push(msg);
  return msg;
}

function deleteMessage(messageId, userId) {
  for (const [, msgs] of messages) {
    const msg = msgs.find((m) => m.id === messageId);
    if (msg) {
      if (msg.userId !== userId) return { error: 'Forbidden' };
      msg.text = 'Message deleted';
      msg.deleted = true;
      return { message: msg };
    }
  }
  return { error: 'Not found' };
}

function clearRoomMessages(roomId) {
  messages.set(roomId, []);
}

module.exports = {
  users,
  rooms,
  messages,
  findUserByUsername,
  findUserByEmail,
  findUserById,
  createUser,
  getAllRooms,
  getRoom,
  createRoom,
  getRoomMessages,
  addMessage,
  deleteMessage,
  clearRoomMessages,
};
