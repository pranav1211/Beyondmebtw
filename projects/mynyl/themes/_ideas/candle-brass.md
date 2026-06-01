# Candle and Brass

A velvet jazz lounge lit by one guttering candle: warm amber-on-black intimacy where the only light is firelight catching brass and a wax-deep oxblood label.

Folder: `themes/candle-brass/` · Registry display name: **"Candle & Brass"**

## Overview

Candle and Brass is a dark/warm theme built around a single light source. The disc is near-black with a faint red bias (`#0d0907`), etched grooves shimmer in candle-amber, and the label reads as deep oxblood wax ringed by a thin brass line. The tonearm is polished golden brass, and the background is a deep ember radial that drifts slightly more vertically than horizontally, as if heat is rising. The **signature move** is a `theme.js` `drawRecord` overlay: after the base disc is painted, it clips to the disc face and, in `lighter` composite mode, paints one soft off-center firelight pool in the upper-left, gutters its intensity and position with a layered-sine flicker driven by `performance.now()` (time-based, NOT spin-locked), fans the flame brighter with `state.groovePulse`, adds a brass glint arc on the flame-facing edge of the label ring, and lofts 2-3 faint ember sparks upward. The overlay degrades gracefully: the palette alone already reads as a complete theme, so `theme.js` is purely an enhancement and the theme works with the stub module if the JS is removed.

## themes/candle-brass/theme.css

```css
@import url('./background.css');
@import url('./vinyl.css');
@import url('./arm.css');
@import url('./ui.css');
```

## themes/candle-brass/background.css

```css
:root {
  /* layout / geometry (carried over from the canonical wood theme) */
  --player-record-scale: 0.42;
  --arm-pivot-offset-x: 1.05;
  --arm-pivot-offset-y: -0.85;
  --arm-outer-radius: 0.91;
  --arm-inner-radius: 0.30;
  --arm-outer-offset-x: -0.10;
  --arm-outer-offset-y: -0.85;
  --arm-park-offset-x: 1.20;
  --arm-park-offset-y: 0.30;

  /* deep ember radial: one candle */
  --bg-center-rgb: 64,26,8;
  --bg-mid-rgb: 26,11,5;
  --bg-edge-0: #0a0402;
  --bg-edge-1: #040100;
  --bg-glow-strength: 1.0;
  --bg-drift-x: 0.05;
  --bg-drift-y: 0.08;   /* more vertical = flame rising */

  /* hint overlay: warm candlelit amber */
  --hint-ring: rgba(232,183,106,0.50);
  --hint-dot: rgba(255,210,130,0.95);
  --hint-glow: rgba(255,170,60,0.50);
  --hint-text: rgba(248,222,168,0.90);
}
```

## themes/candle-brass/vinyl.css

```css
:root {
  --vinyl-style: etched;

  /* near-black disc, redder and darker than wood */
  --vinyl-disc: #0d0907;
  --vinyl-edge: rgba(255,196,120,0.05);
  --vinyl-rim-light: rgba(255,210,150,0.05);
  --vinyl-rim-shadow: rgba(0,0,0,0.40);
  --vinyl-shadow-ring: none;

  /* candle-amber grooves; etched rings shimmer like reflected flame */
  --vinyl-groove-rgb: 255,196,120;
  --vinyl-groove-alpha: 0.05;
  --vinyl-groove-pulse: 0.06;
  --vinyl-groove-spacing: 1.5;
  --vinyl-groove-width: 0.75;
  --vinyl-groove-start: 0.19;
  --vinyl-groove-end: 0.91;
  --vinyl-groove-warp: 0.05;

  /* warm sheen + low specular glint */
  --vinyl-sheen: 0.06;
  --vinyl-sheen-width: 0.06;
  --vinyl-specular: 0.09;
  --vinyl-depth: 0.7;

  /* oxblood-wax label, thin brass ring */
  --vinyl-label-radius: 0.175;
  --vinyl-hole-radius: 0.02;
  --vinyl-label-0: #6a1812;
  --vinyl-label-55: #3e0f0b;
  --vinyl-label-100: #1c0705;
  --vinyl-label-ring: rgba(232,183,106,0.45);
  --vinyl-label-stroke: rgba(0,0,0,0.34);
  --vinyl-label-art-base: #1a0805;
  --vinyl-hole-fill: #160a06;
}
```

## themes/candle-brass/arm.css

```css
:root {
  --arm-style: classic;
  --arm-tube-width: 0.022;
  --arm-shadow-blur: 14;
  --arm-shadow-offset-y: 5;
  --arm-highlight-alpha: 0.09;

  /* polished brass: warmer + more golden than wood bronze */
  --arm-0: #2a1c08;
  --arm-25: #6e4e18;
  --arm-60: #e8c270;
  --arm-100: #4a3210;

  --arm-headshell: #c8a258;
  --arm-headshell-length: 0.10;
  --arm-headshell-width: 0.016;
  --arm-headshell-bend-deg: -18;

  --arm-needle: rgba(255,224,170,0.80);
  --arm-needle-tip: #ffe6aa;
  --arm-needle-width: 1.5;
  --arm-needle-length: 0.55;

  /* brass counterweight */
  --arm-counterweight-radius: 0.038;
  --arm-counterweight-offset: 0.15;
  --arm-cw-0: #8a6a3a;
  --arm-cw-55: #4a3210;
  --arm-cw-100: #1a1004;

  /* brass pivot bearing */
  --arm-pivot-radius: 0.03;
  --arm-pivot-inner-radius: 0.30;
  --arm-pivot-0: #f0d28a;
  --arm-pivot-50: #6e4c18;
  --arm-pivot-100: #1a1004;
}
```

## themes/candle-brass/ui.css

```css
:root {
  --page-bg: #050201;
  --glass-bg: rgba(10,4,2,0.60);
  --glass-border: rgba(210,165,90,0.18);
  --glass-inset: rgba(255,210,130,0.04);
  --text-main: rgba(248,222,168,0.64);
  --text-soft: rgba(248,222,168,0.34);
  --text-faint: rgba(248,222,168,0.20);
  --accent: #e8b76a;
  --accent-strong: #ffd699;
  --accent-dim: rgba(200,150,80,0.42);
  --accent-glow: rgba(255,170,60,0.14);
  --surface-1: rgba(44,18,6,0.88);
  --surface-2: rgba(14,5,2,0.94);
  --surface-3: rgba(60,26,8,0.90);
  --surface-4: rgba(26,10,3,0.96);
  --border-soft: rgba(200,150,80,0.22);
  --border-strong: rgba(216,170,96,0.54);
}
html, body { background: var(--page-bg) }
.eye-btn { color: var(--accent-dim) }
.eye-btn:hover, .eye-zone:hover .eye-btn { color: rgba(255,222,150,0.92) }
.ui-panel {
  background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 8px; padding: 16px 18px;
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 12px 44px rgba(0,0,0,0.6), 0 3px 10px rgba(0,0,0,0.4), 0 1px 0 var(--glass-inset) inset, 0 -1px 0 rgba(0,0,0,0.25) inset;
}
.upload-label, .speed-label, .queue-label { color: rgba(248,222,168,0.30) }
.upload-btn {
  background: linear-gradient(180deg, var(--surface-1) 0%, var(--surface-2) 100%); border-color: rgba(200,150,80,0.34); color: rgba(248,222,168,0.58);
  box-shadow: 0 1px 0 rgba(255,205,120,0.05) inset, 0 3px 12px rgba(0,0,0,0.48);
}
.upload-btn:hover { border-color: rgba(216,170,96,0.72); color: rgba(255,232,170,1); background: linear-gradient(180deg, var(--surface-3) 0%, var(--surface-4) 100%); box-shadow: 0 1px 0 rgba(255,205,120,0.10) inset, 0 5px 20px rgba(0,0,0,0.58), 0 0 24px rgba(255,170,60,0.14); }
.upload-btn:active { transform: translateY(1px); box-shadow: inset 0 2px 6px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,205,120,0.04); }
.ctrl-btn, .speed-btn {
  background: radial-gradient(circle at 36% 32%, rgba(50,21,7,0.93), rgba(13,5,2,0.97)); border-color: var(--border-soft); color: rgba(248,222,168,0.72);
  box-shadow: 4px 5px 12px rgba(0,0,0,0.55), -3px -3px 9px rgba(255,190,100,0.035), 0 1px 0 rgba(255,195,100,0.07) inset;
}
.ctrl-btn:hover, .speed-btn:hover { background: radial-gradient(circle at 36% 32%, rgba(72,30,10,0.93), rgba(22,9,3,0.97)); border-color: var(--border-strong); color: var(--accent-strong); box-shadow: 5px 6px 16px rgba(0,0,0,0.62), -3px -3px 10px rgba(255,190,100,0.05), 0 1px 0 rgba(255,195,100,0.11) inset, 0 0 22px var(--accent-glow); }
.ctrl-btn:active, .speed-btn:active { box-shadow: inset 3px 3px 8px rgba(0,0,0,0.6), inset -2px -2px 6px rgba(255,190,100,0.045); }
.ctrl-btn.active { background: radial-gradient(circle at 36% 32%, rgba(92,38,12,0.96), rgba(38,15,5,0.99)); border-color: rgba(232,183,106,0.74); color: #ffce7a; box-shadow: inset 2px 2px 7px rgba(0,0,0,0.5), inset -1px -1px 4px rgba(255,190,100,0.06), 0 0 24px rgba(255,170,60,0.22); }
.vol-icon { color: rgba(248,222,168,0.28) }
.slider-track { background: rgba(255,210,150,0.08) }
.slider-fill { background: linear-gradient(90deg, rgba(200,140,55,0.68), rgba(232,183,106,0.90)) }
.slider-thumb { background: #e8c270; box-shadow: 0 0 0 1px rgba(255,205,120,0.24); }
.kbd-hint { color: rgba(248,222,168,0.11) }
.track-title { color: var(--text-main) }
.track-artist, .queue-count { color: var(--text-soft) }
.queue-list::-webkit-scrollbar-track { background: rgba(255,210,150,0.04) }
.queue-list::-webkit-scrollbar-thumb { background: rgba(210,160,80,0.26); border-radius: 2px }
.queue-item { border-bottom-color: rgba(255,210,150,0.05) }
.queue-item:hover { background: rgba(232,170,70,0.08) }
.queue-item.active .queue-name { color: var(--accent) }
.queue-item.active .queue-num { opacity: 0.7 }
.queue-name { color: rgba(248,222,168,0.52) }
.queue-num { color: rgba(248,222,168,0.36) }
.queue-remove { color: rgba(248,222,168,0.56) }
.speed-val { border-color: rgba(200,150,80,0.20); color: rgba(248,222,168,0.78); }
.speed-val:focus { outline: none; border-color: rgba(216,170,96,0.5); color: var(--accent-strong); }
.theme-switcher-label { color: rgba(248,222,168,0.22) }
.theme-select {
  color: rgba(248,222,168,0.8); background-color: rgba(13,5,2,0.74); border-color: rgba(200,150,80,0.24);
  box-shadow: 0 8px 24px rgba(0,0,0,0.28), 0 1px 0 rgba(255,205,120,0.08) inset;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6'%3E%3Cpath fill='rgba(248,222,168,0.72)' d='M5 6 .4.8 1.6 0 5 3.5 8.4 0 9.6.8z'/%3E%3C/svg%3E");
}
.theme-select:focus { outline: none; border-color: rgba(216,170,96,0.54); box-shadow: 0 8px 24px rgba(0,0,0,0.28), 0 0 0 1px rgba(216,170,96,0.24); }
/* Modal must be near-solid so text stays legible over the blurred app behind it */
.queue-modal-panel.ui-panel {
  background: linear-gradient(180deg, rgba(28,12,5,0.985), rgba(12,5,2,0.99)); border-color: rgba(200,150,80,0.32);
  box-shadow: 0 24px 70px rgba(0,0,0,0.7), 0 3px 12px rgba(0,0,0,0.5), 0 1px 0 rgba(255,205,120,0.05) inset;
}
```

## themes/candle-brass/theme.js

```javascript
window.MYNYL_THEME_MODULES = window.MYNYL_THEME_MODULES || {};

// ─── Candle & Brass ─────────────────────────────────────────
// One guttering candle. After the base disc is painted, we clip to the
// disc face and (in 'lighter' composite) lay down a single soft firelight
// pool in the upper-left, plus a brass glint arc on the flame-facing edge
// of the label ring and a few embers drifting up. The flicker is TIME
// based (performance.now()), NOT spin-locked, so it reads as a real flame
// rather than something glued to the rotating disc.
//
// ctx is already DPR-scaled — draw in CSS px, never multiply by DPR.
// angle here is the disc rotation in RADIANS.
(function () {
  // Persistent ember particles, kept in closure scope so they live across
  // frames. Each spark drifts upward and resets when it fades or exits.
  const EMBER_COUNT = 3;
  const embers = [];
  let lastT = performance.now() / 1000;
  let seeded = false;

  // Layered-sine flicker: gutters between ~0.4 and ~1.0. Three octaves at
  // incommensurate frequencies so it never visibly loops.
  function flicker(t) {
    return 0.70
      + 0.18 * Math.sin(11.0 * t)
      + 0.10 * Math.sin(6.3 * t + 1.7)
      + 0.06 * Math.sin(19.0 * t);
  }

  function seedEmbers(radius) {
    embers.length = 0;
    for (let i = 0; i < EMBER_COUNT; i++) {
      // Deterministic seed per index so positions are stable per-element
      // (no per-frame Math.random for placement).
      const s = Math.sin(i * 12.9898) * 43758.5453;
      const frac = s - Math.floor(s);
      embers.push({
        // start near the firelight pool (upper-left of centre)
        x: -radius * (0.10 + 0.18 * frac),
        y: -radius * (0.10 + 0.22 * (1 - frac)),
        vy: -radius * (0.05 + 0.05 * frac),      // upward CSS-px / sec
        vx: radius * (0.012 * (frac - 0.5)),     // slight sideways waft
        life: frac,                               // 0..1 phase offset
        speed: 0.35 + 0.25 * frac
      });
    }
    seeded = true;
  }

  window.MYNYL_THEME_MODULES["candle-brass"] = {
    drawRecord({ angle, record, ctx, state }) {
      // NOTE: the default disc is painted by the engine before this hook
      // runs for themes registered with an overlay, but to be safe and
      // explicit we still let the base layer show through — we only ADD
      // light here, we never clear the canvas. (We do not call
      // defaults.drawRecord because the engine already drew the base for
      // overlay modules; if you prefer belt-and-suspenders, destructure
      // `defaults` and call defaults.drawRecord(angle) as the first line.)
      const { cx, cy, radius } = record;
      const now = performance.now() / 1000;
      const dt = Math.min(0.05, Math.max(0, now - lastT)); // clamp for tab stalls
      lastT = now;

      if (!seeded) seedEmbers(radius);

      const playing = !!(state && state.playing);
      const pulse = Math.max(0, Math.min(1,
        state && typeof state.groovePulse === "number" ? state.groovePulse : 0));

      // Flame intensity: base flicker, fanned brighter by the music.
      const flame = flicker(now);
      const intensity = Math.max(0, Math.min(1.15,
        flame * (playing ? 0.85 : 0.62) + pulse * 0.35));

      // Flame anchor: upper-left of centre, with a small flicker jitter so
      // the hotspot shivers like a real wick.
      const jitterX = radius * 0.012 * Math.sin(13.0 * now + 0.6);
      const jitterY = radius * 0.010 * Math.sin(17.0 * now);
      const poolX = -radius * 0.26 + jitterX;
      const poolY = -radius * 0.30 + jitterY;
      const poolR = radius * (0.62 + 0.05 * Math.sin(9.0 * now));

      ctx.save();

      // Clip everything to the disc face.
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.985, 0, Math.PI * 2);
      ctx.clip();

      ctx.translate(cx, cy);
      ctx.globalCompositeOperation = "lighter"; // additive: only adds light

      // ── 1. Firelight pool ──────────────────────────────────
      const peak = 0.28 * intensity; // spec: hotspot up to ~0.28 alpha
      const grad = ctx.createRadialGradient(poolX, poolY, 0, poolX, poolY, poolR);
      grad.addColorStop(0.0, "rgba(255,210,130," + peak.toFixed(3) + ")");
      grad.addColorStop(0.35, "rgba(255,180,90," + (peak * 0.55).toFixed(3) + ")");
      grad.addColorStop(0.7, "rgba(190,110,45," + (peak * 0.18).toFixed(3) + ")");
      grad.addColorStop(1.0, "rgba(120,60,20,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.985, 0, Math.PI * 2);
      ctx.fill();

      // ── 2. Brass glint arc on the flame-facing edge of the label ring ─
      // The label ring sits at r ≈ radius * labelRadius (~0.175). We draw a
      // short, bright arc on the upper-left (flame-facing) quadrant only.
      const ringR = radius * 0.175;
      const glintA = Math.max(0, Math.min(0.9, 0.30 + intensity * 0.55 + pulse * 0.2));
      ctx.strokeStyle = "rgba(255,224,150," + glintA.toFixed(3) + ")";
      ctx.lineWidth = Math.max(1, radius * 0.006);
      ctx.shadowBlur = radius * 0.04;
      ctx.shadowColor = "rgba(255,190,90,0.7)";
      // upper-left arc: roughly from 200° to 280° (canvas angles, y-down)
      ctx.beginPath();
      ctx.arc(0, 0, ringR, Math.PI * 1.12, Math.PI * 1.55);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // ── 3. Ember sparks drifting upward ────────────────────
      // Only loft embers while playing; when idle they settle out.
      for (let i = 0; i < embers.length; i++) {
        const e = embers[i];
        // advance phase using real dt so motion is frame-rate independent
        e.life += dt * e.speed * (playing ? 1 : 0.3);
        if (e.life > 1) {
          e.life -= 1;
          // respawn near the pool
          e.x = poolX + radius * 0.04 * Math.sin(i * 7.1 + now);
          e.y = poolY + radius * 0.02;
        }
        e.x += e.vx * dt;
        e.y += e.vy * dt;

        // keep embers in the upper area; pull back if they wander too far
        const ex = e.x;
        const ey = e.y;
        const fade = Math.sin(e.life * Math.PI); // 0 at birth/death, 1 mid-life
        const ea = fade * (0.55 * intensity + pulse * 0.25) * (playing ? 1 : 0.4);
        if (ea <= 0.01) continue;
        const er = radius * (0.004 + 0.003 * fade);
        ctx.fillStyle = "rgba(255,196,110," + ea.toFixed(3) + ")";
        ctx.shadowBlur = radius * 0.02;
        ctx.shadowColor = "rgba(255,170,70,0.8)";
        ctx.beginPath();
        ctx.arc(ex, ey, er, 0, Math.PI * 2);
        ctx.fill();
      }

      // Reset all mutating state before returning.
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = "source-over";
      ctx.restore();
    }
  };
})();
```

## Register in js/themes.js

Add this object to the `MYNYL_THEME_REGISTRY` array, after `Outrun Grid` and before the trailing commented placeholder:

```javascript
  { name: 'Candle & Brass', path: 'themes/candle-brass' },
```

So the array becomes:

```javascript
window.MYNYL_THEME_REGISTRY = [
  { name: 'Wood', path: 'themes/wood', default: true },
  { name: 'Minimal Light', path: 'themes/minimal-light' },
  { name: 'Disco Pop', path: 'themes/disco-pop' },
  { name: 'Risograph', path: 'themes/risograph' },
  { name: 'Outrun Grid', path: 'themes/outrun-grid' },
  { name: 'Candle & Brass', path: 'themes/candle-brass' },
];

// { name: '', path: 'themes/' },
```

## Build & test checklist

1. Create the folder `themes/candle-brass/` and add all six files exactly as above: `theme.css`, `background.css`, `vinyl.css`, `arm.css`, `ui.css`, `theme.js`.
2. Register the theme in `js/themes.js` per the section above. No `index.html` edits are needed — themes load via the registry and `window.setMynylTheme`.
3. Open `index.html` directly in a browser (no build step).
4. Select **"Candle & Brass"** in the bottom-right `#theme-select` dropdown. Confirm the page background goes deep ember and the selection persists across reload (localStorage).
5. Load a track whose filename is `Title - Artist.mp3` (the metadata parser reads `Title - Artist` and jsmediatags supplies album art into `window._labelImage`).
6. Drag the tonearm onto the disc, or press Space / the play button. Confirm the 2s crackle spin-up plays, then music fades in.
7. Verify:
   - No console errors at any point (theme switch, play, pause, stop, song end).
   - The overlay never paints over the centre label text/art — the firelight pool is additive and the glint arc sits on the label ring, not inside it.
   - Album art is clipped to the disc (no light spilling past `radius * 0.985`).
   - Readable and correct at both a small narrow window and a large maximized window (geometry recomputes on resize; no hardcoded px).
   - Smooth at ~60fps; the flame gutters smoothly and is visibly time-based, not locked to the spin.
   - No-file / idle state: with no track loaded and not playing, the flame dims to its low base level and embers nearly settle — nothing flashes or errors.
8. Toggle the audio level (loud vs quiet passages) and confirm the firelight pool and embers brighten with `state.groovePulse`, as if the music fans the flame.

### Theme-specific GOTCHAS

- **Coordinate space is CSS px with DPR already applied.** `ctx` is pre-scaled to `devicePixelRatio`. Draw in CSS px and never multiply by DPR yourself.
- **Angle units differ per canvas.** In `drawRecord`, `angle` is in **radians**. In `drawArm` (not used here), it is in **degrees** — convert with `helpers.toRad(angle)`.
- **Flicker must be time-based, not spin-locked.** This overlay intentionally does NOT call `ctx.rotate(angle)`; the firelight is driven by `performance.now()` so it gutters like a real flame independent of disc rotation. Do not "fix" this by rotating with the disc.
- **Always reset mutating state before returning.** Set `ctx.shadowBlur = 0` and `ctx.globalCompositeOperation = 'source-over'` (the code does both, plus a matching `ctx.restore()` for every `ctx.save()`). Leaking `lighter` or a non-zero `shadowBlur` corrupts subsequent frames and other layers.
- **Keep overlays off the centre label.** The label occupies `r <= radius * 0.175`. The firelight pool is additive light (safe over the whole disc), but any solid/opaque art you add should stay at `r > radius * 0.30` unless you intend to draw on the label. The brass glint arc here sits exactly on the ring radius (`radius * 0.175`) by design.
- **`shadowBlur` is the main per-frame cost.** This overlay keeps it to one gradient fill, one short arc, and at most 3 embers — well under the ~100-stroke budget. If you add more sparks, cap `EMBER_COUNT` and keep `shadowBlur` proportional to `radius` (small).
- **Persistent state lives in closure scope.** The ember array and `lastT` persist across frames inside the IIFE; motion advances with a clamped `performance.now()` delta so it stays frame-rate independent and survives tab-stall jumps.
- **Graceful degradation.** If `theme.js` is reduced to the stub `window.MYNYL_THEME_MODULES["candle-brass"] = {};`, the CSS alone still renders a complete, on-brand theme — the overlay is an enhancement, not a dependency.
