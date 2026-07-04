import { loadFromStorage, request } from '@tse/tools';
import { baseUrl } from '../../constants';

interface ReturnType {
  onSuccess: (param: any) => void;
  onFail: (error: any) => void;
}

interface ResultType extends ReturnType {
  id?: number;
  indicatorNumber?: number;
  periodId?: any;
  packetSendState?: number;
  invoiceState?: number;
  validationState?: number;
}

export async function GetInqueryValidInvalid({
  onSuccess,
  onFail,
  periodId,
  indicatorNumber,
}: ResultType) {
  try {
    const res = await request.get({
      baseUrl,
      url: `Invoice/GetInqueryByPeriodId/${periodId}/${indicatorNumber}`,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function EndPeriod({ onSuccess, onFail, periodId }: ResultType) {
  try {
    const res = await request.post({
      baseUrl,
      url: `Invoice/EndPeriod`,
      options: {
        periodId: parseInt(periodId),
      },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function ResendInvoiceInternalError({
  onSuccess,
  onFail,
  periodId,
  indicatorNumber,
}: ResultType) {
  try {
    const res = await request.get({
      baseUrl,
      url: `Invoice/ResendInvoiceInternalError/${periodId}/${indicatorNumber}`,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
