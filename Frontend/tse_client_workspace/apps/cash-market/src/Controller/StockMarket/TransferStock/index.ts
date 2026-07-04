import { request } from '@tse/tools';
import {
  CASH_MARKET_BASE_URL,
  WORKFLOW_BASE_URL,
  BASE_URL,
} from '../../../constants';

interface requestInterface {
  data?: any;
  onSuccess: (e: any) => void;
  onFail: (e: any) => void;
}
interface ResultType extends requestInterface {
  transferTypeId?: any;
  orderId?: any;
  publicMessage?: string;
  privateMessage?: string;
  additionalDocument?: boolean;
}
export async function getTransferStockType({
  onSuccess,
  onFail,
}: requestInterface) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'TransferStock/GetTransferStockType',
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getClearingType({ onSuccess, onFail }: requestInterface) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'TransferStock/GetClearingType',
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getTransferStockAttachType({
  onSuccess,
  onFail,
  transferTypeId,
  additionalDocument,
}: ResultType) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'TransferStock/GetTransferStockAttachTypetransferTypeId',
      options: {
        transferTypeId: transferTypeId,
        additionalDocument: additionalDocument,
      },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function saveTransferStockData({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'TransferStock/SaveTransferStock',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getTransferStockByOrderId({
  onSuccess,
  onFail,
  orderId,
}: ResultType) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'TransferStock/TransferStockByOrderId',
      options: {
        OrderId: orderId,
      },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function transferStockConfirm({
  onSuccess,
  onFail,
  orderId,
  publicMessage,
  privateMessage,
}: ResultType) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'TransferStock/TransferStockConfirm',
      options: {
        orderId: orderId,
        publicMessage: publicMessage,
        privateMessage: privateMessage,
      },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function transferStockReject({
  onSuccess,
  onFail,
  orderId,
  publicMessage,
  privateMessage,
}: ResultType) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'TransferStock/TransferStockReject',
      options: {
        orderId: orderId,
        publicMessage: publicMessage,
        privateMessage: privateMessage,
      },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function transferStockDeadLine({
  onSuccess,
  onFail,
  data,
}: ResultType) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'TransferStock/TransferStockConfirm',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function saveAdditionalDocuments({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'TransferStock/SaveAdditionalDocuments',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function exportTransferStockNotification({
  onSuccess,
  onFail,
  orderId,
}: ResultType) {
  try {
    const res = await request.download({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'TransferStock/ExportTransferStockNotification',
      options: { OrderId: orderId },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
