import { connect } from 'react-redux';
import { userManager } from '../../store/userManager';
import { useEffect, useNavigate, useRecoilState } from '@tse/utils';
import {
  loadFromSession,
  loadFromStorage,
  request,
  saveToSession,
  saveToStorage,
} from '@tse/tools';
import { baseUrl } from '../../constants';
import { userInfoAtom } from '../../store/userProfile';

const CallbackPage = () => {
  const navigate = useNavigate();
  const [info, setInfo] = useRecoilState(userInfoAtom);

  const successCallback = (user: any) => {
    // saveToStorage('token', user.access_token);
    saveToStorage('isLogin', true);
    handleGetProfile();
    saveToSession('token', user.access_token);
  };

  const errorCallback = (e: any) => {
    if (e != 'Error: No matching state found in storage') {
      handleGetProfile();
    }

    // props.dispatch(push('/'));
  };

  useEffect(() => {
    userManager
      .signinRedirectCallback()
      .then((user) => {
        if (user && user.state) {
          successCallback(user);
        }
      })
      .catch((e: any) => errorCallback(e));
  }, []);
  function handleGetProfile() {
    getProfile({
      onSuccess,
      onFail,
    });
  }

  const onSuccess = (res?: any) => {
    setInfo(res);
    const role = res?.roleNames.filter((item: any) =>
      item.startsWith('RegionHall')
    );
    if (res?.userTalars?.length > 1) {
      // saveToStorage('profileData', res);
      saveToSession('profileData', res);
      navigate('/select-province', { replace: false });
    } else {
      saveToSession('profileData', {
        ...res,
        talar_ID: res?.userTalars?.[0]?.talar_ID,
        talarName: res?.userTalars?.[0]?.talarName,
      });
      if (role?.[0] === 'RegionHallAdmin') {
        navigate('/dashboard/user-definition', { replace: false });
        return;
      } else if (role?.[0] === 'RegionHallFieldWorker') {
        navigate('/dashboard/submit-info/trading-statistics', {
          replace: false,
        });
        return;
      }
      navigate('/dashboard/submit-info/province-details', { replace: false });
    }
  };

  const onFail = (error: any) => {
    if (error?.status == 401) {
      const logout = loadFromStorage('logout');
      if (logout) {
        navigate('/');
      } else {
        navigate('/login');
      }
    }
    // props.onAlert(error);
  };

  return (
    <div>
      <span className="flex font-extra-bold mt-10 mx-4">
        شما در حال انتقال به صفحه مورد نظر هستید...
      </span>
    </div>
  );
};

export default connect()(CallbackPage);
export async function getProfile({ onSuccess, onFail }: any) {
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
