const express = require('express');
const bcrypt = require('bcryptjs');
const { findUserByUsername, findUserByEmail, createUser, findUserById } = require('../store');
const { generateToken, authMiddleware } = require('../middleware/auth');

const router = express.Router();

// POST /auth/register
router.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (username.length < 2 || username.length > 20) {
    return res.status(400).json({ error: 'Username must be 2-20 characters' });
  }

  if (password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters' });
  }

  if (findUserByUsername(username)) {
    return res.status(409).json({ error: 'Username already taken' });
  }

  if (findUserByEmail(email)) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const user = createUser({ username, email, password });
  const token = generateToken(user);

  res.status(201).json({
    token,
    user: { id: user.id, username: user.username, role: user.role },
  });
});

// POST /auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = findUserByUsername(username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = generateToken(user);

  res.json({
    token,
    user: { id: user.id, username: user.username, role: user.role },
  });
});

// GET /auth/me — verify token & get current user
router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
