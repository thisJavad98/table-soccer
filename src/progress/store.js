import {
  DEFAULT_UNLOCKED_DISCS,
  DEFAULT_UNLOCKED_STADIUMS,
  DISC_UNLOCKS,
  LOSS_POINTS,
  STADIUM_UNLOCKS,
  WIN_POINTS,
} from './catalog.js';

const KEY = 'table-soccer-progress-v1';

function blankPlayer(name) {
  return {
    name,
    points: 0,
    wins: 0,
    losses: 0,
    unlockedStadiums: [...DEFAULT_UNLOCKED_STADIUMS],
    unlockedDiscs: [...DEFAULT_UNLOCKED_DISCS],
    selectedStadium: 'standard',
    selectedDisc: 'classic',
    updatedAt: Date.now(),
  };
}

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { players: {}, lastName: '' };
    const data = JSON.parse(raw);
    return {
      players: data.players || {},
      lastName: data.lastName || '',
    };
  } catch {
    return { players: {}, lastName: '' };
  }
}

function write(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function getLastName() {
  return read().lastName || '';
}

export function getPlayer(name) {
  const trimmed = String(name || '').trim().slice(0, 18);
  if (!trimmed) return blankPlayer('');
  const data = read();
  return data.players[trimmed] || blankPlayer(trimmed);
}

export function upsertPlayer(player) {
  const data = read();
  const name = String(player.name || '').trim().slice(0, 18);
  if (!name) return blankPlayer('');
  const next = {
    ...blankPlayer(name),
    ...data.players[name],
    ...player,
    name,
    updatedAt: Date.now(),
  };
  data.players[name] = next;
  data.lastName = name;
  write(data);
  return next;
}

export function ensurePlayer(name) {
  const trimmed = String(name || '').trim().slice(0, 18);
  if (!trimmed) return blankPlayer('');
  const existing = getPlayer(trimmed);
  if (read().players[trimmed]) return existing;
  return upsertPlayer(existing);
}

export function recordMatchResult(name, won) {
  const player = ensurePlayer(name);
  if (won) {
    player.wins += 1;
    player.points += WIN_POINTS;
  } else {
    player.losses += 1;
    player.points += LOSS_POINTS;
  }
  return upsertPlayer(player);
}

export function unlockStadium(name, stadiumId) {
  const player = ensurePlayer(name);
  const meta = STADIUM_UNLOCKS.find((s) => s.id === stadiumId);
  if (!meta) return { ok: false, reason: 'missing' };
  if (player.unlockedStadiums.includes(stadiumId)) {
    player.selectedStadium = stadiumId;
    return { ok: true, player: upsertPlayer(player), already: true };
  }
  if (player.points < meta.cost) return { ok: false, reason: 'points', need: meta.cost };
  player.points -= meta.cost;
  player.unlockedStadiums = [...player.unlockedStadiums, stadiumId];
  player.selectedStadium = stadiumId;
  return { ok: true, player: upsertPlayer(player) };
}

export function unlockDisc(name, discId) {
  const player = ensurePlayer(name);
  const meta = DISC_UNLOCKS.find((d) => d.id === discId);
  if (!meta) return { ok: false, reason: 'missing' };
  if (player.unlockedDiscs.includes(discId)) {
    player.selectedDisc = discId;
    return { ok: true, player: upsertPlayer(player), already: true };
  }
  if (player.points < meta.cost) return { ok: false, reason: 'points', need: meta.cost };
  player.points -= meta.cost;
  player.unlockedDiscs = [...player.unlockedDiscs, discId];
  player.selectedDisc = discId;
  return { ok: true, player: upsertPlayer(player) };
}

export function selectStadium(name, stadiumId) {
  const player = ensurePlayer(name);
  if (!player.unlockedStadiums.includes(stadiumId)) {
    return { ok: false, reason: 'locked' };
  }
  player.selectedStadium = stadiumId;
  return { ok: true, player: upsertPlayer(player) };
}

export function selectDisc(name, discId) {
  const player = ensurePlayer(name);
  if (!player.unlockedDiscs.includes(discId)) {
    return { ok: false, reason: 'locked' };
  }
  player.selectedDisc = discId;
  return { ok: true, player: upsertPlayer(player) };
}

export function getLeaderboard(limit = 20) {
  const data = read();
  return Object.values(data.players)
    .sort((a, b) => b.points - a.points || b.wins - a.wins || a.name.localeCompare(b.name))
    .slice(0, limit);
}
