const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const db = require('../database');

const SALT_ROUNDS = 10; // bcrypt work factor — higher = slower brute-force, ~100ms on login

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

  try {
    // 5. Duplicate email check
    const emailExists = await db.findUserByEmail(trimmedEmail);
    if (emailExists) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    // 6. Hash password with bcrypt before saving
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = await db.createUser({
      fullName: trimmedName,
      email: trimmedEmail,
      password: hashedPassword
    });

    return res.json({
      success: true,
      message: 'Account created successfully!',
      user: { id: newUser.id, fullName: newUser.fullName, email: newUser.email }
    });
  } catch (err) {
    console.error('[Auth Service] Error during signup:', err);
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

  try {
    // Find user by email
    let matchedUser = await db.findUserByEmail(searchCredential);

    // If not found by email, see if any users match by full name (case-insensitive)
    if (!matchedUser) {
      const allUsers = await db.getAllUsers();
      matchedUser = allUsers.find(u => u.fullName.toLowerCase() === searchCredential);
    }

    if (!matchedUser) {
      return res.status(401).json({ error: 'No account found with these credentials.' });
    }

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
        await db.updateUserPassword(matchedUser.email, upgraded);
        console.log(`[Auth Service] 🔒 Auto-upgraded password hash for: ${matchedUser.email}`);
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
    console.error('[Auth Service] Error during login:', err);
    return res.status(500).json({ error: 'An internal error occurred. Please try again.' });
  }
});

module.exports = router;
