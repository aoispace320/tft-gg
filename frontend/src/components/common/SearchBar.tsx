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

/** 지역 셀렉트 + 소환사명 입력. 제출 시 /summoner/:region/:name 으로 이동.
 *  op.gg 스타일 — sm: 헤더용 다크 필 바 / lg: 히어로용 화이트 대형 바 */
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
        'flex items-center overflow-hidden rounded-full',
        lg
          ? 'h-14 bg-white pl-2 pr-2 text-base shadow-lg'
          : 'h-9 bg-bg-elevated pl-1 pr-1 text-sm focus-within:shadow-gold-glow',
        className,
      )}
    >
      <label
        className={classNames(
          'flex shrink-0 flex-col justify-center border-r px-3',
          lg ? 'border-gray-200' : 'border-line/60',
        )}
      >
        {lg && <span className="text-[10px] font-bold uppercase text-gray-400">지역</span>}
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          aria-label="지역 선택"
          className={classNames(
            'bg-transparent font-semibold focus:outline-none',
            lg ? 'text-sm text-gray-800' : 'text-xs text-text-primary',
          )}
        >
          {REGIONS.map((r) => (
            <option key={r.code} value={r.code}>
              {r.code.toUpperCase()}
            </option>
          ))}
        </select>
      </label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={lg ? '플레이어 이름 + #KR1' : '소환사명 검색'}
        autoFocus={autoFocus}
        aria-label="소환사명"
        className={classNames(
          'min-w-0 flex-1 bg-transparent px-3 focus:outline-none',
          lg
            ? 'text-gray-900 placeholder:text-gray-400'
            : 'text-text-primary placeholder:text-text-muted',
        )}
      />
      <button
        type="submit"
        aria-label="검색"
        className={classNames(
          'flex shrink-0 items-center justify-center rounded-full font-extrabold transition-colors',
          lg
            ? 'h-10 px-5 text-brand hover:bg-brand/10'
            : 'h-7 w-12 bg-brand text-xs text-white hover:bg-brand-bright',
        )}
      >
        .GG
      </button>
    </form>
  );
}
