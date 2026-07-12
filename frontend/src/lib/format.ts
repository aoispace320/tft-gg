// 표시용 포맷 헬퍼

export function pct(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function placementLabel(placement: number): string {
  return `${placement}등`;
}

export function relativeTime(iso: string, now: number = Date.parse('2026-07-12T12:00:00Z')): string {
  const then = Date.parse(iso);
  const diffMs = now - then;
  const min = Math.round(diffMs / 60000);
  if (min < 60) return `${Math.max(min, 1)}분 전`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.round(hr / 24);
  return `${day}일 전`;
}

export function classNames(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
