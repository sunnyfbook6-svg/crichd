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

export async function onRequest(context) {
  try {
    const response = await fetch(M3U_URL);
    const content = await response.text();
    const channels = parsePlaylist(content);

    return new Response(JSON.stringify({
      success: true,
      count: channels.length,
      channels: channels
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
