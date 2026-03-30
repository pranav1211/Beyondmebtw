// ─── canvas refs ───────────────────────────────────────────
const bgCv  = document.getElementById('bg-canvas');
const bgCtx = bgCv.getContext('2d');
const rCv   = document.getElementById('record-canvas');
const rCtx  = rCv.getContext('2d');
const aCv   = document.getElementById('arm-canvas');
const aCtx  = aCv.getContext('2d');

// ─── layout ────────────────────────────────────────────────
let VW, VH;
let REC_R, REC_CX, REC_CY;
let PIV_X, PIV_Y;

function layout() {
  VW = window.innerWidth;
  VH = window.innerHeight;

  REC_R  = Math.min(VW, VH) * 0.42;
  REC_CX = VW / 2;
  REC_CY = VH / 2;

  rCv.width  = REC_R * 2;
  rCv.height = REC_R * 2;
  rCv.style.left = (REC_CX - REC_R) + 'px';
  rCv.style.top  = (REC_CY - REC_R) + 'px';

  PIV_X = REC_CX + REC_R * 1.05;
  PIV_Y = REC_CY - REC_R * 0.85;

  aCv.width  = VW;
  aCv.height = VH;
  aCv.style.left = '0';
  aCv.style.top  = '0';

  bgCv.width  = VW;
  bgCv.height = VH;
}

// ─── tonearm geometry ──────────────────────────────────────
function computeArmAngles() {
  const outerR = REC_R * 0.91;
  const innerR = REC_R * 0.30;  // well outside label (0.175) to account for headshell geometry

  const outerPtX = REC_CX - outerR * 0.1;
  const outerPtY = REC_CY - outerR * 0.85;

  const dOuter  = Math.hypot(outerPtX - PIV_X, outerPtY - PIV_Y);
  const ARM_LEN = dOuter;

  const aOuter = Math.atan2(outerPtY - PIV_Y, outerPtX - PIV_X) * 180 / Math.PI;

  const D   = Math.hypot(PIV_X - REC_CX, PIV_Y - REC_CY);
  const a2  = (ARM_LEN * ARM_LEN - innerR * innerR + D * D) / (2 * D);
  const h2  = Math.sqrt(Math.max(0, ARM_LEN * ARM_LEN - a2 * a2));
  const midX = PIV_X + a2 * (REC_CX - PIV_X) / D;
  const midY = PIV_Y + a2 * (REC_CY - PIV_Y) / D;
  const perpX = -((REC_CY - PIV_Y) / D);
  const perpY =  ((REC_CX - PIV_X) / D);

  const ix1 = midX + h2 * perpX, iy1 = midY + h2 * perpY;
  const ix2 = midX - h2 * perpX, iy2 = midY - h2 * perpY;
  const innerPt = ix1 < ix2 ? { x: ix1, y: iy1 } : { x: ix2, y: iy2 };
  const aInner  = Math.atan2(innerPt.y - PIV_Y, innerPt.x - PIV_X) * 180 / Math.PI;

  // parked: arm hangs to the right of the record
  const parkTgtX = REC_CX + REC_R * 1.2;
  const parkTgtY = REC_CY + REC_R * 0.3;
  const aParked = Math.atan2(parkTgtY - PIV_Y, parkTgtX - PIV_X) * 180 / Math.PI;

  return { ARM_LEN, aOuter, aInner, aParked };
}

let GEO;

// ─── theme (reads CSS custom properties set in the theme file) ──
let THEME = {};
function readTheme() {
  const s = getComputedStyle(document.documentElement);
  const v = n => s.getPropertyValue(n).trim();
  THEME = {
    // background
    bgCenterRgb:    v('--bg-center-rgb')    || '72,30,6',
    bgMidRgb:       v('--bg-mid-rgb')       || '35,12,3',
    // vinyl disc
    vinylDisc:      v('--vinyl-disc')       || '#0f0f0f',
    vinylEdge:      v('--vinyl-edge')       || 'rgba(255,255,255,0.06)',
    vinylGrooveRgb: v('--vinyl-groove-rgb') || '255,255,255',
    vinylSheen:     parseFloat(v('--vinyl-sheen') || '0.055'),
    // vinyl label
    labelStop0:     v('--vinyl-label-0')    || '#f8df90',
    labelStop55:    v('--vinyl-label-55')   || '#e8c87a',
    labelStop100:   v('--vinyl-label-100')  || '#c09040',
    labelRing:      v('--vinyl-label-ring') || 'rgba(150,100,30,0.3)',
    // tonearm tube
    armColor0:      v('--arm-0')            || '#1c1008',
    armColor25:     v('--arm-25')           || '#6a5030',
    armColor60:     v('--arm-60')           || '#a88050',
    armColor100:    v('--arm-100')          || '#584020',
    // headshell
    headshell:      v('--arm-headshell')    || '#a08050',
    // needle
    needle:         v('--arm-needle')       || 'rgba(220,210,180,0.7)',
    needleTip:      v('--arm-needle-tip')   || '#ddd0a8',
    // counterweight
    cwColor0:       v('--arm-cw-0')         || '#706050',
    cwColor55:      v('--arm-cw-55')        || '#302818',
    cwColor100:     v('--arm-cw-100')       || '#140e06',
    // pivot bearing
    pivotColor0:    v('--arm-pivot-0')      || '#c0b080',
    pivotColor50:   v('--arm-pivot-50')     || '#504030',
    pivotColor100:  v('--arm-pivot-100')    || '#141008',
  };
}

layout();
GEO = computeArmAngles();
readTheme();
window.addEventListener('resize', () => { layout(); GEO = computeArmAngles(); readTheme(); });

// ─── geometry helpers ──────────────────────────────────────
function toRad(a) { return a * Math.PI / 180; }

function armTipPos(angle) {
  return {
    x: PIV_X + Math.cos(toRad(angle)) * GEO.ARM_LEN,
    y: PIV_Y + Math.sin(toRad(angle)) * GEO.ARM_LEN,
  };
}

function angleToProgress(a) {
  return Math.max(0, Math.min(1, (a - GEO.aOuter) / (GEO.aInner - GEO.aOuter)));
}
function progressToAngle(p) {
  return GEO.aOuter + p * (GEO.aInner - GEO.aOuter);
}

function tipOnGroove(angle) {
  const t = armTipPos(angle);
  const d = Math.hypot(t.x - REC_CX, t.y - REC_CY);
  return d < REC_R * 0.93 && d > REC_R * 0.18; // full visible groove area for drop detection
}

// ─── draw: background ──────────────────────────────────────
function drawBg(ts) {
  const bw = bgCv.width, bh = bgCv.height;
  bgCtx.clearRect(0, 0, bw, bh);
  const t  = ts * 0.00025;
  const c1 = THEME.bgCenterRgb;
  const c2 = THEME.bgMidRgb;
  const g = bgCtx.createRadialGradient(
    bw * (0.5 + 0.07 * Math.sin(t)),       bh * (0.5 + 0.05 * Math.cos(t * 0.7)), 0,
    bw * 0.5, bh * 0.5, bw * 0.9
  );
  g.addColorStop(0,    `rgba(${c1},${0.7 + 0.07 * Math.sin(t * 1.2)})`);
  g.addColorStop(0.4,  `rgba(${c2},${0.8 + 0.05 * Math.cos(t)})`);
  g.addColorStop(0.75, '#090400');
  g.addColorStop(1,    '#060300');
  bgCtx.fillStyle = g;
  bgCtx.fillRect(0, 0, bw, bh);

  const g2 = bgCtx.createRadialGradient(
    bw * (0.25 + 0.10 * Math.sin(t * 0.5 + 1)), bh * (0.72 + 0.07 * Math.cos(t * 0.4)), 0,
    bw * 0.25, bh * 0.72, bw * 0.45
  );
  g2.addColorStop(0, `rgba(${c1},${0.20 + 0.06 * Math.sin(t * 0.9)})`);
  g2.addColorStop(1, `rgba(${c1},0)`);
  bgCtx.fillStyle = g2;
  bgCtx.fillRect(0, 0, bw, bh);
}

// ─── draw: record ──────────────────────────────────────────
function drawRecord(angle) {
  const R  = REC_R;
  const CX = R, CY = R;
  rCtx.clearRect(0, 0, R * 2, R * 2);
  rCtx.save();

  // disc
  rCtx.beginPath();
  rCtx.arc(CX, CY, R - 1, 0, Math.PI * 2);
  rCtx.fillStyle = THEME.vinylDisc;
  rCtx.fill();

  // edge ring
  rCtx.beginPath();
  rCtx.arc(CX, CY, R - 1, 0, Math.PI * 2);
  rCtx.strokeStyle = THEME.vinylEdge;
  rCtx.lineWidth = 2;
  rCtx.stroke();

  // grooves
  const gs = R * 0.19, ge = R * 0.91;
  for (let gr = gs; gr < ge; gr += 1.5) {
    const pulse = groovePulse * 0.06 * Math.sin(gr * 3.2 + angle * 2.5);
    const base  = 0.04 + 0.035 * Math.sin(gr * 0.35 + angle * 0.07);
    rCtx.beginPath();
    rCtx.arc(CX, CY, gr, 0, Math.PI * 2);
    rCtx.strokeStyle = `rgba(${THEME.vinylGrooveRgb},${Math.max(0, base + pulse)})`;
    rCtx.lineWidth = 0.75;
    rCtx.stroke();
  }

  // rotating sheen
  rCtx.save();
  rCtx.translate(CX, CY);
  rCtx.rotate(angle);
  const sg = rCtx.createLinearGradient(-R, 0, R, 0);
  sg.addColorStop(0,    'rgba(255,255,255,0)');
  sg.addColorStop(0.44, 'rgba(255,255,255,0)');
  sg.addColorStop(0.5,  `rgba(255,255,255,${THEME.vinylSheen})`);
  sg.addColorStop(0.56, 'rgba(255,255,255,0)');
  sg.addColorStop(1,    'rgba(255,255,255,0)');
  rCtx.beginPath(); rCtx.arc(0, 0, R - 1, 0, Math.PI * 2);
  rCtx.fillStyle = sg; rCtx.fill();
  rCtx.restore();

  // label
  const lR = R * 0.175;
  rCtx.save();
  rCtx.translate(CX, CY);
  rCtx.rotate(angle);

  // label: gradient always shown; album art overlaid when available
  const lg = rCtx.createRadialGradient(-lR * 0.15, -lR * 0.15, 0, 0, 0, lR);
  lg.addColorStop(0,    THEME.labelStop0);
  lg.addColorStop(0.55, THEME.labelStop55);
  lg.addColorStop(1,    THEME.labelStop100);
  rCtx.beginPath(); rCtx.arc(0, 0, lR, 0, Math.PI * 2);
  rCtx.fillStyle = window._labelImage ? '#1a0a04' : lg;
  rCtx.fill();
  rCtx.strokeStyle = 'rgba(0,0,0,0.28)'; rCtx.lineWidth = 0.8; rCtx.stroke();

  for (const fr of [0.36, 0.56, 0.78]) {
    rCtx.beginPath(); rCtx.arc(0, 0, lR * fr, 0, Math.PI * 2);
    rCtx.strokeStyle = THEME.labelRing; rCtx.lineWidth = 0.5; rCtx.stroke();
  }

  // counter-rotate so content stays upright
  rCtx.rotate(-angle);

  if (window._labelImage) {
    rCtx.save();
    rCtx.beginPath(); rCtx.arc(0, 0, lR, 0, Math.PI * 2); rCtx.clip();
    rCtx.drawImage(window._labelImage, -lR, -lR, lR * 2, lR * 2);
    rCtx.restore();
  }
  rCtx.restore();

  // hint overlay
  if (!hasFile) {
    const nr = R * 0.55;
    const ph = 0.38 + 0.22 * Math.sin(Date.now() * 0.0028);
    rCtx.save();
    rCtx.globalAlpha = ph;
    rCtx.beginPath(); rCtx.arc(CX, CY, nr, 0, Math.PI * 2);
    rCtx.strokeStyle = 'rgba(210,135,45,0.55)';
    rCtx.lineWidth = 1.5; rCtx.setLineDash([5, 7]); rCtx.stroke(); rCtx.setLineDash([]);
    const tx = CX + nr * Math.cos(-1.1), ty = CY + nr * Math.sin(-1.1);
    rCtx.globalAlpha = ph * 0.9;
    rCtx.beginPath(); rCtx.arc(tx, ty, 5, 0, Math.PI * 2);
    rCtx.fillStyle = 'rgba(235,145,55,0.95)'; rCtx.fill();
    rCtx.globalAlpha = ph * 0.3;
    rCtx.beginPath(); rCtx.arc(tx, ty, 12, 0, Math.PI * 2);
    rCtx.fillStyle = 'rgba(235,145,55,0.5)'; rCtx.fill();
    rCtx.globalAlpha = ph * 0.8;
    rCtx.font = `700 ${Math.round(R * 0.04)}px Space Mono,monospace`;
    rCtx.fillStyle = 'rgba(235,200,115,0.9)';
    rCtx.textAlign = 'center'; rCtx.textBaseline = 'middle';
    rCtx.fillText('load a record', CX, CY + R * 0.38);
    rCtx.globalAlpha = 1;
    rCtx.restore();
  }

  rCtx.restore();
}

// ─── draw: tonearm ─────────────────────────────────────────
function drawArm(angle) {
  aCtx.clearRect(0, 0, VW, VH);

  const ARM_LEN = GEO.ARM_LEN;
  const r    = toRad(angle);
  const tipX = PIV_X + Math.cos(r) * ARM_LEN;
  const tipY = PIV_Y + Math.sin(r) * ARM_LEN;

  const shellBend = -0.32;
  const shellLen  = ARM_LEN * 0.1;
  const sr  = r + shellBend;
  const shX = tipX + Math.cos(sr) * shellLen;
  const shY = tipY + Math.sin(sr) * shellLen;

  const cwLen = ARM_LEN * 0.15;
  const cwX   = PIV_X + Math.cos(r + Math.PI) * cwLen;
  const cwY   = PIV_Y + Math.sin(r + Math.PI) * cwLen;

  aCtx.save();
  aCtx.shadowColor   = 'rgba(0,0,0,0.55)';
  aCtx.shadowBlur    = 14;
  aCtx.shadowOffsetY = 5;

  // arm tube
  aCtx.beginPath(); aCtx.moveTo(cwX, cwY); aCtx.lineTo(tipX, tipY);
  const ag = aCtx.createLinearGradient(cwX, cwY, tipX, tipY);
  ag.addColorStop(0,    THEME.armColor0);
  ag.addColorStop(0.25, THEME.armColor25);
  ag.addColorStop(0.6,  THEME.armColor60);
  ag.addColorStop(1,    THEME.armColor100);
  aCtx.strokeStyle = ag;
  aCtx.lineWidth   = Math.max(5, ARM_LEN * 0.022);
  aCtx.lineCap     = 'round';
  aCtx.stroke();

  // highlight stripe
  aCtx.beginPath(); aCtx.moveTo(cwX, cwY); aCtx.lineTo(tipX, tipY);
  aCtx.strokeStyle = 'rgba(255,255,255,0.08)';
  aCtx.lineWidth   = Math.max(1.5, ARM_LEN * 0.005);
  aCtx.stroke();

  // counterweight disc
  aCtx.shadowBlur = 6;
  const cwR = Math.max(7, ARM_LEN * 0.038);
  const cg  = aCtx.createRadialGradient(cwX - 2, cwY - 2, 1, cwX, cwY, cwR);
  cg.addColorStop(0,    THEME.cwColor0);
  cg.addColorStop(0.55, THEME.cwColor55);
  cg.addColorStop(1,    THEME.cwColor100);
  aCtx.beginPath(); aCtx.arc(cwX, cwY, cwR, 0, Math.PI * 2);
  aCtx.fillStyle = cg; aCtx.fill();
  aCtx.strokeStyle = 'rgba(255,255,255,0.07)'; aCtx.lineWidth = 0.8; aCtx.stroke();

  // headshell
  aCtx.beginPath(); aCtx.moveTo(tipX, tipY); aCtx.lineTo(shX, shY);
  aCtx.strokeStyle = THEME.headshell;
  aCtx.lineWidth   = Math.max(4, ARM_LEN * 0.016);
  aCtx.lineCap     = 'round';
  aCtx.stroke();

  // stylus needle
  const needleLen = shellLen * 0.55;
  const nx = shX + Math.cos(sr + Math.PI / 2) * needleLen;
  const ny = shY + Math.sin(sr + Math.PI / 2) * needleLen;
  aCtx.beginPath(); aCtx.moveTo(shX, shY); aCtx.lineTo(nx, ny);
  aCtx.strokeStyle = THEME.needle; aCtx.lineWidth = 1.5; aCtx.stroke();

  // stylus tip dot
  aCtx.beginPath(); aCtx.arc(nx, ny, Math.max(2.5, ARM_LEN * 0.007), 0, Math.PI * 2);
  aCtx.fillStyle = THEME.needleTip; aCtx.fill();

  // pivot bearing
  const pivR = Math.max(7, ARM_LEN * 0.03);
  const pg   = aCtx.createRadialGradient(PIV_X - 3, PIV_Y - 3, 1, PIV_X, PIV_Y, pivR);
  pg.addColorStop(0,   THEME.pivotColor0);
  pg.addColorStop(0.5, THEME.pivotColor50);
  pg.addColorStop(1,   THEME.pivotColor100);
  aCtx.beginPath(); aCtx.arc(PIV_X, PIV_Y, pivR, 0, Math.PI * 2);
  aCtx.fillStyle = pg; aCtx.fill();
  aCtx.strokeStyle = 'rgba(255,255,255,0.15)'; aCtx.lineWidth = 1; aCtx.stroke();

  // inner pivot dot
  aCtx.beginPath(); aCtx.arc(PIV_X, PIV_Y, pivR * 0.3, 0, Math.PI * 2);
  aCtx.fillStyle = 'rgba(0,0,0,0.65)'; aCtx.fill();

  aCtx.restore();
}
