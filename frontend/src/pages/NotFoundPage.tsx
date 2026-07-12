import { Link } from 'react-router-dom';
import { Button } from '@/components/common/Button';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="font-display text-7xl font-black text-gold">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold text-gold-bright">페이지를 찾을 수 없습니다</h1>
      <p className="mt-2 max-w-md text-sm text-text-muted">
        요청하신 페이지가 존재하지 않거나 이동되었습니다.
      </p>
      <Link to="/statistics" className="mt-6">
        <Button>데이터 통계로 이동</Button>
      </Link>
    </div>
  );
}
