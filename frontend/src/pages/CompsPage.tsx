import { useMemo, useState } from 'react';
import { useComps } from '@/hooks/useComps';
import type { CompTier } from '@/types/domain';
import { PageHeader } from '@/components/layout/PageHeader';
import { CompCard } from '@/components/domain/CompCard';
import { QueryBoundary } from '@/components/feedback/QueryBoundary';
import { Skeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { classNames } from '@/lib/format';

const TIERS: Array<CompTier | 'all'> = ['all', 'S', 'A', 'B', 'C', 'D'];

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-40" />
      ))}
    </div>
  );
}

export function CompsPage() {
  const [tier, setTier] = useState<CompTier | 'all'>('all');
  const query = useComps();
  const comps = query.data ?? [];

  const filtered = useMemo(
    () => (tier === 'all' ? comps : comps.filter((c) => c.tier === tier)),
    [comps, tier],
  );

  return (
    <div>
      <PageHeader title="전략가" subtitle="메타 조합 티어리스트 · 대표 유닛" />

      <div className="mb-6 flex flex-wrap gap-1.5">
        {TIERS.map((t) => (
          <button
            key={t}
            onClick={() => setTier(t)}
            className={classNames(
              'rounded-btn border px-4 py-1.5 text-sm font-bold transition-colors',
              tier === t
                ? 'border-gold bg-gold/15 text-gold'
                : 'border-line/40 text-text-muted hover:border-gold hover:text-gold-bright',
            )}
          >
            {t === 'all' ? '전체' : `${t} 티어`}
          </button>
        ))}
      </div>

      <QueryBoundary
        isLoading={query.isLoading}
        isError={query.isError}
        isEmpty={filtered.length === 0}
        onRetry={() => query.refetch()}
        skeleton={<GridSkeleton />}
        empty={<EmptyState title="조합 없음" message="해당 티어의 조합이 없습니다." icon="🧠" />}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <CompCard key={c.id} comp={c} />
          ))}
        </div>
      </QueryBoundary>
    </div>
  );
}
