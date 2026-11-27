// Gobble Run — the villain: Farmer Barlow, who wants the turkey for
// Thanksgiving dinner. He runs behind the bird with a pitchfork, red-faced
// and shouting, and closes in every time the turkey stumbles. Drawn in
// canvas vector shapes, like everything else in the game.

import { PALETTE } from './config.js';

// gap is 0..1: how close the farmer is to grabbing the turkey (1 = caught).
export function drawFarmer(ctx, x, y, runPhase, gap, shouting) {
  ctx.save();
  ctx.translate(x, y);
  if (gap > 0.75) ctx.translate(Math.sin(runPhase * 3) * 2, 0);

  const legSwing = Math.sin(runPhase) * 16;
  // Overalls legs.
  ctx.strokeStyle = PALETTE.farmerOveralls;
  ctx.lineWidth = 11;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-6, -52);
  ctx.lineTo(-6 + legSwing, 0);
  ctx.moveTo(6, -52);
  ctx.lineTo(6 - legSwing, 0);
  ctx.stroke();
  // Boots.
  ctx.fillStyle = '#3a2412';
  ctx.beginPath();
  ctx.ellipse(-6 + legSwing, 2, 12, 6, 0, 0, Math.PI * 2);
  ctx.ellipse(6 - legSwing, 2, 12, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Torso: checked shirt and overalls bib.
  ctx.fillStyle = PALETTE.farmerShirt;
  ctx.beginPath();
  ctx.roundRect(-20, -96, 40, 48, 8);
  ctx.fill();
  ctx.fillStyle = PALETTE.farmerOveralls;
  ctx.beginPath();
  ctx.roundRect(-14, -88, 28, 34, 5);
  ctx.fill();
  ctx.fillStyle = '#d8b25a';
  ctx.beginPath();
  ctx.arc(-8, -78, 3, 0, Math.PI * 2);
  ctx.arc(8, -78, 3, 0, Math.PI * 2);
  ctx.fill();

  // Arms: one pumping, one gripping the pitchfork.
  const armSwing = Math.sin(runPhase) * 12;
  ctx.strokeStyle = PALETTE.farmerShirt;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(-18, -88);
  ctx.lineTo(-30, -62 + armSwing);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(18, -88);
  ctx.lineTo(30, -66 - armSwing);
  ctx.stroke();

  // Pitchfork, held high and glinting.
  ctx.strokeStyle = '#8a6a3a';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(30, -66 - armSwing);
  ctx.lineTo(52, -128 - armSwing);
  ctx.stroke();
  ctx.strokeStyle = '#c8ccd2';
  ctx.lineWidth = 3;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(52 + i * 6, -128 - armSwing);
    ctx.lineTo(52 + i * 6, -146 - armSwing);
    ctx.stroke();
  }

  // Head: red cheeks, white beard, angry brows.
  ctx.fillStyle = '#e8b88a';
  ctx.beginPath();
  ctx.arc(0, -112, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f2ede2';
  ctx.beginPath();
  ctx.ellipse(0, -100, 13, 9, 0, 0, Math.PI);
  ctx.fill();
  ctx.fillStyle = '#c23b2a';
  ctx.beginPath();
  ctx.arc(-12, -108, 4, 0, Math.PI * 2);
  ctx.arc(12, -108, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#5a3a1a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-9, -122);
  ctx.lineTo(-2, -119);
  ctx.moveTo(9, -122);
  ctx.lineTo(2, -119);
  ctx.stroke();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(-5, -114, 2, 0, Math.PI * 2);
  ctx.arc(5, -114, 2, 0, Math.PI * 2);
  ctx.fill();
  // Open mouth when shouting.
  ctx.fillStyle = '#5a1a1a';
  ctx.beginPath();
  ctx.ellipse(0, -102, shouting ? 5 : 2.5, shouting ? 6 : 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Straw hat.
  ctx.fillStyle = PALETTE.farmerHat;
  ctx.beginPath();
  ctx.ellipse(0, -126, 26, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, -132, 14, 8, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#a03a28';
  ctx.fillRect(-14, -132, 28, 4);

  ctx.restore();
}
