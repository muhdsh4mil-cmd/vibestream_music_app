/* ==========================================================================
   Vibestream - Interactive Application Engine & Media Controller
   ========================================================================== */

// Global state variables
let youtubePlayer = null;
let currentTrack = null;
let currentTrackIndex = -1;
let trackQueue = [];
let isPlayerReady = false;
let progressUpdateInterval = null;
let shuffleActive = false;
let repeatActive = false;
let lastSearchedQuery = '';
let lastEndedTrackId = null;
let lastEndedTimestamp = 0;
let isSearchQueuePlayback = false;
let lastSkipTimestamp = 0;
let isMockModeActive = false;

// LocalStorage Persistent Collections
let likedTracks = new Set(); // Stores track IDs
let likedTrackObjects = [];  // Stores actual track metadata: { id, title, channelTitle, thumbnail }
let customPlaylists = [];    // Stores custom playlists: { title, desc, thumbnail, query }
let customArtists = [];      // Stores user followed favorite artists: { name, query, listeners, thumbnail }
let recentlyPlayed = [];     // Stores last 5 played tracks: { id, title, channelTitle, thumbnail }

// Live Home Mapped Database (Clicking plays real, curated YouTube tracks!)
const HOME_CARDS_MAPPING = {
  recentlyPlayed: [
    {
      id: '4xDzrJKXOOY', // Neon Midnight Drive vibe synthwave
      title: 'Midnight Drive',
      channelTitle: 'The Nightfall',
      thumbnail: 'https://images.unsplash.com/photo-1515462277126-270d878326e5?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'd_HlPboLRL8', // Aurora - Runway
      title: 'Solar Flare',
      channelTitle: 'Aurora',
      thumbnail: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: '60ItHLz5WEA', // Alan Walker - Faded
      title: 'Lost in Echoes',
      channelTitle: 'Echo Wave',
      thumbnail: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: '5yx6Gygb9Ww', // Lofi Chill Beats
      title: 'Chillhop Lounge',
      channelTitle: 'Melody Curated',
      thumbnail: 'https://images.unsplash.com/photo-1513829096999-497860229414?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'fiP6H-J82yQ', // Billie Eilish - Ocean Eyes
      title: 'Ocean Eyes',
      channelTitle: 'Azure Waves',
      thumbnail: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=400&q=80'
    }
  ],
  madeForYou: [
    {
      id: '34Na4j8AVgA', // The Weeknd - Starboy
      title: 'Discover Weekly',
      channelTitle: 'Weekly Mixtape',
      thumbnail: 'https://images.unsplash.com/photo-1574169208507-84376144848b?auto=format&fit=crop&w=300&q=80'
    },
    {
      id: '8bcPn-MId9A', // Focus Lofi beats
      title: 'Deep Focus',
      channelTitle: 'Focus Labs',
      thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=300&q=80'
    },
    {
      id: '4NRXx6U8ABQ', // The Weeknd - Blinding Lights
      title: 'Chill Hits',
      channelTitle: 'Melody Curated',
      thumbnail: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=300&q=80'
    },
    {
      id: '2Vv-BfVoq4g', // Ed Sheeran - Perfect
      title: 'Morning Acoustic',
      channelTitle: 'Acoustic Sunrise',
      thumbnail: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=300&q=80'
    }
  ]
};

const PREMIUM_FALLBACK_POOL = [
  // Malayalam
  {
    id: 'B-pNp0LUV2Y',
    title: 'Darshana',
    channelTitle: 'Hesham Abdul Wahab',
    thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: '0G2VxhV_gXM',
    title: 'Malare - Premam',
    channelTitle: 'Vijay Yesudas',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: '5z1_v4m25e8',
    title: 'Manavalan Thug',
    channelTitle: 'Dabzee & SA',
    thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80'
  },
  // Tamil
  {
    id: 'kYJzX91_64o',
    title: 'Naan Pizhai',
    channelTitle: 'Anirudh Ravichander',
    thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'gT5c-4y4Fm4',
    title: 'Kadhal Sadugudu - Cover',
    channelTitle: 'A.R. Rahman',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80'
  },
  // Hindi
  {
    id: 'R9U0O0y1l68',
    title: 'Tu Jaane Na - Lyrical',
    channelTitle: 'Atif Aslam',
    thumbnail: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'Xh079R_rM-0',
    title: 'Pehli Nazar Mein',
    channelTitle: 'Atif Aslam',
    thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'HK7SPnGSxLM',
    title: 'Jeene Laga Hoon',
    channelTitle: 'Atif Aslam',
    thumbnail: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=400&q=80'
  },
  // English
  {
    id: '34Na4j8AVgA',
    title: 'Starboy',
    channelTitle: 'The Weeknd',
    thumbnail: 'https://images.unsplash.com/photo-1574169208507-84376144848b?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: '4NRXx6U8ABQ',
    title: 'Blinding Lights',
    channelTitle: 'The Weeknd',
    thumbnail: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: '2Vv-BfVoq4g',
    title: 'Perfect',
    channelTitle: 'Ed Sheeran',
    thumbnail: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'fiP6H-J82yQ',
    title: 'Ocean Eyes',
    channelTitle: 'Billie Eilish',
    thumbnail: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=400&q=80'
  }
];

// Helper to resolve API URLs (fallback to port 3000 if running on other ports)
const getApiUrl = (path) => {
  const isProd = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
  if (!isProd && window.location.port !== '3000') {
    return `http://localhost:3000${path}`;
  }
  return path;
};

// DOM Cache including all active panel controls and redesigned elements
const dom = {
  // Search & Navigation
  searchForm: document.getElementById('searchForm'),
  searchInput: document.getElementById('searchInput'),
  btnClearSearch: document.getElementById('btnClearSearch'),
  songsGrid: document.getElementById('songsGrid'),
  loadingShimmer: document.getElementById('loadingShimmer'),
  emptyState: document.getElementById('emptyState'),
  errorState: document.getElementById('errorState'),
  errorDetails: document.getElementById('errorDetails'),
  btnErrorRetry: document.getElementById('btnErrorRetry'),
  searchResultsTitle: document.getElementById('searchResultsTitle'),
  searchIndicator: document.getElementById('searchIndicator'),
  activeQueryText: document.getElementById('activeQueryText'),
  
  // View Containers
  homeLandingView: document.getElementById('homeLandingView'),
  searchResultsView: document.getElementById('searchResultsView'),
  libraryView: document.getElementById('libraryView'),
  playlistsView: document.getElementById('playlistsView'),
  likedSongsView: document.getElementById('likedSongsView'),
  artistsView: document.getElementById('artistsView'),
  podcastsView: document.getElementById('podcastsView'),
  
  // Sidebar items
  btnHome: document.getElementById('btnHome'),
  btnSearchFocus: document.getElementById('btnSearchFocus'),
  btnLogoHome: document.getElementById('btnLogoHome'),
  btnYourLibrary: document.getElementById('btnYourLibrary'),
  btnPlaylists: document.getElementById('btnPlaylists'),
  btnLikedSongs: document.getElementById('btnLikedSongs'),
  btnArtists: document.getElementById('btnArtists'),
  btnPodcasts: document.getElementById('btnPodcasts'),
  btnNavQueue: document.getElementById('btnNavQueue'),
  apiBadge: document.getElementById('apiBadge'),
  
  // Video Drawer compatibility elements
  videoDrawer: document.getElementById('videoDrawer'),
  btnToggleVideoDrawer: document.getElementById('btnToggleVideoDrawer'),
  btnMinimizeDrawer: document.getElementById('btnMinimizeDrawer'),
  
  // Bottom Player Panel
  playbackBar: document.querySelector('.playback-bar-panel'),
  playerTitle: document.getElementById('playerTitle'),
  playerArtist: document.getElementById('playerArtist'),
  trackArt: document.getElementById('trackArt'),
  musicBars: document.getElementById('musicBars'),
  btnHeartTrack: document.getElementById('btnHeartTrack'),
  
  // Bottom Controls
  btnPlayPause: document.getElementById('btnPlayPause'),
  btnPrev: document.getElementById('btnPrev'),
  btnNext: document.getElementById('btnNext'),
  btnShuffle: document.getElementById('btnShuffle'),
  btnRepeat: document.getElementById('btnRepeat'),
  
  // Bottom Seek
  timeCurrent: document.getElementById('timeCurrent'),
  timeTotal: document.getElementById('timeTotal'),
  progressBarContainer: document.getElementById('progressBarContainer'),
  progressBarFill: document.getElementById('progressBarFill'),
  progressBarHandle: document.getElementById('progressBarHandle'),
  
  // Volume Slider
  btnMuteToggle: document.getElementById('btnMuteToggle'),
  volumeIcon: document.getElementById('volumeIcon'),
  volumeSliderContainer: document.getElementById('volumeSliderContainer'),
  volumeFill: document.getElementById('volumeFill'),
  volumeHandle: document.getElementById('volumeHandle'),

  // Redesigned Hero Controls (Top Player)
  heroPlayerCard: document.getElementById('heroPlayerCard'),
  heroArt: document.getElementById('heroArt'),
  heroTitle: document.getElementById('heroTitle'),
  heroArtist: document.getElementById('heroArtist'),
  heroHeart: document.getElementById('heroHeart'),
  heroWaveform: document.getElementById('heroWaveform'),
  
  heroPlayPause: document.getElementById('heroPlayPause'),
  heroPrev: document.getElementById('heroPrev'),
  heroNext: document.getElementById('heroNext'),
  heroShuffle: document.getElementById('heroShuffle'),
  heroRepeat: document.getElementById('heroRepeat'),
  
  heroTimeCurrent: document.getElementById('heroTimeCurrent'),
  heroTimeTotal: document.getElementById('heroTimeTotal'),
  heroTimelineContainer: document.getElementById('heroTimelineContainer'),
  heroTimelineFill: document.getElementById('heroTimelineFill'),
  heroTimelineHandle: document.getElementById('heroTimelineHandle'),

  // Dynamic Lists Targets
  likedSongsListContainer: document.getElementById('likedSongsListContainer'),
  likedSongsEmptyState: document.getElementById('likedSongsEmptyState'),
  likedSongsCountLabel: document.getElementById('likedSongsCountLabel'),
  libLikedCount: document.getElementById('libLikedCount'),
  libPlaylistsCount: document.getElementById('libPlaylistsCount'),
  playlistsGrid: document.getElementById('playlistsGrid'),
  btnCreatePlaylist: document.getElementById('btnCreatePlaylist'),
  libCardLiked: document.getElementById('libCardLiked'),
  libCardPlaylists: document.getElementById('libCardPlaylists'),
  libCardArtists: document.getElementById('libCardArtists'),
  
  // New Artist Targets
  artistsGrid: document.getElementById('artistsGrid'),
  btnAddArtist: document.getElementById('btnAddArtist')
};

/* ==========================================================================
   Persistence Load & Save Handlers
   ========================================================================== */

let currentUser = null;

function getUserStorageKey(baseKey) {
  if (currentUser && currentUser.email) {
    const userSuffix = '_' + currentUser.email.toLowerCase().replace(/[^a-z0-9]/g, '');
    return baseKey + userSuffix;
  }
  return baseKey + '_guest';
}

function loadSavedState() {
  try {
    // 1. Liked Songs Caching
    const savedLikes = localStorage.getItem(getUserStorageKey('melody_liked_tracks_data'));
    if (savedLikes) {
      likedTrackObjects = JSON.parse(savedLikes);
      likedTracks = new Set(likedTrackObjects.map(track => track.id));
    } else {
      likedTracks = new Set();
      likedTrackObjects = [];
    }
    
    // 2. Playlists Caching
    const savedPlaylists = localStorage.getItem(getUserStorageKey('melody_custom_playlists_data'));
    if (savedPlaylists) {
      customPlaylists = JSON.parse(savedPlaylists);
    } else {
      customPlaylists = [];
    }

    // 3. Artists Caching
    const savedArtists = localStorage.getItem(getUserStorageKey('melody_custom_artists_data'));
    if (savedArtists) {
      customArtists = JSON.parse(savedArtists);
      // Automatically correct the portrait for "hanan shaah" and "arijit singh" if present in user's localStorage
      customArtists = customArtists.map(artist => {
        const nameLower = artist.name.toLowerCase().trim();
        if (nameLower === 'hanan shaah') {
          return {
            ...artist,
            thumbnail: 'https://yt3.ggpht.com/eTVvqHsDJVI1gZf7-xGg8FReFZoZyP5SBx_CdpP970OxPeUBaH-2AmnTgnCKMM-N1EAdno8F9Q=s800-c-k-c0xffffffff-no-rj-mo' // Official Real Hanan Shaah profile picture
          };
        } else if (nameLower === 'arijit singh') {
          return {
            ...artist,
            thumbnail: 'https://yt3.ggpht.com/DcEzZrPCQRSSs47rMbdJ3UJkQUCN3X8SKf8aCnvOgd2BmPihAz-0jBGJgEVh9_P8EiSBVNyixDs=s800-c-k-c0xffffffff-no-rj-mo' // Official Real Arijit Singh profile picture
          };
        }
        return artist;
      });
      localStorage.setItem(getUserStorageKey('melody_custom_artists_data'), JSON.stringify(customArtists));
    } else {
      customArtists = [];
    }

    // 4. Recently Played Caching (Clean feed for new users)
    const savedRecent = localStorage.getItem(getUserStorageKey('melody_recently_played_songs'));
    if (savedRecent) {
      recentlyPlayed = JSON.parse(savedRecent);
    } else {
      recentlyPlayed = [];
    }
  } catch (err) {
    console.error('[Melody Persistence] Failed to retrieve cache:', err);
    likedTracks = new Set();
    likedTrackObjects = [];
    customPlaylists = [];
    customArtists = [];
    recentlyPlayed = [...HOME_CARDS_MAPPING.recentlyPlayed];
  }
  updateLibrarySummaryCounters();
}

function saveLikedTracksToCache() {
  try {
    localStorage.setItem(getUserStorageKey('melody_liked_tracks_data'), JSON.stringify(likedTrackObjects));
  } catch (err) {
    console.error('[Melody Persistence] Save Liked failed:', err);
  }
  updateLibrarySummaryCounters();
}

function savePlaylistsToCache() {
  try {
    localStorage.setItem(getUserStorageKey('melody_custom_playlists_data'), JSON.stringify(customPlaylists));
  } catch (err) {
    console.error('[Melody Persistence] Save Playlists failed:', err);
  }
  updateLibrarySummaryCounters();
}

function saveArtistsToCache() {
  try {
    localStorage.setItem(getUserStorageKey('melody_custom_artists_data'), JSON.stringify(customArtists));
  } catch (err) {
    console.error('[Melody Persistence] Save Artists failed:', err);
  }
  updateLibrarySummaryCounters();
}

function updateLibrarySummaryCounters() {
  if (dom.libLikedCount) dom.libLikedCount.innerText = likedTrackObjects.length;
  if (dom.libPlaylistsCount) dom.libPlaylistsCount.innerText = customPlaylists.length;
  if (dom.libCardArtists) {
    const label = dom.libCardArtists.querySelector('.lib-count');
    if (label) label.innerText = customArtists.length;
  }
  if (dom.likedSongsCountLabel) dom.likedSongsCountLabel.innerText = `${likedTrackObjects.length} song${likedTrackObjects.length === 1 ? '' : 's'}`;
}

/* ==========================================================================
   YouTube Iframe Player API Integration
   ========================================================================== */

function onYouTubeIframeAPIReady() {
  console.log('[Melody API] YouTube Player script loaded. Starting player bootstrap...');
  
  youtubePlayer = new YT.Player('youtubePlayerPlaceholder', {
    height: '100%',
    width: '100%',
    videoId: '', // Initialize empty
    playerVars: {
      playsinline: 1,
      controls: 0,      // Hide native controls
      rel: 0,           // Disable related suggestions
      disablekb: 1,     // Handle keyboard shortcuts locally
      modestbranding: 1
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
      onError: onPlayerError
    }
  });
}
window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

function onPlayerReady(event) {
  console.log('[Melody API] Streaming Engine is now online!');
  isPlayerReady = true;
  
  // Match standard volume defaults
  youtubePlayer.setVolume(80);
  updateVolumeUI(80);
  
  // Hook listeners across both control bars
  setupControlListeners();
  
  // Set initial homepage state based on active user state
  if (currentUser) {
    const defaultTrack = (recentlyPlayed && recentlyPlayed.length > 0) ? recentlyPlayed[0] : HOME_CARDS_MAPPING.recentlyPlayed[0];
    trackQueue = (recentlyPlayed && recentlyPlayed.length > 0) ? [...recentlyPlayed] : [...HOME_CARDS_MAPPING.recentlyPlayed];
    currentTrackIndex = 0;
    loadTrackMetadataOnly(defaultTrack);
  } else {
    // Keep UI clean/empty on gate screen
    clearPlayerMetadata();
  }
}

function onPlayerStateChange(event) {
  switch (event.data) {
    case YT.PlayerState.PLAYING:
      console.log('[Playback Engine] Status: Play');
      
      // Update styling to trigger equalizers and double neon orbit
      dom.playbackBar.classList.add('playing-active');
      dom.heroPlayerCard.classList.add('playing-active');
      
      // Synchronize play icons
      dom.btnPlayPause.innerHTML = '<i class="fa-solid fa-pause"></i>';
      dom.btnPlayPause.classList.add('paused-state');
      dom.heroPlayPause.innerHTML = '<i class="fa-solid fa-pause"></i>';
      dom.heroPlayPause.classList.add('paused-state');
      
      startProgressTracking();
      updateGridActiveStates();
      break;
      
    case YT.PlayerState.PAUSED:
    case YT.PlayerState.BUFFERING:
      console.log('[Playback Engine] Status: Paused/Buffering');
      
      // Stop animation pulses
      dom.playbackBar.classList.remove('playing-active');
      dom.heroPlayerCard.classList.remove('playing-active');
      
      // Synchronize play icons
      dom.btnPlayPause.innerHTML = '<i class="fa-solid fa-play"></i>';
      dom.btnPlayPause.classList.remove('paused-state');
      dom.heroPlayPause.innerHTML = '<i class="fa-solid fa-play"></i>';
      dom.heroPlayPause.classList.remove('paused-state');
      
      stopProgressTracking();
      break;
      
    case YT.PlayerState.ENDED:
      console.log('[Playback Engine] Status: Finished');
      
      // Debounce and prevent duplicate ended triggers within rapid windows (2.5 seconds)
      const endedNow = Date.now();
      if (currentTrack && lastEndedTrackId === currentTrack.id && (endedNow - lastEndedTimestamp) < 2500) {
        console.log('[Playback Engine] Duplicate ENDED signal ignored to prevent infinite looping of track:', currentTrack.title);
        break;
      }
      if (currentTrack) {
        lastEndedTrackId = currentTrack.id;
        lastEndedTimestamp = endedNow;
      }

      dom.playbackBar.classList.remove('playing-active');
      dom.heroPlayerCard.classList.remove('playing-active');
      dom.btnPlayPause.innerHTML = '<i class="fa-solid fa-play"></i>';
      dom.btnPlayPause.classList.remove('paused-state');
      dom.heroPlayPause.innerHTML = '<i class="fa-solid fa-play"></i>';
      dom.heroPlayPause.classList.remove('paused-state');
      
      stopProgressTracking();
      
      if (repeatActive) {
        setTimeout(() => {
          if (youtubePlayer && typeof youtubePlayer.playVideo === 'function') {
            youtubePlayer.playVideo();
          }
        }, 150);
      } else {
        setTimeout(() => {
          playNextTrack();
        }, 150);
      }
      break;
  }
}

function onPlayerError(event) {
  console.error('[Playback Engine] YouTube reported an interface error:', event.data);
  
  // If the track was already playing fine (played > 5s), transition SILENTLY to avoid false-alarm error toasts!
  let currentTime = 0;
  try {
    if (youtubePlayer && typeof youtubePlayer.getCurrentTime === 'function') {
      currentTime = youtubePlayer.getCurrentTime();
    }
  } catch (e) {
    console.warn('[Playback Engine] Error retrieving player time:', e);
  }

  if (currentTime < 5) {
    showToast('Loading next track...');
  }
  
  setTimeout(playNextTrack, 300);
}

/* ==========================================================================
   Playback Execution & Core Synchronization
   ========================================================================== */

function loadTrackMetadataOnly(track) {
  currentTrack = track;
  
  // Synchronize titles, channels and artwork
  dom.playerTitle.innerText = decodeHtml(track.title);
  dom.playerArtist.innerText = decodeHtml(track.channelTitle);
  dom.trackArt.src = track.thumbnail;
  
  dom.heroTitle.innerText = decodeHtml(track.title);
  dom.heroArtist.innerText = decodeHtml(track.channelTitle);
  dom.heroArt.src = track.thumbnail;
  
  // Reset seeks
  dom.timeCurrent.innerText = '0:00';
  dom.timeTotal.innerText = '3:45';
  dom.heroTimeCurrent.innerText = '0:00';
  dom.heroTimeTotal.innerText = '3:45';
  
  dom.progressBarFill.style.width = '0%';
  dom.progressBarHandle.style.left = '0%';
  dom.heroTimelineFill.style.width = '0%';
  dom.heroTimelineHandle.style.left = '0%';
  
  syncLikedState(track.id);
  
  if (youtubePlayer && isPlayerReady) {
    youtubePlayer.cueVideoById(track.id);
  }
}

function clearPlayerMetadata() {
  currentTrack = null;
  currentTrackIndex = -1;
  trackQueue = [];
  
  // Bottom Player Details
  dom.playerTitle.innerText = 'No Track Active';
  dom.playerArtist.innerText = 'Select a song...';
  dom.trackArt.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="%23555" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';
  
  // Hero Details
  dom.heroTitle.innerText = 'No Track Active';
  dom.heroArtist.innerText = 'Select a song to start listening';
  dom.heroArt.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 24 24" fill="none" stroke="%23222" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M9 17V5l12-2v12"/><circle cx="6" cy="17" r="3"/><circle cx="18" cy="15" r="3"/></svg>';
  
  // Reset seeks and progression bars
  dom.timeCurrent.innerText = '0:00';
  dom.timeTotal.innerText = '0:00';
  dom.heroTimeCurrent.innerText = '0:00';
  dom.heroTimeTotal.innerText = '0:00';
  
  dom.progressBarFill.style.width = '0%';
  dom.progressBarHandle.style.left = '0%';
  dom.heroTimelineFill.style.width = '0%';
  dom.heroTimelineHandle.style.left = '0%';
  
  // Pause any active equalizer animations
  const bars = document.getElementById('musicBars');
  if (bars) bars.classList.remove('playing');
}

// Continuous behavioral search telemetries
let telemetryTrackPlayStart = 0;
let telemetryActiveTrack = null;
let telemetryListenSeconds = 0;
let telemetrySentCompletion = false;
let telemetryLastCheckedSecond = -1;

async function sendTelemetryFeedback(trackId, event, duration = 0) {
  try {
    await fetch('/api/search/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ trackId, event, duration })
    });
  } catch (err) {
    console.warn('[Telemetry] Failed to dispatch feedback:', err);
  }
}

function playTrack(track, index) {
  if (!isPlayerReady || !track) return;
  
  // Evaluate skip/heartbeat feedback for the previous track before starting new play
  if (telemetryActiveTrack) {
    const elapsedSeconds = (Date.now() - telemetryTrackPlayStart) / 1000;
    if (elapsedSeconds < 30) {
      sendTelemetryFeedback(telemetryActiveTrack.id, 'skip');
      console.log(`[Telemetry] Sent skip penalty for track: "${telemetryActiveTrack.title}"`);
    } else {
      const remainingSeconds = telemetryListenSeconds % 15;
      if (remainingSeconds > 0) {
        sendTelemetryFeedback(telemetryActiveTrack.id, 'heartbeat', remainingSeconds);
      }
    }
  }

  // Send click event for the new track
  sendTelemetryFeedback(track.id, 'click');

  // Reset telemetry registers for the new track
  telemetryActiveTrack = track;
  telemetryTrackPlayStart = Date.now();
  telemetryListenSeconds = 0;
  telemetrySentCompletion = false;
  telemetryLastCheckedSecond = -1;

  console.log(`[Melody] Loading track: "${track.title}" (ID: ${track.id})`);
  
  currentTrack = track;
  currentTrackIndex = index;
  
  // Track playback history for loop prevention (cache last 8 items)
  if (track && track.id) {
    recentPlaybackHistoryIds = recentPlaybackHistoryIds.filter(id => id !== track.id);
    recentPlaybackHistoryIds.unshift(track.id);
    if (recentPlaybackHistoryIds.length > 8) {
      recentPlaybackHistoryIds.pop();
    }
    
    // Strict no-repeat session rule: mark as played
    fullyPlayedTrackIds.add(track.id);
  }
  
  // Add to dynamically tracked recently played songs
  addTrackToRecentlyPlayed(track);
  
  // Sync bottom player details
  dom.playerTitle.innerText = decodeHtml(track.title);
  dom.playerArtist.innerText = decodeHtml(track.channelTitle);
  dom.trackArt.src = track.thumbnail;
  
  // Sync top Hero details
  dom.heroTitle.innerText = decodeHtml(track.title);
  dom.heroArtist.innerText = decodeHtml(track.channelTitle);
  dom.heroArt.src = track.thumbnail;
  
  updateGridActiveStates();
  syncLikedState(track.id);
  
  // Stream the track
  youtubePlayer.loadVideoById(track.id);
}

function addTrackToRecentlyPlayed(track) {
  if (!track) return;
  
  // Avoid duplicates: remove song if it was already played earlier
  recentlyPlayed = recentlyPlayed.filter(item => item.id !== track.id);
  
  // Place latest track at the front of the array
  recentlyPlayed.unshift(track);
  
  // Cap history at exactly 5 items
  if (recentlyPlayed.length > 5) {
    recentlyPlayed = recentlyPlayed.slice(0, 5);
  }
  
  // Save updated history in persistent local storage
  try {
    localStorage.setItem(getUserStorageKey('melody_recently_played_songs'), JSON.stringify(recentlyPlayed));
  } catch (err) {
    console.error('[Melody Persistence] Save Recently Played failed:', err);
  }
  
  // Dynamically update homepage recently played grid layout
  renderRecentlyPlayed();
}

function cleanSongTitle(title) {
  if (!title) return '';
  let clean = decodeHtml(title);
  
  // Remove common YouTube title clutter (case-insensitive)
  clean = clean.replace(/\s*[([][^)\]]*official[^)\]]*[)\]]/gi, '');
  clean = clean.replace(/\s*[([][^)\]]*video[^)\]]*[)\]]/gi, '');
  clean = clean.replace(/\s*[([][^)\]]*audio[^)\]]*[)\]]/gi, '');
  clean = clean.replace(/\s*[([][^)\]]*lyric[^)\]]*[)\]]/gi, '');
  clean = clean.replace(/\s*[([][^)\]]*hd[^)\]]*[)\]]/gi, '');
  clean = clean.replace(/\s*[([][^)\]]*4k[^)\]]*[)\]]/gi, '');
  clean = clean.replace(/\s*[([][^)\]]*hq[^)\]]*[)\]]/gi, '');
  clean = clean.replace(/\s*[([][^)\]]*remix[^)\]]*[)\]]/gi, '');
  clean = clean.replace(/\s*[([][^)\]]*cover[^)\]]*[)\]]/gi, '');
  clean = clean.replace(/\s*[([][^)\]]*feat\.?[^)\]]*[)\]]/gi, '');
  clean = clean.replace(/\s*[([][^)\]]*ft\.?[^)\]]*[)\]]/gi, '');
  clean = clean.replace(/\s*[([][^)\]]*lyrics[^)\]]*[)\]]/gi, '');
  
  // Clean up any trailing hyphens or vertical bars and trim
  clean = clean.trim();
  if (clean.endsWith('-') || clean.endsWith('|')) {
    clean = clean.substring(0, clean.length - 1).trim();
  }
  
  // Clean up double spaces
  clean = clean.replace(/\s+/g, ' ').trim();
  
  return clean;
}

function renderRecentlyPlayed() {
  const grid = document.getElementById('recentlyPlayedGrid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  recentlyPlayed.forEach((track, index) => {
    const card = document.createElement('div');
    card.className = `square-music-card ${currentTrack && currentTrack.id === track.id ? 'active-playing' : ''}`;
    card.setAttribute('data-id', track.id);
    
    const cleanedTitle = cleanSongTitle(track.title);
    
    card.innerHTML = `
      <div class="square-art-container">
        <img src="${track.thumbnail}" alt="${decodeHtml(track.title)}" class="square-art-img">
        <button class="square-play-btn"><i class="fa-solid fa-play"></i></button>
      </div>
      <div class="square-metadata">
        <span class="square-title" title="${decodeHtml(track.title)}">${cleanedTitle}</span>
        <span class="square-artist" title="${decodeHtml(track.channelTitle)}">${decodeHtml(track.channelTitle)}</span>
      </div>
    `;
    
    card.addEventListener('click', () => {
      // Load current playlist as recentlyPlayed to enable smooth forward/backward controls
      isSearchQueuePlayback = false; // Reset search-origin queue flag
      trackQueue = [...recentlyPlayed];
      playTrack(track, index);
    });
    
    grid.appendChild(card);
  });
}

function togglePlayPause() {
  if (!isPlayerReady || !currentTrack) return;
  
  const state = youtubePlayer.getPlayerState();
  if (state === YT.PlayerState.PLAYING) {
    youtubePlayer.pauseVideo();
  } else {
    youtubePlayer.playVideo();
  }
}

let recentPlaybackHistoryIds = [];
let fullyPlayedTrackIds = new Set();

function getCleanBaseTitle(title) {
  if (!title) return '';
  let clean = title.toLowerCase().trim();
  
  // Remove common variants and cleanup terms
  const termsToRemove = [
    /\s*[([][^)\]]*(slowed|reverb|slow|reverbed|fade|remix|edit|edited|variant|cover|mashup|8d|bass boosted|lofi mix|lolic|mix)[^)\]]*[)\]]/gi,
    /\s*(slowed\s*\+\s*reverb|slowed|reverb|remix|edit|cover|mashup|8d|bass boosted|lofi mix)/gi,
    /\s*-\s*(slowed|reverb|remix|edit|cover|mashup|8d|bass boosted|lofi mix).*/gi
  ];
  
  termsToRemove.forEach(pattern => {
    clean = clean.replace(pattern, '');
  });
  
  // Clean punctuation and double spaces
  clean = clean.replace(/[^\w\s]/gi, ' ');
  clean = clean.replace(/\s+/g, ' ').trim();
  
  return clean;
}

function isDuplicateOrVariant(trackA, trackB) {
  if (!trackA || !trackB) return false;
  if (trackA.id === trackB.id) return true;
  
  const cleanTitleA = getCleanBaseTitle(trackA.title);
  const cleanTitleB = getCleanBaseTitle(trackB.title);
  
  if (cleanTitleA === cleanTitleB) return true;
  
  if (cleanTitleA.length > 5 && cleanTitleB.length > 5) {
    if (cleanTitleA.includes(cleanTitleB) || cleanTitleB.includes(cleanTitleA)) {
      return true;
    }
  }
  return false;
}

function classifyTrackVibe(track) {
  if (!track) return { type: 'LOFI_CHILL', energy: 3, tempo: 3, mood: 'chill', emotionalFeel: 'relaxed', ambience: 'coffee shop', language: 'english' };
  
  const text = `${track.title} ${track.channelTitle || ''}`.toLowerCase();
  
  // Extract Language continuity metrics
  let language = 'english';
  const malayalamKeywords = ['malayalam', 'manavalan', 'thallumaala', 'hridayam', 'darshana', 'kudukku', 'malare', 'premam', 'kaduva', 'pala palli', 'tovino', 'mohanlal', 'mammootty', 'dulquer', 'nivin', 'vineeth', 'srinivasan', 'hesham', 'shafi', 'shreya ghoshal', 'ks chithra', 'mg sreekumar', 'yesudas', 'k s chithra', 'g gopi sundar', 'gopi sundar', 'sushin syam', 'sushin', 'jakes bejoy', 'dabzee', 'akale', 'shamil'];
  const tamilKeywords = ['tamil', 'anirudh', 'ar rahman', 'rahman', 'yuvan', 'gvp', 'harris jayaraj', 'hiphop tamizha', 'aditya', 'vijay', 'ajith', 'ajith kumar', 'rajini', 'dhanush', 'suriya', 'sid sriram', 'ilayaraja', 'spb', 'anirudh ravichander', 'vidyasagar', 'imman', 'santhosh narayanan', 'sana'];
  const hindiKeywords = ['hindi', 'arijit', 'shreya', 'jubin', 't-series', 'lata mangeshkar', 'kishore', 'rd burman', 'pritam', 'amit trivedi', 'arman malik', 'badshah', 'raftaar', 'nehakakkar', 'neha kakkar', 'tony kakkar', 'vishal mishra', 'mithoon', 'sachin-jigar', 'sachin jigar'];

  if (malayalamKeywords.some(kw => text.includes(kw))) {
    language = 'malayalam';
  } else if (tamilKeywords.some(kw => text.includes(kw))) {
    language = 'tamil';
  } else if (hindiKeywords.some(kw => text.includes(kw))) {
    language = 'hindi';
  }
  
  let vibeInfo = { type: 'WARM_AMBIENT_POP', energy: 5, tempo: 5, mood: 'balanced', emotionalFeel: 'pleasant', ambience: 'balanced indoor', language: language };

  // 1. Electronic Synthwave/Synth Pop
  if (text.includes('synth') || text.includes('drive') || text.includes('midnight') || text.includes('neon') || text.includes('retro') || text.includes('starboy') || text.includes('blinding') || text.includes('weeknd')) {
    vibeInfo = { type: 'NEON_SYNTH', energy: 8, tempo: 7, mood: 'hype', emotionalFeel: 'futuristic', ambience: 'dark electronic', language: language };
  }
  // 2. Romantic Acoustic / Ballads
  else if (text.includes('acoustic') || text.includes('guitar') || text.includes('piano') || text.includes('perfect') || text.includes('sheeran') || text.includes('love') || text.includes('romance') || text.includes('romantic') || text.includes('kanne') || text.includes('kadhal') || text.includes('penne') || text.includes('neeye') || text.includes('arijit') || text.includes('soulful') || text.includes('jhol') || text.includes('dil') || text.includes('khuda') || text.includes('tum')) {
    vibeInfo = { type: 'ACOUSTIC_ROMANCE', energy: 3, tempo: 3, mood: 'romantic', emotionalFeel: 'dreamy', ambience: 'warm intimate', language: language };
  }
  // 3. Soulful Melancholy / Cinematic
  else if (text.includes('sad') || text.includes('lost') || text.includes('echo') || text.includes('melancholy') || text.includes('ocean eyes') || text.includes('billie') || text.includes('faded') || text.includes('cry') || text.includes('alone') || text.includes('dusk') || text.includes('dark')) {
    vibeInfo = { type: 'SOULFUL_MELANCHOLY', energy: 4, tempo: 4, mood: 'melancholic', emotionalFeel: 'emotional', ambience: 'cinematic foggy', language: language };
  }
  // 4. Energetic Pop / Dance Hits
  else if (text.includes('pop') || text.includes('dance') || text.includes('club') || text.includes('party') || text.includes('hits') || text.includes('beat') || text.includes('energy') || text.includes('remix') || text.includes('upbeat')) {
    vibeInfo = { type: 'POP_DANCE', energy: 8, tempo: 8, mood: 'uplifting', emotionalFeel: 'energetic', ambience: 'bright neon', language: language };
  }
  // 5. Ambient / Lofi / Sleep Chill
  else if (text.includes('lofi') || text.includes('lo-fi') || text.includes('chill') || text.includes('relax') || text.includes('ambient') || text.includes('sleep') || text.includes('study') || text.includes('focus') || text.includes('lounge') || text.includes('deep focus')) {
    vibeInfo = { type: 'LOFI_CHILL', energy: 2, tempo: 2, mood: 'chill', emotionalFeel: 'relaxed', ambience: 'rainy coffee shop', language: language };
  }
  // 6. Organic Folk / Regional Acoustic
  else if (text.includes('folk') || text.includes('traditional') || text.includes('regional') || text.includes('coke') || text.includes('studio') || text.includes('annural') || text.includes('maanu')) {
    vibeInfo = { type: 'ORGANIC_INDIE', energy: 5, tempo: 4, mood: 'nostalgic', emotionalFeel: 'uplifting', ambience: 'organic earthy', language: language };
  }

  return vibeInfo;
}

function calculateVibeSimilarityScore(vibeA, vibeB) {
  let score = 100;
  
  // Language alignment: critical prioritization! Same language gets a major boost
  if (vibeA.language === vibeB.language) {
    score += 150;
  } else {
    score -= 100; // Strict cross-language penalty to guarantee linguistic continuity
  }

  // Type congruence
  if (vibeA.type === vibeB.type) {
    score += 50;
  }
  
  // Mood alignment
  if (vibeA.mood === vibeB.mood) {
    score += 30;
  } else {
    // Beautiful transition pathways
    const romanticChill = (vibeA.mood === 'chill' && vibeB.mood === 'romantic') || (vibeA.mood === 'romantic' && vibeB.mood === 'chill');
    const sadChill = (vibeA.mood === 'chill' && vibeB.mood === 'melancholic') || (vibeA.mood === 'melancholic' && vibeB.mood === 'chill');
    const energeticUplift = (vibeA.mood === 'hype' && vibeB.mood === 'uplifting') || (vibeA.mood === 'uplifting' && vibeB.mood === 'hype');
    
    if (romanticChill || sadChill || energeticUplift) {
      score += 20;
    } else {
      score -= 40; // Penalty for mismatching moods
    }
  }
  
  // Energy distance penalty
  const energyDiff = Math.abs(vibeA.energy - vibeB.energy);
  score -= energyDiff * 15;
  
  // Tempo distance penalty
  const tempoDiff = Math.abs(vibeA.tempo - vibeB.tempo);
  score -= tempoDiff * 10;
  
  // Emotional feel alignment
  if (vibeA.emotionalFeel === vibeB.emotionalFeel) {
    score += 15;
  }
  
  // Ambience alignment
  if (vibeA.ambience === vibeB.ambience) {
    score += 10;
  }
  
  return score;
}

function playNextTrack() {
  const now = Date.now();
  if (now - lastSkipTimestamp < 500) {
    console.log('[Playback Engine] Ignoring rapid skip button click to prevent player race condition.');
    return;
  }
  lastSkipTimestamp = now;

  if (!currentTrack) {
    // If no active track, fall back to simple queue advance
    if (trackQueue.length > 0) {
      playTrack(trackQueue[0], 0);
    }
    return;
  }
  
  // Rule: If we are playing from the Liked Songs list, play in ascending (sequential) order, ignoring vibe continuity rules!
  if (trackQueue === likedTrackObjects) {
    console.log('[Melody Playback] Sequential transition active for Liked Songs playlist.');
    let nextIndex = currentTrackIndex + 1;
    if (nextIndex >= trackQueue.length) {
      nextIndex = 0; // Wrap around to the first song in Liked Songs
    }
    if (trackQueue[nextIndex]) {
      playTrack(trackQueue[nextIndex], nextIndex);
    }
    return;
  }

  console.log(`[Vibe Continuum] Analyzing current track: "${currentTrack.title}" to match the next emotional chapter...`);
  const currentVibe = classifyTrackVibe(currentTrack);
  
  // 1. Compile all potential candidate tracks (combining active queue + hand-curated library for infinite vibe matching!)
  let allCandidates = [];
  
  if (trackQueue && trackQueue.length > 0) {
    trackQueue.forEach((track, index) => {
      allCandidates.push({ track, originalQueueIndex: index, source: 'active_queue' });
    });
  }
  
  // Add static library items as fallback pools to guarantee there is ALWAYS a perfect cross-language vibe fit!
  if (HOME_CARDS_MAPPING.recentlyPlayed) {
    HOME_CARDS_MAPPING.recentlyPlayed.forEach(track => {
      if (!allCandidates.some(c => c.track.id === track.id)) {
        allCandidates.push({ track, originalQueueIndex: -1, source: 'library_recents' });
      }
    });
  }
  if (HOME_CARDS_MAPPING.madeForYou) {
    HOME_CARDS_MAPPING.madeForYou.forEach(track => {
      if (!allCandidates.some(c => c.track.id === track.id)) {
        allCandidates.push({ track, originalQueueIndex: -1, source: 'library_curated' });
      }
    });
  }
  if (typeof PREMIUM_FALLBACK_POOL !== 'undefined') {
    PREMIUM_FALLBACK_POOL.forEach(track => {
      if (!allCandidates.some(c => c.track.id === track.id)) {
        allCandidates.push({ track, originalQueueIndex: -1, source: 'library_premium' });
      }
    });
  }
  
  // 2. Filter candidates based on strictly defined criteria (same language, no same track, no duplicate variants, no recent repeats)
  let allowedHistory = [...recentPlaybackHistoryIds];
  let filteredCandidates = [];
  
  // Try filtering with full history block first, and if empty, progressively shrink history block to find candidates
  while (allowedHistory.length >= 0) {
    filteredCandidates = allCandidates.filter(item => {
      const candidate = item.track;
      
      // Rule A: Skip the current track
      if (candidate.id === currentTrack.id) return false;
      
      // Rule B: Skip slowed, reverbed, remix, fade, or edited duplicate variants
      if (isDuplicateOrVariant(currentTrack, candidate)) return false;
      
      // Rule C: Strict same-language continuity! Only transition within the same language unless user manually clicks a different language song!
      const candidateVibe = classifyTrackVibe(candidate);
      if (candidateVibe.language !== currentVibe.language) return false;
      
      // Rule D: Loop protection - block recently played history
      if (allowedHistory.includes(candidate.id)) return false;
      
      // Rule E: Strict word overlap filter to block similar search variations/re-releases (e.g. if current is Jhol, block other Jhol songs)
      const currentClean = getCleanBaseTitle(currentTrack.title);
      const candidateClean = getCleanBaseTitle(candidate.title);
      const currentWords = currentClean.split(' ').filter(w => w.length > 3);
      const hasWordOverlap = currentWords.some(w => candidateClean.includes(w));
      if (hasWordOverlap) {
        console.log(`[Vibe Filter] Excluded word overlap candidate: "${candidate.title}"`);
        return false;
      }
      
      return true;
    });
    
    if (filteredCandidates.length > 0 || allowedHistory.length === 0) {
      break;
    }
    allowedHistory.pop(); // Progressively forget oldest plays to solve empty pool scenarios!
  }
  
  // Absolute Last Resort Fallback: If no same-language candidates found at all, relax language restriction
  if (filteredCandidates.length === 0) {
    console.log("[Vibe Continuum] No same-language candidates found. Relaxing language constraint.");
    allowedHistory = [...recentPlaybackHistoryIds];
    while (allowedHistory.length >= 0) {
      filteredCandidates = allCandidates.filter(item => {
        const candidate = item.track;
        if (candidate.id === currentTrack.id) return false;
        if (isDuplicateOrVariant(currentTrack, candidate)) return false;
        if (allowedHistory.includes(candidate.id)) return false;
        
        const currentClean = getCleanBaseTitle(currentTrack.title);
        const candidateClean = getCleanBaseTitle(candidate.title);
        const currentWords = currentClean.split(' ').filter(w => w.length > 3);
        const hasWordOverlap = currentWords.some(w => candidateClean.includes(w));
        if (hasWordOverlap) return false;
        
        return true;
      });
      if (filteredCandidates.length > 0 || allowedHistory.length === 0) {
        break;
      }
      allowedHistory.pop();
    }
  }
  
  // 3. Score and rank remaining candidates
  const scoredCandidates = filteredCandidates.map(item => {
    const candidate = item.track;
    const candidateVibe = classifyTrackVibe(candidate);
    const score = calculateVibeSimilarityScore(currentVibe, candidateVibe);
    return { ...item, score, vibe: candidateVibe };
  });
  
  // Sort descending by highest vibe continuity score
  scoredCandidates.sort((a, b) => b.score - a.score);
  
  if (scoredCandidates.length > 0) {
    // Pick randomly from the top scored candidates to ensure high variety in the same vibe
    const bestScore = scoredCandidates[0].score;
    const highMatchThreshold = bestScore - 15;
    const excellentMatches = scoredCandidates.filter(c => c.score >= highMatchThreshold);
    const selectedItem = excellentMatches[Math.floor(Math.random() * excellentMatches.length)];
    
    console.log(`[Vibe Continuum] Perfect Transition Selected! Match Score: ${selectedItem.score}/335`);
    console.log(`- Current: "${currentTrack.title}" (${currentVibe.type} / Mood: ${currentVibe.mood} / Lang: ${currentVibe.language})`);
    console.log(`- Next Match: "${selectedItem.track.title}" (${selectedItem.vibe.type} / Mood: ${selectedItem.vibe.mood} / Lang: ${selectedItem.vibe.language})`);
    
    // Always transition the queue to the recommended list to avoid sequential leakage!
    console.log('[Playback Engine] Restructuring queue around chosen vibe transition.');
    trackQueue = [
      selectedItem.track,
      ...(PREMIUM_FALLBACK_POOL || []),
      ...(HOME_CARDS_MAPPING.madeForYou || [])
    ].filter((t, idx, self) => self.findIndex(x => x.id === t.id) === idx);
    
    isSearchQueuePlayback = false; // Reset search mode since we are on curated recommendations!
    playTrack(selectedItem.track, 0);
  } else {
    // If absolutely no matches are found, pull a random song from premium pool!
    console.log("[Vibe Continuum] No candidates. Playing random recommendation fallback.");
    const fallbackPool = [
      ...(PREMIUM_FALLBACK_POOL || []),
      ...(HOME_CARDS_MAPPING.madeForYou || [])
    ];
    const freshCandidates = fallbackPool.filter(t => t.id !== currentTrack.id && !isDuplicateOrVariant(currentTrack, t));
    const fallbackTrack = freshCandidates.length > 0 ? freshCandidates[Math.floor(Math.random() * freshCandidates.length)] : fallbackPool[0];
    
    trackQueue = [
      fallbackTrack,
      ...(PREMIUM_FALLBACK_POOL || []),
      ...(HOME_CARDS_MAPPING.madeForYou || [])
    ].filter((t, idx, self) => self.findIndex(x => x.id === t.id) === idx);
    
    isSearchQueuePlayback = false;
    playTrack(fallbackTrack, 0);
  }
}

function playPreviousTrack() {
  if (trackQueue.length === 0) return;
  
  let prevIndex = currentTrackIndex - 1;
  
  if (youtubePlayer && youtubePlayer.getCurrentTime() > 5) {
    youtubePlayer.seekTo(0, true);
    return;
  }
  
  if (prevIndex < 0) {
    prevIndex = trackQueue.length - 1;
  }
  
  if (trackQueue[prevIndex]) {
    playTrack(trackQueue[prevIndex], prevIndex);
  }
}

function syncLikedState(trackId) {
  const isLiked = likedTracks.has(trackId);
  
  if (isLiked) {
    dom.btnHeartTrack.classList.add('liked');
    dom.btnHeartTrack.innerHTML = '<i class="fa-solid fa-heart"></i>';
    
    dom.heroHeart.classList.add('liked');
    dom.heroHeart.innerHTML = '<i class="fa-solid fa-heart"></i>';
  } else {
    dom.btnHeartTrack.classList.remove('liked');
    dom.btnHeartTrack.innerHTML = '<i class="fa-regular fa-heart"></i>';
    
    dom.heroHeart.classList.remove('liked');
    dom.heroHeart.innerHTML = '<i class="fa-regular fa-heart"></i>';
  }
}

function toggleLikeTrack() {
  if (!currentTrack) return;
  const trackId = currentTrack.id;
  
  if (likedTracks.has(trackId)) {
    likedTracks.delete(trackId);
    likedTrackObjects = likedTrackObjects.filter(item => item.id !== trackId);
    showToast('Removed from your Library');
  } else {
    likedTracks.add(trackId);
    // Push entire metadata payload
    likedTrackObjects.push({
      id: currentTrack.id,
      title: currentTrack.title,
      channelTitle: currentTrack.channelTitle,
      thumbnail: currentTrack.thumbnail
    });
    showToast('Added to your Library');
  }
  
  saveLikedTracksToCache();
  syncLikedState(trackId);
  updateGridActiveStates();
}

/* ==========================================================================
   Secondary Panel Utilities & Seekers
   ========================================================================== */

function startProgressTracking() {
  stopProgressTracking();
  progressUpdateInterval = setInterval(() => {
    if (!youtubePlayer || !isPlayerReady) return;
    
    const current = youtubePlayer.getCurrentTime() || 0;
    const total = youtubePlayer.getDuration() || 0;
    
    // Telemetry listen seconds calculation
    const currentSecond = Math.floor(current);
    if (currentSecond !== telemetryLastCheckedSecond && youtubePlayer.getPlayerState() === YT.PlayerState.PLAYING) {
      telemetryListenSeconds += 1;
      telemetryLastCheckedSecond = currentSecond;

      // Heartbeat pulse every 15 seconds of active playback
      if (telemetryListenSeconds % 15 === 0 && telemetryActiveTrack) {
        sendTelemetryFeedback(telemetryActiveTrack.id, 'heartbeat', 15);
      }
    }

    // Complete criteria: listened for >= 45 seconds or reached > 85% track duration
    if (total > 0 && !telemetrySentCompletion && telemetryActiveTrack) {
      if (telemetryListenSeconds >= 45 || current >= total * 0.85) {
        telemetrySentCompletion = true;
        sendTelemetryFeedback(telemetryActiveTrack.id, 'complete');
        console.log(`[Telemetry] Dispatched complete boost for track: "${telemetryActiveTrack.title}"`);
      }
    }
    
    dom.timeCurrent.innerText = formatTime(current);
    dom.timeTotal.innerText = formatTime(total);
    
    dom.heroTimeCurrent.innerText = formatTime(current);
    dom.heroTimeTotal.innerText = formatTime(total);
    
    if (total > 0) {
      const percentage = (current / total) * 100;
      
      dom.progressBarFill.style.width = `${percentage}%`;
      dom.progressBarHandle.style.left = `${percentage}%`;
      
      dom.heroTimelineFill.style.width = `${percentage}%`;
      dom.heroTimelineHandle.style.left = `${percentage}%`;
    }
  }, 350);
}

function stopProgressTracking() {
  if (progressUpdateInterval) {
    clearInterval(progressUpdateInterval);
    progressUpdateInterval = null;
  }
}

function setupSeekers() {
  const seekToPosition = (e, container, fillEl, handleEl) => {
    if (!youtubePlayer || !isPlayerReady) return;
    const total = youtubePlayer.getDuration() || 0;
    if (total === 0) return;
    
    const rect = container.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    
    fillEl.style.width = `${percentage * 100}%`;
    handleEl.style.left = `${percentage * 100}%`;
    
    youtubePlayer.seekTo(percentage * total, true);
  };
  
  dom.progressBarContainer.addEventListener('click', (e) => {
    seekToPosition(e, dom.progressBarContainer, dom.progressBarFill, dom.progressBarHandle);
  });
  
  dom.heroTimelineContainer.addEventListener('click', (e) => {
    seekToPosition(e, dom.heroTimelineContainer, dom.heroTimelineFill, dom.heroTimelineHandle);
  });
}

function setupVolumeController() {
  const changeVolume = (e) => {
    if (!youtubePlayer || !isPlayerReady) return;
    
    const rect = dom.volumeSliderContainer.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const volume = Math.round(percentage * 100);
    
    youtubePlayer.setVolume(volume);
    updateVolumeUI(volume);
  };
  
  dom.volumeSliderContainer.addEventListener('click', changeVolume);
}

function updateVolumeUI(volume) {
  dom.volumeFill.style.width = `${volume}%`;
  dom.volumeHandle.style.left = `${volume}%`;
  
  if (volume === 0) {
    dom.volumeIcon.className = 'fa-solid fa-volume-xmark';
  } else if (volume < 30) {
    dom.volumeIcon.className = 'fa-solid fa-volume-off';
  } else if (volume < 70) {
    dom.volumeIcon.className = 'fa-solid fa-volume-low';
  } else {
    dom.volumeIcon.className = 'fa-solid fa-volume-high';
  }
}

function toggleMute() {
  if (!youtubePlayer || !isPlayerReady) return;
  
  if (youtubePlayer.isMuted()) {
    youtubePlayer.unMute();
    const lastVol = youtubePlayer.getVolume() || 80;
    updateVolumeUI(lastVol);
  } else {
    youtubePlayer.mute();
    updateVolumeUI(0);
  }
}

/* ==========================================================================
   Backend Core Service & Search Routing Integration
   ========================================================================== */

async function triggerSearch(query, isSilentHomeLoad = false) {
  if (!query || query.trim() === '') return;
  
  lastSearchedQuery = query;
  console.log(`[Search Engine] Querying backend: "${query}"`);
  
  dom.searchInput.value = isSilentHomeLoad ? '' : query;
  dom.btnClearSearch.style.display = isSilentHomeLoad ? 'none' : 'flex';
  
  dom.loadingShimmer.style.display = 'grid';
  dom.songsGrid.style.display = 'none';
  dom.emptyState.style.display = 'none';
  dom.errorState.style.display = 'none';
  
  if (!isSilentHomeLoad) {
    // Hide all views, display search results grid
    switchActiveViewPanel('searchResultsView');
    dom.searchResultsTitle.innerText = 'Search Results';
    dom.searchIndicator.style.display = 'block';
    dom.activeQueryText.innerText = query;
  } else {
    switchActiveViewPanel('homeLandingView');
  }

  try {
    const response = await fetch(getApiUrl(`/api/search?q=${encodeURIComponent(query)}${isMockModeActive ? '&forceMock=true' : ''}`));
    
    if (!response.ok) {
      throw new Error(`Service connection error (Status: ${response.status})`);
    }
    
    const tracks = await response.json();
    dom.loadingShimmer.style.display = 'none';
    
    if (tracks.length === 0) {
      if (!isSilentHomeLoad) {
        dom.emptyState.style.display = 'flex';
      }
      return;
    }
    
    trackQueue = tracks;
    
    if (!isSilentHomeLoad) {
      dom.songsGrid.style.display = 'grid';
      renderSongsGrid(tracks);
    }
  } catch (err) {
    console.error('[Search Engine] Fetch Error:', err);
    dom.loadingShimmer.style.display = 'none';
    
    if (!isSilentHomeLoad) {
      dom.errorState.style.display = 'flex';
      dom.errorDetails.innerText = `Fetch failed: ${err.message}. Ensure express node backend is running on port 3000.`;
    }
  }
}

function renderSongsGrid(tracks) {
  dom.songsGrid.innerHTML = '';
  
  tracks.forEach((track, index) => {
    const card = document.createElement('div');
    card.className = `song-card ${currentTrack && currentTrack.id === track.id ? 'active-playing' : ''}`;
    card.setAttribute('data-id', track.id);
    
    card.innerHTML = `
      <div class="card-img-wrapper">
        <img class="card-img" src="${track.thumbnail}" alt="${track.title}" loading="lazy">
        <button class="card-play-btn" aria-label="Play">
          <i class="fa-solid fa-play"></i>
        </button>
      </div>
      <div class="card-details">
        <span class="card-title" title="${decodeHtml(track.title)}">${decodeHtml(track.title)}</span>
        <span class="card-channel" title="${decodeHtml(track.channelTitle)}">${decodeHtml(track.channelTitle)}</span>
      </div>
    `;
    
    card.addEventListener('click', () => {
      isSearchQueuePlayback = true; // Flag that this track originates from search results queue
      playTrack(track, index);
    });
    
    dom.songsGrid.appendChild(card);
  });
}

function updateGridActiveStates() {
  // Sync Search results grid cards
  const cards = document.querySelectorAll('.song-card');
  cards.forEach(card => {
    const trackId = card.getAttribute('data-id');
    const playBtn = card.querySelector('.card-play-btn');
    
    if (currentTrack && trackId === currentTrack.id) {
      card.classList.add('active-playing');
      if (playBtn) {
        if (youtubePlayer && youtubePlayer.getPlayerState() === YT.PlayerState.PLAYING) {
          playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        } else {
          playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        }
      }
    } else {
      card.classList.remove('active-playing');
      if (playBtn) playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    }
  });
  
  // Sync Home square cards
  const squareCards = document.querySelectorAll('.square-music-card');
  squareCards.forEach(card => {
    const cardId = card.getAttribute('data-id');
    const cardIdx = card.getAttribute('data-card-index');
    const playIcon = card.querySelector('.square-play-btn i');
    let isCurrent = false;
    
    if (cardId !== null) {
      isCurrent = (currentTrack && cardId === currentTrack.id);
    } else if (cardIdx !== null) {
      const idx = parseInt(cardIdx);
      const mappedTrack = HOME_CARDS_MAPPING.recentlyPlayed[idx];
      isCurrent = (currentTrack && mappedTrack && mappedTrack.id === currentTrack.id);
    }
    
    if (isCurrent) {
      card.classList.add('active-playing');
      if (playIcon) {
        if (youtubePlayer && youtubePlayer.getPlayerState() === YT.PlayerState.PLAYING) {
          playIcon.className = 'fa-solid fa-pause';
        } else {
          playIcon.className = 'fa-solid fa-play';
        }
      }
    } else {
      card.classList.remove('active-playing');
      if (playIcon) playIcon.className = 'fa-solid fa-play';
    }
  });

  // Sync Home horizontal rectangular cards
  const rectCards = document.querySelectorAll('.rect-music-card');
  rectCards.forEach(card => {
    const rectIdx = card.getAttribute('data-rect-index');
    if (rectIdx !== null) {
      const idx = parseInt(rectIdx);
      const mappedTrack = HOME_CARDS_MAPPING.madeForYou[idx];
      
      if (currentTrack && mappedTrack && mappedTrack.id === currentTrack.id) {
        card.classList.add('active-playing');
      } else {
        card.classList.remove('active-playing');
      }
    }
  });

  // Sync Liked Songs list table rows
  const tableRows = document.querySelectorAll('.table-row');
  tableRows.forEach(row => {
    const trackId = row.getAttribute('data-id');
    const playIcon = row.querySelector('.row-play-btn i');
    
    if (currentTrack && trackId === currentTrack.id) {
      row.classList.add('active-playing');
      if (playIcon) {
        if (youtubePlayer && youtubePlayer.getPlayerState() === YT.PlayerState.PLAYING) {
          playIcon.className = 'fa-solid fa-pause';
        } else {
          playIcon.className = 'fa-solid fa-play';
        }
      }
    } else {
      row.classList.remove('active-playing');
      if (playIcon) playIcon.className = 'fa-solid fa-play';
    }
  });
}

/* ==========================================================================
   Sidebar View-Switch Routing Engine
   ========================================================================== */

function switchActiveViewPanel(viewId) {
  // Hide all panels
  const panels = [
    dom.homeLandingView,
    dom.searchResultsView,
    dom.libraryView,
    dom.playlistsView,
    dom.likedSongsView,
    dom.artistsView,
    dom.podcastsView,
    document.getElementById('adminDashboardView')
  ];
  
  panels.forEach(p => {
    if (p) p.style.display = 'none';
  });
  
  // Show requested panel
  const target = dom[viewId] || document.getElementById(viewId);
  if (target) {
    target.style.display = 'block';
  }
  
  // Synchronize sidebar button highlight states
  syncSidebarActiveHighlights(viewId);

  // Invoke specialized render engines per view
  if (viewId === 'likedSongsView') {
    renderLikedSongsList();
  } else if (viewId === 'playlistsView') {
    renderPlaylists();
  } else if (viewId === 'libraryView') {
    renderLibraryDashboard();
  } else if (viewId === 'artistsView') {
    renderArtists();
  }
}

function syncSidebarActiveHighlights(viewId) {
  const sidebarButtons = [
    { view: 'homeLandingView', btn: dom.btnHome },
    { view: 'searchResultsView', btn: dom.btnSearchFocus },
    { view: 'libraryView', btn: dom.btnYourLibrary },
    { view: 'playlistsView', btn: dom.btnPlaylists },
    { view: 'likedSongsView', btn: dom.btnLikedSongs },
    { view: 'artistsView', btn: dom.btnArtists },
    { view: 'podcastsView', btn: dom.btnPodcasts }
  ];
  
  sidebarButtons.forEach(item => {
    if (item.btn) {
      if (item.view === viewId) {
        item.btn.classList.add('active');
      } else {
        item.btn.classList.remove('active');
      }
    }
  });
}

/* ==========================================================================
   Specialized View Rendering Modules
   ========================================================================== */

// --- 1. LIKED SONGS LAYOUT ENGINE ---
function renderLikedSongsList() {
  dom.likedSongsListContainer.innerHTML = '';
  
  if (likedTrackObjects.length === 0) {
    dom.likedSongsEmptyState.style.display = 'flex';
    document.querySelector('.songs-table').style.display = 'none';
    return;
  }
  
  dom.likedSongsEmptyState.style.display = 'none';
  document.querySelector('.songs-table').style.display = 'table';
  
  likedTrackObjects.forEach((track, index) => {
    const row = document.createElement('tr');
    row.className = `table-row ${currentTrack && currentTrack.id === track.id ? 'active-playing' : ''}`;
    row.setAttribute('data-id', track.id);
    
    row.innerHTML = `
      <td class="col-idx">${index + 1}</td>
      <td class="col-play">
        <button class="row-play-btn" aria-label="Play Track">
          <i class="fa-solid ${currentTrack && currentTrack.id === track.id && youtubePlayer && youtubePlayer.getPlayerState() === YT.PlayerState.PLAYING ? 'fa-pause' : 'fa-play'}"></i>
        </button>
      </td>
      <td>
        <div class="col-track">
          <img class="row-art" src="${track.thumbnail}" alt="${track.title}" loading="lazy">
          <div class="row-metadata">
            <span class="row-title" title="${decodeHtml(track.title)}">${decodeHtml(track.title)}</span>
            <span class="row-artist" title="${decodeHtml(track.channelTitle)}">${decodeHtml(track.channelTitle)}</span>
          </div>
        </div>
      </td>
      <td>
        <span style="color: var(--text-muted); font-weight: 500;">Melody Library</span>
      </td>
      <td style="text-align: right; padding-right: 30px;">
        <button class="row-heart-btn" aria-label="Unlike Track">
          <i class="fa-solid fa-heart"></i>
        </button>
      </td>
    `;
    
    // Core click plays the row
    row.addEventListener('click', (e) => {
      // Ignore clicks targeting the unlike button
      if (e.target.closest('.row-heart-btn')) return;
      
      // Load liked list as playback queue so Next/Prev skips within likes!
      isSearchQueuePlayback = false; // Reset search-origin queue flag
      trackQueue = likedTrackObjects;
      playTrack(track, index);
    });
    
    // Unlike button handles premium slide-out trigger
    const unlikeBtn = row.querySelector('.row-heart-btn');
    unlikeBtn.addEventListener('click', () => {
      row.classList.add('removing-row');
      
      setTimeout(() => {
        likedTracks.delete(track.id);
        likedTrackObjects = likedTrackObjects.filter(item => item.id !== track.id);
        saveLikedTracksToCache();
        
        // Sync interfaces
        syncLikedState(currentTrack ? currentTrack.id : '');
        updateGridActiveStates();
        
        // Reload list view
        renderLikedSongsList();
        
        showToast('Removed from Liked Songs');
      }, 320);
    });
    
    dom.likedSongsListContainer.appendChild(row);
  });
}

// --- 2. DYNAMIC PLAYLISTS ENGINE ---
function renderPlaylists() {
  // Clear everything except the static dashed "Create Playlist" card (first child)
  const grid = dom.playlistsGrid;
  const staticCreateCard = dom.btnCreatePlaylist;
  
  grid.innerHTML = '';
  grid.appendChild(staticCreateCard);
  
  // 1. Render user custom creations
  customPlaylists.forEach(playlist => {
    grid.appendChild(createPlaylistCardDOM(playlist, true));
  });
}

function createPlaylistCardDOM(playlist, isCustom = false) {
  const card = document.createElement('div');
  card.className = 'square-music-card';
  card.setAttribute('data-playlist-query', playlist.query);
  
  card.innerHTML = `
    <div class="square-art-container">
      <img src="${playlist.thumbnail}" alt="${playlist.title}" class="square-art-img">
      <button class="square-play-btn"><i class="fa-solid fa-play"></i></button>
    </div>
    <div class="square-metadata">
      <span class="square-title">${playlist.title}</span>
      <span class="square-artist">${playlist.desc}</span>
    </div>
    ${isCustom ? `
      <button class="card-delete-btn" title="Delete Playlist" aria-label="Delete">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    ` : ''}
  `;
  
  card.addEventListener('click', () => {
    showToast(`Loading mixtape: ${playlist.title}`);
    triggerSearch(playlist.query);
  });

  if (isCustom) {
    const delBtn = card.querySelector('.card-delete-btn');
    if (delBtn) {
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Stop playing/searching
        card.style.transform = 'scale(0.8) translateY(10px)';
        card.style.opacity = '0';
        card.style.transition = 'all 0.28s ease';
        setTimeout(() => {
          customPlaylists = customPlaylists.filter(p => p.title !== playlist.title);
          savePlaylistsToCache();
          renderPlaylists();
          showToast(`Deleted playlist "${playlist.title}"`);
        }, 280);
      });
    }
  }
  
  return card;
}

function triggerCreatePlaylistPrompt() {
  showCustomInputPrompt({
    title: 'Create Playlist',
    subtitle: 'Enter details for your custom playlist:',
    placeholder1: 'Playlist Name (e.g. Study Beats)...',
    placeholder2: 'Short Description (optional)...',
    showSecondInput: true,
    confirmText: 'Create',
    callback: (title, desc) => {
      if (!title || title.trim() === '') return;
      const finalDesc = desc.trim() || 'Created by Arjun Dev';
      
      const newPlaylist = {
        title: title.trim(),
        query: title.trim(),
        desc: finalDesc,
        thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80' // default playlist cover
      };
      
      customPlaylists.push(newPlaylist);
      savePlaylistsToCache();
      renderPlaylists();
      
      showToast(`Playlist "${newPlaylist.title}" created successfully!`);
    }
  });
}

// --- 3. LIBRARY SUMMARY DASHBOARD ENGINE ---
function renderLibraryDashboard() {
  updateLibrarySummaryCounters();
}

// --- 4. DYNAMIC ARTISTS ENGINE ---
function renderArtists() {
  const grid = dom.artistsGrid;
  const staticAddCard = dom.btnAddArtist;
  
  if (!grid || !staticAddCard) return;
  
  grid.innerHTML = '';
  grid.appendChild(staticAddCard);
  
  // Render user custom followed artists
  customArtists.forEach(artist => {
    grid.appendChild(createArtistCardDOM(artist, false));
  });
}

function createArtistCardDOM(artist, isVerified = false) {
  const card = document.createElement('div');
  card.className = 'artist-circle-card';
  card.setAttribute('data-artist-query', artist.query || artist.name);
  
  card.innerHTML = `
    <div class="artist-portrait-wrapper">
      <img src="${artist.thumbnail}" alt="${artist.name}" class="artist-portrait" loading="lazy">
    </div>
    <div class="artist-title-row">
      <span class="artist-name">${artist.name}</span>
      ${!isVerified ? `
        <span style="color: var(--accent-pink); font-size: 11px;" title="Favorite Artist">
          <i class="fa-solid fa-heart"></i>
        </span>
      ` : ''}
    </div>
    <span class="artist-desc">${artist.listeners}</span>
    ${!isVerified ? `
      <button class="card-delete-btn" title="Remove Artist" aria-label="Delete">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    ` : ''}
  `;
  
  card.addEventListener('click', () => {
    showToast(`Loading profile: ${artist.name}`);
    triggerSearch(artist.query || artist.name);
  });

  if (!isVerified) {
    const delBtn = card.querySelector('.card-delete-btn');
    if (delBtn) {
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Stop playing/searching
        card.style.transform = 'scale(0.8) translateY(10px)';
        card.style.opacity = '0';
        card.style.transition = 'all 0.28s ease';
        setTimeout(() => {
          customArtists = customArtists.filter(a => a.name !== artist.name);
          saveArtistsToCache();
          renderArtists();
          showToast(`Removed artist "${artist.name}"`);
        }, 280);
      });
    }
  }
  
  return card;
}

/**
 * Triggers a beautiful custom modal prompt replacing native browser prompts.
 * @param {Object} options { title, subtitle, placeholder1, placeholder2, showSecondInput, confirmText, callback }
 */
function showCustomInputPrompt({ title, subtitle, placeholder1, placeholder2 = '', showSecondInput = false, confirmText = 'Create', callback }) {
  const modal = document.getElementById('customInputModal');
  const modalTitle = document.getElementById('customModalTitle');
  const modalSubtitle = document.getElementById('customModalSubtitle');
  const input1 = document.getElementById('customModalInput');
  const input2 = document.getElementById('customModalInput2');
  const input2Wrapper = document.getElementById('customModalInput2Wrapper');
  const confirmBtn = document.getElementById('btnCustomModalConfirm');
  const cancelBtn = document.getElementById('btnCustomModalCancel');
  
  // Reset values
  input1.value = '';
  input2.value = '';
  
  // Set content
  modalTitle.innerText = title;
  modalSubtitle.innerText = subtitle;
  input1.placeholder = placeholder1;
  confirmBtn.innerText = confirmText;
  
  // Configure search icon based on title
  const icon = document.getElementById('modalSearchIcon');
  if (title.toLowerCase().includes('artist')) {
    icon.className = 'fa-solid fa-user-music modal-search-icon';
    icon.innerHTML = '';
  } else {
    icon.className = 'fa-solid fa-compact-disc modal-search-icon';
    icon.innerHTML = '';
  }

  if (showSecondInput) {
    input2Wrapper.style.display = 'block';
    input2.placeholder = placeholder2;
  } else {
    input2Wrapper.style.display = 'none';
  }
  
  // Show modal with animation
  modal.style.display = 'flex';
  setTimeout(() => {
    modal.classList.add('active');
    input1.focus();
  }, 10);
  
  // Cleanup previous listeners
  const newConfirmBtn = confirmBtn.cloneNode(true);
  const newCancelBtn = cancelBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
  cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
  
  const closeModal = () => {
    modal.classList.remove('active');
    setTimeout(() => {
      modal.style.display = 'none';
    }, 250);
  };
  
  newCancelBtn.addEventListener('click', closeModal);
  
  // Keyboard enter trigger
  const handleEnterKey = (e) => {
    if (e.key === 'Enter') {
      newConfirmBtn.click();
    }
  };
  input1.addEventListener('keydown', handleEnterKey);
  input2.addEventListener('keydown', handleEnterKey);
  
  newConfirmBtn.addEventListener('click', () => {
    const val1 = input1.value;
    const val2 = input2.value;
    closeModal();
    
    // Remove listeners
    input1.removeEventListener('keydown', handleEnterKey);
    input2.removeEventListener('keydown', handleEnterKey);
    
    if (callback) {
      callback(val1, val2);
    }
  });
}

function triggerAddArtistPrompt() {
  showCustomInputPrompt({
    title: 'Add Artist',
    subtitle: 'Follow your favorite artist by searching them:',
    placeholder1: 'Artist Name...',
    placeholder2: 'Monthly Listeners (optional, e.g. 15M)...',
    showSecondInput: true,
    confirmText: 'Follow',
    callback: async (name, listeners) => {
      if (!name || name.trim() === '') return;
      const finalListeners = listeners.trim() || 'Custom Followed Artist';
      
      showToast(`Searching profile picture for "${name.trim()}"...`);
      
      let thumbnail = '';
      try {
        const res = await fetch(getApiUrl(`/api/search/artist-image?name=${encodeURIComponent(name.trim())}`));
        if (res.ok) {
          const data = await res.json();
          if (data && data.thumbnail) {
            thumbnail = data.thumbnail;
          }
        }
      } catch (err) {
        console.error('[Add Artist] Failed to load live artist portrait:', err);
      }
      
      if (!thumbnail) {
        const randomPortraits = [
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
          'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
          'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80'
        ];
        thumbnail = randomPortraits[Math.floor(Math.random() * randomPortraits.length)];
      }
      
      const formattedListeners = (finalListeners.includes('Listeners') || finalListeners.includes('Artist') || finalListeners.includes('Followed')) ? finalListeners : `${finalListeners} Monthly Listeners`;
      
      const newArtist = {
        name: name.trim(),
        query: name.trim(),
        listeners: formattedListeners,
        thumbnail: thumbnail
      };
      
      customArtists.push(newArtist);
      saveArtistsToCache();
      renderArtists();
      
      showToast(`Added ${newArtist.name} to your Favorite Artists!`);
    }
  });
}

/* ==========================================================================
   Interaction Routing & Global Attachments
   ========================================================================== */

function setupControlListeners() {
  // --- Bottom Persistent Player Controls ---
  dom.btnPlayPause.addEventListener('click', togglePlayPause);
  dom.btnNext.addEventListener('click', playNextTrack);
  dom.btnPrev.addEventListener('click', playPreviousTrack);
  dom.btnMuteToggle.addEventListener('click', toggleMute);
  
  dom.btnShuffle.addEventListener('click', () => {
    shuffleActive = !shuffleActive;
    dom.btnShuffle.classList.toggle('active', shuffleActive);
    dom.heroShuffle.classList.toggle('active', shuffleActive);
  });
  
  dom.btnRepeat.addEventListener('click', () => {
    repeatActive = !repeatActive;
    dom.btnRepeat.classList.toggle('active', repeatActive);
    dom.heroRepeat.classList.toggle('active', repeatActive);
  });
  
  dom.btnHeartTrack.addEventListener('click', toggleLikeTrack);
  
  // --- Top Hero Player Controls (Redesigned) ---
  dom.heroPlayPause.addEventListener('click', togglePlayPause);
  dom.heroNext.addEventListener('click', playNextTrack);
  dom.heroPrev.addEventListener('click', playPreviousTrack);
  
  dom.heroShuffle.addEventListener('click', () => {
    shuffleActive = !shuffleActive;
    dom.btnShuffle.classList.toggle('active', shuffleActive);
    dom.heroShuffle.classList.toggle('active', shuffleActive);
  });
  
  dom.heroRepeat.addEventListener('click', () => {
    repeatActive = !repeatActive;
    dom.btnRepeat.classList.toggle('active', repeatActive);
    dom.heroRepeat.classList.toggle('active', repeatActive);
  });
  
  dom.heroHeart.addEventListener('click', toggleLikeTrack);

  setupSeekers();
  setupVolumeController();
}

/* ==========================================================================
   Real-Time Search Suggestions Dropdown Engine
   ========================================================================== */

let activeSuggestionIndex = -1;
let currentSuggestionMatches = [];

const SEARCH_CANDIDATES = [
  { text: 'Malayalam Hits', category: 'Genre', query: 'malayalam' },
  { text: 'Malayalam Lofi', category: 'Genre', query: 'malayalam lofi' },
  { text: 'Jhol - Coke Studio (Maanu & Annural Khalid)', category: 'Song', query: 'Jhol Coke Studio' },
  { text: 'Jhol', category: 'Song', query: 'Jhol Maanu Annural Khalid' },
  { text: 'Maanu', category: 'Artist', query: 'Maanu' },
  { text: 'Annural Khalid', category: 'Artist', query: 'Annural Khalid' },
  { text: 'Coke Studio Pakistan', category: 'Artist', query: 'Coke Studio' },
  { text: 'Midnight Drive', category: 'Song', query: 'Midnight Drive' },
  { text: 'Solar Flare', category: 'Song', query: 'Solar Flare' },
  { text: 'Lost in Echoes', category: 'Song', query: 'Lost in Echoes' },
  { text: 'Chillhop Lounge', category: 'Playlist', query: 'Chillhop Lounge' },
  { text: 'Ocean Eyes', category: 'Song', query: 'Ocean Eyes' },
  { text: 'Discover Weekly', category: 'Playlist', query: 'Discover Weekly' },
  { text: 'Deep Focus', category: 'Playlist', query: 'Deep Focus' },
  { text: 'Chill Hits', category: 'Playlist', query: 'Chill Hits' },
  { text: 'Morning Acoustic', category: 'Playlist', query: 'Morning Acoustic' },
  { text: 'Eclipse Twins', category: 'Artist', query: 'Eclipse Twins' },
  { text: 'Aurora', category: 'Artist', query: 'Aurora' },
  { text: 'The Nightfall', category: 'Artist', query: 'The Nightfall' },
  { text: 'Alan Walker', category: 'Artist', query: 'Alan Walker' },
  { text: 'A.R. Rahman', category: 'Artist', query: 'A.R. Rahman' },
  { text: 'Hip Hop Tamizha', category: 'Artist', query: 'Hip Hop Tamizha' },
  { text: 'Retro Synthwave', category: 'Playlist', query: 'Midnight Drive' },
  { text: 'Vibe City', category: 'Playlist', query: 'Alan Walker' },
  { text: 'Coding Focus', category: 'Playlist', query: 'Coding Focus' }
];

/**
 * Calculates a typo-tolerant matching score between a target string and a search pattern.
 * Supports exact matches, substring matching, overlap scores, and character-by-character sequencing.
 */
function computeFuzzyMatchScore(target, pattern) {
  const str = target.toLowerCase().trim();
  const pat = pattern.toLowerCase().trim();
  
  if (str === pat) return 100; // Perfect match
  if (str.startsWith(pat)) return 90 + pat.length; // Strong prefix match
  if (str.includes(pat)) return 75 + (pat.length / str.length) * 10; // Medium substring match
  
  // Fuzzy character sequencing match
  let patIdx = 0;
  let strIdx = 0;
  let matches = 0;
  let consecutive = 0;
  let score = 0;
  
  while (patIdx < pat.length && strIdx < str.length) {
    if (pat[patIdx] === str[strIdx]) {
      patIdx++;
      matches++;
      consecutive++;
      score += 5 + consecutive * 2; // reward consecutive character streams
    } else {
      consecutive = 0;
    }
    strIdx++;
  }
  
  // If we matched the entire query sequentially or a substantial subset with low distance
  if (matches === pat.length) {
    return score + 10;
  }
  
  // Return sequence score if overlap is significant
  if (pat.length > 2 && matches >= pat.length - 1) {
    return score;
  }
  
  return 0; // No valid match
}

function handleSearchSuggestions() {
  const suggestionsBox = document.getElementById('searchSuggestions');
  const input = dom.searchInput;
  if (!suggestionsBox || !input) return;
  
  const rawQuery = input.value;
  const query = rawQuery.trim().toLowerCase();
  
  suggestionsBox.innerHTML = '';
  activeSuggestionIndex = -1;
  currentSuggestionMatches = [];

  // --- CASE A: EMPTY QUERY INPUT (Spotify/Instagram style discovery hub) ---
  if (query.length === 0) {
    // 1. Generate Recents (up to 3 last played items)
    const recents = [];
    recentlyPlayed.slice(0, 3).forEach(track => {
      recents.push({
        text: track.title,
        category: 'Recent',
        query: track.title,
        subtext: track.channelTitle
      });
    });
    
    // 2. Curate Trending suggestions
    const trending = [
      { text: 'Jhol - Coke Studio Maanu', category: 'Trending', query: 'Jhol Coke Studio' },
      { text: 'Hanan Shaah - New Release', category: 'Trending', query: 'Hanan Shaah' },
      { text: 'Arijit Singh Soulful Hits', category: 'Trending', query: 'Arijit Singh' },
      { text: 'Midnight Drive - Synthwave', category: 'Trending', query: 'Midnight Drive' }
    ];

    // Combine Recents + Trending for empty state
    currentSuggestionMatches = [...recents, ...trending];
    
    // Header for empty discovery panel
    const header = document.createElement('div');
    header.className = 'suggestions-group-header';
    header.style.padding = '8px 18px 4px 18px';
    header.style.fontSize = '11px';
    header.style.fontWeight = '700';
    header.style.color = 'var(--accent-purple)';
    header.style.textTransform = 'uppercase';
    header.style.letterSpacing = '1px';
    header.innerText = recents.length > 0 ? '🕒 Recent & 🔥 Trending Searches' : '🔥 Trending Today';
    suggestionsBox.appendChild(header);

  } else {
    // --- CASE B: TYPED QUERY INPUT (Real-time typo-tolerant search suggestions) ---
    const allCandidates = [...SEARCH_CANDIDATES];
    
    // Dynamic candidates injection from user cache
    customPlaylists.forEach(p => {
      if (!allCandidates.some(c => c.text.toLowerCase() === p.title.toLowerCase())) {
        allCandidates.push({ text: p.title, category: 'Playlist', query: p.query });
      }
    });
    
    customArtists.forEach(a => {
      if (!allCandidates.some(c => c.text.toLowerCase() === a.name.toLowerCase())) {
        allCandidates.push({ text: a.name, category: 'Artist', query: a.query });
      }
    });

    likedTrackObjects.forEach(t => {
      if (!allCandidates.some(c => c.text.toLowerCase() === t.title.toLowerCase())) {
        allCandidates.push({ text: t.title, category: 'Song', query: t.title });
      }
    });

    // Score and rank all candidates based on typo-tolerant fuzzy matching
    const scored = allCandidates.map(item => {
      const score = computeFuzzyMatchScore(item.text, query);
      return { ...item, score };
    }).filter(item => item.score > 0);

    // Sort by highest score first
    scored.sort((a, b) => b.score - a.score);
    
    currentSuggestionMatches = scored.slice(0, 7); // top 7 smart matches

    // ALWAYS prepend a dynamic query item at index 0 so that they can search exactly what they typed instantly
    currentSuggestionMatches.unshift({
      text: rawQuery,
      category: 'Search',
      query: rawQuery
    });
  }

  if (currentSuggestionMatches.length === 0) {
    suggestionsBox.style.display = 'none';
    return;
  }

  // 3. Render items
  currentSuggestionMatches.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'suggestion-item';
    div.setAttribute('data-index', index);
    
    // Choose specific premium icons representing categories
    let iconClass = 'fa-magnifying-glass';
    if (item.category === 'Trending') iconClass = 'fa-fire';
    else if (item.category === 'Recent') iconClass = 'fa-clock-rotate-left';
    else if (item.category === 'Song') iconClass = 'fa-play';
    else if (item.category === 'Artist') iconClass = 'fa-user';
    else if (item.category === 'Playlist') iconClass = 'fa-compact-disc';
    else if (item.category === 'Search') iconClass = 'fa-magnifying-glass';

    // Highlight query matching characters
    let displayText = item.text;
    if (query.length > 0) {
      if (item.category === 'Search') {
        displayText = `Search for "<span class="suggestion-text-match">${item.text}</span>"`;
      } else {
        const escapedQuery = escapeRegExp(query);
        const regex = new RegExp(`(${escapedQuery})`, 'gi');
        displayText = item.text.replace(regex, '<span class="suggestion-text-match">$1</span>');
      }
    }

    div.innerHTML = `
      <i class="fa-solid ${iconClass} suggestion-icon"></i>
      <div style="display: flex; flex-direction: column;">
        <span style="font-weight: 500;">${displayText}</span>
        ${item.subtext ? `<span style="font-size: 11px; color: var(--text-sub); margin-top: 1px;">${item.subtext}</span>` : ''}
      </div>
      <span class="suggestion-category" style="${
        item.category === 'Trending' ? 'background-color: rgba(239, 68, 68, 0.12); color: #f87171;' : 
        item.category === 'Search' ? 'background-color: rgba(168, 85, 247, 0.12); color: var(--accent-purple);' : ''
      }">${item.category}</span>
    `;

    // Dynamic direct click handlers
    div.addEventListener('click', () => {
      input.value = item.text;
      suggestionsBox.style.display = 'none';
      dom.btnClearSearch.style.display = 'flex';
      
      // Fast discovery direct-play feature!
      triggerSearch(item.query);
    });

    suggestionsBox.appendChild(div);
  });

  suggestionsBox.style.display = 'block';
}

function handleSearchKeyboardNav(e) {
  const suggestionsBox = document.getElementById('searchSuggestions');
  if (!suggestionsBox || suggestionsBox.style.display === 'none') return;
  
  const items = suggestionsBox.querySelectorAll('.suggestion-item');
  if (items.length === 0) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    activeSuggestionIndex = (activeSuggestionIndex + 1) % items.length;
    highlightActiveSuggestion(items);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    activeSuggestionIndex = (activeSuggestionIndex - 1 + items.length) % items.length;
    highlightActiveSuggestion(items);
  } else if (e.key === 'Enter') {
    if (activeSuggestionIndex >= 0 && activeSuggestionIndex < items.length) {
      e.preventDefault();
      items[activeSuggestionIndex].click();
    }
  } else if (e.key === 'Escape') {
    suggestionsBox.style.display = 'none';
    dom.searchInput.blur();
  }
}

function highlightActiveSuggestion(items) {
  items.forEach((item, index) => {
    if (index === activeSuggestionIndex) {
      item.classList.add('active');
      item.scrollIntoView({ block: 'nearest' });
      const selectedMatch = currentSuggestionMatches[index];
      if (selectedMatch) {
        dom.searchInput.value = selectedMatch.text;
      }
    } else {
      item.classList.remove('active');
    }
  });
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function initializeGlobalApp() {
  // --- Check Premium User Authentication Gate ---
  // Always clear cached session on load as user requested "want the login page every tym when I open the link"
  localStorage.removeItem('melody_user_session');

  // Keep app container hidden, make sure login screen is active by default
  document.getElementById('userAccessContainer').style.display = 'flex';
  document.querySelector('.app-layout').style.display = 'none';
  document.getElementById('authLoginCard').style.display = 'flex';
  document.getElementById('authSignupCard').style.display = 'none';

  // Initialize page loader in completely clean placeholder state
  clearPlayerMetadata();

  // Bind Form card switching toggles
  const linkToSignup = document.getElementById('linkToSignup');
  if (linkToSignup) {
    linkToSignup.addEventListener('click', () => {
      document.getElementById('authLoginCard').style.display = 'none';
      document.getElementById('authSignupCard').style.display = 'flex';
      // Clear errors on transition
      document.getElementById('loginErrorBanner').style.display = 'none';
    });
  }

  const linkToLogin = document.getElementById('linkToLogin');
  if (linkToLogin) {
    linkToLogin.addEventListener('click', () => {
      document.getElementById('authSignupCard').style.display = 'none';
      document.getElementById('authLoginCard').style.display = 'flex';
      // Clear errors on transition
      document.getElementById('signupErrorBanner').style.display = 'none';
    });
  }

  // Bind Password Visibility Eye-toggles
  const toggleLoginPassword = document.getElementById('toggleLoginPassword');
  if (toggleLoginPassword) {
    toggleLoginPassword.addEventListener('click', () => {
      const pwdInput = document.getElementById('loginPassword');
      const type = pwdInput.getAttribute('type') === 'password' ? 'text' : 'password';
      pwdInput.setAttribute('type', type);
      toggleLoginPassword.classList.toggle('fa-eye');
      toggleLoginPassword.classList.toggle('fa-eye-slash');
    });
  }

  const toggleSignupPassword = document.getElementById('toggleSignupPassword');
  if (toggleSignupPassword) {
    toggleSignupPassword.addEventListener('click', () => {
      const pwdInput = document.getElementById('signupPassword');
      const type = pwdInput.getAttribute('type') === 'password' ? 'text' : 'password';
      pwdInput.setAttribute('type', type);
      toggleSignupPassword.classList.toggle('fa-eye');
      toggleSignupPassword.classList.toggle('fa-eye-slash');
    });
  }

  const toggleSignupConfirmPassword = document.getElementById('toggleSignupConfirmPassword');
  if (toggleSignupConfirmPassword) {
    toggleSignupConfirmPassword.addEventListener('click', () => {
      const pwdInput = document.getElementById('signupConfirmPassword');
      const type = pwdInput.getAttribute('type') === 'password' ? 'text' : 'password';
      pwdInput.setAttribute('type', type);
      toggleSignupConfirmPassword.classList.toggle('fa-eye');
      toggleSignupConfirmPassword.classList.toggle('fa-eye-slash');
    });
  }

  // Helper to trigger shaking error animation
  const triggerAuthShake = (card, banner, errorMsg) => {
    banner.innerText = errorMsg;
    banner.style.display = 'block';
    card.classList.add('shake-error');
    setTimeout(() => card.classList.remove('shake-error'), 350);
  };

  // Wire up User Sign-Up
  const btnSignupSubmit = document.getElementById('btnSignupSubmit');
  if (btnSignupSubmit) {
    btnSignupSubmit.addEventListener('click', async () => {
      const card = document.getElementById('authSignupCard');
      const banner = document.getElementById('signupErrorBanner');
      banner.style.display = 'none';

      const fullName = document.getElementById('signupName').value.trim();
      const email = document.getElementById('signupEmail').value.trim();
      const password = document.getElementById('signupPassword').value;
      const confirmPassword = document.getElementById('signupConfirmPassword').value;

      if (!fullName || !email || !password || !confirmPassword) {
        return triggerAuthShake(card, banner, 'All fields are required.');
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return triggerAuthShake(card, banner, 'Please enter a valid email address.');
      }

      if (password !== confirmPassword) {
        return triggerAuthShake(card, banner, 'Passwords do not match.');
      }

      // Password strength regex matches the backend: At least 8 characters with a number and symbol
      if (!/^(?=.*[0-9])(?=.*[!@#$%^&*()_+={}\[\]|\\:;"'<>,.?/~`\-]).{8,}$/.test(password)) {
        return triggerAuthShake(card, banner, 'Password must be at least 8 characters and include a number and symbol.');
      }

      try {
        btnSignupSubmit.disabled = true;
        btnSignupSubmit.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing...';

        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName, email, password, confirmPassword })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          currentUser = data.user;
          loadSavedState();
          renderRecentlyPlayed();
          
          if (recentlyPlayed && recentlyPlayed.length > 0) {
            const firstTrack = recentlyPlayed[0];
            trackQueue = [...recentlyPlayed];
            currentTrackIndex = 0;
            loadTrackMetadataOnly(firstTrack);
          } else {
            clearPlayerMetadata();
          }
          
          // Auto-login on successful registration
          localStorage.setItem('melody_user_session', JSON.stringify(data.user));
          showToast('🎉 Account created! Welcome to Melody.');
          
          // Animate transition to Main Player App
          const container = document.getElementById('userAccessContainer');
          container.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
          container.style.opacity = '0';
          container.style.transform = 'scale(1.02)';
          
          setTimeout(() => {
            container.style.display = 'none';
            const layoutNode = document.querySelector('.app-layout');
            layoutNode.style.display = 'grid';
            layoutNode.style.opacity = '0';
            layoutNode.style.transition = 'opacity 0.4s ease';
            setTimeout(() => layoutNode.style.opacity = '1', 50);
            
            const nameNode = document.querySelector('.user-name');
            if (nameNode) nameNode.innerText = data.user.fullName;
          }, 450);
        } else {
          triggerAuthShake(card, banner, data.error || 'Registration failed.');
        }
      } catch (err) {
        triggerAuthShake(card, banner, 'Network connection failed. Try again.');
      } finally {
        btnSignupSubmit.disabled = false;
        btnSignupSubmit.innerHTML = 'Sign Up <i class="fa-solid fa-arrow-right"></i>';
      }
    });
  }

  // Wire up User Login
  const btnLoginSubmit = document.getElementById('btnLoginSubmit');
  if (btnLoginSubmit) {
    btnLoginSubmit.addEventListener('click', async () => {
      const card = document.getElementById('authLoginCard');
      const banner = document.getElementById('loginErrorBanner');
      banner.style.display = 'none';

      const emailOrUsername = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;

      if (!emailOrUsername || !password) {
        return triggerAuthShake(card, banner, 'Email and Password are required.');
      }

      try {
        btnLoginSubmit.disabled = true;
        btnLoginSubmit.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Authenticating...';

        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailOrUsername, password })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          currentUser = data.user;
          loadSavedState();
          renderRecentlyPlayed();
          
          if (recentlyPlayed && recentlyPlayed.length > 0) {
            const firstTrack = recentlyPlayed[0];
            trackQueue = [...recentlyPlayed];
            currentTrackIndex = 0;
            loadTrackMetadataOnly(firstTrack);
          } else {
            clearPlayerMetadata();
          }
          
          localStorage.setItem('melody_user_session', JSON.stringify(data.user));
          showToast('🔓 Successfully logged in!');
          
          // Animate transition to Main Player App
          const container = document.getElementById('userAccessContainer');
          container.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
          container.style.opacity = '0';
          container.style.transform = 'scale(1.02)';
          
          setTimeout(() => {
            container.style.display = 'none';
            const layoutNode = document.querySelector('.app-layout');
            layoutNode.style.display = 'grid';
            layoutNode.style.opacity = '0';
            layoutNode.style.transition = 'opacity 0.4s ease';
            setTimeout(() => layoutNode.style.opacity = '1', 50);
            
            const nameNode = document.querySelector('.user-name');
            if (nameNode) nameNode.innerText = data.user.fullName;
          }, 450);
        } else {
          triggerAuthShake(card, banner, data.error || 'Incorrect email or password.');
        }
      } catch (err) {
        triggerAuthShake(card, banner, 'Network connection failed. Try again.');
      } finally {
        btnLoginSubmit.disabled = false;
        btnLoginSubmit.innerHTML = 'Log In <i class="fa-solid fa-arrow-right"></i>';
      }
    });
  }

  // Load saved state (caching engines)
  loadSavedState();

  // Render recently played tracks on start
  renderRecentlyPlayed();

  // Bind Header Search bar
  dom.searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = dom.searchInput.value.trim();
    if (query !== '') {
      const suggestionsBox = document.getElementById('searchSuggestions');
      if (suggestionsBox) suggestionsBox.style.display = 'none';
      triggerSearch(query);
    }
  });

  dom.searchInput.addEventListener('input', () => {
    const hasValue = dom.searchInput.value.length > 0;
    dom.btnClearSearch.style.display = hasValue ? 'flex' : 'none';
    handleSearchSuggestions();
  });

  dom.searchInput.addEventListener('focus', handleSearchSuggestions);
  dom.searchInput.addEventListener('keydown', handleSearchKeyboardNav);

  dom.btnClearSearch.addEventListener('click', () => {
    dom.searchInput.value = '';
    dom.btnClearSearch.style.display = 'none';
    const suggestionsBox = document.getElementById('searchSuggestions');
    if (suggestionsBox) suggestionsBox.style.display = 'none';
    dom.searchInput.focus();
    switchActiveViewPanel('homeLandingView');
  });

  // Close search suggestions if clicked anywhere outside the search form
  document.addEventListener('click', (e) => {
    const form = document.getElementById('searchForm');
    const suggestionsBox = document.getElementById('searchSuggestions');
    if (form && suggestionsBox && !form.contains(e.target)) {
      suggestionsBox.style.display = 'none';
    }
  });

  // --- Sidebar View Switching Click Triggers ---
  dom.btnHome.addEventListener('click', () => switchActiveViewPanel('homeLandingView'));
  dom.btnLogoHome.addEventListener('click', () => switchActiveViewPanel('homeLandingView'));
  
  dom.btnSearchFocus.addEventListener('click', () => {
    switchActiveViewPanel('homeLandingView');
    dom.searchInput.focus();
  });
  
  dom.btnYourLibrary.addEventListener('click', () => switchActiveViewPanel('libraryView'));
  dom.btnPlaylists.addEventListener('click', () => switchActiveViewPanel('playlistsView'));
  dom.btnLikedSongs.addEventListener('click', () => switchActiveViewPanel('likedSongsView'));
  dom.btnArtists.addEventListener('click', () => switchActiveViewPanel('artistsView'));
  dom.btnPodcasts.addEventListener('click', () => switchActiveViewPanel('podcastsView'));

  // --- Library Dashboard Widget Click Actions ---
  dom.libCardLiked.addEventListener('click', () => switchActiveViewPanel('likedSongsView'));
  dom.libCardPlaylists.addEventListener('click', () => switchActiveViewPanel('playlistsView'));
  dom.libCardArtists.addEventListener('click', () => switchActiveViewPanel('artistsView'));

  // --- Custom Playlist Creation Binding ---
  dom.btnCreatePlaylist.addEventListener('click', triggerCreatePlaylistPrompt);

  // --- Home Card Clicking - Drive actual, curated streams ---
  document.querySelectorAll('.square-music-card').forEach(card => {
    const cardIdxAttr = card.getAttribute('data-card-index');
    if (cardIdxAttr !== null) {
      card.addEventListener('click', () => {
        const idx = parseInt(cardIdxAttr);
        const track = HOME_CARDS_MAPPING.recentlyPlayed[idx];
        if (track) {
          isSearchQueuePlayback = false; // Reset search-origin queue flag
          trackQueue = HOME_CARDS_MAPPING.recentlyPlayed;
          playTrack(track, idx);
        }
      });
    }
  });

  document.querySelectorAll('.rect-music-card').forEach(card => {
    const rectIdxAttr = card.getAttribute('data-rect-index');
    if (rectIdxAttr !== null) {
      card.addEventListener('click', () => {
        const idx = parseInt(rectIdxAttr);
        const track = HOME_CARDS_MAPPING.madeForYou[idx];
        if (track) {
          isSearchQueuePlayback = false; // Reset search-origin queue flag
          trackQueue = HOME_CARDS_MAPPING.madeForYou;
          playTrack(track, idx);
        }
      });
    }
  });

  // --- Custom Artist Creation Binding ---
  if (dom.btnAddArtist) {
    dom.btnAddArtist.addEventListener('click', triggerAddArtistPrompt);
  }

  // --- Podcast Cards Click Actions ---
  document.querySelectorAll('.podcast-card').forEach(card => {
    card.addEventListener('click', () => {
      const query = card.getAttribute('data-podcast-query');
      if (query) {
        showToast(`Streaming podcast feed: ${query}`);
        triggerSearch(query);
      }
    });
  });

  // Error container retry trigger
  dom.btnErrorRetry.addEventListener('click', () => {
    const q = lastSearchedQuery || 'trending';
    triggerSearch(q, q === 'trending');
  });

  // Keybindings: Spacebar controls playback
  window.addEventListener('keydown', (e) => {
    // Ignore global playback triggers when typing inside input fields, textareas or editable cells
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
      return;
    }
    
    if (e.code === 'Space') {
      e.preventDefault();
      togglePlayPause();
    }
  });

}

/* ==========================================================================
   Helper Functions (Formatting, Badges, Decodes)
   ========================================================================== */

function formatTime(seconds) {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function decodeHtml(html) {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}

function showToast(message) {
  const oldToast = document.querySelector('.stream-toast');
  if (oldToast) oldToast.remove();

  const toast = document.createElement('div');
  toast.className = 'stream-toast';
  toast.innerText = message;
  
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '125px',
    left: '50%',
    transform: 'translateX(-50%) translateY(20px)',
    zIndex: '9999',
    transition: 'all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    opacity: '0'
  });

  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.transform = 'translateX(-50%) translateY(0)';
    toast.style.opacity = '1';
  }, 40);

  setTimeout(() => {
    toast.style.transform = 'translateX(-50%) translateY(20px)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 350);
  }, 2200);
}

// Initialise listeners on document parse or immediately if ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeGlobalApp);
} else {
  initializeGlobalApp();
}

// Gracefully intercept broken images (e.g. blocked Unsplash requests) and swap with high-fidelity placeholder
document.addEventListener('error', function(event) {
  if (event.target.tagName === 'IMG') {
    event.target.style.transition = 'opacity 0.25s ease';
    event.target.style.opacity = '0';
    setTimeout(() => {
      event.target.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80';
      event.target.style.opacity = '1';
    }, 100);
  }
}, true);



function logoutCurrentUserSession() {
  if (confirm('Are you sure you want to log out of your session?')) {
    localStorage.removeItem('melody_user_session');
    currentUser = null;
    
    // Animate hiding of Melody Player and displaying Login Gate
    const layoutNode = document.querySelector('.app-layout');
    layoutNode.style.transition = 'opacity 0.4s ease';
    layoutNode.style.opacity = '0';
    
    setTimeout(() => {
      layoutNode.style.display = 'none';
      
      const container = document.getElementById('userAccessContainer');
      container.style.display = 'flex';
      container.style.opacity = '0';
      container.style.transform = 'scale(0.98)';
      
      // Make sure login view is active by default!
      document.getElementById('authLoginCard').style.display = 'flex';
      document.getElementById('authSignupCard').style.display = 'none';
      
      setTimeout(() => {
        container.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
        container.style.opacity = '1';
        container.style.transform = 'scale(1)';
      }, 50);
      
      showToast('🔒 Logged out successfully. See you soon!');
    }, 400);
  }
}

// Expose globally so inline onclick can trigger it
window.logoutCurrentUserSession = logoutCurrentUserSession;
window.openAdminLoginModal = openAdminLoginModal;
window.closeAdminLoginModal = closeAdminLoginModal;
window.handleAdminLogin = handleAdminLogin;

// Dynamically load the YouTube Iframe Player API asynchronously to resolve race conditions
(function() {
  const tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  const firstScriptTag = document.getElementsByTagName('script')[0];
  if (firstScriptTag) {
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  } else {
    document.head.appendChild(tag);
  }
  console.log('[Melody API] Dynamic YouTube Iframe API Script injected.');
})();
