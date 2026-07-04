/* eslint-disable react/prop-types */
import { notification } from 'antd';
import { removeLocalStorage } from '@tse/tools';
import { userManager } from '../store/userManager';

const defaultMessage = 'خطایی رخ داده است';

interface AlertTypes {
  message?: string;
  type: 'error' | 'success';
  description?: string;
  error?: any;
  status?: number;
  data?: any;
}

const duration = 6;

const ContainerAlert = (Component?: any) => {
  const wrapper = (props: any) => {
    const onAlert = (
      { message, type, description, error, status, data }: AlertTypes = {
        type: 'error',
        message: defaultMessage,
      }
    ) => {
      let newMessage = '';
      const isUnAuthorize = status === 401;
      if (isUnAuthorize) {
        setTimeout(() => {
          userManager.signinRedirect({
            data: 'redirect',
          });
        }, 2000);
      } else {
        if (data && data?.message && typeof data?.message === 'string') {
          newMessage = data?.message;
        } else if (message && typeof message === 'string') {
          newMessage = message;
        } else {
          newMessage = defaultMessage;
        }
        openNotification({ message: newMessage, type, description });
      }
      // if (error?.status === 401) {
      //   removeLocalStorage();
      //   window.location.replace('/login');
      // }
    };

    const openNotification = (
      { message, type = 'error', description }: AlertTypes = { type: 'error' }
    ) => {
      notification.config({
        rtl: true,
        duration,
      });
      notification[type]({
        message,
        description,
        placement: 'bottomRight',
      });
    };

    return <Component {...props} {...{ onAlert }} />;
  };
  return wrapper;
};

export default ContainerAlert;
