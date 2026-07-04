import { loadFromStorage, request, loadFromSession } from '@tse/tools';
import { baseUrl } from '../../../constants';

export async function updateTalarInfo({ data, onSuccess, onFail }: any) {
  const token = loadFromSession('token');
  try {
    const res = await request.post({
      baseUrl,
      url: 'TalarInfo/Update',
      options: data,
      token,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function getTalarInfo({ id, onSuccess, onFail }: any) {
  const token = loadFromSession('token');
  try {
    const res = await request.get({
      baseUrl,
      url: 'TalarInfo/GetOne',
      token,
      options: { id },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function getOstanType({ id, onSuccess, onFail }: any) {
  const token = loadFromSession('token');
  try {
    const res = await request.get({
      baseUrl,
      url: 'OstanType/Get',
      token,
      options: { id },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
