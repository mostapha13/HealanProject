import React, { useEffect, useState } from 'react';
import withAlert from '../../hoc/withAlert';
import healanApi from '../../api/healanApi';
import type { PatientReviewItem, PatientReviewStatus } from '../../api/types';
import { PageHeader } from '../../components/Ui';
import { SearchableSelect } from '../../components/SearchableSelect';
import { convertDateAndTimeToJalali } from '@tse/tools';

const STATUS_OPTIONS: { value: PatientReviewStatus | ''; label: string }[] = [
  { value: '', label: 'همه' },
  { value: 'Pending', label: 'در انتظار تأیید' },
  { value: 'Approved', label: 'تأیید شده' },
  { value: 'Rejected', label: 'رد شده' },
];

const STATUS_LABEL: Record<PatientReviewStatus, string> = {
  Pending: 'در انتظار',
  Approved: 'تأیید شده',
  Rejected: 'رد شده',
};

function ReviewsAdminPage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const [items, setItems] = useState<PatientReviewItem[]>([]);
  const [filter, setFilter] = useState<PatientReviewStatus | ''>('Pending');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await healanApi.portal.reviewList(filter || undefined);
      setItems(res);
    } catch (err) {
      onAlert(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [filter]);

  const moderate = async (review: PatientReviewItem, status: PatientReviewStatus) => {
    try {
      await healanApi.portal.reviewModerate({
        patientReviewId: review.patientReviewId,
        status,
        adminNote: status === 'Rejected' ? 'رد توسط مدیر' : undefined,
      });
      await load();
      onAlert({ type: 'success', message: status === 'Approved' ? 'نظر منتشر شد' : 'نظر رد شد' });
    } catch (err) {
      onAlert(err);
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm('این نظر حذف شود؟')) return;
    try {
      await healanApi.portal.reviewDelete(id);
      await load();
      onAlert({ type: 'success', message: 'نظر حذف شد' });
    } catch (err) {
      onAlert(err);
    }
  };

  return (
    <>
      <PageHeader title="نظرات بیماران" subtitle="تأیید یا رد نظرات ارسالی از سایت" />
      <div className="healan-card" style={{ marginBottom: '1rem' }}>
        <div className="healan-card__body">
          <div className="healan-form-field" style={{ maxWidth: 280 }}>
            <label>وضعیت</label>
            <SearchableSelect
              value={filter || null}
              onChange={(v) => setFilter((v as PatientReviewStatus) ?? '')}
              allowClear={false}
              options={STATUS_OPTIONS}
            />
          </div>
        </div>
      </div>

      <div className="healan-card">
        <div className="healan-card__body" style={{ padding: 0, overflowX: 'auto' }}>
          {loading ? (
            <div className="healan-empty">در حال بارگذاری...</div>
          ) : items.length === 0 ? (
            <div className="healan-empty">نظری یافت نشد</div>
          ) : (
            <table className="healan-table">
              <thead>
                <tr>
                  <th>نام</th>
                  <th>تماس</th>
                  <th>امتیاز</th>
                  <th>متن</th>
                  <th>تاریخ</th>
                  <th>وضعیت</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {items.map((review) => (
                  <tr key={review.patientReviewId}>
                    <td>{review.displayName}</td>
                    <td>{review.contactInfo}</td>
                    <td>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</td>
                    <td style={{ maxWidth: 280 }}>{review.reviewText}</td>
                    <td>{review.createdAt ? convertDateAndTimeToJalali(review.createdAt) : '—'}</td>
                    <td>{STATUS_LABEL[review.status] ?? review.status}</td>
                    <td>
                      {review.status === 'Pending' && (
                        <>
                          <button type="button" className="healan-btn healan-btn--primary healan-btn--sm" onClick={() => void moderate(review, 'Approved')}>تأیید</button>
                          {' '}
                          <button type="button" className="healan-btn healan-btn--outline healan-btn--sm" onClick={() => void moderate(review, 'Rejected')}>رد</button>
                          {' '}
                        </>
                      )}
                      <button type="button" className="healan-btn healan-btn--outline healan-btn--sm" onClick={() => void remove(review.patientReviewId)}>حذف</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

export default withAlert(ReviewsAdminPage);
