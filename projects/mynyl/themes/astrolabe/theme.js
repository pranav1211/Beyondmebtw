(function () {
  "use strict";

  window.MYNYL_THEME_MODULES = window.MYNYL_THEME_MODULES || {};

  /* =====================================================================
   * ASTROLABE theme renderer
   *  - drawRecord: celestial chart overlay on the spinning disc, now with
   *    more audio "sounders" (sound rings, star blooms, ecliptic glow,
   *    beat spokes) and a heavier 3D dome look (light dome + rim vignette,
   *    depth-parallax star field, subtle elliptical tilt).
   *  - drawBackground: cymatics / Chladni-plate "sand on a vibrating plate"
   *    standing-wave simulation, driven by audio energy.
   *
   * Everything lives in this IIFE so no top-level let/const leaks into the
   * shared classic-script global scope (other themes also declare STARS etc).
   * ===================================================================== */

  /* ---------------------------------------------------------------------
   * Shared persistent state for the RECORD overlay (survives across frames)
   * ------------------------------------------------------------------- */
  // Smoothed audio level so blooms ease in/out instead of jittering frame-to-frame.
  let _smoothPulse = 0;
  // Shooting-star "charge": rises on a loud groove peak, then decays. While >0 a
  // streak is visible; its phase 0..1 drives where the streak sits along its arc.
  let _shootCharge = 0;   // 0..1 visibility/intensity
  let _shootPhase = 0;    // 0..1 progress of the streak across the disc
  let _shootAngle = 0;    // base orientation (radians) chosen when a streak fires
  let _lastT = 0;         // performance.now() ms of previous frame, for dt
  let _prevPulse = 0;     // previous smoothed level, to detect a rising edge (peak)

  // Free-running clock for parallax wobble + ring phase, advanced by real dt so a
  // backgrounded tab doesn't lurch.
  let _clock = 0;

  // Expanding "sound rings": each is a ripple spawned on a beat that grows from
  // the label outward and fades. Pooled so we never allocate in the hot loop.
  const RING_MAX = 6;
  const _rings = [];
  for (let i = 0; i < RING_MAX; i++) _rings.push({ active: false, t: 0 });
  let _ringCooldown = 0;  // seconds until another ring may spawn

  // 40 stars, positions/brightness seeded deterministically from the index so the
  // chart is stable every frame (no per-frame Math.random for positions). Polar:
  // rT = normalized radius in [0.26, 0.92], a = angle. Built once, reused forever.
  // `depth` (0..1) groups stars into parallax layers for the float-above effect.
  const STAR_COUNT = 40;
  const STARS = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    // Decorrelated hashes from the index via sin*large + fract.
    const h1 = Math.sin(i * 12.9898) * 43758.5453;
    const h2 = Math.sin(i * 78.233) * 12543.213;
    const h3 = Math.sin(i * 39.425) * 24634.634;
    const h4 = Math.sin(i * 95.137) * 51237.913;
    const f1 = h1 - Math.floor(h1);
    const f2 = h2 - Math.floor(h2);
    const f3 = h3 - Math.floor(h3);
    const f4 = h4 - Math.floor(h4);
    STARS.push({
      a: f1 * Math.PI * 2,            // angle around the disc
      rT: 0.26 + f2 * 0.66,           // radius band 0.26..0.92
      base: 0.45 + f3 * 0.55,         // base brightness 0.45..1
      tw: 1.2 + f1 * 3.5,             // twinkle speed
      phase: f2 * Math.PI * 2,        // twinkle phase offset
      big: f3 > 0.72,                 // brightest stars (bloom + constellation nodes)
      depth: 0.35 + f4 * 0.65,        // parallax depth: higher = floats more
      wobA: f4 * Math.PI * 2          // per-star wobble phase
    });
  }

  // Constellation figures: a few short chains drawn between specific star indices.
  // Kept as polylines so they read as engraved zodiac lines (2-3 small figures).
  const CONSTELLATIONS = [
    [2, 7, 13, 19, 24],
    [4, 9, 16, 22],
    [11, 17, 28, 33, 37]
  ];

  /* ---------------------------------------------------------------------
   * Persistent state for the cymatics BACKGROUND
   * ------------------------------------------------------------------- */
  const GRAIN_COUNT = 1100;       // sand grains; tuned for ~60fps
  let _grains = null;             // Float arrays of grain positions, lazily seeded
  let _plateKey = "";            // remembers the plate size we seeded for (reseed on resize)
  let _bgLastT = 0;              // previous ts for dt
  let _bgVib = 0.05;            // smoothed vibration amount
  let _bgN = 3;                 // smoothed mode number n (kept fractional, floored when used)
  let _bgM = 2;                 // smoothed mode number m
  let _bgColorMix = 0;         // 0 = calm gold sand, 1 = energetic cool starlight
  let _bgClock = 0;            // free-running seconds for slow mode evolution

  // tiny deterministic hash -> [0,1), used only to SEED initial grain positions
  function _hash(i) {
    const h = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return h - Math.floor(h);
  }

  function _seedGrains(plate) {
    const xs = new Float32Array(GRAIN_COUNT);
    const ys = new Float32Array(GRAIN_COUNT);
    for (let i = 0; i < GRAIN_COUNT; i++) {
      xs[i] = plate.x0 + _hash(i * 2 + 1) * plate.size;
      ys[i] = plate.y0 + _hash(i * 2 + 2) * plate.size;
    }
    _grains = { xs: xs, ys: ys };
  }

  // Chladni standing-wave amplitude over normalized plate coords u,v in [-1,1].
  function _chladni(u, v, n, m) {
    return Math.cos(n * Math.PI * u) * Math.cos(m * Math.PI * v) -
           Math.cos(m * Math.PI * u) * Math.cos(n * Math.PI * v);
  }

  function _lerp(a, b, t) { return a + (b - a) * t; }
  function _clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }

  window.MYNYL_THEME_MODULES["astrolabe"] = {

    /* ===================================================================
     * RECORD overlay
     * =================================================================== */
    drawRecord({ angle, record, ctx, state, defaults }) {
      defaults.drawRecord(angle);              // paint base disc + grooves + label FIRST

      const { cx, cy, radius } = record;
      const playing = !!(state && state.playing);
      const rawPulse = Math.max(0, Math.min(1,
        state && typeof state.groovePulse === "number" ? state.groovePulse : 0));

      // ---- advance time-based state with a real dt (ms) ----
      const tMs = performance.now();
      let dtMs = _lastT ? (tMs - _lastT) : 16;
      _lastT = tMs;
      if (dtMs > 100) dtMs = 100;               // clamp after tab-switch stalls
      const dt = dtMs / 1000;
      _clock += dt;
      const now = tMs / 1000;

      // Smooth the audio level (attack faster than release for snappy blooms).
      const target = rawPulse;
      const k = target > _smoothPulse ? 0.25 : 0.06;
      _smoothPulse += (target - _smoothPulse) * k;
      const pulse = _smoothPulse;

      // Rising edge detection (a beat peak).
      const rising = pulse - _prevPulse;
      _prevPulse = pulse;
      const beat = playing && rising > 0.07 && pulse > 0.30;

      // Fire a shooting star on a strong rising peak while playing.
      if (playing && _shootCharge <= 0.01 && rising > 0.10 && pulse > 0.45) {
        _shootCharge = 1;
        _shootPhase = 0;
        _shootAngle = (now * 1.7) % (Math.PI * 2);
      }
      if (_shootCharge > 0) {
        _shootPhase = Math.min(1, _shootPhase + dt / 0.7);  // ~0.7s to cross
        _shootCharge = Math.max(0, _shootCharge - dt / 0.9);
        if (_shootPhase >= 1) _shootCharge = 0;
      }

      // ---- spawn / advance expanding sound rings on the beat ----
      _ringCooldown = Math.max(0, _ringCooldown - dt);
      if (beat && _ringCooldown <= 0) {
        const slot = _rings.find(function (r) { return !r.active; });
        if (slot) { slot.active = true; slot.t = 0; _ringCooldown = 0.12; }
      }
      for (let i = 0; i < _rings.length; i++) {
        const r = _rings[i];
        if (!r.active) continue;
        r.t += dt / 1.1;                        // ~1.1s lifetime
        if (r.t >= 1) r.active = false;
      }

      const TWO_PI = Math.PI * 2;
      const toXY = (a, rr) => [Math.cos(a) * rr, Math.sin(a) * rr];

      ctx.save();
      ctx.translate(cx, cy);

      // ---------- 3D dome shading (drawn UN-rotated, before the chart) ----------
      // A soft warm/white highlight from the upper-left + a darkening indigo
      // vignette toward the rim makes the flat disc read as a domed sphere.
      // Palette-only: cool indigo shadow, soft warm highlight. NEVER a white
      // moving reflection band (sheen stays off).
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.985, 0, TWO_PI);
      ctx.clip();
      // Highlight lobe from upper-left.
      const hlR = radius * 0.95;
      const hlx = -radius * 0.34, hly = -radius * 0.34;
      const dome = ctx.createRadialGradient(hlx, hly, radius * 0.04, hlx, hly, hlR);
      dome.addColorStop(0.0, "rgba(255,246,222,0.16)");
      dome.addColorStop(0.32, "rgba(208,212,255,0.06)");
      dome.addColorStop(1.0, "rgba(208,212,255,0)");
      ctx.fillStyle = dome;
      ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
      // Rim vignette: dark indigo gathering toward the edge for curvature.
      const vig = ctx.createRadialGradient(0, 0, radius * 0.45, 0, 0, radius * 0.99);
      vig.addColorStop(0.0, "rgba(4,8,26,0)");
      vig.addColorStop(0.78, "rgba(4,8,26,0.10)");
      vig.addColorStop(1.0, "rgba(2,4,16,0.55)");
      ctx.fillStyle = vig;
      ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
      ctx.restore();

      // The celestial chart wheels WITH the disc, and is tilted slightly in Y to
      // suggest the disc is angled in space (the dome above is left circular).
      ctx.rotate(angle);
      ctx.scale(1, 0.965);

      // Clip everything to the disc face so art never spills over the edge.
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.985, 0, TWO_PI);
      ctx.clip();

      // ---------- ecliptic band near the rim (labelled, 12 tick divisions) ----------
      // Audio-reactive glow: the ring brightens and blooms on loud passages.
      const eclR = radius * 0.885;
      const eclGlow = pulse;
      ctx.lineWidth = Math.max(1, radius * 0.004) * (1 + eclGlow * 0.6);
      ctx.strokeStyle = `rgba(217,178,90,${0.34 + eclGlow * 0.4})`;
      if (eclGlow > 0.02) {
        ctx.shadowBlur = radius * (0.01 + eclGlow * 0.05);
        ctx.shadowColor = `rgba(217,178,90,${0.5 * eclGlow})`;
      }
      ctx.beginPath();
      ctx.arc(0, 0, eclR, 0, TWO_PI);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(0, 0, eclR - radius * 0.03, 0, TWO_PI);
      ctx.strokeStyle = `rgba(217,178,90,${0.18 + eclGlow * 0.22})`;
      ctx.stroke();
      // 12 ticks (zodiac houses) between the two ecliptic rings.
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TWO_PI;
        const [x1, y1] = toXY(a, eclR);
        const [x2, y2] = toXY(a, eclR - radius * 0.03);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = `rgba(217,178,90,${0.40 + eclGlow * 0.3})`;
        ctx.lineWidth = Math.max(1, radius * 0.0035);
        ctx.stroke();
      }

      // ---------- beat spokes: faint radial flashes synced to the beat ----------
      // 6 spokes flash from the ecliptic inward, brightest right after a beat.
      const spokeI = pulse * (beat ? 1 : 0.6);
      if (spokeI > 0.03) {
        ctx.globalCompositeOperation = "lighter";
        ctx.lineCap = "round";
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * TWO_PI + _clock * 0.15;  // slow drift
          const [x1, y1] = toXY(a, radius * 0.30);
          const [x2, y2] = toXY(a, eclR - radius * 0.02);
          const g = ctx.createLinearGradient(x1, y1, x2, y2);
          g.addColorStop(0, "rgba(159,176,255,0)");
          g.addColorStop(1, `rgba(159,176,255,${0.22 * spokeI})`);
          ctx.strokeStyle = g;
          ctx.lineWidth = Math.max(1, radius * 0.004);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        ctx.globalCompositeOperation = "source-over";
      }

      // ---------- expanding sound rings (sounders) ----------
      if (_rings.some(function (r) { return r.active; })) {
        ctx.globalCompositeOperation = "lighter";
        for (let i = 0; i < _rings.length; i++) {
          const r = _rings[i];
          if (!r.active) continue;
          const rr = radius * (0.21 + r.t * 0.74);       // grow label->rim
          const a = (1 - r.t) * 0.5;                      // fade out
          ctx.beginPath();
          ctx.arc(0, 0, rr, 0, TWO_PI);
          ctx.strokeStyle = `rgba(159,176,255,${0.32 * a})`;
          ctx.lineWidth = Math.max(1, radius * 0.005 * (1 - r.t * 0.5));
          ctx.stroke();
        }
        ctx.globalCompositeOperation = "source-over";
      }

      // ---------- constellation lines (engraved gold) ----------
      // Parallax offset applied per star below; constellations use the same
      // displaced positions so the figures float coherently.
      const wob = playing ? (0.012 + pulse * 0.02) : 0.006;  // wobble magnitude (× radius)
      const starPos = new Array(STAR_COUNT);
      for (let i = 0; i < STAR_COUNT; i++) {
        const s = STARS[i];
        // Depth parallax: deeper stars get a larger slow circular offset, giving
        // the chart a floating-above-the-disc feel.
        const ox = Math.cos(_clock * 0.6 + s.wobA) * wob * radius * s.depth;
        const oy = Math.sin(_clock * 0.5 + s.wobA) * wob * radius * s.depth;
        const bx = Math.cos(s.a) * s.rT * radius + ox;
        const by = Math.sin(s.a) * s.rT * radius + oy;
        starPos[i] = [bx, by];
      }

      ctx.strokeStyle = "rgba(217,178,90,0.30)";
      ctx.lineWidth = Math.max(0.8, radius * 0.0028);
      ctx.lineCap = "round";
      for (let c = 0; c < CONSTELLATIONS.length; c++) {
        const chain = CONSTELLATIONS[c];
        ctx.beginPath();
        for (let n = 0; n < chain.length; n++) {
          const p = starPos[chain[n]];
          if (n === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]);
        }
        ctx.stroke();
      }

      // ---------- star field (with audio blooms) ----------
      const bloom = pulse;                      // brightest stars bloom with audio
      for (let i = 0; i < STAR_COUNT; i++) {
        const s = STARS[i];
        const p = starPos[i];
        // Twinkle only while playing; settle to steady brightness when idle.
        const tw = playing
          ? 0.78 + 0.22 * Math.sin(now * s.tw + s.phase)
          : 1;
        let bright = s.base * tw;
        if (s.big) bright = Math.min(1, bright + bloom * 0.75);
        const size = radius * (s.big ? 0.012 : 0.006) * (0.85 + bright * 0.6);

        ctx.beginPath();
        ctx.arc(p[0], p[1], size, 0, TWO_PI);
        ctx.fillStyle = `rgba(234,240,255,${0.35 + bright * 0.6})`;
        if (s.big) {
          // additive bloom for the bright nodes, stronger on the beat
          ctx.shadowBlur = radius * (0.02 + bloom * 0.07);
          ctx.shadowColor = "rgba(159,176,255,0.75)";
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // ---------- shooting-star streak on a groove peak ----------
      if (_shootCharge > 0.01) {
        const span = radius * 1.7;
        const startR = radius * 0.92;
        const a0 = _shootAngle;
        const headT = _shootPhase;
        const headX = Math.cos(a0) * startR + Math.cos(a0 + 2.3) * span * headT;
        const headY = Math.sin(a0) * startR + Math.sin(a0 + 2.3) * span * headT;
        const tailT = Math.max(0, headT - 0.18);
        const tailX = Math.cos(a0) * startR + Math.cos(a0 + 2.3) * span * tailT;
        const tailY = Math.sin(a0) * startR + Math.sin(a0 + 2.3) * span * tailT;
        const a = _shootCharge * (1 - Math.abs(headT - 0.5) * 0.6);

        ctx.globalCompositeOperation = "lighter";
        const grad = ctx.createLinearGradient(tailX, tailY, headX, headY);
        grad.addColorStop(0, "rgba(217,178,90,0)");
        grad.addColorStop(1, `rgba(234,240,255,${0.85 * a})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = Math.max(1.2, radius * 0.006);
        ctx.lineCap = "round";
        ctx.shadowBlur = radius * 0.03;
        ctx.shadowColor = `rgba(159,176,255,${0.6 * a})`;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(headX, headY);
        ctx.stroke();
        // bright head
        ctx.beginPath();
        ctx.arc(headX, headY, radius * 0.01, 0, TWO_PI);
        ctx.fillStyle = `rgba(234,240,255,${a})`;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalCompositeOperation = "source-over";
      }

      ctx.restore();  // release disc clip

      // ---------- engraved compass-rose just outside the label ----------
      // Label ends at radius*labelRadius (~0.175); draw the rose ring from ~0.20.
      const roseInner = radius * 0.205;
      const roseOuter = radius * 0.255;
      ctx.strokeStyle = "rgba(217,178,90,0.45)";
      ctx.lineWidth = Math.max(0.9, radius * 0.003);
      ctx.beginPath();
      ctx.arc(0, 0, roseOuter, 0, TWO_PI);
      ctx.stroke();
      // 8-point rose: 4 long cardinal spokes + 4 short ordinal spokes.
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TWO_PI;
        const long = i % 2 === 0;
        const [x1, y1] = toXY(a, roseInner);
        const [x2, y2] = toXY(a, long ? roseOuter : roseInner + (roseOuter - roseInner) * 0.5);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = long ? "rgba(217,178,90,0.55)" : "rgba(217,178,90,0.30)";
        ctx.lineWidth = Math.max(0.9, radius * (long ? 0.0035 : 0.0022));
        ctx.stroke();
      }

      ctx.restore();  // release translate/rotate/scale

      // Safety: ensure no global state leaks to the next layer/frame.
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = "source-over";
    },

    /* ===================================================================
     * BACKGROUND — cymatics / Chladni-plate sand vibration
     * =================================================================== */
    drawBackground({ ts, ctx, width, height, state, defaults }) {
      // Paint the indigo night gradient first (also clears the canvas).
      defaults.drawBackground(ts);

      // ---- time delta (clamped) ----
      let dt = _bgLastT ? (ts - _bgLastT) / 1000 : 0.016;
      _bgLastT = ts;
      if (dt > 0.1) dt = 0.1;
      if (dt < 0) dt = 0;
      _bgClock += dt;

      // ---- centered square plate region (physically true Chladni plate) ----
      const size = Math.min(width, height) * 0.92;
      const x0 = (width - size) / 2;
      const y0 = (height - size) / 2;
      const plate = { x0: x0, y0: y0, size: size };

      // (Re)seed grains once per plate size (handles initial load + resize).
      const key = Math.round(size) + "x" + Math.round(x0) + "x" + Math.round(y0);
      if (!_grains || _plateKey !== key) {
        _seedGrains(plate);
        _plateKey = key;
      }

      // ---- audio energy -> vibration, mode numbers, color ----
      const playing = !!(state && state.playing);
      const rawPulse = Math.max(0, Math.min(1,
        state && typeof state.groovePulse === "number" ? state.groovePulse : 0));
      // Idle/paused settles to a calm, mostly-still low mode.
      const energy = playing ? rawPulse : 0;

      // Smooth vibration: low floor so idle is alive but quiet; loud passages
      // make grains jump and the pattern reshape.
      const vibTarget = playing ? (0.0015 + energy * 0.05) : 0.0006;
      _bgVib += (vibTarget - _bgVib) * (vibTarget > _bgVib ? 0.2 : 0.04);

      // Mode numbers rise with energy so the figure gets more intricate on the
      // beat. Slow time drift keeps the idle plate gently morphing. Smoothed so
      // the nodal lines migrate rather than snap.
      const nTarget = 2 + energy * 4 + Math.sin(_bgClock * 0.08) * 0.6;
      const mTarget = 1 + energy * 3 + Math.cos(_bgClock * 0.063) * 0.6;
      _bgN += (nTarget - _bgN) * 0.03;
      _bgM += (mTarget - _bgM) * 0.03;
      const n = Math.max(1, Math.round(_bgN));
      const m = Math.max(1, Math.round(_bgM));

      // Color mix: warm gold sand at rest -> cool starlight/indigo when loud.
      _bgColorMix += (energy - _bgColorMix) * (energy > _bgColorMix ? 0.15 : 0.05);
      const mix = _clamp01(_bgColorMix);

      // ---- advance the biased random walk ----
      const xs = _grains.xs;
      const ys = _grains.ys;
      const inv = 2 / size;             // px -> normalized [-1,1] scale factor
      const half = size / 2;
      const cxp = x0 + half;
      const cyp = y0 + half;
      // Step magnitude scales with vibration and plate size; multiplied per grain
      // by its local amplitude so nodal-line grains settle.
      const stepBase = _bgVib * size;
      const xmin = x0, xmax = x0 + size, ymin = y0, ymax = y0 + size;

      for (let i = 0; i < GRAIN_COUNT; i++) {
        const u = (xs[i] - cxp) * inv;
        const v = (ys[i] - cyp) * inv;
        const amp = Math.abs(_chladni(u, v, n, m));   // 0 on nodal lines
        // Grains on antinodes (amp large) jump; on nodes (amp~0) barely move and
        // accumulate. Small constant keeps everything faintly alive.
        const step = stepBase * (0.04 + amp);
        let nx = xs[i] + (Math.random() - 0.5) * 2 * step;
        let ny = ys[i] + (Math.random() - 0.5) * 2 * step;
        // Clamp to plate bounds.
        if (nx < xmin) nx = xmin; else if (nx > xmax) nx = xmax;
        if (ny < ymin) ny = ymin; else if (ny > ymax) ny = ymax;
        xs[i] = nx;
        ys[i] = ny;
      }

      // ---- draw the plate tint + grains ----
      ctx.save();

      // Subtle plate panel so the sand reads against the night sky; tints a touch
      // cooler when energetic.
      const pr = ctx.createRadialGradient(cxp, cyp, size * 0.05, cxp, cyp, half * 1.02);
      const pa = 0.05 + mix * 0.04;
      pr.addColorStop(0, `rgba(${Math.round(_lerp(26, 30, mix))},${Math.round(_lerp(30, 40, mix))},${Math.round(_lerp(64, 86, mix))},${pa})`);
      pr.addColorStop(1, "rgba(6,10,28,0)");
      ctx.fillStyle = pr;
      ctx.fillRect(x0, y0, size, size);

      // Sand color: warm gold -> cool starlight as energy rises.
      const sr = Math.round(_lerp(216, 159, mix));
      const sg = Math.round(_lerp(178, 176, mix));
      const sb = Math.round(_lerp(90, 255, mix));
      const grainAlpha = 0.55 + mix * 0.2;
      ctx.fillStyle = `rgba(${sr},${sg},${sb},${grainAlpha})`;

      // Tiny 1px dots — no per-grain shadowBlur (far too slow at this count).
      for (let i = 0; i < GRAIN_COUNT; i++) {
        ctx.fillRect(xs[i], ys[i], 1.2, 1.2);
      }

      // Faint additive bloom on a small subset (every 16th grain) for sparkle on
      // loud passages only — cheap because the subset is tiny.
      if (mix > 0.04) {
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = `rgba(234,240,255,${0.10 + mix * 0.35})`;
        for (let i = 0; i < GRAIN_COUNT; i += 16) {
          ctx.fillRect(xs[i] - 0.5, ys[i] - 0.5, 2.2, 2.2);
        }
        ctx.globalCompositeOperation = "source-over";
      }

      ctx.restore();

      // Safety: never leak graphics state to the layers above.
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = "source-over";
    }
  };

})();
