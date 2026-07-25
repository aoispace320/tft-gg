export function Footer() {
  return (
    <footer className="mt-16 border-t border-line/30 bg-bg-elevated/50">
      <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-text-muted sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-base font-extrabold text-white">
              TFT<span className="text-brand">.GG</span>
            </p>
            <p className="mt-1 text-xs">롤토체스 전적·통계·메타 정보 서비스</p>
          </div>
          <p className="max-w-md text-xs leading-relaxed">
            tft.gg 은 Riot Games 가 보증하거나 후원하지 않으며, Riot Games 또는 League of
            Legends·Teamfight Tactics 제작에 공식적으로 관여한 그 누구의 견해도 반영하지 않습니다.
          </p>
        </div>
      </div>
    </footer>
  );
}
