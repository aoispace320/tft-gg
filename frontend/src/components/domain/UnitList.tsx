import { mockChampionsById } from '@/mocks/champions';
import { IconImage } from './IconImage';
import { classNames } from '@/lib/format';

const costBorder: Record<number, string> = {
  1: 'border-cost-1',
  2: 'border-cost-2',
  3: 'border-cost-3',
  4: 'border-cost-4',
  5: 'border-cost-5',
};

/** 챔피언 id 배열을 코스트 테두리 아이콘 행으로 렌더. */
export function UnitList({ ids, size = 40 }: { ids: string[]; size?: number }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ids.map((id) => {
        const champ = mockChampionsById[id];
        return (
          <div
            key={id}
            title={champ?.name ?? id}
            className={classNames(
              'overflow-hidden rounded-md border-2',
              costBorder[champ?.cost ?? 1],
            )}
            style={{ width: size, height: size }}
          >
            <IconImage
              src={champ?.iconUrl}
              alt={champ?.name ?? id}
              fallback={(champ?.name ?? id).slice(0, 2)}
              className="h-full w-full"
            />
          </div>
        );
      })}
    </div>
  );
}
