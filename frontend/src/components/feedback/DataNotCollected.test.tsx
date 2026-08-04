import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DataNotCollected } from './DataNotCollected';

describe('DataNotCollected', () => {
  it('기본 안내와 수집 명령을 함께 보여준다', () => {
    render(<DataNotCollected />);
    expect(screen.getByTestId('data-not-collected')).toBeInTheDocument();
    expect(screen.getByTestId('data-not-collected-command')).toHaveTextContent(
      'python -m pipeline.run',
    );
  });

  it('화면별 맞춤 메시지를 받는다', () => {
    render(<DataNotCollected message="조합 데이터가 없습니다." />);
    expect(screen.getByText('조합 데이터가 없습니다.')).toBeInTheDocument();
  });

  it('command 를 null 로 주면 명령 블록을 숨긴다', () => {
    render(<DataNotCollected command={null} />);
    expect(screen.queryByTestId('data-not-collected-command')).not.toBeInTheDocument();
  });
});
