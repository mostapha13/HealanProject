import { loadFromStorage, request } from '@tse/tools';
import { baseUrl } from '../../../constants';

interface ReturnType {
  onSuccess: (param: any) => void;
  onFail: (error: any) => void;
}
interface ResultType<T = void> extends ReturnType {
  data?: any;
  excelUrl?: any;
  pageNumber?: any;
  pageSize?: any;
  id?: any;
  value?: any;
}

export async function setServiceCode({ onSuccess, onFail, data }: ResultType) {
  try {
    const res = await request.post({
      baseUrl,
      url: 'Settings/AddServiceCode',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function setExcelServiceCode({
  onSuccess,
  onFail,
  excelUrl,
}: ResultType) {
  try {
    const res = await request.post({
      baseUrl,
      url: 'Settings/UploadExcelServiceCode',
      options: {
        excelUrl: excelUrl,
      },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getAllServiceCode({
  onSuccess,
  onFail,
  pageNumber,
  pageSize,
}: ResultType) {
  try {
    const res = await request.get({
      baseUrl,
      url: 'Settings/GetAllServiceCode',
      options: {
        pageNumber: pageNumber,
        pageSize: pageSize,
      },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function deleteServiceCode({ onSuccess, onFail, id }: ResultType) {
  try {
    const res = await request.delete({
      baseUrl,
      url: `Settings/DeleteServiceCode?id=${id}`,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function searchServiceCode({
  onSuccess,
  onFail,
  value,
  pageNumber,
  pageSize,
}: ResultType) {
  try {
    const res = await request.post({
      baseUrl,
      url: 'Settings/SearchServiceCode',
      options: {
        value: value,
        pageNumber: pageNumber,
        pageSize: pageSize,
      },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function updateServiceCode({
  onSuccess,
  onFail,
  data,
}: ResultType) {
  try {
    const res = await request.put({
      baseUrl,
      url: 'Settings/UpdateServiceCode',
      options: {
        serviceName: data?.serviceName,
        publicKeyService: data?.publicKeyService,
        serviceKey: data?.serviceKey,
        serviceType: data?.serviceType,
        isPublic: data?.isPublic,
        isInclude: data?.isInclude,
        taxPersent: data?.taxPersent,
        measurmentUnit: data?.measurmentUnit,
        priceDescription: data?.priceDescription,
        id: data?.id,
      },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
