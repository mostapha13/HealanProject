import { loadFromStorage, request } from '@tse/tools';
import { baseUrl } from '../../../constants';

interface ReturnType {
  onSuccess: (param: any) => void;
  onFail: (error: any) => void;
}
interface ResultType<T = void> extends ReturnType {
  date?: any;
  description?: string;
  pageNumber?: any;
  pageSize?: any;
}

export async function removeSematData({
  onSuccess,
  onFail,
  date,
  description,
}: ResultType) {
  try {
    const res = await request.post({
      baseUrl,
      url: 'Semat/InvestorsReload',
      options: { reloadDate: date, description: description },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function removeSematDataTable({
  onSuccess,
  onFail,
  pageNumber,
  pageSize,
}: ResultType) {
  try {
    const res = await request.get({
      baseUrl,
      url: 'Semat/GetInvestorsReloaded',
      options: {
        pageNumber: pageNumber,
        pageSize: pageSize,
      },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
