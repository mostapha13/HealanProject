import { request } from '@tse/tools';
import { LISTING_BASE_API } from '../../../constants';

interface requestInterface {
  data: any;
  onSuccess: (e: any) => void;
  onFail: (e: any) => void;
}

export const validateCertificate = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Signature/ValidateCertificate';
  request
    .post({
      baseUrl: LISTING_BASE_API,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const pdfDigestForMultiSign = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Signature/PdfDigestForMultiSign';
  request
    .post({
      baseUrl: LISTING_BASE_API,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const putPdfDigestForMultiSign = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Signature/PutPdfDigestForMultiSign';
  request
    .post({
      baseUrl: LISTING_BASE_API,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
