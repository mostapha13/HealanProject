import { lazy } from '@tse/utils';
import type { RouteType } from '@tse/types';
const TabaeeStatusList = lazy(() => import('../../pages/TabaeeStatusList'));
const TabaeeStatusSubmit = lazy(() => import('../../pages/TabaeeStatusSubmit'));

type RoutesType = RouteType[];

export function generateRoutes(): RoutesType {
  return [
    {
      id: 0,
      path: 'list',
      name: 'لیست تبعی',
      component: TabaeeStatusList,
    },
    {
      id: 1,
      path: 'tabaee-status',
      name: 'فرم تبعی',
      component: TabaeeStatusSubmit,
    },
    {
      id: 2,
      path: 'tabaee-status/:id',
      name: 'فرم تبعی',
      component: TabaeeStatusSubmit,
    },
  ];
}
