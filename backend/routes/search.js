const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Hand-curated premium fallback music database
const MOCK_DATABASE = {
  malayalam: [
    {
      id: 'U8A4bZscE1M',
      title: 'Manavalan Thug | Thallumaala | Tovino Thomas | Khalid Rahman | Dabzee | SA',
      thumbnail: 'https://img.youtube.com/vi/U8A4bZscE1M/mqdefault.jpg',
      channelTitle: 'Muzik247',
      publishedAt: '2022-08-10T12:00:00Z',
      duration: 'PT3M12S',
      viewCount: 45000000,
      likeCount: 980000
    },
    {
      id: 'co7KgV28NL8',
      title: 'Darshana Song Video | Hridayam | Pranav | Kalyani | Vineeth | Hesham Abdul Wahab',
      thumbnail: 'https://img.youtube.com/vi/co7KgV28NL8/mqdefault.jpg',
      channelTitle: 'Think Music India',
      publishedAt: '2021-12-05T12:00:00Z',
      duration: 'PT5M14S',
      viewCount: 120000000,
      likeCount: 2200000
    },
    {
      id: 'zscitv8Xj8s',
      title: 'Kudukku Video Song | Love Action Drama | Nivin Pauly, Nayanthara | Vineeth Sreenivasan',
      thumbnail: 'https://img.youtube.com/vi/zscitv8Xj8s/mqdefault.jpg',
      channelTitle: 'Muzik247',
      publishedAt: '2019-09-10T12:00:00Z',
      duration: 'PT2M45S',
      viewCount: 95000000,
      likeCount: 1400000
    },
    {
      id: 'YvHkZ3_fKps',
      title: 'Malare Video Song | Premam | Nivin Pauly | Sai Pallavi | Rajesh Murugesan | Vijay Yesudas',
      thumbnail: 'https://img.youtube.com/vi/YvHkZ3_fKps/mqdefault.jpg',
      channelTitle: 'Anwar Rasheed Entertainment',
      publishedAt: '2015-06-05T12:00:00Z',
      duration: 'PT5M08S',
      viewCount: 85000000,
      likeCount: 1100000
    },
    {
      id: '4pE33t69m_k',
      title: 'Pala Palli Sajid Video Song | Kaduva | Prithviraj Sukumaran | Shaji Kailas | Jakes Bejoy',
      thumbnail: 'https://img.youtube.com/vi/4pE33t69m_k/mqdefault.jpg',
      channelTitle: 'Magic Frames',
      publishedAt: '2022-07-02T12:00:00Z',
      duration: 'PT4M10S',
      viewCount: 35000000,
      likeCount: 650000
    },
    {
      id: 'A7Cen60lH6Y',
      title: 'Karineela Kannaai Video Song | Joseph | Joju George | M Padmakumar | Ranjin Raj',
      thumbnail: 'https://img.youtube.com/vi/A7Cen60lH6Y/mqdefault.jpg',
      channelTitle: 'Muzik247',
      publishedAt: '2018-11-15T12:00:00Z',
      duration: 'PT4M22S',
      viewCount: 55000000,
      likeCount: 850000
    }
  ],
  alan_walker: [
    {
      id: '60ItHLz5WEA',
      title: 'Alan Walker - Faded',
      thumbnail: 'https://img.youtube.com/vi/60ItHLz5WEA/mqdefault.jpg',
      channelTitle: 'Alan Walker',
      publishedAt: '2015-12-03T12:00:00Z',
      duration: 'PT3M32S',
      viewCount: 3400000000,
      likeCount: 28000000
    },
    {
      id: '1-xGerv5FOk',
      title: 'Alan Walker - Alone',
      thumbnail: 'https://img.youtube.com/vi/1-xGerv5FOk/mqdefault.jpg',
      channelTitle: 'Alan Walker',
      publishedAt: '2016-12-02T12:00:00Z',
      duration: 'PT2M43S',
      viewCount: 1300000000,
      likeCount: 11000000
    },
    {
      id: 'dhYOPz0Vj9k',
      title: 'Alan Walker, Sabrina Carpenter & Farruko  - On My Way',
      thumbnail: 'https://img.youtube.com/vi/dhYOPz0Vj9k/mqdefault.jpg',
      channelTitle: 'Alan Walker',
      publishedAt: '2019-03-21T12:00:00Z',
      duration: 'PT3M36S',
      viewCount: 450000000,
      likeCount: 5200000
    },
    {
      id: 'wJnBTPUQS5A',
      title: 'Alan Walker - The Spectre',
      thumbnail: 'https://img.youtube.com/vi/wJnBTPUQS5A/mqdefault.jpg',
      channelTitle: 'Alan Walker',
      publishedAt: '2017-09-15T12:00:00Z',
      duration: 'PT3M26S',
      viewCount: 1100000000,
      likeCount: 9500000
    },
    {
      id: 'M-P4QBt-FWw',
      title: 'Alan Walker - Darkside (feat. Au/Ra and Tomine Harket)',
      thumbnail: 'https://img.youtube.com/vi/M-P4QBt-FWw/mqdefault.jpg',
      channelTitle: 'Alan Walker',
      publishedAt: '2018-07-27T12:00:00Z',
      duration: 'PT3M59S',
      viewCount: 650000000,
      likeCount: 6800000
    },
    {
      id: '2i2khp_npdE',
      title: 'Alan Walker - Sing Me To Sleep',
      thumbnail: 'https://img.youtube.com/vi/2i2khp_npdE/mqdefault.jpg',
      channelTitle: 'Alan Walker',
      publishedAt: '2016-06-03T12:00:00Z',
      duration: 'PT3M12S',
      viewCount: 620000000,
      likeCount: 4800000
    }
  ],
  hip_hop_tamizha: [
    {
      id: '1R1N0Mms0Y8',
      title: 'Club Le Mabbu Le | Hip Hop Tamizha | Official Music Video',
      thumbnail: 'https://img.youtube.com/vi/1R1N0Mms0Y8/mqdefault.jpg',
      channelTitle: 'HiphopTamizha',
      publishedAt: '2012-08-27T12:00:00Z',
      duration: 'PT4M15S',
      viewCount: 35000000,
      likeCount: 550000
    },
    {
      id: 'i2bWNoP3Ncc',
      title: 'Takkaru Takkaru | Hiphop Tamizha | Official Music Video',
      thumbnail: 'https://img.youtube.com/vi/i2bWNoP3Ncc/mqdefault.jpg',
      channelTitle: 'HiphopTamizha',
      publishedAt: '2016-06-16T12:00:00Z',
      duration: 'PT4M50S',
      viewCount: 42000000,
      likeCount: 680000
    },
    {
      id: 'XgI6HMyuBkk',
      title: 'Vaadi Pulla Vaadi Video Song | Meesaya Murukku | Hiphop Tamizha | Aathmika',
      thumbnail: 'https://img.youtube.com/vi/XgI6HMyuBkk/mqdefault.jpg',
      channelTitle: 'Think Music India',
      publishedAt: '2017-06-02T12:00:00Z',
      duration: 'PT4M28S',
      viewCount: 110000000,
      likeCount: 1100000
    },
    {
      id: 'fL9N8e8n2y8',
      title: 'Azhage Video Song | Kathakali | Hiphop Tamizha | Vishal | Catherine Tresa',
      thumbnail: 'https://img.youtube.com/vi/fL9N8e8n2y8/mqdefault.jpg',
      channelTitle: 'V Music',
      publishedAt: '2016-01-18T12:00:00Z',
      duration: 'PT4M02S',
      viewCount: 15000000,
      likeCount: 220000
    },
    {
      id: 'U27ZofBv9K4',
      title: 'Paisa Nota Video Song | Comali | Jayam Ravi | Hiphop Tamizha',
      thumbnail: 'https://img.youtube.com/vi/U27ZofBv9K4/mqdefault.jpg',
      channelTitle: 'Sony Music South',
      publishedAt: '2019-07-25T12:00:00Z',
      duration: 'PT4M18S',
      viewCount: 68000000,
      likeCount: 780000
    },
    {
      id: 'pD7N4vH8_mE',
      title: 'Kadavulae Pole | Hiphop Tamizha | Official Music Video',
      thumbnail: 'https://img.youtube.com/vi/pD7N4vH8_mE/mqdefault.jpg',
      channelTitle: 'HiphopTamizha',
      publishedAt: '2015-11-20T12:00:00Z',
      duration: 'PT3M55S',
      viewCount: 18000000,
      likeCount: 290000
    }
  ],
  trending: [
    {
      id: '-2RAq5o5pwc',
      title: 'Jhol | Coke Studio Pakistan | Season 15 | Maanu x Annural Khalid',
      thumbnail: 'https://img.youtube.com/vi/-2RAq5o5pwc/mqdefault.jpg',
      channelTitle: 'Coke Studio',
      publishedAt: '2024-05-15T12:00:00Z',
      duration: 'PT3M45S',
      viewCount: 25000000,
      likeCount: 850000
    },
    {
      id: '4NRXx6U8ABQ',
      title: 'The Weeknd - Blinding Lights (Official Video)',
      thumbnail: 'https://img.youtube.com/vi/4NRXx6U8ABQ/mqdefault.jpg',
      channelTitle: 'The Weeknd',
      publishedAt: '2020-01-21T12:00:00Z',
      duration: 'PT3M22S',
      viewCount: 2900000000,
      likeCount: 22000000
    },
    {
      id: 'JGwWNGJdvx8',
      title: 'Ed Sheeran - Shape of You (Official Music Video)',
      thumbnail: 'https://img.youtube.com/vi/JGwWNGJdvx8/mqdefault.jpg',
      channelTitle: 'Ed Sheeran',
      publishedAt: '2017-01-30T12:00:00Z',
      duration: 'PT4M24S',
      viewCount: 6200000000,
      likeCount: 33000000
    },
    {
      id: '34Na4j8AVgA',
      title: 'The Weeknd - Starboy ft. Daft Punk (Official Video)',
      thumbnail: 'https://img.youtube.com/vi/34Na4j8AVgA/mqdefault.jpg',
      channelTitle: 'The Weeknd',
      publishedAt: '2016-09-28T12:00:00Z',
      duration: 'PT4M33S',
      viewCount: 2400000000,
      likeCount: 18000000
    },
    {
      id: 'euCqAq6S54E',
      title: 'DJ Snake - Let Me Love You ft. Justin Bieber (Official Video)',
      thumbnail: 'https://img.youtube.com/vi/euCqAq6S54E/mqdefault.jpg',
      channelTitle: 'DJ Snake',
      publishedAt: '2016-11-29T12:00:00Z',
      duration: 'PT3M26S',
      viewCount: 1200000000,
      likeCount: 11000000
    },
    {
      id: 'kTJczUoc26U',
      title: 'The Kid LAROI, Justin Bieber - STAY (Official Video)',
      thumbnail: 'https://img.youtube.com/vi/kTJczUoc26U/mqdefault.jpg',
      channelTitle: 'The Kid LAROI',
      publishedAt: '2021-07-09T12:00:00Z',
      duration: 'PT2M38S',
      viewCount: 850000000,
      likeCount: 12000000
    },
    {
      id: '7wtfhZwyrcc',
      title: 'Imagine Dragons - Believer (Official Music Video)',
      thumbnail: 'https://img.youtube.com/vi/7wtfhZwyrcc/mqdefault.jpg',
      channelTitle: 'Imagine Dragons',
      publishedAt: '2017-03-07T12:00:00Z',
      duration: 'PT3M37S',
      viewCount: 2700000000,
      likeCount: 24000000
    },
    {
      id: '2Vv-BfVoq4g',
      title: 'Ed Sheeran - Perfect (Official Music Video)',
      thumbnail: 'https://img.youtube.com/vi/2Vv-BfVoq4g/mqdefault.jpg',
      channelTitle: 'Ed Sheeran',
      publishedAt: '2017-11-09T12:00:00Z',
      duration: 'PT4M40S',
      viewCount: 3500000000,
      likeCount: 19000000
    },
    {
      id: 'L0X03zRMC74',
      title: 'Dua Lipa - Levitating Featuring DaBaby (Official Music Video)',
      thumbnail: 'https://img.youtube.com/vi/L0X03zRMC74/mqdefault.jpg',
      channelTitle: 'Dua Lipa',
      publishedAt: '2020-10-02T12:00:00Z',
      duration: 'PT3M50S',
      viewCount: 890000000,
      likeCount: 6500000
    }
  ]
};

const FEEDBACK_PATH = path.join(__dirname, '..', 'search_feedback.json');

// Helper function to read continuous behavioral feedback safely
function loadFeedback() {
  try {
    if (fs.existsSync(FEEDBACK_PATH)) {
      const data = fs.readFileSync(FEEDBACK_PATH, 'utf8');
      return JSON.parse(data || '{}');
    }
  } catch (e) {
    console.error('[Telemetry] Read feedback error:', e);
  }
  return {};
}

// Helper function to write continuous feedback safely
function saveFeedback(feedback) {
  try {
    fs.writeFileSync(FEEDBACK_PATH, JSON.stringify(feedback, null, 2), 'utf8');
  } catch (e) {
    console.error('[Telemetry] Write feedback error:', e);
  }
}

// Levenshtein distance for spelling corrections
function getLevenshteinDistance(a, b) {
  const tmp = [];
  let i, j, alen = a.length, blen = b.length, cost;
  if (alen === 0) return blen;
  if (blen === 0) return alen;
  for (i = 0; i <= alen; i++) tmp[i] = [i];
  for (j = 0; j <= blen; j++) tmp[0][j] = j;
  for (i = 1; i <= alen; i++) {
    for (j = 1; j <= blen; j++) {
      cost = (a[i - 1] === b[j - 1]) ? 0 : 1;
      tmp[i][j] = Math.min(tmp[i - 1][j] + 1, tmp[i][j - 1] + 1, tmp[i - 1][j - 1] + cost);
    }
  }
  return tmp[alen][blen];
}

const TARGET_LANGS = ['malayalam', 'tamil', 'hindi', 'english', 'telugu', 'kannada', 'punjabi', 'korean', 'kpop', 'romantic', 'melody', 'trending', 'walker', 'alan'];

function correctSpelling(query) {
  const words = query.toLowerCase().split(/\s+/);
  const corrected = words.map(word => {
    if (word.length < 4) return word; // ignore very short words
    let bestMatch = word;
    let minDistance = 3; // Max threshold of 2 edits
    for (const target of TARGET_LANGS) {
      const dist = getLevenshteinDistance(word, target);
      if (dist < minDistance) {
        minDistance = dist;
        bestMatch = target;
      }
    }
    return bestMatch;
  });
  return corrected.join(' ');
}

// Helper: parse ISO 8601 YouTube video durations to seconds
function parseDurationInSeconds(durationStr) {
  if (!durationStr) return 240; // Default fallback to 4 mins
  const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 240;
  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);
  return hours * 3600 + minutes * 60 + seconds;
}

// POST /api/search/feedback (Telemetry loop feedback receiver)
router.post('/feedback', (req, res) => {
  const { trackId, event, duration } = req.body;
  if (!trackId || !event) {
    return res.status(400).json({ error: 'trackId and event parameters are required.' });
  }

  const feedback = loadFeedback();
  if (!feedback[trackId]) {
    feedback[trackId] = { clicks: 0, skips: 0, completed: 0, watchTime: 0 };
  }

  const stats = feedback[trackId];
  switch (event) {
    case 'click':
      stats.clicks += 1;
      break;
    case 'skip':
      stats.skips += 1;
      break;
    case 'complete':
      stats.completed += 1;
      break;
    case 'heartbeat':
      if (duration && typeof duration === 'number') {
        stats.watchTime += duration;
      }
      break;
  }

  saveFeedback(feedback);
  return res.json({ success: true, stats: feedback[trackId] });
});

// GET /search?q=query or /api/search?q=query
router.get('/', async (req, res) => {
  const query = req.query.q;

  if (!query || query.trim() === '') {
    return res.status(400).json({ error: 'Search query parameter (q) is required.' });
  }

  const originalQuery = query.toLowerCase().trim();
  const correctedQuery = correctSpelling(originalQuery);
  const apiKey = process.env.YOUTUBE_API_KEY;

  console.log(`[Smart Search] Original Query: "${originalQuery}" -> Corrected: "${correctedQuery}"`);

  // Classify User Intent: Generic vs. Specific
  const genericKeywords = ['songs', 'song', 'music', 'album', 'latest', 'hits', 'trending', 'new', 'playlist', 'romantic', 'melodies', 'pop', 'hiphop', 'rap', 'top'];
  const hasGenericKeyword = genericKeywords.some(keyword => correctedQuery.includes(keyword));
  const isGenericIntent = hasGenericKeyword || correctedQuery.split(/\s+/).length <= 2; // Short queries are usually generic

  // Formulate Optimized query for YouTube Data search
  let optimizedQuery = correctedQuery;
  const musicKeywords = ['song', 'music', 'audio', 'video', 'lyrics', 'lyrical', 'track', 'album', 'official', 'remix', 'cover'];
  const hasMusicKeyword = musicKeywords.some(keyword => correctedQuery.includes(keyword));
  if (!hasMusicKeyword) {
    optimizedQuery += ' song';
  }

  const isFallbackRequired = !apiKey || apiKey.trim() === '' || apiKey === 'your_youtube_data_api_v3_key_here' || req.query.forceMock === 'true';

  if (isFallbackRequired) {
    console.log(`[Backend Smart Search] Serving fallback data for query: "${correctedQuery}"`);
    return res.json(getSmartMockResults(correctedQuery, isGenericIntent));
  }

  try {
    // Always use relevance order from YouTube (date order returns shorts/reels/devotional junk).
    // We apply our own date-first sort AFTER filtering to ensure latest real songs surface first.
    const youtubeUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(optimizedQuery)}&type=video&videoCategoryId=10&videoEmbeddable=true&maxResults=50&key=${apiKey}`;
    
    console.log(`[Backend Smart Search] Query: "${optimizedQuery}" (generic: ${isGenericIntent})`);
    const searchResponse = await fetch(youtubeUrl);
    
    if (!searchResponse.ok) {
      const errorData = await searchResponse.json();
      if (errorData.error && errorData.error.errors && errorData.error.errors[0].reason === 'quotaExceeded') {
        console.warn('[Backend Smart Search] YouTube API Quota Exceeded! Switching to mock database.');
        return res.json(getSmartMockResults(correctedQuery, isGenericIntent));
      }
      throw new Error(`YouTube API returned status ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    const items = searchData.items || [];

    if (items.length === 0) {
      return res.json([]);
    }

    // Secondary Batch Fetch: Get video duration + stats for quality filtering
    const videoIds = items.map(item => item.id.videoId).join(',');
    const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds}&key=${apiKey}`;
    
    let statsMap = {};
    try {
      const statsResponse = await fetch(statsUrl);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        (statsData.items || []).forEach(v => {
          statsMap[v.id] = {
            duration: v.contentDetails ? v.contentDetails.duration : 'PT3M',
            viewCount: parseInt(v.statistics ? v.statistics.viewCount : 0) || 0,
            likeCount: parseInt(v.statistics ? v.statistics.likeCount : 0) || 0
          };
        });
      }
    } catch (err) {
      console.error('[Smart Search] Video statistics lookup failed:', err.message);
    }

    // Map items into standardized format
    let results = items.map((item, index) => {
      const videoId = item.id.videoId;
      const stats = statsMap[videoId] || { duration: 'PT3M30S', viewCount: 50000, likeCount: 1000 };
      return {
        id: videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.medium ? item.snippet.thumbnails.medium.url : item.snippet.thumbnails.default.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        youtubeRank: index,
        duration: stats.duration,
        viewCount: stats.viewCount,
        likeCount: stats.likeCount
      };
    });

    // ── FILTER: Only block clearly non-individual-song content ──────────────────
    // Keep this minimal to avoid cutting real songs. Only block:
    // 1. Non-music content (trailers, interviews, vlogs etc.)
    // 2. Long-duration compilation streams (> 20 mins = jukebox/playlist)
    // 3. Obvious old-songs compilation channels/titles (for generic searches)
    const hardBlacklist = [
      'trailer', 'teaser', 'promo', 'interview', 'behind the scenes',
      'reaction', 'review', 'vlog', 'comedy', 'funny', 'serial', 'episode',
      'movie clip', 'short film', 'roast', 'drama', 'press meet',
      'success party', 'audio launch', 'theatre response', 'public response',
      'karaoke', 'flute cover', 'piano cover', 'violin cover', 'tutorial',
      '24x7', '24/7', 'nonstop', 'non stop', 'jukebox',
      '#shorts', 'devotional songs', 'devotional', 'bhajan'
    ];

    // Old-content patterns (only used for generic intent — word-boundary safe)
    const oldContentPatterns = [
      /\b90'?s\b/i, /\b80'?s\b/i, /\b70'?s\b/i, /\b60'?s\b/i,
      /\bevergreen\b/i, /\bsadabahaar\b/i, /\bold is gold\b/i,
      /\bgolden era\b/i, /\bretro hits\b/i,
      /\bold hindi songs\b/i, /\bold malayalam songs\b/i, /\bold tamil songs\b/i,
      /\b(19[5-9]\d|200[0-9]|201[0-9]|2020)\b/  // explicit year 1950-2020 in title
    ];

    // Old-song dedicated channel names
    const oldChannelNames = [
      'sadabahaar', 'hindi sadabahaar', 'evergreen hindi',
      '90s love anthem', '90s romance jukebox', 'purane gaane', 'purani yaadein'
    ];

    results = results.filter(track => {
      const titleLower = track.title.toLowerCase();
      const channelLower = track.channelTitle.toLowerCase();

      // Block non-music content
      if (hardBlacklist.some(word => titleLower.includes(word))) return false;

      // Block duration extremes:
      // Under 90s = YouTube Shorts, over 20 min = jukebox compilation
      const durationSecs = parseDurationInSeconds(track.duration);
      if (durationSecs < 90 || durationSecs > 1200) return false;

      // For generic intent, also block obvious old-content
      if (isGenericIntent) {
        if (oldChannelNames.some(ch => channelLower.includes(ch))) return false;
        if (oldContentPatterns.some(p => p.test(titleLower))) return false;
        // Block if uploaded before 2021
        if (track.publishedAt) {
          const yr = parseInt(track.publishedAt.substring(0, 4));
          if (!isNaN(yr) && yr < 2021) return false;
        }
      }

      return true;
    });

    // ── SORT ────────────────────────────────────────────────────────────────────
    if (isGenericIntent) {
      // Generic searches: sort purely by publishedAt (newest first)
      // YouTube already returned them in date order; this re-confirms it after filtering
      results.sort((a, b) => {
        const dateA = a.publishedAt ? new Date(a.publishedAt) : new Date(0);
        const dateB = b.publishedAt ? new Date(b.publishedAt) : new Date(0);
        return dateB - dateA;  // newest first
      });
    } else {
      // Specific searches: rank by relevance score
      const feedback = loadFeedback();
      results.forEach(track => {
        let score = 200 - track.youtubeRank * 5;
        const titleLower = track.title.toLowerCase();
        const channelLower = track.channelTitle.toLowerCase();

        if (titleLower === correctedQuery) score += 600;
        else if (titleLower.startsWith(correctedQuery)) score += 350;
        else if (titleLower.includes(correctedQuery)) score += 180;

        const queryWords = correctedQuery.match(/\b[a-z0-9]+\b/g) || [];
        queryWords.forEach(word => {
          if (new RegExp('\\b' + word + '\\b', 'i').test(titleLower)) score += 40;
        });

        const officialKeywords = ['official video', 'official music video', 'official audio', 'lyric video', 'lyrical video', 'audio song'];
        if (officialKeywords.some(w => titleLower.includes(w))) score += 120;

        if (track.viewCount > 0) score += Math.log10(track.viewCount) * 10;

        const spamWords = ['sped up', 'slowed', 'reverb', 'mashup', 'cover', '1hour', 'loop', 'bass boosted', '8d', '1 hour'];
        if (spamWords.some(w => titleLower.includes(w))) score -= 300;

        const telemetry = feedback[track.id];
        if (telemetry) {
          score += (telemetry.clicks * 20) - (telemetry.skips * 40) + (telemetry.completed * 50) + (telemetry.watchTime / 8);
        }

        track.finalRelevanceScore = score;
      });
      results.sort((a, b) => b.finalRelevanceScore - a.finalRelevanceScore);
    }

    // Return top 35
    const refinedResults = results.slice(0, 35).map(track => ({
      id: track.id,
      title: track.title,
      thumbnail: track.thumbnail,
      channelTitle: track.channelTitle,
      publishedAt: track.publishedAt
    }));

    return res.json(refinedResults);

  } catch (error) {
    console.error('[Smart Search Error] Falling back to high-quality mockup database:', error.message);
    return res.json(getSmartMockResults(correctedQuery, isGenericIntent));
  }
});

// Helper function to return smart, ranked mock results based on queries
function getSmartMockResults(query, isGenericIntent) {
  let targetPool = MOCK_DATABASE.trending;

  if (query.includes('malayalam')) {
    targetPool = MOCK_DATABASE.malayalam;
  } else if (query.includes('walker') || query.includes('alan')) {
    targetPool = MOCK_DATABASE.alan_walker;
  } else if (query.includes('tamizha') || query.includes('hip hop') || query.includes('hiphop')) {
    targetPool = MOCK_DATABASE.hip_hop_tamizha;
  } else {
    // Collect any relevant tracks from other tables
    const matches = [];
    const allTracks = [
      ...MOCK_DATABASE.malayalam,
      ...MOCK_DATABASE.alan_walker,
      ...MOCK_DATABASE.hip_hop_tamizha,
      ...MOCK_DATABASE.trending
    ];

    allTracks.forEach(track => {
      if (
        (track.title.toLowerCase().includes(query) || 
         track.channelTitle.toLowerCase().includes(query)) &&
        !matches.some(m => m.id === track.id)
      ) {
        matches.push(track);
      }
    });

    if (matches.length > 0) {
      targetPool = matches;
    }
  }

  // Strictly filter out old songs (published before 2021) for generic intent mock queries
  if (isGenericIntent) {
    targetPool = targetPool.filter(track => {
      const titleLower = track.title.toLowerCase();
      const descLower = (track.description || '').toLowerCase();

      // Check for old years 1950 - 2020
      const oldYearRegex = /\b(19[5-9]\d|200\d|201\d|2020)\b/g;
      if (oldYearRegex.test(titleLower) || oldYearRegex.test(descLower)) {
        return false;
      }

      // Check old keywords
      const oldKeywords = [
        'old', 'classic', 'retro', 'evergreen', '90s', "90's", '80s', "80's", '70s', "70's", '60s', "60's",
        'old is gold', 'vintage', 'nostalgia', 'nostalgic', 'golden hits', 'hits of', 'remastered',
        'superhit movie', 'old song', 'old hits', 'evergreen melody', 'evergreen romantic', 'black and white'
      ];
      if (oldKeywords.some(word => titleLower.includes(word) || descLower.includes(word))) {
        return false;
      }

      if (track.publishedAt) {
        const year = parseInt(track.publishedAt.substring(0, 4));
        if (!isNaN(year) && year < 2021) {
          return false;
        }
      }
      return true;
    });
  }

  // Clone list and score using local behavioral feedback
  const feedback = loadFeedback();
  const scoredPool = targetPool.map(track => {
    let score = 100;
    const titleLower = track.title.toLowerCase();

    // Specific match score
    if (titleLower.includes(query)) {
      score += 150;
      if (titleLower.startsWith(query)) score += 100;
    }

    // Recency boost (e.g. prioritize 2024 Jhol over older songs)
    if (isGenericIntent && track.publishedAt) {
      const year = parseInt(track.publishedAt.substring(0, 4));
      if (year >= 2024) score += 200;
      else if (year >= 2022) score += 100;
    }

    // Behavioral loop
    const telemetry = feedback[track.id];
    if (telemetry) {
      score += (telemetry.clicks * 20) - (telemetry.skips * 40) + (telemetry.completed * 50) + (telemetry.watchTime / 8);
    }

    return { ...track, score };
  });

  scoredPool.sort((a, b) => b.score - a.score);

  return scoredPool.map(track => ({
    id: track.id,
    title: track.title,
    thumbnail: track.thumbnail,
    channelTitle: track.channelTitle,
    publishedAt: track.publishedAt
  }));
}

// GET /api/search/recommendations?title=...&artist=...&trackId=...
router.get('/recommendations', async (req, res) => {
  const { title, artist, trackId } = req.query;

  if (!title) {
    return res.status(400).json({ error: 'Track title is required for recommendations.' });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  const isFallbackRequired = !apiKey || apiKey.trim() === '' || apiKey === 'your_youtube_data_api_v3_key_here';

  // Lowercase helpers for classification
  const titleLower = title.toLowerCase();
  const artistLower = (artist || '').toLowerCase();

  // --- Layer 1: Extract Language ---
  let language = 'english';
  const malayalamKeywords = ['malayalam', 'manavalan', 'thallumaala', 'hridayam', 'darshana', 'kudukku', 'malare', 'premam', 'kaduva', 'pala palli', 'tovino', 'mohanlal', 'mammootty', 'dulquer', 'nivin', 'vineeth', 'srinivasan', 'hesham', 'shafi', 'shreya ghoshal', 'ks chithra', 'mg sreekumar', 'yesudas', 'k s chithra', 'g gopi sundar', 'gopi sundar', 'sushin syam', 'sushin', 'jakes bejoy', 'dabzee', 'akale', 'shamil'];
  const tamilKeywords = ['tamil', 'anirudh', 'ar rahman', 'rahman', 'yuvan', 'gvp', 'harris jayaraj', 'hiphop tamizha', 'aditya', 'vijay', 'ajith', 'rajini', 'dhanush', 'suriya', 'sid sriram', 'ilayaraja', 'spb', 'anirudh ravichander', 'vidyasagar', 'imman', 'santhosh narayanan', 'sana'];
  const hindiKeywords = ['hindi', 'arijit', 'shreya', 'jubin', 't-series', 'lata mangeshkar', 'kishore', 'rd burman', 'pritam', 'amit trivedi', 'arman malik', 'badshah', 'raftaar', 'nehakakkar', 'neha kakkar', 'tony kakkar', 'vishal mishra', 'mithoon', 'sachin-jigar', 'sachin jigar'];

  if (malayalamKeywords.some(kw => titleLower.includes(kw) || artistLower.includes(kw))) {
    language = 'malayalam';
  } else if (tamilKeywords.some(kw => titleLower.includes(kw) || artistLower.includes(kw))) {
    language = 'tamil';
  } else if (hindiKeywords.some(kw => titleLower.includes(kw) || artistLower.includes(kw))) {
    language = 'hindi';
  }

  // --- Layer 2: Extract Genre / Vibe ---
  let vibe = 'pop'; // default
  const melodyKeywords = ['melody', 'romantic', 'love', 'sad', 'feel', 'heart', 'acoustic', 'piano', 'slowed', 'lofi', 'unplugged', 'darshana', 'malare', 'perfect', 'faded', 'beautiful', 'emotional', 'relax', 'chill', 'soft'];
  const hiphopKeywords = ['rap', 'hip hop', 'hiphop', 'thug', 'trap', 'beat', 'club', 'tamizha', 'dabzee', 'street', 'freestyle', 'cypher'];
  const edmKeywords = ['edm', 'electronic', 'spectre', 'alone', 'faded', 'remix', 'dance', 'house', 'synthwave', 'dj snake', 'alan walker', 'marshmello', 'techno', 'trance', 'electro'];

  if (melodyKeywords.some(kw => titleLower.includes(kw))) {
    vibe = 'melody';
  } else if (hiphopKeywords.some(kw => titleLower.includes(kw))) {
    vibe = 'hiphop';
  } else if (edmKeywords.some(kw => titleLower.includes(kw))) {
    vibe = 'edm';
  }

  // --- Layer 3: Handle Fallback (Mock) recommendations ---
  if (isFallbackRequired) {
    console.log(`[Backend Recommendations] Serving mock recommendation for language: ${language}, vibe: ${vibe}`);
    let recs = [];
    if (language === 'malayalam') {
      recs = MOCK_DATABASE.malayalam;
    } else if (artistLower.includes('walker') || artistLower.includes('alan') || vibe === 'edm') {
      recs = MOCK_DATABASE.alan_walker;
    } else if (language === 'tamil' || vibe === 'hiphop') {
      recs = MOCK_DATABASE.hip_hop_tamizha;
    } else {
      recs = MOCK_DATABASE.trending;
    }
    return res.json(recs.filter(t => t.id !== trackId).slice(0, 8));
  }

  // --- Layer 4: Live YouTube Data API Recommendations ---
  try {
    let recQuery = '';
    const cleanArtist = (artist || '')
      .replace(/vevo/gi, '')
      .replace(/official/gi, '')
      .replace(/topic/gi, '')
      .replace(/music/gi, '')
      .replace(/records/gi, '')
      .trim();

    if (language === 'malayalam') {
      if (vibe === 'melody') {
        recQuery = `Malayalam melody romantic songs ${cleanArtist}`;
      } else {
        recQuery = `Malayalam trending hit songs dance ${cleanArtist}`;
      }
    } else if (language === 'tamil') {
      if (vibe === 'melody') {
        recQuery = `Tamil romantic melody hit songs ${cleanArtist}`;
      } else {
        recQuery = `Tamil high energy mass beat songs ${cleanArtist}`;
      }
    } else if (language === 'hindi') {
      if (vibe === 'melody') {
        recQuery = `Hindi romantic love acoustic songs ${cleanArtist}`;
      } else {
        recQuery = `Hindi dance pop party hits ${cleanArtist}`;
      }
    } else { // English / International
      if (vibe === 'edm') {
        recQuery = `EDM electronic dance festival songs kygo alan walker ${cleanArtist}`;
      } else if (vibe === 'melody') {
        recQuery = `English acoustic romantic soft pop songs lofi ${cleanArtist}`;
      } else {
        recQuery = `Trending billboard pop hit songs dance ${cleanArtist}`;
      }
    }

    console.log(`[Backend Recommendations] Formulated search query: "${recQuery}" for active track: "${title}"`);

    const youtubeUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(recQuery)}&type=video&videoCategoryId=10&videoEmbeddable=true&maxResults=15&key=${apiKey}`;
    
    const response = await fetch(youtubeUrl);
    if (!response.ok) {
      throw new Error(`YouTube API recommendations returned status ${response.status}`);
    }

    const data = await response.json();

    const blacklist = [
      'trailer', 'teaser', 'promo', 'interview', 'behind the scenes', 'bts', 
      'reaction', 'review', 'vlog', 'comedy', 'funny', 'serial', 'episode', 
      'scene', 'movie clip', 'short film', 'roast', 'drama', 'uncut', 'press meet', 
      'success party', 'promotional', 'audio launch', 'full movie', 'theatre response', 'public response'
    ];

    const results = data.items
      .map(item => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.medium ? item.snippet.thumbnails.medium.url : item.snippet.thumbnails.default.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt
      }))
      .filter(track => {
        const tLower = track.title.toLowerCase();
        const cLower = track.channelTitle.toLowerCase();
        
        const isBlacklisted = blacklist.some(word => tLower.includes(word) || cLower.includes(word));
        const isCurrentTrack = track.id === trackId;
        
        return !isBlacklisted && !isCurrentTrack;
      })
      .slice(0, 10);

    return res.json(results);

  } catch (error) {
    console.error('[Backend Recommendations] Error fetching recommendations:', error.message);
    let fallbackRecs = MOCK_DATABASE.trending;
    if (language === 'malayalam') fallbackRecs = MOCK_DATABASE.malayalam;
    else if (language === 'tamil') fallbackRecs = MOCK_DATABASE.hip_hop_tamizha;
    return res.json(fallbackRecs.filter(t => t.id !== trackId).slice(0, 8));
  }
});

// GET /api/search/artist-image?name=...
router.get('/artist-image', async (req, res) => {
  const name = req.query.name;
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Artist name query parameter (name) is required.' });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  const isFallbackRequired = !apiKey || apiKey.trim() === '' || apiKey === 'your_youtube_data_api_v3_key_here';

  if (isFallbackRequired) {
    return res.json({ thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80' });
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(name)}&type=channel&maxResults=1&key=${apiKey}`;
    console.log(`[Backend Artist Image] Querying YouTube for artist channel: "${name}"`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`YouTube API returned status ${response.status}`);
    }

    const data = await response.json();
    if (data.items && data.items.length > 0) {
      const channel = data.items[0];
      const thumbnails = channel.snippet.thumbnails;
      const imageUrl = (thumbnails.high || thumbnails.medium || thumbnails.default).url;
      return res.json({ thumbnail: imageUrl });
    }

    return res.json({ thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80' });
  } catch (error) {
    console.error('[Backend Artist Image] Error fetching channel avatar:', error.message);
    return res.json({ thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80' });
  }
});

module.exports = router;
