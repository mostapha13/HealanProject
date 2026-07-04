import withAlert from 'apps/cash-market/src/hoc/withAlert';
import { useStates, useEffect, useState, useSearchParams } from '@tse/utils';
import { Image, Icon } from '@tse/components/atoms';
import emptyPicture from 'apps/cash-market/src/assets/images/emptyPicture.jpg';
import { getDossierInfo } from 'apps/cash-market/src/Controller/Listing/Stock';
import { getRole } from 'apps/cash-market/src/Controller/Identity';
import { Table } from '@tse/components/organism';
import { DownloadOutlined } from '@ant-design/icons';

const initialState = {
  CompanyId: '',
  CompanyIdError: false,
  floor: '',
  logoFile: {},
  dossierInfo: {},
};

import { HeaderTypes } from '@tse/types';
import { downloadFileApi } from 'apps/cash-market/src/Controller';
import { downloadFile, convertDateToJalali } from '@tse/tools';
const pageSize = 10;

function DossierDetail({ onAlert }: any) {
  const [state, setState] = useStates<any>(initialState);
  const [searchParams] = useSearchParams();
  const dossierId =
    searchParams.get('id') != null ? searchParams.get('id') : null;
  const { dossierInfo } = state;

  useEffect(() => {
    handleGetDossierInfo();
  }, []);

  const handleGetDossierInfo = () => {
    const data = { DossierId: dossierId ? dossierId : null };
    getDossierInfo({
      data,
      onSuccess: (res: any) => setState({ dossierInfo: res }),
      onFail,
    });
  };

  const onFail = (error: any) => {
    onAlert(error);
  };

  const tableHeader: HeaderTypes[] = [
    {
      title: 'موضوع مدرک',
      dataIndex: 'title',
      key: 'title',
      className: 'col-span-6',
    },
    {
      title: 'فایل مجوز',
      dataIndex: 'attachment',
      key: 'attachment',
      className: 'col-span-5',
      render: (item: any) => (
        <DownloadOutlined
          onClick={() => handleDownload(item)}
          className="text-xl !text-black "
        />
      ),
    },
  ];

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

  const onEditDossier = (dossierId: any) => {
    console.log('dossierId', dossierId);
  };

  return (
    <>
      <div className="border-2 border-lightGray  grid grid-cols-12">
        <div className=" col-span-12 justify-between flex border-b-2 border-lightGray">
          <span className=" p-2 font-bold">جزئیات پرونده</span>
          <a href={`/listing-stock/new-dossier?id=${dossierId}`} className='flex justify-center items-center px-2'>
             <span> ویرایش</span>
              <Icon
                name="icon-edit"
                classname="cursor-pointer text-xl"
                onClick={() => onEditDossier(dossierId)}
              />
          </a>
        </div>
        <div className="col-span-12 items-start   mx-4 mt-4 border-b border-listingTertiaryColor">
          <span className=" p-4  text-listingTertiaryColor ">
            مشخصات شرکت متقاضی :
          </span>
        </div>
        <div className="2xl:col-span-4 xl:col-span-6 lg:col-span-12 md:col-span-12  flex flex-row items-center justify-start">
          <div className="w-[100px] h-[100px] rounded-full m-8">
            <Image
              src={
                dossierInfo?.company?.link == undefined
                  ? emptyPicture
                  : dossierInfo?.company?.link
              }
              className="w-full h-full rounded-full opacity-50  "
            />
          </div>
          <div className="flex flex-col">
            <span className="mb-2 font-bold">
              {dossierInfo?.firstName}
              {dossierInfo?.lastName}
            </span>
            <div className="flex flex-row">
              <span className="mt-2 text-bold">
                {dossierInfo?.company?.companyName}
              </span>
              <span className="mt-2 mr-2"></span>
            </div>
          </div>
        </div>
        <div className="2xl:col-span-8 xl:col-span-6 lg:col-span-12 md:col-span-12  flex flex-col items-start justify-center m-8">
          <div className="flex flex-row">
            <span className="mt-2 text-gray">شماره تلفن دفتر مرکزی :</span>
            <span className="mt-2 mr-2 font-bold">
              {dossierInfo?.company?.prefixNumber}
              {dossierInfo?.company?.landline}
            </span>
          </div>
          <div className="flex flex-row">
            <span className="mt-2 text-gray">آدرس دفتر مرکزی :</span>
            <span className="mt-2 mr-2 font-bold">
              {dossierInfo?.company?.address}
            </span>
          </div>
          <div className="flex flex-row">
            <span className="mt-2 text-gray">ایمیل :</span>
            <span className="mt-2 mr-2 font-bold">
              {dossierInfo?.company?.website}
            </span>
          </div>
        </div>
        {/* <div className="col-span-12 items-start mx-4 mt-4 border-b border-listingTertiaryColor">
          <span className=" p-4  text-listingTertiaryColor ">
            مشخصات مدیرعامل و اعضای هیئت پذیرش
          </span>
        </div>
        <div className="2xl:col-span-8 xl:col-span-6 lg:col-span-12 md:col-span-12  flex flex-col items-start justify-center m-8">
          <div className="flex flex-row">
            <span className="mt-2 text-gray">مدیر عامل : companyCEO</span>
            <span className="mt-2 mr-2 font-bold">
              {dossierInfo?.companyCEO}
            </span>
          </div>
          <div className="flex flex-row">
            <span className="mt-2 text-gray">شماره تلفن ثابت : </span>
            <span className="mt-2 mr-2 font-bold">{dossierInfo?.landline}</span>
          </div>
          <div className="flex flex-row">
            <span className="mt-2 text-gray">داخلی : </span>
            <span className="mt-2 mr-2 font-bold">
              {dossierInfo?.extensionCompanyPhoneNumber}
            </span>
          </div>
        </div> */}
        {dossierInfo?.dossierAttachmentFiles?.length > 0 && (
          <div className="col-span-12 flex flex-col ">
            <div className="col-span-12 items-start mx-4 m-4 border-b border-listingTertiaryColor">
              <span className=" p-4  text-listingTertiaryColor">
                فایل های درخواست پذیرش :
              </span>
            </div>
            <div className="col-span-12 m-4 flex  flex-col ">
              <span className=" p-4 border-2 border-[#f0f0f0]">
                تاریخ پذیرش: {convertDateToJalali(dossierInfo?.dossierDate)}
              </span>
              <Table
                columns={tableHeader}
                className="col-span-9 xl:col-span-10 lg:col-span-10 md:col-span-2 grid grid-cols-12"
                data={dossierInfo?.dossierAttachmentFiles}
                totalPages={1}
                pageSize={100}
              />
            </div>
          </div>
        )}
        <div className="col-span-12 items-start   mx-4 mt-4 border-b border-listingTertiaryColor">
          <span className=" p-4  text-listingTertiaryColor ">نام صنعت:</span>
        </div>
        <div
          className="2xl:col-span-12 xl:col-span-12 lg:col-span-10 md:col-span-12
            flex flex-row items-center justify-between m-8 rounded-2xl border-2 border-gray py-2 px-4 bg-[#f0f0f0]"
        >
          <div className="flex flex-row">
            <span className="mt-2 text-bold">کد ISIC :</span>
            <span className="mt-2 mr-2">{dossierInfo?.industry?.code}</span>
          </div>
          <div className="flex flex-row">
            <span className="mt-2 text-bold">
              {dossierInfo?.industry?.title}
            </span>
          </div>
        </div>
        <div className="col-span-12 items-start   mx-4 mt-4 border-b border-listingTertiaryColor">
          <span className=" p-4  text-listingTertiaryColor ">
            کارشناس پذیرش :
          </span>
        </div>
        <div className="2xl:col-span-4 xl:col-span-6 lg:col-span-12 md:col-span-12  flex flex-row items-center justify-start">
          <div className="w-[100px] h-[100px] rounded-full m-8">
            <Image
              src={
                dossierInfo?.user?.attachment?.link == undefined
                  ? emptyPicture
                  : dossierInfo?.user?.attachment?.link
              }
              className="w-full h-full rounded-full opacity-50  "
            />
          </div>
          <div className="flex flex-col">
            <div className="flex flex-row">
              <span className="mt-2 text-bold">
                {dossierInfo?.user?.fullName}
              </span>
              <span className="mt-2 mr-2"></span>
            </div>
            <div className="flex flex-row">
              <span className="mt-2 text-gray">شماره تلفن همراه :</span>
              <span className="mt-2 mr-2">
                {dossierInfo?.user?.phoneNumber}
              </span>
            </div>
            <div className="flex flex-row">
              <span className="mt-2  text-gray">شماره تلفن ثابت:</span>
              <span className="mt-2 mr-2">
                {dossierInfo?.user?.prefixNumber}
                {dossierInfo?.user?.landline}
              </span>
            </div>
          </div>
        </div>
        <div className="col-span-12 items-start   mx-4 mt-4 border-b border-listingTertiaryColor">
          <span className=" p-4  text-listingTertiaryColor ">
            مشخصات شرکت مشاور :
          </span>
        </div>
        <div className="2xl:col-span-4 xl:col-span-6 lg:col-span-12 md:col-span-12  flex flex-row items-center justify-start">
          <div className="w-[100px] h-[100px] rounded-full m-8">
            <Image
              src={
                dossierInfo?.adviserCompany?.attachment?.link == undefined
                  ? emptyPicture
                  : dossierInfo?.adviserCompany?.attachment?.link
              }
              className="w-full h-full rounded-full opacity-50  "
            />
          </div>
          <div className="flex flex-col">
            <div className="flex flex-row">
              <span className="mt-2  text-gray">شرکت مشاور(کارگزاری):</span>
              <span className="mt-2 mr-2">
                {dossierInfo?.adviserCompany?.companyName}
              </span>
            </div>
            <div className="flex flex-row">
              <span className="mt-2  text-gray">شماره تلفن ثابت:</span>
              <span className="mt-2 mr-2">
                {dossierInfo?.adviserCompany?.prefixNumber}
                {dossierInfo?.adviserCompany?.landline}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default withAlert(DossierDetail);
