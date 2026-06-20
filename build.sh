#!/bin/bash
# Build script for Cloudflare Pages

# Copy public folder (static files)
cp -r public/* .

# Start Node.js server in background
node server.js &
SERVER_PID=$!

# Keep the server running
wait $SERVER_PID
