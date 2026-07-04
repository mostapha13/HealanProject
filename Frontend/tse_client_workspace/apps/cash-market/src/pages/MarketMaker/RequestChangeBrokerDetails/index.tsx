import withAlert from 'apps/cash-market/src/hoc/withAlert';
import {
  useStates,
  useEffect,
  useState,
  useNavigate,
  useSearchParams,
} from '@tse/utils';
import { Button, TextField, Modal } from '@tse/components/atoms';
import {
  convertDateAndTimeToJalali,
  loadFromStorage,
  convertDateToJalali,
} from '@tse/tools';
import {
  confirmFinalOrderCommitmentIncDec,
  confirmForm,
  getOrderWorkFlow,
  rejectForm,
  getCommitmentIncDecFormById,
  getActiveInstrumentList,
  rejectOrderCommitmentIncDec,
  getChangeBrokerFormById,
  confirmChangeBroker,
  rejectChangeBroker,
  rejectFile,
  confirmFile,
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
  activeInstrumentList: [],
  fileData: [],
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
function RequestChangeBrokerDetails({ onAlert }: any) {
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
    activeInstrumentList,
    fileData,
  } = state;
  const hasAccess = loadFromStorage('hasAccess');
  const orderId =
    searchParams.get('id') != null ? searchParams.get('id') : null;
  const history =
    searchParams.get('history') != null ? searchParams.get('history') : '';
  const isFinalConfirm =
    window.location.pathname === '/stock/request-change-broker-end';
  const tableHeader: HeaderTypes[] = [
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
      title: 'کارگزار جدید',
      dataIndex: 'newBrokerNames',
      key: 'newBrokerNames',
      className: 'col-span-3',
    },
    {
      title: 'کارگزار قدیم',
      dataIndex: 'oldBrokerNames',
      key: 'oldBrokerNames',
      className: 'col-span-3',
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
    if (orderId != null) {
      handleGetDetails();
    }
    getWorkFlow();
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

  const onFail = (error: any) => {
    onAlert(error);
  };

  const handleGetDetails = () => {
    getChangeBrokerFormById({
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
  };
  const onChangePage = (pageNo: number) => {
    setState({
      pageNo,
    });
  };
  const handleModeChange = (e: RadioChangeEvent) => {
    setState({ changePage: e.target.value });
  };
  const onConfirmModalClick = () => {
    setState({ isModalConfirmVisible: false });
    const data = {
      orderId: orderId,
      publicMessage,
      privateMessage,
    };
    confirmChangeBroker({
      data,
      onSuccess: (res) => {
        onAlert({ message: 'اطلاعات با موفقیت تایید گردید', type: 'success' });
        navigate('/cartable');
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
    rejectChangeBroker({
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

  return (
    <>
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
              <div className=" flex flex-row">
                <span className=" p-2 font-bold ">وضعیت :</span>
                <span className=" p-2  ">
                  {orderDetails?.order?.orderStatus?.name}
                </span>
              </div>
            </div>

            <div className="grid col-span-10 grid-cols-10 gap-4  justify-between mx-4 mt-4">
              <span className="col-span-10 font-bold text-blue underline">
                اطلاعات :
              </span>
              <div className="col-span-10">
                <Table
                  columns={tableHeader}
                  className="col-span-10 grid grid-cols-12 "
                  wrapperClassName="!mt-4"
                  data={[orderDetails?.changeBrokerParam]}
                  isPagination={false}
                />
              </div>
            </div>

            <div className="grid col-span-10 grid-cols-12 gap-4  justify-between mx-4 mt-4">
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
              {!isFinalConfirm && (
                <a
                  // href="/stock/request-block"
                  className="border-green border mx-4 text-green w-[120px] h-[35px]  flex items-center justify-center rounded"
                  onClick={() => setState({ isModalConfirmVisible: true })}
                >
                  تایید
                </a>
              )}
              {isFinalConfirm && (
                <a
                  // href="/stock/request-block"
                  className="border-green border mx-4 text-green w-[120px] h-[35px]  flex items-center justify-center rounded"
                  onClick={() => setState({ isModalConfirmVisible: true })}
                >
                  تایید نهایی
                </a>
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
        handleOk={() => onConfirmModalClick()}
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
      {/* <Modal
        handleOk={() => onOkModalFinalConfirmClick()}
        handleCancel={() => setState({ isModalConfirmFinalVisible: false })}
        isModalVisible={isModalConfirmFinalVisible}
        title={`آیا نسبت به تایید نهایی اطلاعات اطمینان دارید؟`}
        okText="  بله "
        cancelText="خیر"
      ></Modal> */}
    </>
  );
}
export default withAlert(RequestChangeBrokerDetails);
