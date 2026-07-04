import {
  TextField,
  Select,
  TimePickerInput,
  Button,
  SelectMultiple,
} from '@tse/components/atoms';
import withAlert from '../../../hoc/withAlert';
import { useStates, useEffect, useNavigate } from '@tse/utils';
import { SymbolModal } from '@tse/components/organism';
import { DatePicker } from '@tse/components/molecules';
import { getQueryParams, convertTimeFormat } from '@tse/tools';
import {
  getInstrumentList,
  getAllocationMethod,
  getPriceAssetType,
  getSettlementType,
  saveInstrumentFuture,
  getInstrumentFutureDetail,
  getWorkingDate,
} from '../../../Controller';
import { Radio } from 'antd';

const cashSettlementData = [
  {
    id: 0,
    title: 'وجود ندارد',
  },
  {
    id: 1,
    title: 'وجود دارد',
  },
];

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
  symbolList: [],
  selectedInstrument: null,
  allocationMethodList: [],
  priceAssetTypeList: [],
  settlementTypeList: [],
  instrumentName: '',
  description: '',
  firstClosingPrice: '',
  selectedTradingDays: [1, 2, 3, 4, 5],
  fromTime: '08:45',
  toTime: '',
  fromDate: '',
  toDate: '',
  cashSettlementDate: '',
  verbalSettlementDate: '',
  settlementPriorityDate: '',
  contractSize: '',
  quantityLimitPerOrder: '1000',
  minAmountPerOrder: '1',
  multiplePerOrder: '1',
  minPriceChangePerOrder: '1',
  legalCustomerOpenPosition: '',
  realCustomerOpenPosition: '',
  brokerOpenPosition: '',
  marketOpenPosition: '',
  customerCollateralMaxAmount: 'در اختیار کارگزار',
  initialGuaranteeCoefficient: '25',
  necessaryGuaranteeCoefficient: '25',
  minGuaranteeCoefficient: '50',
  roundingGuaranteeCoefficient: '10000',
  additionalGuaranteeCoefficient: '0',
  contractMonth: '',
  contractYear: '',
  oscillationRange: '10',
  forfeitAmount: '0.001',
  multipleCashSettlementAmount: '0.0005',
  multipleVerbalSettlementAmount: '0.005',
  selectedSettlementType: null,
  selectedAllocationMethod: null,
  selectedPriceAssetType: null,
  compensatoryMarketFromTime: '',
  compensatoryMarketToTime: '',
  canCashSettlement: 0,
};

function Future({ onAlert }: any) {
  const navigate = useNavigate();
  const [state, setState] = useStates<any>(initialState);
  const {
    symbolList,
    selectedInstrument,
    allocationMethodList,
    priceAssetTypeList,
    settlementTypeList,
    instrumentName,
    description,
    firstClosingPrice,
    selectedTradingDays,
    fromTime,
    toTime,
    fromDate,
    toDate,
    cashSettlementDate,
    verbalSettlementDate,
    settlementPriorityDate,
    contractSize,
    quantityLimitPerOrder,
    minAmountPerOrder,
    multiplePerOrder,
    minPriceChangePerOrder,
    legalCustomerOpenPosition,
    realCustomerOpenPosition,
    brokerOpenPosition,
    marketOpenPosition,
    customerCollateralMaxAmount,
    initialGuaranteeCoefficient,
    necessaryGuaranteeCoefficient,
    minGuaranteeCoefficient,
    roundingGuaranteeCoefficient,
    additionalGuaranteeCoefficient,
    contractMonth,
    contractYear,
    oscillationRange,
    forfeitAmount,
    multipleCashSettlementAmount,
    multipleVerbalSettlementAmount,
    selectedSettlementType,
    selectedAllocationMethod,
    selectedPriceAssetType,
    compensatoryMarketFromTime,
    compensatoryMarketToTime,
    canCashSettlement,
  } = state;

  const isFund = selectedInstrument?.marketTypeId === 'ETF';
  const isCopy = getQueryParams('isCopy', window.location.href) === 'true';
  const id = getQueryParams('id', window.location.href);

  useEffect(() => {
    getSymbolList('', 1);
    getAllocationMethodList();
    getPriceAssetTypeList();
    getSettlementTypeList();
    if (!id) {
      handleGetWorkingDate('', 3, 'startDate');
    }
  }, []);

  useEffect(() => {
    if (id) {
      getInstrumentFutureDetail({
        data: { id },
        onSuccess: onSuccessDetail,
        onFail,
      });
    }
  }, [id]);
  useEffect(() => {
    if (selectedInstrument && !id) {
      setState({
        toTime: isFund ? '15:00' : '12:30',
        oscillationRangeTo: isFund ? '500000' : '100000',
        compensatoryMarketFromTime: isFund ? '15:30' : '13:00',
        compensatoryMarketToTime: isFund ? '16:00' : '13:30',
      });
    }
  }, [selectedInstrument]);
  // useEffect(() => {
  //   if (verbalSettlementDate != '' && !id) {
  //     handleGetWorkingDate(verbalSettlementDate, -1, 'cashSettlementDate');
  //   }
  // }, [verbalSettlementDate]);

  const handleGetWorkingDate = (
    baseDateTime: any,
    day: any,
    component: string
  ) => {
    const data = {
      BaseDateTime: baseDateTime,
      NextWorkingDayLater: day,
    };
    getWorkingDate({
      data,
      onSuccess: (res: any) => {
        if (component === 'startDate') {
          setState({
            fromDate: res?.nextWorkingDate,
          });
        }
        // else if (component === 'cashSettlementDate') {
        //   setState({
        //     cashSettlementDate: res?.nextWorkingDate,
        //   });
        // }
      },
      onFail,
    });
  };
  useEffect(() => {}, [toDate]);
  const onSuccessDetail = (result: any) => {
    const {
      instrumentName,
      description,
      firstClosingPrice,
      fromTime,
      toTime,
      fromDate,
      toDate,
      cashSettlementDate,
      verbalSettlementDate,
      settlementPriorityDate,
      contractSize,
      quantityLimitPerOrder,
      minAmountPerOrder,
      multiplePerOrder,
      minPriceChangePerOrder,
      legalCustomerOpenPosition,
      realCustomerOpenPosition,
      brokerOpenPosition,
      marketOpenPosition,
      customerCollateralMaxAmount,
      initialGuaranteeCoefficient,
      necessaryGuaranteeCoefficient,
      minGuaranteeCoefficient,
      roundingGuaranteeCoefficient,
      additionalGuaranteeCoefficient,
      contractMonth,
      contractYear,
      oscillationRange,
      forfeitAmount,
      multipleCashSettlementAmount,
      multipleVerbalSettlementAmount,
      compensatoryMarketFromTime,
      compensatoryMarketToTime,
      baseInstrumentId,
      baseInstrumentName,
      baseCompanyName,
      instrumentFutureTradingDays,
      instrumentFutureSettlementType,
      instrumentFuturePriceAssetType,
      instrumentFutureAllocationMethod,
      canCashSettlement,
      baseMarketTypeId,
    } = result;

    const days: any = [];
    instrumentFutureTradingDays?.map((i: any) => {
      tradingDaysList.map(
        (j) => i?.dayOfWeek === j?.value && days.push(j?.value)
      );
    });

    setState({
      selectedInstrument: {
        symbol: baseInstrumentName,
        instrumentId: baseInstrumentId,
        symbolName: baseCompanyName,
        marketTypeId: baseMarketTypeId,
      },
      instrumentName,
      description,
      firstClosingPrice,
      selectedTradingDays: days,
      fromTime: convertTimeFormat(fromTime),
      toTime: convertTimeFormat(toTime),
      fromDate,
      toDate,
      cashSettlementDate,
      verbalSettlementDate,
      settlementPriorityDate,
      contractSize,
      quantityLimitPerOrder,
      minAmountPerOrder,
      multiplePerOrder,
      minPriceChangePerOrder,
      legalCustomerOpenPosition,
      realCustomerOpenPosition,
      brokerOpenPosition,
      marketOpenPosition,
      customerCollateralMaxAmount,
      initialGuaranteeCoefficient,
      necessaryGuaranteeCoefficient,
      minGuaranteeCoefficient,
      roundingGuaranteeCoefficient,
      additionalGuaranteeCoefficient,
      contractMonth,
      contractYear,
      oscillationRange,
      forfeitAmount,
      multipleCashSettlementAmount,
      multipleVerbalSettlementAmount,
      compensatoryMarketFromTime: convertTimeFormat(compensatoryMarketFromTime),
      compensatoryMarketToTime: convertTimeFormat(compensatoryMarketToTime),
      selectedPriceAssetType:
        instrumentFuturePriceAssetType?.instrumentFuturePriceAssetTypeId,
      selectedSettlementType:
        instrumentFutureSettlementType?.instrumentFutureSettlementTypeId,
      selectedAllocationMethod:
        instrumentFutureAllocationMethod?.instrumentFutureAllocationMethodId,
      canCashSettlement: canCashSettlement ? 1 : 0,
    });
  };

  const getAllocationMethodList = () => {
    getAllocationMethod({
      onSuccess: (res) =>
        setState({
          allocationMethodList: res,
          selectedAllocationMethod:
            res?.[0]?.instrumentFutureAllocationMethodId,
        }),
      onFail,
    });
  };

  const getPriceAssetTypeList = () => {
    getPriceAssetType({
      onSuccess: (res) =>
        setState({
          priceAssetTypeList: res,
          selectedPriceAssetType: res?.[0]?.instrumentFuturePriceAssetTypeId,
        }),
      onFail,
    });
  };

  const getSettlementTypeList = () => {
    getSettlementType({
      onSuccess: (res) =>
        setState({
          settlementTypeList: res,
          selectedSettlementType: res?.[0]?.instrumentFutureSettlementTypeId,
        }),
      onFail,
    });
  };

  const getSymbolList = (text: string, pageNo: number) => {
    const data = {
      SearchText: text,
      PageNumber: pageNo,
    };
    getInstrumentList({ data, onSuccess: onSuccessSymbolList, onFail });
  };

  const onSuccessSymbolList = (list: any) => {
    setState({
      symbolList: list,
    });
  };

  const onFail = (error: any) => {
    onAlert(error);
  };

  const onSubmit = () => {
    if (
      selectedInstrument &&
      instrumentName &&
      description &&
      firstClosingPrice &&
      selectedTradingDays &&
      fromTime &&
      toTime &&
      fromDate &&
      toDate &&
      cashSettlementDate &&
      verbalSettlementDate &&
      settlementPriorityDate &&
      contractSize &&
      quantityLimitPerOrder &&
      minAmountPerOrder &&
      multiplePerOrder &&
      minPriceChangePerOrder &&
      legalCustomerOpenPosition &&
      realCustomerOpenPosition &&
      brokerOpenPosition &&
      marketOpenPosition &&
      customerCollateralMaxAmount &&
      initialGuaranteeCoefficient &&
      necessaryGuaranteeCoefficient &&
      minGuaranteeCoefficient &&
      roundingGuaranteeCoefficient &&
      additionalGuaranteeCoefficient !== '' &&
      contractMonth &&
      contractYear &&
      oscillationRange &&
      forfeitAmount &&
      multipleCashSettlementAmount &&
      multipleVerbalSettlementAmount &&
      compensatoryMarketFromTime &&
      compensatoryMarketToTime
    ) {
      const instrumentFutureTradingDays: any = [];
      selectedTradingDays?.map((item: any) =>
        instrumentFutureTradingDays.push({ dayOfWeek: item })
      );
      const data = {
        ...(!isCopy && id && { instrumentFutureId: id }),
        instrumentName,
        description,
        baseInstrumentId: selectedInstrument?.instrumentId,
        baseInstrumentName: selectedInstrument?.symbol,
        baseCompanyName: selectedInstrument?.symbolName,
        baseMarketTypeId: selectedInstrument?.marketTypeId,
        firstClosingPrice,
        instrumentFutureTradingDays,
        fromTime: {
          hours: fromTime?.split(':')[0],
          minutes: fromTime?.split(':')[1],
        },
        toTime: {
          hours: toTime?.split(':')[0],
          minutes: toTime?.split(':')[1],
        },
        fromDate,
        toDate,
        cashSettlementDate,
        verbalSettlementDate,
        settlementPriorityDate,
        contractSize,
        quantityLimitPerOrder,
        minAmountPerOrder,
        multiplePerOrder,
        minPriceChangePerOrder,
        legalCustomerOpenPosition,
        realCustomerOpenPosition,
        brokerOpenPosition,
        marketOpenPosition,
        customerCollateralMaxAmount,
        initialGuaranteeCoefficient,
        necessaryGuaranteeCoefficient,
        minGuaranteeCoefficient,
        roundingGuaranteeCoefficient,
        additionalGuaranteeCoefficient,
        contractMonth,
        contractYear,
        oscillationRange,
        forfeitAmount,
        multipleCashSettlementAmount,
        multipleVerbalSettlementAmount,
        compensatoryMarketFromTime: {
          hours: compensatoryMarketFromTime?.split(':')[0],
          minutes: compensatoryMarketFromTime?.split(':')[1],
        },
        compensatoryMarketToTime: {
          hours: compensatoryMarketToTime?.split(':')[0],
          minutes: compensatoryMarketToTime?.split(':')[1],
        },
        instrumentFutureSettlementType: {
          instrumentFutureSettlementTypeId: selectedSettlementType,
        },
        instrumentFutureAllocationMethod: {
          instrumentFutureAllocationMethodId: selectedAllocationMethod,
        },
        instrumentFuturePriceAssetType: {
          instrumentFuturePriceAssetTypeId: selectedPriceAssetType,
        },
        canCashSettlement: canCashSettlement === 1 ? true : false,
      };
      saveInstrumentFuture({ data, onSuccess: onSuccessSave, onFail });
    } else {
      !selectedInstrument && setErrorMessage('selectedInstrument');
      !instrumentName && setErrorMessage('instrumentName');
      !description && setErrorMessage('description');
      !firstClosingPrice && setErrorMessage('firstClosingPrice');
      selectedTradingDays?.length === 0 &&
        setErrorMessage('selectedTradingDays');
      !fromTime && setErrorMessage('fromTime');
      !toTime && setErrorMessage('toTime');
      !fromDate && setErrorMessage('fromDate');
      !toDate && setErrorMessage('toDate');
      !cashSettlementDate && setErrorMessage('cashSettlementDate');
      !verbalSettlementDate && setErrorMessage('verbalSettlementDate');
      !settlementPriorityDate && setErrorMessage('settlementPriorityDate');
      !contractSize && setErrorMessage('contractSize');
      !quantityLimitPerOrder && setErrorMessage('quantityLimitPerOrder');
      !minAmountPerOrder && setErrorMessage('minAmountPerOrder');
      !multiplePerOrder && setErrorMessage('multiplePerOrder');
      !minPriceChangePerOrder && setErrorMessage('minPriceChangePerOrder');
      !legalCustomerOpenPosition &&
        setErrorMessage('legalCustomerOpenPosition');
      !realCustomerOpenPosition && setErrorMessage('realCustomerOpenPosition');
      !brokerOpenPosition && setErrorMessage('brokerOpenPosition');
      !marketOpenPosition && setErrorMessage('marketOpenPosition');
      !customerCollateralMaxAmount &&
        setErrorMessage('customerCollateralMaxAmount');
      !initialGuaranteeCoefficient &&
        setErrorMessage('initialGuaranteeCoefficient');
      // !necessaryGuaranteeCoefficient && setErrorMessage('fromTime');
      !necessaryGuaranteeCoefficient &&
        setErrorMessage('necessaryGuaranteeCoefficient');
      !roundingGuaranteeCoefficient &&
        setErrorMessage('roundingGuaranteeCoefficient');
      additionalGuaranteeCoefficient === '' &&
        setErrorMessage('additionalGuaranteeCoefficient');
      !contractMonth && setErrorMessage('contractMonth');
      !contractYear && setErrorMessage('contractYear');
      !oscillationRange && setErrorMessage('oscillationRange');
      !forfeitAmount && setErrorMessage('forfeitAmount');
      !multipleCashSettlementAmount &&
        setErrorMessage('multipleCashSettlementAmount');
      !multipleVerbalSettlementAmount &&
        setErrorMessage('multipleVerbalSettlementAmount');
      !compensatoryMarketFromTime &&
        setErrorMessage('compensatoryMarketFromTime');
      !compensatoryMarketToTime && setErrorMessage('compensatoryMarketToTime');
    }
  };

  const setErrorMessage = (key: string) => {
    const errorMessage = ' ';
    setState({ [`${key}Error`]: errorMessage });
  };

  const onSuccessSave = () => {
    onAlert({ message: 'عملیات با موفقیت انجام شد', type: 'success' });
    navigate('/instrument/instrument-list');
  };

  return (
    <div>
      <div className="w-full py-4">
        <span className="font-bold text-blue">اطلاعات نماد</span>
        <div className="grid grid-cols-12 gap-4 p-4">
          <TextField
            label="نام نماد"
            className="col-span-3"
            value={instrumentName}
            onChange={(value: any) =>
              setState({
                instrumentName: value,
                instrumentNameError: '',
              })
            }
            required
            errorMessage={state?.instrumentNameError}
            maxLength={8}
          />
          <TextField
            label="شرح"
            className="col-span-3"
            value={description}
            onChange={(value: any) =>
              setState({
                description: value,
                descriptionError: '',
              })
            }
            required
            errorMessage={state?.descriptionError}
            maxLength={30}
          />
          <SymbolModal
            className="col-span-3"
            data={symbolList}
            onChange={(pageNo: number, text: string) =>
              getSymbolList(text, pageNo)
            }
            onSubmit={(value: any) =>
              setState({
                selectedInstrument: value,
                selectedInstrumentError: '',
              })
            }
            defaultValue={selectedInstrument}
            label="نماد دارایی پایه"
            required
            error={state?.selectedInstrumentError}
          />
          <TextField
            label="قیمت پایانی روز اول"
            className="col-span-3"
            value={firstClosingPrice}
            onChange={(value: any) =>
              setState({
                firstClosingPrice: value,
                firstClosingPriceError: '',
              })
            }
            required
            errorMessage={state?.firstClosingPriceError}
            type="numeric"
          />
        </div>
      </div>

      <div className="w-full py-2 mt-4">
        <span className="font-bold mt-2 text-blue whitespace-pre">
          تاریخ های مرتبط
        </span>
        <div className="grid grid-cols-12 gap-4 p-4">
          <div className="col-span-3">
            <SelectMultiple
              placeholder="روزهای معاملاتی"
              options={tradingDaysList}
              onChange={(value: any) =>
                setState({
                  selectedTradingDays: value,
                  selectedTradingDaysError: '',
                })
              }
              value={selectedTradingDays}
              limit={7}
              required
              errorMessage={state?.firstClosingPriceError}
            />
          </div>
          <TimePickerInput
            className="col-span-3"
            label="از ساعت"
            value={fromTime}
            onChange={(value: any) =>
              setState({
                fromTime: value,
                fromTimeError: '',
              })
            }
            required
            error={state?.fromTimeError}
          />
          <TimePickerInput
            className="col-span-3"
            label="تا ساعت"
            value={toTime}
            onChange={(value: any) =>
              setState({
                toTime: value,
                toTimeError: '',
              })
            }
            required
            error={state?.toTimeError}
          />
          <div className="col-span-3 z-20">
            <DatePicker
              label="از تاریخ"
              value={fromDate}
              onChange={(value: any) =>
                setState({
                  fromDate: value,
                  fromDateError: '',
                })
              }
              required
              error={state?.fromDateError}
            />
          </div>

          <div className="col-span-3 z-10">
            <DatePicker
              label="تا تاریخ "
              value={toDate}
              onChange={(value: any) =>
                setState({
                  toDate: value,
                  cashSettlementDate: value,
                  verbalSettlementDate: value,
                  settlementPriorityDate: value,
                  toDateError: '',
                })
              }
              required
              error={state?.toDateError}
            />
          </div>
          <div className="col-span-3 z-10">
            <DatePicker
              label=" تاریخ تسویه فیزیکی "
              value={verbalSettlementDate}
              onChange={(value: any) =>
                setState({
                  verbalSettlementDate: value,
                  verbalSettlementDateError: '',
                })
              }
              required
              error={state?.verbalSettlementDateError}
            />
          </div>
          <div className="col-span-3 z-10">
            <DatePicker
              label=" تاریخ تسویه نقدی "
              value={cashSettlementDate}
              onChange={(value: any) =>
                setState({
                  cashSettlementDate: value,
                  cashSettlementDateError: '',
                })
              }
              required
              error={state?.cashSettlementDateError}
            />
          </div>
          <div className="col-span-3 z-10">
            <DatePicker
              label=" تاریخ تعیین اولویت تسویه "
              value={settlementPriorityDate}
              onChange={(value: any) =>
                setState({
                  settlementPriorityDate: value,
                  settlementPriorityDateError: '',
                })
              }
              required
              error={state?.settlementPriorityDateError}
            />
          </div>
        </div>
      </div>

      <div className="w-full py-2">
        <span className="font-bold mt-1 text-blue">محدودیت ها</span>
        <div className="grid grid-cols-12 gap-4 p-4">
          <TextField
            label="اندازه قرارداد"
            className="col-span-3"
            value={contractSize}
            onChange={(value: any) =>
              setState({
                contractSize: value,
                contractSizeError: '',
              })
            }
            required
            errorMessage={state?.contractSizeError}
            type="numeric"
          />
          <TextField
            label="سقف تعداد هر سفارش"
            className="col-span-3"
            value={quantityLimitPerOrder}
            onChange={(value: any) =>
              setState({
                quantityLimitPerOrder: value,
                quantityLimitPerOrderError: '',
              })
            }
            required
            errorMessage={state?.quantityLimitPerOrderError}
            type="numeric"
          />
          <TextField
            label="حداقل تعداد هر سفارش"
            className="col-span-3"
            value={minAmountPerOrder}
            onChange={(value: any) =>
              setState({
                minAmountPerOrder: value,
                minAmountPerOrderError: '',
              })
            }
            required
            errorMessage={state?.minAmountPerOrderError}
            type="numeric"
          />
          <TextField
            label="مضرب هر سفارش (واحد)"
            className="col-span-3"
            value={multiplePerOrder}
            onChange={(value: any) =>
              setState({
                multiplePerOrder: value,
                multiplePerOrderError: '',
              })
            }
            required
            errorMessage={state?.multiplePerOrderError}
            type="number"
          />
          <TextField
            label="حداقل تغییر قیمت هر سفارش(ریال)"
            className="col-span-3"
            value={minPriceChangePerOrder}
            onChange={(value: any) =>
              setState({
                minPriceChangePerOrder: value,
                minPriceChangePerOrderError: '',
              })
            }
            required
            errorMessage={state?.minPriceChangePerOrderError}
            type="number"
          />
        </div>
      </div>

      <div className="w-full py-2">
        <span className="font-bold my-1 text-blue">تعیین سقف</span>
        <div className="grid grid-cols-12 gap-4 p-4">
          <TextField
            label="موقعیت باز مشتری حقوقی"
            className="col-span-3"
            value={legalCustomerOpenPosition}
            onChange={(value: any) =>
              setState({
                legalCustomerOpenPosition: value,
                legalCustomerOpenPositionError: '',
              })
            }
            required
            errorMessage={state?.legalCustomerOpenPositionError}
            type="numeric"
          />
          <TextField
            label="موقعیت باز مشتری حقیقی"
            className="col-span-3"
            value={realCustomerOpenPosition}
            onChange={(value: any) =>
              setState({
                realCustomerOpenPosition: value,
                realCustomerOpenPositionError: '',
              })
            }
            required
            errorMessage={state?.realCustomerOpenPositionError}
            type="numeric"
          />
          <TextField
            label="موقعیت باز کارگزار"
            className="col-span-3"
            value={brokerOpenPosition}
            onChange={(value: any) =>
              setState({
                brokerOpenPosition: value,
                brokerOpenPositionError: '',
              })
            }
            required
            errorMessage={state?.brokerOpenPositionError}
            type="numeric"
          />
          <TextField
            label="موقعیت باز بازار"
            className="col-span-3"
            value={marketOpenPosition}
            onChange={(value: any) =>
              setState({
                marketOpenPosition: value,
                marketOpenPositionError: '',
              })
            }
            required
            errorMessage={state?.marketOpenPositionError}
            type="numeric"
          />
          <TextField
            label="سقف وثیقه قابل دریافت از مشتری"
            className="col-span-3"
            value={customerCollateralMaxAmount}
            onChange={(value: any) =>
              setState({
                customerCollateralMaxAmount: value,
                customerCollateralMaxAmountError: '',
              })
            }
            required
            errorMessage={state?.customerCollateralMaxAmountError}
            // type="number"
          />
        </div>
      </div>

      <div className="w-full py-2">
        <span className="font-bold mt-1 text-blue">وجوه تضمین و ضرایب</span>
        <div className="grid grid-cols-12 gap-4 p-4">
          <TextField
            label="ضریب وجه تضمین اولیه "
            className="col-span-3"
            value={initialGuaranteeCoefficient}
            onChange={(value: any) =>
              setState({
                initialGuaranteeCoefficient: value,
                initialGuaranteeCoefficientError: '',
              })
            }
            required
            errorMessage={state?.initialGuaranteeCoefficientError}
            type="number"
          />
          <TextField
            label="ضریب وجه تضمین لازم "
            className="col-span-3"
            value={necessaryGuaranteeCoefficient}
            onChange={(value: any) =>
              setState({
                necessaryGuaranteeCoefficient: value,
                necessaryGuaranteeCoefficientError: '',
              })
            }
            required
            errorMessage={state?.necessaryGuaranteeCoefficientError}
            type="number"
          />
          <TextField
            label="ضریب حداقل  وجه تضمین "
            className="col-span-3"
            value={minGuaranteeCoefficient}
            onChange={(value: any) =>
              setState({
                minGuaranteeCoefficient: value,
                minGuaranteeCoefficientError: '',
              })
            }
            required
            errorMessage={state?.minGuaranteeCoefficientError}
            type="number"
          />
          <TextField
            label="ضریب گرد کردن"
            className="col-span-3"
            value={roundingGuaranteeCoefficient}
            onChange={(value: any) =>
              setState({
                roundingGuaranteeCoefficient: value,
                roundingGuaranteeCoefficientError: '',
              })
            }
            required
            errorMessage={state?.roundingGuaranteeCoefficientError}
            type="numeric"
          />
          <TextField
            label="وجه تضمین اضافی (ریال)"
            className="col-span-3"
            value={additionalGuaranteeCoefficient}
            onChange={(value: any) =>
              setState({
                additionalGuaranteeCoefficient: value,
                additionalGuaranteeCoefficientError: '',
              })
            }
            required
            errorMessage={state?.additionalGuaranteeCoefficientError}
            type="numeric"
          />
        </div>
      </div>

      <div className="w-full py-2">
        <span className="font-bold mt-1 text-blue">اطلاعات تکمیلی</span>
        <div className="grid grid-cols-12 gap-4 p-4">
          <TextField
            label="ماه قرارداد"
            className="col-span-3"
            value={contractMonth}
            onChange={(value: any) =>
              setState({
                contractMonth: value,
                contractMonthError: '',
              })
            }
            required
            errorMessage={state?.contractMonthError}
            type="number"
          />
          <TextField
            label="سال قرارداد"
            className="col-span-3"
            value={contractYear}
            onChange={(value: any) =>
              setState({
                contractYear: value,
                contractYearError: '',
              })
            }
            required
            errorMessage={state?.contractYearError}
            type="number"
          />
          <TextField
            label="دامنه نوسان(%)"
            className="col-span-3"
            value={oscillationRange}
            onChange={(value: any) =>
              setState({
                oscillationRange: value,
                oscillationRangeError: '',
              })
            }
            required
            errorMessage={state?.oscillationRangeError}
            type="number"
          />

          <div className="col-span-3">
            <Select
              label="نوع تسویه در سررسید"
              options={settlementTypeList}
              onChange={(value: any) =>
                setState({ selectedSettlementType: value })
              }
              showKey="typeName"
              selectedKey="instrumentFutureSettlementTypeId"
            />
          </div>

          <div className="col-span-3">
            <Select
              label="روش تخصیص"
              options={allocationMethodList}
              onChange={(value: any) =>
                setState({ selectedAllocationMethod: value })
              }
              showKey="methodName"
              selectedKey="instrumentFutureAllocationMethodId"
            />
          </div>

          <div className="col-span-3">
            <Select
              label="تعیین قیمت مبنای دارایی پایه"
              options={priceAssetTypeList}
              onChange={(value: any) =>
                setState({ selectedPriceAssetType: value })
              }
              showKey="assetTypeName"
              selectedKey="instrumentFuturePriceAssetTypeId"
            />
          </div>
          <TextField
            label="جریمه نکول"
            className="col-span-3"
            value={forfeitAmount}
            onChange={(value: any) =>
              setState({
                forfeitAmount: value,
                forfeitAmountError: '',
              })
            }
            required
            errorMessage={state?.forfeitAmountError}
            type="number"
          />
          <TextField
            label="ضریب کارمزد تسویه نقدی"
            className="col-span-3"
            value={multipleCashSettlementAmount}
            onChange={(value: any) =>
              setState({
                multipleCashSettlementAmount: value,
                multipleCashSettlementAmountError: '',
              })
            }
            required
            errorMessage={state?.multipleCashSettlementAmountError}
            type="number"
          />
          <TextField
            label="ضریب کارمزد تسویه فیزیکی"
            className="col-span-3"
            value={multipleVerbalSettlementAmount}
            onChange={(value: any) =>
              setState({
                multipleVerbalSettlementAmount: value,
                multipleVerbalSettlementAmountError: '',
              })
            }
            required
            errorMessage={state?.multipleVerbalSettlementAmountError}
            type="number"
          />
          <div className="col-span-5">
            <span className="text-extratiny">
              امکان تسویه نقدی به کسری از اندازه قرارداد *
            </span>
            <Radio.Group
              onChange={(e) => setState({ canCashSettlement: e.target.value })}
              value={canCashSettlement}
              style={{ marginBottom: 10, width: '100%' }}
            >
              {cashSettlementData.map((item: any) => (
                <Radio className="text-extratiny" value={item.id}>
                  {item.title}
                </Radio>
              ))}
            </Radio.Group>
          </div>
        </div>
      </div>

      <div className="w-full py-2">
        <span className="font-bold mt-1 text-blue">بازار جبرانی</span>
        <div className="grid grid-cols-12 gap-4 p-4">
          <TimePickerInput
            className="col-span-3"
            label="از ساعت"
            value={compensatoryMarketFromTime}
            onChange={(value: any) =>
              setState({
                compensatoryMarketFromTime: value,
                compensatoryMarketFromTimeError: '',
              })
            }
            required
            error={state?.compensatoryMarketFromTimeError}
          />
          <TimePickerInput
            className="col-span-3"
            label="تا ساعت"
            value={compensatoryMarketToTime}
            onChange={(value: any) =>
              setState({
                compensatoryMarketToTime: value,
                compensatoryMarketToTimeError: '',
              })
            }
            required
            error={state?.compensatoryMarketToTimeError}
          />
        </div>
      </div>
      <div className="flex justify-end w-full">
        <Button
          className="border bg-blue text-white w-[110px]"
          onClick={onSubmit}
        >
          ثبت نماد
        </Button>
      </div>
    </div>
  );
}

export default withAlert(Future);
