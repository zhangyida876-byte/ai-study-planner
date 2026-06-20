import React from 'react';
import { cn } from '@/lib/utils';

const WOBBLY_PRESETS = [
  '255px 15px 225px 15px / 15px 225px 15px 255px',
  '20px 225px 15px 255px / 255px 15px 225px 15px',
  '15px 225px 15px 255px / 255px 15px 225px 15px',
  '225px 15px 225px 15px / 15px 225px 15px 255px',
];

interface WobblyCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'white' | 'yellow' | 'black' | 'blue';
  decoration?: 'tape' | 'tack' | 'none';
  wobblyIndex?: number;
  rotate?: number;
  hoverable?: boolean;
}

const VARIANT_STYLES: Record<string, string> = {
  white: 'bg-card text-ink',
  yellow: 'bg-postit-yellow text-ink',
  black: 'bg-ink text-chalk-white',
  blue: 'bg-pen-blue text-white',
};

const WobblyCard: React.FC<WobblyCardProps> = ({
  variant = 'white',
  decoration = 'none',
  wobblyIndex = 0,
  rotate = 0,
  hoverable = true,
  className,
  children,
  style,
  ...props
}) => {
  const borderRadius = WOBBLY_PRESETS[wobblyIndex % WOBBLY_PRESETS.length];

  return (
    <div
      className={cn(
        'relative border-[3px] border-ink transition-transform duration-200',
        VARIANT_STYLES[variant],
        variant === 'black' ? 'shadow-hard-xl' : 'shadow-hard',
        hoverable && 'hover:-translate-y-1 hover:shadow-hard-xl',
        className
      )}
      style={{
        borderRadius,
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
        ...style,
      }}
      {...props}
    >
      {decoration === 'tape' && (
        <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L14 8H20L15 12L17 18L12 14L7 18L9 12L4 8H10L12 2Z" fill="#ff4d4d" stroke="#2d2d2d" strokeWidth="2" strokeLinejoin="round" />
            <line x1="12" y1="14" x2="12" y2="22" stroke="#2d2d2d" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      )}
      {decoration === 'tack' && (
        <div className="absolute -top-2 left-1/2 z-10 size-4 -translate-x-1/2 rounded-full border-2 border-ink bg-marker-red" />
      )}
      {children}
    </div>
  );
};

export default WobblyCard;
