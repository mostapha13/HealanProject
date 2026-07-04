import { request } from '@tse/tools';
import { BASE_URL } from '../../constants';
interface requestInterface {
  data?: any;
  onSuccess: (e: any) => void;
  onFail: (e: any) => void;
}

export const getFundList = ({ data, onSuccess, onFail }: requestInterface) => {
  const url = 'Fund/FundList/Fa';
  request
    .get({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const removeFund = ({ data, onSuccess, onFail }: requestInterface) => {
  const url = `Fund/Delete/${data}`;
  request
    .delete({
      baseUrl: BASE_URL,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const saveFund = ({ data, onSuccess, onFail }: requestInterface) => {
  const url = 'Fund/Save';
  request
    .post({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const geBrokerList = ({ data, onSuccess, onFail }: requestInterface) => {
  const url = 'Broker/BrokerList/Fa';
  request
    .get({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const getInvestorList = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Investor/InvestorList/Fa';
  request
    .get({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const getSettingList = ({ onSuccess, onFail }: requestInterface) => {
  const url = 'Setting/SettingList/Fa';
  request
    .get({
      baseUrl: BASE_URL,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const saveSetting = ({ data, onSuccess, onFail }: requestInterface) => {
  const url = 'Setting/SaveSetting';
  request
    .post({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const removeSetting = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = `Setting/Delete/${data}`;
  request
    .delete({
      baseUrl: BASE_URL,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
