import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from '@tse/utils';
import withAlert from '../../hoc/withAlert';
import {
  applyCheckedKeys,
  collectCheckedKeys,
  collectFormMenuKeys,
  createManagedRole,
  deleteManagedRole,
  fetchAccessRoleTree,
  fetchManagedRoles,
  restoreManagedRole,
  saveAccessRole,
  updateManagedRole,
  type AccessRoleTreeItem,
  type ManagedIdentityRole,
} from '../../api/userAccessApi';
import { PageHeader } from '../../components/Ui';
import { SearchableSelect } from '../../components/SearchableSelect';
import { AccessTree } from '../../components/AccessTree';
import { useUserAccess } from '../../context/UserAccessContext';

function normalizeText(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function titleOf(item: AccessRoleTreeItem): string {
  return item.title || item.accessForm?.formTitle || item.accessForm?.url || `منو ${item.key}`;
}

/** Only form menus (not structural folders) for select-all / counters. */
function collectNodeKeys(items: AccessRoleTreeItem[]): number[] {
  return collectFormMenuKeys(items);
}

function filterTree(items: AccessRoleTreeItem[], searchText: string): AccessRoleTreeItem[] {
  const q = normalizeText(searchText);
  if (!q) return items;

  const walk = (nodes: AccessRoleTreeItem[]): AccessRoleTreeItem[] =>
    nodes.reduce<AccessRoleTreeItem[]>((acc, node) => {
      const children = node.children?.length ? walk(node.children) : [];
      const selfMatched = normalizeText(titleOf(node)).includes(q);
      if (!selfMatched && children.length === 0) {
        return acc;
      }
      acc.push({ ...node, children });
      return acc;
    }, []);

  return walk(items);
}

function hasSelectionChanged(current: number[], baseline: number[]): boolean {
  if (current.length !== baseline.length) return true;
  const set = new Set(current);
  return baseline.some((k) => !set.has(k));
}

/** تعریف نقش (/basic-data/roles) vs سطح دسترسی نقش‌ها (/basic-data/access-roles). */
function isRoleDefinePath(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, '');
  return p.endsWith('/roles') || p.endsWith('/access-admin');
}

function AccessRolesPage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const location = useLocation();
  const roleDefineMode = isRoleDefinePath(location.pathname);
  const { reload: reloadUserAccess } = useUserAccess();
  const [roles, setRoles] = useState<ManagedIdentityRole[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [treeItems, setTreeItems] = useState<AccessRoleTreeItem[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<number[]>([]);
  const [savedCheckedKeys, setSavedCheckedKeys] = useState<number[]>([]);
  const [treeSearchText, setTreeSearchText] = useState('');
  const [sourceRoleId, setSourceRoleId] = useState<string | null>(null);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loadingTree, setLoadingTree] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copying, setCopying] = useState(false);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDisplayName, setRoleDisplayName] = useState('');
  const [savingRole, setSavingRole] = useState(false);

  const loadRoles = async (searchText = '') => {
    setLoadingRoles(true);
    try {
      const list = await fetchManagedRoles(roleDefineMode ? includeDeleted : false);
      const query = searchText.trim().toLowerCase();
      setRoles(
        query
          ? list.filter(
              (role) =>
                role.name.toLowerCase().includes(query) ||
                role.displayName.toLowerCase().includes(query)
            )
          : list
      );
    } catch (err) {
      onAlert(err);
    } finally {
      setLoadingRoles(false);
    }
  };

  const loadTree = async (roleId: string) => {
    setLoadingTree(true);
    try {
      const items = await fetchAccessRoleTree(roleId);
      const selected = collectCheckedKeys(items);
      setTreeItems(items);
      setCheckedKeys(selected);
      setSavedCheckedKeys(selected);
    } catch (err) {
      onAlert(err);
      setTreeItems([]);
      setCheckedKeys([]);
      setSavedCheckedKeys([]);
    } finally {
      setLoadingTree(false);
    }
  };

  useEffect(() => {
    void loadRoles();
  }, [includeDeleted, roleDefineMode]);

  useEffect(() => {
    if (roleDefineMode) return;
    if (selectedRoleId) {
      void loadTree(selectedRoleId);
    } else {
      setTreeItems([]);
      setCheckedKeys([]);
      setSavedCheckedKeys([]);
      setSourceRoleId(null);
    }
  }, [selectedRoleId, roleDefineMode]);

  const filteredTreeItems = useMemo(
    () => filterTree(treeItems, treeSearchText),
    [treeItems, treeSearchText]
  );
  const visibleKeys = useMemo(() => collectNodeKeys(filteredTreeItems), [filteredTreeItems]);
  const checkedCount = checkedKeys.length;
  const totalCount = useMemo(() => collectNodeKeys(treeItems).length, [treeItems]);
  const isDirty = hasSelectionChanged(checkedKeys, savedCheckedKeys);

  const handleGrantVisible = () => {
    const next = new Set(checkedKeys);
    visibleKeys.forEach((k) => next.add(k));
    setCheckedKeys(Array.from(next));
  };

  const handleRevokeVisible = () => {
    if (!visibleKeys.length) return;
    const hidden = new Set(visibleKeys);
    setCheckedKeys(checkedKeys.filter((k) => !hidden.has(k)));
  };

  const handleResetChanges = () => {
    setCheckedKeys(savedCheckedKeys);
  };

  const handleCopyFromRole = async () => {
    if (!selectedRoleId) {
      onAlert({ type: 'error', message: 'ابتدا نقش مقصد را انتخاب کنید' });
      return;
    }
    if (!sourceRoleId) {
      onAlert({ type: 'error', message: 'نقش مبدا را برای کپی انتخاب کنید' });
      return;
    }
    if (sourceRoleId === selectedRoleId) {
      onAlert({ type: 'error', message: 'نقش مبدا و مقصد نمی‌توانند یکسان باشند' });
      return;
    }
    setCopying(true);
    try {
      const items = await fetchAccessRoleTree(sourceRoleId);
      setCheckedKeys(collectCheckedKeys(items));
      onAlert({ type: 'success', message: 'دسترسی‌ها از نقش مبدا بارگذاری شد؛ برای اعمال نهایی ذخیره کنید' });
    } catch (err) {
      onAlert(err);
    } finally {
      setCopying(false);
    }
  };

  const handleSave = async () => {
    if (!selectedRoleId) {
      onAlert({ type: 'error', message: 'ابتدا نقش را انتخاب کنید' });
      return;
    }
    setSaving(true);
    try {
      const nextTree = applyCheckedKeys(treeItems, checkedKeys);
      await saveAccessRole(selectedRoleId, nextTree);
      setSavedCheckedKeys(checkedKeys);
      await reloadUserAccess();
      onAlert({ type: 'success', message: 'دسترسی‌های نقش ذخیره شد' });
    } catch (err) {
      onAlert(err);
    } finally {
      setSaving(false);
    }
  };

  const openCreateRole = () => {
    setEditingRoleId(null);
    setRoleName('');
    setRoleDisplayName('');
    setShowRoleForm(true);
  };

  const openEditRole = (role: ManagedIdentityRole) => {
    setEditingRoleId(role.id);
    setRoleName(role.name);
    setRoleDisplayName(role.displayName);
    setShowRoleForm(true);
  };

  const handleSaveRole = async () => {
    if (!roleName.trim() || !roleDisplayName.trim()) {
      onAlert({ type: 'error', message: 'نام فنی و عنوان فارسی نقش الزامی است' });
      return;
    }
    setSavingRole(true);
    try {
      if (editingRoleId) {
        await updateManagedRole(editingRoleId, { name: roleName.trim(), displayName: roleDisplayName.trim() });
      } else {
        await createManagedRole({ name: roleName.trim(), displayName: roleDisplayName.trim() });
      }
      setShowRoleForm(false);
      await loadRoles();
      onAlert({ type: 'success', message: 'نقش با موفقیت ذخیره شد' });
    } catch (err) {
      onAlert(err);
    } finally {
      setSavingRole(false);
    }
  };

  const handleDeleteRole = async (role: ManagedIdentityRole) => {
    if (!window.confirm(`نقش «${role.displayName}» حذف شود؟`)) return;
    try {
      await deleteManagedRole(role.id);
      if (selectedRoleId === role.id) setSelectedRoleId(null);
      await loadRoles();
      onAlert({ type: 'success', message: 'نقش به‌صورت نرم حذف شد' });
    } catch (err) {
      onAlert(err);
    }
  };

  const handleRestoreRole = async (role: ManagedIdentityRole) => {
    try {
      await restoreManagedRole(role.id);
      await loadRoles();
      onAlert({ type: 'success', message: 'نقش بازیابی شد' });
    } catch (err) {
      onAlert(err);
    }
  };

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  if (roleDefineMode) {
    return (
      <>
        <PageHeader
          title="تعریف نقش"
          subtitle="ایجاد، ویرایش، حذف و بازیابی نقش‌های سامانه"
          action={
            <button type="button" className="healan-btn healan-btn--primary" onClick={openCreateRole}>
              + نقش جدید
            </button>
          }
        />

        {showRoleForm && (
          <div className="healan-card" style={{ marginBottom: '1rem' }}>
            <div className="healan-card__header">
              <h3>{editingRoleId ? 'ویرایش نقش' : 'افزودن نقش'}</h3>
            </div>
            <div className="healan-card__body">
              <div className="healan-form-grid">
                <div className="healan-form-field">
                  <label>نام فنی نقش (انگلیسی)</label>
                  <input
                    className="healan-input"
                    dir="ltr"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="ExampleRole"
                  />
                </div>
                <div className="healan-form-field">
                  <label>عنوان فارسی</label>
                  <input
                    className="healan-input"
                    value={roleDisplayName}
                    onChange={(e) => setRoleDisplayName(e.target.value)}
                  />
                </div>
              </div>
              <div className="healan-actions" style={{ marginTop: '1rem' }}>
                <button
                  type="button"
                  className="healan-btn healan-btn--primary"
                  disabled={savingRole}
                  onClick={() => void handleSaveRole()}
                >
                  {savingRole ? 'در حال ذخیره...' : 'ذخیره نقش'}
                </button>
                <button
                  type="button"
                  className="healan-btn healan-btn--muted"
                  onClick={() => setShowRoleForm(false)}
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="healan-card" style={{ marginBottom: '1rem' }}>
          <div className="healan-card__header">
            <h3>نقش‌های سامانه</h3>
            <label>
              <input
                type="checkbox"
                checked={includeDeleted}
                onChange={(e) => setIncludeDeleted(e.target.checked)}
              />{' '}
              نمایش حذف‌شده‌ها
            </label>
          </div>
          <div className="healan-card__body" style={{ padding: 0 }}>
            {loadingRoles ? (
              <div className="healan-empty">در حال بارگذاری نقش‌ها...</div>
            ) : roles.length === 0 ? (
              <div className="healan-empty">نقشی تعریف نشده است</div>
            ) : (
              <table className="healan-table">
                <thead>
                  <tr>
                    <th>عنوان</th>
                    <th>نام فنی</th>
                    <th>تعداد کاربران</th>
                    <th>وضعیت</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => (
                    <tr key={role.id}>
                      <td>{role.displayName}</td>
                      <td dir="ltr">{role.name}</td>
                      <td>{role.userCount}</td>
                      <td>{role.isDeleted ? 'حذف‌شده' : role.isSystem ? 'سیستمی' : 'فعال'}</td>
                      <td>
                        <div className="healan-actions">
                          {!role.isDeleted && (
                            <button
                              type="button"
                              className="healan-btn healan-btn--sm healan-btn--action healan-btn--edit"
                              onClick={() => openEditRole(role)}
                            >
                              ویرایش
                            </button>
                          )}
                          {role.isDeleted ? (
                            <button
                              type="button"
                              className="healan-btn healan-btn--sm healan-btn--outline"
                              onClick={() => void handleRestoreRole(role)}
                            >
                              بازیابی
                            </button>
                          ) : (
                            !role.isSystem && (
                              <button
                                type="button"
                                className="healan-btn healan-btn--sm healan-btn--action healan-btn--danger"
                                onClick={() => void handleDeleteRole(role)}
                              >
                                حذف
                              </button>
                            )
                          )}
                        </div>
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

  return (
    <>
      <PageHeader
        title="سطح دسترسی نقش‌ها"
        subtitle="اختصاص منوها و صفحات به هر نقش — پس از تعریف نقش در بخش «تعریف نقش»"
      />

      <div className="healan-card" style={{ marginBottom: '1rem' }}>
        <div className="healan-card__body">
          <div className="healan-form-grid">
            <div className="healan-form-field">
              <label>انتخاب نقش</label>
              <SearchableSelect
                value={selectedRoleId}
                onChange={(v) => setSelectedRoleId(v ? String(v) : null)}
                placeholder={loadingRoles ? 'در حال بارگذاری...' : 'نقش را انتخاب کنید'}
                options={roles
                  .filter((role) => !role.isDeleted)
                  .map((role) => ({
                    value: role.id,
                    label: role.displayName || role.name || role.id,
                  }))}
              />
            </div>
            <div className="healan-form-field">
              <label>کپی دسترسی از نقش دیگر</label>
              <SearchableSelect
                value={sourceRoleId}
                onChange={(v) => setSourceRoleId(v ? String(v) : null)}
                placeholder="نقش مبدا"
                options={roles
                  .filter((role) => !role.isDeleted && role.id !== selectedRoleId)
                  .map((role) => ({
                    value: role.id,
                    label: role.displayName || role.name || role.id,
                  }))}
                disabled={!selectedRoleId || loadingRoles}
              />
            </div>
          </div>
          {selectedRole && (
            <p className="healan-hint" style={{ marginTop: '0.75rem' }}>
              نقش انتخاب‌شده: <strong>{selectedRole.displayName || selectedRole.name}</strong>
            </p>
          )}
          <div className="healan-actions" style={{ marginTop: '0.75rem' }}>
            <button
              type="button"
              className="healan-btn healan-btn--outline"
              onClick={() => void handleCopyFromRole()}
              disabled={!selectedRoleId || !sourceRoleId || copying || loadingTree}
            >
              {copying ? 'در حال کپی...' : 'کپی دسترسی از نقش مبدا'}
            </button>
          </div>
        </div>
      </div>

      {selectedRoleId && (
        <div className="healan-card">
          <div className="healan-card__header">
            <h3>لیست دسترسی‌ها</h3>
          </div>
          <div className="healan-card__body">
            {loadingTree ? (
              <div className="healan-empty">در حال بارگذاری دسترسی‌ها...</div>
            ) : treeItems.length === 0 ? (
              <div className="healan-empty">دسترسی‌ای برای این نقش تعریف نشده</div>
            ) : (
              <>
                <div className="healan-form-grid" style={{ marginBottom: '0.75rem' }}>
                  <div className="healan-form-field">
                    <label>جستجو در دسترسی‌ها</label>
                    <input
                      className="healan-input"
                      value={treeSearchText}
                      onChange={(e) => setTreeSearchText(e.target.value)}
                      placeholder="مثال: گزارش، پذیرش، بیماران..."
                    />
                  </div>
                </div>

                <p className="healan-hint" style={{ marginBottom: '0.75rem' }}>
                  انتخاب‌شده: <strong>{checkedCount}</strong> از <strong>{totalCount}</strong> فرم/صفحه
                  {isDirty ? ' (تغییرات ذخیره نشده)' : ''}
                </p>

                <div className="healan-actions" style={{ marginBottom: '1rem' }}>
                  <button type="button" className="healan-btn healan-btn--outline" onClick={handleGrantVisible}>
                    انتخاب همه موارد قابل مشاهده
                  </button>
                  <button type="button" className="healan-btn healan-btn--outline" onClick={handleRevokeVisible}>
                    حذف دسترسی موارد قابل مشاهده
                  </button>
                  <button
                    type="button"
                    className="healan-btn healan-btn--outline"
                    onClick={handleResetChanges}
                    disabled={!isDirty}
                  >
                    بازگردانی به آخرین ذخیره
                  </button>
                </div>

                <AccessTree items={filteredTreeItems} checkedKeys={checkedKeys} onCheckedKeysChange={setCheckedKeys} />
              </>
            )}
            <div className="healan-actions" style={{ marginTop: '1.5rem' }}>
              <button
                type="button"
                className="healan-btn healan-btn--primary"
                disabled={saving || loadingTree || !treeItems.length || !isDirty}
                onClick={() => void handleSave()}
              >
                {saving ? 'در حال ذخیره...' : 'ذخیره دسترسی‌ها'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default withAlert(AccessRolesPage);
