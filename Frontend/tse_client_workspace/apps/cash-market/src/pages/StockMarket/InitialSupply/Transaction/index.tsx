import withAlert from 'apps/cash-market/src/hoc/withAlert';
import {
  useStates,
  useEffect,
  useState,
  useNavigate,
  useSearchParams,
} from '@tse/utils';
import {
  convertDateAndTimeToJalali,
  convertDateToJalali,
  deSeparator,
  getQueryParams,
  loadFromStorage,
  saveToStorage,
  separator,
} from '@tse/tools';
import Select from 'libs/components/atoms/src/lib/Select/Select';
import { SymbolModal, Table } from '@tse/components/organism';
import { TextField } from 'libs/components/atoms/src/lib/TextField';
import { uploadFile } from 'apps/cash-market/src/Controller/Upload';
import { DatePicker } from '@tse/components/molecules';
import { Modal, Popconfirm, Radio } from 'antd';
import {
  Button,
  Icon,
  Upload,
  Image,
  CheckList,
  Collapse,
  SearchField,
  NewSelectSearch,
} from '@tse/components/atoms';
import testImg from 'apps/cash-market/src/assets/images/tse.png';
import { CheckSquareFilled } from '@ant-design/icons';
import {
  getInstrumentList,
  geBrokerList,
  getPersonType,
  getBlockAttachType,
  getFundList,
  getInitialSupplyAttachType,
  getInitialSupplyType,
  saveInitialSupplyData,
  getInitialSupplyByOrderId,
  closeFormStock,
} from '../../../../Controller';
import ImageUpload from 'apps/cash-market/src/components/ImageUpload';
import NewSelect from 'apps/cash-market/src/components/atoms/NewSelect';
import { HeaderTypes } from '@tse/types';
import { Modal as ConfirmModal } from '@tse/components/atoms';

const haveOptionRadio = [
  {
    id: false,
    title: 'ندارد',
  },
  {
    id: true,
    title: 'دارد',
  },
];

const initialState = {
  id: '',
  fileDescription: '',
  fileDescriptionError: '',
  uploadFileError: false,
  uploadFileName: '',
  uploadFileLink: '',
  uploadFileId: '',
  uploadFileType: '',
  selectedInstrument: null,
  selectedInstrumentError: '',
  symbolList: [],
  companyName: '',
  companyNameError: '',
  investment: '',
  TradeVolume: '',
  TradeVolumeError: '',
  TradePercent: '',
  TradePercentError: '',
  InitialDate: '',
  InitialDateError: '',
  initialSupplyType: [],
  selectedInitialSupplyType: '',
  selectedInitialSupplyTypeError: false,
  selectedInitialSupplyTypeValue: '',
  InitialOfficer: {
    brokerCode: '',
    brokerId: '',
    brokerName: '',
  },
  InitialOfficerError: '',
  OscillationRange: '',
  OscillationRangeError: '',
  LowPrice: '',
  LowPriceError: '',
  HighPrice: '',
  HighPriceError: '',
  fixPrice: '',
  fixPriceError: '',
  BasePrice: '',
  BasePriceError: '',
  HasSubsidiary: false,
  HasEmployeesShare: false,
  EmployeesShare: '',
  selectedBrokerData: {
    brokerCode: '',
    brokerId: '',
    brokerName: '',
  },
  selectedBrokerDataError: '',
  selectedBrokerCode: '',
  selectedBrokerCodeError: '',
  brokerTraderCode: '',
  brokerTraderCodeError: '',
  initialSupplyBrokers: [],
  firstTableEditItemId: null,
  brokerList: null,
  fundList: null,
  selectedFundData: {
    fundId: '',
    fundName: '',
  },
  selectedFundDataError: '',
  selectedBrokerFund: {
    brokerCode: '',
    brokerId: '',
    brokerName: '',
  },
  selectedBrokerFundError: '',
  publicAttachExpanded: true,
  sellerAttachExpanded: true,
  marketMakerNumberOfShare: '',
  marketMakerNumberOfShareError: '',
  initialSupplyMarketMakers: [],
  secondTableEditItemId: null,
  selectedSellersPersonalityType: '',
  selectedSellersPersonalityTypeError: false,
  selectedSellersPersonalityTypeValue: '',
  sellersName: '',
  disableSellersFirstName: false,
  sellersNameError: '',
  sellersFamily: '',
  sellersFamilyError: '',
  selectedSellersAgentError: '',
  selectedSellersAgent: {
    brokerCode: '',
    brokerId: '',
    brokerName: '',
  },
  selectedSellersAgentName: '',
  sellersExchangeCode: '',
  sellersExchangeCodeError: '',
  sellersTradeCount: '',
  sellersTradeCountError: '',
  sellersTradePercent: '',
  sellersTradePercentError: '',
  sellersBasicData: [],
  thirdTableEditItemId: null,
  selectedBuyersPersonalityType: '',
  selectedBuyersPersonalityTypeError: false,
  selectedBuyersPersonalityTypeValue: '',
  buyersName: '',
  disableBuyerFirstName: false,
  buyersNameError: '',
  buyerFamilyName: '',
  buyerFamilyNameError: '',
  selectedBuyersAgent: {
    brokerCode: '',
    brokerId: '',
    brokerName: '',
  },
  buyersAgentCode: '',
  buyersAgentCodeError: '',
  buyersExchangeCode: '',
  buyersExchangeCodeError: '',
  buyersTradeCount: '',
  buyersTradeCountError: '',
  buyersTradePercent: '',
  buyersTradePercentError: '',
  buyerBasicData: [],
  fourthTableEditItemId: null,
  buyAndSellBasicData: [],
  connectorFamily: '',
  connectorFamilyError: '',
  connectorPosition: '',
  connectorPositionError: '',
  connectorPhoneNumber: '',
  connectorPhoneNumberError: '',
  imageMouseEnter: false,
  selectedInstrumentSymbol: '',
  selectedInstrumentCompany: '',
  selectedDocumentType: '',
  selectedDocumentTypeName: '',
  selectedBuyersAgentError: '',
  selectedDocumentTypeIsMultiple: false,
  allAttachTypeData: [],
  requireAttachDataList: [],
  requireAttachDataListOthers: [],
  personalityType: [],
  uploadFileValidate: false,
  requireFileUploadComplete: false,
  uploadFileValidateOthers: false,
  requireFileUploadCompleteOthers: false,
  fileSelectBuyAndSell: [],
  selectedFileSellOrBuy: '',
  selectedFileSellOrBuyError: '',
  selectedFileSellOrBuyValue: '',
  isTrackingModalVisible: false,
  trackingNumber: 0,
  initialSupplyCommittedsState: [],
  isModalCloseFormVisible: false,
  messages: [],
};
function InitialSupplyTransaction({ onAlert }: any) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useStates<any>(initialState);
  const {
    id,
    fileDescription,
    uploadFileError,
    uploadFileName,
    uploadFileLink,
    uploadFileId,
    uploadFileType,
    selectedInstrument,
    symbolList,
    companyName,
    investment,
    TradeVolume,
    TradePercent,
    InitialDate,
    initialSupplyType,
    selectedInitialSupplyType,
    selectedInitialSupplyTypeValue,
    InitialOfficer,
    OscillationRange,
    LowPrice,
    HighPrice,
    HighPriceError,
    BasePrice,
    fixPrice,
    HasSubsidiary,
    HasEmployeesShare,
    EmployeesShare,
    selectedBrokerData,
    selectedBrokerDataError,
    selectedBrokerCode,
    brokerTraderCode,
    initialSupplyBrokers,
    firstTableEditItemId,
    brokerList,
    fundList,
    selectedFundData,
    selectedBrokerFund,
    marketMakerNumberOfShare,
    initialSupplyMarketMakers,
    secondTableEditItemId,
    selectedSellersPersonalityTypeValue,
    selectedSellersPersonalityType,
    sellersName,
    disableSellersFirstName,
    sellersFamily,
    selectedSellersAgent,
    selectedSellersAgentError,
    selectedSellersAgentName,
    sellersExchangeCode,
    sellersExchangeCodeError,
    sellersTradeCount,
    sellersTradePercent,
    sellersBasicData,
    thirdTableEditItemId,
    selectedBuyersPersonalityType,
    buyersName,
    disableBuyerFirstName,
    buyerFamilyName,
    selectedBuyersAgent,
    buyersAgentCode,
    buyersExchangeCode,
    buyersTradeCount,
    buyersTradePercent,
    buyerBasicData,
    fourthTableEditItemId,
    buyAndSellBasicData,
    connectorFamily,
    connectorPosition,
    connectorPhoneNumber,
    publicAttachExpanded,
    sellerAttachExpanded,
    imageMouseEnter,
    transactionVolume,
    price,
    selectedInstrumentSymbol,
    selectedInstrumentCompany,
    selectedDocumentType,
    selectedDocumentTypeName,
    selectedBuyersAgentError,
    selectedDocumentTypeIsMultiple,
    allAttachTypeData,
    requireAttachDataList,
    requireAttachDataListOthers,
    personalityType,
    uploadFileValidate,
    requireFileUploadComplete,
    uploadFileValidateOthers,
    requireFileUploadCompleteOthers,
    selectedBuyersPersonalityTypeValue,
    fileSelectBuyAndSell,
    selectedFileSellOrBuy,
    selectedFileSellOrBuyValue,
    isTrackingModalVisible,
    trackingNumber,
    initialSupplyCommittedsState,
    brokerTraderCodeError,
    isModalCloseFormVisible,
    messages,
  } = state;
  const [randomNumber, setRandomNumber] = useState(null);
  const [uploadFileListItem, setUploadFileListItem] = useState<any>([]);
  const [uploadFileListItemOthers, setUploadFileListItemOthers] = useState<any>(
    []
  );
  const editMode: any = searchParams.get('editMode');
  const orderId =
    searchParams.get('id') != null ? searchParams.get('id') : null;
  const generateRandomNumber = () => {
    const min = 100000;
    const max = 999999;
    const generatedNumber: any =
      Math.floor(Math.random() * (max - min + 1)) + min;
    return generatedNumber;
  };
  const messageColumns: HeaderTypes[] = [
    {
      title: 'کاربر ',
      dataIndex: 'marketUserName',
      key: 'marketUserName',
      className: 'col-span-2 !justify-start',
    },
    {
      title: 'نوع پیام ',
      dataIndex: 'isPrivate',
      key: 'isPrivate',
      className: 'col-span-2 !justify-start',
      render: (item: any) => <span>{item === true ? 'خصوصی' : 'عمومی'}</span>,
    },
    {
      title: 'تاریخ ',
      dataIndex: 'commentDate',
      key: 'commentDate',
      className: 'col-span-2 !justify-start',
      render: (item: any) => <span>{convertDateAndTimeToJalali(item)}</span>,
    },
    {
      title: 'پیام ',
      dataIndex: 'comment',
      key: 'comment',
      className: 'col-span-5 !justify-start',
    },
  ];
  useEffect(() => {
    getSymbolList('', 1);
    getBroker('', 1);
    getFund('', 1);
    setState({ selectedInstrument: { symbol: '' } });
    handleGetPersonType();
    handleGetInitialSupplyAttachType();
    handleGetInitialSupplyType();
    if (orderId != null) {
      handleGetInitialSupply(orderId);
    }
  }, []);
  function handleGetInitialSupply(orderId: any) {
    getInitialSupplyByOrderId({
      orderId: orderId,
      onSuccess: (item) => {
        if (item?.publicFiles == null) {
          setUploadFileListItem([]);
        } else {
          setUploadFileListItem(item?.publicFiles);
        }
        setState({
          id: item?.id,
          selectedInstrument: {
            instrumentId: item?.instrumentId,
            symbolCode: item?.symbolCode,
            symbol: item?.symbol,
            symbolName: item?.symbolName,
            companyName: item?.companyName,
          },
          companyName: item?.companyName,
          investment: item?.investment,
          TradeVolume: item?.tradeVolume,
          TradePercent: item?.tradePercent,
          InitialDate: item?.initialDate,
          selectedInitialSupplyType: item?.initialSupplyTypeId,
          selectedInitialSupplyTypeValue: item?.initialSupplyTypeName,
          InitialOfficer: {
            brokerId: item?.initialOfficer,
            brokerName: item?.initialOfficerName,
          },
          OscillationRange: item?.oscillationRange,
          LowPrice: item?.lowPrice,
          HighPrice: item?.highPrice,
          BasePrice: item?.basePrice,
          HasSubsidiary: item?.hasSubsidiary,
          HasEmployeesShare: item?.hasEmployeesShare,
          EmployeesShare: item?.employeesShare,
          initialSupplyBrokers: item?.initialSupplyBrokers,
          initialSupplyMarketMakers: item?.initialSupplyMarketMakers,
          initialSupplyCommittedsState: item?.initialSupplyCommitteds,
          connectorFamily: item?.responsibleName,
          connectorPosition: item?.responsiblePost,
          connectorPhoneNumber: item?.responsibleMobile,
          messages: item?.message,
        });
      },
      onFail,
    });
  }
  useEffect(() => {
    if (
      parseInt(LowPrice) > parseInt(HighPrice) &&
      LowPrice != '' &&
      HighPrice != ''
    ) {
      setState({ HighPriceError: 'حداکثر قیمت کمتر از حداقل قیمت است' });
    } else if (
      parseInt(LowPrice) <= parseInt(HighPrice) &&
      LowPrice != '' &&
      HighPrice != ''
    ) {
      setState({ HighPriceError: '' });
    }
  }, [LowPrice, HighPrice]);
  useEffect(() => {
    let uploadFileListItemOthers: any = [];
    let buyerBasicData: any = [];
    let sellersBasicData: any = [];

    initialSupplyCommittedsState?.forEach((data: any) => {
      data.initialSupplyFiles?.forEach((file: any) => {
        uploadFileListItemOthers.push(file);
      });
      if (data.committedType === 0) {
        sellersBasicData.push({
          initialSupplyId: data?.initialSupplyId,
          personTypeId: data?.personTypeId,
          personTypeName: data?.personTypeName,
          brokerId: data?.brokerId,
          brokerName: data?.brokerName,
          brokerCode: data?.brokerCode,
          firstName: data?.firstName,
          lastName: data?.lastName,
          sellerCode: data?.sellerCode,
          tradeVolume: data?.tradeVolume,
          tradePercent: data?.tradePercent,
          committedType: data?.committedType,
          tableId: data?.tableId,
        });
      } else if (data?.committedType === 1) {
        buyerBasicData.push({
          initialSupplyId: data?.initialSupplyId,
          personTypeId: data?.personTypeId,
          personTypeName: data?.personTypeName,
          brokerId: data?.brokerId,
          brokerName: data?.brokerName,
          brokerCode: data?.brokerCode,
          firstName: data?.firstName,
          lastName: data?.lastName,
          sellerCode: data?.sellerCode,
          tradeVolume: data?.tradeVolume,
          tradePercent: data?.tradePercent,
          committedType: data?.committedType,
          tableId: data?.tableId,
        });
      }
    });
    setUploadFileListItemOthers(uploadFileListItemOthers);
    setState({
      buyerBasicData: buyerBasicData,
      sellersBasicData: sellersBasicData,
    });
  }, [initialSupplyCommittedsState]);
  useEffect(() => {
    checkRequiredData();
  }, [uploadFileListItem, requireAttachDataList]);
  useEffect(() => {
    checkRequiredDataOthers();
  }, [buyAndSellBasicData, uploadFileListItemOthers]);

  useEffect(() => {
    const combinedArray = buyerBasicData.concat(sellersBasicData);
    setState({ buyAndSellBasicData: combinedArray });
    // if (buyerBasicData?.length > 0 || sellersBasicData?.length > 0) {
    //   checkRequiredDataOthers();
    // }
  }, [buyerBasicData, sellersBasicData]);
  useEffect(() => {
    const newArray = buyAndSellBasicData?.map((item: any) => {
      return {
        committedType: item.committedType,
        tableId: item.tableId,
        id: item.tableId,
        name:
          item.committedType == 0
            ? `عرضه ${item.tableId}`
            : `خرید ${item.tableId}`,
      };
    });
    setState({ fileSelectBuyAndSell: newArray });
  }, [buyAndSellBasicData]);

  useEffect(() => {
    ////////////////////////حقیقی
    if (
      selectedBuyersPersonalityType === '25a0a62a-6a39-44b3-a8f6-cde56eb50f0a'
    ) {
      if (!buyersExchangeCode?.startsWith('9')) {
        setState({
          buyersExchangeCodeError: 'کد بورسی شخص حقیقی با 9 شروع می شود',
        });
      } else if (buyersExchangeCode?.length !== 11) {
        setState({
          buyersExchangeCodeError: 'تعداد ارقام باید 11 عدد باشد',
        });
      } else {
        setState({
          buyersExchangeCodeError: '',
        });
      }
      ////////////////////////حقوقی
    } else if (
      selectedBuyersPersonalityType === 'cafd25d9-4948-4b97-b3ec-9761e4496e01'
    ) {
      if (!buyersExchangeCode?.startsWith('8')) {
        setState({
          buyersExchangeCodeError: 'کد بورسی شخص حقوقی با 8 شروع می شود',
        });
      } else if (buyersExchangeCode?.length !== 8) {
        setState({
          buyersExchangeCodeError: 'تعداد ارقام باید 8 عدد باشد',
        });
      } else {
        setState({
          buyersExchangeCodeError: '',
        });
      }
      /////////////////صندوق
    } else if (
      selectedBuyersPersonalityType === '5882faca-e9d3-4329-b19c-c92eec610c62'
    ) {
      if (!buyersExchangeCode?.startsWith('6')) {
        setState({
          buyersExchangeCodeError: 'کد بورسی سبد با 6 شروع می شود',
        });
      } else if (buyersExchangeCode?.length !== 7) {
        setState({
          buyersExchangeCodeError: 'تعداد ارقام باید 7 عدد باشد',
        });
      } else {
        setState({
          buyersExchangeCodeError: '',
        });
      }
    }
  }, [selectedBuyersPersonalityType, buyersExchangeCode]);
  useEffect(() => {
    ////////////////////////حقیقی
    if (
      selectedBuyersPersonalityType === '25a0a62a-6a39-44b3-a8f6-cde56eb50f0a'
    ) {
      setState({ disableBuyerFirstName: false });
      ////////////////////////حقوقی
    } else if (
      selectedBuyersPersonalityType === 'cafd25d9-4948-4b97-b3ec-9761e4496e01'
    ) {
      setState({ disableBuyerFirstName: true });
      /////////////////صندوق
    } else if (
      selectedBuyersPersonalityType === '5882faca-e9d3-4329-b19c-c92eec610c62'
    ) {
      setState({ disableBuyerFirstName: true });
    }
  }, [selectedBuyersPersonalityType]);
  //////////////////////////////////////////////////////////////////
  useEffect(() => {
    ////////////////////////حقیقی
    if (
      selectedSellersPersonalityType === '25a0a62a-6a39-44b3-a8f6-cde56eb50f0a'
    ) {
      if (!sellersExchangeCode?.startsWith('9')) {
        setState({
          sellersExchangeCodeError: 'کد بورسی شخص حقیقی با 9 شروع می شود',
        });
      } else if (sellersExchangeCode?.length !== 11) {
        setState({
          sellersExchangeCodeError: 'تعداد ارقام باید 11 عدد باشد',
        });
      } else {
        setState({
          sellersExchangeCodeError: '',
        });
      }
      ////////////////////////حقوقی
    } else if (
      selectedSellersPersonalityType === 'cafd25d9-4948-4b97-b3ec-9761e4496e01'
    ) {
      if (!sellersExchangeCode?.startsWith('8')) {
        setState({
          sellersExchangeCodeError: 'کد بورسی شخص حقوقی با 8 شروع می شود',
        });
      } else if (sellersExchangeCode?.length !== 8) {
        setState({
          sellersExchangeCodeError: 'تعداد ارقام باید 8 عدد باشد',
        });
      } else {
        setState({
          sellersExchangeCodeError: '',
        });
      }
      /////////////////صندوق
    } else if (
      selectedSellersPersonalityType === '5882faca-e9d3-4329-b19c-c92eec610c62'
    ) {
      if (!sellersExchangeCode?.startsWith('6')) {
        setState({
          sellersExchangeCodeError: 'کد بورسی سبد با 6 شروع می شود',
        });
      } else if (sellersExchangeCode?.length !== 7) {
        setState({
          sellersExchangeCodeError: 'تعداد ارقام باید 7 عدد باشد',
        });
      } else {
        setState({
          sellersExchangeCodeError: '',
        });
      }
    }
  }, [selectedSellersPersonalityType, sellersExchangeCode]);
  useEffect(() => {
    ////////////////////////حقیقی
    if (
      selectedSellersPersonalityType === '25a0a62a-6a39-44b3-a8f6-cde56eb50f0a'
    ) {
      setState({ disableSellersFirstName: false });
      ////////////////////////حقوقی
    } else if (
      selectedSellersPersonalityType === 'cafd25d9-4948-4b97-b3ec-9761e4496e01'
    ) {
      setState({ disableSellersFirstName: true });

      /////////////////صندوق
    } else if (
      selectedSellersPersonalityType === '5882faca-e9d3-4329-b19c-c92eec610c62'
    ) {
      setState({ disableSellersFirstName: true });
    }
  }, [selectedSellersPersonalityType, sellersExchangeCode]);

  ////////////////////////////SellerBrokerCondition////////////////////////////////////
  useEffect(() => {
    if (selectedBrokerData?.brokerCode != undefined) {
      setState({ brokerTraderCode: selectedBrokerData?.brokerCode });
    }
  }, [selectedBrokerData]);
  useEffect(() => {
    if (selectedBrokerData?.brokerCode != undefined) {
      if (!brokerTraderCode?.startsWith(selectedBrokerData?.brokerCode)) {
        setState({
          brokerTraderCodeError: `کد معامله گر باید با ${selectedBrokerData?.brokerCode} آغاز شود`,
        });
      }
    }
  }, [brokerTraderCode, selectedBrokerData]);

  const brokerColumns: HeaderTypes[] = [
    {
      title: 'نام کارگزار عرضه کننده',
      dataIndex: 'brokerName',
      className: 'col-span-4 !justify-start',
      key: 'brokerName',
    },
    {
      title: 'کد کارگزار عرضه کننده',
      dataIndex: 'brokerCode',
      className: 'col-span-3 !justify-start',
      key: 'brokerCode',
    },
    {
      title: 'کد معامله گر کارگزار عرضه کننده',
      dataIndex: 'traderCode',
      className: 'col-span-3 !justify-start',
      key: 'traderCode',
    },
    {
      title: 'عملیات',
      dataIndex: 'action',
      key: 'action',
      className: 'col-span-1 !justify-start',
      render: (_: any, item: any) => (
        <div className="flex flex-row items-center justify-center">
          <Icon
            name="icon-edit"
            classname="text-green text-lg cursor-pointer"
            onClick={() => onEditFirstTableBroker(item)}
          />
          <Popconfirm
            title="آیا اطمینان دارید؟"
            okText="بله"
            cancelText="خیر"
            onConfirm={() => onRemoveFirstTableBroker(item)}
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
  const onEditFirstTableBroker = (item: any) => {
    setState({
      selectedBrokerData: {
        brokerName: item?.brokerName,
        brokerCode: item?.brokerCode,
        brokerId: item?.brokerId,
      },
      brokerTraderCode: item.traderCode,
      selectedBrokerCode: item?.brokerCode,
      firstTableEditItemId: item?.tableId,
    });
  };
  const onRemoveFirstTableBroker = (record: any) => {
    const newList = initialSupplyBrokers.filter(
      (item: any) => item.tableId !== record.tableId
    );
    setState({
      initialSupplyBrokers: newList,
    });
  };
  const onBrokerInformationClick = () => {
    if (
      selectedBrokerData &&
      selectedBrokerData?.brokerId != '' &&
      brokerTraderCode &&
      brokerTraderCodeError == ''
    ) {
      const index = initialSupplyBrokers.findIndex((object: any) => {
        return object.tableId === firstTableEditItemId;
      });
      if (index !== -1) {
        setState({
          initialSupplyBrokers: [
            ...initialSupplyBrokers.slice(0, index),
            {
              initialSupplyId: orderId != null ? id : null,
              brokerId: selectedBrokerData?.brokerId,
              traderCode: brokerTraderCode,
              brokerCode: selectedBrokerData?.brokerCode,
              brokerName: selectedBrokerData?.brokerName,
              tableId: firstTableEditItemId,
              selectedBrokerData,
            },
            ...initialSupplyBrokers.slice(index + 1),
          ],
          selectedBrokerData: {
            brokerCode: '',
            brokerId: '',
            brokerName: '',
          },
          brokerTraderCode: '',
          selectedBrokerCode: '',
          firstTableEditItemId: null,
        });
      } else {
        setState({
          initialSupplyBrokers: [
            ...initialSupplyBrokers,
            {
              initialSupplyId: orderId != null ? id : null,
              brokerId: selectedBrokerData?.brokerId,
              traderCode: brokerTraderCode,
              brokerCode: selectedBrokerData?.brokerCode,
              brokerName: selectedBrokerData?.brokerName,
              tableId: generateRandomNumber(),
              selectedBrokerData,
            },
          ],
          selectedBrokerData: {
            brokerCode: '',
            brokerId: '',
            brokerName: '',
          },
          brokerTraderCode: '',
          selectedBrokerCode: '',
        });
      }
    } else {
      selectedBrokerData?.brokerName == '' &&
        setErrorMessage('selectedBrokerData');
      !brokerTraderCode && setErrorMessage('brokerTraderCode');
      !selectedBrokerData && setErrorMessage('selectedBrokerData');
    }
  };

  const marketMakerColumns: HeaderTypes[] = [
    {
      title: 'نام بازارگردان',
      dataIndex: 'fundName',
      className: 'col-span-4 !justify-start',
      key: 'fundName',
    },
    {
      title: 'تعداد سهام عرضه به بازارگردان',
      dataIndex: 'tradeVolume',
      className: 'col-span-3 !justify-start',
      key: 'tradeVolume',
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'کارگزار بازارگردان',
      dataIndex: 'brokerName',
      className: 'col-span-3 !justify-start',
      key: 'brokerName',
    },
    {
      title: 'عملیات',
      dataIndex: 'action',
      key: 'action',
      className: 'col-span-1 !justify-start',
      render: (_: any, item: any) => (
        <div className="flex flex-row items-center justify-center">
          <Icon
            name="icon-edit"
            classname="text-green text-lg cursor-pointer"
            onClick={() => onEditSecondTableMarketMaker(item)}
          />
          <Popconfirm
            title="آیا اطمینان دارید؟"
            okText="بله"
            cancelText="خیر"
            onConfirm={() => onRemoveSecondTableMarketMaker(item)}
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
  const onEditSecondTableMarketMaker = (item: any) => {
    setState({
      selectedFundData: {
        fundId: item?.fundId,
        fundName: item?.fundName,
      },
      selectedBrokerFund: {
        brokerName: item?.brokerName,
        brokerCode: item?.brokerCode,
        brokerId: item?.brokerId,
      },
      marketMakerNumberOfShare: item?.tradeVolume,
      secondTableEditItemId: item?.tableId,
    });
  };
  const onRemoveSecondTableMarketMaker = (record: any) => {
    const newList = initialSupplyMarketMakers.filter(
      (item: any) => item.tableId !== record.tableId
    );
    setState({
      initialSupplyMarketMakers: newList,
    });
  };
  const onMarketMakerInformationClick = () => {
    if (
      selectedFundData &&
      selectedFundData?.fundId != '' &&
      selectedBrokerFund?.brokerId != '' &&
      selectedBrokerFund &&
      marketMakerNumberOfShare
    ) {
      const index = initialSupplyMarketMakers.findIndex((object: any) => {
        return object.tableId === secondTableEditItemId;
      });
      if (index !== -1) {
        setState({
          initialSupplyMarketMakers: [
            ...initialSupplyMarketMakers.slice(0, index),
            {
              initialSupplyId: orderId != null ? id : null,
              fundId: selectedFundData?.fundId,
              brokerId: selectedBrokerFund?.brokerId,
              brokerCode: selectedBrokerFund?.brokerCode,
              tradeVolume: marketMakerNumberOfShare,
              brokerName: selectedBrokerFund?.brokerName,
              fundName: selectedFundData?.fundName,
              tableId: secondTableEditItemId,
              selectedFundData,
              selectedBrokerFund,
            },
            ...initialSupplyMarketMakers.slice(index + 1),
          ],
          selectedFundData: {
            fundId: '',
            fundName: '',
          },
          selectedBrokerFund: {
            brokerCode: '',
            brokerId: '',
            brokerName: '',
          },
          marketMakerNumberOfShare: '',
          secondTableEditItemId: null,
        });
      } else {
        setState({
          initialSupplyMarketMakers: [
            ...initialSupplyMarketMakers,
            {
              initialSupplyId: orderId != null ? id : null,
              fundId: selectedFundData?.fundId,
              brokerId: selectedBrokerFund?.brokerId,
              brokerCode: selectedBrokerFund?.brokerCode,
              tradeVolume: marketMakerNumberOfShare,
              brokerName: selectedBrokerFund?.brokerName,
              fundName: selectedFundData?.fundName,
              selectedFundData,
              selectedBrokerFund,
              tableId: generateRandomNumber(),
            },
          ],
          selectedFundData: {
            fundId: '',
            fundName: '',
          },
          selectedBrokerFund: {
            brokerCode: '',
            brokerId: '',
            brokerName: '',
          },
          marketMakerNumberOfShare: '',
        });
      }
    } else {
      selectedFundData?.fundId == '' && setErrorMessage('selectedFundData');
      selectedBrokerFund?.brokerId == '' &&
        setErrorMessage('selectedBrokerFund');
      !marketMakerNumberOfShare && setErrorMessage('marketMakerNumberOfShare');
      !selectedFundData && setErrorMessage('selectedFundData');
      !selectedBrokerFund && setErrorMessage('selectedBrokerFund');
    }
  };
  const committedsSellersColumns: HeaderTypes[] = [
    {
      title: 'شناسه',
      dataIndex: 'tableId',
      className: 'col-span-1 !justify-start',
      key: 'tableId',
    },
    {
      title: 'حقیقی/حقوقی',
      dataIndex: 'personTypeName',
      className: 'col-span-1 !justify-start',

      key: 'personTypeName',
    },
    {
      title: 'نام',
      dataIndex: 'firstName',
      className: 'col-span-1 !justify-start',
      key: 'firstName',
    },
    {
      title: 'نام خانوادگی/نام شرکت',
      dataIndex: 'lastName',
      className: 'col-span-1 !justify-start',
      key: 'lastName',
    },
    {
      title: 'کارگزار عرضه کننده',
      dataIndex: 'brokerName',
      className: 'col-span-2 !justify-start',
      key: 'brokerName',
    },
    {
      title: 'کد کارگزار',
      dataIndex: 'brokerCode',
      className: 'col-span-1 !justify-start',
      key: 'brokerCode',
    },
    {
      title: 'کد بورسی',
      dataIndex: 'sellerCode',
      className: 'col-span-1 !justify-start',
      key: 'sellerCode',
    },
    {
      title: 'تعداد سهام قابل عرضه',
      dataIndex: 'tradeVolume',
      className: 'col-span-1 !justify-start',
      key: 'tradeVolume',
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'درصد کل سهام قابل عرضه',
      dataIndex: 'tradePercent',
      className: 'col-span-1 !justify-start',
      key: 'tradePercent',
    },
    {
      title: 'عملیات',
      dataIndex: 'action',
      key: 'action',
      className: 'col-span-1 !justify-start',
      render: (_: any, item: any) => (
        <div className="flex flex-row items-center justify-center">
          <Icon
            name="icon-edit"
            classname="text-green text-lg cursor-pointer"
            onClick={() => onEditThirdTableSeller(item)}
          />
          <Popconfirm
            title="آیا اطمینان دارید؟"
            okText="بله"
            cancelText="خیر"
            onConfirm={() => onRemoveThirdTableSeller(item)}
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
  const onEditThirdTableSeller = (item: any) => {
    setState({
      selectedSellersPersonalityType: item?.personTypeId,
      sellersName: item?.firstName,
      sellersFamily: item?.lastName,
      selectedSellersAgent: {
        brokerCode: item?.brokerCode,
        brokerId: item?.brokerId,
        brokerName: item?.brokerName,
      },
      sellersExchangeCode: item?.sellerCode,
      sellersTradeCount: item?.tradeVolume,
      sellersTradePercent: item?.tradePercent,
      thirdTableEditItemId: item?.tableId,
    });
  };
  const onRemoveThirdTableSeller = (record: any) => {
    const newList = sellersBasicData.filter(
      (item: any) => item.tableId !== record.tableId
    );
    setState({
      sellersBasicData: newList,
    });
  };
  const onSellerInformationClick = () => {
    if (
      selectedSellersPersonalityType &&
      // sellersName &&
      sellersFamily &&
      selectedSellersAgent &&
      selectedSellersAgent?.brokerId != '' &&
      sellersExchangeCode &&
      sellersTradeCount &&
      sellersTradePercent
    ) {
      const index = sellersBasicData.findIndex((object: any) => {
        return object.tableId === thirdTableEditItemId;
      });
      if (
        selectedSellersPersonalityType ===
          '25a0a62a-6a39-44b3-a8f6-cde56eb50f0a' &&
        sellersName == ''
      ) {
        setErrorMessage('sellersName');
      } else {
        if (index !== -1) {
          setState({
            sellersBasicData: [
              ...sellersBasicData.slice(0, index),
              {
                initialSupplyId: orderId != null ? id : null,
                personTypeId: selectedSellersPersonalityType,
                personTypeName: selectedSellersPersonalityTypeValue,
                firstName: sellersName,
                lastName: sellersFamily,
                brokerId: selectedSellersAgent?.brokerId,
                brokerName: selectedSellersAgent?.brokerName,
                brokerCode: selectedSellersAgent?.brokerCode,
                selectedSellersAgent: selectedSellersAgent,
                sellerCode: sellersExchangeCode,
                tradeVolume: sellersTradeCount,
                tradePercent: sellersTradePercent,
                committedType: 0,
                tableId: thirdTableEditItemId,
              },
              ...sellersBasicData.slice(index + 1),
            ],
            selectedSellersPersonalityType: '',
            sellersName: '',
            sellersFamily: '',
            selectedSellersAgent: {
              brokerCode: '',
              brokerId: '',
              brokerName: '',
            },
            sellersExchangeCode: '',
            sellersTradeCount: '',
            sellersTradePercent: '',
            thirdTableEditItemId: null,
          });
        } else {
          setState({
            sellersBasicData: [
              ...sellersBasicData,
              {
                initialSupplyId: orderId != null ? id : null,
                personTypeId: selectedSellersPersonalityType,
                personTypeName: selectedSellersPersonalityTypeValue,
                firstName: sellersName,
                lastName: sellersFamily,
                brokerId: selectedSellersAgent?.brokerId,
                brokerName: selectedSellersAgent?.brokerName,
                brokerCode: selectedSellersAgent?.brokerCode,
                selectedSellersAgent: selectedSellersAgent,
                sellerCode: sellersExchangeCode,
                tradeVolume: sellersTradeCount,
                tradePercent: sellersTradePercent,
                committedType: 0,
                tableId: generateRandomNumber(),
              },
            ],
            selectedSellersPersonalityType: '',
            sellersName: '',
            sellersFamily: '',
            selectedSellersAgent: {
              brokerCode: '',
              brokerId: '',
              brokerName: '',
            },
            sellersExchangeCode: '',
            sellersTradeCount: '',
            sellersTradePercent: '',
          });
        }
      }
    } else {
      !selectedSellersPersonalityType &&
        setErrorMessage('selectedSellersPersonalityType');
      // !sellersName && setErrorMessage('sellersName');
      !sellersFamily && setErrorMessage('sellersFamily');
      selectedSellersAgent?.brokerName == '' &&
        setErrorMessage('selectedSellersAgent');
      !selectedSellersAgent && setErrorMessage('selectedSellersAgent');
      !sellersExchangeCode && setErrorMessage('sellersExchangeCode');
      !sellersTradeCount && setErrorMessage('sellersTradeCount');
      !sellersTradePercent && setErrorMessage('sellersTradePercent');
    }
  };
  const committedsBuyersColumns: HeaderTypes[] = [
    {
      title: 'شناسه',
      dataIndex: 'tableId',
      className: 'col-span-1 !justify-start',
      key: 'tableId',
    },
    {
      title: 'حقیقی/حقوقی',
      dataIndex: 'personTypeName',
      className: 'col-span-1 !justify-start',
      key: 'personTypeName',
    },
    {
      title: 'نام',
      dataIndex: 'firstName',
      className: 'col-span-1 !justify-start',
      key: 'firstName',
    },
    {
      title: 'نام خانوادگی/نام شرکت',
      dataIndex: 'lastName',
      className: 'col-span-1 !justify-start',
      key: 'lastName',
    },
    {
      title: 'کارگزار خریدار',
      dataIndex: 'brokerName',
      className: 'col-span-2 !justify-start',
      key: 'brokerName',
    },
    {
      title: 'کد کارگزار',
      dataIndex: 'brokerCode',
      className: 'col-span-1 !justify-start',
      key: 'brokerCode',
    },
    {
      title: 'کد بورسی',
      dataIndex: 'sellerCode',
      className: 'col-span-1 !justify-start',
      key: 'sellerCode',
    },
    {
      title: 'تعداد سهام قابل خرید',
      dataIndex: 'tradeVolume',
      className: 'col-span-1 !justify-start',
      key: 'tradeVolume',
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'درصد میزان تعهد',
      dataIndex: 'tradePercent',
      className: 'col-span-1 !justify-start',
      key: 'tradePercent',
    },
    {
      title: 'عملیات',
      dataIndex: 'action',
      key: 'action',
      className: 'col-span-1 !justify-start',
      render: (_: any, item: any) => (
        <div className="flex flex-row items-center justify-center">
          <Icon
            name="icon-edit"
            classname="text-green text-lg cursor-pointer"
            onClick={() => onEditFourthTableBuyer(item)}
          />
          <Popconfirm
            title="آیا اطمینان دارید؟"
            okText="بله"
            cancelText="خیر"
            onConfirm={() => onRemoveFourthTableBuyer(item)}
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
  const onEditFourthTableBuyer = (item: any) => {
    setState({
      selectedBuyersPersonalityType: item?.personTypeId,
      buyersName: item?.firstName,
      buyerFamilyName: item?.lastName,
      selectedBuyersAgent: {
        brokerCode: item?.brokerCode,
        brokerId: item?.brokerId,
        brokerName: item?.brokerName,
      },
      buyersAgentCode: item?.brokerCode,
      buyersExchangeCode: item?.sellerCode,
      buyersTradeCount: item?.tradeVolume,
      buyersTradePercent: item?.tradePercent,
      fourthTableEditItemId: item?.tableId,
    });
  };
  const onRemoveFourthTableBuyer = (record: any) => {
    const newList = buyerBasicData.filter(
      (item: any) => item.tableId !== record.tableId
    );
    setState({
      buyerBasicData: newList,
    });
  };
  const onBuyerInformationClick = () => {
    if (
      selectedBuyersPersonalityType &&
      // buyersName &&
      buyerFamilyName &&
      selectedBuyersAgent &&
      selectedBuyersAgent?.brokerId != '' &&
      buyersAgentCode &&
      buyersExchangeCode &&
      buyersTradeCount &&
      buyersTradePercent
    ) {
      const index = buyerBasicData.findIndex((object: any) => {
        return object.tableId === fourthTableEditItemId;
      });
      if (
        selectedBuyersPersonalityType ===
          '25a0a62a-6a39-44b3-a8f6-cde56eb50f0a' &&
        buyersName == ''
      ) {
        setErrorMessage('buyersName');
      } else {
        if (index !== -1) {
          setState({
            buyerBasicData: [
              ...buyerBasicData.slice(0, index),
              {
                initialSupplyId: orderId != null ? id : null,
                personTypeId: selectedBuyersPersonalityType,
                personTypeName: selectedBuyersPersonalityTypeValue,
                firstName: buyersName,
                lastName: buyerFamilyName,
                brokerId: selectedBuyersAgent?.brokerId,
                brokerCode: selectedBuyersAgent?.brokerCode,
                brokerName: selectedBuyersAgent?.brokerName,
                buyersAgentCode: selectedBuyersAgent?.brokerCode,
                selectedBuyersAgent: selectedBuyersAgent,
                sellerCode: buyersExchangeCode,
                tradeVolume: buyersTradeCount,
                tradePercent: buyersTradePercent,
                committedType: 1,
                tableId: fourthTableEditItemId,
              },
              ...buyerBasicData.slice(index + 1),
            ],
            selectedBuyersPersonalityType: '',
            buyersName: '',
            buyerFamilyName: '',
            selectedBuyersAgent: {
              brokerCode: '',
              brokerId: '',
              brokerName: '',
            },
            buyersAgentCode: '',
            buyersExchangeCode: '',
            buyersTradeCount: '',
            buyersTradePercent: '',
            fourthTableEditItemId: null,
          });
        } else {
          setState({
            buyerBasicData: [
              ...buyerBasicData,
              {
                initialSupplyId: orderId != null ? id : null,
                personTypeId: selectedBuyersPersonalityType,
                personTypeName: selectedBuyersPersonalityTypeValue,
                firstName: buyersName,
                lastName: buyerFamilyName,
                brokerId: selectedBuyersAgent?.brokerId,
                brokerName: selectedBuyersAgent?.brokerName,
                brokerCode: selectedBuyersAgent?.brokerCode,
                buyersAgentCode: selectedBuyersAgent?.brokerCode,
                selectedBuyersAgent: selectedBuyersAgent,
                sellerCode: buyersExchangeCode,
                tradeVolume: buyersTradeCount,
                tradePercent: buyersTradePercent,
                committedType: 1,
                tableId: generateRandomNumber(),
              },
            ],
            selectedBuyersPersonalityType: '',
            buyersName: '',
            buyerFamilyName: '',
            selectedBuyersAgent: {
              brokerCode: '',
              brokerId: '',
              brokerName: '',
            },
            buyersExchangeCode: '',
            buyersAgentCode: '',
            buyersTradeCount: '',
            buyersTradePercent: '',
          });
        }
      }
    } else {
      !selectedBuyersPersonalityType &&
        setErrorMessage('selectedBuyersPersonalityType');
      // !buyersName && setErrorMessage('buyersName');
      !buyerFamilyName && setErrorMessage('buyerFamilyName');
      selectedBuyersAgent?.brokerName == '' &&
        setErrorMessage('selectedBuyersAgent');
      !selectedBuyersAgent && setErrorMessage('selectedBuyersAgent');
      !buyersExchangeCode && setErrorMessage('buyersExchangeCode');
      !buyersTradeCount && setErrorMessage('buyersTradeCount');
      !buyersTradePercent && setErrorMessage('buyersTradePercent');
    }
  };

  const onFail = (error: any) => {
    onAlert(error);
  };
  const getBroker = (text: string, pageNo: number) => {
    const data = {
      SearchText: text,
      PageNumber: pageNo,
    };
    geBrokerList({ data, onSuccess: onSuccessBroker, onFail });
  };
  const onSuccessBroker = (res: any) => {
    setState({
      brokerList: res,
    });
  };
  const onSearchBroker = (value: string) => {
    getBroker(value, 1);
  };
  const getFund = (text: string, pageNo: number) => {
    const data = {
      FundName: text,
      PageNumber: pageNo,
    };
    getFundList({ data, onSuccess: onSuccessFund, onFail });
  };
  const onSuccessFund = (res: any) => {
    setState({
      fundList: res,
    });
  };
  const onSearchFund = (value: string) => {
    getFund(value, 1);
  };

  function handleGetPersonType() {
    getPersonType({
      onSuccess: (res) => {
        setState({
          personalityType: res,
        });
      },
      onFail,
    });
  }
  ///////////روش عرضه
  function handleGetInitialSupplyType() {
    getInitialSupplyType({
      onSuccess: (res) => {
        setState({
          initialSupplyType: res,
        });
      },
      onFail,
    });
  }
  function handleGetInitialSupplyAttachType() {
    getInitialSupplyAttachType({
      onSuccess: (res) => {
        setState({
          allAttachTypeData: res,
          requireAttachDataList: res.filter(
            (item: any) => item.isRequired && !item.isMultiple
          ),
          requireAttachDataListOthers: res.filter(
            (item: any) => item.isRequired && item.isMultiple
          ),
        });
      },
      onFail,
    });
  }
  const onRemoveFile = () => {
    setState({
      uploadFileName: 'حذف گردید',
      uploadFileLink: '',
      uploadFileError: true,
    });
  };

  const onChangeFile = (e: any) => {
    uploadFile({
      data: e.target.files[0],
      onSuccess: (res: any) => onSuccessUpload(res),
      onFail,
    });
  };

  const onSuccessUpload = (res: any) => {
    setState({
      uploadFileName: res?.fileName,
      uploadFileLink: res?.link,
      uploadFileId: res?.fileId,
      uploadFileType: res?.fileType,
      uploadFileError: false,
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
  const setErrorMessage = (key: string) => {
    const errorMessage = '.';
    setState({ [`${key}Error`]: errorMessage });
  };

  const checkRequiredData = () => {
    const notAvailable: any = [];
    requireAttachDataList?.map((item: any) => {
      uploadFileListItem?.some((data: any) => data?.attachTypeId === item?.id)
        ? null
        : notAvailable.push(item);
    });
    if (notAvailable?.length > 0) {
      setState({ uploadFileValidate: true, requireFileUploadComplete: false });
    } else {
      setState({ uploadFileValidate: false, requireFileUploadComplete: true });
    }
  };
  const checkRequiredDataOthers = () => {
    const notAvailable: any = [];
    buyAndSellBasicData?.map((parentItem: any, index: any) => {
      requireAttachDataListOthers?.map((item: any) => {
        uploadFileListItemOthers?.some(
          (data: any) =>
            data?.attachTypeId === item?.id &&
            data?.tableId === parentItem?.tableId
        )
          ? null
          : notAvailable.push(item);
      });
    });
    if (notAvailable?.length > 0) {
      setState({
        uploadFileValidateOthers: true,
        requireFileUploadCompleteOthers: false,
      });
    } else {
      setState({
        uploadFileValidateOthers: false,
        requireFileUploadCompleteOthers: true,
      });
    }
  };
  const onUploadFileSubmit = () => {
    if (selectedDocumentType && uploadFileLink) {
      const uploadItem = {
        // id: null,
        // transferBlockId: null,
        attachTypeId: selectedDocumentType,
        description: fileDescription,
        fileId: uploadFileId,
        uploadFileLink: uploadFileLink,
        uploadFileType: uploadFileType,
        attachTypeName: selectedDocumentTypeName,
        tableId: null,
        fileName: uploadFileName,
      };
      const uploadItemOthers = {
        // id: null,
        // transferBlockId: null,
        attachTypeId: selectedDocumentType,
        description: fileDescription,
        fileId: uploadFileId,
        uploadFileLink: uploadFileLink,
        uploadFileType: uploadFileType,
        tableId: parseInt(selectedFileSellOrBuy),
        fileName: uploadFileName,
      };
      if (!selectedDocumentTypeIsMultiple) {
        setUploadFileListItem((item: any) => [...item, uploadItem]);
        setState({
          selectedDocumentTypeName: '',
          fileDescription: '',
          uploadFileName: '',
          uploadFileLink: '',
          selectedDocumentType: '',
          publicAttachExpanded: true,
        });
      } else {
        if (
          selectedFileSellOrBuyValue == '' ||
          selectedFileSellOrBuyValue == undefined
        ) {
          !selectedFileSellOrBuy && setErrorMessage('selectedFileSellOrBuy');
          onAlert({
            message: `ابتدا اطلاعات متعهدین عرضه یا خرید را وارد نمایید و سپس فایل های مربوط به آن را بارگذاری نمایید.`,
            type: 'error',
          });
        } else {
          setUploadFileListItemOthers((item: any) => [
            ...item,
            uploadItemOthers,
          ]);
          setState({
            selectedDocumentTypeName: '',
            fileDescription: '',
            uploadFileName: '',
            uploadFileLink: '',
            selectedDocumentType: '',
            selectedFileSellOrBuy: '',
            selectedFileSellOrBuyValue: '',
            sellerAttachExpanded: true,
          });
        }
      }
    } else {
      !selectedDocumentType && setErrorMessage('selectedDocumentType');
      // !fileDescription && setErrorMessage('fileDescription');
      !uploadFileLink && setErrorMessage('uploadFile');
    }
  };
  const onDeleteFileList = (id: any) => {
    setUploadFileListItem((item: any) =>
      item.filter((data: any) => data?.fileId != id)
    );
  };
  const onDeleteFileListOthers = (id: any) => {
    setUploadFileListItemOthers((item: any) =>
      item.filter((data: any) => data?.fileId != id)
    );
  };
  function onSubmitClick(): void {
    checkRequiredData();
    if (
      selectedInstrument &&
      TradeVolume &&
      InitialDate &&
      selectedInitialSupplyType &&
      InitialOfficer &&
      InitialOfficer?.brokerId != '' &&
      connectorFamily &&
      connectorPosition &&
      connectorPhoneNumber &&
      requireFileUploadComplete === true
    ) {
      if (initialSupplyBrokers?.length == 0) {
        onAlert({
          message: `اطلاعات کارگزار عرضه کننده را وارد نمایید.`,
          type: 'error',
        });
      } else if (initialSupplyMarketMakers?.length == 0) {
        onAlert({
          message: `اطلاعات بازارگردان را وارد نمایید.`,
          type: 'error',
        });
      }
      //else if (sellersBasicData.length == 0) {
      //   onAlert({
      //     message: `اطلاعات متعهدین عرضه را وارد نمایید.`,
      //     type: 'error',
      //   });
      // } else if (buyerBasicData.length == 0) {
      //   onAlert({
      //     message: `اطلاعات متعهدین خرید را وارد نمایید.`,
      //     type: 'error',
      //   });
      // }
      else if (HasEmployeesShare === true && EmployeesShare == '') {
        onAlert({
          message: `با توجه به فعال بودن مقدار اختصاص به کارکنان مقدار تعداد سهم آن را وارد نمایید.`,
          type: 'error',
        });
      }
      //  else if (
      //   selectedInitialSupplyType == 'a4be827f-7f3c-4fcf-9bc2-7ed080158ae4' &&
      //   OscillationRange == ''
      // ) {
      //   setErrorMessage('OscillationRange');
      // }
      else if (
        selectedInitialSupplyType == 'a4be827f-7f3c-4fcf-9bc2-7ed080158ae4' &&
        fixPrice == ''
      ) {
        setErrorMessage('fixPrice');
      }
      // else if (
      //   selectedInitialSupplyType == 'a4be827f-7f3c-4fcf-9bc2-7ed080158ae4' &&
      //   BasePrice == ''
      // ) {
      //   setErrorMessage('BasePrice');
      // }
      else if (
        selectedInitialSupplyType != 'a4be827f-7f3c-4fcf-9bc2-7ed080158ae4' &&
        selectedInitialSupplyType != 'a7a2c15c-7bd6-409b-a5b7-8eaba830941f'
      ) {
        if (OscillationRange == '') {
          setErrorMessage('OscillationRange');
        } else if (LowPrice == '') {
          setErrorMessage('LowPrice');
        } else if (HighPrice == '') {
          setErrorMessage('HighPrice');
        } else if (BasePrice == '') {
          setErrorMessage('BasePrice');
        } else if (HighPriceError != '') {
          onAlert({
            message: `حداکثر قیمت را به طور صحیح وارد نمایید.`,
            type: 'error',
          });
        } else {
          if (requireFileUploadCompleteOthers == false) {
            onAlert({
              message: `مدارک مربوط به متعهدین عرضه و خرید را به طور کامل وارد نمایید.`,
              type: 'error',
            });
          } else {
            const initialSupplyCommitteds = buyAndSellBasicData?.map(
              (item: any) => {
                const matchingSecondItem = uploadFileListItemOthers?.filter(
                  (secondItem: any) => secondItem?.tableId === item?.tableId
                );
                if (matchingSecondItem?.length > 0) {
                  return {
                    ...item,
                    initialSupplyFiles: matchingSecondItem,
                  };
                }
                return item;
              }
            );
            const data = {
              id: orderId != null ? id : '00000000-0000-0000-0000-000000000000',
              orderId:
                orderId != null
                  ? orderId
                  : '00000000-0000-0000-0000-000000000000',
              initialSupplyTypeId: selectedInitialSupplyType,
              instrumentId: selectedInstrument?.instrumentId,
              symbolCode: selectedInstrument?.symbolCode,
              tradeVolume: TradeVolume,
              tradePercent: TradePercent,
              initialDate: InitialDate,
              initialOfficer: InitialOfficer?.brokerId,
              initialOfficerName: InitialOfficer?.brokerName,
              oscillationRange: OscillationRange,
              lowPrice: LowPrice,
              highPrice: HighPrice,
              basePrice: BasePrice,
              fixPrice: fixPrice,
              employeesShare: EmployeesShare,
              hasSubsidiary: HasSubsidiary,
              hasEmployeesShare: HasEmployeesShare,
              responsibleName: connectorFamily,
              responsiblePost: connectorPosition,
              responsibleMobile: connectorPhoneNumber,
              initialSupplyBrokers: initialSupplyBrokers,
              initialSupplyMarketMakers: initialSupplyMarketMakers,
              initialSupplyCommitteds: initialSupplyCommitteds,
              publicFiles: uploadFileListItem,
            };
            saveInitialSupplyData({ data, onSuccess: onSuccessSave, onFail });
          }
        }
      } else {
        if (requireFileUploadCompleteOthers == false) {
          onAlert({
            message: `مدارک مربوط به متعهدین عرضه و خرید را به طور کامل وارد نمایید.`,
            type: 'error',
          });
        } else {
          const initialSupplyCommitteds = buyAndSellBasicData?.map(
            (item: any) => {
              const matchingSecondItem = uploadFileListItemOthers?.filter(
                (secondItem: any) => secondItem?.tableId === item?.tableId
              );
              if (matchingSecondItem?.length > 0) {
                return {
                  ...item,
                  initialSupplyFiles: matchingSecondItem,
                };
              }
              return item;
            }
          );
          const data = {
            id: orderId != null ? id : '00000000-0000-0000-0000-000000000000',
            orderId:
              orderId != null
                ? orderId
                : '00000000-0000-0000-0000-000000000000',
            initialSupplyTypeId: selectedInitialSupplyType,
            instrumentId: selectedInstrument?.instrumentId,
            symbolCode: selectedInstrument?.symbolCode,
            tradeVolume: TradeVolume,
            tradePercent: TradePercent,
            initialDate: InitialDate,
            initialOfficer: InitialOfficer?.brokerId,
            initialOfficerName: InitialOfficer?.brokerName,
            oscillationRange: OscillationRange,
            lowPrice: LowPrice,
            highPrice: HighPrice,
            basePrice: BasePrice,
            fixPrice: fixPrice,
            employeesShare: EmployeesShare,
            hasSubsidiary: HasSubsidiary,
            hasEmployeesShare: HasEmployeesShare,
            responsibleName: connectorFamily,
            responsiblePost: connectorPosition,
            responsibleMobile: connectorPhoneNumber,
            initialSupplyBrokers: initialSupplyBrokers,
            initialSupplyMarketMakers: initialSupplyMarketMakers,
            initialSupplyCommitteds: initialSupplyCommitteds,
            publicFiles: uploadFileListItem,
          };
          saveInitialSupplyData({ data, onSuccess: onSuccessSave, onFail });
        }
      }
    } else {
      selectedInstrument?.symbol == '' && setErrorMessage('selectedInstrument');
      !TradeVolume && setErrorMessage('TradeVolume');
      !InitialDate && setErrorMessage('InitialDate');
      !selectedInitialSupplyType &&
        setErrorMessage('selectedInitialSupplyType');
      InitialOfficer?.brokerName == '' && setErrorMessage('InitialOfficer');
      // !InitialOfficer && setErrorMessage('InitialOfficer');
      !OscillationRange && setErrorMessage('OscillationRange');
      !LowPrice && setErrorMessage('LowPrice');
      !HighPrice && setErrorMessage('HighPrice');
      !BasePrice && setErrorMessage('BasePrice');
      !connectorFamily && setErrorMessage('connectorFamily');
      !connectorPosition && setErrorMessage('connectorPosition');
      !connectorPhoneNumber && setErrorMessage('connectorPhoneNumber');
    }
  }
  const onSuccessSave = (res: any) => {
    setState({
      isTrackingModalVisible: true,
      trackingNumber: res?.trackingNumber,
    });
    setTimeout(() => {
      setState({ isTrackingModalVisible: false });
      navigate('/cartable');
    }, 4000);
  };
  const onCloseForm = () => {
    const data = {
      orderId: orderId,
    };
    closeFormStock({
      data: data,
      onSuccess: (res) => {
        onAlert({
          type: 'success',
          message: 'درخواست شما ابطال گردید',
        });
        navigate('/cartable');
      },
      onFail,
    });
  };
  const TrackingModal = () => {
    return (
      <>
        <Modal
          visible={isTrackingModalVisible}
          closable={false}
          style={{ textAlign: 'center', padding: '0px' }}
          title={'درخواست معامله عرضه اولیه'}
          footer={null}
          centered
          width={400}
        >
          <div className="flex justify-center flex-col items-center">
            <span className=" font-bold  my-4">
              اطلاعات شما با موفقیت ارسال شد.
            </span>
            <span className="text-blue text-base">
              کد پیگیری : {trackingNumber}
            </span>
          </div>
        </Modal>
      </>
    );
  };

  return (
    <div>
      <div className="w-full grid grid-cols-12 ">
        <div className=" col-span-12 items-start flex border-b-2 border-lightGray">
          <span className=" p-2 font-bold">درخواست عرضه اولیه</span>
        </div>
        <div className="grid col-span-12 grid-cols-12 gap-4 justify-between mx-4 mt-4">
          <SymbolModal
            className="2xl:col-span-3 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            data={symbolList}
            onChange={(pageNo: number, text: string) =>
              getSymbolList(text, pageNo)
            }
            onSubmit={(value: any) => {
              setState({
                selectedInstrumentSymbol: value?.symbol,
                companyName: value?.symbolName,
                investment: value?.investment,
                selectedInstrument: value,
                selectedInstrumentError: '',
              });
            }}
            defaultValue={selectedInstrument}
            label="نماد"
            required
            error={state?.selectedInstrumentError}
            showKey={'symbol'}
          />
          <TextField
            label="نام شرکت"
            className="2xl:col-span-3 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={companyName}
            onChange={(value: any) =>
              setState({
                companyName: value,
                companyNameError: '',
              })
            }
            readOnly
          />
          <TextField
            label="تعداد کل سهام شرکت"
            className="2xl:col-span-3 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={investment}
            onChange={(value: any) =>
              setState({
                investment: value,
              })
            }
            readOnly
            type="numeric"
          />
          <TextField
            label="حجم سهام قابل عرضه"
            className="2xl:col-span-3 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={TradeVolume}
            onChange={(value: any) => {
              const trade = value / investment;
              setState({
                TradeVolume: value,
                TradeVolumeError: '',
                TradePercent: (trade * 100).toFixed(2),
              });
            }}
            required
            errorMessage={state?.TradeVolumeError}
            type="number"
          />
          <TextField
            label="درصد حجم عرضه از کل سهام"
            className="2xl:col-span-3 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={TradePercent}
            onChange={(value: any) => {
              const trade = value * investment;
              setState({
                TradeVolume: trade / 100,
                TradePercent: value,
                TradePercentError: '',
              });
            }}
            required
            errorMessage={state?.TradePercentError}
            type="number"
            max={100}
          />
          <div className="2xl:col-span-3 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2 z-10">
            <DatePicker
              label="تاریخ عرضه"
              value={InitialDate}
              onChange={(value: any) =>
                setState({
                  InitialDate: value,
                  InitialDateError: '',
                })
              }
              required
              error={state?.InitialDateError}
            />
          </div>
          <div className="2xl:col-span-3 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2">
            <NewSelect
              label="روش عرضه"
              className="col-span-2"
              options={[{ name: '', id: '' }, ...initialSupplyType]}
              onChange={(value: any) =>
                setState({
                  selectedInitialSupplyType: value,
                  selectedInitialSupplyTypeError: false,
                  selectedInitialSupplyTypeValue: initialSupplyType.filter(
                    (item: any) => item?.id == value
                  )?.[0]?.name,
                })
              }
              showKey="name"
              selectedKey="id"
              required
              value={selectedInitialSupplyType}
              errorMessage={state?.selectedInitialSupplyTypeError}
            />
          </div>
          {/* <TextField
            label="مدیر عرضه"
            className="2xl:col-span-3 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={InitialOfficer}
            onChange={(value: any) =>
              setState({
                InitialOfficer: value,
                InitialOfficerError: '',
              })
            }
            required
            errorMessage={state?.InitialOfficerError}
          /> */}
          <NewSelectSearch
            className="2xl:col-span-3 xl:col-span-3 lg:col-span-4 md:col-span-5 col-span-2"
            label="کارگزار"
            onChange={(value: any) => {
              if (value?.brokerName != undefined) {
                setState({
                  InitialOfficer: value,
                  InitialOfficerError: '',
                });
              } else if (value == '') {
                setState({
                  InitialOfficer: null,
                });
              }
              getBroker(value, 1);
            }}
            value={InitialOfficer}
            required
            error={state?.InitialOfficerError}
            data={brokerList?.items}
            showKey="brokerName"
          />
          {/* عدم نمایش در گشایش و قیمت ثابت*/}
          {selectedInitialSupplyType !=
            'a7a2c15c-7bd6-409b-a5b7-8eaba830941f' &&
            selectedInitialSupplyType !=
              'a4be827f-7f3c-4fcf-9bc2-7ed080158ae4' && (
              <>
                <TextField
                  label="دامنه نوسان قیمت"
                  className="2xl:col-span-3 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
                  value={separator(OscillationRange)}
                  onChange={(value: any) =>
                    setState({
                      OscillationRange: value,
                      OscillationRangeError: '',
                    })
                  }
                  required
                  errorMessage={state?.OscillationRangeError}
                  type="numeric"
                />
                <TextField
                  label="حداقل قیمت"
                  className="2xl:col-span-3 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
                  value={separator(LowPrice)}
                  onChange={(value: any) =>
                    setState({
                      LowPrice: value,
                      LowPriceError: '',
                    })
                  }
                  required
                  errorMessage={state?.LowPriceError}
                  type="numeric"
                />
                <TextField
                  label="حداکثر قیمت"
                  className="2xl:col-span-3 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
                  value={separator(HighPrice)}
                  onChange={(value: any) =>
                    setState({
                      HighPrice: value,
                      HighPriceError: '',
                    })
                  }
                  required
                  errorMessage={state?.HighPriceError}
                  type="numeric"
                />
                <TextField
                  label="قیمت مبنا"
                  className="2xl:col-span-3 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
                  value={separator(BasePrice)}
                  onChange={(value: any) =>
                    setState({
                      BasePrice: value,
                      BasePriceError: '',
                    })
                  }
                  required
                  errorMessage={state?.BasePriceError}
                  type="numeric"
                />
              </>
            )}
          {/* قیمت ثابت */}
          {selectedInitialSupplyType ==
            'a4be827f-7f3c-4fcf-9bc2-7ed080158ae4' && (
            <TextField
              label="قیمت ثابت"
              className="2xl:col-span-3 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
              value={separator(fixPrice)}
              onChange={(value: any) =>
                setState({
                  fixPrice: value,
                  fixPriceError: '',
                })
              }
              required
              errorMessage={state?.fixPriceError}
              type="numeric"
            />
          )}
        </div>
        <div className="grid col-span-12 grid-cols-12 gap-4 justify-between mx-4 mt-4">
          <div className="2xl:col-span-3 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2">
            <span className="text-bold ">اوراق تبعی * :</span>
            <Radio.Group
              onChange={(e) => setState({ HasSubsidiary: e.target.value })}
              value={HasSubsidiary}
              style={{ marginBottom: 20, width: '100%', marginTop: 10 }}
            >
              {haveOptionRadio.map((item: any) => (
                <Radio className="text-extratiny" value={item.id}>
                  {item.title}
                </Radio>
              ))}
            </Radio.Group>
          </div>
          <div className="2xl:col-span-3 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2">
            <span className="text-bold ">اختصاص به کارکنان * :</span>
            <Radio.Group
              onChange={(e) => setState({ HasEmployeesShare: e.target.value })}
              value={HasEmployeesShare}
              style={{ marginBottom: 10, width: '100%', marginTop: 10 }}
            >
              {haveOptionRadio.map((item: any) => (
                <Radio className="text-extratiny" value={item.id}>
                  {item.title}
                </Radio>
              ))}
            </Radio.Group>
          </div>
          {HasEmployeesShare == true && (
            <TextField
              label="تعداد سهم اختصاص به کارکنان"
              className="2xl:col-span-3 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
              value={separator(EmployeesShare)}
              onChange={(value: any) =>
                setState({
                  EmployeesShare: value,
                  EmployeesShareError: '',
                })
              }
              required
              errorMessage={state?.EmployeesShareError}
              type="numeric"
            />
          )}
        </div>
        <div className="grid col-span-12 grid-cols-12 gap-4  justify-between ">
          <div className=" col-span-12 grid grid-cols-12  items-start  mt-4 ">
            <span className=" col-span-12 p-2 font-bold text-blue underline">
              اطلاعات کارگزار عرضه کننده و بازارگردان :
            </span>
            <span className=" col-span-12 p-2 font-bold mx-2">
              اطلاعات کارگزار عرضه کننده :
            </span>
          </div>
        </div>

        <div className="grid col-span-12 grid-cols-12 gap-4  justify-between mx-4 mt-2">
          <NewSelectSearch
            className="2xl:col-span-3 xl:col-span-3 lg:col-span-4 md:col-span-5 col-span-2"
            label="نام کارگزار عرضه کننده"
            onChange={(value: any) => {
              if (value?.brokerName != undefined) {
                setState({
                  selectedBrokerData: value,
                  selectedBrokerCode: value?.brokerCode,
                  selectedBrokerDataError: '',
                });
              } else if (value == '') {
                setState({
                  selectedBrokerData: null,
                  selectedBrokerCode: '',
                });
              }
              getBroker(value, 1);
            }}
            value={selectedBrokerData}
            required
            error={state?.selectedBrokerDataError}
            data={brokerList?.items}
            showKey="brokerName"
          />
          <TextField
            label="کد کارگزار عرضه کننده"
            className="2xl:col-span-3 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={selectedBrokerCode}
            onChange={(value: any) =>
              setState({
                selectedBrokerCode: value,
                selectedBrokerCodeError: '',
              })
            }
            readOnly
            errorMessage={state?.selectedBrokerCodeError}
          />
          <TextField
            label="کد معامله گر کارگزار عرضه کننده"
            className="2xl:col-span-3 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={deSeparator(brokerTraderCode)}
            onChange={(value: any) =>
              setState({
                brokerTraderCode: value,
                brokerTraderCodeError: '',
              })
            }
            required
            errorMessage={state?.brokerTraderCodeError}
            maxLength={8}
          />
          {/* <CheckSquareFilled
            onClick={onBrokerInformationClick}
            className=" text-4xl !text-green  cursor-pointer"
          /> */}
          <Button
            onClick={onBrokerInformationClick}
            className="bg-green w-24 h-9 text-white"
          >
            تایید و اضافه
          </Button>
          <div className="col-span-12">
            <Table
              columns={brokerColumns}
              className="col-span-12 grid grid-cols-12 text-center"
              dataSource={initialSupplyBrokers}
              pageSize={1000}
            />
          </div>
        </div>
        <div className="grid col-span-12 grid-cols-12 gap-4  justify-between mx-4 mt-4 ">
          <span className=" col-span-12 p-2 font-bold ">بازارگردان : </span>
        </div>
        <div className="grid col-span-12 grid-cols-12 gap-4  justify-between mx-4 mt-2">
          <NewSelectSearch
            className="2xl:col-span-3 xl:col-span-3 lg:col-span-4 md:col-span-5 col-span-2"
            label="نام بازارگردان "
            onChange={(value: any) => {
              if (value?.fundName != undefined) {
                setState({
                  selectedFundData: value,
                  selectedFundDataError: '',
                });
              } else if (value == '') {
                setState({
                  selectedFundData: null,
                });
              }
              getFund(value, 1);
            }}
            value={selectedFundData}
            required
            error={state?.selectedFundDataError}
            data={fundList?.items}
            showKey="fundName"
          />
          <TextField
            label="تعداد سهام عرضه به بازارگردان"
            className="2xl:col-span-3 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={deSeparator(marketMakerNumberOfShare)}
            onChange={(value: any) =>
              setState({
                marketMakerNumberOfShare: value,
                marketMakerNumberOfShareError: '',
              })
            }
            required
            errorMessage={state?.marketMakerNumberOfShareError}
          />
          <NewSelectSearch
            className="2xl:col-span-3 xl:col-span-3 lg:col-span-4 md:col-span-5 col-span-2"
            label="کارگزار بازارگردان"
            onChange={(value: any) => {
              if (value?.brokerName !== undefined) {
                setState({
                  selectedBrokerFund: value,
                  selectedBrokerFundError: '',
                });
              } else if (value == '') {
                setState({
                  selectedBrokerFund: null,
                });
              }
              getBroker(value, 1);
            }}
            value={selectedBrokerFund}
            required
            error={state?.selectedBrokerFundError}
            data={brokerList?.items}
            showKey="brokerName"
          />
          <Button
            onClick={onMarketMakerInformationClick}
            className="bg-green w-24 h-9 text-white"
          >
            تایید و اضافه
          </Button>
          <div className="col-span-12">
            <Table
              columns={marketMakerColumns}
              className="col-span-12 grid grid-cols-12 text-center"
              dataSource={initialSupplyMarketMakers}
              pageSize={1000}
            />
          </div>
        </div>
        <div className="grid col-span-12 grid-cols-12 gap-4  justify-between ">
          <div className=" col-span-12 grid grid-cols-12  items-start  mt-4 ">
            <span className=" col-span-12 p-2 font-bold text-blue underline">
              اطلاعات متعهدین :
            </span>
            <span className=" col-span-12 p-2 font-bold mx-2">عرضه : </span>
          </div>
        </div>
        <div className="grid col-span-12 grid-cols-12 gap-4  justify-between mx-4 mt-2">
          <div className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2">
            <NewSelect
              label="حقیقی/حقوقی"
              className="col-span-2"
              options={[{ name: '', id: '' }, ...personalityType]}
              onChange={(value: any) =>
                setState({
                  selectedSellersPersonalityType: value,
                  selectedSellersPersonalityTypeError: false,
                  selectedSellersPersonalityTypeValue: personalityType.filter(
                    (item: any) => item?.id == value
                  )?.[0]?.name,
                })
              }
              showKey="name"
              selectedKey="id"
              required
              value={selectedSellersPersonalityType}
              errorMessage={state?.selectedSellersPersonalityTypeError}
            />
          </div>
          {!disableSellersFirstName && (
            <TextField
              label="نام"
              className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
              value={sellersName}
              onChange={(value: any) =>
                setState({
                  sellersName: value,
                  sellersNameError: '',
                })
              }
              required
              errorMessage={state?.sellersNameError}
            />
          )}
          <TextField
            label="نام خانوادگی/نام شرکت"
            className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={sellersFamily}
            onChange={(value: any) =>
              setState({
                sellersFamily: value,
                sellersFamilyError: '',
              })
            }
            required
            errorMessage={state?.sellersFamilyError}
          />
          <NewSelectSearch
            className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5 col-span-2"
            label="کارگزار عرضه کننده"
            onChange={(value: any) => {
              if (value?.brokerName !== undefined) {
                setState({
                  selectedSellersAgent: value,
                  selectedSellersAgentName: value?.brokerName,
                  selectedSellersAgentError: '',
                });
              } else if (value == '') {
                setState({
                  selectedSellersAgent: null,
                });
              }
              getBroker(value, 1);
            }}
            value={selectedSellersAgent}
            required
            error={state?.selectedSellersAgentError}
            data={brokerList?.items}
            showKey="brokerName"
          />
          <TextField
            label="کد کارگزار"
            className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={
              selectedSellersAgent?.brokerCode != undefined
                ? selectedSellersAgent?.brokerCode
                : ''
            }
            readOnly
          />
          <TextField
            label="کد بورسی"
            className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={deSeparator(sellersExchangeCode)}
            onChange={(value: any) => {
              setState({
                sellersExchangeCode: value,
              });
            }}
            required
            errorMessage={state?.sellersExchangeCodeError}
            // type="numeric"
          />
          <TextField
            label="تعداد سهام قابل عرضه"
            className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={sellersTradeCount}
            onChange={(value: any) => {
              const trade = value / investment;
              setState({
                sellersTradeCount: value,
                sellersTradeCountError: '',
                sellersTradePercent: (trade * 100).toFixed(2),
                sellersTradePercentError: '',
              });
            }}
            required
            errorMessage={state?.sellersTradeCountError}
            type="number"
          />
          <TextField
            label="درصد کل سهام قابل عرضه"
            className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={sellersTradePercent}
            onChange={(value: any) => {
              const trade = value * investment;
              setState({
                sellersTradePercent: value,
                sellersTradePercentError: '',
                sellersTradeCount: trade / 100,
                sellersTradeCountError: '',
              });
            }}
            required
            errorMessage={state?.sellersTradePercentError}
            type="number"
          />
          <Button
            onClick={onSellerInformationClick}
            className="bg-green w-24 h-9 text-white"
          >
            تایید و اضافه
          </Button>
          <div className="col-span-12">
            <Table
              columns={committedsSellersColumns}
              className="col-span-12 grid grid-cols-12 text-center"
              dataSource={sellersBasicData}
              pageSize={1000}
            />
          </div>
        </div>
        <div className="grid col-span-12 grid-cols-12 gap-4  justify-between   mt-2">
          <span className=" col-span-12 p-2 font-bold mx-2">خرید : </span>
        </div>
        <div className="grid col-span-12 grid-cols-12 gap-4  justify-between mx-4 mt-2">
          <div className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2">
            <NewSelect
              label="حقیقی/حقوقی"
              className="col-span-2"
              options={[{ name: '', id: '' }, ...personalityType]}
              onChange={(value: any) =>
                setState({
                  selectedBuyersPersonalityType: value,
                  selectedBuyersPersonalityTypeError: false,
                  selectedBuyersPersonalityTypeValue: personalityType.filter(
                    (item: any) => item?.id == value
                  )?.[0]?.name,
                })
              }
              showKey="name"
              selectedKey="id"
              required
              value={selectedBuyersPersonalityType}
              errorMessage={state?.selectedBuyersPersonalityTypeError}
            />
          </div>
          {!disableBuyerFirstName && (
            <TextField
              label="نام"
              className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
              value={buyersName}
              onChange={(value: any) =>
                setState({
                  buyersName: value,
                  buyersNameError: '',
                })
              }
              required
              errorMessage={state?.buyersNameError}
            />
          )}
          <TextField
            label="نام خانوادگی/نام شرکت"
            className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={buyerFamilyName}
            onChange={(value: any) =>
              setState({
                buyerFamilyName: value,
                buyerFamilyNameError: '',
              })
            }
            required
            errorMessage={state?.buyerFamilyNameError}
          />
          <NewSelectSearch
            className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5 col-span-2"
            label="کارگزار خریدار"
            onChange={(value: any) => {
              if (value?.brokerName !== undefined) {
                setState({
                  selectedBuyersAgent: value,
                  selectedBuyersAgentError: '',
                  buyersAgentCode: value?.brokerCode,
                });
              } else if (value == '') {
                setState({
                  selectedBuyersAgent: null,
                  buyersAgentCode: '',
                });
              }
              getBroker(value, 1);
            }}
            value={selectedBuyersAgent}
            required
            error={state?.selectedBuyersAgentError}
            data={brokerList?.items}
            showKey="brokerName"
          />
          <TextField
            label="کد کارگزار"
            className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={buyersAgentCode}
            onChange={(value: any) =>
              setState({
                buyersAgentCode: value,
                buyersAgentCodeError: '',
              })
            }
            readOnly
            errorMessage={state?.buyersAgentCodeError}
          />
          <TextField
            label="کد بورسی"
            className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={deSeparator(buyersExchangeCode)}
            onChange={(value: any) => {
              setState({
                buyersExchangeCode: value,
              });
            }}
            required
            errorMessage={state?.buyersExchangeCodeError}
            // type="numeric"
          />
          <TextField
            label="تعداد سهام قابل خرید"
            className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={buyersTradeCount}
            onChange={(value: any) => {
              const trade = value / investment;
              setState({
                buyersTradeCount: value,
                buyersTradeCountError: '',
                buyersTradePercent: (trade * 100).toFixed(2),
                buyersTradePercentError: '',
              });
            }}
            required
            errorMessage={state?.buyersTradeCountError}
            type="number"
          />
          <TextField
            label="درصد میزان تعهد"
            className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={buyersTradePercent}
            onChange={(value: any) => {
              const trade = value * investment;
              setState({
                buyersTradePercent: value,
                buyersTradePercentError: '',
                buyersTradeCount: trade / 100,
                buyersTradeCountError: '',
              });
            }}
            required
            errorMessage={state?.buyersTradePercentError}
            type="number"
          />
          <Button
            onClick={onBuyerInformationClick}
            className="bg-green w-24 h-9 text-white"
          >
            تایید و اضافه
          </Button>
          <div className="col-span-12">
            <Table
              columns={committedsBuyersColumns}
              className="col-span-12 grid grid-cols-12 text-center"
              dataSource={buyerBasicData}
              pageSize={1000}
            />
          </div>
        </div>
        <div className=" col-span-12 items-start flex mt-4 mx-1 ">
          <span className=" p-2 font-bold text-blue underline">
            اطلاعات رابط :
          </span>
        </div>
        <div className="grid col-span-12 grid-cols-12 gap-4  justify-between mx-4 mt-4">
          <TextField
            label="نام و نام خانوادگی"
            className="2xl:col-span-3 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={connectorFamily}
            onChange={(value: any) =>
              setState({
                connectorFamily: value,
                connectorFamilyError: '',
              })
            }
            required
            errorMessage={state?.connectorFamilyError}
          />
          <TextField
            label="سمت"
            className="2xl:col-span-3 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={connectorPosition}
            onChange={(value: any) =>
              setState({
                connectorPosition: value,
                connectorPositionError: '',
              })
            }
            required
            errorMessage={state?.connectorPositionError}
          />

          <TextField
            label="شماره همراه"
            className="2xl:col-span-3 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={deSeparator(connectorPhoneNumber)}
            onChange={(value: any) =>
              setState({
                connectorPhoneNumber: value,
                connectorPhoneNumberError: '',
              })
            }
            required
            errorMessage={state?.connectorPhoneNumberError}
            maxLength={11}
            // type="number"
          />
        </div>
        {messages?.length > 0 && (
          <div className="grid col-span-12 grid-cols-12 gap-4  justify-between mx-4 mt-8">
            <div className=" col-span-12 items-start flex  ">
              <span className="  font-bold text-blue underline">توضیحات :</span>
            </div>
            <div className=" col-span-12  pb-4 ml-4">
              <Table
                data={messages}
                columns={messageColumns}
                wrapperClassName="!mt-4"
                //   onChangePage={onChangePage}
                totalPages={1}
                pageSize={1000}
                className="col-span-12 grid grid-cols-12 "
              />
            </div>
          </div>
        )}
        <div className="grid col-span-12 grid-cols-12 gap-4  justify-between mx-4 mt-4">
          <div className=" col-span-12 items-start flex flex-col mt-4 ">
            <span className=" font-bold text-blue underline">
              بارگذاری مدارک :
            </span>
            <span className="p-2 text-red ">
              {uploadFileValidate
                ? 'مدارک را به طور کامل بارگذاری نمایید.'
                : ''}
            </span>
            <span className="p-2 text-red ">
              {uploadFileValidateOthers
                ? 'مدارک مربوط به متعهدین عرضه و خرید را به طور کامل بارگذاری نمایید.'
                : ''}
            </span>
          </div>
          <div className="grid grid-cols-12 col-span-12 gap-4  items-center border-2 border-lightGray  p-6 ">
            <div className="2xl:col-span-2 xl:col-span-4 lg:col-span-4 md:col-span-6 col-span-2 mx-2">
              <NewSelect
                label="نوع مدرک"
                className=" col-span-2"
                options={[{ name: '', id: '' }, ...allAttachTypeData]}
                onChange={(value: any) => {
                  setState({
                    selectedDocumentType: value,
                    selectedDocumentTypeError: false,
                    selectedDocumentTypeName: allAttachTypeData.filter(
                      (item: any) => item?.id === value
                    )?.[0]?.name,
                    selectedDocumentTypeIsMultiple: allAttachTypeData.filter(
                      (item: any) => item?.id === value
                    )?.[0]?.isMultiple,
                  });
                }}
                showKey="name"
                selectedKey="id"
                required
                value={selectedDocumentType}
                errorMessage={state?.selectedDocumentTypeError}
              />
            </div>
            {selectedDocumentTypeIsMultiple && (
              <div className="2xl:col-span-2 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-2">
                <NewSelect
                  label="متعهدین عرضه/خرید"
                  className="col-span-2"
                  options={[{ name: '', id: '' }, ...fileSelectBuyAndSell]}
                  onChange={(value: any) =>
                    setState({
                      selectedFileSellOrBuy: value,
                      selectedFileSellOrBuyError: false,
                      selectedFileSellOrBuyValue: fileSelectBuyAndSell.filter(
                        (item: any) => item?.id == value
                      )?.[0]?.name,
                    })
                  }
                  showKey="name"
                  selectedKey="id"
                  required
                  value={selectedFileSellOrBuy}
                  errorMessage={state?.selectedFileSellOrBuyError}
                />
              </div>
            )}

            <TextField
              label="توضیحات"
              className="2xl:col-span-2 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-2"
              value={fileDescription}
              onChange={(value: any) =>
                setState({
                  fileDescription: value,
                  fileDescriptionError: '',
                })
              }
              // required
              // errorMessage={state?.fileDescriptionError}
            />
            <div className=" 2xl:col-span-4 xl:col-span-10 lg:col-span-12 md:col-span-12  col-span-3 mr-4">
              <Upload
                onChange={(file: any) => onChangeFile(file)}
                value={uploadFileName}
                href={uploadFileLink}
                name="uploadFile"
                onDelete={() => onRemoveFile()}
                error={uploadFileError}
              />
            </div>
            <div className=" 2xl:col-span-2 xl:col-span-2 lg:col-span-4 md:col-span-5  col-span-2 flex rounded-full ml-2 justify-end">
              <Button
                className="border-green border text-white bg-green w-[110px]"
                onClick={onUploadFileSubmit}
              >
                بارگذاری مدارک
              </Button>
            </div>
          </div>
        </div>
        <Collapse
          className="shadow-[0_0px_4px_rgba(0,0,0,0.2)] bg-[#EEEBFF] rounded-sm p-1 mb-3 col-span-12 gap-4  justify-between mx-4 mt-4"
          title="مدارک و مستندات عمومی"
          expanded={publicAttachExpanded}
          onChange={(e: any, isOpen: boolean) =>
            setState({ publicAttachExpanded: isOpen })
          }
        >
          <div className="grid col-span-10 grid-cols-12 gap-4  justify-between mx-4 mt-4 mb-4">
            <div className=" col-span-3  bg-lightGray py-2">
              {requireAttachDataList?.map((item: any) => {
                return (
                  <div className="flex flex-row items-center px-4 py-1">
                    <div className="w-4">
                      <div
                        className={`w-4 h-4  rounded-full border-2 border-gray ${
                          uploadFileListItem?.some(
                            (data: any) => data?.attachTypeId === item?.id
                          )
                            ? 'bg-green'
                            : 'bg-red'
                        } `}
                      />
                    </div>
                    <span className="mr-4"> {item.name}</span>
                  </div>
                );
              })}
            </div>
            <div className=" col-span-9 grid grid-cols-6 ">
              {uploadFileListItem?.length > 0 &&
                uploadFileListItem?.map((item: any, index: any) => (
                  <ImageUpload
                    className="2xl:col-span-3 xl:col-span-3 lg:col-span-3 md:col-span-6  col-span-3"
                    data={item}
                    onAlert={onAlert}
                    onDeleteFile={onDeleteFileList}
                  />
                ))}
            </div>
          </div>
        </Collapse>
        {buyAndSellBasicData.length > 0 && (
          <Collapse
            className="shadow-[0_0px_4px_rgba(0,0,0,0.2)] bg-[#EEEBFF] rounded-sm p-1 mb-3 col-span-12 gap-4  justify-between mx-4 mt-4"
            title="مدارک و مستندات عرضه و خرید"
            expanded={sellerAttachExpanded}
            onChange={(e: any, isOpen: boolean) =>
              setState({ sellerAttachExpanded: isOpen })
            }
          >
            {buyAndSellBasicData?.map((parentItem: any, index: any) => (
              <div className="grid col-span-10 grid-cols-12 gap-4  justify-between mx-4 mt-4 mb-4">
                <div className="col-span-12">
                  <span>{`${
                    parentItem?.committedType == 0 ? 'عرضه ' : 'خرید '
                  }${parentItem?.lastName} ${' '} ${
                    parentItem?.tableId
                  }`}</span>
                </div>
                <div className=" col-span-3  bg-lightGray py-2">
                  {requireAttachDataListOthers?.map((item: any) => {
                    return (
                      <div className="flex flex-row items-center px-4 py-1">
                        <div className="w-4">
                          <div
                            className={`w-4 h-4  rounded-full border-2 border-gray ${
                              uploadFileListItemOthers?.some(
                                (data: any) =>
                                  data?.attachTypeId === item?.id &&
                                  data?.tableId === parentItem?.tableId
                              )
                                ? 'bg-green'
                                : 'bg-red'
                            } `}
                          />
                        </div>
                        <span className="mr-4"> {item.name}</span>
                      </div>
                    );
                  })}
                </div>
                <div className=" col-span-9 grid grid-cols-6 ">
                  {uploadFileListItemOthers?.length > 0 &&
                    uploadFileListItemOthers?.map(
                      (item: any, index: any) =>
                        item?.tableId === parentItem?.tableId && (
                          <ImageUpload
                            className="2xl:col-span-3 xl:col-span-3 lg:col-span-3 md:col-span-6  col-span-3"
                            data={item}
                            onAlert={onAlert}
                            onDeleteFile={onDeleteFileListOthers}
                          />
                        )
                    )}
                </div>
              </div>
            ))}
          </Collapse>
        )}
      </div>
      <div className="flex justify-end my-4">
        <a
          href="/cartable"
          className="border-blue border  text-blue w-[100px] flex items-center justify-center ml-2 rounded"
        >
          بازگشت
        </a>
        {orderId && (
          <Button
            className="border-red border text-red w-[100px] flex items-center justify-center rounded ml-2"
            onClick={() => setState({ isModalCloseFormVisible: true })}
          >
            ابطال
          </Button>
        )}
        <Button
          className="border-blue border bg-blue text-white w-[100px]"
          onClick={onSubmitClick}
        >
          ثبت
        </Button>
      </div>
      <TrackingModal />
      <ConfirmModal
        handleOk={() => onCloseForm()}
        handleCancel={() => setState({ isModalCloseFormVisible: false })}
        isModalVisible={isModalCloseFormVisible}
        title={`آیا نسبت به ابطال درخواست خود اطمینان دارید؟`}
      />
    </div>
  );
}

export default withAlert(InitialSupplyTransaction);
