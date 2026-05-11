const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const USERS_FILE = path.join(__dirname, '..', 'users.json');
const SALT_ROUNDS = 10; // bcrypt work factor — higher = slower brute-force, ~100ms on login

// Helper to read users securely
function readUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, '[]', 'utf8');
      return [];
    }
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('[Auth Service] Error reading users database:', error);
    return [];
  }
}

// Helper to write users securely
function writeUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('[Auth Service] Error writing users database:', error);
    return false;
  }
}

/**
 * POST /api/auth/signup
 * Registers a new user. Passwords are hashed with bcrypt before storage.
 */
router.post('/signup', async (req, res) => {
  const { fullName, email, password, confirmPassword } = req.body;

  // 1. Basic validation
  if (!fullName || !email || !password || !confirmPassword) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const trimmedName = fullName.trim();
  const trimmedEmail = email.trim().toLowerCase();

  // 2. Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  // 3. Password mismatch validation
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }

  // 4. Password strength: at least 8 characters with a number and symbol
  const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*()_+={}[\]|\\:;"'<>,.?/~`\-]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      error: 'Password must be at least 8 characters and include a number and symbol.'
    });
  }

  // 5. Duplicate email check
  const users = readUsers();
  const emailExists = users.some(u => u.email.toLowerCase() === trimmedEmail);
  if (emailExists) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }

  // 6. Hash password with bcrypt before saving
  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = {
      id: crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'),
      fullName: trimmedName,
      email: trimmedEmail,
      password: hashedPassword, // 🔒 Stored as bcrypt hash — original password is never saved
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    if (writeUsers(users)) {
      return res.json({
        success: true,
        message: 'Account created successfully!',
        user: { id: newUser.id, fullName: newUser.fullName, email: newUser.email }
      });
    } else {
      return res.status(500).json({ error: 'Failed to write account records to database.' });
    }
  } catch (err) {
    console.error('[Auth Service] bcrypt error during signup:', err);
    return res.status(500).json({ error: 'An internal error occurred. Please try again.' });
  }
});

/**
 * POST /api/auth/login
 * Authenticates user. Supports both bcrypt-hashed passwords (new) and 
 * plain-text (legacy accounts — auto-upgrades to bcrypt on first login).
 */
router.post('/login', async (req, res) => {
  const { emailOrUsername, password } = req.body;

  if (!emailOrUsername || !password) {
    return res.status(400).json({ error: 'Email and Password are required.' });
  }

  const searchCredential = emailOrUsername.trim().toLowerCase();
  const users = readUsers();

  // Find user by email or full name (case-insensitive)
  const matchedUser = users.find(u =>
    u.email.toLowerCase() === searchCredential ||
    u.fullName.toLowerCase() === searchCredential
  );

  if (!matchedUser) {
    return res.status(401).json({ error: 'No account found with these credentials.' });
  }

  try {
    // Check if password is a bcrypt hash (starts with $2b$) or legacy plain text
    const isBcryptHash = matchedUser.password && matchedUser.password.startsWith('$2b$');

    let passwordCorrect = false;

    if (isBcryptHash) {
      // New secure comparison using bcrypt
      passwordCorrect = await bcrypt.compare(password, matchedUser.password);
    } else {
      // Legacy plain-text comparison (for old accounts before hashing was added)
      passwordCorrect = (matchedUser.password === password);

      // Auto-upgrade: hash this plain-text password now and save it
      if (passwordCorrect) {
        const upgraded = await bcrypt.hash(password, SALT_ROUNDS);
        const allUsers = readUsers();
        const idx = allUsers.findIndex(u => u.email === matchedUser.email);
        if (idx !== -1) {
          allUsers[idx].password = upgraded;
          writeUsers(allUsers);
          console.log(`[Auth Service] 🔒 Auto-upgraded password hash for: ${matchedUser.email}`);
        }
      }
    }

    if (!passwordCorrect) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    return res.json({
      success: true,
      message: 'Welcome back!',
      user: { id: matchedUser.id, fullName: matchedUser.fullName, email: matchedUser.email }
    });

  } catch (err) {
    console.error('[Auth Service] bcrypt error during login:', err);
    return res.status(500).json({ error: 'An internal error occurred. Please try again.' });
  }
});

module.exports = router;
