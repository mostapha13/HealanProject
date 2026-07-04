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

export async function getInitialSupplyAttachType({
  onSuccess,
  onFail,
}: requestInterface) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'InitialSupply/GetInitialSupplyAttachType',
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getInitialSupplyType({
  onSuccess,
  onFail,
}: requestInterface) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'InitialSupply/GetInitialSupplyType',
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function saveInitialSupplyData({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'InitialSupply/SaveInitialSupply',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getInitialSupplyByOrderId({
  onSuccess,
  onFail,
  orderId,
}: ResultType) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'InitialSupply/GetInitialSupplyByOrderId',
      options: {
        OrderId: orderId,
      },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function initialSupplyConfirm({
  onSuccess,
  onFail,
  orderId,
  publicMessage,
  privateMessage,
}: ResultType) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'InitialSupply/InitialSupplyConfirm',
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
export async function initialSupplyReject({
  onSuccess,
  onFail,
  orderId,
  publicMessage,
  privateMessage,
}: ResultType) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'InitialSupply/InitialSupplyReject',
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
export async function exportInitialSupplyNotification({
  onSuccess,
  onFail,
  orderId,
}: ResultType) {
  try {
    const res = await request.download({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'InitialSupply/ExportInitialSupplyNotification',
      options: { OrderId: orderId },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
