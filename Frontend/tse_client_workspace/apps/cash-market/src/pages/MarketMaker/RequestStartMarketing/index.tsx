/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import {
  Button,
  TextField,
  Upload,
  CheckList,
  Modal,
  NewSelectSearch,
} from '@tse/components/atoms';
import { SymbolModal, Table, InvestorModal } from '@tse/components/organism';
import { DatePicker } from '@tse/components/molecules';
import { useEffect, useStates, useNavigate } from '@tse/utils';
import {
  convertDateAndTime,
  getQueryParams,
  convertDateToJalali,
} from '@tse/tools';
import {
  getInstrumentList,
  uploadFile,
  getInvestorList,
  saveOrder,
  getActiveInstrumentList,
  geBrokerList,
  getUserInfo,
  getOrderDetails,
  saveOrderExtending,
  closeForm,
  getRelatedFund,
} from '../../../Controller';
import withAlert from '../../../hoc/withAlert';
import { HeaderTypes } from '@tse/types';

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
  },
  {
    title: 'سفارش انباشته',
    dataIndex: 'maxOrder',
    key: 'maxOrder',
    className: 'col-span-2',
  },
  {
    title: 'دامنه مظنه',
    dataIndex: 'tolerance',
    key: 'tolerance',
    className: 'col-span-2',
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

const initialState = {
  symbolList: [],
  instrument: null,
  investorList: [],
  selectedInvestor: null,
  activeInstrumentList: [],
  brokerList: null,
  selectedBroker: null,
  bringCash: '',
  bringShare: '',
  orderFile1: null,
  orderFile2: null,
  orderFile3: null,
  orderFile4: null,
  orderFile5: null,
  orderFile1Status: {},
  orderFile2Status: {},
  orderFile3Status: {},
  orderFile4Status: {},
  startDate: '',
  endDate: '',
  userInfo: null,
  orderDetails: null,
  denyReasons: null,
  publicMessages: null,
  isModalCloseFormVisible: false,
  relatedFund: null,
  fundList: [],
};

function RequestStartMarketing({ onAlert }: any) {
  const navigate = useNavigate();
  const [state, setState] = useStates<any>(initialState);
  const {
    symbolList,
    instrument,
    investorList,
    selectedInvestor,
    activeInstrumentList,
    brokerList,
    bringCash,
    bringShare,
    orderFile1,
    orderFile2,
    orderFile3,
    orderFile4,
    orderFile1Status,
    orderFile2Status,
    orderFile3Status,
    orderFile4Status,
    orderFile5,
    startDate,
    endDate,
    selectedBroker,
    userInfo,
    instrumentError,
    selectedInvestorError,
    bringCashError,
    bringShareError,
    orderFile1Error,
    orderFile2Error,
    orderFile3Error,
    orderFile4Error,
    orderFile5Error,
    startDateError,
    endDateError,
    selectedBrokerError,
    denyReasons,
    publicMessages,
    orderDetails,
    isModalCloseFormVisible,
    relatedFund,
    fundList,
  } = state;
  const OrderId = getQueryParams('id', window.location.href);
  const isExtending =
    window.location.pathname === '/request-extending' ||
    window.location.pathname === '/extending-request-edit'
      ? true
      : false;

  const isExtendingEdit =
    window.location.pathname === '/extending-request-edit' ? true : false;

  const isEditMode =
    window.location.pathname === '/extending-request-edit' ||
    window.location.pathname === '/request-edit';

  const isRequestExtending = window.location.pathname === '/request-extending';
  useEffect(() => {
    getSymbolList('', 1);
    getInvestor('', 1);
    getBroker('', 1);
    getUserInfoAction();
    getRelatedFundList();
  }, []);

  useEffect(() => {
    if (OrderId) {
      getDetails();
    }
  }, [OrderId]);

  const getDetails = () => {
    const data = {
      OrderId,
    };
    getOrderDetails({ data, onSuccess: onSuccessDetail, onFail });
  };

  const onSuccessDetail = (res: any) => {
    const newBrokers = res.order?.orderBrokers?.map((item: any) => {
      return { ...item.broker };
    });
    const newInvestor = res.order?.orderInvestors?.map((item: any) => {
      return { ...item.investor };
    });
    if (isEditMode) {
      setState({
        instrument: res.order.orderDetail.instrumentParameter?.instrument,
        activeInstrumentList: res.order.orderDetail.instrumentParameter,
        selectedBroker: newBrokers,
        bringCash: res.order.orderDetail?.bringCash,
        bringShare: res.order.orderDetail?.bringShare,
        startDate: res.order.orderDetail.startDate,
        endDate: res.order.orderDetail.endDate,
        selectedInvestor: newInvestor,
        orderFile1: res.order.orderFiles[0],
        orderFile2: res.order.orderFiles[1],
        orderFile3: res.order.orderFiles[2],
        orderFile4: res.order.orderFiles[3],
        orderFile1Status:
          res?.order?.orderFiles[0]?.orderFileAccepts?.[0]?.acceptStatus,
        orderFile2Status:
          res?.order?.orderFiles[1]?.orderFileAccepts?.[0]?.acceptStatus,
        orderFile3Status:
          res?.order?.orderFiles[2]?.orderFileAccepts?.[0]?.acceptStatus,
        orderFile4Status:
          res?.order?.orderFiles[3]?.orderFileAccepts?.[0]?.acceptStatus,
        // orderFile5: isExtendingEdit ? res.order.orderFiles[1] : null,
        denyReasons: res.denyReasons,
        publicMessages: res.publicMessages,
        orderDetails: res,
        relatedFund: res?.order?.orderDetail?.fund,
      });
    } else {
      setState({
        instrument: res.order.orderDetail.instrumentParameter?.instrument,
        activeInstrumentList: res.order.orderDetail.instrumentParameter,
        // selectedBroker: newBrokers,
        // bringCash: res.order.orderDetail?.bringCash,
        // bringShare: res.order.orderDetail?.bringShare,
        // startDate: res.order.orderDetail.startDate,
        // endDate: res.order.orderDetail.endDate,
        // selectedInvestor: newInvestor,
        // orderFile1: isExtending ? null : res.order.orderFiles[0],
        // orderFile2: res.order.orderFiles[isExtending ? 0 : 1],
        // orderFile3: isExtending ? null : res.order.orderFiles[2],
        // orderFile4: isExtending ? null : res.order.orderFiles[3],
        // orderFile5: isExtendingEdit ? res.order.orderFiles[1] : null,
        denyReasons: res.denyReasons,
        // publicMessages: res.publicMessages,
        orderDetails: res,
      });
    }
  };

  const getUserInfoAction = () => {
    getUserInfo({ onSuccess: onSuccessUserInfo, onFail });
  };

  const onSuccessUserInfo = (res: any) => {
    setState({
      userInfo: res,
    });
  };

  const getBroker = (text: string, pageNo: number) => {
    const data = {
      SearchText: text,
      PageNumber: pageNo,
    };
    geBrokerList({ data, onSuccess: onSuccessBroker, onFail });
  };

  const onSuccessBroker = (res: any) => {
    setState({
      brokerList: res,
    });
  };

  const onSearchBroker = (value: string) => {
    getBroker(value, 1);
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
      onAlert({ message: 'برای نماد انتخاب شده پارامتری تعریف نشده است.' });
    }
  };

  const getInvestor = (text: string, pageNo: number) => {
    const data = {
      SearchText: text,
      PageNumber: pageNo,
    };
    getInvestorList({ data, onSuccess: onSuccessInvestorList, onFail });
  };

  const onSuccessInvestorList = (res: any) => {
    setState({
      investorList: res,
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

  const onFail = (error: any) => {
    onAlert(error);
  };

  const onSubmitSymbol = (e: any) => {
    setState({
      instrument: e,
      instrumentError: false,
    });
    getActiveInstrument(e.instrumentId);
  };

  const onRemoveFile = (id: number) => {
    const key = `orderFile${id}`;
    setState({
      [key]: null,
    });
  };

  const onChangeFile = (e: any, id: number) => {
    uploadFile({
      data: e.target.files[0],
      onSuccess: (res: any) => onSuccessUpload(res, id),
      onFail,
    });
  };

  const onSuccessUpload = (res: any, id: number) => {
    const key = `orderFile${id}`;
    const errorKey = `${key}Error`;
    setState({
      [key]: res,
      [errorKey]: false,
    });
  };

  const onChangeInvestor = (list: any) => {
    setState({
      selectedInvestor: list,
      selectedInvestorError: false,
    });
  };

  const onChange = (key: string, item: any) => {
    const errorKey = `${key}Error`;
    setState({
      [key]: item,
      [errorKey]: false,
    });
  };
  const onCloseForm = () => {
    const data = {
      orderId: OrderId,
    };
    closeForm({ data, onSuccess: onSuccessCloseForm, onFail });
  };
  const onSuccessCloseForm = () => {
    onAlert({
      type: 'success',
      message: 'درخواست شما با موفقیت ابطال گردید',
    });
    navigate('/cartable');
  };

  const validBroker =
    selectedBroker && selectedBroker?.length >= 1 ? true : false;

  // const validateFile1 = isExtending ? true : orderFile1;
  // const validateFile3 = isExtending ? true : orderFile3;
  // const validateFile4 = isExtending ? true : orderFile4;

  const submitOrder = () => {
    if (
      instrument &&
      selectedInvestor &&
      bringCash &&
      bringShare &&
      orderFile1 &&
      orderFile2 &&
      orderFile3 &&
      orderFile4 &&
      startDate &&
      endDate &&
      validBroker
    ) {
      const newBrokers = selectedBroker?.map((item: any) => {
        return { broker: item };
      });

      const newInvestors = selectedInvestor?.map((item: any) => {
        return { investor: item };
      });
      const data = {
        ...(OrderId && { orderId: OrderId }),
        bringCash: Number(bringCash),
        bringShare: Number(bringShare),
        startDate: convertDateAndTime(startDate),
        endDate: convertDateAndTime(endDate),
        relatedFundId: relatedFund?.fundId,
        instrumentParameter: {
          instrumentParameterId: activeInstrumentList?.instrumentParameterId,
        },
        orderBrokers: newBrokers,
        orderInvestors: newInvestors,
        orderFiles: [
          {
            fileId: orderFile1?.fileId,
            marketMakerFileTypeId: 1,
          },
          {
            fileId: orderFile2?.fileId,
            marketMakerFileTypeId: 2,
          },
          {
            fileId: orderFile3?.fileId,
            marketMakerFileTypeId: 3,
          },
          {
            fileId: orderFile4?.fileId,
            marketMakerFileTypeId: 4,
          },
        ],
      };
      const data1 = {
        ...data,
        orderId: isExtendingEdit ? orderDetails?.order?.orderId : null,
        orderParentId: isExtendingEdit
          ? orderDetails?.order?.orderParentId
          : OrderId,
        orderFiles: [
          {
            fileId: orderFile1?.fileId,
            marketMakerFileTypeId: 1,
          },
          {
            fileId: orderFile2?.fileId,
            marketMakerFileTypeId: 2,
          },
          {
            fileId: orderFile3?.fileId,
            marketMakerFileTypeId: 3,
          },
          {
            fileId: orderFile4?.fileId,
            marketMakerFileTypeId: 4,
          },
        ],
      };
      if (isExtending) {
        saveOrderExtending({ data: data1, onSuccess: onSuccessSave, onFail });
      } else {
        saveOrder({ data, onSuccess: onSuccessSave, onFail });
      }
    } else {
      setState({
        ...(!instrument && { instrumentError: true }),
        ...(!selectedInvestor && { selectedInvestorError: true }),
        ...(!bringCash && { bringCashError: true }),
        ...(!bringShare && { bringShareError: true }),
        ...(!orderFile1 && { orderFile1Error: true }),
        ...(!orderFile2 && { orderFile2Error: true }),
        ...(!orderFile3 && { orderFile3Error: true }),
        ...(!orderFile4 && { orderFile4Error: true }),
        ...(!startDate && { startDateError: true }),
        ...(!endDate && { endDateError: true }),
        ...(!validBroker && { selectedBrokerError: true }),
      });
    }
  };

  const onSuccessSave = () => {
    onAlert({
      type: 'success',
      message: 'درخواست شما با موفقیت ثبت گردید',
    });
    navigate('/cartable');
  };
  const getRelatedFundList = () => {
    getRelatedFund({ onSuccess: onSuccessFundList, onFail });
  };

  const onSuccessFundList = (result: any) => {
    setState({
      fundList: result,
    });
  };
  const pageTitle = isExtending
    ? 'درخواست تمدید بازارگردانی'
    : 'درخواست شروع بازارگردانی';

  return (
    <div>
      <div className="shadow-[0_0px_4px_rgba(0,0,0,0.2)] rounded-sm p-3">
        <span className="font-bold">{pageTitle}</span>
        <div className="grid grid-cols-12 gap-4 mt-8 mb-2">
          <SymbolModal
            className="col-span-3"
            data={symbolList}
            onChange={(pageNo: number, text: string) =>
              getSymbolList(text, pageNo)
            }
            onSubmit={onSubmitSymbol}
            defaultValue={instrument}
            required
            error={instrumentError}
            disabled={isExtending}
          />
        </div>
        <Table
          columns={tableHeader}
          className="col-span-12 grid grid-cols-12 "
          wrapperClassName="!mt-4"
          data={[activeInstrumentList]}
          isPagination={false}
        />
        <div className="grid grid-cols-12 gap-4 mt-8 mb-2">
          <TextField
            className="col-span-3"
            label="بازارگردان"
            value={`${userInfo?.userSummaryReply.firstName || ''} ${
              userInfo?.userSummaryReply.lastName || ''
            }`}
            disabled
          />
          <CheckList
            className="col-span-3"
            label="کارگزاران *"
            data={brokerList?.items}
            showKey="brokerName"
            idKey="brokerId"
            max={2}
            onChange={(value: any) => onChange('selectedBroker', value)}
            required
            error={selectedBrokerError}
            value={selectedBroker}
            onSearch={onSearchBroker}
          />
          <NewSelectSearch
            className="col-span-3"
            label="نام صندوق"
            onChange={(value: any) => {
              if (value?.fundName !== undefined) {
                setState({
                  relatedFund: value,
                });
              } else if (value == '') {
                setState({
                  relatedFund: null,
                });
              }
            }}
            value={relatedFund}
            data={[{ fundName: 'هیچکدام', fundId: null }, ...fundList]}
            showKey="fundName"
            // isDisable={isDisableFund}
          />
          <TextField
            className="col-span-3"
            label="میزان آورده نقد"
            onChange={(value: any) => onChange('bringCash', value)}
            value={bringCash}
            required
            error={bringCashError}
            type="numeric"
          />
          <TextField
            className="col-span-3"
            label="میزان آورده سهم"
            onChange={(value: any) => onChange('bringShare', value)}
            value={bringShare}
            required
            error={bringShareError}
            type="numeric"
          />
          <div className="col-span-3">
            <DatePicker
              parentClassName="!w-[85%]"
              label="تاریخ شروع *"
              value={startDate}
              onChange={(value: any) => onChange('startDate', value)}
              error={startDateError}
            />
          </div>

          <div className="col-span-3">
            <DatePicker
              parentClassName="!w-[85%]"
              label="تاریخ پایان *"
              value={endDate}
              onChange={(value: any) => onChange('endDate', value)}
              error={endDateError}
            />
          </div>
        </div>

        <span className="flex mb-3 mt-12 font-bold">سرمایه گذاران</span>
        <div>
          <InvestorModal
            data={investorList}
            onSubmit={onChangeInvestor}
            defaultValue={selectedInvestor}
            error={selectedInvestorError}
            onChange={(text: string, pageNo: number) =>
              getInvestor(text, pageNo)
            }
          />
        </div>

        <span className="flex mb-3 mt-12 font-bold ">مدارک</span>

        <div className="flex flex-row items-center w-[85%] justify-between mb-4">
          <span className="ml-4 whitespace-pre w-[30%]">
            اعلام زمان آمادگی شروع فعالیت:
          </span>
          <div className="w-[40%]">
            <Upload
              onChange={(file: any) => onChangeFile(file, 1)}
              value={orderFile1?.fileName}
              href={orderFile1?.link}
              name="orderFile1"
              onDelete={() => onRemoveFile(1)}
              error={orderFile1Error}
            />
          </div>
          {isEditMode && (
            <span
              className={`ml-4 w-[15%] ${
                orderFile1Status?.acceptStatusId == 'Rejected'
                  ? 'text-red'
                  : orderFile1Status?.acceptStatusId == 'Confirmed'
                  ? 'text-green'
                  : 'text-black'
              }`}
            >
              {orderFile1Status?.acceptStatusId == 'Rejected'
                ? orderFile1Status?.name
                : orderFile1Status?.acceptStatusId == 'Confirmed'
                ? orderFile1Status?.name
                : orderFile1Status?.name}
            </span>
          )}
        </div>
        <div className="flex flex-row items-center w-[85%] justify-between mb-4">
          <span className="ml-4 whitespace-pre w-[30%]">
            تقاضانامه بازارگردانی:
          </span>
          <div className="w-[40%]">
            <Upload
              onChange={(file: any) => onChangeFile(file, 2)}
              value={orderFile2?.fileName}
              href={orderFile2?.link}
              name="orderFile2"
              onDelete={() => onRemoveFile(2)}
              error={orderFile2Error}
            />
          </div>
          {isEditMode && (
            <span
              className={`ml-4 w-[15%] ${
                orderFile2Status?.acceptStatusId == 'Rejected'
                  ? 'text-red'
                  : orderFile2Status?.acceptStatusId == 'Confirmed'
                  ? 'text-green'
                  : 'text-black'
              }`}
            >
              {orderFile2Status?.acceptStatusId == 'Rejected'
                ? orderFile2Status?.name
                : orderFile2Status?.acceptStatusId == 'Confirmed'
                ? orderFile2Status?.name
                : orderFile2Status?.name}
            </span>
          )}
        </div>
        <div className="flex flex-row items-center w-[85%] justify-between mb-4">
          <span className="ml-4 whitespace-pre w-[30%]">
            قرارداد / متمم بازارگردانی:
          </span>
          <div className="w-[40%]">
            <Upload
              onChange={(file: any) => onChangeFile(file, 3)}
              value={orderFile3?.fileName}
              href={orderFile3?.link}
              name="orderFile3"
              onDelete={() => onRemoveFile(3)}
              error={orderFile3Error}
            />
          </div>
          {isEditMode && (
            <span
              className={`ml-4 w-[15%] ${
                orderFile3Status?.acceptStatusId == 'Rejected'
                  ? 'text-red'
                  : orderFile3Status?.acceptStatusId == 'Confirmed'
                  ? 'text-green'
                  : 'text-black'
              }`}
            >
              {orderFile3Status?.acceptStatusId == 'Rejected'
                ? orderFile3Status?.name
                : orderFile3Status?.acceptStatusId == 'Confirmed'
                ? orderFile3Status?.name
                : orderFile3Status?.name}
            </span>
          )}
        </div>
        <div className="flex flex-row items-center w-[85%] justify-between mb-4">
          <span className="ml-4 whitespace-pre w-[30%]">
            آخرین صورت جلسه مجمع صندوق:
          </span>
          <div className="w-[40%]">
            <Upload
              onChange={(file: any) => onChangeFile(file, 4)}
              value={orderFile4?.fileName}
              href={orderFile4?.link}
              name="orderFile4"
              onDelete={() => onRemoveFile(4)}
              error={orderFile4Error}
            />
          </div>
          {isEditMode && (
            <span
              className={`ml-4 w-[15%] ${
                orderFile4Status?.acceptStatusId == 'Rejected'
                  ? 'text-red'
                  : orderFile4Status?.acceptStatusId == 'Confirmed'
                  ? 'text-green'
                  : 'text-black'
              }`}
            >
              {orderFile4Status?.acceptStatusId == 'Rejected'
                ? orderFile4Status?.name
                : orderFile4Status?.acceptStatusId == 'Confirmed'
                ? orderFile4Status?.name
                : orderFile4Status?.name}
            </span>
          )}
        </div>

        {denyReasons && !isRequestExtending && (
          <div className="grid mx-2 my-8">
            <span className="font-bold">علت رد</span>
            {denyReasons?.map(({ reasonTitle }: { reasonTitle: string }) => (
              <span className="text-blue">- {reasonTitle}</span>
            ))}
          </div>
        )}
        {publicMessages && (
          <>
            <span className="font-bold mr-4">پیامهای دریافتی</span>
            <Table
              columns={messageHeader}
              className="col-span-12 grid grid-cols-12"
              wrapperClassName="!m-4"
              data={publicMessages}
              isPagination={false}
            />
          </>
        )}
      </div>
      <div className="flex items-start justify-end pt-3">
        {isEditMode && (
          <Button
            className="border-red border text-red w-[100px]  mr-3"
            onClick={() => setState({ isModalCloseFormVisible: true })}
          >
            ابطال
          </Button>
        )}
        <Button
          className="bg-blue text-white w-[115px] mr-4"
          onClick={submitOrder}
        >
          ثبت
        </Button>
      </div>
      <Modal
        handleOk={() => onCloseForm()}
        handleCancel={() => setState({ isModalCloseFormVisible: false })}
        isModalVisible={isModalCloseFormVisible}
        title={`آیا نسبت به ابطال درخواست خود اطمینان دارید؟`}
      ></Modal>
    </div>
  );
}

export default withAlert(RequestStartMarketing);
