import { request } from '@tse/tools';

const BASE_URL = '/UserManager/api/v1/User/';

interface requestInterface {
  data?: any;
  onSuccess: (e: any) => void;
  onFail: (e: any) => void;
}

export const getCaptcha = ({ onSuccess, onFail }: requestInterface) => {
  const url = '';
  request
    .get({
      baseUrl: '/CaptchaProvider/api/v1/Captcha/Get',
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const Login = ({ data, onSuccess, onFail }: requestInterface) => {
  const url = 'Login';
  request
    .post({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const Login2FA = ({ data, onSuccess, onFail }: requestInterface) => {
  const url = 'Login2FA';
  request
    .post({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const forgetPassword = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'ForgetPassword';
  request
    .post({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const ResetPassword = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'ResetPassword';
  request
    .post({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
