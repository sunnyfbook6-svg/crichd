# Live Streaming App - Real-time m3u8 Channel Streamer

A modern web-based live streaming application that fetches m3u8 playlists in real-time and streams live channels directly in your browser.

## Features

✨ **Real-Time Fetching**: Automatically fetches m3u8 playlists from remote sources with intelligent caching
📺 **Live Streaming**: HLS/m3u8 streaming support using Video.js
🔍 **Smart Search**: Search channels by name in real-time
🎯 **Channel Management**: Browse and select from hundreds of live channels
🔄 **Auto-Refresh**: Configurable cache system with manual refresh
🌐 **Responsive UI**: Beautiful, modern interface that works on desktop and mobile
⚡ **Stream Proxying**: Handles referrer/origin headers automatically to bypass restrictions

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Setup

1. Clone or download this project
2. Install dependencies:

```bash
npm install
```

3. Configure the `.env` file (optional):

```env
PORT=3000
M3U_URL=https://raw.githubusercontent.com/abusaeeidx/CricHd-playlists-Auto-Update-permanent/refs/heads/main/ALL.m3u
```

## Running the App

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The app will start on `http://localhost:3000`

## API Endpoints

### Get All Channels
```
GET /api/channels
```
Returns all available channels from the m3u8 playlist.

**Response:**
```json
{
  "success": true,
  "count": 50,
  "channels": [
    {
      "name": "Star Sports 1",
      "logo": "https://...",
      "url": "https://cdn.../stream.m3u8",
      "referrer": "https://...",
      "origin": "https://..."
    }
  ]
}
```

### Get Specific Channel
```
GET /api/channels/:id
```
Returns a specific channel by index.

### Search Channels
```
GET /api/search?q=cricket
```
Search channels by name.

### Stream Channel
```
GET /api/stream/:id
```
Proxies the stream with proper headers to bypass restrictions.

### Refresh Cache
```
POST /api/refresh
```
Forces an immediate refresh of the playlist cache.

### Get Cache Status
```
GET /api/status
```
Returns current cache status and next refresh time.

## How It Works

1. **Fetching**: The app periodically fetches the m3u8 playlist from the configured URL
2. **Parsing**: Extracts channel information including name, logo, stream URL, and headers
3. **Caching**: Caches channels in memory for 5 minutes to reduce server load
4. **Streaming**: Proxies stream requests with proper HTTP headers (referrer, origin) to handle CORS and access restrictions
5. **UI**: Video.js player handles HLS playback directly in the browser

## File Structure

```
.
├── package.json           # Project dependencies
├── server.js             # Express server with API endpoints
├── .env                  # Environment configuration
└── public/
    ├── index.html        # Main HTML page
    ├── styles.css        # UI styling
    └── app.js            # Frontend JavaScript
```

## Configuration

Edit `.env` to change:
- `PORT`: Server port (default: 3000)
- `M3U_URL`: Source m3u8 playlist URL

## Supported Features

- ✅ HLS (m3u8) streaming
- ✅ Channel search and filtering
- ✅ Real-time playlist updates
- ✅ Custom HTTP headers (referrer, origin)
- ✅ Video player controls (play, pause, fullscreen)
- ✅ Cache management
- ✅ Error handling and recovery

## Troubleshooting

### "Failed to connect to server"
- Ensure the server is running on the configured port
- Check if port 3000 is available
- Verify no firewall is blocking the connection

### "Failed to stream channel"
- Some streams may be geo-blocked or region-restricted
- The stream URL might be expired (expires parameter in URL)
- Check browser console for detailed error messages

### "No channels found"
- Verify the M3U_URL in .env is correct
- Check internet connection
- The playlist source may be temporarily unavailable

### Player shows "No Channel Selected"
- Click a channel from the list to select it
- Wait for the player to load (may take a few seconds)
- Check browser console for errors

## Performance Tips

- Channels are cached for 5 minutes to reduce server load
- Use the search feature to quickly find channels
- Video streams are proxied directly from source
- Real-time filtering happens client-side

## Browser Compatibility

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## Limitations

- Some streams may require specific geographic regions
- Stream URLs can expire and need playlist refresh
- Not all m3u8 sources support all features (subtitles, adaptive bitrate, etc.)
- Fullscreen may not work in all browsers/contexts

## License

MIT

## Disclaimer

This application is for educational purposes. Users are responsible for ensuring they have legal rights to stream content. Respect content rights and regional restrictions.

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify API endpoints are responding
3. Try refreshing the playlist
4. Clear browser cache and reload

---

**Enjoy streaming!** 🎬📺
