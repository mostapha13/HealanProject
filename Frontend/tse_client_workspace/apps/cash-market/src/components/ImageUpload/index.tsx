import { Icon, Image } from '@tse/components/atoms';
import type { ErrorType, onAlertProps } from '@tse/types';
import { useEffect, useState } from '@tse/utils';
import { DownloadOutlined } from '@ant-design/icons';
import { FILE_BASE_URL } from '../../constants';
import excelLogo from 'apps/cash-market/src/assets/images/excelLogo.png';
import pdfLogo from 'apps/cash-market/src/assets/images/pdfLogo.png';
import attachmentLogo from 'apps/cash-market/src/assets/images/attachmentLogo.png';
import emptyPicture from 'apps/cash-market/src/assets/images/emptyPicture.jpg';

import { downloadFileApi } from 'apps/cash-market/src/Controller/Upload';
import { downloadFile } from '@tse/tools';
export interface ImageUploadProps {
  data?: any;
  onDeleteFile?: any;
  className?: string;

  onAlert?: onAlertProps;
}
function ImageUpload(props: ImageUploadProps) {
  const { data, onAlert, onDeleteFile, className } = props;
  const [imageMouseEnter, setImageMouseEnter] = useState(false);
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
        <span className=" text-base">{data?.attachTypeName}</span>
      </div>
      <div
        className="w-40 h-40 border-2 border-blue border-dashed rounded-md"
        onMouseEnter={() => setImageMouseEnter(true)}
        onMouseLeave={() => setImageMouseEnter(false)}
      >
        {imageMouseEnter ? (
          <div className="w-full h-full flex justify-center items-center relative bg-black ">
            <Image
              src={
                data?.uploadFileType == undefined
                  ? emptyPicture
                  : data?.uploadFileType == 'Image'
                  ? emptyPicture
                  : data?.uploadFileType == 'Excel'
                  ? excelLogo
                  : data?.uploadFileType == 'PDF'
                  ? pdfLogo
                  : attachmentLogo
              }
              className="w-full h-full opacity-50  "
            />
            <span className="text-white text-base cursor-pointer absolute z-10 top-2 right-2">
              {data?.description}
            </span>

            <Icon
              name="icon-delete"
              classname="text-white text-3xl cursor-pointer absolute z-10 ml-12"
              onClick={() => onDeleteFile(data?.fileId)}
            />
            <a
              // href={url + data?.fileId}
              onClick={handleDownload}
              className=" z-10 absolute cursor-pointer mr-12"
            >
              <DownloadOutlined className="text-3xl !text-white " />
            </a>
          </div>
        ) : (
          <div className="w-full h-full flex justify-center items-center ">
            <Image
              src={
                data?.uploadFileType == undefined
                  ? emptyPicture
                  : data?.uploadFileType == 'Image'
                  ? emptyPicture
                  : data?.uploadFileType == 'Excel'
                  ? excelLogo
                  : data?.uploadFileType == 'PDF'
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
export default ImageUpload;
