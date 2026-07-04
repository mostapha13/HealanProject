import { loadFromStorage, request } from '@tse/tools';
import { baseUrl } from '../../../constants';

interface ReturnType {
  onSuccess: (param: any) => void;
  onFail: (error: any) => void;
}

interface ResultType extends ReturnType {
  year?: string;
  id?: string;
  type?: string;
}

export async function getTradingStatistics({
  year,
  id,
  type,
  onSuccess,
  onFail,
}: ResultType) {
  try {
    const res = await request.get({
      baseUrl,
      url: 'Trading_Statistics',
      options: { year: year, talarId: id, type: type },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function exportTradingStatistics({
  year,
  id,
  onSuccess,
  onFail,
}: ResultType) {
  try {
    const res = await request.get({
      baseUrl,
      url: 'Trading_Statistics',
      options: { year: year, talarId: id },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
