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
import {
  closeFormStock,
  geBrokerList,
  getClearingType,
  getInstrumentList,
  getPersonType,
  getTransferStockAttachType,
  getTransferStockByOrderId,
  getTransferStockType,
  saveTransferStockData,
} from '../../../../Controller';
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
import ImageUpload from 'apps/cash-market/src/components/ImageUpload';
import NewSelect from 'apps/cash-market/src/components/atoms/NewSelect';
import { Modal } from 'antd';
import { Popconfirm, Radio } from 'antd';
import { Modal as ConfirmModal } from '@tse/components/atoms';
import { HeaderTypes } from '@tse/types';

const initialState = {
  id: '',
  transferTypeList: [],
  transferTypeId: '',
  clearingTypeList: [],
  clearingTypeId: '',
  clearingTypeValue: '',
  clearingTypeError: false,
  symbolList: [],
  selectedInstrument: null,
  selectedInstrumentError: '',
  selectedInstrumentSymbol: '',
  companyName: '',
  tradeVolume: '',
  tradeVolumeError: '',
  tradePrice: '',
  tradePriceError: '',
  personalityType: [],
  buyerPersonTypeId: '',
  buyerPersonTypeError: '',
  buyerPersonTypeValue: '',
  buyerFname: '',
  disableBuyerFirstName: false,
  buyerFnameError: '',
  buyerLname: '',
  buyerLnameError: '',
  brokerList: [],
  buyerBroker: null,
  buyerBrokerError: '',
  buyerTraderCode: '',
  buyerTraderCodeError: '',
  buyerCode: '',
  buyerCodeError: '',
  buyerOldBourseCode: '',
  sellerPersonTypeId: '',
  sellerPersonTypeError: '',
  sellerPersonTypeIdValue: '',
  sellerFname: '',
  disableSellersFirstName: false,
  sellerFnameError: '',
  sellerLname: '',
  sellerLnameError: '',
  sellerBroker: null,
  sellerBrokerError: '',
  sellerTraderCode: '',
  sellerTraderCodeError: '',
  sellerCode: '',
  sellerOldBourseCode: '',
  responsibleName: '',
  responsibleNameError: '',
  responsiblePost: '',
  responsiblePostError: '',
  responsibleMobile: '',
  responsibleMobileError: '',
  fileDescription: '',
  fileDescriptionError: '',
  uploadFileError: false,
  uploadFileName: '',
  uploadFileLink: '',
  uploadFileId: '',
  uploadFileType: '',
  selectedDocumentType: '',
  selectedDocumentTypeName: '',
  allAttachTypeData: [],
  requireAttachDataList: [],
  uploadFileValidate: false,
  requireFileUploadComplete: false,
  isTrackingModalVisible: false,
  trackingNumber: 0,
  isModalCloseFormVisible: false,
  messages: [],
};

function RequestTransferStock({ onAlert }: any) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useStates<any>(initialState);
  const [uploadFileListItem, setUploadFileListItem] = useState<any>([]);
  const {
    id,
    transferTypeList,
    transferTypeId,
    clearingTypeList,
    clearingTypeId,
    clearingTypeValue,
    symbolList,
    selectedInstrument,
    selectedInstrumentSymbol,
    companyName,
    tradeVolume,
    tradePrice,
    personalityType,
    buyerPersonTypeId,
    buyerPersonTypeValue,
    buyerFname,
    disableBuyerFirstName,
    buyerLname,
    brokerList,
    buyerBroker,
    buyerTraderCode,
    buyerTraderCodeError,
    buyerCode,
    buyerOldBourseCode,
    sellerPersonTypeId,
    sellerPersonTypeIdValue,
    sellerFname,
    disableSellersFirstName,
    sellerLname,
    sellerBroker,
    sellerTraderCode,
    sellerTraderCodeError,
    sellerCode,
    sellerOldBourseCode,
    responsibleName,
    responsiblePost,
    responsibleMobile,
    fileDescription,
    uploadFileError,
    uploadFileName,
    uploadFileLink,
    uploadFileId,
    selectedDocumentType,
    selectedDocumentTypeName,
    allAttachTypeData,
    requireAttachDataList,
    uploadFileValidate,
    requireFileUploadComplete,
    isTrackingModalVisible,
    trackingNumber,
    uploadFileType,
    isModalCloseFormVisible,
    messages,
  } = state;
  const orderId =
    searchParams.get('id') != null ? searchParams.get('id') : null;
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
    getTransferStockTypeList();
    getClearingTypeList();
    getSymbolList('', 1);
    handleGetPersonType();
    getBroker('', 1);
    setState({ selectedInstrument: { symbol: '' } });
    if (orderId != null) {
      handleGetTransferStock(orderId);
    }
  }, []);
  useEffect(() => {
    if (orderId != null) {
      handleGetTransferStock(orderId);
    }
  }, [orderId]);
  useEffect(() => {
    ////////////////////////حقیقی
    if (buyerPersonTypeId === '25a0a62a-6a39-44b3-a8f6-cde56eb50f0a') {
      if (!buyerCode?.startsWith('9')) {
        setState({
          buyerCodeError: 'کد بورسی شخص حقیقی با 9 شروع می شود',
        });
      } else if (buyerCode?.length !== 11) {
        setState({
          buyerCodeError: 'تعداد ارقام باید 11 عدد باشد',
        });
      } else {
        setState({
          buyerCodeError: '',
        });
      }
      ////////////////////////حقوقی
    } else if (buyerPersonTypeId === 'cafd25d9-4948-4b97-b3ec-9761e4496e01') {
      if (!buyerCode?.startsWith('8')) {
        setState({
          buyerCodeError: 'کد بورسی شخص حقوقی با 8 شروع می شود',
        });
      } else if (buyerCode?.length !== 8) {
        setState({
          buyerCodeError: 'تعداد ارقام باید 8 عدد باشد',
        });
      } else {
        setState({
          buyerCodeError: '',
        });
      }
      /////////////////صندوق
    } else if (buyerPersonTypeId === '5882faca-e9d3-4329-b19c-c92eec610c62') {
      if (!buyerCode?.startsWith('6')) {
        setState({
          buyerCodeError: 'کد بورسی صندوق با 6 شروع می شود',
        });
      } else if (buyerCode?.length !== 7) {
        setState({
          buyerCodeError: 'تعداد ارقام باید 7 عدد باشد',
        });
      } else {
        setState({
          buyerCodeError: '',
        });
      }
    }
  }, [buyerCode, buyerPersonTypeId]);
  useEffect(() => {
    ////////////////////////حقیقی
    if (buyerPersonTypeId === '25a0a62a-6a39-44b3-a8f6-cde56eb50f0a') {
      setState({ disableBuyerFirstName: false });
      ////////////////////////حقوقی
    } else if (buyerPersonTypeId === 'cafd25d9-4948-4b97-b3ec-9761e4496e01') {
      setState({ disableBuyerFirstName: true });
      /////////////////صندوق
    } else if (buyerPersonTypeId === '5882faca-e9d3-4329-b19c-c92eec610c62') {
      setState({ disableBuyerFirstName: true });
    }
  }, [buyerPersonTypeId]);
  ////////////////////////////////////////////////////////////////////
  useEffect(() => {
    ////////////////////////حقیقی
    if (sellerPersonTypeId === '25a0a62a-6a39-44b3-a8f6-cde56eb50f0a') {
      if (!sellerCode?.startsWith('9')) {
        setState({
          sellerCodeError: 'کد بورسی شخص حقیقی با 9 شروع می شود',
        });
      } else if (sellerCode?.length !== 11) {
        setState({
          sellerCodeError: 'تعداد ارقام باید 11 عدد باشد',
        });
      } else {
        setState({
          sellerCodeError: '',
        });
      }
      ////////////////////////حقوقی
    } else if (sellerPersonTypeId === 'cafd25d9-4948-4b97-b3ec-9761e4496e01') {
      if (!sellerCode?.startsWith('8')) {
        setState({
          sellerCodeError: 'کد بورسی شخص حقوقی با 8 شروع می شود',
        });
      } else if (sellerCode?.length !== 8) {
        setState({
          sellerCodeError: 'تعداد ارقام باید 8 عدد باشد',
        });
      } else {
        setState({
          sellerCodeError: '',
        });
      }
      /////////////////صندوق
    } else if (sellerPersonTypeId === '5882faca-e9d3-4329-b19c-c92eec610c62') {
      if (!sellerCode?.startsWith('6')) {
        setState({
          sellerCodeError: 'کد بورسی صندوق با 6 شروع می شود',
        });
      } else if (sellerCode?.length !== 7) {
        setState({
          sellerCodeError: 'تعداد ارقام باید 7 عدد باشد',
        });
      } else {
        setState({
          sellerCodeError: '',
        });
      }
    }
  }, [sellerCode, sellerPersonTypeId]);
  useEffect(() => {
    ////////////////////////حقیقی
    if (sellerPersonTypeId === '25a0a62a-6a39-44b3-a8f6-cde56eb50f0a') {
      setState({ disableSellersFirstName: false });
      ////////////////////////حقوقی
    } else if (sellerPersonTypeId === 'cafd25d9-4948-4b97-b3ec-9761e4496e01') {
      setState({ disableSellersFirstName: true });
      /////////////////صندوق
    } else if (sellerPersonTypeId === '5882faca-e9d3-4329-b19c-c92eec610c62') {
      setState({ disableSellersFirstName: true });
    }
  }, [sellerPersonTypeId]);
  useEffect(() => {
    handleGetTransferStockAttachTypeList(transferTypeId);
    setUploadFileListItem([]);
  }, [transferTypeId]);
  useEffect(() => {
    checkRequiredData();
  }, [uploadFileListItem]);
  ////////////////////////////BuyerBrokerCondition////////////////////////////////////
  useEffect(() => {
    if (buyerBroker?.brokerCode != undefined) {
      setState({ buyerTraderCode: buyerBroker?.brokerCode });
    }
  }, [buyerBroker]);
  useEffect(() => {
    if (buyerBroker?.brokerCode != undefined) {
      if (!buyerTraderCode?.startsWith(buyerBroker?.brokerCode)) {
        setState({
          buyerTraderCodeError: `کد معامله گر خریدار باید با ${buyerBroker?.brokerCode} آغاز شود`,
        });
      } else if (buyerTraderCode?.length < 8) {
        setState({
          buyerTraderCodeError: `کد معامله گر خریدار باید 8 رقم باشد`,
        });
      }
    }
  }, [buyerTraderCode, buyerBroker]);
  ////////////////////////////SellerBrokerCondition////////////////////////////////////
  useEffect(() => {
    if (sellerBroker?.brokerCode != undefined) {
      setState({ sellerTraderCode: sellerBroker?.brokerCode });
    }
  }, [sellerBroker]);
  useEffect(() => {
    if (sellerBroker?.brokerCode != undefined) {
      if (!sellerTraderCode?.startsWith(sellerBroker?.brokerCode)) {
        setState({
          sellerTraderCodeError: `کد معامله گر فروشنده باید با ${sellerBroker?.brokerCode} آغاز شود`,
        });
      } else if (sellerTraderCode?.length < 8) {
        setState({
          sellerTraderCodeError: `کد معامله گر فروشنده باید 8 رقم باشد`,
        });
      }
    }
  }, [sellerTraderCode, sellerBroker]);
  const onFail = (error: any) => {
    onAlert(error);
  };
  const setErrorMessage = (key: string) => {
    const errorMessage = '  ';
    setState({ [`${key}Error`]: errorMessage });
  };
  function handleGetTransferStock(orderId: any) {
    getTransferStockByOrderId({
      orderId: orderId,
      onSuccess: (res) => {
        setState({
          id: res?.id,
          transferTypeId: res?.transferTypeId,
          clearingTypeId: res?.clearingTypeId,
          selectedInstrument: {
            instrumentId: res?.instrumentId,
            symbolCode: res?.symbolCode,
            symbol: res?.symbol,
            symbolName: res?.symbolName,
            companyName: res?.companyName,
          },
          companyName: res?.companyName,
          symbolCode: res?.symbolCode,
          tradeVolume: res?.tradeVolume,
          tradePrice: res?.tradePrice,
          buyerPersonTypeId: res?.buyerPersonTypeId,
          buyerFname: res?.buyerFname,
          buyerLname: res?.buyerLname,
          buyerBroker: {
            brokerId: res?.buyerBrokerId,
            brokerName: res?.buyerBrokerName,
          },
          buyerTraderCode: res?.buyerTraderCode,
          buyerCode: res?.buyerCode,
          buyerOldBourseCode: res?.buyerOldBourseCode,
          sellerPersonTypeId: res?.sellerPersonTypeId,
          sellerFname: res?.sellerFname,
          sellerLname: res?.sellerLname,
          sellerBroker: {
            brokerId: res?.sellerBrokerId,
            brokerName: res?.sellerBrokerName,
          },
          sellerTraderCode: res?.sellerTraderCode,
          sellerCode: res?.sellerCode,
          sellerOldBourseCode: res?.sellerOldBourseCode,
          responsibleName: res?.responsibleName,
          responsiblePost: res?.responsiblePost,
          responsibleMobile: res?.responsibleMobile,
          messages: res?.message,
        });
        //delete uploadFileListItem in useEffect transferTypeId
        setTimeout(() => {
          setUploadFileListItem(res?.transferStockFiles);
        }, 500);
      },
      onFail,
    });
  }
  const getTransferStockTypeList = () => {
    getTransferStockType({
      onSuccess: (res) => {
        setState({ transferTypeList: res, transferTypeId: res?.[0]?.id });
      },
      onFail,
    });
  };
  const getClearingTypeList = () => {
    getClearingType({
      onSuccess: (res) => {
        setState({ clearingTypeList: res });
      },
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
  const getBroker = (text: string, pageNo: number) => {
    const data = {
      SearchText: text,
      PageNumber: pageNo,
    };
    geBrokerList({
      data,
      onSuccess: (res: any) => {
        setState({
          brokerList: res,
        });
      },
      onFail,
    });
  };
  function handleGetTransferStockAttachTypeList(transferTypeId: any) {
    getTransferStockAttachType({
      transferTypeId,
      additionalDocument: false,
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
  const onUploadFileSubmit = () => {
    if (selectedDocumentType && uploadFileLink) {
      const uploadItem = {
        id: null,
        transferStocId: null,
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
  function onSubmitClick(): void {
    console.log('sellerBroker', sellerTraderCodeError);
    console.log('buyerBroker', buyerTraderCodeError);

    checkRequiredData();
    if (
      clearingTypeId &&
      selectedInstrument &&
      tradeVolume &&
      tradePrice &&
      buyerPersonTypeId &&
      // buyerFname &&
      buyerLname &&
      buyerBroker &&
      buyerTraderCode &&
      buyerCode &&
      sellerPersonTypeId &&
      // sellerFname &&
      sellerLname &&
      sellerBroker &&
      sellerTraderCode &&
      sellerCode &&
      responsibleName &&
      responsiblePost &&
      responsibleMobile &&
      requireFileUploadComplete == true &&
      buyerTraderCodeError == '' &&
      sellerTraderCodeError == ''
    ) {
      if (
        buyerPersonTypeId === '25a0a62a-6a39-44b3-a8f6-cde56eb50f0a' &&
        buyerFname == ''
      ) {
        setErrorMessage('buyerFname');
      } else if (
        sellerPersonTypeId === '25a0a62a-6a39-44b3-a8f6-cde56eb50f0a' &&
        sellerFname == ''
      ) {
        setErrorMessage('sellerFname');
      } else {
        const data = {
          id: orderId != null ? id : '00000000-0000-0000-0000-000000000000',
          orderId:
            orderId != null ? orderId : '00000000-0000-0000-0000-000000000000',
          transferTypeId,
          clearingTypeId,
          instrumentId: selectedInstrument?.instrumentId,
          symbolCode: selectedInstrument?.symbolCode,
          tradeVolume,
          tradePrice,
          buyerPersonTypeId,
          buyerFname,
          buyerLname,
          buyerBrokerId: buyerBroker?.brokerId,
          buyerTraderCode,
          buyerCode,
          buyerOldBourseCode,
          sellerPersonTypeId,
          sellerFname,
          sellerLname,
          sellerBrokerId: sellerBroker?.brokerId,
          sellerTraderCode,
          sellerCode,
          sellerOldBourseCode,
          responsibleName,
          responsiblePost,
          responsibleMobile,
          transferStockFiles: uploadFileListItem,
        };
        saveTransferStockData({ data, onSuccess: onSuccessSave, onFail });
      }
    } else {
      selectedInstrument?.symbol == '' && setErrorMessage('selectedInstrument');
      !clearingTypeId && setErrorMessage('clearingType');
      !tradeVolume && setErrorMessage('tradeVolume');
      !tradePrice && setErrorMessage('tradePrice');
      !buyerPersonTypeId && setErrorMessage('buyerPersonTypeId');
      // !buyerFname && setErrorMessage('buyerFname');
      !buyerLname && setErrorMessage('buyerLname');
      !buyerBroker && setErrorMessage('buyerBroker');
      !buyerTraderCode && setErrorMessage('buyerTraderCode');
      !buyerCode && setErrorMessage('buyerCode');
      !sellerPersonTypeId && setErrorMessage('sellerPersonTypeId');
      // !sellerFname && setErrorMessage('sellerFname');
      !sellerLname && setErrorMessage('sellerLname');
      !sellerBroker && setErrorMessage('sellerBroker');
      !sellerTraderCode && setErrorMessage('sellerTraderCode');
      !sellerCode && setErrorMessage('sellerCode');
      !responsibleName && setErrorMessage('responsibleName');
      !responsiblePost && setErrorMessage('responsiblePost');
      !responsibleMobile && setErrorMessage('responsibleMobile');
    }
  }
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
          title={'درخواست معامله خارج از ساعت'}
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
      <div className="border-2 border-lightGray w-full grid grid-cols-12">
        <div className=" col-span-12 items-start flex border-b-2 border-lightGray">
          <span className=" p-2 font-bold">درخواست معاملات خارج از ساعت</span>
        </div>
        <div className="2xl:col-span-12 xl:col-span-6 lg:col-span-4 md:col-span-5  col-span-12 ">
          <Radio.Group
            onChange={(e) => setState({ transferTypeId: e.target.value })}
            value={transferTypeId}
            style={{ marginBottom: 10, width: '100%', marginTop: 10 }}
          >
            {transferTypeList.map((item: any) => (
              <Radio className="text-extratiny" value={item.id}>
                {item.name}
              </Radio>
            ))}
          </Radio.Group>
        </div>
        <div className="grid col-span-12 grid-cols-10 gap-4 mt-8 justify-between mx-2 ">
          <div className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2">
            <NewSelect
              label="نوع تسویه"
              options={[{ name: '', id: '' }, ...clearingTypeList]}
              onChange={(value: any, e: any) => {
                setState({
                  clearingTypeId: value,
                  clearingTypeError: false,
                  clearingTypeValue: clearingTypeList.filter(
                    (item: any) => item?.id == value
                  )?.[0]?.name,
                });
              }}
              showKey="name"
              selectedKey="id"
              errorMessage={state?.clearingTypeError}
              value={clearingTypeId}
            />
          </div>
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
            readOnly
          />
          <TextField
            label="حجم معامله"
            className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={separator(tradeVolume)}
            onChange={(value: any) =>
              setState({
                tradeVolume: value,
                tradeVolumeError: '',
              })
            }
            required
            errorMessage={state?.tradeVolumeError}
            type="numeric"
          />
          <TextField
            label="قیمت"
            className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={separator(tradePrice)}
            onChange={(value: any) =>
              setState({
                tradePrice: value,
                tradePriceError: '',
              })
            }
            required
            errorMessage={state?.tradePriceError}
            type="numeric"
          />
        </div>
        <div className="grid col-span-12 grid-cols-10 gap-4  justify-between mx-2 mt-4">
          <div className=" col-span-10 items-start flex mt-4 ">
            <span className=" p-2 font-bold text-blue underline">
              اطلاعات خریدار :
            </span>
          </div>
          <div className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5 col-span-2">
            <NewSelect
              label="نوع شخصیت"
              className="col-span-2"
              options={[{ name: '', id: '' }, ...personalityType]}
              onChange={(value: any, e: any) => {
                setState({
                  buyerPersonTypeId: value,
                  buyerPersonTypeIdError: false,
                  buyerPersonTypeIdValue: personalityType.filter(
                    (item: any) => item?.id == value
                  )?.[0]?.name,
                });
              }}
              showKey="name"
              selectedKey="id"
              errorMessage={state?.buyerPersonTypeIdError}
              value={buyerPersonTypeId}
            />
          </div>
          {!disableBuyerFirstName && (
            <TextField
              label="نام خریدار"
              className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
              value={buyerFname}
              onChange={(value: any) =>
                setState({
                  buyerFname: value,
                  buyerFnameError: '',
                })
              }
              required
              errorMessage={state?.buyerFnameError}
            />
          )}
          <TextField
            label="نام خانوادگی / نام شرکت خریدار"
            className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={buyerLname}
            onChange={(value: any) =>
              setState({
                buyerLname: value,
                buyerLnameError: '',
              })
            }
            required
            errorMessage={state?.buyerLnameError}
          />
          <div className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2 flex-col flex">
            <NewSelectSearch
              className="col-span-3"
              label="کارگزار خریدار"
              onChange={(value: any) => {
                if (value?.brokerName != undefined) {
                  setState({
                    buyerBroker: value,
                    buyerBrokerError: '',
                  });
                } else if (value == '') {
                  setState({
                    buyerBroker: null,
                  });
                }
                getBroker(value, 1);
              }}
              value={buyerBroker}
              required
              error={state?.buyerBrokerError}
              data={brokerList?.items}
              showKey="brokerName"
            />
            {buyerBroker?.brokerCode ? (
              <span className="mt-10 font-extra-light text-blue">{`* کد کارگزار  : ${buyerBroker?.brokerCode}`}</span>
            ) : null}
          </div>
          <TextField
            label="کد معامله گر خریدار"
            className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={deSeparator(buyerTraderCode)}
            onChange={(value: any) => {
              setState({
                buyerTraderCode: value,
                buyerTraderCodeError: '',
              });
            }}
            required
            errorMessage={state?.buyerTraderCodeError}
            maxLength={8}
          />
          <TextField
            label="کد بورسی خریدار"
            className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={deSeparator(buyerCode)}
            onChange={(value: any) => {
              setState({
                buyerCode: value,
              });
            }}
            required
            errorMessage={state?.buyerCodeError}
          />
          <TextField
            label="کد بورسی قدیم"
            className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={buyerOldBourseCode}
            onChange={(value: any) => {
              setState({
                buyerOldBourseCode: value,
              });
            }}
          />
        </div>
        <div className="grid col-span-12 grid-cols-10 gap-4  justify-between mx-2 mt-4">
          <div className=" col-span-10 items-start flex mt-4 ">
            <span className=" p-2 font-bold text-blue underline">
              اطلاعات فروشنده :
            </span>
          </div>
          <div className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5 col-span-2">
            <NewSelect
              label="نوع شخصیت"
              className="col-span-2"
              options={[{ name: '', id: '' }, ...personalityType]}
              onChange={(value: any, e: any) => {
                setState({
                  sellerPersonTypeId: value,
                  sellerPersonTypeIdError: false,
                  sellerPersonTypeIdValue: personalityType.filter(
                    (item: any) => item?.id == value
                  )?.[0]?.name,
                });
              }}
              showKey="name"
              selectedKey="id"
              errorMessage={state?.sellerPersonTypeIdError}
              value={sellerPersonTypeId}
            />
          </div>

          {!disableSellersFirstName && (
            <TextField
              label="نام فروشنده"
              className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
              value={sellerFname}
              onChange={(value: any) =>
                setState({
                  sellerFname: value,
                  sellerFnameError: '',
                })
              }
              required
              errorMessage={state?.sellerFnameError}
            />
          )}
          <TextField
            label="نام خانوادگی / نام شرکت فروشنده"
            className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={sellerLname}
            onChange={(value: any) =>
              setState({
                sellerLname: value,
                sellerLnameError: '',
              })
            }
            required
            errorMessage={state?.sellerLnameError}
          />
          <div className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2 flex-col flex">
            <NewSelectSearch
              className="col-span-3"
              label="کارگزار فروشنده"
              onChange={(value: any) => {
                if (value?.brokerName != undefined) {
                  setState({
                    sellerBroker: value,
                    sellerBrokerError: '',
                  });
                } else if (value == '') {
                  setState({
                    sellerBroker: null,
                  });
                }
                getBroker(value, 1);
              }}
              value={sellerBroker}
              required
              error={state?.sellerBrokerError}
              data={brokerList?.items}
              showKey="brokerName"
            />
            {sellerBroker?.brokerCode ? (
              <span className="mt-10 font-extra-light text-blue">{`* کد کارگزار  : ${sellerBroker?.brokerCode}`}</span>
            ) : null}
          </div>
          <TextField
            label="کد معامله گر فروشنده"
            className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={deSeparator(sellerTraderCode)}
            onChange={(value: any) => {
              setState({
                sellerTraderCode: value,
                sellerTraderCodeError: '',
              });
            }}
            required
            errorMessage={state?.sellerTraderCodeError}
            maxLength={8}
          />
          <TextField
            label="کد بورسی فروشنده"
            className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={deSeparator(sellerCode)}
            onChange={(value: any) => {
              setState({
                sellerCode: value,
              });
            }}
            required
            errorMessage={state?.sellerCodeError}
          />
          <TextField
            label="کد بورسی قدیم"
            className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={sellerOldBourseCode}
            onChange={(value: any) => {
              setState({
                sellerOldBourseCode: value,
              });
            }}
          />
        </div>
        <div className="grid col-span-12 grid-cols-10 gap-4  justify-between mx-2 mt-4">
          <div className=" col-span-10 items-start flex mt-4 ">
            <span className=" p-2 font-bold text-blue underline">
              اطلاعات رابط :
            </span>
          </div>
          <TextField
            label="نام و نام خانوادگی"
            className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={responsibleName}
            onChange={(value: any) =>
              setState({
                responsibleName: value,
                responsibleNameError: '',
              })
            }
            required
            errorMessage={state?.responsibleNameError}
          />
          <TextField
            label="سمت"
            className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={responsiblePost}
            onChange={(value: any) =>
              setState({
                responsiblePost: value,
                responsiblePostError: '',
              })
            }
            required
            errorMessage={state?.responsiblePostError}
          />

          <TextField
            label="شماره همراه"
            className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={deSeparator(responsibleMobile)}
            onChange={(value: any) =>
              setState({
                responsibleMobile: value,
                responsibleMobileError: '',
              })
            }
            required
            errorMessage={state?.responsibleMobileError}
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
                value={selectedDocumentType}
                errorMessage={state?.selectedDocumentTypeError}
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
            <div className=" 2xl:col-span-3 xl:col-span-2 lg:col-span-4 md:col-span-5  col-span-2 flex rounded-full ml-2 justify-end">
              <Button
                className="border-green border text-white bg-green w-[110px]"
                onClick={onUploadFileSubmit}
              >
                بارگذاری مدارک
              </Button>
            </div>
          </div>
          <div className="grid col-span-10 grid-cols-12 gap-4  justify-between mx-4 mt-4 mb-4">
            <div className=" col-span-3  bg-lightGray py-2">
              {requireAttachDataList.map((item: any) => {
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
                uploadFileListItem.map((item: any, index: any) => (
                  <ImageUpload
                    className="2xl:col-span-3 xl:col-span-3 lg:col-span-3 md:col-span-6  col-span-3"
                    data={item}
                    onAlert={onAlert}
                    onDeleteFile={onDeleteFileList}
                  />
                ))}
            </div>
          </div>
        </div>
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
export default withAlert(RequestTransferStock);
