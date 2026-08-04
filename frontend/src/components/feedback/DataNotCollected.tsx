import type { ReactNode } from 'react';

interface DataNotCollectedProps {
  title?: string;
  message?: string;
  /** 데이터를 채우는 방법. 개발자가 다음 행동을 알 수 있도록 명령을 그대로 보여준다. */
  command?: string | null;
  icon?: ReactNode;
  action?: ReactNode;
}

/**
 * "아직 수집되지 않음" 상태.
 *
 * EmptyState 와 의도적으로 구분한다:
 *   EmptyState        — "조건에 맞는 결과가 없다" (필터를 바꾸면 나올 수 있다)
 *   DataNotCollected  — "원천 데이터 자체가 없다" (파이프라인을 돌려야 한다)
 * 두 상태가 사용자에게 요구하는 행동이 다르므로 화면도 달라야 한다.
 */
export function DataNotCollected({
  title = '데이터 수집 전',
  message = '이 화면은 수집·전처리된 매치 데이터를 사용합니다. 아직 수집된 데이터가 없습니다.',
  command = 'python -m pipeline.run --players 3 --matches 5',
  icon = '📭',
  action,
}: DataNotCollectedProps) {
  return (
    <div
      data-testid="data-not-collected"
      className="flex flex-col items-center justify-center rounded-card border border-dashed border-line/50 bg-bg-surface/40 px-6 py-14 text-center"
    >
      <div className="mb-4 text-4xl opacity-70">{icon}</div>
      <h3 className="mb-1 text-lg font-semibold text-text-primary">{title}</h3>
      <p className="max-w-md text-sm leading-relaxed text-text-muted">{message}</p>

      {command && (
        <div className="mt-5 w-full max-w-md">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
            데이터 수집 방법
          </p>
          <code
            data-testid="data-not-collected-command"
            className="block overflow-x-auto rounded-md border border-line/40 bg-bg-base px-3 py-2 text-left text-xs text-brand-bright"
          >
            {command}
          </code>
          <p className="mt-2 text-xs text-text-muted">
            저장소 루트에서 실행하면 <code className="text-text-primary">data/processed/</code> 에
            CSV 가 생성되고, 서버를 재시작하면 통계가 표시됩니다.
          </p>
        </div>
      )}

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
