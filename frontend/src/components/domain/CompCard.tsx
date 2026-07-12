import { Link } from 'react-router-dom';
import type { Comp } from '@/types/domain';
import { TierBadge } from './TierBadge';
import { UnitList } from './UnitList';
import { pct } from '@/lib/format';

export function CompCard({ comp }: { comp: Comp }) {
  return (
    <Link
      to={`/comps/${comp.id}`}
      className="group block rounded-card border border-line/30 bg-bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-gold/60 hover:shadow-teal-glow"
    >
      <div className="mb-3 flex items-center gap-3">
        <TierBadge tier={comp.tier} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-lg font-bold text-text-primary group-hover:text-gold-bright">
            {comp.name}
          </h3>
          <div className="flex gap-3 text-xs text-text-muted">
            {comp.avgPlacement != null && <span>평균 {comp.avgPlacement.toFixed(1)}등</span>}
            {comp.playRate != null && <span>픽률 {pct(comp.playRate)}</span>}
          </div>
        </div>
      </div>
      <UnitList ids={comp.coreUnits} />
    </Link>
  );
}
