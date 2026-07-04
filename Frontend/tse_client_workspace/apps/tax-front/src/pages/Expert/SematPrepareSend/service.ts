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

export async function getWrongSematData({
  onSuccess,
  onFail,
  data,
}: ResultType) {
  try {
    const res = await request.get({
      baseUrl,
      url: 'Semat/GetWrongSematData',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function exportWrongSematData({
  onSuccess,
  onFail,
  data,
}: ResultType) {
  try {
    const res = await request.download({
      baseUrl,
      url: 'Semat/ExportWrongSematData',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function updateWrongSematData({
  onSuccess,
  onFail,
  data,
}: ResultType) {
  try {
    const res = await request.post({
      baseUrl,
      url: 'Semat/UpdateWrongSematData',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
