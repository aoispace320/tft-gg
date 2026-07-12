import type { HTMLAttributes } from 'react';
import { classNames } from '@/lib/format';

export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classNames('mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8', className)} {...props} />;
}
