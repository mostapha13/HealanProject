import {
  TextField,
  TimePickerInput,
  Button,
  SelectMultiple,
  Upload,
  NewSelectSearch,
} from '@tse/components/atoms';
import withAlert from '../../../hoc/withAlert';
import { useStates, useEffect, useNavigate } from '@tse/utils';
import { SymbolModal } from '@tse/components/organism';
import { DatePicker } from '@tse/components/molecules';
import { getQueryParams, convertTimeFormat, deSeparator } from '@tse/tools';
import {
  getInstrumentList,
  saveInstrumentOption,
  getInstrumentOptionDetail,
  uploadFile,
  getBrokerList,
} from '../../../Controller';
import { Radio } from 'antd';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';

const cashSettlementData = [
  {
    id: 1,
    title: 'دارد',
  },
  {
    id: 0,
    title: 'ندارد',
  },
];

const purposeReleases = [
  {
    id: 0,
    title: 'حمایت از بازار',
  },
  {
    id: 1,
    title: 'تامین مالی',
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
  toTime: '12:30',
  fromDate: '',
  toDate: '',
  // cashSettlementDate: '',
  // verbalSettlementDate: '',
  oscillationRangeFrom: '',
  oscillationRangeTo: '',
  canCashSettlement: 1,
  selectedPurposeReleases: 0,
  buyInstrumentName: '',
  buyDescription: '',
  buyAppliedPrice: '',
  buyDueDate: '',
  sellInstrumentName: '',
  sellDescription: '',
  sellAppliedPrice: '',
  sellDueDate: '',
  supplierName: '',
  supplierCode: '',
  depositableBondsNumber: '',
  supervisingBroker: null,
  realCodeBuyLimit: '',
  legalCodeBuyLimit: '',
  orderMinAmount: '1',
  orderMaxAmount: '100000',
  orderMinChange: '1',
  orderMultiple: '1',
  dayTrade: false,
  proceedingsFile: null,
  authorizedBuyersDescription: '',
  surrenderRequiredPersons: '',
  financingAmount: '',
  brokerList: [],
  financingRate: '',
};

function Option({ onAlert }: any) {
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
    // cashSettlementDate,
    // verbalSettlementDate,
    oscillationRangeFrom,
    oscillationRangeTo,
    canCashSettlement,
    selectedPurposeReleases,
    buyInstrumentName,
    buyDescription,
    buyAppliedPrice,
    buyDueDate,
    sellInstrumentName,
    sellDescription,
    sellAppliedPrice,
    sellDueDate,
    supplierName,
    supplierCode,
    depositableBondsNumber,
    supervisingBroker,
    realCodeBuyLimit,
    legalCodeBuyLimit,
    orderMinAmount,
    orderMaxAmount,
    orderMinChange,
    orderMultiple,
    dayTrade,
    proceedingsFile,
    authorizedBuyersDescription,
    surrenderRequiredPersons,
    financingAmount,
    brokerList,
    financingRate,
  } = state;

  const isCopy = getQueryParams('isCopy', window.location.href) === 'true';
  const id = getQueryParams('id', window.location.href);

  useEffect(() => {
    getSymbolList('', 1);
    getBroker('', 1);
  }, []);

  useEffect(() => {
    if (id) {
      getInstrumentOptionDetail({
        data: { id },
        onSuccess: onSuccessDetail,
        onFail,
      });
    }
  }, [id]);
  useEffect(() => {}, [supervisingBroker]);

  const onSuccessDetail = (result: any) => {
    const {
      baseInstrumentName,
      baseInstrumentId,
      baseCompanyName,
      fromTime,
      toTime,
      fromDate,
      toDate,
      // cashSettlementDate,
      // verbalSettlementDate,
      oscillationRangeFrom,
      oscillationRangeTo,
      hsaSecondaryTrades,
      hasFinancingPurpose,
      buyInstrumentName,
      buyDescription,
      buyAppliedPrice,
      buyDueDate,
      sellInstrumentName,
      sellDescription,
      sellAppliedPrice,
      sellDueDate,
      supplierName,
      supplierCode,
      depositableBondsNumber,
      supervisingBroker,
      realCodeBuyLimit,
      legalCodeBuyLimit,
      orderMinAmount,
      orderMaxAmount,
      orderMinChange,
      orderMultiple,
      optionTradingDays,
      proceedingsFile,
      authorizedBuyersDescription,
      surrenderRequiredPersons,
      financingAmount,
      baseMarketTypeId,
      financingRate,
    } = result;

    const days: any = [];
    optionTradingDays?.map((i: any) => {
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
      // cashSettlementDate,
      // verbalSettlementDate,
      oscillationRangeFrom,
      oscillationRangeTo,
      canCashSettlement: hsaSecondaryTrades ? 1 : 0,
      selectedPurposeReleases: hasFinancingPurpose ? 1 : 0,
      buyInstrumentName,
      buyDescription,
      buyAppliedPrice,
      buyDueDate,
      sellInstrumentName,
      sellDescription,
      sellAppliedPrice,
      sellDueDate,
      supplierName,
      supplierCode,
      depositableBondsNumber,
      supervisingBroker,
      realCodeBuyLimit,
      legalCodeBuyLimit,
      orderMinAmount,
      orderMaxAmount,
      orderMinChange,
      orderMultiple,
      proceedingsFile,
      authorizedBuyersDescription,
      surrenderRequiredPersons,
      financingAmount,
      financingRate,
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

  const getBroker = (text: string, pageNo: number) => {
    const data = {
      SearchText: text,
      PageNumber: pageNo,
    };
    getBrokerList({
      data,
      onSuccess: (res: any) =>
        setState({
          brokerList: res,
        }),
      onFail,
    });
  };
  const onFail = (error: any) => {
    onAlert(error);
  };

  const onSubmit = () => {
    if (
      selectedInstrument &&
      sellInstrumentName &&
      sellDescription &&
      sellAppliedPrice &&
      sellDueDate &&
      supplierName &&
      supplierCode &&
      supervisingBroker &&
      realCodeBuyLimit &&
      legalCodeBuyLimit &&
      orderMinAmount &&
      orderMaxAmount &&
      orderMinChange &&
      orderMultiple &&
      selectedTradingDays &&
      fromTime &&
      toTime &&
      fromDate &&
      toDate &&
      oscillationRangeFrom &&
      depositableBondsNumber &&
      oscillationRangeTo
      // cashSettlementDate &&
      // verbalSettlementDate
    ) {
      const optionTradingDays: any = [];
      selectedTradingDays?.map((item: any) =>
        optionTradingDays.push({ dayOfWeek: item })
      );
      const data = {
        ...(!isCopy && id && { optionId: id }),
        baseInstrumentId: selectedInstrument?.instrumentId,
        baseInstrumentName: selectedInstrument?.symbol,
        baseCompanyName: selectedInstrument?.symbolName,
        baseMarketTypeId: selectedInstrument?.marketTypeId,
        optionTradingDays,
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
        // cashSettlementDate,
        // verbalSettlementDate,
        oscillationRangeFrom,
        oscillationRangeTo,
        hasFinancingPurpose: selectedPurposeReleases === 1 ? true : false,
        buyInstrumentName,
        buyDescription,
        ...(buyAppliedPrice && { buyAppliedPrice }),
        ...(buyDueDate && { buyDueDate }),
        sellInstrumentName,
        sellDescription,
        sellAppliedPrice,
        ...(sellDueDate && { sellDueDate }),
        supplierName,
        supplierCode,
        depositableBondsNumber,
        supervisingBroker,
        realCodeBuyLimit,
        legalCodeBuyLimit,
        orderMinAmount,
        orderMaxAmount,
        orderMinChange,
        orderMultiple,
        hsaSecondaryTrades: canCashSettlement === 1 ? true : false,
        dayTrade,
        proceedingsFile,
        authorizedBuyersDescription,
        surrenderRequiredPersons,
        ...(financingAmount && { financingAmount }),
        financingRate: financingRate ? financingRate : null,
      };
      saveInstrumentOption({ data, onSuccess: onSuccessSave, onFail });
    } else {
      selectedTradingDays.length === 0 &&
        setErrorMessage('selectedTradingDays');
      !selectedInstrument && setErrorMessage('selectedInstrument');
      !fromTime && setErrorMessage('fromTime');
      !toTime && setErrorMessage('toTime');
      !fromDate && setErrorMessage('fromDate');
      !toDate && setErrorMessage('toDate');
      // !cashSettlementDate && setErrorMessage('cashSettlementDate');
      // !verbalSettlementDate && setErrorMessage('verbalSettlementDate');
      !oscillationRangeFrom && setErrorMessage('oscillationRangeFrom');
      !oscillationRangeTo && setErrorMessage('oscillationRangeTo');
      !sellInstrumentName && setErrorMessage('sellInstrumentName');
      !sellDescription && setErrorMessage('sellDescription');
      !sellAppliedPrice && setErrorMessage('sellAppliedPrice');
      !sellDueDate && setErrorMessage('sellDueDate');
      !supplierName && setErrorMessage('supplierName');
      !supplierCode && setErrorMessage('supplierCode');
      !depositableBondsNumber && setErrorMessage('depositableBondsNumber');
      !supervisingBroker && setErrorMessage('supervisingBroker');
      !realCodeBuyLimit && setErrorMessage('realCodeBuyLimit');
      !legalCodeBuyLimit && setErrorMessage('legalCodeBuyLimit');
      !orderMinAmount && setErrorMessage('orderMinAmount');
      !orderMaxAmount && setErrorMessage('orderMaxAmount');
      !orderMinChange && setErrorMessage('orderMinChange');
      !orderMultiple && setErrorMessage('orderMultiple');
    }
  };

  const setErrorMessage = (key: string) => {
    const errorMessage = ' ';
    setState({ [`${key}Error`]: errorMessage });
  };

  const onSuccessSave = () => {
    onAlert({ message: 'عملیات با موفقیت انجام شد', type: 'success' });
    navigate('/instrument/instrument-list?tab=3');
  };

  const onChangeFile = (e: any, key: string) => {
    uploadFile({
      data: e.target.files[0],
      onSuccess: (res: any) => onSuccessUpload(res, key),
      onFail,
    });
  };

  const onSuccessUpload = (res: any, key: string) => {
    setState({
      [key]: res,
      [`${key}Error`]: '',
    });
  };

  return (
    <div>
      <div className="w-full py-2">
        <span className="font-bold my-1 text-blue">اطلاعات نماد</span>
        <div className="grid grid-cols-12 gap-4 p-4">
          <div className="col-span-12 flex flex-row">
            <span className="text-extratiny whitespace-pre font-bold ml-6">
              هدف از انتشار :
            </span>
            <Radio.Group
              onChange={(e) =>
                setState({ selectedPurposeReleases: e.target.value })
              }
              value={selectedPurposeReleases}
              style={{ marginBottom: 10, width: '100%' }}
            >
              {purposeReleases.map((item: any) => (
                <Radio className="text-extratiny" value={item.id}>
                  {item.title}
                </Radio>
              ))}
            </Radio.Group>
          </div>
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
            label="نام نماد معاملاتی اختیار فروش"
            className="col-span-3"
            value={sellInstrumentName}
            onChange={(value: any) =>
              setState({
                sellInstrumentName: value,
                sellInstrumentNameError: '',
              })
            }
            required
            errorMessage={state?.sellInstrumentNameError}
            maxLength={8}
          />
          <TextField
            label="شرح نماد معاملاتی اختیار فروش"
            className="col-span-3"
            value={sellDescription}
            onChange={(value: any) =>
              setState({
                sellDescription: value,
                sellDescriptionError: '',
              })
            }
            required
            errorMessage={state?.sellDescriptionError}
            maxLength={30}
          />
          <TextField
            label="قیمت اعمال اختیار فروش تبعی"
            className="col-span-3"
            value={sellAppliedPrice}
            onChange={(value: any) =>
              setState({
                sellAppliedPrice: value,
                sellAppliedPriceError: '',
              })
            }
            required
            errorMessage={state?.sellAppliedPriceError}
            type="numeric"
          />
          <div className="col-span-3 !z-20">
            <DatePicker
              label="تاریخ سررسید اختیار فروش تبعی"
              value={sellDueDate}
              onChange={(value: any) =>
                setState({
                  sellDueDate: value,
                  sellDueDateError: '',
                })
              }
              required
              error={state?.sellDueDateError}
            />
          </div>
          <TextField
            label="نرخ انتشار"
            className="col-span-3"
            value={financingRate}
            onChange={(value: any) =>
              setState({
                financingRate: value,
                financingRateError: '',
              })
            }
            prefix="%"
            type="number"
          />
          {selectedPurposeReleases === 1 && (
            <>
              <TextField
                label="نام نماد معاملاتی اختیار خرید"
                className="col-span-3"
                value={buyInstrumentName}
                onChange={(value: any) =>
                  setState({ buyInstrumentName: value })
                }
                maxLength={8}
              />
              <TextField
                label="شرح نماد معاملاتی اختیار خرید"
                className="col-span-3"
                value={buyDescription}
                onChange={(value: any) => setState({ buyDescription: value })}
                maxLength={30}
              />
              <TextField
                label="قیمت اعمال اختیار خرید تبعی"
                className="col-span-3"
                value={buyAppliedPrice}
                onChange={(value: any) => setState({ buyAppliedPrice: value })}
                type="numeric"
              />
              <div className="col-span-3 !z-10">
                <DatePicker
                  label="تاریخ سررسید اختیار خرید تبعی"
                  value={buyDueDate}
                  onChange={(value: any) => setState({ buyDueDate: value })}
                />
              </div>
              <TextField
                label="مبلغ انتشار (میلیون ریال)"
                className="col-span-3"
                value={financingAmount}
                onChange={(value: any) => setState({ financingAmount: value })}
                type="numeric"
              />
              <TextField
                label="اشخاص ملزم به واگذاری اختیار خرید"
                className="col-span-6 w-full"
                value={surrenderRequiredPersons}
                onChange={(value: any) =>
                  setState({ surrenderRequiredPersons: value })
                }
              />
            </>
          )}
        </div>
      </div>

      <div className="w-full py-2">
        <span className="font-bold text-blue whitespace-pre">
          اطلاعات عرضه کننده
        </span>
        <div className="grid grid-cols-12 gap-4 p-4">
          <TextField
            label="عرضه کننده"
            className="col-span-3"
            value={supplierName}
            onChange={(value: any) =>
              setState({
                supplierName: value,
                supplierNameError: '',
              })
            }
            required
            errorMessage={state?.supplierNameError}
          />
          <TextField
            label="کد عرضه کننده"
            className="col-span-3"
            value={supplierCode}
            onChange={(value: any) =>
              setState({
                supplierCode: value,
                supplierCodeError: '',
              })
            }
            required
            errorMessage={state?.supplierCodeError}
            // type="number"
          />
          <TextField
            label="تعداد اوراق قابل سپرده در کد"
            className="col-span-3"
            value={depositableBondsNumber}
            onChange={(value: any) =>
              setState({
                depositableBondsNumber: value,
                depositableBondsNumberError: '',
              })
            }
            required
            errorMessage={state?.depositableBondsNumberError}
            type="numeric"
          />
          <div className="flex-col flex col-span-3">
            <NewSelectSearch
              className="col-span-3"
              label="کارگزار ناظر"
              onChange={(value: any) => {
                if (value?.brokerName !== undefined) {
                  setState({
                    supervisingBroker: value,
                    supervisingBrokerError: '',
                  });
                } else if (value == '') {
                  setState({
                    supervisingBroker: null,
                  });
                }
                getBroker(value, 1);
              }}
              value={supervisingBroker}
              required
              error={state?.supervisingBrokerError}
              data={brokerList?.items}
              showKey="brokerName"
            />
          </div>
        </div>
      </div>

      <div className="w-full py-2">
        <span className="font-bold text-blue">جزئیات سفارش</span>
        <div className="grid grid-cols-12 gap-4 p-4">
          <TextField
            label="سقف خرید کد حقیقی"
            className="col-span-3"
            value={realCodeBuyLimit}
            onChange={(value: any) =>
              setState({
                realCodeBuyLimit: value,
                realCodeBuyLimitError: '',
              })
            }
            required
            errorMessage={state?.realCodeBuyLimitError}
            type="numeric"
          />
          <TextField
            label="سقف خرید کد حقوقی"
            className="col-span-3"
            value={legalCodeBuyLimit}
            onChange={(value: any) =>
              setState({
                legalCodeBuyLimit: value,
                legalCodeBuyLimitError: '',
              })
            }
            required
            errorMessage={state?.legalCodeBuyLimitError}
            type="numeric"
          />
          <TextField
            label="حداقل مقدار هر سفارش"
            className="col-span-3"
            value={orderMinAmount}
            onChange={(value: any) =>
              setState({
                orderMinAmount: value,
                orderMinAmountError: '',
              })
            }
            required
            errorMessage={state?.orderMinAmountError}
            type="numeric"
          />
          <TextField
            label="حداکثر مقدار هر سفارش"
            className="col-span-3"
            value={orderMaxAmount}
            onChange={(value: any) =>
              setState({
                orderMaxAmount: value,
                orderMaxAmountError: '',
              })
            }
            required
            errorMessage={state?.orderMaxAmountError}
            type="numeric"
          />
          <TextField
            label="حداقل تغییر قیمت هر سفارش "
            className="col-span-3"
            value={orderMinChange}
            onChange={(value: any) =>
              setState({
                orderMinChange: value,
                orderMinChangeError: '',
              })
            }
            required
            errorMessage={state?.orderMinChangeError}
            type="numeric"
          />
          <TextField
            label="مضرب هر سفارش (واحد)"
            className="col-span-3"
            value={orderMultiple}
            onChange={(value: any) =>
              setState({
                orderMultiple: value,
                orderMultipleError: '',
              })
            }
            required
            errorMessage={state?.orderMultipleError}
            type="numeric"
          />
        </div>
      </div>

      <div className="w-full py-2">
        <span className="font-bold text-blue">تاریخ</span>
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
          <div className="col-span-3">
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
                  toDateError: '',
                })
              }
              required
              error={state?.toDateError}
            />
          </div>
        </div>
      </div>

      <div className="w-full py-2">
        <span className="font-bold text-blue">اطلاعات تکمیلی</span>
        <div className="grid grid-cols-12 gap-4 p-4">
          <div className="col-span-12">
            <FormControlLabel
              control={
                <Checkbox
                  checked={dayTrade}
                  onChange={(e) => setState({ dayTrade: e.target.checked })}
                />
              }
              label="Day trade"
              className="!m-0 !text-extratiny"
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
            type="numeric"
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
            type="numeric"
          />
          <div className="col-span-5">
            <span className="text-extratiny">معاملات ثانویه :</span>
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
        <span className="font-bold text-blue">توضیحات</span>
        <div className="grid grid-cols-12 gap-4 p-4">
          <div className="col-span-12 flex flex-row items-center">
            <span className="ml-4 mb-2 whitespace-pre">
              صورتجلسه کمیته انتشار اوراق تبعی:
            </span>
            <Upload
              onChange={(file: any) => onChangeFile(file, 'proceedingsFile')}
              value={proceedingsFile?.fileName}
              href={proceedingsFile?.link}
              name="proceedingsFile"
              onDelete={() => setState({ proceedingsFile: null })}
              error={state?.proceedingsFileError}
              labelClassName="max-w-[9rem]"
            />
          </div>
          <TextField
            label="توضیحات"
            className="col-span-12"
            value={authorizedBuyersDescription}
            onChange={(value: any) =>
              setState({
                authorizedBuyersDescription: value,
                authorizedBuyersDescriptionError: '',
              })
            }
            // required
            // errorMessage={state?.authorizedBuyersDescriptionError}
            multiline
            fullWidth
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

export default withAlert(Option);
