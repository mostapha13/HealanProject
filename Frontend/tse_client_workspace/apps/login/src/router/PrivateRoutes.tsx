import { Suspense, Routes, Route, lazy } from '@tse/utils';
import { Loading } from '@tse/components/atoms';

const Login = lazy(() => import('../pages/Login'));

export default function App() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 h-screen justify-center items-center">
          <Loading color="bg-blue" />
        </div>
      }
    >
      <div className="sm:hidden xs:hidden">
        <Routes>
          <Route path="/*" element={<Login />} />
        </Routes>
      </div>
    </Suspense>
  );
}
