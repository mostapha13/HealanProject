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
  useState,
} from '@tse/utils';
import { removeItemFromStorage, request, loadFromStorage } from '@tse/tools';
import { Navbar, Sidebar } from '@tse/components/templates';
import AdminPanel from '../../assets/images/AdminPanel.png';
import { generateRoutes } from './routes';
import { baseUrl } from '../../constants';
import withAlert from '../../hoc/withAlert';
import Menubar from '../../components/Template/MenuBar';
import { TaxNavbar } from '@tse/components/templates';
import { userManager } from 'apps/tax-front/src/store/userManager';
import { userInfoTaxAtom } from 'apps/tax-front/src/store/userProfile';

interface ExpertType {
  onAlert: onAlertProps;
}

function Expert(props: ExpertType): ReactElement {
  const { onAlert } = props;
  const [info, setInfo] = useRecoilState(userInfoTaxAtom);
  const [roleState, setRoleState] = useState<any>('');
  const [roleTitle, setRoleTitle] = useState<any>('');

  const navigate = useNavigate();

  useEffect(() => {
    getProfile({
      onSuccess: (res: any) => {
        setInfo(res);
      },
      onFail,
    });
  }, []);
  useEffect(() => {
    info?.roleInfos
      .filter((roleInfo) => roleInfo?.roleName.startsWith('Tax'))
      .map((roleInfo) => {
        setRoleState(roleInfo.roleName);
        setRoleTitle(roleInfo.roleTitle);
      });
  }, [info]);
  const routes: RouteType[] = generateRoutes({ role: roleState });
  const handleLogOut = (event: any) => {
    event.preventDefault();
    userManager.signoutRedirect();
    userManager.removeUser();
  };

  const onFail = (error: any) => {
    onAlert?.({ message: error?.data?.message || error.data, ...error });
  };

  return (
    <>
      <div />
      <TaxNavbar
        userInfo={info?.firstName + ' ' + info?.lastName}
        mainTitle={'سامانه امور مالیاتی شرکت بورس تهران'}
        onExit={handleLogOut}
        post={roleTitle}
      />
      {roleState != '' && (
        <div className="grid grid-cols-12 ">
          <Menubar
            className="2xl:col-span-12 xl:col-span-12 lg:col-span-12 md:col-span-12"
            routes={routes}
            Link={Link}
          />
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
      )}
    </>
  );
}
export default withAlert(Expert);
async function getProfile({ onSuccess, onFail }: any) {
  try {
    const res = await request.get({
      baseUrl,
      url: 'Settings/GetUserSummary',
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
