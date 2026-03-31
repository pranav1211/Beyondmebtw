window.MYNYL_THEME_MODULES = window.MYNYL_THEME_MODULES || {};

window.MYNYL_THEME_MODULES['minimal-light'] = {
  drawArm({ angle, theme, geo, pivot, viewport, ctx, helpers }) {
    ctx.clearRect(0, 0, viewport.width, viewport.height);

    const r = helpers.toRad(angle);
    const armLen = geo.ARM_LEN;
    const tipX = pivot.x + Math.cos(r) * armLen;
    const tipY = pivot.y + Math.sin(r) * armLen;

    const rearLen = armLen * 0.14;
    const rearX = pivot.x + Math.cos(r + Math.PI) * rearLen;
    const rearY = pivot.y + Math.sin(r + Math.PI) * rearLen;

    const tubeWidth = Math.max(6, armLen * 0.015);
    const cartridgeLen = armLen * 0.14;
    const cartridgeWidth = Math.max(10, armLen * 0.022);
    const cartridgeCenterX = tipX + Math.cos(r) * cartridgeLen * 0.33;
    const cartridgeCenterY = tipY + Math.sin(r) * cartridgeLen * 0.33;
    const accentHeight = Math.max(3, cartridgeWidth * 0.28);
    const counterLen = armLen * 0.085;
    const counterWidth = Math.max(8, armLen * 0.024);
    const counterCenterX = rearX + Math.cos(r + Math.PI) * counterLen * 0.12;
    const counterCenterY = rearY + Math.sin(r + Math.PI) * counterLen * 0.12;

    ctx.save();
    ctx.shadowColor = 'rgba(90,106,123,0.18)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;

    const tube = ctx.createLinearGradient(rearX, rearY, tipX, tipY);
    tube.addColorStop(0, '#bdc7d0');
    tube.addColorStop(0.48, '#eef2f5');
    tube.addColorStop(1, '#ffffff');

    ctx.beginPath();
    ctx.moveTo(rearX, rearY);
    ctx.lineTo(tipX, tipY);
    ctx.strokeStyle = tube;
    ctx.lineWidth = tubeWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(rearX, rearY);
    ctx.lineTo(tipX, tipY);
    ctx.strokeStyle = 'rgba(255,255,255,0.72)';
    ctx.lineWidth = Math.max(1.6, tubeWidth * 0.22);
    ctx.stroke();

    ctx.save();
    ctx.translate(counterCenterX, counterCenterY);
    ctx.rotate(r);
    const counter = ctx.createLinearGradient(-counterLen * 0.5, 0, counterLen * 0.5, 0);
    counter.addColorStop(0, '#11151a');
    counter.addColorStop(0.2, '#d8e0e7');
    counter.addColorStop(0.8, '#f6f8fa');
    counter.addColorStop(1, '#8793a0');
    ctx.fillStyle = counter;
    ctx.strokeStyle = 'rgba(80,92,104,0.16)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.roundRect(-counterLen * 0.5, -counterWidth * 0.5, counterLen, counterWidth, counterWidth * 0.45);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(cartridgeCenterX, cartridgeCenterY);
    ctx.rotate(r);
    const cartridge = ctx.createLinearGradient(-cartridgeLen * 0.5, 0, cartridgeLen * 0.5, 0);
    cartridge.addColorStop(0, '#0f1317');
    cartridge.addColorStop(0.26, '#20262c');
    cartridge.addColorStop(0.26, '#edf2f6');
    cartridge.addColorStop(1, '#cdd7df');
    ctx.fillStyle = cartridge;
    ctx.strokeStyle = 'rgba(37,44,52,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(-cartridgeLen * 0.5, -cartridgeWidth * 0.5, cartridgeLen, cartridgeWidth, cartridgeWidth * 0.18);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#14181d';
    ctx.beginPath();
    ctx.roundRect(-cartridgeLen * 0.5, cartridgeWidth * 0.18, cartridgeLen * 0.46, accentHeight, accentHeight * 0.45);
    ctx.fill();
    ctx.restore();

    const needleAnchorX = tipX + Math.cos(r) * cartridgeLen * 0.1;
    const needleAnchorY = tipY + Math.sin(r) * cartridgeLen * 0.1;
    const needleAngle = r + Math.PI / 2;
    const needleLen = armLen * 0.055;
    const nx = needleAnchorX + Math.cos(needleAngle) * needleLen;
    const ny = needleAnchorY + Math.sin(needleAngle) * needleLen;
    ctx.beginPath();
    ctx.moveTo(needleAnchorX, needleAnchorY);
    ctx.lineTo(nx, ny);
    ctx.strokeStyle = 'rgba(67,77,88,0.78)';
    ctx.lineWidth = 1.1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(nx, ny, Math.max(2, armLen * 0.006), 0, Math.PI * 2);
    ctx.fillStyle = '#11151a';
    ctx.fill();

    const pivR = Math.max(8, armLen * theme.pivotRadius);
    const pg = ctx.createRadialGradient(pivot.x - 2, pivot.y - 2, 1, pivot.x, pivot.y, pivR);
    pg.addColorStop(0, '#ffffff');
    pg.addColorStop(0.52, '#e5ebf0');
    pg.addColorStop(1, '#bcc6d0');
    ctx.beginPath();
    ctx.arc(pivot.x, pivot.y, pivR, 0, Math.PI * 2);
    ctx.fillStyle = pg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.76)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(pivot.x, pivot.y, pivR * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#15191e';
    ctx.fill();

    ctx.restore();
  }
};
