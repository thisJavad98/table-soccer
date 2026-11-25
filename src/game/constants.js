export const FIELD = {
  width: 1000,
  height: 620,
  goalWidth: 22,
  goalHeight: 150,
  padding: 36,
};

export const BALL_RADIUS = 13;
export const PLAYER_RADIUS = 23;
/** Plato-like glide: discs slide, ball rolls a bit longer */
export const FRICTION = 0.982;
export const PLAYER_FRICTION = 0.958;
export const MIN_SPEED = 0.06;
export const MAX_PLAYER_IMPULSE = 30;
export const MAX_SPEED_BALL = 22;
export const MAX_SPEED_PLAYER = 26;
/** Natural restitution — firm hit, not rubbery */
export const BOUNCE_WALL = 0.55;
export const BOUNCE_PLAYER = 0.35;
export const BOUNCE_BALL = 0.78;
export const PLAYER_MASS = 3.2;
export const BALL_MASS = 1;
export const GOALS_TO_WIN = 3;
export const BOT_THINK_MS = 750;
/** Ball must finish roughly touching a teammate */
export const POSSESSION_RANGE = 42;
export const MAX_PASS_CHAIN = 99;
export const GOAL_PAUSE_MS = 3200;
export const PHYS_DT = 1 / 120;
export const HIT_SLOP = 22;
/** Seconds for receiver to walk around the ball after a pass */
export const ORBIT_DURATION = 0.48;
