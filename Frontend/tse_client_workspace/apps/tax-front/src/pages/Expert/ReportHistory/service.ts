import { loadFromStorage, request } from '@tse/tools';
import { baseUrl } from '../../../constants';

interface ReturnType {
  onSuccess: (param: any) => void;
  onFail: (error: any) => void;
}

interface ResultType extends ReturnType {
  periodId?: any;
  customerType?: any;
  indicatorNumber?: number;
  sematInty?: any;
  isMain?: number;
  excelFileName?: string;
  excelInty?: any;
  message?: string;
  excelUrl?: string;
  excelOnly?: any;
  pageNumber?: number;
  pageSize?: number;
}

export async function getAllPeriod({ onSuccess, onFail }: ReturnType) {
  try {
    const res = await request.get({
      baseUrl,
      url: 'Invoice/GetAllPeriods',
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getInvoiceReport({
  onSuccess,
  onFail,
  periodId,
  pageNumber,
  pageSize,
}: ResultType) {
  try {
    const res = await request.get({
      baseUrl,
      url: `Invoice/GetInvoiceReport/${periodId}?pageNumber=${pageNumber}&pageSize=${pageSize}`,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
