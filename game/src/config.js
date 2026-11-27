// Gobble Run — tuning, palette and stage data for the turkey escape game.
// One place holds every number a designer would tweak: the canvas size, the
// turkey's physics, the farmer's chase, the four stages of the escape route
// and the autumn dusk palette every drawing module shares.

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const GROUND_Y = 612;
export const TURKEY_X = 300;
export const ESCAPE_DISTANCE = 1200; // metres of farmyard to survive
export const START_LIVES = 3;

export const PHYSICS = {
  gravity: 2600, // px per second squared, pulls the turkey back down
  jumpVelocity: -980, // px per second, one strong flap
  doubleJumpVelocity: -820, // a second flap while airborne
  baseSpeed: 340, // world scroll, px per second at the start
  maxSpeed: 640, // world scroll once the farmer is really angry
  stumbleSlowdown: 0.55, // speed multiplier right after a hit
  invincibleSeconds: 1.6, // grace period after a stumble
};

export const PALETTE = {
  skyTop: '#2e1a4f',
  skyMid: '#7a2e5d',
  skyLow: '#e2703a',
  sunCore: '#ffd97a',
  sunGlow: '#ff9a3d',
  hillFar: '#5d3a5e',
  hillNear: '#3f2a4a',
  ground: '#6b4423',
  groundTop: '#8a5a2e',
  grass: '#c98a2e',
  barnRed: '#a03a28',
  barnDark: '#7c2a1d',
  leafOrange: '#e07b2a',
  leafRed: '#c23b2a',
  leafGold: '#f2b234',
  turkeyBrown: '#6b4423',
  turkeyLight: '#8a5a2e',
  turkeyDark: '#4a2c14',
  featherTip: '#d8a05a',
  wattleRed: '#c22e2e',
  farmerShirt: '#4a6b8a',
  farmerOveralls: '#2e4a6b',
  farmerHat: '#d8b25a',
  ovenBlack: '#1c1c22',
  ovenGlow: '#ff7a1a',
  knifeSteel: '#d8dde2',
  knifeEdge: '#f4f6f8',
  hudCream: '#fff3d6',
  hudDark: '#2a1608',
};

// The escape route, in four stages. Each stage changes the scenery, the
// obstacles the farmer's kitchen throws at the turkey and how often they come.
export const STAGES = [
  {
    name: 'THE FARMYARD',
    from: 0,
    to: 300,
    ground: '#6b4423',
    accent: '#c98a2e',
    obstacles: ['fence', 'hay', 'knife'],
    gapMin: 300,
    gapMax: 560,
  },
  {
    name: 'THE PUMPKIN PATCH',
    from: 300,
    to: 650,
    ground: '#5e3a1e',
    accent: '#e07b2a',
    obstacles: ['fence', 'hay', 'pumpkin', 'knife'],
    gapMin: 280,
    gapMax: 520,
  },
  {
    name: 'THE KITCHEN YARD',
    from: 650,
    to: 950,
    ground: '#4a2c14',
    accent: '#ff7a1a',
    obstacles: ['fence', 'oven', 'knife', 'hay'],
    gapMin: 260,
    gapMax: 470,
  },
  {
    name: 'THE FOREST EDGE',
    from: 950,
    to: 1200,
    ground: '#3a2a1a',
    accent: '#7a9a3a',
    obstacles: ['fence', 'hay', 'knife', 'pumpkin'],
    gapMin: 300,
    gapMax: 540,
  },
];

export function stageForDistance(distance) {
  for (const stage of STAGES) {
    if (distance >= stage.from && distance < stage.to) return stage;
  }
  return STAGES[STAGES.length - 1];
}

// Speed grows with distance so the last stretch is a real sprint.
export function speedForDistance(distance) {
  const t = Math.min(1, distance / ESCAPE_DISTANCE);
  return PHYSICS.baseSpeed + (PHYSICS.maxSpeed - PHYSICS.baseSpeed) * t;
}
