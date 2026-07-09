import { request } from '@tse/tools';
import { HEALAN_ACCESS_SYSTEM_ID, USER_MANAGER_API } from '../constants';

export interface AccessUserRoleItem {
  url: string;
  hasAccess: boolean;
  formTitle?: string;
  hasPersianAccess?: boolean;
}

export interface IdentityRoleItem {
  roleId: string;
  roleName?: string;
  roleTitle?: string;
}

export interface AccessRoleTreeItem {
  key: number;
  accessMenuId?: number;
  accessFormId?: number;
  title?: string;
  hasAccess?: boolean;
  hasPersianAccess?: boolean;
  children?: AccessRoleTreeItem[];
  accessForm?: { formTitle?: string; url?: string };
}

export interface AccessRoleResponse {
  roleId?: string;
  items?: AccessRoleTreeItem[];
}

export interface AccessMenuTreeItem {
  accessMenuId: number;
  accessFormId?: number;
  title?: string;
  children?: AccessMenuTreeItem[];
  accessForm?: { formTitle?: string; url?: string };
}

interface UserAccessRequest {
  IdentityId: string;
  AccessSystemId: number;
}

function normalizeTreeItem(raw: Record<string, unknown>): AccessRoleTreeItem {
  const key = Number(raw['key'] ?? raw['accessMenuId'] ?? 0);
  const childrenRaw = (raw['children'] ?? raw['Children']) as Record<string, unknown>[] | undefined;
  const accessForm = (raw['accessForm'] ?? raw['AccessForm']) as AccessRoleTreeItem['accessForm'];
  return {
    key,
    accessMenuId: key,
    accessFormId: raw['accessFormId'] as number | undefined,
    title: (raw['title'] ?? raw['Title'] ?? accessForm?.formTitle) as string | undefined,
    hasAccess: Boolean(raw['hasAccess'] ?? raw['HasAccess']),
    hasPersianAccess: raw['hasPersianAccess'] as boolean | undefined,
    accessForm,
    children: Array.isArray(childrenRaw) ? childrenRaw.map(normalizeTreeItem) : [],
  };
}

function normalizeMenuItem(raw: Record<string, unknown>): AccessMenuTreeItem {
  const accessMenuId = Number(raw['accessMenuId'] ?? raw['AccessMenuId'] ?? 0);
  const childrenRaw = (raw['children'] ?? raw['Children']) as Record<string, unknown>[] | undefined;
  const accessForm = (raw['accessForm'] ?? raw['AccessForm']) as AccessMenuTreeItem['accessForm'];
  return {
    accessMenuId,
    accessFormId: raw['accessFormId'] as number | undefined,
    title: accessForm?.formTitle,
    accessForm,
    children: Array.isArray(childrenRaw) ? childrenRaw.map(normalizeMenuItem) : [],
  };
}

export function fetchUserAccessRole(params: UserAccessRequest): Promise<AccessUserRoleItem[]> {
  return new Promise((resolve, reject) => {
    request
      .get({
        baseUrl: USER_MANAGER_API,
        url: 'UserAccess/UserAccessRole',
        options: params,
      })
      .then((res) => resolve((res ?? []) as AccessUserRoleItem[]))
      .catch(reject);
  });
}

export function fetchIdentityRoles(searchText = ''): Promise<IdentityRoleItem[]> {
  return request
    .get({
      baseUrl: USER_MANAGER_API,
      url: 'UserAccess/Role/1',
      options: {
        AccessSystemId: HEALAN_ACCESS_SYSTEM_ID,
        SearchText: searchText,
      },
    })
    .then((res) => {
      const list = (res ?? []) as Record<string, unknown>[];
      return list.map((item) => ({
        roleId: String(item['roleId'] ?? item['RoleId'] ?? ''),
        roleName: String(item['roleName'] ?? item['RoleName'] ?? ''),
        roleTitle: String(item['roleTitle'] ?? item['RoleTitle'] ?? item['roleName'] ?? item['RoleName'] ?? ''),
      }));
    });
}

export function fetchAccessRoleTree(roleId: string): Promise<AccessRoleTreeItem[]> {
  return request
    .get({
      baseUrl: USER_MANAGER_API,
      url: 'UserAccess/AccessRole/1',
      options: {
        RoleId: roleId,
        AccessSystemId: HEALAN_ACCESS_SYSTEM_ID,
      },
    })
    .then((res) => {
      const data = (res ?? {}) as Record<string, unknown>;
      const items = (data['items'] ?? data['Items'] ?? []) as Record<string, unknown>[];
      return Array.isArray(items) ? items.map(normalizeTreeItem) : [];
    });
}

export function saveAccessRole(roleId: string, items: AccessRoleTreeItem[]): Promise<AccessRoleResponse> {
  return request.post({
    baseUrl: USER_MANAGER_API,
    url: 'UserAccess/SaveAccessRole',
    options: {
      roleId,
      items,
    },
  }) as Promise<AccessRoleResponse>;
}

export function fetchAccessMenuTree(): Promise<AccessMenuTreeItem[]> {
  return request
    .get({
      baseUrl: USER_MANAGER_API,
      url: 'UserAccess/AccessMenu/1',
      options: {
        AccessSystemId: HEALAN_ACCESS_SYSTEM_ID,
      },
    })
    .then((res) => {
      const list = (res ?? []) as Record<string, unknown>[];
      return Array.isArray(list) ? list.map(normalizeMenuItem) : [];
    });
}

export function collectCheckedKeys(items: AccessRoleTreeItem[]): number[] {
  const keys: number[] = [];
  const walk = (nodes: AccessRoleTreeItem[]) => {
    nodes.forEach((item) => {
      const hasChildren = Boolean(item.children?.length);
      if (item.hasAccess && !hasChildren) {
        keys.push(item.key);
      }
      if (hasChildren) {
        walk(item.children!);
      }
    });
  };
  walk(items);
  return keys;
}

export function applyCheckedKeys(items: AccessRoleTreeItem[], checkedKeys: number[]): AccessRoleTreeItem[] {
  return items.map((item) => ({
    ...item,
    hasAccess: checkedKeys.includes(item.key),
    children: item.children?.length ? applyCheckedKeys(item.children, checkedKeys) : [],
  }));
}

export function hasPathAccess(accessRole: AccessUserRoleItem[], path: string): boolean {
  if (!accessRole?.length) {
    return true;
  }

  const normalized = path === '/' ? '/' : path.replace(/\/$/, '');

  if (normalized === '/basic-data') {
    return accessRole.some((item) => item.hasAccess && item.url?.startsWith('/basic-data'));
  }

  if (normalized === '/site-content') {
    return accessRole.some((item) => item.hasAccess && item.url?.startsWith('/site-content'));
  }

  const exact = accessRole.find((item) => item.url === normalized);
  if (exact) {
    return exact.hasAccess;
  }

  return accessRole.some(
    (item) => item.hasAccess && normalized.startsWith(`${item.url}/`)
  );
}
