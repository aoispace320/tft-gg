import type { ReactNode } from 'react';
import { ErrorState } from './ErrorState';
import { EmptyState } from './EmptyState';

interface QueryBoundaryProps {
  isLoading: boolean;
  isError: boolean;
  isEmpty?: boolean;
  onRetry?: () => void;
  skeleton: ReactNode;
  empty?: ReactNode;
  children: ReactNode;
}

/**
 * §7 React Query 표준 상태 렌더:
 * isLoading → Skeleton, isError → ErrorState, 빈 데이터 → EmptyState.
 */
export function QueryBoundary({
  isLoading,
  isError,
  isEmpty,
  onRetry,
  skeleton,
  empty,
  children,
}: QueryBoundaryProps) {
  if (isLoading) return <>{skeleton}</>;
  if (isError) return <ErrorState onRetry={onRetry} />;
  if (isEmpty) return <>{empty ?? <EmptyState />}</>;
  return <>{children}</>;
}
