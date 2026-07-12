import { useMemo, useState } from 'react';
import { useChampions } from '@/hooks/useChampions';
import type { ChampionCost } from '@/types/domain';
import { PageHeader } from '@/components/layout/PageHeader';
import { Dropdown } from '@/components/common/Dropdown';
import { ChampionCard } from '@/components/domain/ChampionCard';
import { QueryBoundary } from '@/components/feedback/QueryBoundary';
import { Skeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { classNames } from '@/lib/format';

const COSTS: Array<ChampionCost | 'all'> = ['all', 1, 2, 3, 4, 5];

function GridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
      {Array.from({ length: 16 }).map((_, i) => (
        <Skeleton key={i} className="h-24" />
      ))}
    </div>
  );
}

export function ChampionsPage() {
  const [cost, setCost] = useState<ChampionCost | 'all'>('all');
  const [trait, setTrait] = useState('all');
  const query = useChampions();
  const champions = query.data ?? [];

  const traitOptions = useMemo(() => {
    const traits = Array.from(new Set(champions.flatMap((c) => c.traits))).sort();
    return [{ value: 'all', label: '전체 특성' }, ...traits.map((t) => ({ value: t, label: t }))];
  }, [champions]);

  const filtered = useMemo(
    () =>
      champions.filter(
        (c) => (cost === 'all' || c.cost === cost) && (trait === 'all' || c.traits.includes(trait)),
      ),
    [champions, cost, trait],
  );

  return (
    <div>
      <PageHeader
        title="챔피언 통계"
        subtitle="코스트·특성별 챔피언 필터"
        actions={<Dropdown options={traitOptions} value={trait} onChange={setTrait} className="w-40" />}
      />

      {/* 코스트 필터 */}
      <div className="mb-6 flex flex-wrap gap-1.5">
        {COSTS.map((c) => (
          <button
            key={c}
            onClick={() => setCost(c)}
            className={classNames(
              'rounded-btn border px-3 py-1.5 text-sm font-medium transition-colors',
              cost === c
                ? 'border-gold bg-gold/15 text-gold'
                : 'border-line/40 text-text-muted hover:border-gold hover:text-gold-bright',
            )}
          >
            {c === 'all' ? '전체' : `${c} 코스트`}
          </button>
        ))}
      </div>

      <QueryBoundary
        isLoading={query.isLoading}
        isError={query.isError}
        isEmpty={filtered.length === 0}
        onRetry={() => query.refetch()}
        skeleton={<GridSkeleton />}
        empty={<EmptyState title="조건에 맞는 챔피언 없음" icon="🧙" />}
      >
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
          {filtered.map((c) => (
            <ChampionCard key={c.id} champion={c} />
          ))}
        </div>
      </QueryBoundary>
    </div>
  );
}
