import {
  pdfDigestForMultiSign,
  putPdfDigestForMultiSign,
  validateCertificate,
} from 'apps/cash-market/src/Controller/Listing/DigitalSignature';

export const SelectCertificateFromTokenByUIFun = async ({
  att,
  onAlert,
  dossierId,
  modalData,
}: any): Promise<any> => {
  const Dastine = (window as any).Dastine;
  if (!Dastine) {
    onAlert({
      message: 'پیش نیازهای لازم جهت امضای دیجیتال را بررسی و مجدد تلاش نمایید',
      type: 'error',
    });
    return false;
  }
  if (Dastine.isInstalled) {
    try {
      return await new Promise((resolve) => {
        Dastine.SelectCertificateFromTokenByUI('', '', function (event: any) {
          if (event.data.Result == 0) {
            Dastine.GetSelectedCertificate(function (event: any) {
              handleValidateCertificate(
                event?.data?.Result,
                att,
                dossierId,
                modalData,
                onAlert
              )
                .then(resolve)
                .catch(() => resolve(false));
            });
          } else if (event.data.Result == 23) {
            onAlert({
              message: 'ماژول سخت افزاری امضای دیجیتال به درستی نصب نشده است.',
              type: 'error',
            });
            resolve(false);
          } else {
            resolve(false);
          }
        });
      });
    } catch (e) {
      console.log('خطا در اجرا', e);
      alert(e);
      return false;
    }
  } else {
    if (Dastine.errorMessage == 'DASTINE_NOT_INSTALLED') {
      alert(Dastine.errorMessage + '\n Get it from:\n');
      return false;
    } else {
      alert(Dastine.errorMessage);
      return false;
    }
  }
};
export const handleValidateCertificate = async (
  certificate: any,
  att: any,
  dossierId: string,
  modalData: any,
  onAlert: any
): Promise<any> => {
  const Dastine = (window as any).Dastine;
  const data = { certificate };
  return await new Promise((resolve) => {
    validateCertificate({
      data,
      onSuccess: (res: any) => {
        console.log('validateCertificate', res);
        if (res?.statusCode == 200) {
          const pdfDigestData = {
            dossierId,
            submenuId: modalData?.submenuId,
            attachmentId: att?.fileId,
            certificate,
          };

          pdfDigestForMultiSign({
            data: pdfDigestData,
            onSuccess: (digestRes: any) => {
              console.log('digestRes', digestRes);
              Dastine.Sign(digestRes?.result, '', function (signRes: any) {
                console.log('signRes', signRes);
                if (signRes?.data?.Result != 14) {
                  const putPdfData = {
                    certificate,
                    sign: signRes?.data?.Result,
                    attachmentId: att?.fileId,
                    submenuId: modalData?.submenuId,
                  };
                  putPdfDigestForMultiSign({
                    data: putPdfData,
                    onSuccess: () => {
                      resolve(putPdfData),
                        console.log('putPdfData', putPdfData);
                    },
                    onFail: (err: any) => {
                      onAlert(err);
                      resolve(false);
                    },
                  });
                } else {
                  resolve(false);
                }
              });
            },
            onFail: (err: any) => {
              onAlert(err);
              resolve(false);
            },
          });
        } else {
          resolve(false);
        }
      },
      onFail: (err: any) => {
        onAlert(err);
        resolve(false);
      },
    });
  });
};
