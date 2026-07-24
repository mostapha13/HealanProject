import React, { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from '@tse/utils';
import { userManager } from '../store/userManager';
import { HealanNavLink } from '../components/HealanNavLink';
import { useUserAccess } from '../context/UserAccessContext';
import {
  getPortalHomeUrl,
  isImpersonating,
  logoutToPortalHome,
  syncPortalAccessToken,
} from '../api/impersonationApi';
import {
  fetchMyAccessMenus,
  type AccessMenuTreeItem,
} from '../api/userAccessApi';
import { environment } from '../environments/environment';
import {
  CLINIC_THEMES,
  loadClinicDarkMode,
  loadClinicTheme,
  saveClinicDarkMode,
  saveClinicTheme,
  type ClinicThemeId,
} from './clinicTheme';
import {
  IconChevron,
  IconClose,
  IconLogout,
  IconMenu,
  IconMoon,
  IconPin,
  IconSun,
  IconUser,
  resolveNavIcon,
} from './navIcons';
import { ClinicDownloadApp } from './ClinicDownloadApp';
import './healan.scss';

type NavNode = {
  key: number;
  label: string;
  path?: string;
  externalUrl?: string;
  children: NavNode[];
};

const ACTION_URL_RE = /\/(add|edit|delete|publish)$/i;
/**
 * Public portal SPA paths only.
 * Clinic booking admin is /booking/schedules|reservations — never treat as portal.
 * Clinic assistant settings is /basic-data/assistant — not /assistant.
 */
const PORTAL_EXACT_PATHS = new Set([
  '/assistant',
  '/booking',
  '/patient',
  '/patient/history',
  '/patient/blood-pressure',
  '/patient/medications',
]);
const EXPANDED_KEY = 'healan.clinic.nav.expanded';
const PINNED_KEY = 'healan.clinic.nav.pinned';

function isPortalPath(url: string): boolean {
  const path = (url.trim().replace(/\/$/, '') || '/').toLowerCase();
  if (PORTAL_EXACT_PATHS.has(path)) return true;
  // Allow future /patient/... pages without hijacking clinic routes.
  return path.startsWith('/patient/');
}

function menuTitle(item: AccessMenuTreeItem): string {
  return item.title || item.accessForm?.formTitle || `منو ${item.accessMenuId}`;
}

function loadIdSet(storageKey: string): Set<number> {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.map(Number).filter((n) => Number.isFinite(n)));
  } catch {
    return new Set();
  }
}

function saveIdSet(storageKey: string, ids: Set<number>): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify([...ids]));
  } catch {
    // ignore
  }
}

function buildNavTree(items: AccessMenuTreeItem[]): NavNode[] {
  const portalBase = ((environment as { portalUrl?: string }).portalUrl || getPortalHomeUrl()).replace(/\/$/, '');

  const mapItem = (item: AccessMenuTreeItem): NavNode | null => {
    if (item.isActive === false) return null;
    const url = (item.accessForm?.url || '').trim();
    if (url && ACTION_URL_RE.test(url)) return null;

    const children = (item.children ?? [])
      .map(mapItem)
      .filter((child): child is NavNode => child != null);

    if (!url) {
      if (children.length === 0) return null;
      return { key: item.accessMenuId, label: menuTitle(item), children };
    }

    if (isPortalPath(url)) {
      return {
        key: item.accessMenuId,
        label: menuTitle(item),
        externalUrl: `${portalBase}${url.startsWith('/') ? url : `/${url}`}`,
        children,
      };
    }

    return {
      key: item.accessMenuId,
      label: menuTitle(item),
      path: url,
      children,
    };
  };

  return items.map(mapItem).filter((n): n is NavNode => n != null);
}

function collectFolderKeys(nodes: NavNode[]): number[] {
  const keys: number[] = [];
  const walk = (list: NavNode[]) => {
    list.forEach((node) => {
      if (node.children.length > 0 || (!node.path && !node.externalUrl)) keys.push(node.key);
      if (node.children.length) walk(node.children);
    });
  };
  walk(nodes);
  return keys;
}

function collectAncestorKeys(nodes: NavNode[], pathname: string, ancestors: number[] = []): number[] {
  const matches: number[] = [];
  for (const node of nodes) {
    const nextAncestors = [...ancestors, node.key];
    if (node.path) {
      const active =
        node.path === '/'
          ? pathname === '/'
          : pathname === node.path || pathname.startsWith(`${node.path}/`);
      if (active) matches.push(...ancestors);
    }
    if (node.children.length) {
      matches.push(...collectAncestorKeys(node.children, pathname, nextAncestors));
    }
  }
  return matches;
}

type NavTreeProps = {
  nodes: NavNode[];
  depth?: number;
  expanded: Set<number>;
  pinned: Set<number>;
  onToggleExpand: (key: number) => void;
  onTogglePin: (key: number) => void;
};

function NavTree({
  nodes,
  depth = 0,
  expanded,
  pinned,
  onToggleExpand,
  onTogglePin,
}: NavTreeProps) {
  return (
    <>
      {nodes.map((node) => {
        const hasChildren = node.children.length > 0;
        const indent = { paddingInlineStart: `${0.85 + depth * 0.7}rem` };

        if (node.externalUrl && !hasChildren) {
          return (
            <a
              key={node.key}
              className="healan-nav-item"
              href={node.externalUrl}
              target="_blank"
              rel="noreferrer"
              style={indent}
              onClick={() => {
                void userManager.getUser().then((u) => {
                  if (u?.access_token) syncPortalAccessToken(u.access_token);
                });
              }}
            >
              <span className="healan-nav-item__icon">
                {resolveNavIcon(node.externalUrl, node.label)}
              </span>
              <span className="healan-nav-item__text">{node.label}</span>
            </a>
          );
        }

        if (node.path && !hasChildren) {
          return (
            <HealanNavLink
              key={node.key}
              to={node.path}
              end={node.path === '/'}
              className={({ isActive }: { isActive: boolean }) =>
                `healan-nav-item${isActive ? ' active' : ''}`
              }
              style={indent}
            >
              <span className="healan-nav-item__icon">{resolveNavIcon(node.path, node.label)}</span>
              <span className="healan-nav-item__text">{node.label}</span>
            </HealanNavLink>
          );
        }

        const isPinned = pinned.has(node.key);
        const isOpen = isPinned || expanded.has(node.key);

        return (
          <div
            key={node.key}
            className={`healan-nav-group${isOpen ? ' is-open' : ''}${isPinned ? ' is-pinned' : ''}`}
          >
            <div className="healan-nav-group__header" style={indent}>
              <button
                type="button"
                className="healan-nav-group__toggle"
                aria-expanded={isOpen}
                onClick={() => onToggleExpand(node.key)}
                title={isOpen ? 'بستن گروه' : 'باز کردن گروه'}
              >
                <span className={`healan-nav-group__chevron${isOpen ? ' is-open' : ''}`}>
                  <IconChevron open={isOpen} />
                </span>
                <span className="healan-nav-group__icon">
                  {resolveNavIcon(node.path, node.label, true)}
                </span>
                <span className="healan-nav-group__label">{node.label}</span>
              </button>
              <button
                type="button"
                className={`healan-nav-group__pin${isPinned ? ' is-active' : ''}`}
                aria-pressed={isPinned}
                title={isPinned ? 'برداشتن پین' : 'سنجاق کردن (همیشه باز)'}
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin(node.key);
                }}
              >
                <IconPin />
              </button>
            </div>
            {isOpen ? (
              <div className="healan-nav-group__children">
                {hasChildren ? (
                  <NavTree
                    nodes={node.children}
                    depth={depth + 1}
                    expanded={expanded}
                    pinned={pinned}
                    onToggleExpand={onToggleExpand}
                    onTogglePin={onTogglePin}
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </>
  );
}

export function HealanLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, displayName, currentUser, authenticated } = useUserAccess();
  const [impersonationActive, setImpersonationActive] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [navMenus, setNavMenus] = useState<AccessMenuTreeItem[]>([]);
  const [navLoading, setNavLoading] = useState(true);
  const [theme, setTheme] = useState<ClinicThemeId>(() => loadClinicTheme());
  const [darkMode, setDarkMode] = useState(() => loadClinicDarkMode());
  const [themeOpen, setThemeOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [pinned, setPinned] = useState<Set<number>>(() => loadIdSet(PINNED_KEY));
  const [expanded, setExpanded] = useState<Set<number>>(() => {
    const exp = loadIdSet(EXPANDED_KEY);
    loadIdSet(PINNED_KEY).forEach((id) => exp.add(id));
    return exp;
  });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    void userManager.getUser().then((user) => {
      const active = isImpersonating(user);
      setImpersonationActive(active);
      if (user?.access_token) syncPortalAccessToken(user.access_token);
      if (active && user) {
        const delay = Math.max(1000, (user.expires_in - 15) * 1000);
        timer = setTimeout(() => {
          void logoutToPortalHome();
        }, delay);
      }
    });
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!authenticated) {
      setNavMenus([]);
      setNavLoading(false);
      return;
    }
    setNavLoading(true);
    void fetchMyAccessMenus()
      .then(setNavMenus)
      .catch(() => setNavMenus([]))
      .finally(() => setNavLoading(false));
  }, [authenticated, currentUser?.identityUserId]);

  const navTree = useMemo(() => buildNavTree(navMenus), [navMenus]);

  useEffect(() => {
    if (!navTree.length) return;
    if (localStorage.getItem(EXPANDED_KEY) != null) return;
    const keys = new Set(collectFolderKeys(navTree));
    pinned.forEach((id) => keys.add(id));
    setExpanded(keys);
    saveIdSet(EXPANDED_KEY, keys);
  }, [navTree, pinned]);

  useEffect(() => {
    if (!navTree.length) return;
    const needed = collectAncestorKeys(navTree, location.pathname);
    if (!needed.length) return;
    setExpanded((prev) => {
      let changed = false;
      const next = new Set(prev);
      needed.forEach((id) => {
        if (!next.has(id)) {
          next.add(id);
          changed = true;
        }
      });
      if (changed) saveIdSet(EXPANDED_KEY, next);
      return changed ? next : prev;
    });
  }, [navTree, location.pathname]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileNavOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  const toggleExpand = (key: number) => {
    if (pinned.has(key)) return;
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      saveIdSet(EXPANDED_KEY, next);
      return next;
    });
  };

  const togglePin = (key: number) => {
    setPinned((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
        setExpanded((exp) => {
          const expNext = new Set(exp);
          expNext.add(key);
          saveIdSet(EXPANDED_KEY, expNext);
          return expNext;
        });
      }
      saveIdSet(PINNED_KEY, next);
      return next;
    });
  };

  const applyTheme = (id: ClinicThemeId) => {
    setTheme(id);
    saveClinicTheme(id);
  };

  const toggleDark = () => {
    setDarkMode((prev) => {
      const next = !prev;
      saveClinicDarkMode(next);
      return next;
    });
  };

  const userFullName = currentUser
    ? `${currentUser.firstName ?? ''} ${currentUser.lastName ?? ''}`.trim()
    : '';
  const userRole = currentUser?.roleTitle ?? '';
  const initials = (userFullName || displayName || 'ک')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('');

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutToPortalHome();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div
      className="healan-clinic"
      data-theme={theme}
      data-mode={darkMode ? 'dark' : 'light'}
    >
      <div className={`healan-shell${mobileNavOpen ? ' is-nav-open' : ''}`}>
        <button
          type="button"
          className={
            mobileNavOpen
              ? 'healan-nav-backdrop is-open'
              : 'healan-nav-backdrop'
          }
          aria-label="بستن منو"
          onClick={() => setMobileNavOpen(false)}
        />
        <aside
          className={
            mobileNavOpen ? 'healan-sidebar is-open' : 'healan-sidebar'
          }
          id="healan-clinic-sidebar"
        >
          <div className="healan-sidebar__brand">
            <div className="healan-sidebar__brand-mark" aria-hidden="true">
              H
            </div>
            <div>
              <h1>Healan</h1>
              <p>مدیریت کلینیک</p>
            </div>
            <button
              type="button"
              className="healan-sidebar__close-mobile"
              aria-label="بستن منو"
              onClick={() => setMobileNavOpen(false)}
            >
              <IconClose />
            </button>
          </div>

          <nav className="healan-sidebar__nav" aria-label="منوی اصلی">
            {navLoading || loading ? (
              <div className="healan-nav-item healan-nav-item--muted">در حال بارگذاری منو...</div>
            ) : navTree.length === 0 ? (
              <div className="healan-nav-item healan-nav-item--muted">منویی برای این کاربر تعریف نشده</div>
            ) : (
              <NavTree
                nodes={navTree}
                expanded={expanded}
                pinned={pinned}
                onToggleExpand={toggleExpand}
                onTogglePin={togglePin}
              />
            )}
            <ClinicDownloadApp onNavigate={() => setMobileNavOpen(false)} />
          </nav>

          <div className="healan-sidebar__footer">
            <div className="healan-sidebar__prefs">
              <div className="healan-theme-row" role="group" aria-label="تم رنگ">
                {CLINIC_THEMES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`healan-theme-dot${theme === t.id ? ' is-active' : ''}`}
                    style={{ background: t.swatch }}
                    title={t.label}
                    aria-label={t.label}
                    aria-pressed={theme === t.id}
                    onClick={() => applyTheme(t.id)}
                  />
                ))}
              </div>
              <button
                type="button"
                className={`healan-sidebar__icon-btn${darkMode ? ' is-active' : ''}`}
                title={darkMode ? 'حالت روشن' : 'حالت تاریک'}
                aria-pressed={darkMode}
                onClick={toggleDark}
              >
                {darkMode ? <IconSun /> : <IconMoon />}
              </button>
              <button
                type="button"
                className={`healan-sidebar__icon-btn${themeOpen ? ' is-active' : ''}`}
                title="جزئیات تم"
                aria-expanded={themeOpen}
                onClick={() => setThemeOpen((v) => !v)}
              >
                <span className="healan-sidebar__icon-btn-label">تم</span>
              </button>
            </div>

            {themeOpen ? (
              <div className="healan-theme-panel">
                {CLINIC_THEMES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`healan-theme-option${theme === t.id ? ' is-active' : ''}`}
                    onClick={() => applyTheme(t.id)}
                  >
                    <span className="healan-theme-option__swatch" style={{ background: t.swatch }} />
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            ) : null}

            <div className="healan-sidebar__user-bar">
              <button
                type="button"
                className="healan-sidebar__user-chip"
                title="ویرایش حساب و رمز"
                onClick={() => navigate('/profile')}
              >
                <span className="healan-sidebar__avatar">{initials || <IconUser />}</span>
                <span className="healan-sidebar__user-meta">
                  <strong>{loading ? '…' : userFullName || displayName || 'کاربر'}</strong>
                  {userRole ? <small>{userRole}</small> : null}
                </span>
              </button>
              <button
                type="button"
                className="healan-sidebar__icon-btn"
                title="خروج از حساب"
                disabled={loggingOut}
                onClick={() => void handleLogout()}
              >
                <IconLogout />
              </button>
            </div>
          </div>
        </aside>

        <main className="healan-main">
          <div className="healan-mobile-bar">
            <button
              type="button"
              className="healan-mobile-bar__menu"
              aria-expanded={mobileNavOpen}
              aria-controls="healan-clinic-sidebar"
              aria-label="باز کردن منو"
              onClick={() => setMobileNavOpen(true)}
            >
              <IconMenu />
              <span>منو</span>
            </button>
            <strong className="healan-mobile-bar__title">Healan</strong>
            <button
              type="button"
              className="healan-mobile-bar__icon"
              title="خروج"
              disabled={loggingOut}
              onClick={() => void handleLogout()}
            >
              <IconLogout />
            </button>
          </div>
          {impersonationActive && (
            <div className="healan-impersonation-banner" role="alert">
              <strong>
                در حال مشاهده سامانه دقیقاً به‌جای {userFullName || 'کاربر انتخاب‌شده'} هستید.
              </strong>
              <button
                type="button"
                className="healan-btn healan-btn--danger healan-btn--sm"
                disabled={loggingOut}
                onClick={() => void handleLogout()}
              >
                {loggingOut ? 'در حال خروج...' : 'خروج کامل'}
              </button>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default HealanLayout;
