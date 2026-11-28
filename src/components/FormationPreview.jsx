import { useId } from 'react';
import { FORMATIONS } from '../game/formations.js';
import { getDiscMeta, getStadiumMeta } from '../progress/catalog.js';

const W = 320;
const H = 200;
const PAD = 14;

function discFill(team, skin) {
  if (skin?.tint) return skin.tint;
  return team?.bands?.[1] || team?.secondary || '#fff';
}

function PatternLayer({ pattern, pad, w, h, accent, clipId }) {
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;
  let content = null;

  if (pattern === 'mow') {
    const stripe = innerW / 10;
    content = Array.from({ length: 10 }, (_, i) => (
      <rect
        key={i}
        x={pad + i * stripe}
        y={pad}
        width={stripe}
        height={innerH}
        fill={i % 2 === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
      />
    ));
  } else if (pattern === 'frost') {
    const stripe = innerH / 10;
    content = Array.from({ length: 10 }, (_, i) => (
      <rect
        key={i}
        x={pad}
        y={pad + i * stripe}
        width={innerW}
        height={stripe}
        fill={i % 2 === 0 ? 'rgba(180,210,255,0.06)' : 'rgba(0,0,0,0.05)'}
      />
    ));
  } else if (pattern === 'grit') {
    content = Array.from({ length: 48 }, (_, i) => {
      const x = pad + ((i * 47) % Math.max(1, innerW - 2));
      const y = pad + ((i * 31) % Math.max(1, innerH - 2));
      return (
        <rect
          key={i}
          x={x}
          y={y}
          width={1.4}
          height={1.4}
          fill={i % 2 ? 'rgba(255,230,190,0.12)' : 'rgba(40,20,8,0.14)'}
        />
      );
    });
  } else if (pattern === 'lava') {
    const maxCrackX = w - pad - 90;
    content = (
      <>
        {[0, 1, 2, 3].map((i) => {
          const x0 = Math.min(pad + 16 + i * 36, maxCrackX);
          const y0 = pad + 24 + ((i * 28) % Math.max(1, innerH - 48));
          return (
            <path
              key={i}
              d={`M${x0} ${y0} q28 14 48 -8 t40 18`}
              fill="none"
              stroke="rgba(255,90,40,0.22)"
              strokeWidth="1.5"
            />
          );
        })}
        {[0, 1, 2, 3, 4].map((i) => (
          <circle
            key={`e${i}`}
            cx={pad + 24 + i * Math.min(48, (innerW - 48) / 4)}
            cy={pad + 28 + ((i * 37) % Math.max(1, innerH - 56))}
            r={5}
            fill="rgba(255,110,40,0.14)"
          />
        ))}
      </>
    );
  } else if (pattern === 'grid') {
    const lines = [];
    for (let x = pad; x <= w - pad; x += 18) {
      lines.push(
        <line
          key={`v${x}`}
          x1={x}
          y1={pad}
          x2={x}
          y2={h - pad}
          stroke="rgba(80,255,200,0.1)"
          strokeWidth="0.8"
        />,
      );
    }
    for (let y = pad; y <= h - pad; y += 18) {
      lines.push(
        <line
          key={`h${y}`}
          x1={pad}
          y1={y}
          x2={w - pad}
          y2={y}
          stroke="rgba(80,255,200,0.1)"
          strokeWidth="0.8"
        />,
      );
    }
    content = lines;
  } else if (pattern === 'weave') {
    content = Array.from({ length: 10 }, (_, i) => {
      const y = pad + (innerH / 10) * i;
      const bend = Math.max(-4, Math.min(4, i % 2 ? 4 : -4));
      return (
        <path
          key={i}
          d={`M${pad} ${y} Q${w / 2} ${y + bend} ${w - pad} ${y}`}
          fill="none"
          stroke={accent || 'rgba(120,255,230,0.12)'}
          strokeWidth="2"
        />
      );
    });
  }

  if (!content) return null;
  return <g clipPath={`url(#${clipId})`}>{content}</g>;
}

export default function FormationPreview({
  formationId,
  stadiumId,
  team,
  discSkinId = 'classic',
  modeLabel,
  className = '',
}) {
  const uid = useId().replace(/:/g, '');
  const formation = FORMATIONS[formationId] || FORMATIONS.standard;
  const stadium = getStadiumMeta(stadiumId);
  const skin = getDiscMeta(discSkinId);
  const [g0, g1, g2] = stadium.grass;
  const [a0, a1] = stadium.apron || [stadium.border || '#111', stadium.border || '#111'];
  const line = stadium.line;
  const innerW = W - PAD * 2;
  const innerH = H - PAD * 2;
  const halfW = innerW / 2;
  const r = 9;
  const grassId = `fp-grass-${uid}`;
  const apronId = `fp-apron-${uid}`;
  const glowId = `fp-glow-${uid}`;
  const clipId = `fp-clip-${uid}`;
  const frameId = `fp-frame-${uid}`;

  const slots = formation.slots.map((slot, i) => {
    const x = PAD + halfW + (1 - slot.x) * halfW;
    const y = PAD + slot.y * innerH;
    return { x, y, i };
  });

  return (
    <figure className={`formation-preview ${className}`}>
      <svg
        className="formation-preview__svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={modeLabel}
      >
        <defs>
          <linearGradient id={apronId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={a0} />
            <stop offset="100%" stopColor={a1} />
          </linearGradient>
          <linearGradient id={grassId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={g0} />
            <stop offset="50%" stopColor={g1} />
            <stop offset="100%" stopColor={g2} />
          </linearGradient>
          {stadium.glow && (
            <radialGradient id={glowId} cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor={stadium.glow} />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
          )}
          <clipPath id={clipId}>
            <rect x={PAD} y={PAD} width={innerW} height={innerH} rx="2" />
          </clipPath>
          <clipPath id={frameId}>
            <rect width={W} height={H} rx="10" />
          </clipPath>
        </defs>

        <g clipPath={`url(#${frameId})`}>
          <rect width={W} height={H} fill={`url(#${apronId})`} rx="10" />
          <rect
            x={PAD - 2}
            y={PAD - 2}
            width={innerW + 4}
            height={innerH + 4}
            fill={`url(#${grassId})`}
            rx="3"
          />

          <PatternLayer
            pattern={stadium.pattern}
            pad={PAD}
            w={W}
            h={H}
            accent={stadium.accent}
            clipId={clipId}
          />

          {stadium.glow && (
            <rect width={W} height={H} fill={`url(#${glowId})`} rx="10" />
          )}

          <rect
            x={PAD}
            y={PAD}
            width={innerW}
            height={innerH}
            fill="none"
            stroke={line}
            strokeWidth="1.6"
            rx="2"
          />
          <line
            x1={W / 2}
            y1={PAD}
            x2={W / 2}
            y2={H - PAD}
            stroke={line}
            strokeWidth="1.4"
          />
          <circle
            cx={W / 2}
            cy={H / 2}
            r={22}
            fill={stadium.accent || 'rgba(255,255,255,0.05)'}
            stroke={line}
            strokeWidth="1.3"
          />
          <circle cx={W / 2} cy={H / 2} r={2.2} fill={line} />

          <rect
            x={PAD}
            y={H / 2 - 36}
            width={28}
            height={72}
            fill="none"
            stroke={line}
            strokeWidth="1.2"
          />
          <rect
            x={W - PAD - 28}
            y={H / 2 - 36}
            width={28}
            height={72}
            fill="none"
            stroke={line}
            strokeWidth="1.2"
          />
          <rect
            x={PAD}
            y={H / 2 - 22}
            width={14}
            height={44}
            fill="none"
            stroke={line}
            strokeWidth="1"
          />
          <rect
            x={W - PAD - 14}
            y={H / 2 - 22}
            width={14}
            height={44}
            fill="none"
            stroke={line}
            strokeWidth="1"
          />

          {/* Corner arcs */}
          <path d={`M${PAD} ${PAD + 8} A8 8 0 0 1 ${PAD + 8} ${PAD}`} fill="none" stroke={line} strokeWidth="1" />
          <path d={`M${W - PAD - 8} ${PAD} A8 8 0 0 1 ${W - PAD} ${PAD + 8}`} fill="none" stroke={line} strokeWidth="1" />
          <path d={`M${PAD + 8} ${H - PAD} A8 8 0 0 1 ${PAD} ${H - PAD - 8}`} fill="none" stroke={line} strokeWidth="1" />
          <path d={`M${W - PAD} ${H - PAD - 8} A8 8 0 0 1 ${W - PAD - 8} ${H - PAD}`} fill="none" stroke={line} strokeWidth="1" />

          <rect
            x={PAD}
            y={PAD}
            width={halfW}
            height={innerH}
            fill="rgba(0,0,0,0.16)"
          />

          {slots.map((s) => (
            <g key={s.i} className={`fp-disc fp-disc--${skin.motion || 'breathe'}`}>
              {skin.motion === 'ember' && (
                <circle
                  className="fp-disc__aura"
                  cx={s.x}
                  cy={s.y}
                  r={r + 6}
                  fill="rgba(255,100,40,0.2)"
                />
              )}
              {skin.motion === 'orbit' && (
                <circle
                  className="fp-disc__aura"
                  cx={s.x}
                  cy={s.y}
                  r={r + 7}
                  fill="rgba(120,90,255,0.18)"
                />
              )}
              {skin.motion === 'gleam' && (
                <circle
                  className="fp-disc__ring"
                  cx={s.x}
                  cy={s.y}
                  r={r + 4}
                  fill="none"
                  stroke="rgba(224,180,74,0.45)"
                  strokeWidth="1.5"
                  strokeDasharray="8 10"
                />
              )}
              <ellipse
                cx={s.x + 1}
                cy={s.y + r * 0.7}
                rx={r * 0.75}
                ry={r * 0.28}
                fill="rgba(0,0,0,0.28)"
              />
              <circle
                cx={s.x}
                cy={s.y}
                r={r}
                fill={discFill(team, skin)}
                stroke={skin.rim || 'rgba(255,255,255,0.75)'}
                strokeWidth="2"
              />
              <circle
                cx={s.x}
                cy={s.y}
                r={r * 0.42}
                fill={team?.bands?.[0] || team?.primary || '#222'}
                opacity="0.9"
              />
              {skin.motion === 'shine' && (
                <circle
                  className="fp-disc__shine"
                  cx={s.x - 3}
                  cy={s.y - 3}
                  r={r * 0.35}
                  fill="rgba(255,255,255,0.45)"
                />
              )}
            </g>
          ))}
        </g>
      </svg>
      {modeLabel && (
        <figcaption className="formation-preview__cap">{modeLabel}</figcaption>
      )}
    </figure>
  );
}
