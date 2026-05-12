require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// ── CORS: Only allow requests from your own production domain ─────────────────
// In production, set ALLOWED_ORIGIN env var to your Render/domain URL.
// Falls back to localhost for local development.
const rawAllowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:3000';
// Clean trailing slashes to prevent comparison mismatch
const allowedOrigin = rawAllowedOrigin.replace(/\/$/, '');

const localOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (same-origin, mobile apps, Postman, admin portal)
    if (!origin) return callback(null, true);
    
    const cleanOrigin = origin.replace(/\/$/, '');
    
    // 1. Check direct matches or localhost development
    if (
      cleanOrigin === allowedOrigin || 
      localOrigins.includes(cleanOrigin) || 
      cleanOrigin.startsWith('http://localhost:') || 
      cleanOrigin.startsWith('http://127.0.0.1:')
    ) {
      return callback(null, true);
    }
    
    // 2. Automatically trust any render subdomains (deployment safety check!)
    if (cleanOrigin.endsWith('.onrender.com')) {
      return callback(null, true);
    }

    // 3. Automatically trust custom portfolio or vibestream domains
    if (cleanOrigin.endsWith('vibestream.online') || cleanOrigin.endsWith('vercel.app')) {
      return callback(null, true);
    }

    return callback(new Error(`CORS: Origin '${origin}' is not allowed.`), false);
  },
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ── RATE LIMITING ─────────────────────────────────────────────────────────────

// General limiter: 120 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a moment and try again.' }
});

// Search limiter: 30 searches per minute (protects YouTube API quota)
const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Search rate limit reached. Please slow down.' }
});

// Auth limiter: 10 login/signup attempts per 15 minutes (prevents brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' }
});

// Apply general limiter to all routes
app.use(generalLimiter);

// Parse incoming JSON requests
app.use(express.json());

// Serve static assets from the frontend/public folder
app.use(express.static(path.join(__dirname, 'frontend', 'public')));

// Import routers
const searchRouter = require('./backend/routes/search');
const adminRouter = require('./backend/routes/admin');
const authRouter = require('./backend/routes/auth');

// Mount search router with stricter rate limit
app.use('/search', searchLimiter, searchRouter);
app.use('/api/search', searchLimiter, searchRouter);

// Mount admin router
app.use('/api/admin', adminRouter);

// Mount auth router with strict brute-force protection
app.use('/api/auth', authLimiter, authRouter);



// Fallback path: serve index.html for any other routes (SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'public', 'index.html'));
});

// Start listening on specified PORT
app.listen(PORT, () => {
  console.log('===================================================');
  console.log(`🎵 Vibestream server is now online!`);
  console.log(`🚀 Access the app locally: http://localhost:${PORT}`);
  console.log(`🔑 YouTube API Mode: ${process.env.YOUTUBE_API_KEY ? 'LIVE (Key found)' : 'MOCK (Fallback mode)'}`);
  console.log(`🛡️  CORS Origin: ${allowedOrigin}`);
  console.log(`🔒 Rate limiting: ACTIVE`);
  console.log('===================================================');
});
