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
  convertDateAndTimeToJalali,
  loadFromStorage,
  separator,
} from '@tse/tools';
import {
  getOrderWorkFlow,
  getTransferStockByOrderId,
  saveBlockData,
  transferStockConfirm,
  transferStockReject,
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
  transferStockData: {},
  isModalConfirmVisible: false,
  isModalRejectVisible: false,
  workFlow: null,
};
function TransferStockRequestDetails({ onAlert }: any) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useStates<any>(initialState);
  const {
    changePage,
    publicMessage,
    privateMessage,
    transferStockData,
    isModalConfirmVisible,
    isModalRejectVisible,
    workFlow,
  } = state;
  const isConfirmAttachment =
    window.location.pathname === '/stock/confirm-attachment-transfer-stock'
      ? true
      : false;
  const orderId = searchParams.get('id') != null ? searchParams.get('id') : '';
  const history =
    searchParams.get('history') != null ? searchParams.get('history') : '';
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
  useEffect(() => {
    handleGetTransferStock();
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
  function handleGetTransferStock() {
    getTransferStockByOrderId({
      orderId: orderId,
      onSuccess: (res) => {
        setState({
          transferStockData: res,
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
    transferStockConfirm({
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
    transferStockReject({
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
                  {transferStockData?.workFlowName}
                </span>
              </div>
              <div className=" flex flex-row">
                <span className=" p-2 font-bold ">کد پیگیری :</span>
                <span className=" p-2  ">
                  {transferStockData?.trackingNumber}
                </span>
              </div>
              <div className=" flex flex-row">
                <span className=" p-2 font-bold ">وضعیت :</span>
                <span className=" p-2  ">
                  {transferStockData?.orderStatusName}
                </span>
              </div>
            </div>
            <div className="grid col-span-10 grid-cols-10 gap-4 justify-between mx-4 mt-4">
              <div className="col-span-2 flex flex-row items-center ">
                <div className=" font-bold w-4 h-4 bg-blue rounded-full" />
                <span className=" py-2 mx-2">
                  {transferStockData?.transferTypeName}
                </span>
              </div>
            </div>
            <div className="grid col-span-10 grid-cols-10 gap-4 justify-between mx-4 mt-4">
              <div className="col-span-2 flex flex-col">
                <span className=" font-bold">نوع تسویه :</span>
                <span className=" py-2 ">
                  {transferStockData?.clearingTypeName}
                </span>
              </div>
              <div className="col-span-2 flex flex-col">
                <span className=" font-bold">نماد :</span>
                <span className=" py-2 ">{transferStockData?.symbol}</span>
              </div>
              <div className="col-span-2 flex flex-col">
                <span className=" font-bold">نام شرکت :</span>
                <span className=" py-2 ">{transferStockData?.symbolName}</span>
              </div>
              <div className="col-span-2 flex flex-col">
                <span className=" font-bold">حجم معامله :</span>
                <span className=" py-2 ">
                  {separator(transferStockData?.tradeVolume)}
                </span>
              </div>
              <div className="col-span-2 flex flex-col">
                <span className=" font-bold">قیمت :</span>
                <span className=" py-2 ">
                  {separator(transferStockData?.tradePrice)}
                </span>
              </div>
            </div>
            <div className="grid col-span-10 grid-cols-10 gap-4  justify-between mx-4 mt-4">
              <div className=" col-span-10 items-start flex  ">
                <span className="  font-bold text-blue underline">
                  اطلاعات خریدار :
                </span>
              </div>
              <div className="col-span-2 flex flex-col">
                <span className=" font-bold">نوع شخصیت :</span>
                <span className=" py-2 ">
                  {transferStockData?.buyerPersonTypeName}
                </span>
              </div>
              <div className="col-span-2 flex flex-col">
                <span className=" font-bold">نام خریدار :</span>
                <span className=" py-2 ">{transferStockData?.buyerFname}</span>
              </div>
              <div className="col-span-2 flex flex-col">
                <span className=" font-bold">
                  نام خانوادگی/نام شرکت خریدار :
                </span>
                <span className=" py-2 ">{transferStockData?.buyerLname}</span>
              </div>
              <div className="col-span-2 flex flex-col">
                <span className=" font-bold">کارگزار خریدار :</span>
                <span className=" py-2 ">
                  {transferStockData?.buyerBrokerName}
                </span>
              </div>
              <div className="col-span-2 flex flex-col">
                <span className=" font-bold">کد معامله گر خریدار :</span>
                <span className=" py-2 ">
                  {transferStockData?.buyerTraderCode}
                </span>
              </div>
              <div className="col-span-2 flex flex-col">
                <span className=" font-bold">کد بورسی خریدار :</span>
                <span className=" py-2 ">{transferStockData?.buyerCode}</span>
              </div>
              <div className="col-span-2 flex flex-col">
                <span className=" font-bold">کد بورسی قدیم خریدار :</span>
                <span className=" py-2 ">
                  {transferStockData?.buyerOldBourseCode}
                </span>
              </div>
            </div>
            <div className="grid col-span-10 grid-cols-10 gap-4  justify-between mx-4 mt-4">
              <div className=" col-span-10 items-start flex  ">
                <span className="  font-bold text-blue underline">
                  اطلاعات فروشنده :
                </span>
              </div>
              <div className="col-span-2 flex flex-col">
                <span className=" font-bold">نوع شخصیت :</span>
                <span className=" py-2 ">
                  {transferStockData?.sellerPersonTypeName}
                </span>
              </div>
              <div className="col-span-2 flex flex-col">
                <span className=" font-bold">نام فروشنده :</span>
                <span className=" py-2 ">{transferStockData?.sellerFname}</span>
              </div>
              <div className="col-span-2 flex flex-col">
                <span className=" font-bold">
                  نام خانوادگی/نام شرکت فروشنده :
                </span>
                <span className=" py-2 ">{transferStockData?.sellerLname}</span>
              </div>
              <div className="col-span-2 flex flex-col">
                <span className=" font-bold">کارگزار فروشنده :</span>
                <span className=" py-2 ">
                  {transferStockData?.sellerBrokerName}
                </span>
              </div>
              <div className="col-span-2 flex flex-col">
                <span className=" font-bold">کد معامله گر فروشنده :</span>
                <span className=" py-2 ">
                  {transferStockData?.sellerTraderCode}
                </span>
              </div>
              <div className="col-span-2 flex flex-col">
                <span className=" font-bold">کد بورسی فروشنده :</span>
                <span className=" py-2 ">{transferStockData?.sellerCode}</span>
              </div>
              <div className="col-span-2 flex flex-col">
                <span className=" font-bold">کد بورسی قدیم فروشنده :</span>
                <span className=" py-2 ">
                  {transferStockData?.sellerOldBourseCode}
                </span>
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
                  {transferStockData?.responsibleName}
                </span>
              </div>
              <div className="col-span-2 flex flex-col">
                <span className=" font-bold">نام کارگزار :</span>
                <span className=" py-2 ">{transferStockData?.brokerName}</span>
              </div>
              <div className="col-span-2 flex flex-col">
                <span className=" font-bold">سمت :</span>
                <span className=" py-2 ">
                  {transferStockData?.responsiblePost}
                </span>
              </div>
              <div className="col-span-2 flex flex-col">
                <span className=" font-bold">شماره همراه :</span>
                <span className=" py-2 ">
                  {transferStockData?.responsibleMobile}
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
                  data={transferStockData?.message}
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
                {transferStockData?.transferStockFiles?.length > 0 &&
                  transferStockData?.transferStockFiles?.map(
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
            {isConfirmAttachment && (
              <div className="grid col-span-10 grid-cols-10 gap-4  justify-between mx-4 mt-4 ">
                <div className=" col-span-10 items-start flex  ">
                  <span className="  font-bold text-blue underline">
                    مدارک تکمیلی :
                  </span>
                </div>
                <div className=" col-span-10 grid grid-cols-4 pb-4 bg-[#EEEBFF] mb-4 px-4">
                  {transferStockData?.transferStockFiles?.length > 0 &&
                    transferStockData?.transferStockFiles?.map(
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
            )}
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
          {!history && (
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
export default withAlert(TransferStockRequestDetails);
