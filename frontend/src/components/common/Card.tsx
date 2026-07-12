import type { HTMLAttributes, ReactNode } from 'react';
import { classNames } from '@/lib/format';

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  action?: ReactNode;
  hoverable?: boolean;
}

export function Card({ title, action, hoverable, className, children, ...props }: CardProps) {
  return (
    <div
      className={classNames(
        'surface-card',
        hoverable && 'transition-shadow transition-transform hover:-translate-y-0.5 hover:shadow-teal-glow',
        className,
      )}
      {...props}
    >
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-line/30 px-5 py-3">
          {typeof title === 'string' ? (
            <h3 className="text-sm font-semibold tracking-wide text-gold-bright">{title}</h3>
          ) : (
            title
          )}
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
