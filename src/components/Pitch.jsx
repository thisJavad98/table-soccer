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

function drawPitch(ctx, w, h, stadiumId) {
  const stadium = STADIUMS[stadiumId] || STADIUMS.standard;
  const [c0, c1, c2] = stadium.grass;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, c0);
  g.addColorStop(0.5, c1);
  g.addColorStop(1, c2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  const stripe = h / 12;
  for (let i = 0; i < 12; i += 1) {
    if (i % 2 === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.035)';
      ctx.fillRect(0, i * stripe, w, stripe);
    }
  }

  const pad = FIELD.padding;
  ctx.strokeStyle = stadium.line;
  ctx.lineWidth = 3;
  ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);

  ctx.beginPath();
  ctx.moveTo(w / 2, pad);
  ctx.lineTo(w / 2, h - pad);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 78, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 5, 0, Math.PI * 2);
  ctx.fillStyle = stadium.line;
  ctx.fill();

  const boxW = 120;
  const boxH = 250;
  ctx.strokeRect(pad, (h - boxH) / 2, boxW, boxH);
  ctx.strokeRect(w - pad - boxW, (h - boxH) / 2, boxW, boxH);

  const sixW = 55;
  const sixH = 140;
  ctx.strokeRect(pad, (h - sixH) / 2, sixW, sixH);
  ctx.strokeRect(w - pad - sixW, (h - sixH) / 2, sixW, sixH);

  const goalH = FIELD.goalHeight;
  const goalTop = (h - goalH) / 2;
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fillRect(4, goalTop, pad - 4, goalH);
  ctx.fillRect(w - pad, goalTop, pad - 4, goalH);
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 3.5;
  ctx.strokeRect(4, goalTop, pad - 4, goalH);
  ctx.strokeRect(w - pad, goalTop, pad - 4, goalH);
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

function drawDisc(ctx, p, { selected, locked, canControl, pulse }) {
  const r = p.r;

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

  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.lineWidth = canControl ? 2.5 : 1.5;
  ctx.strokeStyle = canControl ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.35)';
  ctx.stroke();
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

function paint(ctx, state, drag, interactive, pulse) {
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
    });
  }
  drawBall(ctx, state.ball);
  if (drag) {
    const player = state.players.find((p) => p.id === drag.playerId);
    if (player) drawAim(ctx, player, drag.pointer, drag.power);
  }
}

const Pitch = forwardRef(function Pitch(
  { state, onKick, interactive, onPowerChange },
  ref,
) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [drag, setDrag] = useState(null);
  const dragRef = useRef(null);
  const stateRef = useRef(state);
  const interactiveRef = useRef(interactive);
  const pulseRef = useRef(0);
  const pulseRaf = useRef(0);

  stateRef.current = state;
  interactiveRef.current = interactive;

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
    paint(ctx, nextState, nextDrag, interactiveRef.current, pulseRef.current);
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

  useEffect(() => {
    if (!(interactive && state.phase === 'aim' && state.turn === 'human')) {
      cancelAnimationFrame(pulseRaf.current);
      return undefined;
    }
    let alive = true;
    const tick = (t) => {
      if (!alive) return;
      pulseRef.current = (Math.sin(t / 320) + 1) / 2;
      if (!dragRef.current) redraw();
      pulseRaf.current = requestAnimationFrame(tick);
    };
    pulseRaf.current = requestAnimationFrame(tick);
    return () => {
      alive = false;
      cancelAnimationFrame(pulseRaf.current);
    };
  }, [interactive, state.phase, state.turn]);

  function toFieldPoint(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = FIELD.width / rect.width;
    const scaleY = FIELD.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
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
    <div className={`pitch-shell ${aiming ? 'is-aiming' : ''} ${interactive ? 'is-live' : ''}`}>
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
  );
});

export default Pitch;
