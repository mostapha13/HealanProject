import React, { useEffect } from 'react';

export interface HealanModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  icon?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number | string;
}

export function HealanModal({
  open,
  title,
  subtitle,
  icon,
  onClose,
  children,
  footer,
  width = 520,
}: HealanModalProps) {
  useEffect(() => {
    if (!open) return undefined;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="healan-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="healan-modal"
        style={{ maxWidth: width }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="healan-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="healan-modal__header">
          <div className="healan-modal__header-text">
            {icon && <span className="healan-modal__icon" aria-hidden>{icon}</span>}
            <div>
              <h3 id="healan-modal-title">{title}</h3>
              {subtitle && <p>{subtitle}</p>}
            </div>
          </div>
          <button type="button" className="healan-modal__close" onClick={onClose} aria-label="بستن">
            ×
          </button>
        </div>
        <div className="healan-modal__body">{children}</div>
        {footer && <div className="healan-modal__footer">{footer}</div>}
      </div>
    </div>
  );
}
