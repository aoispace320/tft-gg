import { Link, useNavigate } from 'react-router-dom';
import { useComps } from '@/hooks/useComps';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { SearchBar } from '@/components/common/SearchBar';
import { TierBadge } from '@/components/domain/TierBadge';
import { UnitList } from '@/components/domain/UnitList';
import { QueryBoundary } from '@/components/feedback/QueryBoundary';
import { Skeleton } from '@/components/feedback/Skeleton';
import { pct } from '@/lib/format';

/** 홈 — op.gg 스타일 히어로 검색 + lolchess 스타일 추천 메타 / 랭킹 TOP 10 */
export function HomePage() {
  const navigate = useNavigate();
  const compsQuery = useComps();
  const rankQuery = useLeaderboard('kr', 'all', 1);

  const topComps = compsQuery.data?.slice(0, 5) ?? [];
  const topRanks = rankQuery.data?.rows.slice(0, 10) ?? [];

  return (
    <div>
      {/* 히어로 — 로고 + 대형 검색바 (op.gg) */}
      <section className="py-10 text-center sm:py-16">
        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
          TFT<span className="text-brand">.GG</span>
        </h1>
        <p className="mt-3 text-sm text-text-muted">
          전략적 팀 전투 전적 검색 · 메타 통계 · 랭킹
        </p>
        <div className="mx-auto mt-6 max-w-2xl px-2">
          <SearchBar size="lg" autoFocus />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 추천 메타 (lolchess) */}
        <section className="lg:col-span-2">
          <div className="surface-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line/60 px-5 py-3">
              <h2 className="text-sm font-bold text-white">추천 메타</h2>
              <Link to="/comps" className="text-xs font-medium text-brand hover:underline">
                전체 추천메타 목록 →
              </Link>
            </div>
            <QueryBoundary
              isLoading={compsQuery.isLoading}
              isError={compsQuery.isError}
              onRetry={() => compsQuery.refetch()}
              skeleton={
                <div className="space-y-2 p-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              }
            >
              <ul className="divide-y divide-line/40">
                {topComps.map((comp) => (
                  <li key={comp.id}>
                    <Link
                      to={`/comps/${comp.id}`}
                      className="flex flex-col gap-3 px-5 py-3.5 transition-colors hover:bg-bg-elevated/60 sm:flex-row sm:items-center"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <TierBadge tier={comp.tier} size="sm" />
                        <span className="truncate text-sm font-bold text-text-primary">
                          {comp.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <UnitList ids={comp.coreUnits} size={32} />
                        <div className="hidden w-28 shrink-0 text-right text-xs sm:block">
                          {comp.avgPlacement != null && (
                            <p className="font-semibold text-text-primary">
                              평균 {comp.avgPlacement.toFixed(2)}등
                            </p>
                          )}
                          {comp.playRate != null && (
                            <p className="text-text-muted">픽률 {pct(comp.playRate)}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </QueryBoundary>
          </div>
        </section>

        {/* 랭킹 TOP 10 (lolchess 글로벌 TOP 10) */}
        <section>
          <div className="surface-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line/60 px-5 py-3">
              <h2 className="text-sm font-bold text-white">KR 랭킹 TOP 10</h2>
              <Link to="/leaderboard" className="text-xs font-medium text-brand hover:underline">
                더 보기 →
              </Link>
            </div>
            <QueryBoundary
              isLoading={rankQuery.isLoading}
              isError={rankQuery.isError}
              onRetry={() => rankQuery.refetch()}
              skeleton={
                <div className="space-y-2 p-4">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} className="h-9" />
                  ))}
                </div>
              }
            >
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line/40 text-[11px] uppercase tracking-wide text-text-muted">
                    <th className="w-10 py-2 pl-5 text-left font-medium">#</th>
                    <th className="py-2 text-left font-medium">소환사</th>
                    <th className="py-2 pr-5 text-right font-medium">LP</th>
                  </tr>
                </thead>
                <tbody>
                  {topRanks.map((row) => (
                    <tr
                      key={row.rank}
                      onClick={() => navigate(`/summoner/kr/${encodeURIComponent(row.name)}`)}
                      className="cursor-pointer border-b border-line/20 transition-colors last:border-0 hover:bg-bg-elevated/60"
                    >
                      <td
                        className={
                          row.rank <= 3
                            ? 'py-2.5 pl-5 font-extrabold text-brand'
                            : 'py-2.5 pl-5 text-text-muted'
                        }
                      >
                        {row.rank}
                      </td>
                      <td className="py-2.5">
                        <p className="truncate font-medium text-text-primary">{row.name}</p>
                        <p className="text-[11px] text-tier-challenger">{row.tier}</p>
                      </td>
                      <td className="py-2.5 pr-5 text-right">
                        <p className="font-semibold text-text-primary">
                          {row.lp.toLocaleString()} LP
                        </p>
                        <p className="text-[11px] text-text-muted">승률 {pct(row.winRate)}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </QueryBoundary>
          </div>
        </section>
      </div>
    </div>
  );
}
