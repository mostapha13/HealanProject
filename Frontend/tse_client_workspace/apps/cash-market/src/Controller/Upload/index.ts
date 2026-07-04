import { request } from '@tse/tools';
import { FILE_BASE_URL } from '../../constants';

interface requestInterface {
  data?: any;
  onSuccess: (e: any) => void;
  onFail: (e: any) => void;
}

export const uploadFile = ({ data, onSuccess, onFail }: requestInterface) => {
  const url = 'Upload';
  const body = new FormData();
  body.append('file', data);
  request
    .upload({
      baseUrl: FILE_BASE_URL,
      url,
      formData: body,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const downloadFile = ({ data, onSuccess, onFail }: requestInterface) => {
  const url = `Download/${data}`;
  request
    .get({
      baseUrl: FILE_BASE_URL,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const downloadFileApi = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = `Download/${data}`;
  request
    .download({
      baseUrl: FILE_BASE_URL,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
