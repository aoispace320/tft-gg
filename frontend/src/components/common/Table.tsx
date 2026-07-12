import type { ReactNode } from 'react';
import { classNames } from '@/lib/format';

export interface Column<Row> {
  key: string;
  header: ReactNode;
  render: (row: Row, index: number) => ReactNode;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  width?: string;
}

interface TableProps<Row> {
  columns: Column<Row>[];
  data: Row[];
  rowKey: (row: Row, index: number) => string;
  onRowClick?: (row: Row) => void;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  className?: string;
}

const alignClass = { left: 'text-left', center: 'text-center', right: 'text-right' } as const;

export function Table<Row>({
  columns,
  data,
  rowKey,
  onRowClick,
  sortKey,
  sortDir,
  onSort,
  className,
}: TableProps<Row>) {
  return (
    <div className={classNames('overflow-x-auto', className)}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line/40 text-xs uppercase tracking-wide text-text-muted">
            {columns.map((col) => {
              const isSorted = sortKey === col.key;
              return (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={classNames(
                    'px-4 py-3 font-medium',
                    alignClass[col.align ?? 'left'],
                    col.sortable && 'cursor-pointer select-none hover:text-gold-bright',
                  )}
                  onClick={col.sortable ? () => onSort?.(col.key) : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && (
                      <span className={classNames('text-[10px]', isSorted ? 'text-gold' : 'opacity-40')}>
                        {isSorted ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                      </span>
                    )}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={rowKey(row, i)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={classNames(
                'border-b border-line/15 transition-colors',
                onRowClick && 'cursor-pointer hover:bg-bg-elevated/50',
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={classNames('px-4 py-3 text-text-primary', alignClass[col.align ?? 'left'])}
                >
                  {col.render(row, i)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
