import { useMemo, useState } from 'react';
import { useItems } from '@/hooks/useItems';
import type { Item } from '@/types/domain';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs } from '@/components/common/Tabs';
import { Modal } from '@/components/common/Modal';
import { ItemIcon } from '@/components/domain/ItemIcon';
import { QueryBoundary } from '@/components/feedback/QueryBoundary';
import { Skeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';

type Cat = 'all' | 'combined' | 'component';

function GridSkeleton() {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(56px,1fr))] gap-3">
      {Array.from({ length: 24 }).map((_, i) => (
        <Skeleton key={i} className="aspect-square" />
      ))}
    </div>
  );
}

export function ItemsPage() {
  const [cat, setCat] = useState<Cat>('all');
  const [selected, setSelected] = useState<Item | null>(null);
  const query = useItems();
  const items = query.data ?? [];

  const filtered = useMemo(
    () => (cat === 'all' ? items : items.filter((i) => i.type === cat)),
    [items, cat],
  );

  const tabs = [
    { key: 'all' as const, label: '전체', count: items.length },
    { key: 'combined' as const, label: '조합 아이템', count: items.filter((i) => i.type === 'combined').length },
    { key: 'component' as const, label: '기본 재료', count: items.filter((i) => i.type === 'component').length },
  ];

  return (
    <div>
      <PageHeader title="아이템" subtitle="조합 아이템과 기본 재료 · 조합법" />

      <Tabs items={tabs} value={cat} onChange={setCat} className="mb-6" />

      <QueryBoundary
        isLoading={query.isLoading}
        isError={query.isError}
        isEmpty={filtered.length === 0}
        onRetry={() => query.refetch()}
        skeleton={<GridSkeleton />}
        empty={<EmptyState title="아이템 없음" icon="🧩" />}
      >
        <div className="grid grid-cols-[repeat(auto-fill,minmax(56px,1fr))] gap-3">
          {filtered.map((item) => (
            <ItemIcon key={item.id} item={item} size={56} onClick={() => setSelected(item)} />
          ))}
        </div>
      </QueryBoundary>

      {/* 아이템 상세 모달 (스켈레톤) */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ''}
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <ItemIcon item={selected} size={64} />
              <div>
                <p className="text-sm text-text-primary">{selected.description ?? '설명 준비 중'}</p>
                <p className="mt-1 text-xs text-text-muted">
                  {selected.type === 'combined' ? '조합 아이템' : '기본 재료'}
                </p>
              </div>
            </div>

            {selected.type === 'combined' && selected.recipe && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">조합법</p>
                <div className="flex items-center gap-2">
                  {selected.recipe.map((rid, i) => {
                    const comp = items.find((it) => it.id === rid);
                    return (
                      <div key={rid + i} className="flex items-center gap-2">
                        {comp ? <ItemIcon item={comp} size={44} /> : <Skeleton className="h-11 w-11" />}
                        {i === 0 && <span className="text-gold">+</span>}
                      </div>
                    );
                  })}
                  <span className="text-gold">=</span>
                  <ItemIcon item={selected} size={44} />
                </div>
              </div>
            )}

            <p className="rounded-md bg-bg-surface p-3 text-xs text-text-muted">
              평균등수·사용률·추천 챔피언 통계는 F5 단계에서 확장 예정입니다.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
