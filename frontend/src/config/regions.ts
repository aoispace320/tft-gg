import type { Region } from '@/types/domain';

export const REGIONS: Region[] = [
  { code: 'kr', label: '한국 (KR)' },
  { code: 'na', label: '북미 (NA)' },
  { code: 'euw', label: '서유럽 (EUW)' },
  { code: 'jp', label: '일본 (JP)' },
  { code: 'br', label: '브라질 (BR)' },
  { code: 'oce', label: '오세아니아 (OCE)' },
];

export const DEFAULT_REGION = 'kr';
