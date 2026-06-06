window.MYNYL_THEME_MODULES = window.MYNYL_THEME_MODULES || {};

// ─── Candle & Brass ─────────────────────────────────────────
// One guttering candle lighting a heavy bronze record in a dark room.
//
//  • drawRecord: paints the base disc, then adds a procedural bronze-METAL
//    read — a warm body tint, a darker heavy rim, and an anisotropic
//    "brushed metal" reflection that rotates with the disc — followed by
//    soft firelight glow pools that WANDER randomly across the disc face
//    (gutter + roam), a brass glint arc that faces the light, and a couple
//    of embers near the flame.
//  • drawBackground: paints the base ember radial, then a big flickering
//    candle glow and a FULL-SCREEN field of flickering ember dots rising
//    across the whole viewport.
//
// Metal is done procedurally (canvas gradients) — no downloaded textures,
// keeping the theme resolution-independent and dependency-free.
//
// ctx is already DPR-scaled — draw in CSS px, never multiply by DPR.
// In drawRecord, `angle` is the disc rotation in RADIANS.
(function () {
  // Layered-sine flicker (~0.4..1.0). Incommensurate octaves so it never
  // visibly loops. Time-based, NOT spin-locked → reads like a real flame.
  function flicker(t) {
    return 0.70
      + 0.18 * Math.sin(11.0 * t)
      + 0.10 * Math.sin(6.3 * t + 1.7)
      + 0.06 * Math.sin(19.0 * t);
  }

  function clamp01(v) { return Math.max(0, Math.min(1, v)); }

  // ── disc-overlay state (closure scope, survives frames) ──
  const DISC_EMBERS = 3;
  const discEmbers = [];
  let discLastT = performance.now() / 1000;
  let discSeeded = false;

  function seedDiscEmbers(radius) {
    discEmbers.length = 0;
    for (let i = 0; i < DISC_EMBERS; i++) {
      const s = Math.sin(i * 12.9898) * 43758.5453;
      const frac = s - Math.floor(s);
      discEmbers.push({
        x: 0, y: 0,
        vy: -radius * (0.05 + 0.05 * frac),
        vx: radius * (0.012 * (frac - 0.5)),
        life: frac,
        speed: 0.35 + 0.25 * frac
      });
    }
    discSeeded = true;
  }

  // ── background full-screen ember field ──
  const BG_EMBERS = 24;
  let bgEmbers = null;
  let bgLastT = performance.now() / 1000;

  function seedBgEmbers() {
    bgEmbers = [];
    for (let i = 0; i < BG_EMBERS; i++) {
      bgEmbers.push({
        xFrac: Math.random(),
        yFrac: Math.random(),                 // start anywhere on first paint
        spdFrac: 0.02 + Math.random() * 0.06, // height-fractions / sec, upward
        swayAmp: Math.random() * 0.03,
        swayFreq: 0.3 + Math.random() * 0.8,
        swayPhase: Math.random() * Math.PI * 2,
        twPhase: Math.random() * Math.PI * 2,
        twFreq: 2 + Math.random() * 4,
        sizeFrac: 0.0015 + Math.random() * 0.0035
      });
    }
  }

  // ════════════════════════════════════════════════════════════
  //  RECORD — bronze metal + wandering firelight
  // ════════════════════════════════════════════════════════════
  function drawRecord({ angle, record, ctx, state, defaults }) {
    // base disc (grooves, gloss, label) first — we only ADD on top.
    if (defaults && typeof defaults.drawRecord === "function") defaults.drawRecord(angle);

    const { cx, cy, radius } = record;
    const now = performance.now() / 1000;
    const dt = Math.min(0.05, Math.max(0, now - discLastT));
    discLastT = now;
    if (!discSeeded) seedDiscEmbers(radius);

    const playing = !!(state && state.playing);
    const pulse = clamp01(state && typeof state.groovePulse === "number" ? state.groovePulse : 0);
    const flame = flicker(now);
    const intensity = Math.max(0, Math.min(1.15, flame * (playing ? 0.85 : 0.62) + pulse * 0.35));

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.985, 0, Math.PI * 2);
    ctx.clip();
    ctx.translate(cx, cy);

    // ── 1. bronze metal body tint + heavy dark rim ──
    ctx.globalCompositeOperation = "source-over";
    const body = ctx.createRadialGradient(0, 0, radius * 0.12, 0, 0, radius);
    body.addColorStop(0.00, "rgba(120,80,35,0.10)");
    body.addColorStop(0.55, "rgba(70,44,18,0.07)");
    body.addColorStop(1.00, "rgba(12,7,3,0.26)");   // heavy weight at the edge
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.985, 0, Math.PI * 2);
    ctx.fill();

    // ── 2. anisotropic brushed-metal reflection (rotates with the disc) ──
    ctx.globalCompositeOperation = "lighter";
    const reflA = (0.07 + intensity * 0.07).toFixed(3);
    const base = "rgba(255,205,130,";
    ctx.save();
    ctx.rotate(angle);
    if (typeof ctx.createConicGradient === "function") {
      const conic = ctx.createConicGradient(0, 0, 0);
      const peaks = [0.10, 0.46, 0.80];           // irregular lobes = machined metal
      conic.addColorStop(0, base + "0)");
      for (const p of peaks) {
        conic.addColorStop(Math.max(0.001, p - 0.07), base + "0)");
        conic.addColorStop(p, base + reflA + ")");
        conic.addColorStop(Math.min(0.999, p + 0.07), base + "0)");
      }
      conic.addColorStop(1, base + "0)");
      ctx.fillStyle = conic;
    } else {
      // fallback: a soft bronze radial sheen if conic gradients are absent
      const fb = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, 0, -radius * 0.3, -radius * 0.3, radius);
      fb.addColorStop(0, base + reflA + ")");
      fb.addColorStop(0.5, base + "0)");
      ctx.fillStyle = fb;
    }
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.985, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // ── 3. wandering firelight glow pools (roam across the disc) ──
    const wanderR = radius * 0.5;
    function wander(seed) {
      const wx = Math.sin(now * 0.37 + seed) * 0.6 + Math.sin(now * 0.17 + seed * 1.7) * 0.4;
      const wy = Math.cos(now * 0.31 + seed * 1.3) * 0.6 + Math.sin(now * 0.23 + seed) * 0.4;
      return [wx * wanderR, wy * wanderR];
    }

    const [px1, py1] = wander(0.0);
    const pool1R = radius * (0.55 + 0.06 * Math.sin(9.0 * now));
    const peak1 = (0.30 * intensity).toFixed(3);
    const g1 = ctx.createRadialGradient(px1, py1, 0, px1, py1, pool1R);
    g1.addColorStop(0.0, "rgba(255,210,130," + peak1 + ")");
    g1.addColorStop(0.35, "rgba(255,180,90," + (0.30 * intensity * 0.55).toFixed(3) + ")");
    g1.addColorStop(0.7, "rgba(190,110,45," + (0.30 * intensity * 0.18).toFixed(3) + ")");
    g1.addColorStop(1.0, "rgba(120,60,20,0)");
    ctx.fillStyle = g1;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.985, 0, Math.PI * 2);
    ctx.fill();

    // a smaller secondary glow with its own flicker + wander
    const [px2, py2] = wander(3.3);
    const pool2R = radius * 0.34;
    const peak2 = (0.20 * intensity * (0.6 + 0.4 * flicker(now * 1.3 + 2.0))).toFixed(3);
    const g2 = ctx.createRadialGradient(px2, py2, 0, px2, py2, pool2R);
    g2.addColorStop(0.0, "rgba(255,200,120," + peak2 + ")");
    g2.addColorStop(0.6, "rgba(200,120,50," + (parseFloat(peak2) * 0.3).toFixed(3) + ")");
    g2.addColorStop(1.0, "rgba(120,60,20,0)");
    ctx.fillStyle = g2;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.985, 0, Math.PI * 2);
    ctx.fill();

    // ── 4. brass glint arc on the label ring, facing the main glow ──
    const ringR = radius * 0.175;
    const glowAng = Math.atan2(py1, px1);
    const glintA = Math.max(0, Math.min(0.9, 0.30 + intensity * 0.55 + pulse * 0.2));
    ctx.strokeStyle = "rgba(255,224,150," + glintA.toFixed(3) + ")";
    ctx.lineWidth = Math.max(1, radius * 0.006);
    ctx.shadowBlur = radius * 0.04;
    ctx.shadowColor = "rgba(255,190,90,0.7)";
    ctx.beginPath();
    ctx.arc(0, 0, ringR, glowAng - 0.55, glowAng + 0.55);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // ── 5. a few embers near the main (wandering) glow ──
    for (let i = 0; i < discEmbers.length; i++) {
      const e = discEmbers[i];
      e.life += dt * e.speed * (playing ? 1 : 0.3);
      if (e.life > 1) {
        e.life -= 1;
        e.x = px1 + radius * 0.04 * Math.sin(i * 7.1 + now);
        e.y = py1 + radius * 0.02;
      }
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      const fade = Math.sin(e.life * Math.PI);
      const ea = fade * (0.55 * intensity + pulse * 0.25) * (playing ? 1 : 0.4);
      if (ea <= 0.01) continue;
      const er = radius * (0.004 + 0.003 * fade);
      ctx.fillStyle = "rgba(255,196,110," + ea.toFixed(3) + ")";
      ctx.shadowBlur = radius * 0.02;
      ctx.shadowColor = "rgba(255,170,70,0.8)";
      ctx.beginPath();
      ctx.arc(e.x, e.y, er, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();
  }

  // ════════════════════════════════════════════════════════════
  //  BACKGROUND — candle glow + full-screen ember field
  // ════════════════════════════════════════════════════════════
  function drawBackground({ ts, ctx, width, height, state, defaults }) {
    // base ember radial gradient first
    if (defaults && typeof defaults.drawBackground === "function") defaults.drawBackground(ts);

    const w = width, h = height;
    const now = ts / 1000;
    let dt = now - bgLastT;
    bgLastT = now;
    if (!(dt > 0) || dt > 0.1) dt = 0.016;

    const pulse = clamp01(state && typeof state.groovePulse === "number" ? state.groovePulse : 0);
    const flame = flicker(now);

    // big flickering candle glow washing the scene from upper-centre
    const gx = w * (0.5 + 0.04 * Math.sin(now * 0.5));
    const gy = h * (0.40 + 0.03 * Math.sin(now * 0.37 + 1.0));
    const gr = Math.max(w, h) * 0.55;
    const ga = (0.10 * (0.55 + 0.45 * flame) + pulse * 0.07).toFixed(3);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
    glow.addColorStop(0.0, "rgba(255,180,90," + ga + ")");
    glow.addColorStop(0.4, "rgba(200,110,45," + (parseFloat(ga) * 0.5).toFixed(3) + ")");
    glow.addColorStop(1.0, "rgba(120,55,20,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    // full-screen ember field: flickering dots rising across the viewport
    if (!bgEmbers) seedBgEmbers();
    const minWH = Math.min(w, h);
    const riseBoost = 0.6 + 0.4 * flame + pulse * 0.5;
    for (const e of bgEmbers) {
      e.yFrac -= e.spdFrac * dt * riseBoost;
      if (e.yFrac < -0.05) {
        e.yFrac = 1.05;
        e.xFrac = Math.random();
      }
      const x = (e.xFrac + Math.sin(now * e.swayFreq + e.swayPhase) * e.swayAmp) * w;
      const y = e.yFrac * h;
      const tw = 0.5 + 0.5 * Math.sin(now * e.twFreq + e.twPhase); // twinkle 0..1
      const a = Math.min(0.9, tw * (0.45 * flame + 0.2) + pulse * 0.2);
      if (a <= 0.02) continue;
      const size = e.sizeFrac * minWH * (0.7 + 0.6 * tw);

      // soft halo + bright core (no shadowBlur — cheaper at this count)
      ctx.fillStyle = "rgba(255,150,60," + (a * 0.4).toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(x, y, size * 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,200,120," + a.toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = "source-over";
    ctx.restore();
  }

  window.MYNYL_THEME_MODULES["candle-brass"] = { drawRecord, drawBackground };
})();
