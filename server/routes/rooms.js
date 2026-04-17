const express = require('express');
const bcrypt = require('bcryptjs');
const { getAllRooms, createRoom, getRoom } = require('../store');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /rooms
router.get('/', authMiddleware, (req, res) => {
  res.json({ rooms: getAllRooms() });
});

// POST /rooms
router.post('/', authMiddleware, (req, res) => {
  const { name, password } = req.body;

  if (!name || name.trim().length < 1) {
    return res.status(400).json({ error: 'Room name is required' });
  }

  if (name.trim().length > 30) {
    return res.status(400).json({ error: 'Room name must be 30 characters or less' });
  }

  const room = createRoom({
    name: name.trim(),
    password: password || null,
    createdBy: req.user.username,
  });

  res.status(201).json({ room });
});

// POST /rooms/:id/verify-password
router.post('/:id/verify-password', authMiddleware, (req, res) => {
  const room = getRoom(req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  if (!room.password) return res.json({ success: true });

  const { password } = req.body;
  if (!password || password !== room.password) {
    return res.status(403).json({ error: 'Incorrect password' });
  }

  res.json({ success: true });
});

module.exports = router;
