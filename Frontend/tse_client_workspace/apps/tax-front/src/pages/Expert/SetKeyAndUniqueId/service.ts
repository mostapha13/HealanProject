import { loadFromStorage, request } from '@tse/tools';
import { baseUrl } from '../../../constants';

interface ReturnType {
  onSuccess: (param: any) => void;
  onFail: (error: any) => void;
}
interface ResultType<T = void> extends ReturnType {
  id?: any;
  publicKey?: any;
  privateKey?: any;
  uniqueId?: any;
}

export async function setPublicAndPrivateKey({
  onSuccess,
  onFail,
  id,
  publicKey,
  privateKey,
}: ResultType) {
  try {
    const res = await request.put({
      baseUrl,
      url: 'Settings/UpdateTaxSetting',
      options: { id: id, publicKey: publicKey, privateKey: privateKey },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getPublicAndPrivateKey({
  onSuccess,
  onFail,
}: ReturnType) {
  try {
    const res = await request.get({
      baseUrl,
      url: 'Settings/GetTaxSetting',
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function setUniqueId({
  onSuccess,
  onFail,
  id,
  uniqueId,
}: ResultType) {
  try {
    const res = await request.put({
      baseUrl,
      url: 'Settings/UpdateTaxKeySetting',
      options: { id: id, taxKeyDec: uniqueId },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
