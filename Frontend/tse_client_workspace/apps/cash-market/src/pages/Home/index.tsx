/* eslint-disable @nrwl/nx/enforce-module-boundaries */
/* eslint-disable react-hooks/exhaustive-deps */
import type { ReactElement, RouteType } from '@tse/types';
import {
  Routes,
  Route,
  Link,
  useEffect,
  useState,
  useNavigate,
} from '@tse/utils';
import { Navbar, Sidebar } from '@tse/components/templates';
import AdminPanel from '../../assets/images/adminPanel.png';
import { generateRoutes } from '../../router/routes';
import withAlert from '../../hoc/withAlert';
import {
  saveToStorage,
  loadFromStorage,
  saveToSession,
  removeItemFromSession,
  loadFromSession,
} from '@tse/tools';
import { userManager } from '../../store/userManager';
import { getNotificationList, getUserInfo } from '../../Controller';

function Home({ onAlert }: any): ReactElement {
  const navigate = useNavigate();
  const userRole = loadFromStorage('hasAccess') ? 'Admin' : 'MarketMaker'; //? 'Admin' : 'User'
  const routes: RouteType[] = generateRoutes({
    role: userRole,
  });
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isDisable, setDisable] = useState(false);
  const [notificationData, setNotificationData] = useState<any>(null);
  const userId = loadFromSession('hasId');

  useEffect(() => {
    getUserInfoAction();
    getNotificationListData();
  }, []);

  const getUserInfoAction = () => {
    getUserInfo({ onSuccess: onSuccessUserInfo, onFail });
  };

  const onFail = (error: any) => {
    onAlert(error);
  };

  const onSuccessUserInfo = (res: any) => {
    saveToStorage('hasAccess', res.hasAccessToConfirmForm);
    saveToSession('hasId', res?.userSummaryReply?.userId);
    setUserInfo(res.userSummaryReply);
    setDisable(res.hasConfirmed);
    saveToSession('isCashMarketBroker', res?.isCashMarketBroker);
  };
  const getNotificationListData = () => {
    const data = {
      View_Type: 'Unreaded',
      PageNumber: 1,
      PageSize: 4,
    };
    getNotificationList({
      data: data,
      onSuccess: onSuccessNotificationData,
      onFail,
    });
  };
  const onSuccessNotificationData = (res: any) => {
    setNotificationData(res);
  };

  const logOut = (event: any) => {
    event.preventDefault();
    userManager.signoutRedirect();
    userManager.removeUser();
    removeItemFromSession('hasId');
    removeItemFromSession('isCashMarketBroker');
  };
  const goToProfile = () => {
    navigate('/profile-detail');
  };

  const hasAccess = loadFromStorage('hasAccess') ? true : false;
  return userId != null ? (
    <>
      <Navbar
        nameLogo={AdminPanel}
        onExit={logOut}
        userInfo={`${userInfo?.firstName || ''} ${userInfo?.lastName || ''}`}
        {...(!hasAccess && { goToProfile: goToProfile })}
        notificationData={notificationData}
      />
      <div className="grid grid-cols-12 gap-4 p-10 overflow-hidden">
        <Sidebar
          className="2xl:col-span-3 xl:col-span-3 lg:col-span-3 md:col-span-3"
          routes={routes}
          Link={({ href, ...rest }: any) => <Link to={href} {...rest} />}
          color="text-blue"
          title="عملیات بازار"
          disabled={false}
          hoverColor="text-blue"
          // disabled={!isDisable}
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
  ) : (
    <div className="p-6">
      <span className="font-extra-bold text-2xl">
        شما در حال انتقال به صفحه مورد نظر هستید...
      </span>
    </div>
  );
}
export default withAlert(Home);
