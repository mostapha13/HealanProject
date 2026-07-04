import { request } from '@tse/tools';
import {
  BASE_URL,
  NEW_INSTRUMENT_BASE_URL,
  PUBLIC_DATA_BASE_URL,
} from '../../constants';

interface requestInterface {
  data?: any;
  onSuccess: (e: any) => void;
  onFail: (e: any) => void;
}

export const getAllocationMethod = ({
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'InstrumentFuture/InstrumentFutureAllocationMethod/Fa';
  request
    .get({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const getPriceAssetType = ({ onSuccess, onFail }: requestInterface) => {
  const url = 'InstrumentFuture/InstrumentFuturePriceAssetType/Fa';
  request
    .get({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const getSettlementType = ({ onSuccess, onFail }: requestInterface) => {
  const url = 'InstrumentFuture/InstrumentFutureSettlementType/Fa';
  request
    .get({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const getInstrumentFutureDetail = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = `InstrumentFuture/Find/${data?.id}`;
  request
    .get({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const getInstrumentFutureList = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const { ContractType, StartTime, EndTime, PageNumber } = data;
  const url = `InstrumentFuture/Search/Fa?ContractType=${ContractType}&StartTime=${StartTime}&EndTime=${EndTime}&PageNumber=${PageNumber}`;
  request
    .get({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const saveInstrumentFuture = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'InstrumentFuture/Save';
  request
    .post({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const removeInstrumentFuture = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = `InstrumentFuture/Delete/${data.id}`;
  request
    .delete({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const exportToExcelFuture = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const { StartTime, EndTime } = data;
  const url = `InstrumentFuture/ExportToExcel?StartTime=${StartTime}&EndTime=${EndTime}`;
  request
    .download({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const exportWordFeature = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = `InstrumentFuture/ExportFutureReport`;
  request
    .download({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const getInstrumentListFuture = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'InstrumentFuture/InstrumentList/Fa';
  request
    .get({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

// trade option api

export const getActionStyle = ({ onSuccess, onFail }: requestInterface) => {
  const url = 'InstrumentTradeOption/TradeOptionActionStyle/Fa';
  request
    .get({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const getTradeOptionSettlementType = ({
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'InstrumentTradeOption/TradeOptionSettlementType/Fa';
  request
    .get({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const getInstrumentTradeOptionDetail = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = `InstrumentTradeOption/Find/${data.id}`;
  request
    .get({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const getInstrumentTradeOptionList = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const { ContractType, StartTime, EndTime, PageNumber } = data;
  const url = `InstrumentTradeOption/Search/Fa?ContractType=${ContractType}&StartTime=${StartTime}&EndTime=${EndTime}&PageNumber=${PageNumber}`;
  request
    .get({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const saveInstrumentTradeOption = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'InstrumentTradeOption/Save';
  request
    .post({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const removeInstrumentTradeOption = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = `InstrumentTradeOption/Delete/${data.id}`;
  request
    .delete({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const exportToExcelTradeOption = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const { StartTime, EndTime } = data;
  const url = `InstrumentTradeOption/ExportToExcel?StartTime=${StartTime}&EndTime=${EndTime}`;
  request
    .download({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const nextTradeNumber = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'InstrumentTradeOption/NextTradeNumber';
  request
    .get({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const exportWordTradeOption = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = `InstrumentTradeOption/ExportTradeOptionReport`;
  request
    .download({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const getInstrumentListTradeOption = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'InstrumentTradeOption/InstrumentList/Fa';
  request
    .get({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
/// option

export const getInstrumentOptionDetail = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = `InstrumentOption/Find/${data.id}`;
  request
    .get({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const getInstrumentOptionList = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const { ContractType, StartTime, EndTime, PageNumber } = data;
  const url = `InstrumentOption/Search/Fa?ContractType=${ContractType}&StartTime=${StartTime}&EndTime=${EndTime}&PageNumber=${PageNumber}`;
  request
    .get({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const saveInstrumentOption = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'InstrumentOption/Save';
  request
    .post({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const removeInstrumentOption = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = `InstrumentOption/Delete/${data.id}`;
  request
    .delete({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const exportToExcelOption = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const { StartTime, EndTime } = data;
  const url = `InstrumentOption/ExportToExcel?StartTime=${StartTime}&EndTime=${EndTime}`;
  request
    .download({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const exportWordOption = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = `InstrumentOption/ExportOptionReport`;
  request
    .download({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const getInstrumentListOption = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'InstrumentOption/InstrumentList/Fa';
  request
    .get({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

////////////////////// Instrument

export const getInstrumentInfoByName = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = `Instrument/InstrumentInfoByName?InstrumentName=${data?.name}`;
  request
    .get({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const getNextTradeOption = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = `InstrumentTradeOption/NextTradeOption`;
  request
    .get({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

////// debit

export const getDebitBondDetail = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = `InstrumentDebitBond/Find/${data.id}`;
  request
    .get({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const getDebitBondList = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = `InstrumentDebitBond/List`;
  request
    .get({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const saveDebitBond = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'InstrumentDebitBond/Save';
  request
    .post({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const removeDebitBond = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = `InstrumentDebitBond/Delete/${data.id}`;
  request
    .delete({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const getInstrumentDebitMethodType = ({
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = `InstrumentDebitBond/InstrumentDebitMethodType`;
  request
    .get({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const getInstrumentDebitGroup = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = `InstrumentDebitBond/InstrumentDebitGroup`;
  request
    .get({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const getInstrumentDebitInterestPaymentType = ({
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = `Share/InstrumentInterestPaymentTypeList/Fa`;
  request
    .get({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const getInstrumentDebitMarketType = ({
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = `InstrumentDebitBond/InstrumentDebitMarketType`;
  request
    .get({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const getIndustryListData = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = `Share/IndustryList/Fa`;
  request
    .get({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
      // options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const getSubIndustryListData = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = `Share/SubIndustryList/Fa`;
  request
    .get({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const getDebtBondTypeListData = ({
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = `Share/DebtBondTypeList/Fa`;
  request
    .get({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const getInstrumentDebitSettlementTimeType = ({
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = `InstrumentDebitBond/InstrumentDebitSettlementTimeType`;
  request
    .get({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const getInstrumentDebitUnderwritingMethodType = ({
  onSuccess,
  onFail,
  data,
}: requestInterface) => {
  const url = `Share/UnderwritingMethodList/Fa`;
  request
    .get({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const getMarketMakerList = ({ onSuccess, onFail }: requestInterface) => {
  const url = `InstrumentDebitBond/MarketMakerList`;
  request
    .get({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const getMarketMakerMethodTypeList = ({
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = `Share/MarketMakerMethodTypeList/Fa`;
  request
    .get({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const getBrokerList = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Share/BrokerList/Fa';
  request
    .get({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const exportToExcelDebit = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const { StartTime, EndTime } = data;
  const url = `InstrumentDebitBond/ExportToExcel?StartTime=${StartTime}&EndTime=${EndTime}`;
  request
    .download({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const getPublisherList = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'InstrumentDebitBond/Publisher';
  request
    .get({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const getSponserList = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'InstrumentDebitBond/Sponsor';
  request
    .get({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const getGuarantorList = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'InstrumentDebitBond/Guarantor';
  request
    .get({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const getTrustedList = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'InstrumentDebitBond/Trusted';
  request
    .get({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const getAuditorListDebit = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'InstrumentDebitBond/Auditor';
  request
    .get({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const getFundListDebit = ({ onSuccess, onFail }: requestInterface) => {
  const url = `InstrumentDebitBond/FundList`;
  request
    .get({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const exportWordDebit = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = `InstrumentDebitBond/ExportInstrumentDebitReport`;
  request
    .download({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const getInstrumentDebitList = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'InstrumentDebitBond/InstrumentList/Fa';
  request
    .get({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
////// InstrumentFund

export const getInstrumentFundDetail = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = `InstrumentFund/Find/${data.id}`;
  request
    .get({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const getInstrumentFundList = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = `InstrumentFund/List`;
  request
    .get({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const saveInstrumentFund = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'InstrumentFund/Save';
  request
    .post({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const removeInstrumentFund = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = `InstrumentFund/Delete/${data.id}`;
  request
    .delete({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const getInstrumentFundDescriptionType = ({
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = `InstrumentFund/InstrumentFundType`;
  request
    .get({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const exportToExcelFund = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const { StartTime, EndTime } = data;
  const url = `InstrumentFund/ExportToExcel?StartTime=${StartTime}&EndTime=${EndTime}`;
  request
    .download({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const getTrusteeList = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'InstrumentFund/Trustee';
  request
    .get({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const getFunderMangerList = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'InstrumentFund/FunderManager';
  request
    .get({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const getAuditorList = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'InstrumentFund/Auditor';
  request
    .get({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const getInstrumentFundApplication = ({
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = `InstrumentFund/InstrumentFundApplication`;
  request
    .get({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const exportWordFund = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = `InstrumentFund/ExportFundReport/`;
  request
    .download({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const getInstrumentListFund = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'InstrumentFund/InstrumentList/Fa';
  request
    .get({
      baseUrl: NEW_INSTRUMENT_BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
////////////////////////////////  public data
export const getWorkingDate = ({
  onSuccess,
  onFail,
  data,
}: requestInterface) => {
  const url = `WorkingDate/Fa`;
  request
    .get({
      baseUrl: PUBLIC_DATA_BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
