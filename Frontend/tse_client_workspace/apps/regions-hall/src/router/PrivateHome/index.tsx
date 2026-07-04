/* eslint-disable react-hooks/exhaustive-deps */
import type {
  ErrorType,
  onAlertProps,
  ReactElement,
  RouteType,
} from '@tse/types';
import {
  Routes,
  Route,
  Link,
  useNavigate,
  useRecoilState,
  useEffect,
  axios,
  useState,
} from '@tse/utils';
import {
  removeItemFromStorage,
  request,
  loadFromStorage,
  saveToStorage,
  loadFromSession,
  removeItemFromSession,
} from '@tse/tools';
import { Navbar, Sidebar } from '@tse/components/templates';
import AdminPanel from '../../assets/images/AdminPanel.png';
import { generateRoutes } from './routes';
import { baseUrl } from '../../constants';
import { userInfoAtom } from '../../store/userProfile';
import withAlert from '../../hoc/withAlert';
import { userManager } from '../../store/userManager';

interface HomeType {
  onAlert: onAlertProps;
}

function Home(props: HomeType): ReactElement {
  const { onAlert } = props;
  const [info, setInfo] = useRecoilState(userInfoAtom);
  const [roleState, setRoleState] = useState<any>('');
  const [roleTitle, setRoleTitle] = useState<any>('');
  const [profile, setProfile] = useState<any>({});
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    const role = info?.roleNames.filter((item: any) =>
      item.startsWith('RegionHall')
    );
    setRoleState(role);

    // .map((roleInfo) => {
    //   setRoleState(roleInfo.roleName);
    //   setRoleTitle(roleInfo.roleTitle);
    // });
  }, [info]);
  const routes: RouteType[] = generateRoutes({ role: roleState?.[0] });
  const navigate = useNavigate();
  // userManager.getUser().then((user) => {
  //   if (!user?.expired) {
  //     // Set the authorization header for axios
  //     axios.defaults.headers.common['Authorization'] =
  //       'Bearer ' + user?.access_token;
  //   }
  // });
  useEffect(() => {
    setLoading(true);
    getProfile({
      onSuccess,
      onFail,
    });
  }, []);
  const onSuccess = (res?: any) => {
    const profileData = loadFromSession('profileData');
    setInfo(profileData);
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
  // function handleSubmitLogin() {
  //   postLogout({ onSuccess, onFail });
  // }
  const handleLogOut = (event: any) => {
    event.preventDefault();
    userManager.signoutRedirect();
    userManager.removeUser();
    removeItemFromStorage('token');
    removeItemFromStorage('isLogin');
    removeItemFromSession('profileData');
    removeItemFromSession('token');
    saveToStorage('logout', true);
    // navigate('/', { replace: false });
  };
  // const onSuccess = () => {
  //   removeItemFromStorage('token');
  //   removeItemFromStorage('isLogin');
  //   navigate('/login', { replace: false });
  // };

  const onFail = (error: ErrorType) => {
    onAlert?.(error);
  };

  return (
    <>
      <Navbar
        nameLogo={AdminPanel}
        onExit={handleLogOut}
        userInfo={
          <div className="flex-col flex items-center">
            <span className="font-semibold">{`${info.firstname} ${info.lastname}`}</span>
            {info.talarName && (
              <span className="text-extratiny text-grayBorder">{`${info.talarName}`}</span>
            )}
          </div>
        }
      />
      <div className="grid grid-cols-12 gap-4 p-10 overflow-hidden min-h-screen">
        <Sidebar
          className="2xl:col-span-3 xl:col-span-3 lg:col-span-3 md:col-span-3"
          routes={routes}
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
export default withAlert(Home);

async function getProfile({ onSuccess, onFail }: any) {
  const token = loadFromSession('token');
  try {
    const res = await request.get({
      baseUrl,
      url: 'Account/GetProfile',
      token,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

async function postLogout({ onSuccess, onFail }: any) {
  try {
    const res = await request.get({
      baseUrl,
      url: 'Account/LogOut',
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
