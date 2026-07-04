import { Upload } from '@tse/components/atoms';
import withAlert from '../../../../hoc/withAlert';
import { useStates, useEffect } from '@tse/utils';
import { getQueryParams, convertDateToJalali, separator } from '@tse/tools';
import { getDebitBondDetail } from '../../../../Controller';

const initialState = {
  instrumentDetail: null,
};

function InstrumentDebitDetails({ onAlert }: any) {
  const [state, setState] = useStates<any>(initialState);
  const { instrumentDetail } = state;

  const id = getQueryParams('id', window.location.href);

  useEffect(() => {
    if (id) {
      getDebitBondDetail({
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
            <span className="font-bold my-1 text-extratiny">مشخصات اوراق</span>
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
            <span className="font-bold">زیرصنعت : </span>
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
            <span className="font-bold">شرح نوع اوراق بدهی : </span>
            <span>{instrumentDetail?.debtBondType?.debtBondTypeName}</span>
          </div>
          <div className="col-span-4">
            <span className="font-bold">موضوع انتشار اوراق :</span>
            <span>{instrumentDetail?.debitBondSubject}</span>
          </div>
          <div className="col-span-4">
            <span className="font-bold">ارزش اسمی هر ورقه : </span>
            <span>{instrumentDetail?.debitBondCost}</span>
          </div>
          <div className="col-span-4">
            <span className="font-bold">نرخ اوراق :</span>
            <span>{instrumentDetail?.debitBondPrice}</span>
          </div>
          <div className="col-span-4">
            <span className="font-bold">مبلغ کل اوراق منتشره :</span>
            <span>{separator(instrumentDetail?.debitBondTotalAmount)}</span>
          </div>
          <div className="col-span-4">
            <span className="font-bold">تعداد کل اوراق منتشره :</span>
            <span>{separator(instrumentDetail?.debitBondTotalCount)}</span>
          </div>
          <div className="col-span-4">
            <span className="font-bold">
              تعداد اوراق پذیرفته شده و قابل عرضه :
            </span>
            <span>{separator(instrumentDetail?.debitBondAcceptedCount)}</span>
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
            <span className="font-bold">تاریخ انتشار اوراق :</span>
            <span>
              {convertDateToJalali(instrumentDetail?.debitBondPublishDate)}
            </span>
          </div>
          <div className="col-span-4">
            <span className="font-bold">تاریخ سررسید اوراق :</span>
            <span>
              {convertDateToJalali(instrumentDetail?.debitBondDueDate)}
            </span>
          </div>
          <div className="col-span-4">
            <span className="font-bold">مدت اوراق :</span>
            <span>{instrumentDetail?.underwritingTimePeriod}</span>
          </div>
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
              مشخصات مدیران
            </span>
          </div>
          <div className="border-r-2 border-blue h-full" />
        </div>
        <div className="col-span-9 bg-white shadow grid grid-cols-12 gap-4 p-4">
          <div className="col-span-4">
            <span className="font-bold">ناشر : </span>
            <span>{instrumentDetail?.publisher}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">بانی : </span>
            <span>{instrumentDetail?.sponsor}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">ضامن/ضمانت : </span>
            <span>{instrumentDetail?.guarantor}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">امین : </span>
            <span>{instrumentDetail?.trusted}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">حسابرس : </span>
            <span>{instrumentDetail?.auditor}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">عامل پرداخت سود : </span>
            <span>{instrumentDetail?.interestPaymentAgent}</span>
          </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-10 gap-4 py-2">
        <div className="col-span-1 justify-center items-center flex flex-col">
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-blue" />
            <span className="font-bold my-1 text-extratiny text-center">
              ارکان اوراق
            </span>
          </div>
          <div className="border-r-2 border-blue h-full" />
        </div>
        <div className="col-span-9 bg-white shadow grid grid-cols-12 gap-4 p-4">
          <div className="col-span-4">
            <span className="font-bold">بازارگردان : </span>
            <span>{instrumentDetail?.fund?.fundName}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">کارگزار بازارگردان : </span>
            <span>{instrumentDetail?.marketMakerBroker?.brokerName}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">روش بازارگردانی : </span>
            <span>
              {
                instrumentDetail?.marketMakerMethodType
                  ?.marketMakerMethodTypeName
              }
            </span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">دامنه نوسان روزانه : </span>
            <span>{separator(instrumentDetail?.dailyFluctuationRange)}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">دامنه مظنه : </span>
            <span>{separator(instrumentDetail?.quoteRange)}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">حداقل تعهدات روزانه : </span>
            <span>
              {separator(instrumentDetail?.minimumDailyTradingCommitment)}
            </span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">حداقل سفارش انباشته : </span>
            <span>{separator(instrumentDetail?.minimumCumulativeOrder)}</span>
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
            <span>{separator(instrumentDetail?.minimumPriceChange)}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">حداقل حجم هر سفارش : </span>
            <span>{separator(instrumentDetail?.minimumOrderSize)}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold ">حداکثر حجم هر سفارش :</span>
            <span>{separator(instrumentDetail?.maximumOrderSize)}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold ">مضرب هر سفارش :</span>
            <span>{instrumentDetail?.multipleOrderSize}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold ">حداقل تعداد قابل تخصیص :</span>
            <span>{separator(instrumentDetail?.allocatedMinimumNumber)}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold ">حداکثر خرید هر شخص حقیقی :</span>
            <span>{separator(instrumentDetail?.realMaximumPurchase)}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold ">حداکثر خرید هر شخص حقوقی :</span>
            <span>{separator(instrumentDetail?.legalMaximumPurchase)}</span>
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
            <span className="ml-4 mb-2 whitespace-pre">جدول سود روزشمار :</span>
            <Upload
              value={
                instrumentDetail?.debitBondCumulativeDailyProfitFile?.fileName
              }
              href={instrumentDetail?.debitBondCumulativeDailyProfitFile?.link}
              name="debitBondCumulativeDailyProfitFile"
              labelClassName="max-w-[9rem]"
            />
          </div>

          <div className="col-span-4 flex flex-col">
            <span className="ml-4 mb-2 whitespace-pre">
              جدول موعد پرداخت سود :
            </span>
            <Upload
              value={instrumentDetail?.debitBondInterestPaymentFile?.fileName}
              href={instrumentDetail?.debitBondInterestPaymentFile?.link}
              name="debitBondInterestPaymentFile"
              labelClassName="max-w-[9rem]"
            />
          </div>
          <div className="col-span-4 flex flex-col">
            <span className="ml-4 mb-2 whitespace-pre">سایر مدارک :</span>
            <Upload
              value={instrumentDetail?.debitBondOtherFile?.fileName}
              href={instrumentDetail?.debitBondOtherFile?.link}
              name="debitBondOtherFile"
              labelClassName="max-w-[9rem]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAlert(InstrumentDebitDetails);
