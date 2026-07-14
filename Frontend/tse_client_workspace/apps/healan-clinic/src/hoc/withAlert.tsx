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

/**
 * On 401: only force OIDC login when there is NO valid local session.
 * If we already have a token, Healan API rejection must NOT restart the login loop.
 */
async function handleUnauthorized() {
  try {
    const user = await userManager.getUser();
    if (user && !user.expired && user.access_token) {
      notification.config({ rtl: true, duration: 6 });
      notification.error({
        message: 'دسترسی به سرویس clinic برقرار نشد',
        description: 'نشست شما معتبر است ولی API هیلان توکن را نپذیرفت. صفحه را رفرش کنید یا با پشتیبانی تماس بگیرید.',
        placement: 'bottomRight',
      });
      return;
    }
  } catch {
    // fall through to login
  }

  const last = Number(sessionStorage.getItem('healan_401_redirect_at') || '0');
  if (Date.now() - last < 60_000) {
    notification.config({ rtl: true, duration: 8 });
    notification.error({
      message: 'ورود در حلقه افتاده است',
      description: 'لطفاً صفحه را ببندید و دوباره وارد شوید.',
      placement: 'bottomRight',
    });
    return;
  }

  sessionStorage.setItem('healan_401_redirect_at', String(Date.now()));
  setTimeout(() => userManager.signinRedirect({ data: 'redirect' }), 800);
}

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
          void handleUnauthorized();
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
        void handleUnauthorized();
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
