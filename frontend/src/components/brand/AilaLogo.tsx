import { CSSProperties } from 'react';

type AilaLogoTone = 'auto' | 'on-light' | 'on-dark' | 'gradient';

interface AilaLogoProps {
  tone?: AilaLogoTone;
  size?: number;
  showWordmark?: boolean;
  wordmarkSuffix?: string;
  className?: string;
  style?: CSSProperties;
}

export function AilaLogo({
  tone = 'auto',
  size = 36,
  showWordmark = true,
  wordmarkSuffix,
  className = '',
  style,
}: AilaLogoProps) {
  const monogram = <AilaMonogram tone={tone} size={size} />;

  if (!showWordmark) {
    return (
      <span className={className} style={style} aria-label="AILA">
        {monogram}
      </span>
    );
  }

  const wordmarkColorClass =
    tone === 'on-light'
      ? 'text-aila-black'
      : tone === 'on-dark'
      ? 'text-aila-cream'
      : 'text-fg-primary';

  return (
    <span
      className={`inline-flex items-center gap-2.5 ${className}`}
      style={style}
      aria-label={wordmarkSuffix ? `AILA ${wordmarkSuffix}` : 'AILA'}
    >
      {monogram}
      <span className="inline-flex items-baseline gap-1.5">
        <span
          className={`font-sans font-black tracking-tight leading-none ${wordmarkColorClass}`}
          style={{ fontSize: Math.round(size * 0.62), letterSpacing: '-0.02em' }}
        >
          AILA
        </span>
        {wordmarkSuffix && (
          <span
            className={`font-sans font-medium leading-none ${wordmarkColorClass}`}
            style={{ fontSize: Math.round(size * 0.5), opacity: 0.75 }}
          >
            {wordmarkSuffix}
          </span>
        )}
      </span>
    </span>
  );
}

interface AilaMonogramProps {
  tone: AilaLogoTone;
  size: number;
}

function AilaMonogram({ tone, size }: AilaMonogramProps) {
  const id = 'aila-grad';
  const useGradient = tone === 'gradient' || tone === 'auto';

  const surfaceFill =
    tone === 'on-light'
      ? '#0A0A0A'
      : tone === 'on-dark'
      ? '#FAFAF8'
      : useGradient
      ? `url(#${id})`
      : 'currentColor';

  const cutoutFill =
    tone === 'on-light' ? '#FAFAF8' : tone === 'on-dark' ? '#0A0A0A' : '#0A0A0A';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34C4F9" />
          <stop offset="25%" stopColor="#4CB3F6" />
          <stop offset="50%" stopColor="#8D80EC" />
          <stop offset="75%" stopColor="#CE4EE1" />
          <stop offset="100%" stopColor="#E63DE0" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={surfaceFill} />
      {/* A triangular: ápice no topo, base larga embaixo */}
      <path d="M16 7 L25 24 L7 24 Z" fill={cutoutFill} fillOpacity="0.0" stroke={cutoutFill} strokeWidth="2.5" strokeLinejoin="round" />
      {/* Travessão do A */}
      <path d="M11.5 19 L20.5 19" stroke={cutoutFill} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
