import { loadFromStorage, request } from '@tse/tools';
import { baseUrl } from '../../../constants';

interface ReturnType {
  onSuccess: (param: any) => void;
  onFail: (error: any) => void;
}
interface ResultType<T = void> extends ReturnType {
  data?: any;
  excelUrl?: any;
  id?: any;
  pageNumber?: any;
  pageSize?: any;
  value?: any;
}

export async function setBuyersCode({ onSuccess, onFail, data }: ResultType) {
  try {
    const res = await request.post({
      baseUrl,
      url: 'Settings/AddBuyerCode',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function setExcelBuyersCode({
  onSuccess,
  onFail,
  excelUrl,
}: ResultType) {
  try {
    const res = await request.post({
      baseUrl,
      url: 'Settings/UploadExcelBuyerCode',
      options: {
        excelUrl: excelUrl,
      },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getAllBuyersCode({
  onSuccess,
  onFail,
  pageNumber,
  pageSize,
}: ResultType) {
  try {
    const res = await request.get({
      baseUrl,
      url: 'Settings/GetAllBuyerCode',
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
export async function deleteBuyersCode({ onSuccess, onFail, id }: ResultType) {
  try {
    const res = await request.delete({
      baseUrl,
      url: `Settings/DeleteBuyerCode?id=${id}`,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function searchBuyersCode({
  onSuccess,
  onFail,
  value,
  pageNumber,
  pageSize,
}: ResultType) {
  try {
    const res = await request.post({
      baseUrl,
      url: 'Settings/SearchBuyerCode',
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
export async function updateBuyersCode({
  onSuccess,
  onFail,
  data,
}: ResultType) {
  try {
    const res = await request.put({
      baseUrl,
      url: 'Settings/UpdateBuyerCode',
      options: {
        accountCode: data?.accountCode,
        companyName: data?.companyName,
        nationalCode: data?.nationalCode,
        address: data?.address,
        id: data?.id,
      },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
