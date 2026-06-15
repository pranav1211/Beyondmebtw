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
      dimLine(ctx, -Math.PI / 2, radius * 0.30, radius * 0.90, "⌀304", INK, fontPx);
      // r=0.30R callout on the right.
      dimLine(ctx, 0, radius * 0.30, radius * 0.62, "r=0.30R", INK_SOFT, fontPx * 0.9);
      // 33 1/3 RPM callout lower-right, in sparing amber.
      dimLine(ctx, Math.PI * 0.28, radius * 0.62, radius * 0.90, "33⅓ RPM", AMBER, fontPx * 0.9);

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
