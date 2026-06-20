const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const M3U_URL = process.env.M3U_URL || 'https://raw.githubusercontent.com/abusaeeidx/CricHd-playlists-Auto-Update-permanent/refs/heads/main/ALL.m3u';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Root route - serve index.html
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Store fetched channels in memory with refresh interval
let cachedChannels = [];
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

/**
 * Parse m3u8 playlist and extract channel information
 */
function parsePlaylist(content) {
  const lines = content.split('\n');
  const channels = [];
  let currentChannel = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('#EXTINF:')) {
      // Parse channel info
      const match = line.match(/,(.*)$/);
      const name = match ? match[1] : 'Unknown';
      currentChannel = { name, logo: null, referrer: null, origin: null };

      // Extract logo
      const logoMatch = line.match(/tvg-logo="([^"]*)"/);
      if (logoMatch) {
        currentChannel.logo = logoMatch[1];
      }
    } else if (line.startsWith('#EXTVLCOPT:http-referrer=')) {
      if (currentChannel) {
        currentChannel.referrer = line.replace('#EXTVLCOPT:http-referrer=', '');
      }
    } else if (line.startsWith('#EXTVLCOPT:http-origin=')) {
      if (currentChannel) {
        currentChannel.origin = line.replace('#EXTVLCOPT:http-origin=', '');
      }
    } else if (line && !line.startsWith('#') && line.includes('http')) {
      // Stream URL
      if (currentChannel) {
        currentChannel.url = line;
        channels.push(currentChannel);
        currentChannel = null;
      }
    }
  }

  return channels;
}

/**
 * Fetch m3u8 playlist from source
 */
async function fetchPlaylist() {
  try {
    const now = Date.now();
    
    // Return cached data if still valid
    if (cachedChannels.length > 0 && (now - lastFetchTime) < CACHE_DURATION) {
      console.log(`Using cached channels (${cachedChannels.length} channels)`);
      return cachedChannels;
    }

    console.log(`Fetching playlist from ${M3U_URL}...`);
    const response = await axios.get(M3U_URL, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    cachedChannels = parsePlaylist(response.data);
    lastFetchTime = now;
    
    console.log(`Fetched ${cachedChannels.length} channels from playlist`);
    return cachedChannels;
  } catch (error) {
    console.error('Error fetching playlist:', error.message);
    throw new Error('Failed to fetch playlist');
  }
}

/**
 * API Routes
 */

// Get all channels
app.get('/api/channels', async (req, res) => {
  try {
    const channels = await fetchPlaylist();
    res.json({
      success: true,
      count: channels.length,
      channels: channels
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get specific channel by index
app.get('/api/channels/:id', async (req, res) => {
  try {
    const channels = await fetchPlaylist();
    const id = parseInt(req.params.id);
    
    if (id < 0 || id >= channels.length) {
      return res.status(404).json({
        success: false,
        error: 'Channel not found'
      });
    }

    res.json({
      success: true,
      channel: channels[id]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Search channels by name
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    const channels = await fetchPlaylist();
    
    const filtered = channels.filter(ch => 
      ch.name.toLowerCase().includes(query.toLowerCase())
    );

    res.json({
      success: true,
      count: filtered.length,
      channels: filtered
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get m3u8 playlist content (for direct streaming)
app.get('/api/stream/:id', async (req, res) => {
  try {
    const channels = await fetchPlaylist();
    const id = parseInt(req.params.id);
    
    // Validate channel index
    if (isNaN(id) || id < 0 || id >= channels.length) {
      console.error(`Invalid channel ID: ${id} (total: ${channels.length})`);
      return res.status(404).json({
        success: false,
        error: 'Channel not found'
      });
    }

    const channel = channels[id];
    if (!channel || !channel.url) {
      console.error(`Channel data invalid for ID: ${id}`);
      return res.status(500).json({
        success: false,
        error: 'Channel data is invalid'
      });
    }

    console.log(`📡 Fetching stream playlist: ${channel.name} (ID: ${id})`);
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
      'Referer': channel.referrer || 'https://executeandship.com/',
      'Origin': channel.origin || 'https://executeandship.com',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9'
    };

    const response = await axios.get(channel.url, {
      headers: headers,
      timeout: 30000,
      maxRedirects: 10,
      responseType: 'text',
      httpAgent: new (require('http').Agent)({ keepAlive: true }),
      httpsAgent: new (require('https').Agent)({ keepAlive: true })
    });

    // Parse and rewrite m3u8 to fix relative URLs AND add segment proxy routing
    let m3u8Content = response.data;
    const baseUrl = channel.url.substring(0, channel.url.lastIndexOf('/'));
    
    // Rewrite segment URLs to use our proxy endpoint
    m3u8Content = m3u8Content.split('\n').map((line, idx) => {
      // Skip comment lines and headers
      if (line.startsWith('#') || !line.trim()) {
        return line;
      }
      // If it's a segment URL (http or relative), route it through our proxy
      if (line.trim()) {
        const segmentUrl = line.startsWith('http') ? line : baseUrl + '/' + line;
        // Encode and proxy through our segment endpoint
        const encoded = encodeURIComponent(segmentUrl);
        return `/api/segment/${id}?url=${encoded}`;
      }
      return line;
    }).join('\n');

    // Add CORS headers and return the m3u8 content
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    console.log(`✅ Successfully fetched playlist for: ${channel.name}`);
    res.send(m3u8Content);
    
  } catch (error) {
    console.error(`❌ Stream error: ${error.message}`);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch stream: ' + error.message
      });
    }
  }
});

// OPTIONS request handler for CORS preflight
app.options('/api/stream/:id', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.sendStatus(200);
});

// Proxy HLS segments with proper headers to bypass CORS
app.get('/api/segment/:id', async (req, res) => {
  try {
    const channelId = parseInt(req.params.id);
    const segmentUrl = req.query.url;
    
    if (!segmentUrl) {
      console.error('❌ Segment endpoint: Missing segment URL parameter');
      return res.status(400).json({ error: 'Missing segment URL' });
    }

    console.log(`📦 Proxying segment: ${segmentUrl.substring(0, 60)}...`);

    const channels = await fetchPlaylist();
    if (channelId < 0 || channelId >= channels.length) {
      console.error(`❌ Invalid channel ID: ${channelId}`);
      return res.status(404).send('Channel not found');
    }

    const channel = channels[channelId];
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': channel.referrer || 'https://executeandship.com/',
      'Origin': channel.origin || 'https://executeandship.com',
      'Connection': 'keep-alive'
    };

    const response = await axios.get(segmentUrl, {
      headers: headers,
      timeout: 30000,
      responseType: 'arraybuffer',
      maxRedirects: 5,
      httpAgent: new (require('http').Agent)({ keepAlive: true }),
      httpsAgent: new (require('https').Agent)({ keepAlive: true })
    });

    res.setHeader('Content-Type', response.headers['content-type'] || 'video/MP2T');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Content-Length', response.data.length);
    
    console.log(`✅ Segment proxied successfully (${response.data.length} bytes)`);
    res.send(response.data);
    
  } catch (error) {
    console.error(`❌ Segment proxy error: ${error.message}`);
    if (!res.headersSent) {
      res.status(500).send(`Error: ${error.message}`);
    }
  }
});

// OPTIONS for segment proxy
app.options('/api/segment/:id', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.sendStatus(200);
});

// Force refresh cache
app.post('/api/refresh', async (req, res) => {
  try {
    cachedChannels = [];
    lastFetchTime = 0;
    const channels = await fetchPlaylist();
    
    res.json({
      success: true,
      message: 'Playlist refreshed',
      count: channels.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get cache status
app.get('/api/status', (req, res) => {
  const now = Date.now();
  const timeUntilRefresh = Math.max(0, CACHE_DURATION - (now - lastFetchTime));
  
  res.json({
    success: true,
    cached_channels: cachedChannels.length,
    last_fetch: new Date(lastFetchTime).toISOString(),
    cache_expires_in_ms: timeUntilRefresh,
    cache_duration_ms: CACHE_DURATION
  });
});

// 404 handler - catch all unmatched routes
app.use((req, res) => {
  console.log(`404 - Requested: ${req.path}`);
  res.status(404).sendFile(__dirname + '/public/index.html');
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🎬 Live Streaming Server running on http://localhost:${PORT}`);
  console.log(`📺 Fetching from: ${M3U_URL}\n`);
});
