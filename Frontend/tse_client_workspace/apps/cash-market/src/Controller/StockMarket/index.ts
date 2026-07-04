/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import { request } from '@tse/tools';
import {
  CASH_MARKET_BASE_URL,
  WORKFLOW_BASE_URL,
  BASE_URL,
} from '../../constants';

interface requestInterface {
  data?: any;
  onSuccess: (e: any) => void;
  onFail: (e: any) => void;
}
interface ResultType extends requestInterface {
  lang?: any;
  pageSize?: any;
  pageNumber?: any;
  orderId?: any;
  publicMessage?: string;
  privateMessage?: string;
  transferBlockFileName?: any;
  transferBlockState?: any;
}

export async function getBlockAttachType({
  onSuccess,
  onFail,
}: requestInterface) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'TransferBlocks/GetTransferBlockAttachType',
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getPersonType({ onSuccess, onFail }: requestInterface) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Common/GetPersonType',
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function closeFormStock({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Common/CloseForm',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function saveDraftBlockData({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'TransferBlocks/SaveDraftTransferBlock',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function saveBlockData({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'TransferBlocks/SaveTransferBlock',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getDraftTransferBlocks({
  onSuccess,
  onFail,
  lang,
  pageSize,
  pageNumber,
}: ResultType) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'TransferBlocks/GetDraftTransferBlock',
      options: {
        lang: lang,
        pageSize: pageSize,
        pageNumber: pageNumber,
      },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getTransferBlocksByOrderId({
  onSuccess,
  onFail,
  orderId,
}: ResultType) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'TransferBlocks/GetTransferBlockByOrderId',
      options: {
        OrderId: orderId,
      },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function transferBlockConfirm({
  onSuccess,
  onFail,
  orderId,
  publicMessage,
  privateMessage,
}: ResultType) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'TransferBlocks/TransferBlockConfirm',
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
export async function transferBlockReject({
  onSuccess,
  onFail,
  orderId,
  publicMessage,
  privateMessage,
}: ResultType) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'TransferBlocks/TransferBlockReject',
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
export async function getFormBroker({ onSuccess, onFail }: ResultType) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'TransferBlocks/GetFormsBroker',
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function transferBlockEnd({
  onSuccess,
  onFail,
  orderId,
  publicMessage,
  privateMessage,
  transferBlockFileName,
  transferBlockState,
}: ResultType) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'TransferBlocks/TransferBlockEnd',
      options: {
        orderId: orderId,
        publicMessage: publicMessage,
        privateMessage: privateMessage,
        transferBlockFileName: transferBlockFileName,
        transferBlockState: transferBlockState,
      },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function exportBlockNotification({
  onSuccess,
  onFail,
  orderId,
}: ResultType) {
  try {
    const res = await request.download({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'TransferBlocks/ExportTransferBlockNotification',
      options: { OrderId: orderId },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

///////////////////////////////////////////////////////////////////////////////////////////////////
export async function getOrderStatusList({ onSuccess, onFail }: ResultType) {
  try {
    const res = await request.get({
      baseUrl: BASE_URL,
      url: 'Order/GetOrderStatus',
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getCardboardCashMarket({
  onSuccess,
  onFail,
  data,
}: ResultType) {
  try {
    const res = await request.get({
      baseUrl: BASE_URL,
      url: 'Cardboard/UserCardboardCashMarket/Fa',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getCardboardArchive({
  onSuccess,
  onFail,
  data,
}: ResultType) {
  try {
    const res = await request.get({
      baseUrl: BASE_URL,
      url: 'Cardboard/UserCardboardArchiveCashMarket/Fa',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getCardBoardDraft({
  onSuccess,
  onFail,
  data,
}: ResultType) {
  try {
    const res = await request.get({
      baseUrl: BASE_URL,
      url: 'Cardboard/UserCardboardDraftMarket/Fa',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
