# Quick Cloudflare Deployment Setup

## Step 1: Install Wrangler

```bash
npm install -g wrangler
```

## Step 2: Login to Cloudflare

```bash
wrangler login
```

## Step 3: Create KV Namespace

```bash
wrangler kv:namespace create "STREAMING_KV"
```

You'll see output like:
```
✓ Created namespace with title "live-streaming-app-STREAMING_KV"
Add the following to your wrangler.toml:

[[kv_namespaces]]
binding = "STREAMING_KV"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
preview_id = "yyyyyyyyyyyyyyyyyyyyyyyyyyyy"
```

## Step 4: Update wrangler.toml

Copy the ID and preview_id from above, then update `wrangler.toml`:

```toml
name = "live-streaming-app"
type = "javascript"
main = "src/index.js"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "STREAMING_KV"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
preview_id = "yyyyyyyyyyyyyyyyyyyyyyyyyyyy"
```

## Step 5: Deploy Worker

```bash
wrangler publish
```

After deployment, you'll get a URL like:
```
https://live-streaming-app.YOUR_ACCOUNT.workers.dev
```

**Save this URL!**

## Step 6: Create GitHub Repository

1. Push code to GitHub
2. Go to https://pages.cloudflare.com/
3. Select your GitHub repo
4. Set build settings:
   - **Build command**: `npm install`
   - **Build output directory**: `public`

## Step 7: Add Environment Variable to Pages

1. In Cloudflare Dashboard → Pages → Your Site → Settings → Environment variables
2. Add variable:
   - Name: `API_BASE`
   - Value: `https://live-streaming-app.YOUR_ACCOUNT.workers.dev` (your Worker URL)

## Step 8: Trigger Deployment

Pages will auto-deploy when you push to GitHub, or manually redeploy from dashboard.

---

## Testing

Once deployed:

1. Visit your Pages URL: `https://your-site.pages.dev`
2. Select a channel
3. Click PLAY
4. Video should stream!

## If Getting "Failed to connect to server"

1. **Check Worker is running**:
   ```bash
   wrangler tail
   ```

2. **Verify API_BASE in Pages settings**
   - Should be exactly: `https://live-streaming-app.YOUR_ACCOUNT.workers.dev`

3. **Check CORS headers**:
   - Open browser DevTools → Network tab
   - Look for API calls
   - Check Response Headers

4. **Test Worker directly**:
   ```bash
   curl https://live-streaming-app.YOUR_ACCOUNT.workers.dev/api/status
   ```

## Logs

View Worker logs:
```bash
wrangler tail
```

---

## Success Indicators

✅ Channels load  
✅ Can select and play streams  
✅ Video displays in player  
✅ Audio works  
✅ Seeking works  

---

## Support Commands

```bash
# View logs
wrangler tail

# Deploy worker only
wrangler publish

# Deploy pages
wrangler pages publish public

# Check KV storage
wrangler kv:key list --namespace-id=YOUR_ID

# Local preview
wrangler dev
```
