import withAlert from 'apps/cash-market/src/hoc/withAlert';
import { useStates, useEffect, useState, useSearchParams } from '@tse/utils';
import { Icon, Image, NewSelectSearch, TextField } from '@tse/components/atoms';
import emptyPicture from 'apps/cash-market/src/assets/images/emptyPicture.jpg';
import { getCashInfo } from 'apps/cash-market/src/Controller/Listing/BasicData';

const initialState = {
  CompanyId: '',
  CompanyIdError: false,
  floor: '',
  logoFile: {},
  cashInfoList: [],
};

function InvestmentFundsDetail({ onAlert }: any) {
  const [state, setState] = useStates<any>(initialState);
  const { CompanyId, logoFile, cashInfoList } = state;
  const [searchParams] = useSearchParams();
  const cashId = searchParams.get('id') != null ? searchParams.get('id') : null;

  useEffect(() => {
    handleGetCashInfo();
  }, []);

  const handleGetCashInfo = () => {
    const data = {
      cashId,
    };
    getCashInfo({
      data,
      onSuccess: (res: any) => setState({ cashInfoList: res }),
      onFail,
    });
  };

  const onFail = (error: any) => {
    onAlert(error);
  };

  return (
    <>
      <div className="border-2 border-lightGray  grid grid-cols-12 ">
        <div className=" col-span-12 items-start flex border-b-2 border-lightGray">
          <span className=" p-2 font-bold">جزئیات صندوق سرمایه</span>
        </div>
        <div className="col-span-12 items-start   mx-4 mt-4 border-b border-listingTertiaryColor">
          <span className=" p-4  text-listingTertiaryColor ">
            مشخصات صندوق سرمایه :
          </span>
        </div>
        <div className="2xl:col-span-4 xl:col-span-6 lg:col-span-12 md:col-span-12  flex flex-row items-center justify-center">
          {/* <div className="w-[100px] h-[100px] rounded-full m-8">
            <Image
              src={logoFile?.link == undefined ? emptyPicture : logoFile?.link}
              className="w-full h-full rounded-full opacity-50  "
            />
          </div> */}
          <div className="flex flex-col">
            <span className="mb-2 font-bold text-lg">
              {cashInfoList?.cashName}
            </span>
          </div>
        </div>
        <div className="2xl:col-span-8 xl:col-span-6 lg:col-span-12 md:col-span-12  flex flex-col items-start justify-center m-8">
          <div className="flex flex-row">
            <span className="mt-2 text-gray">نوع صندوق :</span>
            <span className="mt-2 mr-2 font-bold">
              {cashInfoList?.cashTypeId == 'MarketablePublishingAndUnderwriting'
                ? 'انتشار و پذیره نویسی قابل معامله'
                : cashInfoList?.cashTypeId ==
                  'ConvertIssuanceAndCancellationToNegotiable'
                ? 'تبدیل صدور و ابطالی به قابل معامله'
                : 'انتقالی از فرابورس'}
            </span>
          </div>
          <div className="flex flex-row">
            <span className="mt-2 text-gray">کد اقتصادی :</span>
            <span className="mt-2 mr-2 font-bold">
              {cashInfoList?.economicCode}
            </span>
          </div>
          <div className="flex flex-row">
            <span className="mt-2 text-gray">تلفن :</span>
            <span className="mt-2 mr-2 font-bold">{` ${cashInfoList?.landline} - ${cashInfoList?.prefixNumber}`}</span>
          </div>
          <div className="flex flex-row">
            <span className="mt-2 text-gray">وب سایت :</span>
            <span className="mt-2 mr-2 font-bold">{cashInfoList?.webSite}</span>
          </div>
          <div className="flex flex-row">
            <span className="mt-2 text-gray">متولی :</span>
            <span className="mt-2 mr-2 font-bold">{cashInfoList?.trustee}</span>
          </div>
          <div className="flex flex-row">
            <span className="mt-2 text-gray">بازارگردان :</span>
            <span className="mt-2 mr-2 font-bold">
              {cashInfoList?.marketMaking}
            </span>
          </div>
          <div className="flex flex-row">
            <span className="mt-2 text-gray">مدت فعالیت :</span>
            <span className="mt-2 mr-2 font-bold">
              {cashInfoList?.durationOfActivityInYear}
            </span>
          </div>
          <div className="flex flex-row">
            <span className="mt-2 text-gray">
              تعداد واحد های سرمایه گذاری ممتاز پذیره نویسی شده :
            </span>
            <span className="mt-2 mr-2 font-bold">
              {cashInfoList?.numberOfPreferredInvestmentUnitsUnderwritten}
            </span>
          </div>
          <div className="flex flex-row">
            <span className="mt-2 text-gray">شناسه ملی :</span>
            <span className="mt-2 mr-2 font-bold">
              {cashInfoList?.nationalId}
            </span>
          </div>
          <div className="flex flex-row">
            <span className="mt-2 text-gray">آدرس :</span>
            <span className="mt-2 mr-2 font-bold">{cashInfoList?.address}</span>
          </div>
          <div className="flex flex-row">
            <span className="mt-2 text-gray">ایمیل :</span>
            <span className="mt-2 mr-2 font-bold">{cashInfoList?.email}</span>
          </div>
          <div className="flex flex-row">
            <span className="mt-2 text-gray">موسس/موسسان :</span>
            <span className="mt-2 mr-2 font-bold">{cashInfoList?.founder}</span>
          </div>
          <div className="flex flex-row">
            <span className="mt-2 text-gray">مدیر :</span>
            <span className="mt-2 mr-2 font-bold">{cashInfoList?.manager}</span>
          </div>
          <div className="flex flex-row">
            <span className="mt-2 text-gray">حسابرس :</span>
            <span className="mt-2 mr-2 font-bold">{cashInfoList?.auditor}</span>
          </div>
          <div className="flex flex-row">
            <span className="mt-2 text-gray">
              تعداد واحد های سرمایه گذاری قابل انتشار :
            </span>
            <span className="mt-2 mr-2 font-bold">
              {cashInfoList?.numberOfDistributableInvestmentUnits}
            </span>
          </div>
          <div className="flex flex-row">
            <span className="mt-2 text-gray">
              تعداد واحد های سرمایه گذاری عادی قابل پذیره نویسی :
            </span>
            <span className="mt-2 mr-2 font-bold">
              {cashInfoList?.numberOfNormalInvestmentUnitsThatCanBeAccepted}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

export default withAlert(InvestmentFundsDetail);
