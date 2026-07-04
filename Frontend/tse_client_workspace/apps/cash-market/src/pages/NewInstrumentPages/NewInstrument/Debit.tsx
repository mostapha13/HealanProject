import {
  TextField,
  Select,
  Button,
  Upload,
  Icon,
  SearchField,
  NewSelectSearch,
} from '@tse/components/atoms';
import withAlert from '../../../hoc/withAlert';
import { useStates, useEffect, useNavigate } from '@tse/utils';
import { DatePicker } from '@tse/components/molecules';
import { generateRandomNumber, getQueryParams } from '@tse/tools';
import { Table } from '@tse/components/organism';
import {
  getInstrumentList,
  uploadFile,
  saveDebitBond,
  getDebitBondDetail,
  getInstrumentDebitGroup,
  getInstrumentDebitInterestPaymentType,
  getIndustryListData,
  geBrokerList,
  getFundListDebit,
  getSubIndustryListData,
  getDebtBondTypeListData,
  getInstrumentDebitSettlementTimeType,
  getInstrumentDebitUnderwritingMethodType,
  getMarketMakerMethodTypeList,
  getBrokerList,
  getPublisherList,
  getSponserList,
  getGuarantorList,
  getTrustedList,
  getAuditorListDebit,
} from '../../../Controller';
import { Popconfirm } from 'antd';
import NewSelect from '../../../components/atoms/NewSelect';
import { AutoCompleteInput } from 'apps/cash-market/src/components/AutoCompleteInput';

const initialState = {
  instrumentName: '',
  dailyFluctuationRange: '5',
  minimumDailyTradingCommitment: '',
  quoteRange: '1',
  minimumCumulativeOrder: '',
  minimumOrderSize: '1',
  maximumOrderSize: '100000',
  multipleOrderSize: '1',
  legalMaximumPurchase: 'بدون محدودیت',
  realMaximumPurchase: 'بدون محدودیت',
  debitBondCumulativeDailyProfitFile: null,
  debitBondInterestPaymentFile: null,
  debitBondOtherFile: null,
  debitGroups: [],
  interestPayments: [],
  sections: [],
  settlementTimes: [],
  underwritingMethods: [],
  brokerList: [],
  underwritingBroker: null,
  marketMakerBroker: null,
  description: '',
  instrumentDebitSection: null,
  instrumentDebitGroup: null,
  debitBondDescription: '',
  debitBondSubject: '',
  debitBondCost: '1000000',
  debitBondPrice: '',
  instrumentDebitInterestPaymentType: null,
  debitBondTotalAmount: '',
  debitBondTotalCount: '',
  debitBondAcceptedCount: '',
  debitBondPublishDate: '',
  debitBondDueDate: '',
  startSecondaryDealingDate: null,
  underwritingTimePeriod: '',
  instrumentDebitSettlementTimeType: null,
  instrumentDebitUnderwritingMethodType: '',
  underwritingStartDate: null,
  underwritingEndDate: null,
  instrumentDebitObligers: [],
  publisher: '',
  sponsor: '',
  guarantor: '',
  trusted: '',
  auditor: '',
  interestPaymentAgent: 'شرکت سپرده‌گذاری مرکزی اوراق بهادار و تسویه وجوه',
  marketMakerUser: null,
  instrumentDebitMethodType: '',
  minimumPriceChange: '1',
  allocatedMinimumNumber: '',
  obliger: '',
  obligationAmount: '',
  editItemId: null,
  marketMakerList: [],
  subIndustry: null,
  subIndustryId: null,
  debtBondTypeList: [],
  debtBondTypeId: null,
  underwritingMethodList: [],
  publisherList: [],
  sponserList: [],
  guarantorList: [],
  trustedList: [],
  auditorList: [],
};

function Debit({ onAlert }: any) {
  const navigate = useNavigate();
  const [state, setState] = useStates<any>(initialState);
  const {
    instrumentName,
    dailyFluctuationRange,
    minimumDailyTradingCommitment,
    quoteRange,
    minimumCumulativeOrder,
    minimumOrderSize,
    maximumOrderSize,
    multipleOrderSize,
    legalMaximumPurchase,
    realMaximumPurchase,
    debitBondCumulativeDailyProfitFile,
    debitBondInterestPaymentFile,
    debitBondOtherFile,
    debitGroups,
    interestPayments,
    sections,
    settlementTimes,
    brokerList,
    underwritingBroker,
    marketMakerBroker,
    description,
    instrumentDebitSection,
    instrumentDebitGroup,
    debitBondDescription,
    debitBondSubject,
    debitBondCost,
    debitBondPrice,
    instrumentDebitInterestPaymentType,
    debitBondTotalAmount,
    debitBondTotalCount,
    debitBondAcceptedCount,
    debitBondPublishDate,
    debitBondDueDate,
    startSecondaryDealingDate,
    underwritingTimePeriod,
    instrumentDebitSettlementTimeType,
    instrumentDebitUnderwritingMethodType,
    underwritingStartDate,
    underwritingEndDate,
    instrumentDebitObligers,
    publisher,
    sponsor,
    guarantor,
    trusted,
    auditor,
    interestPaymentAgent,
    marketMakerUser,
    instrumentDebitMethodType,
    minimumPriceChange,
    allocatedMinimumNumber,
    obliger,
    obligationAmount,
    editItemId,
    marketMakerList,
    subIndustry,
    subIndustryId,
    debtBondTypeList,
    debtBondTypeId,
    underwritingMethodList,
    publisherList,
    sponserList,
    guarantorList,
    trustedList,
    auditorList,
  } = state;

  const isCopy = getQueryParams('isCopy', window.location.href) === 'true';
  const id = getQueryParams('id', window.location.href);

  useEffect(() => {
    getSymbolList('', 1);
    // getDebitGroup();
    getDebitInterestPaymentType();
    getIndustryList();
    // getSubIndustryList();
    getBroker('', 1);
    getMarketMakers('', 1);
    getDebtBondTypeList();
    getDebitSettlementTimeType();
    getUnderwritingMethodList();
    getMarketMakerMethodType();
  }, []);

  useEffect(() => {
    if (id) {
      getDebitBondDetail({
        data: { id },
        onSuccess: onSuccessDetail,
        onFail,
      });
    }
  }, [id]);
  useEffect(() => {
    getSubIndustryList();
  }, [instrumentDebitSection]);
  useEffect(() => {
    getPublisher(publisher);
  }, [publisher]);
  useEffect(() => {
    getSponser(sponsor);
  }, [sponsor]);
  useEffect(() => {
    getGuarantor(guarantor);
  }, [guarantor]);
  useEffect(() => {
    getTrusted(trusted);
  }, [trusted]);
  useEffect(() => {
    getAuditor(auditor);
  }, [auditor]);

  // const getDebitGroup = () => {
  //   getInstrumentDebitGroup({
  //     data: {
  //       GroupType: 4,
  //     },
  //     onSuccess: (res: any) =>
  //       setState({
  //         debitGroups: res,
  //         instrumentDebitGroup: res[0]?.instrumentDebitGroupId,
  //       }),
  //     onFail,
  //   });
  // };

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
  //صنعت
  const getIndustryList = () => {
    getIndustryListData({
      // data: {
      //   SectionType: 4,
      // },
      onSuccess: (res: any) => {
        if (id) {
          setState({
            sections: res,
          });
        } else {
          setState({
            sections: res,
            instrumentDebitSection: res[0]?.industryId,
          });
        }
      },
      onFail,
    });
  };
  const getSubIndustryList = () => {
    getSubIndustryListData({
      data: { IndustryId: instrumentDebitSection },
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
  const getDebtBondTypeList = () => {
    getDebtBondTypeListData({
      onSuccess: (res: any) => {
        if (id) {
          setState({
            debtBondTypeList: res,
          });
        } else {
          setState({
            debtBondTypeList: res,
            debtBondTypeId: res[0]?.debtBondTypeId,
          });
        }
      },
      onFail,
    });
  };
  const getUnderwritingMethodList = () => {
    getInstrumentDebitUnderwritingMethodType({
      data: { MarketCategoryId: 4 },
      onSuccess: (res: any) =>
        setState({
          underwritingMethodList: res,
          // instrumentDebitUnderwritingMethodType: res[0]?.underwritingMethodId,
        }),
      onFail,
    });
  };
  //روش بازارگردانی
  const getMarketMakerMethodType = () => {
    getMarketMakerMethodTypeList({
      onSuccess: (res: any) =>
        setState({
          debitGroups: res,
          // instrumentDebitMethodType: res[0]?.marketMakerMethodTypeId,
        }),
      onFail,
    });
  };
  const getPublisher = (text: string) => {
    const data = {
      TextSearch: text,
    };
    getPublisherList({
      data,
      onSuccess: (res: any) =>
        setState({
          publisherList: res,
        }),
      onFail,
    });
  };
  const getSponser = (text: string) => {
    const data = {
      TextSearch: text,
    };
    getSponserList({
      data,
      onSuccess: (res: any) =>
        setState({
          sponserList: res,
        }),
      onFail,
    });
  };
  const getGuarantor = (text: string) => {
    const data = {
      TextSearch: text,
    };
    getGuarantorList({
      data,
      onSuccess: (res: any) =>
        setState({
          guarantorList: res,
        }),
      onFail,
    });
  };
  const getTrusted = (text: string) => {
    const data = {
      TextSearch: text,
    };
    getTrustedList({
      data,
      onSuccess: (res: any) =>
        setState({
          trustedList: res,
        }),
      onFail,
    });
  };
  const getAuditor = (text: string) => {
    const data = {
      TextSearch: text,
    };
    getAuditorListDebit({
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
      debtBondType,
      debitBondSubject,
      debitBondCost,
      debitBondPrice,
      instrumentInterestPaymentType,
      debitBondTotalAmount,
      debitBondTotalCount,
      debitBondAcceptedCount,
      debitBondPublishDate,
      debitBondDueDate,
      startSecondaryDealingDate,
      underwritingTimePeriod,
      instrumentDebitSettlementTimeType,
      underwritingMethod,
      underwritingStartDate,
      underwritingEndDate,
      underwritingBroker,
      instrumentDebitObligers,
      publisher,
      sponsor,
      guarantor,
      trusted,
      auditor,
      interestPaymentAgent,
      fund,
      marketMakerBroker,
      marketMakerMethodType,
      dailyFluctuationRange,
      minimumDailyTradingCommitment,
      quoteRange,
      minimumCumulativeOrder,
      minimumPriceChange,
      minimumOrderSize,
      maximumOrderSize,
      multipleOrderSize,
      allocatedMinimumNumber,
      realMaximumPurchase,
      legalMaximumPurchase,
      debitBondCumulativeDailyProfitFile,
      debitBondInterestPaymentFile,
      debitBondOtherFile,
      instrumentDebitGroup,
      debitBondDescription,
    } = result;

    setState({
      instrumentName,
      description,
      instrumentDebitSection: industry?.industryId,
      subIndustryId: subIndustry?.subIndustryId,
      debtBondTypeId: debtBondType?.debtBondTypeId,
      debitBondSubject,
      debitBondCost,
      debitBondPrice,
      instrumentDebitInterestPaymentType:
        instrumentInterestPaymentType?.instrumentInterestPaymentTypeId,
      debitBondTotalAmount,
      debitBondTotalCount,
      debitBondAcceptedCount,
      debitBondPublishDate,
      debitBondDueDate,
      startSecondaryDealingDate,
      underwritingTimePeriod,
      instrumentDebitSettlementTimeType:
        instrumentDebitSettlementTimeType?.instrumentDebitSettlementTimeTypeId,
      instrumentDebitUnderwritingMethodType:
        underwritingMethod?.underwritingMethodId,
      underwritingStartDate,
      underwritingEndDate,
      underwritingBroker: underwritingBroker,
      instrumentDebitObligers,
      publisher,
      sponsor,
      guarantor,
      trusted,
      auditor,
      interestPaymentAgent,
      marketMakerUser: fund,
      marketMakerBroker: marketMakerBroker,
      instrumentDebitMethodType: marketMakerMethodType?.marketMakerMethodTypeId,
      dailyFluctuationRange:
        dailyFluctuationRange == null ? '' : dailyFluctuationRange,
      minimumDailyTradingCommitment:
        minimumDailyTradingCommitment == null
          ? ''
          : minimumDailyTradingCommitment,
      quoteRange: quoteRange == null ? '' : quoteRange,
      minimumCumulativeOrder:
        minimumCumulativeOrder == null ? '' : minimumCumulativeOrder,
      minimumPriceChange,
      minimumOrderSize,
      maximumOrderSize,
      multipleOrderSize,
      allocatedMinimumNumber,
      realMaximumPurchase,
      legalMaximumPurchase,
      debitBondCumulativeDailyProfitFile,
      debitBondInterestPaymentFile,
      debitBondOtherFile,
      instrumentDebitGroup,
      debitBondDescription,
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
      instrumentName &&
      description &&
      instrumentDebitSection && //صنعت
      subIndustryId &&
      debtBondTypeId &&
      debitBondSubject &&
      debitBondCost &&
      debitBondPrice !== '' &&
      instrumentDebitInterestPaymentType &&
      debitBondTotalAmount &&
      debitBondTotalCount &&
      debitBondAcceptedCount &&
      debitBondPublishDate &&
      debitBondDueDate &&
      underwritingTimePeriod &&
      instrumentDebitSettlementTimeType &&
      // instrumentDebitUnderwritingMethodType &&
      // underwritingStartDate &&
      // underwritingEndDate &&
      // underwritingBroker &&
      publisher &&
      sponsor &&
      guarantor &&
      trusted &&
      auditor &&
      interestPaymentAgent &&
      // marketMakerUser &&
      // marketMakerBroker &&
      // instrumentDebitMethodType &&
      // dailyFluctuationRange &&
      // minimumDailyTradingCommitment &&
      // quoteRange &&
      // minimumCumulativeOrder &&
      minimumPriceChange &&
      minimumOrderSize &&
      maximumOrderSize &&
      multipleOrderSize &&
      // allocatedMinimumNumber &&
      realMaximumPurchase &&
      legalMaximumPurchase
      // debitBondCumulativeDailyProfitFile &&
      // debitBondInterestPaymentFile
    ) {
      const data = {
        ...(!isCopy && id && { instrumentDebitId: id }),
        instrumentName,
        description,
        industry: {
          industryId: Number(instrumentDebitSection),
        },
        subIndustry: { subIndustryId: subIndustryId },
        debtBondType: {
          debtBondTypeId: debtBondTypeId,
        },
        debitBondSubject,
        debitBondCost: Number(debitBondCost),
        debitBondPrice: Number(debitBondPrice),
        instrumentInterestPaymentType: {
          instrumentInterestPaymentTypeId: Number(
            instrumentDebitInterestPaymentType
          ),
        },
        debitBondTotalAmount: Number(debitBondTotalAmount),
        debitBondTotalCount: Number(debitBondTotalCount),
        debitBondAcceptedCount: Number(debitBondAcceptedCount),
        debitBondPublishDate,
        debitBondDueDate,
        startSecondaryDealingDate,
        underwritingTimePeriod,
        instrumentDebitSettlementTimeType: {
          instrumentDebitSettlementTimeTypeId: Number(
            instrumentDebitSettlementTimeType
          ),
        },
        ...(instrumentDebitUnderwritingMethodType != '' &&
        instrumentDebitUnderwritingMethodType != undefined
          ? {
              underwritingMethod: {
                underwritingMethodId: instrumentDebitUnderwritingMethodType,
              },
            }
          : { underwritingMethod: null }),
        underwritingStartDate,
        underwritingEndDate,
        underwritingBroker: underwritingBroker,
        instrumentDebitObligers,
        publisher,
        sponsor,
        guarantor,
        trusted,
        auditor,
        interestPaymentAgent,
        fund: marketMakerUser,
        marketMakerBroker: marketMakerBroker,
        ...(instrumentDebitMethodType != '' &&
        instrumentDebitMethodType != undefined
          ? {
              marketMakerMethodType: {
                marketMakerMethodTypeId: instrumentDebitMethodType,
              },
            }
          : { marketMakerMethodType: null }),

        dailyFluctuationRange:
          dailyFluctuationRange === '' ? null : Number(dailyFluctuationRange),
        quoteRange: quoteRange === '' ? null : Number(quoteRange),
        minimumDailyTradingCommitment:
          minimumDailyTradingCommitment === ''
            ? null
            : Number(minimumDailyTradingCommitment),
        minimumCumulativeOrder:
          minimumCumulativeOrder === '' ? null : Number(minimumCumulativeOrder),
        minimumPriceChange: Number(minimumPriceChange),
        minimumOrderSize: Number(minimumOrderSize),
        maximumOrderSize: Number(maximumOrderSize),
        multipleOrderSize: Number(multipleOrderSize),
        allocatedMinimumNumber: Number(allocatedMinimumNumber),
        realMaximumPurchase: realMaximumPurchase,
        legalMaximumPurchase: legalMaximumPurchase,
        debitBondCumulativeDailyProfitFile: {
          fileId: debitBondCumulativeDailyProfitFile?.fileId,
        },
        debitBondInterestPaymentFile: {
          fileId: debitBondInterestPaymentFile?.fileId,
        },
        debitBondOtherFile: {
          fileId: debitBondOtherFile?.fileId,
        },
        // instrumentDebitGroup: {
        //   instrumentDebitGroupId: Number(instrumentDebitGroup),
        // },
        // debitBondDescription,
      };
      saveDebitBond({ data, onSuccess: onSuccessSave, onFail });
    } else {
      !instrumentName && setErrorMessage('instrumentName');
      // !dailyFluctuationRange && setErrorMessage('dailyFluctuationRange');
      // !minimumDailyTradingCommitment &&
      //   setErrorMessage('minimumDailyTradingCommitment');
      // !quoteRange && setErrorMessage('quoteRange');
      // !minimumCumulativeOrder && setErrorMessage('minimumCumulativeOrder');
      !minimumOrderSize && setErrorMessage('minimumOrderSize');
      !maximumOrderSize && setErrorMessage('maximumOrderSize');
      !multipleOrderSize && setErrorMessage('multipleOrderSize');
      !legalMaximumPurchase && setErrorMessage('legalMaximumPurchase');
      !realMaximumPurchase && setErrorMessage('realMaximumPurchase');
      // !debitBondCumulativeDailyProfitFile &&
      //   setErrorMessage('debitBondCumulativeDailyProfitFile');
      // !debitBondInterestPaymentFile &&
      //   setErrorMessage('debitBondInterestPaymentFile');
      !description && setErrorMessage('description');
      !instrumentDebitSection && setErrorMessage('instrumentDebitSection');
      // !instrumentDebitGroup && setErrorMessage('instrumentDebitGroup');
      !debtBondTypeId && setErrorMessage('debitBondDescription');
      !debitBondSubject && setErrorMessage('debitBondSubject');
      !debitBondCost && setErrorMessage('debitBondCost');
      debitBondPrice === '' && setErrorMessage('debitBondPrice');
      !instrumentDebitInterestPaymentType &&
        setErrorMessage('instrumentDebitInterestPaymentType');
      !debitBondTotalAmount && setErrorMessage('debitBondTotalAmount');
      !debitBondTotalCount && setErrorMessage('debitBondTotalCount');
      !debitBondAcceptedCount && setErrorMessage('debitBondAcceptedCount');
      !debitBondPublishDate && setErrorMessage('debitBondPublishDate');
      !debitBondDueDate && setErrorMessage('debitBondDueDate');
      !underwritingTimePeriod && setErrorMessage('underwritingTimePeriod');
      !instrumentDebitSettlementTimeType &&
        setErrorMessage('instrumentDebitSettlementTimeType');
      // !instrumentDebitUnderwritingMethodType &&
      //   setErrorMessage('instrumentDebitUnderwritingMethodType');
      // !underwritingStartDate && setErrorMessage('underwritingStartDate');
      // !underwritingEndDate && setErrorMessage('underwritingEndDate');
      // !underwritingBroker && setErrorMessage('underwritingBroker');
      !publisher && setErrorMessage('publisher');
      !sponsor && setErrorMessage('sponsor');
      !guarantor && setErrorMessage('guarantor');
      !trusted && setErrorMessage('trusted');
      !auditor && setErrorMessage('auditor');
      !interestPaymentAgent && setErrorMessage('interestPaymentAgent');
      // !marketMakerUser && setErrorMessage('marketMakerUser');
      // !marketMakerBroker && setErrorMessage('marketMakerBroker');
      // !instrumentDebitMethodType &&
      //   setErrorMessage('instrumentDebitMethodType');
      !minimumPriceChange && setErrorMessage('minimumPriceChange');
      // !allocatedMinimumNumber && setErrorMessage('allocatedMinimumNumber');
    }
  };
  const setErrorMessage = (key: string) => {
    const errorMessage = ' ';
    setState({ [`${key}Error`]: errorMessage });
  };

  const onSuccessSave: any = () => {
    onAlert({ message: 'عملیات با موفقیت انجام شد', type: 'success' });
    navigate('/instrument/instrument-list?tab=4');
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
  const onSubmitObligation = () => {
    if (obliger && obligationAmount) {
      const index = instrumentDebitObligers.findIndex((object: any) => {
        return object.instrumentDebitObligerId === editItemId;
      });
      if (index !== -1) {
        setState({
          instrumentDebitObligers: [
            ...instrumentDebitObligers.slice(0, index),
            {
              obliger,
              obligationAmount,
              instrumentDebitObligerId: editItemId,
            },
            ...instrumentDebitObligers.slice(index + 1),
          ],
          obliger: '',
          obligationAmount: '',
          editItemId: null,
        });
      } else {
        setState({
          instrumentDebitObligers: [
            ...instrumentDebitObligers,
            {
              obliger,
              obligationAmount,
              instrumentDebitObligerId: generateRandomNumber(),
            },
          ],
          obliger: '',
          obligationAmount: '',
        });
      }
    } else {
      !obliger && setErrorMessage('obliger');
      !obligationAmount && setErrorMessage('obligationAmount');
    }
  };

  const columns = [
    {
      title: 'متعهد/متعهدین پذیره نویسی',
      dataIndex: 'obliger',
      className: 'col-span-5',
    },
    {
      title: 'حجم تعهد',
      dataIndex: 'obligationAmount',
      className: 'col-span-3',
    },
    {
      title: 'عملیات',
      dataIndex: 'action',
      key: 'action',
      className: 'col-span-3',
      render: (_: any, item: any) => (
        <div className="flex flex-row items-center justify-center">
          <Icon
            name="icon-edit"
            classname="text-green text-lg cursor-pointer"
            onClick={() => onEdit(item)}
          />
          <Popconfirm
            title="آیا مطمِن هستید؟"
            okText="بله"
            cancelText="خیر"
            onConfirm={() => onRemove(item)}
          >
            <Icon
              name="icon-delete"
              classname="text-red text-lg cursor-pointer"
            />
          </Popconfirm>
        </div>
      ),
    },
  ];

  const onEdit = (item: any) => {
    setState({
      editItemId: item.instrumentDebitObligerId,
      obliger: item.obliger,
      obligationAmount: item.obligationAmount,
    });
  };

  const onRemove = (record: any) => {
    const newList = instrumentDebitObligers.filter(
      (item: any) =>
        item.instrumentDebitObligerId !== record.instrumentDebitObligerId
    );
    setState({
      instrumentDebitObligers: newList,
    });
  };

  const onSearchMarketMaker = (value: string) => {
    getMarketMakers(value, 1);
  };

  return (
    <div>
      <div className="w-full py-2">
        <span className="font-bold text-blue">مشخصات اوراق</span>
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
            maxLength={8}
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
              options={sections}
              onChange={(value: any, record: any) => {
                setState({
                  instrumentDebitSection: value,
                });
              }}
              showKey="industryName"
              selectedKey="industryId"
              value={instrumentDebitSection}
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
              label="نوع اوراق بدهی"
              className="col-span-3"
              options={debtBondTypeList}
              onChange={(value: any) =>
                setState({
                  debtBondTypeId: value,
                })
              }
              required
              errorMessage={state?.debitBondDescriptionError}
              showKey="debtBondTypeName"
              selectedKey="debtBondTypeId"
              value={debtBondTypeId}
            />
          </div>
          <TextField
            label="موضوع انتشار اوراق"
            className="col-span-3"
            value={debitBondSubject}
            onChange={(value: any) =>
              setState({
                debitBondSubject: value,
                debitBondSubjectError: '',
              })
            }
            required
            errorMessage={state?.debitBondSubjectError}
          />

          <TextField
            label="ارزش اسمی هر ورقه"
            className="col-span-3"
            value={debitBondCost}
            onChange={(value: any) =>
              setState({
                debitBondCost: value,
                debitBondCostError: '',
              })
            }
            required
            errorMessage={state?.debitBondCostError}
            type="numeric"
          />

          <TextField
            label="نرخ اوراق"
            className="col-span-3"
            value={debitBondPrice}
            onChange={(value: any) =>
              setState({
                debitBondPrice: value,
                debitBondPriceError: '',
              })
            }
            required
            errorMessage={state?.debitBondPriceError}
            type="number"
          />
          <div className="col-span-3">
            <NewSelect
              label="مواعد پرداخت سود*"
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
          <TextField
            label="مبلغ کل اوراق منتشره(میلیون ریال)"
            className="col-span-3"
            value={debitBondTotalAmount}
            onChange={(value: any) =>
              setState({
                debitBondTotalAmount: value,
                debitBondTotalAmountError: '',
              })
            }
            required
            errorMessage={state?.debitBondTotalAmountError}
            prefix="3 Digit"
            type="numeric"
          />
          <TextField
            label="تعداد کل اوراق منتشره"
            className="col-span-3"
            value={debitBondTotalCount}
            onChange={(value: any) =>
              setState({
                debitBondTotalCount: value,
                debitBondTotalCountError: '',
              })
            }
            required
            errorMessage={state?.debitBondTotalCountError}
            prefix="3 Digit"
            type="numeric"
          />

          <TextField
            label="تعداد اوراق پذیرفته شده و قابل عرضه"
            className="col-span-3"
            value={debitBondAcceptedCount}
            onChange={(value: any) =>
              setState({
                debitBondAcceptedCount: value,
                debitBondAcceptedCountError: '',
              })
            }
            required
            errorMessage={state?.debitBondAcceptedCountError}
            prefix="3 Digit"
            type="numeric"
          />

          <div className="col-span-3" style={{ zIndex: 30 }}>
            <DatePicker
              label="تاریخ انتشار اوراق"
              value={debitBondPublishDate}
              onChange={(value: any) =>
                setState({
                  debitBondPublishDate: value,
                  debitBondPublishDateError: '',
                })
              }
              required
              error={state?.debitBondPublishDateError}
            />
          </div>
          <TextField
            label="مدت اوراق"
            className="col-span-3"
            value={underwritingTimePeriod}
            onChange={(value: any) =>
              setState({
                underwritingTimePeriod: value,
                underwritingTimePeriodError: '',
              })
            }
            required
            errorMessage={state?.underwritingTimePeriodError}
            prefix="Text"
          />
          <div className="col-span-3">
            <NewSelect
              label="زمان تسویه*"
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
          <div className="col-span-3 !z-10" style={{ zIndex: 20 }}>
            <DatePicker
              label="تاریخ سررسید اوراق"
              value={debitBondDueDate}
              onChange={(value: any) =>
                setState({
                  debitBondDueDate: value,
                  debitBondDueDateError: '',
                })
              }
              required
              error={state?.debitBondDueDateError}
            />
          </div>
          <div className="col-span-3 !z-10" style={{ zIndex: 20 }}>
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
          <div className="col-span-3 z-10" style={{ zIndex: 20 }}>
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
          <div className="col-span-3 flex-col flex">
            <NewSelectSearch
              className="col-span-3"
              label="کارگزار عامل پذیره نویسی"
              onChange={(value: any) => {
                if (value?.brokerName != undefined) {
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

          <div className="border-t border-dashed border-t-gray col-span-12 pt-4 grid grid-cols-12 gap-4">
            <TextField
              label="متعهد/متعهدین پذیره نویسی"
              className="col-span-6"
              value={obliger}
              onChange={(value: any) =>
                setState({
                  obliger: value,
                  obligerError: '',
                })
              }
              required
              errorMessage={state?.obligerError}
            />
            <TextField
              label="حجم تعهد"
              className="col-span-3"
              value={obligationAmount}
              onChange={(value: any) =>
                setState({
                  obligationAmount: value,
                  obligationAmountError: '',
                })
              }
              required
              errorMessage={state?.obligationAmountError}
            />
            <div className="col-span-3 flex items-center justify-end">
              <Button
                className="border bg-blue text-white w-[110px]"
                onClick={onSubmitObligation}
              >
                ثبت
              </Button>
            </div>
          </div>
          <div className="col-span-12">
            <Table
              columns={columns}
              className="col-span-12 grid grid-cols-12"
              dataSource={instrumentDebitObligers}
              pageSize={1000}
            />
          </div>
        </div>
      </div>

      <div className="w-full py-2">
        <span className="font-bold text-blue">مشخصات ارکان</span>
        <div className="grid grid-cols-12 gap-4 p-4">
          <AutoCompleteInput
            label="ناشر *"
            options={publisherList}
            value={publisher}
            onSelect={(item: string) =>
              setState({ publisher: item, publisherError: '' })
            }
            className="!col-span-3"
            onChange={(item: any) =>
              setState({
                publisher: item?.target?.value,
                publisherError: '',
              })
            }
            required
            errorMessage={state?.publisherError}
          />
          <AutoCompleteInput
            label="بانی *"
            options={sponserList}
            value={sponsor}
            onSelect={(item: string) =>
              setState({ sponsor: item, sponsorError: '' })
            }
            className="!col-span-3"
            onChange={(item: any) =>
              setState({
                sponsor: item?.target?.value,
                sponsorError: '',
              })
            }
            required
            errorMessage={state?.sponsorError}
          />
          {/* <TextField
            label="بانی"
            className="col-span-3"
            value={sponsor}
            onChange={(value: any) =>
              setState({
                sponsor: value,
                sponsorError: '',
              })
            }
            required
            errorMessage={state?.sponsorError}
          /> */}
          <AutoCompleteInput
            label="ضامن/ضمانت *"
            options={guarantorList}
            value={guarantor}
            onSelect={(item: string) =>
              setState({ guarantor: item, guarantorError: '' })
            }
            className="!col-span-3"
            onChange={(item: any) =>
              setState({
                guarantor: item?.target?.value,
                guarantorError: '',
              })
            }
            required
            errorMessage={state?.guarantorError}
          />
          {/* <TextField
            label="ضامن/ضمانت"
            className="col-span-3"
            value={guarantor}
            onChange={(value: any) =>
              setState({
                guarantor: value,
                guarantorError: '',
              })
            }
            required
            errorMessage={state?.guarantorError}
          /> */}
          <AutoCompleteInput
            label="امین *"
            options={trustedList}
            value={trusted}
            onSelect={(item: string) =>
              setState({ trusted: item, trustedError: '' })
            }
            className="!col-span-3"
            onChange={(item: any) =>
              setState({
                trusted: item?.target?.value,
                trustedError: '',
              })
            }
            required
            errorMessage={state?.trustedError}
          />
          {/* <TextField
            label="امین"
            className="col-span-3"
            value={trusted}
            onChange={(value: any) =>
              setState({
                trusted: value,
                trustedError: '',
              })
            }
            required
            errorMessage={state?.trustedError}
          /> */}
          <AutoCompleteInput
            label="حسابرس *"
            options={auditorList}
            value={auditor}
            onSelect={(item: string) =>
              setState({ auditor: item, auditorError: '' })
            }
            className="!col-span-3"
            onChange={(item: any) =>
              setState({
                auditor: item?.target?.value,
                auditorError: '',
              })
            }
            required
            errorMessage={state?.auditorError}
          />
          {/* <TextField
            label="حسابرس"
            className="col-span-3"
            value={auditor}
            onChange={(value: any) =>
              setState({
                auditor: value,
                auditorError: '',
              })
            }
            required
            errorMessage={state?.auditorError}
          /> */}
          <TextField
            label="عامل پرداخت سود"
            className="col-span-6"
            value={interestPaymentAgent}
            onChange={(value: any) =>
              setState({
                interestPaymentAgent: value,
                interestPaymentAgentError: '',
              })
            }
            required
            errorMessage={state?.interestPaymentAgentError}
          />
        </div>
      </div>

      <div className="w-full py-2">
        <span className="font-bold text-blue">بازارگردانی</span>
        <div className="grid grid-cols-12 gap-4 p-4">
          <NewSelectSearch
            className="col-span-3"
            label="بازارگردان"
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
          <div className="flex-col flex col-span-3">
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
          <div className="col-span-3">
            <NewSelect
              label="روش بازارگردانی"
              className="col-span-3"
              options={[
                { marketMakerMethodTypeName: '', marketMakerMethodTypeId: '' },
                ...debitGroups,
              ]}
              onChange={(value: any) =>
                setState({
                  instrumentDebitMethodType: value,
                })
              }
              // required
              // errorMessage={state?.instrumentDebitMethodTypeError}
              showKey="marketMakerMethodTypeName"
              selectedKey="marketMakerMethodTypeId"
              value={instrumentDebitMethodType}
            />
          </div>

          <TextField
            label="دامنه نوسان روزانه"
            className="col-span-3"
            value={dailyFluctuationRange}
            onChange={(value: any) =>
              setState({
                dailyFluctuationRange: value,
                dailyFluctuationRangeError: '',
              })
            }
            // required
            // errorMessage={state?.dailyFluctuationRangeError}
            type="number"
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
            type="numeric"
          />

          <TextField
            label="حداقل تعهدات روزانه"
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
            type="numeric"
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
            type="numeric"
          />
        </div>
      </div>

      <div className="w-full py-2">
        <span className="font-bold text-blue">محدودیت های معاملاتی</span>
        <div className="grid grid-cols-12 gap-4 p-4">
          <TextField
            label="حداقل تغییر قیمت"
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
          />
          <TextField
            label="مضرب هر سفارش"
            className="col-span-3"
            value={multipleOrderSize}
            onChange={(value: any) =>
              setState({
                multipleOrderSize: value,
                multipleOrderSizeError: '',
              })
            }
            required
            errorMessage={state?.multipleOrderSizeError}
            type="numeric"
          />
          <TextField
            label="حداقل تعداد قابل تخصیص"
            className="col-span-3"
            value={allocatedMinimumNumber}
            onChange={(value: any) =>
              setState({
                allocatedMinimumNumber: value,
                allocatedMinimumNumberError: '',
              })
            }
            // required
            // errorMessage={state?.allocatedMinimumNumberError}
            type="numeric"
          />
          <TextField
            label="حداکثر خرید هر شخص حقیقی"
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
            // type="numeric"
          />
          <TextField
            label="حداکثر خرید هر شخص حقوقی"
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
            // type="numeric"
          />
        </div>
      </div>
      <div className="w-full py-2">
        <span className="font-bold text-blue">فایل‌ها</span>
        <div className="grid grid-cols-12 gap-4 p-4">
          <div className="col-span-4 flex flex-col">
            <span className="ml-4 mb-2 whitespace-pre">جدول سود روزشمار :</span>
            <Upload
              onChange={(file: any) =>
                onChangeFile(file, 'debitBondCumulativeDailyProfitFile')
              }
              value={debitBondCumulativeDailyProfitFile?.fileName}
              href={debitBondCumulativeDailyProfitFile?.link}
              name="debitBondCumulativeDailyProfitFile"
              onDelete={() =>
                setState({ debitBondCumulativeDailyProfitFile: null })
              }
              // error={state?.debitBondCumulativeDailyProfitFileError}
              labelClassName="max-w-[9rem]"
            />
          </div>

          <div className="col-span-4 flex flex-col">
            <span className="ml-4 mb-2 whitespace-pre">
              جدول موعد پرداخت سود :
            </span>
            <Upload
              onChange={(file: any) =>
                onChangeFile(file, 'debitBondInterestPaymentFile')
              }
              value={debitBondInterestPaymentFile?.fileName}
              href={debitBondInterestPaymentFile?.link}
              name="debitBondInterestPaymentFile"
              onDelete={() => setState({ debitBondInterestPaymentFile: null })}
              // error={state?.debitBondInterestPaymentFileError}
              labelClassName="max-w-[9rem]"
            />
          </div>
          <div className="col-span-4 flex flex-col">
            <span className="ml-4 mb-2 whitespace-pre">سایر مدارک :</span>
            <Upload
              onChange={(file: any) => onChangeFile(file, 'debitBondOtherFile')}
              value={debitBondOtherFile?.fileName}
              href={debitBondOtherFile?.link}
              name="debitBondOtherFile"
              onDelete={() => setState({ debitBondOtherFile: null })}
              // error={state?.debitBondOtherFileError}
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

export default withAlert(Debit);
