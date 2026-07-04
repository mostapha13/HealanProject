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
} from '../../../Controller';
import withAlert from '../../../hoc/withAlert';
import { HeaderTypes } from '@tse/types';
import { Radio } from 'antd';

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
    title: 'حداقل حجم معامله روزانه',
    dataIndex: 'minValue',
    key: 'minValue',
    className: 'col-span-2',
    render: (item: any) => <span>{separator(item)}</span>,
  },
  {
    title: 'حداقل حجم قابل سفارش انباشته',
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

const initialState = {
  commitmentIncDecType: 'Dec',
  symbolList: [],
  instrument: null,
  instrumentId: '',
  tradableVolume: '',
  orderableVolume: '',
  quoteDomain: '',
  tradableVolumeError: false,
  orderableVolumeError: false,
  quoteDomainError: false,
  activeInstrumentList: [],
  orderFile1: null,
  orderFile2: null,
  orderFile3: null,
  orderFile4: null,
  orderFile5: null,
  orderFile1Status: {},
  orderFile2Status: {},
  orderFile3Status: {},
  orderFile4Status: {},
  orderFile5Status: {},
  startDate: '',
  endDate: '',
  orderDetails: null,
  denyReasons: null,
  publicMessages: null,
  isModalCloseFormVisible: false,
};
const commitmentIncDecTypeList = [
  {
    id: 'Dec',
    name: 'کاهش تعهدات',
  },
  {
    id: 'Inc',
    name: 'افزایش سرمایه',
  },
  {
    id: 'Classes',
    name: 'طبقات نقدشوندگی',
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

function RequestChangeParameter({ onAlert }: any) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useStates<any>(initialState);
  const {
    commitmentIncDecType,
    symbolList,
    instrument,
    instrumentId,
    tradableVolume,
    orderableVolume,
    quoteDomain,
    tradableVolumeError,
    orderableVolumeError,
    quoteDomainError,

    selectedInvestor,
    activeInstrumentList,
    orderFile1,
    orderFile2,
    orderFile3,
    orderFile4,
    orderFile5,
    orderFile1Status,
    orderFile2Status,
    orderFile3Status,
    orderFile4Status,
    orderFile5Status,
    instrumentError,
    orderFile1Error,
    orderFile2Error,
    orderFile3Error,
    orderFile4Error,
    orderFile5Error,
    isModalCloseFormVisible,
    publicMessages,
  } = state;
  const OrderId =
    searchParams.get('id') != null ? searchParams.get('id') : null;
  const isEditMode =
    window.location.pathname === '/stock/request-change-parameter-disapprove';
  const history =
    searchParams.get('history') != null ? searchParams.get('history') : '';
  useEffect(() => {
    getSymbolList('', 1);
  }, []);

  useEffect(() => {
    if (OrderId) {
      getDetails();
    }
  }, [OrderId]);
  useEffect(() => {
    if (!isEditMode) {
      if (
        activeInstrumentList?.minValue != undefined &&
        commitmentIncDecType == 'Dec'
      ) {
        setState({
          tradableVolume: activeInstrumentList?.minValue / 2,
          orderableVolume: activeInstrumentList?.maxOrder / 2,
          quoteDomain: activeInstrumentList?.tolerance,
          tradableVolumeError: false,
          orderableVolumeError: false,
          quoteDomainError: false,
        });
      } else {
        setState({
          tradableVolume: activeInstrumentList?.minValue,
          orderableVolume: activeInstrumentList?.maxOrder,
          quoteDomain: activeInstrumentList?.tolerance,
          tradableVolumeError: false,
          orderableVolumeError: false,
          quoteDomainError: false,
        });
      }
    }
  }, [commitmentIncDecType, activeInstrumentList]);

  const getDetails = () => {
    const data = {
      OrderId,
    };
    getCommitmentIncDecFormById({ data, onSuccess: onSuccessDetail, onFail });
  };

  const onSuccessDetail = (res: any) => {
    if (isEditMode) {
      setState({
        instrument: res?.instrumentResponse,
        instrumentId: res?.instrumentResponse?.instrumentId,
        activeInstrumentList: res?.order?.orderDetail?.instrumentParameter,
        commitmentIncDecType: res?.commitmentIncDecType,
        tradableVolume: res?.tradableVolume,
        orderableVolume: res?.orderableVolume,
        quoteDomain: res?.quoteDomain,
        orderFile1: res.order.orderFiles[0],
        orderFile2: res.order.orderFiles[1],
        orderFile3: res.order.orderFiles[2],
        orderFile4: res.order.orderFiles[3],
        orderFile5: res.order.orderFiles[4],
        orderFile1Status:
          res?.order?.orderFiles[0]?.orderFileAccepts?.[0]?.acceptStatus,
        orderFile2Status:
          res?.order?.orderFiles[1]?.orderFileAccepts?.[0]?.acceptStatus,
        orderFile3Status:
          res?.order?.orderFiles[2]?.orderFileAccepts?.[0]?.acceptStatus,
        orderFile4Status:
          res?.order?.orderFiles[3]?.orderFileAccepts?.[0]?.acceptStatus,
        orderFile5Status:
          res?.order?.orderFiles[4]?.orderFileAccepts?.[0]?.acceptStatus,
        denyReasons: res.denyReasons,
        publicMessages: res.publicMessages,
        orderDetails: res,
      });
    }
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

  // const validateFile1 = isExtending ? true : orderFile1;
  // const validateFile3 = isExtending ? true : orderFile3;
  // const validateFile4 = isExtending ? true : orderFile4;

  const submitOrder = () => {
    if (
      instrument &&
      tradableVolume &&
      orderableVolume &&
      quoteDomain &&
      orderFile1
    ) {
      if (
        commitmentIncDecType != 'Dec' &&
        (!orderFile4 ||
          orderFile4?.fileId == '00000000-0000-0000-0000-000000000000')
      ) {
        setState({
          orderFile4Error: true,
        });
      } else if (
        commitmentIncDecType == 'Dec' &&
        (!orderFile2 || !orderFile3)
      ) {
        setState({
          ...(!orderFile2 && { orderFile2Error: true }),
          ...(!orderFile3 && { orderFile3Error: true }),
        });
      } else {
        const dataDec = {
          ...(OrderId && { orderId: OrderId }),
          commitmentIncDecType: commitmentIncDecType,
          instrumentId: instrumentId,
          tradableVolume: tradableVolume,
          orderableVolume: orderableVolume,
          quoteDomain: quoteDomain,
          orderFiles: [
            {
              fileId: orderFile1?.fileId,
              marketMakerFileTypeId: 14,
            },
            {
              fileId: orderFile2?.fileId,
              marketMakerFileTypeId: 15,
            },
            {
              fileId: orderFile3?.fileId,
              marketMakerFileTypeId: 16,
            },
            {
              fileId:
                orderFile5?.fileId == undefined
                  ? '00000000-0000-0000-0000-000000000000'
                  : orderFile5?.fileId,
              marketMakerFileTypeId: 18,
            },
          ],
        };
        const data = {
          ...(OrderId && { orderId: OrderId }),
          commitmentIncDecType: commitmentIncDecType,
          instrumentId: instrumentId,
          tradableVolume: tradableVolume,
          orderableVolume: orderableVolume,
          quoteDomain: quoteDomain,
          orderFiles: [
            {
              fileId: orderFile1?.fileId,
              marketMakerFileTypeId: 14,
            },
            {
              fileId: orderFile4?.fileId,
              marketMakerFileTypeId: 17,
            },
            {
              fileId:
                orderFile5?.fileId == undefined
                  ? '00000000-0000-0000-0000-000000000000'
                  : orderFile5?.fileId,
              marketMakerFileTypeId: 18,
            },
          ],
        };
        if (commitmentIncDecType == 'Dec') {
          saveOrderCommitmentIncDec({
            data: dataDec,
            onSuccess: onSuccessSave,
            onFail,
          });
        } else {
          saveOrderCommitmentIncDec({ data, onSuccess: onSuccessSave, onFail });
        }
      }
    } else {
      setState({
        ...(!instrument && { instrumentError: true }),
        ...(!selectedInvestor && { selectedInvestorError: true }),
        ...(!tradableVolume && { tradableVolumeError: true }),
        ...(!orderableVolume && { orderableVolumeError: true }),
        ...(!quoteDomain && { quoteDomainError: true }),
        ...(!orderFile1 && { orderFile1Error: true }),
        ...(!orderFile2 && { orderFile2Error: true }),
        ...(!orderFile3 && { orderFile3Error: true }),
        ...(!orderFile4 && { orderFile4Error: true }),
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

  const pageTitle = 'تغییر پارامترهای بازارگردانی';

  return (
    <>
      <div className="shadow-[0_0px_4px_rgba(0,0,0,0.2)] rounded-sm p-3">
        <span className="font-bold">{pageTitle}</span>
        <div className="col-span-12 mt-4">
          <Radio.Group
            onChange={(e) => setState({ commitmentIncDecType: e.target.value })}
            value={commitmentIncDecType}
            style={{ marginBottom: 10, width: '100%', marginTop: 10 }}
          >
            {commitmentIncDecTypeList.map((item: any) => (
              <Radio className="text-extratiny font-bold" value={item.id}>
                {item.name}
              </Radio>
            ))}
          </Radio.Group>
        </div>
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
            // disabled={isExtending}
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
          <span className=" col-span-12 font-bold">
            {commitmentIncDecType == 'Inc'
              ? 'افزایش سرمایه'
              : commitmentIncDecType == 'Dec'
              ? 'کاهش تعهدات'
              : commitmentIncDecType == 'Classes'
              ? 'طبقات نقدشوندگی'
              : ''}
          </span>
          <TextField
            className="col-span-3"
            label="حداقل حجم معامله روزانه"
            onChange={(value: any) => onChange('tradableVolume', value)}
            value={separator(tradableVolume)}
            required
            error={tradableVolumeError}
            type="numeric"
            readOnly
          />
          <TextField
            className="col-span-3"
            label="حداقل حجم قابل سفارش انباشته"
            onChange={(value: any) => onChange('orderableVolume', value)}
            value={separator(orderableVolume)}
            required
            error={orderableVolumeError}
            type="numeric"
            readOnly
          />
          <TextField
            className="col-span-3"
            label="دامنه مظنه"
            onChange={(value: any) => onChange('quoteDomain', value)}
            value={quoteDomain}
            required
            error={quoteDomainError}
            type="number"
            readOnly
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
        {commitmentIncDecType == 'Dec' && (
          <>
            <div className="flex flex-row items-center w-[85%] justify-between mb-4">
              <span className="ml-4 whitespace-pre w-[30%]">ترازنامه * :</span>
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
                مکاتبات / تامین کننده دارایی * :
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
          </>
        )}
        {commitmentIncDecType != 'Dec' && (
          <div className="flex flex-row items-center w-[85%] justify-between mb-4">
            <span className="ml-4 whitespace-pre w-[30%]">
              صورت جلسه مجمع * :
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
        )}

        <div className="flex flex-row items-center w-[85%] justify-between mb-4">
          <span className="ml-4 whitespace-pre w-[30%]">سایر موارد :</span>
          <div className="w-[40%]">
            <Upload
              onChange={(file: any) => onChangeFile(file, 5)}
              value={orderFile5?.fileName}
              href={orderFile5?.link}
              name="orderFile5"
              onDelete={() => onRemoveFile(5)}
              error={orderFile5Error}
            />
          </div>
          {isEditMode && (
            <span
              className={`ml-4 w-[15%] ${
                orderFile5Status?.acceptStatusId == 'Rejected'
                  ? 'text-red'
                  : orderFile5Status?.acceptStatusId == 'Confirmed'
                  ? 'text-green'
                  : 'text-black'
              }`}
            >
              {orderFile5Status?.acceptStatusId == 'Rejected'
                ? orderFile5Status?.name
                : orderFile5Status?.acceptStatusId == 'Confirmed'
                ? orderFile5Status?.name
                : orderFile5Status?.name}
            </span>
          )}
        </div>
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

export default withAlert(RequestChangeParameter);
