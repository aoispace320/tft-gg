import type { Match } from '@/types/domain';
import { classNames, relativeTime } from '@/lib/format';

function placementStyle(p: number): string {
  if (p === 1) return 'bg-gold text-bg-base';
  if (p <= 4) return 'bg-teal/20 text-teal border border-teal/40';
  return 'bg-bg-elevated text-text-muted border border-line/40';
}

/** 최근 매치 한 줄: 등수 · 조합 · 날짜. */
export function MatchRow({ match }: { match: Match }) {
  const top4 = match.placement <= 4;
  return (
    <div
      className={classNames(
        'flex items-center gap-4 rounded-card border-l-4 bg-bg-surface px-4 py-3 transition-colors hover:bg-bg-elevated/50',
        match.placement === 1 ? 'border-gold' : top4 ? 'border-teal' : 'border-line/40',
      )}
    >
      <span
        className={classNames(
          'grid h-10 w-10 shrink-0 place-items-center rounded-md text-sm font-bold',
          placementStyle(match.placement),
        )}
      >
        #{match.placement}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-text-primary">{match.comp}</p>
        <p className="text-xs text-text-muted">
          {top4 ? 'Top 4' : `${match.placement}등`} · {match.queue === 'double_up' ? '더블업' : '랭크'}
        </p>
      </div>
      <span className="shrink-0 text-xs text-text-muted">{relativeTime(match.playedAt)}</span>
    </div>
  );
}
