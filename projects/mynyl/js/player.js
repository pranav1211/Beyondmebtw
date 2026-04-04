// ─── state ─────────────────────────────────────────────────
let isPlaying = false, hasFile = false, duration = 0, currentTime = 0;
let rotAngle = 0;
let groovePulse = 0;
let lastRaf = null;
let isSpinningUp = false, spinUpStart = null;
const SPIN_UP_MS = 2000;
const playbackState = window.MYNYL_PLAYBACK_STATE || (window.MYNYL_PLAYBACK_STATE = { playing: false });

let armAngle, targetArmAngle;
let isDragging = false;
let pendingTimer = null;
let songIsOver = false;
let loadedFile  = null;

const THEMES = {
  wood: {
    cssHref: 'themes/wood/theme.css',
    scriptHref: 'themes/wood/theme.js',
    themeName: 'wood',
  },
  'minimal-light': {
    cssHref: 'themes/minimal-light/theme.css',
    scriptHref: 'themes/minimal-light/theme.js',
    themeName: 'minimal-light',
  },
  'disco-pop': {
    cssHref: 'themes/disco-pop/theme.css',
    scriptHref: 'themes/disco-pop/theme.js',
    themeName: 'disco-pop',
  },
};

function applyThemeSelection(themeName) {
  const themeConfig = THEMES[themeName] || THEMES.wood;
  const select = document.getElementById('theme-select');
  if (select && select.value !== themeName) select.value = themeName;
  if (window.setMynylTheme) window.setMynylTheme(themeConfig);
  try { localStorage.setItem('mynyl-theme', themeName); } catch {}
}

function initArmAngles() {
  armAngle = GEO.aParked;
  targetArmAngle = GEO.aParked;
}
initArmAngles();

window.addEventListener('mynyl:themechange', () => {
  if (isDragging) return;

  if (!hasFile || songIsOver) {
    armAngle = GEO.aParked;
    targetArmAngle = GEO.aParked;
    return;
  }

  if (isSpinningUp) {
    armAngle = GEO.aOuter;
    targetArmAngle = GEO.aOuter;
    return;
  }

  if (duration > 0 && (isPlaying || currentTime > 0)) {
    const p = Math.max(0, Math.min(1, currentTime / duration));
    const nextAngle = progressToAngle(p);
    armAngle = nextAngle;
    targetArmAngle = nextAngle;
    return;
  }

  armAngle = GEO.aParked;
  targetArmAngle = GEO.aParked;
});

// ─── disk speed (visual only — does not affect arm/seek) ───
let spinRPM = 33;

function setSpinRPM(val) {
  spinRPM = Math.max(1, Math.min(200, Math.round(val) || 33));
  document.getElementById('speed-val').value = spinRPM;
}

document.getElementById('speed-dec').addEventListener('click', () => setSpinRPM(spinRPM - 1));
document.getElementById('speed-inc').addEventListener('click', () => setSpinRPM(spinRPM + 1));
document.getElementById('speed-val').addEventListener('change', e => {
  setSpinRPM(parseInt(e.target.value, 10));
});

document.getElementById('theme-select').addEventListener('change', e => {
  applyThemeSelection(e.target.value);
});

// ─── queue ──────────────────────────────────────────────────
const queueFiles = [];
let   queueIdx   = -1;  // index of currently loaded track (-1 = none)

function isAudioFile(f) {
  return f.type.startsWith('audio/') ||
    /\.(mp3|flac|m4a|ogg|wav|aac|opus|wma)$/i.test(f.name);
}

function queueRender() {
  const list  = document.getElementById('queue-list');
  const count = document.getElementById('queue-count');
  const n = queueFiles.length;
  count.textContent = n + (n === 1 ? ' track' : ' tracks');
  list.innerHTML = '';
  queueFiles.forEach((f, i) => {
    const div = document.createElement('div');
    div.className = 'queue-item' + (i === queueIdx ? ' active' : '');

    const num = document.createElement('span');
    num.className = 'queue-num';
    num.textContent = i + 1;

    const nm = document.createElement('span');
    nm.className = 'queue-name';
    nm.textContent = f.name.replace(/\.[^.]+$/, '');

    const rm = document.createElement('button');
    rm.className = 'queue-remove';
    rm.title = 'Remove';
    rm.textContent = '×';
    rm.addEventListener('click', e => { e.stopPropagation(); queueRemove(i); });

    div.append(num, nm, rm);
    div.addEventListener('click', () => queuePlay(i));
    list.appendChild(div);
  });
}

function queueAdd(file) {
  if (!isAudioFile(file)) return;
  queueFiles.push(file);
  if (queueIdx === -1) {
    queueIdx = 0;
    loadFile(queueFiles[0]);
  }
  queueRender();
}

function queuePlay(idx) {
  if (!queueFiles[idx]) return;
  queueIdx = idx;
  queueRender();
  loadFile(queueFiles[idx], () => {
    armAngle = GEO.aOuter;
    targetArmAngle = GEO.aOuter;
    setupAudio();
    startSpinUp();
  });
}

function queueRemove(idx) {
  queueFiles.splice(idx, 1);
  if (queueIdx === idx) {
    stopAndReset();
    if (queueFiles.length > 0) {
      const next = Math.min(idx, queueFiles.length - 1);
      queueIdx = next;
      loadFile(queueFiles[next]);
    } else {
      queueIdx = -1;
      hasFile = false;
      audio.src = '';
      window._trackTitle = '';
      window._trackArtist = '';
      window._labelImage = null;
      window._artworkUrl = null;
      document.getElementById('track-title').textContent = '—';
      document.getElementById('track-artist').textContent = '';
    }
  } else if (queueIdx > idx) {
    queueIdx--;
  }
  queueRender();
}

function queueAdvance() {
  if (queueIdx < 0 || queueIdx >= queueFiles.length - 1) return;
  const next = queueIdx + 1;
  queueIdx = next;
  queueRender();
  loadFile(queueFiles[next], () => {
    armAngle = GEO.aOuter;
    targetArmAngle = GEO.aOuter;
    setupAudio();
    startSpinUp();
  });
}

// ─── MediaSession ───────────────────────────────────────────
function updateMediaSession(playing) {
  if (!('mediaSession' in navigator)) return;
  navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
  if (!hasFile) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title:   window._trackTitle  || 'Unknown Track',
    artist:  window._trackArtist || '',
    artwork: window._artworkUrl ? [{ src: window._artworkUrl, sizes: '512x512', type: 'image/jpeg' }] : [],
  });
}

if ('mediaSession' in navigator) {
  navigator.mediaSession.setActionHandler('play',  () => { if (hasFile && !isPlaying) { setupAudio(); setPlayState(true); } });
  navigator.mediaSession.setActionHandler('pause', () => { if (isPlaying) setPlayState(false); });
  navigator.mediaSession.setActionHandler('previoustrack', () => {
    if (!hasFile) return;
    audio.currentTime = 0; currentTime = 0; targetArmAngle = GEO.aOuter;
  });
}

// ─── song-end handler ───────────────────────────────────────
function handleSongEnd() {
  if (songIsOver) return;
  if (!isPlaying && !isSpinningUp) return;
  songIsOver = true;

  if (pendingTimer) { clearTimeout(pendingTimer); pendingTimer = null; }
  isSpinningUp = false;

  setPlayState(false, 500);
  fadeCrackleIn(500);

  // 2s crackle, then fade out and advance queue
  setTimeout(() => {
    fadeCrackleOut(600);
    setTimeout(queueAdvance, 700);
  }, 2500);

  targetArmAngle = GEO.aParked;
}

audio.addEventListener('ended', handleSongEnd);

// ─── play / pause ──────────────────────────────────────────
function setPlayState(playing, fadeMs) {
  isPlaying = playing;
  playbackState.playing = playing;
  const pi = document.getElementById('play-icon');
  const pb = document.getElementById('btn-play');
  if (playing) {
    audio.play();
    audioCtx && audioCtx.resume();
    fadeMusicIn(fadeMs !== undefined ? fadeMs : 300);
    pi.innerHTML = '<rect x="3" y="3" width="5" height="14" rx="1.5"/><rect x="12" y="3" width="5" height="14" rx="1.5"/>';
    pb.classList.add('active');
  } else {
    fadeMusicOut(fadeMs !== undefined ? fadeMs : 200);
    setTimeout(() => audio.pause(), fadeMs !== undefined ? fadeMs : 200);
    pi.innerHTML = '<path d="M5 3l13 7-13 7V3z"/>';
    pb.classList.remove('active');
  }
  updateMediaSession(playing);
}

// ─── stop & full reset (keeps file loaded) ─────────────────
function stopAndReset() {
  if (pendingTimer) { clearTimeout(pendingTimer); pendingTimer = null; }
  isSpinningUp = false;
  songIsOver   = false;

  if (isPlaying) setPlayState(false, 200);

  if (audioCtx && crackleGain) {
    const t = audioCtx.currentTime;
    crackleGain.gain.cancelScheduledValues(t);
    crackleGain.gain.setValueAtTime(0, t);
  }

  if (hasFile) { audio.currentTime = 0; currentTime = 0; }
  targetArmAngle = GEO.aParked;
}

// ─── controls ──────────────────────────────────────────────
document.getElementById('btn-play').addEventListener('click', () => {
  if (!hasFile) return;
  setupAudio();

  if (isSpinningUp) {
    clearTimeout(pendingTimer); pendingTimer = null; isSpinningUp = false;
    fadeCrackleOut(400);
    setPlayState(true, 400);
    return;
  }

  if (isPlaying) {
    setPlayState(false);
    return;
  }

  if (songIsOver || (duration > 0 && audio.currentTime >= duration - 0.1)) {
    audio.currentTime = 0;
    currentTime = 0;
    targetArmAngle = GEO.aOuter;
    songIsOver = false;
  }

  setPlayState(true);
});

document.getElementById('btn-stop').addEventListener('click', () => {
  stopAndReset();
});

document.getElementById('btn-prev').addEventListener('click', () => {
  if (!hasFile) return;
  audio.currentTime = 0;
  currentTime = 0;
  targetArmAngle = GEO.aOuter;
  songIsOver = false;
});

document.getElementById('btn-fwd').addEventListener('click', () => {
  if (!hasFile) return;
  const next = audio.currentTime + 10;
  if (isPlaying && next >= duration) {
    handleSongEnd();
  } else {
    audio.currentTime = Math.min(duration, next);
  }
});

function syncFullscreenButton() {
  const button = document.getElementById('btn-fullscreen');
  if (!button) return;
  const active = !!document.fullscreenElement;
  button.classList.toggle('active', active);
  button.title = active ? 'Exit Fullscreen' : 'Fullscreen';
}

document.getElementById('btn-fullscreen').addEventListener('click', async () => {
  if (!document.fullscreenElement) {
    await document.documentElement.requestFullscreen();
  } else {
    await document.exitFullscreen();
  }
});

document.addEventListener('fullscreenchange', syncFullscreenButton);
syncFullscreenButton();

// ─── volume ─────────────────────────────────────────────────
let volDrag = false;
function setVol(p) {
  p = Math.max(0, Math.min(1, p));
  volLevel = p;
  document.getElementById('vol-fill').style.width = (p * 100) + '%';
  document.getElementById('vol-thumb').style.left  = (p * 100) + '%';
  if (masterGain) masterGain.gain.value = p;
}
const volTrack = document.getElementById('vol-track');
volTrack.addEventListener('mousedown', e => {
  volDrag = true;
  setVol((e.clientX - volTrack.getBoundingClientRect().left) / volTrack.offsetWidth);
  e.preventDefault();
});
setVol(0.7);

// ─── spin-up (2s crackle → music starts) ───────────────────
function startSpinUp() {
  songIsOver   = false;
  isSpinningUp = true;
  spinUpStart  = performance.now();
  if (pendingTimer) clearTimeout(pendingTimer);

  if (audioCtx && crackleGain) {
    const t = audioCtx.currentTime;
    crackleGain.gain.cancelScheduledValues(t);
    crackleGain.gain.setValueAtTime(0.16, t);
  }

  pendingTimer = setTimeout(() => {
    isSpinningUp = false;
    pendingTimer = null;
    fadeCrackleOut(600);
    setPlayState(true, 600);
  }, SPIN_UP_MS);
}

// ─── album art ─────────────────────────────────────────────
function loadAlbumArt(file) {
  window._artworkUrl = null;
  window._labelImage = null;
  if (typeof jsmediatags === 'undefined') return;
  jsmediatags.read(file, {
    onSuccess(tag) {
      const pic = tag.tags.picture;
      if (!pic) return;
      const blob = new Blob([new Uint8Array(pic.data)], { type: pic.format || 'image/jpeg' });
      const url  = URL.createObjectURL(blob);
      window._artworkUrl = url;
      const img = new Image();
      img.onload = () => { window._labelImage = img; updateMediaSession(isPlaying); };
      img.src = url;
    },
    onError() {},
  });
}

// ─── file loading ──────────────────────────────────────────
function loadFile(file, onReady) {
  if (!file) return;

  setupAudio();
  stopAndReset();

  loadedFile = file;

  const url = URL.createObjectURL(file);
  audio.src = url;
  audio.load();
  hasFile = true;

  const name  = file.name.replace(/\.[^.]+$/, '');
  const parts = name.split(/\s*[-–]\s*/);
  window._trackTitle  = parts[0].trim();
  window._trackArtist = parts.slice(1).join(' – ').trim();
  document.getElementById('track-title').textContent  = window._trackTitle || name;
  document.getElementById('track-artist').textContent = window._trackArtist || '';

  loadAlbumArt(file);

  audio.addEventListener('loadedmetadata', () => {
    duration       = audio.duration;
    armAngle       = GEO.aParked;
    targetArmAngle = GEO.aParked;
    updateMediaSession(false);
    if (onReady) onReady();
  }, { once: true });

  audio.addEventListener('timeupdate', () => { currentTime = audio.currentTime; });
}

// ─── file input / drag-drop ────────────────────────────────
document.getElementById('file-input').addEventListener('change', e => {
  [...e.target.files].forEach(queueAdd);
  e.target.value = '';
});
document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('drop', e => {
  e.preventDefault();
  [...e.dataTransfer.files].forEach(queueAdd);
});

// ─── arm drag — drop onto record to start ──────────────────
aCv.addEventListener('mousedown', e => {
  if (!hasFile || isPlaying || isSpinningUp) return;
  isDragging = true;
  aCv.classList.add('dragging');
  e.preventDefault();
});

window.addEventListener('mousemove', e => {
  if (volDrag) {
    setVol((e.clientX - volTrack.getBoundingClientRect().left) / volTrack.offsetWidth);
  }
  if (isDragging) {
    const dragAngle = Math.atan2(e.clientY - PIV_Y, e.clientX - PIV_X) * 180 / Math.PI;
    armAngle = window.normalizeMynylAngle ? window.normalizeMynylAngle(dragAngle, GEO.aParked) : dragAngle;
    targetArmAngle = armAngle;
  }
});

window.addEventListener('mouseup', () => {
  volDrag = false;
  if (isDragging) {
    isDragging = false;
    aCv.classList.remove('dragging');
    if (tipOnGroove(armAngle)) {
      armAngle = GEO.aOuter;
      targetArmAngle = GEO.aOuter;
      setupAudio();
      startSpinUp();
    } else {
      targetArmAngle = GEO.aParked;
    }
  }
});

// ─── keyboard ──────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  switch (e.code) {
    case 'Space':
      e.preventDefault();
      if (!hasFile) return;
      setupAudio();
      document.getElementById('btn-play').click();
      break;
    case 'ArrowLeft':
      e.preventDefault();
      if (!hasFile) break;
      audio.currentTime = Math.max(0, audio.currentTime - 5);
      currentTime = audio.currentTime;
      break;
    case 'ArrowRight': {
      e.preventDefault();
      if (!hasFile) break;
      const next = audio.currentTime + 5;
      if (isPlaying && next >= duration) {
        handleSongEnd();
      } else {
        audio.currentTime = Math.min(duration, next);
        currentTime = audio.currentTime;
      }
      break;
    }
    case 'ArrowUp':
      e.preventDefault();
      setVol(volLevel + 0.05); break;
    case 'ArrowDown':
      e.preventDefault();
      setVol(volLevel - 0.05); break;
  }
});

// ─── main loop ─────────────────────────────────────────────
function animate(ts) {
  requestAnimationFrame(animate);
  const dt = lastRaf ? Math.min((ts - lastRaf) / 1000, 0.05) : 0;
  lastRaf = ts;

  // record spin — speed driven by spinRPM (visual only, arm uses currentTime)
  let spinFactor = 0;
  if (isSpinningUp && spinUpStart) {
    spinFactor = Math.min(1, (ts - spinUpStart) / SPIN_UP_MS);
    spinFactor = spinFactor * spinFactor; // ease-in quad
  }
  if (isPlaying) spinFactor = 1;
  if (spinFactor > 0) rotAngle = (rotAngle + spinRPM * 6 * spinFactor * dt) % 360;

  // arm tracking
  if (!isDragging) {
    if (hasFile && duration > 0) {
      if (isPlaying) {
        const p = Math.max(0, Math.min(1, currentTime / duration));
        targetArmAngle = progressToAngle(p);
      }
      armAngle += (targetArmAngle - armAngle) * 0.06;
    } else {
      armAngle += (GEO.aParked - armAngle) * 0.04;
    }
  }

  groovePulse += (getLevel() - groovePulse) * 0.12;

  drawBg(ts);
  drawRecord(rotAngle * Math.PI / 180);
  drawArm(armAngle);
}

requestAnimationFrame(animate);

// ─── cursor auto-hide (5s idle) ────────────────────────────
let cursorTimer = null;
function showCursor() {
  document.body.style.cursor = '';
  aCv.style.cursor = isDragging ? 'grabbing' : 'grab';
  clearTimeout(cursorTimer);
  cursorTimer = setTimeout(() => {
    document.body.style.cursor = 'none';
    aCv.style.cursor = 'none';
  }, 5000);
}
document.addEventListener('mousemove', showCursor, { passive: true });
showCursor();

// ─── eye toggle ────────────────────────────────────────────
document.getElementById('eye-btn').addEventListener('click', () => {
  document.body.classList.toggle('ui-hidden');
});

// ─── init ──────────────────────────────────────────────────
try {
  const savedTheme = localStorage.getItem('mynyl-theme');
  if (savedTheme && THEMES[savedTheme]) {
    applyThemeSelection(savedTheme);
  } else {
    applyThemeSelection('wood');
  }
} catch {}

queueRender();
