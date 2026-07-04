import { loadFromStorage, request, loadFromSession } from '@tse/tools';
import { baseUrl } from '../../../constants';

interface ReturnType {
  onSuccess: (param: any) => void;
  onFail: (error: any) => void;
}

interface ResultType extends ReturnType {
  data?: any;
  id?: string;
  Filter?: string;
  PageSize?: number;
  PageNumber?: number;
  AscSort?: string | boolean;
  SrtField?: string | number;
  TalarId?: string;
}
const token = loadFromSession('token');
export async function insertTalarBanner({ data, onSuccess, onFail }: any) {
  try {
    const res = await request.post({
      baseUrl,
      url: 'TalarBanner',
      options: data,
      token,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function deleteTalarBanner({ id, onSuccess, onFail }: any) {
  try {
    const res = await request.delete({
      baseUrl,
      url: `TalarBanner/${id}`,
      token,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getTalarBanner({
  onSuccess,
  onFail,
  TalarId,
}: ResultType) {
  try {
    const res = await request.get({
      baseUrl,
      url: 'TalarBanner',
      options: { talarId: TalarId },
      token,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
