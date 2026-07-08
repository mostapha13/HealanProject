import React, { useEffect, useState } from 'react';
import withAlert from '../../hoc/withAlert';
import {
  applyCheckedKeys,
  collectCheckedKeys,
  fetchAccessRoleTree,
  fetchIdentityRoles,
  saveAccessRole,
  type AccessRoleTreeItem,
  type IdentityRoleItem,
} from '../../api/userAccessApi';
import { PageHeader } from '../../components/Ui';
import { SearchableSelect } from '../../components/SearchableSelect';
import { AccessTree } from '../../components/AccessTree';

function AccessRolesPage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const [roles, setRoles] = useState<IdentityRoleItem[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [treeItems, setTreeItems] = useState<AccessRoleTreeItem[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<number[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loadingTree, setLoadingTree] = useState(false);
  const [saving, setSaving] = useState(false);

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
      setTreeItems(items);
      setCheckedKeys(collectCheckedKeys(items));
    } catch (err) {
      onAlert(err);
      setTreeItems([]);
      setCheckedKeys([]);
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
    }
  }, [selectedRoleId]);

  const handleSave = async () => {
    if (!selectedRoleId) {
      onAlert({ type: 'error', message: 'ابتدا نقش را انتخاب کنید' });
      return;
    }
    setSaving(true);
    try {
      const payload = applyCheckedKeys(treeItems, checkedKeys);
      await saveAccessRole(selectedRoleId, payload);
      onAlert({ type: 'success', message: 'سطح دسترسی با موفقیت ذخیره شد' });
      await loadTree(selectedRoleId);
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
        subtitle="تعیین منوها و بخش‌های قابل دسترس برای هر نقش در سامانه Healan"
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
          </div>
          {selectedRole && (
            <p className="healan-hint" style={{ marginTop: '0.75rem' }}>
              نقش انتخاب‌شده: <strong>{selectedRole.roleTitle || selectedRole.roleName}</strong>
            </p>
          )}
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
              <AccessTree items={treeItems} checkedKeys={checkedKeys} onCheckedKeysChange={setCheckedKeys} />
            )}
            <div className="healan-actions" style={{ marginTop: '1.5rem' }}>
              <button
                type="button"
                className="healan-btn healan-btn--primary"
                disabled={saving || loadingTree || !treeItems.length}
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
