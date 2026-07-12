import { classNames } from '@/lib/format';

type AugmentTier = 'silver' | 'gold' | 'prismatic';

const tierRing: Record<AugmentTier, string> = {
  silver: 'border-tier-silver',
  gold: 'border-gold',
  prismatic: 'border-teal',
};

const tierGlow: Record<AugmentTier, string> = {
  silver: '',
  gold: 'shadow-gold-glow',
  prismatic: 'shadow-teal-glow',
};

/** 증강체 아이콘 (등급별 링). 아이콘 CDN 매핑 전 단계는 마름모 플레이스홀더. */
export function AugmentIcon({
  name,
  tier,
  size = 40,
  className,
}: {
  name: string;
  tier: AugmentTier;
  size?: number;
  className?: string;
}) {
  return (
    <div
      title={name}
      className={classNames(
        'grid place-items-center rounded-md border-2 bg-bg-elevated',
        tierRing[tier],
        tierGlow[tier],
        className,
      )}
      style={{ width: size, height: size }}
    >
      <span className="text-base">✦</span>
    </div>
  );
}
