import { loadFromStorage, request } from '@tse/tools';
import { baseUrl } from '../../../constants';

interface ReturnType {
  onSuccess: (param: any) => void;
  onFail: (error: any) => void;
}
interface ResultType<T = void> extends ReturnType {
  data?: any;
  id?: any;
  pickupTime?: any;
}

export async function getSematPickupTime({ onSuccess, onFail }: ReturnType) {
  try {
    const res = await request.get({
      baseUrl,
      url: 'Settings/GetSematSetting',
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function setSematPickupTime({
  onSuccess,
  onFail,
  id,
  pickupTime,
}: ResultType) {
  try {
    const res = await request.post({
      baseUrl,
      url: 'Settings/UpdateSematPickupTime',
      options: { id: id, pickupTime: pickupTime },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getSematDataReport({
  onSuccess,
  onFail,
  data,
}: ResultType) {
  try {
    const res = await request.get({
      baseUrl,
      url: 'Semat/GetSematDataReport',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
