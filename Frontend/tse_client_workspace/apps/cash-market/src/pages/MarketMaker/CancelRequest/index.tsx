import { Table } from '@tse/components/organism';
import withAlert from '../../../hoc/withAlert';
import { HeaderTypes, ErrorType } from '@tse/types';
import {
  Button,
  TextField,
  CheckList,
  Upload,
  Modal,
} from '@tse/components/atoms';
import { useEffect, useStates, useNavigate } from '@tse/utils';
import { getQueryParams } from '@tse/tools';
import {
  uploadFile,
  saveOrderQuit,
  getQuitReasonList,
  getOrderDetails,
  closeForm,
} from '../../../Controller';

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

const initialState = {
  quitReasonList: [],
  selectedReasons: null,
  orderDetails: null,
  orderFile1: null,
  orderFile2: null,
  orderFile3: null,
  orderFile1Error: false,
  orderFile2Error: false,
  orderFile3Error: false,
  selectedReasonsError: false,
  message: '',
  isModalCloseFormVisible: false,
  denyReasons: null,
};
function CancelRequest({ onAlert }: any) {
  const navigate = useNavigate();
  const [state, setState] = useStates<any>(initialState);
  const {
    quitReasonList,
    selectedReasons,
    orderDetails,
    orderFile1,
    orderFile2,
    orderFile3,
    orderFile1Error,
    orderFile2Error,
    orderFile3Error,
    selectedReasonsError,
    message,
    isModalCloseFormVisible,
    denyReasons,
  } = state;
  const OrderId = getQueryParams('id', window.location.href);

  const isCancelEdit =
    window.location.pathname === '/request-orderquit-edit' ? true : false;

  useEffect(() => {
    getQuitReason(1, '');
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
    setState({
      orderDetails: res,
      selectedReasons: res.quitReasons,
      message: res.message,
      denyReasons: res.denyReasons,
      orderFile1:
        res.order?.orderFiles[0]?.marketMakerFileTypeId ===
        'CancellationRequest'
          ? res.order?.orderFiles[0]
          : null,
      orderFile2:
        res.order?.orderFiles[1]?.marketMakerFileTypeId === 'PublisherConsent'
          ? res.order?.orderFiles[1]
          : null,
      // orderFile3:
      //   res.order?.orderFiles[2]?.marketMakerFileTypeId === 'InvestorConsent'
      //     ? res.order?.orderFiles[2]
      //     : null,
    });
  };

  const getQuitReason = (pageNo: number, text: string) => {
    const data = {
      QuitReasonName: text,
      PageNumber: pageNo,
      PageSize: 10,
    };
    getQuitReasonList({ data, onSuccess: onSuccessList, onFail });
  };

  const onSuccessList = (list: any) => {
    setState({
      quitReasonList: list,
    });
  };

  const onChangeText = (key: string, value: any) => {
    const errorKey = `${key}Error`;
    setState({
      [key]: value,
      [errorKey]: false,
    });
  };

  const onChangeFile = (e: any, id: number) => {
    uploadFile({
      data: e.target.files[0],
      onSuccess: (res: any) => onSuccessUpload(res, id),
      onFail,
    });
  };

  const onRemoveFile = (id: number) => {
    const key = `orderFile${id}`;
    setState({
      [key]: null,
    });
  };

  const onFail = (error: ErrorType) => {
    onAlert(error);
  };

  const onSuccessUpload = (res: any, id: number) => {
    const key = `orderFile${id}`;
    const errorKey = `${key}Error`;
    setState({
      [key]: res,
      [errorKey]: false,
    });
  };

  const submit = () => {
    if (selectedReasons.length > 0 && orderFile1 && orderFile2) {
      const data = {
        orderId: isCancelEdit ? orderDetails?.order?.orderId : null,
        orderParentId: isCancelEdit
          ? orderDetails?.order?.orderParentId
          : OrderId,
        quitReasons: selectedReasons,
        orderFiles: [
          {
            fileId: orderFile1.fileId,
            marketMakerFileTypeId: 6,
          },
          {
            fileId: orderFile2.fileId,
            marketMakerFileTypeId: 7,
          },
          // {
          //   fileId: orderFile1.fileId,
          //   marketMakerFileTypeId: 8,
          // },
        ],
        message,
      };
      saveOrderQuit({ data, onSuccess: onSuccessSave, onFail });
    } else {
      setState({
        ...(!orderFile1 && { orderFile1Error: true }),
        ...(!orderFile2 && { orderFile2Error: true }),
        ...(selectedReasons.length == 0 && { selectedReasonsError: true }),
      });
    }
  };

  const onSuccessSave = () => {
    onAlert({ message: 'عملیات با موفقیت انجام شد', type: 'success' });
    navigate('/cartable');
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
  return (
    <>
      <div className="grid shadow-[0_0px_4px_rgba(0,0,0,0.2)] rounded-sm p-3">
        <span className="font-bold"> درخواست انصراف بازارگردانی</span>
        <Table
          columns={tableHeader}
          className="col-span-12 grid grid-cols-12 "
          wrapperClassName="!mt-4"
          data={[orderDetails?.order?.orderDetail?.instrumentParameter]}
          isPagination={false}
        />
        <div className="mx-1 my-8  grid grid-cols-12">
          <CheckList
            data={quitReasonList?.items}
            showKey="quitReasonName"
            idKey="quitReasonId"
            label="دلیل انصراف"
            className="col-span-3"
            onChange={(e: any) => onChangeText('selectedReasons', e)}
            error={selectedReasonsError}
            value={selectedReasons}
          />
        </div>
        <div className="grid mx-4 mb-8">
          {selectedReasons?.map(
            ({ quitReasonName }: { quitReasonName: string }) => (
              <span className="text-blue">- {quitReasonName}</span>
            )
          )}
        </div>
        <TextField
          multiline
          label="توضیحات"
          onChange={(e: any) => onChangeText('message', e)}
          value={message}
          fullWidth
        />
        {denyReasons && isCancelEdit && (
          <div className="grid mx-2 my-8">
            <span className="font-bold">علت رد</span>
            {denyReasons?.map(({ reasonTitle }: { reasonTitle: string }) => (
              <span className="text-blue">- {reasonTitle}</span>
            ))}
          </div>
        )}
        <span className="font-bold mt-12">مدارک</span>
        <div className="flex flex-row items-center w-[65%] justify-between mb-4 mt-8">
          <span className="ml-4 whitespace-pre">
            نامه درخواست انصراف بازارگردان :
          </span>
          <Upload
            onChange={(file: any) => onChangeFile(file, 1)}
            value={orderFile1?.fileName}
            href={orderFile1?.link}
            name="orderFile1"
            onDelete={() => onRemoveFile(1)}
            error={orderFile1Error}
          />
        </div>

        <div className="flex flex-row items-center w-[65%] justify-between mb-4">
          <span className="ml-4 whitespace-pre">
            نامه موافقت تامین کننده منابع/مستندات درخواست تامین منابع :
          </span>
          <Upload
            onChange={(file: any) => onChangeFile(file, 2)}
            value={orderFile2?.fileName}
            href={orderFile2?.link}
            name="orderFile2"
            onDelete={() => onRemoveFile(2)}
            error={orderFile2Error}
          />
        </div>

        {/* <div className="flex flex-row items-center w-[65%] justify-between mb-4">
          <span className="ml-4 whitespace-pre">نامه موافقت سرمایه گذار :</span>
          <Upload
            onChange={(file: any) => onChangeFile(file, 3)}
            value={orderFile3?.fileName}
            href={orderFile3?.link}
            name="orderFile3"
            onDelete={() => onRemoveFile(3)}
            error={orderFile3Error}
          />
        </div> */}
      </div>
      <div className="flex items-start justify-end pt-3">
        {isCancelEdit && (
          <Button
            className="border-red border text-red w-[100px]  mr-3"
            onClick={() => setState({ isModalCloseFormVisible: true })}
          >
            ابطال
          </Button>
        )}
        <Button className="bg-blue text-white w-[100px] mr-3" onClick={submit}>
          ثبت
        </Button>
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

export default withAlert(CancelRequest);
