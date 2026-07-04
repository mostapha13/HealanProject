import {
  Suspense,
  Routes,
  Route,
  Navigate,
  useLocation,
  lazy,
} from '@tse/utils';
import { loadFromStorage } from '@tse/tools';
import { Loading } from '@tse/components/atoms';
import SelectProvince from '../pages/SelectProvince';

const Login = lazy(() => import('../pages/Login'));
const PrivateHome = lazy(() => import('./PrivateHome'));
const PublicHome = lazy(() => import('./PublicHome'));
const MapProvinceSelect = lazy(
  () => import('../pages/Public/MapProvinceSelect')
);
const CallBackPage = lazy(() => import('../pages/CallBack'));

// const NotFound = lazy(() => import('../pages/NotFound'));

export default function PrivateRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 h-screen justify-center items-center">
          <Loading />
        </div>
      }
    >
      <div className="sm:hidden xs:hidden min-h-screen">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/view/province-select-map"
            element={<MapProvinceSelect />}
          />
          <Route
            path="/"
            element={<Navigate replace to="/view/talar-info-public" />}
          />
          <Route
            path="/view/*"
            element={
              <RequireProvinceSelection>
                <PublicHome />
              </RequireProvinceSelection>
            }
          />
          <Route
            path="/dashboard/*"
            element={
              <RequireAuth>
                <PrivateHome />
              </RequireAuth>
            }
          />
          <Route path="callBack" element={<CallBackPage />} />
          <Route path="select-province" element={<SelectProvince />} />

          {/* <Route path="*" element={<NotFound />} /> */}
        </Routes>
      </div>
    </Suspense>
  );
}

function RequireAuth({ children }: { children: JSX.Element }) {
  const isLogin = loadFromStorage('isLogin');
  const location = useLocation();
  if (!isLogin) {
    return <Navigate to="/login" state={{ from: location }} />;
  }
  return children;
}

function RequireProvinceSelection({ children }: { children: JSX.Element }) {
  const isLogin = loadFromStorage('hasProvince');
  const location = useLocation();
  if (!isLogin) {
    return (
      <Navigate to="/view/province-select-map" state={{ from: location }} />
    );
  }
  return children;
}
