const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Active session store in memory: Map of token -> { username, createdAt }
const activeSessions = new Map();

// Session duration: 2 hours (in milliseconds)
const SESSION_DURATION = 2 * 60 * 60 * 1000;

/**
 * POST /api/admin/login
 * Validates admin credentials against environment variables.
 * Returns a cryptographically secure token on success.
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const expectedUser = process.env.ADMIN_USERNAME || 'shamilpopzz';
  const expectedPass = process.env.ADMIN_PASSWORD || 'sh4milpop@2228';

  if (username === expectedUser && password === expectedPass) {
    // Generate secure session token
    const token = crypto.randomBytes(32).toString('hex');
    activeSessions.set(token, {
      username,
      createdAt: Date.now()
    });
    return res.json({ success: true, token, username });
  } else {
    return res.status(401).json({ success: false, error: 'Invalid username or password.' });
  }
});

/**
 * GET /api/admin/verify
 * Validates bearer token and returns status.
 */
router.get('/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ verified: false, error: 'Authorization header required.' });
  }

  const token = authHeader.split(' ')[1];
  const session = activeSessions.get(token);

  if (!session) {
    return res.status(401).json({ verified: false, error: 'Invalid or expired session.' });
  }

  // Check expiration
  if (Date.now() - session.createdAt > SESSION_DURATION) {
    activeSessions.delete(token);
    return res.status(401).json({ verified: false, error: 'Session expired.' });
  }

  return res.json({ verified: true, username: session.username });
});

/**
 * GET /api/admin/metrics
 * Returns advanced system and process diagnostics (only to verified sessions!)
 */
router.get('/metrics', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const token = authHeader.split(' ')[1];
  const session = activeSessions.get(token);

  if (!session || (Date.now() - session.createdAt > SESSION_DURATION)) {
    return res.status(401).json({ error: 'Unauthorized or session expired.' });
  }

  // Clean expired sessions from memory
  for (const [t, s] of activeSessions.entries()) {
    if (Date.now() - s.createdAt > SESSION_DURATION) {
      activeSessions.delete(t);
    }
  }

  const memoryUsage = process.memoryUsage();
  let totalUsers = 0;
  try {
    const usersFile = path.join(__dirname, '..', 'users.json');
    if (fs.existsSync(usersFile)) {
      const usersData = fs.readFileSync(usersFile, 'utf8');
      totalUsers = JSON.parse(usersData || '[]').length;
    }
  } catch (e) {
    console.error(e);
  }

  return res.json({
    activeSessionCount: activeSessions.size,
    serverUptime: Math.round(process.uptime()), // seconds
    nodeVersion: process.version,
    platform: process.platform,
    memoryUsageMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
    apiMode: process.env.YOUTUBE_API_KEY ? 'LIVE (YouTube API Active)' : 'MOCK (Fallback Active)',
    totalUsersCount: totalUsers,
    timestamp: Date.now()
  });
});

/**
 * GET /api/admin/users
 * Returns a list of all registered user accounts for the dashboard view.
 */
router.get('/users', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const token = authHeader.split(' ')[1];
  const session = activeSessions.get(token);

  if (!session || (Date.now() - session.createdAt > SESSION_DURATION)) {
    return res.status(401).json({ error: 'Unauthorized or session expired.' });
  }

  try {
    const usersFile = path.join(__dirname, '..', 'users.json');
    if (!fs.existsSync(usersFile)) {
      return res.json([]);
    }
    const usersData = fs.readFileSync(usersFile, 'utf8');
    return res.json(JSON.parse(usersData || '[]'));
  } catch (err) {
    console.error('[Admin Portal] Error reading users for dashboard:', err);
    return res.status(500).json({ error: 'Failed to retrieve registered users list.' });
  }
});

/**
 * DELETE /api/admin/users/:email
 * Deletes a registered user from users.json by their email address.
 */
router.delete('/users/:email', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const token = authHeader.split(' ')[1];
  const session = activeSessions.get(token);

  if (!session || (Date.now() - session.createdAt > SESSION_DURATION)) {
    return res.status(401).json({ error: 'Unauthorized or session expired.' });
  }

  const emailToDelete = req.params.email;
  if (!emailToDelete) {
    return res.status(400).json({ error: 'Email parameter is required.' });
  }

  try {
    const usersFile = path.join(__dirname, '..', 'users.json');
    if (!fs.existsSync(usersFile)) {
      return res.status(404).json({ error: 'Users database file not found.' });
    }

    const usersData = fs.readFileSync(usersFile, 'utf8');
    const users = JSON.parse(usersData || '[]');
    
    const initialLength = users.length;
    const filteredUsers = users.filter(u => u.email.toLowerCase() !== emailToDelete.toLowerCase());

    if (filteredUsers.length === initialLength) {
      return res.status(404).json({ error: 'User with this email address not found.' });
    }

    fs.writeFileSync(usersFile, JSON.stringify(filteredUsers, null, 2), 'utf8');
    return res.json({ success: true, message: `User account '${emailToDelete}' successfully deleted.` });
  } catch (err) {
    console.error('[Admin Portal] Error deleting user:', err);
    return res.status(500).json({ error: 'Internal server error occurred during deletion.' });
  }
});

module.exports = router;
