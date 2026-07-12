import type { Item } from '@/types/domain';
import { itemIcon } from '@/lib/ddragon';

// 기본 재료(component) — TFT 9개 기본 아이템에 대응하는 예시 데이터.
const components: Array<Omit<Item, 'iconUrl'>> = [
  { id: 'bf_sword', name: 'B.F. 대검', type: 'component', description: '공격력 +10' },
  { id: 'recurve_bow', name: '곡궁', type: 'component', description: '공격 속도 +10%' },
  { id: 'needlessly_large_rod', name: '쓸데없이 큰 지팡이', type: 'component', description: '주문력 +10' },
  { id: 'tear', name: '눈물', type: 'component', description: '마나 +15' },
  { id: 'chain_vest', name: '사슬 조끼', type: 'component', description: '방어력 +20' },
  { id: 'negatron_cloak', name: '음전자 망토', type: 'component', description: '마법 저항력 +20' },
  { id: 'giants_belt', name: '거인의 허리띠', type: 'component', description: '체력 +150' },
  { id: 'spatula', name: '주걱', type: 'component', description: '특성 부여' },
  { id: 'glove', name: '장갑', type: 'component', description: '치명타 확률 +20%' },
];

// 조합(combined) — 예시 완성 아이템.
const combined: Array<Omit<Item, 'iconUrl'>> = [
  { id: 'deathblade', name: '죽음의 검', type: 'combined', recipe: ['bf_sword', 'bf_sword'], description: '공격력 대폭 증가' },
  { id: 'infinity_edge', name: '무한의 대검', type: 'combined', recipe: ['bf_sword', 'glove'], description: '치명타 피해 증가' },
  { id: 'giant_slayer', name: '거인 학살자', type: 'combined', recipe: ['bf_sword', 'recurve_bow'], description: '고체력 대상 추가 피해' },
  { id: 'rabadon', name: '라바돈의 죽음모자', type: 'combined', recipe: ['needlessly_large_rod', 'needlessly_large_rod'], description: '주문력 대폭 증가' },
  { id: 'archangel', name: '대천사의 지팡이', type: 'combined', recipe: ['needlessly_large_rod', 'tear'], description: '주기적으로 주문력 증가' },
  { id: 'jeweled_gauntlet', name: '보석 건틀릿', type: 'combined', recipe: ['needlessly_large_rod', 'glove'], description: '주문 치명타' },
  { id: 'warmogs', name: '워모그의 갑옷', type: 'combined', recipe: ['giants_belt', 'giants_belt'], description: '체력 대폭 증가' },
  { id: 'bramble_vest', name: '가시 갑옷', type: 'combined', recipe: ['chain_vest', 'chain_vest'], description: '방어력 및 반사 피해' },
  { id: 'dragons_claw', name: '용의 발톱', type: 'combined', recipe: ['negatron_cloak', 'negatron_cloak'], description: '마법 저항력 대폭 증가' },
  { id: 'guinsoo', name: '귄수의 격노검', type: 'combined', recipe: ['recurve_bow', 'glove'], description: '공격 시 공속 증가' },
  { id: 'bloodthirster', name: '피바라기', type: 'combined', recipe: ['bf_sword', 'negatron_cloak'], description: '생명력 흡수 및 보호막' },
  { id: 'blue_buff', name: '푸른 파수꾼', type: 'combined', recipe: ['tear', 'tear'], description: '스킬 후 마나 환급' },
];

// DDragon 아이템 숫자 id 로 대략 매핑(아이콘 시각화용). 실패 시 폴백 처리됨.
const iconMap: Record<string, string> = {
  bf_sword: '1038',
  recurve_bow: '1042',
  needlessly_large_rod: '1058',
  tear: '3070',
  chain_vest: '1031',
  negatron_cloak: '1057',
  giants_belt: '1011',
  spatula: '1041',
  glove: '1051',
  deathblade: '3031',
  infinity_edge: '3031',
  giant_slayer: '3036',
  rabadon: '3089',
  archangel: '3003',
  jeweled_gauntlet: '3095',
  warmogs: '3083',
  bramble_vest: '3075',
  dragons_claw: '3194',
  guinsoo: '3124',
  bloodthirster: '3072',
  blue_buff: '3040',
};

function withIcon(i: Omit<Item, 'iconUrl'>): Item {
  const num = iconMap[i.id];
  return { ...i, iconUrl: num ? itemIcon(num) : undefined };
}

export const mockItems: Item[] = [...components, ...combined].map(withIcon);
export const mockItemsById: Record<string, Item> = Object.fromEntries(
  mockItems.map((i) => [i.id, i]),
);
