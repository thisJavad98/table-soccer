import {
  BALL_MASS,
  BALL_RADIUS,
  BOUNCE_BALL,
  BOUNCE_PLAYER,
  BOUNCE_WALL,
  FIELD,
  FRICTION,
  GOALS_TO_WIN,
  MAX_PASS_CHAIN,
  MAX_PLAYER_IMPULSE,
  MAX_SPEED_BALL,
  MAX_SPEED_PLAYER,
  MIN_SPEED,
  ORBIT_DURATION,
  PLAYER_FRICTION,
  PLAYER_MASS,
  PLAYER_RADIUS,
  POSSESSION_RANGE,
} from './constants.js';
import { FORMATIONS } from './formations.js';
import { getTeam } from './teams.js';

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function placeTeam(side, formationId, teamId, discSkinId) {
  const formation = FORMATIONS[formationId] || FORMATIONS.standard;
  const left = FIELD.padding + 48;
  const right = FIELD.width - FIELD.padding - 48;
  const top = FIELD.padding + 48;
  const bottom = FIELD.height - FIELD.padding - 48;
  const halfW = (right - left) / 2;
  const height = bottom - top;
  const team = getTeam(teamId);

  return formation.slots.map((slot, i) => {
    const x =
      side === 'human' ? right - slot.x * halfW : left + slot.x * halfW;
    const y = top + slot.y * height;
    return {
      id: `${side}-${i}`,
      team: side,
      teamId,
      index: i,
      x,
      y,
      vx: 0,
      vy: 0,
      r: PLAYER_RADIUS,
      mass: PLAYER_MASS,
      color: team.primary,
      secondary: team.secondary,
      accent: team.accent,
      style: team.style,
      bands: team.bands,
      discSkinId: side === 'human' ? discSkinId || 'classic' : 'classic',
    };
  });
}

const BOT_ATTACK = 'press';
const BOT_DEFENSE = 'wall';

function formationFor(side, kickoffTeam, humanAttack, humanDefense) {
  const attacking = side === kickoffTeam;
  if (side === 'human') return attacking ? humanAttack : humanDefense;
  return attacking ? BOT_ATTACK : BOT_DEFENSE;
}

export function createMatch(config) {
  const {
    playerName,
    humanTeamId,
    botTeamId,
    attackFormation,
    defenseFormation,
    stadiumId,
    discSkinId = 'classic',
    kickoffTeam: kickoffFromConfig = 'human',
    difficulty = 'medium',
  } = config;

  const kickoffTeam =
    kickoffFromConfig === 'bot' || kickoffFromConfig === 'human'
      ? kickoffFromConfig
      : 'human';
  const humanFormationId = formationFor(
    'human',
    kickoffTeam,
    attackFormation,
    defenseFormation,
  );
  const botFormationId = formationFor(
    'bot',
    kickoffTeam,
    attackFormation,
    defenseFormation,
  );

  const players = [
    ...placeTeam('bot', botFormationId, botTeamId, 'classic'),
    ...placeTeam('human', humanFormationId, humanTeamId, discSkinId),
  ];

  return {
    ...config,
    difficulty,
    players,
    ball: {
      x: FIELD.width / 2 + (kickoffTeam === 'human' ? 14 : -14),
      y: FIELD.height / 2,
      vx: 0,
      vy: 0,
      r: BALL_RADIUS,
      mass: BALL_MASS,
    },
    score: { human: 0, bot: 0 },
    turn: kickoffTeam,
    phase: 'aim',
    lastGoal: null,
    winner: null,
    kickoffTeam,
    isKickoffShot: true,
    passChain: 0,
    lockedPlayerId: null,
    lastKickerId: null,
    touchedTeammateId: null,
    ballWasHit: false,
    orbit: null,
    messageKey: kickoffTeam === 'human' ? 'kickoffYours' : 'kickoffBot',
    messageVars: {},
    stadiumId: stadiumId || 'standard',
    attackFormation,
    defenseFormation,
    playerName,
  };
}

function resetAfterGoal(state, kickoffTeam) {
  const humanFormationId = formationFor(
    'human',
    kickoffTeam,
    state.attackFormation,
    state.defenseFormation,
  );
  const botFormationId = formationFor(
    'bot',
    kickoffTeam,
    state.attackFormation,
    state.defenseFormation,
  );

  const players = [
    ...placeTeam('bot', botFormationId, state.botTeamId),
    ...placeTeam('human', humanFormationId, state.humanTeamId),
  ];

  return {
    ...state,
    players,
    ball: {
      x: FIELD.width / 2 + (kickoffTeam === 'human' ? 14 : -14),
      y: FIELD.height / 2,
      vx: 0,
      vy: 0,
      r: BALL_RADIUS,
      mass: BALL_MASS,
    },
    turn: kickoffTeam,
    phase: 'aim',
    kickoffTeam,
    isKickoffShot: true,
    passChain: 0,
    lockedPlayerId: null,
    lastKickerId: null,
    touchedTeammateId: null,
    ballWasHit: false,
    orbit: null,
    lastGoal: null,
    messageKey: kickoffTeam === 'human' ? 'kickoffYours' : 'kickoffBot',
    messageVars: {},
  };
}

function bounceWalls(entity, isBall) {
  const minX = FIELD.padding + entity.r;
  const maxX = FIELD.width - FIELD.padding - entity.r;
  const minY = FIELD.padding + entity.r;
  const maxY = FIELD.height - FIELD.padding - entity.r;
  const goalTop = (FIELD.height - FIELD.goalHeight) / 2;
  const goalBottom = goalTop + FIELD.goalHeight;
  const inGoalMouth =
    isBall &&
    entity.y - entity.r > goalTop + 2 &&
    entity.y + entity.r < goalBottom - 2;

  if (entity.x < minX) {
    if (inGoalMouth) {
      if (entity.x + entity.r < FIELD.padding * 0.3) return 'human';
    } else {
      entity.x = minX;
      entity.vx = Math.abs(entity.vx) * BOUNCE_WALL;
    }
  } else if (entity.x > maxX) {
    if (inGoalMouth) {
      if (entity.x - entity.r > FIELD.width - FIELD.padding * 0.3) return 'bot';
    } else {
      entity.x = maxX;
      entity.vx = -Math.abs(entity.vx) * BOUNCE_WALL;
    }
  }

  if (entity.y < minY) {
    entity.y = minY;
    entity.vy = Math.abs(entity.vy) * BOUNCE_WALL;
  } else if (entity.y > maxY) {
    entity.y = maxY;
    entity.vy = -Math.abs(entity.vy) * BOUNCE_WALL;
  }

  if (isBall) {
    const posts = [
      { x: FIELD.padding, y: goalTop },
      { x: FIELD.padding, y: goalBottom },
      { x: FIELD.width - FIELD.padding, y: goalTop },
      { x: FIELD.width - FIELD.padding, y: goalBottom },
    ];
    for (const post of posts) {
      const d = dist(entity, post);
      if (d < entity.r + 7 && d > 0) {
        const nx = (entity.x - post.x) / d;
        const ny = (entity.y - post.y) / d;
        const overlap = entity.r + 7 - d;
        entity.x += nx * overlap;
        entity.y += ny * overlap;
        const dot = entity.vx * nx + entity.vy * ny;
        entity.vx -= (1 + BOUNCE_WALL) * dot * nx;
        entity.vy -= (1 + BOUNCE_WALL) * dot * ny;
      }
    }
  }

  return null;
}

function capSpeed(entity, max) {
  const speed = Math.hypot(entity.vx, entity.vy);
  if (speed > max) {
    const s = max / speed;
    entity.vx *= s;
    entity.vy *= s;
  }
}

/**
 * Classic 2D elastic impulse along the collision normal.
 * Direction of the hit decides where the ball goes — from behind, side, or front.
 */
function resolveCircleCollision(a, b, bounce = BOUNCE_PLAYER) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy) || 0.0001;
  const minDist = a.r + b.r;
  if (d >= minDist) return false;

  const nx = dx / d;
  const ny = dy / d;
  const overlap = minDist - d;
  const aMass = a.mass || 1;
  const bMass = b.mass || 1;
  const invA = 1 / aMass;
  const invB = 1 / bMass;
  const invSum = invA + invB;

  // Positional correction (no teleport bias — keep contact side)
  const corr = (overlap * 0.92) / invSum;
  a.x -= nx * corr * invA;
  a.y -= ny * corr * invA;
  b.x += nx * corr * invB;
  b.y += ny * corr * invB;

  const rvx = b.vx - a.vx;
  const rvy = b.vy - a.vy;
  const velAlongNormal = rvx * nx + rvy * ny;
  if (velAlongNormal > 0) return true; // already separating

  const j = (-(1 + bounce) * velAlongNormal) / invSum;
  const ix = j * nx;
  const iy = j * ny;
  a.vx -= ix * invA;
  a.vy -= iy * invA;
  b.vx += ix * invB;
  b.vy += iy * invB;
  return true;
}

/**
 * Flick only moves the disc. The ball moves only if the disc physically hits it.
 */
export function applyKick(state, playerId, aim) {
  if (state.phase !== 'aim') return state;
  const player = state.players.find((p) => p.id === playerId);
  if (!player || player.team !== state.turn) return state;
  if (state.lockedPlayerId && state.lockedPlayerId !== playerId) return state;

  const power = clamp(aim.power, 0.12, 1);
  const next = structuredClone(state);
  const p = next.players.find((pl) => pl.id === playerId);
  const impulse = power * MAX_PLAYER_IMPULSE;
  p.vx = Math.cos(aim.angle) * impulse;
  p.vy = Math.sin(aim.angle) * impulse;

  next.phase = 'resolve';
  next.lastKickerId = playerId;
  next.touchedTeammateId = null;
  next.ballWasHit = false;
  next.messageKey = 'ballInPlay';
  next.messageVars = {};
  return next;
}

function findPossessionReceiver(state) {
  const team = state.turn;
  const kickerId = state.lastKickerId;

  // Prefer teammate the ball actually struck (pass on contact)
  if (state.touchedTeammateId) {
    const touched = state.players.find((p) => p.id === state.touchedTeammateId);
    if (touched && dist(touched, state.ball) <= POSSESSION_RANGE * 1.75) {
      return touched;
    }
  }

  const candidates = state.players
    .filter((p) => p.team === team && p.id !== kickerId)
    .map((p) => ({ p, d: dist(p, state.ball) }))
    .filter((x) => x.d <= POSSESSION_RANGE)
    .sort((a, b) => a.d - b.d);

  if (!candidates.length || !state.ballWasHit) return null;
  return candidates[0].p;
}

/**
 * Receiver walks around the fixed ball to the attack side
 * (behind the ball, facing the opponent goal) — like Plato.
 */
export function beginOrbit(state, receiver) {
  const ball = state.ball;
  ball.vx = 0;
  ball.vy = 0;
  state.players.forEach((p) => {
    p.vx = 0;
    p.vy = 0;
  });

  const orbitR = receiver.r + ball.r + 2;
  // Separate lightly so orbit has a clean radius, keeping contact side as start
  const d0 = dist(receiver, ball) || 0.0001;
  let fromAngle = Math.atan2(receiver.y - ball.y, receiver.x - ball.x);
  if (d0 < orbitR * 0.85) {
    receiver.x = ball.x + Math.cos(fromAngle) * orbitR;
    receiver.y = ball.y + Math.sin(fromAngle) * orbitR;
  } else {
    fromAngle = Math.atan2(receiver.y - ball.y, receiver.x - ball.x);
  }

  // Human attacks LEFT goal → stand on the RIGHT of the ball (angle 0)
  // Bot attacks RIGHT goal → stand on the LEFT of the ball (angle π)
  const toAngle = receiver.team === 'human' ? 0 : Math.PI;
  let delta = toAngle - fromAngle;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;

  state.phase = 'orbit';
  state.orbit = {
    playerId: receiver.id,
    cx: ball.x,
    cy: ball.y,
    radius: orbitR,
    fromAngle,
    delta,
    t: 0,
    duration: ORBIT_DURATION,
  };
  state.lockedPlayerId = receiver.id;
  state.passChain += 1;
  state.isKickoffShot = false;
  state.messageKey = 'nicePass';
  state.messageVars = {};
  return state;
}

/** Advance receiver orbit around the ball. `dtSec` in real seconds. */
export function stepOrbit(state, dtSec) {
  if (state.phase !== 'orbit' || !state.orbit) return state;
  const o = state.orbit;
  const p = state.players.find((pl) => pl.id === o.playerId);
  if (!p) {
    state.phase = 'aim';
    state.orbit = null;
    return state;
  }

  o.t = Math.min(1, o.t + dtSec / o.duration);
  const ease = 1 - (1 - o.t) ** 2;
  const ang = o.fromAngle + o.delta * ease;

  // Ball stays fixed — disc walks around it
  state.ball.x = o.cx;
  state.ball.y = o.cy;
  state.ball.vx = 0;
  state.ball.vy = 0;
  p.x = o.cx + Math.cos(ang) * o.radius;
  p.y = o.cy + Math.sin(ang) * o.radius;
  p.vx = 0;
  p.vy = 0;

  if (o.t >= 1) {
    state.phase = 'aim';
    state.orbit = null;
    state.messageKey = 'readyPass';
    state.messageVars = {};
  }
  return state;
}

export function stepPhysics(state, dt = 1) {
  if (state.phase !== 'resolve') return state;

  const next = state;
  const ball = next.ball;
  const turnTeam = next.turn;
  const ballF = FRICTION ** dt;
  const playerF = PLAYER_FRICTION ** dt;

  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
  ball.vx *= ballF;
  ball.vy *= ballF;
  if (Math.hypot(ball.vx, ball.vy) < MIN_SPEED) {
    ball.vx = 0;
    ball.vy = 0;
  }
  capSpeed(ball, MAX_SPEED_BALL);

  let scored = bounceWalls(ball, true);

  for (const p of next.players) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= playerF;
    p.vy *= playerF;
    if (Math.hypot(p.vx, p.vy) < MIN_SPEED) {
      p.vx = 0;
      p.vy = 0;
    }
    capSpeed(p, MAX_SPEED_PLAYER);
    bounceWalls(p, false);
  }

  // A couple of solver passes so stacked contacts feel solid
  for (let pass = 0; pass < 2; pass += 1) {
    for (let i = 0; i < next.players.length; i += 1) {
      for (let j = i + 1; j < next.players.length; j += 1) {
        resolveCircleCollision(next.players[i], next.players[j], BOUNCE_PLAYER);
      }
    }
    for (const p of next.players) {
      const beforeVx = ball.vx;
      const beforeVy = ball.vy;
      const hit = resolveCircleCollision(p, ball, BOUNCE_BALL);
      if (hit) {
        if (
          p.id === next.lastKickerId ||
          Math.hypot(ball.vx - beforeVx, ball.vy - beforeVy) > 0.01
        ) {
          next.ballWasHit = true;
        }
        if (p.team === turnTeam && p.id !== next.lastKickerId) {
          // Pass contact: trap the ball (yar receives), don't let it bounce away
          next.touchedTeammateId = p.id;
          ball.vx *= 0.18;
          ball.vy *= 0.18;
          p.vx *= 0.35;
          p.vy *= 0.35;
        }
      }
    }
  }

  if (!scored) {
    const goalTop = (FIELD.height - FIELD.goalHeight) / 2;
    const goalBottom = goalTop + FIELD.goalHeight;
    const inMouth = ball.y > goalTop && ball.y < goalBottom;
    if (inMouth && ball.x + ball.r < FIELD.padding * 0.3) scored = 'human';
    if (inMouth && ball.x - ball.r > FIELD.width - FIELD.padding * 0.3) scored = 'bot';
  }

  if (scored) {
    if (next.isKickoffShot && scored === next.kickoffTeam) {
      next.phase = 'aim';
      next.turn = next.kickoffTeam === 'human' ? 'bot' : 'human';
      next.isKickoffShot = false;
      next.passChain = 0;
      next.lockedPlayerId = null;
      next.lastKickerId = null;
      next.touchedTeammateId = null;
      next.ballWasHit = false;
      next.ball.vx = 0;
      next.ball.vy = 0;
      next.players.forEach((p) => {
        p.vx = 0;
        p.vy = 0;
      });
      next.ball.x = FIELD.width / 2;
      next.ball.y = FIELD.height / 2;
      next.messageKey = 'ownKickoffGoal';
      next.messageVars = {};
      return next;
    }

    next.score[scored] += 1;
    next.lastGoal = scored;
    next.phase = 'goal';
    next.ball.vx = 0;
    next.ball.vy = 0;
    next.players.forEach((p) => {
      p.vx = 0;
      p.vy = 0;
    });
    next.messageKey = scored === 'human' ? 'goal' : 'botScores';
    next.messageVars = {};
    next.isKickoffShot = false;
    next.passChain = 0;
    next.lockedPlayerId = null;

    if (next.score.human >= GOALS_TO_WIN || next.score.bot >= GOALS_TO_WIN) {
      next.phase = 'over';
      next.winner = next.score.human >= GOALS_TO_WIN ? 'human' : 'bot';
    }
    return next;
  }

  const moving =
    Math.hypot(ball.vx, ball.vy) > MIN_SPEED ||
    next.players.some((p) => Math.hypot(p.vx, p.vy) > MIN_SPEED);

  if (!moving) {
    next.isKickoffShot = false;
    const receiver = findPossessionReceiver(next);

    if (receiver && next.passChain < MAX_PASS_CHAIN) {
      return beginOrbit(next, receiver);
    }

    next.phase = 'aim';
    next.turn = turnTeam === 'human' ? 'bot' : 'human';
    next.passChain = 0;
    next.lockedPlayerId = null;
    next.lastKickerId = null;
    next.touchedTeammateId = null;
    next.ballWasHit = false;
    next.orbit = null;
    next.messageKey = next.turn === 'human' ? 'yourTurn' : 'botTurn';
    next.messageVars = {};
  }

  return next;
}

export function afterGoalRestart(state) {
  if (state.phase !== 'goal') return state;
  const kickoffTeam = state.lastGoal === 'human' ? 'bot' : 'human';
  return resetAfterGoal(state, kickoffTeam);
}
