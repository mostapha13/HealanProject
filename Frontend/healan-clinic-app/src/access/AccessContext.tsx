import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { fetchMyAccessMenus, type AccessMenuTreeItem } from '../api/access';
import { buildHomeSections, type HomeSection } from '../navigation/catalog';

type AccessContextValue = {
  loading: boolean;
  menus: AccessMenuTreeItem[];
  sections: HomeSection[];
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

  const value = useMemo(
    () => ({ loading, menus, sections, reload }),
    [loading, menus, sections, reload]
  );

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export function useAccess(): AccessContextValue {
  const ctx = useContext(AccessContext);
  if (!ctx) throw new Error('useAccess must be used within AccessProvider');
  return ctx;
}
