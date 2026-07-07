import React from 'react';

import { notification } from 'antd';

import { userManager } from '../store/userManager';

import { parseApiError } from '../utils/parseApiError';



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

      if (typeof msg === 'object' && msg !== null && 'type' in msg) {

        const alert = msg as AlertTypes;

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

        } else if (typeof message === 'string' && message) {

          newMessage = message;

        }



        notification.config({ rtl: true, duration: 5 });

        notification[type]({ message: newMessage, description, placement: 'bottomRight' });

        return;

      }



      const parsed = parseApiError(msg);

      if (parsed.status === 401) {

        setTimeout(() => userManager.signinRedirect({ data: 'redirect' }), 1500);

        return;

      }

      notification.config({ rtl: true, duration: 5 });

      notification[parsed.type]({

        message: parsed.message,

        description: parsed.description,

        placement: 'bottomRight',

      });

    };



    return <Component {...(props as P)} onAlert={onAlert} />;

  };



  return Wrapper;

};



export default ContainerAlert;


