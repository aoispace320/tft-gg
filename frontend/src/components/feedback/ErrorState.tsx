import { Button } from '@/components/common/Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = '문제가 발생했습니다',
  message = '데이터를 불러오는 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-rank-s/30 bg-rank-s/5 px-6 py-16 text-center">
      <div className="mb-4 text-4xl">⚠️</div>
      <h3 className="mb-1 text-lg font-semibold text-text-primary">{title}</h3>
      <p className="mb-5 max-w-sm text-sm text-text-muted">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          다시 시도
        </Button>
      )}
    </div>
  );
}
