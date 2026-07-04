import { loadFromStorage, request } from '@tse/tools';
import { baseUrl } from '../../../constants';

interface ReturnType {
  onSuccess: (param: any) => void;
  onFail: (error: any) => void;
}
interface ResultType<T = void> extends ReturnType {
  data?: any;
}

export async function setPeriod({ onSuccess, onFail, data }: ResultType) {
  try {
    const res = await request.post({
      baseUrl,
      url: 'Invoice/AddPeriod',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getAllPeriod({ onSuccess, onFail }: ReturnType) {
  try {
    const res = await request.get({
      baseUrl,
      url: 'Invoice/GetAllPeriods',
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
