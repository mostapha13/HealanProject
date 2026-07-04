import { Suspense, Routes, Route, Navigate, lazy } from '@tse/utils';
import { Loading } from '@tse/components/atoms';
import { userManager } from '../store/userManager';
import axios from 'axios';
import InsideryStaff from '../components/Insidery/InsideryStaff';
import InsideryPage from '../pages/Insidery/InsideryPage';

const Home = lazy(() => import('../pages/Home'));
const CallBack = lazy(() => import('../pages/CallBack'));
const ListingStockProcesses = lazy(
  () => import('../pages/Listing/Stock/Processes')
);

export default function App() {
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
          <Loading color="bg-blue" />
        </div>
      }
    >
      <div className="sm:hidden xs:hidden">
        <Routes>
          <Route path="/" element={<Navigate replace to="/healan" />} />
          <Route path="/*" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/callback" element={<CallBack />} />
          <Route
            path="listing-processes-stock"
            element={<ListingStockProcesses />}
          />

          <Route path="/Insidery/Insidery-staff" element={<InsideryPage />} />
        </Routes>
      </div>
    </Suspense>
  );
}
