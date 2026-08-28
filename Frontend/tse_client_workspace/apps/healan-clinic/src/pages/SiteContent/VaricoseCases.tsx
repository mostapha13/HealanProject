import React, { useEffect, useState } from 'react';
import withAlert from '../../hoc/withAlert';
import healanApi from '../../api/healanApi';
import type { VaricoseCaseItem } from '../../api/types';
import { PageHeader } from '../../components/Ui';
import { HealanFileUpload, type FileUploadMeta } from '../../components/HealanFileUpload';
import { confirmDelete } from '../../components/confirmDialog';

const empty = {
  varicoseCaseId: 0, title: '', description: '', treatmentLabel: '', sortOrder: 0,
  before: null as FileUploadMeta | null, after: null as FileUploadMeta | null,
  hasPublicationConsent: false, isPublished: false,
};

function VaricoseCasesPage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const [items, setItems] = useState<VaricoseCaseItem[]>([]);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const load = async () => { try { setItems(await healanApi.portal.varicoseCaseList()); } catch (e) { onAlert(e); } };
  useEffect(() => { void load(); }, []);

  const edit = (x: VaricoseCaseItem) => setForm({
    varicoseCaseId: x.varicoseCaseId, title: x.title, description: x.description ?? '',
    treatmentLabel: x.treatmentLabel ?? '', sortOrder: x.sortOrder,
    before: { fileId: x.beforeImageFileId, fileName: 'تصویر قبل درمان', link: x.beforeImageUrl },
    after: { fileId: x.afterImageFileId, fileName: 'تصویر بعد درمان', link: x.afterImageUrl },
    hasPublicationConsent: x.hasPublicationConsent, isPublished: x.isPublished,
  });

  const save = async () => {
    if (form.title.trim().length < 3 || !form.before?.fileId || !form.after?.fileId) {
      onAlert({ type: 'warning', message: 'عنوان و هر دو تصویر قبل و بعد الزامی است' }); return;
    }
    if (form.isPublished && !form.hasPublicationConsent) {
      onAlert({ type: 'warning', message: 'برای انتشار، رضایت بیمار باید ثبت شده باشد' }); return;
    }
    setSaving(true);
    try {
      await healanApi.portal.varicoseCaseSave({
        varicoseCaseId: form.varicoseCaseId || undefined, title: form.title,
        description: form.description, treatmentLabel: form.treatmentLabel, sortOrder: Number(form.sortOrder),
        beforeImageFileId: form.before.fileId, beforeImageUrl: form.before.link,
        afterImageFileId: form.after.fileId, afterImageUrl: form.after.link,
        hasPublicationConsent: form.hasPublicationConsent, isPublished: form.isPublished,
      });
      setForm(empty); await load(); onAlert({ type: 'success', message: 'نمونه‌کار ذخیره شد' });
    } catch (e) { onAlert(e); } finally { setSaving(false); }
  };

  const remove = async (id: number) => {
    if (!(await confirmDelete('این نمونه‌کار حذف شود؟'))) return;
    try { await healanApi.portal.varicoseCaseDelete(id); await load(); onAlert({ type: 'success', message: 'حذف شد' }); }
    catch (e) { onAlert(e); }
  };

  return <>
    <PageHeader title="نمونه‌کارهای واریس" subtitle="مدیریت تصاویر قبل و بعد از درمان برای نمایش در سایت" />
    <div className="healan-card" style={{ marginBottom: '1rem' }}><div className="healan-card__body">
      <div className="healan-form-grid">
        <div className="healan-form-field"><label>عنوان *</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="مثلاً درمان واریس ساق پا" /></div>
        <div className="healan-form-field"><label>روش درمان</label><input value={form.treatmentLabel} onChange={e => setForm({ ...form, treatmentLabel: e.target.value })} placeholder="لیزر داخل عروقی" /></div>
        <div className="healan-form-field"><label>ترتیب نمایش</label><input type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: Number(e.target.value) })} /></div>
      </div>
      <div className="healan-form-field"><label>توضیح کوتاه</label><textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
      <div className="healan-form-grid">
        <HealanFileUpload value={form.before} onChange={before => setForm({ ...form, before })} onError={onAlert} accept="image/jpeg,image/png,image/webp" label="تصویر قبل از درمان *" />
        <HealanFileUpload value={form.after} onChange={after => setForm({ ...form, after })} onError={onAlert} accept="image/jpeg,image/png,image/webp" label="تصویر بعد از درمان *" />
      </div>
      <label style={{ display: 'block', marginTop: 16 }}><input type="checkbox" checked={form.hasPublicationConsent} onChange={e => setForm({ ...form, hasPublicationConsent: e.target.checked })} /> رضایت بیمار برای انتشار تصاویر دریافت و ثبت شده است.</label>
      <label style={{ display: 'block', marginTop: 10 }}><input type="checkbox" checked={form.isPublished} onChange={e => setForm({ ...form, isPublished: e.target.checked })} /> انتشار در سایت</label>
      <div style={{ display: 'flex', gap: 8, marginTop: 18 }}><button className="healan-btn healan-btn--primary" disabled={saving} onClick={() => void save()}>{saving ? 'در حال ذخیره...' : 'ذخیره نمونه‌کار'}</button>{form.varicoseCaseId > 0 && <button className="healan-btn healan-btn--outline" onClick={() => setForm(empty)}>انصراف</button>}</div>
    </div></div>
    <div className="healan-card"><div className="healan-card__body" style={{ padding: 0, overflowX: 'auto' }}>
      {items.length === 0 ? <div className="healan-empty">هنوز نمونه‌کاری ثبت نشده است</div> : <table className="healan-table"><thead><tr><th>تصاویر</th><th>عنوان</th><th>روش درمان</th><th>انتشار</th><th>عملیات</th></tr></thead><tbody>{items.map(x => <tr key={x.varicoseCaseId}>
        <td><div style={{ display: 'flex', gap: 6 }}><img src={x.beforeImageUrl} alt="قبل" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8 }} /><img src={x.afterImageUrl} alt="بعد" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8 }} /></div></td>
        <td>{x.title}</td><td>{x.treatmentLabel || '—'}</td><td>{x.isPublished ? 'منتشر شده' : 'پیش‌نویس'}</td><td><button className="healan-btn healan-btn--outline healan-btn--sm" onClick={() => edit(x)}>ویرایش</button>{' '}<button className="healan-btn healan-btn--action healan-btn--danger healan-btn--sm" onClick={() => void remove(x.varicoseCaseId)}>حذف</button></td>
      </tr>)}</tbody></table>}
    </div></div>
  </>;
}

export default withAlert(VaricoseCasesPage);
