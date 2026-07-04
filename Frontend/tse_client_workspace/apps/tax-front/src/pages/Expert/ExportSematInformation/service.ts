import { loadFromStorage, request } from '@tse/tools';
import { baseUrl } from '../../../constants';

interface ReturnType {
  onSuccess: (param: any) => void;
  onFail: (error: any) => void;
}
interface ResultType<T = void> extends ReturnType {
  data?: object;
  id?: any;
  pickupTime?: any;
}

export async function exportSematDataThirdParty({
  onSuccess,
  onFail,
  data,
}: ResultType) {
  try {
    const res = await request.download({
      baseUrl,
      url: 'Semat/ExportSematDataThirdParty',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
