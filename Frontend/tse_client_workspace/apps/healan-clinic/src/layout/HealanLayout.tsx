import React, { useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate } from '@tse/utils';
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

function isPortalPath(url: string): boolean {
  return PORTAL_URL_RE.test(url);
}

function menuTitle(item: AccessMenuTreeItem): string {
  return item.title || item.accessForm?.formTitle || `منو ${item.accessMenuId}`;
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

function NavTree({ nodes, depth = 0 }: { nodes: NavNode[]; depth?: number }) {
  return (
    <>
      {nodes.map((node) => {
        const hasChildren = node.children.length > 0;
        if (node.externalUrl) {
          return (
            <a
              key={node.key}
              className="healan-nav-item"
              href={node.externalUrl}
              target="_blank"
              rel="noreferrer"
              style={{ paddingInlineStart: `${0.9 + depth * 0.75}rem` }}
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
        if (node.path) {
          return (
            <React.Fragment key={node.key}>
              <HealanNavLink
                to={node.path}
                end={node.path === '/'}
                className={({ isActive }: { isActive: boolean }) =>
                  `healan-nav-item${isActive ? ' active' : ''}`
                }
                style={{ paddingInlineStart: `${0.9 + depth * 0.75}rem` }}
              >
                <span>{node.label}</span>
              </HealanNavLink>
              {hasChildren ? <NavTree nodes={node.children} depth={depth + 1} /> : null}
            </React.Fragment>
          );
        }
        return (
          <div key={node.key} className="healan-nav-group">
            <div
              className="healan-nav-group__title"
              style={{ paddingInlineStart: `${0.9 + depth * 0.75}rem` }}
            >
              {node.label}
            </div>
            {hasChildren ? <NavTree nodes={node.children} depth={depth + 1} /> : null}
          </div>
        );
      })}
    </>
  );
}

export function HealanLayout() {
  const navigate = useNavigate();
  const { loading, displayName, currentUser, authenticated } = useUserAccess();
  const [impersonationActive, setImpersonationActive] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [navMenus, setNavMenus] = useState<AccessMenuTreeItem[]>([]);
  const [navLoading, setNavLoading] = useState(true);

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
          <nav>
            {navLoading || loading ? (
              <div className="healan-nav-item" style={{ opacity: 0.7 }}>
                در حال بارگذاری منو...
              </div>
            ) : navTree.length === 0 ? (
              <div className="healan-nav-item" style={{ opacity: 0.7 }}>
                منویی برای این کاربر تعریف نشده
              </div>
            ) : (
              <NavTree nodes={navTree} />
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
