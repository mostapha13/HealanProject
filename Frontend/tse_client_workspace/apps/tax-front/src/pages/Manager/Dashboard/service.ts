import { loadFromStorage, request } from '@tse/tools';
import { baseUrl } from '../../../constants';

interface ReturnType {
  onSuccess: (param: any) => void;
  onFail: (error: any) => void;
}

interface ResultType extends ReturnType {
  year?: string;
  id?: string;
}

export async function getTradingStatistics({
  year,
  id,
  onSuccess,
  onFail,
}: ResultType) {
  try {
    const res = await request.get({
      baseUrl,
      url: 'Trading_Statistics/Get',
      options: { Year: year, TalarId: id },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
