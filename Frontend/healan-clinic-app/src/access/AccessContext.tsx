import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import {
  fetchMyAccessMenus,
  flattenMenuUrls,
  resolveMvpTabs,
  type AccessMenuTreeItem,
  type MvpTab,
} from '../api/access';

type AccessContextValue = {
  loading: boolean;
  menus: AccessMenuTreeItem[];
  urls: string[];
  tabs: MvpTab[];
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
      const tree = await fetchMyAccessMenus(getAccessToken);
      setMenus(tree);
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

  const urls = useMemo(() => flattenMenuUrls(menus), [menus]);
  const tabs = useMemo(() => resolveMvpTabs(urls), [urls]);

  const value = useMemo(
    () => ({ loading, menus, urls, tabs, reload }),
    [loading, menus, urls, tabs, reload]
  );

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export function useAccess(): AccessContextValue {
  const ctx = useContext(AccessContext);
  if (!ctx) throw new Error('useAccess must be used within AccessProvider');
  return ctx;
}
