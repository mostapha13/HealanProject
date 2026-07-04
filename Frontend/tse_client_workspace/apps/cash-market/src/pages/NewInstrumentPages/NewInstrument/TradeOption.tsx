import {
  TextField,
  Select,
  TimePickerInput,
  Button,
  SelectMultiple,
} from '@tse/components/atoms';
import withAlert from '../../../hoc/withAlert';
import { useStates, useEffect, useNavigate } from '@tse/utils';
import { SymbolModal, Table } from '@tse/components/organism';
import { DatePicker } from '@tse/components/molecules';
import { getQueryParams, convertTimeFormat } from '@tse/tools';
import {
  getInstrumentList,
  getTradeOptionSettlementType,
  getActionStyle,
  saveInstrumentTradeOption,
  getInstrumentTradeOptionDetail,
  getNextTradeOption,
  nextTradeNumber,
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
  minPriceChangePerOrder: '',
  legalCustomerOpenPosition: '',
  realCustomerOpenPosition: '',
  // brokerOpenPosition: 'مطابق با اطالعیه شماره 181/135907',
  marketOpenPosition: '',
  customerCollateralMaxAmount: '',
  initialGuaranteeCoefficient: '',
  necessaryGuaranteeCoefficient: '',
  minGuaranteeCoefficient: '',
  roundingGuaranteeCoefficient: '',
  additionalGuaranteeCoefficient: '',
  contractMonth: '',
  contractYear: '',
  oscillationRange: '',
  forfeitAmount: '',
  multipleCashSettlementAmount: '',
  multipleVerbalSettlementAmount: '',
  selectedSettlementType: null,
  selectedAllocationMethod: null,
  oscillationRangeFrom: '1',
  oscillationRangeTo: '',
  forfeitProfitAmount: '',
  forfeitLossAmount: '0.01',
  canCashSettlement: 0,
  multipleA: '0.2',
  multipleB: '0.1',
  multipleC: '10000',
  minimumGuaranteeRatio: '0.7',
  tradeOptionSettlementType: [],
  tradeOptionActionStyle: [],
  tradeOptionInstruments: [
    {
      key: '0',
    },
  ],
  BaseInstrumentCharacter: '',
  InstrumentLowerCount: '',
  InstrumentHigherCount: '',
  DateNumber: '',
  AppliedPrice: '',
  DueDate: '',
  baseAsset: '',
  nextTradeNumberValue: '',
};

function TradeOption({ onAlert }: any) {
  const navigate = useNavigate();
  const [state, setState] = useStates<any>(initialState);
  const {
    symbolList,
    selectedInstrument,
    selectedTradingDays,
    fromTime,
    toTime,
    fromDate,
    toDate,
    cashSettlementDate,
    verbalSettlementDate,
    contractSize,
    quantityLimitPerOrder,
    minAmountPerOrder,
    multiplePerOrder,
    legalCustomerOpenPosition,
    realCustomerOpenPosition,
    // brokerOpenPosition,
    marketOpenPosition,
    oscillationRangeFrom,
    oscillationRangeTo,
    forfeitProfitAmount,
    forfeitLossAmount,
    canCashSettlement,
    multipleA,
    multipleB,
    multipleC,
    minimumGuaranteeRatio,
    tradeOptionSettlementType,
    tradeOptionActionStyle,
    selectedTradeOptionActionStyle,
    selectedTradeOptionSettlementType,
    tradeOptionInstruments,
    BaseInstrumentCharacter,
    InstrumentLowerCount,
    InstrumentHigherCount,
    DateNumber,
    AppliedPrice,
    DueDate,
    baseAsset,
    nextTradeNumberValue,
  } = state;

  const isFund = selectedInstrument?.marketTypeId === 'ETF';

  const isCopy = getQueryParams('isCopy', window.location.href) === 'true';
  const id = getQueryParams('id', window.location.href);

  useEffect(() => {
    getSymbolList('', 1);
    getTradeOptionSettlementTypeList();
    getActionStyleList();
    if (!id) {
      handleGetWorkingDate('', 3, 'startDate');
    }
  }, []);

  useEffect(() => {
    if (id) {
      getInstrumentTradeOptionDetail({
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
      });
    }
  }, [selectedInstrument]);
  useEffect(() => {
    setState({
      realCustomerOpenPosition: Math.min(
        200000,
        Math.ceil(marketOpenPosition * 0.05)
      ),
      legalCustomerOpenPosition: Math.min(
        400000,
        Math.ceil(marketOpenPosition * 0.05)
      ),
      realCustomerOpenPositionError: '',
      legalCustomerOpenPositionError: '',
    });
  }, [marketOpenPosition]);
  useEffect(() => {
    if (
      selectedInstrument != null &&
      BaseInstrumentCharacter != '' &&
      DueDate != ''
    ) {
      const data = {
        BaseInstrumentId: selectedInstrument?.instrumentId,
        BaseInstrumentCharacter: BaseInstrumentCharacter,
        DueDate: DueDate,
      };
      nextTradeNumber({
        data,
        onSuccess: (res: any) => {
          setState({ nextTradeNumberValue: res });
        },
        onFail,
      });
    }
  }, [selectedInstrument, BaseInstrumentCharacter, DueDate]);

  useEffect(() => {
    if (verbalSettlementDate != '' && !id) {
      handleGetWorkingDate(verbalSettlementDate, -1, 'cashSettlementDate');
    }
  }, [verbalSettlementDate]);

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
        } else if (component === 'cashSettlementDate') {
          setState({
            cashSettlementDate: res?.nextWorkingDate,
          });
        }
      },
      onFail,
    });
  };

  const onSuccessDetail = (result: any) => {
    const {
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
      // brokerOpenPosition,
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
      baseInstrumentId,
      baseInstrumentName,
      baseCompanyName,
      tradeOptionTradingDays,
      tradeOptionSettlementType,
      tradeOptionActionStyle,
      tradeOptionInstruments,
      oscillationRangeFrom,
      oscillationRangeTo,
      forfeitProfitAmount,
      forfeitLossAmount,
      canCashSettlement,
      multipleA,
      multipleB,
      multipleC,
      minimumGuaranteeRatio,
      baseInstrumentCharacter,
      instrumentLowerCount,
      instrumentHigherCount,
      dateNumber,
      appliedPrice,
      dueDate,
      baseMarketTypeId,
      baseAsset,
    } = result;
    const days: any = [];
    tradeOptionTradingDays?.map((i: any) => {
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
      // brokerOpenPosition,
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
      tradeOptionInstruments,
      oscillationRangeFrom,
      oscillationRangeTo,
      forfeitProfitAmount,
      forfeitLossAmount,
      canCashSettlement: canCashSettlement ? 1 : 0,
      multipleA,
      multipleB,
      multipleC,
      minimumGuaranteeRatio,
      selectedTradeOptionActionStyle:
        tradeOptionActionStyle?.tradeOptionActionStyleId,
      selectedTradeOptionSettlementType:
        tradeOptionSettlementType?.tradeOptionSettlementTypeId,
      BaseInstrumentCharacter: baseInstrumentCharacter,
      InstrumentLowerCount: instrumentLowerCount,
      InstrumentHigherCount: instrumentHigherCount,
      DateNumber: dateNumber,
      AppliedPrice: appliedPrice,
      DueDate: dueDate,
      baseAsset,
    });
  };

  const getTradeOptionSettlementTypeList = () => {
    getTradeOptionSettlementType({
      onSuccess: (res) =>
        setState({
          tradeOptionSettlementType: res,
          selectedTradeOptionSettlementType:
            res?.[0]?.tradeOptionSettlementTypeId,
        }),
      onFail,
    });
  };

  const getActionStyleList = () => {
    getActionStyle({
      onSuccess: (res) =>
        setState({
          tradeOptionActionStyle: res,
          selectedTradeOptionActionStyle: res?.[0]?.tradeOptionActionStyleId,
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
      selectedTradingDays &&
      fromTime &&
      toTime &&
      fromDate &&
      toDate &&
      cashSettlementDate &&
      verbalSettlementDate &&
      contractSize &&
      quantityLimitPerOrder &&
      minAmountPerOrder &&
      multiplePerOrder &&
      legalCustomerOpenPosition &&
      realCustomerOpenPosition &&
      // brokerOpenPosition &&
      marketOpenPosition &&
      oscillationRangeFrom &&
      oscillationRangeTo &&
      // forfeitProfitAmount &&
      forfeitLossAmount &&
      multipleA &&
      multipleB &&
      multipleC &&
      minimumGuaranteeRatio &&
      selectedTradeOptionActionStyle &&
      selectedTradeOptionSettlementType &&
      tradeOptionInstruments
    ) {
      const tradeOptionTradingDays: any = [];
      selectedTradingDays?.map((item: any) =>
        tradeOptionTradingDays.push({ dayOfWeek: item })
      );
      const data = {
        ...(!isCopy && id && { tradeOptionId: id }),
        baseInstrumentId: selectedInstrument?.instrumentId,
        baseInstrumentName: selectedInstrument?.symbol,
        baseCompanyName: selectedInstrument?.symbolName,
        baseMarketTypeId: selectedInstrument?.marketTypeId,
        tradeOptionTradingDays,
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
        contractSize,
        quantityLimitPerOrder,
        minAmountPerOrder,
        multiplePerOrder,
        legalCustomerOpenPosition,
        realCustomerOpenPosition,
        // brokerOpenPosition,
        marketOpenPosition,
        oscillationRangeFrom,
        oscillationRangeTo,
        // forfeitProfitAmount,
        forfeitLossAmount,
        canCashSettlement: canCashSettlement === 1 ? true : false,
        multipleA,
        multipleB,
        multipleC,
        minimumGuaranteeRatio,
        tradeOptionActionStyle: {
          tradeOptionActionStyleId: selectedTradeOptionActionStyle,
        },
        tradeOptionSettlementType: {
          tradeOptionSettlementTypeId: selectedTradeOptionSettlementType,
        },
        tradeOptionInstruments,
        baseInstrumentCharacter: BaseInstrumentCharacter,
        instrumentLowerCount: InstrumentLowerCount,
        instrumentHigherCount: InstrumentHigherCount,
        dateNumber: DateNumber,
        appliedPrice: AppliedPrice,
        dueDate: DueDate,
        baseAsset,
      };

      saveInstrumentTradeOption({ data, onSuccess: onSuccessSave, onFail });
    } else {
      !selectedInstrument && setErrorMessage('selectedInstrument');
      selectedTradingDays.length === 0 &&
        setErrorMessage('selectedTradingDays');
      !fromTime && setErrorMessage('fromTime');
      !toTime && setErrorMessage('toTime');
      !fromDate && setErrorMessage('fromDate');
      !toDate && setErrorMessage('toDate');
      !cashSettlementDate && setErrorMessage('cashSettlementDate');
      !verbalSettlementDate && setErrorMessage('verbalSettlementDate');
      !contractSize && setErrorMessage('contractSize');
      !quantityLimitPerOrder && setErrorMessage('quantityLimitPerOrder');
      !minAmountPerOrder && setErrorMessage('minAmountPerOrder');
      !multiplePerOrder && setErrorMessage('multiplePerOrder');
      !legalCustomerOpenPosition &&
        setErrorMessage('legalCustomerOpenPosition');
      !realCustomerOpenPosition && setErrorMessage('realCustomerOpenPosition');
      // !brokerOpenPosition && setErrorMessage('brokerOpenPosition');
      !marketOpenPosition && setErrorMessage('marketOpenPosition');
      !oscillationRangeFrom && setErrorMessage('oscillationRangeFrom');
      !oscillationRangeTo && setErrorMessage('oscillationRangeTo');
      // !forfeitProfitAmount && setErrorMessage('forfeitProfitAmount');
      !forfeitLossAmount && setErrorMessage('forfeitLossAmount');
      !multipleA && setErrorMessage('multipleA');
      !multipleB && setErrorMessage('multipleB');
      !multipleC && setErrorMessage('multipleC');
      !minimumGuaranteeRatio && setErrorMessage('minimumGuaranteeRatio');
    }
  };

  const setErrorMessage = (key: string) => {
    const errorMessage = ' ';
    setState({ [`${key}Error`]: errorMessage });
  };

  const onSuccessSave: any = () => {
    onAlert({ message: 'عملیات با موفقیت انجام شد', type: 'success' });
    navigate('/instrument/instrument-list?tab=2');
  };

  const instrumentColumns = [
    {
      title: 'نام نماد معاملاتی اختیار خرید',
      dataIndex: 'buyInstrumentName',
      isSelect: false,
      editable: true,
      className: 'col-span-2',
    },
    {
      title: 'شرح نماد معاملاتی اختیار خرید',
      dataIndex: 'buyDescription',
      editable: true,
      isSelect: false,
      className: 'col-span-2',
    },
    {
      title: 'قیمت اعمال',
      dataIndex: 'appliedPrice',
      editable: true,
      isSelect: false,
      className: 'col-span-2',
      type: 'number',
    },
    {
      title: 'نام نماد معاملاتی اختیار فروش',
      dataIndex: 'sellInstrumentName',
      isSelect: false,
      editable: true,
      className: 'col-span-2',
    },
    {
      title: 'شرح نماد معاملاتی اختیار فروش',
      dataIndex: 'sellDescription',
      isSelect: false,
      editable: true,
      className: 'col-span-3',
    },
  ];

  const onSelectBaseInstrument = (value: any) => {
    setState({
      selectedInstrument: value,
      selectedInstrumentError: '',
    });
  };

  const getNextTradeOptionList = () => {
    if (
      selectedInstrument &&
      BaseInstrumentCharacter &&
      InstrumentLowerCount &&
      InstrumentHigherCount &&
      DateNumber &&
      AppliedPrice &&
      DueDate &&
      contractSize &&
      baseAsset
    ) {
      const data = {
        BaseInstrumentId: selectedInstrument?.instrumentId,
        BaseInstrumentCharacter,
        InstrumentLowerCount,
        InstrumentHigherCount,
        DateNumber,
        AppliedPrice,
        DueDate,
        baseAsset,
      };

      getNextTradeOption({
        data,
        onSuccess: (res: any) => {
          setState({
            tradeOptionInstruments: res,
          });
        },
        onFail,
      });
    } else {
      !selectedInstrument && setErrorMessage('selectedInstrument');
      !BaseInstrumentCharacter && setErrorMessage('BaseInstrumentCharacter');
      !InstrumentLowerCount && setErrorMessage('InstrumentLowerCount');
      !InstrumentHigherCount && setErrorMessage('InstrumentHigherCount');
      !DateNumber && setErrorMessage('DateNumber');
      !AppliedPrice && setErrorMessage('AppliedPrice');
      !DueDate && setErrorMessage('DueDate');
      !contractSize && setErrorMessage('contractSize');
      !baseAsset && setErrorMessage('baseAsset');
    }
  };

  const clearTable = () => {
    setState({
      tradeOptionInstruments: [],
      selectedInstrument: null,
      BaseInstrumentCharacter: '',
      InstrumentLowerCount: '',
      InstrumentHigherCount: '',
      DateNumber: '',
      AppliedPrice: '',
      DueDate: '',
      contractSize: '',
      baseAsset: '',
    });
  };

  return (
    <div>
      <div className="w-full gap-4 py-2">
        <span className="font-bold text-blue">اطلاعات نماد</span>
        <div className="grid grid-cols-12 gap-4 p-4">
          <SymbolModal
            className="col-span-3"
            data={symbolList}
            onChange={(pageNo: number, text: string) =>
              getSymbolList(text, pageNo)
            }
            onSubmit={(value: any) => onSelectBaseInstrument(value)}
            defaultValue={selectedInstrument}
            label="نماد معاملاتی دارایی پایه"
            required
            error={state?.selectedInstrumentError}
          />

          <TextField
            label="سه کاراکتر نماینده دارایی پایه"
            className="col-span-3"
            value={BaseInstrumentCharacter}
            onChange={(value: any) =>
              setState({
                BaseInstrumentCharacter: value,
                BaseInstrumentCharacterError: '',
              })
            }
            required
            errorMessage={state?.BaseInstrumentCharacterError}
          />
          <TextField
            label="نماینده حروف دارایی پایه"
            className="col-span-3"
            value={baseAsset}
            onChange={(value: any) =>
              setState({
                baseAsset: value,
                baseAssetError: '',
              })
            }
            required
            errorMessage={state?.baseAssetError}
          />
          <TextField
            label="تعداد نماد با قیمت اعمال کمتر از پایه"
            className="col-span-3"
            value={InstrumentLowerCount}
            onChange={(value: any) =>
              setState({
                InstrumentLowerCount: value,
                InstrumentLowerCountError: '',
              })
            }
            required
            errorMessage={state?.InstrumentLowerCountError}
            type="number"
          />
          <TextField
            label="تعداد نماد با قیمت اعمال بالاتر از پایه"
            className="col-span-3"
            value={InstrumentHigherCount}
            onChange={(value: any) =>
              setState({
                InstrumentHigherCount: value,
                InstrumentHigherCountError: '',
              })
            }
            required
            errorMessage={state?.InstrumentHigherCountError}
            type="number"
          />
          <TextField
            label="عدد نماینده تاریخ قرارداد"
            className="col-span-3"
            value={DateNumber}
            onChange={(value: any) =>
              setState({
                DateNumber: value,
                DateNumberError: '',
              })
            }
            required
            errorMessage={state?.DateNumberError}
            type="number"
          />
          <div className="col-span-3 !z-40">
            <DatePicker
              label="تاریخ سررسید"
              value={DueDate}
              onChange={(value: any) =>
                setState({
                  DueDate: value,
                  DueDateError: '',
                  toDate: value,
                  verbalSettlementDate: value,
                })
              }
              required
              error={state?.DueDateError}
            />
          </div>
          <TextField
            label="قیمت اعمال"
            className="col-span-3"
            value={AppliedPrice}
            onChange={(value: any) =>
              setState({
                AppliedPrice: value,
                AppliedPriceError: '',
              })
            }
            required
            errorMessage={state?.AppliedPriceError}
            type="numeric"
          />
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
            label="آخرین شمارنده استفاده شده"
            className="col-span-3"
            value={nextTradeNumberValue}
            onChange={(value: any) =>
              setState({
                nextTradeNumberValue: value,
              })
            }
            // required
            // errorMessage={state?.contractSizeError}
            // type="numeric"
            readOnly
          />
          <div className="col-span-6 flex flex-row justify-end">
            <Button
              className="border bg-blue text-white w-[80px] ml-2"
              onClick={getNextTradeOptionList}
            >
              ایجاد نماد
            </Button>

            <Button
              className="border bg-white text-red w-[80px] ml-2"
              onClick={clearTable}
            >
              حذف نماد
            </Button>
          </div>
          <div className="col-span-12">
            <Table
              columns={instrumentColumns}
              className="col-span-12 grid grid-cols-12"
              dataSource={tradeOptionInstruments}
              pageSize={1000}
            />
          </div>
        </div>
      </div>

      <div className="w-full gap-4 py-2">
        <span className="font-bold text-blue whitespace-pre">
          تاریخ های مرتبط
        </span>
        <div className="grid grid-cols-12 gap-4 p-4">
          <div className="col-span-3">
            <SelectMultiple
              placeholder="روزهای معاملاتی"
              options={tradingDaysList}
              value={selectedTradingDays}
              limit={7}
              onChange={(value: any) =>
                setState({
                  selectedTradingDays: value,
                  selectedTradingDaysError: '',
                })
              }
              required
              errorMessage={state?.selectedTradingDaysError}
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
          <div className="col-span-3 !z-30">
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

          <div className="col-span-3">
            <DatePicker
              label="تا تاریخ "
              value={toDate}
              onChange={(value: any) =>
                setState({
                  toDate: value,
                  verbalSettlementDate: value,
                  toDateError: '',
                })
              }
              required
              error={state?.toDateError}
            />
          </div>
          <div className="col-span-3 !z-10">
            <DatePicker
              label=" تاریخ تسویه فیزیکی"
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
          <div className="col-span-3">
            <DatePicker
              label=" تاریخ تسویه نقدی"
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
        </div>
      </div>

      <div className="w-full gap-4 py-2">
        <span className="font-bold text-blue">محدودیت ها</span>
        <div className="grid grid-cols-12 gap-4 p-4">
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
        </div>
      </div>

      <div className="w-full gap-4 py-2">
        <span className="font-bold text-blue">تعیین سقف</span>
        <div className="grid grid-cols-12 gap-4 p-4">
          <TextField
            label="سقف تعداد موقعیتهای بازار"
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
            label="سقف تعداد موقعیتهای مشتری حقوقی"
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
            label="سقف تعداد موقعیتهای مشتری حقیقی"
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
          {/* <TextField
            label="سقف تعداد موقعیتهای کارگزار"
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
            type="number"
          /> */}
        </div>
      </div>

      <div className="w-full gap-4 py-2">
        <span className="font-bold text-blue">اطلاعات تکمیلی</span>
        <div className="grid grid-cols-12 gap-4 p-4">
          <div className="col-span-3">
            <Select
              label="سبک اعمال"
              className="col-span-3"
              options={tradeOptionActionStyle}
              onChange={(value: any) =>
                setState({
                  selectedTradeOptionActionStyle: value,
                })
              }
              showKey="actionStyleName"
              selectedKey="tradeOptionActionStyleId"
            />
          </div>

          <div className="col-span-3">
            <Select
              label="نوع تسویه پس از اعمال"
              className="col-span-3"
              options={tradeOptionSettlementType}
              onChange={(value: any) =>
                setState({
                  selectedTradeOptionSettlementType: value,
                })
              }
              showKey="settlementTypeName"
              selectedKey="tradeOptionSettlementTypeId"
            />
          </div>

          <TextField
            label="دامنه نوسان( از مبلغ )"
            className="col-span-3"
            value={oscillationRangeFrom}
            onChange={(value: any) =>
              setState({
                oscillationRangeFrom: value,
                oscillationRangeFromError: '',
              })
            }
            required
            errorMessage={state?.oscillationRangeFromError}
            type="number"
          />

          <TextField
            label="دامنه نوسان( تا مبلغ )"
            className="col-span-3"
            value={oscillationRangeTo}
            onChange={(value: any) =>
              setState({
                oscillationRangeTo: value,
                oscillationRangeToError: '',
              })
            }
            required
            errorMessage={state?.oscillationRangeToError}
            type="number"
          />

          {/* <TextField
            label="جریمه نکول قراردادهای در سود"
            className="col-span-3"
            value={forfeitProfitAmount}
            onChange={(value: any) =>
              setState({
                forfeitProfitAmount: value,
                forfeitProfitAmountError: '',
              })
            }
            required
            errorMessage={state?.forfeitProfitAmountError}
            type="number"
          /> */}
          <TextField
            label="جریمه نکول"
            // label="جریمه نکول قراردادهای در زیان وبی تفاوت"
            className="col-span-3"
            value={forfeitLossAmount}
            onChange={(value: any) =>
              setState({
                forfeitLossAmount: value,
                forfeitLossAmountError: '',
              })
            }
            required
            errorMessage={state?.forfeitLossAmountError}
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
        <span className="font-bold text-blue">ضرایب</span>
        <div className="grid grid-cols-12 gap-4 p-4">
          <TextField
            label="ضریب A"
            className="col-span-3"
            value={multipleA}
            onChange={(value: any) =>
              setState({
                multipleA: value,
                multipleAError: '',
              })
            }
            required
            errorMessage={state?.multipleAError}
            type="number"
          />
          <TextField
            label="ضریب B"
            className="col-span-3"
            value={multipleB}
            onChange={(value: any) =>
              setState({
                multipleB: value,
                multipleBError: '',
              })
            }
            required
            errorMessage={state?.multipleBError}
            type="number"
          />
          <TextField
            label="ضریب C"
            className="col-span-3"
            value={multipleC}
            onChange={(value: any) =>
              setState({
                multipleC: value,
                multipleCError: '',
              })
            }
            required
            errorMessage={state?.multipleCError}
            type="number"
          />
          <TextField
            label="نسبت حداقل وجه تضمین"
            className="col-span-3"
            value={minimumGuaranteeRatio}
            onChange={(value: any) =>
              setState({
                minimumGuaranteeRatio: value,
                minimumGuaranteeRatioError: '',
              })
            }
            required
            errorMessage={state?.minimumGuaranteeRatioError}
            type="number"
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

export default withAlert(TradeOption);
