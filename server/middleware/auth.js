const jwt = require('jsonwebtoken');
const { findUserById } = require('../store');

const JWT_SECRET = process.env.JWT_SECRET || 'skychat_secret_key_2026';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = header.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const user = findUserById(decoded.id);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  req.user = { id: user.id, username: user.username, role: user.role };
  next();
}

function adminMiddleware(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = { JWT_SECRET, generateToken, verifyToken, authMiddleware, adminMiddleware };
