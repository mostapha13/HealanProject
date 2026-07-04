import { request } from '@tse/tools';
import { BASE_URL } from '../../constants';

interface requestInterface {
  data: any;
  onSuccess: (e: any) => void;
  onFail: (e: any) => void;
}

export const getDenyReasonList = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'DenyReason/DenyReasonList/Fa';
  request
    .get({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const removeDenyReason = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = `DenyReason/Delete/${data}`;
  request
    .delete({
      baseUrl: BASE_URL,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const saveDenyReason = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'DenyReason/Save';
  request
    .post({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
