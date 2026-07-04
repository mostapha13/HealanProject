import {
  TextField,
  Select,
  Button,
  Upload,
  SearchField,
  NewSelectSearch,
} from '@tse/components/atoms';
import withAlert from '../../../hoc/withAlert';
import { useStates, useEffect, useNavigate } from '@tse/utils';
import { DatePicker } from '@tse/components/molecules';
import { deSeparator, getQueryParams } from '@tse/tools';
import {
  uploadFile,
  getInstrumentFundDescriptionType,
  saveInstrumentFund,
  getInstrumentFundDetail,
  getInstrumentDebitGroup,
  getInstrumentDebitInterestPaymentType,
  getIndustryListData,
  geBrokerList,
  getFundListDebit,
  getSubIndustryListData,
  getInstrumentDebitUnderwritingMethodType,
  getInstrumentDebitSettlementTimeType,
  getTrusteeList,
  getFunderMangerList,
  getAuditorList,
  getInstrumentFundApplication,
} from '../../../Controller';
import NewSelect from '../../../components/atoms/NewSelect';
import { AutoCompleteInput } from 'apps/cash-market/src/components/AutoCompleteInput';

const initialState = {
  instrumentName: '',
  description: '',
  selectedIndustryId: [],
  subIndustryId: [],
  instrumentFundDescriptionType: [],
  unitCost: '10000',
  instrumentFundTotalCount: '',
  instrumentFundAcceptedCount: '',
  instrumentFundFoundersCount: '',
  fundLife: 'نامحدود',
  instrumentDebitInterestPaymentType: [],
  instrumentDebitSettlementTimeType: [],
  cashCode: '',
  startSecondaryDealingDate: null,
  instrumentDebitUnderwritingMethodType: '',
  supplyPrice: '10000',
  underwritingStartDate: null,
  underwritingEndDate: null,
  underwritingExtendedStartDate: null,
  underwritingExtendedEndDate: null,
  underwritingBroker: null,
  funders: '',
  funderManager: '',
  trustee: '',
  auditor: '',
  marketMakerUser: null,
  marketMakerBroker: null,
  dailyFluctuationRange: '10',
  quoteRange: '',
  minimumDailyTradingCommitment: '',
  minimumCumulativeOrder: '',
  marketMakerCode: '',
  minimumPriceChange: '',
  orderUnit: '1',
  minimumOrderSize: '1',
  maximumOrderSize: '1000000',
  legalMaximumPurchase: 'بدون محدودیت',
  realMaximumPurchase: 'بدون محدودیت',
  subscriptionLicenseFile: null,
  registrySheetFile: null,
  subIndustry: [],
  interestPayments: [],
  industryList: [],
  settlementTimes: [],
  brokerList: [],
  marketMakerList: [],
  fundDescriptionType: [],
  underwritingMethodList: [],
  trusteeList: [],
  funderManagerList: [],
  auditorList: [],
  fundApplicationList: [],
  selectedFundApplication: '',
};

function Fund({ onAlert }: any) {
  const navigate = useNavigate();
  const [state, setState] = useStates<any>(initialState);
  const {
    instrumentName,
    description,
    selectedIndustryId,
    subIndustryId,
    instrumentFundDescriptionType,
    unitCost,
    instrumentFundTotalCount,
    instrumentFundAcceptedCount,
    instrumentFundFoundersCount,
    fundLife,
    instrumentDebitInterestPaymentType,
    instrumentDebitSettlementTimeType,
    cashCode,
    startSecondaryDealingDate,
    instrumentDebitUnderwritingMethodType,
    supplyPrice,
    underwritingStartDate,
    underwritingEndDate,
    underwritingExtendedStartDate,
    underwritingExtendedEndDate,
    underwritingBroker,
    funders,
    funderManager,
    trustee,
    auditor,
    marketMakerUser,
    marketMakerBroker,
    dailyFluctuationRange,
    quoteRange,
    minimumDailyTradingCommitment,
    minimumCumulativeOrder,
    marketMakerCode,
    minimumPriceChange,
    orderUnit,
    minimumOrderSize,
    maximumOrderSize,
    legalMaximumPurchase,
    realMaximumPurchase,
    subscriptionLicenseFile,
    registrySheetFile,
    subIndustry,
    interestPayments,
    industryList,
    settlementTimes,
    brokerList,
    marketMakerList,
    fundDescriptionType,
    underwritingMethodList,
    trusteeList,
    funderManagerList,
    auditorList,
    fundApplicationList,
    selectedFundApplication,
  } = state;

  const isCopy = getQueryParams('isCopy', window.location.href) === 'true';
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

  useEffect(() => {
    getIndustryList();
    // getSubIndustryList();
    getFundDescriptionType();
    getDebitInterestPaymentType();
    getDebitSettlementTimeType();
    getUnderwritingMethodList();
    getBroker('', 1);
    getMarketMakers('', 1);
    getFundApplication();
  }, []);

  useEffect(() => {
    getSubIndustryList();
  }, [selectedIndustryId]);
  useEffect(() => {
    getTrustee(trustee);
  }, [trustee]);
  useEffect(() => {
    getFunderManger(funderManager);
  }, [funderManager]);
  useEffect(() => {
    getAuditor(auditor);
  }, [auditor]);
  const getIndustryList = () => {
    getIndustryListData({
      onSuccess: (res: any) => {
        if (id) {
          setState({
            industryList: res,
          });
        } else {
          setState({
            industryList: res,
            selectedIndustryId: res[53]?.industryId,
          });
        }
      },

      onFail,
    });
  };
  const getSubIndustryList = () => {
    getSubIndustryListData({
      data: { IndustryId: selectedIndustryId },
      onSuccess: (res: any) => {
        if (id) {
          setState({
            subIndustry: res,
          });
        } else {
          setState({
            subIndustry: res,
            subIndustryId: res[0]?.subIndustryId,
          });
        }
      },
      onFail,
    });
  };
  //نوع صندوق
  const getFundDescriptionType = () => {
    getInstrumentFundDescriptionType({
      onSuccess: (res: any) =>
        setState({
          fundDescriptionType: res,
        }),
      onFail,
    });
  };
  const getDebitInterestPaymentType = () => {
    getInstrumentDebitInterestPaymentType({
      onSuccess: (res: any) => {
        if (id) {
          setState({
            interestPayments: res,
          });
        } else {
          setState({
            interestPayments: res,
            instrumentDebitInterestPaymentType:
              res[0]?.instrumentInterestPaymentTypeId,
          });
        }
      },
      onFail,
    });
  };
  const getUnderwritingMethodList = () => {
    getInstrumentDebitUnderwritingMethodType({
      data: { MarketCategoryId: 5 },
      onSuccess: (res: any) =>
        setState({
          underwritingMethodList: res,
          // instrumentDebitUnderwritingMethodType: res[0]?.underwritingMethodId,
        }),
      onFail,
    });
  };
  //زمان تسویه
  const getDebitSettlementTimeType = () => {
    getInstrumentDebitSettlementTimeType({
      onSuccess: (res: any) => {
        if (id) {
          setState({
            settlementTimes: res,
          });
        } else {
          setState({
            settlementTimes: res,
            instrumentDebitSettlementTimeType:
              res[0]?.instrumentDebitSettlementTimeTypeId,
          });
        }
      },
      onFail,
    });
  };
  //نرم افزار صندوق
  const getFundApplication = () => {
    getInstrumentFundApplication({
      onSuccess: (res: any) => {
        if (id) {
          setState({
            fundApplicationList: res,
          });
        } else {
          setState({
            fundApplicationList: res,
            selectedFundApplication: res[0]?.instrumentFundApplicationId,
          });
        }
      },
      onFail,
    });
  };
  const getBroker = (text: string, pageNo: number) => {
    const data = {
      SearchText: text,
      PageNumber: pageNo,
    };
    geBrokerList({
      data,
      onSuccess: (res: any) =>
        setState({
          brokerList: res,
        }),
      onFail,
    });
  };

  const getMarketMakers = (text: string, pageNo: number) => {
    const data = {
      FundName: text,
      PageNumber: pageNo,
    };
    getFundListDebit({
      data,
      onSuccess: (res: any) =>
        setState({
          marketMakerList: res,
        }),
      onFail,
    });
  };
  const getTrustee = (text: string) => {
    const data = {
      TextSearch: text,
    };
    getTrusteeList({
      data,
      onSuccess: (res: any) =>
        setState({
          trusteeList: res,
        }),
      onFail,
    });
  };
  const getFunderManger = (text: string) => {
    const data = {
      TextSearch: text,
    };
    getFunderMangerList({
      data,
      onSuccess: (res: any) =>
        setState({
          funderManagerList: res,
        }),
      onFail,
    });
  };
  const getAuditor = (text: string) => {
    const data = {
      TextSearch: text,
    };
    getAuditorList({
      data,
      onSuccess: (res: any) =>
        setState({
          auditorList: res,
        }),
      onFail,
    });
  };
  const onSuccessDetail = (result: any) => {
    const {
      instrumentName,
      description,
      industry,
      subIndustry,
      instrumentFundType,
      unitCost,
      instrumentFundTotalCount,
      instrumentFundAcceptedCount,
      instrumentFundFoundersCount,
      fundLife,
      instrumentDebitInterestPaymentType,
      instrumentDebitSettlementTimeType,
      cashCode,
      startSecondaryDealingDate,
      underwritingMethod,
      supplyPrice,
      underwritingStartDate,
      underwritingEndDate,
      underwritingExtendedStartDate,
      underwritingExtendedEndDate,
      underwritingBroker,
      funders,
      funderManager,
      trustee,
      auditor,
      fund,
      marketMakerBroker,
      dailyFluctuationRange,
      quoteRange,
      minimumDailyTradingCommitment,
      minimumCumulativeOrder,
      marketMakerCode,
      minimumPriceChange,
      orderUnit,
      minimumOrderSize,
      maximumOrderSize,
      legalMaximumPurchase,
      realMaximumPurchase,
      subscriptionLicenseFile,
      registrySheetFile,
      instrumentFundApplication,
    } = result;

    setState({
      instrumentName,
      description,
      selectedIndustryId: industry?.industryId,
      subIndustryId: subIndustry?.subIndustryId,
      instrumentFundDescriptionType: instrumentFundType?.instrumentFundTypeId,
      unitCost,
      instrumentFundTotalCount,
      instrumentFundAcceptedCount,
      instrumentFundFoundersCount,
      fundLife,
      instrumentDebitInterestPaymentType:
        instrumentDebitInterestPaymentType?.instrumentInterestPaymentTypeId,
      instrumentDebitSettlementTimeType:
        instrumentDebitSettlementTimeType?.instrumentDebitSettlementTimeTypeId,
      cashCode,
      startSecondaryDealingDate,
      instrumentDebitUnderwritingMethodType:
        underwritingMethod?.underwritingMethodId,
      supplyPrice: supplyPrice != null ? supplyPrice : '',
      underwritingStartDate,
      underwritingEndDate,
      underwritingExtendedStartDate,
      underwritingExtendedEndDate,
      underwritingBroker: underwritingBroker,
      funders,
      funderManager,
      trustee,
      auditor,
      marketMakerUser: fund,
      marketMakerBroker: marketMakerBroker,
      dailyFluctuationRange:
        dailyFluctuationRange != null ? dailyFluctuationRange : '',
      quoteRange: quoteRange != null ? quoteRange : '',
      minimumDailyTradingCommitment:
        minimumDailyTradingCommitment != null
          ? minimumDailyTradingCommitment
          : '',
      minimumCumulativeOrder:
        minimumCumulativeOrder != null ? minimumCumulativeOrder : '',
      marketMakerCode,
      minimumPriceChange,
      orderUnit,
      minimumOrderSize,
      maximumOrderSize,
      legalMaximumPurchase,
      realMaximumPurchase,
      subscriptionLicenseFile,
      registrySheetFile,
      selectedFundApplication:
        instrumentFundApplication?.instrumentFundApplicationId,
    });
  };

  const onFail = (error: any) => {
    onAlert(error);
  };
  const onSubmit = () => {
    if (
      instrumentName &&
      description &&
      selectedIndustryId &&
      subIndustryId &&
      // instrumentFundDescriptionType &&
      unitCost &&
      instrumentFundTotalCount &&
      instrumentFundAcceptedCount &&
      instrumentFundFoundersCount &&
      fundLife &&
      instrumentDebitInterestPaymentType &&
      instrumentDebitSettlementTimeType &&
      // instrumentDebitUnderwritingMethodType &&
      // supplyPrice &&
      // underwritingStartDate &&
      // underwritingEndDate &&
      // underwritingExtendedStartDate &&
      // underwritingExtendedEndDate &&
      // underwritingBroker &&
      funders &&
      funderManager &&
      trustee &&
      auditor &&
      // marketMakerUser &&
      // marketMakerBroker &&
      // dailyFluctuationRange &&
      // quoteRange &&
      // minimumDailyTradingCommitment &&
      // minimumCumulativeOrder &&
      minimumPriceChange &&
      orderUnit &&
      minimumOrderSize &&
      maximumOrderSize &&
      legalMaximumPurchase &&
      realMaximumPurchase &&
      subscriptionLicenseFile &&
      registrySheetFile &&
      selectedFundApplication
    ) {
      const data = {
        ...(!isCopy && id && { instrumentFundId: id }),
        instrumentName,
        description,
        industry: {
          industryId: Number(selectedIndustryId),
        },
        subIndustry: { subIndustryId: Number(subIndustryId) },
        ...(instrumentFundDescriptionType != '' &&
        instrumentFundDescriptionType != undefined
          ? {
              instrumentFundType: {
                instrumentFundTypeId: Number(instrumentFundDescriptionType),
              },
            }
          : { instrumentFundType: null }),
        unitCost,
        instrumentFundTotalCount,
        instrumentFundAcceptedCount,
        instrumentFundFoundersCount,
        fundLife,
        instrumentDebitInterestPaymentType: {
          instrumentInterestPaymentTypeId: Number(
            instrumentDebitInterestPaymentType
          ),
        },
        instrumentDebitSettlementTimeType: {
          instrumentDebitSettlementTimeTypeId: Number(
            instrumentDebitSettlementTimeType
          ),
        },
        cashCode,
        startSecondaryDealingDate,
        ...(instrumentDebitUnderwritingMethodType != '' &&
        instrumentDebitUnderwritingMethodType != undefined
          ? {
              underwritingMethod: {
                underwritingMethodId: instrumentDebitUnderwritingMethodType,
              },
            }
          : { underwritingMethod: null }),
        supplyPrice: supplyPrice != '' ? supplyPrice : null,
        underwritingStartDate,
        underwritingEndDate,
        underwritingExtendedStartDate,
        underwritingExtendedEndDate,
        underwritingBroker: underwritingBroker,
        funders,
        funderManager,
        trustee,
        auditor,
        fund: marketMakerUser,
        marketMakerBroker: marketMakerBroker,
        dailyFluctuationRange:
          dailyFluctuationRange != '' ? dailyFluctuationRange : null,
        quoteRange: quoteRange != '' ? quoteRange : null,
        minimumDailyTradingCommitment:
          minimumDailyTradingCommitment != ''
            ? minimumDailyTradingCommitment
            : null,
        minimumCumulativeOrder:
          minimumCumulativeOrder != '' ? minimumCumulativeOrder : null,
        marketMakerCode,
        minimumPriceChange,
        orderUnit,
        minimumOrderSize,
        maximumOrderSize,
        legalMaximumPurchase,
        realMaximumPurchase,
        subscriptionLicenseFile,
        registrySheetFile,
        instrumentFundApplication: {
          instrumentFundApplicationId: selectedFundApplication,
        },
      };
      saveInstrumentFund({ data, onSuccess: onSuccessSave, onFail });
    } else {
      !instrumentName && setErrorMessage('instrumentName');
      !description && setErrorMessage('description');
      !selectedIndustryId && setErrorMessage('selectedIndustryId');
      !subIndustryId && setErrorMessage('subIndustryId');
      // !instrumentFundDescriptionType &&
      //   setErrorMessage('instrumentFundDescriptionType');
      !unitCost && setErrorMessage('unitCost');
      !instrumentFundTotalCount && setErrorMessage('instrumentFundTotalCount');
      !instrumentFundAcceptedCount &&
        setErrorMessage('instrumentFundAcceptedCount');
      !instrumentFundFoundersCount &&
        setErrorMessage('instrumentFundFoundersCount');
      !fundLife && setErrorMessage('fundLife');
      !instrumentDebitInterestPaymentType &&
        setErrorMessage('instrumentDebitInterestPaymentType');
      !instrumentDebitSettlementTimeType &&
        setErrorMessage('instrumentDebitSettlementTimeType');
      // !instrumentDebitUnderwritingMethodType &&
      //   setErrorMessage('instrumentDebitUnderwritingMethodType');
      // !supplyPrice && setErrorMessage('supplyPrice');
      // !underwritingStartDate && setErrorMessage('underwritingStartDate');
      // !underwritingEndDate && setErrorMessage('underwritingEndDate');
      // !underwritingExtendedStartDate &&
      //   setErrorMessage('underwritingExtendedStartDate');
      // !underwritingExtendedEndDate &&
      //   setErrorMessage('underwritingExtendedEndDate');
      // !underwritingBroker && setErrorMessage('underwritingBroker');
      !funders && setErrorMessage('funders');
      !funderManager && setErrorMessage('funderManager');
      !trustee && setErrorMessage('trustee');
      !auditor && setErrorMessage('auditor');
      // !marketMakerUser && setErrorMessage('marketMakerUser');
      // !marketMakerBroker && setErrorMessage('marketMakerBroker');
      // !dailyFluctuationRange && setErrorMessage('dailyFluctuationRange');
      // !quoteRange && setErrorMessage('quoteRange');
      // !minimumDailyTradingCommitment &&
      //   setErrorMessage('minimumDailyTradingCommitment');
      // !minimumCumulativeOrder && setErrorMessage('minimumCumulativeOrder');
      !minimumPriceChange && setErrorMessage('minimumPriceChange');
      !orderUnit && setErrorMessage('orderUnit');
      !minimumOrderSize && setErrorMessage('minimumOrderSize');
      !maximumOrderSize && setErrorMessage('maximumOrderSize');
      !legalMaximumPurchase && setErrorMessage('legalMaximumPurchase');
      !realMaximumPurchase && setErrorMessage('realMaximumPurchase');
      !subscriptionLicenseFile && setErrorMessage('subscriptionLicenseFile');
      !registrySheetFile && setErrorMessage('registrySheetFile');
      !selectedFundApplication && setErrorMessage('selectedFundApplication');
    }
  };

  const setErrorMessage = (key: string) => {
    const errorMessage = ' ';
    setState({ [`${key}Error`]: errorMessage });
  };

  const onSuccessSave: any = () => {
    onAlert({ message: 'عملیات با موفقیت انجام شد', type: 'success' });
    navigate('/instrument/instrument-list?tab=5');
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

  const onSearchBroker = (value: string) => {
    getBroker(value, 1);
  };

  const onSearchMarketMaker = (value: string) => {
    getMarketMakers(value, 1);
  };
  // let searchInputOption: any = [];
  // trusteeList?.map((item: any) =>
  //   searchInputOption.push({
  //     label: item,
  //     value: item,
  //     id: item,
  //   })
  // );

  return (
    <div>
      <div className="w-full py-2">
        <span className="font-bold text-blue">مشخصات صندوق</span>
        <div className="grid grid-cols-12 gap-4 p-4">
          <TextField
            label="نماد معاملاتی"
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
            // maxLength={8}
          />
          <TextField
            label="شرح نماد معاملاتی"
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

          <div className="col-span-3">
            <NewSelect
              label="صنعت*"
              className="col-span-3"
              options={industryList}
              onChange={(value: any) =>
                setState({
                  selectedIndustryId: value,
                })
              }
              showKey="industryName"
              selectedKey="industryId"
              value={selectedIndustryId}
            />
          </div>

          <div className="col-span-3">
            <NewSelect
              label="زیر صنعت*"
              className="col-span-3"
              options={subIndustry}
              onChange={(value: any) =>
                setState({
                  subIndustryId: value,
                })
              }
              showKey="subIndustryName"
              selectedKey="subIndustryId"
              value={subIndustryId}
            />
          </div>

          <div className="col-span-3">
            <NewSelect
              label="نوع صندوق"
              className="col-span-3"
              options={[
                { instrumentFundTypeName: '', instrumentFundTypeId: '' },
                ...fundDescriptionType,
              ]}
              onChange={(value: any) =>
                setState({
                  instrumentFundDescriptionType: value,
                })
              }
              showKey="instrumentFundTypeName"
              selectedKey="instrumentFundTypeId"
              value={instrumentFundDescriptionType}
            />
          </div>

          <TextField
            label="ارزش اسمی هر واحد"
            className="col-span-3"
            value={unitCost}
            onChange={(value: any) =>
              setState({
                unitCost: value,
                unitCostError: '',
              })
            }
            required
            errorMessage={state?.unitCostError}
            type="numeric"
            prefix="ریال"
          />

          <TextField
            label="تعداد کل واحد های صندوق"
            className="col-span-3"
            value={instrumentFundTotalCount}
            onChange={(value: any) =>
              setState({
                instrumentFundTotalCount: value,
                instrumentFundTotalCountError: '',
              })
            }
            required
            errorMessage={state?.instrumentFundTotalCountError}
            type="numeric"
          />
          <TextField
            label="عمر صندوق"
            className="col-span-3"
            value={fundLife}
            onChange={(value: any) =>
              setState({
                fundLife: value,
                fundLifeError: '',
              })
            }
            required
            errorMessage={state?.fundLifeError}
          />

          <TextField
            label="واحدهای سرمایه گذاری قابل پذیره نویسی"
            className="col-span-6"
            value={instrumentFundAcceptedCount}
            onChange={(value: any) =>
              setState({
                instrumentFundAcceptedCount: value,
                instrumentFundAcceptedCountError: '',
              })
            }
            required
            errorMessage={state?.instrumentFundAcceptedCountError}
            type="numeric"
          />

          <TextField
            label="تعداد واحدهای سرمایه گذاری ممتاز در اختیار موسسین"
            className="col-span-6"
            value={instrumentFundFoundersCount}
            onChange={(value: any) =>
              setState({
                instrumentFundFoundersCount: value,
                instrumentFundFoundersCountError: '',
              })
            }
            required
            errorMessage={state?.instrumentFundFoundersCountError}
            type="numeric"
          />

          <div className="col-span-3">
            <NewSelect
              label="پرداخت سود دوره ای*"
              className="col-span-3"
              options={interestPayments}
              onChange={(value: any) =>
                setState({
                  instrumentDebitInterestPaymentType: value,
                })
              }
              showKey="instrumentInterestPaymentTypeName"
              selectedKey="instrumentInterestPaymentTypeId"
              value={instrumentDebitInterestPaymentType}
            />
          </div>

          <div className="col-span-3">
            <NewSelect
              label="زمان تسویه"
              className="col-span-3"
              options={settlementTimes}
              onChange={(value: any) =>
                setState({
                  instrumentDebitSettlementTimeType: value,
                })
              }
              showKey="instrumentDebitSettlementTimeTypeName"
              selectedKey="instrumentDebitSettlementTimeTypeId"
              value={instrumentDebitSettlementTimeType}
            />
          </div>
          <TextField
            label="کد صندوق"
            className="col-span-3"
            value={cashCode}
            onChange={(value: any) =>
              setState({
                cashCode: value,
                cashCodeError: '',
              })
            }
            // required
            // errorMessage={state?.supplierCodeError}
            // type="number"
          />
          <div className="col-span-3 !z-12" style={{ zIndex: 20 }}>
            <DatePicker
              label="تاریخ شروع معاملات ثانویه"
              value={startSecondaryDealingDate}
              onChange={(value: any) =>
                setState({
                  startSecondaryDealingDate: value,
                  startSecondaryDealingDateError: '',
                })
              }
              onClearDate={() => setState({ startSecondaryDealingDate: null })}
            />
          </div>
          <div className="col-span-3">
            <NewSelect
              label="نرم افزار صندوق"
              className="col-span-3"
              options={fundApplicationList}
              onChange={(value: any) =>
                setState({
                  selectedFundApplication: value,
                })
              }
              required
              errorMessage={state?.selectedFundApplicationError}
              showKey="instrumentFundApplicationName"
              selectedKey="instrumentFundApplicationId"
              value={selectedFundApplication}
            />
          </div>
        </div>
      </div>

      <div className="w-full py-2">
        <span className="font-bold text-blue">شرایط پذیره نویسی</span>
        <div className="grid grid-cols-12 gap-4 p-4">
          <div className="col-span-3">
            <NewSelect
              label="روش پذیره نویسی"
              className="col-span-3"
              options={[
                { underwritingMethodName: '', underwritingMethodId: '' },
                ...underwritingMethodList,
              ]}
              onChange={(value: any) =>
                setState({
                  instrumentDebitUnderwritingMethodType: value,
                })
              }
              // required
              // errorMessage={state?.instrumentDebitUnderwritingMethodTypeError}
              showKey="underwritingMethodName"
              selectedKey="underwritingMethodId"
              value={instrumentDebitUnderwritingMethodType}
            />
          </div>
          <TextField
            label="قیمت عرضه"
            className="col-span-3"
            value={supplyPrice}
            onChange={(value: any) =>
              setState({
                supplyPrice: value,
                supplyPriceError: '',
              })
            }
            // required
            // errorMessage={state?.supplyPriceError}
            type="numeric"
            prefix="ریال"
          />
          <div className="col-span-3 z-10" style={{ zIndex: 20 }}>
            <DatePicker
              label="تاریخ شروع پذیره نویسی"
              value={underwritingStartDate}
              onChange={(value: any) =>
                setState({
                  underwritingStartDate: value,
                  underwritingStartDateError: '',
                })
              }
              onClearDate={() => setState({ underwritingStartDate: null })}
              // required
              // error={state?.underwritingStartDateError}
            />
          </div>
          <div className="col-span-3 !z-10" style={{ zIndex: 20 }}>
            <DatePicker
              label="تاریخ پایان پذیره نویسی"
              value={underwritingEndDate}
              onChange={(value: any) =>
                setState({
                  underwritingEndDate: value,
                  underwritingEndDateError: '',
                })
              }
              onClearDate={() => setState({ underwritingEndDate: null })}
              // required
              // error={state?.underwritingEndDateError}
            />
          </div>
          <div className="col-span-3 z-10" style={{ zIndex: 20 }}>
            <DatePicker
              label="تاریخ شروع تمدید پذیره نویسی"
              value={underwritingExtendedStartDate}
              onChange={(value: any) =>
                setState({
                  underwritingExtendedStartDate: value,
                  underwritingExtendedStartDateError: '',
                })
              }
              onClearDate={() =>
                setState({ underwritingExtendedStartDate: null })
              }
              // required
              // error={state?.underwritingExtendedStartDateError}
            />
          </div>
          <div className="col-span-3 z-10" style={{ zIndex: 20 }}>
            <DatePicker
              label="تاریخ پایان تمدید پذیره نویسی"
              value={underwritingExtendedEndDate}
              onChange={(value: any) =>
                setState({
                  underwritingExtendedEndDate: value,
                  underwritingExtendedEndDateError: '',
                })
              }
              onClearDate={() =>
                setState({ underwritingExtendedEndDate: null })
              }
              // required
              // error={state?.underwritingExtendedEndDateError}
            />
          </div>
          <div className="col-span-3 flex flex-col">
            <NewSelectSearch
              className="col-span-3"
              label="کارگزار عامل پذیره نویسی"
              onChange={(value: any) => {
                if (value?.brokerName !== undefined) {
                  setState({
                    underwritingBroker: value,
                    underwritingBrokerError: '',
                  });
                } else if (value == '') {
                  setState({
                    underwritingBroker: null,
                  });
                }
                getBroker(value, 1);
              }}
              value={underwritingBroker}
              // required
              // error={state?.underwritingBrokerError}
              data={brokerList?.items}
              showKey="brokerName"
            />
            {underwritingBroker?.brokerCode ? (
              <span className="mt-10 font-extra-light text-blue">{`* کد کارگزار  : ${underwritingBroker?.brokerCode}`}</span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="w-full py-2">
        <span className="font-bold text-blue">ارکان صندوق</span>
        <div className="grid grid-cols-12 gap-4 p-4">
          <TextField
            label="موسسین"
            className="col-span-6"
            value={funders}
            onChange={(value: any) =>
              setState({
                funders: value,
                fundersError: '',
              })
            }
            required
            errorMessage={state?.fundersError}
          />
          <AutoCompleteInput
            label="مدیر صندوق *"
            options={funderManagerList}
            value={funderManager}
            onSelect={(item: string) =>
              setState({ funderManager: item, funderManagerError: '' })
            }
            className="!col-span-6"
            onChange={(item: any) =>
              setState({
                funderManager: item?.target?.value,
                funderManagerError: '',
              })
            }
            required
            errorMessage={state?.funderManagerError}
          />
          <AutoCompleteInput
            label="متولی *"
            options={trusteeList}
            value={trustee}
            onSelect={(item: string) =>
              setState({ trustee: item, trusteeError: '' })
            }
            className="!col-span-6"
            onChange={(item: any) =>
              setState({
                trustee: item?.target?.value,
                trusteeError: '',
              })
            }
            required
            errorMessage={state?.trusteeError}
          />
          <AutoCompleteInput
            label="حسابرس *"
            options={auditorList}
            value={auditor}
            onSelect={(item: string) =>
              setState({ auditor: item, auditorError: '' })
            }
            className="!col-span-6"
            onChange={(item: any) =>
              setState({
                auditor: item?.target?.value,
                auditorError: '',
              })
            }
            required
            errorMessage={state?.auditorError}
          />
        </div>
      </div>

      <div className="w-full py-2">
        <span className="font-bold text-blue">شرایط بازارگردانی</span>
        <div className="grid grid-cols-12 gap-4 p-4">
          <NewSelectSearch
            className="col-span-3"
            label="بازارگردان صندوق"
            onChange={(value: any) => {
              if (value?.fundName !== undefined) {
                setState({
                  marketMakerUser: value,
                  marketMakerUserError: '',
                });
              } else if (value == '') {
                setState({
                  marketMakerUser: null,
                });
              }
              getMarketMakers(value, 1);
            }}
            value={marketMakerUser}
            // required
            // error={state?.marketMakerUserError}
            data={marketMakerList}
            showKey="fundName"
          />
          <div className="col-span-3 flex flex-col">
            <NewSelectSearch
              className="col-span-3"
              label="کارگزار بازارگردان"
              onChange={(value: any) => {
                if (value?.brokerName !== undefined) {
                  setState({
                    marketMakerBroker: value,
                    marketMakerBrokerError: '',
                  });
                } else if (value == '') {
                  setState({
                    marketMakerBroker: null,
                  });
                }
                getBroker(value, 1);
              }}
              value={marketMakerBroker}
              // required
              // error={state?.marketMakerBrokerError}
              data={brokerList?.items}
              showKey="brokerName"
            />
            {marketMakerBroker?.brokerCode ? (
              <span className="mt-10 font-extra-light text-blue">{`* کد کارگزار بازارگردان : ${marketMakerBroker?.brokerCode}`}</span>
            ) : null}
          </div>

          <TextField
            label="دامنه نوسان روزانه"
            className="col-span-3"
            value={dailyFluctuationRange}
            onChange={(value: any) =>
              setState({
                dailyFluctuationRange: deSeparator(value),
                dailyFluctuationRangeError: '',
              })
            }
            // required
            // errorMessage={state?.dailyFluctuationRangeError}
            // type="number"
            prefix="10%"
          />
          <TextField
            label="دامنه مظنه"
            className="col-span-3"
            value={quoteRange}
            onChange={(value: any) =>
              setState({
                quoteRange: value,
                quoteRangeError: '',
              })
            }
            // required
            // errorMessage={state?.quoteRangeError}
            type="number"
            prefix="10%"
          />
          <TextField
            label="حداقل معامله روزانه"
            className="col-span-3"
            value={minimumDailyTradingCommitment}
            onChange={(value: any) =>
              setState({
                minimumDailyTradingCommitment: value,
                minimumDailyTradingCommitmentError: '',
              })
            }
            // required
            // errorMessage={state?.minimumDailyTradingCommitmentError}
            type="number"
          />
          <TextField
            label="حداقل سفارش انباشته"
            className="col-span-3"
            value={minimumCumulativeOrder}
            onChange={(value: any) =>
              setState({
                minimumCumulativeOrder: value,
                minimumCumulativeOrderError: '',
              })
            }
            // required
            // errorMessage={state?.minimumCumulativeOrderError}
            type="number"
          />
          <TextField
            label="کد بازارگردان"
            className="col-span-3"
            value={marketMakerCode}
            onChange={(value: any) =>
              setState({
                marketMakerCode: value,
                marketMakerCodeError: '',
              })
            }
            // required
            // errorMessage={state?.supplierCodeError}
            // type="number"
          />
        </div>
      </div>

      <div className="w-full py-2">
        <span className="font-bold text-blue">محدودیت های معاملاتی</span>
        <div className="grid grid-cols-12 gap-4 p-4">
          <TextField
            label="حداقل تغییر قیمت (price tik)"
            className="col-span-3"
            value={minimumPriceChange}
            onChange={(value: any) =>
              setState({
                minimumPriceChange: value,
                minimumPriceChangeError: '',
              })
            }
            required
            errorMessage={state?.minimumPriceChangeError}
            type="numeric"
            prefix="ریال"
          />
          <TextField
            label="واحد پایه هر سفارش"
            className="col-span-3"
            value={orderUnit}
            onChange={(value: any) =>
              setState({
                orderUnit: value,
                orderUnitError: '',
              })
            }
            required
            errorMessage={state?.orderUnitError}
            type="numeric"
            prefix="1"
          />
          <TextField
            label="حداقل حجم هر سفارش"
            className="col-span-3"
            value={minimumOrderSize}
            onChange={(value: any) =>
              setState({
                minimumOrderSize: value,
                minimumOrderSizeError: '',
              })
            }
            required
            errorMessage={state?.minimumOrderSizeError}
            type="numeric"
            prefix="1"
          />
          <TextField
            label="حداکثر حجم هر سفارش"
            className="col-span-3"
            value={maximumOrderSize}
            onChange={(value: any) =>
              setState({
                maximumOrderSize: value,
                maximumOrderSizeError: '',
              })
            }
            required
            errorMessage={state?.maximumOrderSizeError}
            type="numeric"
            prefix="واحد"
          />
          <TextField
            label="حداکثر خرید کد معاملاتی حقیقی"
            className="col-span-3"
            value={legalMaximumPurchase}
            onChange={(value: any) =>
              setState({
                legalMaximumPurchase: value,
                legalMaximumPurchaseError: '',
              })
            }
            required
            errorMessage={state?.legalMaximumPurchaseError}
          />
          <TextField
            label="حداکثر خرید کد معاملاتی حقوقی"
            className="col-span-3"
            value={realMaximumPurchase}
            onChange={(value: any) =>
              setState({
                realMaximumPurchase: value,
                realMaximumPurchaseError: '',
              })
            }
            required
            errorMessage={state?.realMaximumPurchaseError}
          />
        </div>
      </div>

      <div className="w-full py-2">
        <span className="font-bold text-blue">فایل‌ها</span>
        <div className="grid grid-cols-12 gap-4 p-4">
          <div className="col-span-4 flex flex-col">
            <span className="ml-4 mb-2 whitespace-pre">
              مجوز پذیره نویسی* :
            </span>
            <Upload
              onChange={(file: any) =>
                onChangeFile(file, 'subscriptionLicenseFile')
              }
              value={subscriptionLicenseFile?.fileName}
              href={subscriptionLicenseFile?.link}
              name="subscriptionLicenseFile"
              onDelete={() => setState({ subscriptionLicenseFile: null })}
              error={state?.subscriptionLicenseFileError}
              labelClassName="max-w-[9rem]"
            />
          </div>

          <div className="col-span-4 flex flex-col">
            <span className="ml-4 mb-2 whitespace-pre">برگه رجیستری* :</span>
            <Upload
              onChange={(file: any) => onChangeFile(file, 'registrySheetFile')}
              value={registrySheetFile?.fileName}
              href={registrySheetFile?.link}
              name="registrySheetFile"
              onDelete={() => setState({ registrySheetFile: null })}
              error={state?.registrySheetFileError}
              labelClassName="max-w-[9rem]"
            />
          </div>
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

export default withAlert(Fund);
