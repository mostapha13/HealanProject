import withAlert from 'apps/cash-market/src/hoc/withAlert';
import { useStates, useEffect, useState, useSearchParams } from '@tse/utils';
import { Icon, Image, NewSelectSearch, TextField } from '@tse/components/atoms';
import emptyPicture from 'apps/cash-market/src/assets/images/emptyPicture.jpg';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import {
  EyeOutlined,
  FileWordOutlined,
  CommentOutlined,
} from '@ant-design/icons';
import { Progress } from 'antd';
import Cards from 'apps/cash-market/src/components/ListingCards';
import { getFinalShareholderInfo } from 'apps/cash-market/src/Controller/Listing/BasicData';

const initialState = {
  infoData: {},
};
function FinalShareholderDetail({ onAlert }: any) {
  const [state, setState] = useStates<any>(initialState);
  const { infoData } = state;
  const [searchParams] = useSearchParams();
  const finalShareholderId =
    searchParams.get('id') != null ? searchParams.get('id') : null;
  useEffect(() => {
    const data = {
      finalShareholderId,
    };
    getFinalShareholderInfo({
      data,
      onSuccess: (res: any) => setState({ infoData: res }),
      onFail,
    });
  }, []);
  const onFail = (error: any) => {
    onAlert(error);
  };
  return (
    <>
      <div className="border-2 border-lightGray  grid grid-cols-12">
        <div className=" col-span-12 items-start flex border-b-2 border-lightGray">
          <span className=" p-2 font-bold">پروفایل سهامدار نهایی</span>
        </div>
        <div className="col-span-12 items-start   mx-4 mt-4 border-b border-listingTertiaryColor">
          <span className=" p-4  text-listingTertiaryColor ">
            مشخصات شرکت :
          </span>
        </div>
        <div className="2xl:col-span-4 xl:col-span-6 lg:col-span-12 md:col-span-12  flex flex-row items-center justify-start">
          <div className="w-[100px] h-[100px] rounded-full m-8">
            <Image
              src={
                infoData?.logo?.link == undefined
                  ? emptyPicture
                  : infoData?.logo?.link
              }
              className="w-full h-full rounded-full opacity-50  "
            />
          </div>
          <div className="flex flex-col">
            <span className="mb-2 font-bold">
              {infoData?.finalShareHolderName}
            </span>
            <span className="mt-2 text-gray">
              {infoData?.finalShareHolderTypeInfo?.finalShareHolderTypeName}
            </span>
          </div>
        </div>
        <div className="2xl:col-span-8 xl:col-span-6 lg:col-span-12 md:col-span-12  flex flex-col items-start justify-center m-8">
          <div className="flex flex-row">
            <span className="mt-2 text-gray"> تلفن دفتر مرکزی : </span>
            <span className="mt-2 mr-2 font-bold">
              {infoData?.prefixNumber
                ? infoData?.prefixNumber + '-' + infoData?.landline
                : infoData?.landline}
            </span>
          </div>
          <div className="flex flex-row">
            <span className="mt-2 text-gray">آدرس دفتر مرکزی:</span>
            <span className="mt-2 mr-2 font-bold">{infoData?.address}</span>
          </div>
          <div className="flex flex-row">
            <span className="mt-2 text-gray">آدرس وبسایت :</span>
            <span className="mt-2 mr-2 font-bold">{infoData?.webSite}</span>
          </div>
        </div>
        <div className="col-span-12 items-start   mx-4 mt-4 border-b border-listingTertiaryColor">
          <span className=" p-4  text-listingTertiaryColor ">
            پرونده های مرتبط :
          </span>
        </div>
        <div className="col-span-12 grid grid-cols-12 m-8">
          <Cards />
        </div>
      </div>
    </>
  );
}

export default withAlert(FinalShareholderDetail);
