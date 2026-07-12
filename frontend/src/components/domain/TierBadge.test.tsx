import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TierBadge } from './TierBadge';

describe('TierBadge', () => {
  it('티어 문자를 렌더한다', () => {
    render(<TierBadge tier="S" />);
    expect(screen.getByText('S')).toBeInTheDocument();
  });
});
