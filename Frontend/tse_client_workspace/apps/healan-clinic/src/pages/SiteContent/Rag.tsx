import React, { useEffect, useMemo, useState } from 'react';
import { Pagination } from 'antd';
import withAlert from '../../hoc/withAlert';
import healanApi from '../../api/healanApi';
import type { RagKnowledgeItem, RagSetting } from '../../api/types';
import { PageHeader } from '../../components/Ui';
import { SearchableSelect } from '../../components/SearchableSelect';
import { convertDateAndTimeToJalali } from '@tse/tools';

const PAGE_SIZE = 10;

const ACTIVE_OPTIONS = [
  { value: '', label: 'همه' },
  { value: 'true', label: 'فعال' },
  { value: 'false', label: 'غیرفعال' },
];

const emptyForm = (): RagKnowledgeItem => ({
  ragKnowledgeItemId: 0,
  question: '',
  questionSummary: '',
  keywords: '',
  topic: '',
  answer: '',
  similarQuestions: '',
  priority: 0,
  sortOrder: 0,
  isActive: true,
  createdAt: '',
});

function RagAdminPage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const [items, setItems] = useState<RagKnowledgeItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filterText, setFilterText] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<RagKnowledgeItem>(emptyForm);
  const [settings, setSettings] = useState<RagSetting | null>(null);

  const topicOptions = useMemo(() => {
    const topics = Array.from(new Set(items.map((i) => i.topic).filter(Boolean))) as string[];
    return [{ value: '', label: 'همه موضوعات' }, ...topics.map((t) => ({ value: t, label: t }))];
  }, [items]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await healanApi.portal.ragList({
        filterText: filterText || undefined,
        topic: topicFilter || undefined,
        isActive: activeFilter === '' ? undefined : activeFilter === 'true',
        pageNumber: page,
        pageSize: PAGE_SIZE,
      });
      setItems(res.items ?? []);
      setTotalCount(res.totalCount ?? 0);
    } catch (err) {
      onAlert(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await healanApi.portal.ragSettingGet();
      setSettings(res);
    } catch (err) {
      onAlert(err);
    }
  };

  useEffect(() => {
    void load();
  }, [page, activeFilter, topicFilter]);

  useEffect(() => {
    void loadSettings();
  }, []);

  const openNew = () => {
    setForm(emptyForm());
    setShowForm(true);
  };

  const openEdit = async (item: RagKnowledgeItem) => {
    try {
      const detail = await healanApi.portal.ragInfo(item.ragKnowledgeItemId);
      setForm(detail);
      setShowForm(true);
    } catch (err) {
      onAlert(err);
    }
  };

  const handleSave = async () => {
    if (!form.question.trim()) {
      onAlert({ type: 'error', message: 'متن سوال الزامی است' });
      return;
    }
    if (!form.answer.trim()) {
      onAlert({ type: 'error', message: 'متن جواب الزامی است' });
      return;
    }

    setSaving(true);
    try {
      await healanApi.portal.ragRegister({
        ragKnowledgeItemId: form.ragKnowledgeItemId > 0 ? form.ragKnowledgeItemId : undefined,
        question: form.question.trim(),
        questionSummary: form.questionSummary?.trim() || undefined,
        keywords: form.keywords?.trim() || undefined,
        topic: form.topic?.trim() || undefined,
        answer: form.answer.trim(),
        similarQuestions: form.similarQuestions?.trim() || undefined,
        priority: form.priority,
        sortOrder: form.sortOrder,
        isActive: form.isActive,
      });
      setShowForm(false);
      await load();
      onAlert({ type: 'success', message: 'سوال ذخیره شد' });
    } catch (err) {
      onAlert(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item: RagKnowledgeItem) => {
    try {
      await healanApi.portal.ragRegister({
        ragKnowledgeItemId: item.ragKnowledgeItemId,
        question: item.question,
        questionSummary: item.questionSummary,
        keywords: item.keywords,
        topic: item.topic,
        answer: item.answer,
        similarQuestions: item.similarQuestions,
        priority: item.priority,
        sortOrder: item.sortOrder,
        isActive: !item.isActive,
      });
      await load();
      onAlert({ type: 'success', message: item.isActive ? 'سوال غیرفعال شد' : 'سوال فعال شد' });
    } catch (err) {
      onAlert(err);
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm('این سوال حذف شود؟')) return;
    try {
      await healanApi.portal.ragDelete(id);
      await load();
      onAlert({ type: 'success', message: 'سوال حذف شد' });
    } catch (err) {
      onAlert(err);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const saved = await healanApi.portal.ragSettingSave(settings);
      setSettings(saved);
      setShowSettings(false);
      onAlert({ type: 'success', message: 'تنظیمات RAG ذخیره شد' });
    } catch (err) {
      onAlert(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="ربات پاسخ‌گو — دانش پایه"
        subtitle="مدیریت سوال و جواب‌های ربات سایت و تنظیمات همگام‌سازی وکتور"
        action={
          <div className="healan-actions">
            <button type="button" className="healan-btn healan-btn--ghost" onClick={() => setShowSettings(true)}>
              تنظیمات RAG
            </button>
            <button type="button" className="healan-btn healan-btn--primary" onClick={openNew}>
              سوال جدید
            </button>
          </div>
        }
      />

      {showSettings && settings && (
        <div className="healan-card" style={{ marginBottom: '1rem' }}>
          <div className="healan-card__header">
            <h3>تنظیمات RAG</h3>
          </div>
          <div className="healan-card__body">
            <div className="healan-form-grid">
              <div className="healan-form-field">
                <label>فاصله همگام‌سازی (دقیقه)</label>
                <input
                  className="healan-input"
                  type="number"
                  min={1}
                  max={1440}
                  value={settings.syncIntervalMinutes}
                  onChange={(e) => setSettings({ ...settings, syncIntervalMinutes: Number(e.target.value) })}
                />
              </div>
              <div className="healan-form-field">
                <label>آستانه شباهت (درصد)</label>
                <input
                  className="healan-input"
                  type="number"
                  min={1}
                  max={100}
                  value={settings.similarityThresholdPercent}
                  onChange={(e) => setSettings({ ...settings, similarityThresholdPercent: Number(e.target.value) })}
                />
              </div>
              <div className="healan-form-field">
                <label>آدرس سرویس Python</label>
                <input
                  className="healan-input"
                  value={settings.pythonApiUrl}
                  onChange={(e) => setSettings({ ...settings, pythonApiUrl: e.target.value })}
                  placeholder="http://localhost:8000"
                />
              </div>
              <div className="healan-form-field">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.isEnabled}
                    onChange={(e) => setSettings({ ...settings, isEnabled: e.target.checked })}
                  />{' '}
                  ربات فعال باشد
                </label>
              </div>
              {settings.lastSyncedAt && (
                <div className="healan-form-field">
                  <label>آخرین همگام‌سازی</label>
                  <div>{convertDateAndTimeToJalali(settings.lastSyncedAt)}</div>
                </div>
              )}
            </div>
            <div className="healan-actions" style={{ marginTop: '1rem' }}>
              <button type="button" className="healan-btn healan-btn--ghost" onClick={() => setShowSettings(false)}>
                انصراف
              </button>
              <button type="button" className="healan-btn healan-btn--primary" disabled={saving} onClick={() => void saveSettings()}>
                ذخیره تنظیمات
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="healan-card" style={{ marginBottom: '1rem' }}>
          <div className="healan-card__header">
            <h3>{form.ragKnowledgeItemId > 0 ? 'ویرایش سوال' : 'سوال جدید'}</h3>
          </div>
          <div className="healan-card__body">
            <div className="healan-form-grid">
              <div className="healan-form-field healan-form-field--full">
                <label>سوال</label>
                <input className="healan-input" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
              </div>
              <div className="healan-form-field">
                <label>خلاصه سوال</label>
                <input className="healan-input" value={form.questionSummary ?? ''} onChange={(e) => setForm({ ...form, questionSummary: e.target.value })} />
              </div>
              <div className="healan-form-field">
                <label>موضوع</label>
                <input className="healan-input" value={form.topic ?? ''} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="مثلاً تماس و آدرس" />
              </div>
              <div className="healan-form-field healan-form-field--full">
                <label>کلمات کلیدی (با ویرگول)</label>
                <input className="healan-input" value={form.keywords ?? ''} onChange={(e) => setForm({ ...form, keywords: e.target.value })} />
              </div>
              <div className="healan-form-field healan-form-field--full">
                <label>سوالات مشابه (هر خط یک سوال)</label>
                <textarea className="healan-input" rows={3} value={form.similarQuestions ?? ''} onChange={(e) => setForm({ ...form, similarQuestions: e.target.value })} />
              </div>
              <div className="healan-form-field healan-form-field--full">
                <label>جواب</label>
                <textarea className="healan-input" rows={5} value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} />
              </div>
              <div className="healan-form-field">
                <label>اولویت</label>
                <input className="healan-input" type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} />
              </div>
              <div className="healan-form-field">
                <label>ترتیب</label>
                <input className="healan-input" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
              </div>
              <div className="healan-form-field">
                <label>
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> فعال
                </label>
              </div>
            </div>
            <div className="healan-actions" style={{ marginTop: '1rem' }}>
              <button type="button" className="healan-btn healan-btn--ghost" onClick={() => setShowForm(false)}>
                انصراف
              </button>
              <button type="button" className="healan-btn healan-btn--primary" disabled={saving} onClick={() => void handleSave()}>
                ذخیره
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="healan-card">
        <div className="healan-card__body">
          <div className="healan-filters" style={{ marginBottom: '1rem' }}>
            <input
              className="healan-input"
              placeholder="جستجو در سوال، کلیدواژه، موضوع..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void load()}
            />
            <SearchableSelect<string>
              options={topicOptions}
              value={topicFilter || null}
              onChange={(v) => {
                setTopicFilter(v ? String(v) : '');
                setPage(1);
              }}
              placeholder="موضوع"
            />
            <SearchableSelect<string>
              options={ACTIVE_OPTIONS}
              value={activeFilter || null}
              onChange={(v) => {
                setActiveFilter(v ? String(v) : '');
                setPage(1);
              }}
              placeholder="وضعیت"
            />
            <button type="button" className="healan-btn healan-btn--ghost" onClick={() => void load()}>
              اعمال فیلتر
            </button>
          </div>

          {loading ? (
            <div className="healan-empty">در حال بارگذاری...</div>
          ) : items.length === 0 ? (
            <div className="healan-empty">سوالی ثبت نشده است.</div>
          ) : (
            <div className="healan-table-wrap">
              <table className="healan-table">
                <thead>
                  <tr>
                    <th>سوال</th>
                    <th>موضوع</th>
                    <th>وضعیت</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.ragKnowledgeItemId}>
                      <td>
                        <strong>{item.question}</strong>
                        <div className="healan-muted" style={{ fontSize: '0.85rem', marginTop: 4 }}>
                          {item.questionSummary || item.answer.slice(0, 80)}
                          {item.answer.length > 80 ? '…' : ''}
                        </div>
                      </td>
                      <td>{item.topic || '—'}</td>
                      <td>{item.isActive ? 'فعال' : 'غیرفعال'}</td>
                      <td>
                        <div className="healan-actions">
                          <button type="button" className="healan-btn healan-btn--ghost healan-btn--sm" onClick={() => void openEdit(item)}>
                            ویرایش
                          </button>
                          <button type="button" className="healan-btn healan-btn--ghost healan-btn--sm" onClick={() => void toggleActive(item)}>
                            {item.isActive ? 'غیرفعال' : 'فعال'}
                          </button>
                          <button type="button" className="healan-btn healan-btn--ghost healan-btn--sm" onClick={() => void remove(item.ragKnowledgeItemId)}>
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalCount > PAGE_SIZE && (
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
              <Pagination current={page} pageSize={PAGE_SIZE} total={totalCount} onChange={setPage} showSizeChanger={false} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default withAlert(RagAdminPage);
