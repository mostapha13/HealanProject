import React, { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { HealanModal } from './HealanModal';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  tone?: 'danger' | 'warning' | 'info';
  icon?: string;
}

type Pending = ConfirmOptions & {
  resolve: (value: boolean) => void;
};

let setPendingGlobal: ((pending: Pending | null) => void) | null = null;
let hostMounted = false;

function ensureHost() {
  if (hostMounted || typeof document === 'undefined') return;
  hostMounted = true;
  const el = document.createElement('div');
  el.id = 'healan-confirm-host';
  document.body.appendChild(el);
  createRoot(el).render(<HealanConfirmHost />);
}

function HealanConfirmHost() {
  const [pending, setPending] = useState<Pending | null>(null);

  useEffect(() => {
    setPendingGlobal = setPending;
    return () => {
      setPendingGlobal = null;
    };
  }, []);

  const close = useCallback(
    (ok: boolean) => {
      pending?.resolve(ok);
      setPending(null);
    },
    [pending]
  );

  if (!pending) return null;

  const tone = pending.tone ?? 'danger';
  const confirmClass =
    tone === 'danger'
      ? 'healan-btn healan-btn--primary healan-btn--confirm-danger'
      : 'healan-btn healan-btn--primary';

  return (
    <HealanModal
      open
      title={pending.title ?? 'تأیید'}
      subtitle={pending.message}
      icon={pending.icon ?? (tone === 'danger' ? '⚠️' : 'ℹ️')}
      onClose={() => close(false)}
      width={440}
      footer={
        <div className="healan-modal__footer-actions">
          <button type="button" className="healan-btn healan-btn--outline" onClick={() => close(false)}>
            {pending.cancelText ?? 'انصراف'}
          </button>
          <button type="button" className={confirmClass} onClick={() => close(true)} autoFocus>
            {pending.confirmText ?? 'تأیید'}
          </button>
        </div>
      }
    >
      <p className="healan-confirm__hint">
        {tone === 'danger'
          ? 'این عمل قابل بازگشت نیست. لطفاً مطمئن شوید.'
          : 'برای ادامه تأیید کنید.'}
      </p>
    </HealanModal>
  );
}

/** دیالوگ تأیید زیبا (جایگزین window.confirm) */
export function confirmDialog(options: ConfirmOptions | string): Promise<boolean> {
  ensureHost();
  const opts: ConfirmOptions = typeof options === 'string' ? { message: options } : options;
  return new Promise((resolve) => {
    const trySet = () => {
      if (setPendingGlobal) {
        setPendingGlobal({ ...opts, resolve });
        return;
      }
      requestAnimationFrame(trySet);
    };
    trySet();
  });
}

export function confirmDelete(message: string, title = 'حذف شود؟'): Promise<boolean> {
  return confirmDialog({
    title,
    message,
    confirmText: 'بله، حذف شود',
    cancelText: 'انصراف',
    tone: 'danger',
    icon: '🗑️',
  });
}
