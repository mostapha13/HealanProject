import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
import type { TokenGetter } from '../api/client';

type AccessContextValue = {
  /** True only until the first menus fetch finishes for the current session. */
  loading: boolean;
  menus: AccessMenuTreeItem[];
  sections: HomeSection[];
  home: MobileHomeLayout;
  grantedUrls: string[];
  canAccess: (path: string) => boolean;
  canAccessModule: (moduleId: string) => boolean;
  reload: (silent?: boolean) => Promise<void>;
};

const AccessContext = createContext<AccessContextValue | null>(null);

export function AccessProvider({ children }: { children: React.ReactNode }) {
  const { session, getAccessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [menus, setMenus] = useState<AccessMenuTreeItem[]>([]);
  const [ready, setReady] = useState(false);
  const tokenGetterRef = useRef<TokenGetter>(getAccessToken);
  const loadedOnceRef = useRef(false);
  tokenGetterRef.current = getAccessToken;
  const sessionKey = session?.accessToken ?? null;

  const reload = useCallback(async (silent = false) => {
    if (!sessionKey) {
      setMenus([]);
      setReady(false);
      loadedOnceRef.current = false;
      setLoading(false);
      return;
    }
    // Never flip global loading on background refresh — that remounted tabs and looped.
    if (!silent && !loadedOnceRef.current) setLoading(true);
    try {
      setMenus(await fetchMyAccessMenus(() => tokenGetterRef.current()));
      loadedOnceRef.current = true;
      setReady(true);
    } catch (err) {
      console.warn('Failed to load access menus', err);
      setMenus([]);
      loadedOnceRef.current = true;
      setReady(true);
    } finally {
      setLoading(false);
    }
  }, [sessionKey]);

  useEffect(() => {
    void reload(false);
  }, [reload]);

  const sections = useMemo(() => buildHomeSections(menus), [menus]);
  const home = useMemo(() => buildMobileHomeLayout(menus), [menus]);
  const grantedUrls = useMemo(() => flattenMenuUrls(menus), [menus]);

  const canAccess = useCallback(
    (path: string) => {
      // While menus are still loading, keep shell usable (avoid empty flash / loops).
      if (!ready) return true;
      if (!grantedUrls.length) return path === '/' || path === '';
      return canAccessPath(grantedUrls, path);
    },
    [grantedUrls, ready]
  );

  const canAccessModule = useCallback(
    (moduleId: string) => {
      const path = pathForModuleId(moduleId);
      if (!path) return false;
      return canAccess(path);
    },
    [canAccess]
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
