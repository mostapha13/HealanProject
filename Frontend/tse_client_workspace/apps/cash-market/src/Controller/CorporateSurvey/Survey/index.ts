import { request } from '@tse/tools';
import { CORPORATE_SURVEY_BASE_URL } from 'apps/cash-market/src/constants';

interface requestInterface {
  data?: any;
  onSuccess: (e: any) => void;
  onFail: (e: any) => void;
}
interface ResultType extends requestInterface {
  orderId?: string;
}

export async function get({ data, onSuccess, onFail }: requestInterface) {
  const url = '';
  try {
    const res = await request.get({
      baseUrl: CORPORATE_SURVEY_BASE_URL,
      url,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
