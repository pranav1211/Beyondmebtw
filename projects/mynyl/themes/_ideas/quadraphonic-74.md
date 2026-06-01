# Quadraphonic 74

A 1970s walnut-and-burnt-orange listening room — earth tones, warm amber dial light, fully analog calm, with a working VU-meter swinging by the label.

- Folder: `themes/quadraphonic-74/`
- Registry display name: **Quadraphonic '74**

## Overview

Quadraphonic '74 is a dark/warm theme evoking a 1974 receiver faceplate: a flat matte charcoal pressing with amber etched grooves, a big cream-and-burnt-orange retro label, a heavy chunky vintage tonearm with a fat counterweight, and a deep walnut console UI with cream-on-walnut text and an avocado-green slider fill. The buttons read like backlit dial caps with amber inset glow, and the theme dropdown is styled as a tuner readout. The signature move lives in `theme.js`: after the base disc is painted, the overlay draws a fixed (held still, upright) 180-degree amber VU-meter dial arc just outside the centre label, with engraved tick marks and a single fine needle that swings from left (0) to right (full) driven by a smoothed copy of `state.groovePulse`, giving it real analog inertia while the disc spins beneath it. The theme does **not** degrade to CSS-only: without `theme.js` you lose the VU meter (the disc still renders fully from the CSS tokens), so the JS module is required for the complete look. All four CSS files are pure tokens and stand alone.

## themes/quadraphonic-74/theme.css

```css
@import url('./background.css');
@import url('./vinyl.css');
@import url('./arm.css');
@import url('./ui.css');
```

## themes/quadraphonic-74/background.css

```css
:root {
  /* layout / geometry */
  --player-record-scale: 0.42;
  --arm-pivot-offset-x: 1.05;
  --arm-pivot-offset-y: -0.85;
  --arm-outer-radius: 0.91;
  --arm-inner-radius: 0.30;
  --arm-outer-offset-x: -0.10;
  --arm-outer-offset-y: -0.85;
  --arm-park-offset-x: 1.20;
  --arm-park-offset-y: 0.30;

  /* wood-room warmth, tube-glow breathing */
  --bg-center-rgb: 70,52,30;
  --bg-mid-rgb: 40,28,16;
  --bg-edge-0: #1c130a;
  --bg-edge-1: #0d0905;
  --bg-glow-strength: 0.9;
  --bg-drift-x: 0.04;
  --bg-drift-y: 0.03;

  /* drop-hint overlay — warm amber */
  --hint-ring: rgba(217,164,65,0.50);
  --hint-dot: rgba(192,86,31,0.95);
  --hint-glow: rgba(217,164,65,0.45);
  --hint-text: rgba(239,226,198,0.90);
}
```

## themes/quadraphonic-74/vinyl.css

```css
:root {
  /* flat matte 70s pressing */
  --vinyl-style: etched;
  --vinyl-disc: #161210;
  --vinyl-edge: rgba(216,164,65,0.10);
  --vinyl-rim-light: rgba(216,164,65,0.06);
  --vinyl-rim-shadow: rgba(0,0,0,0.45);
  --vinyl-shadow-ring: rgba(0,0,0,0.40);

  /* warm-amber etched grooves */
  --vinyl-groove-rgb: 216,164,65;
  --vinyl-groove-alpha: 0.06;
  --vinyl-groove-pulse: 0.04;
  --vinyl-groove-spacing: 1.6;
  --vinyl-groove-width: 0.7;
  --vinyl-groove-start: 0.20;
  --vinyl-groove-end: 0.91;
  --vinyl-groove-warp: 0.03;

  /* kill the gloss — flat matte */
  --vinyl-sheen: 0.02;
  --vinyl-sheen-width: 0.05;
  --vinyl-specular: 0;
  --vinyl-depth: 0.5;

  /* big retro label */
  --vinyl-label-radius: 0.20;
  --vinyl-hole-radius: 0.02;
  --vinyl-label-0: #efe2c6;
  --vinyl-label-55: #c0561f;
  --vinyl-label-100: #6b3410;
  --vinyl-label-ring: rgba(74,47,26,0.50);
  --vinyl-label-stroke: rgba(0,0,0,0.30);
  --vinyl-label-art-base: #1c130a;
  --vinyl-hole-fill: #2a1a0c;
}
```

## themes/quadraphonic-74/arm.css

```css
:root {
  /* heavy vintage tonearm with a fat counterweight */
  --arm-style: chunky;
  --arm-tube-width: 0.026;
  --arm-shadow-blur: 14;
  --arm-shadow-offset-y: 5;
  --arm-highlight-alpha: 0.07;
  --arm-0: #2a1c10;
  --arm-25: #6b4a28;
  --arm-60: #c9a06a;
  --arm-100: #3a2614;

  /* harvest-gold headshell + cream needle */
  --arm-headshell: #d9a441;
  --arm-headshell-length: 0.10;
  --arm-headshell-width: 0.018;
  --arm-headshell-bend-deg: -18;
  --arm-needle: rgba(239,226,198,0.80);
  --arm-needle-tip: #efe2c6;
  --arm-needle-width: 1.6;
  --arm-needle-length: 0.55;

  /* fat counterweight */
  --arm-counterweight-radius: 0.045;
  --arm-counterweight-offset: 0.15;
  --arm-cw-0: #8a6a3a;
  --arm-cw-55: #4a3210;
  --arm-cw-100: #2a1a0c;

  /* pivot bearing */
  --arm-pivot-radius: 0.03;
  --arm-pivot-inner-radius: 0.30;
  --arm-pivot-0: #e6c98a;
  --arm-pivot-50: #7a5226;
  --arm-pivot-100: #2a1a0c;
}
```

## themes/quadraphonic-74/ui.css

```css
:root {
  --page-bg: #1c130a;
  --glass-bg: rgba(28,19,10,0.70);
  --glass-border: rgba(192,86,31,0.16);
  --glass-inset: rgba(217,164,65,0.05);
  --text-main: rgba(240,227,200,0.78);
  --text-soft: rgba(201,160,106,0.62);
  --text-faint: rgba(201,160,106,0.32);
  --accent: #c0561f;
  --accent-strong: #d9a441;
  --accent-dim: rgba(192,86,31,0.42);
  --accent-glow: rgba(192,86,31,0.16);
  --surface-1: rgba(58,38,20,0.88);
  --surface-2: rgba(22,14,7,0.94);
  --surface-3: rgba(74,47,26,0.90);
  --surface-4: rgba(34,21,10,0.96);
  --border-soft: rgba(192,120,50,0.22);
  --border-strong: rgba(217,164,65,0.52);
}
html, body { background: var(--page-bg) }
.eye-btn { color: var(--accent-dim) }
.eye-btn:hover, .eye-zone:hover .eye-btn { color: rgba(240,227,200,0.92) }
.ui-panel {
  background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 8px; padding: 16px 18px;
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 12px 44px rgba(0,0,0,0.6), 0 3px 10px rgba(0,0,0,0.4), 0 1px 0 var(--glass-inset) inset, 0 -1px 0 rgba(0,0,0,0.25) inset;
}
.upload-label, .speed-label, .queue-label { color: rgba(201,160,106,0.30) }
.upload-btn {
  background: linear-gradient(180deg, var(--surface-1) 0%, var(--surface-2) 100%); border-color: rgba(192,120,50,0.34); color: rgba(240,227,200,0.58);
  box-shadow: 0 1px 0 rgba(217,164,65,0.06) inset, 0 3px 12px rgba(0,0,0,0.48);
}
.upload-btn:hover { border-color: rgba(217,164,65,0.72); color: rgba(245,232,205,1); background: linear-gradient(180deg, var(--surface-3) 0%, var(--surface-4) 100%); box-shadow: 0 1px 0 rgba(217,164,65,0.12) inset, 0 5px 20px rgba(0,0,0,0.58), 0 0 24px rgba(192,86,31,0.15); }
.upload-btn:active { transform: translateY(1px); box-shadow: inset 0 2px 6px rgba(0,0,0,0.5), inset 0 1px 0 rgba(217,164,65,0.05); }
.ctrl-btn, .speed-btn {
  background: radial-gradient(circle at 36% 32%, rgba(58,38,20,0.93), rgba(18,11,5,0.97)); border-color: var(--border-soft); color: rgba(240,227,200,0.72);
  box-shadow: 4px 5px 12px rgba(0,0,0,0.55), -3px -3px 9px rgba(217,164,65,0.04), 0 1px 0 rgba(217,164,65,0.07) inset;
}
.ctrl-btn:hover, .speed-btn:hover { background: radial-gradient(circle at 36% 32%, rgba(78,50,26,0.93), rgba(28,17,8,0.97)); border-color: var(--border-strong); color: var(--accent-strong); box-shadow: 5px 6px 16px rgba(0,0,0,0.62), -3px -3px 10px rgba(217,164,65,0.06), 0 1px 0 rgba(217,164,65,0.11) inset, 0 0 22px var(--accent-glow); }
.ctrl-btn:active, .speed-btn:active { box-shadow: inset 3px 3px 8px rgba(0,0,0,0.6), inset -2px -2px 6px rgba(217,164,65,0.05); }
.ctrl-btn.active { background: radial-gradient(circle at 36% 32%, rgba(96,46,18,0.96), rgba(42,22,8,0.99)); border-color: rgba(217,164,65,0.74); color: #d9a441; box-shadow: inset 2px 2px 7px rgba(0,0,0,0.5), inset -1px -1px 4px rgba(217,164,65,0.07), 0 0 24px rgba(192,86,31,0.24); }
.vol-icon { color: rgba(201,160,106,0.28) }
.slider-track { background: rgba(217,164,65,0.10) }
.slider-fill { background: linear-gradient(90deg, rgba(107,122,58,0.72), rgba(133,150,70,0.88)) }
.slider-thumb { background: #d9c089; box-shadow: 0 0 0 1px rgba(217,164,65,0.24); }
.kbd-hint { color: rgba(201,160,106,0.13) }
.track-title { color: var(--text-main) }
.track-artist, .queue-count { color: var(--text-soft) }
.queue-list::-webkit-scrollbar-track { background: rgba(217,164,65,0.04) }
.queue-list::-webkit-scrollbar-thumb { background: rgba(192,86,31,0.28); border-radius: 2px }
.queue-item { border-bottom-color: rgba(217,164,65,0.05) }
.queue-item:hover { background: rgba(192,86,31,0.10) }
.queue-item.active .queue-name { color: var(--accent-strong) }
.queue-item.active .queue-num { opacity: 0.7 }
.queue-name { color: rgba(240,227,200,0.55) }
.queue-num { color: rgba(201,160,106,0.38) }
.queue-remove { color: rgba(201,160,106,0.58) }
.speed-val { border-color: rgba(192,120,50,0.20); color: rgba(240,227,200,0.80); }
.speed-val:focus { outline: none; border-color: rgba(217,164,65,0.5); color: var(--accent-strong); }
.theme-switcher-label { color: rgba(201,160,106,0.24) }
.theme-select {
  color: rgba(240,227,200,0.82); background-color: rgba(22,14,7,0.74); border-color: rgba(192,120,50,0.24);
  box-shadow: 0 8px 24px rgba(0,0,0,0.28), 0 1px 0 rgba(217,164,65,0.08) inset;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6'%3E%3Cpath fill='rgba(240,227,200,0.82)' d='M5 6 .4.8 1.6 0 5 3.5 8.4 0 9.6.8z'/%3E%3C/svg%3E");
}
.theme-select:focus { outline: none; border-color: rgba(217,164,65,0.54); box-shadow: 0 8px 24px rgba(0,0,0,0.28), 0 0 0 1px rgba(217,164,65,0.24); }
/* Modal must be near-solid so text stays legible over the blurred app behind it */
.queue-modal-panel.ui-panel {
  background: linear-gradient(180deg, rgba(34,22,11,0.985), rgba(18,11,5,0.99)); border-color: rgba(192,120,50,0.32);
  box-shadow: 0 24px 70px rgba(0,0,0,0.7), 0 3px 12px rgba(0,0,0,0.5), 0 1px 0 rgba(217,164,65,0.05) inset;
}
```

## themes/quadraphonic-74/theme.js

```javascript
window.MYNYL_THEME_MODULES = window.MYNYL_THEME_MODULES || {};

// ── Module-scope persistent state for analog needle inertia ──
// `smoothed` is the eased value the needle actually points at (0..1).
// `lastT` lets us advance smoothing in real time (frame-rate independent)
// instead of a fixed per-frame step, so motion feels identical at 30 or 144 fps.
let vuSmoothed = 0;
let vuLastT = 0;

window.MYNYL_THEME_MODULES["quadraphonic-74"] = {
  drawRecord({ angle, record, ctx, state }) {
    // 1) Paint the base disc + grooves + label first; we only overlay on top.
    //    (defaults is destructured implicitly via the engine — call it explicitly.)
    arguments[0].defaults.drawRecord(angle);

    const { cx, cy, radius } = record;

    // ── advance the smoothing in real time ──
    const nowS = performance.now() / 1000;
    let dt = vuLastT ? nowS - vuLastT : 0;
    vuLastT = nowS;
    // clamp dt so a tab regaining focus after a long pause doesn't snap the needle
    if (dt > 0.1) dt = 0.1;

    const playing = !!(state && state.playing);
    const rawPulse = Math.max(0, Math.min(1,
      state && typeof state.groovePulse === "number" ? state.groovePulse : 0));
    // When idle/no file, gently relax toward a low resting deflection.
    const target = playing ? rawPulse : 0;
    // Time-based ease: framerate-independent equivalent of `+= (target-s)*0.15`.
    // 1 - e^(-k*dt) gives the same easing regardless of frame interval (k≈9 ~ the old 0.15@60fps).
    const ease = 1 - Math.exp(-9 * dt);
    vuSmoothed += (target - vuSmoothed) * ease;
    const v = Math.max(0, Math.min(1, vuSmoothed));

    // ── Geometry of the dial (HELD STILL — do NOT rotate with the disc) ──
    // The arc sits just outside the centre label, between r*0.24 and r*0.46.
    const R_OUTER = radius * 0.46;   // outer rim of the dial arc
    const R_ARC   = radius * 0.40;   // the thin scale arc the ticks hang from
    const R_TICK_IN = radius * 0.355;
    const R_NEEDLE  = radius * 0.435; // needle reach
    const HUB_R   = radius * 0.022;   // needle pivot hub
    // 180° faceplate: sweep from left (PI, value 0) to right (0/2PI, value 1).
    // We draw in canvas space where 0 rad points right and angles grow clockwise (y down).
    // Put the dial in the UPPER half so the needle swings above the hub like a receiver.
    const A_START = Math.PI;            // left end  -> value 0
    const A_END   = Math.PI * 2;        // right end -> value 1 (i.e. 0)
    const SPAN    = A_END - A_START;    // PI radians

    const AMBER   = "rgba(217,164,65,";
    const AMBER_HI = "rgba(239,226,198,";
    const FLAME   = "rgba(192,86,31,";

    ctx.save();
    ctx.translate(cx, cy);
    // NOTE: intentionally no ctx.rotate(angle) — the faceplate holds still
    // while the disc spins underneath it.

    // 2) Faceplate backing wedge (a subtle dark amber pad behind the arc).
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, R_OUTER, A_START, A_END);
    ctx.closePath();
    const pad = ctx.createLinearGradient(0, -R_OUTER, 0, 0);
    pad.addColorStop(0, "rgba(34,21,10,0.55)");
    pad.addColorStop(1, "rgba(18,11,5,0.18)");
    ctx.fillStyle = pad;
    ctx.fill();

    // 3) The thin scale arc.
    ctx.lineWidth = Math.max(1, radius * 0.006);
    ctx.strokeStyle = AMBER + (playing ? 0.55 : 0.40) + ")";
    ctx.beginPath();
    ctx.arc(0, 0, R_ARC, A_START, A_END);
    ctx.stroke();

    // 4) Engraved tick marks. 21 ticks; every 5th is a long "major" tick.
    //    The upper ~70% are amber, the top end tips into flame-orange like a
    //    1974 VU "peak" zone.
    const TICKS = 21;
    for (let i = 0; i < TICKS; i++) {
      const t = i / (TICKS - 1);                 // 0..1 along the scale
      const a = A_START + SPAN * t;              // angle on the arc
      const major = i % 5 === 0;
      const len = radius * (major ? 0.045 : 0.026);
      const inR = R_TICK_IN;
      const outR = inR + len;
      const ca = Math.cos(a), sa = Math.sin(a);
      // peak zone: last ~20% of the scale glows flame
      const peak = t > 0.8;
      ctx.strokeStyle = (peak ? FLAME : AMBER) + (major ? 0.85 : 0.5) + ")";
      ctx.lineWidth = major ? Math.max(1.2, radius * 0.005) : Math.max(0.8, radius * 0.0028);
      ctx.beginPath();
      ctx.moveTo(ca * inR, sa * inR);
      ctx.lineTo(ca * outR, sa * outR);
      ctx.stroke();
    }

    // 5) The needle. It swings from A_START (v=0) to A_END (v=1).
    const na = A_START + SPAN * v;
    const nx = Math.cos(na) * R_NEEDLE;
    const ny = Math.sin(na) * R_NEEDLE;

    // soft amber glow on the needle for that backlit-dial feel
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.shadowBlur = radius * 0.03;
    ctx.shadowColor = AMBER + "0.5)";
    ctx.lineCap = "round";
    ctx.lineWidth = Math.max(1, radius * 0.0045);
    ctx.strokeStyle = AMBER_HI + (playing ? 0.95 : 0.7) + ")";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(nx, ny);
    ctx.stroke();
    // reset glow state before any further drawing
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();

    // 6) Needle hub.
    const hub = ctx.createRadialGradient(0, 0, 0, 0, 0, HUB_R);
    hub.addColorStop(0, "#e6c98a");
    hub.addColorStop(0.55, "#7a5226");
    hub.addColorStop(1, "#2a1a0c");
    ctx.fillStyle = hub;
    ctx.beginPath();
    ctx.arc(0, 0, HUB_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = Math.max(0.8, radius * 0.0025);
    ctx.strokeStyle = AMBER + "0.4)";
    ctx.beginPath();
    ctx.arc(0, 0, HUB_R, 0, Math.PI * 2);
    ctx.stroke();

    // hard reset of any leftover state, then unwind the translate.
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();
  }
};
```

> Implementation notes for the next AI:
> - `defaults.drawRecord(angle)` is invoked via `arguments[0].defaults` so the destructured parameter list stays short; you may equally destructure `defaults` directly in the signature — both are valid. It must be the first thing called.
> - The needle is driven by `vuSmoothed`, a module-scope variable eased toward `state.groovePulse` every frame using a time-based `1 - e^(-k·dt)` factor (so it behaves the same at any frame rate), giving the analog inertia. `vuLastT` stores the previous timestamp; `dt` is clamped to 0.1s so a backgrounded tab does not snap the needle.
> - The whole dial is drawn after `translate(cx, cy)` **without** `ctx.rotate(angle)`, so it holds still and upright while the disc spins beneath it.
> - All radii stay at `r ≥ radius*0.24`, clear of the `radius*0.20` label; the dial intentionally sits in the gap just outside it.
> - `shadowBlur` and `globalCompositeOperation` are reset to `0` / `'source-over'` before each `restore()`.

## Register in js/themes.js

Add this object to the `window.MYNYL_THEME_REGISTRY` array, immediately after `Outrun Grid` and **before** the trailing commented placeholder line `// { name: '', path: 'themes/' },`:

```javascript
  { name: "Quadraphonic '74", path: 'themes/quadraphonic-74' },
```

Resulting array:

```javascript
window.MYNYL_THEME_REGISTRY = [
  { name: 'Wood', path: 'themes/wood', default: true },
  { name: 'Minimal Light', path: 'themes/minimal-light' },
  { name: 'Disco Pop', path: 'themes/disco-pop' },
  { name: 'Risograph', path: 'themes/risograph' },
  { name: 'Outrun Grid', path: 'themes/outrun-grid' },
  { name: "Quadraphonic '74", path: 'themes/quadraphonic-74' },
];

// { name: '', path: 'themes/' },
```

The folder id in `theme.js` (`MYNYL_THEME_MODULES["quadraphonic-74"]`) must exactly match the last path segment `themes/quadraphonic-74`.

## Build & test checklist

1. Create the folder `themes/quadraphonic-74/` and add all six files: `theme.css`, `background.css`, `vinyl.css`, `arm.css`, `ui.css`, `theme.js`.
2. Register the theme in `js/themes.js` (above).
3. Open `index.html` directly in a browser (no build step).
4. Open the bottom-right `#theme-select` dropdown and choose **Quadraphonic '74**. Confirm the page background turns deep walnut, panels turn brown glass, the slider fill is avocado green, and the dropdown looks like a tuner readout. Reload and confirm the selection persists (localStorage).
5. Load a track via the upload button, named in `Title - Artist.mp3` form (e.g. `Sunflower - The Vibes.mp3`) so `window._trackTitle` / `window._trackArtist` populate.
6. Drag the tonearm onto the disc (or press Space / the play button). Through the 2s spin-up crackle and into playback, confirm:
   - No console errors at any point.
   - The amber VU dial arc renders just outside the cream label and its needle swings left-to-right with the music, lagging slightly (analog inertia), not snapping.
   - The overlay correctly clears / sits outside the centre label — the label text and any album art remain visible (art is clipped to the disc by the engine; the dial never paints over the hole).
   - Idle / no-file state: with nothing playing the needle relaxes to the left rest position and stays still; the disc shows grooves + label only.
7. Resize the window from very small to very large and confirm the dial, ticks, and needle scale with `radius` (no hardcoded px) and stay legible at both extremes.
8. Confirm smooth 60fps playback — the dial adds only ~25 primitives per frame.

**Theme-specific GOTCHAS**
- The `ctx` passed to `drawRecord` / `drawArm` is **already scaled to devicePixelRatio** — draw in CSS px and never multiply by DPR yourself.
- `angle` is in **radians** in `drawRecord`, but in **degrees** in `drawArm` (convert with `helpers.toRad`). This theme only overrides `drawRecord`, so it stays in radians.
- Always call `defaults.drawRecord(angle)` **first**, then overlay.
- The VU dial is drawn **without `ctx.rotate(angle)`** so it holds still while the disc spins — do not accidentally add a rotate.
- Keep every overlay radius `> radius*0.30` to stay clear of the `radius*0.20` label (this dial's inner tick radius is `radius*0.355`).
- Always reset `ctx.shadowBlur = 0` and `ctx.globalCompositeOperation = 'source-over'` before returning / before each `restore()` — the needle uses `'lighter'` + `shadowBlur` for its glow, and leaking that state corrupts the next frame's base disc.
- `shadowBlur` is the main per-frame cost; only the single needle uses it here. Keep it that way — do not add `shadowBlur` to the tick loop.
- `performance.now()` is used for time-based smoothing; never use per-frame `Math.random()` for positions.
- Font available if you add labels: `'Space Mono', monospace`.
