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

  return (
    <div>
      <PageHeader
        title="데이터 통계"
        subtitle="패치별 메타 트렌드 · 증강체 · 조합 통계"
        actions={
          <>
            <Dropdown options={PATCHES} value={patch} onChange={setPatch} className="w-36" />
            <Dropdown options={TIERS} value={tier} onChange={setTier} className="w-32" />
          </>
        }
      />

      <QueryBoundary
        isLoading={query.isLoading}
        isError={query.isError}
        onRetry={() => query.refetch()}
        skeleton={<DashboardSkeleton />}
      >
        {data && (
          <div className="space-y-6">
            {/* 요약 통계 카드 */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {data.summary.map((s) => (
                <div key={s.id} className="rounded-card border border-line/30 bg-bg-surface p-4">
                  <p className="text-xs text-text-muted">{s.label}</p>
                  <p className="mt-1 font-display text-2xl font-bold text-gold-bright">{s.value}</p>
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
                <ul className="divide-y divide-line/20">
                  {data.topAugments.map((a) => (
                    <li key={a.id} className="flex items-center gap-3 py-2.5">
                      <AugmentIcon name={a.name} tier={a.tier} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-text-primary">{a.name}</p>
                        <p className="text-xs text-text-muted">평균 {a.avgPlacement.toFixed(1)}등</p>
                      </div>
                      <span className="text-sm font-semibold text-gold">{pct(a.pickRate)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-center text-xs text-text-muted">
                  📈 픽률·평균등수 차트는 F5 단계에서 Recharts 로 연동 예정
                </p>
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
