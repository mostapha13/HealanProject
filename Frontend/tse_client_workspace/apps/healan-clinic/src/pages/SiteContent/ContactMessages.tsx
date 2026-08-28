import React, { useEffect, useState } from 'react';
import withAlert from '../../hoc/withAlert';
import healanApi from '../../api/healanApi';
import type { PortalContactMessageItem } from '../../api/types';
import { PageHeader } from '../../components/Ui';
import { confirmDelete } from '../../components/confirmDialog';
import { convertDateAndTimeToJalali } from '@tse/tools';

function ContactMessagesPage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const [items, setItems] = useState<PortalContactMessageItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('unread');
  const load = async () => { try { setItems(await healanApi.portal.contactMessageList(filter === 'all' ? undefined : filter === 'read')); } catch (e) { onAlert(e); } };
  useEffect(() => { void load(); }, [filter]);
  const toggle = async (x: PortalContactMessageItem) => { try { await healanApi.portal.contactMessageUpdate({ portalContactMessageId: x.portalContactMessageId, isRead: !x.isRead, adminNote: x.adminNote }); await load(); } catch (e) { onAlert(e); } };
  const remove = async (id: number) => { if (!(await confirmDelete('این پیام حذف شود؟'))) return; try { await healanApi.portal.contactMessageDelete(id); await load(); } catch (e) { onAlert(e); } };
  return <>
    <PageHeader title="پیام‌های تماس با ما" subtitle="پیگیری پیام‌های ارسال‌شده از وب‌سایت" />
    <div className="healan-card" style={{ marginBottom: 16 }}><div className="healan-card__body" style={{ display: 'flex', gap: 8 }}>
      {([['unread','خوانده‌نشده'],['read','خوانده‌شده'],['all','همه']] as const).map(([v,l]) => <button key={v} className={`healan-btn ${filter === v ? 'healan-btn--primary' : 'healan-btn--outline'}`} onClick={() => setFilter(v)}>{l}</button>)}
    </div></div>
    <div className="healan-card"><div className="healan-card__body" style={{ padding: 0, overflowX: 'auto' }}>
      {items.length === 0 ? <div className="healan-empty">پیامی یافت نشد</div> : <table className="healan-table"><thead><tr><th>نام و نام خانوادگی</th><th>موبایل</th><th>پیام</th><th>تاریخ</th><th>وضعیت</th><th>عملیات</th></tr></thead><tbody>{items.map(x => <tr key={x.portalContactMessageId}>
        <td>{x.firstName} {x.lastName}</td><td dir="ltr"><a href={`tel:${x.mobile}`}>{x.mobile}</a></td><td style={{ minWidth: 260, whiteSpace: 'pre-wrap' }}>{x.message}</td><td>{x.createdAt ? convertDateAndTimeToJalali(x.createdAt) : '—'}</td><td>{x.isRead ? 'خوانده‌شده' : 'جدید'}</td><td><button className="healan-btn healan-btn--outline healan-btn--sm" onClick={() => void toggle(x)}>{x.isRead ? 'خوانده‌نشده' : 'خواندم'}</button>{' '}<button className="healan-btn healan-btn--action healan-btn--danger healan-btn--sm" onClick={() => void remove(x.portalContactMessageId)}>حذف</button></td>
      </tr>)}</tbody></table>}
    </div></div>
  </>;
}

export default withAlert(ContactMessagesPage);
