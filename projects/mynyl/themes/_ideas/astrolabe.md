# Astrolabe

The vinyl as an antique celestial planisphere: midnight indigo engraved with gold constellation lines, an ecliptic ring, and a slowly wheeling star field that turns with the record.

Folder: `themes/astrolabe/`. Registry display name: **"Astrolabe"**.

## Overview

Astrolabe reskins the disc as an old observatory star chart. The base etched vinyl gives concentric "declination" grooves on a midnight-indigo disc with a cool sheen and a gold chart-bezel rim; the armillary-core gold label sits at center. The signature move is a `theme.js` `drawRecord` overlay: after the engine paints the base disc, it draws a seeded star field of ~40 stars in the band `r ∈ [0.26, 0.92] * radius`, thin gold constellation lines connecting bright stars into 2–3 zodiac figures, a labelled ecliptic band with 12 tick divisions near the rim, and a small engraved compass-rose just outside the label — all rotating **with** the disc. Stars twinkle (driven by `performance.now()`) while playing and settle to steady when idle; on a `state.groovePulse` peak a faint gold shooting-star streak arcs across the disc and the brightest stars bloom. The theme degrades gracefully: if `theme.js` were removed it would still be a complete, good-looking CSS-only dark theme (etched vinyl, brass arm, brass-on-midnight UI) — the overlay is purely additive.

## themes/astrolabe/theme.css

```css
@import url('./background.css');
@import url('./vinyl.css');
@import url('./arm.css');
@import url('./ui.css');
```

## themes/astrolabe/background.css

```css
:root {
  /* layout / geometry (kept identical to the canonical wood placement) */
  --player-record-scale: 0.42;
  --arm-pivot-offset-x: 1.05;
  --arm-pivot-offset-y: -0.85;
  --arm-outer-radius: 0.91;
  --arm-inner-radius: 0.30;
  --arm-outer-offset-x: -0.10;
  --arm-outer-offset-y: -0.85;
  --arm-park-offset-x: 1.20;
  --arm-park-offset-y: 0.30;

  /* deep observatory night sky */
  --bg-center-rgb: 16,24,60;
  --bg-mid-rgb: 8,12,32;
  --bg-edge-0: #060a1c;
  --bg-edge-1: #02040c;
  --bg-glow-strength: 0.7;
  --bg-drift-x: 0.02;
  --bg-drift-y: 0.02;

  /* drop-hint ring/dot tuned to gold-ink + starlight */
  --hint-ring: rgba(217,178,90,0.50);
  --hint-dot: rgba(234,240,255,0.95);
  --hint-glow: rgba(159,176,255,0.45);
  --hint-text: rgba(234,240,255,0.85);
}
```

## themes/astrolabe/vinyl.css

```css
:root {
  /* etched = grooves become engraved celestial circles */
  --vinyl-style: etched;
  --vinyl-disc: #0a1230;
  --vinyl-edge: rgba(217,178,90,0.15);
  --vinyl-rim-light: rgba(217,178,90,0.25);   /* gold chart bezel */
  --vinyl-rim-shadow: rgba(0,0,0,0.40);
  --vinyl-shadow-ring: rgba(0,0,0,0.35);

  /* meridian-blue grooves read as declination circles */
  --vinyl-groove-rgb: 111,123,214;
  --vinyl-groove-alpha: 0.10;
  --vinyl-groove-pulse: 0.10;
  --vinyl-groove-spacing: 2.0;
  --vinyl-groove-width: 0.55;
  --vinyl-groove-start: 0.19;
  --vinyl-groove-end: 0.91;
  --vinyl-groove-warp: 0.02;

  /* cool faint sheen; specular off for a matte chart surface */
  --vinyl-sheen: 0.04;
  --vinyl-sheen-width: 0.05;
  --vinyl-specular: 0;
  --vinyl-depth: 0.25;

  /* absolute drop-shadow fallbacks (depth>0 overrides these, kept for completeness) */
  --vinyl-drop-shadow: rgba(0,0,0,0.55);
  --vinyl-drop-shadow-blur: 26;
  --vinyl-drop-shadow-offset-y: 12;

  /* armillary-core gold label */
  --vinyl-label-radius: 0.175;
  --vinyl-hole-radius: 0.02;
  --vinyl-label-0: #d9b25a;
  --vinyl-label-55: #a07d33;
  --vinyl-label-100: #5a4418;
  --vinyl-label-ring: rgba(217,178,90,0.50);
  --vinyl-label-stroke: rgba(0,0,0,0.30);
  --vinyl-label-art-base: #11183f;
  --vinyl-hole-fill: #11183f;
}
```

## themes/astrolabe/arm.css

```css
:root {
  /* classic arm reskinned as an astrolabe alidade */
  --arm-style: classic;
  --arm-tube-width: 0.022;
  --arm-shadow-blur: 12;
  --arm-shadow-offset-y: 5;
  --arm-highlight-alpha: 0.10;

  /* aged-brass tube */
  --arm-0: #3a2f12;
  --arm-25: #8a6f2e;
  --arm-60: #d9b25a;
  --arm-100: #4a3a16;

  --arm-headshell: #6a521e;
  --arm-headshell-length: 0.10;
  --arm-headshell-width: 0.016;
  --arm-headshell-bend-deg: -18;

  /* starlight point needle */
  --arm-needle: rgba(234,240,255,0.95);
  --arm-needle-tip: #eaf0ff;
  --arm-needle-width: 1.5;
  --arm-needle-length: 0.55;

  /* brass-sphere counterweight */
  --arm-counterweight-radius: 0.038;
  --arm-counterweight-offset: 0.15;
  --arm-cw-0: #c8a24e;
  --arm-cw-55: #6a521e;
  --arm-cw-100: #2a2008;

  /* gold-rivet pivot */
  --arm-pivot-radius: 0.03;
  --arm-pivot-inner-radius: 0.30;
  --arm-pivot-0: #e8d49a;
  --arm-pivot-50: #9a7a30;
  --arm-pivot-100: #2a2008;
}
```

## themes/astrolabe/ui.css

```css
:root {
  --page-bg: #060a1c;
  --glass-bg: rgba(10,18,48,0.60);
  --glass-border: rgba(217,178,90,0.18);
  --glass-inset: rgba(217,178,90,0.05);
  --text-main: #eaf0ff;
  --text-soft: rgba(159,176,255,0.55);
  --text-faint: rgba(159,176,255,0.32);
  --accent: #d9b25a;
  --accent-strong: #9fb0ff;
  --accent-dim: rgba(159,176,255,0.42);
  --accent-glow: rgba(159,176,255,0.18);
  --surface-1: rgba(20,30,66,0.88);
  --surface-2: rgba(8,13,34,0.94);
  --surface-3: rgba(28,40,84,0.90);
  --surface-4: rgba(12,18,42,0.96);
  --border-soft: rgba(217,178,90,0.22);
  --border-strong: rgba(217,178,90,0.50);
}
html, body { background: var(--page-bg) }
.eye-btn { color: var(--accent-dim) }
.eye-btn:hover, .eye-zone:hover .eye-btn { color: rgba(159,176,255,0.92) }
.ui-panel {
  background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 8px; padding: 16px 18px;
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 12px 44px rgba(0,0,0,0.6), 0 3px 10px rgba(0,0,0,0.4), 0 1px 0 var(--glass-inset) inset, 0 -1px 0 rgba(0,0,0,0.25) inset;
}
.upload-label, .speed-label, .queue-label { color: rgba(159,176,255,0.42) }
.upload-btn {
  background: linear-gradient(180deg, var(--surface-1) 0%, var(--surface-2) 100%); border-color: rgba(217,178,90,0.30); color: rgba(234,240,255,0.62);
  box-shadow: 0 1px 0 rgba(217,178,90,0.06) inset, 0 3px 12px rgba(0,0,0,0.48);
}
.upload-btn:hover { border-color: rgba(217,178,90,0.62); color: rgba(234,240,255,1); background: linear-gradient(180deg, var(--surface-3) 0%, var(--surface-4) 100%); box-shadow: 0 1px 0 rgba(217,178,90,0.12) inset, 0 5px 20px rgba(0,0,0,0.58), 0 0 24px rgba(159,176,255,0.14); }
.upload-btn:active { transform: translateY(1px); box-shadow: inset 0 2px 6px rgba(0,0,0,0.5), inset 0 1px 0 rgba(217,178,90,0.05); }
.ctrl-btn, .speed-btn {
  background: radial-gradient(circle at 36% 32%, rgba(20,30,66,0.93), rgba(6,10,28,0.97)); border-color: var(--border-soft); color: rgba(234,240,255,0.72);
  box-shadow: 4px 5px 12px rgba(0,0,0,0.55), -3px -3px 9px rgba(159,176,255,0.04), 0 1px 0 rgba(217,178,90,0.08) inset;
}
.ctrl-btn:hover, .speed-btn:hover { background: radial-gradient(circle at 36% 32%, rgba(30,42,86,0.93), rgba(10,16,40,0.97)); border-color: var(--border-strong); color: var(--accent-strong); box-shadow: 5px 6px 16px rgba(0,0,0,0.62), -3px -3px 10px rgba(159,176,255,0.06), 0 1px 0 rgba(217,178,90,0.12) inset, 0 0 22px var(--accent-glow); }
.ctrl-btn:active, .speed-btn:active { box-shadow: inset 3px 3px 8px rgba(0,0,0,0.6), inset -2px -2px 6px rgba(159,176,255,0.05); }
.ctrl-btn.active { background: radial-gradient(circle at 36% 32%, rgba(40,54,104,0.96), rgba(16,24,56,0.99)); border-color: rgba(217,178,90,0.70); color: var(--accent); box-shadow: inset 2px 2px 7px rgba(0,0,0,0.5), inset -1px -1px 4px rgba(159,176,255,0.07), 0 0 24px rgba(159,176,255,0.22); }
.vol-icon { color: rgba(159,176,255,0.42) }
.slider-track { background: rgba(159,176,255,0.10) }
.slider-fill { background: linear-gradient(90deg, rgba(159,176,255,0.62), rgba(217,178,90,0.84)) }
.slider-thumb { background: #eaf0ff; box-shadow: 0 0 0 1px rgba(217,178,90,0.26); }
.kbd-hint { color: rgba(159,176,255,0.16) }
.track-title { color: var(--text-main) }
.track-artist, .queue-count { color: var(--text-soft) }
.queue-list::-webkit-scrollbar-track { background: rgba(159,176,255,0.05) }
.queue-list::-webkit-scrollbar-thumb { background: rgba(217,178,90,0.28); border-radius: 2px }
.queue-item { border-bottom-color: rgba(159,176,255,0.07) }
.queue-item:hover { background: rgba(159,176,255,0.07) }
.queue-item.active .queue-name { color: var(--accent) }
.queue-item.active .queue-num { opacity: 0.7 }
.queue-name { color: rgba(234,240,255,0.55) }
.queue-num { color: rgba(159,176,255,0.45) }
.queue-remove { color: rgba(234,240,255,0.55) }
.speed-val { border-color: rgba(217,178,90,0.22); color: rgba(234,240,255,0.80); }
.speed-val:focus { outline: none; border-color: rgba(217,178,90,0.55); color: var(--accent-strong); }
.theme-switcher-label { color: rgba(159,176,255,0.30) }
.theme-select {
  color: rgba(234,240,255,0.85); background-color: rgba(8,13,34,0.78); border-color: rgba(217,178,90,0.24);
  box-shadow: 0 8px 24px rgba(0,0,0,0.28), 0 1px 0 rgba(217,178,90,0.08) inset;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6'%3E%3Cpath fill='rgba(234,240,255,0.85)' d='M5 6 .4.8 1.6 0 5 3.5 8.4 0 9.6.8z'/%3E%3C/svg%3E");
}
.theme-select:focus { outline: none; border-color: rgba(217,178,90,0.55); box-shadow: 0 8px 24px rgba(0,0,0,0.28), 0 0 0 1px rgba(217,178,90,0.26); }
/* Modal must be near-solid so text stays legible over the blurred app behind it */
.queue-modal-panel.ui-panel {
  background: linear-gradient(180deg, rgba(12,20,52,0.985), rgba(6,10,28,0.99)); border-color: rgba(217,178,90,0.32);
  box-shadow: 0 24px 70px rgba(0,0,0,0.7), 0 3px 12px rgba(0,0,0,0.5), 0 1px 0 rgba(217,178,90,0.06) inset;
}
```

## themes/astrolabe/theme.js

```js
window.MYNYL_THEME_MODULES = window.MYNYL_THEME_MODULES || {};

/* ---- module-scope persistent state (survives across frames) ---- */
// Smoothed audio level so blooms ease in/out instead of jittering frame-to-frame.
let _smoothPulse = 0;
// Shooting-star "charge": rises on a loud groove peak, then decays. While >0 a
// streak is visible; its phase 0..1 drives where the streak sits along its arc.
let _shootCharge = 0;   // 0..1 visibility/intensity
let _shootPhase = 0;    // 0..1 progress of the streak across the disc
let _shootAngle = 0;    // base orientation (radians) chosen when a streak fires
let _lastT = 0;         // performance.now() ms of previous frame, for dt
let _prevPulse = 0;     // previous smoothed level, to detect a rising edge (peak)

// 40 stars, positions/brightness seeded deterministically from the index so the
// chart is stable every frame (no per-frame Math.random for positions). Polar:
// rT = normalized radius in [0.26, 0.92], a = angle. Built once, reused forever.
const STAR_COUNT = 40;
const STARS = [];
for (let i = 0; i < STAR_COUNT; i++) {
  // Decorrelated hashes from the index via sin*large + fract.
  const h1 = Math.sin(i * 12.9898) * 43758.5453;
  const h2 = Math.sin(i * 78.233) * 12543.213;
  const h3 = Math.sin(i * 39.425) * 24634.634;
  const f1 = h1 - Math.floor(h1);
  const f2 = h2 - Math.floor(h2);
  const f3 = h3 - Math.floor(h3);
  STARS.push({
    a: f1 * Math.PI * 2,            // angle around the disc
    rT: 0.26 + f2 * 0.66,           // radius band 0.26..0.92
    base: 0.45 + f3 * 0.55,         // base brightness 0.45..1
    tw: 1.2 + f1 * 3.5,             // twinkle speed
    phase: f2 * Math.PI * 2,        // twinkle phase offset
    big: f3 > 0.72                  // brightest stars (bloom + constellation nodes)
  });
}

// Constellation figures: a few short chains drawn between specific star indices.
// Kept as polylines so they read as engraved zodiac lines (2-3 small figures).
const CONSTELLATIONS = [
  [2, 7, 13, 19, 24],
  [4, 9, 16, 22],
  [11, 17, 28, 33, 37]
];

window.MYNYL_THEME_MODULES["astrolabe"] = {
  drawRecord({ angle, record, ctx, state }, mod) {
    // NOTE: destructure defaults below from the SAME object (see signature line);
    // grabbing it explicitly keeps the base-disc call obvious.
    const o = arguments[0];
    o.defaults.drawRecord(angle);            // paint base disc + grooves + label FIRST

    const { cx, cy, radius } = record;
    const playing = !!(state && state.playing);
    const rawPulse = Math.max(0, Math.min(1,
      state && typeof state.groovePulse === "number" ? state.groovePulse : 0));

    // ---- advance time-based state with a real dt (ms) ----
    const tMs = performance.now();
    let dt = _lastT ? (tMs - _lastT) : 16;
    _lastT = tMs;
    if (dt > 100) dt = 100;                   // clamp after tab-switch stalls
    const now = tMs / 1000;

    // Smooth the audio level (attack faster than release for snappy blooms).
    const target = rawPulse;
    const k = target > _smoothPulse ? 0.25 : 0.06;
    _smoothPulse += (target - _smoothPulse) * k;
    const pulse = _smoothPulse;

    // Fire a shooting star on a rising peak while playing.
    const rising = pulse - _prevPulse;
    _prevPulse = pulse;
    if (playing && _shootCharge <= 0.01 && rising > 0.10 && pulse > 0.45) {
      _shootCharge = 1;
      _shootPhase = 0;
      // Seed the streak orientation from the current time so it varies each fire.
      _shootAngle = (now * 1.7) % (Math.PI * 2);
    }
    if (_shootCharge > 0) {
      _shootPhase = Math.min(1, _shootPhase + dt / 700);  // ~0.7s to cross
      _shootCharge = Math.max(0, _shootCharge - dt / 900);
      if (_shootPhase >= 1) _shootCharge = 0;
    }

    const TWO_PI = Math.PI * 2;
    const toXY = (a, r) => [Math.cos(a) * r, Math.sin(a) * r];

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);                        // celestial chart wheels WITH the disc

    // Clip everything to the disc face so art never spills over the edge.
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.985, 0, TWO_PI);
    ctx.clip();

    // ---------- ecliptic band near the rim (labelled, 12 tick divisions) ----------
    const eclR = radius * 0.885;
    ctx.lineWidth = Math.max(1, radius * 0.004);
    ctx.strokeStyle = "rgba(217,178,90,0.34)";
    ctx.beginPath();
    ctx.arc(0, 0, eclR, 0, TWO_PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, eclR - radius * 0.03, 0, TWO_PI);
    ctx.strokeStyle = "rgba(217,178,90,0.18)";
    ctx.stroke();
    // 12 ticks (zodiac houses) between the two ecliptic rings.
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TWO_PI;
      const [x1, y1] = toXY(a, eclR);
      const [x2, y2] = toXY(a, eclR - radius * 0.03);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = "rgba(217,178,90,0.40)";
      ctx.lineWidth = Math.max(1, radius * 0.0035);
      ctx.stroke();
    }

    // ---------- constellation lines (engraved gold) ----------
    ctx.strokeStyle = "rgba(217,178,90,0.30)";
    ctx.lineWidth = Math.max(0.8, radius * 0.0028);
    ctx.lineCap = "round";
    for (let c = 0; c < CONSTELLATIONS.length; c++) {
      const chain = CONSTELLATIONS[c];
      ctx.beginPath();
      for (let n = 0; n < chain.length; n++) {
        const s = STARS[chain[n]];
        const [x, y] = toXY(s.a, s.rT * radius);
        if (n === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // ---------- star field ----------
    const bloom = pulse;                      // brightest stars bloom with audio
    for (let i = 0; i < STAR_COUNT; i++) {
      const s = STARS[i];
      const [x, y] = toXY(s.a, s.rT * radius);
      // Twinkle only while playing; settle to steady brightness when idle.
      const tw = playing
        ? 0.78 + 0.22 * Math.sin(now * s.tw + s.phase)
        : 1;
      let bright = s.base * tw;
      if (s.big) bright = Math.min(1, bright + bloom * 0.6);
      const size = radius * (s.big ? 0.012 : 0.006) * (0.85 + bright * 0.5);

      ctx.beginPath();
      ctx.arc(x, y, size, 0, TWO_PI);
      ctx.fillStyle = `rgba(234,240,255,${0.35 + bright * 0.6})`;
      if (s.big) {
        // additive bloom for the bright nodes
        ctx.shadowBlur = radius * (0.02 + bloom * 0.05);
        ctx.shadowColor = "rgba(159,176,255,0.7)";
      }
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // ---------- shooting-star streak on a groove peak ----------
    if (_shootCharge > 0.01) {
      // The streak arcs across the disc: head moves from one rim point toward the
      // opposite side along a gentle chord, fading over its life.
      const span = radius * 1.7;
      const startR = radius * 0.92;
      const a0 = _shootAngle;
      const headT = _shootPhase;
      const headX = Math.cos(a0) * startR + Math.cos(a0 + 2.3) * span * headT;
      const headY = Math.sin(a0) * startR + Math.sin(a0 + 2.3) * span * headT;
      const tailT = Math.max(0, headT - 0.18);
      const tailX = Math.cos(a0) * startR + Math.cos(a0 + 2.3) * span * tailT;
      const tailY = Math.sin(a0) * startR + Math.sin(a0 + 2.3) * span * tailT;
      const a = _shootCharge * (1 - Math.abs(headT - 0.5) * 0.6);

      ctx.globalCompositeOperation = "lighter";
      const grad = ctx.createLinearGradient(tailX, tailY, headX, headY);
      grad.addColorStop(0, "rgba(217,178,90,0)");
      grad.addColorStop(1, `rgba(234,240,255,${0.85 * a})`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = Math.max(1.2, radius * 0.006);
      ctx.lineCap = "round";
      ctx.shadowBlur = radius * 0.03;
      ctx.shadowColor = `rgba(159,176,255,${0.6 * a})`;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(headX, headY);
      ctx.stroke();
      // bright head
      ctx.beginPath();
      ctx.arc(headX, headY, radius * 0.01, 0, TWO_PI);
      ctx.fillStyle = `rgba(234,240,255,${a})`;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = "source-over";
    }

    ctx.restore();  // release disc clip

    // ---------- engraved compass-rose just outside the label ----------
    // Label ends at radius*labelRadius (~0.175); draw the rose ring from ~0.20.
    const roseInner = radius * 0.205;
    const roseOuter = radius * 0.255;
    ctx.strokeStyle = "rgba(217,178,90,0.45)";
    ctx.lineWidth = Math.max(0.9, radius * 0.003);
    ctx.beginPath();
    ctx.arc(0, 0, roseOuter, 0, TWO_PI);
    ctx.stroke();
    // 8-point rose: 4 long cardinal spokes + 4 short ordinal spokes.
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TWO_PI;
      const long = i % 2 === 0;
      const [x1, y1] = toXY(a, roseInner);
      const [x2, y2] = toXY(a, long ? roseOuter : roseInner + (roseOuter - roseInner) * 0.5);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = long ? "rgba(217,178,90,0.55)" : "rgba(217,178,90,0.30)";
      ctx.lineWidth = Math.max(0.9, radius * (long ? 0.0035 : 0.0022));
      ctx.stroke();
    }

    ctx.restore();  // release translate/rotate

    // Safety: ensure no global state leaks to the next layer/frame.
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = "source-over";
  }
};
```

> Implementation note on the signature: the engine invokes `drawRecord` with a single options object. The code reads `arguments[0]` once as `o` to keep the `o.defaults.drawRecord(angle)` base-disc call explicit, then uses the destructured `record`, `ctx`, `state`, `angle` for the overlay. All persistent state (`_smoothPulse`, the shooting-star charge/phase, `_lastT`) lives in module scope and is advanced by `performance.now()` deltas. `globalCompositeOperation` and `shadowBlur` are always reset to `source-over`/`0` before returning.

## Register in js/themes.js

Add this object to the `MYNYL_THEME_REGISTRY` array, **before** the trailing commented placeholder line `// { name: '', path: 'themes/' },`:

```js
{ name: 'Astrolabe', path: 'themes/astrolabe' },
```

The array then reads:

```js
window.MYNYL_THEME_REGISTRY = [
  { name: 'Wood', path: 'themes/wood', default: true },
  { name: 'Minimal Light', path: 'themes/minimal-light' },
  { name: 'Disco Pop', path: 'themes/disco-pop' },
  { name: 'Risograph', path: 'themes/risograph' },
  { name: 'Outrun Grid', path: 'themes/outrun-grid' },
  { name: 'Astrolabe', path: 'themes/astrolabe' },
];

// { name: '', path: 'themes/' },
```

## Build & test checklist

1. Create the folder `themes/astrolabe/` and add all six files: `theme.css`, `background.css`, `vinyl.css`, `arm.css`, `ui.css`, `theme.js` (exactly as above).
2. Add the registry entry to `js/themes.js` (previous section). Confirm `js/themes.js` is loaded in `index.html` in the order `audio.js → render.js → themes.js → player.js`.
3. Open `index.html` directly in a browser (no build step).
4. Open DevTools and select **"Astrolabe"** from the bottom-right `#theme-select` dropdown. Confirm: no console errors; the disc turns midnight-indigo with engraved meridian grooves and a gold bezel rim; the gold armillary label appears; the brass alidade arm and brass-on-midnight glass UI render; the choice persists across a page reload (`localStorage`).
5. Load a track named `Title - Artist.mp3` (so `window._trackTitle` / `window._trackArtist` populate). Drag the tonearm onto the disc, or press the play button / spacebar.
6. Confirm during playback: stars twinkle, constellation lines and the 12-tick ecliptic band are visible, the compass-rose sits just outside (never on) the label, and on loud passages a gold shooting-star streak arcs across while bright stars bloom.
7. Confirm the overlay does **not** paint over the centre label content — all overlay primitives stay at `r > radius*0.30` except the deliberate compass-rose ring at `r ≈ 0.205–0.255` and the ecliptic/stars further out. Confirm the disc art is clipped to the disc edge (nothing bleeds past the rim).
8. Confirm correct **no-file / idle** state: with no track loaded or paused, stars hold steady (no twinkle), no shooting star fires, and there are no console errors.
9. Resize the window small and large; confirm everything scales with `radius` (no hardcoded px), stays readable, and the renderer stays smooth (~60fps) — watch for frame drops from `shadowBlur`.

### Theme-specific GOTCHAS
- **Coordinate space:** `ctx` is already scaled to `devicePixelRatio`. Draw in CSS px only — never multiply by DPR.
- **Angle units differ:** `drawRecord` receives `angle` in **radians** (use directly with `ctx.rotate`); `drawArm` receives **degrees** (convert with `helpers.toRad`). This theme only overrides `drawRecord`, so the arm uses the engine default — no conversion needed here.
- **Rotate with vs. hold still:** the celestial chart must wheel with the disc, so all overlay drawing happens inside `ctx.rotate(angle)`. The canvas element itself never rotates.
- **Label clearance:** keep overlay primitives at `r > radius*0.30` to clear the label, except the intentional compass-rose drawn just outside it (`r ≈ 0.205+`). The label radius is `theme.labelRadius ≈ 0.175`.
- **Clip to disc:** the star field, ecliptic, constellations, and shooting star are clipped to `r = radius*0.985` so nothing spills past the rim. The compass-rose is drawn after the clip is released but stays well inside the disc.
- **Reset global state:** `globalCompositeOperation` is set to `'lighter'` only for the shooting-star bloom and is reset to `'source-over'`; `shadowBlur` is reset to `0` after every glow. Both are reset again at the very end before returning — required so subsequent frames/layers are not corrupted.
- **Perf:** `shadowBlur` is the dominant cost. Glow is limited to the ~12 bright stars and the brief shooting star; total per-frame strokes stay well under ~100. Star positions are seeded once from the index (`Math.sin(i*…)`), never via per-frame `Math.random()`, so the chart is stable.
- **Persistent state:** smoothing and the shooting-star charge/phase live in module scope and advance by `performance.now()` deltas (clamped to 100ms) so a backgrounded tab does not cause a huge jump on return.
