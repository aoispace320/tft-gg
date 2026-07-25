import type { CompTier } from '@/types/domain';
import { classNames } from '@/lib/format';

const tierColor: Record<CompTier, string> = {
  S: 'bg-rank-s text-white',
  A: 'bg-rank-a text-white',
  B: 'bg-rank-b text-bg-base',
  C: 'bg-rank-c text-white',
  D: 'bg-rank-d text-bg-base',
};

/** 조합·챔피언 티어리스트 배지(S/A/B/C/D). */
export function TierBadge({
  tier,
  size = 'md',
  className,
}: {
  tier: CompTier;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClass =
    size === 'lg' ? 'h-10 w-10 text-xl' : size === 'sm' ? 'h-6 w-6 text-xs' : 'h-8 w-8 text-base';
  return (
    <span
      className={classNames(
        'inline-grid place-items-center rounded-md font-black shadow-sm',
        tierColor[tier],
        sizeClass,
        className,
      )}
      title={`${tier} 티어`}
    >
      {tier}
    </span>
  );
}
