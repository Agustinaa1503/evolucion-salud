import type { ReactNode } from 'react';

type MarqueeProps = {
  children: ReactNode;
  className?: string;
  slow?: boolean;
};

export default function Marquee({
  children,
  className = '',
  slow = false,
}: MarqueeProps) {
  return (
    <div className={`group relative overflow-hidden ${className}`}>
      <div
        className={`flex w-max ${
          slow ? 'animate-marquee-slow' : 'animate-marquee'
        } group-hover:[animation-play-state:paused]`}
      >
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
