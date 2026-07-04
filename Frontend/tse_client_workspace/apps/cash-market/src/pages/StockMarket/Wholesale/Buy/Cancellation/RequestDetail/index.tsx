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
  Icon,
  Modal,
  Upload,
  Collapse,
} from '@tse/components/atoms';
import { Modal as AntModal } from 'antd';

import {
  convertDateAndTime,
  convertDateAndTimeJalali,
  convertDateAndTimeToJalali,
  convertDateToJalali,
  downloadFile,
  loadFromSession,
} from '@tse/tools';
import {
  downloadFileApi,
  getOrderWorkFlow,
  uploadFile,
} from 'apps/cash-market/src/Controller';
import { Modal as AntMoadl, Popconfirm, Radio } from 'antd';
import type { RadioChangeEvent } from 'antd';
import WorkFlow from 'apps/cash-market/src/components/PageFeature/WorkFlow';
import { HeaderTypes } from '@tse/types';
import { Table } from '@tse/components/organism';
import {
  cancellationWholeSaleBuyConfirm,
  cancellationWholeSaleBuyFinalConfirm,
  cancellationWholeSaleBuyReject,
  deleteCancellationWholeSaleBuyDocument,
  exportDocumentTemplate,
  getCancellationWholesaleBuyAttachType,
  getCancellationWholesaleBuyByOrderId,
  getCancellationWholeSaleBuyDocument,
  getWholesaleBuy,
  getWholeSaleBuyDocumentType,
  getWholesaleReturnReasons,
  saveCancellationWholesaleBuy,
  uploadCancellationWholeSaleBuyDocument,
} from 'apps/cash-market/src/Controller/StockMarket/WholeSale';
import NewSelect from 'apps/cash-market/src/components/atoms/NewSelect';
import ImageUpload from 'apps/cash-market/src/components/ImageUpload';
import { DatePicker } from '@tse/components/molecules';

const initialState = {
  id: '',
  changePage: 'request',
  pageNo: 1,
  wholesalebuyData: {},
  wholesaleBuyer: [],
  workFlow: null,
  publicMessage: '',
  privateMessage: '',
  isBoardMemberVisible: false,
  wholesaleReturnReasonTypeName: '',
  boardMemberData: [],
  description: '',
  cancelDetailData: null,
  isModalConfirmVisible: false,
  isModalRejectVisible: false,
  cancellationWholeSaleBuyDocumentList: [],
  typeId: '',
  typeIdName: '',
  typeIdError: false,
  wholeSaleBuyDocumentTypeId: '',
  wholeSaleBuyDocumentTypeName: '',
  wholeSaleBuyDocumentTypeError: false,
  title: '',
  titleError: false,
  documentNo: '',
  documentNoError: false,
  documentDate: '',
  documentDateError: false,
  documentDescription: '',
  documentDescriptionError: false,
  documentFile: null,
  documentFileError: false,
  buyDocumentTypeData: [],
  documentId: '',
  editMode: false,
  isModalDocumentVisible: false,
};
function RequestDetailCancelBuyWholesale({ onAlert }: any) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useStates<any>(initialState);
  const [uploadFileListItem, setUploadFileListItem] = useState<any>([]);
  const [uploadFileListItemOthers, setUploadFileListItemOthers] = useState<any>(
    []
  );
  const {
    id,
    changePage,
    wholesalebuyData,
    wholesaleBuyer,
    workFlow,
    publicMessage,
    privateMessage,
    boardMemberData,
    isBoardMemberVisible,
    wholesaleReturnReasonTypeName,
    description,
    cancelDetailData,
    isModalConfirmVisible,
    isModalRejectVisible,
    cancellationWholeSaleBuyDocumentList,
    typeId,
    typeIdName,
    typeIdError,
    wholeSaleBuyDocumentTypeId,
    wholeSaleBuyDocumentTypeName,
    wholeSaleBuyDocumentTypeError,
    title,
    titleError,
    documentNo,
    documentNoError,
    documentDate,
    documentDateError,
    documentDescription,
    documentDescriptionError,
    documentFile,
    documentFileError,
    buyDocumentTypeData,
    documentId,
    editMode,
    isModalDocumentVisible,
  } = state;
  const isCashMarketBroker = loadFromSession('isCashMarketBroker');
  const orderId =
    searchParams.get('id') != null ? searchParams.get('id') : null;
  const history =
    searchParams.get('history') != null ? searchParams.get('history') : '';
  const isUploadDocPage =
    window.location.pathname ===
    '/stock/cancel-request-buy-wholesale-upload-doc'
      ? true
      : false;
  const isDetailPage =
    window.location.pathname === '/stock/cancel-request-buy-wholesale-details'
      ? true
      : false;
  const isFyiPage =
    window.location.pathname === '/stock/cancel-request-buy-wholesale-fyi'
      ? true
      : false;
  const typeData = [
    {
      name: 'ارسالی',
      id: 1,
    },
    {
      name: 'دریافتی',
      id: 2,
    },
  ];
  const buyerColumns: HeaderTypes[] = [
    {
      title: 'شناسه',
      dataIndex: 'tableId',
      className: 'col-span-1 !justify-start',
      key: 'tableId',
    },
    {
      title: 'نوع شخصیت',
      dataIndex: 'personTypeName',
      className: 'col-span-1 !justify-start',
      key: 'personTypeName',
    },
    {
      title: 'نام متقاضی',
      dataIndex: 'fname',
      className: 'col-span-1 !justify-start',
      key: 'fname',
    },
    {
      title: 'نام خانوادگی/نام شرکت',
      dataIndex: 'lname',
      className: 'col-span-2 !justify-start',
      key: 'lname',
    },
    {
      title: 'کد ملی/شناسه شرکت',
      dataIndex: 'buyerCode',
      className: 'col-span-1 !justify-start',
      key: 'buyerCode',
    },
    {
      title: 'تعداد سهام یا حق تقدم سهام مورد تقاضا',
      dataIndex: 'buyCount',
      className: 'col-span-2 !justify-center',
      key: 'buyCount',
    },
    {
      title: 'درصد خرید از کل سهام عرضه شده',
      dataIndex: 'buyPercent',
      className: 'col-span-2 !justify-center',
      key: 'buyPercent',
    },
    {
      title: 'اطلاعات مدیران',
      dataIndex: 'hasBuyerInfoBoard',
      className: 'col-span-1 !justify-center',
      key: 'hasBuyerInfoBoard',
      render: (item: any, record: any) => (
        <div className="flex flex-row items-center justify-center">
          {record?.personTypeId === 'cafd25d9-4948-4b97-b3ec-9761e4496e01' ||
          record?.personTypeId === '5882faca-e9d3-4329-b19c-c92eec610c62' ? (
            <Icon
              name="icon-managers-info"
              classname={`${
                item ? 'text-green' : 'text-red'
              } text-lg cursor-pointer`}
              onClick={() =>
                setState({
                  boardMemberData: record?.wholesaleBuyerInfoBoards,
                  isBoardMemberVisible: true,
                })
              }
            />
          ) : null}
        </div>
      ),
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
  const boardMembercolumns: HeaderTypes[] = [
    {
      title: 'نام',
      dataIndex: 'fname',
      key: 'fname',
      className: 'col-span-3 !justify-start',
    },
    {
      title: 'نام خانوادگی',
      dataIndex: 'lname',
      key: 'lname',
      className: 'col-span-4 !justify-start',
    },
    {
      title: 'کد ملی',
      dataIndex: 'buyerCode',
      key: 'buyerCode',
      className: 'col-span-4 !justify-start',
    },
  ];
  const uploadDocColumns: HeaderTypes[] = [
    {
      title: 'عنوان',
      dataIndex: 'title',
      className: 'col-span-2 !justify-start',
      key: 'title',
    },
    {
      title: 'گیرنده نامه',
      dataIndex: 'wholeSaleBuyDocumentTypeName',
      className: 'col-span-1 !justify-start',
      key: 'wholeSaleBuyDocumentTypeName',
    },
    {
      title: 'شماره نامه',
      dataIndex: 'documentNo',
      className: 'col-span-2 !justify-start',
      key: 'documentNo',
    },
    {
      title: 'تاریخ نامه',
      dataIndex: 'documentDate',
      className: 'col-span-1 !justify-start',
      key: 'documentDate',
      render: (item: any) => <span>{convertDateToJalali(item)}</span>,
    },
    {
      title: 'فایل',
      dataIndex: 'documentFile',
      className: 'col-span-2 !justify-center',
      key: 'documentFile',
      render: (item: any) => (
        <a onClick={() => handleDownload(item)}>{item?.fileName}</a>
      ),
    },
    {
      title: 'توضیحات',
      dataIndex: 'documentDescription',
      className: 'col-span-2 !justify-start',
      key: 'documentDescription',
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
      handleGetCancellationWholesaleBuyByOrderId(orderId);
    }
    if (isUploadDocPage) {
      getBuyDocumentType();
    }
    getWorkFlow();
  }, []);
  useEffect(() => {
    if (isUploadDocPage) {
      getCancellationWholeSaleBuyDocumentData();
    }
  }, [wholesalebuyData]);

  useEffect(() => {
    let uploadFileListItemOthers: any = [];
    wholesaleBuyer?.forEach((data: any) => {
      data?.wholesaleBuyerFiles?.forEach((file: any) => {
        uploadFileListItemOthers.push(file);
      });
    });
    setUploadFileListItemOthers(uploadFileListItemOthers);
  }, [wholesaleBuyer]);

  const handleGetWholesaleBuy = (orderId: any) => {
    getWholesaleBuy({
      orderId: orderId,
      onSuccess: (item) => {
        setState({
          wholesalebuyData: item,
          wholesaleBuyer: item?.wholesaleBuyerInfos,
        });
      },
      onFail,
    });
  };

  const handleGetCancellationWholesaleBuyByOrderId = (orderId: string) => {
    getCancellationWholesaleBuyByOrderId({
      data: {
        OrderId: orderId,
      },
      onSuccess: (res) => {
        setState({
          id: res?.cancellationWholesale?.id,
          cancelDetailData: res,
          wholesaleReturnReasonTypeId:
            res?.cancellationWholesale?.wholesaleReturnReasonTypeId,
          description: res?.cancellationWholesale?.description,
          wholesaleReturnReasonTypeName:
            res?.cancellationWholesale?.wholesaleReturnReasonTypeName,
        });
        setUploadFileListItem(
          res?.cancellationWholesale?.cancellationWholesaleByeFiles
        );
        handleGetWholesaleBuy(res?.cancellationWholesale?.wholesaleBuyOrderId);
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

  const onFail = (error: any) => {
    onAlert(error);
  };
  const setErrorMessage = (key: string) => {
    const errorMessage = '  ';
    setState({ [`${key}Error`]: errorMessage });
  };

  const downloadExportFile = (state: any, name: string) => {
    if (state != null) {
      downloadFile(state, name);
    }
  };
  const handleModeChange = (e: RadioChangeEvent) => {
    setState({ changePage: e.target.value });
  };
  const handleDownload = (data: any) => {
    downloadFileApi({
      data: data?.fileId,
      onSuccess: (res: any) => downloadExportFile(res, data?.fileName),
      onFail: (err: any) => console.log('onFail', err),
    });
  };

  const onOkModalConfirmClick = () => {
    setState({ isModalConfirmVisible: false });
    const data = {
      orderId: orderId,
      publicMessage: publicMessage,
      privateMessage: privateMessage,
    };
    cancellationWholeSaleBuyConfirm({
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
    cancellationWholeSaleBuyReject({
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
  const onOkModalDocument = () => {
    setState({ isModalDocumentVisible: false });
    const data = {
      wholesaleBuyId: wholesalebuyData?.id,
      orderId: orderId,
      publicMessage: publicMessage,
      privateMessage: privateMessage,
    };
    cancellationWholeSaleBuyFinalConfirm({
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
  const onChangeFile = (e: any) => {
    uploadFile({
      data: e.target.files[0],
      onSuccess: (res: any) => onSuccessUpload(res),
      onFail,
    });
  };
  const onSuccessUpload = (res: any) => {
    setState({
      documentFile: res,
      documentFileError: false,
    });
  };
  const onRemoveFile = () => {
    setState({
      documentFile: {},
      documentFileError: true,
    });
  };
  const getCancellationWholeSaleBuyDocumentData = () => {
    const data = {
      WholesaleBuyId: wholesalebuyData?.id,
    };
    getCancellationWholeSaleBuyDocument({
      data: data,
      onSuccess: (res) => {
        setState({
          cancellationWholeSaleBuyDocumentList: res,
        });
      },
      onFail,
    });
  };
  const getBuyDocumentType = () => {
    getWholeSaleBuyDocumentType({
      onSuccess: (res) => {
        setState({
          buyDocumentTypeData: res?.filter((item: any) => item.isCancel),
        });
      },
      onFail,
    });
  };
  const onSubmitDocumentClick = () => {
    if (
      wholeSaleBuyDocumentTypeId &&
      documentNo &&
      documentDate &&
      documentFile
    ) {
      const data = {
        orderId: orderId,
        wholeSaleBuyDocument: {
          id: editMode ? documentId : '00000000-0000-0000-0000-000000000000',
          wholesaleBuyId: wholesalebuyData?.id,
          title,
          wholeSaleBuyDocumentTypeId: parseInt(wholeSaleBuyDocumentTypeId),
          documentNo,
          documentDate,
          documentDescription,
          documentFile,
          isAccept: null,
        },
      };
      uploadCancellationWholeSaleBuyDocument({
        data: data,
        onSuccess: (res) => {
          getCancellationWholeSaleBuyDocumentData();
          setState({
            editMode: false,
            title: '',
            wholeSaleBuyDocumentTypeId: '',
            documentNo: '',
            documentDate: '',
            documentDescription: '',
            documentFile: null,
            documentId: '',
            isAccept: null,
          });
        },
        onFail,
      });
    } else {
      setState({
        ...(!typeId && { typeIdError: true }),
        ...(!wholeSaleBuyDocumentTypeId && {
          wholeSaleBuyDocumentTypeIdError: true,
        }),
        ...(!documentNo && { documentNoError: true }),
        ...(!documentDate && { documentDateError: true }),
        ...(!documentFile && { documentFileError: true }),
      });
    }
  };
  const onRemoveUploadDocItem = (id: string) => {
    deleteCancellationWholeSaleBuyDocument({
      data: {
        orderId: orderId,
        id: id,
      },
      onSuccess: (res) => {
        getCancellationWholeSaleBuyDocumentData();
      },
      onFail,
    });
  };
  const onEditUploadDocument = (item: any) => {
    setState({
      documentId: item.id,
      title: item?.title,
      typeId: item?.typeId,
      wholeSaleBuyDocumentTypeId: item?.wholeSaleBuyDocumentTypeId,
      documentNo: item?.documentNo,
      documentDate: item?.documentDate,
      documentDescription: item?.documentDescription,
      documentFile: item?.documentFile,
      isAccept: item?.isAccept,
      editMode: true,
    });
  };
  const onExportBuyDocument = () => {
    const data = {
      DocumentId: wholeSaleBuyDocumentTypeId,
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
  const BoardMemberModal = () => {
    return (
      <>
        <AntMoadl
          visible={isBoardMemberVisible}
          closable={true}
          style={{ textAlign: 'center', padding: '0px' }}
          title={'اطلاعات مدیران'}
          footer={null}
          centered
          width={'50%'}
          onCancel={() => setState({ isBoardMemberVisible: false })}
        >
          <Table
            columns={boardMembercolumns}
            className="col-span-12 grid grid-cols-12 text-center"
            dataSource={boardMemberData}
            pageSize={1000}
            scrollX={200}
          />
        </AntMoadl>
      </>
    );
  };
  return (
    <>
      <div className="border-2 border-lightGray">
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
              <span className=" p-2 font-bold text-green ">
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
          <div className="w-full grid grid-cols-10 ">
            <div className="grid col-span-10 grid-cols-10 gap-4 justify-between mx-4 mt-2 ">
              <div className="col-span-10 flex flex-row items-center ">
                <div className=" font-bold w-4 h-4 bg-blue rounded-full" />
                <span className=" py-2 mx-2 font-bold">نوع فروش :</span>
                <span className=" py-2 mx-2">
                  {wholesalebuyData?.wholesaleTypeName}
                </span>
              </div>
            </div>
            {!isCashMarketBroker && isUploadDocPage && (
              <>
                {/* <div className="col-span-10 flex flex-row mx-4 mt-4 shadow-md p-4">
                  <span className="ml-4 text-gray">
                    آیا خریدار صلاحیت دارد؟
                  </span>
                  <span className=" font-bold">
                    {wholesalebuyData?.wholesaleBuyStatusName}
                  </span>
                </div> */}
                <div className="grid col-span-10 grid-cols-12 gap-4  justify-between mx-4 mt-4 shadow-md p-4 ">
                  <div className=" col-span-12 items-start flex mt-2 ">
                    <span className=" p-2 font-bold text-blue">مکاتبات :</span>
                  </div>
                  <TextField
                    label="عنوان"
                    className="2xl:col-span-3 xl:col-span-3 lg:col-span-3 md:col-span-6  col-span-3"
                    value={title}
                    onChange={(value: any) =>
                      setState({
                        title: value,
                        titleError: false,
                      })
                    }
                    // required
                    // errorMessage={titleError}
                  />
                  <div className="2xl:col-span-3 xl:col-span-3 lg:col-span-3 md:col-span-6  col-span-3">
                    <NewSelect
                      label="گیرنده نامه"
                      className="col-span-2"
                      options={[{ name: '', id: '' }, ...buyDocumentTypeData]}
                      onChange={(value: any) =>
                        setState({
                          wholeSaleBuyDocumentTypeId: value,
                          wholeSaleBuyDocumentTypeIdError: false,
                          wholeSaleBuyDocumentTypeIdName:
                            buyDocumentTypeData.filter(
                              (item: any) => item?.id == value
                            )?.[0]?.name,
                        })
                      }
                      showKey="name"
                      selectedKey="id"
                      required
                      value={wholeSaleBuyDocumentTypeId}
                      errorMessage={state?.wholeSaleBuyDocumentTypeIdError}
                    />
                  </div>
                  <TextField
                    label="شماره نامه"
                    className="2xl:col-span-3 xl:col-span-3 lg:col-span-3 md:col-span-6  col-span-3"
                    value={documentNo}
                    onChange={(value: any) =>
                      setState({
                        documentNo: value,
                        documentNoError: false,
                      })
                    }
                    required
                    errorMessage={documentNoError}
                  />
                  <div className="2xl:col-span-3 xl:col-span-3 lg:col-span-3 md:col-span-6  col-span-3 z-10">
                    <DatePicker
                      label="تاریخ نامه"
                      value={documentDate}
                      onChange={(value: any) =>
                        setState({
                          documentDate: value,
                          documentDateError: '',
                        })
                      }
                      required
                      error={documentDateError}
                      onClearDate={() => setState({ documentDate: '' })}
                    />
                  </div>
                  <TextField
                    label="توضیحات"
                    className="2xl:col-span-3 xl:col-span-3 lg:col-span-3 md:col-span-6  col-span-3"
                    value={documentDescription}
                    onChange={(value: any) =>
                      setState({
                        documentDescription: value,
                        documentDescriptionError: false,
                      })
                    }
                    // required
                    // errorMessage={documentDescriptionError}
                  />
                  <div className=" 2xl:col-span-6 xl:col-span-6 lg:col-span-6 md:col-span-12  col-span-6 mr-4">
                    <Upload
                      onChange={(file: any) => onChangeFile(file)}
                      value={documentFile?.fileName}
                      href={documentFile?.link}
                      name="documentFile"
                      onDelete={() => onRemoveFile()}
                      error={documentFileError}
                    />
                  </div>
                  <div className="  col-span-12 flex justify-end items-center">
                    {/* {typeId == 1 ? (
                      <Button
                        onClick={onExportBuyDocument}
                        className="border-blue border w-24 h-9 text-blue mx-4"
                      >
                        دانلود فرم
                      </Button>
                    ) : typeId == 2 ? (
                      <div className="mx-10">
                        <Radio.Group
                          onChange={(e: RadioChangeEvent) =>
                            handleRadioChangeIsAccept(e)
                          }
                          value={isAccept}
                        >
                          <Radio value={true}>تایید شد</Radio>
                          <Radio value={false}>رد شد</Radio>
                        </Radio.Group>
                      </div>
                    ) : null} */}
                    {wholeSaleBuyDocumentTypeId && (
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
                      dataSource={cancellationWholeSaleBuyDocumentList}
                      //   scroll={{ x: 'calc(700px + 30%)' }}
                      pageSize={1000}
                    />
                  </div>
                </div>
              </>
            )}
            <div className="grid col-span-10 grid-cols-10 gap-4  justify-between mx-4 mt-4">
              <div className=" col-span-10 items-start flex mt-2 ">
                <span className=" p-2 font-bold text-blue underline">
                  متقاضیان خرید :
                </span>
              </div>

              <div className="col-span-10 py-2 pl-4">
                <Table
                  columns={buyerColumns}
                  className="col-span-10 grid grid-cols-12 text-center"
                  dataSource={wholesalebuyData?.wholesaleBuyerInfos}
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
                  {wholesalebuyData?.responsibleName}
                </span>
              </div>
              <div className="col-span-2 flex flex-col">
                <span className=" font-bold">سمت :</span>
                <span className=" py-2 ">
                  {wholesalebuyData?.responsiblePost}
                </span>
              </div>
              <div className="col-span-2 flex flex-col">
                <span className=" font-bold">شماره همراه :</span>
                <span className=" py-2 ">
                  {wholesalebuyData?.responsibleMobile}
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
                    totalPages={1}
                    pageSize={100}
                    className="col-span-12 grid grid-cols-12 "
                  />
                </div>
              </div>
            )}
            <div className="grid col-span-10 grid-cols-10 gap-4  justify-between mx-4 mt-8 ">
              <div className=" col-span-10 items-start flex  ">
                <span className="  font-bold text-blue underline">مدارک :</span>
              </div>
              <div className=" col-span-10 grid grid-cols-4 pb-4 bg-[#EEEBFF] mb-4 px-4">
                {wholesalebuyData?.publicFiles?.length > 0 &&
                  wholesalebuyData?.publicFiles?.map(
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
                  مدارک و مستندات متقاضی خرید :
                </span>
              </div>
              {uploadFileListItemOthers?.length > 0 &&
                wholesaleBuyer?.map((parentItem: any, index: any) => (
                  <div className="grid col-span-10 grid-cols-12 gap-4  justify-between  mt-4 mb-4 bg-[#EEEBFF]">
                    <div className="col-span-12">
                      <span className=" font-bold m-4">{`${
                        parentItem?.lname
                      } ${' '} ${parentItem?.tableId}`}</span>
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
                ))}
            </div>
            <div className="grid col-span-10 grid-cols-10 gap-4  justify-between mx-4 mt-4 ">
              <div className=" col-span-10 items-start flex  ">
                <span className="  font-bold text-blue underline">
                  علت درخواست :
                </span>
              </div>
              <div className="2xl:col-span-3 xl:col-span-3 lg:col-span-3 md:col-span-12 col-span-3 mx-2 flex flex-col">
                <span className=" font-bold mb-2">علت درخواست عودت وجه:</span>
                <span>{wholesaleReturnReasonTypeName}</span>
              </div>
              <div className="2xl:col-span-7 xl:col-span-7 lg:col-span-7 md:col-span-12  col-span-7 mx-2 flex flex-col">
                <span className=" font-bold mb-2"> توضیحات :</span>
                <span>{description}</span>
              </div>
            </div>
            <Collapse
              className="shadow-[0_0px_4px_rgba(0,0,0,0.2)] bg-[#EEEBFF] rounded-sm p-1 mb-3 col-span-12 gap-4  justify-between mx-4 mt-8"
              title="مدارک و مستندات عودت 10%"
              expanded={true}
            >
              <div className="grid col-span-10 grid-cols-12 gap-4   bg-[#EEEBFF] justify-between mx-4 mt-4 mb-4">
                <div className=" col-span-12 grid grid-cols-9 ">
                  {uploadFileListItem?.length > 0 &&
                    uploadFileListItem?.map((item: any, index: any) => (
                      <ImageUploadPreview
                        className="2xl:col-span-3 xl:col-span-3 lg:col-span-3 md:col-span-6  col-span-3"
                        data={item}
                        onAlert={onAlert}
                      />
                    ))}
                </div>
              </div>
            </Collapse>
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
          </div>
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
              {isDetailPage && (
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
              )}
              {isUploadDocPage && (
                <>
                  <a
                    // href="/stock/request-block"
                    className="border-green border mx-4 text-green w-[120px] h-[35px]  flex items-center justify-center rounded"
                    onClick={() => setState({ isModalDocumentVisible: true })}
                  >
                    تایید نهایی
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
              {isFyiPage && (
                <>
                  <a
                    // href="/stock/request-block"
                    className="border-green border mx-4 text-green w-[120px] h-[35px]  flex items-center justify-center rounded"
                    onClick={() => setState({ isModalConfirmVisible: true })}
                  >
                    تایید
                  </a>
                </>
              )}
            </>
          )}
        </div>
      ) : null}
      <BoardMemberModal />
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
        handleOk={() => onOkModalDocument()}
        handleCancel={() => setState({ isModalDocumentVisible: false })}
        isModalVisible={isModalDocumentVisible}
        title={`آیا نسبت به تایید اطلاعات اطمینان دارید؟`}
        okText="  بله "
        cancelText="خیر"
      ></Modal>
    </>
  );
}
export default withAlert(RequestDetailCancelBuyWholesale);
