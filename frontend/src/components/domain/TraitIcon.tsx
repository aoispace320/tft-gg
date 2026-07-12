import { classNames } from '@/lib/format';

/** 특성 배지 (아이콘 CDN 매핑 전 단계: 이름 텍스트 칩). */
export function TraitIcon({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1 rounded border border-line/40 bg-bg-elevated px-2 py-0.5 text-xs text-text-muted',
        className,
      )}
    >
      <span className="grid h-3.5 w-3.5 place-items-center rounded-sm bg-line/60 text-[8px] text-bg-base">
        ◆
      </span>
      {name}
    </span>
  );
}
