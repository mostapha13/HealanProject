import { loadFromStorage, request } from '@tse/tools';
import { baseUrl } from '../../../constants';

export async function getTalarReport({ onSuccess, onFail }: any) {
  const talarData = loadFromStorage('hasProvince');
  const guid = talarData.hasOwnProperty('guid') ? talarData.guid : '';
  try {
    const res = await request.get({
      baseUrl,
      url: 'TalarBanner/Banners',
      options: { talarId: guid },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
