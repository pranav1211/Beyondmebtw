window.MYNYL_THEME_MODULES = window.MYNYL_THEME_MODULES || {};

// ─── Outrun Grid ────────────────────────────────────────────
// Turns the record's concentric grooves into a perspective neon road:
//   • concentric "road lines" scroll outward (toward the viewer) with
//     depth-compressed spacing, so the spin reads as forward motion;
//   • radial spokes converge on the spindle as a vanishing point;
//   • a magenta "horizon" arc glows along the upper rim.
// Everything brightens with the audio level (state.groovePulse) and clips
// to the disc. The ctx is already DPR-scaled, so all units are CSS px.
window.MYNYL_THEME_MODULES["outrun-grid"] = {
  drawRecord({ angle, record, ctx, state, defaults }) {
    // Paint the base disc (grooves, sheen, gloss, label) first.
    defaults.drawRecord(angle);

    const { cx, cy, radius } = record;
    const playing = !!(state && state.playing);
    const pulse = Math.max(0, Math.min(1,
      state && typeof state.groovePulse === "number" ? state.groovePulse : 0));
    const now = performance.now() / 1000;
    const energy = (playing ? 0.6 : 0.32) + pulse * 0.5;

    const CYAN = "45,226,255";
    const MAGENTA = "255,45,149";
    const innerR = radius * 0.30;   // clears the centre label (radius * 0.18)
    const outerR = radius * 0.95;

    ctx.save();
    // Keep the whole road on the disc face.
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.985, 0, Math.PI * 2);
    ctx.clip();
    ctx.translate(cx, cy);
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";

    // ── concentric road lines: depth-compressed, scrolling outward ──
    const RINGS = 10;
    const scroll = (now * 0.22) % 1;
    for (let i = 0; i < RINGS; i++) {
      const t = (i + scroll) / RINGS;            // 0..1 (small = near spindle / far)
      const ease = t * t;                         // bunch lines toward the spindle
      const r = innerR + (outerR - innerR) * ease;
      const fade = Math.sin(t * Math.PI);         // fade in at centre, out at the rim
      const a = energy * 0.55 * fade;
      if (a <= 0.012) continue;
      const col = i % 2 === 0 ? CYAN : MAGENTA;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(" + col + "," + a + ")";
      ctx.lineWidth = Math.max(1, radius * 0.006 * (0.5 + t));
      ctx.shadowBlur = radius * 0.03;
      ctx.shadowColor = "rgba(" + col + ",0.6)";
      ctx.stroke();
    }

    // ── radial spokes converging on the spindle (slow spin with the disc) ──
    ctx.save();
    ctx.rotate(angle * 0.35);
    const SPOKES = 24;
    ctx.shadowBlur = radius * 0.02;
    for (let s = 0; s < SPOKES; s++) {
      const aa = (s / SPOKES) * Math.PI * 2;
      const ca = Math.cos(aa), sa = Math.sin(aa);
      const col = s % 2 === 0 ? CYAN : MAGENTA;
      const a = energy * 0.2;
      ctx.beginPath();
      ctx.moveTo(ca * innerR, sa * innerR);
      ctx.lineTo(ca * outerR, sa * outerR);
      ctx.strokeStyle = "rgba(" + col + "," + a + ")";
      ctx.lineWidth = Math.max(1, radius * 0.0035);
      ctx.shadowColor = "rgba(" + col + ",0.5)";
      ctx.stroke();
    }
    ctx.restore();

    // ── horizon glint along the upper rim ──
    ctx.beginPath();
    ctx.arc(0, 0, outerR, Math.PI * 1.16, Math.PI * 1.84);
    ctx.strokeStyle = "rgba(" + MAGENTA + "," + (0.22 + pulse * 0.4) + ")";
    ctx.lineWidth = radius * 0.018;
    ctx.shadowBlur = radius * 0.06;
    ctx.shadowColor = "rgba(" + MAGENTA + ",0.7)";
    ctx.stroke();

    ctx.restore();
  }
};
