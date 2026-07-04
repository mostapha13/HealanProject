import withAlert from '../../../../hoc/withAlert';
import { useStates, useEffect } from '@tse/utils';
import { convertDateToJalali, getQueryParams, separator } from '@tse/tools';
import { getInstrumentFutureDetail } from '../../../../Controller';

const tradingDaysList = [
  {
    value: 1,
    name: 'شنبه',
  },
  {
    value: 2,
    name: 'یک‌ شنبه',
  },
  {
    value: 3,
    name: 'دو شنبه',
  },
  {
    value: 4,
    name: 'سه شنبه',
  },
  {
    value: 5,
    name: 'چهار شنبه',
  },
  {
    value: 6,
    name: 'پنج شنبه',
  },
  {
    value: 7,
    name: 'جمعه',
  },
];

const initialState = {
  instrumentDetail: null,
  selectedDays: null,
};

function InstrumentFutureDetails({ onAlert }: any) {
  const [state, setState] = useStates<any>(initialState);
  const { instrumentDetail, selectedDays } = state;

  const id = getQueryParams('id', window.location.href);

  useEffect(() => {
    if (id) {
      getInstrumentFutureDetail({
        data: { id },
        onSuccess: onSuccessDetail,
        onFail,
      });
    }
  }, [id]);

  const onSuccessDetail = (result: any) => {
    const days: any = [];
    result.instrumentFutureTradingDays?.map((i: any) => {
      tradingDaysList.map((j) => i?.dayOfWeek === j?.value && days.push(j));
    });

    setState({
      instrumentDetail: result,
      selectedDays: days,
    });
  };

  const onFail = (error: any) => {
    onAlert(error);
  };

  return (
    <div className="bg-bg p-2">
      <div className="w-full grid grid-cols-10 gap-4 py-2 min-h-[6rem]">
        <div className="col-span-1 justify-center items-center flex flex-col">
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-blue"></div>
            <span className="font-bold my-1 text-extratiny">اطلاعات نماد</span>
          </div>
          <div className="border-r-2 border-blue h-full" />
        </div>
        <div className="col-span-9 bg-white shadow grid grid-cols-12 gap-4 p-4">
          <div className="col-span-4">
            <span className="font-bold">نام نماد : </span>
            <span>{instrumentDetail?.instrumentName}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">شرح : </span>
            <span>{instrumentDetail?.description}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">نماد دارایی پایه : </span>
            <span>{instrumentDetail?.baseInstrumentName}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">قیمت پایانی روز اول : </span>
            <span>{separator(instrumentDetail?.firstClosingPrice)}</span>
          </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-10 gap-4 py-2">
        <div className="col-span-1 justify-center items-center flex flex-col">
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-blue"></div>
            <span className="font-bold my-1 text-extratiny whitespace-pre">
              تاریخ های مرتبط
            </span>
          </div>
          <div className="border-r-2 border-blue h-full" />
        </div>
        <div className="col-span-9 bg-white shadow grid grid-cols-12 gap-4 p-4">
          <div className="col-span-12 flex flex-row gap-2">
            <span className="font-bold">روزهای معاملاتی : </span>
            <div>
              {selectedDays?.map(({ name }: { name: string }) => {
                return <span>{name} ,</span>;
              })}
            </div>
          </div>

          <div className="col-span-4">
            <span className="font-bold">از ساعت : </span>
            <span>
              {instrumentDetail?.fromTime.hours}:
              {instrumentDetail?.fromTime.minutes}
            </span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">تا ساعت : </span>
            <span>
              {instrumentDetail?.toTime.hours}:
              {instrumentDetail?.toTime.minutes}
            </span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">از تاریخ : </span>
            <span>{convertDateToJalali(instrumentDetail?.fromDate)}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">تا تاریخ : </span>
            <span>{convertDateToJalali(instrumentDetail?.toDate)}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">تاریخ تسویه نقدی : </span>
            <span>
              {convertDateToJalali(instrumentDetail?.cashSettlementDate)}
            </span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">تاریخ تسویه فیزیکی : </span>
            <span>
              {convertDateToJalali(instrumentDetail?.verbalSettlementDate)}
            </span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">تاریخ تعیین اولویت تسویه : </span>
            <span>
              {convertDateToJalali(instrumentDetail?.settlementPriorityDate)}
            </span>
          </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-10 gap-4 py-2">
        <div className="col-span-1 justify-center items-center flex flex-col">
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-blue"></div>
            <span className="font-bold my-1 text-extratiny">محدودیت ها</span>
          </div>
          <div className="border-r-2 border-blue h-full" />
        </div>
        <div className="col-span-9 bg-white shadow grid grid-cols-12 gap-4 p-4">
          <div className="col-span-4">
            <span className="font-bold">اندازه قرارداد : </span>
            <span>{separator(instrumentDetail?.contractSize)}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">سقف تعداد هر سفارش : </span>
            <span>{separator(instrumentDetail?.quantityLimitPerOrder)}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">حداقل تعداد هر سفارش : </span>
            <span>{separator(instrumentDetail?.minAmountPerOrder)}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">مضرب هر سفارش (واحد) : </span>
            <span>{separator(instrumentDetail?.multiplePerOrder)}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">
              حداقل تغییر قیمت هر سفارش(ریال) :{' '}
            </span>
            <span>{separator(instrumentDetail?.minPriceChangePerOrder)}</span>
          </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-10 gap-4 py-2">
        <div className="col-span-1 justify-center items-center flex flex-col">
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-blue"></div>
            <span className="font-bold my-1 text-extratiny">تعیین سقف</span>
          </div>
          <div className="border-r-2 border-blue h-full" />
        </div>
        <div className="col-span-9 bg-white shadow grid grid-cols-12 gap-4 p-4">
          <div className="col-span-4">
            <span className="font-bold">موقعیت باز مشتری حقوقی : </span>
            <span>
              {separator(instrumentDetail?.legalCustomerOpenPosition)}
            </span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">موقعیت باز مشتری حقیقی : </span>
            <span>{separator(instrumentDetail?.realCustomerOpenPosition)}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">موقعیت باز کارگزار : </span>
            <span>{separator(instrumentDetail?.brokerOpenPosition)}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">موقعیت باز بازار : </span>
            <span>{separator(instrumentDetail?.marketOpenPosition)}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">سقف وثیقه قابل دریافت از مشتری : </span>
            <span>
              {separator(instrumentDetail?.customerCollateralMaxAmount)}
            </span>
          </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-10 gap-4 py-2">
        <div className="col-span-1 justify-center items-center flex flex-col">
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-blue" />
            <span className="font-bold my-1 text-extratiny text-center">
              وجوه تضمین و ضرایب
            </span>
          </div>
          <div className="border-r-2 border-blue h-full" />
        </div>
        <div className="col-span-9 bg-white shadow grid grid-cols-12 gap-4 p-4">
          <div className="col-span-4">
            <span className="font-bold">ضریب وجه تضمین اولیه : </span>
            <span>{instrumentDetail?.initialGuaranteeCoefficient}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">ضریب وجه تضمین لازم : </span>
            <span>{instrumentDetail?.necessaryGuaranteeCoefficient}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">ضریب حداقل وجه تضمین : </span>
            <span>{instrumentDetail?.minGuaranteeCoefficient}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">ضریب گرد کردن : </span>
            <span>{instrumentDetail?.roundingGuaranteeCoefficient}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">وجه تضمین اضافی (ریال) : </span>
            <span>{instrumentDetail?.additionalGuaranteeCoefficient}</span>
          </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-10 gap-4 py-2">
        <div className="col-span-1 justify-center items-center flex flex-col">
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-blue" />
            <span className="font-bold my-1 text-extratiny text-center">
              اطلاعات تکمیلی
            </span>
          </div>
          <div className="border-r-2 border-blue h-full" />
        </div>
        <div className="col-span-9 bg-white shadow grid grid-cols-12 gap-4 p-4">
          <div className="col-span-4">
            <span className="font-bold">ماه قرارداد : </span>
            <span>{instrumentDetail?.contractMonth}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">سال قرارداد : </span>
            <span>{instrumentDetail?.contractYear}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">دامنه نوسان(%) : </span>
            <span>{separator(instrumentDetail?.oscillationRange)}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">نوع تسویه در سررسید : </span>
            <span>
              {instrumentDetail?.instrumentFutureSettlementType?.typeName}
            </span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">روش تخصیص : </span>
            <span>
              {instrumentDetail?.instrumentFutureAllocationMethod?.methodName}
            </span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">تعیین قیمت مبنای دارایی پایه : </span>
            <span>
              {instrumentDetail?.instrumentFuturePriceAssetType?.assetTypeName}
            </span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">جریمه نکول : </span>
            <span>{instrumentDetail?.forfeitAmount}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">ضریب کارمزد تسویه نقدی : </span>
            <span>{instrumentDetail?.multipleCashSettlementAmount}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">ضریب کارمزد تسویه فیزیکی : </span>
            <span>{instrumentDetail?.multipleVerbalSettlementAmount}</span>
          </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-10 gap-4 py-2">
        <div className="col-span-1 justify-center items-center flex flex-col">
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-blue"></div>
            <span className="font-bold my-1 text-extratiny">بازار جبرانی</span>
          </div>
        </div>
        <div className="col-span-9 bg-white shadow grid grid-cols-12 gap-4 p-4">
          <div className="col-span-4">
            <span className="font-bold">از ساعت: </span>
            <span>
              {instrumentDetail?.compensatoryMarketFromTime.hours}:
              {instrumentDetail?.compensatoryMarketFromTime.minutes}
            </span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">تا ساعت : </span>
            <span>
              {instrumentDetail?.compensatoryMarketToTime.hours}:
              {instrumentDetail?.compensatoryMarketToTime.minutes}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAlert(InstrumentFutureDetails);
