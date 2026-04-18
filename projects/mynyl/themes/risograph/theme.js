
window.MYNYL_THEME_MODULES = window.MYNYL_THEME_MODULES || {};

window.MYNYL_THEME_MODULES["risograph"] = {

  drawRecord({ angle, theme, record, ctx, state, defaults }) {
    defaults.drawRecord(angle);

    const { cx, cy, radius } = record;
    const now       = performance.now() / 1000;
    const isPlaying = !!(state && state.playing);
    const pulse     = Math.max(0, Math.min(1,
      state && typeof state.groovePulse === "number" ? state.groovePulse : 0));
    const spin      = angle;
    const spinCycle = spin / (Math.PI * 2);

    const INNER = radius * 0.19;
    const OUTER = radius * 0.91;
    const BAND  = OUTER - INNER;

    const COBALT = [18,  42, 108];
    const FLAME  = [240, 78,  18];
    const MISREG = radius * 0.012;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(spin);

    // ── LAYER 1: HALFTONE DOT FIELD ──
    const DOT_ROWS  = 18;
    const baseAlpha = isPlaying ? 0.55 : 0.35;
    for (let row = 0; row < DOT_ROWS; row++) {
      const t      = row / (DOT_ROWS - 1);
      const rowR   = INNER + BAND * t;
      const circ   = Math.PI * 2 * rowR;
      const dotGap = radius * (0.028 + t * 0.008);
      const count  = Math.floor(circ / dotGap);
      const dotR   = radius * (0.007 + 0.003 * Math.sin(now * 1.2 + row * 0.8) * (isPlaying ? 1 : 0));
      for (let d = 0; d < count; d++) {
        const da     = (d / count) * Math.PI * 2;
        const dx     = Math.cos(da) * rowR;
        const dy     = Math.sin(da) * rowR;
        const breath = 1 + pulse * 0.6 * Math.sin(now * 4 + d * 0.3 + row);
        const dr     = dotR * breath;
        const ca     = baseAlpha * (0.7 + 0.3 * Math.sin(now * 0.8 + d * 0.18 + row));
        ctx.fillStyle = `rgba(${COBALT[0]},${COBALT[1]},${COBALT[2]},${ca})`;
        ctx.beginPath(); ctx.arc(dx, dy, dr, 0, Math.PI * 2); ctx.fill();
        if ((d + row) % 2 === 0) {
          const mx = Math.cos(da + 0.04) * (rowR + MISREG);
          const my = Math.sin(da + 0.04) * (rowR + MISREG);
          const oa = baseAlpha * 0.48 * (0.6 + 0.4 * Math.sin(now * 1.1 + d * 0.22));
          ctx.fillStyle = `rgba(${FLAME[0]},${FLAME[1]},${FLAME[2]},${oa})`;
          ctx.beginPath(); ctx.arc(mx, my, dr * 0.78, 0, Math.PI * 2); ctx.fill();
        }
      }
    }

    // ── LAYER 2: CONCENTRIC REGISTRATION RINGS ──
    for (let r2 = 0; r2 < 8; r2++) {
      const t      = r2 / 7;
      const rr     = INNER + BAND * (0.08 + t * 0.84);
      const isCob  = r2 % 2 === 0;
      const [cr,cg,cb] = isCob ? COBALT : FLAME;
      const breath = Math.sin(now * 1.8 + r2 * 0.9 + pulse * 3) * 0.5 + 0.5;
      const a      = (0.06 + breath * 0.12 + pulse * 0.10) * (isPlaying ? 1 : 0.5);
      ctx.strokeStyle = `rgba(${cr},${cg},${cb},${a})`;
      ctx.lineWidth   = Math.max(0.6, radius * (0.003 + 0.003 * breath));
      ctx.beginPath(); ctx.arc(0, 0, rr, 0, Math.PI * 2); ctx.stroke();
      if (isCob) {
        ctx.strokeStyle = `rgba(${FLAME[0]},${FLAME[1]},${FLAME[2]},${a * 0.45})`;
        ctx.lineWidth   *= 0.7;
        ctx.beginPath(); ctx.arc(MISREG * 0.4, MISREG * 0.2, rr + MISREG * 0.5, 0, Math.PI * 2); ctx.stroke();
      }
    }

    // ── LAYER 3: ZOETROPE DANCER RING ──
    const FRAMES = 10;
    const ZONE_IN  = INNER + BAND * 0.28;
    const ZONE_OUT = INNER + BAND * 0.72;
    const ZONE_MID = (ZONE_IN + ZONE_OUT) / 2;
    const FIG_SCALE = (ZONE_OUT - ZONE_IN) * 0.46;
    const DANCER_FRAMES = [
      [ 0.05, 1.1,-0.7, 0.6,-0.4],[ 0.12, 1.4,-0.4, 0.9,-0.1],
      [ 0.18, 1.6,-0.1, 1.1, 0.2],[ 0.10, 1.3, 0.3, 0.7, 0.6],
      [-0.02, 0.8, 0.7, 0.2, 0.9],[-0.14, 0.3, 1.0,-0.3, 1.0],
      [-0.18,-0.1, 1.2,-0.7, 0.8],[-0.12,-0.4, 1.4,-1.0, 0.4],
      [-0.05,-0.7, 1.1,-0.8,-0.1],[ 0.02, 0.2,-0.2, 0.1,-0.3],
    ];
    const PER = Math.PI * 2 / FRAMES;
    for (let i = 0; i < FRAMES; i++) {
      const a = i * PER;
      const frame = DANCER_FRAMES[i % DANCER_FRAMES.length];
      ctx.save(); ctx.rotate(a);
      ctx.save(); ctx.translate(MISREG * 0.7, MISREG * 0.4);
      drawRisoDancer(ctx, frame, ZONE_MID, FIG_SCALE, `rgba(${FLAME[0]},${FLAME[1]},${FLAME[2]},0.72)`);
      ctx.restore();
      drawRisoDancer(ctx, frame, ZONE_MID, FIG_SCALE, `rgba(${COBALT[0]},${COBALT[1]},${COBALT[2]},0.90)`);
      ctx.restore();
    }

    // ── LAYER 4: OUTER BEAT RING + DOT MARKERS ──
    const orbitR  = radius * 1.055;
    const beatBloom = pulse * radius * 0.018;
    ctx.strokeStyle = `rgba(${FLAME[0]},${FLAME[1]},${FLAME[2]},${0.18 + pulse * 0.32})`;
    ctx.lineWidth   = radius * 0.022 * 1.4;
    ctx.shadowBlur  = radius * 0.06;
    ctx.shadowColor = `rgba(${FLAME[0]},${FLAME[1]},${FLAME[2]},0.4)`;
    ctx.beginPath(); ctx.arc(MISREG * 0.5, MISREG * 0.3, orbitR + beatBloom, 0, Math.PI * 2); ctx.stroke();

    ctx.strokeStyle = `rgba(${COBALT[0]},${COBALT[1]},${COBALT[2]},${0.70 + pulse * 0.28})`;
    ctx.lineWidth   = radius * 0.022;
    ctx.shadowBlur  = radius * 0.04;
    ctx.shadowColor = `rgba(${COBALT[0]},${COBALT[1]},${COBALT[2]},0.5)`;
    ctx.beginPath(); ctx.arc(0, 0, orbitR, 0, Math.PI * 2); ctx.stroke();
    ctx.shadowBlur  = 0;

    for (let d = 0; d < 16; d++) {
      const da = (d / 16) * Math.PI * 2;
      const dx = Math.cos(da) * orbitR, dy = Math.sin(da) * orbitR;
      const ds = radius * (0.010 + (d % 4 === 0 ? 0.006 : 0) + pulse * 0.005);
      const [mr,mg,mb] = d % 2 === 0 ? FLAME : COBALT;
      ctx.fillStyle = `rgba(${mr},${mg},${mb},${0.82 + pulse * 0.16})`;
      ctx.beginPath(); ctx.arc(dx, dy, ds, 0, Math.PI * 2); ctx.fill();
    }

    ctx.restore();
  }
};

function drawRisoDancer(ctx, frame, r, s, fill) {
  const [tilt, alL, alR, legL, legR] = frame;
  const TAU = Math.PI * 2;
  const upper = 0.32, lower = 0.28, aU = 0.26, aL2 = 0.22;
  ctx.save();
  ctx.translate(r, 0);
  ctx.rotate(Math.PI / 2 + tilt);
  ctx.scale(s, s);
  ctx.fillStyle = ctx.strokeStyle = fill;
  ctx.lineWidth = 0.07; ctx.lineCap = ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.arc(0, -0.72, 0.13, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, -0.58); ctx.lineTo(0, -0.16); ctx.stroke();
  [[alL, 1],[alR, -1]].forEach(([al, side]) => {
    const k1x = Math.cos(al) * aU, k1y = -0.5 + Math.sin(al) * aU;
    const k2x = k1x + Math.cos(al + side * 1.0) * aL2;
    const k2y = k1y + Math.sin(al + side * 1.0) * aL2;
    ctx.beginPath(); ctx.moveTo(0,-0.5); ctx.lineTo(k1x,k1y); ctx.lineTo(k2x,k2y); ctx.stroke();
  });
  [[legL,0.2],[legR,-0.2]].forEach(([lg, off]) => {
    const k1x = Math.cos(lg + Math.PI/2 + off) * upper;
    const k1y = -0.14 + Math.sin(lg + Math.PI/2 + off) * upper;
    const k2x = k1x + Math.cos(lg + off) * lower;
    const k2y = k1y + Math.sin(lg + off) * lower;
    ctx.beginPath(); ctx.moveTo(0,-0.14); ctx.lineTo(k1x,k1y); ctx.lineTo(k2x,k2y); ctx.stroke();
  });
  ctx.restore();
}
