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
export async function getTransactionFee({
  onSuccess,
  onFail,
  periodId,
  customerType,
}: ResultType) {
  try {
    const res = await request.get({
      baseUrl,
      url: `Invoice/GetTransactionFeeByPeriodId/${periodId}/${customerType}`,
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
export async function sendInvoiceData({
  onSuccess,
  onFail,
  indicatorNumber,
  periodId,
  sematInty,
  isMain,
  customerType,
  excelFileName,
  excelInty,
  message,
  excelOnly,
}: ResultType) {
  try {
    const res = await request.post({
      baseUrl,
      url: 'Invoice/AddInvoiceDataProsedure',
      options: {
        IndicatorNumber: indicatorNumber,
        PeriodId: parseInt(periodId),
        SematInty: parseInt(sematInty),
        IsMain: isMain,
        CustomerType: parseInt(customerType),
        ExcelFileName: excelFileName,
        ExcelInty: parseInt(excelInty),
        Message: message,
        excelOnly: excelOnly,
      },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
