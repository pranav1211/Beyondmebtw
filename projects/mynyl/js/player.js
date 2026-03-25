// ─── state ─────────────────────────────────────────────────
let isPlaying = false, hasFile = false, duration = 0, currentTime = 0;
let rotAngle = 0;
let groovePulse = 0;
let lastRaf = null;
let isSpinningUp = false, spinUpStart = null;
const SPIN_UP_MS = 2000;

let armAngle, targetArmAngle;
let isDragging = false;
let pendingTimer = null;
let songIsOver = false;       // true between song-end and next play
let loadedFile  = null;       // keep reference for metadata / album art re-read

function initArmAngles() {
  armAngle = GEO.aParked;
  targetArmAngle = GEO.aParked;
}
initArmAngles();

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

// ─── song-end handler (persistent, shared by ended event + manual skip) ────
function handleSongEnd() {
  if (songIsOver) return; // already handled
  if (!isPlaying && !isSpinningUp) return; // nothing to stop
  songIsOver = true;

  if (pendingTimer) { clearTimeout(pendingTimer); pendingTimer = null; }
  isSpinningUp = false;

  setPlayState(false, 500);   // music fades out
  fadeCrackleIn(500);         // crackle fades in simultaneously

  // 2 s of crackle then fade out
  setTimeout(() => fadeCrackleOut(600), 2500);

  targetArmAngle = GEO.aParked;
}

// register once on the audio element (not {once: true} so replay works)
audio.addEventListener('ended', handleSongEnd);

// ─── play / pause ──────────────────────────────────────────
function setPlayState(playing, fadeMs) {
  isPlaying = playing;
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

  // kill crackle immediately
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
    // skip the 2-s wait and play immediately
    clearTimeout(pendingTimer); pendingTimer = null; isSpinningUp = false;
    fadeCrackleOut(400);
    setPlayState(true, 400);
    return;
  }

  if (isPlaying) {
    setPlayState(false);
    return;
  }

  // starting play — if song is over or at end, rewind first
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
  // if playing, keep playing from the start
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

// ─── spin-up (2 s crackle → music starts) ──────────────────
function startSpinUp() {
  songIsOver   = false;
  isSpinningUp = true;
  spinUpStart  = performance.now();
  if (pendingTimer) clearTimeout(pendingTimer);

  // crackle on immediately
  if (audioCtx && crackleGain) {
    const t = audioCtx.currentTime;
    crackleGain.gain.cancelScheduledValues(t);
    crackleGain.gain.setValueAtTime(0.16, t);
  }

  // after 2 s: crackle fades out, music fades in
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
function loadFile(file) {
  if (!file) return;
  const isAudio = file.type.startsWith('audio/') ||
    /\.(mp3|flac|m4a|ogg|wav|aac|opus|wma)$/i.test(file.name);
  if (!isAudio) return;

  setupAudio();
  stopAndReset(); // clean slate

  loadedFile = file; // store for replay / re-read

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
  }, { once: true });

  audio.addEventListener('timeupdate', () => { currentTime = audio.currentTime; });
}

document.getElementById('file-input').addEventListener('change', e => {
  if (e.target.files[0]) loadFile(e.target.files[0]);
});
document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('drop', e => {
  e.preventDefault();
  if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]);
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
    armAngle = Math.atan2(e.clientY - PIV_Y, e.clientX - PIV_X) * 180 / Math.PI;
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

  // record spin — only while spinning up or actually playing
  let spinFactor = 0;
  if (isSpinningUp && spinUpStart) {
    spinFactor = Math.min(1, (ts - spinUpStart) / SPIN_UP_MS);
    spinFactor = spinFactor * spinFactor; // ease-in quad
  }
  if (isPlaying) spinFactor = 1;
  if (spinFactor > 0) rotAngle = (rotAngle + 200 * spinFactor * dt) % 360;

  // arm tracking
  if (!isDragging) {
    if (hasFile && duration > 0) {
      if (isPlaying) {
        // clamp so arm never goes past aInner
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
