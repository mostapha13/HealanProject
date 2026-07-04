/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import { lazy } from '@tse/utils';
import type { RouteType } from '@tse/types';

const SignUp = lazy(() => import('../pages/Signup'));

type RoutesType = RouteType[];

export function generateRoutes(): RoutesType {
  return [
    {
      id: 1,
      path: 'sign-up',
      name: '',
      component: SignUp,
    },
  ];
}
