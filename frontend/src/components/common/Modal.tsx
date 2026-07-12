import { useEffect } from 'react';
import type { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-bg-base/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-card border border-line/60 bg-bg-elevated shadow-teal-glow">
        <div className="flex items-center justify-between border-b border-line/30 px-5 py-3">
          {typeof title === 'string' ? (
            <h3 className="text-base font-semibold text-gold-bright">{title}</h3>
          ) : (
            title
          )}
          <button
            onClick={onClose}
            aria-label="닫기"
            className="rounded p-1 text-text-muted transition-colors hover:text-gold-bright"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>
        {footer && <div className="border-t border-line/30 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}
