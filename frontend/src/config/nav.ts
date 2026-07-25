// §4 글로벌 네비게이션 탭 정의
export interface NavTab {
  label: string;
  to: string;
  match: string; // 활성 판정용 경로 접두사
}

export const NAV_TABS: NavTab[] = [
  { label: '홈', to: '/', match: '/' },
  { label: '전적검색', to: '/search', match: '/search' },
  { label: '데이터 통계', to: '/statistics', match: '/statistics' },
  { label: '아이템', to: '/items', match: '/items' },
  { label: '챔피언 통계', to: '/champions', match: '/champions' },
  { label: '플레이어 순위', to: '/leaderboard', match: '/leaderboard' },
  { label: '전략가', to: '/comps', match: '/comps' },
  { label: '결투장 소개', to: '/arena', match: '/arena' },
];
