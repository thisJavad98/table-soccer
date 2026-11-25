/** Points awarded for beating the bot */
export const WIN_POINTS = 50;
export const LOSS_POINTS = 5;

/**
 * Stadium visual themes.
 * pattern: mow | grit | frost | lava | grid | weave
 * border: outer apron color around the pitch
 */
export const STADIUM_UNLOCKS = [
  {
    id: 'standard',
    cost: 0,
    grass: ['#1f7a45', '#1a6b3c', '#176236'],
    line: 'rgba(255,255,255,0.72)',
    pattern: 'mow',
    border: '#14532d',
    apron: ['#0f3d24', '#124a2c'],
    accent: 'rgba(255,255,255,0.08)',
    spot: null,
  },
  {
    id: 'night',
    cost: 80,
    grass: ['#0f3d2a', '#0c3323', '#0a2c1e'],
    line: 'rgba(220,240,255,0.58)',
    pattern: 'frost',
    border: '#061810',
    apron: ['#040e0a', '#0a1a14'],
    accent: 'rgba(160,200,255,0.1)',
    glow: 'rgba(120,180,255,0.1)',
    spot: 'rgba(200,220,255,0.14)',
  },
  {
    id: 'clay',
    cost: 150,
    grass: ['#8a5a32', '#7a4f2c', '#6e4627'],
    line: 'rgba(255,236,210,0.72)',
    pattern: 'grit',
    border: '#4a2c16',
    apron: ['#3a2210', '#5a3418'],
    accent: 'rgba(255,210,150,0.1)',
    spot: null,
  },
  {
    id: 'aurora',
    cost: 250,
    grass: ['#123c4a', '#0f4f4a', '#1a3d5c'],
    line: 'rgba(160,255,230,0.58)',
    pattern: 'weave',
    border: '#0a2430',
    apron: ['#071820', '#0e3040'],
    accent: 'rgba(100,255,220,0.12)',
    glow: 'rgba(80,220,200,0.14)',
    spot: 'rgba(140,255,230,0.1)',
  },
  {
    id: 'volcano',
    cost: 400,
    grass: ['#3a1a14', '#4a2018', '#2a120e'],
    line: 'rgba(255,180,120,0.58)',
    pattern: 'lava',
    border: '#1a0a08',
    apron: ['#120605', '#2a100c'],
    accent: 'rgba(255,100,40,0.14)',
    glow: 'rgba(255,90,40,0.16)',
    spot: 'rgba(255,140,60,0.12)',
  },
  {
    id: 'neon',
    cost: 600,
    grass: ['#0b1020', '#10182c', '#0a0e1a'],
    line: 'rgba(120,255,200,0.68)',
    pattern: 'grid',
    border: '#05070f',
    apron: ['#03050a', '#0c1220'],
    accent: 'rgba(80,255,200,0.14)',
    glow: 'rgba(80,255,200,0.18)',
    spot: 'rgba(100,255,220,0.1)',
  },
];

export const DISC_UNLOCKS = [
  {
    id: 'classic',
    cost: 0,
    rim: 'rgba(255,255,255,0.55)',
    tint: null,
    motion: 'breathe',
  },
  {
    id: 'chrome',
    cost: 100,
    rim: '#d7dce2',
    tint: 'rgba(220,230,240,0.28)',
    motion: 'shine',
  },
  {
    id: 'ember',
    cost: 200,
    rim: '#ff8a4c',
    tint: 'rgba(255,120,60,0.28)',
    motion: 'ember',
  },
  {
    id: 'gold',
    cost: 350,
    rim: '#e0b44a',
    tint: 'rgba(224,180,74,0.32)',
    motion: 'gleam',
  },
  {
    id: 'galaxy',
    cost: 550,
    rim: '#9b7dff',
    tint: 'rgba(120,90,255,0.3)',
    motion: 'orbit',
  },
];

export const DEFAULT_UNLOCKED_STADIUMS = ['standard'];
export const DEFAULT_UNLOCKED_DISCS = ['classic'];

export function getStadiumMeta(id) {
  return STADIUM_UNLOCKS.find((s) => s.id === id) || STADIUM_UNLOCKS[0];
}

export function getDiscMeta(id) {
  return DISC_UNLOCKS.find((d) => d.id === id) || DISC_UNLOCKS[0];
}

/** Build STADIUMS map used by the pitch renderer */
export function stadiumsMap() {
  return Object.fromEntries(
    STADIUM_UNLOCKS.map((s) => [
      s.id,
      {
        id: s.id,
        grass: s.grass,
        line: s.line,
        glow: s.glow,
        pattern: s.pattern,
        border: s.border,
        apron: s.apron,
        accent: s.accent,
        spot: s.spot,
      },
    ]),
  );
}
