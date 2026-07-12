import { useEffect, useRef, useState } from 'react';
import { classNames } from '@/lib/format';

export interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

export function Dropdown({ options, value, onChange, label, className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className={classNames('relative', className)} ref={ref}>
      {label && <span className="mb-1 block text-xs text-text-muted">{label}</span>}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-btn border border-line/60 bg-bg-elevated px-3 text-sm text-text-primary transition-colors hover:border-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
      >
        <span>{selected?.label ?? '선택'}</span>
        <span className={classNames('text-xs text-text-muted transition-transform', open && 'rotate-180')}>▾</span>
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-btn border border-line/60 bg-bg-elevated py-1 shadow-lg"
        >
          {options.map((opt) => (
            <li key={opt.value}>
              <button
                type="button"
                role="option"
                aria-selected={opt.value === value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={classNames(
                  'block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-bg-surface',
                  opt.value === value ? 'text-gold' : 'text-text-primary',
                )}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
