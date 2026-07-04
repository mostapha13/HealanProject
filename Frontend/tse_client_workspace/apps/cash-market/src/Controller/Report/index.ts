/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import { request } from '@tse/tools';
import { BASE_URL } from '../../constants';

interface requestInterface {
  data: any;
  onSuccess: (e: any) => void;
  onFail: (e: any) => void;
}

export const getParameterReport = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Report/InstrumentParameter/Fa';
  request
    .get({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const getParameterReportExport = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Report/InstrumentParameterExportToExcel/Fa';
  request
    .download({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const getRequestReport = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Report/Requests/Fa';
  request
    .get({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const getRequestReportExport = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Report/RequestsExportToExcel/Fa';
  request
    .download({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const getInstrumentWatch = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Report/InstrumentWatch/Fa';
  request
    .get({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const getMarketMakerInstrumentParameter = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Report/MarketMakerInstrumentParameter/Fa';
  request
    .get({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const getMarketMakerInstrumentItem = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Report/MarketMakerInstrumentItem/Fa';
  request
    .get({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const getMarketMakerInstrumentTemp = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Report/MarketMakerInstrumentTemp/Fa';
  request
    .get({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const getMarketMakerInstrumentParameterExportToExcel = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Report/MarketMakerInstrumentParameterExportToExcel/Fa';
  request
    .download({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const getMarketMakerInstrumentItemExportToExcel = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Report/MarketMakerInstrumentItemExportToExcel/Fa';
  request
    .download({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const getMarketMakerChangeParameterTemp = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Report/MarketMakerChangeParameterTemp/Fa';
  request
    .get({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const getMarketMakerChangeParameterTempExportToExcel = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Report/MarketMakerChangeParameterTempExportToExcel/Fa';
  request
    .download({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const getMarketMakerChangeParameterTempInstrument = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Report/MarketMakerChangeParameterTempInstrument/Fa';
  request
    .get({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const getMarketMakerChangeParameterTempInstrumentExportToExcel = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Report/MarketMakerChangeParameterTempInstrumentExportToExcel/Fa';
  request
    .download({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const getWorkFlowType = ({ onSuccess, onFail }: any) => {
  const url = 'Report/GetWorkFlowType';
  request
    .get({
      baseUrl: BASE_URL,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
