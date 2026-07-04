import { request } from '@tse/tools';

const BASE_URL = 'https://idpx.tse.ir/account/logout';

interface requestInterface {
  data?: any;
  onSuccess: (e: any) => void;
  onFail: (e: any) => void;
}

export const testLogin = ({ onSuccess, onFail }: requestInterface) => {
  const url = '';
  request
    .get({
      baseUrl: BASE_URL,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
