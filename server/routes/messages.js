const express = require('express');
const { getRoomMessages, deleteMessage, clearRoomMessages, getRoom } = require('../store');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /rooms/:id/messages
router.get('/rooms/:id/messages', authMiddleware, (req, res) => {
  const room = getRoom(req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const msgs = getRoomMessages(req.params.id);
  res.json({ messages: msgs });
});

// DELETE /messages/:id
router.delete('/messages/:id', authMiddleware, (req, res) => {
  const result = deleteMessage(req.params.id, req.user.id);
  if (result.error === 'Forbidden') {
    return res.status(403).json({ error: 'You can only delete your own messages' });
  }
  if (result.error === 'Not found') {
    return res.status(404).json({ error: 'Message not found' });
  }
  res.json({ message: result.message });
});

// DELETE /rooms/:id/messages — admin only
router.delete('/rooms/:id/messages', authMiddleware, adminMiddleware, (req, res) => {
  const room = getRoom(req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  clearRoomMessages(req.params.id);
  res.json({ success: true });
});

module.exports = router;
