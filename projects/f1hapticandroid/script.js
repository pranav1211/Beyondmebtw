// ============================================================
// CONFIG - Replace with your GoatCounter site code
// Sign up free at https://www.goatcounter.com (30 seconds)
// ============================================================
const GC_SITE = 'YOUR_SITE_CODE';

// ============================================================
// Bot Detection
// ============================================================
function isBot() {
  if (navigator.webdriver) return true;
  const ua = navigator.userAgent || '';
  if (ua.length < 10) return true;
  const botPattern = /bot|crawler|spider|crawling|headless|phantom|selenium|puppeteer|lighthouse|pagespeed|pingdom|uptimerobot/i;
  return botPattern.test(ua);
}

// ============================================================
// GoatCounter - Analytics & Counter Badge
// ============================================================
function initGoatCounter() {
  if (isBot()) return;
  if (!GC_SITE || GC_SITE === 'YOUR_SITE_CODE') return;

  // Load GoatCounter tracking script
  const gcScript = document.createElement('script');
  gcScript.async = true;
  gcScript.dataset.goatcounter = `https://${GC_SITE}.goatcounter.com/count`;
  gcScript.src = '//gc.zgo.at/count.js';
  document.body.appendChild(gcScript);

  // Fetch and display visitor count badge
  updateCounterBadge();
}

function updateCounterBadge() {
  const badge = document.getElementById('visitorCounter');
  if (!badge) return;

  // Check sessionStorage cache (refresh every 5 min)
  const cached = sessionStorage.getItem('gc_count');
  const cachedTime = sessionStorage.getItem('gc_count_time');
  if (cached && cachedTime && (Date.now() - Number(cachedTime)) < 300000) {
    showBadge(badge, JSON.parse(cached));
    return;
  }

  const pagePath = encodeURIComponent(location.pathname);
  fetch(`https://${GC_SITE}.goatcounter.com/counter/${pagePath}.json`)
    .then(r => r.json())
    .then(data => {
      sessionStorage.setItem('gc_count', JSON.stringify(data));
      sessionStorage.setItem('gc_count_time', String(Date.now()));
      showBadge(badge, data);
    })
    .catch(() => {});
}

function showBadge(badge, data) {
  const uniqueEl = badge.querySelector('.count');
  if (uniqueEl && data.count_unique) {
    uniqueEl.textContent = data.count_unique;
    badge.classList.add('loaded');
  }
}

// ============================================================
// YouTube Player
// ============================================================
const tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

const testBtn = document.getElementById('testVibration');
const vibeStatus = document.getElementById('vibeStatus');
const fullscreenBtn = document.getElementById('fullscreenBtn');

let player;
let isPlaying = false;

if (!('vibrate' in navigator)) {
  vibeStatus.textContent = '⚠️ Your device/browser does not support vibration.';
}

testBtn.addEventListener('click', () => {
  if ('vibrate' in navigator) {
    navigator.vibrate([200, 100, 200]);
  }
});

window.onYouTubeIframeAPIReady = function () {
  player = new YT.Player('video', {
    videoId: 'v5x-3tQcSrY',
    playerVars: {
      playsinline: 1,
      controls: 1,
      rel: 0,
      modestbranding: 1,
      vq: 'hd720'
    },
    events: {
      onStateChange: onPlayerStateChange,
      onReady: onPlayerReady
    }
  });
};

function onPlayerReady(event) {
  const availableQualities = player.getAvailableQualityLevels();
  if (availableQualities.includes('hd720')) {
    player.setPlaybackQuality('hd720');
  } else if (availableQualities.includes('hd1080')) {
    player.setPlaybackQuality('hd1080');
  }

  if (screen.orientation && screen.orientation.lock) {
    screen.orientation.lock('landscape').catch(() => {});
  }
}

// ============================================================
// Fullscreen
// ============================================================
fullscreenBtn.addEventListener('click', async () => {
  if (!player) return;

  try {
    player.playVideo();

    if (screen.orientation && screen.orientation.lock) {
      try {
        await screen.orientation.lock('landscape');
      } catch (err) {
        // orientation lock not supported
      }
    }

    setTimeout(() => {
      const iframe = document.getElementById('video');
      if (iframe.requestFullscreen) {
        iframe.requestFullscreen();
      } else if (iframe.webkitRequestFullscreen) {
        iframe.webkitRequestFullscreen();
      } else if (iframe.msRequestFullscreen) {
        iframe.msRequestFullscreen();
      }
    }, 200);
  } catch (error) {
    console.log('Play failed:', error);
  }
});

// ============================================================
// Vibration Engine
// ============================================================
const vibrationEvents = [
  { time: 6.8, duration: 100 },
  { time: 8.0, duration: 100 },
  { time: 12.8, duration: 1900 },
  { time: 16.7, duration: 100 },
  { time: 17.9, duration: 100 },
  { time: 18.7, duration: 1300 },
  { time: 21.9, duration: 3700 },
  { time: 34.6, pattern: [200, 200, 200, 200, 200, 200, 200, 300, 200, 100, 200] },
  { time: 48.1, pattern: [100, 100, 200] },
  { time: 75.3, pattern: [100, 100, 2200] },
  { time: 81.3, pattern: [300, 200, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100] },
  { time: 89.0, pattern: [100, 100, 100] },
  { time: 91.8, duration: 500 },
  { time: 96.5, duration: 2700 },
  { time: 105.2, pattern: [2900, 50, 2350] },
  { time: 110.7, pattern: [100, 300, 100, 100, 100, 50, 5450] },
  { time: 117.0, pattern: [100, 300, 100, 0, 3600] }
];

vibrationEvents.forEach(event => {
  if (event.pattern) {
    event.total = event.pattern.reduce((a, b) => a + b, 0);
  } else {
    event.total = event.duration;
  }
  event.end = event.time + event.total / 1000;
});

let currentVibe = null;
let rafId = null;

function stopVibration() {
  navigator.vibrate(0);
  currentVibe = null;
}

function checkVibrations() {
  if (!player || !isPlaying) return;

  const t = player.getCurrentTime();

  if (currentVibe && t > currentVibe.end) {
    stopVibration();
  }

  if (!currentVibe) {
    const event = vibrationEvents.find(e => t >= e.time && t < e.end);
    if (event) {
      const elapsed = (t - event.time) * 1000;
      let remainingPattern;

      if (event.pattern) {
        let acc = 0;
        let idx = 0;
        while (idx < event.pattern.length && acc + event.pattern[idx] <= elapsed) {
          acc += event.pattern[idx];
          idx++;
        }
        if (idx < event.pattern.length) {
          remainingPattern = [...event.pattern.slice(idx)];
          remainingPattern[0] = Math.max(0, remainingPattern[0] - (elapsed - acc));
        }
      } else {
        const remaining = Math.max(0, event.duration - elapsed);
        remainingPattern = remaining;
      }

      if ((Array.isArray(remainingPattern) && remainingPattern.length > 0) || (typeof remainingPattern === 'number' && remainingPattern > 0)) {
        navigator.vibrate(remainingPattern);
        currentVibe = event;
      }
    }
  }

  rafId = requestAnimationFrame(checkVibrations);
}

function startChecking() {
  cancelAnimationFrame(rafId);
  isPlaying = true;
  rafId = requestAnimationFrame(checkVibrations);
}

function stopChecking() {
  isPlaying = false;
  stopVibration();
  cancelAnimationFrame(rafId);
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.PLAYING) {
    startChecking();
  } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
    stopChecking();
  }
}

// ============================================================
// Init
// ============================================================
initGoatCounter();
