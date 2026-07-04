import { Navbar, Sidebar } from '@tse/components/templates';
import { Button } from '@tse/components/atoms';
import type { ErrorType, RouteType } from '@tse/types';
import { Link, Route, Routes, axios, useNavigate, useState } from '@tse/utils';
import AdminPanel from '../../assets/images/AdminPanel.png';
import { generateRoutes } from './routes';
import { removeItemFromStorage, request, saveToStorage } from '@tse/tools';
import { baseUrl, WITH_LOGIN } from '../../constants';
import { userManager } from '../../store/userManager';
import withAlert from '../../hoc/withAlert';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

function UserView(props: any) {
  const { onAlert } = props;
  const routes = generateRoutes();
  const navigate = useNavigate();
  const [isLoading, setLoading] = useState(false);
  function handleNavigateToMap() {
    removeItemFromStorage('hasProvince');
    navigate('/view/talar-info-public', { replace: false });
  }
  // userManager.getUser().then((user) => {
  //   if (!user?.expired) {
  //     console.log('user', user);
  //     // Set the authorization header for axios
  //     axios.defaults.headers.common['Authorization'] =
  //       'Bearer ' + user?.access_token;
  //   }
  // });
  const handleGetProfile = () => {
    setLoading(true);
    saveToStorage('logout', false);
    getProfile({
      onSuccess,
      onFail,
    });
  };
  const onSuccess = (res?: any) => {
    setLoading(false);
    const role = res?.roleNames.filter((item: any) =>
      item.startsWith('RegionHall')
    );
    if (role?.[0] === 'RegionHallAdmin') {
      navigate('/dashboard/user-definition', { replace: false });
      return;
    } else if (role?.[0] === 'RegionHallFieldWorker') {
      navigate('/dashboard/submit-info/trading-statistics', { replace: false });
      return;
    }
    navigate('/dashboard/submit-info/province-details', { replace: false });
  };
  const onFail = (error: ErrorType) => {
    onAlert?.(error);
    // onAlert({
    //   message: 'شما در حال انتقال به صفحه مورد نظر هستید',
    //   type: 'success',
    //   error,
    // });
  };
  const SearchProvince = () => (
    <div>
      {!isLoading ? (
        <a
          className="rounded flex justify-center items-center min-h-[2rem] bg-purple w-full mb-2 text-white hover:!bg-gray hover:!text-white"
          // href="/dashboard/submit-info/province-details"
          onClick={handleGetProfile}
        >
          ورود به سامانه مدیران
        </a>
      ) : (
        <Spin
          className="rounded flex justify-center items-center min-h-[2rem] bg-gray w-full  text-white"
          indicator={
            <LoadingOutlined style={{ fontSize: 24, color: 'white' }} spin />
          }
        />
      )}
    </div>
  );

  return (
    <>
      <Navbar
        profileIcon={false}
        nameLogo={AdminPanel}
        onExit={handleNavigateToMap}
        leftIconName="icon-world-map"
      />
      <div className="grid grid-cols-12 gap-4 p-10 overflow-hidden min-h-screen">
        <Sidebar
          className="2xl:col-span-3 xl:col-span-3 lg:col-span-3 md:col-span-3"
          routes={routes}
          header={WITH_LOGIN ? <SearchProvince /> : null}
          Link={({ href, ...rest }: any) => <Link to={href} {...rest} />}
        />
        <div className="2xl:col-span-9 xl:col-span-9 lg:col-span-9 md:col-span-9">
          <Routes>
            {routes?.map((route: RouteType) => {
              return (
                <Route
                  key={route.id}
                  path={route.path}
                  element={route.component ? <route.component /> : null}
                >
                  {route?.nested?.map((nestedRoute: RouteType) => {
                    return (
                      <Route
                        key={nestedRoute.id}
                        path={nestedRoute.path}
                        element={<nestedRoute.component />}
                      />
                    );
                  })}
                </Route>
              );
            })}
          </Routes>
        </div>
      </div>
    </>
  );
}

export default withAlert(UserView);

async function getProfile({ onSuccess, onFail }: any) {
  // const token = loadFromStorage('token');
  try {
    const res = await request.get({
      baseUrl,
      url: 'Account/GetProfile',
      // token,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
