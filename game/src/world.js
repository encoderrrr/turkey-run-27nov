// Gobble Run — the farmyard itself: dusk sky, barn, fences and trees, plus
// every obstacle and pickup the turkey meets on the way to the forest.
// Spawning is seeded, so the same seed grows the same run.

import { GROUND_Y, PALETTE, VIEW_H, VIEW_W, stageForDistance } from './config.js';
import { makeRandom } from './random.js';

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

// One obstacle or pickup on the track. kind: fence | hay | pumpkin | oven |
// knife | corn | feather. Obstacles carry the rectangle the turkey must
// clear; knives fly at head height and are ducked under, not jumped.
export class Obstacle {
  constructor(kind, x, seed) {
    this.kind = kind;
    this.x = x;
    this.seed = seed;
    this.passed = false;
    this.hit = false;
    this.phase = seed * Math.PI * 2;
    if (kind === 'fence') { this.w = 46; this.h = 74; }
    else if (kind === 'hay') { this.w = 74; this.h = 62; }
    else if (kind === 'pumpkin') { this.w = 56; this.h = 42; }
    else if (kind === 'oven') { this.w = 110; this.h = 132; }
    else if (kind === 'knife') { this.w = 96; this.h = 26; }
    else if (kind === 'corn') { this.w = 34; this.h = 44; }
    else { this.w = 30; this.h = 30; } // feather
  }

  get y() {
    if (this.kind === 'knife') return GROUND_Y - 118;
    if (this.kind === 'corn') return GROUND_Y - 96 - Math.sin(this.phase) * 8;
    if (this.kind === 'feather') return GROUND_Y - 150 - Math.sin(this.phase * 1.4) * 10;
    return GROUND_Y - this.h;
  }

  get rect() {
    if (this.kind === 'knife') {
      // The blade is the danger; the handle end is safe to touch.
      return { x: this.x + 18, y: this.y + 4, w: this.w - 18, h: this.h - 8 };
    }
    return { x: this.x + 4, y: this.y + 4, w: this.w - 8, h: this.h - 4 };
  }

  get isPickup() {
    return this.kind === 'corn' || this.kind === 'feather';
  }
}

export class World {
  constructor(seed) {
    this.seed = seed;
    this.random = null;
    this.obstacles = [];
    this.particles = [];
    this.leaves = [];
    this.nextSpawnX = 900;
    this.distance = 0;
    this.spawnedOven = false;
    this.spawnedKnife = false;
    this.reset(seed);
  }

  reset(seed) {
    this.random = makeRandom(seed);
    this.obstacles = [];
    this.particles = [];
    this.distance = 0;
    this.nextSpawnX = 980;
    this.spawnedOven = false;
    this.spawnedKnife = false;
    this.leaves = [];
    for (let i = 0; i < 26; i++) {
      this.leaves.push({
        x: this.random.range(0, VIEW_W),
        y: this.random.range(0, 420),
        size: this.random.range(5, 11),
        speed: this.random.range(14, 42),
        sway: this.random.range(0.6, 1.8),
        phase: this.random.range(0, Math.PI * 2),
        color: this.random.pick([PALETTE.leafOrange, PALETTE.leafRed, PALETTE.leafGold]),
      });
    }
  }

  stage() {
    return stageForDistance(this.distance);
  }

  // Grow the track ahead of the turkey as it runs.
  spawnAhead(scrollX) {
    const stage = this.stage();
    while (this.nextSpawnX < scrollX + VIEW_W + 500) {
      const kind = this.random.pick(stage.obstacles);
      const obstacle = new Obstacle(kind, this.nextSpawnX, this.random.next());
      this.obstacles.push(obstacle);
      if (kind === 'oven') this.spawnedOven = true;
      if (kind === 'knife') this.spawnedKnife = true;
      // A corn cob often trails a low obstacle as a reward for the jump.
      if ((kind === 'fence' || kind === 'hay') && this.random.chance(0.55)) {
        this.obstacles.push(new Obstacle('corn', this.nextSpawnX + 130, this.random.next()));
      }
      if (this.random.chance(0.06)) {
        this.obstacles.push(new Obstacle('feather', this.nextSpawnX + 260, this.random.next()));
      }
      this.nextSpawnX += this.random.range(stage.gapMin, stage.gapMax) + obstacle.w;
    }
  }

  update(dt, speed, turkeyX) {
    this.distance += (speed * dt) / 26; // about 26 px per metre
    this.spawnAhead(turkeyX + 900);
    const dx = speed * dt;
    for (const obstacle of this.obstacles) obstacle.x -= dx;
    this.obstacles = this.obstacles.filter((o) => o.x + o.w > -80);
    for (const leaf of this.leaves) {
      leaf.x -= dx * 0.12 + leaf.speed * dt * 0.4;
      leaf.y += leaf.speed * dt;
      leaf.phase += dt * leaf.sway;
      if (leaf.y > VIEW_H) { leaf.y = -12; leaf.x = this.random.range(0, VIEW_W); }
      if (leaf.x < -20) leaf.x = VIEW_W + 10;
    }
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.vy -= 12 * dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  burst(x, y, color, count, speed = 120) {
    for (let i = 0; i < count; i++) {
      const angle = this.random.range(0, Math.PI * 2);
      const v = this.random.range(speed * 0.3, speed);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v - 60,
        life: this.random.range(0.3, 0.8),
        size: this.random.range(3, 7),
        color,
      });
    }
  }

  ovenSmoke(x, y) {
    this.particles.push({
      x: x + this.random.range(-6, 6), y,
      vx: this.random.range(-8, 8), vy: -46,
      life: this.random.range(0.8, 1.4),
      size: this.random.range(8, 16),
      color: 'rgba(200,200,210,0.35)',
    });
  }

  drawSky(ctx, time) {
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    sky.addColorStop(0, PALETTE.skyTop);
    sky.addColorStop(0.55, PALETTE.skyMid);
    sky.addColorStop(1, PALETTE.skyLow);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, VIEW_W, GROUND_Y + 2);
    // Low autumn sun, sinking behind the hills.
    const sunX = 980;
    const sunY = 430 + Math.sin(time * 0.1) * 2;
    const glow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 180);
    glow.addColorStop(0, 'rgba(255, 200, 90, 0.9)');
    glow.addColorStop(0.4, 'rgba(255, 140, 50, 0.45)');
    glow.addColorStop(1, 'rgba(255, 140, 50, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(sunX - 180, sunY - 180, 360, 360);
    ctx.fillStyle = PALETTE.sunCore;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 52, 0, Math.PI * 2);
    ctx.fill();
    // Drifting clouds.
    ctx.fillStyle = 'rgba(255, 190, 150, 0.25)';
    for (let i = 0; i < 4; i++) {
      const cx = ((i * 340 + time * 6) % (VIEW_W + 300)) - 150;
      const cy = 70 + i * 46;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 90, 18, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 50, cy + 8, 60, 14, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawHills(ctx, scrollX) {
    ctx.fillStyle = PALETTE.hillFar;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    for (let x = 0; x <= VIEW_W; x += 40) {
      const wx = x + scrollX * 0.15;
      ctx.lineTo(x, GROUND_Y - 90 - Math.sin(wx * 0.004) * 46 - Math.sin(wx * 0.011) * 18);
    }
    ctx.lineTo(VIEW_W, GROUND_Y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.hillNear;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    for (let x = 0; x <= VIEW_W; x += 40) {
      const wx = x + scrollX * 0.3;
      ctx.lineTo(x, GROUND_Y - 44 - Math.sin(wx * 0.006 + 2) * 26);
    }
    ctx.lineTo(VIEW_W, GROUND_Y);
    ctx.closePath();
    ctx.fill();
  }

  drawBarn(ctx, scrollX) {
    // The red barn the turkey is fleeing, sliding away behind it.
    const bx = 90 - (scrollX * 0.55) % 2600;
    if (bx < -320) return;
    const by = GROUND_Y - 210;
    ctx.fillStyle = PALETTE.barnRed;
    ctx.fillRect(bx, by, 240, 210);
    ctx.fillStyle = PALETTE.barnDark;
    ctx.beginPath();
    ctx.moveTo(bx - 14, by);
    ctx.lineTo(bx + 120, by - 74);
    ctx.lineTo(bx + 254, by);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#f2ede2';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(bx + 96, by + 210);
    ctx.lineTo(bx + 96, by + 110);
    ctx.lineTo(bx + 144, by + 110);
    ctx.lineTo(bx + 144, by + 210);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(242, 237, 226, 0.7)';
    ctx.lineWidth = 3;
    ctx.strokeRect(bx + 34, by + 40, 44, 44);
    ctx.strokeRect(bx + 162, by + 40, 44, 44);
    ctx.fillStyle = '#ffd97a';
    ctx.fillRect(bx + 34, by + 40, 44, 44);
    ctx.fillRect(bx + 162, by + 40, 44, 44);
  }

  drawGround(ctx, scrollX, stage) {
    ctx.fillStyle = stage.ground;
    ctx.fillRect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);
    ctx.fillStyle = PALETTE.groundTop;
    ctx.fillRect(0, GROUND_Y, VIEW_W, 10);
    // Fence posts and tufts rushing past.
    ctx.fillStyle = '#3a2412';
    const spacing = 130;
    const offset = -(scrollX % spacing);
    for (let x = offset; x < VIEW_W; x += spacing) {
      ctx.fillRect(x, GROUND_Y - 8, 8, 8);
      ctx.fillRect(x + 60, GROUND_Y - 4, 5, 5);
    }
    ctx.fillStyle = PALETTE.grass;
    for (let x = offset + 30; x < VIEW_W; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y);
      ctx.lineTo(x + 4, GROUND_Y - 14);
      ctx.lineTo(x + 8, GROUND_Y);
      ctx.fill();
    }
  }

  drawObstacle(ctx, obstacle, time) {
    const { x } = obstacle;
    const y = obstacle.y;
    if (obstacle.kind === 'fence') {
      ctx.fillStyle = '#7a4a22';
      ctx.fillRect(x + 4, y + 8, 8, obstacle.h - 8);
      ctx.fillRect(x + obstacle.w - 12, y + 8, 8, obstacle.h - 8);
      ctx.fillStyle = '#9a6232';
      ctx.fillRect(x, y, obstacle.w, 12);
      ctx.fillRect(x, y + 30, obstacle.w, 10);
      ctx.fillStyle = '#6b4423';
      ctx.fillRect(x + 4, y - 8, 8, 8);
      ctx.fillRect(x + obstacle.w - 12, y - 8, 8, 8);
    } else if (obstacle.kind === 'hay') {
      ctx.fillStyle = '#d8a03a';
      ctx.beginPath();
      ctx.ellipse(x + obstacle.w / 2, y + obstacle.h / 2, 38, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#a87a1a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(x + obstacle.w / 2, y + obstacle.h / 2, 28, 20, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(x + obstacle.w / 2, y + obstacle.h / 2, 16, 10, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (obstacle.kind === 'pumpkin') {
      ctx.fillStyle = '#e07b2a';
      ctx.beginPath();
      ctx.ellipse(x + 28, y + 24, 26, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c25e14';
      ctx.beginPath();
      ctx.ellipse(x + 28, y + 24, 18, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e07b2a';
      ctx.beginPath();
      ctx.ellipse(x + 28, y + 24, 9, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a6b1a';
      ctx.fillRect(x + 24, y - 6, 8, 10);
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.moveTo(x + 14, y + 16);
      ctx.lineTo(x + 20, y + 22);
      ctx.lineTo(x + 26, y + 16);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + 30, y + 16);
      ctx.lineTo(x + 36, y + 22);
      ctx.lineTo(x + 42, y + 16);
      ctx.closePath();
      ctx.fill();
    } else if (obstacle.kind === 'oven') {
      // The dreaded oven: black iron, a glowing door, a smoking chimney.
      ctx.fillStyle = PALETTE.ovenBlack;
      roundRectPath(ctx, x, y, obstacle.w, obstacle.h, 8);
      ctx.fill();
      ctx.fillStyle = '#2e2e36';
      ctx.fillRect(x + 10, y + 8, 26, 44);
      ctx.fillStyle = '#3a3a44';
      ctx.fillRect(x + 74, y + 8, 26, 44);
      const flicker = 0.75 + Math.sin(time * 9 + obstacle.phase) * 0.25;
      ctx.fillStyle = `rgba(255, 122, 26, ${flicker})`;
      roundRectPath(ctx, x + 18, y + 62, obstacle.w - 36, 52, 6);
      ctx.fill();
      ctx.fillStyle = '#ffb35a';
      roundRectPath(ctx, x + 26, y + 70, obstacle.w - 52, 36, 4);
      ctx.fill();
      ctx.strokeStyle = '#55555e';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x + 10, y + 56);
      ctx.lineTo(x + obstacle.w - 10, y + 56);
      ctx.stroke();
      ctx.fillStyle = '#ff5a1a';
      ctx.beginPath();
      ctx.arc(x + 55, y - 12, 5 + Math.sin(time * 12) * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7a1a1a';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HOT!', x + obstacle.w / 2, y + 92);
    } else if (obstacle.kind === 'knife') {
      // A carving knife sailing at head height: duck under it.
      const bob = Math.sin(time * 6 + obstacle.phase) * 4;
      ctx.save();
      ctx.translate(x, y + bob);
      ctx.rotate(-0.08);
      ctx.fillStyle = PALETTE.knifeSteel;
      ctx.beginPath();
      ctx.moveTo(18, 4);
      ctx.lineTo(86, 2);
      ctx.lineTo(96, 10);
      ctx.lineTo(86, 20);
      ctx.lineTo(18, 20);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = PALETTE.knifeEdge;
      ctx.fillRect(18, 18, 68, 3);
      ctx.fillStyle = '#4a2c14';
      ctx.beginPath();
      ctx.roundRect(0, 6, 20, 12, 4);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(34, 5, 40, 2);
      ctx.restore();
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = 'rgba(26, 12, 4, 0.9)';
      ctx.lineWidth = 4;
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeText('DUCK!', x + obstacle.w / 2, y - 14 + bob);
      ctx.fillText('DUCK!', x + obstacle.w / 2, y - 14 + bob);
    } else if (obstacle.kind === 'corn') {
      const bobY = y + Math.sin(time * 4 + obstacle.phase) * 5;
      ctx.fillStyle = '#f2c234';
      ctx.beginPath();
      ctx.ellipse(x + 17, bobY + 18, 11, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c98a1a';
      for (let row = 0; row < 3; row++) {
        ctx.fillRect(x + 8, bobY + 8 + row * 10, 18, 2);
      }
      ctx.fillStyle = '#3a9a2a';
      ctx.beginPath();
      ctx.moveTo(x + 17, bobY + 36);
      ctx.lineTo(x + 4, bobY + 48);
      ctx.lineTo(x + 30, bobY + 48);
      ctx.closePath();
      ctx.fill();
    } else if (obstacle.kind === 'feather') {
      const bobY = y + Math.sin(time * 3 + obstacle.phase) * 6;
      ctx.save();
      ctx.translate(x + 15, bobY + 15);
      ctx.rotate(Math.sin(time * 2 + obstacle.phase) * 0.2);
      ctx.fillStyle = '#ffd97a';
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c98a1a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(0, 16);
      ctx.stroke();
      ctx.restore();
    }
  }

  draw(ctx, scrollX, time, stage) {
    this.drawSky(ctx, time);
    this.drawHills(ctx, scrollX);
    this.drawBarn(ctx, scrollX);
    this.drawGround(ctx, scrollX, stage);
    for (const leaf of this.leaves) {
      ctx.save();
      ctx.translate(leaf.x + Math.sin(leaf.phase) * 14, leaf.y);
      ctx.rotate(leaf.phase);
      ctx.fillStyle = leaf.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, leaf.size, leaf.size * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    for (const obstacle of this.obstacles) this.drawObstacle(ctx, obstacle, time);
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
