import withAlert from '../../../../hoc/withAlert';
import { useStates, useEffect } from '@tse/utils';
import { Table } from '@tse/components/organism';
import { getQueryParams, convertDateToJalali, separator } from '@tse/tools';
import { getInstrumentTradeOptionDetail } from '../../../../Controller';

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

function InstrumentTradeOptionDetails({ onAlert }: any) {
  const [state, setState] = useStates<any>(initialState);
  const { instrumentDetail, selectedDays } = state;

  const id = getQueryParams('id', window.location.href);

  useEffect(() => {
    if (id) {
      getInstrumentTradeOptionDetail({
        data: { id },
        onSuccess: onSuccessDetail,
        onFail,
      });
    }
  }, [id]);

  const onSuccessDetail = (result: any) => {
    const days: any = [];
    result?.tradeOptionTradingDays?.map((i: any) => {
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

  const instrumentColumns = [
    {
      title: 'نام نماد معاملاتی اختیار خرید',
      dataIndex: 'buyInstrumentName',
      className: 'col-span-2',
    },
    {
      title: 'شرح نماد معاملاتی اختیار خرید',
      dataIndex: 'buyDescription',
      className: 'col-span-3',
    },
    {
      title: 'قیمت اعمال',
      dataIndex: 'appliedPrice',
      className: 'col-span-1 !text-center',
    },
    {
      title: 'نام نماد معاملاتی اختیار فروش',
      dataIndex: 'sellInstrumentName',
      className: 'col-span-2',
    },
    {
      title: 'شرح نماد معاملاتی اختیار فروش',
      dataIndex: 'sellDescription',
      className: 'col-span-3',
    },
  ];

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

        <div className="col-span-9 bg-white shadow flex flex-col gap-4 p-4">
          <div>
            <span className="font-bold">نماد دارایی پایه: </span>
            <span>{instrumentDetail?.baseInstrumentName}</span>
          </div>
          <Table
            columns={instrumentColumns}
            className="col-span-12 grid grid-cols-12"
            dataSource={instrumentDetail?.tradeOptionInstruments}
          />
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

          <div className="col-span-4">
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
          </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-10 gap-4 py-2 min-h-[6rem]">
        <div className="col-span-1 justify-center items-center flex flex-col">
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-blue"></div>
            <span className="font-bold my-1 text-extratiny">محدودیت ها</span>
          </div>
          <div className="border-r-2 border-blue h-full" />
        </div>
        <div className="col-span-9 bg-white shadow grid grid-cols-12 gap-4 p-4">
          <div className="col-span-4">
            <span className="font-bold">اندازه قرارداد: </span>
            <span>{separator(instrumentDetail?.contractSize)}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">سقف تعداد هر سفارش: </span>
            <span>{separator(instrumentDetail?.quantityLimitPerOrder)}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">حداقل تعدا هر سفارش: </span>
            <span>{separator(instrumentDetail?.minAmountPerOrder)}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">مضرب هر سفارش (واحد): </span>
            <span>{separator(instrumentDetail?.multiplePerOrder)}</span>
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
            <span className="font-bold">سقف تعداد موقعیتهای مشتری حقوقی: </span>
            <span>
              {separator(instrumentDetail?.legalCustomerOpenPosition)}
            </span>
          </div>
          <div className="col-span-4">
            <span className="font-bold">سقف تعداد موقعیتهای مشتری حقیقی: </span>
            <span>{separator(instrumentDetail?.realCustomerOpenPosition)}</span>
          </div>
          {/* <div className="col-span-6">
            <span className="font-bold">سقف تعداد موقعیتهای کارگزار: </span>
            <span>{separator(instrumentDetail?.brokerOpenPosition)}</span>
          </div> */}

          <div className="col-span-4">
            <span className="font-bold">سقف تعداد موقعیتهای بازار: </span>
            <span>{separator(instrumentDetail?.marketOpenPosition)}</span>
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
            <span className="font-bold">سبک اعمال: </span>
            <span>
              {instrumentDetail?.tradeOptionActionStyle?.actionStyleName}
            </span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">نوع تسویه پس از اعمال: </span>
            <span>
              {instrumentDetail?.tradeOptionSettlementType?.settlementTypeName}
            </span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">دامنه نوسان( از مبلغ ): </span>
            <span>{separator(instrumentDetail?.oscillationRangeFrom)}</span>
          </div>

          <div className="col-span-4">
            <span className="font-bold">دامنه نوسان( تا مبلغ ): </span>
            <span>{separator(instrumentDetail?.oscillationRangeTo)}</span>
          </div>

          {/* <div className="col-span-6">
            <span className="font-bold">جریمه نکول قراردادهای در سود: </span>
            <span>{separator(instrumentDetail?.forfeitProfitAmount)}</span>
          </div> */}

          <div className="col-span-4">
            <span className="font-bold">جریمه نکول :</span>
            <span>{instrumentDetail?.forfeitLossAmount}</span>
          </div>
          <div className="col-span-4">
            <span className="font-bold">
              امکان تسویه نقدی به کسری از اندازه قرارداد :
            </span>
            <span>
              {instrumentDetail?.canCashSettlement ? 'وجود دارد' : 'وجود ندارد'}
            </span>
          </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-10 gap-4 py-2">
        <div className="col-span-1 justify-center items-center flex flex-col">
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-blue"></div>
            <span className="font-bold my-1 text-extratiny">ضرایب</span>
          </div>
        </div>
        <div className="col-span-9 bg-white shadow grid grid-cols-12 gap-4 p-4">
          <div className="col-span-4 flex flex-rowّ">
            <div>
              <span className="font-bold ml-1">ضریب A: </span>
            </div>
            <span>{instrumentDetail?.multipleA}</span>
          </div>

          <div className="col-span-4 flex flex-rowّ">
            <div>
              <span className="font-bold ml-1">ضریب B: </span>
            </div>
            <span>{instrumentDetail?.multipleB}</span>
          </div>

          <div className="col-span-4 flex flex-rowّ">
            <div>
              <span className="font-bold ml-1">ضریب C: </span>
            </div>
            <span>{instrumentDetail?.multipleC}</span>
          </div>
          <div className="col-span-4">
            <span className="font-bold">نسبت حداقل وجه تضمین : </span>
            <span>{instrumentDetail?.minimumGuaranteeRatio}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAlert(InstrumentTradeOptionDetails);
