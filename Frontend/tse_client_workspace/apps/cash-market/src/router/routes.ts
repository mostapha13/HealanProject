/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import { lazy, Outlet } from '@tse/utils';
import type { RouteType } from '@tse/types';
import { loadFromSession, loadFromStorage } from '@tse/tools';
import { getUserAccessRole } from '../Controller/Identity';
import { useEffect, useStates, useNavigate, useState } from '@tse/utils';
import {
  basicDataRouts,
  block,
  cartableRoute,
  initialSupply,
  listingBasicData,
  listingStockAcceptance,
  healanClinic,
  marketMaker,
  newTools,
  othersRouts,
  reportRouts,
  stockMarket,
  transactionManagement,
  transferStock,
  userRouts,
  insidery,
  corporateSurvey,
} from './RouteDetail/constant';
interface PropsTypes {
  role?: 'Admin' | 'User' | 'MarketMaker';
}
type RoutesType = RouteType[];

const initialState = { accessRole: [] };
export function generateRoutes({ role }: PropsTypes = {}): RoutesType {
  const [state, setState] = useStates<any>(initialState);
  const { accessRole } = state;
  const IdentityId = loadFromSession('hasId');
  useEffect(() => {
    getUserAccessRoleData();
  }, [IdentityId]);
  const onFail = (error: any) => {};
  const getUserAccessRoleData = () => {
    getUserAccessRole({
      data: { IdentityId: IdentityId, AccessSystemId: 1 },
      onSuccess: (res: any) => {
        setState({ accessRole: res });
      },
      onFail,
    });
  };
  const checkIsHide = (path: string) => {
    const objectItem = accessRole?.find((item: any) => {
      return item.url === path;
    });
    return !objectItem?.hasAccess;
  };

  const routesWithAccess = [
    {
      ...healanClinic,
      hide: false,
      nested: healanClinic.nested.map((route) => ({
        ...route,
        hide: route?.hide,
      })),
    },
    {
      ...cartableRoute,
      hide: false,
    },
    {
      ...basicDataRouts,
      hide: checkIsHide('/operation'),
      nested: basicDataRouts.nested.map((route) => ({
        ...route,
        hide: checkIsHide(`/operation/${route.path}`),
      })),
    },
    {
      ...newTools,
      hide: checkIsHide('/instrument'),
      nested: newTools.nested.map((route) => ({
        ...route,
        hide: checkIsHide(`/instrument/${route.path}`),
      })),
    },
    {
      ...marketMaker,
      hide: checkIsHide('/market-maker'),
      nested: marketMaker.nested.map((route) => ({
        ...route,
        hide: checkIsHide(`/stock/${route.path}`),
      })),
    },
    {
      ...transferStock,
      hide: checkIsHide('/transfer-stock'),
      nested: transferStock.nested.map((route) => ({
        ...route,
        hide: checkIsHide(`/stock/${route.path}`),
      })),
    },
    {
      ...initialSupply,
      hide: checkIsHide('/initial-supply'),
      nested: initialSupply.nested.map((route) => ({
        ...route,
        hide: checkIsHide(`/stock/${route.path}`),
      })),
    },
    {
      ...block,
      hide: checkIsHide('/block'),
      nested: block.nested.map((route) => ({
        ...route,
        hide: checkIsHide(`/stock/${route.path}`),
      })),
    },
    {
      ...stockMarket,
      hide: checkIsHide('/stock'),
      nested: stockMarket.nested.map((route) => ({
        ...route,
        hide: checkIsHide(`/stock/${route.path}`),
      })),
    },
    {
      ...reportRouts,
      hide: checkIsHide('/reports'),
      nested: reportRouts.nested.map((route) => ({
        ...route,
        hide: checkIsHide(`/reports/${route.path}`),
      })),
    },
    {
      ...userRouts,
      hide: checkIsHide('/manage'),
      nested: userRouts.nested.map((route) => ({
        ...route,
        hide: checkIsHide(`/manage/${route.path}`),
      })),
    },
    {
      ...transactionManagement,
      hide: checkIsHide('/transaction'),
      nested: transactionManagement.nested.map((route) => ({
        ...route,
        hide: checkIsHide(`/transaction/${route.path}`),
      })),
    },
    ...othersRouts.map((route) => ({
      ...route,
      hide: true,
    })),
    /////////////////////////////////Listing////////////////////////////////
    {
      ...listingBasicData,
      hide: false,
      nested: listingBasicData.nested.map((route) => ({
        ...route,
        hide: route?.hide,
      })),
    },
    {
      ...listingStockAcceptance,
      hide: false,
      nested: listingStockAcceptance.nested.map((route) => ({
        ...route,
        hide: route?.hide,
      })),
    },

    /////////////////////////////////Insidery////////////////////////////////
    {
      ...insidery,
      hide: checkIsHide('/insidery'),
      nested: insidery.nested.map((route) => ({
        ...route,
        hide: checkIsHide(`/insidery/${route.path}`),
      })),
    },
    /////////////////////////////////corporate survey////////////////////////////////
    {
      ...corporateSurvey,
      hide: false,
      nested: corporateSurvey.nested.map((route) => ({
        ...route,
        hide: route?.hide,
      })),
    },
  ];
  return routesWithAccess;
}
