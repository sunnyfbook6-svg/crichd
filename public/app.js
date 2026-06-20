// Global State
let allChannels = [];
let currentChannelIndex = -1;
let player = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializePlayer();
    loadChannels();
    setupEventListeners();
    updateCacheStatus();
    
    // Update cache status every 10 seconds
    setInterval(updateCacheStatus, 10000);
});

/**
 * Initialize Plyr Player
 */
function initializePlayer() {
    const videoElement = document.querySelector('video');
    
    // Initialize Plyr
    player = new Plyr(videoElement, {
        type: 'video',
        controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'captions', 'settings', 'pip', 'fullscreen'],
        settings: ['captions', 'quality', 'speed'],
        autoplay: false,
        autopause: true,
        fullscreen: { enabled: true }
    });
    
    // Add event listeners
    player.on('play', function() {
        console.log('▶ Playing');
        updateStatus('Playing', true);
    });
    
    player.on('pause', function() {
        console.log('⏸ Paused');
        updateStatus('Paused', true);
    });
    
    player.on('ended', function() {
        console.log('⏹ Stream ended');
        updateStatus('Stream ended', true);
    });
    
    player.on('error', function(error) {
        console.error('Player error:', error);
    });
    
    // Handle fullscreen button
    document.getElementById('fullscreenBtn').addEventListener('click', () => {
        player.fullscreen.enter();
    });
}

/**
 * Setup Event Listeners
 */
function setupEventListeners() {
    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => {
        filterChannels(e.target.value);
    });
    
    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', refreshPlaylist);
    
    // Stop button
    document.getElementById('stopBtn').addEventListener('click', stopStream);
}

/**
 * Load channels from API
 */
async function loadChannels() {
    try {
        updateStatus('Loading...');
        const response = await fetch('/api/channels');
        const data = await response.json();
        
        if (data.success) {
            allChannels = data.channels;
            renderChannels(allChannels);
            document.getElementById('channelCount').textContent = `${data.count} channels`;
            updateStatus('Online', true);
        } else {
            showError('Failed to load channels');
        }
    } catch (error) {
        console.error('Load error:', error);
        showError('Failed to connect to server');
    }
}

/**
 * Render channels list
 */
function renderChannels(channels) {
    const channelsList = document.getElementById('channelsList');
    
    if (channels.length === 0) {
        channelsList.innerHTML = '<div class="loading">No channels found</div>';
        return;
    }
    
    channelsList.innerHTML = channels.map((channel, index) => {
        const isActive = index === currentChannelIndex ? 'active' : '';
        
        return `
            <div class="channel-item ${isActive}" data-index="${index}" onclick="selectChannel(${index})">
                <span class="channel-item-name">${channel.name}</span>
            </div>
        `;
    }).join('');
}

/**
 * Filter channels by search
 */
function filterChannels(query) {
    if (!query.trim()) {
        renderChannels(allChannels);
        document.getElementById('channelCount').textContent = `${allChannels.length} channels`;
        return;
    }
    
    const filtered = allChannels.filter(ch =>
        ch.name.toLowerCase().includes(query.toLowerCase())
    );
    
    renderChannels(filtered);
    document.getElementById('channelCount').textContent = `${filtered.length} results`;
}

/**
 * Select and play channel
 */
function selectChannel(index) {
    try {
        // Find the actual channel in allChannels
        const searchQuery = document.getElementById('searchInput').value;
        let selectedChannel;
        
        if (searchQuery.trim()) {
            const filtered = allChannels.filter(ch =>
                ch.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            selectedChannel = filtered[index];
        } else {
            selectedChannel = allChannels[index];
        }
        
        if (!selectedChannel) return;
        
        currentChannelIndex = allChannels.indexOf(selectedChannel);
        
        // Update UI
        document.querySelectorAll('.channel-item').forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });
        
        document.getElementById('currentChannelName').textContent = selectedChannel.name;
        document.getElementById('streamUrl').textContent = selectedChannel.url.substring(0, 80) + '...';
        document.getElementById('statusText').textContent = 'Loading... please wait';
        document.getElementById('stopBtn').disabled = false;
        document.getElementById('fullscreenBtn').disabled = false;
        
        // Get actual index in allChannels for stream API
        const actualIndex = allChannels.indexOf(selectedChannel);
        
        // Load stream using Plyr
        console.log(`Loading channel: ${selectedChannel.name}`);
        
        const streamUrl = `/api/stream/${actualIndex}`;
        console.log(`Stream URL: ${streamUrl}`);
        
        // Set the source for Plyr with retry configuration
        player.source = {
            type: 'video',
            sources: [
                {
                    src: streamUrl,
                    type: 'application/x-mpegURL'
                }
            ],
            title: selectedChannel.name
        };
        
        // Play the stream with timeout handling
        const playPromise = player.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log('✅ Playback started');
                    document.getElementById('statusText').textContent = 'Playing...';
                })
                .catch(err => {
                    console.error('Playback error:', err);
                    // Don't show error immediately - HLS.js may still load
                    document.getElementById('statusText').textContent = 'Buffering...';
                    
                    // Set a timeout to show error if still not playing
                    setTimeout(() => {
                        if (!player.playing) {
                            document.getElementById('statusText').textContent = `⚠️ Stream buffering (may take longer)`;
                        }
                    }, 5000);
                });
        }
        
    } catch (error) {
        console.error('Selection error:', error);
        document.getElementById('statusText').textContent = `Error: ${error.message}`;
        showError('Failed to select channel: ' + error.message);
    }
}

/**
 * Stop stream
 */
function stopStream() {
    if (player) {
        player.pause();
        player.source = null;
    }
    
    currentChannelIndex = -1;
    document.getElementById('currentChannelName').textContent = 'No Channel Selected';
    document.getElementById('streamUrl').textContent = 'N/A';
    document.getElementById('statusText').textContent = 'Stopped';
    document.getElementById('stopBtn').disabled = true;
    document.getElementById('fullscreenBtn').disabled = true;
    document.querySelectorAll('.channel-item').forEach(item => {
        item.classList.remove('active');
    });
}

/**
 * Refresh playlist
 */
async function refreshPlaylist() {
    try {
        const btn = document.getElementById('refreshBtn');
        btn.disabled = true;
        btn.textContent = '🔄 Refreshing...';
        
        const response = await fetch('/api/refresh', { method: 'POST' });
        const data = await response.json();
        
        if (data.success) {
            await loadChannels();
            alert(`✓ Playlist refreshed! ${data.count} channels available`);
        } else {
            showError(data.error || 'Failed to refresh');
        }
    } catch (error) {
        console.error('Refresh error:', error);
        showError('Failed to refresh playlist');
    } finally {
        const btn = document.getElementById('refreshBtn');
        btn.disabled = false;
        btn.textContent = '🔄 Refresh';
    }
}

/**
 * Update cache status
 */
async function updateCacheStatus() {
    try {
        const response = await fetch('/api/status');
        const data = await response.json();
        
        if (data.success) {
            const lastFetch = new Date(data.last_fetch);
            const timeUntilRefresh = Math.ceil(data.cache_expires_in_ms / 1000);
            
            document.getElementById('cacheInfo').textContent =
                `${data.cached_channels} channels cached | Last update: ${lastFetch.toLocaleTimeString()} | Refresh in: ${timeUntilRefresh}s`;
        }
    } catch (error) {
        console.error('Status error:', error);
    }
}

/**
 * Update status badge
 */
function updateStatus(text, isOnline = false) {
    const badge = document.getElementById('statusBadge');
    badge.textContent = text;
    badge.classList.toggle('online', isOnline);
}

/**
 * Show error message
 */
function showError(message) {
    alert(`❌ Error: ${message}`);
    updateStatus('Error', false);
}
