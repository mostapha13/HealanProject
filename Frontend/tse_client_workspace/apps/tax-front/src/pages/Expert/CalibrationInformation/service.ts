import { loadFromStorage, request } from '@tse/tools';
import { baseUrl } from '../../../constants';

interface ReturnType {
  onSuccess: (param: any) => void;
  onFail: (error: any) => void;
}
interface ResultType<T = void> extends ReturnType {
  id?: any;
  pickupTime?: any;
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
export async function cleanPeriodData({ onSuccess, onFail, id }: ResultType) {
  try {
    const res = await request.post({
      baseUrl,
      url: 'Invoice/CleanPeriodData',
      options: { periodId: id },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
