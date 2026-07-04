import { loadFromStorage, request } from '@tse/tools';
import { baseUrl } from '../../../constants';

interface ReturnType {
  onSuccess: (param: any) => void;
  onFail: (error: any) => void;
}

interface ResultType extends ReturnType {
  data?: any;
  periodId?: any;
  indicatorNumber?: any;
  pageSize?: any;
  pageNumber?: any;
  inty?: any;
  title?: any;
}

export async function getSettingTest({ onSuccess, onFail }: ReturnType) {
  try {
    const res = await request.get({
      baseUrl,
      url: 'Settings/GetUserSummary',
      // options: { Year: year, TalarId: id },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getFinishedInvoice({ onSuccess, onFail }: ReturnType) {
  try {
    const res = await request.get({
      baseUrl,
      url: 'Invoice/GetFinishedInvoice',
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getActiveInvoice({ onSuccess, onFail }: ReturnType) {
  try {
    const res = await request.get({
      baseUrl,
      url: 'Invoice/GetActiveInvoice',
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
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
export async function searchInvoice({
  onSuccess,
  onFail,
  inty,
  periodId,
  title,
  indicatorNumber,
  pageSize,
  pageNumber,
}: ResultType) {
  try {
    const res = await request.post({
      baseUrl,
      url: 'Invoice/SearchInvoice',
      options: {
        indicatorNumber: indicatorNumber,
        periodId: periodId,
        title: title,
        inty: inty,
        pageSize: pageSize,
        pageNumber: pageNumber,
      },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getInvalidModalData({
  onSuccess,
  onFail,
  periodId,
  indicatorNumber,
}: ResultType) {
  try {
    const res = await request.get({
      baseUrl,
      url: `Invoice/GetInvalidInqueryByPeriodId/${periodId}/${indicatorNumber}`,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getCurrentTableData({
  onSuccess,
  onFail,
  pageNumber,
  pageSize,
  indicatorNumber,
  periodId,
  title,
  inty,
}: ResultType) {
  try {
    const res = await request.post({
      baseUrl,
      url: `Invoice/SearchUserCardboard`,
      options: {
        indicatorNumber: indicatorNumber,
        periodId: periodId,
        title: title,
        inty: inty,
        pageNumber: pageNumber,
        pageSize: pageSize,
      },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
