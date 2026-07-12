// Riot Data Dragon CDN 에셋 헬퍼 (§9-3)
// 정확한 TFT 파일명 매핑이 어려운 스켈레톤 단계에서는
// LoL 챔피언/아이템 스퀘어 아트를 사용하고, 로드 실패 시 컴포넌트에서 폴백 처리한다.

const VERSION = import.meta.env.VITE_DDRAGON_VERSION ?? '14.24.1';
const BASE = `https://ddragon.leagueoflegends.com/cdn/${VERSION}/img`;

/** LoL 챔피언 스퀘어 아이콘. id 는 DDragon 챔피언 키(예: 'Aatrox'). */
export function championIcon(id: string): string {
  return `${BASE}/champion/${id}.png`;
}

/** LoL 아이템 아이콘. numericId 는 DDragon 아이템 숫자 id(예: '1001'). */
export function itemIcon(numericId: string): string {
  return `${BASE}/item/${numericId}.png`;
}

/** 프로필 아이콘. */
export function profileIcon(numericId: number | string): string {
  return `${BASE}/profileicon/${numericId}.png`;
}

export const DDRAGON_VERSION = VERSION;
