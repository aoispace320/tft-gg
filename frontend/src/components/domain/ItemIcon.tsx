import type { Item } from '@/types/domain';
import { IconImage } from './IconImage';
import { classNames } from '@/lib/format';

interface ItemIconProps {
  item: Item;
  size?: number;
  onClick?: () => void;
  className?: string;
}

export function ItemIcon({ item, size = 48, onClick, className }: ItemIconProps) {
  const border = item.type === 'combined' ? 'border-gold/70' : 'border-line/50';
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      onClick={onClick}
      title={item.name}
      className={classNames(
        'overflow-hidden rounded-md border-2 transition-transform',
        border,
        onClick && 'hover:scale-105 hover:border-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60',
        className,
      )}
      style={{ width: size, height: size }}
    >
      <IconImage
        src={item.iconUrl}
        alt={item.name}
        fallback={item.name.slice(0, 1)}
        className="h-full w-full"
      />
    </Comp>
  );
}
