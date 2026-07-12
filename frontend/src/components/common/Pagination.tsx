import { classNames } from '@/lib/format';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const windowSize = 5;
  const start = Math.max(1, Math.min(page - 2, totalPages - windowSize + 1));
  const pages = Array.from({ length: Math.min(windowSize, totalPages) }, (_, i) => start + i).filter(
    (p) => p >= 1 && p <= totalPages,
  );

  function btn(label: string, target: number, disabled: boolean, active = false) {
    return (
      <button
        key={label + target}
        disabled={disabled}
        onClick={() => onPageChange(target)}
        className={classNames(
          'flex h-8 min-w-8 items-center justify-center rounded-btn border px-2 text-sm transition-colors',
          active
            ? 'border-gold bg-gold/15 text-gold'
            : 'border-line/40 text-text-muted hover:border-gold hover:text-gold-bright',
          disabled && 'cursor-not-allowed opacity-40 hover:border-line/40 hover:text-text-muted',
        )}
      >
        {label}
      </button>
    );
  }

  return (
    <nav className="flex items-center justify-center gap-1.5" aria-label="페이지네이션">
      {btn('«', 1, page === 1)}
      {btn('‹', page - 1, page === 1)}
      {pages.map((p) => btn(String(p), p, false, p === page))}
      {btn('›', page + 1, page === totalPages)}
      {btn('»', totalPages, page === totalPages)}
    </nav>
  );
}
