import React, { useMemo, useState } from 'react';

type Props<T> = {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  emptyText?: string;
  getKey?: (item: T, index: number) => string | number;
};

export function PatientPagedList<T>({ items, renderItem, emptyText = 'موردی نیست.', getKey }: Props<T>) {
  const [pageSize, setPageSize] = useState<10 | 20>(10);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, pageSize, safePage]);

  if (items.length === 0) {
    return <p className="portal-patient__hint">{emptyText}</p>;
  }

  return (
    <div className="portal-patient__paged">
      <div className="portal-patient__pager-bar">
        <span className="portal-patient__muted">
          {items.length} مورد · صفحه {safePage.toLocaleString('fa-IR')} از {totalPages.toLocaleString('fa-IR')}
        </span>
        <div className="portal-patient__pager-sizes">
          {[10, 20].map((n) => (
            <button
              key={n}
              type="button"
              className={`p-btn p-btn--sm${pageSize === n ? ' p-btn--primary' : ' p-btn--outline'}`}
              onClick={() => {
                setPageSize(n as 10 | 20);
                setPage(1);
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <ul className="portal-patient__list">
        {pageItems.map((item, i) => (
          <li key={getKey ? getKey(item, i) : i}>{renderItem(item, (safePage - 1) * pageSize + i)}</li>
        ))}
      </ul>

      {totalPages > 1 && (
        <div className="portal-patient__pager-nav">
          <button
            type="button"
            className="p-btn p-btn--outline p-btn--sm"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            قبلی
          </button>
          <button
            type="button"
            className="p-btn p-btn--outline p-btn--sm"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            بعدی
          </button>
        </div>
      )}
    </div>
  );
}
