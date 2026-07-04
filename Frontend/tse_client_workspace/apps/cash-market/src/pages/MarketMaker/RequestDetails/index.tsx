/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import { useEffect, useStates, useNavigate } from '@tse/utils';
import {
  convertDateToJalali,
  getQueryParams,
  loadFromStorage,
  downloadFile,
  separator,
} from '@tse/tools';
import { Table } from '@tse/components/organism';
import {
  Button,
  TextField,
  Stepper,
  CheckList,
  Icon,
} from '@tse/components/atoms';
import withAlert from '../../../hoc/withAlert';
import {
  getOrderDetails,
  confirmFile,
  rejectFile,
  confirmForm,
  getDenyReasonList,
  rejectForm,
  getOrderExtendingExport,
  getOrderExport,
  getOrderWorkFlow,
} from '../../../Controller';
import ConfirmFile from 'apps/cash-market/src/components/PageFeature/ConfirmFile';
import { HeaderTypes } from '@tse/types';
import WorkFlow from '../../../components/PageFeature/WorkFlow';

const steps = ['بازارگردان', 'کارشناس', 'رئیس اداره', 'مدیر'];

const tabBarData = [
  {
    id: 0,
    title: 'فرآیند فعلی',
  },
  {
    id: 1,
    title: 'گردش کار',
  },
];

const initialState = {
  orderDetails: [],
  publicMessage: '',
  privateMessage: '',
  reasonList: [],
  selectedReasons: [],
  selectedTab: tabBarData[0],
  activeStep: 1,
  orderExportFile: null,
  workFlow: null,
};

const instrumentParameterHeader: HeaderTypes[] = [
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
    render: (item: any) => <span>{item}</span>,
  },
];

const newFundHeader = [
  {
    title: 'نام',
    dataIndex: 'fund',
    key: 'fund',
    className: 'col-span-3',
    render: (item: any) => <span>{item?.fundName}</span>,
  },
  {
    title: 'آورده نقدی',
    dataIndex: 'bringCash',
    key: 'bringCash',
    className: 'col-span-2',
    render: (item: any) => <span>{separator(item)}</span>,
  },
  {
    title: 'آورده سهام',
    dataIndex: 'bringShare',
    key: 'bringShare',
    className: 'col-span-2',
    render: (item: any) => <span>{separator(item)}</span>,
  },
  {
    title: 'تاریخ شروع',
    dataIndex: 'startDate',
    key: 'startDate',
    className: 'col-span-2',
    render: (item: any) => <span>{convertDateToJalali(item)}</span>,
  },
  {
    title: 'تاریخ پایان',
    dataIndex: 'endDate',
    key: 'endDate',
    className: 'col-span-2',
    render: (item: any) => <span>{convertDateToJalali(item)}</span>,
  },
];

const relatedFundsHeader = [
  {
    title: 'نام',
    dataIndex: 'fund',
    key: 'fund',
    className: 'col-span-5',
    render: (item: any) => <span>{item?.fundName}</span>,
  },
  {
    title: 'تاریخ شروع',
    dataIndex: 'startDate',
    key: 'startDate',
    className: 'col-span-3',
    render: (item: any) => <span>{convertDateToJalali(item)}</span>,
  },
  {
    title: 'تاریخ پایان',
    dataIndex: 'endDate',
    key: 'endDate',
    className: 'col-span-3',
    render: (item: any) => <span>{convertDateToJalali(item)}</span>,
  },
];

const brokerHeader = [
  {
    title: 'نام',
    dataIndex: 'broker',
    key: 'broker',
    className: 'col-span-11',
    render: (item: any) => <span>{item?.brokerName}</span>,
  },
];

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

const investorHeader = [
  {
    title: 'کد بورسی',
    dataIndex: 'investor',
    key: 'investor',
    className: 'col-span-5',
    render: (item: any) => <span>{item?.investorCode}</span>,
  },
  {
    title: 'نام',
    dataIndex: 'investor',
    key: 'investor',
    className: 'col-span-6',
    render: (item: any) => <span>{item?.investorName}</span>,
  },
];

const quitHeader: HeaderTypes[] = [
  {
    title: 'دلایل انصراف',
    dataIndex: 'quitReasons',
    key: 'quitReasons',
    className: 'col-span-5',
    render: (quit: any) => {
      return (
        <div>
          {quit?.map((item: any) => (
            <span>{item?.quitReasonName},</span>
          ))}
        </div>
      );
    },
  },
  {
    title: 'توضیحات',
    dataIndex: 'message',
    key: 'message',
    className: 'col-span-6',
  },
];

const StatusRender = ({ data, id }: { id: number; data: any }) => {
  const color =
    data[id]?.acceptStatus?.acceptStatusId === 'Confirmed'
      ? 'text-green'
      : data[id]?.acceptStatus?.acceptStatusId === 'Rejected'
      ? 'text-red'
      : '';
  return <span className={color}>{data[id]?.acceptStatus?.name || '-'}</span>;
};

const hasAccess = loadFromStorage('hasAccess');

function RequestDetails({ onAlert }: any) {
  const navigate = useNavigate();
  const [state, setState] = useStates<any>(initialState);
  const {
    orderDetails,
    publicMessage,
    privateMessage,
    reasonList,
    selectedReasons,
    selectedTab,
    activeStep,
    orderExportFile,
    workFlow,
  } = state;
  const OrderId = getQueryParams('id', window.location.href);

  const isQuit =
    window.location.pathname === '/request-orderquit-detail' ? true : false;

  const isExtending =
    window.location.pathname === '/extending-request-detail' ? true : false;

  useEffect(() => {
    if (hasAccess) {
      getList(1, '');
      const data = {
        OrderId,
      };
      if (isExtending) {
        getOrderExtendingExport({
          data,
          onSuccess: onsuccessOrderExport,
          onFail,
        });
      } else {
        getOrderExport({
          data,
          onSuccess: onsuccessOrderExport,
          onFail,
        });
      }
    }
  }, [hasAccess]);

  const onsuccessOrderExport = (res: any) => {
    setState({
      orderExportFile: res,
    });
  };

  const getList = (pageNo: number, text: string) => {
    const data = {
      DenyReasonName: text,
      PageNumber: pageNo,
      PageSize: 10,
    };
    getDenyReasonList({ data, onSuccess: onSuccessList, onFail });
  };

  const onSuccessList = (list: any) => {
    setState({
      reasonList: list,
    });
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
    getDetails();
  };

  useEffect(() => {
    getDetails();
    getWorkFlow();
  }, []);

  const getWorkFlow = () => {
    const data = {
      OrderId,
    };
    getOrderWorkFlow({ data, onSuccess: onSuccessWorkFlow, onFail });
  };

  const onSuccessWorkFlow = (res: any) => {
    setState({
      workFlow: res,
    });
  };

  const getDetails = () => {
    const data = {
      OrderId,
    };
    getOrderDetails({ data, onSuccess: onSuccessDetail, onFail });
  };

  const onSuccessDetail = (res: any) => {
    let step = 1;
    switch (res.marketMakerGroup.marketMakerUserGroupId) {
      case 'MarketMaker':
        step = 0;
        break;
      case 'Expert':
        step = 1;
        break;
      case 'OfficeBoss':
        step = 2;
        break;
      case 'Manager':
        step = 3;
        break;
    }
    setState({
      orderDetails: res,
      activeStep: step,
    });
  };

  const onFail = (error: any) => {
    onAlert(error);
  };

  const onConfirm = () => {
    const data = {
      formId: 'Order',
      orderId: OrderId,
      publicMessage,
      privateMessage,
    };

    confirmForm({ data, onSuccess: onSuccessConfirmForm, onFail });
  };

  const onSuccessConfirmForm = () => {
    onAlert({ message: 'عملیات با موفقیت انجام شد', type: 'success' });
    navigate('/cartable');
  };

  const goBack = () => {
    navigate('/cartable');
  };

  const onChangeText = (key: string, value: any) => {
    setState({
      [key]: value,
    });
  };

  const onReject = () => {
    const data = {
      formId: 'Order',
      orderId: OrderId,
      publicMessage,
      privateMessage,
      denyReasonResponses: selectedReasons,
    };
    rejectForm({ data, onSuccess: onSuccessConfirmForm, onFail });
  };

  const downloadOrderFile = () => {
    downloadFile(orderExportFile, 'orderExport.docx');
  };

  const isNullReasons = selectedReasons?.length === 0;

  const isClosed = orderDetails?.order?.orderStatus.orderStatusId === 'Closed';

  const requestTitle =
    isQuit && !isExtending
      ? 'درخواست انصراف از بازارگردانی'
      : !isQuit && isExtending
      ? 'درخواست تمدید بازارگردانی'
      : 'درخواست شروع بازارگردانی';

  return (
    <>
      <div className="shadow-[0_0px_4px_rgba(0,0,0,0.2)] rounded-sm py-3">
        <div className="mr-3 mt-1">
          {tabBarData.map((item: { id: number; title: string }) => {
            const { title, id } = item;
            const isSelected = selectedTab.id === id;
            return (
              <span
                onClick={() => onChangeText('selectedTab', item)}
                className={`ml-5 px-4 cursor-pointer ${
                  isSelected && 'border-b-2 border-blue text-blue font-bold'
                }`}
              >
                {title}{' '}
              </span>
            );
          })}
        </div>
        <div className="bg-lightGray w-full p-3 flex flex-row justify-between items-center">
          <div>
            <span className="font-bold">درخواست: </span>
            <span>{requestTitle}</span>
          </div>

          <div>
            <span className="font-bold">کد پیگیری: </span>
            <span>{orderDetails?.order?.trackingNumber}</span>
          </div>

          <div>
            {isClosed && hasAccess && (
              <Button
                className=" text-blue w-[100px]"
                onClick={downloadOrderFile}
              >
                <Icon name="icon-download" />
                دانلود اطلاعیه
              </Button>
            )}
          </div>
        </div>

        {selectedTab.id === 0 && (
          <>
            {/* <div className="my-8 mx-40 dir">
              <Stepper steps={steps} activeStep={activeStep} />
            </div> */}

            <Table
              columns={instrumentParameterHeader}
              className="col-span-12 grid grid-cols-12"
              wrapperClassName="!m-4"
              data={[orderDetails?.order?.orderDetail?.instrumentParameter]}
              isPagination={false}
            />
            {orderDetails?.quitReasons?.length > 0 ? (
              <div>
                <span className="font-bold mr-4 mt-8">جزییات انصراف</span>
                <Table
                  columns={quitHeader}
                  className="col-span-12 grid grid-cols-12"
                  wrapperClassName="!m-4"
                  data={[orderDetails]}
                  isPagination={false}
                />
              </div>
            ) : null}
            {hasAccess && !isQuit && (
              <>
                {orderDetails?.relatedFunds?.length > 0 ? (
                  <div>
                    <span className="font-bold mr-4">بازارگردان های فعلی</span>
                    <Table
                      columns={relatedFundsHeader}
                      className="col-span-12 grid grid-cols-12"
                      wrapperClassName="!m-4"
                      data={
                        orderDetails?.relatedFunds != null
                          ? orderDetails.relatedFunds
                          : []
                      }
                      isPagination={false}
                    />
                  </div>
                ) : null}
              </>
            )}
            <span className="font-bold mr-4">اطلاعات بازارگردان</span>
            <Table
              columns={newFundHeader}
              className="col-span-12 grid grid-cols-12"
              wrapperClassName="!m-4"
              data={[orderDetails?.order?.orderDetail]}
              isPagination={false}
            />

            {!isQuit && (
              <div className=" grid grid-cols-12">
                <div className=" col-span-6">
                  <span className="font-bold mr-4">اطلاعات کارگزار</span>
                  <Table
                    columns={brokerHeader}
                    className="grid grid-cols-12"
                    wrapperClassName="!m-4"
                    data={orderDetails?.order?.orderBrokers}
                    isPagination={false}
                    scrollX={400}
                  />
                </div>

                <div className=" col-span-6">
                  <span className="font-bold mr-4">سرمایه گذاران</span>
                  <Table
                    columns={investorHeader}
                    className="grid grid-cols-12"
                    wrapperClassName="!m-4"
                    data={orderDetails?.order?.orderInvestors}
                    isPagination={false}
                    scrollX={400}
                  />
                </div>
              </div>
            )}

            <span className="font-bold mr-4">مدارک دریافتی</span>
            <Table
              columns={hasAccess ? filesHeader : filesHeaderMarketMaker}
              className="col-span-12 grid grid-cols-12"
              wrapperClassName="!m-4"
              data={orderDetails?.order?.orderFiles}
              isPagination={false}
            />

            {hasAccess && (
              <>
                <div className="mx-4 my-8  grid grid-cols-12">
                  <CheckList
                    data={reasonList?.items}
                    showKey="reasonTitle"
                    idKey="denyReasonId"
                    label="علت رد"
                    className="col-span-3"
                    onChange={(e: any) => onChangeText('selectedReasons', e)}
                  />
                </div>
                <div className="grid mx-4 mb-8">
                  {selectedReasons?.map(
                    ({ reasonTitle }: { reasonTitle: string }) => (
                      <span className="text-blue">- {reasonTitle}</span>
                    )
                  )}
                </div>
              </>
            )}
            {orderDetails?.publicMessages?.length > 0 ? (
              <>
                <span className="font-bold mr-4">پیامهای خارجی</span>
                <Table
                  columns={messageHeader}
                  className="col-span-12 grid grid-cols-12"
                  wrapperClassName="!m-4"
                  data={orderDetails?.publicMessages}
                  isPagination={false}
                />
              </>
            ) : null}

            {hasAccess && (
              <>
                {orderDetails?.privateMessages?.length > 0 ? (
                  <div>
                    <span className="font-bold mr-4">پیامهای داخلی</span>
                    <Table
                      columns={messageHeader}
                      className="col-span-12 grid grid-cols-12"
                      wrapperClassName="!m-4"
                      data={orderDetails?.privateMessages}
                      isPagination={false}
                    />
                  </div>
                ) : null}
              </>
            )}

            {hasAccess && (
              <div className="p-4">
                <TextField
                  multiline
                  label="متن پیام(خارجی)"
                  onChange={(e: any) => onChangeText('publicMessage', e)}
                  fullWidth
                  className="!mb-5"
                />
                <TextField
                  multiline
                  label="متن پیام(داخلی)"
                  onChange={(e: any) => onChangeText('privateMessage', e)}
                  fullWidth
                />
              </div>
            )}
          </>
        )}

        {selectedTab.id === 1 && <WorkFlow data={workFlow} />}
      </div>

      <div className="flex items-start justify-end pt-3">
        {selectedTab.id === 0 && orderDetails.canConfirmOrReject && (
          <>
            {isNullReasons && (
              <Button
                className="border-green border text-green w-[100px]"
                onClick={onConfirm}
              >
                تایید
              </Button>
            )}
            {!isNullReasons && (
              <Button
                className="border-red border text-red w-[100px]  mr-3"
                onClick={onReject}
              >
                عدم تایید
              </Button>
            )}
          </>
        )}
        <Button
          className="border-blue border text-blue w-[100px] mr-3"
          onClick={goBack}
        >
          بازگشت
        </Button>
      </div>
    </>
  );
}

export default withAlert(RequestDetails);
