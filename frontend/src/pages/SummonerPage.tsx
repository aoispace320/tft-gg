import { useParams } from 'react-router-dom';
import { useSummoner } from '@/hooks/useSummoner';
import { PageHeader } from '@/components/layout/PageHeader';
import { SearchBar } from '@/components/common/SearchBar';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { MatchRow } from '@/components/domain/MatchRow';
import { QueryBoundary } from '@/components/feedback/QueryBoundary';
import { Skeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { IconImage } from '@/components/domain/IconImage';

function ProfileSkeleton() {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20" rounded />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </Card>
  );
}

function MatchListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}

export function SummonerPage() {
  const { region = '', name = '' } = useParams();
  const query = useSummoner(region, name);
  const data = query.data;

  return (
    <div>
      <PageHeader
        title={decodeURIComponent(name)}
        subtitle={`${region.toUpperCase()} 서버`}
        actions={
          <div className="w-full sm:w-72">
            <SearchBar />
          </div>
        }
      />

      {/* 프로필 헤더 */}
      <QueryBoundary
        isLoading={query.isLoading}
        isError={query.isError}
        onRetry={() => query.refetch()}
        skeleton={<ProfileSkeleton />}
      >
        {data && (
          <Card className="p-5">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
              <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-gold/60">
                <IconImage
                  src={data.iconUrl}
                  alt={data.name}
                  fallback={data.name.slice(0, 2)}
                  className="h-full w-full"
                />
              </div>
              <div className="text-center sm:text-left">
                <div className="flex items-center justify-center gap-2 sm:justify-start">
                  <h2 className="font-display text-2xl font-bold text-gold-bright">{data.name}</h2>
                  <Badge tone="neutral">Lv.{data.level}</Badge>
                </div>
                <div className="mt-2 flex items-center justify-center gap-2 sm:justify-start">
                  <Badge tone="gold">{data.tier}</Badge>
                  <span className="text-sm text-text-muted">{data.lp} LP</span>
                </div>
              </div>
            </div>
          </Card>
        )}
      </QueryBoundary>

      {/* 최근 매치 */}
      <h3 className="mb-3 mt-8 font-display text-lg font-semibold text-text-primary">최근 매치</h3>
      <QueryBoundary
        isLoading={query.isLoading}
        isError={query.isError}
        isEmpty={!!data && data.matches.length === 0}
        onRetry={() => query.refetch()}
        skeleton={<MatchListSkeleton />}
        empty={<EmptyState title="매치 기록 없음" message="최근 플레이한 게임이 없습니다." icon="🎮" />}
      >
        <div className="space-y-2">
          {data?.matches.map((m) => (
            <MatchRow key={m.id} match={m} />
          ))}
        </div>
      </QueryBoundary>
    </div>
  );
}
