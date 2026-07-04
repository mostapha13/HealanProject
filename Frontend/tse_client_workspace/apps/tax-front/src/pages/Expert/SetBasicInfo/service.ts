import { loadFromStorage, request } from '@tse/tools';
import { baseUrl } from '../../../constants';

interface ReturnType {
  onSuccess: (param: any) => void;
  onFail: (error: any) => void;
}

interface ResultType extends ReturnType {
  masterId?: string;
  data?: any;
}

export async function getAllTemplate({ onSuccess, onFail }: ReturnType) {
  try {
    const res = await request.get({
      baseUrl,
      url: 'Templates/GetAllTemplate',
      // options: { Year: year, TalarId: id },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getAllTemplateData({
  onSuccess,
  onFail,
  masterId,
}: ResultType) {
  try {
    const res = await request.get({
      baseUrl,
      url: `Templates/GetTemplateDetailsByMasterId/${masterId}`,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getFiledState({ onSuccess, onFail }: ReturnType) {
  try {
    const res = await request.get({
      baseUrl,
      url: 'Templates/GetFieldState',
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function updateTemplateDetails({
  onSuccess,
  onFail,
  data,
}: ResultType) {
  try {
    const res = await request.put({
      baseUrl,
      url: 'Templates/UpdateTemplateDetails',
      options: {
        templateDetailsInfo: data,
      },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
