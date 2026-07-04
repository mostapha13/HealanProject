/* eslint-disable react/prop-types */
import { notification } from 'antd';
import { userManager } from '../store/userManager';

const defaultMessage = 'خطایی رخ داده است';

interface AlertTypes {
  message?: string;
  type: 'error' | 'success';
  description?: string;
  error?: any;
  data?: any;
  status?: number;
}

const duration = 3;

const ContainerAlert = (Component?: any) => {
  const wrapper = (props: any) => {
    const onAlert = (
      { message, type, description, data, status }: AlertTypes = {
        type: 'error',
        message: defaultMessage,
      }
    ) => {
      let newMessage: any = '';
      /** other logics comes in here */

      const isUnAuthorize = status === 401;
      if (isUnAuthorize) {
        setTimeout(() => {
          userManager.signinRedirect({
            data: 'redirect',
          });
        }, 2000);
      } else {
        if (data && data?.errors) {
          const key: any = Object.keys(data.errors);
          const isArray = Array.isArray(key);
          const objKey = isArray ? key[0] : key;
          const obj = message
            ? message
            : data?.errors[objKey] && Object.values(data.errors[objKey]);

          newMessage = obj;
        } else if (typeof message === 'string') {
          newMessage = message;
        } else {
          newMessage = defaultMessage;
        }
        openNotification({ message: newMessage, type, description });
      }
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
