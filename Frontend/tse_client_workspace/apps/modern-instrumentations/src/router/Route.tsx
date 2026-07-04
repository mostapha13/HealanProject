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

const Login = lazy(() => import('../pages/Login'));
const PrivateHome = lazy(() => import('./PrivateHome'));
// const NotFound = lazy(() => import('../pages/NotFound'));

export default function PrivateRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 h-screen justify-center items-center">
          <Loading color="bg-teal" />
        </div>
      }
    >
      <div className="sm:hidden xs:hidden min-h-screen">
        <Routes>
          <Route path="/login" element={<Login />} />{' '}
          <Route path="/" element={<Navigate replace to="/dashboard/list" />} />
          <Route
            path="/dashboard/*"
            element={
              <RequireAuth>
                <PrivateHome />
              </RequireAuth>
            }
          />
          {/* <Route path="*" element={<NotFound />} /> */}
        </Routes>
      </div>
    </Suspense>
  );
}

function RequireAuth({ children }: { children: JSX.Element }) {
  const isLogin = loadFromStorage('isLogin');
  const location = useLocation();
  /** TODO */
  if (!isLogin) {
    return <Navigate to="/login" state={{ from: location }} />;
  }
  return children;
}
