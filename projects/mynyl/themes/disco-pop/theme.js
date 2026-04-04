window.MYNYL_THEME_MODULES = window.MYNYL_THEME_MODULES || {};

window.MYNYL_THEME_MODULES["disco-pop"] = {
  drawRecord({ angle, theme, record, ctx, state, defaults }) {
    defaults.drawRecord(angle);

    const { cx, cy, radius } = record;
    const now = performance.now() / 1000;
    const isPlaying = !!(state && state.playing);
    const groovePulse = Math.max(0, Math.min(1, state && typeof state.groovePulse === "number" ? state.groovePulse : 0));
    const spin = angle;

    const barCount = 96;
    const innerBase = radius * 1.045;
    const baseThickness = radius * 0.045;
    const maxLift = radius * 0.1;
    const baseWidth = Math.max(2.2, radius * 0.011);
    const pulse = isPlaying ? 1 : 0.45;
    const spinCycle = spin / (Math.PI * 2);
    const beat = now * 0.6 + spinCycle;
    const energy = Math.min(1, groovePulse * 1.7 + (isPlaying ? 0.18 : 0));

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(spin);

    for (let i = 0; i < barCount; i++) {
      const t = i / barCount;
      const a = t * Math.PI * 2;
      const zoneA = Math.max(0, Math.sin(beat * Math.PI * 2 + t * 9)) ** 2;
      const zoneB = Math.max(0, Math.sin(beat * Math.PI * 2.7 - t * 13)) ** 2 * 0.62;
      const zoneC = Math.abs(Math.sin(now * 2.4 + spinCycle * Math.PI * 2 + t * 18)) * 0.34;
      const shimmer = 0.08 + Math.abs(Math.sin(now * 1.8 + t * 16 + spinCycle * Math.PI)) * 0.12;
      const amp = Math.min(1, shimmer + pulse * (zoneA * 0.65 + zoneB * 0.35 + zoneC * 0.35) + groovePulse * 0.9);

      const startR = innerBase + baseThickness * (0.15 + zoneB * 0.45);
      const endR = startR + radius * 0.02 + maxLift * amp;
      const hue = (310 + t * 180 + spinCycle * 180 + now * 8 + groovePulse * 30) % 360;
      const alpha = 0.3 + amp * 0.58;

      ctx.save();
      ctx.rotate(a);

      ctx.beginPath();
      ctx.moveTo(0, -startR);
      ctx.lineTo(0, -endR);
      ctx.strokeStyle = `hsla(${hue}, 100%, ${58 + amp * 16}%, ${alpha})`;
      ctx.lineWidth = baseWidth * (0.8 + amp * 1.15);
      ctx.lineCap = "round";
      ctx.shadowBlur = radius * (0.035 + amp * 0.08);
      ctx.shadowColor = `hsla(${hue}, 100%, 68%, ${0.42 + amp * 0.25})`;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, -startR);
      ctx.lineTo(0, -endR - radius * (0.004 + amp * 0.009));
      ctx.strokeStyle = `hsla(${(hue + 28) % 360}, 100%, 76%, ${alpha * 0.32})`;
      ctx.lineWidth = baseWidth * (2.2 + amp * 1.8);
      ctx.lineCap = "round";
      ctx.shadowBlur = 0;
      ctx.stroke();

      ctx.restore();
    }

    const orbitR = radius * (1.12 + groovePulse * 0.02);
    const orbitWidth = radius * 0.018;
    const orbitGradient = ctx.createConicGradient(spin - Math.PI / 2, 0, 0);
    orbitGradient.addColorStop(0, "hsla(318, 100%, 62%, 0.06)");
    orbitGradient.addColorStop(0.2, "hsla(340, 100%, 68%, 0.72)");
    orbitGradient.addColorStop(0.45, "hsla(188, 100%, 66%, 0.82)");
    orbitGradient.addColorStop(0.7, "hsla(54, 100%, 68%, 0.78)");
    orbitGradient.addColorStop(1, "hsla(318, 100%, 62%, 0.06)");

    ctx.beginPath();
    ctx.arc(0, 0, orbitR, 0, Math.PI * 2);
    ctx.strokeStyle = orbitGradient;
    ctx.lineWidth = orbitWidth;
    ctx.shadowBlur = radius * 0.08;
    ctx.shadowColor = "rgba(255, 90, 220, 0.5)";
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.19, 0, Math.PI * 2);
    ctx.strokeStyle = `hsla(${(spinCycle * 220 + now * 10 + 180) % 360}, 100%, 72%, ${0.13 + groovePulse * 0.24})`;
    ctx.lineWidth = Math.max(1.5, radius * 0.007);
    ctx.shadowBlur = radius * 0.04;
    ctx.shadowColor = "rgba(90, 220, 255, 0.45)";
    ctx.stroke();

    for (let i = 0; i < 8; i++) {
      const sparkleAngle = spin * 1.08 + now * 0.2 + i * (Math.PI * 2 / 8);
      const sparkleR = radius * (1.12 + (i % 2) * 0.05 + groovePulse * 0.015);
      const x = Math.cos(sparkleAngle) * sparkleR;
      const y = Math.sin(sparkleAngle) * sparkleR;
      const sparkleSize = radius * (0.012 + ((i + 1) % 3) * 0.004 + groovePulse * 0.005);

      ctx.beginPath();
      ctx.arc(x, y, sparkleSize, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0
        ? `rgba(255, 238, 120, ${0.22 + groovePulse * 0.24})`
        : `rgba(120, 245, 255, ${0.16 + groovePulse * 0.22})`;
      ctx.shadowBlur = radius * 0.04;
      ctx.shadowColor = i % 2 === 0 ? "rgba(255, 220, 90, 0.45)" : "rgba(120, 245, 255, 0.38)";
      ctx.fill();
    }

    ctx.restore();
  }
};
