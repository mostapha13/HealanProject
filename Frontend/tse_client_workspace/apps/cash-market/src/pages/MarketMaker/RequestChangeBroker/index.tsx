/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import {
  Button,
  TextField,
  Upload,
  CheckList,
  Modal,
} from '@tse/components/atoms';
import { SymbolModal, Table, InvestorModal } from '@tse/components/organism';
import { DatePicker } from '@tse/components/molecules';
import { useEffect, useStates, useNavigate, useSearchParams } from '@tse/utils';
import {
  convertDateAndTime,
  getQueryParams,
  convertDateToJalali,
  deSepratorWithDot,
  separator,
} from '@tse/tools';
import {
  getInstrumentList,
  uploadFile,
  saveOrder,
  getActiveInstrumentList,
  getUserInfo,
  getOrderDetails,
  saveOrderExtending,
  closeForm,
  saveOrderCommitmentIncDec,
  getCommitmentIncDecFormById,
  geBrokerList,
  getChangeBrokerParam,
  saveOrderChangeBroker,
  getChangeBrokerFormById,
} from '../../../Controller';
import withAlert from '../../../hoc/withAlert';
import { HeaderTypes } from '@tse/types';
import { Radio } from 'antd';

const tableHeader: HeaderTypes[] = [
  {
    title: 'نماد',
    dataIndex: 'instrumentResponse',
    key: 'instrumentResponse',
    className: 'col-span-3',
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
    title: 'کارگزار قدیم',
    dataIndex: 'oldBrokerNames',
    key: 'oldBrokerNames',
    className: 'col-span-5',
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
  instrumentId: '',
  brokerList: null,
  selectedBroker: null,
  selectedBrokerError: false,
  changeBrokerParamData: [],
  orderFile1: null,
  orderFile2: null,
  orderFile3: null,
  orderFile1Status: {},
  orderFile2Status: {},
  orderFile3Status: {},
  orderDetails: null,
  denyReasons: null,
  publicMessages: null,
  isModalCloseFormVisible: false,
};

function RequestChangeBroker({ onAlert }: any) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useStates<any>(initialState);
  const {
    symbolList,
    instrument,
    instrumentId,
    brokerList,
    selectedBroker,
    selectedBrokerError,
    changeBrokerParamData,
    orderFile1,
    orderFile2,
    orderFile3,
    orderFile1Status,
    orderFile2Status,
    orderFile3Status,
    instrumentError,
    orderFile1Error,
    orderFile2Error,
    orderFile3Error,
    publicMessages,
    isModalCloseFormVisible,
  } = state;
  const OrderId =
    searchParams.get('id') != null ? searchParams.get('id') : null;
  const isEditMode =
    window.location.pathname === '/stock/request-change-broker-disapprove';
  const history =
    searchParams.get('history') != null ? searchParams.get('history') : '';
  useEffect(() => {
    getSymbolList('', 1);
    getBroker('', 1);
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
    getChangeBrokerFormById({ data, onSuccess: onSuccessDetail, onFail });
  };

  const onSuccessDetail = (res: any) => {
    if (isEditMode) {
      const newBrokers = res?.order?.orderBrokers?.map((item: any) => {
        return { ...item.broker };
      });
      setState({
        instrument: res?.changeBrokerParam?.instrumentResponse,
        instrumentId: res?.changeBrokerParam?.instrumentResponse?.instrumentId,
        changeBrokerParamData: res?.changeBrokerParam,
        selectedBroker: newBrokers,
        orderFile1: res?.order?.orderFiles[0],
        orderFile2: res?.order?.orderFiles[1],
        orderFile3: res?.order?.orderFiles[2],
        orderFile1Status:
          res?.order?.orderFiles[0]?.orderFileAccepts?.[0]?.acceptStatus,
        orderFile2Status:
          res?.order?.orderFiles[1]?.orderFileAccepts?.[0]?.acceptStatus,
        orderFile3Status:
          res?.order?.orderFiles[2]?.orderFileAccepts?.[0]?.acceptStatus,
        denyReasons: res?.denyReasons,
        publicMessages: res?.publicMessages,
        orderDetails: res,
      });
    }
  };

  const getChangeBrokerParamData = (id: string) => {
    const data = {
      InstrumentId: id,
    };
    getChangeBrokerParam({
      data,
      onSuccess: onSuccessChangeBrokerParam,
      onFail,
    });
  };

  const onSuccessChangeBrokerParam = (res: any) => {
    if (res) {
      setState({
        changeBrokerParamData: res,
      });
    } else {
      onAlert({ message: 'برای نماد انتخاب شده پارامتری تعریف نشده است.' });
    }
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
      instrumentId: e.instrumentId,
    });
    getChangeBrokerParamData(e.instrumentId);
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

  const submitOrder = () => {
    if (instrument && orderFile1 && orderFile2 && selectedBroker) {
      const data = {
        ...(OrderId && { orderId: OrderId }),
        instrumentId: instrumentId,
        brokers: selectedBroker,
        orderFiles: [
          {
            fileId: orderFile1?.fileId,
            marketMakerFileTypeId: 19,
          },
          {
            fileId: orderFile2?.fileId,
            marketMakerFileTypeId: 20,
          },
          {
            fileId:
              orderFile3?.fileId == undefined
                ? '00000000-0000-0000-0000-000000000000'
                : orderFile3?.fileId,
            marketMakerFileTypeId: 21,
          },
        ],
      };

      saveOrderChangeBroker({ data, onSuccess: onSuccessSave, onFail });
    } else {
      setState({
        ...(!instrument && { instrumentError: true }),
        ...(!selectedBroker && { selectedBrokerError: true }),
        ...(!orderFile1 && { orderFile1Error: true }),
        ...(!orderFile2 && { orderFile2Error: true }),
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

  const pageTitle = 'تغییر کارگزار';
  return (
    <>
      <div className="shadow-[0_0px_4px_rgba(0,0,0,0.2)] rounded-sm p-3">
        <span className="font-bold">{pageTitle}</span>

        <div className="grid grid-cols-12  mt-8 mb-2">
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
            // disabled={isExtending}
          />
        </div>
        <Table
          columns={tableHeader}
          className="col-span-12 grid grid-cols-12 "
          wrapperClassName="!mt-4"
          data={[changeBrokerParamData]}
          isPagination={false}
        />
        <div className="grid grid-cols-12 col-span-12 my-8">
          <CheckList
            className="col-span-3"
            label="کارگزار جدید *"
            data={brokerList?.items}
            showKey="brokerName"
            idKey="brokerId"
            // max={2}
            onChange={(value: any) => onChange('selectedBroker', value)}
            required
            error={selectedBrokerError}
            value={selectedBroker}
            onSearch={onSearchBroker}
          />
        </div>

        <span className="flex mb-3 mt-12 font-bold ">مدارک</span>
        <div className="flex flex-row items-center w-[85%] justify-between mb-4">
          <span className="ml-4 whitespace-pre w-[30%]">نامه درخواست * :</span>
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

        <>
          <div className="flex flex-row items-center w-[85%] justify-between mb-4">
            <span className="ml-4 whitespace-pre w-[30%]">
              نامه قبولی سمت کارگزار جدید* :
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
            <span className="ml-4 whitespace-pre w-[30%]">سایر موارد :</span>
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
        </>
        {publicMessages && (
          <>
            <span className="font-bold ">پیامهای دریافتی</span>
            <Table
              columns={messageHeader}
              className="col-span-12 grid grid-cols-12"
              wrapperClassName="!mt-4"
              data={publicMessages}
              isPagination={false}
            />
          </>
        )}
      </div>
      <div className="flex items-start justify-end pt-3">
        <Button
          className="border-blue border text-blue w-[115px] mr-4"
          onClick={() => navigate('/cartable')}
        >
          بازگشت
        </Button>
        {!history && (
          <>
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
          </>
        )}
      </div>
      <Modal
        handleOk={() => onCloseForm()}
        handleCancel={() => setState({ isModalCloseFormVisible: false })}
        isModalVisible={isModalCloseFormVisible}
        title={`آیا نسبت به ابطال درخواست خود اطمینان دارید؟`}
      ></Modal>
    </>
  );
}

export default withAlert(RequestChangeBroker);
