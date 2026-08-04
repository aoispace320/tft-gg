import { describe, expect, it } from 'vitest';
import { parseRiotId } from './SearchBar';

describe('parseRiotId', () => {
  it('이름과 태그를 분리한다', () => {
    expect(parseRiotId('hide on bush#KR1')).toEqual({
      gameName: 'hide on bush',
      tagLine: 'KR1',
    });
  });

  it('태그가 없으면 tagLine 이 null', () => {
    expect(parseRiotId('페이커')).toEqual({ gameName: '페이커', tagLine: null });
  });

  it('앞뒤 공백을 제거한다', () => {
    expect(parseRiotId('  이름  #  KR1  ')).toEqual({ gameName: '이름', tagLine: 'KR1' });
  });

  it('이름에 # 이 여러 개면 첫 번째를 기준으로 나눈다', () => {
    expect(parseRiotId('a#b#c')).toEqual({ gameName: 'a', tagLine: 'b#c' });
  });

  it('# 만 있고 태그가 비면 tagLine 이 null', () => {
    expect(parseRiotId('이름#')).toEqual({ gameName: '이름', tagLine: null });
  });

  it('이름이 비면 gameName 이 빈 문자열 — 제출 차단 대상', () => {
    expect(parseRiotId('#KR1').gameName).toBe('');
  });

  it('빈 입력', () => {
    expect(parseRiotId('   ')).toEqual({ gameName: '', tagLine: null });
  });
});
