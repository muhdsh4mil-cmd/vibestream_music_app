const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const USERS_FILE = path.join(__dirname, '..', 'users.json');

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
 * Registers a new user with duplicate verification and format checks.
 */
router.post('/signup', (req, res) => {
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

  // 4. Password strength criteria matching screenshot label:
  // "At least 8 characters with a number and symbol"
  const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*()_+={}\[\]|\\:;"'<>,.?/~`\-]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ 
      error: 'Password must be at least 8 characters and include a number and symbol.' 
    });
  }

  // 5. Duplicate Email verification
  const users = readUsers();
  const emailExists = users.some(u => u.email.toLowerCase() === trimmedEmail);
  if (emailExists) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }

  // 6. Create secure user object
  const newUser = {
    id: crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'),
    fullName: trimmedName,
    email: trimmedEmail,
    password: password, // Retained in cleartext as requested for auditing in admin dashboard
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
});

/**
 * POST /api/auth/login
 * Standard user log in authentication
 */
router.post('/login', (req, res) => {
  const { emailOrUsername, password } = req.body;

  if (!emailOrUsername || !password) {
    return res.status(400).json({ error: 'Email and Password are required.' });
  }

  const searchCredential = emailOrUsername.trim().toLowerCase();
  const users = readUsers();

  // Find user by either email or full name match (case-insensitive)
  const matchedUser = users.find(u => 
    u.email.toLowerCase() === searchCredential || 
    u.fullName.toLowerCase() === searchCredential
  );

  if (!matchedUser) {
    return res.status(401).json({ error: 'No user account found matching these credentials.' });
  }

  if (matchedUser.password !== password) {
    return res.status(401).json({ error: 'Incorrect password. Please try again.' });
  }

  return res.json({
    success: true,
    message: 'Welcome back!',
    user: { id: matchedUser.id, fullName: matchedUser.fullName, email: matchedUser.email }
  });
});

module.exports = router;
