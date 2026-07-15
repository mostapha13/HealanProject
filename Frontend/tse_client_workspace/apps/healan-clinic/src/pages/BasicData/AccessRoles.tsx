import React, { useEffect, useMemo, useState } from 'react';
import withAlert from '../../hoc/withAlert';
import {
  applyCheckedKeys,
  collectCheckedKeys,
  collectFormMenuKeys,
  fetchAccessRoleTree,
  fetchIdentityRoles,
  saveAccessRole,
  type AccessRoleTreeItem,
  type IdentityRoleItem,
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

function AccessRolesPage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const { reload: reloadUserAccess } = useUserAccess();
  const [roles, setRoles] = useState<IdentityRoleItem[]>([]);
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

  const loadRoles = async (searchText = '') => {
    setLoadingRoles(true);
    try {
      const list = await fetchIdentityRoles(searchText);
      setRoles(list);
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
  }, []);

  useEffect(() => {
    if (selectedRoleId) {
      void loadTree(selectedRoleId);
    } else {
      setTreeItems([]);
      setCheckedKeys([]);
      setSavedCheckedKeys([]);
      setSourceRoleId(null);
    }
  }, [selectedRoleId]);

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
      const sourceTree = await fetchAccessRoleTree(sourceRoleId);
      setCheckedKeys(collectCheckedKeys(sourceTree));
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
      const payload = applyCheckedKeys(treeItems, checkedKeys);
      await saveAccessRole(selectedRoleId, payload);
      await loadTree(selectedRoleId);
      await reloadUserAccess();
      onAlert({ type: 'success', message: 'سطح دسترسی با موفقیت ذخیره شد' });
    } catch (err) {
      onAlert(err);
    } finally {
      setSaving(false);
    }
  };

  const selectedRole = roles.find((r) => r.roleId === selectedRoleId);

  return (
    <>
      <PageHeader
        title="سطح دسترسی نقش‌ها"
        subtitle="مدیریت کامل دسترسی نقش‌ها در تمام بخش‌های سامانه، بدون نیاز به تغییر مستقیم دیتابیس"
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
                options={roles.map((role) => ({
                  value: role.roleId,
                  label: role.roleTitle || role.roleName || role.roleId,
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
                  .filter((role) => role.roleId !== selectedRoleId)
                  .map((role) => ({
                    value: role.roleId,
                    label: role.roleTitle || role.roleName || role.roleId,
                  }))}
                disabled={!selectedRoleId || loadingRoles}
              />
            </div>
          </div>
          {selectedRole && (
            <p className="healan-hint" style={{ marginTop: '0.75rem' }}>
              نقش انتخاب‌شده: <strong>{selectedRole.roleTitle || selectedRole.roleName}</strong>
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
