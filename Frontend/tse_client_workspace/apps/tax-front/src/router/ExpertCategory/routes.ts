import { Outlet, lazy } from '@tse/utils';
import type { RouteType } from '@tse/types';
const Dashboard = lazy(() => import('../../pages/Expert/Dashboard'));
const SendPackage = lazy(() => import('../../pages/Expert/SendPackage'));
const InvoiceDetails = lazy(() => import('../../pages/Expert/InvoiceDetails'));
const SetBasicInfo = lazy(() => import('../../pages/Expert/SetBasicInfo'));
const SetPeriod = lazy(() => import('../../pages/Expert/SetPeriod'));
const RemoveSamatData = lazy(
  () => import('../../pages/Expert/RemoveSamatData')
);
const SetKeyAndUniqueId = lazy(
  () => import('../../pages/Expert/SetKeyAndUniqueId')
);
const SetSamatOffset = lazy(() => import('../../pages/Expert/SetSamatOffset'));
const AddendumGrid = lazy(
  () => import('../../pages/Expert/Addendum/AddendumGrid')
);
const AddendumSend = lazy(
  () => import('../../pages/Expert/Addendum/AddendumSend')
);
const CancelationPackage = lazy(
  () => import('../../pages/Expert/CancelationPackage')
);
const ManagerInvoiceDetails = lazy(
  () => import('../../pages/Manager/ManagerInvoiceDetails')
);
const NavigatePage = lazy(() => import('../../pages/NavigatePage'));

const SetBuyersCode = lazy(() => import('../../pages/Expert/SetBuyersCode'));
const SetServicesCode = lazy(
  () => import('../../pages/Expert/SetServicesCode')
);
const SematPrepareSend = lazy(
  () => import('../../pages/Expert/SematPrepareSend')
);
const ReportInvoice = lazy(() => import('../../pages/Expert/ReportInvoice'));
const CalibrationInformation = lazy(
  () => import('../../pages/Expert/CalibrationInformation')
);
const ReportHistory = lazy(() => import('../../pages/Expert/ReportHistory'));
const DownloadForms = lazy(() => import('../../pages/Expert/DownloadForms'));
const ExportSematInformation = lazy(
  () => import('../../pages/Expert/ExportSematInformation')
);

type RoutesType = RouteType[];
interface PropsTypes {
  role?: 'TaxUser' | 'TaxAdmin' | string;
}
export function generateRoutes({ role }: PropsTypes = {}): RoutesType {
  const mockRole: string = 'TaxUser';
  if (role === 'TaxUser') {
    return [
      {
        id: 0,
        path: 'dashboard',
        name: 'داشبورد کارشناس',
        component: Dashboard,
      },
      {
        id: 1,
        path: 'invoice',
        name: 'فرآیندهای صورتحساب',
        component: Outlet,
        nested: [
          {
            id: 19,
            path: 'clear-data-package',
            name: 'کالیبر اطلاعات',
            component: CalibrationInformation,
          },
          {
            id: 18,
            path: 'send-package',
            name: 'ارسال بسته',
            component: SendPackage,
          },
        ],
      },
      {
        id: 2,
        path: 'basic-info',
        name: 'اطلاعات پایه',
        component: Outlet,
        nested: [
          {
            id: 29,
            path: 'set-basic-info',
            name: 'تعریف مقادیر صورتحساب',
            component: SetBasicInfo,
          },
          {
            id: 28,
            path: 'set-period',
            name: 'تعریف دوره',
            component: SetPeriod,
          },
          {
            id: 27,
            path: 'set-key',
            name: 'تعریف کلید و شناسه یکتا',
            component: SetKeyAndUniqueId,
          },
          {
            id: 26,
            path: 'set-buyers-code',
            name: 'تعریف کد خریداران',
            component: SetBuyersCode,
          },
          {
            id: 25,
            path: 'set-services-code',
            name: 'تعریف کد خدمات',
            component: SetServicesCode,
          },
          {
            id: 24,
            path: 'download-form',
            name: 'دانلود فرمت استاندارد',
            component: DownloadForms,
          },
        ],
      },
      {
        id: 3,
        path: 'setting',
        name: 'سمات',
        component: Outlet,
        nested: [
          {
            id: 39,
            path: 'set-semat-offset',
            name: 'وضعیت اطلاعات سمات',
            component: SetSamatOffset,
          },
          {
            id: 38,
            path: 'semat-pre-send',
            name: 'آماده‌سازی سمات',
            component: SematPrepareSend,
          },
          {
            id: 39,
            path: 'semat-export-information',
            name: 'خروجی اطلاعات سمات',
            component: ExportSematInformation,
          },
        ],
      },
      // {
      //   id: 4,
      //   path: 'remove-semat-data',
      //   name: 'ابطال اطلاعات سمات',
      //   component: RemoveSamatData,
      // },
      {
        id: 4,
        path: 'report-history',
        name: 'گزارش سوابق',
        component: ReportHistory,
      },
      {
        id: 5,
        path: 'invoice-details',
        name: 'جزئیات صورتحساب',
        component: InvoiceDetails,
        hide: true,
      },
      {
        id: 6,
        path: 'addenduum-grid',
        name: 'لیست الحاقیه',
        component: AddendumGrid,
        hide: true,
      },
      {
        id: 7,
        path: 'send-addenduum',
        name: 'ارسال الحاقیه',
        component: AddendumSend,
        hide: true,
      },
      {
        id: 8,
        path: 'cancel-package',
        name: 'ابطال',
        component: CancelationPackage,
        hide: true,
      },
      {
        id: 9,
        path: 'manager-invoice-details',
        name: 'جزئیات صورتحساب مدیر',
        component: ManagerInvoiceDetails,
        hide: true,
      },
      {
        id: 10,
        path: 'report-invoice',
        name: 'گزارش صورتحساب ',
        component: ReportInvoice,
        hide: true,
      },
    ];
  } else if (role === 'TaxAdmin') {
    return [
      {
        id: 100,
        path: 'dashboard',
        name: 'داشبورد مدیر',
        component: Dashboard,
      },
      {
        id: 101,
        path: 'invoice-details',
        name: 'جزئیات صورتحساب',
        component: InvoiceDetails,
        hide: true,
      },
    ];
  } else return [];
}
