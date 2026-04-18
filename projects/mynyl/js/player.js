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
let loadedFile = null;
let loadedObjectUrl = null;
let artworkObjectUrl = null;

const fileInput = document.getElementById('file-input');
const themeSelect = document.getElementById('theme-select');
const queueListEl = document.getElementById('queue-list');
const queueCountDock = document.getElementById('queue-count-dock');
const queueCountModal = document.getElementById('queue-count-modal');
const queueModal = document.getElementById('queue-modal');
const queueModalClose = document.getElementById('queue-modal-close');
const queueDropzone = document.getElementById('queue-dropzone');
const queueAddBtn = document.getElementById('queue-add-btn');
const musicLaunchBtn = document.getElementById('music-launch-btn');
const trackTitleEl = document.getElementById('track-title');
const trackArtistEl = document.getElementById('track-artist');

// ─── themes ────────────────────────────────────────────────
function normalizeThemePath(path) {
  return String(path || '')
    .replace(/\\/g, '/')
    .replace(/\/+$/, '');
}

function themeIdFromPath(path) {
  const clean = normalizeThemePath(path);
  const parts = clean.split('/');
  return parts[parts.length - 1] || 'theme';
}

function readThemeRegistry() {
  const raw = Array.isArray(window.MYNYL_THEME_REGISTRY) ? window.MYNYL_THEME_REGISTRY : [];
  const normalized = raw
    .map((entry, index) => {
      const folder = normalizeThemePath(entry.path || entry.folder);
      if (!folder) return null;
      const id = String(entry.id || themeIdFromPath(folder));
      return {
        id,
        displayName: String(entry.name || entry.label || id),
        themeName: id,
        cssHref: `${folder}/theme.css`,
        scriptHref: `${folder}/theme.js`,
        default: !!entry.default,
        index,
      };
    })
    .filter(Boolean);

  if (normalized.length === 0) {
    normalized.push({
      id: 'wood',
      displayName: 'Wood',
      themeName: 'wood',
      cssHref: 'themes/wood/theme.css',
      scriptHref: 'themes/wood/theme.js',
      default: true,
      index: 0,
    });
  }

  return normalized;
}

const themeRegistry = readThemeRegistry();
const THEMES = Object.fromEntries(themeRegistry.map(theme => [theme.id, theme]));
const DEFAULT_THEME = (themeRegistry.find(theme => theme.default) || themeRegistry[0]).id;

function populateThemeSelect() {
  themeSelect.innerHTML = '';
  themeRegistry.forEach(theme => {
    const option = document.createElement('option');
    option.value = theme.id;
    option.textContent = theme.displayName;
    themeSelect.appendChild(option);
  });
}

function applyThemeSelection(themeName) {
  const themeConfig = THEMES[themeName] || THEMES[DEFAULT_THEME];
  if (!themeConfig) return;
  if (themeSelect.value !== themeConfig.themeName) themeSelect.value = themeConfig.themeName;
  if (window.setMynylTheme) window.setMynylTheme(themeConfig);
  try { localStorage.setItem('mynyl-theme', themeConfig.themeName); } catch { }
}

populateThemeSelect();
themeSelect.addEventListener('change', e => {
  applyThemeSelection(e.target.value);
});

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

// ─── queue ──────────────────────────────────────────────────
const queueFiles = [];
let queueIdx = -1;
let queueDragIndex = -1;

function isAudioFile(f) {
  return f && (f.type.startsWith('audio/') ||
    /\.(mp3|flac|m4a|ogg|wav|aac|opus|wma)$/i.test(f.name));
}

function queueCountText() {
  const n = queueFiles.length;
  return n + (n === 1 ? ' track' : ' tracks');
}

function clearQueueDropMarkers() {
  queueListEl.querySelectorAll('.queue-item').forEach(item => {
    item.classList.remove('drop-before', 'drop-after', 'dragging');
  });
}

function syncQueueIndexAfterMove(from, to) {
  if (queueIdx === from) {
    queueIdx = to;
    return;
  }
  if (from < queueIdx && to >= queueIdx) {
    queueIdx--;
    return;
  }
  if (from > queueIdx && to <= queueIdx) {
    queueIdx++;
  }
}

function queueMove(from, anchorIdx, placement) {
  if (from < 0 || from >= queueFiles.length || anchorIdx < 0 || anchorIdx >= queueFiles.length) return;

  let insertAt = placement === 'after' ? anchorIdx + 1 : anchorIdx;
  if (from < insertAt) insertAt--;
  if (insertAt === from) return;

  const [item] = queueFiles.splice(from, 1);
  queueFiles.splice(insertAt, 0, item);
  syncQueueIndexAfterMove(from, insertAt);
  queueRender();
}

function queuePrev() {
  if (queueIdx > 0) queuePlay(queueIdx - 1);
  else if (hasFile) {
    audio.currentTime = 0;
    currentTime = 0;
    targetArmAngle = GEO.aOuter;
    updatePositionState();
  }
}

function queueRender() {
  const countText = queueCountText();
  queueCountDock.textContent = countText;
  queueCountModal.textContent = countText;
  queueListEl.innerHTML = '';

  if (queueFiles.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'queue-empty';
    empty.textContent = 'No music queued yet';
    queueListEl.appendChild(empty);
    return;
  }

  queueFiles.forEach((file, index) => {
    const item = document.createElement('div');
    item.className = 'queue-item' + (index === queueIdx ? ' active' : '');
    item.draggable = true;
    item.dataset.index = index;

    const grip = document.createElement('span');
    grip.className = 'queue-grip';
    grip.textContent = '⋮⋮';
    grip.title = 'Drag to reorder';

    const num = document.createElement('span');
    num.className = 'queue-num';
    num.textContent = index + 1;

    const name = document.createElement('span');
    name.className = 'queue-name';
    name.textContent = file.name.replace(/\.[^.]+$/, '');

    const removeBtn = document.createElement('button');
    removeBtn.className = 'queue-remove';
    removeBtn.title = 'Remove';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', e => {
      e.stopPropagation();
      queueRemove(index);
    });

    item.append(grip, num, name, removeBtn);
    item.addEventListener('click', () => queuePlay(index));
    item.addEventListener('dragstart', e => {
      queueDragIndex = index;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
    });
    item.addEventListener('dragend', () => {
      queueDragIndex = -1;
      clearQueueDropMarkers();
    });
    item.addEventListener('dragover', e => {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) return;
      if (queueDragIndex === -1 || queueDragIndex === index) return;

      const rect = item.getBoundingClientRect();
      const placement = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
      clearQueueDropMarkers();
      item.classList.add(placement === 'before' ? 'drop-before' : 'drop-after');
    });
    item.addEventListener('drop', e => {
      e.preventDefault();
      e.stopPropagation();
      clearQueueDropMarkers();

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        queueAddFiles([...e.dataTransfer.files]);
        return;
      }

      if (queueDragIndex === -1 || queueDragIndex === index) return;
      const rect = item.getBoundingClientRect();
      const placement = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
      queueMove(queueDragIndex, index, placement);
    });

    queueListEl.appendChild(item);
  });
}

function queueAddFiles(files) {
  const additions = files.filter(isAudioFile);
  if (additions.length === 0) return;

  queueFiles.push(...additions);
  if (queueIdx === -1 && queueFiles.length > 0) {
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

function clearTrackInfo() {
  if (loadedObjectUrl) URL.revokeObjectURL(loadedObjectUrl);
  loadedObjectUrl = null;
  resetArtworkUrl();
  loadedFile = null;
  hasFile = false;
  duration = 0;
  currentTime = 0;
  audio.src = '';
  window._trackTitle = '';
  window._trackArtist = '';
  window._labelImage = null;
  window._artworkUrl = null;
  trackTitleEl.textContent = '—';
  trackArtistEl.textContent = '';
  updateMediaSession(false);
}

function queueRemove(idx) {
  if (!queueFiles[idx]) return;

  queueFiles.splice(idx, 1);
  if (queueIdx === idx) {
    stopAndReset();
    if (queueFiles.length > 0) {
      const next = Math.min(idx, queueFiles.length - 1);
      queueIdx = next;
      loadFile(queueFiles[next]);
    } else {
      queueIdx = -1;
      clearTrackInfo();
    }
  } else if (queueIdx > idx) {
    queueIdx--;
  }

  queueRender();
}

function queueAdvance() {
  if (queueIdx < 0 || queueIdx >= queueFiles.length - 1) return false;
  queuePlay(queueIdx + 1);
  return true;
}

function openQueueModal() {
  queueModal.hidden = false;
  document.body.classList.add('queue-modal-open');
  queueRender();
}

function closeQueueModal() {
  queueModal.hidden = true;
  document.body.classList.remove('queue-modal-open');
  clearQueueDropMarkers();
}

musicLaunchBtn.addEventListener('click', openQueueModal);
queueModalClose.addEventListener('click', closeQueueModal);
queueModal.addEventListener('click', e => {
  if (e.target === queueModal) closeQueueModal();
});
queueAddBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', e => {
  queueAddFiles([...e.target.files]);
  e.target.value = '';
  openQueueModal();
});

function highlightQueueDropzone(active) {
  queueDropzone.classList.toggle('is-over', active);
}

['dragenter', 'dragover'].forEach(type => {
  queueDropzone.addEventListener(type, e => {
    e.preventDefault();
    highlightQueueDropzone(true);
  });
});

['dragleave', 'dragend', 'drop'].forEach(type => {
  queueDropzone.addEventListener(type, e => {
    e.preventDefault();
    if (type !== 'drop') highlightQueueDropzone(false);
  });
});

queueDropzone.addEventListener('drop', e => {
  e.stopPropagation();
  highlightQueueDropzone(false);
  queueAddFiles([...e.dataTransfer.files]);
});

queueListEl.addEventListener('dragover', e => {
  if (!(e.dataTransfer.files && e.dataTransfer.files.length > 0)) return;
  e.preventDefault();
});

queueListEl.addEventListener('drop', e => {
  if (!(e.dataTransfer.files && e.dataTransfer.files.length > 0)) return;
  e.preventDefault();
  queueAddFiles([...e.dataTransfer.files]);
});

// ─── MediaSession ───────────────────────────────────────────
const hasMediaSession = 'mediaSession' in navigator;
if (!window.isSecureContext) {
  console.info('Media Session integration works best on HTTPS or localhost.');
}

function updatePositionState() {
  if (!hasMediaSession || typeof navigator.mediaSession.setPositionState !== 'function') return;

  try {
    if (!hasFile || !Number.isFinite(audio.duration) || audio.duration <= 0) {
      navigator.mediaSession.setPositionState(null);
      return;
    }

    navigator.mediaSession.setPositionState({
      duration: audio.duration,
      playbackRate: audio.playbackRate || 1,
      position: Math.min(audio.currentTime || 0, audio.duration),
    });
  } catch { }
}

function updateMediaSession(playing) {
  if (!hasMediaSession) return;

  navigator.mediaSession.playbackState = hasFile ? (playing ? 'playing' : 'paused') : 'none';
  navigator.mediaSession.metadata = hasFile
    ? new MediaMetadata({
      title: window._trackTitle || 'Unknown Track',
      artist: window._trackArtist || '',
      artwork: window._artworkUrl ? [{ src: window._artworkUrl, sizes: '512x512', type: 'image/jpeg' }] : [],
    })
    : null;

  updatePositionState();
}

function setMediaActionHandler(action, handler) {
  if (!hasMediaSession) return;
  try {
    navigator.mediaSession.setActionHandler(action, handler);
  } catch { }
}

setMediaActionHandler('play', () => {
  if (hasFile && !isPlaying) {
    setupAudio();
    setPlayState(true);
  }
});
setMediaActionHandler('pause', () => {
  if (isPlaying) setPlayState(false);
});
setMediaActionHandler('stop', () => {
  stopAndReset();
});
setMediaActionHandler('previoustrack', () => {
  queuePrev();
});
setMediaActionHandler('nexttrack', () => {
  queueAdvance();
});
setMediaActionHandler('seekbackward', details => {
  if (!hasFile) return;
  const offset = details && details.seekOffset ? details.seekOffset : 10;
  audio.currentTime = Math.max(0, audio.currentTime - offset);
  currentTime = audio.currentTime;
  updatePositionState();
});
setMediaActionHandler('seekforward', details => {
  if (!hasFile) return;
  const offset = details && details.seekOffset ? details.seekOffset : 10;
  const next = Math.min(duration || audio.duration || 0, audio.currentTime + offset);
  audio.currentTime = next;
  currentTime = audio.currentTime;
  updatePositionState();
});
setMediaActionHandler('seekto', details => {
  if (!hasFile || typeof details.seekTime !== 'number') return;
  audio.currentTime = Math.min(details.seekTime, duration || audio.duration || details.seekTime);
  currentTime = audio.currentTime;
  updatePositionState();
});

// ─── song-end handler ───────────────────────────────────────
function handleSongEnd() {
  if (songIsOver) return;
  if (!isPlaying && !isSpinningUp) return;
  songIsOver = true;

  if (pendingTimer) { clearTimeout(pendingTimer); pendingTimer = null; }
  isSpinningUp = false;

  setPlayState(false, 500);
  fadeCrackleIn(500);

  setTimeout(() => {
    fadeCrackleOut(600);
    setTimeout(() => {
      if (!queueAdvance()) targetArmAngle = GEO.aParked;
    }, 700);
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
  songIsOver = false;

  if (isPlaying) setPlayState(false, 200);
  else updateMediaSession(false);

  if (audioCtx && crackleGain) {
    const t = audioCtx.currentTime;
    crackleGain.gain.cancelScheduledValues(t);
    crackleGain.gain.setValueAtTime(0, t);
  }

  if (hasFile) {
    audio.currentTime = 0;
    currentTime = 0;
  }
  targetArmAngle = GEO.aParked;
  updatePositionState();
}

// ─── controls ──────────────────────────────────────────────
document.getElementById('btn-play').addEventListener('click', () => {
  if (!hasFile) return;
  setupAudio();

  if (isSpinningUp) {
    clearTimeout(pendingTimer);
    pendingTimer = null;
    isSpinningUp = false;
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
  queuePrev();
});

document.getElementById('btn-fwd').addEventListener('click', () => {
  if (!hasFile) return;
  const next = audio.currentTime + 10;
  if (isPlaying && next >= duration) {
    handleSongEnd();
  } else {
    audio.currentTime = Math.min(duration, next);
    currentTime = audio.currentTime;
    updatePositionState();
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
  document.getElementById('vol-thumb').style.left = (p * 100) + '%';
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
  songIsOver = false;
  isSpinningUp = true;
  spinUpStart = performance.now();
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
function resetArtworkUrl() {
  if (artworkObjectUrl) URL.revokeObjectURL(artworkObjectUrl);
  artworkObjectUrl = null;
}

function loadAlbumArt(file) {
  resetArtworkUrl();
  window._artworkUrl = null;
  window._labelImage = null;
  if (typeof jsmediatags === 'undefined') return;
  jsmediatags.read(file, {
    onSuccess(tag) {
      const pic = tag.tags.picture;
      if (!pic) return;
      const blob = new Blob([new Uint8Array(pic.data)], { type: pic.format || 'image/jpeg' });
      const url = URL.createObjectURL(blob);
      artworkObjectUrl = url;
      window._artworkUrl = url;
      const img = new Image();
      img.onload = () => {
        window._labelImage = img;
        updateMediaSession(isPlaying);
      };
      img.src = url;
    },
    onError() { },
  });
}

// ─── file loading ──────────────────────────────────────────
function loadFile(file, onReady) {
  if (!file) return;

  setupAudio();
  stopAndReset();

  loadedFile = file;
  if (loadedObjectUrl) URL.revokeObjectURL(loadedObjectUrl);
  loadedObjectUrl = URL.createObjectURL(file);

  audio.src = loadedObjectUrl;
  audio.load();
  hasFile = true;

  const name = file.name.replace(/\.[^.]+$/, '');
  const parts = name.split(/\s*[-–]\s*/);
  window._trackTitle = parts[0].trim();
  window._trackArtist = parts.slice(1).join(' – ').trim();
  trackTitleEl.textContent = window._trackTitle || name;
  trackArtistEl.textContent = window._trackArtist || '';

  loadAlbumArt(file);

  audio.addEventListener('loadedmetadata', () => {
    duration = audio.duration;
    armAngle = GEO.aParked;
    targetArmAngle = GEO.aParked;
    updateMediaSession(false);
    if (onReady) onReady();
  }, { once: true });
}

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
  if (e.key === 'Escape' && !queueModal.hidden) {
    closeQueueModal();
    return;
  }

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
      updatePositionState();
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
        updatePositionState();
      }
      break;
    }
    case 'ArrowUp':
      e.preventDefault();
      setVol(volLevel + 0.05);
      break;
    case 'ArrowDown':
      e.preventDefault();
      setVol(volLevel - 0.05);
      break;
  }
});

// ─── main loop ─────────────────────────────────────────────
function animate(ts) {
  requestAnimationFrame(animate);
  const dt = lastRaf ? Math.min((ts - lastRaf) / 1000, 0.05) : 0;
  lastRaf = ts;

  let spinFactor = 0;
  if (isSpinningUp && spinUpStart) {
    spinFactor = Math.min(1, (ts - spinUpStart) / SPIN_UP_MS);
    spinFactor = spinFactor * spinFactor;
  }
  if (isPlaying) spinFactor = 1;
  if (spinFactor > 0) rotAngle = (rotAngle + spinRPM * 6 * spinFactor * dt) % 360;

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

// ─── cursor + UI auto-hide (5s idle) ───────────────────────
let cursorTimer = null;
let uiTimer = null;

function showCursor() {
  document.body.style.cursor = '';
  aCv.style.cursor = isDragging ? 'grabbing' : 'grab';
  clearTimeout(cursorTimer);
  cursorTimer = setTimeout(() => {
    document.body.style.cursor = 'none';
    aCv.style.cursor = 'none';
  }, 5000);
}

function showUI() {
  // Don't fight a manual hide (eye-btn was used to hide).
  if (document.body.classList.contains('ui-hidden')) return;

  document.body.classList.remove('ui-auto-hidden');
  clearTimeout(uiTimer);
  uiTimer = setTimeout(() => document.body.classList.add('ui-auto-hidden'), 5000);
}

document.addEventListener('mousemove', showCursor, { passive: true });
document.addEventListener('mousemove', showUI, { passive: true });
showCursor();
showUI();

// ── eye toggle ──────────────────────────────────────────────────────────────
document.getElementById('eye-btn').addEventListener('click', () => {
  const isNowHidden = document.body.classList.toggle('ui-hidden');
  // Only restart the auto-hide countdown when the user has just revealed the UI.
  // If they just manually hid it, do nothing — don't fight their choice.
  if (!isNowHidden) {
    resetUiHideTimer();
  }
});

audio.addEventListener('timeupdate', () => {
  currentTime = audio.currentTime;
  updatePositionState();
});

let uiHideTimer = null;
function resetUiHideTimer() {
  document.body.classList.remove('ui-auto-hidden');
  clearTimeout(uiHideTimer);
  // Don't auto-hide if the user has manually hidden via eye btn
  if (document.body.classList.contains('ui-hidden')) return;
  uiHideTimer = setTimeout(() => {
    document.body.classList.add('ui-auto-hidden');
  }, 5000);
}
document.addEventListener('mousemove', resetUiHideTimer);
document.addEventListener('mousedown', resetUiHideTimer);
document.addEventListener('keydown', resetUiHideTimer);
resetUiHideTimer();

// ─── init ──────────────────────────────────────────────────
try {
  const savedTheme = localStorage.getItem('mynyl-theme');
  applyThemeSelection(savedTheme && THEMES[savedTheme] ? savedTheme : DEFAULT_THEME);
} catch {
  applyThemeSelection(DEFAULT_THEME);
}

queueRender();
