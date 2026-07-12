import { classNames } from '@/lib/format';

export function Spinner({ className, size = 20 }: { className?: string; size?: number }) {
  return (
    <span
      role="status"
      aria-label="로딩 중"
      className={classNames('inline-block animate-spin rounded-full border-2 border-line/40 border-t-gold', className)}
      style={{ width: size, height: size }}
    />
  );
}
