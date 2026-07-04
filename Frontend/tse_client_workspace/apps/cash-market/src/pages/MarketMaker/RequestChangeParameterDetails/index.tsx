import withAlert from 'apps/cash-market/src/hoc/withAlert';
import {
  useStates,
  useEffect,
  useState,
  useNavigate,
  useSearchParams,
} from '@tse/utils';
import { Button, TextField, Modal, Icon } from '@tse/components/atoms';
import {
  convertDateAndTimeToJalali,
  loadFromStorage,
  convertDateToJalali,
  separator,
  downloadFile,
} from '@tse/tools';
import {
  confirmFinalOrderCommitmentIncDec,
  confirmForm,
  getOrderWorkFlow,
  rejectForm,
  getCommitmentIncDecFormById,
  getActiveInstrumentList,
  rejectOrderCommitmentIncDec,
  rejectFile,
  confirmFile,
  getorderCommitmentIncDecExportToDoc,
  getWorkingDate,
} from 'apps/cash-market/src/Controller';
import { Radio } from 'antd';
import type { RadioChangeEvent } from 'antd';
import WorkFlow from 'apps/cash-market/src/components/PageFeature/WorkFlow';
import { HeaderTypes } from '@tse/types';
import { Table } from '@tse/components/organism';
import { DatePicker } from '@tse/components/molecules';
import ConfirmFile from 'apps/cash-market/src/components/PageFeature/ConfirmFile';

const initialState = {
  isTrackingModalVisible: false,
  changePage: 'request',
  pageNo: 1,
  publicMessage: '',
  privateMessage: '',
  orderDetails: {},
  isModalConfirmVisible: false,
  isModalRejectVisible: false,
  workFlow: null,
  isModalConfirmFinalVisible: false,
  startDate: '',
  startDateError: false,
  endDate: '',
  endDateError: false,
  activeInstrumentList: [],
  fileData: [],
  notificationData: null,
};
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
function RequestChangeParameterDetails({ onAlert }: any) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useStates<any>(initialState);
  const {
    isTrackingModalVisible,
    changePage,
    pageNo,
    publicMessage,
    privateMessage,
    orderDetails,
    isModalConfirmVisible,
    isModalRejectVisible,
    workFlow,
    isModalConfirmFinalVisible,
    startDate,
    endDate,
    activeInstrumentList,
    fileData,
    notificationData,
  } = state;
  const hasAccess = loadFromStorage('hasAccess');
  const orderId = searchParams.get('id') != null ? searchParams.get('id') : '';
  const history =
    searchParams.get('history') != null ? searchParams.get('history') : '';
  const isSetDeadLine =
    window.location.pathname === '/stock/change-parameter-deadline';
  const isDownloadAnnouncment =
    window.location.pathname ===
    '/stock/change-parameter-download-announcement';
  const tableHeader: HeaderTypes[] = [
    {
      title: 'نماد',
      dataIndex: 'instrument',
      key: 'instrument',
      className: 'col-span-2',
      render: (item: any) => <span>{item?.symbol}</span>,
    },
    {
      title: 'نام شرکت',
      dataIndex: 'instrument',
      key: 'instrument',
      className: 'col-span-3 overflow-hidden',
      render: (item: any) => <span>{item?.symbolName}</span>,
    },
    {
      title: 'حداقل حجم معامله',
      dataIndex: 'minValue',
      key: 'minValue',
      className: 'col-span-2',
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'سفارش انباشته',
      dataIndex: 'maxOrder',
      key: 'maxOrder',
      className: 'col-span-2',
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'دامنه مظنه',
      dataIndex: 'tolerance',
      key: 'tolerance',
      className: 'col-span-2',
    },
  ];
  const tableHeaderChange: HeaderTypes[] = [
    {
      title: 'نماد',
      dataIndex: 'instrumentResponse',
      key: 'instrumentResponse',
      className: 'col-span-2',
      render: (item: any) => <span>{item?.symbol}</span>,
    },
    {
      title: 'نام شرکت',
      dataIndex: 'instrumentResponse',
      key: 'instrumentResponse',
      className: 'col-span-3 overflow-hidden',
      render: (item: any) => <span>{item?.symbolName}</span>,
    },
    {
      title: 'حداقل حجم معامله',
      dataIndex: 'tradableVolume',
      key: 'tradableVolume',
      className: 'col-span-2',
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'سفارش انباشته',
      dataIndex: 'orderableVolume',
      key: 'orderableVolume',
      className: 'col-span-2',
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'دامنه مظنه',
      dataIndex: 'quoteDomain',
      key: 'quoteDomain',
      className: 'col-span-2',
    },
  ];
  const columns: HeaderTypes[] = [
    {
      title: 'کاربر ',
      dataIndex: 'marketUserName',
      key: 'marketUserName',
      className: 'col-span-2',
    },
    {
      title: 'نوع پیام ',
      dataIndex: 'isPrivate',
      key: 'isPrivate',
      className: 'col-span-2',
      render: (item: any) => <span>{item === true ? 'خصوصی' : 'عمومی'}</span>,
    },
    {
      title: 'تاریخ ',
      dataIndex: 'commentDate',
      key: 'commentDate',
      className: 'col-span-2',
      render: (item: any) => <span>{convertDateAndTimeToJalali(item)}</span>,
    },
    {
      title: 'پیام ',
      dataIndex: 'comment',
      key: 'comment',
      className: 'col-span-5',
    },
  ];
  const onRejectFile = (orderFileId: string) => {
    const data = {
      orderFileId,
    };
    rejectFile({ data, onSuccess: onSuccessConfirmFile, onFail });
  };

  const onConfirmFile = (orderFileId: string) => {
    const data = {
      orderFileId,
    };
    confirmFile({ data, onSuccess: onSuccessConfirmFile, onFail });
  };
  const onSuccessConfirmFile = () => {
    onAlert({ message: 'عملیات با موفقیت انجام شد', type: 'success' });
    handleGetDetails();
  };
  const StatusRender = ({ data, id }: { id: number; data: any }) => {
    const color =
      data[id]?.acceptStatus?.acceptStatusId === 'Confirmed'
        ? 'text-green'
        : data[id]?.acceptStatus?.acceptStatusId === 'Rejected'
        ? 'text-red'
        : '';
    return <span className={color}>{data[id]?.acceptStatus?.name || '-'}</span>;
  };
  const TitleRender = ({ record }: any) => {
    if (hasAccess && orderDetails?.canConfirmOrReject) {
      return (
        <ConfirmFile
          title={record.marketMakerFileTypeName}
          src={record}
          type={record?.fileType}
          onReject={() => onRejectFile(record.orderFileId)}
          onConfirm={() => onConfirmFile(record.orderFileId)}
        />
      );
    } else if (hasAccess) {
      return (
        <ConfirmFile
          title={record.marketMakerFileTypeName}
          src={record}
          type={record?.fileType}
        />
      );
    } else {
      return <span>{record.marketMakerFileTypeName}</span>;
    }
  };
  const filesHeader = [
    {
      title: 'عنوان مدرک',
      dataIndex: 'fileName',
      key: 'fileName',
      className: 'col-span-3',
      render: (item: any, record: any) => <TitleRender record={record} />,
    },
    {
      title: 'تاریخ ثبت',
      dataIndex: 'createDate',
      key: 'createDate',
      className: 'col-span-2',
      render: (item: any) => <span>{convertDateToJalali(item)}</span>,
    },
    {
      title: 'تایید/رد کارشناس',
      dataIndex: 'orderFileAccepts',
      key: 'orderFileAccepts',
      className: 'col-span-3',
      render: (item: any) => <StatusRender data={item} id={0} />,
    },
    // {
    //   title: 'تایید/رد رئیس اداره',
    //   dataIndex: 'orderFileAccepts',
    //   key: 'orderFileAccepts',
    //   className: 'col-span-2',
    //   render: (item: any) => <StatusRender data={item} id={1} />,
    // },
    {
      title: 'تایید/رد مدیر',
      dataIndex: 'orderFileAccepts',
      key: 'orderFileAccepts',
      className: 'col-span-3',
      render: (item: any) => <StatusRender data={item} id={1} />,
    },
  ];
  const filesHeaderMarketMaker = [
    {
      title: 'عنوان مدرک',
      dataIndex: 'fileName',
      key: 'fileName',
      className: 'col-span-6',
      render: (item: any, record: any) => <TitleRender record={record} />,
    },
    {
      title: 'تاریخ ثبت',
      dataIndex: 'createDate',
      key: 'createDate',
      className: 'col-span-5',
      render: (item: any) => <span>{convertDateToJalali(item)}</span>,
    },
    // {
    //   title: 'تایید/رد کارشناس',
    //   dataIndex: 'orderFileAccepts',
    //   key: 'orderFileAccepts',
    //   className: 'col-span-3',
    //   render: (item: any) => <StatusRender data={item} id={0} />,
    // },
  ];
  useEffect(() => {
    getWorkFlow();
    if (orderId != null) {
      handleGetDetails();
    }
    if (isDownloadAnnouncment) {
      handleExportNotification();
    }
  }, []);
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
  const getActiveInstrument = (id: string) => {
    const data = {
      InstrumentId: id,
    };
    getActiveInstrumentList({
      data,
      onSuccess: onSuccessActiveInstrument,
      onFail,
    });
  };

  const onSuccessActiveInstrument = (res: any) => {
    if (res) {
      setState({
        activeInstrumentList: res,
      });
    } else {
      // onAlert({ message: 'برای نماد انتخاب شده پارامتری تعریف نشده است.' });
    }
  };
  const onFail = (error: any) => {
    onAlert(error);
  };

  const handleGetDetails = () => {
    getCommitmentIncDecFormById({
      data: {
        OrderId: orderId,
      },
      onSuccess: onSuccessDetail,
      onFail,
    });
  };
  const onSuccessDetail = (res: any) => {
    setState({
      orderDetails: res,
      fileData: res?.order?.orderFiles?.filter(
        (item: any) => item.fileId != '00000000-0000-0000-0000-000000000000'
      ),
    });
    getActiveInstrument(res?.instrumentResponse?.instrumentId);
    if (res?.commitmentIncDecType !== 'Dec') {
      handleGetWorkingDate();
    }
  };
  const handleExportNotification = () => {
    getorderCommitmentIncDecExportToDoc({
      data: {
        OrderId: orderId,
      },
      onSuccess: (res) => {
        downloadExportFile(res);
        // setState({
        //   notificationData: res,
        // });
      },
      onFail,
    });
  };
  const downloadExportFile = (notificationData: any) => {
    if (notificationData != null) {
      downloadFile(notificationData, 'exportWord.docx');
    }
  };
  const onChangePage = (pageNo: number) => {
    setState({
      pageNo,
    });
  };
  const handleModeChange = (e: RadioChangeEvent) => {
    setState({ changePage: e.target.value });
  };
  const onOkModalConfirmClick = () => {
    setState({ isModalConfirmVisible: false });
    const data = {
      orderId: orderId,
      publicMessage,
      privateMessage,
    };
    confirmFinalOrderCommitmentIncDec({
      data,
      onSuccess: (res) => {
        onAlert({ message: 'اطلاعات با موفقیت تایید گردید', type: 'success' });
        navigate('/cartable');
        // if (res?.succeeded) {
        //   onAlert({
        //     type: 'success',
        //     message: 'اطلاعات با موفقیت تایید گردید',
        //   });
        //   navigate('/cartable');
        // }
      },
      onFail,
    });
  };
  const onRejectModalClick = () => {
    setState({ isModalRejectVisible: false });
    const data = {
      orderId: orderId,
      publicMessage,
      privateMessage,
    };
    rejectOrderCommitmentIncDec({
      data,
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
  const onFinalConfirmClick = () => {
    if (orderDetails?.commitmentIncDecType == 'Dec') {
      if (endDate && startDate) {
        setState({ isModalConfirmFinalVisible: true });
      } else {
        setState({
          ...(!startDate && { startDateError: true }),
          ...(!endDate && { endDateError: true }),
        });
      }
    } else {
      if (startDate) {
        setState({ isModalConfirmFinalVisible: true });
      } else {
        setState({
          // ...(!startDate && { startDateError: true }),
          ...(!startDate && { startDateError: true }),
        });
      }
    }
  };
  const onOkModalConfirmFinalClick = () => {
    setState({ isModalConfirmFinalVisible: false });
    const data = {
      orderId: orderId,
      publicMessage,
      privateMessage,
      startDate,
      endDate: orderDetails?.commitmentIncDecType == 'Dec' ? startDate : null,
    };
    confirmFinalOrderCommitmentIncDec({
      data,
      onSuccess: (res) => {
        // onAlert({message: 'اطلاعات با موفقیت تایید گردید', type: 'success' });
        // navigate('/cartable');

        onAlert({
          type: 'success',
          message: 'اطلاعات با موفقیت تایید گردید',
        });
        navigate('/cartable');
      },
      onFail,
    });
  };
  const handleGetWorkingDate = () => {
    const data = {
      BaseDateTime: '',
      NextWorkingDayLater: 1,
    };
    getWorkingDate({
      data,
      onSuccess: (res: any) => {
        setState({ startDate: res?.nextWorkingDate });
      },
      onFail,
    });
  };
  const isClosed = orderDetails?.order?.orderStatus.orderStatusId === 'Closed';
  return (
    <div>
      <div className="border-2 border-lightGray">
        <div className="my-1">
          <Radio.Group onChange={handleModeChange} value={changePage}>
            <Radio.Button value="request">فرآیند فعلی</Radio.Button>
            <Radio.Button value="workflow">گردش کار</Radio.Button>
          </Radio.Group>
        </div>
        {changePage == 'request' && (
          <div className="w-full grid grid-cols-10 ">
            <div className=" col-span-10 items-start flex border-b-2  justify-between bg-lightGray border-lightGray  px-4">
              <div className=" flex flex-row">
                <span className=" p-2 font-bold ">درخواست :</span>
                <span className=" p-2  ">{orderDetails?.workFlowName}</span>
              </div>
              <div className=" flex flex-row">
                <span className=" p-2 font-bold ">کد پیگیری :</span>
                <span className=" p-2  ">
                  {orderDetails?.order?.orderDetail?.trackingNumber}
                </span>
              </div>
              {isDownloadAnnouncment && (
                <Button
                  className=" text-blue w-[100px]"
                  onClick={handleExportNotification}
                >
                  <Icon name="icon-download" />
                  دانلود اطلاعیه
                </Button>
              )}
              {isClosed && hasAccess && !isDownloadAnnouncment && (
                <Button
                  className=" text-blue w-[100px]"
                  onClick={handleExportNotification}
                >
                  <Icon name="icon-download" />
                  دانلود اطلاعیه
                </Button>
              )}
              {!isClosed && !isDownloadAnnouncment && (
                <div className=" flex flex-row">
                  <span className=" p-2 font-bold ">وضعیت :</span>
                  <span className=" p-2  ">
                    {orderDetails?.order?.orderStatus?.name}
                  </span>
                </div>
              )}
              {!hasAccess && isClosed && (
                <div className=" flex flex-row">
                  <span className=" p-2 font-bold ">وضعیت :</span>
                  <span className=" p-2  ">
                    {orderDetails?.order?.orderStatus?.name}
                  </span>
                </div>
              )}
            </div>

            <div className="grid col-span-10 grid-cols-10 gap-4  justify-between mx-4 mt-4">
              <span className="col-span-10 font-bold text-blue underline">
                اطلاعات :
              </span>
              <span className="col-span-10 font-bold">
                {orderDetails?.commitmentIncDecType == 'Inc'
                  ? 'افزایش سرمایه'
                  : orderDetails?.commitmentIncDecType == 'Dec'
                  ? 'کاهش تعهدات'
                  : orderDetails?.commitmentIncDecType == 'Classes'
                  ? 'طبقات نقدشوندگی'
                  : ''}
              </span>
              <div className="col-span-10">
                <Table
                  columns={tableHeader}
                  className="col-span-10 grid grid-cols-12 "
                  wrapperClassName="!mt-4"
                  data={[activeInstrumentList]}
                  isPagination={false}
                />
              </div>
            </div>
            <div className="grid col-span-10 grid-cols-10 gap-4  justify-between mx-4 mt-4">
              <span className="col-span-10  font-bold text-blue underline">
                تغییرات :
              </span>
              <div className="col-span-10">
                <Table
                  columns={tableHeaderChange}
                  className="col-span-10 grid grid-cols-12 "
                  wrapperClassName="!mt-4"
                  data={[orderDetails]}
                  isPagination={false}
                />
              </div>
            </div>
            <div className="grid col-span-10 grid-cols-12 gap-4  justify-between mx-4 mt-4">
              {/* <div className=" col-span-12 items-start flex  ">
                <span className="  font-bold text-blue underline">
                  توضیحات :
                </span>
              </div>
              <div className=" col-span-12  pb-4">
                <Table
                  data={detailsData?.message}
                  columns={columns}
                  wrapperClassName="!mt-4"
                  onChangePage={onChangePage}
                  totalPages={1}
                  pageSize={10}
                  className="col-span-12 grid grid-cols-12 "
                />
              </div> */}
              {orderDetails?.publicMessages?.length > 0 ? (
                <div className=" col-span-12 my-4">
                  <span className="font-bold ">پیام‌های عمومی</span>
                  <Table
                    columns={messageHeader}
                    className="col-span-12 grid grid-cols-12"
                    // wrapperClassName="!m-4"
                    data={orderDetails?.publicMessages}
                    isPagination={false}
                  />
                </div>
              ) : null}

              {hasAccess && (
                <>
                  {orderDetails?.privateMessages?.length > 0 ? (
                    <div className=" col-span-12 my-4">
                      <span className="font-bold ">پیام‌های خصوصی</span>
                      <Table
                        columns={messageHeader}
                        className="col-span-12 grid grid-cols-12"
                        // wrapperClassName="!m-4"
                        data={orderDetails?.privateMessages}
                        isPagination={false}
                      />
                    </div>
                  ) : null}
                </>
              )}
            </div>
            <div className="grid col-span-10 grid-cols-10 gap-4  justify-between mx-4 mt-4 ">
              <div className=" col-span-10 items-start flex  ">
                <span className="  font-bold text-blue underline">مدارک :</span>
              </div>
              <div className=" col-span-10">
                <Table
                  columns={hasAccess ? filesHeader : filesHeaderMarketMaker}
                  className="col-span-10 grid grid-cols-12"
                  // wrapperClassName="!m-4"
                  data={fileData}
                  isPagination={false}
                />
              </div>
              {/* <div className=" col-span-10 grid grid-cols-4 pb-4 bg-[#EEEBFF] mb-4 px-4">
                {orderDetails?.order?.orderFiles?.length > 0 &&
                  orderDetails?.order?.orderFiles?.map(
                    (item: any, index: any) =>
                      item?.fileId != '00000000-0000-0000-0000-000000000000' ? (
                        <ImageUploadPreview
                          className="2xl:col-span-1 xl:col-span-2 lg:col-span-2 md:col-span-4  col-span-1"
                          data={item}
                          onAlert={onAlert}
                          uploadFileTypeKey={'fileType'}
                          attachTypeNameKey={'marketMakerFileTypeName'}
                        />
                      ) : null
                  )}
              </div> */}
            </div>
            {isSetDeadLine && (
              <div className="grid col-span-10 grid-cols-10 gap-4 justify-between mx-4 mt-4 ">
                <div className=" col-span-10 items-start flex ">
                  <span className="  font-bold text-blue underline">
                    تایید تاریخ :
                  </span>
                </div>
                <div className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2 mt-4 z-10">
                  <DatePicker
                    label="تاریخ شروع"
                    value={startDate}
                    onChange={(value: any) =>
                      setState({
                        startDate: value,
                        startDateError: '',
                      })
                    }
                    required
                    error={state?.startDateError}
                  />
                </div>
                {orderDetails?.commitmentIncDecType == 'Dec' && (
                  <div className="2xl:col-span-2 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2 mt-4 z-10">
                    <DatePicker
                      label="تاریخ پایان"
                      value={endDate}
                      onChange={(value: any) =>
                        setState({
                          endDate: value,
                          endDateError: '',
                        })
                      }
                      required
                      error={state?.endDateError}
                    />
                  </div>
                )}
              </div>
            )}
            {!hasAccess && (
              <div className="grid col-span-10 grid-cols-10 gap-4 justify-between mx-4 mt-4 ">
                <div className=" col-span-10 items-start flex ">
                  <span className="  font-bold text-blue underline">
                    تاریخ شروع و پایان :
                  </span>
                </div>
                <div className=" col-span-3 justify-start">
                  <span>تاریخ شروع : </span>
                  <span className=" font-bold mr-2">
                    {convertDateToJalali(
                      orderDetails?.order?.orderDetail?.startDate
                    )}
                  </span>
                </div>
                <div className=" col-span-3 justify-start">
                  <span>تاریخ پایان : </span>
                  <span className=" font-bold mr-2">
                    {convertDateToJalali(
                      orderDetails?.order?.orderDetail?.endDate
                    )}
                  </span>
                </div>
              </div>
            )}
            <div className="col-span-10 bg-lightGray py-4 mt-8">
              <span className="font-bold text-blue underline px-4">
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
              {hasAccess && (
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
              )}
            </div>
          </div>
        )}
      </div>
      {changePage == 'workflow' && <WorkFlow data={workFlow} />}
      {changePage != 'workflow' && (
        <div className="flex justify-end my-4">
          <a
            href="/cartable"
            className="border-blue border ml-4 text-blue w-[120px] h-[35px]  flex items-center justify-center rounded"
            // onClick={onConfirm}
          >
            بازگشت
          </a>
          {!history && orderDetails?.canConfirmOrReject && (
            <>
              {!isSetDeadLine && (
                <a
                  // href="/stock/request-block"
                  className="border-green border mx-4 text-green w-[120px] h-[35px]  flex items-center justify-center rounded"
                  onClick={() => setState({ isModalConfirmVisible: true })}
                >
                  تایید
                </a>
              )}
              {isSetDeadLine && (
                <>
                  <a
                    // href="/stock/request-block"
                    className="border-green border mx-4 text-green w-[120px] h-[35px]  flex items-center justify-center rounded"
                    onClick={() => onFinalConfirmClick()}
                  >
                    تایید نهایی
                  </a>
                </>
              )}
              {hasAccess && (
                <a
                  // href="/stock/request-block"
                  className="border-red border mr-4 text-red w-[120px] h-[35px]  flex items-center justify-center rounded"
                  onClick={() => setState({ isModalRejectVisible: true })}
                >
                  عدم تایید
                </a>
              )}
            </>
          )}
        </div>
      )}
      <Modal
        handleOk={() => onOkModalConfirmClick()}
        handleCancel={() => setState({ isModalConfirmVisible: false })}
        isModalVisible={isModalConfirmVisible}
        title={`آیا نسبت به تایید اطلاعات اطمینان دارید؟`}
        okText="  بله "
        cancelText="خیر"
      ></Modal>
      <Modal
        handleOk={() => onRejectModalClick()}
        handleCancel={() => setState({ isModalRejectVisible: false })}
        isModalVisible={isModalRejectVisible}
        title={`آیا نسبت به عدم تایید اطلاعات اطمینان دارید؟`}
        okText="  بله "
        cancelText="خیر"
      ></Modal>
      <Modal
        handleOk={() => onOkModalConfirmFinalClick()}
        handleCancel={() => setState({ isModalConfirmFinalVisible: false })}
        isModalVisible={isModalConfirmFinalVisible}
        title={`آیا نسبت به تایید نهایی اطلاعات اطمینان دارید؟`}
        okText="  بله "
        cancelText="خیر"
      ></Modal>
    </div>
  );
}
export default withAlert(RequestChangeParameterDetails);
