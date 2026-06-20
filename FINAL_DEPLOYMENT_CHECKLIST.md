# Final Deployment Checklist

## ✅ Pre-Deployment

- [x] All test files deleted
- [x] Frontend updated with API_BASE support
- [x] Backend (Worker) created in `src/index.js`
- [x] wrangler.toml configured
- [x] package.json updated
- [x] Documentation created

---

## 🚀 Deployment Steps

### Step 1: Local Testing (Verify Everything Works)

```bash
npm install
npm start
# Visit http://localhost:3000
# Test:
# - Channel list loads
# - Can select and play a channel
# - Video displays
# - Search works
```

**Expected**: App works perfectly locally ✓

---

### Step 2: Cloudflare Worker Setup

```bash
# Install wrangler globally
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create KV namespace
wrangler kv:namespace create "STREAMING_KV"
```

**Copy the output** - you'll need the ID

---

### Step 3: Update wrangler.toml

```toml
name = "live-streaming-app"
type = "javascript"
main = "src/index.js"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "STREAMING_KV"
id = "PASTE_YOUR_ID_HERE"
preview_id = "PASTE_YOUR_PREVIEW_ID_HERE"
```

---

### Step 4: Deploy Worker

```bash
wrangler publish
```

**Result**: You'll get a URL like:
```
https://live-streaming-app.YOUR_ACCOUNT.workers.dev
```

**Save this URL!** ← IMPORTANT

---

### Step 5: Push to GitHub

```bash
git add .
git commit -m "Ready for Cloudflare deployment"
git push origin main
```

---

### Step 6: Connect to Cloudflare Pages

1. Go to https://pages.cloudflare.com/
2. Click "Create a project"
3. Connect GitHub account
4. Select this repository
5. Configure build:
   - **Framework**: None
   - **Build command**: `npm install`
   - **Build output directory**: `public`
6. Save and deploy

---

### Step 7: Add Environment Variable to Pages

1. In Cloudflare Dashboard
2. Navigate to Pages → Your Project
3. Go to Settings → Environment variables
4. Add:
   - **Variable name**: `API_BASE`
   - **Value**: `https://live-streaming-app.YOUR_ACCOUNT.workers.dev` (from Step 4)
5. Save

---

### Step 8: Redeploy Pages

1. Go back to Deployments
2. Trigger a new deployment by pushing to GitHub or using "Retry Deployment"
3. Wait for build to complete

---

## ✅ Post-Deployment Verification

### Check 1: Worker is Running
```bash
curl https://live-streaming-app.YOUR_ACCOUNT.workers.dev/api/status
```

Expected response:
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Check 2: Pages are Live
Visit: `https://your-project.pages.dev`

Expected: App loads (but will show error if Step 7 not done)

### Check 3: Can Get Channels
In browser console:
```javascript
fetch('https://your-project.pages.dev/api/channels')
  .then(r => r.json())
  .then(d => console.log(d))
```

Expected: List of channels

### Check 4: Can Play Stream
1. Go to your Pages URL
2. Select a channel
3. Click PLAY
4. Video should play

---

## 🐛 If Getting "Failed to connect to server"

**Check 1: API_BASE Environment Variable**
- In Pages Settings → Environment variables
- Verify exactly matches your Worker URL
- No typos, no trailing slashes

**Check 2: CORS**
- Open browser DevTools → Network
- Click on `/api/channels` request
- Check Response Headers for:
  - `Access-Control-Allow-Origin: *`

**Check 3: Worker Logs**
```bash
wrangler tail
```

**Check 4: Test Worker Directly**
```bash
curl https://live-streaming-app.YOUR_ACCOUNT.workers.dev/api/channels
```

---

## 📊 Performance Checks

### Metrics to Monitor

1. **Page Load Time**: Should be <2 seconds
2. **Channel Loading**: Should be <1 second
3. **Stream Start**: Should be <5 seconds
4. **Playback**: Smooth without buffering

### Cloudflare Dashboard

1. Go to Pages → Deployments
2. Check "Last deployed" is recent
3. Look for any error indicators

---

## 🎯 Success Indicators

✅ Pages URL loads  
✅ Channels display  
✅ Can search/filter  
✅ Can select channel  
✅ Click PLAY → video starts  
✅ Video displays in fullscreen  
✅ Audio works  
✅ No console errors  

---

## 📝 Important URLs

After deployment, save these:

```
Pages URL: https://YOUR-PROJECT.pages.dev
Worker URL: https://live-streaming-app.YOUR_ACCOUNT.workers.dev
```

---

## 🔄 Updating

### Update Frontend
```bash
# Make changes to public/
git push origin main
# Pages auto-redeploys
```

### Update Backend
```bash
# Make changes to src/index.js
wrangler publish
```

---

## 🆘 Rollback

### If Pages broke
- Go to Deployments
- Click "Rollback" on previous version

### If Worker broke
```bash
# Deploy previous version
git checkout previous-commit-hash -- src/index.js
wrangler publish
```

---

## 📞 Getting Help

### Common Issues

**1. "Failed to connect"**
- Check API_BASE in Environment variables
- Test Worker with curl

**2. "404 on segments"**
- Check KV namespace is bound
- View logs: `wrangler tail`

**3. "Timeout errors"**
- Some CDNs are slow
- Try different channels
- Timeout already increased to 30s

**4. "Video won't play"**
- Check browser console errors
- Try another channel
- Check network tab for failed requests

---

## ✨ Final Notes

1. **Cloudflare is free** for Pages + Workers with generous quotas
2. **No credit card required** (unless you exceed free tier)
3. **Automatically scales** - no maintenance needed
4. **Works globally** - fast for users everywhere
5. **Caches channels** for 5 minutes to reduce requests

---

## 🎉 You're Done!

Your live streaming app is now deployed to Cloudflare Pages + Workers!

Share your Pages URL with anyone and they can start streaming immediately.

---

**Questions? Check the logs:**
```bash
wrangler tail
```

**Need help? See DEPLOYMENT.md for detailed guide**
