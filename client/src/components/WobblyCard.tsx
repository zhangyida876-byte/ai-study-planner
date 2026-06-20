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
        <div className="absolute -top-3 left-1/2 z-10 h-6 w-24 -translate-x-1/2 rotate-1 border-x border-ink/10 bg-amber-50/40" />
      )}
      {decoration === 'tack' && (
        <div className="absolute -top-2 left-1/2 z-10 size-4 -translate-x-1/2 rounded-full border-2 border-ink bg-marker-red" />
      )}
      {children}
    </div>
  );
};

export default WobblyCard;
