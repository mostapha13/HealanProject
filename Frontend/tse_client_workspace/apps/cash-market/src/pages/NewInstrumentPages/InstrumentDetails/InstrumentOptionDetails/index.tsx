import withAlert from '../../../../hoc/withAlert';
import { useStates, useEffect } from '@tse/utils';
import { getQueryParams, convertDateToJalali, separator } from '@tse/tools';
import { getInstrumentOptionDetail } from '../../../../Controller';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';

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

function InstrumentOptionDetails({ onAlert }: any) {
  const [state, setState] = useStates<any>(initialState);
  const { instrumentDetail, selectedDays } = state;

  const id = getQueryParams('id', window.location.href);

  useEffect(() => {
    if (id) {
      getInstrumentOptionDetail({
        data: { id },
        onSuccess: onSuccessDetail,
        onFail,
      });
    }
  }, [id]);

  const onSuccessDetail = (result: any) => {
    const days: any = [];
    result?.optionTradingDays?.map((i: any) => {
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
      <div className="w-full grid grid-cols-10 gap-4 py-2">
        <div className="col-span-1 justify-center items-center flex flex-col">
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-blue"></div>
            <span className="font-bold my-1 text-extratiny">اطلاعات نماد</span>
          </div>
          <div className="border-r-2 border-blue h-full" />
        </div>
        <div className="col-span-9 bg-white shadow grid grid-cols-12 gap-4 p-4">
          <div className="col-span-4 flex flex-row">
            <span className="text-extratiny whitespace-pre font-bold ml-6">
              هدف از انتشار :
            </span>
            <span>
              {instrumentDetail?.hasFinancingPurpose
                ? 'تامین مالی'
                : 'حمایت از بازار'}
            </span>
          </div>
          <div className="col-span-4">
            <span className="font-bold">نماد دارایی پایه:</span>
            <span>{instrumentDetail?.baseInstrumentName}</span>
          </div>
          {instrumentDetail?.hasFinancingPurpose && (
            <>
              <div className="col-span-4">
                <span className="font-bold">
                  نام نماد معاملاتی اختیار خرید:
                </span>
                <span>{instrumentDetail?.buyInstrumentName}</span>
              </div>

              <div className="col-span-4">
                <span className="font-bold">
                  شرح نماد معاملاتی اختیار خرید:
                </span>
                <span>{instrumentDetail?.buyDescription}</span>
              </div>

              <div className="col-span-4">
                <span className="font-bold">قیمت اعمال خرید: </span>
                <span>{separator(instrumentDetail?.buyAppliedPrice)}</span>
              </div>
              <div className="col-span-4">
                <span className="font-bold">تاریخ سررسید خرید: </span>
                <span>{convertDateToJalali(instrumentDetail?.buyDueDate)}</span>
              </div>
            </>
          )}

          <div className="col-span-4">
            <span className="font-bold">نام نماد معاملاتی اختیار فروش: </span>
            <span>{instrumentDetail?.sellDescription}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">شرح نماد معاملاتی اختیار فروش: </span>
            <span>{instrumentDetail?.sellDescription}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">قیمت اعمال فروش: </span>
            <span>{separator(instrumentDetail?.sellAppliedPrice)}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">تاریخ سررسید فروش: </span>
            <span>{convertDateToJalali(instrumentDetail?.sellDueDate)}</span>
          </div>
          <div className="col-span-4">
            <span className="font-bold">نرخ انتشار: </span>
            <span>{convertDateToJalali(instrumentDetail?.financingRate)}</span>
          </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-10 gap-4 py-2 min-h-[6rem]">
        <div className="col-span-1 justify-center items-center flex flex-col">
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-blue"></div>
            <span className="font-bold my-1 text-extratiny whitespace-pre">
              اطلاعات عرضه کننده
            </span>
          </div>
          <div className="border-r-2 border-blue h-full" />
        </div>
        <div className="col-span-9 bg-white shadow grid grid-cols-12 gap-4 p-4">
          <div className="col-span-4">
            <span className="font-bold">عرضه کننده: </span>
            <span>{instrumentDetail?.supplierName}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">کد عرضه کننده: </span>
            <span>{instrumentDetail?.supplierCode}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">تعداد اوراق قابل سپرده در کد: </span>
            <span>{instrumentDetail?.depositableBondsNumber}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">کارگزار ناظر: </span>
            <span>{instrumentDetail?.supervisingBroker?.brokerName}</span>
          </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-10 gap-4 py-2">
        <div className="col-span-1 justify-center items-center flex flex-col">
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-blue"></div>
            <span className="font-bold my-1 text-extratiny">جزئیات سفارش</span>
          </div>
          <div className="border-r-2 border-blue h-full" />
        </div>
        <div className="col-span-9 bg-white shadow grid grid-cols-12 gap-4 p-4">
          <div className="col-span-4">
            <span className="font-bold">سقف خرید کد حقیقی: </span>
            <span>{instrumentDetail?.realCodeBuyLimit}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">سقف خرید کد حقوقی: </span>
            <span>{instrumentDetail?.legalCodeBuyLimit}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">حداقل مقدار هر سفارش: </span>
            <span>{instrumentDetail?.orderMinAmount}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">حداکثر مقدار هر سفارش: </span>
            <span>{instrumentDetail?.orderMaxAmount}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">حداقل تغییر قیمت هر سفارش : </span>
            <span>{instrumentDetail?.orderMinChange}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">مضرب هر سفارش (واحد) : </span>
            <span>{instrumentDetail?.orderMultiple}</span>
          </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-10 gap-4 py-2">
        <div className="col-span-1 justify-center items-center flex flex-col">
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-blue"></div>
            <span className="font-bold my-1 text-extratiny">تاریخ</span>
          </div>
          <div className="border-r-2 border-blue h-full" />
        </div>
        <div className="col-span-9 bg-white shadow grid grid-cols-12 gap-4 p-4">
          <div className="col-span-12 flex flex-row gap-2">
            <span className="font-bold">روزهای معاملاتی: </span>
            <div>
              {selectedDays?.map(({ name }: { name: string }) => {
                return <span>{name} ,</span>;
              })}
            </div>
          </div>

          <div className="col-span-4">
            <span className="font-bold">از ساعت: </span>
            <span>
              {instrumentDetail?.fromTime.hours}:
              {instrumentDetail?.fromTime.minutes}
            </span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">تا ساعت: </span>
            <span>
              {instrumentDetail?.toTime.hours}:
              {instrumentDetail?.toTime.minutes}
            </span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">از تاریخ: </span>
            <span>{convertDateToJalali(instrumentDetail?.fromDate)}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">تا تاریخ: </span>
            <span>{convertDateToJalali(instrumentDetail?.toDate)}</span>
          </div>

          {/* <div className="col-span-4">
            <span className="font-bold">تاریخ تسویه نقدی: </span>
            <span>
              {convertDateToJalali(instrumentDetail?.cashSettlementDate)}
            </span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">تاریخ تسویه فیزیکی: </span>
            <span>
              {convertDateToJalali(instrumentDetail?.verbalSettlementDate)}
            </span>
          </div> */}
        </div>
      </div>

      <div className="w-full grid grid-cols-10 gap-4 py-2">
        <div className="col-span-1 justify-start items-center flex flex-col">
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-blue" />
            <span className="font-bold my-1 text-extratiny text-center">
              اطلاعات تکمیلی
            </span>
          </div>
        </div>
        <div className="col-span-9 bg-white shadow grid grid-cols-12 gap-4 p-4">
          <div className="col-span-12">
            <FormControlLabel
              disabled
              control={<Checkbox checked={false} />}
              label="Day trade"
              className="!m-0 !text-extratiny"
            />
          </div>

          <div className="col-span-4">
            <span className="font-bold">دامنه نوسان(از مبلغ) : </span>
            <span>{instrumentDetail?.oscillationRangeFrom}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">دامنه نوسان(تا مبلغ) : </span>
            <span>{instrumentDetail?.oscillationRangeTo}</span>
          </div>
          <div className="col-span-4">
            <span className="font-bold">معاملات ثانویه :</span>
            <span>
              {instrumentDetail?.canCashSettlement ? 'دارد' : ' ندارد'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAlert(InstrumentOptionDetails);
