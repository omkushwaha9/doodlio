import React from 'react';

export const SkribblLogo: React.FC<{ size?: 'lg' | 'sm' }> = ({ size = 'lg' }) => {
  const letters = [
    { ch: 'D', color: '#FF3B30' },
    { ch: 'o', color: '#FF9500' },
    { ch: 'o', color: '#FFCC00' },
    { ch: 'd', color: '#4CD964' },
    { ch: 'l', color: '#34AADC' },
    { ch: '.', color: '#FFFFFF' },
    { ch: 'i', color: '#FFFFFF' },
    { ch: 'o', color: '#FFFFFF' },
  ];

  const isLarge = size === 'lg';

  return (
    <div
      className={`inline-flex items-center select-none ${
        isLarge ? 'gap-1' : 'gap-0.5'
      }`}
      aria-label="Doodlio"
    >
      <div
        className={`inline-flex items-baseline font-black tracking-tight ${
          isLarge ? 'text-5xl sm:text-[62px] leading-none' : 'text-[30px] leading-none'
        }`}
      >
        {letters.map((item, idx) => (
          <span
            key={idx}
            style={{
              color: item.color,
              WebkitTextStroke: isLarge ? '2.5px #000000' : '1.75px #000000',
              textShadow: isLarge
                ? '0 4px 0 rgba(0,0,0,0.45)'
                : '0 2px 0 rgba(0,0,0,0.4)',
            }}
          >
            {item.ch}
          </span>
        ))}
      </div>
      {/* Tilted pencil accent */}
      <svg
        viewBox="0 0 40 48"
        className={isLarge ? 'w-10 h-12 -ml-1 -mt-2' : 'w-6 h-7 -ml-0.5 -mt-1'}
        aria-hidden="true"
      >
        <g transform="rotate(24 20 24)">
          <rect x="14" y="6" width="12" height="6" rx="2" fill="#FF6B8B" stroke="#000" strokeWidth="2.4" />
          <rect x="14" y="12" width="12" height="4" fill="#D1D5DB" stroke="#000" strokeWidth="2.4" />
          <rect x="14" y="16" width="12" height="20" fill="#FF9500" stroke="#000" strokeWidth="2.4" />
          <polygon points="14,36 26,36 20,45" fill="#FDE68A" stroke="#000" strokeWidth="2.4" strokeLinejoin="round" />
          <polygon points="18,41 22,41 20,45" fill="#000000" />
        </g>
      </svg>
    </div>
  );
};

export const AVATAR_COLORS = [
  '#FF3B30',
  '#FF9500',
  '#FFCC00',
  '#4CD964',
  '#32ADE6',
  '#2563EB',
  '#8B5CF6',
  '#EC4899',
];

interface SkribblAvatarProps {
  color: string;
  seed?: number;
  crown?: boolean;
  sizePx?: number;
}

export const SkribblAvatar: React.FC<SkribblAvatarProps> = ({
  color,
  seed = 0,
  crown = false,
  sizePx = 42,
}) => {
  const eyeStyle = Math.abs(seed) % 4;
  const mouthStyle = Math.abs(seed >> 2) % 4;

  return (
    <svg
      width={sizePx}
      height={sizePx}
      viewBox="0 0 48 48"
      className="shrink-0 overflow-visible"
      aria-hidden="true"
    >
      {crown && (
        <path
          d="M12 11L10 2L19 7L24 1L29 7L38 2L36 11Z"
          fill="#FFCC00"
          stroke="#000000"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
      )}
      {/* Shoulders */}
      <path
        d="M8 45C8 35 15 31 24 31C33 31 40 35 40 45Z"
        fill={color}
        stroke="#000000"
        strokeWidth="2.8"
        strokeLinejoin="round"
      />
      {/* Head */}
      <circle
        cx="24"
        cy="21"
        r="13"
        fill={color}
        stroke="#000000"
        strokeWidth="2.8"
      />
      {/* Eyes */}
      {eyeStyle === 0 && (
        <>
          <circle cx="19" cy="19" r="2.2" fill="#000" />
          <circle cx="29" cy="19" r="2.2" fill="#000" />
        </>
      )}
      {eyeStyle === 1 && (
        <>
          <circle cx="19" cy="19" r="3.4" fill="#FFF" stroke="#000" strokeWidth="1.5" />
          <circle cx="29" cy="19" r="3.4" fill="#FFF" stroke="#000" strokeWidth="1.5" />
          <circle cx="19.5" cy="19" r="1.3" fill="#000" />
          <circle cx="29.5" cy="19" r="1.3" fill="#000" />
        </>
      )}
      {eyeStyle === 2 && (
        <>
          <path d="M16 17L21 20M16 21L21 17" stroke="#000" strokeWidth="2" strokeLinecap="round" />
          <path d="M27 17L32 20M27 21L32 17" stroke="#000" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
      {eyeStyle === 3 && (
        <>
          <path d="M16 20C17 17 21 17 22 20" fill="none" stroke="#000" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M26 20C27 17 31 17 32 20" fill="none" stroke="#000" strokeWidth="2.2" strokeLinecap="round" />
        </>
      )}
      {/* Mouth */}
      {mouthStyle === 0 && (
        <path
          d="M17 25C19 29 29 29 31 25Z"
          fill="#FFFFFF"
          stroke="#000000"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      )}
      {mouthStyle === 1 && (
        <path
          d="M18 26C20 29 28 29 30 26"
          fill="none"
          stroke="#000000"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      )}
      {mouthStyle === 2 && (
        <path
          d="M18 28C20 25 28 25 30 28"
          fill="none"
          stroke="#000000"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      )}
      {mouthStyle === 3 && (
        <ellipse cx="24" cy="27" rx="4" ry="2.8" fill="#000000" />
      )}
    </svg>
  );
};

export const SkribblClock: React.FC<{ timeLeft: number; lowTime?: boolean }> = ({
  timeLeft,
  lowTime = false,
}) => {
  return (
    <div
      data-testid="round-timer"
      className="relative w-12 h-12 flex items-center justify-center shrink-0"
      aria-label={`Time left ${timeLeft} seconds`}
    >
      <svg viewBox="0 0 48 48" className="w-12 h-12" aria-hidden="true">
        <path
          d="M10 13L15 8M38 13L33 8"
          stroke="#000"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <circle
          cx="24"
          cy="26"
          r="17"
          fill={lowTime ? '#FEF08A' : '#FFFFFF'}
          stroke="#000000"
          strokeWidth="2.8"
        />
        <rect x="21" y="5" width="6" height="4" rx="1" fill="#000" />
      </svg>
      <span
        className={`absolute top-[18px] text-[15px] font-black tabular-nums leading-none ${
          lowTime ? 'text-[#DC2626]' : 'text-[#111827]'
        }`}
      >
        {timeLeft}
      </span>
    </div>
  );
};

export function hashSeed(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}
