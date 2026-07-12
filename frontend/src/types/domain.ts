// §7 공용 도메인 타입 — 백엔드 API 소비 계약(선정의)
// 1차엔 src/mocks 의 목 데이터가 동일 형태로 반환한다.

export type CompTier = 'S' | 'A' | 'B' | 'C' | 'D';
export type ChampionCost = 1 | 2 | 3 | 4 | 5;
export type ItemType = 'component' | 'combined';

export type RankTier =
  | 'CHALLENGER'
  | 'GRANDMASTER'
  | 'MASTER'
  | 'DIAMOND'
  | 'EMERALD'
  | 'PLATINUM'
  | 'GOLD'
  | 'SILVER'
  | 'BRONZE'
  | 'IRON';

export interface Region {
  code: string; // 'kr', 'na', ...
  label: string; // '한국', '북미'
}

// --- 전적검색 ---
export interface SummonerProfile {
  name: string;
  region: string;
  tier: string; // 예: 'Diamond II'
  lp: number;
  level: number;
  iconUrl?: string;
}

export interface Match {
  id: string;
  placement: number; // 1~8
  comp: string; // 대표 조합명
  playedAt: string; // ISO date
  units?: string[]; // 대표 유닛 챔피언 id (추후 확장)
  queue?: string; // 'ranked' | 'double_up'
}

export type SummonerResponse = SummonerProfile & { matches: Match[] };

// --- 데이터 통계 ---
export interface StatCard {
  id: string;
  label: string;
  value: string;
  delta?: number; // 전 패치 대비 변동 (%)
}

export interface AugmentStat {
  id: string;
  name: string;
  tier: 'silver' | 'gold' | 'prismatic';
  pickRate: number; // 0~1
  avgPlacement: number;
  iconUrl?: string;
}

export interface MetaStats {
  patch: string;
  updatedAt: string;
  summary: StatCard[];
  topAugments: AugmentStat[];
  topComps: Comp[];
}

// --- 아이템 ---
export interface Item {
  id: string;
  name: string;
  type: ItemType;
  recipe?: string[]; // combined 인 경우 재료 item id 2개
  description?: string;
  iconUrl?: string;
}

// --- 챔피언 ---
export interface Champion {
  id: string;
  name: string;
  cost: ChampionCost;
  traits: string[];
  iconUrl?: string;
}

// --- 플레이어 순위 ---
export interface RankRow {
  rank: number;
  name: string;
  tier: string;
  lp: number;
  winRate: number; // 0~1
  region?: string;
}

export interface LeaderboardResponse {
  rows: RankRow[];
  total: number;
}

// --- 전략가(조합) ---
export interface Comp {
  id: string;
  name: string;
  tier: CompTier;
  coreUnits: string[]; // 챔피언 id
  avgPlacement?: number;
  playRate?: number;
  description?: string;
}
