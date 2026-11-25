import { useEffect, useRef } from 'react';
import { useI18n } from '../i18n/index.jsx';

function spawnBurst(w, h, scorer, teamColors) {
  const particles = [];
  const isYou = scorer === 'human';
  const palette = isYou
    ? [teamColors.primary, teamColors.secondary, teamColors.accent, '#a08672', '#f2f2f2', '#ffd078']
    : [teamColors.primary, teamColors.secondary, teamColors.accent, '#8f8f8f', '#cfcfcf'];

  // Center firework burst
  for (let i = 0; i < 90; i += 1) {
    const ang = (Math.PI * 2 * i) / 90 + Math.random() * 0.2;
    const speed = 4 + Math.random() * 11;
    particles.push({
      x: w * 0.5,
      y: h * 0.42,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed - 2,
      life: 1,
      decay: 0.008 + Math.random() * 0.012,
      size: 3 + Math.random() * 5,
      color: palette[i % palette.length],
      kind: 'spark',
      spin: (Math.random() - 0.5) * 0.4,
      rot: Math.random() * Math.PI,
    });
  }

  // Confetti rain
  for (let i = 0; i < 70; i += 1) {
    particles.push({
      x: Math.random() * w,
      y: -20 - Math.random() * h * 0.35,
      vx: (Math.random() - 0.5) * 3,
      vy: 2 + Math.random() * 4,
      life: 1,
      decay: 0.003 + Math.random() * 0.004,
      size: 4 + Math.random() * 7,
      color: palette[i % palette.length],
      kind: 'confetti',
      spin: (Math.random() - 0.5) * 0.25,
      rot: Math.random() * Math.PI,
      w: 4 + Math.random() * 8,
      h: 8 + Math.random() * 10,
    });
  }

  // Goal-mouth side streaks
  const sideX = scorer === 'human' ? w * 0.08 : w * 0.92;
  for (let i = 0; i < 40; i += 1) {
    const ang = scorer === 'human' ? -0.4 + Math.random() * 0.8 : Math.PI - 0.4 + Math.random() * 0.8;
    const speed = 6 + Math.random() * 10;
    particles.push({
      x: sideX,
      y: h * 0.5 + (Math.random() - 0.5) * h * 0.25,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      life: 1,
      decay: 0.012 + Math.random() * 0.015,
      size: 2 + Math.random() * 4,
      color: '#ffffff',
      kind: 'streak',
      spin: 0,
      rot: ang,
    });
  }

  return particles;
}

export default function GoalCelebration({ scorer, team, score, onDone }) {
  const { t } = useI18n();
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const rafRef = useRef(0);
  const startRef = useRef(0);

  const isYou = scorer === 'human';
  const title = isYou ? t.goal : t.botScores;
  const subtitle = isYou ? t.goalWow : t.goalConceded;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    function resize() {
      const { clientWidth: w, clientHeight: h } = canvas;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w, h };
    }

    const { w, h } = resize();
    particlesRef.current = spawnBurst(w, h, scorer, team);
    startRef.current = performance.now();

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      const t = window.setTimeout(() => onDone?.(), 900);
      return () => clearTimeout(t);
    }

    let alive = true;
    const loop = (now) => {
      if (!alive) return;
      const { w: cw, h: ch } = resize();
      ctx.clearRect(0, 0, cw, ch);

      // Soft radial flash
      const elapsed = (now - startRef.current) / 1000;
      const flash = Math.max(0, 1 - elapsed * 1.6);
      if (flash > 0) {
        const g = ctx.createRadialGradient(cw / 2, ch * 0.42, 10, cw / 2, ch * 0.42, cw * 0.55);
        g.addColorStop(0, `rgba(255, 220, 140, ${0.35 * flash})`);
        g.addColorStop(0.45, `rgba(160, 134, 114, ${0.18 * flash})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, cw, ch);
      }

      const next = [];
      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.kind === 'confetti' ? 0.12 : 0.06;
        p.vx *= 0.99;
        p.life -= p.decay;
        p.rot += p.spin;
        if (p.life <= 0) continue;

        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        if (p.kind === 'confetti') {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        } else if (p.kind === 'streak') {
          ctx.fillRect(0, -1, p.size * 4, 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size * p.life, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        next.push(p);
      }
      ctx.globalAlpha = 1;
      particlesRef.current = next;

      // Second burst at ~0.55s
      if (elapsed > 0.55 && elapsed < 0.58 && particlesRef.current.length < 160) {
        particlesRef.current.push(...spawnBurst(cw, ch, scorer, team).slice(0, 50));
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      alive = false;
      cancelAnimationFrame(rafRef.current);
    };
    // restart only when a new goal fires
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scorer, score.human, score.bot]);

  return (
    <div
      className={`goal-fx ${isYou ? 'goal-fx--you' : 'goal-fx--bot'}`}
      role="status"
      aria-live="assertive"
    >
      <canvas ref={canvasRef} className="goal-fx__canvas" />
      <div className="goal-fx__rings" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="goal-fx__copy">
        <p className="goal-fx__eyebrow">{subtitle}</p>
        <h2 className="goal-fx__title">{title}</h2>
        <p className="goal-fx__score">
          <span className={isYou ? 'is-pop' : ''}>{score.human}</span>
          <span className="goal-fx__dash">–</span>
          <span className={!isYou ? 'is-pop' : ''}>{score.bot}</span>
        </p>
      </div>
    </div>
  );
}
