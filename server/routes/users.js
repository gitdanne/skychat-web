const express = require('express');
const { searchUsers } = require('../store');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/search?q=XYZ
router.get('/search', authMiddleware, (req, res) => {
  const query = req.query.q || '';
  if (!query.trim()) {
    return res.json({ users: [] });
  }

  const results = searchUsers(query, req.user.id);
  res.json({ users: results });
});

module.exports = router;
