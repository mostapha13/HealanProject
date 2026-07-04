import withAlert from 'apps/cash-market/src/hoc/withAlert';
import {
  useStates,
  useEffect,
  useState,
  useNavigate,
  useSearchParams,
} from '@tse/utils';
import ImageUploadPreview from 'apps/cash-market/src/components/ImageUploadPreview';
import {
  Button,
  TextField,
  Modal,
  Collapse,
  Upload,
  Image,
  Icon,
} from '@tse/components/atoms';
import {
  convertDateAndTime,
  convertDateAndTimeJalali,
  convertDateAndTimeToJalali,
  convertDateToJalali,
  downloadFile,
  loadFromSession,
  loadFromStorage,
  separator,
} from '@tse/tools';
import {
  getOrderWorkFlow,
  getInitialSupplyByOrderId,
  initialSupplyConfirm,
  initialSupplyReject,
  uploadFile,
} from 'apps/cash-market/src/Controller';
import { Popconfirm, Radio } from 'antd';
import type { RadioChangeEvent } from 'antd';
import WorkFlow from 'apps/cash-market/src/components/PageFeature/WorkFlow';
import { HeaderTypes } from '@tse/types';
import { Table } from '@tse/components/organism';
import {
  deleteDocuments,
  endWholeSale,
  exportWholesaleForm1,
  exportWholesaleNotification,
  exportWholesaleToCeo,
  getDocuments,
  getWholeSale,
  getWholeSaleCategory,
  getWholeSaleDocumentList,
  getWholeSaleDocumentType,
  getWholeSaleTradeTypes,
  saveWholeSaleTradeType,
  saveWholesaleDetailExpert,
  uploadDocuments,
  wholeSaleConfirmCashmarketManager,
  wholeSaleReject,
} from 'apps/cash-market/src/Controller/StockMarket/WholeSale';
import NewSelect from 'apps/cash-market/src/components/atoms/NewSelect';
import pdfLogo from 'apps/cash-market/src/assets/images/pdfLogo.png';
import { FILE_BASE_URL } from 'apps/cash-market/src/constants';
import { DatePicker } from '@tse/components/molecules';
import { downloadFileApi } from 'apps/cash-market/src/Controller/Upload';

const initialState = {
  changePage: 'request',
  pageNo: 1,
  wholeSaleCashData: {},
  workFlow: null,
  wholesaleSellerFiles: [],
  sumOfCashSharePercent: '',
  attachExpanded: true,
  typeTransactionExpanded: true,
  publicMessage: '',
  privateMessage: '',
  isModalConfirmVisible: false,
  isModalRejectVisible: false,
  isModalEndVisible: false,
  isModalDeputyConfirmVisible: false,
  sharePercent: '',
  sharePercentError: '',
  wholeSaleTradeTypesId: '',
  wholeSaleTradeTypesIdError: '',
  wholeSaleTradeTypesList: [],
  detailDescription: '',
  wholeSaleDetail: {},
  cashNoticeNumber: '',
  cashNoticeNumberError: '',
  cashNoticeDate: '',
  cashNoticeDateError: '',
  cashNoticeFile: '',
  cashNoticeFileName: '',
  cashNoticeFileLink: '',
  cashNoticeFileObj: null,
  cashNoticeFileError: '',
  exportNotificationData: null,
  exportForm1Data: null,
  exportWholesaleToCeoData: null,
  wholeSaleDocumentListData: [],
  wholesaleTypeId: '',
  wholeSaleCondition: false,
  conditionNoticeLicenseNumber: '',
  conditionNoticeLicenseNumberError: '',
  conditionNoticeLicenseDate: '',
  conditionNoticeLicenseDateError: '',
  conditionNoticeLicenseFile: '',
  conditionNoticeLicenseFileName: '',
  conditionNoticeLicenseFileLink: '',
  conditionNoticeLicenseFileObj: null,
  conditionNoticeLicenseFileError: '',
  conditionNoticeNumber: '',
  conditionNoticeNumberError: '',
  conditionNoticeDate: '',
  conditionNoticeDateError: '',
  conditionNoticeFile: '',
  conditionNoticeFileName: '',
  conditionNoticeFileLink: '',
  conditionNoticeFileObj: null,
  conditionNoticeFileError: '',
  conditionFormNumber: '',
  conditionFormNumberError: '',
  conditionFormDate: '',
  conditionFormDateError: '',
  conditionFormFile: '',
  conditionFormFileName: '',
  conditionFormFileLink: '',
  conditionFormFileLinkObj: null,
  conditionFormFileError: '',
  wholeSaleDocumentTypeData: [],
  documentTypeId: '',
  documentTypeIdName: '',
  documentTypeIdError: false,
  permitNo: '',
  permitNoError: false,
  permitDate: '',
  permitDateError: false,
  permitDescription: '',
  permitDescriptionError: false,
  permitFile: null,
  permitFileError: false,
  uploadDocEditMode: false,
  documentId: '',
  wholeSaleUploadDocumentList: [],
  editUploadDoc: false,
  uploadDocID: '',
};
function WholeSaleSellRequestDetails({ onAlert }: any) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useStates<any>(initialState);
  const [uploadFileListItemOthers, setUploadFileListItemOthers] = useState<any>(
    []
  );
  const isCashMarketBroker = loadFromSession('isCashMarketBroker');

  const {
    changePage,
    wholeSaleCashData,
    workFlow,
    wholesaleSeller,
    sumOfCashSharePercent,
    attachExpanded,
    typeTransactionExpanded,
    publicMessage,
    privateMessage,
    isModalConfirmVisible,
    isModalRejectVisible,
    isModalEndVisible,
    isModalDeputyConfirmVisible,
    sharePercent,
    wholeSaleTradeTypesId,
    wholeSaleTradeTypesList,
    detailDescription,
    wholeSaleDetail,
    cashNoticeNumber,
    cashNoticeDate,
    cashNoticeFile,
    cashNoticeFileName,
    cashNoticeFileLink,
    cashNoticeFileObj,
    exportNotificationData,
    exportForm1Data,
    exportWholesaleToCeoData,
    wholeSaleDocumentListData,
    wholesaleTypeId,
    wholeSaleCondition,
    conditionNoticeLicenseNumber,
    conditionNoticeLicenseDate,
    conditionNoticeLicenseFile,
    conditionNoticeLicenseFileObj,
    conditionNoticeLicenseFileName,
    conditionNoticeLicenseFileLink,
    conditionNoticeNumber,
    conditionNoticeDate,
    conditionNoticeFile,
    conditionNoticeFileName,
    conditionNoticeFileLink,
    conditionNoticeFileObj,
    conditionFormNumber,
    conditionFormDate,
    conditionFormFile,
    conditionFormFileName,
    conditionFormFileLink,
    conditionFormFileObj,
    wholeSaleDocumentTypeData,
    documentTypeId,
    documentTypeIdName,
    documentTypeIdError,
    permitNo,
    permitNoError,
    permitDate,
    permitDateError,
    permitDescription,
    permitDescriptionError,
    permitFile,
    permitFileError,
    uploadDocEditMode,
    documentId,
    wholeSaleUploadDocumentList,
    editUploadDoc,
    uploadDocID,
  } = state;
  const orderId =
    searchParams.get('id') != null
      ? searchParams.get('id')
      : '0f89d35f-77ed-4e1d-e211-08dc5789dd68';
  const isPublishNotice =
    window.location.pathname === '/stock/publish-notice-sell-wholesale'
      ? true
      : false;
  const isDeputy =
    window.location.pathname === '/stock/request-details-deputy-sell-wholesale'
      ? true
      : false;
  const history =
    searchParams.get('history') != null ? searchParams.get('history') : '';
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
      className: 'col-span-2 !justify-start',
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
  ];
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
  const documentListTable: HeaderTypes[] = [
    {
      title: 'فرستنده',
      dataIndex: 'senderName',
      key: 'senderName',
      className: 'col-span-3 !justify-start',
    },
    {
      title: 'نوع معامله ',
      dataIndex: 'tradeTypeName',
      key: 'tradeTypeName',
      className: 'col-span-2 !justify-start',
    },
    {
      title: 'دسته بندی نماد ',
      dataIndex: 'categoryName',
      key: 'categoryName',
      className: 'col-span-3 !justify-start',
    },
    {
      title: 'تاریخ ارسال ',
      dataIndex: 'persianCreatedDate',
      key: 'persianCreatedDate',
      className: 'col-span-3 !justify-start',
      // render: (item: any) => <span>{convertDateAndTimeToJalali(item)}</span>,
    },
  ];
  const uploadDocColumns: HeaderTypes[] = [
    {
      title: 'نوع نامه',
      dataIndex: 'documentTypeName',
      className: 'col-span-2 !justify-start',
      key: 'documentTypeName',
    },
    {
      title: 'شماره نامه',
      dataIndex: 'permitNo',
      className: 'col-span-2 !justify-start',
      key: 'permitNo',
    },
    {
      title: 'تاریخ نامه',
      dataIndex: 'permitDate',
      className: 'col-span-1 !justify-start',
      key: 'permitDate',
      render: (item: any) => <span>{convertDateToJalali(item)}</span>,
    },
    {
      title: 'فایل',
      dataIndex: 'permitFile',
      className: 'col-span-2 !justify-center',
      key: 'permitFile',
      render: (item: any) => (
        <a onClick={() => handleDownload(item)}>{item?.fileName}</a>
      ),
    },
    {
      title: 'توضیحات',
      dataIndex: 'permitDescription',
      className: 'col-span-3 !justify-start',
      key: 'permitDescription',
    },
    {
      title: 'عملیات',
      dataIndex: 'action',
      key: 'action',
      className: 'col-span-1 !justify-start',
      render: (_: any, item: any) =>
        !history ? (
          <div className="flex flex-row items-center justify-center">
            <Icon
              name="icon-edit"
              classname="text-green text-lg cursor-pointer"
              onClick={() => onEditUploadDocument(item)}
            />
            <Popconfirm
              title="آیا اطمینان دارید؟"
              okText="بله"
              cancelText="خیر"
              onConfirm={() => onRemoveUploadDocItem(item?.id)}
            >
              <Icon
                name="icon-delete"
                classname="text-red text-lg cursor-pointer"
              />
            </Popconfirm>
          </div>
        ) : null,
    },
  ];
  useEffect(() => {
    handleGetWholeSale(orderId);
    getWorkFlow();
    getWholeSaleTradeTypesList();
    handleGetWholeSaleDocumentList(orderId);
    // if (isPublishNotice) {
    //   handleExportNotification();
    // }
  }, []);
  useEffect(() => {
    let isCondition;
    if (wholesaleTypeId === '25e89117-17a8-465d-a1fb-2f1a80888773') {
      isCondition = true;
    } else {
      isCondition = false;
    }
    setState({ wholeSaleCondition: isCondition });
  }, [wholesaleTypeId]);
  useEffect(() => {
    let uploadFileListItemOthers: any = [];
    wholesaleSeller?.forEach((data: any) => {
      data?.wholesaleSellerFiles?.forEach((file: any) => {
        uploadFileListItemOthers.push(file);
      });
    });
    setUploadFileListItemOthers(uploadFileListItemOthers);
  }, [wholesaleSeller]);
  useEffect(() => {
    handleGetWholeSaleDocumentType();
  }, [wholeSaleCondition]);
  useEffect(() => {
    getUploadDocumentList();
  }, [wholeSaleCashData]);

  useEffect(() => {
    const sumOfCashSharePercent = wholesaleSeller
      ?.reduce(
        (acc: any, curr: any) => acc + parseFloat(curr.cashSharePercent),
        0
      )
      .toFixed(2);
    const normalizedSum =
      sumOfCashSharePercent >= 99.9 && sumOfCashSharePercent <= 100.1
        ? 100
        : sumOfCashSharePercent;
    setState({
      sumOfCashSharePercent: normalizedSum,
    });
  }, [wholesaleSeller]);

  const handleGetWholeSale = (orderId: any) => {
    getWholeSale({
      orderId: orderId,
      onSuccess: (item) => {
        setState({
          wholeSaleCashData: item,
          wholesaleSeller: item?.wholesaleSellers,
          wholeSaleDetail: item?.wholeSaleDetail?.[0],
          wholesaleTypeId: item?.wholesaleTypeId,
        });
        // if (isPublishNotice) {
        //   handleExportForm1(item?.id);
        // }
      },
      onFail,
    });
  };
  const getWorkFlow = () => {
    const data = {
      OrderId: orderId,
    };
    getOrderWorkFlow({ data, onSuccess: onSuccessWorkFlow, onFail });
  };

  const onSuccessWorkFlow = (res: any) => {
    setState({
      workFlow: res,
    });
  };
  const handleGetWholeSaleDocumentList = (orderId: any) => {
    getWholeSaleDocumentList({
      orderId: orderId,
      onSuccess: (item) => {
        setState({
          wholeSaleDocumentListData: item,
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
          // wholeSaleTradeTypesId: res?.[0]?.id,
        });
      },
      onFail,
    });
  };
  const handleGetWholeSaleDocumentType = () => {
    const data = {
      isConditional: wholeSaleCondition,
      isCancel: 'WholesaleDocument',
    };
    getWholeSaleDocumentType({
      data: data,
      onSuccess: (item) => {
        setState({
          wholeSaleDocumentTypeData: item,
        });
      },
      onFail,
    });
  };
  const onFail = (error: any) => {
    onAlert(error);
  };
  const setErrorMessage = (key: string) => {
    const errorMessage = '  ';
    setState({ [`${key}Error`]: errorMessage });
  };
  const onChangePage = (pageNo: number) => {
    setState({
      pageNo,
    });
  };
  const handleModeChange = (e: RadioChangeEvent) => {
    setState({ changePage: e.target.value });
  };
  const onRemoveFile = (state: string) => {
    let fileError = state + 'Error';
    setState({
      [state]: null,
      [fileError]: true,
    });
  };
  const onChangeFile = (e: any, state: string) => {
    let fileError = state + 'Error';
    uploadFile({
      data: e.target.files[0],
      onSuccess: (res: any) => {
        setState({
          [state]: res,
          [fileError]: false,
        });
      },
      onFail,
    });
  };
  const onConfirmClick = () => {
    if (wholeSaleTradeTypesId) {
      setState({ isModalConfirmVisible: true });
    } else {
      setState({ typeTransactionExpanded: true });
      !wholeSaleTradeTypesId && setErrorMessage('wholeSaleTradeTypesId');
    }
  };
  const onOkModalConfirmClick = () => {
    const data = {
      orderId: orderId,
      wholeSaleId: wholeSaleCashData?.id,
      wholeSaleTradeTypesId: wholeSaleTradeTypesId,
      // detailDescription: detailDescription,
      publicMessage: publicMessage,
      privateMessage: privateMessage,
    };
    saveWholeSaleTradeType({
      data,
      onSuccess: (res) => {
        if (res?.succeeded) {
          setState({ isModalConfirmVisible: false });
          onAlert({
            type: 'success',
            message: 'اطلاعات با موفقیت تایید گردید',
          });
          navigate('/cartable');
        }
      },
      onFail,
    });
  };
  const onConfirmDeputyClick = () => {
    if (wholeSaleTradeTypesId) {
      setState({ isModalDeputyConfirmVisible: true });
    } else {
      setState({ typeTransactionExpanded: true });
      !wholeSaleTradeTypesId && setErrorMessage('wholeSaleTradeTypesId');
    }
  };
  const onOkModalDeputyConfirmClick = () => {
    const data = {
      orderId: orderId,
      wholeSaleId: wholeSaleCashData?.id,
      wholeSaleTradeTypesId: wholeSaleTradeTypesId,
      // detailDescription: detailDescription,
      publicMessage: publicMessage,
      privateMessage: privateMessage,
    };
    wholeSaleConfirmCashmarketManager({
      data,
      onSuccess: (res) => {
        if (res?.succeeded) {
          setState({ isModalConfirmVisible: false });
          onAlert({
            type: 'success',
            message: 'اطلاعات با موفقیت تایید گردید',
          });
          navigate('/cartable');
        }
      },
      onFail,
    });
  };

  const onRejectClick = () => {
    setState({ isModalRejectVisible: false });
    const data = {
      orderId: orderId,
      publicMessage: publicMessage,
      privateMessage: privateMessage,
    };
    wholeSaleReject({
      data: data,
      onSuccess: (res) => {
        if (res?.succeeded) {
          onAlert({
            type: 'success',
            message: 'درخواست شما با موفقیت ثبت گردید.',
          });
          navigate('/cartable');
        }
      },
      onFail,
    });
  };

  const saveUploadDocument = () => {
    if (documentTypeId && permitNo && permitDate && permitFile) {
      const data = {
        id: editUploadDoc
          ? uploadDocID
          : '00000000-0000-0000-0000-000000000000',
        orderId: orderId,
        wholeSaleId: wholeSaleCashData?.id,
        documentTypeId: documentTypeId,
        permitNo: permitNo,
        permitDate: permitDate,
        permitDescription: permitDescription,
        permitFile: permitFile,
      };
      uploadDocuments({
        data: data,
        onSuccess: (res) => {
          if (res?.succeeded) {
            onAlert({
              type: 'success',
              message: 'اطلاعات ثبت گردید',
            });
            getUploadDocumentList();
            setState({
              editUploadDoc: false,
              uploadDocID: '',
              documentTypeId: '',
              permitNo: '',
              permitDate: '',
              permitDescription: '',
              permitFile: null,
            });
          }
        },
        onFail,
      });
    } else {
      !documentTypeId && setErrorMessage('documentTypeId');
      !permitNo && setErrorMessage('permitNo');
      !permitDate && setErrorMessage('permitDate');
      !permitFile && setErrorMessage('permitFile');
    }
  };
  const getUploadDocumentList = () => {
    const data = {
      wholesaleId: wholeSaleCashData?.id,
    };
    getDocuments({
      data: data,
      onSuccess: (res) => {
        setState({ wholeSaleUploadDocumentList: res });
      },
      onFail,
    });
  };
  const onEditUploadDocument = (item: any) => {
    setState({
      uploadDocID: item.id,
      documentTypeId: item?.documentTypeId,
      permitNo: item?.permitNo,
      permitDate: item?.permitDate,
      permitDescription: item?.permitDescription,
      permitFile: item?.permitFile,
      editUploadDoc: true,
    });
  };
  const onRemoveUploadDocItem = (id: string) => {
    deleteDocuments({
      data: {
        orderId: orderId,
        id: id,
      },
      onSuccess: (res) => {
        getUploadDocumentList();
      },
      onFail,
    });
  };
  const onEndWholesaleClick = () => {
    setState({ isModalRejectVisible: false });
    const data = {
      orderId: orderId,
      publicMessage: publicMessage,
      privateMessage: privateMessage,
    };
    endWholeSale({
      data: data,
      onSuccess: (res) => {
        if (res?.succeeded) {
          onAlert({
            type: 'success',
            message: 'تایید و اختتام با موفقیت انجام شد.',
          });
          navigate('/cartable');
        }
      },
      onFail,
    });
  };
  const handleExportNotification = () => {
    exportWholesaleNotification({
      orderId: orderId,
      onSuccess: (res) => {
        setState({
          exportNotificationData: res,
        });
        downloadExportFile(res);
      },
      onFail,
    });
  };
  const handleExportForm1 = (WholeSaleId: string) => {
    const data = {
      orderId: orderId,
      WholeSaleId: WholeSaleId,
    };
    exportWholesaleForm1({
      data: data,
      onSuccess: (res) => {
        // setState({
        //   exportForm1Data: res,
        // });
        downloadExportFile(res);
      },
      onFail,
    });
  };
  const handleExportWholesaleToCeo = () => {
    exportWholesaleToCeo({
      orderId: orderId,
      onSuccess: (res) => {
        // setState({
        //   exportWholesaleToCeoData: res,
        // });
        downloadExportFile(res);
      },
      onFail,
    });
  };
  const downloadExportFile = (state: any) => {
    if (state != null) {
      downloadFile(state, 'exportWord.docx');
    }
  };
  const handleDownload = (data: any) => {
    downloadFileApi({
      data: data?.fileId,
      onSuccess: (res: any) => downloadExportDoc(res, data?.fileName),
      onFail: (err: any) => console.log('onFail', err),
    });
  };
  const downloadExportDoc = (data: any, name: any) => {
    if (data != null) {
      downloadFile(data, name);
    }
  };
  return (
    <div>
      <div className="border-2 border-lightGray">
        <div className="my-1">
          <Radio.Group onChange={handleModeChange} value={changePage}>
            <Radio.Button value="request">فرآیند فعلی</Radio.Button>
            <Radio.Button value="workflow">گردش کار</Radio.Button>
          </Radio.Group>
        </div>
        <div className=" items-start flex border-b-2  justify-between bg-lightGray border-lightGray  px-4">
          <div className=" flex flex-row">
            <span className=" p-2 font-bold ">درخواست :</span>
            <span className=" p-2  ">{wholeSaleCashData?.workFlowName}</span>
          </div>
          <div className=" flex flex-row">
            <span className=" p-2 font-bold ">کد پیگیری :</span>
            <span className=" p-2  ">{wholeSaleCashData?.trackingNumber}</span>
          </div>
          <div className=" flex flex-row">
            <span className=" p-2 font-bold ">وضعیت :</span>
            <span className=" p-2  ">{wholeSaleCashData?.orderStatusName}</span>
          </div>
        </div>
        {!isCashMarketBroker && isPublishNotice && changePage == 'request' && (
          <div className="flex items-start flex-col m-4">
            <span className=" text-blue font-semibold">بارگذاری مکاتبات</span>
            <div className=" w-full my-2 border border-gray rounded-sm p-4 grid-flow-row  ">
              <>
                <div className="  grid grid-cols-12 justify-between my-2 items-center gap-4 ">
                  <div className="2xl:col-span-3 xl:col-span-6 lg:col-span-6 md:col-span-6  col-span-3">
                    <NewSelect
                      label="نوع نامه"
                      className="col-span-2"
                      options={[
                        { name: '', id: '' },
                        ...wholeSaleDocumentTypeData,
                      ]}
                      onChange={(value: any) =>
                        setState({
                          documentTypeId: value,
                          documentTypeIdError: false,
                          documentTypeIdName: wholeSaleDocumentTypeData.filter(
                            (item: any) => item?.id == value
                          )?.[0]?.name,
                        })
                      }
                      showKey="name"
                      selectedKey="id"
                      required
                      value={documentTypeId}
                      errorMessage={state?.documentTypeIdError}
                    />
                  </div>
                  <TextField
                    label="شماره نامه"
                    className="2xl:col-span-3 xl:col-span-6 lg:col-span-6 md:col-span-6  col-span-2"
                    value={permitNo}
                    onChange={(value: any) =>
                      setState({
                        permitNo: value,
                        permitNoError: '',
                      })
                    }
                    required
                    errorMessage={state?.permitNoError}
                    // type="numeric"
                  />
                  <div className="2xl:col-span-3 xl:col-span-6 lg:col-span-6 md:col-span-6  col-span-2  z-30">
                    <DatePicker
                      label="تاریخ"
                      value={permitDate}
                      onChange={(value: any) =>
                        setState({
                          permitDate: value,
                          permitDateError: '',
                        })
                      }
                      required
                      error={state?.permitDateError}
                    />
                  </div>
                  <TextField
                    label="توضیحات"
                    className="2xl:col-span-3 xl:col-span-6 lg:col-span-6 md:col-span-6  col-span-3"
                    value={permitDescription}
                    onChange={(value: any) =>
                      setState({
                        permitDescription: value,
                        permitDescriptionError: false,
                      })
                    }
                    // required
                    // errorMessage={documentDescriptionError}
                  />
                  <div className=" 2xl:col-span-6 xl:col-span-6 lg:col-span-6 md:col-span-6 col-span-6">
                    <Upload
                      onChange={(file: any) => onChangeFile(file, 'permitFile')}
                      value={permitFile?.fileName}
                      href={permitFile?.link}
                      name="permitFile"
                      onDelete={() => onRemoveFile('permitFile')}
                      error={state.permitFileError}
                    />
                  </div>
                  <div className="col-span-6 flex justify-end items-end mt-4">
                    <a
                      className="border-blue border text-blue w-[100px] h-[35px]  items-center flex justify-center rounded"
                      onClick={saveUploadDocument}
                    >
                      ذخیره
                    </a>
                  </div>
                  <div className="col-span-12 my-10">
                    <Table
                      columns={uploadDocColumns}
                      className="col-span-12 grid grid-cols-12 text-center"
                      dataSource={wholeSaleUploadDocumentList}
                      //   scroll={{ x: 'calc(700px + 30%)' }}
                      pageSize={1000}
                    />
                  </div>
                </div>
              </>
            </div>
          </div>
        )}
        {changePage == 'request' && (
          <>
            <Collapse
              className="shadow-[0_0px_4px_rgba(0,0,0,0.2)] rounded-sm p-1 mb-3 col-span-12 gap-4  justify-between mx-4 mt-4"
              title={`بررسی مدارک متقاضی فروش سهام ${wholeSaleCashData?.symbolName}`}
              expanded={attachExpanded}
              onChange={(e: any, isOpen: boolean) =>
                setState({ attachExpanded: isOpen })
              }
            >
              <div className="w-full grid grid-cols-10 ">
                <div className="grid col-span-10 grid-cols-10 gap-4 justify-between mx-4 mt-2 ">
                  <div className="col-span-2 flex flex-row items-center ">
                    <div className=" font-bold w-4 h-4 bg-blue rounded-full" />
                    <span className=" py-2 mx-2">
                      {wholeSaleCashData?.wholesaleTradeTypesName}
                    </span>
                  </div>
                </div>
                <div className="grid col-span-10 grid-cols-10 gap-4 justify-between mx-4 mt-2">
                  <div className="col-span-2 flex flex-row items-center ">
                    <div className=" font-bold w-4 h-4 bg-blue rounded-full" />
                    <span className=" py-2 mx-2">
                      {wholeSaleCashData?.wholesaleTypeName}
                    </span>
                  </div>
                </div>
                <div className=" col-span-10 items-start flex mt-2">
                  <span className=" p-2 font-bold text-blue underline">
                    اطلاعات عرضه :
                  </span>
                </div>
                <div className="grid col-span-10 grid-cols-10 gap-4 justify-between mx-4">
                  <div className="col-span-2 flex flex-col my-2">
                    <span className=" font-bold">نماد :</span>
                    <span className=" py-2 ">{wholeSaleCashData?.symbol}</span>
                  </div>
                  <div className="col-span-2 flex flex-col my-2">
                    <span className=" font-bold">نام شرکت :</span>
                    <span className=" py-2 ">
                      {wholeSaleCashData?.symbolName}
                    </span>
                  </div>
                  <div className="col-span-2 flex flex-col my-2">
                    <span className=" font-bold">تعداد کل سهام شرکت :</span>
                    <span className=" py-2 ">
                      {separator(wholeSaleCashData?.tradeTotalNumber)}
                    </span>
                  </div>
                  <div className="col-span-2 flex flex-col my-2">
                    <span className=" font-bold">تعداد سهام قابل عرضه :</span>
                    <span className=" py-2 ">
                      {separator(wholeSaleCashData?.tradeVolume)}
                    </span>
                  </div>
                  <div className="col-span-2 flex flex-col my-2">
                    <span className=" font-bold">درصد سهام قابل عرضه :</span>
                    <span className=" py-2 ">
                      {wholeSaleCashData?.tradePercent}
                    </span>
                  </div>
                  <div className="col-span-2 flex flex-col my-2">
                    <span className=" font-bold">قیمت پایه :</span>
                    <span className=" py-2 ">
                      {wholeSaleCashData?.basePrice}
                    </span>
                  </div>
                  {wholeSaleCondition && (
                    <div className="col-span-2 flex flex-col my-2">
                      <span className=" font-bold">درصد حصه نقدی :</span>
                      <span className=" py-2 ">
                        {wholeSaleCashData?.cashSharePercent}
                      </span>
                    </div>
                  )}
                  <div className="col-span-2 flex flex-col my-2">
                    <span className=" font-bold">تاریخ عرضه :</span>
                    <span className=" py-2 ">
                      {convertDateToJalali(wholeSaleCashData?.tradeDate)}
                    </span>
                  </div>
                </div>

                <div className="grid col-span-10 grid-cols-10 gap-4  justify-between mx-4 mt-4">
                  <div className=" col-span-10 items-start flex mt-2 ">
                    <span className=" p-2 font-bold text-blue underline">
                      اطلاعات عرضه کنندگان :
                    </span>
                  </div>

                  <div className="col-span-10 py-2 pl-4">
                    <div className=" col-span-10 flex flex-row justify-end">
                      <span>مجموع تعداد : {wholesaleSeller?.length} </span>
                      <span className="mx-2 font-extra-bold"> | </span>
                      <span>
                        مجموع درصد از کل سرمایه : {sumOfCashSharePercent}
                      </span>
                    </div>
                    <Table
                      columns={sellerColumns}
                      className="col-span-10 grid grid-cols-12 text-center"
                      dataSource={wholeSaleCashData?.wholesaleSellers}
                      pageSize={1000}
                      scrollX={300}
                    />
                  </div>
                </div>
                <div className="grid col-span-10 grid-cols-10 gap-4  justify-between mx-4 mt-4">
                  <div className=" col-span-10 items-start flex  ">
                    <span className="  font-bold text-blue underline">
                      اطلاعات رابط :
                    </span>
                  </div>
                  <div className="col-span-2 flex flex-col">
                    <span className=" font-bold">نام و نام خانوادگی :</span>
                    <span className=" py-2 ">
                      {wholeSaleCashData?.responsibleName}
                    </span>
                  </div>
                  <div className="col-span-2 flex flex-col">
                    <span className=" font-bold">سمت :</span>
                    <span className=" py-2 ">
                      {wholeSaleCashData?.responsiblePost}
                    </span>
                  </div>
                  <div className="col-span-2 flex flex-col">
                    <span className=" font-bold">شماره همراه :</span>
                    <span className=" py-2 ">
                      {wholeSaleCashData?.responsibleMobile}
                    </span>
                  </div>
                </div>
                {wholeSaleCashData?.message?.length > 0 && (
                  <div className="grid col-span-10 grid-cols-12 gap-4  justify-between mx-4 mt-4">
                    <div className=" col-span-12 items-start flex  ">
                      <span className="  font-bold text-blue underline">
                        توضیحات :
                      </span>
                    </div>
                    <div className=" col-span-12  pb-4">
                      <Table
                        data={wholeSaleCashData?.message}
                        columns={columns}
                        wrapperClassName="!mt-4"
                        onChangePage={onChangePage}
                        totalPages={1}
                        pageSize={10}
                        className="col-span-12 grid grid-cols-12 "
                      />
                    </div>
                  </div>
                )}
                <div className="grid col-span-10 grid-cols-10 gap-4  justify-between mx-4 mt-4 ">
                  <div className=" col-span-10 items-start flex  ">
                    <span className="  font-bold text-blue underline">
                      مدارک :
                    </span>
                  </div>
                  <div className=" col-span-10 grid grid-cols-4 pb-4 bg-[#EEEBFF] mb-4 px-4">
                    {wholeSaleCashData?.publicFiles?.length > 0 &&
                      wholeSaleCashData?.publicFiles?.map(
                        (item: any, index: any) => (
                          <ImageUploadPreview
                            className="2xl:col-span-1 xl:col-span-2 lg:col-span-2 md:col-span-4  col-span-1"
                            data={item}
                            onAlert={onAlert}
                          />
                        )
                      )}
                  </div>
                </div>
                <div className="grid col-span-10 grid-cols-10 gap-4  justify-between mx-4 mt-4 ">
                  <div className=" col-span-10 items-start flex  ">
                    <span className="  font-bold text-blue underline">
                      مدارک و مستندات عرضه کننده :
                    </span>
                  </div>
                  {uploadFileListItemOthers?.length > 0 &&
                    wholeSaleCashData?.wholesaleSellers?.map(
                      (parentItem: any, index: any) => (
                        <div className="grid col-span-10 grid-cols-12 gap-4  justify-between  mt-4 mb-4 bg-[#EEEBFF]">
                          <div className="col-span-12">
                            <span className=" font-bold m-4">{`${parentItem?.sellerFamily} `}</span>
                          </div>

                          <div className=" col-span-12 grid grid-cols-4 pb-4  mb-4 px-4">
                            {uploadFileListItemOthers?.map(
                              (item: any, index: any) =>
                                item?.tableId === parentItem?.tableId && (
                                  <ImageUploadPreview
                                    className="2xl:col-span-1 xl:col-span-2 lg:col-span-2 md:col-span-4  col-span-1"
                                    data={item}
                                    onAlert={onAlert}
                                  />
                                )
                            )}
                          </div>
                        </div>
                      )
                    )}
                </div>
                <div className=" col-span-10 bg-lightGray py-4">
                  <span className="  font-bold text-blue underline px-4">
                    توضیحات :
                  </span>
                  <div className="  px-10 my-4">
                    <TextField
                      multiline
                      className=" bg-white"
                      label="پیام عمومی"
                      onChange={(e: any) => setState({ publicMessage: e })}
                      value={publicMessage}
                      fullWidth
                    />
                  </div>
                  <div className="  px-10 my-4">
                    <TextField
                      multiline
                      className=" bg-white"
                      label="پیام خصوصی"
                      onChange={(e: any) => setState({ privateMessage: e })}
                      value={privateMessage}
                      fullWidth
                    />
                  </div>
                </div>
              </div>
            </Collapse>
            {!isCashMarketBroker && (
              <Collapse
                className="shadow-[0_0px_4px_rgba(0,0,0,0.2)] rounded-sm p-1 mb-3 col-span-12 gap-4  justify-between mx-4 mt-4"
                title="تعیین نوع معامله"
                expanded={typeTransactionExpanded}
                onChange={(e: any, isOpen: boolean) =>
                  setState({ typeTransactionExpanded: isOpen })
                }
              >
                <div className="w-full grid grid-cols-12 ">
                  <div className="grid col-span-12 grid-cols-12 gap-4  justify-between mx-4 mt-4">
                    <div className="2xl:col-span-3 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2 flex flex-col">
                      <span className=" ">درصد سهام قابل عرضه :</span>
                      <span className=" py-2  ">
                        % {wholeSaleDetail?.sharePercent}
                      </span>
                    </div>
                    <div className="2xl:col-span-3 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2 flex flex-col">
                      <span className=" ">دسته بندی نماد :</span>
                      <span className=" py-2  ">
                        {wholeSaleDetail?.wholeSaleCategoryName}
                      </span>
                    </div>
                    {wholeSaleCondition && (
                      <div className="2xl:col-span-3 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2 flex flex-col">
                        <span className="">مهلت ارسال مدارک :</span>
                        <span className=" py-2  ">
                          {convertDateToJalali(
                            wholeSaleDetail?.deadlineDateCertainty
                          )}
                        </span>
                      </div>
                    )}
                    {!history && !isPublishNotice && (
                      <div className="2xl:col-span-3 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2">
                        <NewSelect
                          label="نوع معامله"
                          className="col-span-2"
                          options={[
                            { name: '', id: '' },
                            ...wholeSaleTradeTypesList,
                          ]}
                          onChange={(value: any) =>
                            setState({
                              wholeSaleTradeTypesId: value,
                              wholeSaleTradeTypesIdError: false,
                              // personTypeName: personalityType.filter(
                              //   (item: any) => item?.id == value
                              // )?.[0]?.name,
                            })
                          }
                          showKey="name"
                          selectedKey="id"
                          required
                          value={wholeSaleTradeTypesId}
                          errorMessage={state?.wholeSaleTradeTypesIdError}
                        />
                      </div>
                    )}
                    {!history && isPublishNotice && (
                      <div className="2xl:col-span-3 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2 flex flex-col">
                        <span className=" ">نوع معامله :</span>
                        <span className=" py-2  ">
                          {wholeSaleDetail?.wholeSaleTradeTypesName}
                        </span>
                      </div>
                    )}
                  </div>
                  {wholeSaleDetail?.sharePercent >= 5 &&
                    wholeSaleDetail?.sharePercent <= 50 && (
                      <>
                        <div className="grid col-span-12 grid-cols-10 gap-4  justify-between mx-4  mt-16">
                          <div className=" col-span-5 2xl:col-span-5 xl:col-span-5 lg:col-span-10 md:col-span-10">
                            <span className=" text-tiny">
                              درصد سهامداران حاضر در جلسه(آخرین مجمع)
                            </span>
                            <div className=" col-span-5 mt-4 flex flex-row items-center">
                              <span>
                                %{' '}
                                {
                                  wholeSaleDetail?.shareholdersLastMettingPercent
                                }
                              </span>
                              {wholeSaleDetail?.shareholdersLastMettingFile !=
                                null && (
                                <>
                                  <Image
                                    src={pdfLogo}
                                    className="w-6 h-6 mr-4"
                                  />
                                  <a
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={() =>
                                      handleDownload(
                                        wholeSaleDetail?.shareholdersLastMettingFile
                                      )
                                    }
                                    // href={`${FILE_BASE_URL}Download/${wholeSaleDetail?.shareholdersLastMettingFile}`}
                                  >
                                    <span className="mr-2">فایل پیوست</span>
                                  </a>
                                </>
                              )}
                            </div>
                          </div>
                          <div className=" col-span-5 2xl:col-span-5 xl:col-span-5 lg:col-span-10 md:col-span-10">
                            <span className=" text-tiny">
                              درصد سهامداران حاضر در جلسه(سال قبل)
                            </span>
                            <div className=" col-span-5 mt-4 flex flex-row items-center">
                              <span>
                                %{' '}
                                {
                                  wholeSaleDetail?.shareholdersOneYearsAgoMettingPercent
                                }
                              </span>

                              {wholeSaleDetail?.shareholdersOneYearsAgoMettingFile !=
                                null && (
                                <>
                                  <Image
                                    src={pdfLogo}
                                    className="w-6 h-6 mr-4"
                                  />
                                  <a
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={() =>
                                      handleDownload(
                                        wholeSaleDetail?.shareholdersOneYearsAgoMettingFile
                                      )
                                    }
                                    // href={`${FILE_BASE_URL}Download/${wholeSaleDetail?.shareholdersOneYearsAgoMettingFile}`}
                                  >
                                    <span className="mr-2">فایل پیوست</span>
                                  </a>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="grid col-span-12 grid-cols-10 gap-4  justify-between mx-4  mt-8">
                          <div className=" col-span-5 2xl:col-span-5 xl:col-span-5 lg:col-span-10 md:col-span-10">
                            <span className=" text-tiny">
                              درصد سهامداران حاضر در جلسه(دو سال قبل)
                            </span>
                            <div className=" col-span-5 mt-4 flex flex-row items-center">
                              <span>
                                %{' '}
                                {
                                  wholeSaleDetail?.shareholdersTwoYearsAgoMettingPercent
                                }
                              </span>
                              {wholeSaleDetail?.shareholdersTwoYearsAgoMettingFile !=
                                null && (
                                <>
                                  <Image
                                    src={pdfLogo}
                                    className="w-6 h-6 mr-4"
                                  />
                                  <a
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={() =>
                                      handleDownload(
                                        wholeSaleDetail?.shareholdersTwoYearsAgoMettingFile
                                      )
                                    }
                                    // href={`${FILE_BASE_URL}Download/${wholeSaleDetail?.shareholdersTwoYearsAgoMettingFile}`}
                                  >
                                    <span className="mr-2">فایل پیوست</span>
                                  </a>
                                </>
                              )}
                            </div>
                          </div>
                          <div className=" col-span-5 2xl:col-span-5 xl:col-span-5 lg:col-span-10 md:col-span-10">
                            <span className=" text-tiny">
                              تعداد اعضا هیئت مدیره
                            </span>
                            <div className=" col-span-5 mt-4 flex flex-row items-center">
                              <span>{wholeSaleDetail?.numberOfBoard}</span>
                              {wholeSaleDetail?.numberOfBoardFile != null && (
                                <>
                                  <Image
                                    src={pdfLogo}
                                    className="w-6 h-6 mr-4"
                                  />
                                  <a
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={() =>
                                      handleDownload(
                                        wholeSaleDetail?.numberOfBoardFile
                                      )
                                    }
                                    // href={`${FILE_BASE_URL}Download/${wholeSaleDetail?.numberOfBoardFile}`}
                                  >
                                    <span className="mr-2">فایل پیوست</span>
                                  </a>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="grid col-span-12 grid-cols-10 gap-4  justify-between mx-4  mt-8">
                          <div className=" col-span-5 2xl:col-span-5 xl:col-span-5 lg:col-span-10 md:col-span-10 flex flex-col ">
                            <span className=" ">میانگین درصد حضور :</span>
                            <span className=" py-2 ">
                              % {wholeSaleDetail?.mettingAverage}
                            </span>
                          </div>
                          <div className=" col-span-5 2xl:col-span-5 xl:col-span-5 lg:col-span-10 md:col-span-10 flex flex-col ">
                            <span className=" ">
                              حداقل درصد حضور سهامداران :
                            </span>
                            <span className=" py-2 ">
                              % {wholeSaleDetail?.mettingMin}
                            </span>
                          </div>
                          <div className=" col-span-5 2xl:col-span-5 xl:col-span-5 lg:col-span-10 md:col-span-10 flex flex-col ">
                            <span className=" ">
                              حداقل درصد تملک سهام لازم جهت اخذ یک سیت مدیریتی :
                            </span>
                            <span className=" py-2 ">
                              % {wholeSaleDetail?.ownershipMin}
                            </span>
                          </div>
                          <div className=" col-span-5 2xl:col-span-5 xl:col-span-5 lg:col-span-10 md:col-span-10 flex flex-col ">
                            <span className=" ">
                              اکثریت تعداد اعضا هیئت مدیره جهت کنترل شرکت :
                            </span>
                            <span className=" py-2 ">
                              {wholeSaleDetail?.boardMax}
                            </span>
                          </div>
                          <div className=" col-span-5 2xl:col-span-5 xl:col-span-5 lg:col-span-10 md:col-span-10 flex flex-col ">
                            <span className=" ">
                              درصد سهام لازم برای کنترل شرکت (بر اساس فرمول مصوب
                              شورای معاونین) :
                            </span>
                            <span className=" py-2 ">
                              % {wholeSaleDetail?.companyControl}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  {/* <div className="col-span-12  px-4 my-4">
                  <TextField
                    multiline
                    className=" bg-white"
                    label="توضیحات"
                    onChange={(e: any) => setState({ detailDescription: e })}
                    value={detailDescription}
                    fullWidth
                  />
                </div> */}
                  {wholeSaleDocumentListData?.length > 0 && (
                    <div className="col-span-12 grid-cols-12 gap-4  justify-between mx-4  mt-8">
                      <Table
                        columns={documentListTable}
                        className="col-span-12 grid grid-cols-12 text-center"
                        dataSource={wholeSaleDocumentListData}
                        pageSize={1000}
                      />
                    </div>
                  )}
                </div>
              </Collapse>
            )}
          </>
        )}
      </div>
      {changePage == 'workflow' && <WorkFlow data={workFlow} />}
      {changePage != 'workflow' ? (
        <div className="flex justify-end my-4">
          <a
            href="/cartable"
            className="border-blue border ml-4 text-blue w-[120px] h-[35px]  flex items-center justify-center rounded"
            // onClick={onConfirm}
          >
            بازگشت
          </a>
          {!history && !isPublishNotice && (
            <>
              {isDeputy ? (
                <a
                  // href="/stock/request-block"
                  className="border-green border mx-4 text-green w-[120px] h-[35px]  flex items-center justify-center rounded"
                  onClick={onConfirmDeputyClick}
                >
                  تایید
                </a>
              ) : (
                <a
                  // href="/stock/request-block"
                  className="border-green border mx-4 text-green w-[120px] h-[35px]  flex items-center justify-center rounded"
                  onClick={onConfirmClick}
                >
                  تایید
                </a>
              )}

              <a
                // href="/stock/request-block"
                className="border-red border mr-4 text-red w-[120px] h-[35px]  flex items-center justify-center rounded"
                onClick={() => setState({ isModalRejectVisible: true })}
              >
                عدم تایید
              </a>
            </>
          )}
          {!history && isPublishNotice && (
            <>
              {wholeSaleCondition && (
                <>
                  <a
                    // href="/stock/request-block"
                    className="border-blue border mx-4 text-blue w-[135px] h-[35px]  flex items-center justify-center rounded"
                    onClick={() => handleExportWholesaleToCeo()}
                  >
                    دانلود مجوز مدیرعامل
                  </a>
                  <a
                    // href="/stock/request-block"
                    className="border-blue border mx-4 text-blue w-[120px] h-[35px]  flex items-center justify-center rounded"
                    onClick={() => handleExportForm1(wholeSaleCashData?.id)}
                  >
                    دانلود فرم شماره 1
                  </a>
                </>
              )}
              <a
                // href="/stock/request-block"
                className="border-blue border mx-4 text-blue w-[120px] h-[35px]  flex items-center justify-center rounded"
                onClick={() => handleExportNotification()}
              >
                دانلود اطلاعیه
              </a>
              <a
                // href="/stock/request-block"
                className="border-green border mx-4 text-green w-[120px] h-[35px]  flex items-center justify-center rounded"
                onClick={() => setState({ isModalEndVisible: true })}
              >
                تایید و اختتام
              </a>
              {/* <a
                // href="/stock/request-block"
                className="border-red border mr-4 text-red w-[120px] h-[35px]  flex items-center justify-center rounded"
                onClick={() => setState({ isModalRejectVisible: true })}
              >
                عدم تایید
              </a> */}
            </>
          )}
        </div>
      ) : null}
      <Modal
        handleOk={() => onOkModalConfirmClick()}
        handleCancel={() => setState({ isModalConfirmVisible: false })}
        isModalVisible={isModalConfirmVisible}
        title={`آیا نسبت به تایید اطلاعات اطمینان دارید؟`}
        okText="  بله "
        cancelText="خیر"
      ></Modal>
      <Modal
        handleOk={() => onRejectClick()}
        handleCancel={() => setState({ isModalRejectVisible: false })}
        isModalVisible={isModalRejectVisible}
        title={`آیا نسبت به عدم تایید اطلاعات اطمینان دارید؟`}
        okText="  بله "
        cancelText="خیر"
      ></Modal>
      <Modal
        handleOk={() => onEndWholesaleClick()}
        handleCancel={() => setState({ isModalEndVisible: false })}
        isModalVisible={isModalEndVisible}
        title={`آیا نسبت به تایید و اختتام اطلاعات اطمینان دارید؟`}
        okText="  بله "
        cancelText="خیر"
      ></Modal>
      <Modal
        handleOk={() => onOkModalDeputyConfirmClick()}
        handleCancel={() => setState({ isModalDeputyConfirmVisible: false })}
        isModalVisible={isModalDeputyConfirmVisible}
        title={`آیا نسبت به تایید اطلاعات اطمینان دارید؟`}
        okText="  بله "
        cancelText="خیر"
      ></Modal>
    </div>
  );
}
export default withAlert(WholeSaleSellRequestDetails);
