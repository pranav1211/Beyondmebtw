# Frutiger Aqua

Early-2000s Y2K optimism rendered as a glassy aqua vinyl: translucent jelly disc, chrome lens-flare arm, and serene bubbles drifting up the record face.

Folder: `themes/frutiger-aqua/`. Registry display name: **"Frutiger Aqua"**.

## Overview

Frutiger Aqua is a bright, aqueous theme that deliberately departs from mynyl's dark default palette. The disc is a deep-ocean glossy translucent jelly with aqua grooves and a chrome-rimmed water-droplet label; the tonearm is polished aqua-tinted chrome with a clear-bubble pivot and a lime-spark needle tip; the background is a sky-to-water gradient that gently ripples. The UI is built on the LIGHT (minimal-light) glassmorphism template, recolored into translucent white-blue Frutiger-Aero glass with glossy jelly-pill buttons. The signature move lives in `theme.js`: after the base disc is painted, it clips to the disc and floats ~10 translucent white-rimmed bubbles upward across the face, with a single elliptical white specular gloss-bar slowly arcing across the top to mimic a moving light source on wet glass. The theme degrades gracefully: if `theme.js` is absent or its module is a no-op, every token still renders a complete, attractive CSS-only theme — the bubbles are a pure overlay enhancement, not a structural requirement.

## themes/frutiger-aqua/theme.css

```css
@import url('./background.css');
@import url('./vinyl.css');
@import url('./arm.css');
@import url('./ui.css');
```

## themes/frutiger-aqua/background.css

```css
:root {
  /* layout / geometry — keep the wood baseline, these are theme-neutral */
  --player-record-scale: 0.42;
  --arm-pivot-offset-x: 1.05;
  --arm-pivot-offset-y: -0.85;
  --arm-outer-radius: 0.91;
  --arm-inner-radius: 0.30;
  --arm-outer-offset-x: -0.10;
  --arm-outer-offset-y: -0.85;
  --arm-park-offset-x: 1.20;
  --arm-park-offset-y: 0.30;

  /* bright sky-to-water gradient (departs from all-dark themes) */
  --bg-center-rgb: 90,180,235;
  --bg-mid-rgb: 30,110,180;
  --bg-edge-0: #0a4f8a;
  --bg-edge-1: #052a4a;
  --bg-glow-strength: 1.2;
  --bg-drift-x: 0.05;
  --bg-drift-y: 0.05;

  /* drop hint — bright aqua so it reads on the light background */
  --hint-ring: rgba(255,255,255,0.65);
  --hint-dot: rgba(159,255,90,0.95);
  --hint-glow: rgba(43,183,255,0.55);
  --hint-text: rgba(255,255,255,0.92);
}
```

## themes/frutiger-aqua/vinyl.css

```css
:root {
  --vinyl-style: classic;

  /* deep-ocean translucent-jelly disc, maximally glossy */
  --vinyl-disc: #06243a;
  --vinyl-edge: rgba(43,183,255,0.22);
  --vinyl-rim-light: rgba(255,255,255,0.18);
  --vinyl-rim-shadow: rgba(0,0,0,0.40);
  --vinyl-shadow-ring: rgba(43,183,255,0.18);

  /* aqua grooves */
  --vinyl-groove-rgb: 120,210,255;
  --vinyl-groove-alpha: 0.05;
  --vinyl-groove-pulse: 0.08;
  --vinyl-groove-spacing: 1.4;
  --vinyl-groove-width: 0.55;
  --vinyl-groove-start: 0.19;
  --vinyl-groove-end: 0.91;
  --vinyl-groove-warp: 0.03;

  /* heavy gloss */
  --vinyl-sheen: 0.14;
  --vinyl-sheen-width: 0.06;
  --vinyl-specular: 0.10;
  --vinyl-depth: 0.40;

  /* chrome-rimmed water-droplet label */
  --vinyl-label-radius: 0.175;
  --vinyl-hole-radius: 0.02;
  --vinyl-label-0: #bfe9ff;
  --vinyl-label-55: #2bb7ff;
  --vinyl-label-100: #0a4f8a;
  --vinyl-label-ring: rgba(255,255,255,0.55);
  --vinyl-label-stroke: rgba(10,79,138,0.40);
  --vinyl-label-art-base: #06243a;
  --vinyl-hole-fill: #052a4a;
}
```

## themes/frutiger-aqua/arm.css

```css
:root {
  --arm-style: straight;

  /* polished aqua-tinted chrome tube */
  --arm-tube-width: 0.020;
  --arm-shadow-blur: 14;
  --arm-shadow-offset-y: 5;
  --arm-highlight-alpha: 0.18;
  --arm-0: #0a3a5c;
  --arm-25: #3fa0d8;
  --arm-60: #eaf6ff;
  --arm-100: #1e7fd4;

  /* chrome headshell, white needle, lime-spark tip */
  --arm-headshell: #d7e6f0;
  --arm-headshell-length: 0.10;
  --arm-headshell-width: 0.016;
  --arm-headshell-bend-deg: -18;
  --arm-needle: rgba(255,255,255,0.90);
  --arm-needle-tip: #9fff5a;
  --arm-needle-width: 1.5;
  --arm-needle-length: 0.55;

  /* straight-arm counterweight: engine fills a rounded-rect with cw-55 */
  --arm-counterweight-radius: 0.038;
  --arm-counterweight-offset: 0.15;
  --arm-cw-0: #ffffff;
  --arm-cw-55: #aee0ff;
  --arm-cw-100: #1e6fa8;

  /* clear-bubble pivot */
  --arm-pivot-radius: 0.03;
  --arm-pivot-inner-radius: 0.30;
  --arm-pivot-0: #ffffff;
  --arm-pivot-50: #5fb8e8;
  --arm-pivot-100: #1e6fa8;
}
```

## themes/frutiger-aqua/ui.css

```css
:root {
  --page-bg: #052a4a;
  --glass-bg: rgba(220,240,255,0.46);
  --glass-border: rgba(255,255,255,0.40);
  --glass-inset: rgba(255,255,255,0.80);
  --text-main: rgba(6,36,58,0.92);
  --text-soft: rgba(43,106,154,0.78);
  --text-faint: rgba(43,106,154,0.45);
  --accent: #2bb7ff;
  --accent-strong: #9fff5a;
  --accent-dim: rgba(43,183,255,0.45);
  --accent-glow: rgba(43,183,255,0.50);
  --surface-1: rgba(255,255,255,0.94);
  --surface-2: rgba(214,236,250,0.96);
  --surface-3: rgba(255,255,255,0.99);
  --surface-4: rgba(196,226,247,0.98);
  --border-soft: rgba(120,190,235,0.30);
  --border-strong: rgba(43,150,215,0.50);
}
html, body { background: var(--page-bg) }
.eye-btn { color: var(--accent-dim) }
.eye-btn:hover, .eye-zone:hover .eye-btn { color: var(--accent-strong) }
.ui-panel {
  background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 18px; padding: 18px 20px;
  backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
  box-shadow: 0 24px 60px rgba(20,90,150,0.24), 8px 8px 22px rgba(40,120,180,0.14), -8px -8px 22px rgba(255,255,255,0.60), 0 1px 0 var(--glass-inset) inset;
}
.upload-label, .speed-label, .queue-label, .theme-switcher-label { color: rgba(43,106,154,0.62) }
.upload-btn {
  background: linear-gradient(180deg, var(--surface-1) 0%, var(--surface-2) 100%); border-color: rgba(120,190,235,0.34); color: rgba(20,90,140,0.88);
  box-shadow: 0 1px 0 rgba(255,255,255,0.90) inset, 0 8px 22px rgba(40,120,180,0.18);
}
.upload-btn:hover { border-color: rgba(43,150,215,0.55); color: rgba(8,60,100,0.98); background: linear-gradient(180deg, var(--surface-3) 0%, var(--surface-4) 100%); box-shadow: 0 1px 0 rgba(255,255,255,0.96) inset, 0 14px 28px rgba(40,120,180,0.22), 0 0 18px rgba(43,183,255,0.20); }
.upload-btn:active { transform: translateY(1px); box-shadow: inset 4px 4px 9px rgba(40,120,180,0.4), inset -4px -4px 9px rgba(255,255,255,0.88); }
.ctrl-btn, .speed-btn {
  background: linear-gradient(145deg, rgba(255,255,255,0.99), rgba(206,232,250,0.97)); border-color: var(--border-soft); color: rgba(20,90,140,0.86);
  box-shadow: 5px 5px 12px rgba(40,120,180,0.32), -5px -5px 12px rgba(255,255,255,0.92), 0 1px 0 rgba(255,255,255,0.85) inset;
}
.ctrl-btn:hover, .speed-btn:hover { background: linear-gradient(145deg, rgba(255,255,255,1), rgba(216,240,255,0.98)); border-color: var(--border-strong); color: var(--accent); box-shadow: 6px 6px 15px rgba(40,120,180,0.38), -6px -6px 15px rgba(255,255,255,0.96), 0 1px 0 rgba(255,255,255,0.9) inset, 0 0 22px var(--accent-glow); }
.ctrl-btn:active, .speed-btn:active { box-shadow: inset 4px 4px 9px rgba(40,120,180,0.4), inset -4px -4px 9px rgba(255,255,255,0.94); }
.ctrl-btn.active { background: linear-gradient(145deg, rgba(224,244,255,1), rgba(186,222,247,1)); border-color: rgba(43,150,215,0.50); color: #1e7fd4; box-shadow: inset 3px 3px 8px rgba(40,120,180,0.36), inset -3px -3px 8px rgba(255,255,255,0.92), 0 0 0 1px rgba(43,150,215,0.16), 0 0 18px rgba(43,183,255,0.30); }
.vol-icon { color: rgba(43,150,215,0.50) }
.slider-track { background: rgba(120,190,235,0.26) }
.slider-fill { background: linear-gradient(90deg, rgba(43,183,255,0.80), rgba(159,255,90,0.85)) }
.slider-thumb { background: #fdffff; box-shadow: 0 0 0 1px rgba(43,150,215,0.28), 0 5px 12px rgba(40,120,180,0.22); }
.kbd-hint { color: rgba(43,106,154,0.38) }
.track-title { color: var(--text-main) }
.track-artist, .queue-count { color: var(--text-soft) }
.queue-list::-webkit-scrollbar-track { background: rgba(190,222,245,0.30) }
.queue-list::-webkit-scrollbar-thumb { background: rgba(80,170,225,0.42); border-radius: 2px }
.queue-item { border-bottom-color: rgba(120,190,235,0.24) }
.queue-item:hover { background: rgba(255,255,255,0.46) }
.queue-item.active .queue-name { color: var(--accent) }
.queue-item.active .queue-num { opacity: 0.72 }
.queue-name { color: rgba(20,90,140,0.82) }
.queue-num { color: rgba(43,106,154,0.60) }
.queue-remove { color: rgba(43,106,154,0.66) }
.speed-val, .theme-select { color: rgba(20,90,140,0.92); background-color: rgba(255,255,255,0.86); border-color: rgba(120,190,235,0.30); box-shadow: 0 10px 24px rgba(40,120,180,0.16), 0 1px 0 rgba(255,255,255,0.92) inset; }
.speed-val:focus, .theme-select:focus { outline: none; border-color: rgba(43,150,215,0.50); box-shadow: 0 10px 24px rgba(40,120,180,0.16), 0 0 0 1px rgba(43,150,215,0.18); }
.theme-select { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6'%3E%3Cpath fill='rgba(20,90,140,0.82)' d='M5 6 .4.8 1.6 0 5 3.5 8.4 0 9.6.8z'/%3E%3C/svg%3E"); }
.theme-switcher-label { color: rgba(43,106,154,0.55) }
/* Modal must be near-solid so text stays legible over the blurred app behind it */
.queue-modal-panel.ui-panel {
  background: linear-gradient(180deg, rgba(255,255,255,0.99), rgba(224,240,251,0.99)); border-color: rgba(120,190,235,0.40);
  box-shadow: 0 28px 70px rgba(20,90,150,0.34), 0 2px 10px rgba(40,120,180,0.20), 0 1px 0 rgba(255,255,255,0.92) inset;
}
```

## themes/frutiger-aqua/theme.js

```javascript
window.MYNYL_THEME_MODULES = window.MYNYL_THEME_MODULES || {};

/**
 * Frutiger Aqua — record overlay.
 * Serene Y2K-aqua effect: translucent white-rimmed bubbles drifting UP the
 * disc face, plus one elliptical white specular gloss-bar arcing across the
 * top to mimic a moving light source on wet glass. No spectrum bars.
 *
 * All drawing is in CSS px (ctx is already DPR-scaled). The record canvas
 * element never rotates, so to "hold still / upright" we simply do NOT call
 * ctx.rotate — the bubbles read as floating in screen space over the disc.
 */
(function () {
  const BUBBLE_COUNT = 10;

  // --- per-frame smoothing of the audio pulse, kept in closure scope ---
  let smoothedPulse = 0;
  let lastT = performance.now();

  // Deterministic [0,1) pseudo-random from an index + salt (no per-frame
  // Math.random so bubble identity is stable across frames).
  function seed(i, salt) {
    const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
    return v - Math.floor(v);
  }

  window.MYNYL_THEME_MODULES["frutiger-aqua"] = {
    drawRecord({ angle, record, ctx, state, defaults }) {
      // 1) paint the base disc + grooves + label first
      defaults.drawRecord(angle);

      const { cx, cy, radius } = record;

      // time + dt for frame-rate-independent motion
      const nowMs = performance.now();
      let dt = (nowMs - lastT) / 1000;
      lastT = nowMs;
      if (!(dt > 0) || dt > 0.1) dt = 0.016; // clamp pauses / tab-switches
      const now = nowMs / 1000;

      const rawPulse = Math.max(
        0,
        Math.min(1, state && typeof state.groovePulse === "number" ? state.groovePulse : 0)
      );
      // exponential smoothing toward the raw level (~12/sec convergence)
      smoothedPulse += (rawPulse - smoothedPulse) * Math.min(1, dt * 12);
      const pulse = smoothedPulse;

      ctx.save();
      ctx.translate(cx, cy);

      // Clip everything to the disc so art never bleeds past the edge.
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.985, 0, Math.PI * 2);
      ctx.clip();

      // ---------------------------------------------------------------
      // 2) drifting bubbles (do NOT rotate — they float in screen space)
      // ---------------------------------------------------------------
      // Vertical travel spans the disc diameter plus a margin so bubbles
      // wrap cleanly. Rise speed nudges up with the audio pulse.
      const span = radius * 2.2;
      const riseBoost = 1 + pulse * 0.9;

      for (let i = 0; i < BUBBLE_COUNT; i++) {
        // stable per-bubble traits
        const xFrac = seed(i, 1) * 2 - 1;              // -1..1 across disc
        const x = xFrac * radius * 0.86;
        const sizeBase = radius * (0.03 + seed(i, 2) * 0.06);
        const size = sizeBase * (1 + pulse * 0.35);    // swell with audio
        const speed = radius * (0.06 + seed(i, 3) * 0.10) * riseBoost; // px/s
        const phase = seed(i, 4);

        // vertical position: start near the bottom, rise, wrap to bottom.
        // bottom = +radius, top = -radius. Subtract travel so it moves up.
        const travel = (now * speed + phase * span) % span;
        const y = radius * 1.05 - travel;

        // soft radial fill: bright translucent core -> transparent
        const fill = ctx.createRadialGradient(x, y, 0, x, y, size);
        fill.addColorStop(0, "rgba(255,255,255,0.10)");
        fill.addColorStop(0.55, "rgba(180,235,255,0.05)");
        fill.addColorStop(1, "rgba(255,255,255,0)");
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();

        // thin bright rim — only a top-left arc, like light catching the
        // upper edge of a real bubble. Brighten slightly with the pulse.
        ctx.beginPath();
        ctx.arc(x, y, size * 0.92, Math.PI * 1.05, Math.PI * 1.75);
        ctx.strokeStyle = `rgba(255,255,255,${0.30 + pulse * 0.25})`;
        ctx.lineWidth = Math.max(1, radius * 0.004);
        ctx.lineCap = "round";
        ctx.stroke();

        // tiny specular dot inside each bubble for extra "wet" sparkle
        ctx.beginPath();
        ctx.arc(x - size * 0.30, y - size * 0.32, Math.max(0.8, size * 0.10), 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.fill();
      }

      // ---------------------------------------------------------------
      // 3) moving specular gloss-bar arcing across the TOP of the disc
      // ---------------------------------------------------------------
      // An elongated, very soft white ellipse whose center sweeps slowly
      // along an arc above the disc center — a moving light source on glass.
      const sweep = now * 0.18;                       // slow drift
      const glossAngle = -Math.PI / 2 + Math.sin(sweep) * 0.7; // hovers near top
      const glossR = radius * 0.50;
      const gx = Math.cos(glossAngle) * glossR;
      const gy = Math.sin(glossAngle) * glossR;

      ctx.save();
      ctx.globalCompositeOperation = "lighter"; // additive = glow on glass
      ctx.translate(gx, gy);
      ctx.rotate(glossAngle + Math.PI / 2);      // long axis tangent to arc
      ctx.scale(1, 0.32);                         // squash circle into ellipse
      const gloss = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 0.62);
      gloss.addColorStop(0, `rgba(255,255,255,${0.16 + pulse * 0.06})`);
      gloss.addColorStop(0.5, "rgba(210,240,255,0.05)");
      gloss.addColorStop(1, "rgba(255,255,255,0)");
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.62, 0, Math.PI * 2);
      ctx.fillStyle = gloss;
      ctx.fill();
      ctx.restore(); // undoes lighter + transform

      ctx.restore(); // undoes clip + translate

      // safety: ensure global state is clean for the next drawer
      ctx.globalCompositeOperation = "source-over";
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
  };
})();
```

## Register in js/themes.js

Add this object to the `MYNYL_THEME_REGISTRY` array (it goes after the existing entries and before the trailing commented placeholder `// { name: '', path: 'themes/' },`):

```javascript
  { name: 'Frutiger Aqua', path: 'themes/frutiger-aqua' },
```

The array then reads:

```javascript
window.MYNYL_THEME_REGISTRY = [
  { name: 'Wood', path: 'themes/wood', default: true },
  { name: 'Minimal Light', path: 'themes/minimal-light' },
  { name: 'Disco Pop', path: 'themes/disco-pop' },
  { name: 'Risograph', path: 'themes/risograph' },
  { name: 'Outrun Grid', path: 'themes/outrun-grid' },
  { name: 'Frutiger Aqua', path: 'themes/frutiger-aqua' },
];

// { name: '', path: 'themes/' },
```

## Build & test checklist

1. Create the folder `themes/frutiger-aqua/` and add all six files above: `theme.css`, `background.css`, `vinyl.css`, `arm.css`, `ui.css`, `theme.js`.
2. Add the registry entry to `js/themes.js` (see previous section). The folder name `frutiger-aqua` must exactly match the `MYNYL_THEME_MODULES["frutiger-aqua"]` key in `theme.js`.
3. Open `index.html` directly in a browser (no build step). Open DevTools console.
4. In the bottom-right `#theme-select` dropdown, pick **Frutiger Aqua**. Confirm the page background switches to the sky-to-water gradient, the UI panels turn into translucent white-blue glass, the disc becomes the deep-ocean glossy jelly, and the tonearm is chrome with a lime needle tip. Reload the page and confirm the selection persists (localStorage).
5. Load a track named like `Title - Artist.mp3` (the filename format `Title - Artist.mp3` drives `window._trackTitle` / `window._trackArtist`). If the file has embedded art, jsmediatags will set `window._labelImage`.
6. Drag the tonearm onto the disc (or press play). Confirm: no console errors; bubbles drift upward over the disc face and wrap cleanly; the overlay never covers/erases the centre label (bubbles pass over it but the label remains visible — they are translucent); album art / disc is clipped to the disc edge with no bleed; the specular gloss-bar slowly sweeps across the top.
7. Verify the **no-file / idle** state: with no track loaded the disc is still rendered by `defaults.drawRecord`, the overlay still runs (bubbles drift even when paused, just without audio-driven swell), and there are no errors.
8. Resize the window from small to large and back. Confirm everything stays proportional (all sizes are derived from `radius`, no hardcoded pixels) and remains readable. Watch the frame rate — it should hold ~60fps.

### Theme-specific gotchas

- **Coordinate space is CSS px with DPR already applied.** `ctx` is pre-scaled; never multiply by `devicePixelRatio`. Draw in plain CSS px.
- **Angle units differ.** `drawRecord` receives `angle` in **radians**; `drawArm` would receive it in **degrees** (convert with `helpers.toRad`). This theme only overrides `drawRecord`, so the arm uses the engine default driven by `arm.css`.
- **Do NOT rotate the record overlay.** The bubbles and gloss-bar are meant to float in screen space over the spinning disc, so we intentionally skip `ctx.rotate(angle)`. The base disc still spins because `defaults.drawRecord(angle)` handles that.
- **Always clip to the disc** (`ctx.arc(0,0,radius*0.985,...)` then `ctx.clip()`) before overlaying so nothing bleeds past the edge — bubbles can wrap from beyond the rim.
- **Keep intentional-on-label drawing translucent.** Bubbles may pass over the centre label (r ≤ `radius*0.175`); because they are low-alpha translucent fills the label stays legible. If you want them fully clear of the label, gate drawing to `r > radius*0.30`.
- **Reset global canvas state before returning.** The gloss-bar uses `globalCompositeOperation = 'lighter'`; the code restores it to `'source-over'` and resets `shadowBlur = 0` and `globalAlpha = 1` at the end. Every `ctx.save()` has a matching `ctx.restore()`.
- **Performance.** This overlay avoids `shadowBlur` entirely (the main per-frame cost) and uses only ~40 primitives, well under the ~100-stroke budget. Frame-rate independence comes from the `performance.now()` delta and clamped `dt`; `smoothedPulse` persists in closure scope so the audio swell is smooth, not jittery.
