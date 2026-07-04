import { request } from '@tse/tools';

interface requestInterface {
  baseUrl?: string;
  guid?: string;
  onSuccess: (e: any) => void;
  onFail: (e: any) => void;
}

export const downloadFileApi = ({
  baseUrl,
  guid,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = `File/Download/${guid}`;
  request
    .download({
      baseUrl: baseUrl,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
