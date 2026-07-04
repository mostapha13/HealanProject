import { lazy } from '@tse/utils';
import type { RouteType } from '@tse/types';
const TalarInfo = lazy(() => import('../../pages/Public/TalarInfo'));
const NewsEventsPublic = lazy(
  () => import('../../pages/Public/NewsAndEventsPublic')
);
const InstructionsPublic = lazy(
  () => import('../../pages/Public/InstructionsPublic')
);
const InstructionsDetailsPublic = lazy(
  () =>
    import('../../pages/Public/InstructionsPublic/InstructionsDetailsPublic')
);
const NewsEventsDetailsPublic = lazy(
  () => import('../../pages/Public/NewsAndEventsPublic/NewsEventsDetailsPublic')
);

const AcceptedCompaniesPublic = lazy(
  () => import('../../pages/Public/AcceptedCompaniesPublic')
);

const Training = lazy(() => import('../../pages/Public/Training'));
const FinancialInstitutionsPublic = lazy(
  () => import('../../pages/Public/FinancialInstitutionsPublic')
);
const TradingStatisticsPublic = lazy(
  () => import('../../pages/Public/TradingStatisticsPublic')
);
const TalarReport = lazy(() => import('../../pages/Public/TalarReport'));

type RoutesType = RouteType[];

export function generateRoutes(): RoutesType {
  /** TODO: */
  return [
    // {
    //   id: 1,
    //   name: 'اطلاعات تالار',
    //   path: 'talar-info-public',
    //   component: TalarInfo,
    // },
    {
      id: 1,
      name: 'مشخصات کلی استان',
      path: 'talar-info-public',
      component: TalarInfo,
    },
    {
      id: 1,
      name: 'گزارش استان',
      path: 'talar-report',
      component: TalarReport,
      // hide: true,
    },
    {
      id: 2,
      name: 'نهادهای مالی مستقر در استان',
      path: 'financial-institutions-public',
      component: FinancialInstitutionsPublic,
    },
    {
      id: 3,
      name: 'آمار معاملات',
      path: 'trading-statistics-public',
      component: TradingStatisticsPublic,
    },
    {
      id: 4,
      name: 'اخبار, رویداد ها و اطلاعیه ها',
      path: 'news-events-public',
      component: NewsEventsPublic,
    },
    {
      id: 5,
      name: 'شرح خبر',
      path: 'news-events-details-public',
      component: NewsEventsDetailsPublic,
      hide: true,
    },
    {
      id: 6,
      name: 'دستورالعمل تامین مالی و پذیرش',
      path: 'https://www.tse.ir/download-center?cat=3',
      component: InstructionsPublic,
      external: true,
    },
    {
      id: 7,
      name: 'شرح دستورالعمل',
      path: 'instructions-details-public',
      component: InstructionsDetailsPublic,
      hide: true,
    },
    {
      id: 8,
      name: 'ناشران استانی',
      path: 'provincial-publishers-public',
      component: AcceptedCompaniesPublic,
    },
    {
      id: 9,
      name: 'دوره های آموزشی',
      path: 'training-requests',
      component: Training,
    },
  ];
}
