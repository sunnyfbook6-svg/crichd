# Simple Cloudflare Pages Setup

## Problem
Cloudflare Pages is **static hosting only** - it can't run Node.js. But we need a backend for:
- Fetching m3u8 playlists
- Proxying video segments
- Adding proper headers

## Solution
Use **Cloudflare Workers** (serverless backend) + **Cloudflare Pages** (static frontend)

---

## Setup Instructions

### Step 1: Update Files Locally

The files are already set up! Just make sure you have:

```
public/
├── index.html
├── app.js
├── styles.css
├── _headers       ✓ (created)
└── _redirects     ✓ (created)

src/
└── index.js       ✓ (Worker code)

wrangler.toml     ✓ (Worker config)
```

### Step 2: Push to GitHub

```bash
git add .
git commit -m "Cloudflare Pages + Workers setup"
git push origin main
```

### Step 3: Create Cloudflare Worker

**Option A: Using Wrangler CLI (Recommended)**

```bash
# Install wrangler globally (if not already)
npm install -g wrangler

# Login
wrangler login

# Create KV namespace
wrangler kv:namespace create "STREAMING_KV"
```

You'll get output:
```
✓ Created namespace with title "live-streaming-app-STREAMING_KV"

[[kv_namespaces]]
binding = "STREAMING_KV"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
preview_id = "yyyyyyyyyyyyyyyyyyyyyyyyyyyy"
```

### Step 4: Update wrangler.toml

Open `wrangler.toml` and paste the KV binding:

```toml
name = "live-streaming-app"
type = "javascript"
main = "src/index.js"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "STREAMING_KV"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
preview_id = "yyyyyyyyyyyyyyyyyyyyyyyyyyyy"
```

### Step 5: Deploy Worker

```bash
wrangler publish
```

After deployment, note your Worker URL:
```
https://live-streaming-app.YOUR_ACCOUNT.workers.dev
```

### Step 6: Update Pages Redirect

Edit `public/_redirects` and replace `YOUR_ACCOUNT`:

```
/api/* https://live-streaming-app.YOUR_ACCOUNT.workers.dev/api/:splat 200!
```

### Step 7: Deploy to Cloudflare Pages

**Option A: Automatic (Recommended)**

1. Go to https://pages.cloudflare.com/
2. Click "Create a project"
3. Connect GitHub
4. Select your repository
5. Set build settings:
   - Build command: (leave empty - we don't need build)
   - Build output directory: `public`
6. Click Deploy

**Option B: Manual**

```bash
wrangler pages publish public
```

---

## Verify It Works

1. **Check Worker is running:**
   ```bash
   curl https://live-streaming-app.YOUR_ACCOUNT.workers.dev/api/status
   ```

   Expected response:
   ```json
   {"success":true,"message":"API is running"}
   ```

2. **Visit your Pages URL:**
   ```
   https://your-project.pages.dev
   ```

3. **Test streaming:**
   - Channels should load
   - Click a channel
   - Click PLAY
   - Video should play!

---

## If Getting Errors

### Error: "Failed to connect to server"

**Fix 1: Check _redirects is correct**
- Edit `public/_redirects`
- Replace `YOUR_ACCOUNT` with actual account name
- Push to GitHub
- Redeploy

**Fix 2: Verify Worker URL**
```bash
wrangler publish --dry-run
```

**Fix 3: Check logs**
```bash
wrangler tail
```

### Error: "Cannot find KV namespace"

**Fix:**
```bash
# List namespaces
wrangler kv:namespace list

# Recreate if needed
wrangler kv:namespace create "STREAMING_KV"

# Update wrangler.toml with new ID
```

### Error: "404 on API calls"

**Fix:**
- Make sure _redirects file exists in `public/`
- Check the format is correct
- Redeploy to Pages

---

## File Reference

### For Frontend Only
Just copy `public/` folder to any static host

### For Backend Only (if using different host)
```bash
wrangler publish src/index.js
```

### For Local Development
```bash
npm start
# Visit http://localhost:3000
```

---

## Architecture

```
User Browser
    ↓
Cloudflare Pages (CDN)
    ↓
Cloudflare Worker (Serverless API)
    ↓
CDN Streams (Star Sports, etc.)
```

---

## Performance

✅ Pages: Distributed globally on CDN  
✅ Workers: No cold starts, instant scale  
✅ KV: Low-latency cache for channels  
✅ Segments: Direct from CDN (no bottleneck)  

---

## Cost

- **Pages**: Free
- **Workers**: Free (generous quota)
- **KV**: Free (3GB storage)

Total: **FREE** (unless you hit extreme quotas)

---

## Next Steps

1. Follow steps 1-7 above
2. Test locally with `npm start`
3. Verify on Cloudflare
4. Share your Pages URL!

---

## Commands Reference

```bash
# Local development
npm start

# Deploy Worker
wrangler publish

# Deploy Pages
wrangler pages publish public

# View logs
wrangler tail

# List KV namespaces
wrangler kv:namespace list

# Test API
curl https://your-worker.workers.dev/api/channels
```

---

**Questions?** Check the logs: `wrangler tail`
