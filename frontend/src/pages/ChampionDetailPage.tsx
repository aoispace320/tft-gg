import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useChampions } from '@/hooks/useChampions';
import type { Champion } from '@/types/domain';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { TraitIcon } from '@/components/domain/TraitIcon';
import { IconImage } from '@/components/domain/IconImage';
import { ChampionCard } from '@/components/domain/ChampionCard';
import { QueryBoundary } from '@/components/feedback/QueryBoundary';
import { Skeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';

const costLabel: Record<number, string> = {
  1: '1코스트',
  2: '2코스트',
  3: '3코스트',
  4: '4코스트',
  5: '5코스트',
};

/** 특성별로 같은 특성을 공유하는 다른 챔피언을 모은다. */
function synergiesOf(champion: Champion, all: Champion[]) {
  return champion.traits.map((trait) => ({
    trait,
    champions: all
      .filter((c) => c.id !== champion.id && c.traits.includes(trait))
      .sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name)),
  }));
}

export function ChampionDetailPage() {
  const { id = '' } = useParams();
  const query = useChampions();
  const all = useMemo(() => query.data ?? [], [query.data]);
  const champion = all.find((c) => c.id === id);

  const synergies = useMemo(
    () => (champion ? synergiesOf(champion, all) : []),
    [champion, all],
  );

  return (
    <div>
      <PageHeader
        title="챔피언 상세"
        actions={
          <Link to="/champions" className="text-sm text-teal hover:text-brand-bright">
            ← 챔피언 목록
          </Link>
        }
      />

      <QueryBoundary
        isLoading={query.isLoading}
        isError={query.isError}
        isEmpty={!query.isLoading && !champion}
        onRetry={() => query.refetch()}
        skeleton={<Skeleton className="h-64 w-full" />}
        empty={
          <EmptyState
            title="챔피언을 찾을 수 없음"
            message={`'${id}' 에 해당하는 챔피언이 없습니다.`}
            icon="❓"
          />
        }
      >
        {champion && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <div className="flex flex-col items-center text-center">
                <div className="h-28 w-28 overflow-hidden rounded-card border-2 border-brand/60">
                  <IconImage
                    src={champion.iconUrl}
                    alt={champion.name}
                    fallback={champion.name.slice(0, 2)}
                    className="h-full w-full"
                  />
                </div>
                <h2 className="mt-3 font-display text-2xl font-bold text-brand-bright">
                  {champion.name}
                </h2>
                <Badge tone="gold" className="mt-2">
                  {costLabel[champion.cost]}
                </Badge>
                <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                  {champion.traits.map((t) => (
                    <TraitIcon key={t} name={t} />
                  ))}
                </div>
              </div>
            </Card>

            {/* 특성별 시너지 유닛 — /api/champions 의 traits 만으로 계산한다 (PRD 6.4) */}
            <Card title="특성 시너지" className="lg:col-span-2">
              {synergies.length === 0 ? (
                <EmptyState
                  title="특성 정보 없음"
                  message="이 챔피언에 연결된 특성이 없습니다."
                  icon="🔗"
                />
              ) : (
                <div className="space-y-6" data-testid="champion-synergies">
                  {synergies.map(({ trait, champions }) => (
                    <section key={trait}>
                      <div className="mb-2 flex items-center gap-2">
                        <TraitIcon name={trait} />
                        <span className="text-xs text-text-muted">
                          같은 특성 {champions.length}명
                        </span>
                      </div>
                      {champions.length === 0 ? (
                        <p className="text-sm text-text-muted">
                          이 특성을 가진 다른 챔피언이 없습니다.
                        </p>
                      ) : (
                        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-6">
                          {champions.map((c) => (
                            <ChampionCard key={c.id} champion={c} />
                          ))}
                        </div>
                      )}
                    </section>
                  ))}
                </div>
              )}

              <p className="mt-6 border-t border-line/30 pt-4 text-xs text-text-muted">
                평균등수 · 3성 확률 · 추천 아이템 통계는 매치 데이터 수집 후 제공됩니다.
              </p>
            </Card>
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}
