import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

// §7 폴백 규칙: VITE_API_BASE_URL 미설정이거나 VITE_USE_MOCK=true 이면 목 모드.
export const USE_MOCK =
  import.meta.env.VITE_USE_MOCK === 'true' || BASE_URL.trim() === '';

export const http = axios.create({
  baseURL: BASE_URL || '/api',
  timeout: 10_000,
  headers: { Accept: 'application/json' },
});

/** 목 데이터 반환 시 실제 네트워크처럼 약간의 지연을 준다(스켈레톤 확인용). */
export function withMockDelay<T>(data: T, ms = 450): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), ms);
  });
}
