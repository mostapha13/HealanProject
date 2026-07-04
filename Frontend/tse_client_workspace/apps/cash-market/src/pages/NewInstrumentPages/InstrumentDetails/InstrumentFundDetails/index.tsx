import { Upload } from '@tse/components/atoms';
import withAlert from '../../../../hoc/withAlert';
import { useStates, useEffect } from '@tse/utils';
import { getQueryParams, convertDateToJalali, separator } from '@tse/tools';
import { getInstrumentFundDetail } from '../../../../Controller';

const initialState = {
  instrumentDetail: null,
};

function InstrumentFundDetails({ onAlert }: any) {
  const [state, setState] = useStates<any>(initialState);
  const { instrumentDetail } = state;

  const id = getQueryParams('id', window.location.href);
  useEffect(() => {
    if (id) {
      getInstrumentFundDetail({
        data: { id },
        onSuccess: onSuccessDetail,
        onFail,
      });
    }
  }, [id]);

  const onSuccessDetail = (result: any) => {
    setState({
      instrumentDetail: result,
    });
  };

  const onFail = (error: any) => {
    onAlert(error);
  };

  return (
    <div className="bg-bg p-2">
      <div className="w-full grid grid-cols-10 gap-4 py-2">
        <div className="col-span-1 justify-center items-center flex flex-col">
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-blue"></div>
            <span className="font-bold my-1 text-extratiny text-center">
              مشخصات صندوق
            </span>
          </div>
          <div className="border-r-2 border-blue h-full" />
        </div>

        <div className="col-span-9 bg-white shadow grid grid-cols-12 gap-4 p-4">
          <div className="col-span-4">
            <span className="font-bold">نام نماد : </span>
            <span>{instrumentDetail?.instrumentName}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">شرح نماد معاملاتی : </span>
            <span>{instrumentDetail?.description}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">صنعت : </span>
            <span>{instrumentDetail?.industry?.industryName}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">زیر صنعت : </span>
            <span>{instrumentDetail?.subIndustry?.subIndustryName}</span>
          </div>

          {/* <div className="col-span-4">
            <span className="font-bold">طبقه : </span>
            <span>
              {
                instrumentDetail?.instrumentDebitCategory
                  ?.instrumentDebitCategoryName
              }
            </span>
          </div> */}

          <div className="col-span-4">
            <span className="font-bold"> نوع صندوق : </span>
            <span>
              {instrumentDetail?.instrumentFundType?.instrumentFundTypeName}
            </span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">ارزش اسمی هر واحد : </span>
            <span>{separator(instrumentDetail?.unitCost)}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">تعداد کل واحد های صندوق : </span>
            <span>{separator(instrumentDetail?.instrumentFundTotalCount)}</span>
          </div>
          <div className="col-span-4">
            <span className="font-bold">عمر صندوق :</span>
            <span>{instrumentDetail?.fundLife}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">
              تعداد واحدهای سرمایه گذاری عادی قابل پذیره نویسی :
            </span>
            <span>
              {separator(instrumentDetail?.instrumentFundAcceptedCount)}
            </span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">
              تعداد واحدهای سرمایه گذاری ممتاز در اختیار موسسین :
            </span>
            <span>
              {separator(instrumentDetail?.instrumentFundFoundersCount)}
            </span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">پرداخت سود دوره ای:</span>
            <span>
              {
                instrumentDetail?.instrumentDebitInterestPaymentType
                  ?.instrumentInterestPaymentTypeName
              }
            </span>
          </div>

          {/* <div className="col-span-4">
            <span className="font-bold">بازار :</span>
            <span>
              {
                instrumentDetail?.instrumentDebitMarketType
                  ?.instrumentDebitMarketTypeName
              }
            </span>
          </div> */}

          <div className="col-span-4">
            <span className="font-bold">زمان تسویه :</span>
            <span>
              {
                instrumentDetail?.instrumentDebitSettlementTimeType
                  ?.instrumentDebitSettlementTimeTypeName
              }
            </span>
          </div>
          <div className="col-span-4">
            <span className="font-bold">کد صندوق :</span>
            <span>{instrumentDetail?.cashCode}</span>
          </div>
          <div className="col-span-4">
            <span className="font-bold">تاریخ شروع معاملات ثانویه :</span>
            <span>
              {convertDateToJalali(instrumentDetail?.startSecondaryDealingDate)}
            </span>
          </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-10 gap-4 py-2">
        <div className="col-span-1 justify-center items-center flex flex-col">
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-blue"></div>
            <span className="font-bold my-1 text-extratiny text-center">
              شرایط پذیره نویسی
            </span>
          </div>
          <div className="border-r-2 border-blue h-full" />
        </div>
        <div className="col-span-9 bg-white shadow grid grid-cols-12 gap-4 p-4">
          <div className="col-span-4">
            <span className="font-bold">روش پذیره نویسی : </span>
            <span>
              {instrumentDetail?.underwritingMethod?.underwritingMethodName}
            </span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">قیمت عرضه : </span>
            <span>{separator(instrumentDetail?.supplyPrice)}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">تاریخ شروع پذیره نویسی : </span>
            <span>
              {convertDateToJalali(instrumentDetail?.underwritingStartDate)}
            </span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">تاریخ پایان پذیره نویسی : </span>
            <span>
              {convertDateToJalali(instrumentDetail?.underwritingEndDate)}
            </span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">تاریخ شروع تمدید پذیره نویسی : </span>
            <span>
              {convertDateToJalali(
                instrumentDetail?.underwritingExtendedStartDate
              )}
            </span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">تاریخ پایان تمدید پذیره نویسی : </span>
            <span>
              {convertDateToJalali(
                instrumentDetail?.underwritingExtendedEndDate
              )}
            </span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">کارگزار عامل پذیره نویسی : </span>
            <span>{instrumentDetail?.underwritingBroker?.brokerName}</span>
          </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-10 gap-4 py-2">
        <div className="col-span-1 justify-center items-center flex flex-col">
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-blue"></div>
            <span className="font-bold my-1 text-extratiny text-center">
              ارکان صندوق
            </span>
          </div>
          <div className="border-r-2 border-blue h-full" />
        </div>
        <div className="col-span-9 bg-white shadow grid grid-cols-12 gap-4 p-4">
          <div className="col-span-4">
            <span className="font-bold">موسسین : </span>
            <span>{instrumentDetail?.funders}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">مدیر صندوق : </span>
            <span>{instrumentDetail?.funderManager}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">متولی : </span>
            <span>{instrumentDetail?.trustee}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">حسابرس : </span>
            <span>{instrumentDetail?.auditor}</span>
          </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-10 gap-4 py-2">
        <div className="col-span-1 justify-center items-center flex flex-col">
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-blue" />
            <span className="font-bold my-1 text-extratiny text-center">
              شرایط بازارگردانی
            </span>
          </div>
          <div className="border-r-2 border-blue h-full" />
        </div>
        <div className="col-span-9 bg-white shadow grid grid-cols-12 gap-4 p-4">
          <div className="col-span-8">
            <span className="font-bold">بازارگردان صندوق : </span>
            <span>{instrumentDetail?.fund?.fundName}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">کارگزار بازارگردان : </span>
            <span>{instrumentDetail?.marketMakerBroker?.brokerName}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">دامنه نوسان روزانه : </span>
            <span>{instrumentDetail?.dailyFluctuationRange}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">دامنه مظنه : </span>
            <span>{instrumentDetail?.quoteRange}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">حداقل معامله روزانه : </span>
            <span>{instrumentDetail?.minimumDailyTradingCommitment}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">حداقل سفارش انباشته : </span>
            <span>{instrumentDetail?.minimumCumulativeOrder}</span>
          </div>
          <div className="col-span-4">
            <span className="font-bold">کد بازارگردان : </span>
            <span>{instrumentDetail?.marketMakerCode}</span>
          </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-10 gap-4 py-2">
        <div className="col-span-1 justify-center items-center flex flex-col">
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-blue"></div>
            <span className="font-bold my-1 text-extratiny text-center">
              محدودیت های معاملاتی
            </span>
          </div>
          <div className="border-r-2 border-blue h-full" />
        </div>
        <div className="col-span-9 bg-white shadow grid grid-cols-12 gap-4 p-4">
          <div className="col-span-4">
            <span className="font-bold">حداقل تغییر قیمت : </span>
            <span>{instrumentDetail?.minimumPriceChange}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">واحد پایه هر سفارش : </span>
            <span>{instrumentDetail?.orderUnit}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">حداقل حجم هر سفارش : </span>
            <span>{instrumentDetail?.minimumOrderSize}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold ">حداکثر حجم هر سفارش :</span>
            <span>{instrumentDetail?.maximumOrderSize}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold ">حداکثر خرید کد معاملاتی حقیقی :</span>
            <span>{instrumentDetail?.realMaximumPurchase}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold ">حداکثر خرید کد معاملاتی حقوقی :</span>
            <span>{instrumentDetail?.legalMaximumPurchase}</span>
          </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-10 gap-4 py-2">
        <div className="col-span-1 justify-center items-center flex flex-col">
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-blue"></div>
            <span className="font-bold my-1 text-extratiny">فایل‌ها</span>
          </div>
        </div>
        <div className="col-span-9 bg-white shadow grid grid-cols-12 gap-4 p-4">
          <div className="col-span-4 flex flex-col">
            <span className="ml-4 mb-2 whitespace-pre">مجوز پذیره نویسی :</span>
            <Upload
              value={instrumentDetail?.subscriptionLicenseFile?.fileName}
              href={instrumentDetail?.subscriptionLicenseFile?.link}
              name="subscriptionLicenseFile"
              labelClassName="max-w-[9rem]"
            />
          </div>

          <div className="col-span-4 flex flex-col">
            <span className="ml-4 mb-2 whitespace-pre">برگه رجیستری :</span>
            <Upload
              value={instrumentDetail?.registrySheetFile?.fileName}
              href={instrumentDetail?.registrySheetFile?.link}
              name="registrySheetFile"
              labelClassName="max-w-[9rem]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAlert(InstrumentFundDetails);
