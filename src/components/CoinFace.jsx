/** Shared face art for the toss coin and the pick buttons. */
export default function CoinFace({ side, label, size = 'md' }) {
  const isHeads = side === 'heads';

  return (
    <div
      className={`coin-face coin-face--${side} coin-face--${size}`}
      data-side={side}
    >
      <span className="coin-face__ring" aria-hidden="true" />
      <span className="coin-face__art" aria-hidden="true">
        {isHeads ? <LionMark /> : <LinesMark />}
      </span>
      <span className="coin-face__word">{label}</span>
    </div>
  );
}

function LionMark() {
  return (
    <svg
      className="coin-face__svg"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Mane */}
      <path
        d="M32 7c-4.8 0-8.6 2.2-11.2 5.1C18.4 10.4 15.8 9 13 9c-4.2 0-7.5 3.4-7.5 7.5 0 1.6.5 3.1 1.4 4.3C4.2 24.2 2 28.4 2 33.2 2 44.2 12.2 52 25.5 53.8c.2 1.2.3 2.4.3 3.7H22c-1.4 0-2.5 1.1-2.5 2.5S20.6 62 22 62h20c1.4 0 2.5-1.1 2.5-2.5S43.4 57 42 57h-3.8c0-1.3.1-2.5.3-3.7C51.8 52 62 44.2 62 33.2c0-4.8-2.2-9-5-12.4.9-1.2 1.4-2.7 1.4-4.3 0-4.1-3.3-7.5-7.5-7.5-2.8 0-5.4 1.4-7.8 3.1C40.6 9.2 36.8 7 32 7z"
        fill="currentColor"
      />
      {/* Face cutout */}
      <ellipse cx="32" cy="31" rx="13.5" ry="12.5" fill="#2a1a08" opacity="0.18" />
      {/* Eyes */}
      <circle cx="26" cy="29" r="2.4" fill="#2a1a08" />
      <circle cx="38" cy="29" r="2.4" fill="#2a1a08" />
      {/* Nose + mouth */}
      <path
        d="M32 33.5c-1.6 0-2.8 1-2.8 1.8 0 .4.5.7 1.2 1l-.8 2.2c1 .5 2.2.8 2.4.8s1.4-.3 2.4-.8l-.8-2.2c.7-.3 1.2-.6 1.2-1 0-.8-1.2-1.8-2.8-1.8z"
        fill="#2a1a08"
      />
      <path
        d="M26.5 39.5c1.6 2 3.4 3 5.5 3s3.9-1 5.5-3"
        stroke="#2a1a08"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LinesMark() {
  return (
    <svg
      className="coin-face__svg"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M16 18h32" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <path d="M12 32h40" stroke="currentColor" strokeWidth="6.5" strokeLinecap="round" />
      <path d="M16 46h32" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <path
        d="M18 25h28M18 39h28"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}
