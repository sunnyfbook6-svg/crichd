# Deploy Now - Step by Step

## ✅ Everything is Ready!

Your project is configured for Cloudflare Pages + Workers. Follow these simple steps:

---

## Step 1: Push to GitHub (if not done)

```bash
git add .
git commit -m "Ready for Cloudflare deployment"
git push origin main
```

---

## Step 2: Create Cloudflare Worker (5 minutes)

### Get Wrangler
```bash
npm install -g wrangler
```

### Login
```bash
wrangler login
```

### Create KV Namespace
```bash
wrangler kv:namespace create "STREAMING_KV"
```

**Save the output!** You'll see:
```
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
preview_id = "yyyyyyyyyyyyyyyyyyyyyyyyyyyy"
```

---

## Step 3: Configure Worker (2 minutes)

Open `wrangler.toml` and add your KV binding:

```toml
[[kv_namespaces]]
binding = "STREAMING_KV"
id = "YOUR_ID_HERE"
preview_id = "YOUR_PREVIEW_ID_HERE"
```

---

## Step 4: Deploy Worker (2 minutes)

```bash
wrangler publish
```

**You'll get a URL like:**
```
https://live-streaming-app.YOUR_ACCOUNT.workers.dev
```

**Copy this URL! You'll need it.**

---

## Step 5: Update Redirect File (1 minute)

Open `public/_redirects`

Replace `YOUR_ACCOUNT` with your actual Cloudflare account name:

```
/api/* https://live-streaming-app.YOUR_ACCOUNT.workers.dev/api/:splat 200!
```

Example:
```
/api/* https://live-streaming-app.myaccount.workers.dev/api/:splat 200!
```

Push this change:
```bash
git add public/_redirects
git commit -m "Add Worker URL to redirects"
git push origin main
```

---

## Step 6: Deploy to Pages (5 minutes)

1. Go to https://pages.cloudflare.com/
2. Click "Create a project"
3. Select GitHub and your repository
4. Set build settings:
   - **Build command:** (leave empty)
   - **Build output directory:** `public`
5. Click "Save and Deploy"

**Wait for deployment to complete** (usually 1-2 minutes)

---

## Step 7: Verify (2 minutes)

### Test 1: Worker is running
```bash
curl https://live-streaming-app.YOUR_ACCOUNT.workers.dev/api/status
```

Should return:
```json
{"success":true,"message":"API is running"}
```

### Test 2: Visit your Pages site
Go to: `https://your-project.pages.dev`

### Test 3: Try streaming
1. Select a channel from the list
2. Click **PLAY**
3. Video should appear and play

---

## ✅ Success Checklist

- [ ] Worker deployed (`wrangler publish` succeeded)
- [ ] `public/_redirects` updated with Worker URL
- [ ] Changes pushed to GitHub
- [ ] Pages deployment complete
- [ ] Channels load on Pages site
- [ ] Can select and play a channel
- [ ] Video appears and plays

---

## 🐛 Troubleshooting

### "Failed to connect to server"
- Check `public/_redirects` has correct Worker URL
- Redeploy to Pages
- Check logs: `wrangler tail`

### "404 on API calls"
- Verify `public/_redirects` exists
- Check the URL format is exactly right
- Redeploy to Pages

### "Workers error: 500"
- Check logs: `wrangler tail`
- Verify KV namespace is in `wrangler.toml`
- Redeploy: `wrangler publish`

---

## 📊 What You Have

```
Frontend (Pages):
- https://your-project.pages.dev

Backend (Worker):
- https://live-streaming-app.YOUR_ACCOUNT.workers.dev

API Endpoints:
- /api/channels
- /api/stream/:id
- /api/segment/:id
- /api/refresh
- /api/status
```

---

## 🎉 You're Done!

Your app is live! Share your Pages URL and people can stream from anywhere in the world.

---

## 📚 For More Help

- **Cloudflare Pages Docs**: https://developers.cloudflare.com/pages/
- **Cloudflare Workers Docs**: https://developers.cloudflare.com/workers/
- **KV Store Docs**: https://developers.cloudflare.com/workers/runtime-apis/kv/
- **View Logs**: `wrangler tail`

---

## 💡 Quick Commands

```bash
# Deploy Worker
wrangler publish

# View logs
wrangler tail

# Deploy Pages
git push origin main  # Auto-deploys

# Test API
curl https://live-streaming-app.YOUR_ACCOUNT.workers.dev/api/channels
```

---

**Questions? Check the logs first:** `wrangler tail`
