/**
 * Each formation: 6 discs as { x, y } in 0..1 of the team's half.
 * x: 0 = own goal line, 1 = halfway. y: 0 = top touchline, 1 = bottom.
 */
export const FORMATIONS = {
  standard: {
    id: 'standard',
    slots: [
      { x: 0.12, y: 0.5 },
      { x: 0.34, y: 0.22 },
      { x: 0.34, y: 0.78 },
      { x: 0.58, y: 0.35 },
      { x: 0.58, y: 0.65 },
      { x: 0.82, y: 0.5 },
    ],
  },
  wide: {
    id: 'wide',
    slots: [
      { x: 0.12, y: 0.5 },
      { x: 0.3, y: 0.12 },
      { x: 0.3, y: 0.88 },
      { x: 0.55, y: 0.2 },
      { x: 0.55, y: 0.8 },
      { x: 0.8, y: 0.5 },
    ],
  },
  narrow: {
    id: 'narrow',
    slots: [
      { x: 0.14, y: 0.5 },
      { x: 0.36, y: 0.32 },
      { x: 0.36, y: 0.68 },
      { x: 0.58, y: 0.4 },
      { x: 0.58, y: 0.6 },
      { x: 0.8, y: 0.5 },
    ],
  },
  diamond: {
    id: 'diamond',
    slots: [
      { x: 0.1, y: 0.5 },
      { x: 0.32, y: 0.28 },
      { x: 0.32, y: 0.72 },
      { x: 0.52, y: 0.5 },
      { x: 0.72, y: 0.32 },
      { x: 0.88, y: 0.5 },
    ],
  },
  press: {
    id: 'press',
    slots: [
      { x: 0.22, y: 0.5 },
      { x: 0.48, y: 0.18 },
      { x: 0.48, y: 0.82 },
      { x: 0.7, y: 0.32 },
      { x: 0.7, y: 0.68 },
      { x: 0.9, y: 0.5 },
    ],
  },
  wall: {
    id: 'wall',
    slots: [
      { x: 0.08, y: 0.5 },
      { x: 0.22, y: 0.18 },
      { x: 0.22, y: 0.5 },
      { x: 0.22, y: 0.82 },
      { x: 0.48, y: 0.35 },
      { x: 0.48, y: 0.65 },
    ],
  },
};

export const FORMATION_IDS = Object.keys(FORMATIONS);

export const STADIUMS = {
  standard: {
    id: 'standard',
    grass: ['#1f7a45', '#1a6b3c', '#176236'],
    line: 'rgba(255,255,255,0.7)',
  },
  night: {
    id: 'night',
    grass: ['#0f3d2a', '#0c3323', '#0a2c1e'],
    line: 'rgba(220,240,255,0.55)',
  },
  clay: {
    id: 'clay',
    grass: ['#8a5a32', '#7a4f2c', '#6e4627'],
    line: 'rgba(255,236,210,0.7)',
  },
};
