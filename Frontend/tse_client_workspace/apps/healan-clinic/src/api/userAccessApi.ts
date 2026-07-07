import { request } from '@tse/tools';
import { USER_MANAGER_API } from '../constants';

export interface AccessUserRoleItem {
  url: string;
  hasAccess: boolean;
  formTitle?: string;
  hasPersianAccess?: boolean;
}

interface UserAccessRequest {
  IdentityId: string;
  AccessSystemId: number;
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

export function hasPathAccess(accessRole: AccessUserRoleItem[], path: string): boolean {
  if (!accessRole?.length) {
    return true;
  }

  const normalized = path === '/' ? '/' : path.replace(/\/$/, '');

  if (normalized === '/basic-data') {
    return accessRole.some((item) => item.hasAccess && item.url?.startsWith('/basic-data'));
  }

  const exact = accessRole.find((item) => item.url === normalized);
  if (exact) {
    return exact.hasAccess;
  }

  return accessRole.some(
    (item) => item.hasAccess && normalized.startsWith(`${item.url}/`)
  );
}
