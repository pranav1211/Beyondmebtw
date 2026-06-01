# Cyanotype Blueprint

A turntable rendered as its own engineering schematic — Prussian-blue drafting paper, hairline cyan ink, dimension callouts, a corner title block, and a radar sweep-line that energizes on the beat.

Folder: `themes/cyanotype-blueprint/` · Registry display name: **"Cyanotype Blueprint"**

## Overview

This is a dark, line-forward theme. The base disc reads as deep Prussian blue (`#07224f`) with hairline cyan drafting-circle grooves at zero warp (perfect concentricity), no gloss, no sheen, and a very light contact shadow. The signature move is a `theme.js` `drawRecord` overlay that paints a **stationary, upright** technical layer in strictly hairline cyan vector ink: radial dimension lines with little arrowheads and numeric callouts ("⌀304", "r=0.30R", "33⅓ RPM") running from the rim inward, a small corner title block typesetting `window._trackTitle` / `window._trackArtist` in Space Mono (falling back to `NO DISC LOADED`), and a crosshair `+` at the spindle. While playing, a cyan radar sweep-line rotates **with** the disc from center to rim with a short faint trailing wedge, and `state.groovePulse` thickens one highlighted groove ring (~r=0.9R) and blooms the sweep. The overlay layer never rotates with the disc except the radar sweep, so the schematic text and callouts always stay readable.

This theme **does not degrade to CSS-only** — the dimension lines, title block, crosshair, and radar sweep all live in `theme.js`. Without it you still get a perfectly valid blueprint-blue etched record from the CSS tokens, but you lose the schematic overlay that defines the theme. `theme.js` is required (`needsThemeJs: true`).

## themes/cyanotype-blueprint/theme.css

```css
@import url('./background.css');
@import url('./vinyl.css');
@import url('./arm.css');
@import url('./ui.css');
```

## themes/cyanotype-blueprint/background.css

```css
:root {
  /* Layout / arm geometry — identical placement to the shipped themes */
  --player-record-scale: 0.42;
  --arm-pivot-offset-x: 1.05;
  --arm-pivot-offset-y: -0.85;
  --arm-outer-radius: 0.91;
  --arm-inner-radius: 0.30;
  --arm-outer-offset-x: -0.10;
  --arm-outer-offset-y: -0.85;
  --arm-park-offset-x: 1.20;
  --arm-park-offset-y: 0.30;

  /* Even Prussian-blue drafting paper — near-zero drift so the surface stays still */
  --bg-center-rgb: 11,47,107;
  --bg-mid-rgb: 9,38,90;
  --bg-edge-0: #07224f;
  --bg-edge-1: #06182c;
  --bg-glow-strength: 0.06;
  --bg-drift-x: 0.01;
  --bg-drift-y: 0.01;

  /* Drop-hint overlay — cyan ink */
  --hint-ring: rgba(127,212,255,0.50);
  --hint-dot: rgba(127,212,255,0.95);
  --hint-glow: rgba(127,212,255,0.45);
  --hint-text: rgba(234,244,255,0.90);
}
```

## themes/cyanotype-blueprint/vinyl.css

```css
:root {
  /* Etched = line-forward; minimal would skip the specular path but we want the
     etched accent rings, so use etched with sheen/specular zeroed. */
  --vinyl-style: etched;

  --vinyl-disc: #07224f;
  --vinyl-edge: rgba(127,212,255,0.30);
  --vinyl-rim-light: rgba(127,212,255,0.55);
  --vinyl-rim-shadow: rgba(3,12,30,0.60);
  --vinyl-shadow-ring: none;

  /* Drafting-circle grooves: hairline cyan, perfectly concentric (warp 0) */
  --vinyl-groove-rgb: 127,212,255;
  --vinyl-groove-alpha: 0.16;
  --vinyl-groove-pulse: 0.10;
  --vinyl-groove-spacing: 1.4;
  --vinyl-groove-width: 0.6;
  --vinyl-groove-start: 0.19;
  --vinyl-groove-end: 0.91;
  --vinyl-groove-warp: 0;

  /* Zero gloss — a flat technical drawing */
  --vinyl-sheen: 0;
  --vinyl-sheen-width: 0.06;
  --vinyl-specular: 0;
  --vinyl-depth: 0.30;

  /* Title-block label: deep blue field, thin cyan ring + stroke */
  --vinyl-label-radius: 0.175;
  --vinyl-hole-radius: 0.02;
  --vinyl-label-0: #07224f;
  --vinyl-label-55: #07224f;
  --vinyl-label-100: #07224f;
  --vinyl-label-ring: rgba(127,212,255,0.70);
  --vinyl-label-stroke: rgba(127,212,255,0.55);
  --vinyl-label-art-base: #07224f;
  --vinyl-hole-fill: #0b2f6b;
}
```

## themes/cyanotype-blueprint/arm.css

```css
:root {
  /* Straight arm drawn as a dimension line */
  --arm-style: straight;
  --arm-tube-width: 0.014;
  --arm-shadow-blur: 4;
  --arm-shadow-offset-y: 2;
  --arm-highlight-alpha: 0.5;

  --arm-0: #07224f;
  --arm-25: #0b2f6b;
  --arm-60: #2f6f9e;
  --arm-100: #07224f;

  /* Headshell + hairline cyan needle */
  --arm-headshell: #2f6f9e;
  --arm-headshell-length: 0.10;
  --arm-headshell-width: 0.014;
  --arm-headshell-bend-deg: -18;
  --arm-needle: #7fd4ff;
  --arm-needle-tip: #cfe9ff;
  --arm-needle-width: 1;
  --arm-needle-length: 0.55;

  /* Straight counterweight = rounded-rect filled with cw-55 → mid blueprint blue */
  --arm-counterweight-radius: 0.038;
  --arm-counterweight-offset: 0.15;
  --arm-cw-0: #2f6f9e;
  --arm-cw-55: #2f6f9e;
  --arm-cw-100: #07203a;

  /* Pivot as a compass node */
  --arm-pivot-radius: 0.03;
  --arm-pivot-inner-radius: 0.30;
  --arm-pivot-0: #cfe9ff;
  --arm-pivot-50: #2f6f9e;
  --arm-pivot-100: #07203a;
}
```

## themes/cyanotype-blueprint/ui.css

```css
:root {
  --page-bg: #07224f;
  --glass-bg: rgba(11,47,107,0.85);
  --glass-border: rgba(127,212,255,0.22);
  --glass-inset: rgba(127,212,255,0.06);
  --text-main: rgba(234,244,255,0.90);
  --text-soft: rgba(127,212,255,0.60);
  --text-faint: rgba(127,212,255,0.35);
  --accent: #7fd4ff;
  --accent-strong: #cfe9ff;
  --accent-dim: rgba(127,212,255,0.42);
  --accent-glow: rgba(127,212,255,0.16);
  --surface-1: rgba(11,47,107,0.92);
  --surface-2: rgba(7,34,79,0.96);
  --surface-3: rgba(19,62,128,0.92);
  --surface-4: rgba(7,28,64,0.97);
  --border-soft: rgba(127,212,255,0.24);
  --border-strong: rgba(127,212,255,0.54);
}
html, body { background: var(--page-bg) }
.eye-btn { color: var(--accent-dim) }
.eye-btn:hover, .eye-zone:hover .eye-btn { color: rgba(207,233,255,0.95) }
.ui-panel {
  background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 8px; padding: 16px 18px;
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 12px 44px rgba(0,0,0,0.55), 0 3px 10px rgba(0,0,0,0.35), 0 1px 0 var(--glass-inset) inset, 0 -1px 0 rgba(3,12,30,0.25) inset;
}
.upload-label, .speed-label, .queue-label { color: rgba(127,212,255,0.50) }
.upload-btn {
  background: linear-gradient(180deg, var(--surface-1) 0%, var(--surface-2) 100%); border-color: rgba(127,212,255,0.34); color: rgba(207,233,255,0.78);
  box-shadow: 0 1px 0 rgba(127,212,255,0.08) inset, 0 3px 12px rgba(0,0,0,0.42);
}
.upload-btn:hover { border-color: rgba(127,212,255,0.72); color: rgba(234,244,255,1); background: linear-gradient(180deg, var(--surface-3) 0%, var(--surface-4) 100%); box-shadow: 0 1px 0 rgba(127,212,255,0.14) inset, 0 5px 20px rgba(0,0,0,0.52), 0 0 24px rgba(127,212,255,0.16); }
.upload-btn:active { transform: translateY(1px); box-shadow: inset 0 2px 6px rgba(3,12,30,0.5), inset 0 1px 0 rgba(127,212,255,0.06); }
.ctrl-btn, .speed-btn {
  background: radial-gradient(circle at 36% 32%, rgba(19,62,128,0.93), rgba(7,28,64,0.97)); border-color: var(--border-soft); color: rgba(207,233,255,0.80);
  box-shadow: 4px 5px 12px rgba(0,0,0,0.5), -3px -3px 9px rgba(127,212,255,0.05), 0 1px 0 rgba(127,212,255,0.08) inset;
}
.ctrl-btn:hover, .speed-btn:hover { background: radial-gradient(circle at 36% 32%, rgba(27,78,150,0.93), rgba(11,38,86,0.97)); border-color: var(--border-strong); color: var(--accent-strong); box-shadow: 5px 6px 16px rgba(0,0,0,0.58), -3px -3px 10px rgba(127,212,255,0.07), 0 1px 0 rgba(127,212,255,0.12) inset, 0 0 22px var(--accent-glow); }
.ctrl-btn:active, .speed-btn:active { box-shadow: inset 3px 3px 8px rgba(3,12,30,0.6), inset -2px -2px 6px rgba(127,212,255,0.06); }
.ctrl-btn.active { background: radial-gradient(circle at 36% 32%, rgba(35,92,168,0.96), rgba(13,46,98,0.99)); border-color: rgba(127,212,255,0.74); color: #7fd4ff; box-shadow: inset 2px 2px 7px rgba(3,12,30,0.5), inset -1px -1px 4px rgba(127,212,255,0.07), 0 0 24px rgba(127,212,255,0.22); }
.vol-icon { color: rgba(127,212,255,0.45) }
.slider-track { background: rgba(127,212,255,0.12) }
.slider-fill { background: linear-gradient(90deg, rgba(47,111,158,0.74), rgba(127,212,255,0.92)) }
.slider-thumb { background: #cfe9ff; box-shadow: 0 0 0 1px rgba(127,212,255,0.30); }
.kbd-hint { color: rgba(127,212,255,0.22) }
.track-title { color: var(--text-main) }
.track-artist, .queue-count { color: var(--text-soft) }
.queue-list::-webkit-scrollbar-track { background: rgba(127,212,255,0.05) }
.queue-list::-webkit-scrollbar-thumb { background: rgba(127,212,255,0.30); border-radius: 2px }
.queue-item { border-bottom-color: rgba(127,212,255,0.10) }
.queue-item:hover { background: rgba(127,212,255,0.08) }
.queue-item.active .queue-name { color: var(--accent) }
.queue-item.active .queue-num { opacity: 0.7 }
.queue-name { color: rgba(207,233,255,0.70) }
.queue-num { color: rgba(127,212,255,0.45) }
.queue-remove { color: rgba(127,212,255,0.60) }
.speed-val { border-color: rgba(127,212,255,0.24); color: rgba(207,233,255,0.85); }
.speed-val:focus { outline: none; border-color: rgba(127,212,255,0.55); color: var(--accent-strong); }
.theme-switcher-label { color: rgba(127,212,255,0.32) }
.theme-select {
  color: rgba(207,233,255,0.85); background-color: rgba(7,34,79,0.78); border-color: rgba(127,212,255,0.26);
  box-shadow: 0 8px 24px rgba(0,0,0,0.28), 0 1px 0 rgba(127,212,255,0.08) inset;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6'%3E%3Cpath fill='rgba(207,233,255,0.85)' d='M5 6 .4.8 1.6 0 5 3.5 8.4 0 9.6.8z'/%3E%3C/svg%3E");
}
.theme-select:focus { outline: none; border-color: rgba(127,212,255,0.54); box-shadow: 0 8px 24px rgba(0,0,0,0.28), 0 0 0 1px rgba(127,212,255,0.24); }
/* Modal must be near-solid so text stays legible over the blurred app behind it */
.queue-modal-panel.ui-panel {
  background: linear-gradient(180deg, rgba(11,47,107,0.985), rgba(7,28,64,0.99)); border-color: rgba(127,212,255,0.32);
  box-shadow: 0 24px 70px rgba(0,0,0,0.65), 0 3px 12px rgba(0,0,0,0.45), 0 1px 0 rgba(127,212,255,0.06) inset;
}
```

## themes/cyanotype-blueprint/theme.js

```js
// Cyanotype Blueprint — schematic overlay drawn over the default record.
// Hairline cyan vector ink only: radial dimension lines + arrowheads + numeric
// callouts, a corner title block, a spindle crosshair, and (while playing) a
// radar sweep-line that rotates WITH the disc. The technical layer is held
// STILL (upright); only the sweep rotates. Everything is drawn in CSS px —
// ctx is already DPR-scaled — so never multiply by devicePixelRatio here.
window.MYNYL_THEME_MODULES = window.MYNYL_THEME_MODULES || {};

(function () {
  "use strict";

  const INK = "rgba(127,212,255,0.85)";   // primary hairline cyan
  const INK_SOFT = "rgba(127,212,255,0.45)";
  const INK_FAINT = "rgba(127,212,255,0.26)";
  const AMBER = "rgba(255,179,71,0.85)";  // sparing callout accent
  const WHITE = "rgba(234,244,255,0.92)";

  // ── persistent state advanced by performance.now() deltas ──
  // `sweepCharge` blooms toward 1 on loud passages and decays back to a low
  // idle floor; this keeps the radar sweep from flickering 1:1 with raw audio.
  let sweepCharge = 0;
  let lastT = performance.now();

  // Stable per-frame smoothing of groovePulse into sweepCharge.
  function advanceCharge(target) {
    const now = performance.now();
    let dt = (now - lastT) / 1000;
    lastT = now;
    if (!(dt > 0) || dt > 0.1) dt = 0.016; // clamp tab-switch / first-frame spikes
    // Asymmetric attack (fast) / release (slow), framerate-independent.
    const rate = target > sweepCharge ? 9 : 2.5;
    const k = 1 - Math.exp(-rate * dt);
    sweepCharge += (target - sweepCharge) * k;
    return sweepCharge;
  }

  // Draw a tiny filled arrowhead at point (x,y) pointing along `dir` radians.
  function arrowhead(ctx, x, y, dir, size, color) {
    const a1 = dir + Math.PI * 0.85;
    const a2 = dir - Math.PI * 0.85;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a1) * size, y + Math.sin(a1) * size);
    ctx.lineTo(x + Math.cos(a2) * size, y + Math.sin(a2) * size);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  // One radial dimension line from radius r0 to r1 along screen-angle `ang`,
  // with arrowheads on both ends and a centered numeric label.
  function dimLine(ctx, ang, r0, r1, label, color, fontPx) {
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const x0 = ca * r0, y0 = sa * r0;
    const x1 = ca * r1, y1 = sa * r1;

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();

    const head = Math.max(4, fontPx * 0.55);
    arrowhead(ctx, x0, y0, ang, head, color);          // points outward at r0
    arrowhead(ctx, x1, y1, ang + Math.PI, head, color); // points inward at r1

    // Label box at the midpoint, drawn upright (counter-rotate not needed —
    // the whole overlay layer is already unrotated).
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    ctx.save();
    ctx.font = `400 ${fontPx}px 'Space Mono', monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const tw = ctx.measureText(label).width;
    const padX = fontPx * 0.4, padY = fontPx * 0.3;
    ctx.fillStyle = "rgba(7,34,79,0.85)"; // knock out grooves behind the text
    ctx.fillRect(mx - tw / 2 - padX, my - fontPx / 2 - padY, tw + padX * 2, fontPx + padY * 2);
    ctx.fillStyle = color;
    ctx.fillText(label, mx, my);
    ctx.restore();
  }

  // Small corner title block near the lower-left of the disc.
  function titleBlock(ctx, radius, fontPx) {
    const title = (window._trackTitle || "").trim();
    const artist = (window._trackArtist || "").trim();
    const hasMeta = !!title;

    const boxW = radius * 0.92;
    const boxH = radius * 0.30;
    const bx = -radius * 0.74;   // lower-left quadrant, inside the disc
    const by = radius * 0.50;

    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = INK;
    ctx.fillStyle = "rgba(7,34,79,0.82)";
    ctx.beginPath();
    ctx.rect(bx, by, boxW, boxH);
    ctx.fill();
    ctx.stroke();

    // header rule
    ctx.beginPath();
    ctx.moveTo(bx, by + boxH * 0.42);
    ctx.lineTo(bx + boxW, by + boxH * 0.42);
    ctx.strokeStyle = INK_SOFT;
    ctx.stroke();

    // vertical divider (drawing-no. column)
    ctx.beginPath();
    ctx.moveTo(bx + boxW * 0.7, by);
    ctx.lineTo(bx + boxW * 0.7, by + boxH);
    ctx.stroke();

    ctx.textBaseline = "middle";
    ctx.textAlign = "left";

    // small-caps feel: uppercase + slightly condensed
    const fieldFont = `700 ${fontPx * 0.78}px 'Space Mono', monospace`;
    const valueFont = `400 ${fontPx}px 'Space Mono', monospace`;

    ctx.font = fieldFont;
    ctx.fillStyle = INK_SOFT;
    ctx.fillText("TITLE", bx + boxW * 0.04, by + boxH * 0.21);

    ctx.font = valueFont;
    ctx.fillStyle = hasMeta ? WHITE : INK_SOFT;
    const titleStr = (hasMeta ? title : "NO DISC LOADED").toUpperCase();
    ctx.fillText(clip(ctx, titleStr, boxW * 0.62), bx + boxW * 0.04, by + boxH * 0.71);

    ctx.font = fieldFont;
    ctx.fillStyle = INK_SOFT;
    ctx.fillText("DWG", bx + boxW * 0.74, by + boxH * 0.21);
    ctx.fillStyle = INK;
    ctx.font = `400 ${fontPx * 0.85}px 'Space Mono', monospace`;
    ctx.fillText("LP-33", bx + boxW * 0.74, by + boxH * 0.71);

    // artist line spanning the value column
    if (hasMeta) {
      ctx.font = `400 ${fontPx * 0.82}px 'Space Mono', monospace`;
      ctx.fillStyle = INK_SOFT;
      ctx.fillText(clip(ctx, ("ARTIST  " + artist).toUpperCase(), boxW * 0.62), bx + boxW * 0.04, by + boxH * 0.92);
    }
    ctx.restore();
  }

  // Trim a string to fit `maxW` px, appending an ellipsis if clipped.
  function clip(ctx, str, maxW) {
    if (ctx.measureText(str).width <= maxW) return str;
    let s = str;
    while (s.length > 1 && ctx.measureText(s + "…").width > maxW) s = s.slice(0, -1);
    return s + "…";
  }

  window.MYNYL_THEME_MODULES["cyanotype-blueprint"] = {
    drawRecord(o) {
      const { angle, record, ctx, state, defaults } = o;
      // 1) Paint the base disc + grooves + label FIRST.
      defaults.drawRecord(angle);

      const { cx, cy, radius } = record;
      const playing = !!(state && state.playing);
      const groovePulse = Math.max(0, Math.min(1,
        state && typeof state.groovePulse === "number" ? state.groovePulse : 0));

      // Advance smoothed sweep charge every frame (decays toward a quiet floor).
      const charge = advanceCharge(playing ? Math.max(0.12, groovePulse) : 0);

      const fontPx = Math.max(7, radius * 0.05);

      // ── STATIONARY technical layer (no rotate) ──
      ctx.save();
      ctx.translate(cx, cy);
      // Clip everything to just inside the disc edge.
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.985, 0, Math.PI * 2);
      ctx.clip();

      // Highlighted groove ring at ~0.9R, thickened by audio.
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.90, 0, Math.PI * 2);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1 + groovePulse * 2.4;
      ctx.stroke();

      // r=0.30R boundary ring (label-clearance reference).
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.30, 0, Math.PI * 2);
      ctx.strokeStyle = INK_FAINT;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Radial dimension lines + numeric callouts (upright text).
      // Diameter callout across the top: from rim to rim is implied; we draw the
      // outer radial leg and label the full diameter "⌀304".
      dimLine(ctx, -Math.PI / 2, radius * 0.30, radius * 0.90, "\u2300304", INK, fontPx);
      // r=0.30R callout on the right.
      dimLine(ctx, 0, radius * 0.30, radius * 0.62, "r=0.30R", INK_SOFT, fontPx * 0.9);
      // 33 1/3 RPM callout lower-right, in sparing amber.
      dimLine(ctx, Math.PI * 0.28, radius * 0.62, radius * 0.90, "33\u2153 RPM", AMBER, fontPx * 0.9);

      // Spindle crosshair (+) at the very center, on top of the hole.
      const ch = radius * 0.06;
      ctx.beginPath();
      ctx.moveTo(-ch, 0); ctx.lineTo(ch, 0);
      ctx.moveTo(0, -ch); ctx.lineTo(0, ch);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Corner title block (lower-left), with track metadata or fallback.
      titleBlock(ctx, radius, fontPx);

      // ── Radar sweep — rotates WITH the disc, only while playing ──
      if (playing) {
        ctx.save();
        ctx.rotate(angle); // spin WITH the disc
        const bloom = 0.4 + charge * 0.6;

        // Faint trailing wedge behind the sweep line.
        const wedge = 0.32 + charge * 0.25; // radians of trail
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius * 0.90, -wedge, 0);
        ctx.closePath();
        ctx.fillStyle = `rgba(127,212,255,${0.06 + charge * 0.10})`;
        ctx.fill();

        // The sweep line itself, from center to rim, with a soft cyan bloom.
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(radius * 0.90, 0);
        ctx.strokeStyle = `rgba(127,212,255,${0.55 + charge * 0.4})`;
        ctx.lineWidth = 1 + charge * 1.5;
        ctx.shadowBlur = (4 + charge * 14);
        ctx.shadowColor = "rgba(127,212,255,0.9)";
        ctx.stroke();
        ctx.restore();
        void bloom;
      }

      ctx.restore();

      // ALWAYS reset glow/composite before returning.
      ctx.shadowBlur = 0;
      ctx.shadowColor = "rgba(0,0,0,0)";
      ctx.globalCompositeOperation = "source-over";
    }
  };
})();
```

## Register in js/themes.js

Add this object to the `MYNYL_THEME_REGISTRY` array, after the last real entry and **before** the trailing commented placeholder line:

```js
  { name: 'Cyanotype Blueprint', path: 'themes/cyanotype-blueprint' },
```

So the array becomes:

```js
window.MYNYL_THEME_REGISTRY = [
  { name: 'Wood', path: 'themes/wood', default: true },
  { name: 'Minimal Light', path: 'themes/minimal-light' },
  { name: 'Disco Pop', path: 'themes/disco-pop' },
  { name: 'Risograph', path: 'themes/risograph' },
  { name: 'Outrun Grid', path: 'themes/outrun-grid' },
  { name: 'Cyanotype Blueprint', path: 'themes/cyanotype-blueprint' },
];

// { name: '', path: 'themes/' },
```

The engine loads `themes/<path>/theme.js` automatically (the folder id `cyanotype-blueprint` matches the registry path's last segment and the `MYNYL_THEME_MODULES` key), so no extra wiring is needed.

## Build & test checklist

1. Create the folder `themes/cyanotype-blueprint/` and add all six files above (`theme.css`, `background.css`, `vinyl.css`, `arm.css`, `ui.css`, `theme.js`).
2. Add the registry entry to `js/themes.js` as shown.
3. Open `index.html` directly in a browser (no build step needed).
4. In the bottom-right `#theme-select` dropdown, pick **"Cyanotype Blueprint"**. Confirm the whole UI turns Prussian-blue with cyan keylines and the disc becomes a blueprint with cyan drafting-circle grooves. The selection persists via `localStorage` across reloads.
5. With **no file loaded**: confirm the title block reads `NO DISC LOADED`, the spindle crosshair and dimension callouts render, the `load a record` drop hint pulses, and there is **no** radar sweep (sweep only runs while playing).
6. Load a track named `Title - Artist.mp3` (drag-and-drop or the upload button). Confirm the title block now shows the uppercased title and `ARTIST …` line, and album art (if embedded) is clipped to the label circle.
7. Drag the tonearm onto the disc, or press the play button / spacebar. After the 2s crackle the disc spins, music fades in, and the cyan radar sweep-line appears rotating with the disc with a faint trailing wedge.
8. Open DevTools console: confirm **no errors or warnings** from `theme.js` during idle, spin-up, playback, and song-end.
9. Confirm the overlay correctly clears / does not smear: the dimension-line label boxes knock out the grooves behind them, the centre label stays clean, and nothing trails between frames.
10. Resize the window small and large: confirm all text stays readable (font scales with `radius`), callouts and title block stay inside the disc, and geometry recomputes with no hardcoded pixels.
11. Watch the frame rate (DevTools Performance / Rendering FPS meter): confirm smooth ~60fps with audio playing. The only `shadowBlur` in the hot loop is the single sweep line, so cost stays low.

### Theme-specific gotchas

- **Coordinate space is CSS px** — `ctx` is already scaled to `devicePixelRatio` by the engine. Never multiply by DPR. Use `record.cx/cy` (the center of the padded record canvas) as origin via `ctx.translate(cx, cy)`.
- **Angle units differ**: `drawRecord` receives `angle` in **radians**; `drawArm` would receive it in **degrees** (convert with `helpers.toRad`). This theme only overrides `drawRecord`, so the default tonearm renderer draws the straight blueprint arm from `arm.css`.
- **Hold the technical layer still**: do **not** call `ctx.rotate(angle)` for the dimension lines, callouts, title block, or crosshair — they must read upright. Only the radar sweep is wrapped in its own `ctx.save()/ctx.rotate(angle)/ctx.restore()`.
- **Always reset glow/composite before returning**: this file sets `shadowBlur` on the sweep, so it resets `ctx.shadowBlur = 0`, `ctx.shadowColor`, and `ctx.globalCompositeOperation = "source-over"` at the very end. Forgetting this bleeds glow into the default renderer next frame.
- **Keep overlays at r > radius*0.30** to clear the centre label, except the spindle crosshair, which is intentionally drawn on the spindle.
- **Clip to the disc**: the overlay clips to `radius*0.985` so callout label boxes and the sweep wedge never spill past the disc edge.
- **Persistent state lives in closure scope** (`sweepCharge`, `lastT`) and is advanced by `performance.now()` deltas with a clamp for tab-switch spikes — never accumulate per-frame `Math.random()` for positions.
- **`--vinyl-warp: 0`** gives perfectly concentric grooves; the engine still applies a tiny per-groove pulse on audio, which is intended (the highlighted 0.9R ring in the overlay reinforces the beat).
- **Perf**: `shadowBlur` is the main cost. Only the sweep line uses it (one stroke). Keep it that way if you extend the overlay — the dimension lines and title block use plain 1px strokes/fills.
