import React from 'react';
import { Outlet } from '@tse/utils';

/** SMS management lives under its own AccessMenu folder; this layout is charts only. */
export function ReportsLayout() {
  return <Outlet />;
}

export default ReportsLayout;
