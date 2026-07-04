import { SimpleForm } from '@tse/components/molecules';
import { Icon, Button } from '@tse/components/atoms';
import { ListType, onAlertProps } from '@tse/types';
import { convertDateToJalali, loadFromStorage, separator } from '@tse/tools';
import { useEffect, useRecoilState, useRef, useState } from '@tse/utils';
import { userInfoAtom } from '../../../store/userProfile';
import { getTalarInfo } from './service';
import withAlert from '../../../hoc/withAlert';

interface TalarDetailsType {
  economic_Rate?: string;
  edalat_Count?: string;
  id?: string;
  inflation_Rate?: string;
  ostanTypeId?: string;
  ostanTypeName?: string;
  populstion?: string;
  sejam_Count?: string;
  start_Date?: string;
  talar_Address?: string;
  talar_Modir?: string;
  telNo?: string;
  unemployment_Rate?: string;
  talatTitle?: string;
  gdpShare?: any;
  literacyRate?: any;
  googleLocation?: string;
}

interface TalarInfoTypes {
  onAlert: onAlertProps;
}

function TalarInfo({ onAlert }: TalarInfoTypes) {
  const [isLoading, setLoading] = useState<boolean>(false);
  const [talarDetails, setTalarDetails] = useState<TalarDetailsType>({});

  useEffect(() => {
    handleGetTalarInfo();
  }, []);

  function handleGetTalarInfo() {
    getTalarInfo({ onSuccess: setTalarDetails, onFail });
  }

  const onFail = (error: any) => {
    setLoading(false);
    onAlert(error);
  };

  return (
    <div className="rounded shadow-simple px-6 py-3">
      <div className="border-regionHallBorderTableGray border-[1px] rounded grid grid-cols-12 mb-5">
        <div className="bg-regionHallTableGray p-4 col-span-12">
          <h3 className="text-lg">مشخصات استان</h3>
        </div>
        <section className="2xl:col-span-6 xl:col-span-12 lg:col-span-12 md:col-span-12 border-l-2 border-lightGray">
          <div className="p-4 grid grid-cols-12 border-gray border-b-[1px]">
            <span className="font-bold text-tiny col-span-4">
              نام تالار - دفتر منطقه ای:
            </span>
            <span className="col-span-8">{talarDetails.talatTitle}</span>
          </div>
          <div className="p-4 grid grid-cols-12 border-gray border-b-[1px]">
            <span className="font-bold text-tiny col-span-4">جمعیت استان:</span>
            <span className="col-span-8">
              {separator(talarDetails.populstion)}
            </span>
          </div>
          <div className="p-4 grid grid-cols-12 border-gray border-b-[1px]">
            <span className="font-bold text-tiny col-span-4">
              تاریخ افتتاح :
            </span>
            <span className="text-tiny col-span-8">
              {convertDateToJalali(talarDetails.start_Date)}
            </span>
          </div>
          <div className="p-4 grid grid-cols-12 border-gray border-b-[1px]">
            <span className="font-bold text-tiny col-span-4">آدرس:</span>
            <span className="text-tiny col-span-8">
              {talarDetails.talar_Address}
            </span>
          </div>
        </section>
        <section className="2xl:col-span-6 xl:col-span-12 lg:col-span-12 md:col-span-12">
          <div className="p-4 grid grid-cols-12 border-gray border-b-[1px]">
            <span className="font-bold text-tiny col-span-4">نام مدیر :</span>
            <span className="text-tiny col-span-8">
              {talarDetails.talar_Modir}
            </span>
          </div>
          <div className="p-4 grid grid-cols-12 border-gray border-b-[1px]">
            <span className="font-bold text-tiny col-span-4">شماره تماس:</span>
            <span className="text-tiny col-span-8">{talarDetails.telNo}</span>
          </div>
          <div className="p-4 grid grid-cols-12 border-gray border-b-[1px]">
            <span className="font-bold text-tiny col-span-4">
              تعداد سهامداران عدالت :
            </span>
            <span className="text-tiny col-span-8">
              {separator(talarDetails.edalat_Count)}
            </span>
          </div>
          {/* <div className="p-4 grid grid-cols-12 border-gray border-b-[1px]">
            <span className="font-bold text-tiny col-span-8">
              تعداد سهامداران عدالت (غیر مستقیم):
            </span>
            <span className="text-tiny col-span-4">
              {separator(talarDetails.edalat_Count_NS)}
            </span>
          </div> */}
          <div className="p-4 grid grid-cols-12 border-gray border-b-[1px]">
            <span className="font-bold text-tiny col-span-4">
              تعداد کدهای سجام:
            </span>
            <span className="text-tiny col-span-8">
              {separator(talarDetails.sejam_Count)}
            </span>
          </div>
        </section>
        <div className="bg-regionHallTableGray p-4 col-span-12">
          <h3 className="text-lg">مشخصات اقتصادی استان</h3>
        </div>
        <section className="2xl:col-span-6 xl:col-span-12 lg:col-span-12 md:col-span-12 border-l-2 border-lightGray">
          <div className="p-4 grid grid-cols-12 border-gray border-b-[1px]">
            <span className="font-bold text-tiny col-span-4">
              نوع طبقه بندی استان:
            </span>
            <span className="col-span-8">{talarDetails.ostanTypeName}</span>
          </div>
          <div className="p-4 grid grid-cols-12 border-gray border-b-[1px]">
            <span className="font-bold text-tiny col-span-4">نرخ بیکاری:</span>
            <span className="text-tiny col-span-8">
              {talarDetails.unemployment_Rate}%
            </span>
          </div>
          <div className="p-4 grid grid-cols-12 border-gray border-b-[1px] 2xl:border-b-0">
            <span className="font-bold text-tiny col-span-4">سهم از GDP:</span>
            <span className="text-tiny col-span-8">
              {talarDetails.gdpShare}
            </span>
          </div>
        </section>
        <section className="2xl:col-span-6 xl:col-span-12 lg:col-span-12 md:col-span-12">
          <div className="p-4 grid grid-cols-12 border-gray border-b-[1px]">
            <span className="font-bold text-tiny col-span-4">
              نرخ رشد اقتصادی استان:
            </span>
            <span className="text-tiny col-span-8">
              {talarDetails.economic_Rate}%
            </span>
          </div>
          <div className="p-4 grid grid-cols-12 border-gray border-b-[1px]">
            <span className="font-bold text-tiny col-span-4">
              نرخ تورم نقطه به نقطه:
            </span>
            <span className="text-tiny col-span-8">
              {talarDetails.inflation_Rate}%
            </span>
          </div>
          <div className="p-4 grid grid-cols-12">
            <span className="font-bold text-tiny col-span-4">نرخ باسوادی:</span>
            <span className="text-tiny col-span-8">
              {talarDetails.literacyRate}%
            </span>
          </div>
        </section>
      </div>
      <div className=" grid grid-cols-12 ">
        <iframe
          src={talarDetails?.googleLocation}
          // src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1924.60131182!2d51.352113815960436!3d35.78076324262569!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3f8e07fbe0642551%3A0x43cf08ac273ef463!2sShenzar%20Restaurant!5e0!3m2!1sen!2s!4v1702986602736!5m2!1sen!2s"
          width="100%"
          height="250"
          loading="lazy"
          className=" col-span-12"
        ></iframe>
      </div>
    </div>
  );
}
export default withAlert(TalarInfo);
