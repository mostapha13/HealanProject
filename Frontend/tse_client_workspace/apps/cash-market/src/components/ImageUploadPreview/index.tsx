import { Icon, Image } from '@tse/components/atoms';
import type { ErrorType, onAlertProps } from '@tse/types';
import { useEffect, useState } from '@tse/utils';
import { DownloadOutlined } from '@ant-design/icons';
import { FILE_BASE_URL } from '../../constants';
import tse from 'apps/cash-market/src/assets/images/tse.png';
import excelLogo from 'apps/cash-market/src/assets/images/excelLogo.png';
import pdfLogo from 'apps/cash-market/src/assets/images/pdfLogo.png';
import attachmentLogo from 'apps/cash-market/src/assets/images/attachmentLogo.png';
import emptyPicture from 'apps/cash-market/src/assets/images/emptyPicture.jpg';
import { downloadFileApi } from 'apps/cash-market/src/Controller/Upload';
import { downloadFile } from '@tse/tools';
export interface ImageUploadPreviewProps {
  data?: any;
  onDeleteFile?: any;
  onAlert?: onAlertProps;
  className?: string;
  attachTypeNameKey?: string;
  uploadFileTypeKey?: string;
  descriptionKey?: string;
}
function ImageUploadPreview(props: ImageUploadPreviewProps) {
  const {
    data,
    onAlert,
    onDeleteFile,
    className,
    attachTypeNameKey,
    uploadFileTypeKey,
    descriptionKey,
  } = props;
  const fileTypeKey = uploadFileTypeKey ? uploadFileTypeKey : 'uploadFileType';
  const [imageMouseEnter, setImageMouseEnter] = useState(false);
  const url = FILE_BASE_URL + 'Download/';
  const handleDownload = () => {
    downloadFileApi({
      data: data?.fileId,
      onSuccess: (res: any) => downloadExportFile(res, data?.fileName),
      onFail: (err: any) => console.log('onFail', err),
    });
  };
  const downloadExportFile = (data: any, name: any) => {
    if (data != null) {
      downloadFile(data, name);
    }
  };
  return (
    <div className={`${className} flex flex-row my-4 mx-4`}>
      <div className="py-2 w-40 mx-2">
        <span className=" text-base">
          {attachTypeNameKey ? data?.[attachTypeNameKey] : data?.attachTypeName}
        </span>
      </div>
      <div
        className="w-40 h-40 border-2 border-blue border-dashed rounded-md"
        onMouseEnter={() => setImageMouseEnter(true)}
        onMouseLeave={() => setImageMouseEnter(false)}
      >
        {imageMouseEnter ? (
          <a
            onClick={handleDownload}
            className="w-full h-full flex justify-center items-center relative bg-black "
          >
            <Image
              src={
                data?.[fileTypeKey] == undefined
                  ? emptyPicture
                  : data?.[fileTypeKey] == 'Image'
                  ? emptyPicture
                  : data?.[fileTypeKey] == 'Excel'
                  ? excelLogo
                  : data?.[fileTypeKey] == 'PDF'
                  ? pdfLogo
                  : attachmentLogo
              }
              className="w-full h-full opacity-50  "
            />
            <span className="text-white text-base cursor-pointer absolute z-10 top-2 right-2">
              {descriptionKey ? data?.[descriptionKey] : data?.description}
            </span>
            <a
              // href={url + data?.fileId}
              className=" z-10 absolute cursor-pointer"
            >
              <DownloadOutlined className="text-4xl !text-white " />
            </a>
          </a>
        ) : (
          <div className="w-full h-full flex justify-center items-center ">
            <Image
              src={
                data?.[fileTypeKey] == undefined
                  ? emptyPicture
                  : data?.[fileTypeKey] == 'Image'
                  ? emptyPicture
                  : data?.[fileTypeKey] == 'Excel'
                  ? excelLogo
                  : data?.[fileTypeKey] == 'PDF'
                  ? pdfLogo
                  : attachmentLogo
              }
              className="w-full h-full"
            />
          </div>
        )}
      </div>
    </div>
  );
}
export default ImageUploadPreview;
