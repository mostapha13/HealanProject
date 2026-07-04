import { loadFromStorage, request } from '@tse/tools';
import { baseUrl } from '../../../constants';

export async function getTalarInfo({ onSuccess, onFail }: any) {
  const talarData = loadFromStorage('hasProvince');
  const guid = talarData.hasOwnProperty('guid') ? talarData.guid : '';
  try {
    const res = await request.get({
      baseUrl,
      url: 'TalarInfo/GetOne',
      options: { Id: guid },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
