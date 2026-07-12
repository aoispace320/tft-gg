import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import type { RankRow } from '@/types/domain';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs } from '@/components/common/Tabs';
import { Dropdown } from '@/components/common/Dropdown';
import { Table, type Column } from '@/components/common/Table';
import { Pagination } from '@/components/common/Pagination';
import { QueryBoundary } from '@/components/feedback/QueryBoundary';
import { Skeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { REGIONS } from '@/config/regions';
import { pct } from '@/lib/format';

const PAGE_SIZE = 20;
const TIERS = [
  { value: 'all', label: '전체' },
  { value: 'challenger', label: '챌린저' },
  { value: 'grandmaster', label: '그랜드마스터' },
  { value: 'master', label: '마스터' },
];

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <Skeleton key={i} className="h-11 w-full" />
      ))}
    </div>
  );
}

export function LeaderboardPage() {
  const navigate = useNavigate();
  const [region, setRegion] = useState('kr');
  const [tier, setTier] = useState('all');
  const [page, setPage] = useState(1);

  const query = useLeaderboard(region, tier, page);
  const data = query.data;

  const columns: Column<RankRow>[] = [
    {
      key: 'rank',
      header: '#',
      width: '64px',
      align: 'center',
      render: (r) => (
        <span className={r.rank <= 3 ? 'font-bold text-gold' : 'text-text-muted'}>{r.rank}</span>
      ),
    },
    {
      key: 'name',
      header: '소환사',
      render: (r) => <span className="font-medium text-text-primary">{r.name}</span>,
    },
    {
      key: 'tier',
      header: '티어',
      render: (r) => <span className="text-teal">{r.tier}</span>,
    },
    { key: 'lp', header: 'LP', align: 'right', render: (r) => <span className="font-semibold">{r.lp}</span> },
    {
      key: 'winRate',
      header: '승률',
      align: 'right',
      render: (r) => <span className="text-text-muted">{pct(r.winRate)}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="플레이어 순위"
        subtitle="지역별 챌린저·그랜드마스터·마스터 랭킹"
        actions={<Dropdown options={TIERS} value={tier} onChange={(v) => { setTier(v); setPage(1); }} className="w-40" />}
      />

      <Tabs
        items={REGIONS.map((r) => ({ key: r.code, label: r.code.toUpperCase() }))}
        value={region}
        onChange={(v) => {
          setRegion(v);
          setPage(1);
        }}
        className="mb-6"
      />

      <div className="surface-card overflow-hidden">
        <QueryBoundary
          isLoading={query.isLoading}
          isError={query.isError}
          isEmpty={!!data && data.rows.length === 0}
          onRetry={() => query.refetch()}
          skeleton={<div className="p-4">{<TableSkeleton />}</div>}
          empty={<EmptyState title="랭킹 데이터 없음" icon="🏅" />}
        >
          {data && (
            <Table
              columns={columns}
              data={data.rows}
              rowKey={(r) => `${r.rank}-${r.name}`}
              onRowClick={(r) => navigate(`/summoner/${region}/${encodeURIComponent(r.name)}`)}
            />
          )}
        </QueryBoundary>
      </div>

      {data && data.total > PAGE_SIZE && (
        <div className="mt-6">
          <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
