import { loadFromStorage, request } from '@tse/tools';
import { baseUrl } from '../../../../constants';

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
  inty?: any;
}
export async function getIndicatorNumber({ onSuccess, onFail }: ReturnType) {
  try {
    const res = await request.get({
      baseUrl,
      url: 'Invoice/GetIndicatorNumber',
      // options: { Year: year, TalarId: id },
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
export async function sendAddendum({
  onSuccess,
  onFail,
  indicatorNumber,
  periodId,
  inty,
  message,
  excelUrl,
}: ResultType) {
  try {
    const res = await request.post({
      baseUrl,
      url: `Invoice/FixInvoice`,
      options: {
        indicatorNumber: parseInt(indicatorNumber),
        excelFileName: excelUrl,
        periodId: parseInt(periodId),
        inty: parseInt(inty),
        message: message,
      },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
