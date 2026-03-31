// ─── canvas refs ───────────────────────────────────────────
const bgCv = document.getElementById('bg-canvas');
const bgCtx = bgCv.getContext('2d');
const rCv = document.getElementById('record-canvas');
const rCtx = rCv.getContext('2d');
const aCv = document.getElementById('arm-canvas');
const aCtx = aCv.getContext('2d');

// ─── layout ────────────────────────────────────────────────
let VW, VH;
let REC_R, REC_CX, REC_CY;
let PIV_X, PIV_Y;

// ─── theme (reads CSS custom properties set in the theme file) ──
let THEME = {};
let ACTIVE_THEME_NAME = 'wood';
let ACTIVE_THEME_MODULE = {};
const themeModules = window.MYNYL_THEME_MODULES || (window.MYNYL_THEME_MODULES = {});
let themeModuleLoader = null;

function readTheme() {
  const s = getComputedStyle(document.documentElement);
  const v = n => s.getPropertyValue(n).trim();
  const n = (name, fallback) => {
    const raw = parseFloat(v(name));
    return Number.isFinite(raw) ? raw : fallback;
  };

  THEME = {
    bgCenterRgb: v('--bg-center-rgb') || '72,30,6',
    bgMidRgb: v('--bg-mid-rgb') || '35,12,3',
    bgEdge0: v('--bg-edge-0') || '#090400',
    bgEdge1: v('--bg-edge-1') || '#060300',
    bgGlowStrength: n('--bg-glow-strength', 1),
    bgDriftX: n('--bg-drift-x', 0.07),
    bgDriftY: n('--bg-drift-y', 0.05),

    recordScale: n('--player-record-scale', 0.42),
    pivotOffsetX: n('--arm-pivot-offset-x', 1.05),
    pivotOffsetY: n('--arm-pivot-offset-y', -0.85),
    armOuterRadius: n('--arm-outer-radius', 0.91),
    armInnerRadius: n('--arm-inner-radius', 0.3),
    armOuterOffsetX: n('--arm-outer-offset-x', -0.1),
    armOuterOffsetY: n('--arm-outer-offset-y', -0.85),
    armParkOffsetX: n('--arm-park-offset-x', 1.2),
    armParkOffsetY: n('--arm-park-offset-y', 0.3),

    vinylStyle: (v('--vinyl-style') || 'classic').toLowerCase(),
    vinylDisc: v('--vinyl-disc') || '#0f0f0f',
    vinylEdge: v('--vinyl-edge') || 'rgba(255,255,255,0.06)',
    vinylGrooveRgb: v('--vinyl-groove-rgb') || '255,255,255',
    vinylGrooveAlpha: n('--vinyl-groove-alpha', 0.04),
    groovePulseAmount: n('--vinyl-groove-pulse', 0.06),
    grooveSpacing: Math.max(0.8, n('--vinyl-groove-spacing', 1.5)),
    grooveWidth: Math.max(0.25, n('--vinyl-groove-width', 0.75)),
    grooveStart: n('--vinyl-groove-start', 0.19),
    grooveEnd: n('--vinyl-groove-end', 0.91),
    grooveWarp: n('--vinyl-groove-warp', 0.035),
    vinylSheen: n('--vinyl-sheen', 0.055),
    vinylSheenWidth: n('--vinyl-sheen-width', 0.06),
    vinylRimLight: v('--vinyl-rim-light') || 'rgba(255,255,255,0.04)',
    vinylRimShadow: v('--vinyl-rim-shadow') || 'rgba(0,0,0,0.33)',
    vinylShadowRing: v('--vinyl-shadow-ring') || 'rgba(0,0,0,0.16)',
    vinylDropShadow: v('--vinyl-drop-shadow') || 'rgba(0,0,0,0)',
    vinylDropShadowBlur: n('--vinyl-drop-shadow-blur', 0),
    vinylDropShadowOffsetY: n('--vinyl-drop-shadow-offset-y', 0),
    splatterColor: v('--vinyl-splatter-color') || 'rgba(255,255,255,0.14)',
    splatterSecondary: v('--vinyl-splatter-secondary') || 'rgba(255,255,255,0.08)',
    splatterCount: Math.max(0, Math.round(n('--vinyl-splatter-count', 0))),
    splatterSize: n('--vinyl-splatter-size', 0.015),

    labelRadius: n('--vinyl-label-radius', 0.175),
    labelHoleRadius: n('--vinyl-hole-radius', 0.02),
    labelStop0: v('--vinyl-label-0') || '#f8df90',
    labelStop55: v('--vinyl-label-55') || '#e8c87a',
    labelStop100: v('--vinyl-label-100') || '#c09040',
    labelRing: v('--vinyl-label-ring') || 'rgba(150,100,30,0.3)',
    labelStroke: v('--vinyl-label-stroke') || 'rgba(0,0,0,0.28)',
    labelArtBase: v('--vinyl-label-art-base') || '#1a0a04',
    labelHoleFill: v('--vinyl-hole-fill') || '#111',

    armStyle: (v('--arm-style') || 'classic').toLowerCase(),
    armTubeWidth: n('--arm-tube-width', 0.022),
    armShadowBlur: n('--arm-shadow-blur', 14),
    armShadowOffsetY: n('--arm-shadow-offset-y', 5),
    armHighlightAlpha: n('--arm-highlight-alpha', 0.08),
    armColor0: v('--arm-0') || '#1c1008',
    armColor25: v('--arm-25') || '#6a5030',
    armColor60: v('--arm-60') || '#a88050',
    armColor100: v('--arm-100') || '#584020',
    headshell: v('--arm-headshell') || '#a08050',
    headshellLength: n('--arm-headshell-length', 0.1),
    headshellWidth: n('--arm-headshell-width', 0.016),
    headshellBendDeg: n('--arm-headshell-bend-deg', -18),
    needle: v('--arm-needle') || 'rgba(220,210,180,0.7)',
    needleTip: v('--arm-needle-tip') || '#ddd0a8',
    needleWidth: n('--arm-needle-width', 1.5),
    needleLength: n('--arm-needle-length', 0.55),
    cwColor0: v('--arm-cw-0') || '#706050',
    cwColor55: v('--arm-cw-55') || '#302818',
    cwColor100: v('--arm-cw-100') || '#140e06',
    cwRadius: n('--arm-counterweight-radius', 0.038),
    cwOffset: n('--arm-counterweight-offset', 0.15),
    pivotColor0: v('--arm-pivot-0') || '#c0b080',
    pivotColor50: v('--arm-pivot-50') || '#504030',
    pivotColor100: v('--arm-pivot-100') || '#141008',
    pivotRadius: n('--arm-pivot-radius', 0.03),
    pivotInnerRadius: n('--arm-pivot-inner-radius', 0.3),

    hintRing: v('--hint-ring') || 'rgba(210,135,45,0.55)',
    hintDot: v('--hint-dot') || 'rgba(235,145,55,0.95)',
    hintGlow: v('--hint-glow') || 'rgba(235,145,55,0.5)',
    hintText: v('--hint-text') || 'rgba(235,200,115,0.9)',
  };
}

function layout() {
  VW = window.innerWidth;
  VH = window.innerHeight;

  REC_R = Math.min(VW, VH) * THEME.recordScale;
  REC_CX = VW / 2;
  REC_CY = VH / 2;

  rCv.width = REC_R * 2;
  rCv.height = REC_R * 2;
  rCv.style.left = REC_CX - REC_R + 'px';
  rCv.style.top = REC_CY - REC_R + 'px';

  PIV_X = REC_CX + REC_R * THEME.pivotOffsetX;
  PIV_Y = REC_CY + REC_R * THEME.pivotOffsetY;

  aCv.width = VW;
  aCv.height = VH;
  aCv.style.left = '0';
  aCv.style.top = '0';

  bgCv.width = VW;
  bgCv.height = VH;
}

// ─── tonearm geometry ──────────────────────────────────────
function computeArmAngles() {
  const outerR = REC_R * THEME.armOuterRadius;
  const innerR = REC_R * THEME.armInnerRadius;

  const outerPtX = REC_CX + outerR * THEME.armOuterOffsetX;
  const outerPtY = REC_CY + outerR * THEME.armOuterOffsetY;

  const dOuter = Math.hypot(outerPtX - PIV_X, outerPtY - PIV_Y);
  const ARM_LEN = dOuter;

  const rawOuter = Math.atan2(outerPtY - PIV_Y, outerPtX - PIV_X) * 180 / Math.PI;

  const D = Math.hypot(PIV_X - REC_CX, PIV_Y - REC_CY);
  const a2 = (ARM_LEN * ARM_LEN - innerR * innerR + D * D) / (2 * D);
  const h2 = Math.sqrt(Math.max(0, ARM_LEN * ARM_LEN - a2 * a2));
  const midX = PIV_X + a2 * (REC_CX - PIV_X) / D;
  const midY = PIV_Y + a2 * (REC_CY - PIV_Y) / D;
  const perpX = -((REC_CY - PIV_Y) / D);
  const perpY = (REC_CX - PIV_X) / D;

  const ix1 = midX + h2 * perpX;
  const iy1 = midY + h2 * perpY;
  const ix2 = midX - h2 * perpX;
  const iy2 = midY - h2 * perpY;
  const parkTgtX = REC_CX + REC_R * THEME.armParkOffsetX;
  const parkTgtY = REC_CY + REC_R * THEME.armParkOffsetY;
  const rawParked = Math.atan2(parkTgtY - PIV_Y, parkTgtX - PIV_X) * 180 / Math.PI;
  const aOuter = normalizeAngleNear(rawOuter, rawParked);

  const innerCandidates = [
    { x: ix1, y: iy1, a: normalizeAngleNear(Math.atan2(iy1 - PIV_Y, ix1 - PIV_X) * 180 / Math.PI, aOuter) },
    { x: ix2, y: iy2, a: normalizeAngleNear(Math.atan2(iy2 - PIV_Y, ix2 - PIV_X) * 180 / Math.PI, aOuter) },
  ];
  innerCandidates.sort((a, b) => Math.abs(a.a - aOuter) - Math.abs(b.a - aOuter));
  const aInner = innerCandidates[0].a;
  const aParked = normalizeAngleNear(rawParked, aOuter);

  return { ARM_LEN, aOuter, aInner, aParked };
}

let GEO;

function refreshTheme() {
  const prev = GEO;
  readTheme();
  layout();
  GEO = computeArmAngles();
  window.dispatchEvent(new CustomEvent('mynyl:themechange', {
    detail: { previousGeo: prev, geo: GEO, theme: THEME }
  }));
}

refreshTheme();
window.addEventListener('resize', refreshTheme);
window.refreshMynylTheme = refreshTheme;
window.normalizeMynylAngle = normalizeAngleNear;

const themeLink = document.querySelector('link[data-mynyl-theme]');
if (themeLink) {
  themeLink.addEventListener('load', refreshTheme);
  window.setMynylTheme = config => {
    const settings = typeof config === 'string'
      ? { cssHref: config, themeName: ACTIVE_THEME_NAME, scriptHref: '' }
      : config;

    ACTIVE_THEME_NAME = settings.themeName || ACTIVE_THEME_NAME;
    loadThemeModule(ACTIVE_THEME_NAME, settings.scriptHref || '');
    themeLink.setAttribute('href', settings.cssHref);
  };
}

// ─── geometry helpers ──────────────────────────────────────
function toRad(a) { return a * Math.PI / 180; }

function normalizeAngleNear(angle, reference) {
  let out = angle;
  while (out - reference > 180) out -= 360;
  while (out - reference < -180) out += 360;
  return out;
}

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
  return d < REC_R * Math.min(0.98, THEME.grooveEnd + 0.02) && d > REC_R * Math.max(0.08, THEME.grooveStart - 0.01);
}

// ─── draw: background ──────────────────────────────────────
function drawBg(ts) {
  const bw = bgCv.width;
  const bh = bgCv.height;
  bgCtx.clearRect(0, 0, bw, bh);
  const t = ts * 0.00025;
  const c1 = THEME.bgCenterRgb;
  const c2 = THEME.bgMidRgb;
  const glow = THEME.bgGlowStrength;

  const g = bgCtx.createRadialGradient(
    bw * (0.5 + THEME.bgDriftX * Math.sin(t)),
    bh * (0.5 + THEME.bgDriftY * Math.cos(t * 0.7)),
    0,
    bw * 0.5,
    bh * 0.5,
    bw * 0.9
  );
  g.addColorStop(0, `rgba(${c1},${(0.7 + 0.07 * Math.sin(t * 1.2)) * glow})`);
  g.addColorStop(0.4, `rgba(${c2},${(0.8 + 0.05 * Math.cos(t)) * glow})`);
  g.addColorStop(0.75, THEME.bgEdge0);
  g.addColorStop(1, THEME.bgEdge1);
  bgCtx.fillStyle = g;
  bgCtx.fillRect(0, 0, bw, bh);

  const g2 = bgCtx.createRadialGradient(
    bw * (0.25 + 0.1 * Math.sin(t * 0.5 + 1)),
    bh * (0.72 + 0.07 * Math.cos(t * 0.4)),
    0,
    bw * 0.25,
    bh * 0.72,
    bw * 0.45
  );
  g2.addColorStop(0, `rgba(${c1},${(0.2 + 0.06 * Math.sin(t * 0.9)) * glow})`);
  g2.addColorStop(1, `rgba(${c1},0)`);
  bgCtx.fillStyle = g2;
  bgCtx.fillRect(0, 0, bw, bh);
}

function drawGrooves(CX, CY, R, angle) {
  const start = R * THEME.grooveStart;
  const end = R * THEME.grooveEnd;
  const spacing = THEME.grooveSpacing;
  const width = THEME.grooveWidth;
  const pulseAmt = groovePulse * THEME.groovePulseAmount;

  if (THEME.vinylStyle === 'minimal') {
    for (let gr = start; gr < end; gr += spacing * 2.5) {
      const base = THEME.vinylGrooveAlpha * 0.8;
      rCtx.beginPath();
      rCtx.arc(CX, CY, gr, 0, Math.PI * 2);
      rCtx.strokeStyle = `rgba(${THEME.vinylGrooveRgb},${base})`;
      rCtx.lineWidth = width;
      rCtx.stroke();
    }
    return;
  }

  for (let gr = start; gr < end; gr += spacing) {
    const pulse = pulseAmt * Math.sin(gr * 3.2 + angle * 2.5);
    const base = THEME.vinylGrooveAlpha + THEME.grooveWarp * Math.sin(gr * 0.35 + angle * 0.07);
    rCtx.beginPath();
    rCtx.arc(CX, CY, gr, 0, Math.PI * 2);
    rCtx.strokeStyle = `rgba(${THEME.vinylGrooveRgb},${Math.max(0, base + pulse)})`;
    rCtx.lineWidth = width;
    rCtx.stroke();
  }

  if (THEME.vinylStyle === 'etched') {
    for (const ring of [0.28, 0.44, 0.62, 0.8]) {
      rCtx.beginPath();
      rCtx.arc(CX, CY, R * ring, 0, Math.PI * 2);
      rCtx.strokeStyle = `rgba(${THEME.vinylGrooveRgb},${THEME.vinylGrooveAlpha * 2.2})`;
      rCtx.lineWidth = width * 1.5;
      rCtx.stroke();
    }
  }
}

function drawSplatter(CX, CY, R, angle) {
  if (THEME.splatterCount <= 0) return;

  rCtx.save();
  rCtx.translate(CX, CY);
  rCtx.rotate(angle * 0.82);

  for (let i = 0; i < THEME.splatterCount; i++) {
    const base = i + 1;
    const randA = (Math.sin(base * 12.9898) + 1) * 0.5;
    const randB = (Math.sin(base * 78.233) + 1) * 0.5;
    const randC = (Math.sin(base * 33.157) + 1) * 0.5;
    const radial = R * (0.24 + randA * 0.58);
    const theta = randB * Math.PI * 2;
    const rx = Math.cos(theta) * radial;
    const ry = Math.sin(theta) * radial;
    const dotR = Math.max(1.25, R * THEME.splatterSize * (0.35 + randC));
    rCtx.beginPath();
    rCtx.arc(rx, ry, dotR, 0, Math.PI * 2);
    rCtx.fillStyle = i % 3 === 0 ? THEME.splatterSecondary : THEME.splatterColor;
    rCtx.fill();
  }

  rCtx.restore();
}

function loadThemeModule(themeName, scriptHref) {
  if (!scriptHref) {
    ACTIVE_THEME_MODULE = themeModules[themeName] || {};
    return;
  }

  if (themeModules[themeName]) {
    ACTIVE_THEME_MODULE = themeModules[themeName];
    return;
  }

  ACTIVE_THEME_MODULE = {};
  if (themeModuleLoader) themeModuleLoader.remove();
  const script = document.createElement('script');
  script.src = scriptHref;
  script.async = true;
  script.dataset.themeModule = themeName;
  script.addEventListener('load', () => {
    ACTIVE_THEME_MODULE = themeModules[themeName] || {};
  });
  document.head.appendChild(script);
  themeModuleLoader = script;
}

// ─── draw: record ──────────────────────────────────────────
function drawDefaultRecord(angle) {
  const R = REC_R;
  const CX = R;
  const CY = R;
  rCtx.clearRect(0, 0, R * 2, R * 2);
  rCtx.save();

  rCtx.beginPath();
  rCtx.arc(CX, CY, R - 1, 0, Math.PI * 2);
  rCtx.shadowColor = THEME.vinylDropShadow;
  rCtx.shadowBlur = THEME.vinylDropShadowBlur;
  rCtx.shadowOffsetY = THEME.vinylDropShadowOffsetY;
  rCtx.fillStyle = THEME.vinylDisc;
  rCtx.fill();
  rCtx.shadowColor = 'rgba(0,0,0,0)';
  rCtx.shadowBlur = 0;
  rCtx.shadowOffsetY = 0;

  const rim = rCtx.createLinearGradient(CX, CY - R, CX, CY + R);
  rim.addColorStop(0, THEME.vinylRimLight);
  rim.addColorStop(0.5, 'rgba(255,255,255,0)');
  rim.addColorStop(1, THEME.vinylRimShadow);
  rCtx.beginPath();
  rCtx.arc(CX, CY, R - 1, 0, Math.PI * 2);
  rCtx.fillStyle = rim;
  rCtx.fill();

  rCtx.beginPath();
  rCtx.arc(CX, CY, R - 1, 0, Math.PI * 2);
  rCtx.strokeStyle = THEME.vinylEdge;
  rCtx.lineWidth = 2;
  rCtx.stroke();

  if (THEME.vinylShadowRing !== 'none') {
    rCtx.beginPath();
    rCtx.arc(CX, CY, R - 5, 0, Math.PI * 2);
    rCtx.strokeStyle = THEME.vinylShadowRing;
    rCtx.lineWidth = Math.max(4, R * 0.02);
    rCtx.stroke();
  }

  drawGrooves(CX, CY, R, angle);
  if (THEME.vinylStyle === 'splatter') drawSplatter(CX, CY, R, angle);

  rCtx.save();
  rCtx.translate(CX, CY);
  rCtx.rotate(angle);
  const sg = rCtx.createLinearGradient(-R, 0, R, 0);
  const halfSheen = THEME.vinylSheenWidth / 2;
  sg.addColorStop(0, 'rgba(255,255,255,0)');
  sg.addColorStop(Math.max(0, 0.5 - halfSheen), 'rgba(255,255,255,0)');
  sg.addColorStop(0.5, `rgba(255,255,255,${THEME.vinylSheen})`);
  sg.addColorStop(Math.min(1, 0.5 + halfSheen), 'rgba(255,255,255,0)');
  sg.addColorStop(1, 'rgba(255,255,255,0)');
  rCtx.beginPath();
  rCtx.arc(0, 0, R - 1, 0, Math.PI * 2);
  rCtx.fillStyle = sg;
  rCtx.fill();
  rCtx.restore();

  const lR = R * THEME.labelRadius;
  rCtx.save();
  rCtx.translate(CX, CY);
  rCtx.rotate(angle);

  const lg = rCtx.createRadialGradient(-lR * 0.15, -lR * 0.15, 0, 0, 0, lR);
  lg.addColorStop(0, THEME.labelStop0);
  lg.addColorStop(0.55, THEME.labelStop55);
  lg.addColorStop(1, THEME.labelStop100);
  rCtx.beginPath();
  rCtx.arc(0, 0, lR, 0, Math.PI * 2);
  rCtx.fillStyle = window._labelImage ? THEME.labelArtBase : lg;
  rCtx.fill();
  rCtx.strokeStyle = THEME.labelStroke;
  rCtx.lineWidth = 0.8;
  rCtx.stroke();

  for (const fr of [0.36, 0.56, 0.78]) {
    rCtx.beginPath();
    rCtx.arc(0, 0, lR * fr, 0, Math.PI * 2);
    rCtx.strokeStyle = THEME.labelRing;
    rCtx.lineWidth = 0.5;
    rCtx.stroke();
  }

  rCtx.rotate(-angle);

  if (window._labelImage) {
    rCtx.save();
    rCtx.beginPath();
    rCtx.arc(0, 0, lR, 0, Math.PI * 2);
    rCtx.clip();
    rCtx.drawImage(window._labelImage, -lR, -lR, lR * 2, lR * 2);
    rCtx.restore();
  }

  rCtx.beginPath();
  rCtx.arc(0, 0, R * THEME.labelHoleRadius, 0, Math.PI * 2);
  rCtx.fillStyle = THEME.labelHoleFill;
  rCtx.fill();
  rCtx.restore();

  if (!hasFile) {
    const nr = R * 0.55;
    const ph = 0.38 + 0.22 * Math.sin(Date.now() * 0.0028);
    rCtx.save();
    rCtx.globalAlpha = ph;
    rCtx.beginPath();
    rCtx.arc(CX, CY, nr, 0, Math.PI * 2);
    rCtx.strokeStyle = THEME.hintRing;
    rCtx.lineWidth = 1.5;
    rCtx.setLineDash([5, 7]);
    rCtx.stroke();
    rCtx.setLineDash([]);
    const tx = CX + nr * Math.cos(-1.1);
    const ty = CY + nr * Math.sin(-1.1);
    rCtx.globalAlpha = ph * 0.9;
    rCtx.beginPath();
    rCtx.arc(tx, ty, 5, 0, Math.PI * 2);
    rCtx.fillStyle = THEME.hintDot;
    rCtx.fill();
    rCtx.globalAlpha = ph * 0.3;
    rCtx.beginPath();
    rCtx.arc(tx, ty, 12, 0, Math.PI * 2);
    rCtx.fillStyle = THEME.hintGlow;
    rCtx.fill();
    rCtx.globalAlpha = ph * 0.8;
    rCtx.font = `700 ${Math.round(R * 0.04)}px Space Mono,monospace`;
    rCtx.fillStyle = THEME.hintText;
    rCtx.textAlign = 'center';
    rCtx.textBaseline = 'middle';
    rCtx.fillText('load a record', CX, CY + R * 0.38);
    rCtx.globalAlpha = 1;
    rCtx.restore();
  }

  rCtx.restore();
}

// ─── draw: tonearm ─────────────────────────────────────────
function drawDefaultArm(angle) {
  aCtx.clearRect(0, 0, VW, VH);

  const ARM_LEN = GEO.ARM_LEN;
  const r = toRad(angle);
  const tipX = PIV_X + Math.cos(r) * ARM_LEN;
  const tipY = PIV_Y + Math.sin(r) * ARM_LEN;

  const shellLen = ARM_LEN * THEME.headshellLength;
  const shellBend = toRad(THEME.headshellBendDeg);
  const frontAngle = THEME.armStyle === 'straight' ? r : r + shellBend;
  const shX = tipX + Math.cos(frontAngle) * shellLen;
  const shY = tipY + Math.sin(frontAngle) * shellLen;

  const cwLen = ARM_LEN * THEME.cwOffset;
  const cwX = PIV_X + Math.cos(r + Math.PI) * cwLen;
  const cwY = PIV_Y + Math.sin(r + Math.PI) * cwLen;

  const tubeWidth = Math.max(4, ARM_LEN * THEME.armTubeWidth);
  const headshellWidth = Math.max(3, ARM_LEN * THEME.headshellWidth);
  const cwR = Math.max(7, ARM_LEN * THEME.cwRadius);
  const pivR = Math.max(7, ARM_LEN * THEME.pivotRadius);

  aCtx.save();
  aCtx.shadowColor = 'rgba(0,0,0,0.55)';
  aCtx.shadowBlur = THEME.armShadowBlur;
  aCtx.shadowOffsetY = THEME.armShadowOffsetY;

  const ag = aCtx.createLinearGradient(cwX, cwY, tipX, tipY);
  ag.addColorStop(0, THEME.armColor0);
  ag.addColorStop(0.25, THEME.armColor25);
  ag.addColorStop(0.6, THEME.armColor60);
  ag.addColorStop(1, THEME.armColor100);

  aCtx.beginPath();
  aCtx.moveTo(cwX, cwY);
  if (THEME.armStyle === 'chunky') {
    const midX = PIV_X + Math.cos(r) * ARM_LEN * 0.55;
    const midY = PIV_Y + Math.sin(r) * ARM_LEN * 0.55;
    aCtx.quadraticCurveTo(midX, midY, tipX, tipY);
  } else {
    aCtx.lineTo(tipX, tipY);
  }
  aCtx.strokeStyle = ag;
  aCtx.lineWidth = THEME.armStyle === 'chunky' ? tubeWidth * 1.2 : tubeWidth;
  aCtx.lineCap = 'round';
  aCtx.stroke();

  aCtx.beginPath();
  aCtx.moveTo(cwX, cwY);
  aCtx.lineTo(tipX, tipY);
  aCtx.strokeStyle = `rgba(255,255,255,${THEME.armHighlightAlpha})`;
  aCtx.lineWidth = Math.max(1.5, tubeWidth * 0.22);
  aCtx.stroke();

  aCtx.shadowBlur = 6;
  if (THEME.armStyle === 'straight') {
    aCtx.save();
    aCtx.translate(cwX, cwY);
    aCtx.rotate(r);
    aCtx.fillStyle = THEME.cwColor55;
    aCtx.strokeStyle = 'rgba(255,255,255,0.08)';
    aCtx.lineWidth = 0.8;
    aCtx.beginPath();
    aCtx.roundRect(-cwR * 1.3, -cwR * 0.8, cwR * 2.1, cwR * 1.6, cwR * 0.45);
    aCtx.fill();
    aCtx.stroke();
    aCtx.restore();
  } else {
    const cg = aCtx.createRadialGradient(cwX - 2, cwY - 2, 1, cwX, cwY, cwR);
    cg.addColorStop(0, THEME.cwColor0);
    cg.addColorStop(0.55, THEME.cwColor55);
    cg.addColorStop(1, THEME.cwColor100);
    aCtx.beginPath();
    aCtx.arc(cwX, cwY, cwR, 0, Math.PI * 2);
    aCtx.fillStyle = cg;
    aCtx.fill();
    aCtx.strokeStyle = 'rgba(255,255,255,0.07)';
    aCtx.lineWidth = 0.8;
    aCtx.stroke();
  }

  aCtx.beginPath();
  aCtx.moveTo(tipX, tipY);
  aCtx.lineTo(shX, shY);
  aCtx.strokeStyle = THEME.headshell;
  aCtx.lineWidth = THEME.armStyle === 'chunky' ? headshellWidth * 1.35 : headshellWidth;
  aCtx.lineCap = 'round';
  aCtx.stroke();

  if (THEME.armStyle === 'chunky') {
    const finAngle = frontAngle + Math.PI / 2;
    aCtx.beginPath();
    aCtx.moveTo(shX, shY);
    aCtx.lineTo(shX + Math.cos(finAngle) * headshellWidth * 0.8, shY + Math.sin(finAngle) * headshellWidth * 0.8);
    aCtx.strokeStyle = THEME.headshell;
    aCtx.lineWidth = Math.max(2, headshellWidth * 0.45);
    aCtx.stroke();
  }

  const needleLen = shellLen * THEME.needleLength;
  const needleAngle = frontAngle + Math.PI / 2;
  const nx = shX + Math.cos(needleAngle) * needleLen;
  const ny = shY + Math.sin(needleAngle) * needleLen;
  aCtx.beginPath();
  aCtx.moveTo(shX, shY);
  aCtx.lineTo(nx, ny);
  aCtx.strokeStyle = THEME.needle;
  aCtx.lineWidth = THEME.needleWidth;
  aCtx.stroke();

  aCtx.beginPath();
  aCtx.arc(nx, ny, Math.max(2.5, ARM_LEN * 0.007), 0, Math.PI * 2);
  aCtx.fillStyle = THEME.needleTip;
  aCtx.fill();

  const pg = aCtx.createRadialGradient(PIV_X - 3, PIV_Y - 3, 1, PIV_X, PIV_Y, pivR);
  pg.addColorStop(0, THEME.pivotColor0);
  pg.addColorStop(0.5, THEME.pivotColor50);
  pg.addColorStop(1, THEME.pivotColor100);
  aCtx.beginPath();
  aCtx.arc(PIV_X, PIV_Y, pivR, 0, Math.PI * 2);
  aCtx.fillStyle = pg;
  aCtx.fill();
  aCtx.strokeStyle = 'rgba(255,255,255,0.15)';
  aCtx.lineWidth = 1;
  aCtx.stroke();

  aCtx.beginPath();
  aCtx.arc(PIV_X, PIV_Y, pivR * THEME.pivotInnerRadius, 0, Math.PI * 2);
  aCtx.fillStyle = 'rgba(0,0,0,0.65)';
  aCtx.fill();

  aCtx.restore();
}

function drawRecord(angle) {
  if (ACTIVE_THEME_MODULE && typeof ACTIVE_THEME_MODULE.drawRecord === 'function') {
    ACTIVE_THEME_MODULE.drawRecord({
      angle,
      theme: THEME,
      geo: GEO,
      record: { radius: REC_R, cx: REC_CX, cy: REC_CY },
      ctx: rCtx,
      canvas: rCv,
      state: { hasFile, groovePulse, labelImage: window._labelImage },
      defaults: { drawRecord: drawDefaultRecord },
      helpers: { toRad }
    });
    return;
  }
  drawDefaultRecord(angle);
}

function drawArm(angle) {
  if (ACTIVE_THEME_MODULE && typeof ACTIVE_THEME_MODULE.drawArm === 'function') {
    ACTIVE_THEME_MODULE.drawArm({
      angle,
      theme: THEME,
      geo: GEO,
      pivot: { x: PIV_X, y: PIV_Y },
      viewport: { width: VW, height: VH },
      ctx: aCtx,
      canvas: aCv,
      defaults: { drawArm: drawDefaultArm },
      helpers: { toRad }
    });
    return;
  }
  drawDefaultArm(angle);
}
