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

export interface ParsedRiotId {
  gameName: string;
  /** '#태그' 를 생략하면 null. 백엔드가 지역 기본 태그(kr → KR1)를 붙인다. */
  tagLine: string | null;
}

/**
 * Riot ID 입력을 분리한다.
 *
 *   'хide on bush#KR1' → { gameName: 'хide on bush', tagLine: 'KR1' }
 *   '이름'              → { gameName: '이름', tagLine: null }
 *   '#KR1'              → { gameName: '', tagLine: 'KR1' }   ← 이름이 없으므로 제출 불가
 *
 * 백엔드 riot_live.split_riot_id() 가 태그 생략을 이미 처리하므로,
 * 프론트는 '이름이 비었는가' 만 막고 나머지는 그대로 넘긴다.
 */
export function parseRiotId(input: string): ParsedRiotId {
  const text = input.trim();
  if (!text.includes('#')) return { gameName: text, tagLine: null };
  const [rawName, ...rest] = text.split('#');
  const tag = rest.join('#').trim();
  return { gameName: rawName.trim(), tagLine: tag || null };
}

/** 지역 셀렉트 + 소환사명 입력. 제출 시 /summoner/:region/:name 으로 이동.
 *  op.gg 스타일 — sm: 헤더용 다크 필 바 / lg: 히어로용 화이트 대형 바 */
export function SearchBar({ size = 'sm', className, autoFocus }: SearchBarProps) {
  const navigate = useNavigate();
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const parsed = parseRiotId(name);
  const hasInput = name.trim().length > 0;

  function submit(e: FormEvent) {
    e.preventDefault();
    const { gameName, tagLine } = parseRiotId(name);
    if (!gameName) {
      setError(hasInput ? '소환사명을 입력하세요. (예: 이름#KR1)' : null);
      return;
    }
    setError(null);
    // 태그를 생략하면 백엔드가 지역 기본 태그를 붙인다. 있는 그대로 넘긴다.
    const query = tagLine ? `${gameName}#${tagLine}` : gameName;
    navigate(`/summoner/${region}/${encodeURIComponent(query)}`);
  }

  const lg = size === 'lg';

  return (
    <div className={classNames('w-full', className)}>
      <form
        onSubmit={submit}
        data-testid="search-bar-form"
        className={classNames(
          'flex w-full items-center overflow-hidden rounded-full',
          lg
            ? 'h-14 bg-white pl-2 pr-2 text-base shadow-lg'
            : 'h-9 bg-bg-elevated pl-1 pr-1 text-sm focus-within:shadow-gold-glow',
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
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(null);
          }}
          placeholder={lg ? '플레이어 이름 + #KR1' : '소환사명 검색'}
          autoFocus={autoFocus}
          aria-label="소환사명"
          data-testid="search-bar-input"
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
          data-testid="search-bar-submit"
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

      {error && (
        <p data-testid="search-bar-error" className="mt-1.5 px-4 text-xs text-lose">
          {error}
        </p>
      )}
      {!error && hasInput && parsed.gameName && !parsed.tagLine && (
        <p data-testid="search-bar-hint" className="mt-1.5 px-4 text-xs text-text-muted">
          태그를 생략하면 {region.toUpperCase()} 기본 태그로 검색합니다. (예: {parsed.gameName}#
          {region.toUpperCase()}1)
        </p>
      )}
    </div>
  );
}
