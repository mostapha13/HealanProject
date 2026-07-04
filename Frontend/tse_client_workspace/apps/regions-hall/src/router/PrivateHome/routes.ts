import { lazy, Outlet } from '@tse/utils';
import type { RouteType } from '@tse/types';
const ManagerReports = lazy(() => import('../../pages/Manager/ManagerReports'));
const AdminReports = lazy(() => import('../../pages/Admin/AdminReports'));
// const AddNewParticipants = lazy(
//   () => import('../../pages/Manager/AddNewParticipants')
// );
const AddNewCourse = lazy(() => import('../../pages/Manager/AddNewCourse'));

const ProvinceDetails = lazy(
  () => import('../../pages/Manager/ProvinceDetails')
);
const FinancialInstitutions = lazy(
  () => import('../../pages/Manager/FinancialInstitutions')
);

const TradingStatistics = lazy(
  () => import('../../pages/Manager/TradingStatistics')
);

const AcceptedCompanies = lazy(
  () => import('../../pages/Manager/AcceptedCompanies')
);
const UserDefinition = lazy(() => import('../../pages/Admin/UserDefinition'));
const NewsAndEvents = lazy(() => import('../../pages/Manager/NewsAndEvents'));
const InstructionDefinition = lazy(
  () => import('../../pages/Admin/InstructionDefinition')
);
const HallDefinition = lazy(() => import('../../pages/Admin/HallDefinition'));
const SelectProvince = lazy(() => import('../../pages/SelectProvince'));
const PictureReport = lazy(() => import('../../pages/Manager/TalarReport'));

interface PropsTypes {
  role?:
    | 'RegionHallAdmin'
    | 'RegionHallManager'
    | 'RegionHallFieldWorker'
    | string;
}

type RoutesType = RouteType[];
export function generateRoutes({ role }: PropsTypes = {}): RoutesType {
  /** TODO: */
  if (role === 'RegionHallAdmin') {
    return [
      {
        id: 0,
        path: 'user-definition',
        name: 'تعریف کاربر',
        component: UserDefinition,
      },
      {
        id: 1,
        path: 'user-instruction',
        name: 'تعریف دستور العمل',
        component: InstructionDefinition,
      },
      {
        id: 2,
        path: 'hall-definition',
        name: 'تعریف بورس منطقه ای',
        component: HallDefinition,
      },
      {
        id: 9,
        path: 'training',
        component: Outlet,
        name: 'آموزش',
        nested: [
          {
            id: 9,
            path: 'reports',
            name: 'گزارش',
            component: AdminReports,
          },
        ],
      },
    ];
  } else if (role === 'RegionHallManager') {
    return [
      {
        id: 1,
        path: 'submit-info',
        component: Outlet,
        name: 'ثبت اطلاعات',
        nested: [
          {
            id: 2,
            path: 'province-details',
            name: 'مشخصات کلی استان',
            component: ProvinceDetails,
          },
          {
            id: 3,
            path: 'province-report',
            name: 'گزارش استان',
            component: PictureReport,
            // hide: true,
          },
          {
            id: 4,
            path: 'financial-institutions',
            name: 'نهادهای مالی مستقر در استان',
            component: FinancialInstitutions,
          },

          {
            id: 5,
            path: 'news-events',
            name: 'اخبار و رویدادها',
            component: NewsAndEvents,
          },
          {
            id: 6,
            path: 'accepted-companies',
            name: 'ناشران استانی',
            component: AcceptedCompanies,
          },
        ],
      },
      {
        id: 7,
        path: 'training',
        component: Outlet,
        name: 'آموزش',
        nested: [
          {
            id: 8,
            path: 'reports',
            name: 'گزارش',
            component: ManagerReports,
          },
          {
            id: 9,
            path: 'add-new-course',
            name: 'ثبت دوره آموزشی',
            component: AddNewCourse,
          },
          // {
          //   id: 10,
          //   path: 'add-new-course-participant',
          //   name: 'ثبت شرکت کننده',
          //   component: AddNewParticipants,
          // },
        ],
      },
    ];
  } else if (role === 'RegionHallFieldWorker') {
    return [
      {
        id: 1,
        path: 'submit-info/trading-statistics',
        name: 'آمار معاملات بورس',
        component: TradingStatistics,
      },
      // {
      //   id: 100,
      //   path: 'submit-info',
      //   component: Outlet,
      //   name: 'ثبت اطلاعات',
      //   nested: [
      //     {
      //       id: 101,
      //       path: 'trading-statistics',
      //       name: 'آمار معاملات بورس',
      //       component: TradingStatistics,
      //     },
      //   ],
      // },
    ];
  }
  return [];
}
