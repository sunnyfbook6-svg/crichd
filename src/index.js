const M3U_URL = 'https://raw.githubusercontent.com/abusaeeidx/CricHd-playlists-Auto-Update-permanent/refs/heads/main/ALL.m3u';

// Parse m3u8 playlist
function parsePlaylist(content) {
  const lines = content.split('\n');
  const channels = [];
  let currentChannel = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('#EXTINF:')) {
      const match = line.match(/,(.*)$/);
      const name = match ? match[1] : 'Unknown';
      currentChannel = { name, logo: null, referrer: null, origin: null };

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
      if (currentChannel) {
        currentChannel.url = line;
        channels.push(currentChannel);
        currentChannel = null;
      }
    }
  }

  return channels;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Content-Type': 'application/json'
};

// Cache key for KV storage
const CACHE_KEY = 'channels_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders
      });
    }

    // Get all channels
    if (pathname === '/api/channels') {
      try {
        let channels = await getChannelsFromCache(env);
        
        if (!channels) {
          const response = await fetch(M3U_URL);
          const content = await response.text();
          channels = parsePlaylist(content);
          await env.STREAMING_KV.put(CACHE_KEY, JSON.stringify(channels), {
            expirationTtl: 300 // 5 minutes
          });
        }

        return new Response(JSON.stringify({
          success: true,
          count: channels.length,
          channels: channels
        }), {
          headers: corsHeaders
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Get specific stream
    if (pathname.match(/^\/api\/stream\/\d+$/)) {
      try {
        const id = parseInt(pathname.split('/')[3]);
        let channels = await getChannelsFromCache(env);
        
        if (!channels) {
          const response = await fetch(M3U_URL);
          const content = await response.text();
          channels = parsePlaylist(content);
        }

        if (id < 0 || id >= channels.length) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Channel not found'
          }), {
            status: 404,
            headers: corsHeaders
          });
        }

        const channel = channels[id];
        
        // Fetch the m3u8 playlist
        const m3u8Response = await fetch(channel.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': channel.referrer || 'https://executeandship.com/',
            'Origin': channel.origin || 'https://executeandship.com'
          }
        });

        let m3u8Content = await m3u8Response.text();
        const baseUrl = channel.url.substring(0, channel.url.lastIndexOf('/'));

        // Rewrite segment URLs to use proxy
        m3u8Content = m3u8Content.split('\n').map((line) => {
          if (line.startsWith('#') || !line.trim()) {
            return line;
          }
          if (line.trim()) {
            const segmentUrl = line.startsWith('http') ? line : baseUrl + '/' + line;
            const encoded = encodeURIComponent(segmentUrl);
            return `/api/segment/${id}?url=${encoded}`;
          }
          return line;
        }).join('\n');

        return new Response(m3u8Content, {
          headers: {
            'Content-Type': 'application/vnd.apple.mpegurl',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        });

      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Proxy segments
    if (pathname.match(/^\/api\/segment\/\d+$/)) {
      try {
        const id = parseInt(pathname.split('/')[3]);
        const segmentUrl = url.searchParams.get('url');

        if (!segmentUrl) {
          return new Response(JSON.stringify({
            error: 'Missing segment URL'
          }), {
            status: 400,
            headers: corsHeaders
          });
        }

        let channels = await getChannelsFromCache(env);
        if (!channels) {
          const response = await fetch(M3U_URL);
          const content = await response.text();
          channels = parsePlaylist(content);
        }

        if (id < 0 || id >= channels.length) {
          return new Response('Channel not found', { status: 404 });
        }

        const channel = channels[id];
        const segResponse = await fetch(segmentUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': channel.referrer || 'https://executeandship.com/',
            'Origin': channel.origin || 'https://executeandship.com'
          }
        });

        if (!segResponse.ok) {
          return new Response('Segment not found', { status: 404 });
        }

        const buffer = await segResponse.arrayBuffer();

        return new Response(buffer, {
          headers: {
            'Content-Type': segResponse.headers.get('content-type') || 'video/MP2T',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=3600'
          }
        });

      } catch (error) {
        return new Response(JSON.stringify({
          error: error.message
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Refresh cache
    if (pathname === '/api/refresh' && request.method === 'POST') {
      try {
        await env.STREAMING_KV.delete(CACHE_KEY);
        const response = await fetch(M3U_URL);
        const content = await response.text();
        const channels = parsePlaylist(content);
        await env.STREAMING_KV.put(CACHE_KEY, JSON.stringify(channels), {
          expirationTtl: 300
        });

        return new Response(JSON.stringify({
          success: true,
          message: 'Playlist refreshed',
          count: channels.length
        }), {
          headers: corsHeaders
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Get status
    if (pathname === '/api/status') {
      return new Response(JSON.stringify({
        success: true,
        message: 'API is running',
        timestamp: new Date().toISOString()
      }), {
        headers: corsHeaders
      });
    }

    return new Response('Not found', { status: 404 });
  }
};

// Helper function to get channels from cache
async function getChannelsFromCache(env) {
  try {
    const cached = await env.STREAMING_KV?.get(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.error('Cache error:', error);
  }
  return null;
}
