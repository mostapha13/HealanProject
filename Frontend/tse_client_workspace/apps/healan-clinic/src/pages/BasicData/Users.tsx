import React, { useEffect, useState } from 'react';

import withAlert from '../../hoc/withAlert';

import healanApi from '../../api/healanApi';

import type { UserSummary } from '../../api/types';

import { PageHeader } from '../../components/Ui';

import { buildUserPayload } from '../../utils/apiPayload';
import { SearchableSelect } from '../../components/SearchableSelect';
import { MultiSearchableSelect } from '../../components/MultiSearchableSelect';
import { HEALAN_LIST_PAGE_SIZE, ListPagination, useListPagination } from '../../components/ListPagination';
import { useAsyncSubmit } from '../../hooks/useAsyncSubmit';
import {
  fetchAccessRoleTree,
  fetchDirectUserGrants,
  fetchManagedRoles,
  saveDirectUserGrants,
  type AccessRoleTreeItem,
  type ManagedIdentityRole,
} from '../../api/userAccessApi';
import { startImpersonation } from '../../api/impersonationApi';

function flattenMenus(items: AccessRoleTreeItem[], depth = 0): { value: number; label: string }[] {
  return items.flatMap((item) => [
    ...(item.accessMenuId && item.accessFormId
      ? [{ value: item.accessMenuId, label: `${'— '.repeat(depth)}${item.title ?? `دسترسی ${item.accessMenuId}`}` }]
      : []),
    ...flattenMenus(item.children ?? [], depth + 1),
  ]);
}

const USER_TYPE_OPTIONS = [
  { value: 2, label: 'مدیر' },
  { value: 3, label: 'منشی' },
  { value: 7, label: 'پزشک' },
  { value: 8, label: 'حسابدار' },
];

const EMPTY_FORM: {
  userId: number;
  identityUserId?: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  userTypeId: number;
  roleNames: string[];
  isActive: boolean;
  twoFactorEnabled: boolean;
} = {
  userId: 0,
  identityUserId: undefined,
  firstName: '',
  lastName: '',
  phoneNumber: '',
  userTypeId: 3,
  roleNames: ['Secretary', 'Healan'],
  isActive: true,
  twoFactorEnabled: true,
};

function UsersPage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const [items, setItems] = useState<UserSummary[]>([]);
  const { page, pageSize, onPaginationChange } = useListPagination(HEALAN_LIST_PAGE_SIZE);
  const { submitting, guard } = useAsyncSubmit();
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [roles, setRoles] = useState<ManagedIdentityRole[]>([]);
  const [grantUser, setGrantUser] = useState<UserSummary | null>(null);
  const [grantMenuIds, setGrantMenuIds] = useState<number[]>([]);
  const [grantMenuOptions, setGrantMenuOptions] = useState<{ value: number; label: string }[]>([]);
  const [loadingGrants, setLoadingGrants] = useState(false);
  const [savingGrants, setSavingGrants] = useState(false);
  const [impersonatingUserId, setImpersonatingUserId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await healanApi.users.list({ pageNumber: page, pageSize });
      setItems(res.items ?? []);
      setTotalCount(res.totalCount ?? 0);
    } catch (err) {
      onAlert(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [page, pageSize]);

  useEffect(() => {
    void fetchManagedRoles()
      .then((result) => setRoles(result.filter((role) => !role.isDeleted)))
      .catch((err) => onAlert(err));
  }, []);

  const handleSave = () => {
    void guard(async () => {
      if (!form.firstName.trim() || !form.lastName.trim() || !form.phoneNumber.trim()) {
        onAlert({ type: 'error', message: 'نام، نام خانوادگی و موبایل الزامی است' });
        return;
      }
      const selectedRoles = roles
        .filter((role) => form.roleNames.includes(role.name))
        .map((role) => ({ name: role.name, displayName: role.displayName }));
      if (selectedRoles.length === 0) {
        onAlert({ type: 'error', message: 'حداقل یک نقش برای کاربر انتخاب کنید' });
        return;
      }
      await healanApi.users.register(buildUserPayload({ ...form, userRoles: selectedRoles }));
      setShowForm(false);
      await load();
    }).catch((err) => onAlert(err));
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (user: UserSummary) => {
    setForm({
      userId: user.userId,
      identityUserId: user.identityUserId,
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      phoneNumber: user.phoneNumber ?? '',
      userTypeId: user.userTypeId ?? 3,
      roleNames: (user.userRoles ?? [])
        .map((role) => role.name)
        .concat((user.roles ?? []).map((role) => role.roleName ?? ''))
        .filter((name, index, all) => Boolean(name) && all.indexOf(name) === index),
      isActive: user.isActive ?? true,
      twoFactorEnabled: Boolean(user.twoFactorEnabled),
    });
    setShowForm(true);
  };

  const handleToggleActive = async (user: UserSummary) => {
    try {
      await healanApi.users.register(
        buildUserPayload({
          userId: user.userId,
          identityUserId: user.identityUserId,
          firstName: user.firstName ?? '',
          lastName: user.lastName ?? '',
          phoneNumber: user.phoneNumber ?? '',
          userTypeId: user.userTypeId ?? 3,
          userRoles: (user.userRoles ?? []).length
            ? user.userRoles
            : (user.roles ?? [])
                .filter((role) => role.roleName)
                .map((role) => ({
                  name: role.roleName as string,
                  displayName: role.roleTitle ?? (role.roleName as string),
                })),
          isActive: !(user.isActive ?? true),
          twoFactorEnabled: Boolean(user.twoFactorEnabled),
        })
      );
      await load();
    } catch (err) {
      onAlert(err);
    }
  };

  const openDirectGrants = async (user: UserSummary) => {
    if (!user.identityUserId) {
      onAlert({ type: 'error', message: 'شناسه Identity این کاربر ثبت نشده است' });
      return;
    }
    setGrantUser(user);
    setLoadingGrants(true);
    try {
      const activeRole = roles.find((role) => !role.isDeleted);
      const [selected, tree] = await Promise.all([
        fetchDirectUserGrants(user.identityUserId),
        activeRole ? fetchAccessRoleTree(activeRole.id) : Promise.resolve([]),
      ]);
      setGrantMenuIds(selected);
      setGrantMenuOptions(flattenMenus(tree));
    } catch (err) {
      onAlert(err);
      setGrantUser(null);
    } finally {
      setLoadingGrants(false);
    }
  };

  const handleSaveGrants = async () => {
    if (!grantUser?.identityUserId) return;
    setSavingGrants(true);
    try {
      await saveDirectUserGrants(grantUser.identityUserId, grantMenuIds);
      setGrantUser(null);
      onAlert({ type: 'success', message: 'دسترسی‌های اختصاصی کاربر ذخیره شد' });
    } catch (err) {
      onAlert(err);
    } finally {
      setSavingGrants(false);
    }
  };

  const handleImpersonate = async (user: UserSummary) => {
    if (!user.identityUserId) {
      onAlert({ type: 'error', message: 'شناسه Identity این کاربر ثبت نشده است' });
      return;
    }
    if (!window.confirm(`سامانه دقیقاً با دسترسی «${user.firstName} ${user.lastName}» باز شود؟`)) return;
    setImpersonatingUserId(user.userId);
    try {
      await startImpersonation(user.identityUserId);
      window.location.assign('/');
    } catch (err) {
      onAlert(err);
      setImpersonatingUserId(null);
    }
  };

  return (
    <>
      <PageHeader
        title="کاربران"
        subtitle="مدیریت کاربران و نقش‌ها"
        action={
          <button type="button" className="healan-btn healan-btn--primary" onClick={openCreate}>
            + کاربر جدید
          </button>
        }
      />

      {showForm && (
        <div className="healan-card" style={{ marginBottom: '1.5rem' }}>
          <div className="healan-card__body">
            <div className="healan-form-grid">
              <div className="healan-form-field">
                <label>نام</label>
                <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div className="healan-form-field">
                <label>نام خانوادگی</label>
                <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </div>
              <div className="healan-form-field">
                <label>موبایل</label>
                <input value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
              </div>
              <div className="healan-form-field">
                <label>نوع پرونده کاربر</label>
                <SearchableSelect
                  value={form.userTypeId}
                  onChange={(v) => setForm({ ...form, userTypeId: v ?? 2 })}
                  allowClear={false}
                  placeholder="نوع کاربر"
                  options={USER_TYPE_OPTIONS}
                />
              </div>
              <div className="healan-form-field">
                <label>نقش‌ها</label>
                <MultiSearchableSelect
                  value={form.roleNames}
                  onChange={(roleNames) => setForm({ ...form, roleNames })}
                  placeholder="یک یا چند نقش انتخاب کنید"
                  options={roles.map((role) => ({
                    value: role.name,
                    label: role.displayName || role.name,
                  }))}
                />
              </div>
              <div className="healan-form-field">
                <label>وضعیت</label>
                <SearchableSelect
                  value={form.isActive ? 1 : 0}
                  onChange={(v) => setForm({ ...form, isActive: (v ?? 1) === 1 })}
                  allowClear={false}
                  placeholder="وضعیت"
                  options={[
                    { value: 1, label: 'فعال' },
                    { value: 0, label: 'غیرفعال' },
                  ]}
                />
              </div>
              <div className="healan-form-field">
                <label>ورود دو مرحله‌ای (پیامک)</label>
                <SearchableSelect
                  value={form.twoFactorEnabled ? 1 : 0}
                  onChange={(v) => setForm({ ...form, twoFactorEnabled: (v ?? 1) === 1 })}
                  allowClear={false}
                  placeholder="دو مرحله‌ای"
                  options={[
                    { value: 1, label: 'فعال — کد پیامکی لازم است' },
                    { value: 0, label: 'غیرفعال — فقط رمز عبور' },
                  ]}
                />
              </div>
            </div>

            <div className="healan-actions" style={{ marginTop: '1rem' }}>
              <button type="button" className="healan-btn healan-btn--primary" disabled={submitting} onClick={handleSave}>
                {submitting ? 'در حال ذخیره...' : 'ذخیره'}
              </button>
              <button type="button" className="healan-btn healan-btn--outline" onClick={() => setShowForm(false)}>
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {grantUser && (
        <div className="healan-card" style={{ marginBottom: '1.5rem' }}>
          <div className="healan-card__header">
            <h3>
              دسترسی اختصاصی {grantUser.firstName} {grantUser.lastName}
            </h3>
          </div>
          <div className="healan-card__body">
            <p className="healan-hint">
              این دسترسی‌ها علاوه بر مجموع دسترسی نقش‌های کاربر اعمال می‌شوند.
            </p>
            {loadingGrants ? (
              <div className="healan-empty">در حال بارگذاری دسترسی‌ها...</div>
            ) : (
              <div className="healan-form-field">
                <label>دسترسی‌های اضافه</label>
                <MultiSearchableSelect
                  value={grantMenuIds}
                  onChange={setGrantMenuIds}
                  options={grantMenuOptions}
                  placeholder="دسترسی‌های اضافه را انتخاب کنید"
                />
              </div>
            )}
            <div className="healan-actions" style={{ marginTop: '1rem' }}>
              <button
                type="button"
                className="healan-btn healan-btn--primary"
                disabled={loadingGrants || savingGrants}
                onClick={() => void handleSaveGrants()}
              >
                {savingGrants ? 'در حال ذخیره...' : 'ذخیره دسترسی‌ها'}
              </button>
              <button
                type="button"
                className="healan-btn healan-btn--muted"
                onClick={() => setGrantUser(null)}
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="healan-card">
        <div className="healan-card__body" style={{ padding: 0 }}>
          {loading ? (
            <div className="healan-empty">در حال بارگذاری...</div>
          ) : (
            <table className="healan-table">
              <thead>
                <tr>
                  <th>نام</th>
                  <th>موبایل</th>
                  <th>نقش Identity</th>
                  <th>وضعیت</th>
                  <th>دو مرحله‌ای</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {items.map((u) => (
                  <tr key={u.userId}>
                    <td>
                      {u.firstName} {u.lastName}
                    </td>
                    <td>{u.phoneNumber ?? '—'}</td>
                    <td>
                      {u.userRoles && u.userRoles.length > 0
                        ? u.userRoles
                            .filter((r) => r.name && r.name !== 'Healan')
                            .map((r) => r.displayName || r.name)
                            .join('، ') || u.userRoles.map((r) => r.displayName || r.name).join('، ')
                        : u.userTypeName ?? '—'}
                    </td>
                    <td>{u.isActive ? 'فعال' : 'غیرفعال'}</td>
                    <td>{u.twoFactorEnabled ? 'فعال' : 'غیرفعال'}</td>
                    <td>
                      <div className="healan-actions">
                        <button type="button" className="healan-btn healan-btn--outline healan-btn--sm" onClick={() => openEdit(u)}>
                          ویرایش
                        </button>
                        <button
                          type="button"
                          className="healan-btn healan-btn--outline healan-btn--sm"
                          onClick={() => void handleToggleActive(u)}
                        >
                          {u.isActive ? 'غیرفعال' : 'فعال'}
                        </button>
                        <button
                          type="button"
                          className="healan-btn healan-btn--action healan-btn--sm"
                          onClick={() => void openDirectGrants(u)}
                        >
                          دسترسی اضافه
                        </button>
                        <button
                          type="button"
                          className="healan-btn healan-btn--primary healan-btn--sm"
                          disabled={!u.isActive || impersonatingUserId === u.userId}
                          onClick={() => void handleImpersonate(u)}
                        >
                          {impersonatingUserId === u.userId ? 'در حال ورود...' : 'تغییر وضعیت'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <ListPagination page={page} pageSize={pageSize} totalCount={totalCount} onChange={onPaginationChange} />
      </div>
    </>
  );
}

export default withAlert(UsersPage);
