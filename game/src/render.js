// Gobble Run — everything drawn on top of the farmyard: the HUD with score,
// distance, lives and the farmer's closing gap, plus the title screen and
// the two end screens (escaped, and caught) with their restart prompts.

import { ESCAPE_DISTANCE, GROUND_Y, PALETTE, VIEW_H, VIEW_W } from './config.js';

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(26, 12, 4, 0.72)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 211, 122, 0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function heart(ctx, x, y, size, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 16, size / 16);
  ctx.fillStyle = filled ? '#e23b3b' : 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.moveTo(0, 5);
  ctx.bezierCurveTo(-11, -4, -6, -12, 0, -6);
  ctx.bezierCurveTo(6, -12, 11, -4, 0, 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Score, distance to safety, lives, and how close the farmer is behind.
export function drawHud(ctx, game) {
  const { score, distance, lives, farmerGap, stage, speed } = game;
  panel(ctx, 16, 14, 330, 92);
  ctx.fillStyle = PALETTE.hudCream;
  ctx.textAlign = 'left';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(`SCORE ${Math.floor(score)}`, 32, 46);
  ctx.font = '20px sans-serif';
  ctx.fillStyle = '#ffd97a';
  const left = Math.max(0, Math.ceil(ESCAPE_DISTANCE - distance));
  ctx.fillText(`🦃 ${left} m to the forest`, 32, 76);
  ctx.fillText(`STAGE: ${stage.name}`, 32, 98);

  panel(ctx, VIEW_W - 306, 14, 290, 92);
  ctx.fillStyle = PALETTE.hudCream;
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('LIVES', VIEW_W - 290, 40);
  for (let i = 0; i < 3; i++) heart(ctx, VIEW_W - 252 + i * 34, 52, 18, i < lives);
  ctx.font = '16px sans-serif';
  ctx.fillStyle = '#ffb35a';
  ctx.fillText(`SPEED ${Math.round(speed)}`, VIEW_W - 290, 92);

  // The farmer meter: a little bar showing the chase at the bottom.
  panel(ctx, VIEW_W / 2 - 210, VIEW_H - 52, 420, 34);
  ctx.fillStyle = '#ffd97a';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('FARMER', VIEW_W / 2 - 196, VIEW_H - 30);
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.beginPath();
  ctx.roundRect(VIEW_W / 2 - 118, VIEW_H - 40, 240, 12, 6);
  ctx.fill();
  const threat = Math.min(1, Math.max(0, farmerGap));
  ctx.fillStyle = threat > 0.7 ? '#e23b3b' : '#ff9a3d';
  ctx.beginPath();
  ctx.roundRect(VIEW_W / 2 - 118, VIEW_H - 40, 240 * threat, 12, 6);
  ctx.fill();
  ctx.fillStyle = PALETTE.hudCream;
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('🦃', VIEW_W / 2 + 132, VIEW_H - 28);
  ctx.textAlign = 'left';
}

export function drawStageBanner(ctx, stageName, alpha) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(26, 12, 4, 0.6)';
  ctx.fillRect(0, 250, VIEW_W, 84);
  ctx.fillStyle = PALETTE.hudCream;
  ctx.textAlign = 'center';
  ctx.font = 'bold 44px sans-serif';
  ctx.fillText(stageName, VIEW_W / 2, 306);
  ctx.restore();
}

export function drawTitle(ctx, time, bestScore) {
  ctx.fillStyle = 'rgba(20, 8, 30, 0.45)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.hudCream;
  ctx.font = 'bold 84px sans-serif';
  ctx.shadowColor = '#ff7a1a';
  ctx.shadowBlur = 26;
  ctx.fillText('GOBBLE RUN', VIEW_W / 2, 190);
  ctx.shadowBlur = 0;
  ctx.font = 'bold 34px sans-serif';
  ctx.fillStyle = '#ffd97a';
  ctx.fillText('The Great Thanksgiving Escape', VIEW_W / 2, 244);
  ctx.font = '22px sans-serif';
  ctx.fillStyle = PALETTE.hudCream;
  ctx.fillText('Farmer Barlow wants you for dinner. Run 1,200 m to the forest!', VIEW_W / 2, 300);
  ctx.fillText('Jump the fences, hay bales and the HOT oven — duck the carving knives!', VIEW_W / 2, 334);
  ctx.fillText('Grab corn for points. Three stumbles and the farmer catches you.', VIEW_W / 2, 368);

  const pulse = 0.65 + Math.sin(time * 4) * 0.35;
  ctx.globalAlpha = pulse;
  ctx.font = 'bold 32px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('▶  PRESS SPACE OR CLICK TO RUN', VIEW_W / 2, 470);
  ctx.globalAlpha = 1;

  ctx.font = '19px sans-serif';
  ctx.fillStyle = '#e8d8b8';
  ctx.fillText('SPACE / ↑ / W — jump (twice for a double flap)      ↓ / S — duck under knives', VIEW_W / 2, 530);
  ctx.fillText('P — pause      M — mute', VIEW_W / 2, 560);
  if (bestScore > 0) {
    ctx.fillStyle = '#ffd97a';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`BEST SCORE: ${bestScore}`, VIEW_W / 2, 606);
  }
}

function endScreenBase(ctx, title, titleColor, lines) {
  ctx.fillStyle = 'rgba(20, 8, 30, 0.55)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = titleColor;
  ctx.font = 'bold 88px sans-serif';
  ctx.shadowColor = titleColor;
  ctx.shadowBlur = 24;
  ctx.fillText(title, VIEW_W / 2, 230);
  ctx.shadowBlur = 0;
  ctx.fillStyle = PALETTE.hudCream;
  ctx.font = '28px sans-serif';
  lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, 300 + i * 42));
}

export function drawEscaped(ctx, game, time) {
  endScreenBase(ctx, 'ESCAPED!', '#8ad44a', [
    `You made it ${Math.round(game.distance)} m to the forest — Thanksgiving is cancelled!`,
    `FINAL SCORE: ${Math.round(game.score)}      CORN: ${game.cornCollected}      BEST: ${Math.round(game.bestScore)}`,
  ]);
  // Confetti leaves over the forest.
  for (let i = 0; i < 40; i++) {
    const x = (i * 137 + time * 60) % VIEW_W;
    const y = (i * 89 + time * 90) % 200;
    ctx.fillStyle = ['#e07b2a', '#f2b234', '#c23b2a', '#8ad44a'][i % 4];
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(time * 2 + i);
    ctx.fillRect(-5, -3, 10, 6);
    ctx.restore();
  }
  drawRestartPrompt(ctx, time);
}

export function drawCaught(ctx, game, time) {
  endScreenBase(ctx, 'CAUGHT!', '#ff5a3d', [
    'Farmer Barlow got you… the oven was already warming up.',
    `You ran ${Math.round(game.distance)} m of ${ESCAPE_DISTANCE} m.`,
    `FINAL SCORE: ${Math.round(game.score)}      CORN: ${game.cornCollected}      BEST: ${Math.round(game.bestScore)}`,
  ]);
  drawRestartPrompt(ctx, time);
}

function drawRestartPrompt(ctx, time) {
  const pulse = 0.65 + Math.sin(time * 4) * 0.35;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PRESS R OR CLICK TO RUN AGAIN', VIEW_W / 2, 500);
  ctx.restore();
}

export function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(20, 8, 30, 0.6)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = PALETTE.hudCream;
  ctx.textAlign = 'center';
  ctx.font = 'bold 64px sans-serif';
  ctx.fillText('PAUSED', VIEW_W / 2, 340);
  ctx.font = '24px sans-serif';
  ctx.fillText('Press P to keep running', VIEW_W / 2, 396);
}
