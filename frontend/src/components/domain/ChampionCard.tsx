import { Link } from 'react-router-dom';
import type { Champion } from '@/types/domain';
import { IconImage } from './IconImage';
import { classNames } from '@/lib/format';

const costBorder: Record<number, string> = {
  1: 'border-cost-1',
  2: 'border-cost-2',
  3: 'border-cost-3',
  4: 'border-cost-4',
  5: 'border-cost-5',
};

const costText: Record<number, string> = {
  1: 'text-cost-1',
  2: 'text-cost-2',
  3: 'text-cost-3',
  4: 'text-cost-4',
  5: 'text-cost-5',
};

export function ChampionCard({ champion }: { champion: Champion }) {
  return (
    <Link
      to={`/champions/${champion.id}`}
      className="group flex flex-col items-center rounded-card border border-line/30 bg-bg-surface p-2 transition-all hover:-translate-y-0.5 hover:border-gold/60 hover:shadow-teal-glow"
    >
      <div className={classNames('overflow-hidden rounded-md border-2', costBorder[champion.cost])}>
        <IconImage
          src={champion.iconUrl}
          alt={champion.name}
          fallback={champion.name.slice(0, 2)}
          className="h-14 w-14"
        />
      </div>
      <span className="mt-1.5 w-full truncate text-center text-xs font-medium text-text-primary group-hover:text-gold-bright">
        {champion.name}
      </span>
      <span className={classNames('text-[11px] font-semibold', costText[champion.cost])}>
        {champion.cost}💰
      </span>
    </Link>
  );
}
