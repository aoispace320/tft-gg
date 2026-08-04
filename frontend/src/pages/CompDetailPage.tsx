import { Link, useParams } from 'react-router-dom';
import { useComps } from '@/hooks/useComps';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { TierBadge } from '@/components/domain/TierBadge';
import { UnitList } from '@/components/domain/UnitList';
import { QueryBoundary } from '@/components/feedback/QueryBoundary';
import { Skeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { DataNotCollected } from '@/components/feedback/DataNotCollected';
import { pct } from '@/lib/format';

export function CompDetailPage() {
  const { id = '' } = useParams();
  const query = useComps();
  const comps = query.data ?? [];
  const comp = comps.find((c) => c.id === id);

  // 조합 목록 자체가 비었다면 '이 조합이 없다'가 아니라 '아직 수집 전'이다.
  const noData = !query.isLoading && !query.isError && comps.length === 0;

  return (
    <div>
      <PageHeader
        title="조합 상세"
        actions={
          <Link to="/comps" className="text-sm text-teal hover:text-brand-bright">
            ← 전략가 목록
          </Link>
        }
      />

      <QueryBoundary
        isLoading={query.isLoading}
        isError={query.isError}
        isEmpty={!query.isLoading && !comp}
        onRetry={() => query.refetch()}
        skeleton={<Skeleton className="h-64 w-full" />}
        empty={
          noData ? (
            <DataNotCollected
              message="조합 상세는 수집·전처리된 매치 데이터에서 계산합니다. 아직 수집된 데이터가 없습니다."
              icon="🗺️"
            />
          ) : (
            <EmptyState title="조합을 찾을 수 없음" message={`'${id}' 조합이 존재하지 않습니다.`} icon="❓" />
          )
        }
      >
        {comp && (
          <div className="space-y-6">
            <Card>
              <div className="flex flex-wrap items-center gap-4">
                <TierBadge tier={comp.tier} size="lg" />
                <div className="flex-1">
                  <h2 className="font-display text-2xl font-bold text-brand-bright">{comp.name}</h2>
                  <p className="mt-1 text-sm text-text-muted">{comp.description}</p>
                </div>
                <div className="flex gap-2">
                  {comp.avgPlacement != null && <Badge tone="teal">평균 {comp.avgPlacement.toFixed(1)}등</Badge>}
                  {comp.playRate != null && <Badge tone="gold">픽률 {pct(comp.playRate)}</Badge>}
                </div>
              </div>
              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">핵심 유닛</p>
                <UnitList ids={comp.coreUnits} size={52} />
              </div>
            </Card>

            <Card title="운영 가이드">
              <EmptyState
                title="상세 가이드 준비 중"
                message="배치·아이템 우선순위·증강체 추천·ML 클러스터 기반 자동 메타는 F5 단계에서 제공됩니다."
                icon="🗺️"
              />
            </Card>
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}
