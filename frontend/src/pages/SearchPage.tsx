import { PageHeader } from '@/components/layout/PageHeader';
import { SearchBar } from '@/components/common/SearchBar';
import { Card } from '@/components/common/Card';

const HINTS = ['Faker', 'Guma의부캐', 'ChovyTFT', 'empty (빈 상태)', 'error (에러 상태)'];

export function SearchPage() {
  return (
    <div>
      <PageHeader title="전적검색" subtitle="지역과 소환사명을 입력해 전적을 조회하세요." />

      <div className="mx-auto max-w-2xl">
        <Card className="p-6">
          <div className="p-1">
            <SearchBar size="lg" autoFocus />
            <p className="mt-3 text-xs text-text-muted">
              예시 검색어:{' '}
              {HINTS.map((h, i) => (
                <span key={h}>
                  <span className="text-teal">{h}</span>
                  {i < HINTS.length - 1 && ', '}
                </span>
              ))}
            </p>
          </div>
        </Card>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { icon: '🏆', title: '티어·LP', desc: '현재 랭크와 LP 확인' },
            { icon: '📊', title: '평균 등수', desc: '최근 전적 통계 (추후)' },
            { icon: '🎯', title: 'Top4 비율', desc: '순방 확률 분석 (추후)' },
          ].map((f) => (
            <div key={f.title} className="rounded-card border border-line/30 bg-bg-surface p-4 text-center">
              <div className="text-2xl">{f.icon}</div>
              <p className="mt-2 text-sm font-semibold text-text-primary">{f.title}</p>
              <p className="text-xs text-text-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
