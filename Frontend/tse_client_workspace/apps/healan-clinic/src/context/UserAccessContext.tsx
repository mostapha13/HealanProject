import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { saveToSession } from '@tse/tools';
import { userManager } from '../store/userManager';
import healanApi from '../api/healanApi';
import {
  AccessUserRoleItem,
  fetchUserAccessRole,
  hasPathAccess,
} from '../api/userAccessApi';
import { HEALAN_ACCESS_SYSTEM_ID } from '../constants';
import type { UserRoleInfo, UserSummary } from '../api/types';
import { withTimeout } from '../utils/withTimeout';
import { setClinicBearerToken } from '../utils/setClinicBearerToken';

interface UserAccessContextValue {
  accessRole: AccessUserRoleItem[];
  currentUser: UserSummary | null;
  displayName: string;
  authenticated: boolean;
  loading: boolean;
  canAccess: (path: string) => boolean;
  reload: () => Promise<void>;
}

const UserAccessContext = createContext<UserAccessContextValue>({
  accessRole: [],
  currentUser: null,
  displayName: '',
  authenticated: false,
  loading: true,
  canAccess: () => false,
  reload: async () => undefined,
});

function isGuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function isDisplayableText(value: string): boolean {
  return value.length > 0 && !isGuidLike(value);
}

const CLINIC_ROLE_ORDER = ['Admin', 'Secretary', 'Doctor', 'Accountant'];
const IGNORED_ROLE_NAMES = new Set(['healan', 'content_producer', 'openid', 'profile']);

function pickDisplayRole(roles: UserRoleInfo[]): string | undefined {
  for (const roleName of CLINIC_ROLE_ORDER) {
    const match = roles.find((role) => role.roleName?.toLowerCase() === roleName.toLowerCase());
    if (match) return match.roleTitle || match.roleName;
  }

  return roles
    .filter((role) => !IGNORED_ROLE_NAMES.has((role.roleName ?? '').toLowerCase()))
    .map((role) => role.roleTitle || role.roleName)
    .find((title) => title && isDisplayableText(title));
}

function pickString(raw: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return '';
}

function normalizeRoles(raw: Record<string, unknown>): UserRoleInfo[] {
  const roleInfos = raw['roleInfos'] ?? raw['RoleInfos'];
  if (!Array.isArray(roleInfos)) return [];

  const roles: UserRoleInfo[] = [];
  for (const item of roleInfos) {
    if (!item || typeof item !== 'object') continue;
    const role = item as Record<string, unknown>;
    const roleName = pickString(role, 'roleName', 'RoleName');
    const roleTitle = pickString(role, 'roleTitle', 'RoleTitle');
    if (!roleName && !roleTitle) continue;

    const entry: UserRoleInfo = {};
    if (roleName) entry.roleName = roleName;
    if (roleTitle) entry.roleTitle = roleTitle;
    roles.push(entry);
  }
  return roles;
}

function normalizeUserSummary(raw: Record<string, unknown> | undefined): UserSummary | null {
  if (!raw) return null;

  const firstName = pickString(raw, 'firstName', 'FirstName');
  const lastName = pickString(raw, 'lastName', 'LastName');
  const userNameRaw = pickString(raw, 'userName', 'UserName');
  const userName = isDisplayableText(userNameRaw) ? userNameRaw : '';
  const identityUserId = pickString(raw, 'userId', 'UserId');
  const phoneRaw = pickString(raw, 'phoneNumber', 'PhoneNumber');
  const phoneNumber = isDisplayableText(phoneRaw) ? phoneRaw : isDisplayableText(userNameRaw) ? userNameRaw : '';

  if (!firstName && !lastName && !phoneNumber) return null;

  const roles = normalizeRoles(raw);
  const roleTitle = pickDisplayRole(roles);

  const numericUserId = Number(identityUserId);
  return {
    userId: Number.isFinite(numericUserId) && numericUserId > 0 ? numericUserId : 0,
    identityUserId: identityUserId || undefined,
    firstName,
    lastName,
    phoneNumber: phoneNumber || undefined,
    userName: userName || undefined,
    departmentName: pickString(raw, 'departmentName', 'DepartmentName') || undefined,
    roleTitle,
    roles: roles.length > 0 ? roles : undefined,
  };
}

function userSummaryFromOidcProfile(profile: Record<string, unknown>): UserSummary | null {
  const firstName = pickString(profile, 'given_name', 'GivenName');
  const lastName = pickString(profile, 'family_name', 'FamilyName');
  const preferredUsername = pickString(profile, 'preferred_username');
  const phoneNumber = isDisplayableText(preferredUsername) ? preferredUsername : '';
  const identityUserId = pickString(profile, 'sub');

  if (!firstName && !lastName && !phoneNumber) return null;

  return {
    userId: 0,
    identityUserId: identityUserId || undefined,
    firstName,
    lastName,
    phoneNumber: phoneNumber || undefined,
  };
}

async function ensureAuthHeader() {
  const user = await userManager.getUser();
  if (user?.access_token && !user.expired) {
    setClinicBearerToken(user.access_token);
  }
  return user;
}

function buildDisplayName(user: UserSummary | null): string {
  if (!user) return '';
  const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
  if (fullName) return fullName;
  if (user.phoneNumber && isDisplayableText(user.phoneNumber)) return user.phoneNumber;
  return '';
}

export function UserAccessProvider({ children }: { children: React.ReactNode }) {
  const [accessRole, setAccessRole] = useState<AccessUserRoleItem[]>([]);
  const [currentUser, setCurrentUser] = useState<UserSummary | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [accessLoaded, setAccessLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadSession = useCallback(async () => {
    setLoading(true);
    setAccessLoaded(false);
    try {
      const user = await ensureAuthHeader();
      const identityId = user?.profile?.sub;
      if (!identityId || user?.expired) {
        setAuthenticated(false);
        setAccessRole([]);
        setCurrentUser(null);
        return;
      }

      setAuthenticated(true);
      saveToSession('hasId', identityId);

      const [accessResult, profileResult] = await Promise.allSettled([
        withTimeout(
          fetchUserAccessRole({
            AccessSystemId: HEALAN_ACCESS_SYSTEM_ID,
          })
        ),
        withTimeout(healanApi.users.current()),
      ]);

      if (accessResult.status === 'fulfilled') {
        setAccessRole(Array.isArray(accessResult.value) ? accessResult.value : []);
        setAccessLoaded(true);
      } else {
        setAccessRole([]);
      }

      if (profileResult.status === 'fulfilled') {
        const res = profileResult.value;
        const summary =
          res?.userSummaryReply ??
          (res as { UserSummaryReply?: Record<string, unknown> }).UserSummaryReply;
        const normalized =
          normalizeUserSummary(summary as Record<string, unknown>) ||
          userSummaryFromOidcProfile((user.profile ?? {}) as Record<string, unknown>);
        setCurrentUser(normalized);
      } else {
        setCurrentUser(userSummaryFromOidcProfile((user.profile ?? {}) as Record<string, unknown>));
      }
    } catch {
      setAuthenticated(false);
      setAccessRole([]);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();

    const onUserLoaded = () => {
      loadSession();
    };
    userManager.events.addUserLoaded(onUserLoaded);
    userManager.events.addUserUnloaded(() => {
      setAuthenticated(false);
      setAccessLoaded(false);
      setAccessRole([]);
      setCurrentUser(null);
    });

    return () => {
      userManager.events.removeUserLoaded(onUserLoaded);
    };
  }, [loadSession]);

  const canAccess = useCallback(
    (path: string) => {
      const normalized = path === '/' ? '/' : path.replace(/\/$/, '');
      if (normalized === '/profile') {
        return authenticated && !loading;
      }
      return authenticated && !loading && accessLoaded && hasPathAccess(accessRole, normalized);
    },
    [accessRole, accessLoaded, authenticated, loading]
  );

  const displayName = buildDisplayName(currentUser);

  const value = useMemo(
    () => ({
      accessRole,
      currentUser,
      displayName,
      authenticated,
      loading,
      canAccess,
      reload: loadSession,
    }),
    [accessRole, currentUser, displayName, authenticated, loading, canAccess, loadSession]
  );

  return <UserAccessContext.Provider value={value}>{children}</UserAccessContext.Provider>;
}

export function useUserAccess() {
  return useContext(UserAccessContext);
}

export function useCurrentUser() {
  const { currentUser, displayName, loading } = useContext(UserAccessContext);
  return { user: currentUser, displayName, loading };
}
