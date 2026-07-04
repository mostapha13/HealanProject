import { loadFromStorage, request } from '@tse/tools';
import { baseUrl } from '../../../constants';

interface ReturnType {
  onSuccess: (param: any) => void;
  onFail: (error: any) => void;
}

interface ResultType extends ReturnType {
  periodId?: any;
  indicatorNumber?: any;
  responseStatus?: any;
  description?: any;
}
export async function getTransactionFee({
  onSuccess,
  onFail,
  periodId,
  indicatorNumber,
}: ResultType) {
  try {
    const res = await request.get({
      baseUrl,
      url: `Invoice/GetTransactionFeeByPeriodId/${periodId}/${indicatorNumber}`,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getExcelTransactionFee({
  onSuccess,
  onFail,
  periodId,
  indicatorNumber,
}: ResultType) {
  try {
    const res = await request.get({
      baseUrl,
      url: `Invoice/GetExcelTransactionByPeriodIdManager/${periodId}/${indicatorNumber}`,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function managerConfirmedInvoice({
  onSuccess,
  onFail,
  periodId,
  indicatorNumber,
  responseStatus,
  description,
}: ResultType) {
  try {
    const res = await request.post({
      baseUrl,
      url: `Invoice/ManagerConfirmedProsedure`,
      options: {
        periodId: periodId,
        indicatorNumber: indicatorNumber,
        isConfirm: true,
        responseStatus: responseStatus,
        description: description,
      },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function managerRejectedInvoice({
  onSuccess,
  onFail,
  periodId,
  indicatorNumber,
  responseStatus,
  description,
}: ResultType) {
  try {
    const res = await request.post({
      baseUrl,
      url: `Invoice/ManagerRejected`,
      options: {
        periodId: periodId,
        indicatorNumber: indicatorNumber,
        isConfirm: true,
        responseStatus: responseStatus,
        description: description,
      },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
