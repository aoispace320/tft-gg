import { classNames } from '@/lib/format';

export interface TabItem<T extends string = string> {
  key: T;
  label: string;
  count?: number;
}

interface TabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (key: T) => void;
  className?: string;
}

export function Tabs<T extends string>({ items, value, onChange, className }: TabsProps<T>) {
  return (
    <div className={classNames('flex flex-wrap gap-1 border-b border-line/30', className)} role="tablist">
      {items.map((item) => {
        const active = item.key === value;
        return (
          <button
            key={item.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.key)}
            className={classNames(
              'relative -mb-px px-4 py-2.5 text-sm font-medium transition-colors',
              active ? 'text-gold-bright' : 'text-text-muted hover:text-text-primary',
            )}
          >
            {item.label}
            {typeof item.count === 'number' && (
              <span className="ml-1.5 text-xs text-text-muted">{item.count}</span>
            )}
            {active && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gold shadow-[0_0_8px_0_rgba(200,170,110,0.6)]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
