import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { FIELD, HIT_SLOP, POSSESSION_RANGE } from '../game/constants.js';
import { STADIUMS } from '../game/formations.js';
import { clamp, dist } from '../game/engine.js';
import { getDiscMeta } from '../progress/catalog.js';

function seeded(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function drawApron(ctx, w, h, stadium) {
  const [a0, a1] = stadium.apron || [stadium.border || '#111', stadium.border || '#111'];
  const apron = ctx.createLinearGradient(0, 0, w, h);
  apron.addColorStop(0, a0);
  apron.addColorStop(1, a1);
  ctx.fillStyle = apron;
  ctx.fillRect(0, 0, w, h);

  // Side boards
  ctx.fillStyle = stadium.border || '#0a0a0a';
  ctx.fillRect(0, 0, w, 10);
  ctx.fillRect(0, h - 10, w, 10);
  ctx.fillRect(0, 0, 8, h);
  ctx.fillRect(w - 8, 0, 8, h);

  // Subtle board highlights
  ctx.strokeStyle = stadium.accent || 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 2;
  ctx.strokeRect(6, 6, w - 12, h - 12);
}

function drawSurface(ctx, w, h, stadium) {
  const [c0, c1, c2] = stadium.grass;
  const pad = FIELD.padding;
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;
  const g = ctx.createLinearGradient(0, pad, 0, h - pad);
  g.addColorStop(0, c0);
  g.addColorStop(0.5, c1);
  g.addColorStop(1, c2);
  ctx.fillStyle = g;
  ctx.fillRect(pad - 2, pad - 2, innerW + 4, innerH + 4);

  // Keep every stadium pattern inside the grass — no apron overflow
  ctx.save();
  ctx.beginPath();
  ctx.rect(pad, pad, innerW, innerH);
  ctx.clip();

  const pattern = stadium.pattern || 'mow';
  if (pattern === 'mow') {
    const stripe = innerW / 14;
    for (let i = 0; i < 14; i += 1) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.045)';
      ctx.fillRect(pad + i * stripe, pad, stripe, innerH);
    }
  } else if (pattern === 'frost') {
    const stripe = innerH / 16;
    for (let i = 0; i < 16; i += 1) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(180,210,255,0.05)' : 'rgba(0,0,0,0.05)';
      ctx.fillRect(pad, pad + i * stripe, innerW, stripe);
    }
  } else if (pattern === 'grit') {
    for (let i = 0; i < 420; i += 1) {
      const s = 0.8 + seeded(i * 2.2) * 2.2;
      const x = pad + seeded(i * 3.1) * Math.max(0, innerW - s);
      const y = pad + seeded(i * 7.7) * Math.max(0, innerH - s);
      ctx.fillStyle =
        seeded(i) > 0.5 ? 'rgba(255,230,190,0.07)' : 'rgba(40,20,8,0.1)';
      ctx.fillRect(x, y, s, s);
    }
  } else if (pattern === 'lava') {
    const maxX = w - pad;
    const maxY = h - pad;
    ctx.strokeStyle = 'rgba(255,90,40,0.18)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 9; i += 1) {
      ctx.beginPath();
      let x = pad + seeded(i * 11) * innerW;
      let y = pad + seeded(i * 17) * innerH;
      ctx.moveTo(x, y);
      for (let j = 0; j < 5; j += 1) {
        x = clamp(x + (seeded(i * 40 + j) - 0.5) * 90, pad, maxX);
        y = clamp(y + (seeded(i * 55 + j) - 0.35) * 70, pad, maxY);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    for (let i = 0; i < 30; i += 1) {
      const r = 4 + seeded(400 + i) * 10;
      const x = pad + r + seeded(200 + i) * Math.max(0, innerW - r * 2);
      const y = pad + r + seeded(300 + i) * Math.max(0, innerH - r * 2);
      const ember = ctx.createRadialGradient(x, y, 0, x, y, r);
      ember.addColorStop(0, 'rgba(255,120,40,0.18)');
      ember.addColorStop(1, 'rgba(255,80,20,0)');
      ctx.fillStyle = ember;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (pattern === 'grid') {
    ctx.strokeStyle = 'rgba(80,255,200,0.08)';
    ctx.lineWidth = 1;
    for (let x = pad; x <= w - pad; x += 28) {
      ctx.beginPath();
      ctx.moveTo(x, pad);
      ctx.lineTo(x, h - pad);
      ctx.stroke();
    }
    for (let y = pad; y <= h - pad; y += 28) {
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(w - pad, y);
      ctx.stroke();
    }
  } else if (pattern === 'weave') {
    for (let i = 0; i < 18; i += 1) {
      const y = pad + (innerH / 18) * i;
      ctx.strokeStyle =
        i % 2 === 0 ? 'rgba(120,255,230,0.07)' : 'rgba(40,120,180,0.08)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(pad, y);
      for (let x = pad; x <= w - pad; x += 24) {
        ctx.lineTo(x, clamp(y + Math.sin(x * 0.04 + i) * 4, pad, h - pad));
      }
      ctx.stroke();
    }
  }

  // Soft center vignette
  const vignette = ctx.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, w * 0.62);
  vignette.addColorStop(0, 'rgba(255,255,255,0.03)');
  vignette.addColorStop(0.55, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.18)');
  ctx.fillStyle = vignette;
  ctx.fillRect(pad, pad, innerW, innerH);
  ctx.restore();
}

function drawMarkings(ctx, w, h, stadium) {
  const pad = FIELD.padding;
  const line = stadium.line;

  ctx.strokeStyle = line;
  ctx.fillStyle = line;
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';

  // Touchline
  ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);

  // Halfway
  ctx.beginPath();
  ctx.moveTo(w / 2, pad);
  ctx.lineTo(w / 2, h - pad);
  ctx.stroke();

  // Center circle + spot
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 78, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 5, 0, Math.PI * 2);
  ctx.fill();

  // Center circle soft fill
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 78, 0, Math.PI * 2);
  ctx.fillStyle = stadium.accent || 'rgba(255,255,255,0.05)';
  ctx.fill();
  ctx.fillStyle = line;

  const boxW = 120;
  const boxH = 250;
  const sixW = 55;
  const sixH = 140;
  const penR = 55;
  const spotX = 88;
  // Only the arc outside the box (D) — angle at the box edge
  const penTheta = Math.acos(
    Math.min(1, Math.max(-1, (boxW - spotX) / penR)),
  );

  // Penalty areas
  ctx.strokeRect(pad, (h - boxH) / 2, boxW, boxH);
  ctx.strokeRect(w - pad - boxW, (h - boxH) / 2, boxW, boxH);

  // Six-yard boxes
  ctx.strokeRect(pad, (h - sixH) / 2, sixW, sixH);
  ctx.strokeRect(w - pad - sixW, (h - sixH) / 2, sixW, sixH);

  // Penalty spots
  ctx.beginPath();
  ctx.arc(pad + spotX, h / 2, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(w - pad - spotX, h / 2, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Penalty arcs (outside the box only — no overlap into the area)
  ctx.beginPath();
  ctx.arc(pad + spotX, h / 2, penR, -penTheta, penTheta);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(w - pad - spotX, h / 2, penR, Math.PI - penTheta, Math.PI + penTheta);
  ctx.stroke();

  // Corner arcs
  const cornerR = 14;
  const corners = [
    [pad, pad, 0, Math.PI / 2],
    [w - pad, pad, Math.PI / 2, Math.PI],
    [pad, h - pad, -Math.PI / 2, 0],
    [w - pad, h - pad, Math.PI, Math.PI * 1.5],
  ];
  for (const [cx, cy, a0, a1] of corners) {
    ctx.beginPath();
    ctx.arc(cx, cy, cornerR, a0, a1);
    ctx.stroke();
  }

  // Corner flags / pegs
  ctx.fillStyle = stadium.accent || 'rgba(255,255,255,0.2)';
  for (const [cx, cy] of [
    [pad, pad],
    [w - pad, pad],
    [pad, h - pad],
    [w - pad, h - pad],
  ]) {
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGoals(ctx, w, h, stadium) {
  const pad = FIELD.padding;
  const goalH = FIELD.goalHeight;
  const goalTop = (h - goalH) / 2;
  const mouth = pad - 4;

  // Goal mouths
  for (const x of [4, w - pad]) {
    const gx = x === 4 ? 4 : w - pad;
    const net = ctx.createLinearGradient(gx, 0, gx + mouth, 0);
    if (x === 4) {
      net.addColorStop(0, 'rgba(0,0,0,0.45)');
      net.addColorStop(1, 'rgba(0,0,0,0.18)');
    } else {
      net.addColorStop(0, 'rgba(0,0,0,0.18)');
      net.addColorStop(1, 'rgba(0,0,0,0.45)');
    }
    ctx.fillStyle = net;
    ctx.fillRect(gx, goalTop, mouth, goalH);

    // Net mesh
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 6; i += 1) {
      const ny = goalTop + (goalH / 6) * i;
      ctx.beginPath();
      ctx.moveTo(gx, ny);
      ctx.lineTo(gx + mouth, ny);
      ctx.stroke();
    }
    for (let i = 1; i < 4; i += 1) {
      const nx = gx + (mouth / 4) * i;
      ctx.beginPath();
      ctx.moveTo(nx, goalTop);
      ctx.lineTo(nx, goalTop + goalH);
      ctx.stroke();
    }

    ctx.strokeStyle = stadium.line;
    ctx.lineWidth = 3.5;
    ctx.strokeRect(gx, goalTop, mouth, goalH);
  }

  // Crossbar shine
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(4, goalTop);
  ctx.lineTo(pad, goalTop);
  ctx.moveTo(w - pad, goalTop);
  ctx.lineTo(w - 4, goalTop);
  ctx.stroke();
}

function drawAtmosphere(ctx, w, h, stadium) {
  if (stadium.glow) {
    const aura = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, w * 0.55);
    aura.addColorStop(0, stadium.glow);
    aura.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = aura;
    ctx.fillRect(0, 0, w, h);
  }

  if (stadium.spot) {
    const spots = [
      [w * 0.22, h * 0.2],
      [w * 0.78, h * 0.2],
      [w * 0.22, h * 0.8],
      [w * 0.78, h * 0.8],
      [w * 0.5, h * 0.5],
    ];
    for (const [sx, sy] of spots) {
      const beam = ctx.createRadialGradient(sx, sy, 8, sx, sy, 120);
      beam.addColorStop(0, stadium.spot);
      beam.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.arc(sx, sy, 120, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Outer rim shadow into apron
  const rim = ctx.createLinearGradient(0, 0, 0, h);
  rim.addColorStop(0, 'rgba(0,0,0,0.25)');
  rim.addColorStop(0.08, 'rgba(0,0,0,0)');
  rim.addColorStop(0.92, 'rgba(0,0,0,0)');
  rim.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = rim;
  ctx.fillRect(0, 0, w, h);
}

function drawPitch(ctx, w, h, stadiumId) {
  const stadium = STADIUMS[stadiumId] || STADIUMS.standard;
  drawApron(ctx, w, h, stadium);
  drawSurface(ctx, w, h, stadium);
  drawMarkings(ctx, w, h, stadium);
  drawGoals(ctx, w, h, stadium);
  drawAtmosphere(ctx, w, h, stadium);
}

function clipDisc(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
}

function drawFlagFace(ctx, p) {
  const { x, y, r } = p;
  const bands = p.bands || [p.color, p.secondary, p.accent];
  const style = p.style || 'tricolor';

  ctx.save();
  clipDisc(ctx, x, y, r);

  if (style === 'tricolor') {
    const h = (r * 2) / 3;
    for (let i = 0; i < 3; i += 1) {
      ctx.fillStyle = bands[i];
      ctx.fillRect(x - r, y - r + i * h, r * 2, h + 1);
    }
  } else if (style === 'tricolor-v') {
    const w = (r * 2) / 3;
    for (let i = 0; i < 3; i += 1) {
      ctx.fillStyle = bands[i];
      ctx.fillRect(x - r + i * w, y - r, w + 1, r * 2);
    }
  } else if (style === 'spain') {
    // Red / double yellow / red
    ctx.fillStyle = bands[0];
    ctx.fillRect(x - r, y - r, r * 2, r * 0.5);
    ctx.fillStyle = bands[1];
    ctx.fillRect(x - r, y - r * 0.5, r * 2, r);
    ctx.fillStyle = bands[2];
    ctx.fillRect(x - r, y + r * 0.5, r * 2, r * 0.5);
  } else if (style === 'brazil') {
    ctx.fillStyle = bands[0];
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.beginPath();
    ctx.moveTo(x, y - r * 0.72);
    ctx.lineTo(x + r * 0.78, y);
    ctx.lineTo(x, y + r * 0.72);
    ctx.lineTo(x - r * 0.78, y);
    ctx.closePath();
    ctx.fillStyle = bands[1];
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, r * 0.34, 0, Math.PI * 2);
    ctx.fillStyle = bands[2];
    ctx.fill();
  } else if (style === 'japan') {
    ctx.fillStyle = bands[0];
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.beginPath();
    ctx.arc(x, y, r * 0.42, 0, Math.PI * 2);
    ctx.fillStyle = bands[1];
    ctx.fill();
  } else if (style === 'pale') {
    // Canada-style: red / white / red vertical
    const w = r * 0.28;
    ctx.fillStyle = bands[1];
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.fillStyle = bands[0];
    ctx.fillRect(x - r, y - r, w, r * 2);
    ctx.fillRect(x + r - w, y - r, w, r * 2);
    ctx.beginPath();
    ctx.arc(x, y, r * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = bands[0];
    ctx.fill();
  } else {
    ctx.fillStyle = p.color;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // Soft top highlight
  const shine = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, 1, x, y, r);
  shine.addColorStop(0, 'rgba(255,255,255,0.28)');
  shine.addColorStop(0.55, 'rgba(255,255,255,0)');
  ctx.fillStyle = shine;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}

function drawSkinAura(ctx, p, skin, t) {
  const { x, y, r } = p;
  const motion = skin.motion || 'breathe';
  const phase = t * 0.001;
  const idHash = (p.index || 0) * 1.7;

  if (motion === 'breathe') {
    const a = 0.12 + Math.sin(phase * 2.2 + idHash) * 0.06;
    ctx.beginPath();
    ctx.arc(x, y, r + 4 + Math.sin(phase * 2.2 + idHash) * 1.5, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,255,255,${a})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    return;
  }

  if (motion === 'shine') {
    const pulse = 0.2 + Math.sin(phase * 3 + idHash) * 0.1;
    ctx.beginPath();
    ctx.arc(x, y, r + 5, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(210,230,245,${pulse})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    return;
  }

  if (motion === 'ember') {
    const flicker = 0.35 + Math.sin(phase * 8 + idHash) * 0.15 + Math.sin(phase * 13) * 0.08;
    const glow = ctx.createRadialGradient(x, y, r * 0.4, x, y, r + 14);
    glow.addColorStop(0, `rgba(255,120,40,${0.05 + flicker * 0.12})`);
    glow.addColorStop(0.55, `rgba(255,80,20,${0.12 + flicker * 0.2})`);
    glow.addColorStop(1, 'rgba(255,40,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, r + 14, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 5; i += 1) {
      const ang = phase * 2.4 + idHash + i * ((Math.PI * 2) / 5);
      const rise = ((phase * 40 + i * 17 + idHash * 10) % 18);
      const px = x + Math.cos(ang) * (r * 0.35 + rise * 0.35);
      const py = y - rise * 0.9 + Math.sin(ang * 2) * 2;
      const alpha = Math.max(0, 0.7 - rise / 22);
      ctx.beginPath();
      ctx.arc(px, py, 1.6 + (1 - rise / 18), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,${140 + i * 15},60,${alpha})`;
      ctx.fill();
    }
    return;
  }

  if (motion === 'gleam') {
    const spin = phase * 1.6 + idHash;
    ctx.beginPath();
    ctx.arc(x, y, r + 6 + Math.sin(phase * 3) * 1.2, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(224,180,74,${0.25 + Math.sin(phase * 2) * 0.12})`;
    ctx.lineWidth = 2.2;
    ctx.stroke();

    for (let i = 0; i < 3; i += 1) {
      const a0 = spin + i * ((Math.PI * 2) / 3);
      ctx.beginPath();
      ctx.arc(x, y, r + 3, a0, a0 + 0.55);
      ctx.strokeStyle = `rgba(255,230,150,${0.45 + Math.sin(phase * 4 + i) * 0.25})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    return;
  }

  if (motion === 'orbit') {
    const aura = ctx.createRadialGradient(x, y, r * 0.2, x, y, r + 16);
    aura.addColorStop(0, `rgba(140,100,255,${0.08 + Math.sin(phase * 2) * 0.04})`);
    aura.addColorStop(0.6, `rgba(90,60,220,${0.14 + Math.sin(phase * 1.5 + idHash) * 0.06})`);
    aura.addColorStop(1, 'rgba(60,20,180,0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(x, y, r + 16, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 6; i += 1) {
      const ang = phase * (1.2 + i * 0.15) + i * ((Math.PI * 2) / 6) + idHash;
      const rad = r + 7 + Math.sin(phase * 3 + i) * 2.5;
      const px = x + Math.cos(ang) * rad;
      const py = y + Math.sin(ang) * rad;
      const twinkle = 0.4 + Math.sin(phase * 6 + i * 2) * 0.4;
      ctx.beginPath();
      ctx.arc(px, py, 1.2 + twinkle * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220,200,255,${twinkle})`;
      ctx.fill();
    }
  }
}

function drawSkinOverlay(ctx, p, skin, t) {
  const { x, y, r } = p;
  const motion = skin.motion || 'breathe';
  const phase = t * 0.001;
  const idHash = (p.index || 0) * 1.7;

  if (skin.tint) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = skin.tint;
    ctx.fill();
  }

  ctx.save();
  clipDisc(ctx, x, y, r);

  if (motion === 'shine') {
    const sweep = ((phase * 0.55 + idHash * 0.1) % 1.4) - 0.2;
    const gx = x - r + sweep * r * 2.4;
    const band = ctx.createLinearGradient(gx - 8, y - r, gx + 14, y + r);
    band.addColorStop(0, 'rgba(255,255,255,0)');
    band.addColorStop(0.45, 'rgba(255,255,255,0.55)');
    band.addColorStop(0.55, 'rgba(200,220,240,0.35)');
    band.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = band;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  } else if (motion === 'ember') {
    const flicker = 0.5 + Math.sin(phase * 9 + idHash) * 0.35;
    const heat = ctx.createRadialGradient(
      x + Math.sin(phase * 4) * 3,
      y + 4,
      1,
      x,
      y,
      r,
    );
    heat.addColorStop(0, `rgba(255,200,80,${0.2 * flicker})`);
    heat.addColorStop(0.45, `rgba(255,90,30,${0.18 * flicker})`);
    heat.addColorStop(1, 'rgba(120,20,0,0)');
    ctx.fillStyle = heat;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  } else if (motion === 'gleam') {
    const spin = phase * 1.8 + idHash;
    for (let i = 0; i < 2; i += 1) {
      const ang = spin + i * Math.PI;
      const gx = x + Math.cos(ang) * r * 0.35;
      const gy = y + Math.sin(ang) * r * 0.35;
      const spark = ctx.createRadialGradient(gx, gy, 0, gx, gy, r * 0.7);
      spark.addColorStop(0, 'rgba(255,245,180,0.55)');
      spark.addColorStop(0.4, 'rgba(224,180,74,0.2)');
      spark.addColorStop(1, 'rgba(224,180,74,0)');
      ctx.fillStyle = spark;
      ctx.beginPath();
      ctx.arc(gx, gy, r * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 4; i += 1) {
      const blink = Math.sin(phase * 7 + i * 1.3 + idHash);
      if (blink < 0.2) continue;
      const ang = idHash + i * 1.7 + phase * 0.4;
      const px = x + Math.cos(ang) * r * (0.25 + (i % 3) * 0.2);
      const py = y + Math.sin(ang) * r * (0.25 + (i % 2) * 0.25);
      ctx.fillStyle = `rgba(255,250,210,${0.35 + blink * 0.4})`;
      ctx.fillRect(px - 1, py - 1, 2, 2);
    }
  } else if (motion === 'orbit') {
    const swirl = phase * 1.3 + idHash;
    for (let i = 0; i < 3; i += 1) {
      const ang = swirl + i * ((Math.PI * 2) / 3);
      const nx = x + Math.cos(ang) * r * 0.35;
      const ny = y + Math.sin(ang) * r * 0.35;
      const nebula = ctx.createRadialGradient(nx, ny, 0, nx, ny, r * 0.85);
      nebula.addColorStop(0, `rgba(180,140,255,${0.22})`);
      nebula.addColorStop(0.5, `rgba(80,60,200,${0.12})`);
      nebula.addColorStop(1, 'rgba(40,20,120,0)');
      ctx.fillStyle = nebula;
      ctx.beginPath();
      ctx.arc(nx, ny, r * 0.85, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 8; i += 1) {
      const tw = 0.3 + Math.sin(phase * 5 + i * 2.1) * 0.7;
      if (tw < 0.35) continue;
      const ang = i * 0.9 + phase * 0.7;
      const px = x + Math.cos(ang) * r * (0.15 + (i % 4) * 0.18);
      const py = y + Math.sin(ang * 1.3) * r * (0.15 + (i % 3) * 0.2);
      ctx.fillStyle = `rgba(255,255,255,${tw * 0.85})`;
      ctx.beginPath();
      ctx.arc(px, py, 0.9 + tw * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawDisc(ctx, p, { selected, locked, canControl, pulse, time }) {
  const r = p.r;
  const skin = getDiscMeta(p.discSkinId);
  const t = time || 0;
  const humanSkin = p.team === 'human';

  if (humanSkin) drawSkinAura(ctx, p, skin, t);

  if (canControl && pulse) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, r + 6 + pulse * 4, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(160,134,114,${0.25 + pulse * 0.35})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  if (selected || locked) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, r + 5, 0, Math.PI * 2);
    ctx.strokeStyle = locked ? 'rgba(255,220,120,0.95)' : 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.ellipse(p.x + 2, p.y + r * 0.75, r * 0.85, r * 0.28, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fill();

  drawFlagFace(ctx, p);

  if (humanSkin) drawSkinOverlay(ctx, p, skin, t);

  const rimPulse =
    humanSkin && skin.motion !== 'breathe'
      ? 0.75 + Math.sin(t * 0.003 + (p.index || 0)) * 0.25
      : 1;

  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.lineWidth = canControl ? 2.5 : 1.5;
  ctx.globalAlpha = rimPulse;
  ctx.strokeStyle = canControl
    ? skin.rim || 'rgba(255,255,255,0.7)'
    : p.team === 'human'
      ? skin.rim || 'rgba(255,255,255,0.55)'
      : 'rgba(0,0,0,0.35)';
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawBall(ctx, ball) {
  const grd = ctx.createRadialGradient(
    ball.x - 4,
    ball.y - 4,
    1,
    ball.x,
    ball.y,
    ball.r,
  );
  grd.addColorStop(0, '#ffffff');
  grd.addColorStop(1, '#d0d0d0');
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fillStyle = grd;
  ctx.fill();
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r * 0.45, 0, Math.PI * 2);
  ctx.stroke();
}

function drawAim(ctx, from, pullPoint, power) {
  const pullAngle = Math.atan2(pullPoint.y - from.y, pullPoint.x - from.x);
  const travel = pullAngle + Math.PI;
  const len = 36 + power * 110;
  const tx = from.x + Math.cos(travel) * len;
  const ty = from.y + Math.sin(travel) * len;

  ctx.strokeStyle = `rgba(255,255,255,${0.4 + power * 0.5})`;
  ctx.lineWidth = 2.5 + power * 3.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(tx, ty);
  ctx.stroke();

  const ah = 12 + power * 6;
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.lineTo(tx - Math.cos(travel - 0.45) * ah, ty - Math.sin(travel - 0.45) * ah);
  ctx.lineTo(tx - Math.cos(travel + 0.45) * ah, ty - Math.sin(travel + 0.45) * ah);
  ctx.closePath();
  ctx.fillStyle = `rgba(255,255,255,${0.55 + power * 0.4})`;
  ctx.fill();

  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = 'rgba(255,200,120,0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(pullPoint.x, pullPoint.y);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.arc(from.x, from.y, POSSESSION_RANGE, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.stroke();
}

function drawOrbitGuide(ctx, orbit) {
  if (!orbit) return;
  ctx.beginPath();
  ctx.arc(orbit.cx, orbit.cy, orbit.radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 220, 120, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 5]);
  ctx.stroke();
  ctx.setLineDash([]);

  const endAng = orbit.fromAngle + orbit.delta;
  const tx = orbit.cx + Math.cos(endAng) * orbit.radius;
  const ty = orbit.cy + Math.sin(endAng) * orbit.radius;
  ctx.beginPath();
  ctx.arc(tx, ty, 5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 220, 120, 0.7)';
  ctx.fill();
}

function paint(ctx, state, drag, interactive, pulse, time) {
  drawPitch(ctx, FIELD.width, FIELD.height, state.stadiumId);
  if (state.phase === 'orbit' && state.orbit) {
    drawOrbitGuide(ctx, state.orbit);
  }
  for (const p of state.players) {
    const canControl =
      interactive &&
      state.phase === 'aim' &&
      state.turn === 'human' &&
      p.team === 'human' &&
      (!state.lockedPlayerId || state.lockedPlayerId === p.id);
    drawDisc(ctx, p, {
      selected: drag?.playerId === p.id,
      locked: state.lockedPlayerId === p.id || state.orbit?.playerId === p.id,
      canControl,
      pulse: canControl ? pulse : 0,
      time,
    });
  }
  drawBall(ctx, state.ball);
  if (drag) {
    const player = state.players.find((p) => p.id === drag.playerId);
    if (player) drawAim(ctx, player, drag.pointer, drag.power);
  }
}

const PORTRAIT_MQ = '(max-width: 820px) and (orientation: portrait)';

const Pitch = forwardRef(function Pitch(
  { state, onKick, interactive, onPowerChange },
  ref,
) {
  const canvasRef = useRef(null);
  const rotateRef = useRef(null);
  const ctxRef = useRef(null);
  const [drag, setDrag] = useState(null);
  const [portrait, setPortrait] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(PORTRAIT_MQ).matches : false,
  );
  const dragRef = useRef(null);
  const stateRef = useRef(state);
  const interactiveRef = useRef(interactive);
  const portraitRef = useRef(portrait);
  const pulseRef = useRef(0);
  const timeRef = useRef(0);
  const pulseRaf = useRef(0);

  stateRef.current = state;
  interactiveRef.current = interactive;
  portraitRef.current = portrait;

  useEffect(() => {
    const mq = window.matchMedia(PORTRAIT_MQ);
    const sync = () => setPortrait(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  function ensureCtx() {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    if (!ctxRef.current) {
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      canvas.width = FIELD.width * dpr;
      canvas.height = FIELD.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctxRef.current = ctx;
    }
    return ctxRef.current;
  }

  function redraw(nextState = stateRef.current, nextDrag = dragRef.current) {
    const ctx = ensureCtx();
    if (!ctx) return;
    paint(
      ctx,
      nextState,
      nextDrag,
      interactiveRef.current,
      pulseRef.current,
      timeRef.current,
    );
  }

  useImperativeHandle(ref, () => ({
    draw(nextState) {
      stateRef.current = nextState;
      redraw(nextState, dragRef.current);
    },
  }));

  useEffect(() => {
    redraw(state, drag);
  }, [state, drag, interactive]);

  // Continuous skin motion + control pulse
  useEffect(() => {
    let alive = true;
    const tick = (t) => {
      if (!alive) return;
      timeRef.current = t;
      pulseRef.current = (Math.sin(t / 320) + 1) / 2;
      // Skip extra draw while physics loop already paints every frame
      const phase = stateRef.current?.phase;
      if (phase !== 'resolve' && phase !== 'orbit') {
        redraw();
      }
      pulseRaf.current = requestAnimationFrame(tick);
    };
    pulseRaf.current = requestAnimationFrame(tick);
    return () => {
      alive = false;
      cancelAnimationFrame(pulseRaf.current);
    };
  }, []);

  function toFieldPoint(e) {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    // Portrait: canvas is CSS-rotated 90° CW so bot goal is top, human bottom.
    // Map through the unrotated portrait wrapper, not the transformed AABB.
    if (portraitRef.current && rotateRef.current) {
      const wrap = rotateRef.current.getBoundingClientRect();
      const px = clientX - wrap.left;
      const py = clientY - wrap.top;
      return {
        x: (py / Math.max(1, wrap.height)) * FIELD.width,
        y: (1 - px / Math.max(1, wrap.width)) * FIELD.height,
      };
    }

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = FIELD.width / rect.width;
    const scaleY = FIELD.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  function startDrag(e) {
    if (!interactive || state.phase !== 'aim' || state.turn !== 'human') return;
    e.preventDefault();
    const pt = toFieldPoint(e);
    let pool = state.players.filter((p) => p.team === 'human');
    if (state.lockedPlayerId) {
      pool = pool.filter((p) => p.id === state.lockedPlayerId);
    }
    const hit = pool
      .map((p) => ({ p, d: dist(p, pt) }))
      .filter((x) => x.d < x.p.r + HIT_SLOP)
      .sort((a, b) => a.d - b.d)[0];
    if (!hit) return;
    const next = { playerId: hit.p.id, pointer: pt, power: 0.15 };
    dragRef.current = next;
    setDrag(next);
    onPowerChange?.(0.15);
  }

  function moveDrag(e) {
    if (!dragRef.current) return;
    e.preventDefault();
    const pt = toFieldPoint(e);
    const player = stateRef.current.players.find(
      (p) => p.id === dragRef.current.playerId,
    );
    if (!player) return;
    const power = clamp(dist(player, pt) / 140, 0.12, 1);
    const next = { ...dragRef.current, pointer: pt, power };
    dragRef.current = next;
    setDrag(next);
    onPowerChange?.(power);
  }

  function endDrag(e) {
    if (!dragRef.current) return;
    e.preventDefault();
    const current = dragRef.current;
    const player = stateRef.current.players.find((p) => p.id === current.playerId);
    dragRef.current = null;
    setDrag(null);
    onPowerChange?.(0);
    if (player && current.power >= 0.12) {
      const pullAngle = Math.atan2(
        current.pointer.y - player.y,
        current.pointer.x - player.x,
      );
      onKick(current.playerId, {
        angle: pullAngle + Math.PI,
        power: current.power,
      });
    }
  }

  const aiming = Boolean(drag);

  return (
    <div
      className={`pitch-shell ${aiming ? 'is-aiming' : ''} ${interactive ? 'is-live' : ''} ${portrait ? 'is-portrait' : ''}`}
    >
      <div className="pitch-rotate" ref={rotateRef}>
        <canvas
          ref={canvasRef}
          className="pitch-canvas"
          style={{ touchAction: 'none' }}
          width={FIELD.width}
          height={FIELD.height}
          onMouseDown={startDrag}
          onMouseMove={moveDrag}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
          onTouchStart={startDrag}
          onTouchMove={moveDrag}
          onTouchEnd={endDrag}
        />
      </div>
    </div>
  );
});

export default Pitch;
