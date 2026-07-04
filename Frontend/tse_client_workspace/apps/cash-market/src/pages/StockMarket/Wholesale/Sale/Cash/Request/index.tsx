import withAlert from 'apps/cash-market/src/hoc/withAlert';
import {
  useStates,
  useEffect,
  useState,
  useNavigate,
  useSearchParams,
} from '@tse/utils';
import { Modal, Popconfirm, Radio } from 'antd';
import { SymbolModal, Table } from '@tse/components/organism';
import {
  Button,
  Collapse,
  Icon,
  TextField,
  Upload,
} from '@tse/components/atoms';
import { Modal as ConfirmModal } from '@tse/components/atoms';
import { DatePicker } from '@tse/components/molecules';
import {
  closeFormStock,
  geBrokerList,
  getFundList,
  getInstrumentList,
  getPersonType,
  uploadFile,
} from 'apps/cash-market/src/Controller';
import { HeaderTypes } from '@tse/types';
import {
  convertDateToJalali,
  deSeparator,
  generateRandomNumber,
  separator,
} from '@tse/tools';
import NewSelect from 'apps/cash-market/src/components/atoms/NewSelect';
import {
  getWholeSale,
  getWholeSaleAttachType,
  getWholeSaleTradeTypes,
  getWholeSaleType,
  saveWholeSale,
} from 'apps/cash-market/src/Controller/StockMarket/WholeSale';
import ImageUpload from 'apps/cash-market/src/components/ImageUpload';

const initialState = {
  id: '',
  wholesaleType: '',
  wholesaleTypeList: [],
  wholeSaleTradeTypesList: [],
  wholeSaleTradeTypes: '',
  selectedInstrument: null,
  selectedInstrumentError: '',
  selectedInstrumentSymbol: '',
  symbolList: [],
  companyName: '',
  companyNameError: '',
  investment: '',
  tradeVolume: '',
  tradePercent: '',
  basePrice: '',
  cashSharePercentCondition: '',
  cashSharePercentConditionError: '',
  tradeDate: '',
  tradeDateError: '',
  personalityType: [],
  personTypeId: '',
  personTypeIdError: false,
  personTypeName: '',
  sellerName: '',
  disableSellerName: false,
  sellerNameError: '',
  sellerFamily: '',
  sellerFamilyError: '',
  sellerCode: '',
  sellerCodeError: '',
  shareCount: '',
  shareCountError: '',
  cashSharePercent: '',
  cashSharePercentError: '',
  sumOfCashSharePercent: '',
  wholesaleSellers: [],
  tableEditItemId: null,
  responsibleName: '',
  responsiblePost: '',
  responsibleMobile: '',
  fileDescription: '',
  fileDescriptionError: '',
  uploadFileError: false,
  uploadFileName: '',
  uploadFileLink: '',
  uploadFileId: '',
  uploadFileType: '',
  uploadFileValidate: false,
  requireFileUploadComplete: false,
  uploadFileValidateOthers: false,
  requireFileUploadCompleteOthers: false,
  selectedDocumentTypeIsMultiple: false,
  selectedDocumentType: '',
  selectedDocumentTypeName: '',
  allAttachTypeData: [],
  requireAttachDataList: [],
  requireAttachDataListOthers: [],
  publicAttachExpanded: true,
  fileSelectOther: [],
  selectedFileOther: '',
  selectedFileOtherError: '',
  selectedFileOtherValue: '',
  isTrackingModalVisible: false,
  sellerAttachExpanded: false,
  trackingNumber: '',
  wholeSaleCondition: false,
  wholesaleSellersState: [],
  publicMessages: null,
  isModalCloseFormVisible: false,
};
function WholesaleCashRequest({ onAlert }: any) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId =
    searchParams.get('id') != null ? searchParams.get('id') : null;
  const [state, setState] = useStates<any>(initialState);
  const [uploadFileListItem, setUploadFileListItem] = useState<any>([]);
  const [uploadFileListItemOthers, setUploadFileListItemOthers] = useState<any>(
    []
  );
  const {
    id,
    wholesaleType,
    wholesaleTypeList,
    wholeSaleTradeTypes,
    wholeSaleTradeTypesList,
    selectedInstrument,
    selectedInstrumentSymbol,
    symbolList,
    companyName,
    investment,
    tradeVolume,
    tradePercent,
    basePrice,
    cashSharePercentCondition,
    tradeDate,
    personalityType,
    personTypeId,
    personTypeName,
    sellerName,
    disableSellerName,
    sellerFamily,
    sellerCode,
    shareCount,
    cashSharePercent,
    sumOfCashSharePercent,
    wholesaleSellers,
    tableEditItemId,
    responsibleName,
    responsiblePost,
    responsibleMobile,
    fileDescription,
    uploadFileError,
    uploadFileName,
    uploadFileLink,
    uploadFileId,
    uploadFileType,
    uploadFileValidate,
    requireFileUploadComplete,
    uploadFileValidateOthers,
    requireFileUploadCompleteOthers,
    selectedDocumentTypeIsMultiple,
    selectedDocumentType,
    selectedDocumentTypeName,
    allAttachTypeData,
    requireAttachDataList,
    requireAttachDataListOthers,
    publicAttachExpanded,
    fileSelectOther,
    selectedFileOther,
    selectedFileOtherError,
    selectedFileOtherValue,
    isTrackingModalVisible,
    sellerAttachExpanded,
    trackingNumber,
    wholeSaleCondition,
    wholesaleSellersState,
    publicMessages,
    isModalCloseFormVisible,
  } = state;
  const messageHeader = [
    {
      title: 'متن پیام',
      dataIndex: 'comment',
      key: 'comment',
      className: 'col-span-7',
    },
    {
      title: 'تاریخ ارسال',
      dataIndex: 'commentDate',
      key: 'commentDate',
      className: 'col-span-2',
      render: (item: any) => <span>{convertDateToJalali(item)}</span>,
    },
    {
      title: 'فرستنده',
      dataIndex: 'marketUserName',
      key: 'marketUserName',
      className: 'col-span-2',
    },
  ];
  useEffect(() => {
    setState({ selectedInstrument: { symbol: '' } });
    getSymbolList('', 1);

    getWholeSaleTradeTypesList();
    getWholeSaleTypesList();
    handleGetPersonType();
    if (orderId != null) {
      handleGetWholeSale(orderId);
    }
  }, []);
  useEffect(() => {
    const newArray = wholesaleSellers?.map((item: any) => {
      return {
        tableId: item.tableId,
        id: item.tableId,
        name: item?.sellerName + ' ' + item.tableId,
      };
    });
    const sumOfCashSharePercent = parseFloat(
      wholesaleSellers
        ?.reduce(
          (acc: number, curr: any) =>
            acc + parseFloat(curr.cashSharePercent || 0),
          0
        )
        .toFixed(2)
    );
    const normalizedSum =
      sumOfCashSharePercent >= 99.9 && sumOfCashSharePercent <= 100.1
        ? 100
        : sumOfCashSharePercent;
    setState({
      fileSelectOther: newArray,
      sumOfCashSharePercent: normalizedSum,
    });
  }, [wholesaleSellers]);
  useEffect(() => {
    if (wholesaleType === '25e89117-17a8-465d-a1fb-2f1a80888773') {
      setState({ wholeSaleCondition: true });
    } else {
      setState({ wholeSaleCondition: false });
    }
    handleGetWholeSaleAttachType();
  }, [wholesaleType]);
  useEffect(() => {
    if (wholeSaleCondition === true) {
      if (parseInt(cashSharePercentCondition) < 10) {
        setState({
          cashSharePercentConditionError:
            'درصد انتخاب شده کمتر از 10% نمی تواند باشد',
        });
      } else if (parseInt(cashSharePercentCondition) > 100) {
        setState({
          cashSharePercentConditionError:
            'درصد انتخاب شده بیشتر از حد مجاز است',
        });
      } else {
        setState({
          cashSharePercentConditionError: '',
        });
      }
    }
  }, [cashSharePercentCondition]);
  useEffect(() => {
    checkRequiredData();
  }, [uploadFileListItem, requireAttachDataList]);
  useEffect(() => {
    checkRequiredDataOthers();
  }, [wholesaleSellers, uploadFileListItemOthers]);
  useEffect(() => {
    ////////////////////////حقیقی
    if (personTypeId === '25a0a62a-6a39-44b3-a8f6-cde56eb50f0a') {
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
    } else if (personTypeId === 'cafd25d9-4948-4b97-b3ec-9761e4496e01') {
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
    } else if (personTypeId === '5882faca-e9d3-4329-b19c-c92eec610c62') {
      if (!sellerCode?.startsWith('6')) {
        setState({
          sellerCodeError: 'کد بورسی سبد با 6 شروع می شود',
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
  }, [personTypeId, sellerCode]);
  useEffect(() => {
    ////////////////////////حقیقی
    if (personTypeId === '25a0a62a-6a39-44b3-a8f6-cde56eb50f0a') {
      setState({ disableSellerName: false });
      ////////////////////////حقوقی
    } else if (personTypeId === 'cafd25d9-4948-4b97-b3ec-9761e4496e01') {
      setState({ disableSellerName: true });
      /////////////////صندوق
    } else if (personTypeId === '5882faca-e9d3-4329-b19c-c92eec610c62') {
      setState({ disableSellerName: true });
    }
  }, [personTypeId]);
  const handleGetWholeSale = (orderId: any) => {
    getWholeSale({
      orderId: orderId,
      onSuccess: (item) => {
        if (item?.publicFiles == null) {
          setUploadFileListItem([]);
        } else {
          setUploadFileListItem(item?.publicFiles);
        }
        setState({
          id: item?.id,
          wholeSaleTradeTypes: item?.wholesaleTradeTypesId,
          wholesaleType: item?.wholesaleTypeId,
          selectedInstrument: {
            instrumentId: item?.instrumentId,
            symbolCode: item?.symbolCode,
            symbol: item?.symbol,
            symbolName: item?.symbolName,
            companyName: item?.companyName,
          },
          companyName: item?.companyName,
          investment: item?.tradeTotalNumber,
          tradeVolume: item?.tradeVolume,
          tradePercent: item?.tradePercent,
          basePrice: item?.basePrice,
          cashSharePercentCondition: item?.cashSharePercent,
          tradeDate: item?.tradeDate,
          wholesaleSellersState: item?.wholesaleSellers,
          responsibleName: item?.responsibleName,
          responsiblePost: item?.responsiblePost,
          responsibleMobile: item?.responsibleMobile,
          publicMessages: item?.message.length > 0 ? item?.message : null,
        });
      },
      onFail,
    });
  };
  useEffect(() => {
    let uploadFileListItemOthersData: any = [];
    let wholesaleSellersData: any = [];

    wholesaleSellersState?.forEach((data: any) => {
      data.wholesaleSellerFiles?.forEach((file: any) => {
        uploadFileListItemOthersData.push(file);
      });
      wholesaleSellersData.push({
        wholesaleId: data?.wholesaleId,
        personTypeId: data?.personTypeId,
        personTypeName: data?.personTypeName,
        sellerName: data?.sellerName,
        sellerFamily: data?.sellerFamily,
        sellerCode: data?.sellerCode,
        shareCount: data?.shareCount,
        cashSharePercent: data?.cashSharePercent,
        salePercent: data?.salePercent,
        tableId: data?.tableId,
      });
    });
    setUploadFileListItemOthers(uploadFileListItemOthersData);
    setState({
      wholesaleSellers: wholesaleSellersData,
    });
  }, [wholesaleSellersState]);
  const setErrorMessage = (key: string) => {
    const errorMessage = '.';
    setState({ [`${key}Error`]: errorMessage });
  };
  const onFail = (error: any) => {
    onAlert(error);
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
  const handleGetWholeSaleAttachType = () => {
    getWholeSaleAttachType({
      data: {
        WholesaleTypeId: wholesaleType,
      },
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
  };
  const getWholeSaleTradeTypesList = () => {
    getWholeSaleTradeTypes({
      onSuccess: (res) => {
        setState({
          wholeSaleTradeTypesList: res,
          wholeSaleTradeTypes: res?.[0]?.id,
        });
      },
      onFail,
    });
  };
  const getWholeSaleTypesList = () => {
    getWholeSaleType({
      onSuccess: (res) => {
        setState({
          wholesaleTypeList: res,
          wholesaleType: res?.[0]?.id,
        });
      },
      onFail,
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
  const sellerColumns: HeaderTypes[] = [
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
      title: 'نام عرضه کننده',
      dataIndex: 'sellerName',
      className: 'col-span-2 !justify-start',
      key: 'sellerName',
    },
    {
      title: 'نام خانوادگی/نام شرکت',
      dataIndex: 'sellerFamily',
      className: 'col-span-2 !justify-start',
      key: 'sellerFamily',
    },
    {
      title: 'کد بورسی',
      dataIndex: 'sellerCode',
      className: 'col-span-1 !justify-start',
      key: 'sellerCode',
    },
    {
      title: 'تعداد سهم',
      dataIndex: 'shareCount',
      className: 'col-span-1 !justify-start',
      key: 'shareCount',
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'درصد فروش از کل معامله',
      dataIndex: 'cashSharePercent',
      className: 'col-span-2 !justify-start',
      key: 'cashSharePercent',
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
            onClick={() => onEditSellerTable(item)}
          />
          <Popconfirm
            title="آیا اطمینان دارید؟"
            okText="بله"
            cancelText="خیر"
            onConfirm={() => onRemoveSellerTable(item)}
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
  const onEditSellerTable = (item: any) => {
    setState({
      personTypeId: item?.personTypeId,
      personTypeName: item?.personTypeName,
      sellerName: item?.sellerName,
      sellerFamily: item?.sellerFamily,
      sellerCode: item?.sellerCode,
      shareCount: item?.shareCount,
      cashSharePercent: item?.cashSharePercent,
      tableEditItemId: item?.tableId,
    });
  };
  const onRemoveSellerTable = (record: any) => {
    const newList = wholesaleSellers.filter(
      (item: any) => item.tableId !== record.tableId
    );
    setState({
      wholesaleSellers: newList,
    });
  };
  const onSellerInformationClick = () => {
    if (
      personTypeId &&
      sellerFamily &&
      sellerCode &&
      shareCount &&
      cashSharePercent
    ) {
      const index = wholesaleSellers.findIndex((object: any) => {
        return object.tableId === tableEditItemId;
      });
      if (index !== -1) {
        setState({
          wholesaleSellers: [
            ...wholesaleSellers.slice(0, index),
            {
              wholesaleId: orderId != null ? id : null,
              personTypeId: personTypeId,
              personTypeName: personTypeName,
              sellerName: sellerName,
              sellerFamily: sellerFamily,
              sellerCode: sellerCode,
              shareCount: shareCount,
              cashSharePercent: cashSharePercent,
              salePercent: 0,
              tableId: tableEditItemId,
            },
            ...wholesaleSellers.slice(index + 1),
          ],
          personTypeId: '',
          sellerName: '',
          sellerFamily: '',
          sellerCode: '',
          shareCount: '',
          cashSharePercent: '',
          tableEditItemId: null,
        });
      } else {
        setState({
          wholesaleSellers: [
            ...wholesaleSellers,
            {
              wholesaleId: orderId != null ? id : null,
              personTypeId: personTypeId,
              personTypeName: personTypeName,
              sellerName: sellerName,
              sellerFamily: sellerFamily,
              sellerCode: sellerCode,
              shareCount: shareCount,
              cashSharePercent: cashSharePercent,
              salePercent: 0,
              tableId: generateRandomNumber(),
            },
          ],
          personTypeId: '',
          sellerName: '',
          sellerFamily: '',
          sellerCode: '',
          shareCount: '',
          cashSharePercent: '',
        });
      }
    } else {
      !personTypeId && setErrorMessage('personTypeId');
      !sellerFamily && setErrorMessage('sellerFamily');
      !sellerCode && setErrorMessage('sellerCode');
      !shareCount && setErrorMessage('shareCount');
      !cashSharePercent && setErrorMessage('cashSharePercent');
    }
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
    wholesaleSellers?.map((parentItem: any, index: any) => {
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
        // id: null,
        wholesaleId: orderId != null ? id : null,
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
        wholesaleId: orderId != null ? id : null,
        attachTypeId: selectedDocumentType,
        description: fileDescription,
        fileId: uploadFileId,
        uploadFileLink: uploadFileLink,
        uploadFileType: uploadFileType,
        tableId: parseInt(selectedFileOther),
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
          selectedFileOtherValue == '' ||
          selectedFileOtherValue == undefined
        ) {
          !selectedFileOther && setErrorMessage('selectedFileOther');
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
            selectedFileOther: '',
            selectedFileOtherValue: '',
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
      companyName &&
      investment &&
      tradeVolume &&
      tradePercent &&
      basePrice &&
      tradeDate &&
      responsibleName &&
      responsiblePost &&
      responsibleMobile &&
      requireFileUploadComplete === true &&
      sumOfCashSharePercent === 100
    ) {
      if (wholeSaleCondition && cashSharePercentCondition == '') {
        onAlert({
          message: `درصد حصه نقدی را وارد نمایید.`,
          type: 'error',
        });
      } else if (requireFileUploadCompleteOthers == false) {
        onAlert({
          message: `مدارک مربوط به عرضه کنندگان را به طور کامل وارد نمایید.`,
          type: 'error',
        });
      } else {
        const wholesaleSellersData = wholesaleSellers?.map((item: any) => {
          const matchingSecondItem = uploadFileListItemOthers?.filter(
            (secondItem: any) => secondItem?.tableId === item?.tableId
          );
          if (matchingSecondItem?.length > 0) {
            return {
              ...item,
              wholesaleSellerFiles: matchingSecondItem,
            };
          }
          return item;
        });
        const data = {
          id: orderId != null ? id : '00000000-0000-0000-0000-000000000000',
          orderId:
            orderId != null ? orderId : '00000000-0000-0000-0000-000000000000',
          instrumentId: selectedInstrument?.instrumentId,
          symbolCode: selectedInstrument?.symbolCode,
          wholesaleTradeTypesId: wholeSaleTradeTypes,
          wholesaleTypeId: wholesaleType,
          tradeTotalNumber: investment,
          tradeVolume: deSeparator(tradeVolume),
          tradePercent: tradePercent.toString(),
          basePrice: basePrice,
          cashSharePercent: wholeSaleCondition ? cashSharePercentCondition : 0,
          tradeDate: tradeDate,
          deadlineDate: null,
          responsibleName: responsibleName,
          responsiblePost: responsiblePost,
          responsibleMobile: responsibleMobile,
          wholesaleStatusId: 1,
          wholesaleSellers: wholesaleSellersData,
          publicFiles: uploadFileListItem,
        };
        saveWholeSale({ data, onSuccess: onSuccessSave, onFail });
      }
    } else {
      selectedInstrument?.symbol == '' && setErrorMessage('selectedInstrument');
      !tradeVolume && setErrorMessage('tradeVolume');
      !tradePercent && setErrorMessage('tradePercent');
      !basePrice && setErrorMessage('basePrice');
      !tradeDate && setErrorMessage('tradeDate');
      // !InitialOfficer && setErrorMessage('InitialOfficer');
      !responsibleName && setErrorMessage('responsibleName');
      !responsiblePost && setErrorMessage('responsiblePost');
      !responsibleMobile && setErrorMessage('responsibleMobile');
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
  const TrackingModal = () => {
    return (
      <>
        <Modal
          visible={isTrackingModalVisible}
          closable={false}
          style={{ textAlign: 'center', padding: '0px' }}
          title={'درخواست فروش عمده'}
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
  return (
    <div>
      <div className="border-2 border-lightGray w-full grid grid-cols-12">
        <div className=" col-span-12 items-start flex border-b-2 border-lightGray">
          <span className=" p-2 font-bold">درخواست عرضه عمده</span>
        </div>
        <div className="2xl:col-span-12 xl:col-span-12 lg:col-span-12 md:col-span-12  col-span-12 mx-4 mt-4">
          <Radio.Group
            onChange={(e) => setState({ wholeSaleTradeTypes: e.target.value })}
            value={wholeSaleTradeTypes}
            style={{ marginBottom: 10, width: '100%', marginTop: 10 }}
          >
            {wholeSaleTradeTypesList.map((item: any) => (
              <Radio className="text-extratiny" value={item.id}>
                {item.name}
              </Radio>
            ))}
          </Radio.Group>
        </div>
        <div className="2xl:col-span-12 xl:col-span-12 lg:col-span-12 md:col-span-12  col-span-12 mx-4 ">
          <Radio.Group
            onChange={(e) => setState({ wholesaleType: e.target.value })}
            value={wholesaleType}
            style={{ marginBottom: 10, width: '100%', marginTop: 10 }}
          >
            {wholesaleTypeList.map((item: any) => (
              <Radio className="text-extratiny" value={item.id}>
                {item.name}
              </Radio>
            ))}
          </Radio.Group>
        </div>
        <div className="grid col-span-12 grid-cols-12 gap-4  justify-between mx-4 mt-4">
          <div className=" col-span-12 items-start flex mt-4 ">
            <span className=" p-2 font-bold text-blue underline">
              اطلاعات عرضه :
            </span>
          </div>
          <div className="grid col-span-12 grid-cols-10 gap-4 justify-between  mt-4">
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
              label="تعداد کل سهام"
              className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
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
              label="تعداد سهام قابل عرضه"
              className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
              value={tradeVolume}
              onChange={(value: any) => {
                const numericValue = Number(value);
                const numericInvestment = Number(investment);

                const trade =
                  numericInvestment > 0 ? numericValue / numericInvestment : 0;

                setState({
                  tradeVolume: numericValue,
                  tradeVolumeError: '',
                  tradePercent:
                    numericInvestment > 0 ? (trade * 100).toFixed(2) : '0.00',
                });
              }}
              required
              errorMessage={state?.tradeVolumeError}
              type="numeric"
            />
            <TextField
              label="درصد سهام قابل عرضه"
              className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
              value={tradePercent}
              onChange={(value: any) => {
                const numericPercent = Number(value);
                const numericInvestment = Number(investment);

                const tradeVolumeCalc =
                  numericInvestment > 0
                    ? (numericPercent / 100) * numericInvestment
                    : 0;

                setState({
                  tradeVolume: Math.floor(tradeVolumeCalc),
                  tradePercent: numericPercent,
                  tradePercentError: '',
                });
              }}
              required
              errorMessage={state?.tradePercentError}
              type="number"
              max={100}
            />

            {wholeSaleCondition && (
              <TextField
                label="درصد حصه نقدی"
                className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
                value={cashSharePercentCondition}
                onChange={(value: any) => {
                  setState({
                    cashSharePercentCondition: value,
                    cashSharePercentConditionError: '',
                  });
                }}
                required
                errorMessage={state?.cashSharePercentConditionError}
                type="number"
                maxLength={3}
                max={100}
              />
            )}
            <div className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2 z-10">
              <DatePicker
                label="تاریخ عرضه"
                value={tradeDate}
                onChange={(value: any) =>
                  setState({
                    tradeDate: value,
                    tradeDateError: '',
                  })
                }
                required
                error={state?.tradeDateError}
              />
            </div>
            <TextField
              label="قیمت پایه"
              className="2xl:col-span-6 xl:col-span-9 lg:col-span-8 md:col-span-10 col-span-10"
              value={basePrice}
              onChange={(value: any) =>
                setState({
                  basePrice: value,
                  basePriceError: '',
                })
              }
              required
              errorMessage={state?.basePriceError}
              // type="numeric"
            />
          </div>
        </div>
        <div className="grid col-span-12 grid-cols-10 gap-4  justify-between mx-4 mt-4">
          <div className=" col-span-10 items-start flex mt-4 ">
            <span className=" p-2 font-bold text-blue underline">
              اطلاعات عرضه کنندگان :
            </span>
          </div>
          <div className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2">
            <NewSelect
              label="حقیقی/حقوقی"
              className="col-span-2"
              options={[{ name: '', id: '' }, ...personalityType]}
              onChange={(value: any) =>
                setState({
                  personTypeId: value,
                  personTypeIdError: false,
                  personTypeName: personalityType.filter(
                    (item: any) => item?.id == value
                  )?.[0]?.name,
                })
              }
              showKey="name"
              selectedKey="id"
              required
              value={personTypeId}
              errorMessage={state?.personTypeIdError}
            />
          </div>
          {!disableSellerName && (
            <TextField
              label="نام عرضه کننده"
              className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
              value={sellerName}
              onChange={(value: any) =>
                setState({
                  sellerName: value,
                  sellerNameError: '',
                })
              }
              // required
              // errorMessage={state?.sellerNameError}
            />
          )}
          <TextField
            label="نام خانوادگی/نام شرکت"
            className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={sellerFamily}
            onChange={(value: any) =>
              setState({
                sellerFamily: value,
                sellerFamilyError: '',
              })
            }
            required
            errorMessage={state?.sellerFamilyError}
          />
          <TextField
            label="کد بورسی"
            className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={deSeparator(sellerCode)}
            onChange={(value: any) =>
              setState({
                sellerCode: value,
                sellerCodeError: '',
              })
            }
            required
            errorMessage={state?.sellerCodeError}
          />
          <TextField
            label="تعداد سهم"
            className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={shareCount}
            onChange={(value: any) => {
              const count = parseInt(value);
              if (isNaN(count) || count < 0) return;

              const percent = (count / tradeVolume) * 100;
              setState({
                shareCount: count,
                shareCountError: '',
                cashSharePercent: parseFloat(percent.toFixed(2)),
                cashSharePercentError: '',
              });
            }}
            required
            errorMessage={state?.shareCountError}
            type="numeric"
          />
          <TextField
            label="درصد فروش از کل معامله"
            className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
            value={cashSharePercent}
            onChange={(value: any) => {
              const percent = parseFloat(value);
              if (isNaN(percent) || percent < 0 || percent > 100) return;

              const count = Math.round((percent / 100) * tradeVolume);
              setState({
                cashSharePercent: percent,
                cashSharePercentError: '',
                shareCount: count,
                shareCountError: '',
              });
            }}
            required
            errorMessage={state?.cashSharePercentError}
            type="number"
            max={100}
          />
          <Button
            onClick={onSellerInformationClick}
            className="bg-green w-24 h-9 text-white 2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
          >
            تایید و اضافه
          </Button>
          <div className=" col-span-10 flex flex-row justify-end">
            <span>مجموع تعداد : {wholesaleSellers.length} </span>
            <span className="mx-2 font-extra-bold"> | </span>
            <span> مجموع درصد از کل سرمایه : {sumOfCashSharePercent}</span>
          </div>
          <div className=" col-span-10 flex flex-row justify-end">
            {sumOfCashSharePercent != 100 && (
              <span className=" text-red">
                خطا: مجموع درصد از کل سرمایه باید 100 درصد باشد
              </span>
            )}
          </div>
          <div className="col-span-10">
            <Table
              columns={sellerColumns}
              className="col-span-10 grid grid-cols-12 text-center"
              dataSource={wholesaleSellers}
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
            className="2xl:col-span-3 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
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
            className="2xl:col-span-3 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
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
        {publicMessages && (
          <div className="col-span-12 mt-8 ">
            <span className="  font-bold text-blue underline mx-4 ">
              توضیحات :
            </span>
            <Table
              columns={messageHeader}
              className="col-span-12 grid grid-cols-12"
              wrapperClassName="!m-4"
              data={publicMessages}
              isPagination={false}
            />
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
                ? 'مدارک مربوط به عرضه کنندگان را به طور کامل بارگذاری نمایید.'
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
                  options={[{ name: '', id: '' }, ...fileSelectOther]}
                  onChange={(value: any) =>
                    setState({
                      selectedFileOther: value,
                      selectedFileOtherError: false,
                      selectedFileOtherValue: fileSelectOther.filter(
                        (item: any) => item?.id == value
                      )?.[0]?.name,
                    })
                  }
                  showKey="name"
                  selectedKey="id"
                  required
                  value={selectedFileOther}
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
        {wholesaleSellers.length > 0 && requireAttachDataListOthers.length > 0 && (
          <Collapse
            className="shadow-[0_0px_4px_rgba(0,0,0,0.2)] bg-[#EEEBFF] rounded-sm p-1 mb-3 col-span-12 gap-4  justify-between mx-4 mt-4"
            title="مدارک و مستندات عرضه و خرید"
            expanded={sellerAttachExpanded}
            onChange={(e: any, isOpen: boolean) =>
              setState({ sellerAttachExpanded: isOpen })
            }
          >
            {wholesaleSellers?.map((parentItem: any, index: any) => (
              <div className="grid col-span-10 grid-cols-12 gap-4  justify-between mx-4 mt-4 mb-4">
                <div className="col-span-12">
                  <span>{`${parentItem?.sellerName}`}</span>
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
          className="border-blue border  text-blue w-[120px] h-[35px]  flex items-center justify-center ml-4 rounded"
          // onClick={onConfirm}
        >
          بازگشت
        </a>
        {orderId && (
          <a
            className="border-red border text-red w-[120px] h-[35px] flex items-center justify-center rounded "
            onClick={() => setState({ isModalCloseFormVisible: true })}
          >
            ابطال
          </a>
        )}
        <a
          className="border-blue border bg-blue w-[120px] h-[35px] text-white flex items-center justify-center mr-4 rounded"
          onClick={onSubmitClick}
        >
          ثبت
        </a>
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
export default withAlert(WholesaleCashRequest);
