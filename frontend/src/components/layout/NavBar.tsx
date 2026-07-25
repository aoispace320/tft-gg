import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { NAV_TABS } from '@/config/nav';
import { SearchBar } from '@/components/common/SearchBar';
import { classNames } from '@/lib/format';

export function NavBar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  function isActive(match: string) {
    if (match === '/') return location.pathname === '/';
    return location.pathname === match || location.pathname.startsWith(match + '/');
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-bg-surface">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-5 px-4 sm:px-6 lg:px-8">
        {/* 로고 */}
        <Link to="/" className="flex shrink-0 items-center gap-1.5">
          <span className="grid h-7 w-7 place-items-center rounded bg-brand text-base font-black text-white">
            T
          </span>
          <span className="text-lg font-extrabold tracking-tight text-white">
            TFT<span className="text-brand">.GG</span>
          </span>
        </Link>

        {/* 데스크톱 탭 (op.gg 스타일 — 로고 옆 좌측 정렬) */}
        <nav className="hidden h-full flex-1 items-stretch gap-1 lg:flex">
          {NAV_TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={classNames(
                'relative flex items-center px-3 text-sm font-bold transition-colors',
                isActive(tab.match) ? 'text-white' : 'text-text-muted hover:text-text-primary',
              )}
            >
              {tab.label}
              {isActive(tab.match) && (
                <span className="absolute inset-x-2 bottom-0 h-[3px] rounded-t-full bg-brand" />
              )}
            </NavLink>
          ))}
        </nav>

        {/* 검색바 */}
        <div className="ml-auto hidden w-72 lg:block">
          <SearchBar />
        </div>

        {/* 모바일 토글 */}
        <button
          className="ml-auto rounded p-2 text-text-primary lg:hidden"
          aria-label="메뉴 열기"
          onClick={() => setMobileOpen((v) => !v)}
        >
          ☰
        </button>
      </div>

      {/* 모바일 메뉴 */}
      {mobileOpen && (
        <div className="border-t border-line/40 bg-bg-surface px-4 py-3 lg:hidden">
          <div className="mb-3">
            <SearchBar />
          </div>
          <nav className="grid grid-cols-2 gap-1">
            {NAV_TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                onClick={() => setMobileOpen(false)}
                className={classNames(
                  'rounded px-3 py-2 text-sm font-medium',
                  isActive(tab.match)
                    ? 'bg-bg-elevated text-white'
                    : 'text-text-muted hover:bg-bg-elevated',
                )}
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
