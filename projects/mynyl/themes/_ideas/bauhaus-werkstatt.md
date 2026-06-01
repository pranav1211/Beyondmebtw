# Bauhaus Werkstatt

A Dessau-poster pressing: flat primary geometry on warm paper, hard-edged red/yellow/blue forms, zero gloss, constructivist confidence — the art holds still while the record turns.

Folder: `themes/bauhaus-werkstatt/`. Registry display name: **"Bauhaus Werkstatt"**.

## Overview

Bauhaus Werkstatt renders the vinyl as a matte charcoal disc on a static warm-paper background with no glow and no drift, like a printed poster pinned to a wall. The vinyl uses the `minimal` style (flat, no specular highlight), precise un-warped concentric grooves, and a bold solid-yellow badge label ringed in heavy black. The tonearm is a flat primary-blue bar with a solid-red counterweight, a solid-yellow pivot, and a single hard black needle line. The signature move lives in `theme.js`: after the engine paints the base disc, the overlay draws a constructivist badge — a large red quarter-circle pie slice, a blue triangle, and a yellow bar — arranged off-center around the label and **held upright (never rotated)** so the grooves visibly spin beneath the still artwork. On audio (`state.groovePulse`) the three primary shapes do a synchronized scale-pop from 1.0 to ~1.04 around the label center. The theme degrades gracefully: if `theme.js` is removed or fails to load, the CSS alone still ships a complete, attractive flat-Bauhaus player (disc, grooves, yellow label, blue arm, paper UI) — the overlay badge is purely additive.

## themes/bauhaus-werkstatt/theme.css

```css
@import url('./background.css');
@import url('./vinyl.css');
@import url('./arm.css');
@import url('./ui.css');
```

## themes/bauhaus-werkstatt/background.css

```css
:root {
  /* Layout / geometry */
  --player-record-scale: 0.42;
  --arm-pivot-offset-x: 1.05;
  --arm-pivot-offset-y: -0.85;
  --arm-outer-radius: 0.91;
  --arm-inner-radius: 0.30;
  --arm-outer-offset-x: -0.10;
  --arm-outer-offset-y: -0.85;
  --arm-park-offset-x: 1.20;
  --arm-park-offset-y: 0.30;

  /* Background: flat warm-paper, near-zero motion (a static printed poster) */
  --bg-center-rgb: 236,228,212;
  --bg-mid-rgb: 230,221,203;
  --bg-edge-0: #e6ddcb;
  --bg-edge-1: #ded4c0;
  --bg-glow-strength: 0.04;
  --bg-drift-x: 0.005;
  --bg-drift-y: 0.005;

  /* Drop hint overlay — ink-on-paper primaries */
  --hint-ring: rgba(31,78,161,0.55);
  --hint-dot: rgba(214,51,42,0.95);
  --hint-glow: rgba(214,51,42,0.28);
  --hint-text: rgba(26,24,21,0.82);
}
```

## themes/bauhaus-werkstatt/vinyl.css

```css
:root {
  /* Flat matte disc — minimal style ignores specular/sheen anyway */
  --vinyl-style: minimal;
  --vinyl-disc: #232020;
  --vinyl-edge: rgba(236,228,212,0.10);
  --vinyl-rim-light: rgba(236,228,212,0.06);
  --vinyl-rim-shadow: rgba(0,0,0,0.40);
  --vinyl-shadow-ring: none;

  /* Graphic grooves: precise concentric, no warp */
  --vinyl-groove-rgb: 236,228,212;
  --vinyl-groove-alpha: 0.05;
  --vinyl-groove-pulse: 0.04;
  --vinyl-groove-spacing: 3.2;
  --vinyl-groove-width: 0.5;
  --vinyl-groove-start: 0.26;
  --vinyl-groove-end: 0.91;
  --vinyl-groove-warp: 0;

  /* Zero gloss */
  --vinyl-sheen: 0;
  --vinyl-sheen-width: 0;
  --vinyl-specular: 0;

  /* Flat printed contact shadow */
  --vinyl-depth: 0.25;
  --vinyl-drop-shadow: rgba(0,0,0,0.30);
  --vinyl-drop-shadow-blur: 8;
  --vinyl-drop-shadow-offset-y: 4;

  /* Bold yellow badge label, heavy black ring + stroke */
  --vinyl-label-radius: 0.22;
  --vinyl-hole-radius: 0.02;
  --vinyl-label-0: #f0b81e;
  --vinyl-label-55: #f0b81e;
  --vinyl-label-100: #f0b81e;
  --vinyl-label-ring: rgba(26,24,21,1);
  --vinyl-label-stroke: rgba(26,24,21,0.85);
  --vinyl-label-art-base: #1a1815;
  --vinyl-hole-fill: #1a1815;
}
```

## themes/bauhaus-werkstatt/arm.css

```css
:root {
  /* Straight flat primary-blue bar, no bend, no highlight */
  --arm-style: straight;
  --arm-tube-width: 0.018;
  --arm-shadow-blur: 6;
  --arm-shadow-offset-y: 3;
  --arm-highlight-alpha: 0;
  --arm-0: #1f4ea1;
  --arm-25: #1f4ea1;
  --arm-60: #1f4ea1;
  --arm-100: #1f4ea1;

  --arm-headshell: #1f4ea1;
  --arm-headshell-length: 0.10;
  --arm-headshell-width: 0.016;
  --arm-headshell-bend-deg: 0;

  /* One hard black needle line */
  --arm-needle: #1a1815;
  --arm-needle-tip: #1a1815;
  --arm-needle-width: 2;
  --arm-needle-length: 0.55;

  /* Counterweight: rounded-rect for straight arm uses cw-55 — solid red */
  --arm-counterweight-radius: 0.038;
  --arm-counterweight-offset: 0.15;
  --arm-cw-0: #d6332a;
  --arm-cw-55: #d6332a;
  --arm-cw-100: #d6332a;

  /* Pivot: solid yellow */
  --arm-pivot-radius: 0.03;
  --arm-pivot-inner-radius: 0.30;
  --arm-pivot-0: #f0b81e;
  --arm-pivot-50: #f0b81e;
  --arm-pivot-100: #f0b81e;
}
```

## themes/bauhaus-werkstatt/ui.css

```css
:root {
  --page-bg: #ece4d4;
  --glass-bg: rgba(236,228,212,0.92);
  --glass-border: rgba(26,24,21,1);
  --glass-inset: rgba(255,255,255,0.30);
  --text-main: #1a1815;
  --text-soft: rgba(26,24,21,0.55);
  --text-faint: rgba(26,24,21,0.35);
  --accent: #d6332a;
  --accent-strong: #1f4ea1;
  --accent-dim: rgba(26,24,21,0.45);
  --accent-glow: rgba(214,51,42,0.18);
  --surface-1: rgba(236,228,212,0.98);
  --surface-2: rgba(222,212,192,0.98);
  --surface-3: rgba(244,238,226,1);
  --surface-4: rgba(214,204,184,1);
  --border-soft: rgba(26,24,21,0.55);
  --border-strong: rgba(26,24,21,1);
}
html, body { background: var(--page-bg) }
.eye-btn { color: var(--accent-dim) }
.eye-btn:hover, .eye-zone:hover .eye-btn { color: var(--accent-strong) }
.ui-panel {
  background: var(--glass-bg); border: 2px solid var(--glass-border); border-radius: 0;
  padding: 18px 20px;
  backdrop-filter: none; -webkit-backdrop-filter: none;
  box-shadow: 6px 6px 0 rgba(26,24,21,0.85), 0 1px 0 var(--glass-inset) inset;
}
.upload-label, .speed-label, .queue-label, .theme-switcher-label { color: rgba(26,24,21,0.62) }
.upload-btn {
  background: linear-gradient(180deg, var(--surface-1) 0%, var(--surface-2) 100%);
  border: 2px solid rgba(26,24,21,0.85); color: rgba(26,24,21,0.92);
  box-shadow: 3px 3px 0 rgba(26,24,21,0.75);
}
.upload-btn:hover { border-color: rgba(26,24,21,1); color: #d6332a; background: linear-gradient(180deg, var(--surface-3) 0%, var(--surface-4) 100%); box-shadow: 4px 4px 0 rgba(26,24,21,0.9); }
.upload-btn:active { transform: translate(2px,2px); box-shadow: 1px 1px 0 rgba(26,24,21,0.8); }
.ctrl-btn, .speed-btn {
  background: #ece4d4; border: 2px solid rgba(26,24,21,0.85); color: rgba(26,24,21,0.92);
  box-shadow: 3px 3px 0 rgba(26,24,21,0.7);
}
.ctrl-btn:hover, .speed-btn:hover { background: #f0b81e; border-color: rgba(26,24,21,1); color: #1a1815; box-shadow: 4px 4px 0 rgba(26,24,21,0.9); }
.ctrl-btn:active, .speed-btn:active { transform: translate(2px,2px); box-shadow: 1px 1px 0 rgba(26,24,21,0.85); }
.ctrl-btn.active { background: #d6332a; border-color: rgba(26,24,21,1); color: #ece4d4; box-shadow: 2px 2px 0 rgba(26,24,21,0.85); }
.vol-icon { color: rgba(26,24,21,0.55) }
.slider-track { background: rgba(26,24,21,0.18) }
.slider-fill { background: linear-gradient(90deg, #f0b81e, #f0b81e) }
.slider-thumb { background: #d6332a; box-shadow: 0 0 0 2px rgba(26,24,21,0.9); }
.kbd-hint { color: rgba(26,24,21,0.30) }
.track-title { color: var(--text-main) }
.track-artist, .queue-count { color: var(--text-soft) }
.queue-list::-webkit-scrollbar-track { background: rgba(26,24,21,0.08) }
.queue-list::-webkit-scrollbar-thumb { background: rgba(26,24,21,0.45); border-radius: 0 }
.queue-item { border-bottom-color: rgba(26,24,21,0.16) }
.queue-item:hover { background: rgba(240,184,30,0.22) }
.queue-item.active .queue-name { color: var(--accent) }
.queue-item.active .queue-num { opacity: 0.8 }
.queue-name { color: rgba(26,24,21,0.82) }
.queue-num { color: rgba(26,24,21,0.55) }
.queue-remove { color: rgba(26,24,21,0.62) }
.speed-val, .theme-select {
  color: #1a1815; background-color: rgba(236,228,212,0.96);
  border: 2px solid rgba(26,24,21,0.55);
  box-shadow: 3px 3px 0 rgba(26,24,21,0.6);
}
.speed-val:focus, .theme-select:focus { outline: none; border-color: rgba(26,24,21,1); box-shadow: 3px 3px 0 rgba(26,24,21,0.85); }
.theme-select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6'%3E%3Cpath fill='%231a1815' d='M5 6 .4.8 1.6 0 5 3.5 8.4 0 9.6.8z'/%3E%3C/svg%3E");
}
/* Modal must be near-solid so text stays legible over the app behind it */
.queue-modal-panel.ui-panel {
  background: linear-gradient(180deg, rgba(240,234,222,1), rgba(228,218,200,1));
  border: 2px solid rgba(26,24,21,1);
  box-shadow: 8px 8px 0 rgba(26,24,21,0.85), 0 1px 0 rgba(255,255,255,0.25) inset;
}
```

## themes/bauhaus-werkstatt/theme.js

```js
window.MYNYL_THEME_MODULES = window.MYNYL_THEME_MODULES || {};

window.MYNYL_THEME_MODULES["bauhaus-werkstatt"] = {

  // ── Persistent closure state for smooth scale-pop ──
  // pop eases toward the live audio level; we advance it with real-time
  // deltas (performance.now) so motion is frame-rate independent.
  _pop: 0,
  _last: performance.now(),

  drawRecord({ angle, record, ctx, state, defaults }) {
    // 1) Paint the base disc + grooves + yellow label FIRST.
    defaults.drawRecord(angle);

    const { cx, cy, radius } = record;

    // ── Smooth the audio pulse into a 0..1 "pop" value ──
    const now = performance.now();
    let dt = (now - this._last) / 1000;       // seconds since last frame
    this._last = now;
    if (!(dt > 0) || dt > 0.1) dt = 1 / 60;   // clamp pauses / first frame
    const target = Math.max(0, Math.min(1,
      state && typeof state.groovePulse === "number" ? state.groovePulse : 0));
    // Exponential smoothing toward target (~12/s response).
    const k = 1 - Math.exp(-12 * dt);
    this._pop += (target - this._pop) * k;
    // Synchronized scale-pop: 1.00 → ~1.04
    const scale = 1 + this._pop * 0.04;

    // ── Geometry band: frame the label, never cover the whole disc ──
    // Shapes live between the label edge (r > radius*0.24) and ~radius*0.6.
    const R = radius;
    const labelEdge = R * 0.24;

    ctx.save();
    ctx.translate(cx, cy);
    // NOTE: we do NOT call ctx.rotate(angle) here. The badge holds still
    // and upright while the grooves spin beneath it — the "art holds still"
    // illusion. The scale-pop is applied around the label center (0,0).
    ctx.scale(scale, scale);

    // Flat hard-edged fills only: no shadows, no gradients, no AA glow.
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = "source-over";
    ctx.lineJoin = "miter";

    const RED    = "#d6332a";
    const BLUE   = "#1f4ea1";
    const YELLOW = "#f0b81e";
    const INK    = "#1a1815";

    // ── (a) Large RED quarter-circle pie slice, off-center upper-left ──
    // Pivot just outside the label on the upper-left; sweep a 90° wedge.
    const pieR  = R * 0.36;
    const pieCx = -R * 0.10;
    const pieCy = -R * 0.06;
    const a0 = Math.PI * 0.62;   // start angle
    const a1 = a0 + Math.PI / 2; // exact quarter circle
    ctx.fillStyle = RED;
    ctx.beginPath();
    ctx.moveTo(pieCx, pieCy);
    ctx.arc(pieCx, pieCy, pieR, a0, a1, false);
    ctx.closePath();
    ctx.fill();

    // ── (b) BLUE triangle, off-center lower-right, hard flat fill ──
    const tx = R * 0.30;   // triangle anchor x
    const ty = R * 0.18;   // triangle anchor y
    const tS = R * 0.30;   // triangle size
    ctx.fillStyle = BLUE;
    ctx.beginPath();
    ctx.moveTo(tx,          ty - tS * 0.55);
    ctx.lineTo(tx + tS * 0.62, ty + tS * 0.50);
    ctx.lineTo(tx - tS * 0.58, ty + tS * 0.42);
    ctx.closePath();
    ctx.fill();

    // ── (c) YELLOW bar, crossing the upper-right band, hard rectangle ──
    // Drawn in a rotated local frame so it sits at a constructivist tilt.
    ctx.save();
    ctx.rotate(-Math.PI / 5);          // fixed tilt, NOT the disc spin
    const barW = R * 0.50;
    const barH = R * 0.085;
    const barX = R * 0.02;             // local x offset of bar start
    const barY = -R * 0.30;           // local y position
    ctx.fillStyle = YELLOW;
    ctx.fillRect(barX, barY - barH / 2, barW, barH);
    ctx.restore();

    // ── (d) Thin INK accent line — a single hard rule for structure ──
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(1.5, R * 0.008);
    ctx.beginPath();
    ctx.moveTo(-R * 0.42, R * 0.40);
    ctx.lineTo( R * 0.30, R * 0.40);
    ctx.stroke();

    // ── Re-cover the centre label so the badge frames (not buries) it. ──
    // The shapes intentionally stay outside r=labelEdge, but redraw a clean
    // ink ring at the label boundary to keep the composition crisp.
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(1, R * 0.006);
    ctx.beginPath();
    ctx.arc(0, 0, labelEdge, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();

    // Hygiene: ensure no state leaks to the next frame / next theme.
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = "source-over";
  }
};
```

## Register in js/themes.js

Add this object to the `MYNYL_THEME_REGISTRY` array, before the trailing commented placeholder:

```js
window.MYNYL_THEME_REGISTRY = [
  { name: 'Wood', path: 'themes/wood', default: true },
  { name: 'Minimal Light', path: 'themes/minimal-light' },
  { name: 'Disco Pop', path: 'themes/disco-pop' },
  { name: 'Risograph', path: 'themes/risograph' },
  { name: 'Outrun Grid', path: 'themes/outrun-grid' },
  { name: 'Bauhaus Werkstatt', path: 'themes/bauhaus-werkstatt' },
];

// { name: '', path: 'themes/' },
```

The new line goes immediately after `Outrun Grid` and before the `// { name: '', path: 'themes/' },` commented placeholder. The `path` value must match the folder name `bauhaus-werkstatt`, which must match the `MYNYL_THEME_MODULES["bauhaus-werkstatt"]` key.

## Build & test checklist

1. Create folder `themes/bauhaus-werkstatt/` and add all six files above: `theme.css`, `background.css`, `vinyl.css`, `arm.css`, `ui.css`, `theme.js`.
2. Edit `js/themes.js` to register the theme (section above).
3. Open `index.html` directly in a browser (no build step).
4. In the bottom-right `#theme-select` dropdown, choose **Bauhaus Werkstatt**. Confirm the selection persists across a page reload (localStorage).
5. With no file loaded, confirm the **idle/no-file state**: paper background, charcoal disc, yellow label, blue arm parked to the right, badge overlay (red pie + blue triangle + yellow bar) sitting still and upright around the label — no console errors.
6. Load a track named exactly `Title - Artist.mp3` (the parser splits on " - "). Drag the tonearm onto the disc, or press play/space.
7. Confirm during playback:
   - No console errors or warnings.
   - The badge overlay holds still/upright while the grooves visibly spin beneath it (art-holds-still illusion).
   - On audio, the red/blue/yellow shapes do a synchronized scale-pop (1.0 → ~1.04) around the label center, smoothly — no jitter.
   - The overlay never smears the centre label: shapes stay in the band r > radius*0.24, and the ink ring keeps the label edge crisp.
   - Art reads correctly at both a small window and a maximized window (geometry recomputes on resize; no hardcoded px).
   - Motion is smooth at 60fps.
8. Press stop and confirm the badge settles back to scale 1.0 and the player returns to the idle state cleanly.

**Theme-specific GOTCHAS**

- **Coordinate space is CSS px** — `ctx` is already scaled to `devicePixelRatio`. Never multiply by DPR; draw in CSS px using `record.radius`, `record.cx`, `record.cy`.
- **Angle units differ by canvas**: `drawRecord` receives `angle` in **radians**; `drawArm` (not used here) receives degrees — convert with `helpers.toRad`. This theme only overrides `drawRecord`.
- **Hold still vs. spin**: the badge deliberately does NOT call `ctx.rotate(angle)`. Only `translate` to center, then `scale` for the pop. The canvas element itself never rotates, so omitting the rotate keeps the art upright while grooves (painted by `defaults.drawRecord`) spin.
- **Always call `defaults.drawRecord(angle)` first**, then overlay — otherwise the base disc, grooves, and label won't be painted.
- **Keep overlay r > radius*0.30** (this theme uses r > radius*0.24 and frames, not covers, the label). Shapes are anchored so their nearest edges stay outside the label radius; do not let them creep over the centre unless intentional.
- **Reset graphics state before returning**: `shadowBlur = 0` and `globalCompositeOperation = "source-over"`. This theme uses neither glow nor `lighter`, but resets defensively so no state leaks into the next frame or the next theme after a switch.
- **No `Math.random()` per frame for positions** — every shape here uses fixed offsets, so the composition is stable. The only per-frame motion is the smoothed `_pop` value, advanced by `performance.now()` deltas in closure scope.
- **Balanced save/restore**: each `ctx.save()` (outer translate/scale block, and the inner yellow-bar tilt block) has a matching `ctx.restore()`. Verify the count stays balanced if you add shapes.
- **Perf**: this overlay draws ~5 primitives per frame with no `shadowBlur`, so it is effectively free. If you add glow later, remember `shadowBlur` is the dominant cost — keep total per-frame primitives under ~100 strokes.
