import React from 'react';
import { notification } from 'antd';
import { userManager } from '../store/userManager';

const defaultMessage = 'خطایی رخ داده است';

interface AlertTypes {
  message?: string;
  type: 'error' | 'success';
  description?: string;
  data?: { errors?: Record<string, string[] | string> };
  status?: number;
}

type AlertHandler = (msg?: AlertTypes | unknown) => void;

const ContainerAlert = <P extends { onAlert?: AlertHandler }>(
  Component: React.ComponentType<P>
) => {
  type OuterProps = Omit<P, 'onAlert'>;

  const Wrapper = (props: OuterProps) => {
    const onAlert: AlertHandler = (msg) => {
      const alert = (typeof msg === 'object' && msg !== null && 'type' in msg
        ? msg
        : { type: 'error' as const, message: typeof msg === 'string' ? msg : defaultMessage }) as AlertTypes;

      const { message, type = 'error', description, data, status } = alert;

      if (status === 401) {
        setTimeout(() => userManager.signinRedirect({ data: 'redirect' }), 1500);
        return;
      }

      let newMessage: string = defaultMessage;
      if (data?.errors) {
        const key = Object.keys(data.errors)[0];
        const val = data.errors[key];
        newMessage = message ?? (Array.isArray(val) ? String(val[0]) : String(val));
      } else if (typeof message === 'string') {
        newMessage = message;
      }

      notification.config({ rtl: true, duration: 3 });
      notification[type]({ message: newMessage, description, placement: 'bottomRight' });
    };

    return <Component {...(props as P)} onAlert={onAlert} />;
  };

  return Wrapper;
};

export default ContainerAlert;
