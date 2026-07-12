import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
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
      // §9-2 홈(/) → /statistics 리다이렉트
      { path: '/', element: <Navigate to="/statistics" replace /> },
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
