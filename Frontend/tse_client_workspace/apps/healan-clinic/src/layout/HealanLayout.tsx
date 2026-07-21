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
import './healan.scss';

type NavNode = {
  key: number;
  label: string;
  path?: string;
  externalUrl?: string;
  children: NavNode[];
};

const ACTION_URL_RE = /\/(add|edit|delete|publish)$/i;
const PORTAL_URL_RE = /^\/(assistant|booking|patient)(\/|$)/i;
const EXPANDED_KEY = 'healan.clinic.nav.expanded';
const PINNED_KEY = 'healan.clinic.nav.pinned';

function isPortalPath(url: string): boolean {
  return PORTAL_URL_RE.test(url);
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
      return {
        key: item.accessMenuId,
        label: menuTitle(item),
        children,
      };
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
      if (node.children.length > 0 || (!node.path && !node.externalUrl)) {
        keys.push(node.key);
      }
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
        const pad = { paddingInlineStart: `${0.9 + depth * 0.75}rem` };

        if (node.externalUrl && !hasChildren) {
          return (
            <a
              key={node.key}
              className="healan-nav-item"
              href={node.externalUrl}
              target="_blank"
              rel="noreferrer"
              style={pad}
              onClick={() => {
                void userManager.getUser().then((u) => {
                  if (u?.access_token) syncPortalAccessToken(u.access_token);
                });
              }}
            >
              <span>{node.label}</span>
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
              style={pad}
            >
              <span>{node.label}</span>
            </HealanNavLink>
          );
        }

        // Folder (or parent with children): collapsible + pinnable
        const isPinned = pinned.has(node.key);
        const isOpen = isPinned || expanded.has(node.key);

        return (
          <div
            key={node.key}
            className={`healan-nav-group${isOpen ? ' is-open' : ''}${isPinned ? ' is-pinned' : ''}`}
          >
            <div className="healan-nav-group__header" style={pad}>
              <button
                type="button"
                className="healan-nav-group__toggle"
                aria-expanded={isOpen}
                onClick={() => onToggleExpand(node.key)}
                title={isOpen ? 'بستن گروه' : 'باز کردن گروه'}
              >
                <span className="healan-nav-group__chevron" aria-hidden="true">
                  {isOpen ? '▾' : '▸'}
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
                <span className="healan-nav-group__pin-icon" aria-hidden="true" />
              </button>
            </div>
            {isOpen ? (
              <div className="healan-nav-group__children">
                {node.path ? (
                  <HealanNavLink
                    to={node.path}
                    end={node.path === '/'}
                    className={({ isActive }: { isActive: boolean }) =>
                      `healan-nav-item${isActive ? ' active' : ''}`
                    }
                    style={{ paddingInlineStart: `${0.9 + (depth + 1) * 0.75}rem` }}
                  >
                    <span>{node.label}</span>
                  </HealanNavLink>
                ) : null}
                {node.externalUrl ? (
                  <a
                    className="healan-nav-item"
                    href={node.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ paddingInlineStart: `${0.9 + (depth + 1) * 0.75}rem` }}
                    onClick={() => {
                      void userManager.getUser().then((u) => {
                        if (u?.access_token) syncPortalAccessToken(u.access_token);
                      });
                    }}
                  >
                    <span>{node.label}</span>
                  </a>
                ) : null}
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
  const [expanded, setExpanded] = useState<Set<number>>(() => loadIdSet(EXPANDED_KEY));
  const [pinned, setPinned] = useState<Set<number>>(() => loadIdSet(PINNED_KEY));

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

  // First visit: expand all folders. Later visits keep user preference.
  useEffect(() => {
    if (!navTree.length) return;
    if (localStorage.getItem(EXPANDED_KEY) != null) return;
    const keys = new Set(collectFolderKeys(navTree));
    setExpanded(keys);
    saveIdSet(EXPANDED_KEY, keys);
  }, [navTree]);

  // Keep ancestors of the active route expanded (without unpinning others).
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

  const toggleExpand = (key: number) => {
    if (pinned.has(key)) return; // pinned stays open
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

  const userFullName = currentUser
    ? `${currentUser.firstName ?? ''} ${currentUser.lastName ?? ''}`.trim()
    : '';
  const userRole = currentUser?.roleTitle ?? '';

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutToPortalHome();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="healan-clinic">
      <div className="healan-shell">
        <aside className="healan-sidebar">
          <div className="healan-sidebar__brand">
            <h1>Healan</h1>
            <p>سامانه مدیریت کلینیک و مطب</p>
          </div>
          <nav className="healan-sidebar__nav" aria-label="منوی اصلی">
            {navLoading || loading ? (
              <div className="healan-nav-item" style={{ opacity: 0.7 }}>
                در حال بارگذاری منو...
              </div>
            ) : navTree.length === 0 ? (
              <div className="healan-nav-item" style={{ opacity: 0.7 }}>
                منویی برای این کاربر تعریف نشده
              </div>
            ) : (
              <NavTree
                nodes={navTree}
                expanded={expanded}
                pinned={pinned}
                onToggleExpand={toggleExpand}
                onTogglePin={togglePin}
              />
            )}
          </nav>
          <div className="healan-sidebar__footer">
            <div className="healan-sidebar__user">
              <span className="healan-sidebar__user-icon" aria-hidden="true">
                👤
              </span>
              <div className="healan-sidebar__user-text">
                <span className="healan-sidebar__user-label">کاربر فعال</span>
                <strong>
                  {loading ? 'در حال بارگذاری...' : userFullName || displayName || '—'}
                </strong>
                {!loading && userRole && (
                  <span className="healan-sidebar__user-meta">{userRole}</span>
                )}
              </div>
            </div>
            <button
              type="button"
              className="healan-btn healan-btn--outline healan-btn--sm"
              style={{
                width: '100%',
                marginBottom: '0.5rem',
                borderColor: 'rgba(255,255,255,0.35)',
                color: '#fff',
              }}
              onClick={() => navigate('/profile')}
            >
              ویرایش حساب / رمز
            </button>
            <button
              type="button"
              className="healan-btn healan-btn--ghost"
              disabled={loggingOut}
              onClick={() => void handleLogout()}
            >
              {loggingOut ? 'در حال خروج...' : 'خروج از حساب'}
            </button>
          </div>
        </aside>
        <main className="healan-main">
          {impersonationActive && (
            <div
              role="alert"
              style={{
                marginBottom: '1rem',
                padding: '0.8rem 1rem',
                borderRadius: 10,
                background: '#fff3cd',
                border: '1px solid #f59e0b',
                color: '#7c4a03',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
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
