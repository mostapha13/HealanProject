import withAlert from 'apps/cash-market/src/hoc/withAlert';
import { useStates, useEffect, useState } from '@tse/utils';
import { Icon, Image, NewSelectSearch, TextField } from '@tse/components/atoms';
import emptyPicture from 'apps/cash-market/src/assets/images/emptyPicture.jpg';

const initialState = {
  CompanyId: '',
  CompanyIdError: false,
  floor: '',
  logoFile: {},
};
const pageSize = 10;

function AdmissionsTeamMembersDetail({ onAlert }: any) {
  const [state, setState] = useStates<any>(initialState);
  const { CompanyId, floor, logoFile } = state;

  return (
    <>
      <div className="border-2 border-lightGray  grid grid-cols-12">
        <div className=" col-span-12 items-start flex border-b-2 border-lightGray">
          <span className=" p-2 font-bold">پروفایل</span>
        </div>
        <div className="col-span-12 items-start   mx-4 mt-4 border-b border-listingTertiaryColor">
          <span className=" p-4  text-listingTertiaryColor ">
            مشخصات فردی :
          </span>
        </div>
        <div className="2xl:col-span-4 xl:col-span-6 lg:col-span-12 md:col-span-12  flex flex-row items-center justify-start">
          <div className="w-[100px] h-[100px] rounded-full m-8">
            <Image
              src={logoFile?.link == undefined ? emptyPicture : logoFile?.link}
              className="w-full h-full rounded-full opacity-50  "
            />
          </div>
          <div className="flex flex-col">
            <span className="mb-2 font-bold">سید محمد حسینی</span>
            <div className="flex flex-row">
              <span className="mt-2 text-gray">نام کاربری :</span>
              <span className="mt-2 mr-2">sm.hoseini</span>
            </div>
          </div>
        </div>
        <div className="2xl:col-span-8 xl:col-span-6 lg:col-span-12 md:col-span-12  flex flex-col items-start justify-center m-8">
          <div className="flex flex-row">
            <span className="mt-2 text-gray">شماره تلفن همراه :</span>
            <span className="mt-2 mr-2 font-bold">09121115678</span>
          </div>
          <div className="flex flex-row">
            <span className="mt-2 text-gray">شماره تلفن ثابت :</span>
            <span className="mt-2 mr-2 font-bold">02185065896</span>
          </div>
        </div>
        <div className="col-span-12 items-start mx-4 mt-4 border-b border-listingTertiaryColor">
          <span className=" p-4  text-listingTertiaryColor ">
            مشخصات شرکت استخدامی :
          </span>
        </div>
        <div className="2xl:col-span-4 xl:col-span-6 lg:col-span-12 md:col-span-12  flex flex-row items-center justify-start">
          <div className="w-[100px] h-[100px] rounded-full m-8">
            <Image
              src={logoFile?.link == undefined ? emptyPicture : logoFile?.link}
              className="w-full h-full rounded-full opacity-50"
            />
          </div>
          <div className="flex flex-col">
            <span className="mb-2 font-bold">عضو هیئت پذیرش</span>
          </div>
        </div>
        <div className="2xl:col-span-8 xl:col-span-6 lg:col-span-12 md:col-span-12  flex flex-col items-start justify-center m-8">
          <div className="flex flex-row">
            <span className="mt-2 text-gray">شرکت مشاور(کارگزاری) :</span>
            <span className="mt-2 mr-2 font-bold">بورس اوراق بهادار تهران</span>
          </div>
          <div className="flex flex-row">
            <span className="mt-2 text-gray">شماره تلفن ثابت : </span>
            <span className="mt-2 mr-2 font-bold">02185065896</span>
          </div>
          <div className="flex flex-row">
            <span className="mt-2 text-gray">داخلی : </span>
            <span className="mt-2 mr-2 font-bold">02185065896</span>
          </div>
        </div>
        <div className="col-span-12 items-start mx-4 mt-4 border-b border-listingTertiaryColor">
          <span className=" p-4  text-listingTertiaryColor">
            مدارک و گواهینامه ها :
          </span>
        </div>
        <div className="2xl:col-span-8 xl:col-span-6 lg:col-span-12 md:col-span-12  flex flex-col items-start justify-center m-8">
          <div className="flex flex-row">
            <span className="mt-2 text-gray">شرکت مشاور(کارگزاری) :</span>
            <span className="mt-2 mr-2 font-bold">بورس اوراق بهادار تهران</span>
          </div>
        </div>
      </div>
    </>
  );
}

export default withAlert(AdmissionsTeamMembersDetail);
