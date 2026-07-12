import type { ReactNode } from 'react';
import { classNames } from '@/lib/format';

type Tone = 'gold' | 'teal' | 'neutral' | 'danger';

const toneClasses: Record<Tone, string> = {
  gold: 'bg-gold/15 text-gold border-gold/40',
  teal: 'bg-teal/15 text-teal border-teal/40',
  neutral: 'bg-bg-elevated text-text-muted border-line/40',
  danger: 'bg-rank-s/15 text-rank-s border-rank-s/40',
};

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={classNames(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
