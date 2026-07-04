import { request } from '@tse/tools';
import { BASE_URL } from '../../constants';

interface requestInterface {
  data?: any;
  onSuccess: (e: any) => void;
  onFail: (e: any) => void;
}

export const getInstrumentParameterList = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'InstrumentParameter/InstrumentParameterList/Fa';
  request
    .get({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const removeInstrumentParameter = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = `InstrumentParameter/Delete/${data}`;
  request
    .delete({
      baseUrl: BASE_URL,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const saveInstrumentParameter = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'InstrumentParameter/Save';
  request
    .post({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const getParameterTypeList = ({
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'PublicInfo/ParameterChangeTypeList/Fa';
  request
    .get({
      baseUrl: BASE_URL,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const getInstrumentList = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Instrument/InstrumentList/Fa';
  request
    .get({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const getInstrumentParameterGroupList = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'InstrumentParameter/InstrumentParameterGroupList/Fa';
  request
    .get({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const getInstrumentParameterTempList = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'InstrumentParameterTemp/InstrumentParameterTempList/Fa';
  request
    .get({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const saveInstrumentParameterTemp = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'InstrumentParameterTemp/Save';
  request
    .post({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const saveInstrumentParameterImport = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'InstrumentParameter/InstrumentParameterImport';
  request
    .post({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const instrumentParameterLoad = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'InstrumentParameter/InstrumentParameterLoad';
  request
    .post({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const instrumentParameterImport = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'InstrumentParameter/InstrumentParameterImport';
  request
    .post({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
