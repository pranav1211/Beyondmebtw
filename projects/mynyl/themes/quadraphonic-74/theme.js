window.MYNYL_THEME_MODULES = window.MYNYL_THEME_MODULES || {};

// ─── Quadraphonic '74 ───────────────────────────────────────
// A 1974 receiver-room record. On top of the base disc we add:
//   • a held-still stereo VU meter with TWO needles (L/R), a peak-hold tab
//     per channel, and a backlit amber lamp that brightens with the level;
//   • aged-paper label detailing (sepia vignette, foxing, curved microtext)
//     and analog wear (dust specks, hairline scuffs, a faint warp shade) —
//     both baked once into an offscreen canvas and rotated with the disc;
//   • a background pass: warm vignette, drifting dust motes, and animated
//     film grain (cycled pre-rendered noise tiles).
//
// The meter is driven by `state.groovePulse` (the live RMS audio level),
// smoothed for analog inertia — it is NOT random. We fake L/R separation
// from that single mono level with small incommensurate decorrelation.
//
// ctx is already DPR-scaled — draw in CSS px. `angle` is in RADIANS here.
(function () {
  function clamp01(v) { return Math.max(0, Math.min(1, v)); }

  const AMBER    = "rgba(217,164,65,";
  const AMBER_HI = "rgba(239,226,198,";
  const FLAME    = "rgba(192,86,31,";

  // ── meter state (module scope → analog inertia + peak hold persist) ──
  let vuL = 0, vuR = 0, peakL = 0, peakR = 0, vuLastT = 0;
  const PEAK_DECAY = 0.35; // units/sec the held peak drifts back down

  // ── baked offscreen record overlay (aging + wear), cached by radius ──
  let overlayCv = null, overlayR = 0;

  function curvedText(c, text, r, fontPx, color) {
    c.save();
    c.fillStyle = color;
    c.font = "700 " + fontPx.toFixed(1) + "px 'Space Mono', monospace";
    c.textAlign = "center";
    c.textBaseline = "middle";
    const n = text.length;
    const step = (Math.PI * 2) / n;
    for (let i = 0; i < n; i++) {
      c.save();
      c.rotate(-Math.PI / 2 + i * step);
      c.translate(0, -r);
      c.fillText(text[i], 0, 0);
      c.restore();
    }
    c.restore();
  }

  function buildRecordOverlay(radius) {
    const size = Math.max(2, Math.ceil(radius * 2));
    const cv = document.createElement("canvas");
    cv.width = size; cv.height = size;
    const c = cv.getContext("2d");
    c.translate(size / 2, size / 2);

    // ---- whole-disc wear (clipped to the disc) ----
    c.save();
    c.beginPath();
    c.arc(0, 0, radius * 0.985, 0, Math.PI * 2);
    c.clip();

    // faint matte warp shade — a gentle off-centre darkening (NOT a glossy
    // highlight; the pressing stays matte). Reads as an imperfectly flat disc.
    const warp = c.createRadialGradient(radius * 0.28, radius * 0.34, 0, radius * 0.1, radius * 0.1, radius * 1.15);
    warp.addColorStop(0, "rgba(0,0,0,0)");
    warp.addColorStop(1, "rgba(0,0,0,0.07)");
    c.fillStyle = warp;
    c.beginPath();
    c.arc(0, 0, radius * 0.985, 0, Math.PI * 2);
    c.fill();

    // dust specks
    for (let i = 0; i < 42; i++) {
      const ang = Math.random() * Math.PI * 2;
      const rr = radius * (0.22 + Math.random() * 0.72);
      const x = Math.cos(ang) * rr, y = Math.sin(ang) * rr;
      const a = 0.05 + Math.random() * 0.10;
      c.fillStyle = "rgba(232,222,200," + a.toFixed(3) + ")";
      c.beginPath();
      c.arc(x, y, Math.max(0.5, radius * (0.0012 + Math.random() * 0.002)), 0, Math.PI * 2);
      c.fill();
    }

    // hairline scuff arcs
    for (let k = 0; k < 3; k++) {
      const rr = radius * (0.35 + Math.random() * 0.55);
      const a0 = Math.random() * Math.PI * 2;
      const span = 0.15 + Math.random() * 0.5;
      c.strokeStyle = "rgba(235,228,210," + (0.04 + Math.random() * 0.04).toFixed(3) + ")";
      c.lineWidth = Math.max(0.5, radius * 0.0015);
      c.beginPath();
      c.arc(0, 0, rr, a0, a0 + span);
      c.stroke();
    }
    c.restore();

    // ---- aged paper label (clipped to the label) ----
    const lR = radius * 0.20;
    c.save();
    c.beginPath();
    c.arc(0, 0, lR, 0, Math.PI * 2);
    c.clip();
    // sepia vignette darkening the label rim
    const vg = c.createRadialGradient(0, 0, lR * 0.35, 0, 0, lR);
    vg.addColorStop(0, "rgba(60,40,20,0)");
    vg.addColorStop(1, "rgba(48,28,12,0.32)");
    c.fillStyle = vg;
    c.beginPath();
    c.arc(0, 0, lR, 0, Math.PI * 2);
    c.fill();
    // foxing blotches
    for (let b = 0; b < 4; b++) {
      const ang = Math.random() * Math.PI * 2;
      const rr = lR * (0.2 + Math.random() * 0.65);
      const x = Math.cos(ang) * rr, y = Math.sin(ang) * rr;
      const br = lR * (0.06 + Math.random() * 0.12);
      const bl = c.createRadialGradient(x, y, 0, x, y, br);
      bl.addColorStop(0, "rgba(120,80,40,0.10)");
      bl.addColorStop(1, "rgba(120,80,40,0)");
      c.fillStyle = bl;
      c.beginPath();
      c.arc(x, y, br, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();

    // ---- curved microtext ring + a thin inner print line ----
    const fontPx = Math.max(5, radius * 0.0145);
    const ringR = lR * 0.86;
    const base = "QUADRAPHONIC •  STEREO •  33⅓ RPM •  QX-1974 •  ";
    const circ = 2 * Math.PI * ringR;
    const charW = fontPx * 0.62;
    const need = Math.max(16, Math.floor(circ / charW));
    let txt = "";
    while (txt.length < need) txt += base;
    txt = txt.slice(0, need);
    curvedText(c, txt, ringR, fontPx, "rgba(74,47,26,0.55)");
    c.strokeStyle = "rgba(74,47,26,0.30)";
    c.lineWidth = Math.max(0.5, radius * 0.0016);
    c.beginPath();
    c.arc(0, 0, lR * 0.94, 0, Math.PI * 2);
    c.stroke();

    return cv;
  }

  function getRecordOverlay(radius) {
    if (!overlayCv || Math.abs(radius - overlayR) > 1) {
      overlayCv = buildRecordOverlay(radius);
      overlayR = radius;
    }
    return overlayCv;
  }

  // ════════════════════════════════════════════════════════════
  //  RECORD — aging/wear overlay + held-still stereo VU meter
  // ════════════════════════════════════════════════════════════
  function drawRecord({ angle, record, ctx, state, defaults }) {
    defaults.drawRecord(angle);

    const { cx, cy, radius } = record;

    // baked aging + wear, rotated with the disc (one drawImage)
    const ov = getRecordOverlay(radius);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.drawImage(ov, -ov.width / 2, -ov.height / 2);
    ctx.restore();

    // ── advance smoothing in real time (frame-rate independent) ──
    const now = performance.now() / 1000;
    let dt = vuLastT ? now - vuLastT : 0;
    vuLastT = now;
    if (dt > 0.1) dt = 0.1;

    const playing = !!(state && state.playing);
    const rawPulse = clamp01(state && typeof state.groovePulse === "number" ? state.groovePulse : 0);
    const target = playing ? rawPulse : 0;

    // fake L/R from the single mono level: small incommensurate decorrelation
    const tL = clamp01(target * (1 + 0.16 * Math.sin(now * 6.1)));
    const tR = clamp01(target * (1 + 0.16 * Math.sin(now * 4.7 + 1.9)));
    const easeL = 1 - Math.exp(-9.5 * dt);
    const easeR = 1 - Math.exp(-8.0 * dt);
    vuL += (tL - vuL) * easeL;
    vuR += (tR - vuR) * easeR;
    vuL = clamp01(vuL); vuR = clamp01(vuR);
    // peak hold: jump up instantly, drift down slowly
    peakL = Math.max(vuL, peakL - PEAK_DECAY * dt);
    peakR = Math.max(vuR, peakR - PEAK_DECAY * dt);

    // ── dial geometry (HELD STILL — no rotate) ──
    const R_OUTER = radius * 0.46;
    const R_ARC   = radius * 0.40;
    const R_TICK_IN = radius * 0.355;
    const R_NEEDLE  = radius * 0.435;
    const HUB_R   = radius * 0.022;
    const A_START = Math.PI;        // left  -> value 0
    const A_END   = Math.PI * 2;    // right -> value 1
    const SPAN    = A_END - A_START;
    const lvl = Math.max(vuL, vuR);

    ctx.save();
    ctx.translate(cx, cy);

    // backing wedge
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, R_OUTER, A_START, A_END);
    ctx.closePath();
    const pad = ctx.createLinearGradient(0, -R_OUTER, 0, 0);
    pad.addColorStop(0, "rgba(34,21,10,0.55)");
    pad.addColorStop(1, "rgba(18,11,5,0.18)");
    ctx.fillStyle = pad;
    ctx.fill();

    // backlit lamp glow behind the dial — brightens with the audio level
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const lampY = -R_ARC * 0.35;
    const lampA = 0.05 + 0.34 * lvl;
    const lamp = ctx.createRadialGradient(0, lampY, 0, 0, lampY, R_OUTER * 1.05);
    lamp.addColorStop(0, AMBER + (lampA).toFixed(3) + ")");
    lamp.addColorStop(0.45, FLAME + (lampA * 0.4).toFixed(3) + ")");
    lamp.addColorStop(1, AMBER + "0)");
    ctx.fillStyle = lamp;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, R_OUTER * 1.05, A_START, A_END);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // scale arc
    ctx.lineWidth = Math.max(1, radius * 0.006);
    ctx.strokeStyle = AMBER + (playing ? 0.55 : 0.40) + ")";
    ctx.beginPath();
    ctx.arc(0, 0, R_ARC, A_START, A_END);
    ctx.stroke();

    // engraved ticks (peak zone tips flame-orange)
    const TICKS = 21;
    for (let i = 0; i < TICKS; i++) {
      const t = i / (TICKS - 1);
      const a = A_START + SPAN * t;
      const major = i % 5 === 0;
      const len = radius * (major ? 0.045 : 0.026);
      const inR = R_TICK_IN, outR = inR + len;
      const ca = Math.cos(a), sa = Math.sin(a);
      ctx.strokeStyle = (t > 0.8 ? FLAME : AMBER) + (major ? 0.85 : 0.5) + ")";
      ctx.lineWidth = major ? Math.max(1.2, radius * 0.005) : Math.max(0.8, radius * 0.0028);
      ctx.beginPath();
      ctx.moveTo(ca * inR, sa * inR);
      ctx.lineTo(ca * outR, sa * outR);
      ctx.stroke();
    }

    // peak-hold tabs (L slightly inward, R slightly outward so they don't merge)
    function peakTab(peak, rBase) {
      const ap = A_START + SPAN * clamp01(peak);
      const ca = Math.cos(ap), sa = Math.sin(ap);
      const r1 = rBase - radius * 0.013, r2 = rBase + radius * 0.013;
      ctx.strokeStyle = (peak > 0.8 ? FLAME : AMBER_HI) + "0.95)";
      ctx.lineWidth = Math.max(1.4, radius * 0.006);
      ctx.beginPath();
      ctx.moveTo(ca * r1, sa * r1);
      ctx.lineTo(ca * r2, sa * r2);
      ctx.stroke();
    }
    peakTab(peakL, R_ARC - radius * 0.018);
    peakTab(peakR, R_ARC + radius * 0.018);

    // two needles (L cream, R gold), each with a soft amber glow
    function needle(v, color, reach) {
      const na = A_START + SPAN * clamp01(v);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(na) * reach, Math.sin(na) * reach);
      ctx.strokeStyle = color;
      ctx.stroke();
    }
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.shadowBlur = radius * 0.03;
    ctx.shadowColor = AMBER + "0.5)";
    ctx.lineCap = "round";
    ctx.lineWidth = Math.max(1, radius * 0.0045);
    needle(vuL, AMBER_HI + (playing ? 0.95 : 0.7) + ")", R_NEEDLE);
    needle(vuR, AMBER + (playing ? 0.95 : 0.7) + ")", R_NEEDLE * 0.96);
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();

    // hub
    const hub = ctx.createRadialGradient(0, 0, 0, 0, 0, HUB_R);
    hub.addColorStop(0, "#e6c98a");
    hub.addColorStop(0.55, "#7a5226");
    hub.addColorStop(1, "#2a1a0c");
    ctx.fillStyle = hub;
    ctx.beginPath();
    ctx.arc(0, 0, HUB_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = Math.max(0.8, radius * 0.0025);
    ctx.strokeStyle = AMBER + "0.4)";
    ctx.beginPath();
    ctx.arc(0, 0, HUB_R, 0, Math.PI * 2);
    ctx.stroke();

    // tiny "STEREO" caption under the hub
    ctx.fillStyle = AMBER + (playing ? 0.6 : 0.4) + ")";
    ctx.font = "700 " + Math.max(5, radius * 0.018).toFixed(1) + "px 'Space Mono', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("STEREO", 0, HUB_R + radius * 0.03);

    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();
  }

  // ════════════════════════════════════════════════════════════
  //  BACKGROUND — warm vignette + dust motes + film grain
  // ════════════════════════════════════════════════════════════
  let motes = null, bgLastT = performance.now() / 1000;
  let grainTiles = null;

  function seedMotes() {
    motes = [];
    for (let i = 0; i < 16; i++) {
      motes.push({
        xFrac: Math.random(),
        yFrac: Math.random(),
        spdFrac: 0.006 + Math.random() * 0.018,   // slow drift up
        swayAmp: 0.01 + Math.random() * 0.03,
        swayFreq: 0.15 + Math.random() * 0.5,
        swayPhase: Math.random() * Math.PI * 2,
        twPhase: Math.random() * Math.PI * 2,
        twFreq: 0.6 + Math.random() * 1.6,
        sizeFrac: 0.002 + Math.random() * 0.004
      });
    }
  }

  function buildGrain() {
    grainTiles = [];
    const s = 128;
    for (let t = 0; t < 4; t++) {
      const cv = document.createElement("canvas");
      cv.width = s; cv.height = s;
      const c = cv.getContext("2d");
      const img = c.createImageData(s, s);
      for (let i = 0; i < img.data.length; i += 4) {
        const val = (Math.random() * 255) | 0;
        img.data[i] = val; img.data[i + 1] = val; img.data[i + 2] = val; img.data[i + 3] = 255;
      }
      c.putImageData(img, 0, 0);
      grainTiles.push(cv);
    }
  }

  function drawBackground({ ts, ctx, width, height, state, defaults }) {
    if (defaults && typeof defaults.drawBackground === "function") defaults.drawBackground(ts);

    const w = width, h = height;
    const now = ts / 1000;
    let dt = now - bgLastT;
    bgLastT = now;
    if (!(dt > 0) || dt > 0.1) dt = 0.016;
    const pulse = clamp01(state && typeof state.groovePulse === "number" ? state.groovePulse : 0);

    // warm vignette — focuses the lit room, darkens the corners
    const vig = ctx.createRadialGradient(w / 2, h * 0.45, Math.min(w, h) * 0.18, w / 2, h * 0.5, Math.max(w, h) * 0.78);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);

    // dust motes drifting in the light
    if (!motes) seedMotes();
    const minWH = Math.min(w, h);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const m of motes) {
      m.yFrac -= m.spdFrac * dt;
      if (m.yFrac < -0.05) { m.yFrac = 1.05; m.xFrac = Math.random(); }
      const x = (m.xFrac + Math.sin(now * m.swayFreq + m.swayPhase) * m.swayAmp) * w;
      const y = m.yFrac * h;
      const tw = 0.5 + 0.5 * Math.sin(now * m.twFreq + m.twPhase);
      const a = Math.min(0.5, tw * 0.10 + 0.03 + pulse * 0.08);
      const size = m.sizeFrac * minWH * (0.7 + 0.6 * tw);
      ctx.fillStyle = "rgba(239,226,198," + (a * 0.4).toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(x, y, size * 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(245,234,208," + a.toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // animated film grain — cycle pre-rendered noise tiles, overlay blend
    if (!grainTiles) buildGrain();
    const idx = Math.floor(ts / 60) % grainTiles.length;
    const pat = ctx.createPattern(grainTiles[idx], "repeat");
    if (pat) {
      ctx.save();
      ctx.globalCompositeOperation = "overlay";
      ctx.globalAlpha = 0.07;
      ctx.fillStyle = pat;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  }

  window.MYNYL_THEME_MODULES["quadraphonic-74"] = { drawRecord, drawBackground };
})();
