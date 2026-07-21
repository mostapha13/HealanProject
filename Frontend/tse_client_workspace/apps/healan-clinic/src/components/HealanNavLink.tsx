import React from 'react';
import { Link, useLocation } from '@tse/utils';

interface HealanNavLinkProps {
  to: string;
  end?: boolean;
  className?: (state: { isActive: boolean }) => string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export function HealanNavLink({ to, end, className, style, children }: HealanNavLinkProps) {
  const { pathname } = useLocation();
  const isActive = end
    ? pathname === to
    : pathname === to || pathname.startsWith(`${to}/`);
  const cls = className ? className({ isActive }) : isActive ? 'active' : '';

  return (
    <Link to={to} className={cls} style={style}>
      {children}
    </Link>
  );
}

export default HealanNavLink;
