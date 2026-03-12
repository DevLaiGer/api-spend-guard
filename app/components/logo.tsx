type LogoProps = {
  className?: string;
  size?: number;
};

export function Logo({ className = "", size = 400 }: LogoProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 400 400"
      aria-hidden="true"
      role="img"
    >
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000000" floodOpacity="0.2" />
        </filter>

        <linearGradient id="orangePulse" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F39C12" />
          <stop offset="100%" stopColor="#E67E22" />
        </linearGradient>
      </defs>

      <g stroke="#0A2A3F" strokeWidth="40" strokeLinecap="round" strokeLinejoin="round" fill="none">

        <polygon points="200,40 338,120 338,280 200,360 62,280 62,120" />

        <polyline points="62,280 200,150 338,280" />

      </g>

      <g filter="url(#glow)">
        <polyline points="50,230 110,190 160,250 210,170 260,210 350,110"
          fill="none"
          stroke="url(#orangePulse)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round" />

        <circle cx="50" cy="230" r="12" fill="#F39C12" />
        <circle cx="110" cy="190" r="12" fill="#F39C12" />
        <circle cx="160" cy="250" r="12" fill="#F39C12" />
        <circle cx="210" cy="170" r="12" fill="#F39C12" />
        <circle cx="260" cy="210" r="12" fill="#F39C12" />
        <circle cx="350" cy="110" r="12" fill="#F39C12" />
      </g>
    </svg>
  );
}
