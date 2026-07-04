import { connect } from 'react-redux';
import { userManager } from '../../store/userManager';
import { useEffect, useNavigate } from '@tse/utils';

const CallbackPage = () => {
  const navigate = useNavigate();
  const successCallback = () => {
    navigate('/');
  };

  const errorCallback = (e: any) => {
    if (e != 'Error: No matching state found in storage') {
      navigate('/');
    }

    // props.dispatch(push('/'));
  };

  useEffect(() => {
    userManager
      .signinRedirectCallback()
      .then((user) => {
        if (user && user.state) {
          successCallback();
        }
      })
      .catch((e: any) => errorCallback(e));
  }, []);

  return <div>Loading...</div>;
};

export default connect()(CallbackPage);
