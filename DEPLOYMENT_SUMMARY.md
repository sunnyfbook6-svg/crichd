# Live Streaming App - Complete Solution

## ✅ What's Included

### Frontend (Static - Cloudflare Pages)
- `public/index.html` - Main application UI
- `public/app.js` - Frontend logic with API_BASE support
- `public/styles.css` - Responsive styling
- Works on any static host (GitHub Pages, Netlify, Vercel, etc.)

### Backend (Serverless - Cloudflare Workers)
- `src/index.js` - Complete Worker implementation
- Handles all API endpoints
- Proxies segments with proper headers
- Caches channels in KV Store

### Local Development
- `server.js` - Express development server
- Works exactly like production
- Can test locally before deploying

---

## 🚀 Quick Start

### Local Testing
```bash
npm install
npm start
# Visit http://localhost:3000
```

### Deploy to Cloudflare

**1. Create KV Namespace:**
```bash
wrangler kv:namespace create "STREAMING_KV"
```

**2. Update wrangler.toml with the ID from step 1**

**3. Deploy Worker:**
```bash
wrangler publish
```

**4. Deploy to Pages (GitHub):**
- Push to GitHub
- Go to pages.cloudflare.com
- Connect your repo
- Set build directory to `public`
- Add environment variable: `API_BASE=https://your-worker-url`

---

## 📁 File Structure

```
.
├── public/                    # Static frontend
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── src/
│   └── index.js              # Cloudflare Worker
├── server.js                  # Local dev server
├── wrangler.toml             # Cloudflare config
├── package.json
├── README.md
├── DEPLOYMENT.md             # Full deployment guide
└── CLOUDFLARE_SETUP.md       # Quick setup guide
```

---

## 🎯 How It Works

### Local (Development)
```
Browser → Express Server (Node.js) → CDN Streams
```

### Production (Cloudflare)
```
Browser (Pages) → Cloudflare Worker → CDN Streams
```

### Key Features
✅ Fetches live m3u8 playlists  
✅ Proxies video segments  
✅ Handles CORS automatically  
✅ Caches channels for 5 minutes  
✅ Works globally on Cloudflare  
✅ No backend maintenance needed  

---

## 🔧 Configuration

### For Local Development
Edit `.env`:
```env
PORT=3000
M3U_URL=https://raw.githubusercontent.com/abusaeeidx/...
```

### For Cloudflare Pages
In Dashboard → Pages → Environment Variables:
```
API_BASE = https://live-streaming-app.YOUR_ACCOUNT.workers.dev
```

---

## 🎬 API Endpoints

All endpoints work on both local and Cloudflare:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/channels` | GET | Get all channels |
| `/api/stream/:id` | GET | Get m3u8 playlist |
| `/api/segment/:id` | GET | Proxy video segment |
| `/api/refresh` | POST | Refresh cache |
| `/api/status` | GET | Get server status |

---

## 🌍 Deployment Options

### Option 1: Cloudflare (Recommended)
- **Frontend**: Cloudflare Pages (free)
- **Backend**: Cloudflare Workers (free tier available)
- **Cache**: KV Store (free tier available)
- **Performance**: Fastest, globally distributed
- **Cost**: Free to ~$50/month depending on usage

### Option 2: Vercel
- Deploy `public/` folder to Vercel
- Deploy `server.js` to Vercel Functions
- Update API_BASE to Vercel function URL

### Option 3: Heroku
- Deploy entire app with `server.js`
- Single URL for everything
- No separate frontend/backend

### Option 4: Self-Hosted
- Run `server.js` on your VPS
- Serve static files from `public/`
- Use nginx/Apache as reverse proxy

---

## ⚡ Performance Tips

1. **Cloudflare Workers** - No cold starts, instant scaling
2. **KV Cache** - Channels cached for 5 minutes
3. **Keep-Alive** - Connection pooling for segments
4. **CDN** - Pages served from edge locations

---

## 🐛 Troubleshooting

### "Failed to connect to server"
- Check Worker URL is correct
- Verify API_BASE environment variable
- Check CORS headers

### "Stream won't play"
- Open browser DevTools → Console
- Look for error messages
- Check Worker logs: `wrangler tail`
- Verify M3U_URL is accessible

### "Timeout errors"
- Some CDNs are slow, timeouts are increased to 30s
- Some channels may be geo-blocked
- Try different channels

---

## 📚 Files Reference

### To Deploy Frontend Only
Copy `public/` to any static host

### To Deploy Backend Only
Copy `src/index.js` to Cloudflare Workers

### To Deploy Locally
Run `npm start` with `server.js`

---

## ✨ Features

✅ Real-time m3u8 playlist fetching  
✅ HLS video streaming with Plyr player  
✅ 40+ live cricket channels  
✅ Search and filter channels  
✅ Responsive design (mobile-friendly)  
✅ Zero configuration needed  
✅ Global CDN distribution  
✅ Serverless (no backend to manage)  
✅ Works offline with cache  

---

## 📝 Next Steps

1. **Test locally**: `npm start` → `http://localhost:3000`
2. **Deploy to Cloudflare**: Follow CLOUDFLARE_SETUP.md
3. **Share your URL**: Works globally!

---

## 💡 Tips

- Keep `wrangler.toml` updated with KV IDs
- Check Worker logs regularly: `wrangler tail`
- Monitor Pages deployment in dashboard
- Cache can be manually refreshed via UI

---

## 📞 Support

- Cloudflare Docs: https://developers.cloudflare.com
- Plyr Player: https://plyr.io
- Express.js: https://expressjs.com
- HLS.js: https://github.com/video-dev/hls.js

---

**Ready to deploy! Follow CLOUDFLARE_SETUP.md for step-by-step instructions.**
