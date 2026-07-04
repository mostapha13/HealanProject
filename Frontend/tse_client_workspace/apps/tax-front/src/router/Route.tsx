import {
  Suspense,
  Routes,
  Route,
  Navigate,
  useLocation,
  lazy,
  axios,
  useRecoilState,
  useEffect,
} from '@tse/utils';
import { loadFromStorage, request } from '@tse/tools';
import { Loading } from '@tse/components/atoms';
import { TaxNavbar } from '@tse/components/templates';
import { userManager } from '../store/userManager';
import { ErrorType, onAlertProps } from '@tse/types';
const FirstPage = lazy(() => import('../pages/Expert/Dashboard'));
const Expert = lazy(() => import('./ExpertCategory'));
const CallBackPage = lazy(() => import('../pages/CallBack'));
const NavigatePage = lazy(() => import('../pages/NavigatePage'));
const SilentRenew = lazy(() => import('../pages/SilentRenew'));

export default function AllRoute(props: any) {
  userManager.getUser().then((user) => {
    if (!user?.expired) {
      // Set the authorization header for axios
      axios.defaults.headers.common['Authorization'] =
        'Bearer ' + user?.access_token;
    }
  });

  return (
    <Suspense
      fallback={
        <div className="flex flex-1 h-screen justify-center items-center">
          <Loading color="bg-teal" />
        </div>
      }
    >
      {/* <TaxNavbar userInfo={''} mainTitle={'خوش آمدید'} onExit={handleLogOut} /> */}
      <div className="sm:hidden xs:hidden min-h-screen">
        <Routes>
          {/* <Route path="/" element={<FirstPage />} />{' '} */}
          {/* <Route path="/" element={<Navigate replace to="/dashboard/list" />} /> */}
          <Route path="/user/*" element={<Expert />} />
          <Route path="callBack" element={<CallBackPage />} />
          <Route path="/" element={<NavigatePage />} />
          <Route path="/silentRenew" element={<SilentRenew />} />

          {/* <Route path="*" element={<NotFound />} /> */}
        </Routes>
      </div>
    </Suspense>
  );
}
