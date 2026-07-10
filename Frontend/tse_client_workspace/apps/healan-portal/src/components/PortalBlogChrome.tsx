import React from 'react';
import { Link } from 'react-router-dom';
import { IconHeart } from './Icons';

interface PortalBlogChromeProps {
  children: React.ReactNode;
  title?: string;
}

export function PortalBlogChrome({ children, title = 'بلاگ' }: PortalBlogChromeProps) {
  return (
    <div className="portal">
      <header className="portal-header is-scrolled">
        <div className="portal-container portal-header__inner">
          <Link to="/" className="portal-brand">
            <span className="portal-brand__mark"><IconHeart /></span>
            <div className="portal-brand__text">
              <strong>مطب</strong>
              <span>بازگشت به صفحه اصلی</span>
            </div>
          </Link>
          <nav className="portal-nav" aria-label="منوی بلاگ">
            <Link to="/blog" className="portal-nav__link">{title}</Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
