import { request } from '@tse/tools';
import { BASE_URL } from '../../constants';

interface requestInterface {
  data: any;
  onSuccess: (e: any) => void;
  onFail: (e: any) => void;
}

export const getQuitReasonList = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'QuitReason/QuitReasonList/Fa';
  request
    .get({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const removeQuitReason = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = `QuitReason/Delete/${data}`;
  request
    .delete({
      baseUrl: BASE_URL,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const saveQuitReason = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'QuitReason/Save';
  request
    .post({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
