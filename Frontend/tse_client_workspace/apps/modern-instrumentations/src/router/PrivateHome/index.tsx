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
} from '@tse/utils';
import { removeItemFromStorage, request, loadFromStorage } from '@tse/tools';
import { Navbar, Sidebar } from '@tse/components/templates';
import AdminPanel from '../../assets/images/AdminPanel.png';
import { generateRoutes } from './routes';
import { baseUrl } from '../../constants';
import { userInfoAtom } from '../../store/userProfile';
import withAlert from '../../hoc/withAlert';

interface HomeType {
  onAlert: onAlertProps;
}

function Home(props: HomeType): ReactElement {
  const { onAlert } = props;
  const navigate = useNavigate();
  const [info, setInfo] = useRecoilState(userInfoAtom);
  const routes: RouteType[] = generateRoutes();

  useEffect(() => {
    getProfile({
      onSuccess: (res: any) => setInfo(res),
      onFail,
    });
  }, []);

  function handleSubmitLogin() {
    postLogout({ onSuccess, onFail: onSuccess });
  }

  const onSuccess = () => {
    removeItemFromStorage('token');
    removeItemFromStorage('isLogin');
    navigate('/login', { replace: false });
  };

  const onFail = (error: ErrorType) => {
    onAlert({ error: error.data });
  };

  return (
    <>
      <Navbar
        nameLogo={AdminPanel}
        onExit={handleSubmitLogin}
        userInfo={`${info.userName}`}
      />
      <div className="grid grid-cols-12 gap-4 p-10 overflow-hidden min-h-screen">
        {/* <Sidebar
          className="2xl:col-span-3 xl:col-span-3 lg:col-span-3 md:col-span-3"
          routes={routes}
          Link={({ href, ...rest }: any) => <Link to={href} {...rest} />}
        /> */}
        <div className="2xl:col-span-12 xl:col-span-12 lg:col-span-12 md:col-span-12">
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
  const token = loadFromStorage('token');
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
