import { request } from '@tse/tools';
import { BASE_URL, Notification_BASE_URL } from '../../constants';

interface requestInterface {
  data?: any;
  onSuccess: (e: any) => void;
  onFail: (e: any) => void;
}

export const getMarketMakerGroupList = ({
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'UserGroup/MarketMakerGroupList/Fa';
  request
    .get({
      baseUrl: BASE_URL,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const saveUser = ({ data, onSuccess, onFail }: requestInterface) => {
  const url = 'User/Save';
  request
    .post({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const getUserList = ({ data, onSuccess, onFail }: requestInterface) => {
  const url = 'User/MarketMakerUserList/Fa';
  request
    .get({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const getUserInfo = ({ onSuccess, onFail }: requestInterface) => {
  const url = 'User/CurrentUser/Fa';
  request
    .get({
      baseUrl: BASE_URL,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const getAccessRequestById = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'AccessRequests/AccessRequest/Fa';
  request
    .get({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const getSimilarFunds = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'AccessRequests/SimilarFunds/Fa';
  request
    .get({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const saveAccessRequest = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'AccessRequests/AccessRequest';
  request
    .post({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const test = ({ data, onSuccess, onFail }: requestInterface) => {
  const url = 'AccessRequests/Test';
  request
    .post({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const getNotificationList = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Notification/NotificationList/Fa';
  request
    .get({
      baseUrl: Notification_BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const readNotification = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = `Notification/Read?NotificationId=${data?.NotificationId}`;
  request
    .post({
      baseUrl: Notification_BASE_URL,
      url,
      // options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const getRelatedFund = ({ onSuccess, onFail }: requestInterface) => {
  const url = 'User/RelatedFund/Fa';
  request
    .get({
      baseUrl: BASE_URL,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
