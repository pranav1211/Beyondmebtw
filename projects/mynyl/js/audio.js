// ─── audio element ─────────────────────────────────────────
const audio = document.getElementById('audio-el');

// ─── Web Audio globals ─────────────────────────────────────
let audioCtx, masterGain, musicFadeGain, analyser, sourceNode;
let crackleGain, crackleNode;
let volLevel = 0.7;

const CRACKLE_BUF = 2048;

function setupAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  // master
  masterGain = audioCtx.createGain();
  masterGain.gain.value = volLevel;
  masterGain.connect(audioCtx.destination);

  // music chain: source → analyser → musicFadeGain → master
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 512;

  musicFadeGain = audioCtx.createGain();
  musicFadeGain.gain.value = 0;
  musicFadeGain.connect(masterGain);

  sourceNode = audioCtx.createMediaElementSource(audio);
  sourceNode.connect(analyser);
  analyser.connect(musicFadeGain);

  // crackle chain: scriptProcessor → crackleGain → master
  crackleGain = audioCtx.createGain();
  crackleGain.gain.value = 0;
  crackleGain.connect(masterGain);

  crackleNode = audioCtx.createScriptProcessor(CRACKLE_BUF, 1, 1);

  let hiss = 0;
  let popCooldown = 0;
  let wowPhase = 0;
  let scratchCooldown = 0;
  let scratchActive = 0;
  let scratchAmp = 0;

  crackleNode.onaudioprocess = (ev) => {
    const out = ev.outputBuffer.getChannelData(0);
    const sr  = audioCtx.sampleRate;

    for (let i = 0; i < out.length; i++) {
      // 1. Hiss — lowpass-filtered white noise
      hiss = hiss * 0.965 + (Math.random() * 2 - 1) * 0.035;

      // 2. Pops — sparse random impulses
      let pop = 0;
      if (--popCooldown <= 0 && Math.random() < 0.0006) {
        pop = (Math.random() > 0.5 ? 1 : -1) * (0.3 + Math.random() * 0.7);
        popCooldown = Math.floor(sr * (0.12 + Math.random() * 0.5));
      }

      // 3. Surface scratch — rare longer crackle burst
      if (--scratchCooldown <= 0 && Math.random() < 0.00003) {
        scratchActive = Math.floor(sr * (0.05 + Math.random() * 0.12));
        scratchAmp    = 0.15 + Math.random() * 0.25;
        scratchCooldown = Math.floor(sr * (1.5 + Math.random() * 3.0));
      }
      let scratch = 0;
      if (scratchActive > 0) {
        scratch = (Math.random() * 2 - 1) * scratchAmp;
        scratchActive--;
      }

      // 4. Wow / rumble
      wowPhase += (2 * Math.PI * 0.55) / sr;
      const wow = Math.sin(wowPhase) * 0.002;

      out[i] = hiss + pop + scratch + wow;
    }
  };

  crackleNode.connect(crackleGain);
}

// ─── fade helpers ──────────────────────────────────────────
function fadeMusicIn(ms) {
  if (!musicFadeGain) return;
  const t = audioCtx.currentTime;
  musicFadeGain.gain.cancelScheduledValues(t);
  musicFadeGain.gain.setValueAtTime(0, t);
  musicFadeGain.gain.linearRampToValueAtTime(1, t + ms / 1000);
}
function fadeMusicOut(ms) {
  if (!musicFadeGain) return;
  const t = audioCtx.currentTime;
  musicFadeGain.gain.cancelScheduledValues(t);
  musicFadeGain.gain.setValueAtTime(musicFadeGain.gain.value, t);
  musicFadeGain.gain.linearRampToValueAtTime(0, t + ms / 1000);
}
function fadeCrackleIn(ms) {
  if (!crackleGain) return;
  const t = audioCtx.currentTime;
  crackleGain.gain.cancelScheduledValues(t);
  crackleGain.gain.setValueAtTime(crackleGain.gain.value, t);
  crackleGain.gain.linearRampToValueAtTime(0.16, t + ms / 1000);
}
function fadeCrackleOut(ms) {
  if (!crackleGain) return;
  const t = audioCtx.currentTime;
  crackleGain.gain.cancelScheduledValues(t);
  crackleGain.gain.setValueAtTime(crackleGain.gain.value, t);
  crackleGain.gain.linearRampToValueAtTime(0, t + ms / 1000);
}

// ─── level meter ───────────────────────────────────────────
const fdBuf = new Float32Array(256);
function getLevel() {
  if (!analyser) return 0;
  analyser.getFloatTimeDomainData(fdBuf);
  let s = 0;
  for (let i = 0; i < fdBuf.length; i++) s += fdBuf[i] * fdBuf[i];
  return Math.min(1, Math.sqrt(s / fdBuf.length) * 6);
}
