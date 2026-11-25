import { FIELD, POSSESSION_RANGE } from './constants.js';
import { clamp, dist } from './engine.js';

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
export function decideBotKick(state) {
  const player = choosePlayer(state);
  const ball = state.ball;
  const teammates = state.players.filter(
    (p) => p.team === 'bot' && p.id !== player.id,
  );

  const goal = {
    x: FIELD.width - FIELD.padding - 8,
    y: FIELD.height / 2 + (Math.random() - 0.5) * 90,
  };

  const forward = teammates
    .filter((t) => t.x > ball.x - 10)
    .sort((a, b) => b.x - a.x)[0];

  const wantPass = Boolean(forward) && Math.random() > 0.4;
  const target = wantPass
    ? { x: forward.x, y: forward.y }
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
    // First get to the approach point / ball
    angle = angleTo(player, approach);
    power = clamp(0.48 + d / 240, 0.42, 0.95);
  } else {
    // Already near: strike through the ball toward target
    angle = send + (Math.random() - 0.5) * 0.12;
    power = clamp(0.62 + Math.random() * 0.32, 0.55, 0.98);
  }

  return { playerId: player.id, aim: { angle, power } };
}
