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
import {
  Button,
  Icon,
  Upload,
  Image,
  CheckList,
  NewSelectSearch,
} from '@tse/components/atoms';
import {
  getInstrumentList,
  geBrokerList,
  getBlockAttachType,
  getPersonType,
  saveDraftBlockData,
  getTransferBlocksByOrderId,
  saveBlockData,
  closeFormStock,
} from 'apps/cash-market/src/Controller';
import ImageUpload from 'apps/cash-market/src/components/ImageUpload';
import NewSelect from 'apps/cash-market/src/components/atoms/NewSelect';
import { Modal } from 'antd';
import { Modal as ConfirmModal } from '@tse/components/atoms';
import { HeaderTypes } from '@tse/types';

const initialState = {
  id: '',
  imageMouseEnter: false,
  companyName: '',
  companyNameError: '',
  transactionVolume: '',
  transactionVolumeError: '',
  price: '',
  priceError: '',
  selectedBuyersPersonalityType: '',
  selectedBuyersPersonalityTypeError: false,
  selectedBuyersPersonalityTypeValue: '',
  selectedSellersPersonalityType: '',
  selectedSellersPersonalityTypeError: false,
  selectedSellersPersonalityTypeValue: '',
  buyersName: '',
  disableBuyerFirstName: false,
  buyersNameError: '',
  buyerFamilyName: '',
  buyerFamilyNameError: '',
  selectedBuyersAgent: null,
  selectedSellersAgent: null,
  buyersExchangeCode: '',
  buyersExchangeCodeError: '',
  sellersName: '',
  disableSellersFirstName: false,
  sellersNameError: '',
  sellersFamily: '',
  sellersFamilyError: '',
  sellersExchangeCode: '',
  sellersExchangeCodeError: '',
  connectorFamily: '',
  connectorFamilyError: '',
  connectorPosition: '',
  connectorPositionError: '',
  connectorPhoneNumber: '',
  connectorPhoneNumberError: '',
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
  selectedInstrumentSymbol: '',
  selectedInstrumentCompany: '',
  selectedDocumentType: '',
  selectedDocumentTypeName: '',
  brokerList: null,
  selectedBuyersAgentError: '',
  selectedSellersAgentError: '',
  allAttachTypeData: [],
  requireAttachDataList: [],
  personalityType: [],
  uploadFileValidate: false,
  requireFileUploadComplete: false,
  isTrackingModalVisible: false,
  trackingNumber: 0,
  isModalCloseFormVisible: false,
  messages: [],
};

function BlockTransaction({ onAlert }: any) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useStates<any>(initialState);
  const {
    id,
    imageMouseEnter,
    companyName,
    transactionVolume,
    price,
    selectedBuyersPersonalityType,
    buyersName,
    buyerFamilyName,
    selectedBuyersAgent,
    buyersExchangeCode,
    buyersExchangeCodeError,
    selectedSellersPersonalityType,
    sellersName,
    sellersFamily,
    sellersExchangeCode,
    sellersExchangeCodeError,
    connectorFamily,
    connectorPosition,
    connectorPhoneNumber,
    fileDescription,
    uploadFileError,
    uploadFileName,
    uploadFileLink,
    uploadFileId,
    selectedInstrument,
    symbolList,
    selectedInstrumentSymbol,
    selectedInstrumentCompany,
    selectedDocumentType,
    selectedDocumentTypeName,
    brokerList,
    selectedBuyersAgentError,
    selectedSellersAgent,
    selectedSellersAgentError,
    allAttachTypeData,
    requireAttachDataList,
    personalityType,
    uploadFileValidate,
    requireFileUploadComplete,
    selectedBuyersPersonalityTypeValue,
    selectedSellersPersonalityTypeValue,
    isTrackingModalVisible,
    trackingNumber,
    uploadFileType,
    disableBuyerFirstName,
    disableSellersFirstName,
    isModalCloseFormVisible,
    messages,
  } = state;
  const [uploadFileListItem, setUploadFileListItem] = useState<any>([]);
  const editMode: any = searchParams.get('editMode');
  const orderId =
    searchParams.get('id') != null ? searchParams.get('id') : null;
  const columns: HeaderTypes[] = [
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
    setState({ selectedInstrument: { symbol: '' } });
    handleGetBlockAttachType();
    handleGetPersonType();
    if (orderId != null) {
      handleGetTransferBlock(orderId);
    }
  }, []);
  function handleGetTransferBlock(orderId: any) {
    getTransferBlocksByOrderId({
      orderId: orderId,
      onSuccess: (blockData) => {
        setUploadFileListItem(blockData?.transferBlockFile);
        setState({
          id: blockData?.id,
          selectedInstrument: {
            instrumentId: blockData?.instrumentId,
            symbolCode: blockData?.symbolCode,
            symbol: blockData?.symbol,
            symbolName: blockData?.symbolName,
            companyName: blockData?.companyName,
          },
          companyName: blockData?.companyName,
          transactionVolume: blockData?.tradeVolume,
          price: blockData?.tradePrice,
          selectedBuyersPersonalityType: blockData?.buyerPersonTypeId,
          selectedBuyersPersonalityTypeValue: blockData?.buyerPersonTypeValue,
          buyersName: blockData?.buyerFname,
          buyerFamilyName: blockData?.buyerLname,
          selectedBuyersAgent: {
            brokerId: blockData?.buyerBrokerId,
            brokerName: blockData?.buyerBrokerName,
          },
          buyersExchangeCode: blockData?.buyerCode,
          selectedSellersPersonalityType: blockData?.sellerPersonTypeId,
          selectedSellersPersonalityTypeValue: blockData?.sellerPersonTypeValue,
          sellersName: blockData?.sellerFname,
          sellersFamily: blockData?.sellerLname,
          selectedSellersAgent: {
            brokerId: blockData?.sellerBrokerId,
            brokerName: blockData?.sellerBrokerName,
          },
          sellersExchangeCode: blockData?.sellerCode,
          connectorFamily: blockData?.responsibleName,
          connectorPosition: blockData?.responsiblePost,
          connectorPhoneNumber: blockData?.responsibleMobile,
          messages: blockData?.message,
        });
      },
      onFail,
    });
  }
  useEffect(() => {
    checkRequiredData();
  }, [uploadFileListItem]);
  useEffect(() => {
    ////////////////////////حقیقی
    if (
      selectedBuyersPersonalityType === '25a0a62a-6a39-44b3-a8f6-cde56eb50f0a'
    ) {
      setState({ disableBuyerFirstName: false });
      if (!buyersExchangeCode?.startsWith('9')) {
        setState({
          buyersExchangeCodeError: 'کد بورسی شخص حقیقی با 9 شروع می شود',
        });
      } else if (buyersExchangeCode.length !== 11) {
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
      setState({ disableBuyerFirstName: true });
      if (!buyersExchangeCode?.startsWith('8')) {
        setState({
          buyersExchangeCodeError: 'کد بورسی شخص حقوقی با 8 شروع می شود',
        });
      } else if (buyersExchangeCode.length !== 8) {
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
      setState({ disableBuyerFirstName: true });
      if (!buyersExchangeCode?.startsWith('6')) {
        setState({
          buyersExchangeCodeError: 'کد بورسی صندوق با 6 شروع می شود',
        });
      } else if (buyersExchangeCode.length !== 7) {
        setState({
          buyersExchangeCodeError: 'تعداد ارقام باید 7 عدد باشد',
        });
      } else {
        setState({
          buyersExchangeCodeError: '',
        });
      }
    }
  }, [buyersExchangeCode]);
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

  ////////////////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    ////////////////////////حقیقی
    if (
      selectedSellersPersonalityType === '25a0a62a-6a39-44b3-a8f6-cde56eb50f0a'
    ) {
      setState({ disableSellersFirstName: false });
      if (!sellersExchangeCode?.startsWith('9')) {
        setState({
          sellersExchangeCodeError: 'کد بورسی شخص حقیقی با 9 شروع می شود',
        });
      } else if (sellersExchangeCode.length !== 11) {
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
      setState({ disableSellersFirstName: true });
      if (!sellersExchangeCode?.startsWith('8')) {
        setState({
          sellersExchangeCodeError: 'کد بورسی شخص حقوقی با 8 شروع می شود',
        });
      } else if (sellersExchangeCode.length !== 8) {
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
      setState({ disableSellersFirstName: true });
      if (!sellersExchangeCode?.startsWith('6')) {
        setState({
          sellersExchangeCodeError: 'کد بورسی صندوق با 6 شروع می شود',
        });
      } else if (sellersExchangeCode.length !== 7) {
        setState({
          sellersExchangeCodeError: 'تعداد ارقام باید 7 عدد باشد',
        });
      } else {
        setState({
          sellersExchangeCodeError: '',
        });
      }
    }
  }, [sellersExchangeCode]);
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
  }, [selectedSellersPersonalityType]);
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
  function handleGetBlockAttachType() {
    getBlockAttachType({
      onSuccess: (res) => {
        setState({
          allAttachTypeData: res,
          requireAttachDataList: res.filter(
            (item: any) => item.isRequired == true
          ),
        });
      },
      onFail,
    });
  }
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
    const errorMessage = '  ';
    setState({ [`${key}Error`]: errorMessage });
  };
  const onUploadFileSubmit = () => {
    if (selectedDocumentType && uploadFileLink) {
      const uploadItem = {
        id: null,
        transferBlockId: null,
        attachTypeId: selectedDocumentType,
        description: fileDescription,
        fileId: uploadFileId,
        uploadFileLink: uploadFileLink,
        attachTypeName: selectedDocumentTypeName,
        uploadFileType: uploadFileType,
        fileName: uploadFileName,
      };
      setUploadFileListItem((item: any) => [...item, uploadItem]);
      setState({
        selectedDocumentTypeName: '',
        fileDescription: '',
        uploadFileName: '',
        uploadFileLink: '',
        selectedDocumentType: '',
      });
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
  function onSubmitClick(): void {
    checkRequiredData();
    if (
      selectedInstrument &&
      transactionVolume &&
      price &&
      selectedBuyersPersonalityType &&
      // buyersName &&
      buyerFamilyName &&
      selectedBuyersAgent &&
      // buyersExchangeCode &&
      selectedSellersPersonalityType &&
      // sellersName &&
      sellersFamily &&
      selectedSellersAgent &&
      // sellersExchangeCode &&
      connectorFamily &&
      connectorPosition &&
      connectorPhoneNumber &&
      requireFileUploadComplete == true
      // buyersExchangeCodeError == '' &&
      // sellersExchangeCodeError == ''
    ) {
      if (
        selectedBuyersPersonalityType ===
          '25a0a62a-6a39-44b3-a8f6-cde56eb50f0a' &&
        buyersName == ''
      ) {
        setErrorMessage('buyersName');
      } else if (
        selectedSellersPersonalityType ===
          '25a0a62a-6a39-44b3-a8f6-cde56eb50f0a' &&
        sellersName == ''
      ) {
        setErrorMessage('sellersName');
      } else {
        const data = {
          id: orderId != null ? id : '00000000-0000-0000-0000-000000000000',
          orderId:
            orderId != null ? orderId : '00000000-0000-0000-0000-000000000000',
          instrumentId: selectedInstrument?.instrumentId,
          symbolCode: selectedInstrument?.symbolCode,
          tradeVolume: transactionVolume,
          tradePrice: price,
          buyerPersonTypeId: selectedBuyersPersonalityType,
          buyerFname: buyersName,
          buyerLname: buyerFamilyName,
          buyerBrokerId: selectedBuyersAgent?.brokerId,
          buyerCode: buyersExchangeCode === '' ? null : buyersExchangeCode,
          sellerPersonTypeId: selectedSellersPersonalityType,
          sellerFname: sellersName,
          sellerLname: sellersFamily,
          sellerBrokerId: selectedSellersAgent?.brokerId,
          sellerCode: sellersExchangeCode === '' ? null : sellersExchangeCode,
          responsibleName: connectorFamily,
          responsiblePost: connectorPosition,
          responsibleMobile: connectorPhoneNumber,
          transferBlockFile: uploadFileListItem,
        };
        saveBlockData({ data, onSuccess: onSuccessSave, onFail });
      }
    } else {
      selectedInstrument?.symbol == '' && setErrorMessage('selectedInstrument');
      !companyName && setErrorMessage('companyName');
      !transactionVolume && setErrorMessage('transactionVolume');
      !price && setErrorMessage('price');
      !selectedBuyersPersonalityType &&
        setState({ selectedBuyersPersonalityTypeError: true });
      // !buyersName && setErrorMessage('buyersName');
      !buyerFamilyName && setErrorMessage('buyerFamilyName');
      !selectedBuyersAgent && setErrorMessage('selectedBuyersAgent');
      // !buyersExchangeCode && setErrorMessage('buyersExchangeCode');
      !selectedSellersPersonalityType &&
        setState({ selectedSellersPersonalityTypeError: true });
      // !sellersName && setErrorMessage('sellersName');
      !sellersFamily && setErrorMessage('sellersFamily');
      !selectedSellersAgent && setErrorMessage('selectedSellersAgent');
      // !sellersExchangeCode && setErrorMessage('sellersExchangeCode');
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
  function onDraftClick(): void {
    const data = {
      instrumentId: selectedInstrument?.instrumentId,
      symbolCode: selectedInstrument?.symbolCode,
      tradeVolume: transactionVolume,
      tradePrice: price,
      buyerPersonTypeId: selectedBuyersPersonalityType,
      buyerFname: buyersName,
      buyerLname: buyerFamilyName,
      buyerBrokerId: selectedBuyersAgent?.brokerId,
      buyerCode: buyersExchangeCode,
      sellerPersonTypeId: selectedSellersPersonalityType,
      sellerFname: sellersName,
      sellerLname: sellersFamily,
      sellerBrokerId: selectedSellersAgent?.brokerId,
      sellerCode: sellersExchangeCode,
      responsibleName: connectorFamily,
      responsiblePost: connectorPosition,
      responsibleMobile: connectorPhoneNumber,
      transferBlockFile: uploadFileListItem,
    };
    saveDraftBlockData({ data, onSuccess: onSuccessSaveDraft, onFail });
  }
  const onSuccessSaveDraft = (res: any) => {
    onAlert({
      message: `اطلاعات وارد شده با کد پیگیری ${res?.trackingNumber} به صورت موقت ذخیره گردید.`,
      type: 'success',
    });
    navigate('/cartable');
  };
  const checkRequiredData = () => {
    const notAvailable: any = [];
    requireAttachDataList?.map((item: any) => {
      uploadFileListItem?.some((data: any) => data?.attachTypeId === item?.id)
        ? null
        : notAvailable.push(item);
    });
    if (notAvailable.length > 0) {
      setState({ uploadFileValidate: true, requireFileUploadComplete: false });
    } else {
      setState({ uploadFileValidate: false, requireFileUploadComplete: true });
    }
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
          title={'درخواست معامله بلوک'}
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
      <div className="border-2 border-lightGray">
        <div className="w-full grid grid-cols-12 ">
          <div className=" col-span-12 items-start flex border-b-2 border-lightGray">
            <span className=" p-2 font-bold">
              درخواست معامله بلوک - خارج از اتاق
            </span>
          </div>
          <div className="grid col-span-12 grid-cols-10 gap-4 justify-between mx-4 mt-4">
            <SymbolModal
              className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
              data={symbolList}
              onChange={(pageNo: number, text: string) =>
                getSymbolList(text, pageNo)
              }
              onSubmit={(value: any) => {
                setState({
                  selectedInstrumentSymbol: value?.symbol,
                  companyName: value?.symbolName,
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
              className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
              value={companyName}
              onChange={(value: any) =>
                setState({
                  companyName: value,
                  companyNameError: '',
                })
              }
              // required
              // errorMessage={state?.companyNameError}
              readOnly
            />
            <TextField
              label="حجم معامله"
              className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
              value={separator(transactionVolume)}
              onChange={(value: any) =>
                setState({
                  transactionVolume: value,
                  transactionVolumeError: '',
                })
              }
              required
              errorMessage={state?.transactionVolumeError}
              type="numeric"
            />
            <TextField
              label="قیمت"
              className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
              value={separator(price)}
              onChange={(value: any) =>
                setState({
                  price: value,
                  priceError: '',
                })
              }
              required
              errorMessage={state?.priceError}
              type="numeric"
            />
          </div>
        </div>
        <div className="grid col-span-12 grid-cols-10 gap-4  justify-between mx-4 mt-4">
          <div className=" col-span-10 items-start flex mt-4 ">
            <span className=" p-2 font-bold text-blue underline">
              اطلاعات خریدار :
            </span>
          </div>
          <div className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5 col-span-2">
            <NewSelect
              label="نوع شخصیت"
              className="col-span-2"
              // options={personalityType}
              options={[{ name: '', id: '' }, ...personalityType]}
              onChange={(value: any, e: any) => {
                setState({
                  selectedBuyersPersonalityType: value,
                  selectedBuyersPersonalityTypeError: false,
                  selectedBuyersPersonalityTypeValue: personalityType.filter(
                    (item: any) => item?.id == value
                  )?.[0]?.name,
                });
              }}
              showKey="name"
              selectedKey="id"
              errorMessage={state?.selectedBuyersPersonalityTypeError}
              value={selectedBuyersPersonalityType}
            />
          </div>
          {!disableBuyerFirstName && (
            <TextField
              label="نام خریدار"
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
            label="نام خانوادگی / نام شرکت خریدار"
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
          <div className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2 flex-col flex">
            <NewSelectSearch
              className="col-span-3"
              label="کارگزار خریدار"
              onChange={(value: any) => {
                if (value?.brokerName != undefined) {
                  setState({
                    selectedBuyersAgent: value,
                    selectedBuyersAgentError: '',
                  });
                } else if (value == '') {
                  setState({
                    selectedBuyersAgent: null,
                  });
                }
                getBroker(value, 1);
              }}
              value={selectedBuyersAgent}
              required
              error={selectedBuyersAgentError}
              data={brokerList?.items}
              showKey="brokerName"
            />
            {selectedBuyersAgent?.brokerCode ? (
              <span className="mt-10 font-extra-light text-blue">{`* کد کارگزار  : ${selectedBuyersAgent?.brokerCode}`}</span>
            ) : null}
          </div>
          <TextField
            label="کد بورسی"
            className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={deSeparator(buyersExchangeCode)}
            onChange={(value: any) => {
              setState({
                buyersExchangeCode: value,
              });
            }}
            // required
            errorMessage={state?.buyersExchangeCodeError}
            // type="numeric"
          />
        </div>
        <div className="grid col-span-12 grid-cols-10 gap-4  justify-between mx-4 mt-4">
          <div className=" col-span-10 items-start flex mt-4 ">
            <span className=" p-2 font-bold text-blue underline">
              اطلاعات فروشنده :
            </span>
          </div>
          <div className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2">
            <NewSelect
              label="نوع شخصیت"
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
              label="نام فروشنده"
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
            label="نام خانوادگی/نام شرکت فروشنده"
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
          <div className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2 flex-col flex">
            <NewSelectSearch
              className="col-span-3"
              label="کارگزار فروشنده"
              onChange={(value: any) => {
                if (value?.brokerName != undefined) {
                  setState({
                    selectedSellersAgent: value,
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
              error={selectedSellersAgentError}
              data={brokerList?.items}
              showKey="brokerName"
            />
            {selectedSellersAgent?.brokerCode ? (
              <span className="mt-10 font-extra-light text-blue">{`* کد کارگزار  : ${selectedSellersAgent?.brokerCode}`}</span>
            ) : null}
          </div>
          <TextField
            label="کد بورسی"
            className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={deSeparator(sellersExchangeCode)}
            onChange={(value: any) => {
              setState({
                sellersExchangeCode: value,
              });
            }}
            // required
            errorMessage={state?.sellersExchangeCodeError}
            // type="number"
          />
        </div>
        <div className="grid col-span-12 grid-cols-10 gap-4  justify-between mx-4 mt-4">
          <div className=" col-span-10 items-start flex mt-4 ">
            <span className=" p-2 font-bold text-blue underline">
              اطلاعات رابط :
            </span>
          </div>

          <TextField
            label="نام و نام خانوادگی"
            className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
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
            className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
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
            className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
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
                columns={columns}
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
            <span className=" p-2 font-bold text-blue underline">مدارک :</span>
            <span className="p-2 text-red ">
              {uploadFileValidate
                ? 'مدارک را به طور کامل بارگذاری نمایید.'
                : ''}
            </span>
          </div>
          <div className="grid grid-cols-12 col-span-12 gap-4  items-center border-2 border-lightGray  p-6 ">
            <div className="2xl:col-span-3 xl:col-span-4 lg:col-span-5 md:col-span-6 col-span-3 mx-4">
              <NewSelect
                label="نوع مدرک"
                className=" col-span-3"
                options={[{ name: '', id: '' }, ...allAttachTypeData]}
                onChange={(value: any) => {
                  setState({
                    selectedDocumentType: value,
                    selectedDocumentTypeError: false,
                    selectedDocumentTypeName: allAttachTypeData.filter(
                      (item: any) => item?.id === value
                    )?.[0]?.name,
                  });
                }}
                showKey="name"
                selectedKey="id"
                errorMessage={state?.selectedDocumentTypeError}
                value={selectedDocumentType}
              />
            </div>

            <TextField
              label="توضیحات"
              className="2xl:col-span-2 xl:col-span-4 lg:col-span-5 md:col-span-6  col-span-2"
              value={fileDescription}
              onChange={(value: any) =>
                setState({
                  fileDescription: value,
                  fileDescriptionError: '',
                })
              }
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
            <div className=" 2xl:col-span-3 xl:col-span-2 lg:col-span-4 md:col-span-5  col-span-2 flex rounded-full ml-2 justify-end">
              <Button
                className="border-green border text-white bg-green w-[110px]"
                onClick={onUploadFileSubmit}
              >
                بارگذاری مدارک
              </Button>
            </div>
          </div>
        </div>
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
            {uploadFileListItem.length > 0 &&
              uploadFileListItem?.map((item: any, index: any) => (
                <ImageUpload
                  className="2xl:col-span-3 xl:col-span-3 lg:col-span-6 md:col-span-6  col-span-3"
                  data={item}
                  onAlert={onAlert}
                  onDeleteFile={onDeleteFileList}
                />
              ))}
          </div>
        </div>
      </div>
      <div className="flex justify-end  my-4">
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

export default withAlert(BlockTransaction);
