/* eslint-disable react/prop-types */
import { notification } from 'antd';
import { removeLocalStorage } from '@tse/tools';

const defaultMessage = 'خطایی رخ داده است';

interface AlertTypes {
  message?: string;
  type: 'error' | 'success';
  description?: string;
  error?: any;
}

const duration = 4;

const ContainerAlert = (Component?: any) => {
  const wrapper = (props: any) => {
    const onAlert = (
      { message, type, description, error }: AlertTypes = {
        type: 'error',
        message: defaultMessage,
      }
    ) => {
      let newMessage = '';
      if (typeof message === 'string') {
        newMessage = message;
      } else {
        newMessage = defaultMessage;
      }
      openNotification({ message: newMessage, type, description });
      if (error?.status === 401) {
        removeLocalStorage();
        window.location.replace('/login');
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
