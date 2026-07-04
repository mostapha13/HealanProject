import { request } from '@tse/tools';
import { baseUrl, captchaBaseUrl } from '../../constants';

export async function postLogin({ data, onSuccess, onFail }: any) {
  try {
    const res = await request.post({
      baseUrl,
      url: 'Account/Login',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getCaptcha({ onSuccess, onFail }: any) {
  try {
    const res = await request.get({
      baseUrl: captchaBaseUrl,
      url: 'Get',
    });
    onSuccess(res);
  } catch (error: any) {
    onFail(error);
  }
}
export async function getProfile({ onSuccess, onFail }: any) {
  // const token = loadFromStorage('token');
  try {
    const res = await request.get({
      baseUrl,
      url: 'Account/GetProfile',
      // token,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
