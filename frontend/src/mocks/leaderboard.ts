import type { LeaderboardResponse, RankRow } from '@/types/domain';

const names = [
  'Faker', 'Guma의부캐', 'MidKingda', '롤토체스장인', 'ChovyTFT',
  '한조각의별', 'Deft님', '천상계메타', '리롤장인', '증강체수집가',
  '8인분요리사', '롤체고인물', 'Zeus탑솔', 'Keria서폿', 'ViperADC',
  '탑랭커준비생', '실버탈출각', '더블업듀오', '메타충전소', '골드5수문장',
];

const tiers = ['Challenger', 'Grandmaster', 'Master'];

const fullList: RankRow[] = Array.from({ length: 137 }, (_, i) => {
  const base = names[i % names.length];
  return {
    rank: i + 1,
    name: i < names.length ? base : `${base}${Math.floor(i / names.length) + 1}`,
    tier: i < 3 ? 'Challenger' : i < 25 ? 'Grandmaster' : tiers[i % tiers.length] ?? 'Master',
    lp: Math.max(0, 1850 - i * 11 - (i % 5) * 3),
    winRate: 0.62 - i * 0.0011,
    region: 'kr',
  };
});

export function mockLeaderboard(page: number, pageSize = 20): LeaderboardResponse {
  const start = (page - 1) * pageSize;
  return {
    rows: fullList.slice(start, start + pageSize),
    total: fullList.length,
  };
}
