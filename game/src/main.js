// Gobble Run — the game itself: state machine, loop, physics, collisions
// and the farmer's chase. The turkey auto-runs to the right; the player
// jumps and ducks. Three stumbles and the farmer catches the bird; 1,200 m
// and the turkey reaches the forest and escapes.
//
// Screenshot mode: ?shot=start|play|danger|escaped|caught&seed=N renders a
// fixed moment of the game (the run is simulated forward deterministically),
// so the screenshots are real renders of this code.

import {
  ESCAPE_DISTANCE, GROUND_Y, PHYSICS, START_LIVES, TURKEY_X,
  VIEW_H, VIEW_W, speedForDistance, stageForDistance,
} from './config.js';
import { SoundBank } from './audio.js';
import { Input } from './input.js';
import { drawTurkey, drawTitleTurkey } from './turkey.js';
import { drawFarmer } from './farmer.js';
import { Obstacle, World } from './world.js';
import {
  drawCaught, drawEscaped, drawHud, drawPaused, drawStageBanner, drawTitle,
} from './render.js';

const TURKEY_HITBOX = { x: -26, y: -52, w: 56, h: 52 };
const TURKEY_DUCK_HITBOX = { x: -30, y: -30, w: 64, h: 30 };

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export class GobbleRun {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = new Input(canvas);
    this.sounds = new SoundBank();
    this.state = 'title'; // title | playing | paused | caught | escaped
    this.time = 0;
    this.runTime = 0;
    this.scrollX = 0;
    this.distance = 0;
    this.score = 0;
    this.lives = START_LIVES;
    this.cornCollected = 0;
    this.bestScore = 0;
    this.farmerGap = 0.25; // 0 far behind .. 1 caught
    this.farmerPhase = 0;
    this.turkeyY = GROUND_Y;
    this.turkeyVy = 0;
    this.jumpsUsed = 0;
    this.ducking = false;
    this.invincibleUntil = 0;
    this.speed = PHYSICS.baseSpeed;
    this.stage = stageForDistance(0);
    this.stageBannerUntil = 0;
    this.stumbleFlashUntil = 0;
    this.seed = 20261127;
    this.world = new World(this.seed);
    this.shotMode = null;
    this.lastTimestamp = 0;

    const params = new URLSearchParams(window.location.search);
    const shot = params.get('shot');
    const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
    if (Number.isInteger(seedParam)) this.seed = seedParam;
    if (shot) this.enterShotMode(shot);

    // A small debug handle for play-testing: state, actions and a skip.
    window.__turkeyGame = {
      state: () => this.state,
      score: () => this.score,
      distance: () => this.distance,
      lives: () => this.lives,
      turkeyY: () => this.turkeyY,
      farmerGap: () => this.farmerGap,
      start: () => this.startRun(),
      skipTo: (metres) => { this.world.distance = metres; },
      forceStumble: () => this.stumble(),
      setLives: (n) => { this.lives = n; },
      inputState: () => ({
        restart: this.input.restartQueued,
        start: this.input.startQueued,
        jump: this.input.jumpQueued,
      }),
    };
  }

  // --- shot mode: render one fixed moment for the screenshots ----------
  // Each scene is staged explicitly (obstacles placed, turkey posed) and
  // then simulated a fraction of a second, so the shot is a real render of
  // this code with a readable composition.
  enterShotMode(shot) {
    this.shotMode = shot;
    this.world.reset(this.seed);
    if (shot === 'start') {
      this.state = 'title';
      this.bestScore = 1250;
    } else if (shot === 'play') {
      this.state = 'playing';
      this.startRun(true);
      this.world.distance = 486;
      this.cornCollected = 5;
      this.farmerGap = 0.42;
      this.runTime = 8.4;
      this.time = 8.4;
      // The turkey mid-flap over a fence, corn ahead, hay bale behind it.
      this.world.obstacles.push(
        new Obstacle('fence', 380, 0.21),
        new Obstacle('hay', 940, 0.63),
        new Obstacle('corn', 660, 0.87),
      );
      this.turkeyY = GROUND_Y - 180;
      this.turkeyVy = -120;
      this.jumpsUsed = 1;
      this.simulate(0.15);
      this.score = 1420;
    } else if (shot === 'danger') {
      this.state = 'playing';
      this.startRun(true);
      this.world.distance = 718;
      this.cornCollected = 7;
      this.lives = 2;
      this.farmerGap = 0.72;
      this.runTime = 12;
      this.time = 12;
      // Ducking under a carving knife with the dreaded oven just ahead.
      this.world.obstacles.push(
        new Obstacle('oven', 700, 0.44),
        new Obstacle('knife', 430, 0.78),
        new Obstacle('corn', 990, 0.12),
      );
      this.input.duckHeld = true;
      this.simulate(0.3);
      this.score = 1890;
    } else if (shot === 'escaped') {
      this.state = 'escaped';
      this.distance = ESCAPE_DISTANCE;
      this.score = 2840;
      this.cornCollected = 12;
      this.bestScore = 2840;
      this.time = 5;
    } else if (shot === 'caught') {
      this.state = 'caught';
      this.distance = 742;
      this.score = 1310;
      this.cornCollected = 6;
      this.bestScore = 2100;
      this.farmerGap = 1;
      this.time = 5;
    }
    this.render();
  }

  // Advance the simulation with a fixed step (used by shot mode).
  simulate(seconds) {
    const step = 1 / 60;
    let t = 0;
    while (t < seconds) {
      this.update(step, true);
      t += step;
    }
  }

  // --- run lifecycle ----------------------------------------------------
  startRun(silent = false) {
    this.world.reset(this.seed);
    this.state = 'playing';
    this.runTime = 0;
    this.scrollX = 0;
    this.distance = 0;
    this.score = 0;
    this.lives = START_LIVES;
    this.cornCollected = 0;
    this.farmerGap = 0.25;
    this.turkeyY = GROUND_Y;
    this.turkeyVy = 0;
    this.jumpsUsed = 0;
    this.ducking = false;
    this.invincibleUntil = 0;
    this.stage = stageForDistance(0);
    this.stageBannerUntil = this.time + 2.2;
    if (!silent) {
      this.sounds.unlock();
      this.sounds.gobble();
      this.sounds.startMusic();
    }
  }

  stumble() {
    if (this.time < this.invincibleUntil) return;
    this.lives -= 1;
    this.farmerGap = Math.min(1, this.farmerGap + 0.3);
    this.invincibleUntil = this.time + PHYSICS.invincibleSeconds;
    this.stumbleFlashUntil = this.time + 0.35;
    this.speed *= PHYSICS.stumbleSlowdown;
    this.world.burst(TURKEY_X, this.turkeyY - 30, '#e07b2a', 14);
    this.sounds.thud();
    this.sounds.farmerShout();
    if (this.lives <= 0) this.endRun('caught');
  }

  endRun(outcome) {
    this.state = outcome;
    this.sounds.stopMusic();
    if (outcome === 'escaped') {
      this.bestScore = Math.max(this.bestScore, this.score);
      this.sounds.winFanfare();
    } else {
      this.bestScore = Math.max(this.bestScore, this.score);
      this.sounds.caughtSting();
    }
  }

  // --- per-frame update -------------------------------------------------
  update(dt, simulated = false) {
    this.time += dt;
    if (this.state === 'title') {
      this.world.update(dt, 60, TURKEY_X);
      return;
    }
    if (this.state !== 'playing') return;
    this.runTime += dt;

    // Drain menu-only input while running: a Space pressed to jump (or R
    // pressed mid-run) must not restart the game the instant it ends.
    this.input.consumeStart();
    this.input.consumeRestart();
    this.input.consumeClick();

    // Input: jump (with a double flap), duck, pause, mute.
    if (!simulated) {
      if (this.input.consumePause()) {
        this.state = 'paused';
        this.sounds.stopMusic();
        return;
      }
      if (this.input.consumeMute()) this.sounds.toggleMute();
    }
    if (this.input.consumeJump()) {
      if (this.state === 'playing') {
        if (this.turkeyY >= GROUND_Y - 0.5) {
          this.turkeyVy = PHYSICS.jumpVelocity;
          this.jumpsUsed = 1;
          this.sounds.jump();
        } else if (this.jumpsUsed < 2) {
          this.turkeyVy = PHYSICS.doubleJumpVelocity;
          this.jumpsUsed = 2;
          this.sounds.flap();
        }
      }
    }
    this.ducking = this.input.duckHeld && this.turkeyY >= GROUND_Y - 0.5;

    // Turkey physics.
    this.turkeyVy += PHYSICS.gravity * dt;
    this.turkeyY += this.turkeyVy * dt;
    if (this.turkeyY >= GROUND_Y) {
      this.turkeyY = GROUND_Y;
      this.turkeyVy = 0;
      this.jumpsUsed = 0;
    }

    // World speed grows with distance; a stumble slows it briefly.
    const targetSpeed = speedForDistance(this.distance);
    this.speed += (targetSpeed - this.speed) * Math.min(1, dt * 0.8);
    this.scrollX += this.speed * dt;
    this.world.update(dt, this.speed, this.scrollX);
    this.distance = this.world.distance;
    this.score += this.speed * dt * 0.06; // fractional; the HUD floors it

    // The farmer drifts back while the turkey runs clean, and lunges on a stumble.
    this.farmerGap = Math.max(0.12, this.farmerGap - dt * 0.02);
    this.farmerPhase += dt * (7 + this.speed / 90);

    // Stage banners.
    const stage = stageForDistance(this.distance);
    if (stage !== this.stage) {
      this.stage = stage;
      this.stageBannerUntil = this.time + 2.2;
      this.sounds.gobble();
    }

    // Collisions with the turkey's hitbox.
    const hitbox = this.ducking ? TURKEY_DUCK_HITBOX : TURKEY_HITBOX;
    const turkeyRect = {
      x: TURKEY_X + hitbox.x,
      y: this.turkeyY + hitbox.y,
      w: hitbox.w,
      h: hitbox.h,
    };
    for (const obstacle of this.world.obstacles) {
      if (obstacle.x > TURKEY_X + 120 || obstacle.x + obstacle.w < TURKEY_X - 80) continue;
      if (obstacle.isPickup) {
        if (!obstacle.passed && rectsOverlap(turkeyRect, obstacle.rect)) {
          obstacle.passed = true;
          if (obstacle.kind === 'corn') {
            this.score += 50;
            this.cornCollected += 1;
            this.sounds.pickup();
            this.world.burst(obstacle.x + 17, obstacle.y + 18, '#f2c234', 8, 90);
          } else {
            this.lives = Math.min(3, this.lives + 1);
            this.sounds.feather();
            this.world.burst(obstacle.x + 15, obstacle.y + 15, '#ffd97a', 10, 90);
          }
        }
        continue;
      }
      if (obstacle.hit || this.time < this.invincibleUntil) continue;
      if (rectsOverlap(turkeyRect, obstacle.rect)) {
        obstacle.hit = true;
        if (obstacle.kind === 'knife') this.sounds.knifeWhoosh();
        if (obstacle.kind === 'oven') {
          this.sounds.ovenSizzle();
          this.world.burst(obstacle.x + 55, obstacle.y + 60, '#ff7a1a', 18);
        }
        this.stumble();
        if (this.state !== 'playing') return;
      } else if (!obstacle.passed && obstacle.x + obstacle.w < TURKEY_X) {
        obstacle.passed = true;
        this.score += 25; // cleared it cleanly
      }
    }

    // Oven chimneys smoke as they pass.
    for (const obstacle of this.world.obstacles) {
      if (obstacle.kind === 'oven' && obstacle.x > 0 && obstacle.x < VIEW_W && Math.random() < 0.3) {
        this.world.ovenSmoke(obstacle.x + 55, obstacle.y - 14);
      }
    }

    if (this.distance >= ESCAPE_DISTANCE) this.endRun('escaped');
  }

  // --- drawing ----------------------------------------------------------
  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    const stage = this.state === 'title' ? stageForDistance(0) : this.stage;
    this.world.draw(ctx, this.scrollX, this.time, stage);

    if (this.state === 'title') {
      drawTitleTurkey(ctx, 300, GROUND_Y - 44, this.time);
      drawFarmer(ctx, 150, GROUND_Y, this.time * 1.4, 0.3, false);
      drawTitle(ctx, this.time, this.bestScore);
      return;
    }

    // The farmer runs behind the turkey; his screen position follows the gap.
    const farmerX = TURKEY_X - 190 + this.farmerGap * 130;
    const shouting = this.time < this.stumbleFlashUntil;
    drawFarmer(ctx, farmerX, GROUND_Y, this.farmerPhase, this.farmerGap, shouting);

    const airborne = this.turkeyY < GROUND_Y - 2;
    drawTurkey(ctx, TURKEY_X, this.turkeyY, {
      runPhase: this.runTime * 11,
      airborne,
      ducking: this.ducking,
      invincible: this.time < this.invincibleUntil,
    });
    // Soft shadow under the bird.
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    const shadowScale = airborne ? 0.6 : 1;
    ctx.beginPath();
    ctx.ellipse(TURKEY_X, GROUND_Y + 6, 44 * shadowScale, 7 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    if (this.state === 'playing' || this.state === 'paused') {
      drawHud(ctx, {
        score: this.score,
        distance: this.distance,
        lives: this.lives,
        farmerGap: this.farmerGap,
        stage: this.stage,
        speed: this.speed,
      });
      drawStageBanner(ctx, this.stage.name, Math.max(0, this.stageBannerUntil - this.time) / 2.2);
      if (this.time < this.stumbleFlashUntil) {
        ctx.fillStyle = 'rgba(255, 40, 20, 0.18)';
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      }
      if (this.state === 'paused') drawPaused(ctx);
      return;
    }
    if (this.state === 'escaped') drawEscaped(ctx, this, this.time);
    if (this.state === 'caught') drawCaught(ctx, this, this.time);
  }

  // --- main loop --------------------------------------------------------
  frame(timestamp) {
    const dt = Math.min(0.05, (timestamp - this.lastTimestamp) / 1000 || 0.016);
    this.lastTimestamp = timestamp;
    if (this.state === 'title' && (this.input.consumeStart() || this.input.consumeClick())) {
      this.startRun();
    } else if ((this.state === 'caught' || this.state === 'escaped')
      && (this.input.consumeRestart() || this.input.consumeStart() || this.input.consumeClick())) {
      this.startRun();
    } else if (this.state === 'paused' && this.input.consumePause()) {
      this.state = 'playing';
      this.sounds.startMusic();
    }
    this.update(dt);
    this.render();
    window.requestAnimationFrame((t) => this.frame(t));
  }

  run() {
    if (this.shotMode) return; // shot mode renders one fixed frame
    window.requestAnimationFrame((t) => {
      this.lastTimestamp = t;
      this.frame(t);
    });
  }
}

const canvas = document.getElementById('game');
const game = new GobbleRun(canvas);
game.run();
