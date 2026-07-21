import React from 'react';
import { Outlet } from '@tse/utils';

/** Sidebar is the sole navigator; no sibling tabs on the page. */
export function SiteContentLayout() {
  return <Outlet />;
}

export default SiteContentLayout;
