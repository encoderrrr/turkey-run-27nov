// Gobble Run — the hero: a plump brown turkey, drawn entirely in canvas
// vector shapes. Its tail fans when it runs, its wings flap on a jump, and
// it flattens into a low slide when it ducks under a flying carving knife.

import { PALETTE } from './config.js';

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

// The turkey's running legs, two quick steps that cycle with runPhase.
function drawTurkeyLegs(ctx, x, y, runPhase, ducking) {
  ctx.strokeStyle = PALETTE.wattleRed;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  if (ducking) {
    ctx.beginPath();
    ctx.moveTo(x - 8, y);
    ctx.lineTo(x - 26, y + 4);
    ctx.moveTo(x + 8, y);
    ctx.lineTo(x + 24, y + 4);
    ctx.stroke();
    return;
  }
  const swing = Math.sin(runPhase) * 14;
  const lift = Math.max(0, Math.cos(runPhase)) * 8;
  ctx.beginPath();
  ctx.moveTo(x - 10, y);
  ctx.lineTo(x - 10 + swing, y + 16 - lift);
  ctx.moveTo(x + 10, y);
  ctx.lineTo(x + 10 - swing, y + 16 - Math.max(0, -Math.cos(runPhase)) * 8);
  ctx.stroke();
}

// The famous tail fan: five feathers spread behind the bird.
function drawTailFan(ctx, x, y, runPhase, ducking) {
  const spread = ducking ? 0.35 : 0.62;
  for (let i = -2; i <= 2; i++) {
    const angle = -Math.PI / 2 + i * spread * 0.55 + Math.sin(runPhase * 0.5) * 0.03;
    const len = 52 - Math.abs(i) * 8;
    const tipX = x + Math.cos(angle) * len;
    const tipY = y + Math.sin(angle) * len;
    ctx.strokeStyle = i % 2 === 0 ? PALETTE.turkeyDark : PALETTE.turkeyBrown;
    ctx.lineWidth = 13;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();
    ctx.fillStyle = PALETTE.featherTip;
    ctx.beginPath();
    ctx.arc(tipX, tipY, 7, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawTurkey(ctx, x, y, pose) {
  const { runPhase = 0, airborne = false, ducking = false, invincible = false, facing = 1 } = pose;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);
  if (invincible && Math.floor(performance.now() / 120) % 2 === 0) ctx.globalAlpha = 0.45;

  const bodyY = ducking ? 6 : 0;
  const bodyRx = ducking ? 46 : 38;
  const bodyRy = ducking ? 22 : 30;

  drawTailFan(ctx, -30, -6 + bodyY, runPhase, ducking);
  drawTurkeyLegs(ctx, 0, 24 + bodyY, runPhase, ducking);

  // Body.
  ctx.fillStyle = PALETTE.turkeyBrown;
  ellipse(ctx, 0, bodyY, bodyRx, bodyRy);
  ctx.fillStyle = PALETTE.turkeyLight;
  ellipse(ctx, 8, bodyY + 6, 26, 18);

  // Wing, tucked while running, thrown up while airborne.
  const wingAngle = airborne ? -0.9 : -0.25 + Math.sin(runPhase) * 0.12;
  ctx.save();
  ctx.translate(-4, -4 + bodyY);
  ctx.rotate(wingAngle);
  ctx.fillStyle = PALETTE.turkeyDark;
  ctx.beginPath();
  ctx.ellipse(-12, 0, 20, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Neck and head, low and forward while ducking.
  const headX = ducking ? 34 : 30;
  const headY = ducking ? -12 + bodyY : -34 + bodyY;
  ctx.strokeStyle = PALETTE.turkeyBrown;
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(16, -12 + bodyY);
  ctx.lineTo(headX - 4, headY + 6);
  ctx.stroke();
  ctx.fillStyle = PALETTE.turkeyLight;
  ctx.beginPath();
  ctx.arc(headX, headY, 13, 0, Math.PI * 2);
  ctx.fill();

  // Beak, wattle and a worried eye.
  ctx.fillStyle = '#e8a13a';
  ctx.beginPath();
  ctx.moveTo(headX + 10, headY - 2);
  ctx.lineTo(headX + 26, headY + 3);
  ctx.lineTo(headX + 10, headY + 7);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.wattleRed;
  ctx.beginPath();
  ctx.ellipse(headX + 8, headY + 10, 4, 8, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(headX + 5, headY - 4, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(headX + 6, headY - 5, 1.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// A bigger, calmer turkey for the title screen, standing on the farmhouse lawn.
export function drawTitleTurkey(ctx, x, y, time) {
  const bob = Math.sin(time * 2) * 3;
  drawTurkey(ctx, x, y + bob, { runPhase: time * 2, airborne: false, ducking: false });
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(x, y + 44, 52, 8, 0, 0, Math.PI * 2);
  ctx.fill();
}
