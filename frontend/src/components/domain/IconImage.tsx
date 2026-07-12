import { useState } from 'react';
import { classNames } from '@/lib/format';

interface IconImageProps {
  src?: string;
  alt: string;
  /** 로드 실패 시 표시할 이니셜/이모지 */
  fallback: string;
  className?: string;
  fallbackClassName?: string;
}

/** CDN 아이콘 로드 실패 시 이니셜 플레이스홀더로 폴백하는 이미지. */
export function IconImage({ src, alt, fallback, className, fallbackClassName }: IconImageProps) {
  const [failed, setFailed] = useState(!src);

  if (failed || !src) {
    return (
      <div
        className={classNames(
          'grid place-items-center bg-bg-elevated text-xs font-semibold text-text-muted',
          className,
          fallbackClassName,
        )}
        aria-label={alt}
        role="img"
      >
        {fallback}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={classNames('object-cover', className)}
    />
  );
}
