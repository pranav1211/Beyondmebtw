// ============================================================
// F1 Start-Light Loading Sequence
// 5 red lights illuminate one-by-one, hold, then "lights out"
// and the page is revealed.
// ============================================================
(function () {
  const overlay = document.getElementById('startLights');
  if (!overlay) return;

  const lights = overlay.querySelectorAll('.switch');
  const audioEl = document.getElementById('startAudio');

  // When each light illuminates (ms from sequence start). These match
  // the beep onsets in starting-lights.mp3: ~0.5s lead, then 1s apart.
  // (If the cut differs, re-tune these to the file's real onsets.)
  const LIGHT_TIMES = [500, 1500, 2500, 3500, 4500];
  const LIGHTS_OUT = 5400;  // all lights cut to black ("lights out")
  const HOLD_CAPTION = 2000; // dwell on the caption before revealing
  const FADE = 600;          // overlay fade (matches CSS transition)

  // keep the page from scrolling while the sequence plays
  document.body.style.overflow = 'hidden';

  let started = false;

  // ----------------------------------------------------------
  // Light + reveal choreography (runs once audio is going, or
  // immediately if there's no audio element).
  // ----------------------------------------------------------
  function reveal() {
    overlay.classList.add('done');
    document.body.style.overflow = '';
    // choreograph the content in as the lights clear
    if (window.runEntrance) window.runEntrance();
    setTimeout(() => overlay.remove(), FADE + 50);
  }

  function runVisuals() {
    if (started) return;
    started = true;
    overlay.classList.remove('await-start');

    LIGHT_TIMES.forEach((t, i) => {
      setTimeout(() => { if (lights[i]) lights[i].classList.add('lit'); }, t);
    });

    // lights out: all go dark at once, caption flashes
    setTimeout(() => {
      lights.forEach((light) => light.classList.remove('lit'));
      overlay.classList.add('out');
    }, LIGHTS_OUT);

    // hold on the caption so the user can read it, then reveal
    setTimeout(reveal, LIGHTS_OUT + HOLD_CAPTION);
  }

  // ----------------------------------------------------------
  // Audio gating.
  //
  // Readiness (buffered) and permission (autoplay) are separate:
  // preloading removes stutter, but browsers still only allow
  // sound after a user gesture. So: try to autoplay; if the
  // browser blocks it, show a one-tap "start" gate. Either way
  // the lights start in lockstep with the sound.
  // ----------------------------------------------------------
  function playAudioThen(onPlaying, onBlocked) {
    if (!audioEl) { onPlaying(); return; }       // no audio → just run visuals
    try { audioEl.currentTime = 0; } catch (e) { /* not seekable yet */ }

    let p;
    try { p = audioEl.play(); } catch (e) { p = null; }

    if (p && typeof p.then === 'function') {
      // start visuals the moment playback actually begins → tight sync
      p.then(onPlaying).catch(onBlocked);
    } else {
      // older browsers: no promise, assume it started
      onPlaying();
    }
  }

  function waitForTap() {
    overlay.classList.add('await-start');   // reveals the "Tap to start" hint

    function onGesture() {
      overlay.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('keydown', onGesture);
      // we now have a user gesture → audio is allowed
      playAudioThen(runVisuals, runVisuals);  // run regardless on the gesture
    }

    overlay.addEventListener('pointerdown', onGesture);
    window.addEventListener('keydown', onGesture);
  }

  // Wait until the audio is buffered enough to play gap-free, then
  // attempt the auto-start. Cap the wait so a slow/failed load never
  // stalls the intro.
  function startWhenReady() {
    let fired = false;
    function go() {
      if (fired) return;
      fired = true;
      if (audioEl) {
        audioEl.removeEventListener('canplaythrough', go);
        audioEl.removeEventListener('loadeddata', go);
        audioEl.removeEventListener('error', go);
      }
      // try to autoplay; if blocked, fall back to the tap gate
      playAudioThen(runVisuals, waitForTap);
    }

    if (!audioEl || audioEl.readyState >= 3 /* HAVE_FUTURE_DATA */) {
      go();
    } else {
      audioEl.addEventListener('canplaythrough', go);
      audioEl.addEventListener('loadeddata', go);
      audioEl.addEventListener('error', go);   // file missing/failed → don't stall
      setTimeout(go, 2500); // don't wait forever on a slow connection
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startWhenReady);
  } else {
    startWhenReady();
  }
})();

// ============================================================
// Entrance choreography (anime.js, progressive enhancement)
// Content fades + slides up in a stagger as the lights clear.
// If anime.js fails to load or the user prefers reduced motion,
// everything stays plainly visible — nothing is ever stuck hidden.
// ============================================================
(function () {
  const prefersReduced =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const animEnabled = !!window.anime && !prefersReduced;

  const items = Array.from(document.querySelectorAll('.anim-item'));

  // hide the items up front ONLY when we can actually animate them
  if (animEnabled && items.length) {
    document.body.classList.add('anim-ready');
  }

  let played = false;
  window.runEntrance = function () {
    if (played) return;
    played = true;
    if (!animEnabled || !items.length) return;

    window.anime({
      targets: items,
      opacity: [0, 1],
      translateY: [26, 0],
      duration: 760,
      delay: window.anime.stagger(110, { start: 120 }),
      easing: 'easeOutCubic'
    });
  };

  // Safety nets so content is never stuck invisible:
  // if the lights overlay is missing, reveal once the page loads;
  // and a hard failsafe in case the sequence never calls us.
  if (!document.getElementById('startLights')) {
    window.addEventListener('load', window.runEntrance);
  }
  setTimeout(window.runEntrance, 12000);
})();

// ============================================================
// Visitor Counter Badge (populated by /analytics.js via GoatCounter)
// ============================================================
(function () {
  var check = setInterval(function () {
    var badge = document.getElementById('visitorCounter');
    var countEl = badge && badge.querySelector('.goatcounter-count');
    if (countEl && countEl.textContent.trim()) {
      badge.classList.add('loaded');
      clearInterval(check);
    }
  }, 1000);
  setTimeout(function () { clearInterval(check); }, 15000);
})();


// ============================================================
// YouTube Player
// ============================================================
const tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

const testBtn = document.getElementById('testVibration');
const vibeStatus = document.getElementById('vibeStatus');
const vibeConfirm = document.getElementById('vibeConfirm');
const vibeYes = document.getElementById('vibeYes');
const vibeNo = document.getElementById('vibeNo');
const fullscreenBtn = document.getElementById('fullscreenBtn');

let player;
let isPlaying = false;

// ------------------------------------------------------------
// Vibration test + confirmation flow.
// The Vibration API can't report whether the motor actually
// fired, so we ask the user and branch on their answer.
// ------------------------------------------------------------
const hasVibrate = 'vibrate' in navigator;

function setVibeStatus(html, type) {
  vibeStatus.innerHTML = html;
  vibeStatus.className = 'vibe-status' + (type ? ' ' + type : '');
}

if (!hasVibrate) {
  testBtn.disabled = true;
  setVibeStatus(
    "⚠️ Your device or browser doesn't support vibration — you'll still get the full audio experience.",
    'warn'
  );
}

testBtn.addEventListener('click', () => {
  if (!hasVibrate) return;

  // a noticeable double-pulse so it's unmistakable
  const fired = navigator.vibrate([200, 100, 200, 100, 300]);

  setVibeStatus('', null);

  // false = the browser rejected the request outright
  if (fired === false) {
    setVibeStatus(
      "⚠️ The browser blocked that vibration. It's often Do Not Disturb or a power-saving mode — turn those off and try again.",
      'warn'
    );
    vibeConfirm.hidden = true;
    return;
  }

  vibeConfirm.hidden = false;
});

if (vibeYes) {
  vibeYes.addEventListener('click', () => {
    vibeConfirm.hidden = true;
    setVibeStatus("✅ You're all set — haptics are working. Enjoy the ride!", 'success');
  });
}

if (vibeNo) {
  vibeNo.addEventListener('click', () => {
    vibeConfirm.hidden = true;
    setVibeStatus(
      "Didn't feel anything? Try these, then tap <strong>Test Vibration</strong> again:" +
      '<ul class="fix-list">' +
      '<li>Turn off Silent / Do Not Disturb mode</li>' +
      '<li>Disable battery saver / power saving mode</li>' +
      '<li>Enable vibration / haptics in your system settings</li>' +
      '<li>Make sure your phone isn\'t on a desk that muffles the buzz</li>' +
      '</ul>',
      'warn'
    );
  });
}

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
//
// requestFullscreen() needs "transient user activation" — it must
// run synchronously inside the click, BEFORE any await/setTimeout,
// or mobile browsers silently reject it (the old intermittent bug).
// So: request fullscreen first, then play + lock orientation.
// ============================================================
fullscreenBtn.addEventListener('click', () => {
  if (!player) return;

  const iframe = document.getElementById('video');
  const requestFs =
    iframe.requestFullscreen ||
    iframe.webkitRequestFullscreen ||
    iframe.msRequestFullscreen;

  let fsPromise;
  if (requestFs) {
    try {
      // call within the gesture; may or may not return a promise
      fsPromise = requestFs.call(iframe);
    } catch (err) {
      // fullscreen unavailable (e.g. iOS Safari blocks iframe FS)
    }
  }

  // start playback in the same gesture
  player.playVideo();

  // lock orientation only after we're actually in fullscreen,
  // since most browsers reject the lock otherwise
  const lockLandscape = () => {
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('landscape').catch(() => {});
    }
  };

  if (fsPromise && typeof fsPromise.then === 'function') {
    fsPromise.then(lockLandscape).catch(() => {});
  } else {
    // no promise returned (older webkit) — give FS a beat to settle
    setTimeout(lockLandscape, 250);
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

