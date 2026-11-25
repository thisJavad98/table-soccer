/** Taste-skill dealt mark: ring · lunar-grey-bronze */
export default function Logo({ size = 28, className = '', title = 'Table Soccer' }) {
  const id = 'ts-logo';
  return (
    <svg
      className={`logo ${className}`}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
    >
      <defs>
        <radialGradient id={`${id}-ball`} cx="38%" cy="34%" r="60%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#f2f2f2" />
          <stop offset="100%" stopColor="#cfc8bf" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="28" stroke="var(--p-accent, #a08672)" strokeWidth="3.5" />
      <circle
        cx="32"
        cy="32"
        r="21"
        stroke="var(--p-ink, #f2f2f2)"
        strokeWidth="1.25"
        opacity="0.35"
      />
      <circle cx="32" cy="32" r="11.5" fill={`url(#${id}-ball)`} />
      <circle cx="32" cy="32" r="11.5" stroke="#111111" strokeWidth="1.15" />
      <circle cx="28.2" cy="28" r="3" fill="#ffffff" opacity="0.85" />
      <path
        d="M32 22 L34.1 27.5 L40 27.7 L35.3 31.3 L36.9 37 L32 33.9 L27.1 37 L28.7 31.3 L24 27.7 L29.9 27.5 Z"
        fill="#111111"
        opacity="0.16"
      />
    </svg>
  );
}
