import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { HomePage } from '@/pages/HomePage';
import { SearchPage } from '@/pages/SearchPage';
import { SummonerPage } from '@/pages/SummonerPage';
import { StatisticsPage } from '@/pages/StatisticsPage';
import { ItemsPage } from '@/pages/ItemsPage';
import { ChampionsPage } from '@/pages/ChampionsPage';
import { ChampionDetailPage } from '@/pages/ChampionDetailPage';
import { LeaderboardPage } from '@/pages/LeaderboardPage';
import { CompsPage } from '@/pages/CompsPage';
import { CompDetailPage } from '@/pages/CompDetailPage';
import { ArenaPage } from '@/pages/ArenaPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      // 홈 — 히어로 검색 + 추천 메타 + 랭킹 TOP 10 (op.gg/lolchess 참고)
      { path: '/', element: <HomePage /> },
      { path: '/search', element: <SearchPage /> },
      { path: '/summoner/:region/:name', element: <SummonerPage /> },
      { path: '/statistics', element: <StatisticsPage /> },
      { path: '/items', element: <ItemsPage /> },
      { path: '/champions', element: <ChampionsPage /> },
      { path: '/champions/:id', element: <ChampionDetailPage /> },
      { path: '/leaderboard', element: <LeaderboardPage /> },
      { path: '/comps', element: <CompsPage /> },
      { path: '/comps/:id', element: <CompDetailPage /> },
      { path: '/arena', element: <ArenaPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
