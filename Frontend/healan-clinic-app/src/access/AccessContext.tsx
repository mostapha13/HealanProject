import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import {
  canAccessPath,
  fetchMyAccessMenus,
  flattenMenuUrls,
  pathForModuleId,
  type AccessMenuTreeItem,
} from '../api/access';
import {
  buildHomeSections,
  buildMobileHomeLayout,
  type HomeSection,
  type MobileHomeLayout,
} from '../navigation/catalog';

type AccessContextValue = {
  loading: boolean;
  menus: AccessMenuTreeItem[];
  sections: HomeSection[];
  home: MobileHomeLayout;
  grantedUrls: string[];
  canAccess: (path: string) => boolean;
  canAccessModule: (moduleId: string) => boolean;
  reload: () => Promise<void>;
};

const AccessContext = createContext<AccessContextValue | null>(null);

export function AccessProvider({ children }: { children: React.ReactNode }) {
  const { session, getAccessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [menus, setMenus] = useState<AccessMenuTreeItem[]>([]);

  const reload = useCallback(async () => {
    if (!session) {
      setMenus([]);
      return;
    }
    setLoading(true);
    try {
      setMenus(await fetchMyAccessMenus(getAccessToken));
    } catch (err) {
      console.warn('Failed to load access menus', err);
      setMenus([]);
    } finally {
      setLoading(false);
    }
  }, [session, getAccessToken]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const sections = useMemo(() => buildHomeSections(menus), [menus]);
  const home = useMemo(() => buildMobileHomeLayout(menus), [menus]);
  const grantedUrls = useMemo(() => flattenMenuUrls(menus), [menus]);

  const canAccess = useCallback(
    (path: string) => canAccessPath(grantedUrls, path),
    [grantedUrls]
  );

  const canAccessModule = useCallback(
    (moduleId: string) => {
      const path = pathForModuleId(moduleId);
      if (!path) return false;
      return canAccessPath(grantedUrls, path);
    },
    [grantedUrls]
  );

  const value = useMemo(
    () => ({
      loading,
      menus,
      sections,
      home,
      grantedUrls,
      canAccess,
      canAccessModule,
      reload,
    }),
    [loading, menus, sections, home, grantedUrls, canAccess, canAccessModule, reload]
  );

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export function useAccess(): AccessContextValue {
  const ctx = useContext(AccessContext);
  if (!ctx) throw new Error('useAccess must be used within AccessProvider');
  return ctx;
}
