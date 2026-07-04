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
export async function exportDocumentTemplate({
  data,
  onSuccess,
  onFail,
}: requestInterface) {
  try {
    const res = await request.download({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/ExportDocumentTemplate',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getWholeSaleAttachType({
  data,
  onSuccess,
  onFail,
}: requestInterface) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/GetWholesaleSellerAttachType',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getWholeSaleTradeTypes({
  onSuccess,
  onFail,
}: requestInterface) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/GetWholeSaleTradeTypes',
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getWholeSaleType({
  onSuccess,
  onFail,
}: requestInterface) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/GetWholesaleType',
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function saveWholeSale({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/SaveWholesale',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getWholeSale({ onSuccess, onFail, orderId }: ResultType) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/GetWholesaleByOrderId',
      options: {
        OrderId: orderId,
      },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getWholeSaleCategory({
  onSuccess,
  onFail,
}: requestInterface) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/GetWholeSaleCategory',
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function saveWholesaleDetailExpert({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/SaveWholesaleDetailExpert',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function wholeSaleReject({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/WholeSaleReject',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function saveWholeSaleTradeType({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/SaveWholeSaleTradeType',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function wholeSaleConfirmCashmarketManager({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/WholeSaleConfirmCashmarketManager',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function uploadDocuments({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/UploadDocuments',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getDocuments({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/GetDocuments',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function deleteDocuments({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.delete({
      baseUrl: CASH_MARKET_BASE_URL,
      url: `Wholesale/DeleteDocuments?Id=${data.id}&OrderId=${data.orderId}`,
      // options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function endWholeSale({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/EndWholeSale',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function exportWholesaleNotification({
  onSuccess,
  onFail,
  orderId,
}: ResultType) {
  try {
    const res = await request.download({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/ExportWholesaleNotification',
      options: { OrderId: orderId },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getWholeSaleDocumentList({
  onSuccess,
  onFail,
  orderId,
}: ResultType) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/GetWholeSaleDocumentList',
      options: {
        OrderId: orderId,
      },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function exportWholesaleForm1({
  onSuccess,
  onFail,
  data,
}: ResultType) {
  try {
    const res = await request.download({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/ExportForm1',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function exportWholesaleToCeo({
  onSuccess,
  onFail,
  orderId,
}: ResultType) {
  try {
    const res = await request.download({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/ExportWholesaleToCeo',
      options: { OrderId: orderId },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getWholeSaleDocumentType({
  onSuccess,
  onFail,
  data,
}: ResultType) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/GetWholeSaleDocumentType',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
////////////////////////////////cancel sell wholesale ///////////////////
export async function getCancellationWholesaleByBroker({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/GetCancellationWholesaleByBroker',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getCancellationWholesaleAttachType({
  onSuccess,
  onFail,
  data,
}: ResultType) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/GetCancellationWholesaleAttachType',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getCancellationWholesaleByOrderId({
  onSuccess,
  onFail,
  data,
}: ResultType) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/GetCancellationWholesaleByOrderId',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function saveCancellationWholesale({
  onSuccess,
  onFail,
  data,
}: ResultType) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/SaveCancellationWholesale',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function cancellationWholeSaleConfirm({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/CancellationWholeSaleConfirm',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function cancellationWholeSaleReject({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/CancellationWholeSaleReject',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function uploadCancellationWholeSaleDocuments({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/UploadCancellationWholeSaleDocuments',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getCancellationWholeSaleDocument({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/getCancellationWholeSaleDocument',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getCancellationWholeSaleDocumentList({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/GetCancellationWholeSaleDocuments',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function deleteCancellationWholeSaleDocument({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.delete({
      baseUrl: CASH_MARKET_BASE_URL,
      url: `Wholesale/DeleteCancellationWholeSaleDocument?Id=${data?.id}&OrderId=${data?.orderId}`,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function exportCancellationWholeSale({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.download({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/ExportCancellationWholeSale',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function cancellationWholeSaleConfirmWithDocument({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/CancellationWholeSaleConfirmWithDocument',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
///////////////////////////////Certainty sell wholesale/////////////////
export async function getWholesaleByBroker({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/GetWholesaleByBroker',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getWholesaleSellerAttachTypeCertainty({
  onSuccess,
  onFail,
  data,
}: ResultType) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/GetWholesaleSellerAttachTypeCertainty',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function saveWholesaleCertainty({
  onSuccess,
  onFail,
  data,
}: ResultType) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/SaveWholesaleCertainty',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getWholesaleSellerCertaintyByOrderId({
  onSuccess,
  onFail,
  data,
}: ResultType) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/GetWholesaleSellerCertaintyByOrderId',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function wholeSaleConfirmCertainty({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/WholeSaleConfirmCertainty',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function wholeSaleRejectCertainty({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/WholeSaleRejectCertainty',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function uploadWholeSaleCertaintyDocument({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/UploadWholeSaleCertaintyDocument',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getWholeSaleCertaintyDocument({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/GetWholeSaleCertaintyDocument',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function deleteWholeSaleCertaintyDocument({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.delete({
      baseUrl: CASH_MARKET_BASE_URL,
      url: `Wholesale/DeleteWholeSaleCertaintyDocument?Id=${data.id}&OrderId=${data.orderId}`,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getWholeSaleCertaintyDocumentType({
  onSuccess,
  onFail,
  data,
}: ResultType) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/GetWholeSaleCertaintyDocumentType',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function endWholeSaleCertainty({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/EndWholeSaleCertainty',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
////////////////////////////////Not Certainty////////////////////////////
export async function getWholesaleNow({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/GetWholesaleNow',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getWholeSaleDocumentTypeNotCertainty({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/WholeSaleDocumentTypeNotCertainty',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getNotCertaintyDocument({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/GetNotCertaintyDocument',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function uploadNotCertaintyDocuments({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/UploadNotCertaintyDocuments',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function deleteNotCertaintyDocument({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.delete({
      baseUrl: CASH_MARKET_BASE_URL,
      url: `Wholesale/DeleteNotCertaintyDocument?Id=${data.id}&OrderId=${data.orderId}`,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function SaveNotCertainty({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/SaveNotCertainty',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
///////////////////////////////Tranaction Day////////////////////////////
export async function getTransactionDayDetail({
  onSuccess,
  onFail,
  data,
}: ResultType) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/GetTransactionDayDetail',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getTransactionDay({
  onSuccess,
  onFail,
  data,
}: ResultType) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/GetTransactionDay',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function exportWholesaleSeller({
  onSuccess,
  onFail,
  data,
}: ResultType) {
  try {
    const res = await request.download({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/ExportTransactionBuyer',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
///////////////////////////////Report////////////////////////////////////
export const getNotCertaintyCurrentDateReport = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Wholesale/NotCertaintyCurrentDateReport';
  request
    .get({
      baseUrl: CASH_MARKET_BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const getNotCertaintyAfterDeadlineReport = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Wholesale/NotCertaintyAfterDeadlineReport';
  request
    .get({
      baseUrl: CASH_MARKET_BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
///////////////////////////////Buy wholesale/////////////////////////////
export async function getAdsBuy({ onSuccess, onFail, data }: ResultType) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'Wholesale/GetAds',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function GetWholesaleBuyerAttachType({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'WholesaleBuyer/GetWholesaleBuyerAttachType',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function saveWholeSaleBuyer({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'WholesaleBuyer/SaveWholesaleBuyer',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getWholeSaleBuy({
  onSuccess,
  onFail,
  orderId,
}: ResultType) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'WholesaleBuyer/GetWholesaleBuyerByOrderId',
      options: {
        OrderId: orderId,
      },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getWholesaleBuy({
  onSuccess,
  onFail,
  orderId,
}: ResultType) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'WholesaleBuyer/GetWholesaleBuyerByOrderId',
      options: {
        OrderId: orderId,
      },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getWholesaleBuyerByOrderIdWithoutInquery({
  onSuccess,
  onFail,
  orderId,
}: ResultType) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'WholesaleBuyer/GetWholesaleBuyerByOrderIdWithoutInquery',
      options: {
        OrderId: orderId,
      },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function getWholesaleBuyerInqueryById({
  onSuccess,
  onFail,
  data,
}: ResultType) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'WholesaleBuyer/GetWholesaleBuyerInqueryById',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function saveWholesaleBuyerInquery({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'WholesaleBuyer/SaveWholesaleBuyerInquery',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getWholesaleBuyerAbilityById({
  onSuccess,
  onFail,
  data,
}: ResultType) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'WholesaleBuyer/GetWholesaleBuyerAbilityById',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function saveWholesaleBuyerAbility({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'WholesaleBuyer/SaveWholesaleBuyerAbility',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function wholesaleBuyerConfirm({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'WholesaleBuyer/WholesaleBuyerDetailsConfirm',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function wholesaleBuyerReject({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'WholesaleBuyer/WholesaleBuyerReject',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function deleteWholesaleBuyerStatmentById({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.delete({
      baseUrl: CASH_MARKET_BASE_URL,
      url: `WholesaleBuyer/DeleteWholesaleBuyerStatmentById?StatmentId=${data?.StatmentId}&OrderId=${data?.orderId}`,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function getWholesaleDenyReasons({
  onSuccess,
  onFail,
}: requestInterface) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: `WholesaleBuyer/GetWholesaleDenyReasons`,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function wholesaleBuyDeny({
  data,
  onSuccess,
  onFail,
}: requestInterface) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: `WholesaleBuyer/WholesaleBuyDeny`,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function saveWholesaleBuyerDeputy({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'WholesaleBuyer/SaveWholesaleBuyerDeputy',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function wholesaleBuyConfirmDocumentDefects({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'WholesaleBuyer/WholesaleBuyConfirmDocumentDefects',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function exportWholeSaleBuyDocument({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.download({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'WholesaleBuyer/ExportWholeSaleBuyDocument',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getWholeSaleBuyDocumentType({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'WholesaleBuyer/GetWholeSaleBuyDocumentType',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function saveWholeSaleBuyUploadDocument({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'WholesaleBuyer/SaveWholeSaleBuyUploadDocument',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getWholeSaleBuyUploadDocument({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'WholesaleBuyer/GetWholeSaleBuyUploadDocument',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function updateWholeSaleBuyUploadDocument({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.put({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'WholesaleBuyer/UpdateWholeSaleBuyUploadDocument',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function deleteWholeSaleBuyUploadDocument({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.delete({
      baseUrl: CASH_MARKET_BASE_URL,
      url: `WholesaleBuyer/DeleteWholeSaleBuyUploadDocument?Id=${data.id}&OrderId=${data.orderId}`,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
////////////////////////cancel request buy //////////////////
export async function getWholesaleBuyByBroker({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'WholesaleBuyer/GetWholesaleBuyByBroker',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getWholesaleReturnReasons({
  onSuccess,
  onFail,
}: ResultType) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'WholesaleBuyer/GetWholesaleReturnReasons',
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getCancellationWholesaleBuyAttachType({
  onSuccess,
  onFail,
}: ResultType) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'WholesaleBuyer/GetCancellationWholesaleBuyAttachType',
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function saveCancellationWholesaleBuy({
  onSuccess,
  onFail,
  data,
}: ResultType) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'WholesaleBuyer/SaveCancellationWholesaleBuy',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getCancellationWholesaleBuyByOrderId({
  onSuccess,
  onFail,
  data,
}: ResultType) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'WholesaleBuyer/GetCancellationWholesaleBuyByOrderId',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function cancellationWholeSaleBuyConfirm({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'WholesaleBuyer/CancellationWholeSaleBuyConfirm',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function cancellationWholeSaleBuyReject({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'WholesaleBuyer/CancellationWholeSaleBuyReject',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getCancellationWholeSaleBuyDocument({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.get({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'WholesaleBuyer/GetCancellationWholeSaleBuyDocument',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function uploadCancellationWholeSaleBuyDocument({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'WholesaleBuyer/UploadCancellationWholeSaleBuyDocument',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function deleteCancellationWholeSaleBuyDocument({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.delete({
      baseUrl: CASH_MARKET_BASE_URL,
      url: `WholesaleBuyer/DeleteCancellationWholeSaleBuyDocument?Id=${data.id}&OrderId=${data.orderId}`,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function cancellationWholeSaleBuyFinalConfirm({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.post({
      baseUrl: CASH_MARKET_BASE_URL,
      url: 'WholesaleBuyer/CancellationWholeSaleBuyFinalConfirm',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
