import { FIELD, POSSESSION_RANGE } from './constants.js';
import { clamp, dist } from './engine.js';

export const DIFFICULTY_IDS = ['easy', 'medium', 'hard'];

/** Tuning: higher noise / lower power = easier for the human. */
export const DIFFICULTY = {
  easy: {
    thinkMs: 1100,
    angleNoise: 0.48,
    approachNoise: 0.35,
    powerMin: 0.32,
    powerMax: 0.68,
    passChance: 0.22,
    aimJitter: 55,
  },
  medium: {
    thinkMs: 750,
    angleNoise: 0.12,
    approachNoise: 0.1,
    powerMin: 0.52,
    powerMax: 0.95,
    passChance: 0.55,
    aimJitter: 18,
  },
  hard: {
    thinkMs: 420,
    angleNoise: 0.035,
    approachNoise: 0.02,
    powerMin: 0.68,
    powerMax: 1,
    passChance: 0.72,
    aimJitter: 4,
  },
};

function angleTo(from, to) {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

function choosePlayer(state) {
  if (state.lockedPlayerId) {
    const locked = state.players.find((p) => p.id === state.lockedPlayerId);
    if (locked) return locked;
  }

  const bots = state.players.filter((p) => p.team === 'bot');
  return bots
    .map((p) => {
      const d = dist(p, state.ball);
      const possess = d < POSSESSION_RANGE ? 60 : 0;
      return { p, score: possess - d + p.x * 0.02 };
    })
    .sort((a, b) => b.score - a.score)[0].p;
}

/**
 * Bot only aims the disc into the ball (or through the ball toward a target).
 * No magical ball impulse — same physics as the human.
 */
export function decideBotKick(state, difficultyId = 'medium') {
  const cfg = DIFFICULTY[difficultyId] || DIFFICULTY.medium;
  const player = choosePlayer(state);
  const ball = state.ball;
  const teammates = state.players.filter(
    (p) => p.team === 'bot' && p.id !== player.id,
  );

  const goal = {
    x: FIELD.width - FIELD.padding - 8,
    y:
      FIELD.height / 2 +
      (Math.random() - 0.5) * (90 + cfg.aimJitter * 1.4),
  };

  const forward = teammates
    .filter((t) => t.x > ball.x - 10)
    .sort((a, b) => b.x - a.x)[0];

  const wantPass = Boolean(forward) && Math.random() < cfg.passChance;
  const target = wantPass
    ? {
        x: forward.x + (Math.random() - 0.5) * cfg.aimJitter,
        y: forward.y + (Math.random() - 0.5) * cfg.aimJitter,
      }
    : goal;

  // Aim so the disc runs through the ball toward the target
  // (approach from the opposite side of the intended send direction)
  const send = angleTo(ball, target);
  const approach = {
    x: ball.x - Math.cos(send) * (player.r + ball.r + 2),
    y: ball.y - Math.sin(send) * (player.r + ball.r + 2),
  };

  const d = dist(player, ball);
  let angle;
  let power;

  if (d > player.r + ball.r + 10) {
    angle =
      angleTo(player, approach) + (Math.random() - 0.5) * cfg.approachNoise;
    power = clamp(
      cfg.powerMin + d / 280 + Math.random() * 0.12,
      cfg.powerMin,
      cfg.powerMax,
    );
  } else {
    angle = send + (Math.random() - 0.5) * cfg.angleNoise;
    power = clamp(
      cfg.powerMin + 0.18 + Math.random() * (cfg.powerMax - cfg.powerMin),
      cfg.powerMin,
      cfg.powerMax,
    );
  }

  return { playerId: player.id, aim: { angle, power } };
}

export function botThinkMs(difficultyId = 'medium') {
  return (DIFFICULTY[difficultyId] || DIFFICULTY.medium).thinkMs;
}
