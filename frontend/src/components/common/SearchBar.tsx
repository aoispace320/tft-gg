import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { REGIONS, DEFAULT_REGION } from '@/config/regions';
import { classNames } from '@/lib/format';

interface SearchBarProps {
  size?: 'sm' | 'lg';
  className?: string;
  autoFocus?: boolean;
}

/** 지역 셀렉트 + 소환사명 입력. 제출 시 /summoner/:region/:name 으로 이동. */
export function SearchBar({ size = 'sm', className, autoFocus }: SearchBarProps) {
  const navigate = useNavigate();
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [name, setName] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    navigate(`/summoner/${region}/${encodeURIComponent(trimmed)}`);
  }

  const lg = size === 'lg';

  return (
    <form
      onSubmit={submit}
      className={classNames(
        'flex items-stretch overflow-hidden rounded-btn border border-line/60 bg-bg-elevated focus-within:border-gold focus-within:shadow-gold-glow',
        lg ? 'h-12 text-base' : 'h-9 text-sm',
        className,
      )}
    >
      <select
        value={region}
        onChange={(e) => setRegion(e.target.value)}
        aria-label="지역 선택"
        className="border-r border-line/40 bg-bg-surface px-2 text-text-primary focus:outline-none"
      >
        {REGIONS.map((r) => (
          <option key={r.code} value={r.code}>
            {r.code.toUpperCase()}
          </option>
        ))}
      </select>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="소환사명 검색"
        autoFocus={autoFocus}
        aria-label="소환사명"
        className="min-w-0 flex-1 bg-transparent px-3 text-text-primary placeholder:text-text-muted focus:outline-none"
      />
      <button
        type="submit"
        aria-label="검색"
        className="flex items-center gap-1 bg-gold px-3 font-semibold text-bg-base transition-colors hover:bg-gold-bright"
      >
        🔍{lg && <span className="hidden sm:inline">검색</span>}
      </button>
    </form>
  );
}
