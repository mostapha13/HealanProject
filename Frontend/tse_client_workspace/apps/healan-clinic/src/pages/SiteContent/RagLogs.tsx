import React, { useCallback, useEffect, useState } from 'react';
import withAlert from '../../hoc/withAlert';
import healanApi from '../../api/healanApi';
import type { RagChatLogItem } from '../../api/types';
import { PageHeader } from '../../components/Ui';
import { HEALAN_LIST_PAGE_SIZE, ListPagination, useListPagination } from '../../components/ListPagination';
import { convertDateAndTimeToJalali } from '@tse/tools';

function RagLogsPage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const [items, setItems] = useState<RagChatLogItem[]>([]);
  const [filterText, setFilterText] = useState('');
  const [phone, setPhone] = useState('');
  const [authFilter, setAuthFilter] = useState<'all' | 'auth' | 'guest'>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { page, pageSize, setPage, onPaginationChange } = useListPagination(HEALAN_LIST_PAGE_SIZE);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await healanApi.portal.ragChatLogList({
        pageNumber: page,
        pageSize,
        filterText: filterText.trim() || undefined,
        phone: phone.trim() || undefined,
        authenticatedOnly: authFilter === 'all' ? undefined : authFilter === 'auth',
      });
      setItems(res.items ?? []);
      setTotalCount(res.totalCount ?? 0);
    } catch (err) {
      onAlert(err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filterText, phone, authFilter, onAlert]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, filterText || phone ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, filterText, phone]);

  useEffect(() => {
    setPage(1);
  }, [filterText, phone, authFilter, setPage]);

  return (
    <>
      <PageHeader
        title="گفتگوهای دستیار"
        subtitle="سوالات کاربران سایت و پاسخ‌های ربات — برای بهبود دانش پایه"
        action={
          <button type="button" className="healan-btn healan-btn--outline" onClick={() => void load()}>
            به‌روزرسانی
          </button>
        }
      />

      <div className="healan-search-bar" style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <input
          placeholder="جستجو در سوال یا جواب..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          style={{ flex: '1 1 220px' }}
        />
        <input
          placeholder="موبایل..."
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          dir="ltr"
          style={{ flex: '0 1 160px' }}
        />
        <select
          className="healan-input"
          value={authFilter}
          onChange={(e) => setAuthFilter(e.target.value as 'all' | 'auth' | 'guest')}
          style={{ flex: '0 1 160px' }}
        >
          <option value="all">همه کاربران</option>
          <option value="auth">فقط لاگین‌شده</option>
          <option value="guest">فقط مهمان</option>
        </select>
      </div>

      <div className="healan-card">
        <div className="healan-card__body" style={{ padding: 0 }}>
          {loading ? (
            <div className="healan-empty">در حال بارگذاری…</div>
          ) : items.length === 0 ? (
            <div className="healan-empty">گفتگویی ثبت نشده است.</div>
          ) : (
            <table className="healan-table">
              <thead>
                <tr>
                  <th>زمان</th>
                  <th>کاربر</th>
                  <th>سوال</th>
                  <th>جواب</th>
                  <th>شباهت</th>
                  <th>منبع</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => {
                  const expanded = expandedId === row.ragChatLogId;
                  const answer = row.answer || '—';
                  const shortAnswer = answer.length > 120 && !expanded ? `${answer.slice(0, 120)}…` : answer;
                  return (
                    <tr key={row.ragChatLogId}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {row.createdAt ? convertDateAndTimeToJalali(row.createdAt) : '—'}
                      </td>
                      <td>
                        {row.isAuthenticated ? (
                          <span dir="ltr">{row.phoneNumber || 'لاگین'}</span>
                        ) : (
                          <span style={{ color: '#81858b' }}>مهمان</span>
                        )}
                      </td>
                      <td style={{ maxWidth: 280, whiteSpace: 'pre-wrap' }}>{row.question}</td>
                      <td style={{ maxWidth: 360 }}>
                        <div style={{ whiteSpace: 'pre-wrap' }}>{shortAnswer}</div>
                        {answer.length > 120 && (
                          <button
                            type="button"
                            className="healan-btn healan-btn--ghost healan-btn--sm"
                            style={{ marginTop: 4 }}
                            onClick={() => setExpandedId(expanded ? null : row.ragChatLogId)}
                          >
                            {expanded ? 'بستن' : 'ادامه'}
                          </button>
                        )}
                      </td>
                      <td>
                        {row.similarityScore != null ? `${Math.round(row.similarityScore)}%` : '—'}
                      </td>
                      <td>{row.sourceType || (row.wasAnswered ? 'rag' : '—')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <ListPagination
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onChange={onPaginationChange}
        />
      </div>
    </>
  );
}

export default withAlert(RagLogsPage);
