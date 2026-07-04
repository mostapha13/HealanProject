/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import { request } from '@tse/tools';
import { BASE_URL } from '../../constants';

interface requestInterface {
  data: any;
  onSuccess: (e: any) => void;
  onFail: (e: any) => void;
}

export const getActiveInstrumentList = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'InstrumentParameter/ActiveInstrumentParameter/Fa';
  request
    .get({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const saveOrder = ({ data, onSuccess, onFail }: requestInterface) => {
  const url = 'Order/Save';
  request
    .post({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const getUserCardBoardList = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Cardboard/UserCardboard/Fa';
  request
    .get({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const getUserCardBoardRecordList = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Cardboard/UserCardboardRecord/Fa';
  request
    .get({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const getOrderDetails = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Forms/OrderDetailFormById/Fa';
  request
    .get({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const confirmFile = ({ data, onSuccess, onFail }: requestInterface) => {
  const url = 'Forms/ConfirmFile';
  request
    .post({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const rejectFile = ({ data, onSuccess, onFail }: requestInterface) => {
  const url = 'Forms/RejectFile';
  request
    .post({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const confirmForm = ({ data, onSuccess, onFail }: requestInterface) => {
  const url = 'Forms/ConfirmForm';
  request
    .post({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const rejectForm = ({ data, onSuccess, onFail }: requestInterface) => {
  const url = 'Forms/RejectForm';
  request
    .post({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const getUserCardBoardArchiveList = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Cardboard/MarketMakerOrders/Fa';
  request
    .get({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const saveOrderExtending = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Order/OrderExtending';
  request
    .post({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const confirmAccessRequest = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Forms/ConfirmAccessRequest';
  request
    .post({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const rejectAccessRequest = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Forms/RejectAccessRequest';
  request
    .post({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const saveOrderQuit = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Order/OrderQuit';
  request
    .post({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const getOrderExport = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Order/OrderExportToDoc/Fa';
  request
    .download({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const getOrderExtendingExport = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Order/OrderExtendingExportToDoc/Fa';
  request
    .download({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const getOrderWorkFlow = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Forms/OrderWorkFlowById/Fa';
  request
    .get({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const closeForm = ({ data, onSuccess, onFail }: requestInterface) => {
  const url = 'Forms/CloseForm';
  request
    .post({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const saveOrderCommitmentIncDec = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Order/OrderCommitmentIncDec';
  request
    .post({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const confirmFinalOrderCommitmentIncDec = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Forms/ConfirmOrderCommitmentIncDec';
  request
    .post({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const getCommitmentIncDecFormById = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Forms/CommitmentIncDecFormById/Fa';
  request
    .get({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const rejectOrderCommitmentIncDec = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Forms/RejectOrderCommitmentIncDec';
  request
    .post({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const getChangeBrokerParam = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Forms/ChangeBrokerParam/Fa';
  request
    .get({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const saveOrderChangeBroker = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Order/OrderChangeBroker';
  request
    .post({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const getChangeBrokerFormById = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Forms/ChangeBrokerFormById/Fa';
  request
    .get({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const confirmChangeBroker = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Forms/ConfirmChangeBroker';
  request
    .post({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const rejectChangeBroker = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Forms/RejectChangeBroker';
  request
    .post({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const getorderCommitmentIncDecExportToDoc = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Order/OrderCommitmentIncDecExportToDoc/Fa';
  request
    .download({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
