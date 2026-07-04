import withAlert from 'apps/cash-market/src/hoc/withAlert';
import {
  useStates,
  useEffect,
  useState,
  useNavigate,
  useSearchParams,
} from '@tse/utils';
import { Icon, Image, NewSelectSearch, TextField } from '@tse/components/atoms';
import NewSelect from 'apps/cash-market/src/components/atoms/NewSelect';
import { ListingSubmitButton } from 'apps/cash-market/src/components/atoms/ListingSubmitButton';
import { Table } from '@tse/components/organism';
import { HeaderTypes } from '@tse/types';
import emptyPicture from 'apps/cash-market/src/assets/images/emptyPicture.jpg';
import { getCompanyInfo } from 'apps/cash-market/src/Controller/Listing/BasicData';
import { DownloadOutlined } from '@ant-design/icons';
import { downloadFileApi } from 'apps/cash-market/src/Controller';
import { downloadFile } from '@tse/tools';

const initialState = {
  infoData: {},
};
const pageSize = 10;

function AcceptanceCompaniesDetail({ onAlert }: any) {
  const [state, setState] = useStates<any>(initialState);
  const { CompanyId, floor, logoFile, infoData } = state;
  const [searchParams] = useSearchParams();
  const licenseTableHeader: HeaderTypes[] = [
    {
      title: 'موضوع مدرک',
      dataIndex: 'companyAttachmentTitle',
      key: 'companyAttachmentTitle',
      className: 'col-span-6',
    },
    {
      title: 'فایل مجوز',
      dataIndex: 'attachmentCompany',
      key: 'attachmentCompany',
      className: 'col-span-5',
      render: (item: any) => (
        <DownloadOutlined
          onClick={() => handleDownload(item)}
          className="text-xl !text-black "
        />
      ),
    },
  ];
  const onFail = (error: any) => {
    onAlert(error);
  };
  const companyId =
    searchParams.get('id') != null ? searchParams.get('id') : null;
  useEffect(() => {
    const data = {
      companyId,
    };
    getCompanyInfo({
      data,
      onSuccess: (res: any) => setState({ infoData: res }),
      onFail,
    });
  }, []);
  const handleDownload = (data: any) => {
    downloadFileApi({
      data: data?.fileId,
      onSuccess: (res: any) => downloadExportDoc(res, data?.fileName),
      onFail: (err: any) => console.log('onFail', err),
    });
  };
  const downloadExportDoc = (data: any, name: any) => {
    if (data != null) {
      downloadFile(data, name);
    }
  };
  console.log('infoData', infoData);
  return (
    <>
      <div className="border-2 border-lightGray  grid grid-cols-12">
        <div className=" col-span-12 items-start flex border-b-2 border-lightGray">
          <span className=" p-2 font-bold">پروفایل شرکت</span>
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
                infoData?.attachmentLogo?.link == undefined
                  ? emptyPicture
                  : infoData?.attachmentLogo?.link
              }
              className="w-full h-full rounded-full opacity-50  "
            />
          </div>
          <div className="flex flex-col">
            <span className="mb-2 font-bold">{infoData?.companyName}</span>
            <span className="mt-2 text-gray">
              {infoData?.companyRegistrationTypeName}
            </span>
          </div>
        </div>
        <div className="2xl:col-span-8 xl:col-span-6 lg:col-span-12 md:col-span-12  flex flex-col items-start justify-center m-8">
          <div className="flex flex-row">
            <span className="mt-2 text-gray">تلفن دفتر مرکزی :</span>
            <span className="mt-2 mr-2 font-bold">
              {infoData?.prefixNumber
                ? infoData?.prefixNumber + '-' + infoData?.landline
                : infoData?.landline}
            </span>
          </div>
          <div className="flex flex-row">
            <span className="mt-2 text-gray">آدرس دفتر مرکزی :</span>
            <span className="mt-2 mr-2 font-bold">{infoData?.address} </span>
          </div>
          <div className="flex flex-row">
            <span className="mt-2 text-gray">آدرس وبسایت :</span>
            <span className="mt-2 mr-2 font-bold">{infoData?.webSite}</span>
          </div>
        </div>
        <div className="col-span-12 items-start   mx-4 mt-4 border-b border-listingTertiaryColor">
          <span className=" p-4  text-listingTertiaryColor ">
            مشخصات مدیرعامل و شرکا :
          </span>
        </div>
        <div className="col-span-12  grid grid-cols-12 m-8">
          {infoData?.companyUserInfoAttachments?.map((item: any) => (
            <div className="col-span-4 flex flex-row">
              <span className="mt-2 text-gray">
                {item?.postType?.postTypeName} :
              </span>
              <span className="mt-2 mr-2 font-bold">{item?.fullName}</span>
            </div>
          ))}
        </div>
        {infoData?.companyAttachments?.length > 0 && (
          <>
            <div className="col-span-12 items-start   mx-4 mt-4 border-b border-listingTertiaryColor mb-6">
              <span className=" p-4  text-listingTertiaryColor ">
                مدارک و گواهینامه‌ها :
              </span>
            </div>
            <div className="col-span-12 m-4">
              <Table
                columns={licenseTableHeader}
                className="col-span-12 grid grid-cols-12 "
                data={infoData?.companyAttachments}
                totalPages={1}
                pageSize={100}
              />
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default withAlert(AcceptanceCompaniesDetail);
