import { useState } from 'react';
import { useStatistics } from '@/hooks/useStatistics';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/common/Card';
import { Dropdown } from '@/components/common/Dropdown';
import { Badge } from '@/components/common/Badge';
import { CompCard } from '@/components/domain/CompCard';
import { AugmentIcon } from '@/components/domain/AugmentIcon';
import { QueryBoundary } from '@/components/feedback/QueryBoundary';
import { Skeleton } from '@/components/feedback/Skeleton';
import { DataNotCollected } from '@/components/feedback/DataNotCollected';
import { pct } from '@/lib/format';

const PATCHES = [
  { value: '14.13', label: '패치 14.13' },
  { value: '14.12', label: '패치 14.12' },
  { value: '14.11', label: '패치 14.11' },
];
const TIERS = [
  { value: 'all', label: '전체 티어' },
  { value: 'diamond+', label: '다이아+' },
  { value: 'master+', label: '마스터+' },
  { value: 'chall', label: '챌린저' },
];

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

export function StatisticsPage() {
  const [patch, setPatch] = useState('14.13');
  const [tier, setTier] = useState('all');
  const query = useStatistics(patch, tier);
  const data = query.data;

  // 백엔드가 전처리 CSV 부재를 알려준다. 예전에는 이 경우 '-' 값 카드가 그대로 노출되어
  // 마치 통계가 0인 것처럼 보였다. 이제는 수집 전임을 명시하고 방법을 안내한다.
  const noData = data ? data.hasData === false : false;
  const filters = data?.supportedFilters;
  // 데이터 유무와 필터 지원 여부는 별개다. 데이터가 있어도 백엔드가 아직 패치·티어별
  // 필터링을 구현하지 않았으면 비활성 상태가 유지된다 — 사유를 정확히 구분해 안내한다.
  const filterDisabledNote = noData
    ? '전처리 데이터가 없어 필터를 사용할 수 없습니다.'
    : '패치·티어별 필터링은 아직 지원되지 않습니다.';

  return (
    <div>
      <PageHeader
        title="데이터 통계"
        subtitle="패치별 메타 트렌드 · 증강체 · 조합 통계"
        actions={
          <>
            <Dropdown
              options={PATCHES}
              value={patch}
              onChange={setPatch}
              className="w-36"
              disabled={filters?.patch === false}
              title={filters?.patch === false ? filterDisabledNote : undefined}
            />
            <Dropdown
              options={TIERS}
              value={tier}
              onChange={setTier}
              className="w-32"
              disabled={filters?.tier === false}
              title={filters?.tier === false ? filterDisabledNote : undefined}
            />
          </>
        }
      />

      <QueryBoundary
        isLoading={query.isLoading}
        isError={query.isError}
        isEmpty={noData}
        onRetry={() => query.refetch()}
        skeleton={<DashboardSkeleton />}
        empty={
          <DataNotCollected
            message="메타 통계는 수집·전처리된 매치 데이터로 계산합니다. 아직 수집된 데이터가 없어 표시할 통계가 없습니다."
            icon="📊"
          />
        }
      >
        {data && (
          <div className="space-y-6">
            {/* 요약 통계 카드 */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {data.summary.map((s) => (
                <div key={s.id} className="rounded-card border border-line/30 bg-bg-surface p-4">
                  <p className="text-xs text-text-muted">{s.label}</p>
                  <p className="mt-1 font-display text-2xl font-bold text-brand-bright">{s.value}</p>
                  {s.delta != null && s.delta !== 0 && (
                    <p className={s.delta > 0 ? 'text-xs text-teal' : 'text-xs text-rank-s'}>
                      {s.delta > 0 ? '▲' : '▼'} {Math.abs(s.delta)}%
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* 증강체 통계 */}
              <Card title="증강체 픽률 TOP 5" action={<Badge tone="teal">패치 {data.patch}</Badge>}>
                {data.topAugments.length > 0 ? (
                  <ul className="divide-y divide-line/20">
                    {data.topAugments.map((a) => (
                      <li key={a.id} className="flex items-center gap-3 py-2.5">
                        <AugmentIcon name={a.name} tier={a.tier} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-text-primary">{a.name}</p>
                          <p className="text-xs text-text-muted">평균 {a.avgPlacement.toFixed(1)}등</p>
                        </div>
                        <span className="text-sm font-semibold text-brand">{pct(a.pickRate)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="py-8 text-center text-sm text-text-muted">
                    현재 세트(Set 17) 매치 데이터에는 증강체 정보가 포함되지 않습니다.
                  </p>
                )}
              </Card>

              {/* 메타 조합 */}
              <Card title="메타 조합 TOP 5">
                <div className="space-y-3">
                  {data.topComps.map((c) => (
                    <CompCard key={c.id} comp={c} />
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}
