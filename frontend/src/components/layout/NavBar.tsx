import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { NAV_TABS } from '@/config/nav';
import { SearchBar } from '@/components/common/SearchBar';
import { classNames } from '@/lib/format';

export function NavBar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  function isActive(match: string) {
    return location.pathname === match || location.pathname.startsWith(match + '/');
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line/40 bg-bg-elevated/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* 로고 */}
        <Link to="/statistics" className="flex shrink-0 items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded bg-gold text-lg font-black text-bg-base">
            T
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-gold-bright">
            tft<span className="text-gold">.gg</span>
          </span>
        </Link>

        {/* 데스크톱 탭 */}
        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {NAV_TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={classNames(
                'relative px-3 py-2 text-sm font-medium transition-colors',
                isActive(tab.match) ? 'text-gold-bright' : 'text-text-muted hover:text-text-primary',
              )}
            >
              {tab.label}
              {isActive(tab.match) && (
                <span className="absolute inset-x-2 -bottom-[21px] h-0.5 rounded-full bg-gold shadow-[0_0_8px_0_rgba(200,170,110,0.7)]" />
              )}
            </NavLink>
          ))}
        </nav>

        {/* 검색바 */}
        <div className="ml-auto hidden w-64 lg:block">
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
        <div className="border-t border-line/30 bg-bg-elevated px-4 py-3 lg:hidden">
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
                    ? 'bg-bg-surface text-gold-bright'
                    : 'text-text-muted hover:bg-bg-surface',
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
