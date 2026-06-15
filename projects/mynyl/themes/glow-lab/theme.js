window.MYNYL_THEME_MODULES = window.MYNYL_THEME_MODULES || {};

(function () {
  "use strict";

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
  drawRecord({ angle, record, ctx, state, defaults }) {
    // 1) Paint the base disc + grooves + label first; we only overlay glow.
    defaults.drawRecord(angle);

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
})();
