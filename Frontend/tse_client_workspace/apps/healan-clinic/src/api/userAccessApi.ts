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

const FOLDER_TITLES: Record<number, string> = {
  5102: 'مدیریت کلینیک',
  5108: 'اطلاعات پایه',
  5113: 'مدیریت کاربران',
  5120: 'محتوای سایت',
};

function normalizeTreeItem(raw: Record<string, unknown>): AccessRoleTreeItem {
  const key = Number(raw['key'] ?? raw['accessMenuId'] ?? raw['AccessMenuId'] ?? 0);
  const childrenRaw = (raw['children'] ?? raw['Children']) as Record<string, unknown>[] | undefined;
  const accessForm = (raw['accessForm'] ?? raw['AccessForm']) as AccessRoleTreeItem['accessForm'];
  const accessFormId = (raw['accessFormId'] ?? raw['AccessFormId']) as number | undefined;
  return {
    key,
    accessMenuId: key,
    accessFormId,
    title:
      ((raw['title'] ?? raw['Title'] ?? accessForm?.formTitle) as string | undefined) ||
      FOLDER_TITLES[key],
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
    accessFormId: (raw['accessFormId'] ?? raw['AccessFormId']) as number | undefined,
    title:
      (raw['title'] as string | undefined) ||
      accessForm?.formTitle ||
      FOLDER_TITLES[accessMenuId],
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

export interface SaveAccessFormPayload {
  accessFormId?: number;
  accessMenuId?: number;
  formTitle: string;
  url?: string;
  parentMenuId?: number | null;
  order?: number;
  isFolder?: boolean;
  accessSystemId?: number;
}

export function saveAccessForm(payload: SaveAccessFormPayload): Promise<{
  accessFormId: number;
  accessMenuId: number;
  formTitle: string;
  url: string;
}> {
  return request.post({
    baseUrl: USER_MANAGER_API,
    url: 'UserAccess/SaveAccessForm',
    options: {
      accessFormId: payload.accessFormId ?? 0,
      accessMenuId: payload.accessMenuId ?? 0,
      formTitle: payload.formTitle,
      url: payload.url ?? '',
      parentMenuId: payload.parentMenuId ?? null,
      order: payload.order ?? 0,
      isFolder: Boolean(payload.isFolder),
      accessSystemId: payload.accessSystemId ?? HEALAN_ACCESS_SYSTEM_ID,
    },
  }) as Promise<{
    accessFormId: number;
    accessMenuId: number;
    formTitle: string;
    url: string;
  }>;
}

export function deleteAccessForm(accessMenuId: number): Promise<boolean> {
  return request.post({
    baseUrl: USER_MANAGER_API,
    url: 'UserAccess/DeleteAccessForm',
    options: { accessMenuId },
  }) as Promise<boolean>;
}

/** Menus linked to an AccessForm — these are what save/load persist. */
export function collectFormMenuKeys(items: AccessRoleTreeItem[]): number[] {
  const keys: number[] = [];
  const walk = (nodes: AccessRoleTreeItem[]) => {
    nodes.forEach((item) => {
      if (item.accessFormId) {
        keys.push(item.key);
      }
      if (item.children?.length) {
        walk(item.children);
      }
    });
  };
  walk(items);
  return keys;
}

export function collectCheckedKeys(items: AccessRoleTreeItem[]): number[] {
  const keys: number[] = [];
  const walk = (nodes: AccessRoleTreeItem[]) => {
    nodes.forEach((item) => {
      // Include form menus even when they have children (e.g. PortalBlog parent).
      if (item.hasAccess && item.accessFormId) {
        keys.push(item.key);
      }
      if (item.children?.length) {
        walk(item.children);
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

export const BLOG_ACCESS_PATHS = {
  view: '/site-content/blog',
  add: '/site-content/blog/add',
  edit: '/site-content/blog/edit',
  delete: '/site-content/blog/delete',
  publish: '/site-content/blog/publish',
} as const;

export function hasBlogAccess(
  accessRole: AccessUserRoleItem[],
  action: keyof typeof BLOG_ACCESS_PATHS
): boolean {
  return hasPathAccess(accessRole, BLOG_ACCESS_PATHS[action]);
}
