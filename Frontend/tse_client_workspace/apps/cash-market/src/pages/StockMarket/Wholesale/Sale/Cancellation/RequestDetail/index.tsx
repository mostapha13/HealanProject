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
  downloadFileApi,
} from 'apps/cash-market/src/Controller';
import { Popconfirm, Radio } from 'antd';
import type { RadioChangeEvent } from 'antd';
import WorkFlow from 'apps/cash-market/src/components/PageFeature/WorkFlow';
import { HeaderTypes } from '@tse/types';
import { Table } from '@tse/components/organism';
import {
  cancellationWholeSaleConfirm,
  cancellationWholeSaleConfirmWithDocument,
  cancellationWholeSaleReject,
  deleteCancellationWholeSaleDocument,
  endWholeSale,
  exportCancellationWholeSale,
  exportDocumentTemplate,
  exportWholesaleForm1,
  exportWholesaleNotification,
  exportWholesaleToCeo,
  getCancellationWholeSaleDocument,
  getCancellationWholeSaleDocumentList,
  getCancellationWholesaleAttachType,
  getCancellationWholesaleByOrderId,
  getWholeSale,
  getWholeSaleCategory,
  getWholeSaleDocumentList,
  getWholeSaleTradeTypes,
  saveCancellationWholesale,
  saveWholeSaleTradeType,
  saveWholesaleDetailExpert,
  uploadCancellationWholeSaleDocuments,
  uploadDocuments,
  wholeSaleReject,
} from 'apps/cash-market/src/Controller/StockMarket/WholeSale';
import NewSelect from 'apps/cash-market/src/components/atoms/NewSelect';
import pdfLogo from 'apps/cash-market/src/assets/images/pdfLogo.png';
import { FILE_BASE_URL } from 'apps/cash-market/src/constants';
import { DatePicker } from '@tse/components/molecules';
import ImageUpload from 'apps/cash-market/src/components/ImageUpload';
import { Modal as AntModal } from 'antd';

const initialState = {
  id: '',
  changePage: 'request',
  pageNo: 1,
  workFlow: null,
  publicMessage: '',
  privateMessage: '',
  wholeSaleSellData: null,
  wholesaleSeller: [],
  requireAttachDataList: [],
  uploadFileValidate: false,
  requireFileUploadComplete: false,
  uploadFileData: null,
  cancellationWholesaleAttachTypeData: [],
  selectedDocumentType: '',
  selectedDocumentTypeName: '',
  selectedDocumentTypeError: '',
  fileDescription: '',
  uploadFileDataError: false,
  sumOfCashSharePercent: '',
  cancelDetailData: null,
  isTrackingModalVisible: false,
  trackingNumber: '',
  wholesaleTypeIdEdit: '',
  isModalConfirmVisible: false,
  isModalRejectVisible: false,
  isModalConfirmUploadDocVisible: false,
  documentTypeData: [],
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
  cancellationWholeSaleDocumentList: [],
  documentId: '',
};
function CanellationRequestDetailSellWholesale({ onAlert }: any) {
  const [state, setState] = useStates<any>(initialState);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    id,
    workFlow,
    changePage,
    publicMessage,
    privateMessage,
    wholeSaleSellData,
    wholesaleSeller,
    requireAttachDataList,
    uploadFileValidate,
    requireFileUploadComplete,
    uploadFileData,
    cancellationWholesaleAttachTypeData,
    selectedDocumentType,
    selectedDocumentTypeName,
    fileDescription,
    uploadFileDataError,
    sumOfCashSharePercent,
    cancelDetailData,
    isTrackingModalVisible,
    trackingNumber,
    wholesaleTypeIdEdit,
    isModalConfirmVisible,
    isModalRejectVisible,
    isModalConfirmUploadDocVisible,
    documentTypeData,
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
    cancellationWholeSaleDocumentList,
    documentId,
  } = state;
  const [uploadFileListItem, setUploadFileListItem] = useState<any>([]);
  const [uploadFileListItemOthers, setUploadFileListItemOthers] = useState<any>(
    []
  );
  const isCashMarketBroker = loadFromSession('isCashMarketBroker');
  const orderId =
    searchParams.get('id') != null ? searchParams.get('id') : null;
  const history =
    searchParams.get('history') != null ? searchParams.get('history') : '';
  const isDetailPage =
    window.location.pathname === '/stock/cancel-request-sell-wholesale-details'
      ? true
      : false;
  const isUploadDocPage =
    window.location.pathname ===
    '/stock/cancel-request-sell-wholesale-upload-doc'
      ? true
      : false;
  const isFyiPage =
    window.location.pathname === '/stock/cancel-request-sell-wholesale-fyi'
      ? true
      : false;
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
      className: 'col-span-1 !justify-center',
      key: 'sellerCode',
    },
    {
      title: 'تعداد سهم',
      dataIndex: 'shareCount',
      className: 'col-span-1 !justify-center',
      key: 'shareCount',
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'درصد فروش از کل معامله',
      dataIndex: 'cashSharePercent',
      className: 'col-span-2 !justify-center',
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
    if (orderId) {
      getWorkFlow();
      handleGetCancellationWholesaleByOrderId(orderId);
    }
  }, []);
  const handleGetWholeSale = (orderId: any) => {
    getWholeSale({
      orderId: orderId,
      onSuccess: (item) => {
        setState({
          wholeSaleSellData: item,
          wholesaleSeller: item?.wholesaleSellers,
          //   wholeSaleDetail: item?.wholeSaleDetail[0],
          wholesaleTypeIdEdit: item?.wholesaleTypeId,
        });
      },
      onFail,
    });
  };
  useEffect(() => {
    let uploadFileListItemOthers: any = [];
    wholesaleSeller?.forEach((data: any) => {
      data?.wholesaleSellerFiles?.forEach((file: any) => {
        uploadFileListItemOthers.push(file);
      });
    });
    setUploadFileListItemOthers(uploadFileListItemOthers);
    const sumOfCashSharePercent = wholesaleSeller?.reduce(
      (acc: any, curr: any) => acc + parseFloat(curr.cashSharePercent),
      0
    );
    setState({
      sumOfCashSharePercent: sumOfCashSharePercent,
    });
  }, [wholesaleSeller]);
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
  const handleGetCancellationWholesaleAttachType = (
    wholesaleTypeIdValue: string | null
  ) => {
    const data = {
      WholesaleTypeId: wholesaleTypeIdValue,
    };
    getCancellationWholesaleAttachType({
      data: data,
      onSuccess: (res) => {
        setState({
          cancellationWholesaleAttachTypeData: res,
          requireAttachDataList: res.filter(
            (item: any) => item.isRequired && !item.isMultiple
          ),
        });
      },
      onFail,
    });
  };
  const handleGetCancellationWholesaleByOrderId = (orderId: string) => {
    const data = {
      OrderId: orderId,
    };
    getCancellationWholesaleByOrderId({
      data: data,
      onSuccess: (res) => {
        setState({
          id: res?.cancellationWholesale?.id,
          cancelDetailData: res,
        });
        setUploadFileListItem(
          res?.cancellationWholesale?.cancellationWholesaleFiles
        );
        handleGetWholeSale(res?.cancellationWholesale?.wholesaleOrderId);
        handleGetCancellationWholesaleAttachType(
          res?.cancellationWholesale?.wholesaleTypeId
        );
        if (isUploadDocPage) {
          handleGetCancellationWholeSaleDocumentData(
            res?.cancellationWholesale?.wholesaleTypeId
          );
          handleGetCancellationWholeSaleDocumentList(
            res?.cancellationWholesale?.wholesaleId
          );
        }
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
  const onChangeFile = (e: any) => {
    uploadFile({
      data: e.target.files[0],
      onSuccess: (res: any) => onSuccessUpload(res),
      onFail,
    });
  };
  const onSuccessUpload = (res: any) => {
    setState({
      permitFileError: false,
      permitFile: res,
    });
  };
  const onRemoveFile = () => {
    setState({
      uploadFileData: null,
      uploadFileError: true,
    });
  };
  const handleDownload = (data: any) => {
    downloadFileApi({
      data: data?.fileId,
      onSuccess: (res: any) => downloadExportFile(res, data?.fileName),
      onFail: (err: any) => console.log('onFail', err),
    });
  };
  const downloadExportFile = (state: any, name: string) => {
    if (state != null) {
      downloadFile(state, name);
    }
  };
  const handleModeChange = (e: RadioChangeEvent) => {
    setState({ changePage: e.target.value });
  };
  const handleGetCancellationWholeSaleDocumentData = (
    wholesaleTypeId: string
  ) => {
    const data = {
      isConditional:
        wholesaleTypeId === '25e89117-17a8-465d-a1fb-2f1a80888773'
          ? true
          : false,
      isCancel: 'CancelationWholesaleDocument',
    };
    getCancellationWholeSaleDocument({
      data: data,
      onSuccess: (res) => {
        setState({
          documentTypeData: res,
        });
      },
      onFail,
    });
  };
  const handleGetCancellationWholeSaleDocumentList = (wholesaleId: string) => {
    getCancellationWholeSaleDocumentList({
      data: {
        wholesaleId: wholesaleId,
      },
      onSuccess: (res) => {
        setState({
          cancellationWholeSaleDocumentList: res,
        });
      },
      onFail,
    });
  };

  const onSubmitDocumentClick = () => {
    if (documentTypeId && permitNo && permitDate && permitFile) {
      const data = {
        orderId: orderId,
        id: uploadDocEditMode
          ? documentId
          : '00000000-0000-0000-0000-000000000000',
        wholeSaleId: cancelDetailData?.cancellationWholesale?.wholesaleId,
        documentTypeId: documentTypeId,
        permitNo,
        permitDate,
        permitDescription,
        permitFile,
      };
      uploadCancellationWholeSaleDocuments({
        data: data,
        onSuccess: (res) => {
          handleGetCancellationWholeSaleDocumentList(
            cancelDetailData?.cancellationWholesale?.wholesaleId
          );
          setState({
            uploadDocEditMode: false,
            documentTypeId: '',
            permitNo: '',
            permitDate: '',
            permitDescription: '',
            permitFile: null,
          });
        },
        onFail,
      });
    } else {
      setState({
        ...(!documentTypeId && { documentTypeIdError: true }),
        ...(!permitNo && { permitNoError: true }),
        ...(!permitDate && { permitDateError: true }),
        ...(!permitFile && { permitFileError: true }),
      });
    }
  };
  const onEditUploadDocument = (item: any) => {
    setState({
      documentId: item.id,
      documentTypeId: item?.documentTypeId,
      permitNo: item?.permitNo,
      permitDate: item?.permitDate,
      permitDescription: item?.permitDescription,
      permitFile: item?.permitFile,
      uploadDocEditMode: true,
    });
  };
  const onRemoveUploadDocItem = (id: string) => {
    deleteCancellationWholeSaleDocument({
      data: {
        orderId: orderId,
        id: id,
      },
      onSuccess: (res) => {
        handleGetCancellationWholeSaleDocumentList(
          cancelDetailData?.cancellationWholesale?.wholesaleId
        );
      },
      onFail,
    });
  };
  const onOkModalConfirmClick = () => {
    setState({ isModalConfirmVisible: false });
    const data = {
      orderId: orderId,
      publicMessage: publicMessage,
      privateMessage: privateMessage,
    };
    cancellationWholeSaleConfirm({
      data: data,
      onSuccess: (res) => {
        if (res.succeeded) {
          onAlert({
            type: 'success',
            message: 'اطلاعات با موفقیت تایید گردید',
          });
          navigate('/cartable');
        } else {
          onAlert({
            type: 'error',
            message: res?.errors?.[0],
          });
        }
      },
      onFail,
    });
  };
  const onOkModalConfirmUploadDocClick = () => {
    setState({ isModalConfirmUploadDocVisible: false });
    const data = {
      orderId: orderId,
      publicMessage: publicMessage,
      privateMessage: privateMessage,
      wholeSaleId: cancelDetailData?.cancellationWholesale?.wholesaleId,
    };
    cancellationWholeSaleConfirmWithDocument({
      data: data,
      onSuccess: (res) => {
        if (res.succeeded) {
          onAlert({
            type: 'success',
            message: 'اطلاعات با موفقیت تایید گردید',
          });
          navigate('/cartable');
        } else {
          onAlert({
            type: 'error',
            message: res?.errors?.[0],
          });
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
    cancellationWholeSaleReject({
      data: data,
      onSuccess: (res) => {
        onAlert({
          type: 'success',
          message: 'درخواست شما با موفقیت ثبت گردید.',
        });
        navigate('/cartable');
      },
      onFail,
    });
  };
  const handleExportCancellationWholeSale = () => {
    const data = {
      OrderId: orderId,
    };
    exportCancellationWholeSale({
      data: data,
      onSuccess: (res) => {
        downloadExportFile(res, 'export.docx');
      },
      onFail,
    });
  };
  const onExportBuyDocument = () => {
    const data = {
      DocumentId: documentTypeId,
      OrderId: orderId,
    };
    exportDocumentTemplate({
      data: data,
      onSuccess: (res) => {
        downloadExportFile(res, 'فرم مکاتبات.docx');
      },
      onFail,
    });
  };
  return (
    <>
      <div className=" border-lightGray border ">
        <div className="my-1">
          <Radio.Group onChange={handleModeChange} value={changePage}>
            <Radio.Button value="request">فرآیند فعلی</Radio.Button>
            <Radio.Button value="workflow">گردش کار</Radio.Button>
          </Radio.Group>
        </div>
        {isFyiPage && (
          <div
            className={`items-center justify-center flex border-b-2 border-lightGray bg-gray px-4`}
          >
            <div className=" flex flex-row">
              <span className=" p-2 font-bold text-green">
                درخواست شما مورد تایید قرار گرفت
              </span>
            </div>
          </div>
        )}
        <div className=" items-start flex border-b-2  justify-between bg-lightGray border-lightGray  px-4">
          <div className=" flex flex-row">
            <span className=" p-2 font-bold ">درخواست :</span>
            <span className=" p-2  ">
              {cancelDetailData?.cancellationWholesale?.workFlowName}
            </span>
          </div>
          <div className=" flex flex-row">
            <span className=" p-2 font-bold ">کد پیگیری :</span>
            <span className=" p-2  ">
              {cancelDetailData?.cancellationWholesale?.trackingNumber}
            </span>
          </div>
          <div className=" flex flex-row">
            <span className=" p-2 font-bold ">وضعیت :</span>
            <span className=" p-2  ">
              {cancelDetailData?.cancellationWholesale?.orderStatusName}
            </span>
          </div>
        </div>
        {changePage == 'request' && (
          <>
            <div className="grid col-span-10 grid-cols-10 gap-4 justify-between mx-4 mt-2 ">
              <div className="col-span-2 flex flex-row items-center ">
                <div className=" font-bold w-4 h-4 bg-blue rounded-full" />
                <span className=" py-2 mx-2">
                  {wholeSaleSellData?.wholesaleTradeTypesName}
                </span>
              </div>
            </div>
            <div className="grid col-span-10 grid-cols-10 gap-4 justify-between mx-4 mt-2">
              <div className="col-span-2 flex flex-row items-center ">
                <div className=" font-bold w-4 h-4 bg-blue rounded-full" />
                <span className=" py-2 mx-2">
                  {wholeSaleSellData?.wholesaleTypeName}
                </span>
              </div>
            </div>
            {!isCashMarketBroker && isUploadDocPage && (
              <>
                <div className="grid col-span-10 grid-cols-12 gap-4  justify-between mx-4 mt-4 shadow-md p-4 ">
                  <div className=" col-span-12 items-start flex mt-2 ">
                    <span className=" p-2 font-bold text-blue">مکاتبات :</span>
                  </div>

                  <div className="2xl:col-span-3 xl:col-span-3 lg:col-span-3 md:col-span-6  col-span-3">
                    <NewSelect
                      label="گیرنده نامه"
                      className="col-span-2"
                      options={[{ name: '', id: '' }, ...documentTypeData]}
                      onChange={(value: any) =>
                        setState({
                          documentTypeId: value,
                          documentTypeIdError: false,
                          documentTypeIdName: documentTypeData.filter(
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
                    className="2xl:col-span-3 xl:col-span-3 lg:col-span-3 md:col-span-6  col-span-3"
                    value={permitNo}
                    onChange={(value: any) =>
                      setState({
                        permitNo: value,
                        permitNoError: false,
                      })
                    }
                    required
                    errorMessage={permitNoError}
                  />
                  <div className="2xl:col-span-3 xl:col-span-3 lg:col-span-3 md:col-span-6  col-span-3 z-10">
                    <DatePicker
                      label="تاریخ نامه"
                      value={permitDate}
                      onChange={(value: any) =>
                        setState({
                          permitDate: value,
                          permitDateError: '',
                        })
                      }
                      required
                      error={permitDateError}
                      onClearDate={() => setState({ permitDate: '' })}
                    />
                  </div>
                  <TextField
                    label="توضیحات"
                    className="2xl:col-span-3 xl:col-span-3 lg:col-span-3 md:col-span-6  col-span-3"
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
                  <div className=" 2xl:col-span-6 xl:col-span-6 lg:col-span-6 md:col-span-12  col-span-6">
                    <Upload
                      onChange={(file: any) => onChangeFile(file)}
                      value={permitFile?.fileName}
                      href={permitFile?.link}
                      name="documentFile"
                      onDelete={() => onRemoveFile()}
                      error={permitFileError}
                    />
                  </div>
                  <div className="  col-span-12 flex justify-end items-center">
                    {documentTypeId && (
                      <Button
                        onClick={onExportBuyDocument}
                        className="border-blue border w-24 h-9 text-blue mx-4"
                      >
                        دانلود فرم
                      </Button>
                    )}
                    <Button
                      onClick={onSubmitDocumentClick}
                      className="bg-green w-24 h-9 text-white "
                    >
                      تایید و اضافه
                    </Button>
                  </div>
                  <div className="col-span-12 my-10">
                    <Table
                      columns={uploadDocColumns}
                      className="col-span-12 grid grid-cols-12 text-center"
                      dataSource={cancellationWholeSaleDocumentList}
                      //   scroll={{ x: 'calc(700px + 30%)' }}
                      pageSize={1000}
                    />
                  </div>
                </div>
              </>
            )}
            <div className=" col-span-10 items-start flex mt-2">
              <span className=" p-2 font-bold text-blue underline">
                اطلاعات عرضه :
              </span>
            </div>
            <div className="grid col-span-10 grid-cols-10 gap-4 justify-between mx-4">
              <div className="col-span-2 flex flex-col my-2">
                <span className=" font-bold">نماد :</span>
                <span className=" py-2 ">{wholeSaleSellData?.symbol}</span>
              </div>
              <div className="col-span-2 flex flex-col my-2">
                <span className=" font-bold">نام شرکت :</span>
                <span className=" py-2 ">{wholeSaleSellData?.symbolName}</span>
              </div>
              <div className="col-span-2 flex flex-col my-2">
                <span className=" font-bold">تعداد کل سهام شرکت :</span>
                <span className=" py-2 ">
                  {separator(wholeSaleSellData?.tradeTotalNumber)}
                </span>
              </div>
              <div className="col-span-2 flex flex-col my-2">
                <span className=" font-bold">تعداد سهام قابل عرضه :</span>
                <span className=" py-2 ">
                  {separator(wholeSaleSellData?.tradeVolume)}
                </span>
              </div>
              <div className="col-span-2 flex flex-col my-2">
                <span className=" font-bold">درصد سهام قابل عرضه :</span>
                <span className=" py-2 ">
                  {wholeSaleSellData?.tradePercent}
                </span>
              </div>
              <div className="col-span-2 flex flex-col my-2">
                <span className=" font-bold">قیمت پایه :</span>
                <span className=" py-2 ">
                  {separator(wholeSaleSellData?.basePrice)}
                </span>
              </div>
              {wholesaleTypeIdEdit ===
                '25e89117-17a8-465d-a1fb-2f1a80888773' && (
                <div className="col-span-2 flex flex-col my-2">
                  <span className=" font-bold">درصد حصه نقدی :</span>
                  <span className=" py-2 ">
                    {wholeSaleSellData?.cashSharePercent}
                  </span>
                </div>
              )}
              <div className="col-span-2 flex flex-col my-2">
                <span className=" font-bold">تاریخ عرضه :</span>
                <span className=" py-2 ">
                  {convertDateToJalali(wholeSaleSellData?.tradeDate)}
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
                  <span>مجموع درصد از کل سرمایه : {sumOfCashSharePercent}</span>
                </div>
                <Table
                  columns={sellerColumns}
                  className="col-span-10 grid grid-cols-12 text-center"
                  dataSource={wholeSaleSellData?.wholesaleSellers}
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
                  {wholeSaleSellData?.responsibleName}
                </span>
              </div>
              <div className="col-span-2 flex flex-col">
                <span className=" font-bold">سمت :</span>
                <span className=" py-2 ">
                  {wholeSaleSellData?.responsiblePost}
                </span>
              </div>
              <div className="col-span-2 flex flex-col">
                <span className=" font-bold">شماره همراه :</span>
                <span className=" py-2 ">
                  {wholeSaleSellData?.responsibleMobile}
                </span>
              </div>
            </div>
            {cancelDetailData?.cancellationWholesale
              ?.cancellationWholesaleMessage?.length > 0 && (
              <div className="grid col-span-10 grid-cols-12 gap-4  justify-between mx-4 mt-4">
                <div className=" col-span-12 items-start flex  ">
                  <span className="  font-bold text-blue underline">
                    توضیحات :
                  </span>
                </div>
                <div className=" col-span-12  pb-4">
                  <Table
                    data={
                      cancelDetailData?.cancellationWholesale
                        ?.cancellationWholesaleMessage
                    }
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
            <div className="grid col-span-10 grid-cols-10 gap-4  justify-between mx-4 mt-4 ">
              <div className=" col-span-10 items-start flex  ">
                <span className="  font-bold text-blue underline">مدارک :</span>
              </div>
              <div className=" col-span-10 grid grid-cols-4 pb-4 bg-[#EEEBFF] mb-4 px-4">
                {wholeSaleSellData?.publicFiles?.length > 0 &&
                  wholeSaleSellData?.publicFiles?.map(
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
            {uploadFileListItemOthers?.length > 0 && (
              <div className="grid col-span-10 grid-cols-10 gap-4  justify-between mx-4 mt-4 ">
                <div className=" col-span-10 items-start flex  ">
                  <span className="  font-bold text-blue underline">
                    مدارک و مستندات عرضه کننده :
                  </span>
                </div>
                {wholeSaleSellData?.wholesaleSellers?.map(
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
            )}
            <div className="grid col-span-10 grid-cols-10 gap-4  justify-between mx-4 mt-4 ">
              <div className=" col-span-10 items-start flex mt-2">
                <span className=" p-2 font-bold text-blue underline">
                  مدارک و مستندات انصراف از فروش :
                </span>
              </div>

              <div className="col-span-10 grid grid-cols-4 pb-4 bg-[#EEEBFF] mb-4 px-4 ">
                {uploadFileListItem?.length > 0 &&
                  uploadFileListItem?.map((item: any, index: any) => (
                    <ImageUploadPreview
                      className="2xl:col-span-1 xl:col-span-2 lg:col-span-2 md:col-span-4  col-span-3"
                      data={item}
                      onAlert={onAlert}
                    />
                  ))}
              </div>
            </div>
            {!isFyiPage && (
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
          {!history && (
            <>
              {isDetailPage ? (
                <>
                  <a
                    // href="/stock/request-block"
                    className="border-green border mx-4 text-green w-[120px] h-[35px]  flex items-center justify-center rounded"
                    onClick={() => setState({ isModalConfirmVisible: true })}
                  >
                    تایید
                  </a>
                  <a
                    // href="/stock/request-block"
                    className="border-red border mr-4 text-red w-[120px] h-[35px]  flex items-center justify-center rounded"
                    onClick={() => setState({ isModalRejectVisible: true })}
                  >
                    عدم تایید
                  </a>
                </>
              ) : isUploadDocPage ? (
                <>
                  {/* <a
                    // href="/stock/request-block"
                    className="border-blue border mx-4 text-blue w-[120px] h-[35px]  flex items-center justify-center rounded"
                    onClick={handleExportCancellationWholeSale}
                  >
                    دانلود اطلاعیه
                  </a> */}
                  <a
                    // href="/stock/request-block"
                    className="border-green border mx-4 text-green w-[120px] h-[35px]  flex items-center justify-center rounded"
                    onClick={() =>
                      setState({ isModalConfirmUploadDocVisible: true })
                    }
                  >
                    تایید
                  </a>
                  {/* <a
                    // href="/stock/request-block"
                    className="border-red border mr-4 text-red w-[120px] h-[35px]  flex items-center justify-center rounded"
                    onClick={() => setState({ isModalRejectVisible: true })}
                  >
                    عدم تایید
                  </a> */}
                </>
              ) : isFyiPage ? (
                <>
                  <a
                    // href="/stock/request-block"
                    className="border-green border mx-4 text-green w-[120px] h-[35px]  flex items-center justify-center rounded"
                    onClick={() => setState({ isModalConfirmVisible: true })}
                  >
                    تایید
                  </a>
                </>
              ) : null}
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
        handleOk={() => onOkModalConfirmUploadDocClick()}
        handleCancel={() => setState({ isModalConfirmUploadDocVisible: false })}
        isModalVisible={isModalConfirmUploadDocVisible}
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
    </>
  );
}
export default withAlert(CanellationRequestDetailSellWholesale);
