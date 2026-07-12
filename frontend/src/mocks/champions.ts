import type { Champion } from '@/types/domain';
import { championIcon } from '@/lib/ddragon';

// DDragon 챔피언 키 기준. traits 는 예시(스켈레톤용) 특성명.
const raw: Array<Omit<Champion, 'iconUrl'>> = [
  { id: 'Ashe', name: '애쉬', cost: 1, traits: ['서리', '사수'] },
  { id: 'Warwick', name: '워윅', cost: 1, traits: ['늑대인간', '난동꾼'] },
  { id: 'Poppy', name: '뽀삐', cost: 1, traits: ['요들', '수호자'] },
  { id: 'Kennen', name: '케넨', cost: 1, traits: ['요들', '결사대'] },
  { id: 'Zed', name: '제드', cost: 2, traits: ['닌자', '결투가'] },
  { id: 'Ahri', name: '아리', cost: 2, traits: ['영혼', '마법사'] },
  { id: 'Jax', name: '잭스', cost: 2, traits: ['결투가', '수호자'] },
  { id: 'Syndra', name: '신드라', cost: 3, traits: ['영혼', '마법사'] },
  { id: 'Sett', name: '세트', cost: 3, traits: ['난동꾼', '결사대'] },
  { id: 'Lux', name: '럭스', cost: 3, traits: ['빛의 인도자', '마법사'] },
  { id: 'Kaisa', name: '카이사', cost: 4, traits: ['공허', '사수'] },
  { id: 'Yasuo', name: '야스오', cost: 4, traits: ['결투가', '바람'] },
  { id: 'Viego', name: '비에고', cost: 4, traits: ['몰락한 왕', '결투가'] },
  { id: 'Kayn', name: '케인', cost: 5, traits: ['그림자', '암살자'] },
  { id: 'Ryze', name: '라이즈', cost: 5, traits: ['현자', '마법사'] },
  { id: 'Sona', name: '소나', cost: 5, traits: ['빛의 인도자', '지휘관'] },
];

export const mockChampions: Champion[] = raw.map((c) => ({
  ...c,
  iconUrl: championIcon(c.id),
}));

export const mockChampionsById: Record<string, Champion> = Object.fromEntries(
  mockChampions.map((c) => [c.id, c]),
);

export const allTraits: string[] = Array.from(
  new Set(mockChampions.flatMap((c) => c.traits)),
).sort();
