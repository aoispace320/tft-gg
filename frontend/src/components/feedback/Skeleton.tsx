import { classNames } from '@/lib/format';

interface SkeletonProps {
  className?: string;
  rounded?: boolean;
}

/** 시머 애니메이션이 있는 로딩 플레이스홀더 블록. */
export function Skeleton({ className, rounded }: SkeletonProps) {
  return (
    <div
      className={classNames(
        'relative overflow-hidden bg-bg-elevated/70',
        rounded ? 'rounded-full' : 'rounded-md',
        className,
      )}
      aria-hidden="true"
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </div>
  );
}

/** 여러 줄의 텍스트 스켈레톤. */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={classNames('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={classNames('h-3', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}
