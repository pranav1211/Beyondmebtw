# Glow Lab

Lights-out: a charcoal disc whose grooves and a hand-drawn constellation softly phosphoresce green, charging brighter while the music plays and slowly fading for seconds after you stop.

Folder: `themes/glow-lab/` — registry display name "Glow Lab".

## Overview

Glow Lab is a darkroom theme. The disc is near-black charcoal (`#0c0e0c`) sitting on a pitch-dark room; the only color in the scene is a phosphor-green emission that lives in the grooves, the label ring, and a hand-drawn constellation circling the label. The signature move is a persistent **charge/decay model** in `theme.js`: a single `charge` value (0..1) climbs while audio plays — spiking with the beat via `state.groovePulse` — and bleeds off slowly when you stop, so the whole disc keeps glowing and fades over several seconds after playback ends. All additive glow alphas are multiplied by `charge`, so at rest the disc is dim and instrument-like; on the beat it blooms. The base disc, grooves, and label are painted entirely by the CSS tokens and the engine's default renderer, so **if `theme.js` is absent the theme still works** as a static charcoal/phosphor look — it simply loses the live charge bloom and the animated constellation overlay.

## themes/glow-lab/theme.css

```css
@import url('./background.css');
@import url('./vinyl.css');
@import url('./arm.css');
@import url('./ui.css');
```

## themes/glow-lab/background.css

```css
:root {
  /* Layout / geometry — keep the canonical wood proportions */
  --player-record-scale: 0.42;
  --arm-pivot-offset-x: 1.05;
  --arm-pivot-offset-y: -0.85;
  --arm-outer-radius: 0.91;
  --arm-inner-radius: 0.30;
  --arm-outer-offset-x: -0.10;
  --arm-outer-offset-y: -0.85;
  --arm-park-offset-x: 1.20;
  --arm-park-offset-y: 0.30;

  /* Pitch-dark room — the canvas contributes almost no light */
  --bg-center-rgb: 8,14,10;
  --bg-mid-rgb: 4,8,8;
  --bg-edge-0: #04060a;
  --bg-edge-1: #020308;
  --bg-glow-strength: 0.04;
  --bg-drift-x: 0.07;
  --bg-drift-y: 0.05;

  /* Hint overlay glows phosphor-green */
  --hint-ring: rgba(125,255,176,0.5);
  --hint-dot: rgba(182,255,106,0.95);
  --hint-glow: rgba(125,255,176,0.5);
  --hint-text: rgba(190,255,170,0.85);
}
```

## themes/glow-lab/vinyl.css

```css
:root {
  /* Etched charcoal disc */
  --vinyl-style: etched;
  --vinyl-disc: #0c0e0c;
  --vinyl-edge: rgba(125,255,176,0.06);
  --vinyl-rim-light: rgba(125,255,176,0.10);
  --vinyl-rim-shadow: rgba(0,0,0,0.40);
  --vinyl-shadow-ring: rgba(0,0,0,0.55);

  /* Audio-charged grooves: dim at rest, brighten hard on the beat */
  --vinyl-groove-rgb: 125,255,176;
  --vinyl-groove-alpha: 0.05;
  --vinyl-groove-pulse: 0.5;
  --vinyl-groove-spacing: 1.5;
  --vinyl-groove-width: 0.75;
  --vinyl-groove-start: 0.19;
  --vinyl-groove-end: 0.91;
  --vinyl-groove-warp: 0.035;

  /* Flat, matte phosphor surface — no sheen, no specular highlight */
  --vinyl-sheen: 0;
  --vinyl-sheen-width: 0.06;
  --vinyl-specular: 0;
  --vinyl-depth: 0.3;

  /* Dark phosphor label */
  --vinyl-label-radius: 0.175;
  --vinyl-hole-radius: 0.02;
  --vinyl-label-0: #142016;
  --vinyl-label-55: #0f150f;
  --vinyl-label-100: #0a0e0a;
  --vinyl-label-ring: rgba(182,255,106,0.5);
  --vinyl-label-stroke: rgba(125,255,176,0.4);
  --vinyl-label-art-base: #060806;
  --vinyl-hole-fill: #060806;
}
```

## themes/glow-lab/arm.css

```css
:root {
  /* Straight dark silhouette holding one glowing point of light */
  --arm-style: straight;
  --arm-tube-width: 0.022;
  --arm-shadow-blur: 14;
  --arm-shadow-offset-y: 5;
  --arm-highlight-alpha: 0.05;

  /* Graphite tube */
  --arm-0: #0e0e0e;
  --arm-25: #2a2e2a;
  --arm-60: #585e54;
  --arm-100: #1a1c18;

  /* Headshell — keep it dark, let the tip be the only bright bead */
  --arm-headshell: #2a2e2a;
  --arm-headshell-length: 0.10;
  --arm-headshell-width: 0.016;
  --arm-headshell-bend-deg: -18;

  /* Needle: the single point of light */
  --arm-needle: rgba(125,255,176,0.8);
  --arm-needle-tip: #c9ffd9;
  --arm-needle-width: 1.5;
  --arm-needle-length: 0.55;

  /* Straight counterweight is a rounded-rect filled with --arm-cw-55 */
  --arm-counterweight-radius: 0.038;
  --arm-counterweight-offset: 0.15;
  --arm-cw-0: #2a2e2a;
  --arm-cw-55: #2a2e2a;
  --arm-cw-100: #0c0e0c;

  /* Small dim pivot */
  --arm-pivot-radius: 0.03;
  --arm-pivot-inner-radius: 0.30;
  --arm-pivot-0: #4a544a;
  --arm-pivot-50: #232823;
  --arm-pivot-100: #0c0e0c;
}
```

## themes/glow-lab/ui.css

```css
:root {
  --page-bg: #04060a;
  --glass-bg: rgba(8,12,9,0.6);
  --glass-border: rgba(125,255,176,0.16);
  --glass-inset: rgba(125,255,176,0.05);
  --text-main: rgba(190,255,206,0.7);
  --text-soft: rgba(190,255,206,0.4);
  --text-faint: rgba(190,255,206,0.22);
  --accent: #7dffb0;
  --accent-strong: #b6ff6a;
  --accent-dim: rgba(125,255,176,0.42);
  --accent-glow: rgba(125,255,176,0.3);
  --surface-1: rgba(16,26,18,0.90);
  --surface-2: rgba(6,10,7,0.95);
  --surface-3: rgba(22,36,24,0.92);
  --surface-4: rgba(10,16,11,0.96);
  --border-soft: rgba(125,255,176,0.22);
  --border-strong: rgba(150,255,190,0.50);
}

html,
body { background: var(--page-bg) }

.eye-btn { color: var(--accent-dim) }
.eye-btn:hover,
.eye-zone:hover .eye-btn { color: rgba(190,255,206,0.92) }

.ui-panel {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  padding: 16px 18px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow:
    0 12px 44px rgba(0,0,0,0.6),
    0 3px 10px rgba(0,0,0,0.4),
    0 1px 0 var(--glass-inset) inset,
    0 -1px 0 rgba(0,0,0,0.25) inset;
}

.upload-label,
.speed-label,
.queue-label { color: rgba(190,255,206,0.30) }

.upload-btn {
  background: linear-gradient(180deg, var(--surface-1) 0%, var(--surface-2) 100%);
  border-color: rgba(125,255,176,0.30);
  color: rgba(190,255,206,0.58);
  box-shadow:
    0 1px 0 rgba(125,255,176,0.06) inset,
    0 3px 12px rgba(0,0,0,0.48);
}

.upload-btn:hover {
  border-color: rgba(150,255,190,0.66);
  color: rgba(208,255,222,1);
  background: linear-gradient(180deg, var(--surface-3) 0%, var(--surface-4) 100%);
  box-shadow:
    0 1px 0 rgba(125,255,176,0.12) inset,
    0 5px 20px rgba(0,0,0,0.58),
    0 0 24px rgba(125,255,176,0.18);
}

.upload-btn:active {
  transform: translateY(1px);
  box-shadow:
    inset 0 2px 6px rgba(0,0,0,0.5),
    inset 0 1px 0 rgba(125,255,176,0.05);
}

/* Soft-extruded (neumorphic) tactile buttons — a faint green emission
   catches the top-left rim, the body drops into a soft shadow. */
.ctrl-btn,
.speed-btn {
  background: radial-gradient(circle at 36% 32%, rgba(18,28,20,0.93), rgba(6,10,7,0.97));
  border-color: var(--border-soft);
  color: rgba(190,255,206,0.72);
  box-shadow:
    4px 5px 12px rgba(0,0,0,0.55),
    -3px -3px 9px rgba(125,255,176,0.035),
    0 1px 0 rgba(125,255,176,0.07) inset;
}

.ctrl-btn:hover,
.speed-btn:hover {
  background: radial-gradient(circle at 36% 32%, rgba(26,40,28,0.93), rgba(10,16,11,0.97));
  border-color: var(--border-strong);
  color: var(--accent-strong);
  box-shadow:
    5px 6px 16px rgba(0,0,0,0.62),
    -3px -3px 10px rgba(125,255,176,0.05),
    0 1px 0 rgba(125,255,176,0.11) inset,
    0 0 22px var(--accent-glow);
}

/* Press feedback — the button sinks into the surface. */
.ctrl-btn:active,
.speed-btn:active {
  box-shadow:
    inset 3px 3px 8px rgba(0,0,0,0.6),
    inset -2px -2px 6px rgba(125,255,176,0.045);
}

.ctrl-btn.active {
  background: radial-gradient(circle at 36% 32%, rgba(34,52,36,0.96), rgba(14,22,15,0.99));
  border-color: rgba(150,255,190,0.70);
  color: #7dffb0;
  box-shadow:
    inset 2px 2px 7px rgba(0,0,0,0.5),
    inset -1px -1px 4px rgba(125,255,176,0.06),
    0 0 24px rgba(125,255,176,0.26);
}

.vol-icon { color: rgba(190,255,206,0.28) }
.slider-track { background: rgba(125,255,176,0.10) }
.slider-fill { background: linear-gradient(90deg, rgba(125,255,176,0.55), rgba(182,255,106,0.85)) }
.slider-thumb {
  background: #9fffc4;
  box-shadow: 0 0 0 1px rgba(125,255,176,0.30), 0 0 10px rgba(125,255,176,0.35);
}

.kbd-hint { color: rgba(190,255,206,0.13) }
.track-title { color: var(--text-main) }
.track-artist,
.queue-count { color: var(--text-soft) }
.queue-list::-webkit-scrollbar-track { background: rgba(125,255,176,0.04) }
.queue-list::-webkit-scrollbar-thumb { background: rgba(125,255,176,0.25); border-radius: 2px }
.queue-item { border-bottom-color: rgba(125,255,176,0.06) }
.queue-item:hover { background: rgba(125,255,176,0.08) }
.queue-item.active .queue-name { color: var(--accent) }
.queue-item.active .queue-num { opacity: 0.7 }
.queue-name { color: rgba(190,255,206,0.52) }
.queue-num { color: rgba(190,255,206,0.35) }
.queue-remove { color: rgba(190,255,206,0.55) }

.speed-val {
  border-color: rgba(125,255,176,0.22);
  color: rgba(190,255,206,0.78);
}

.speed-val:focus {
  outline: none;
  border-color: rgba(150,255,190,0.5);
  color: var(--accent-strong);
}

.theme-switcher-label { color: rgba(190,255,206,0.24) }

.theme-select {
  color: rgba(190,255,206,0.82);
  background-color: rgba(8,12,9,0.74);
  border-color: rgba(125,255,176,0.24);
  box-shadow:
    0 8px 24px rgba(0,0,0,0.28),
    0 1px 0 rgba(125,255,176,0.08) inset;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6'%3E%3Cpath fill='rgba(190,255,206,0.82)' d='M5 6 .4.8 1.6 0 5 3.5 8.4 0 9.6.8z'/%3E%3C/svg%3E");
}

.theme-select:focus {
  outline: none;
  border-color: rgba(150,255,190,0.54);
  box-shadow:
    0 8px 24px rgba(0,0,0,0.28),
    0 0 0 1px rgba(150,255,190,0.24);
}

/* "Manage Music" modal — near-solid surface so text stays legible
   instead of fighting the blurred app behind the glass. */
.queue-modal-panel.ui-panel {
  background: linear-gradient(180deg, rgba(12,20,14,0.985), rgba(6,10,7,0.99));
  border-color: rgba(125,255,176,0.32);
  box-shadow:
    0 24px 70px rgba(0,0,0,0.7),
    0 3px 12px rgba(0,0,0,0.5),
    0 1px 0 rgba(125,255,176,0.06) inset;
}
```

## themes/glow-lab/theme.js

```javascript
window.MYNYL_THEME_MODULES = window.MYNYL_THEME_MODULES || {};

/* ------------------------------------------------------------------ *
 * Glow Lab — persistent phosphor charge/decay overlay.
 *
 * A single module-scope `charge` (0..1) climbs while audio plays and
 * bleeds off slowly when it stops, so the disc keeps glowing and fades
 * over several seconds after playback ends. Every additive alpha below
 * is multiplied by `charge`, giving a dim instrument at rest and a
 * blooming disc on the beat.
 * ------------------------------------------------------------------ */

// Persists across frames — advanced by performance.now() deltas.
let glowCharge = 0;
let glowLastTime = 0;

// Constellation star layout, seeded deterministically from the index so the
// pattern is stable every frame (never per-frame Math.random for positions).
const STAR_COUNT = 9;
const STARS = (() => {
  const out = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    // Spread roughly around the ring, with a seeded angular jitter.
    const base = (i / STAR_COUNT) * Math.PI * 2;
    const jitter = Math.sin(i * 12.9898) * 0.55;          // stable per-index offset
    const angle = base + jitter;
    // Radius as a fraction of the disc radius — kept clear of the label
    // (label ends ~0.175R) and inside the outer grooves (~0.91R).
    const radial = 0.40 + (Math.sin(i * 78.233) * 0.5 + 0.5) * 0.34; // 0.40..0.74
    const twinklePhase = Math.sin(i * 4.561) * Math.PI;   // unique twinkle offset
    const twinkleRate = 1.4 + (Math.sin(i * 9.871) * 0.5 + 0.5) * 1.8;
    out.push({ angle, radial, twinklePhase, twinkleRate });
  }
  return out;
})();

window.MYNYL_THEME_MODULES["glow-lab"] = {
  drawRecord({ angle, record, ctx, state }) {
    // 1) Paint the base disc + grooves + label first; we only overlay glow.
    arguments[0].defaults.drawRecord(angle);

    const { cx, cy, radius } = record;
    const nowMs = performance.now();
    const nowS = nowMs / 1000;

    // --- Advance the charge/decay model from real elapsed time ----------
    if (!glowLastTime) glowLastTime = nowMs;
    let dt = (nowMs - glowLastTime) / 1000;
    glowLastTime = nowMs;
    if (dt < 0) dt = 0;
    if (dt > 0.1) dt = 0.1;                                 // clamp tab-switch jumps

    const playing = !!(state && state.playing);
    const groovePulse = Math.max(
      0,
      Math.min(1, state && typeof state.groovePulse === "number" ? state.groovePulse : 0)
    );

    if (playing) {
      glowCharge += dt * 0.6;                               // charge up while playing
      glowCharge += groovePulse * dt * 2.2;                 // extra spike on the beat
    } else {
      glowCharge -= dt * 0.4;                               // slow decay after stop
    }
    if (glowCharge < 0) glowCharge = 0;
    if (glowCharge > 1) glowCharge = 1;

    const charge = glowCharge;
    if (charge <= 0.001) return;                            // fully dark: nothing to draw

    // Live brightness blends steady charge with the instantaneous beat.
    const live = Math.min(1, charge + groovePulse * 0.5);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.globalCompositeOperation = "lighter";              // additive glow

    // ---- (a) Additive green groove-glow pass: a few faint rings -------
    // Spins WITH the disc so the glow tracks the grooves.
    ctx.save();
    ctx.rotate(angle);
    const ringRadii = [0.34, 0.52, 0.68, 0.84];
    for (let r = 0; r < ringRadii.length; r++) {
      const rr = radius * ringRadii[r];
      // Outer rings brighten a touch more with the beat.
      const ringAlpha = (0.05 + live * 0.12) * charge * (0.7 + r * 0.12);
      ctx.beginPath();
      ctx.arc(0, 0, rr, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(125,255,176,${ringAlpha.toFixed(3)})`;
      ctx.lineWidth = Math.max(1, radius * 0.006);
      ctx.shadowBlur = radius * (0.02 + live * 0.03);
      ctx.shadowColor = "rgba(125,255,176,0.6)";
      ctx.stroke();
    }
    ctx.restore();

    // ---- (b) Hand-drawn constellation around the label ---------------
    // Rotates slowly with the disc (angle*0.2) so it drifts, not spins.
    const constRot = angle * 0.2;
    ctx.save();
    ctx.rotate(constRot);

    // Precompute star screen positions (relative to centre).
    const pts = STARS.map((s) => {
      const rr = radius * s.radial;
      return {
        x: Math.cos(s.angle) * rr,
        y: Math.sin(s.angle) * rr,
        s,
      };
    });

    // Thin phosphor connecting lines (each star to the next, ring closed).
    ctx.lineWidth = Math.max(0.75, radius * 0.0035);
    ctx.shadowBlur = radius * 0.012;
    ctx.shadowColor = "rgba(125,255,176,0.5)";
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = `rgba(125,255,176,${(0.10 * live * charge).toFixed(3)})`;
      ctx.stroke();
    }

    // Soft radial bloom at each star, twinkling subtly over time.
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const twinkle = 0.55 + 0.45 * Math.sin(nowS * p.s.twinkleRate + p.s.twinklePhase);
      const starAlpha = (0.18 + live * 0.42) * charge * twinkle;
      const coreR = radius * (0.006 + live * 0.004);
      const haloR = radius * (0.03 + live * 0.02);

      // Faint cyan-tinted halo gives the "stars" their cold accent.
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, haloR);
      grad.addColorStop(0, `rgba(201,255,217,${starAlpha.toFixed(3)})`);
      grad.addColorStop(0.4, `rgba(125,255,176,${(starAlpha * 0.7).toFixed(3)})`);
      grad.addColorStop(1, "rgba(74,214,255,0)");
      ctx.beginPath();
      ctx.arc(p.x, p.y, haloR, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.shadowBlur = 0;
      ctx.fill();

      // Bright core bead.
      ctx.beginPath();
      ctx.arc(p.x, p.y, coreR, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(201,255,217,${Math.min(1, starAlpha * 1.4).toFixed(3)})`;
      ctx.shadowBlur = radius * 0.02;
      ctx.shadowColor = "rgba(125,255,176,0.7)";
      ctx.fill();
    }
    ctx.restore(); // end constellation rotation

    // ---- Always reset additive/shadow state before returning ---------
    ctx.globalCompositeOperation = "source-over";
    ctx.shadowBlur = 0;
    ctx.restore(); // end translate
  }
};
```

> Note: `arguments[0].defaults.drawRecord(angle)` and the destructured `defaults` are the same object; the destructure list omits `defaults` only to keep the signature short — if you prefer, add `defaults` to the destructured params and call `defaults.drawRecord(angle)` directly. Both forms are valid; pick one.

For maximum clarity, the recommended (explicit) signature is:

```javascript
  drawRecord({ angle, record, ctx, state, defaults }) {
    defaults.drawRecord(angle);
    // ...everything else unchanged, drop the arguments[0] line...
```

## Register in js/themes.js

Add this object to the `MYNYL_THEME_REGISTRY` array, **before** the trailing commented placeholder line:

```javascript
{ name: 'Glow Lab', path: 'themes/glow-lab' },
```

Resulting array:

```javascript
window.MYNYL_THEME_REGISTRY = [
  { name: 'Wood', path: 'themes/wood', default: true },
  { name: 'Minimal Light', path: 'themes/minimal-light' },
  { name: 'Disco Pop', path: 'themes/disco-pop' },
  { name: 'Risograph', path: 'themes/risograph' },
  { name: 'Outrun Grid', path: 'themes/outrun-grid' },
  { name: 'Glow Lab', path: 'themes/glow-lab' },
];

// { name: '', path: 'themes/' },
```

## Build & test checklist

1. Create the folder `themes/glow-lab/` and add all six files above: `theme.css`, `background.css`, `vinyl.css`, `arm.css`, `ui.css`, `theme.js`.
2. Register the theme in `js/themes.js` (above). No edit to `index.html` is needed — the registry drives the dropdown and the engine loads the per-theme `theme.js` automatically.
3. Open `index.html` directly in a browser (no build step).
4. Open the **bottom-right `#theme-select` dropdown** and pick **"Glow Lab"**. Confirm the page goes near-black, the panels turn dark phosphor-green glass, and the selection persists across reload (localStorage).
5. Load a track via the upload button. Name the file in the form `Title - Artist.mp3` (e.g. `Phosphor - Glow Lab.mp3`) so `window._trackTitle` / `window._trackArtist` populate.
6. Drag the tonearm onto the disc, or press **Space / play**. After the 2s spin-up crackle, music fades in.
7. Verify all of the following:
   - **No console errors** at any point (load, play, stop, theme switch, resize).
   - The overlay **clears / does not smear the centre label** — all glow rings and stars sit at `r > radius * 0.30`.
   - **Album art is clipped to the disc** by the default renderer; the overlay never paints past `radius * 0.91`.
   - Readable and correctly proportioned at both a **small window** and a **maximized / large** window (all sizes are geometry-relative; no hardcoded px).
   - **Smooth at ~60fps** — primitive count is ~25 strokes/fills per frame, well under budget.
   - **No-file / idle state:** with no track loaded and not playing, `charge` decays to 0 and the overlay early-returns, leaving the plain static charcoal disc — confirm there is no leftover glow stuck on screen.
   - **Charge/decay behavior:** the disc visibly brightens while playing (and pulses on loud beats), then keeps glowing and **fades smoothly over several seconds** after you press stop.

### Theme-specific GOTCHAS

- **Coordinate space is CSS px** — `ctx` is already scaled to `devicePixelRatio`. Never multiply by DPR yourself.
- **Angle units differ:** `drawRecord` receives `angle` in **radians** (use it directly for `ctx.rotate`); `drawArm` would receive degrees (convert with `helpers.toRad`). This theme only overlays the record, so it stays in radians.
- **Always reset additive state before returning:** this overlay uses `globalCompositeOperation = 'lighter'` and `shadowBlur`. The code resets both to `'source-over'` / `0` at the end. Forgetting this bleeds glow into the arm canvas and subsequent frames.
- **Keep overlays at `r > radius * 0.30`** to clear the centre label (label radius ~`0.175R`). All ring radii start at `0.34R` and stars at `0.40R`.
- **Balanced save/restore:** there are three `ctx.save()` calls (outer translate, groove-ring rotation, constellation rotation) and three matching `ctx.restore()`. Do not add a draw call between restores without re-saving.
- **shadowBlur is the main perf cost.** Star halos use a radial gradient with `shadowBlur = 0`; only the small core bead and the groove rings use blur. Do not raise `shadowBlur` into the `radius * 0.1+` range or add more blurred primitives — keep total under ~100 strokes/frame.
- **Charge state is module-scope** (`glowCharge`, `glowLastTime`) and advanced by `performance.now()` deltas with `dt` clamped to 0.1s so a backgrounded tab does not produce a giant jump on return. Do not reset these on theme switch — they naturally decay to 0 when not playing.
