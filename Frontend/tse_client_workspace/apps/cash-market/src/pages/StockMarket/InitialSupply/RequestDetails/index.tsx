import withAlert from 'apps/cash-market/src/hoc/withAlert';
import {
  useStates,
  useEffect,
  useState,
  useNavigate,
  useSearchParams,
} from '@tse/utils';
import ImageUploadPreview from 'apps/cash-market/src/components/ImageUploadPreview';
import { Button, TextField, Modal } from '@tse/components/atoms';
import {
  convertDateAndTime,
  convertDateAndTimeJalali,
  convertDateAndTimeToJalali,
  convertDateToJalali,
  downloadFile,
  loadFromStorage,
  separator,
} from '@tse/tools';
import {
  getOrderWorkFlow,
  getInitialSupplyByOrderId,
  initialSupplyConfirm,
  initialSupplyReject,
  exportInitialSupplyNotification,
} from 'apps/cash-market/src/Controller';
import { Radio } from 'antd';
import type { RadioChangeEvent } from 'antd';
import WorkFlow from 'apps/cash-market/src/components/PageFeature/WorkFlow';
import { HeaderTypes } from '@tse/types';
import { Table } from '@tse/components/organism';
const initialState = {
  isTrackingModalVisible: false,
  changePage: 'request',
  pageNo: 1,
  publicMessage: '',
  privateMessage: '',
  initialSupplyData: {},
  isModalConfirmVisible: false,
  isModalRejectVisible: false,
  workFlow: null,
  initialSupplyCommittedsState: [],
  buyerBasicData: [],
  sellersBasicData: [],
  exportInitialSupplyNotificationData: null,
};
function InitialSupplyRequestDetails({ onAlert }: any) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useStates<any>(initialState);
  const [uploadFileListItemOthers, setUploadFileListItemOthers] = useState<any>(
    []
  );
  const {
    changePage,
    publicMessage,
    privateMessage,
    initialSupplyData,
    isModalConfirmVisible,
    isModalRejectVisible,
    workFlow,
    initialSupplyCommittedsState,
    buyerBasicData,
    sellersBasicData,
    exportInitialSupplyNotificationData,
  } = state;
  const isDownloadAnnouncement =
    window.location.pathname === '/stock/download-announcement-initial-supply'
      ? true
      : false;
  const orderId = searchParams.get('id') != null ? searchParams.get('id') : '';
  const history =
    searchParams.get('history') != null ? searchParams.get('history') : '';
  const brokerColumns: HeaderTypes[] = [
    {
      title: 'نام کارگزار عرضه کننده',
      dataIndex: 'brokerName',
      className: 'col-span-3 !justify-start',
      key: 'brokerName',
    },
    {
      title: 'کد کارگزار عرضه کننده',
      dataIndex: 'brokerCode',
      className: 'col-span-4 !justify-start',
      key: 'brokerCode',
    },
    {
      title: 'کد معامله گر کارگزار عرضه کننده',
      dataIndex: 'traderCode',
      className: 'col-span-4 !justify-start',
      key: 'traderCode',
    },
  ];
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
      className: 'col-span-4 !justify-start',
      key: 'tradeVolume',
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'کارگزار بازارگردان',
      dataIndex: 'brokerName',
      className: 'col-span-3 !justify-start',
      key: 'brokerName',
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
      title: 'نام خانوادگی',
      dataIndex: 'lastName',
      className: 'col-span-1 !justify-start',
      key: 'lastName',
    },
    {
      title: 'کارگزار',
      dataIndex: 'brokerName',
      className: 'col-span-2 !justify-start',
      key: 'brokerName',
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
      className: 'col-span-2 !justify-start',
      key: 'tradeVolume',
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'درصد کل سهام قابل عرضه',
      dataIndex: 'tradePercent',
      className: 'col-span-2 !justify-start',
      key: 'tradePercent',
    },
  ];
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
      title: 'نام خانوادگی',
      dataIndex: 'lastName',
      className: 'col-span-1 !justify-start',
      key: 'lastName',
    },
    {
      title: 'کارگزار',
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
      className: 'col-span-2 !justify-start',
      key: 'tradeVolume',
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'درصد میزان تعهد',
      dataIndex: 'tradePercent',
      className: 'col-span-1 !justify-start',
      key: 'tradePercent',
    },
  ];
  useEffect(() => {
    handleGetTransferStock();
    getWorkFlow();
    if (isDownloadAnnouncement) {
      handleExportInitialSupplyNotification();
    }
  }, []);
  function handleGetTransferStock() {
    getInitialSupplyByOrderId({
      orderId: orderId,
      onSuccess: (res) => {
        setState({
          initialSupplyData: res,
          initialSupplyCommittedsState: res?.initialSupplyCommitteds,
        });
      },
      onFail,
    });
  }
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
  useEffect(() => {
    let uploadFileListItemOthers: any = [];
    let buyerBasicData: any = [];
    let sellersBasicData: any = [];

    initialSupplyCommittedsState?.forEach((data: any) => {
      data.initialSupplyFiles?.forEach((file: any) => {
        uploadFileListItemOthers.push(file);
      });

      if (data?.committedType === 0) {
        sellersBasicData.push({
          initialSupplyId: data?.initialSupplyId,
          personTypeId: data?.personTypeId,
          personTypeName: data?.personTypeName,
          brokerName: data?.brokerName,
          brokerCode: data?.brokerCode,
          brokerId: data?.brokerId,
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
          brokerName: data?.brokerName,
          brokerCode: data?.brokerCode,
          brokerId: data?.brokerId,
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
  const onFail = (error: any) => {
    onAlert(error);
  };
  function handleExportInitialSupplyNotification() {
    exportInitialSupplyNotification({
      orderId: orderId,
      onSuccess: (res) => {
        setState({
          exportInitialSupplyNotificationData: res,
        });
      },
      onFail,
    });
  }
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
    initialSupplyConfirm({
      orderId: orderId,
      publicMessage: publicMessage,
      privateMessage: privateMessage,
      onSuccess: (res) => {
        if (res?.succeeded) {
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
    initialSupplyReject({
      orderId: orderId,
      publicMessage: publicMessage,
      privateMessage: privateMessage,
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
  const downloadExportFile = () => {
    if (exportInitialSupplyNotificationData != null) {
      downloadFile(exportInitialSupplyNotificationData, 'exportWord.docx');
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
        {changePage == 'request' && (
          <div className="w-full grid grid-cols-10 ">
            <div className=" col-span-10 items-start flex border-b-2  justify-between bg-lightGray border-lightGray  px-4">
              <div className=" flex flex-row">
                <span className=" p-2 font-bold ">درخواست :</span>
                <span className=" p-2  ">
                  {initialSupplyData?.workFlowName}
                </span>
              </div>
              <div className=" flex flex-row">
                <span className=" p-2 font-bold ">کد پیگیری :</span>
                <span className=" p-2  ">
                  {initialSupplyData?.trackingNumber}
                </span>
              </div>
              <div className=" flex flex-row">
                <span className=" p-2 font-bold ">وضعیت :</span>
                <span className=" p-2  ">
                  {initialSupplyData?.orderStatusName}
                </span>
              </div>
            </div>

            <div className="grid col-span-10 grid-cols-10 gap-4 justify-between mx-4 mt-4">
              <div className="col-span-2 flex flex-col my-2">
                <span className=" font-bold">نماد :</span>
                <span className=" py-2 ">{initialSupplyData?.symbol}</span>
              </div>
              <div className="col-span-2 flex flex-col my-2">
                <span className=" font-bold">نام شرکت :</span>
                <span className=" py-2 ">{initialSupplyData?.symbolName}</span>
              </div>
              <div className="col-span-2 flex flex-col my-2">
                <span className=" font-bold">تعداد کل سهام شرکت :</span>
                <span className=" py-2 ">
                  {separator(initialSupplyData?.investment)}
                </span>
              </div>
              <div className="col-span-2 flex flex-col my-2">
                <span className=" font-bold">حجم سهام قابل عرضه :</span>
                <span className=" py-2 ">
                  {separator(initialSupplyData?.tradeVolume)}
                </span>
              </div>
              <div className="col-span-2 flex flex-col my-2">
                <span className=" font-bold">درصد حجم عرضه از کل سهام :</span>
                <span className=" py-2 ">
                  {initialSupplyData?.tradePercent}
                </span>
              </div>
              <div className="col-span-2 flex flex-col my-2">
                <span className=" font-bold">تاریخ عرضه :</span>
                <span className=" py-2 ">
                  {convertDateToJalali(initialSupplyData?.initialDate)}
                </span>
              </div>
              <div className="col-span-2 flex flex-col my-2">
                <span className=" font-bold">روش عرضه :</span>
                <span className=" py-2 ">
                  {initialSupplyData?.initialSupplyTypeName}
                </span>
              </div>
              <div className="col-span-2 flex flex-col my-2">
                <span className=" font-bold">کارگزار :</span>
                <span className=" py-2 ">
                  {initialSupplyData?.initialOfficerName}
                </span>
              </div>
              <div className="col-span-2 flex flex-col my-2">
                <span className=" font-bold">دامنه نوسان قیمت :</span>
                <span className=" py-2 ">
                  {initialSupplyData?.oscillationRange}
                </span>
              </div>
              <div className="col-span-2 flex flex-col my-2">
                <span className=" font-bold">حداقل قیمت :</span>
                <span className=" py-2 ">
                  {separator(initialSupplyData?.lowPrice)}
                </span>
              </div>
              <div className="col-span-2 flex flex-col my-2">
                <span className=" font-bold">حداکثر قیمت :</span>
                <span className=" py-2 ">
                  {separator(initialSupplyData?.highPrice)}
                </span>
              </div>
              <div className="col-span-2 flex flex-col my-2">
                <span className=" font-bold">قیمت مبنا :</span>
                <span className=" py-2 ">
                  {separator(initialSupplyData?.basePrice)}
                </span>
              </div>
              <div className="col-span-2 flex flex-col my-2">
                <span className=" font-bold">اوراق تبعی :</span>
                <span className=" py-2 ">
                  {initialSupplyData?.hasSubsidiary ? 'دارد' : 'ندارد'}
                </span>
              </div>
              <div className="col-span-2 flex flex-col my-2">
                <span className=" font-bold">اختصاص به کارکنان :</span>
                <span className=" py-2 ">
                  {initialSupplyData?.hasEmployeesShare ? 'دارد' : 'ندارد'}
                </span>
              </div>
              <div className="col-span-2 flex flex-col my-2">
                <span className=" font-bold">
                  تعداد سهام اختصاص به کارکنان :
                </span>
                <span className=" py-2 ">
                  {separator(initialSupplyData?.employeesShare)}
                </span>
              </div>
            </div>
            <div className="grid col-span-10 grid-cols-10 gap-4  justify-between mx-4 mt-4">
              <div className=" col-span-10 items-start flex  ">
                <span className="  font-bold text-blue underline">
                  اطلاعات کارگزار عرضه کننده و بازارگردان :
                </span>
              </div>
              <div className="col-span-5 flex flex-col">
                <span className=" font-bold">اطلاعات کارگزار عرضه کننده:</span>
                <div className="col-span-5 py-2 pl-4">
                  <Table
                    columns={brokerColumns}
                    className="col-span-5 grid grid-cols-12 text-center"
                    dataSource={initialSupplyData?.initialSupplyBrokers}
                    pageSize={1000}
                    scrollX={300}
                  />
                </div>
              </div>
              <div className="col-span-5 flex flex-col">
                <span className=" font-bold">بازارگردان :</span>
                <div className="col-span-5 py-2 pl-4">
                  <Table
                    columns={marketMakerColumns}
                    className="col-span-5 grid grid-cols-12 text-center"
                    dataSource={initialSupplyData?.initialSupplyMarketMakers}
                    pageSize={1000}
                    scrollX={300}
                  />
                </div>
              </div>
            </div>
            <div className="grid col-span-10 grid-cols-10 gap-4  justify-between mx-4 mt-4">
              <div className=" col-span-10 items-start flex  ">
                <span className="  font-bold text-blue underline">
                  اطلاعات متعهدین :
                </span>
              </div>
              <div className="col-span-10 flex flex-col">
                <span className=" font-bold">عرضه :</span>
                <div className="col-span-10 py-2 pl-4">
                  <Table
                    columns={committedsSellersColumns}
                    className="col-span-10 grid grid-cols-12 text-center"
                    dataSource={sellersBasicData}
                    pageSize={1000}
                  />
                </div>
              </div>
              <div className="col-span-10 flex flex-col">
                <span className=" font-bold">خرید :</span>
                <div className="col-span-10 py-2 pl-4">
                  <Table
                    columns={committedsBuyersColumns}
                    className="col-span-10 grid grid-cols-12 text-center"
                    dataSource={buyerBasicData}
                    pageSize={1000}
                  />
                </div>
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
                  {initialSupplyData?.responsibleName}
                </span>
              </div>
              <div className="col-span-2 flex flex-col">
                <span className=" font-bold">سمت :</span>
                <span className=" py-2 ">
                  {initialSupplyData?.responsiblePost}
                </span>
              </div>
              <div className="col-span-2 flex flex-col">
                <span className=" font-bold">شماره همراه :</span>
                <span className=" py-2 ">
                  {initialSupplyData?.responsibleMobile}
                </span>
              </div>
            </div>
            <div className="grid col-span-10 grid-cols-12 gap-4  justify-between mx-4 mt-4">
              <div className=" col-span-12 items-start flex  ">
                <span className="  font-bold text-blue underline">
                  توضیحات :
                </span>
              </div>
              <div className=" col-span-12  pb-4">
                <Table
                  data={initialSupplyData?.message}
                  columns={columns}
                  wrapperClassName="!mt-4"
                  onChangePage={onChangePage}
                  totalPages={1}
                  pageSize={10}
                  className="col-span-12 grid grid-cols-12 "
                />
              </div>
            </div>
            <div className="grid col-span-10 grid-cols-10 gap-4  justify-between mx-4 mt-4 ">
              <div className=" col-span-10 items-start flex  ">
                <span className="  font-bold text-blue underline">مدارک :</span>
              </div>
              <div className=" col-span-10 grid grid-cols-4 pb-4 bg-[#EEEBFF] mb-4 px-4">
                {initialSupplyData?.publicFiles?.length > 0 &&
                  initialSupplyData?.publicFiles?.map(
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
                  مدارک و مستندات عرضه و خرید :
                </span>
              </div>
              {uploadFileListItemOthers?.length > 0 &&
                initialSupplyData?.initialSupplyCommitteds?.map(
                  (parentItem: any, index: any) => (
                    <div className="grid col-span-10 grid-cols-12 gap-4  justify-between  mt-4 mb-4 bg-[#EEEBFF]">
                      <div className="col-span-12">
                        <span className=" font-bold m-4">{`${
                          parentItem?.committedType == 0
                            ? 'عرضه شناسه'
                            : 'خرید شناسه '
                        } ${parentItem?.tableId}`}</span>
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
          {!history && !isDownloadAnnouncement && (
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
          {!history && isDownloadAnnouncement && (
            <>
              <a
                // href="/stock/request-block"
                className="border-blue border mx-4 text-blue w-[120px] h-[35px]  flex items-center justify-center rounded"
                onClick={downloadExportFile}
              >
                دانلود اطلاعیه
              </a>
              <a
                // href="/stock/request-block"
                className="border-green border mx-4 text-green w-[120px] h-[35px]  flex items-center justify-center rounded"
                onClick={() => setState({ isModalConfirmVisible: true })}
              >
                تایید و اختتام
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
    </div>
  );
}
export default withAlert(InitialSupplyRequestDetails);
