import React, { useState } from 'react';
import type { MasterDataDeletedItem } from '../api/types';

interface DeletedItemsPanelProps {
  loadItems: () => Promise<MasterDataDeletedItem[]>;
  restoreItem: (id: number) => Promise<unknown>;
  onRestored: () => Promise<void> | void;
  onAlert: (message: unknown) => void;
}

export function DeletedItemsPanel({
  loadItems,
  restoreItem,
  onRestored,
  onAlert,
}: DeletedItemsPanelProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<MasterDataDeletedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await loadItems());
    } catch (error) {
      onAlert(error);
    } finally {
      setLoading(false);
    }
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) void load();
  };

  const restore = async (item: MasterDataDeletedItem) => {
    setRestoringId(item.id);
    try {
      await restoreItem(item.id);
      await Promise.all([load(), Promise.resolve(onRestored())]);
      onAlert({ type: 'success', message: 'رکورد با موفقیت بازیابی شد' });
    } catch (error) {
      onAlert(error);
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="healan-card" style={{ marginTop: '1rem' }}>
      <div className="healan-card__header">
        <h3>رکوردهای حذف‌شده</h3>
        <button type="button" className="healan-btn healan-btn--muted" onClick={toggle}>
          {open ? 'بستن' : 'نمایش و بازیابی'}
        </button>
      </div>
      {open && (
        <div className="healan-card__body" style={{ padding: 0 }}>
          {loading ? (
            <div className="healan-empty">در حال بارگذاری...</div>
          ) : items.length === 0 ? (
            <div className="healan-empty">رکورد حذف‌شده‌ای وجود ندارد</div>
          ) : (
            <table className="healan-table">
              <thead>
                <tr>
                  <th>عنوان</th>
                  <th>زمان حذف</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.displayName || `رکورد ${item.id}`}</td>
                    <td>{item.deletedAt ? new Date(item.deletedAt).toLocaleString('fa-IR') : '—'}</td>
                    <td>
                      <button
                        type="button"
                        className="healan-btn healan-btn--outline healan-btn--sm"
                        disabled={restoringId === item.id}
                        onClick={() => void restore(item)}
                      >
                        {restoringId === item.id ? 'در حال بازیابی...' : 'بازیابی'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
