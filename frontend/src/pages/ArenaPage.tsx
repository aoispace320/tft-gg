import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/feedback/EmptyState';

const RULES = [
  { icon: '👥', title: '2인 협동', desc: '파트너와 팀을 이뤄 4팀(8인)이 겨루는 협동 모드입니다.' },
  { icon: '🔄', title: '유닛 공유', desc: '파트너에게 유닛·아이템을 보내 서로를 지원할 수 있습니다.' },
  { icon: '❤️', title: '공유 체력', desc: '팀의 체력을 공유하며, 파트너가 살아있으면 재도전할 수 있습니다.' },
  { icon: '🏆', title: '최종 1팀', desc: '마지막까지 살아남는 한 팀이 승리합니다.' },
];

export function ArenaPage() {
  return (
    <div>
      <PageHeader title="결투장 소개" subtitle="더블업(결투장) 모드 개요와 규칙" />

      {/* Hero */}
      <Card className="mb-6 overflow-hidden">
        <div className="relative flex flex-col items-start gap-3 bg-gradient-to-br from-bg-elevated to-bg-surface p-2">
          <Badge tone="teal">DOUBLE UP</Badge>
          <h2 className="font-display text-3xl font-bold text-gold-bright">
            둘이서 함께, 결투장
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-text-muted">
            결투장(더블업)은 두 명이 한 팀을 이뤄 다른 팀들과 경쟁하는 롤토체스의 협동 모드입니다.
            파트너와 전략을 공유하고 유닛을 주고받으며, 함께 최후의 팀을 노리세요.
          </p>
        </div>
      </Card>

      {/* 규칙 섹션 */}
      <h3 className="mb-3 font-display text-lg font-semibold text-text-primary">규칙 개요</h3>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {RULES.map((r) => (
          <div key={r.title} className="flex gap-4 rounded-card border border-line/30 bg-bg-surface p-4">
            <div className="text-3xl">{r.icon}</div>
            <div>
              <p className="font-semibold text-text-primary">{r.title}</p>
              <p className="mt-1 text-sm text-text-muted">{r.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 스크린샷 섹션 */}
      <h3 className="mb-3 font-display text-lg font-semibold text-text-primary">스크린샷</h3>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {['게임 화면', '유닛 공유', '결과 화면'].map((label) => (
          <div
            key={label}
            className="grid aspect-video place-items-center rounded-card border border-dashed border-line/50 bg-bg-surface/40 text-sm text-text-muted"
          >
            🖼️ {label}
          </div>
        ))}
      </div>

      <EmptyState
        title="결투장 전용 통계 준비 중"
        message="결투장 전용 통계·전적, 이벤트/시즌 공지는 추후 확장 단계에서 제공됩니다."
        icon="⚔️"
      />
    </div>
  );
}
