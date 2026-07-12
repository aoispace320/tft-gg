import type { ReactNode } from 'react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({
  title = '데이터가 없습니다',
  message = 'Coming soon — 표시할 내용이 아직 없어요.',
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-line/50 bg-bg-surface/40 px-6 py-16 text-center">
      <div className="mb-4 text-4xl opacity-70">{icon ?? '🗂️'}</div>
      <h3 className="mb-1 text-lg font-semibold text-text-primary">{title}</h3>
      <p className="max-w-sm text-sm text-text-muted">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
