import React, { useCallback, useEffect, useState } from 'react';
import withAlert from '../../hoc/withAlert';
import healanApi from '../../api/healanApi';
import type { SmsOutboxItem } from '../../api/types';
import { PageHeader } from '../../components/Ui';
import { convertDateAndTimeToJalali } from '@tse/tools';

function SmsOutboxPage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const [items, setItems] = useState<SmsOutboxItem[]>([]);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await healanApi.reports.smsOutbox({
        take: 100,
        phone: phone.trim() || undefined,
      });
      setItems(res);
    } catch (err) {
      onAlert(err);
    } finally {
      setLoading(false);
    }
  }, [phone, onAlert]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, phone ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, phone]);

  return (
    <>
      <PageHeader
        title="پیامک‌های ارسالی"
        subtitle="کد OTP فراموشی رمز و سایر پیامک‌ها برای تست و پیگیری"
        action={
          <button type="button" className="healan-btn healan-btn--outline" onClick={() => void load()}>
            بروزرسانی
          </button>
        }
      />

      <div className="healan-search-bar" style={{ marginBottom: '1rem' }}>
        <input
          placeholder="جستجو با شماره موبایل..."
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          dir="ltr"
        />
      </div>

      <div className="healan-card">
        <div className="healan-card__body" style={{ padding: 0 }}>
          {loading ? (
            <div className="healan-empty">در حال بارگذاری...</div>
          ) : items.length === 0 ? (
            <div className="healan-empty">پیامکی یافت نشد — یک‌بار فراموشی رمز را تست کنید.</div>
          ) : (
            <table className="healan-table">
              <thead>
                <tr>
                  <th>زمان</th>
                  <th>موبایل</th>
                  <th>کد</th>
                  <th>وضعیت</th>
                  <th>کانال</th>
                  <th>متن</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id}>
                    <td>{row.createdAt ? convertDateAndTimeToJalali(row.createdAt) : '—'}</td>
                    <td dir="ltr">{row.phoneNumber || '—'}</td>
                    <td>
                      <strong style={{ color: '#b91c1c', fontSize: '1.05rem' }}>
                        {row.extractedCode || '—'}
                      </strong>
                    </td>
                    <td style={{ color: row.success ? '#047857' : '#b91c1c' }}>
                      {row.success ? 'موفق' : 'ناموفق'}
                    </td>
                    <td>{row.channel || '—'}</td>
                    <td style={{ maxWidth: 320, whiteSpace: 'pre-wrap' }}>{row.message || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <p style={{ marginTop: '0.75rem', color: 'var(--healan-text-muted)', fontSize: '0.85rem' }}>
        کد OTP ارسالی برای فراموشی رمز را از ستون «کد» بخوانید و در صفحه تغییر رمز وارد کنید.
      </p>
    </>
  );
}

export default withAlert(SmsOutboxPage);
