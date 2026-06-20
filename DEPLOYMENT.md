# Deployment Guide

## Local Development

```bash
npm install
npm start
```

Visit `http://localhost:3000`

---

## Cloudflare Pages + Workers Deployment

### Prerequisites
- Cloudflare Account
- `wrangler` CLI installed: `npm install -g wrangler`
- GitHub account with this repo

### Step 1: Create KV Namespace

```bash
wrangler kv:namespace create "STREAMING_KV"
```

Copy the namespace ID from output.

### Step 2: Update wrangler.toml

```toml
name = "live-streaming-app"
type = "javascript"
main = "src/index.js"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "STREAMING_KV"
id = "YOUR_KV_NAMESPACE_ID"  # Replace with your ID
preview_id = "YOUR_PREVIEW_ID"
```

### Step 3: Push to Cloudflare

```bash
# Deploy Worker
wrangler publish

# Get your Worker URL
# It will be: https://live-streaming-app.YOUR_ACCOUNT.workers.dev
```

### Step 4: Deploy Static Site to Cloudflare Pages

Option A: Using Cloudflare Dashboard
1. Connect your GitHub repo to Cloudflare Pages
2. Set build command: `npm install` (no build needed)
3. Set publish directory: `public`
4. Deploy

Option B: Using CLI
```bash
wrangler pages publish public
```

### Step 5: Connect Frontend to Backend

Update your Cloudflare Pages project:

1. Go to Settings → Environment variables
2. Add: `API_BASE = https://YOUR_WORKER_URL`
3. Rebuild the site

OR modify `public/app.js` to use your Worker URL:

```javascript
const API_BASE = 'https://live-streaming-app.YOUR_ACCOUNT.workers.dev';
```

### Step 6: Update CORS

In `src/index.js`, update corsHeaders if needed:

```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://your-pages-domain.pages.dev',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': '*'
};
```

---

## Architecture

- **Frontend**: Deployed on Cloudflare Pages (static HTML, CSS, JS)
- **Backend**: Cloudflare Worker (serverless functions)
- **Cache**: Cloudflare KV Store (distributed cache)
- **Video Segments**: Proxied through Worker with proper headers

---

## Troubleshooting

### Error: Failed to connect to server
- Verify Worker URL is correct
- Check CORS headers in `src/index.js`
- Ensure KV namespace is bound correctly

### Stream won't play
- Check browser console for errors
- Verify M3U_URL is accessible
- Check Cloudflare Worker logs: `wrangler tail`

### Segments timing out
- Increase timeout in `src/index.js`
- Check CDN availability
- Verify stream URL format

### KV errors
- Recreate namespace: `wrangler kv:namespace create "STREAMING_KV"`
- Update binding in wrangler.toml
- Check quota: `wrangler kv:key list`

---

## Project Structure

```
.
├── public/
│   ├── index.html       # Main app
│   ├── app.js           # Frontend logic
│   └── styles.css       # Styling
├── src/
│   └── index.js         # Cloudflare Worker
├── server.js            # Local dev server
├── wrangler.toml        # Cloudflare config
├── package.json
└── README.md
```

---

## Environment Variables

### Local (.env)
```
PORT=3000
M3U_URL=https://raw.githubusercontent.com/abusaeeidx/...
```

### Cloudflare Pages
- `API_BASE`: Worker URL

### Cloudflare KV
- `STREAMING_KV`: Namespace for caching

---

## Performance Optimization

1. **Caching**: 5-minute TTL on channels
2. **Workers**: Distributed globally
3. **KV**: Low-latency key-value store
4. **Segments**: HTTP keep-alive for faster transfers

---

## Scaling

- Cloudflare Workers handles unlimited requests
- KV store scales automatically
- Pages CDN distributes static content globally

---

## Support

For issues, check:
1. Cloudflare Dashboard → Logs
2. Browser Console (F12)
3. Worker errors: `wrangler tail`
