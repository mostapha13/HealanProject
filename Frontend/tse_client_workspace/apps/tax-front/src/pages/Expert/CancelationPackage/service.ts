import { loadFromStorage, request } from '@tse/tools';
import { baseUrl } from '../../../constants';

interface ReturnType {
  onSuccess: (param: any) => void;
  onFail: (error: any) => void;
}
interface ResultType<T = void> extends ReturnType {
  periodId?: any;
  indicatorNumber?: any;
  cancelAll?: boolean;
  excelFileName?: string;
  message?: string;
  excelUrl?: string;
}

export async function cancelInvoice({
  onSuccess,
  onFail,
  periodId,
  indicatorNumber,
  cancelAll,
  excelFileName,
  message,
}: ResultType) {
  try {
    const res = await request.post({
      baseUrl,
      url: 'Invoice/CancelInvoice',
      options: {
        periodId: periodId,
        indicatorNumber: indicatorNumber,
        cancelAll: cancelAll,
        excelFileName: excelFileName,
        message: message,
      },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getCancelInvoiceTransactionFee({
  onSuccess,
  onFail,
  periodId,
  indicatorNumber,
}: ResultType) {
  try {
    const res = await request.get({
      baseUrl,
      url: `Invoice/GetCancelInvoiceTransactionFeeByPeriodIdManager/${periodId}/${indicatorNumber}`,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getExcelTransactionFee({
  onSuccess,
  onFail,
  excelUrl,
  periodId,
}: ResultType) {
  try {
    const res = await request.get({
      baseUrl,
      url: `Invoice/GetExcelTransaction`,
      options: { excelUrl: excelUrl, periodId: periodId },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
