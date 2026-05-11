require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all requests to ensure development flexibility
app.use(cors());

// Parse incoming JSON requests
app.use(express.json());

// Serve static assets from the frontend/public folder
app.use(express.static(path.join(__dirname, 'frontend', 'public')));

// Import routers
const searchRouter = require('./backend/routes/search');
const adminRouter = require('./backend/routes/admin');
const authRouter = require('./backend/routes/auth');

// Mount search router on both paths to satisfy all potential API calls
app.use('/search', searchRouter);
app.use('/api/search', searchRouter);

// Mount admin router
app.use('/api/admin', adminRouter);

// Mount auth router
app.use('/api/auth', authRouter);

// Fallback path: serve index.html for any other routes (helps with SPA routing/navigation)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'public', 'index.html'));
});

// Start listening on specified PORT
app.listen(PORT, () => {
  console.log('===================================================');
  console.log(`🎵 Spotify-style Music App server is now online!`);
  console.log(`🚀 Access the app locally: http://localhost:${PORT}`);
  console.log(`🔑 YouTube API Mode: ${process.env.YOUTUBE_API_KEY ? 'LIVE (Key found)' : 'MOCK (No key, fallback mode activated)'}`);
  console.log('===================================================');
});
