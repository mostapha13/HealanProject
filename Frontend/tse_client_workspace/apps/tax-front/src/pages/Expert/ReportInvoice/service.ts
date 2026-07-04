import { loadFromStorage, request } from '@tse/tools';
import { baseUrl } from '../../../constants';

interface ReturnType {
  onSuccess: (param: any) => void;
  onFail: (error: any) => void;
}
interface ResultType<T = void> extends ReturnType {
  id?: any;
  periodId?: any;
}

export async function getEndPeriodReport({
  onSuccess,
  onFail,
  periodId,
}: ResultType) {
  try {
    const res = await request.get({
      baseUrl,
      url: 'Invoice/EndPeriodReport',
      options: { periodId: parseInt(periodId) },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
