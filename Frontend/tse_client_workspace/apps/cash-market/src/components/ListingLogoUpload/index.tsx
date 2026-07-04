// import { Icon } from '@components';
import { Image, Upload } from '@tse/components/atoms';
import { useStates, useEffect, useState } from '@tse/utils';
import { uploadFile } from 'apps/cash-market/src/Controller';
import emptyPicture from 'apps/cash-market/src/assets/images/emptyPicture.jpg';

interface ListingUploadLogoType {
  className?: string;
  onAlert?: any;
  fileData: any;
  withHeader?: boolean;
  onChangeFromParent?: any;
}
const initialState = {
  logoFile: {},
};
export const ListingUploadLogo = (props: ListingUploadLogoType) => {
  const { className, onAlert, fileData, withHeader, onChangeFromParent } =
    props;
  const [state, setState] = useStates<any>(initialState);
  const { logoFile } = state;
  const onFail = (error: any) => {
    // onAlert(error);
  };
  useEffect(() => {
    if (onChangeFromParent === '' || onChangeFromParent === null) {
      setState({ logoFile: {} });
    } else if (onChangeFromParent?.fileId !== undefined) {
      setState({ logoFile: onChangeFromParent });
      fileData(onChangeFromParent);
    }
  }, [onChangeFromParent]);
  const onChangeFile = (e: any) => {
    uploadFile({
      data: e.target.files[0],
      onSuccess: (res: any) => {
        setState({ logoFile: res });
        fileData(res);
      },
      onFail,
    });
  };
  const onRemoveFile = () => {
    setState({
      logoFile: {},
    });
    fileData({});
  };
  return (
    <div className={` grid grid-cols-12 ${className}`}>
      {withHeader && (
        <div className="col-span-12 items-start mx-4 mt-8 border-b border-listingTertiaryColor">
          <span className=" p-4  text-listingTertiaryColor ">
            بارگذاری لوگو :
          </span>
        </div>
      )}
      <div className=" 2xl:col-span-4 xl:col-span-6 lg:col-span-8 md:col-span-8  col-span-4 mt-16 m-4">
        <Upload
          onChange={(file: any) => onChangeFile(file)}
          value={logoFile?.fileName}
          href={logoFile?.link}
          name="uploadLogoFile"
          onDelete={() => onRemoveFile()}
          fileFormat=".jpg,.png,.jpeg"
          // error={uploadFileError}
        />
      </div>
      <div className="w-[100px] h-[100px] rounded-full mt-8">
        <Image
          src={logoFile?.link == undefined ? emptyPicture : logoFile?.link}
          className="w-full h-full rounded-full opacity-50  "
        />
      </div>
    </div>
  );
};
