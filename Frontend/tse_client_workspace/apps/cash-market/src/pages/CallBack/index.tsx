import { connect } from 'react-redux';
import { userManager } from '../../store/userManager';
import { useEffect, useNavigate } from '@tse/utils';
import { getUserInfo } from '../../Controller';

const CallbackPage = () => {
  const navigate = useNavigate();
  const successCallback = () => {
    getUserInfo({ onSuccess: onSuccessUserInfo, onFail });
  };

  const onSuccessUserInfo = (res: any) => {
    navigate('/cartable');
    // if (res.hasConfirmed) {
    //   navigate('/cartable');
    // } else if (
    //   res.marketMakerAccessRequestId &&
    //   res.marketMakerAccessRequestStateId === 'Rejected'
    // ) {
    //   navigate('/profile');
    // }
    // else if (!res.hasConfirmed) {
    //   navigate('/profile');
    // }
    // else if (res.marketMakerAccessRequestId) {
    //   navigate('/profile-detail');
    // }
  };

  const onFail = (error: any) => {
    if (error?.status === 401) {
      navigate('/home');
    }
  };

  const errorCallback = () => {
    navigate('/home');
  };

  useEffect(() => {
    userManager
      .signinRedirectCallback()
      .then(() => successCallback())
      .catch(() => errorCallback());
  }, []);

  return (
    <div className="p-6">
      <span className="font-extra-bold text-2xl">
        شما در حال انتقال به صفحه مورد نظر هستید...
      </span>
    </div>
  );
};

export default connect()(CallbackPage);
