/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import { Button, TextField, Dropdown } from '@tse/components/atoms';
import { SymbolModal, Table } from '@tse/components/organism';
import { DatePicker } from '@tse/components/molecules';
import { useEffect, useStates, useNavigate } from '@tse/utils';
import {
  getInstrumentList,
  getFundList,
  getCardboardArchive,
  getCardBoardDraft,
  getFormBroker,
  getOrderStatusList,
  getCardboardCashMarket,
} from '../../../../Controller';
import withAlert from '../../../../hoc/withAlert';
import {
  convertDate,
  loadFromStorage,
  convertDateAndTimeJalali,
  separator,
  deSeparator,
} from '@tse/tools';
import { Radio } from 'antd';
import type { RadioChangeEvent } from 'antd';
import { HeaderTypes } from '@tse/types';

const tableHeader: HeaderTypes[] = [
  {
    title: 'نام پرونده',
    dataIndex: 'formName',
    key: 'formName',
    className: 'col-span-2',
    render: (item: any, record: any) => (
      <a
        className={`${!record.hasObserved && 'font-bold'}`}
        href={`${record.formUrl}?orderId=${record.orderId}`}
      >
        {item}
      </a>
    ),
  },
  {},
  {
    title: 'فرستنده',
    dataIndex: 'senderGroupName',
    key: 'senderGroupName',
    className: 'col-span-1',
  },
  {
    title: 'گیرنده',
    dataIndex: 'receiverGroupName',
    key: 'receiverGroupName',
    className: 'col-span-1',
  },
  {
    title: 'تاریخ و ساعت',
    dataIndex: 'workFlowDate',
    key: 'workFlowDate',
    className: 'col-span-2',
    render: (item: any) => <span>{convertDateAndTimeJalali(item)}</span>,
  },
  {
    title: 'نوع عملیات',
    dataIndex: 'workFlowTypeName',
    key: 'workFlowTypeName',
    className: 'col-span-2',
  },
  {
    title: 'وضعیت',
    dataIndex: 'orderStatusName',
    key: 'orderStatusName',
    className: 'col-span-1',
  },
  {
    title: 'شماره پیگیری',
    dataIndex: 'trackingNumber',
    key: 'trackingNumber',
    className: 'col-span-1',
  },
];

const tableHeader2: HeaderTypes[] = [
  {
    title: 'نام پرونده',
    dataIndex: 'formName',
    key: 'formName',
    className: 'col-span-3',
    render: (item: any, record: any) => (
      <a
        className={`${!record.hasObserved && 'font-bold'}`}
        href={`${record?.formUrl}?orderId=${record?.orderId}`}
      >
        {item}
      </a>
    ),
  },
  {
    title: 'نماد',
    dataIndex: 'symbolName',
    key: 'symbolName',
    className: 'col-span-3',
  },
  // {
  //   title: 'فرستنده',
  //   dataIndex: 'senderGroupName',
  //   key: 'senderGroupName',
  //   className: 'col-span-1',
  // },
  // {
  //   title: 'گیرنده',
  //   dataIndex: 'receiverGroupName',
  //   key: 'receiverGroupName',
  //   className: 'col-span-1',
  // },
  {
    title: 'تاریخ و ساعت',
    dataIndex: 'orderCreateDate',
    key: 'orderCreateDate',
    className: 'col-span-2',
    render: (item: any) => <span>{convertDateAndTimeJalali(item)}</span>,
  },
  // {
  //   title: 'نوع عملیات',
  //   dataIndex: 'workFlowTypeName',
  //   key: 'workFlowTypeName',
  //   className: 'col-span-2',
  // },
  {
    title: 'وضعیت',
    dataIndex: 'orderStatusName',
    key: 'orderStatusName',
    className: 'col-span-2',
  },
  {
    title: 'شماره پیگیری',
    dataIndex: 'trackingNumber',
    key: 'trackingNumber',
    className: 'col-span-1',
  },
];

const initialState = {
  symbolList: [],
  instrument: null,
  FundList: [],
  cartableList: [],
  trackingNo: '',
  date: '',
  mode: 'cartable',
  cardBoardRecordList: [],
  archiveList: [],
  formListData: [],
  selectedForm: null,
  orderStatusList: [],
  selectedOrderStatus: null,
};
const pageSize = 10;
function Cartable({ onAlert }: any) {
  const [state, setState] = useStates<any>(initialState);
  const {
    symbolList,
    instrument,
    FundList,
    cartableList,
    trackingNo,
    date,
    mode,
    cardBoardRecordList,
    archiveList,
    formListData,
    selectedForm,
    orderStatusList,
    selectedOrderStatus,
  } = state;
  const hasAccess = loadFromStorage('hasAccess');

  useEffect(() => {
    getSymbolList('', 1);
    getFund('', 1);
    getCartableDataList(1);
    handleGetFormBroker();
    handleGetOrderStatusList();
  }, []);

  useEffect(() => {
    if (mode === 'cartable') {
      getCartableDataList(1);
    } else if (mode === 'history') {
      getCardBoardRecordList(1);
    } else if (mode === 'archive') {
      getArchiveList(1);
    }
  }, [mode]);

  const getFund = (text: string, pageNo: number) => {
    const data = {
      FundName: text,
      PageNumber: pageNo,
    };
    getFundList({ data, onSuccess: onSuccessBroker, onFail });
  };

  const onSuccessBroker = (res: any) => {
    setState({
      FundList: res,
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

  const data = {
    InstrumentId: instrument?.instrumentId,
    FormId: selectedForm?.formId,
    OrderStatusId: selectedOrderStatus?.orderStatusId,
    TrackingNumber: trackingNo,
    FromOrderDate: convertDate(date),
    ToOrderDate: convertDate(date),
    PageSize: pageSize,
  };

  const initialData = {
    InstrumentId: null,
    FundId: null,
    TrackingNumber: '',
    OrderDate: '',
  };

  const getCartableDataList = (pageNo: number) => {
    getCardboardCashMarket({
      data: { ...data, PageNumber: pageNo, PageSize: pageSize },
      onSuccess: onSuccessCartableDataList,
      onFail,
    });
  };

  const getCardBoardRecordList = (pageNo: number, isRemoveFilter?: boolean) => {
    getCardboardArchive({
      data: isRemoveFilter
        ? { ...initialData, PageNumber: pageNo }
        : { ...data, PageNumber: pageNo, PageSize: 10 },
      onSuccess: onSuccessCardRecordBoard,
      onFail,
    });
  };
  const getArchiveList = (pageNo: number, isRemoveFilter?: boolean) => {
    getCardBoardDraft({
      data: isRemoveFilter
        ? { ...initialData, PageNumber: pageNo }
        : { ...data, PageNumber: pageNo, PageSize: 10 },
      onSuccess: onSuccessArchive,
      onFail,
    });
  };

  const onSuccessArchive = (res: any) => {
    setState({
      archiveList: res,
    });
  };

  const onSuccessCardRecordBoard = (res: any) => {
    setState({
      cardBoardRecordList: res,
    });
  };

  const onSuccessCartableDataList = (res: any) => {
    setState({
      cartableList: res,
    });
  };

  const onFail = (error: any) => {
    onAlert(error);
  };

  const onChange = (key: string, value: any) => {
    setState({
      [key]: value,
    });
  };
  const onChangePage = (pageNo: any) => {
    getCartableDataList(pageNo);
  };

  const onChangeRecordPage = (pageNo: number) => {
    getCardBoardRecordList(pageNo);
  };

  const onChangeArchivePage = (pageNo: number) => {
    getArchiveList(pageNo);
  };

  const onSearch = () => {
    if (mode === 'cartable') {
      getCartableDataList(1);
    } else {
      getCardBoardRecordList(1);
    }
  };

  const handleModeChange = (e: RadioChangeEvent) => {
    setState({
      mode: e.target.value,
    });
  };
  const handleGetFormBroker = () => {
    getFormBroker({
      onSuccess: (res: any) => {
        setState({ formListData: res });
      },
      onFail,
    });
  };
  const handleGetOrderStatusList = () => {
    getOrderStatusList({
      onSuccess: (res: any) => {
        setState({ orderStatusList: res });
      },
      onFail,
    });
  };
  return (
    <div className="shadow-[0_0px_4px_rgba(0,0,0,0.2)] rounded-sm p-3">
      <span className="font-bold">مدیریت درخواست ها</span>
      <div className="grid grid-cols-12 gap-4 mt-8 mb-2">
        <SymbolModal
          className="2xl:col-span-2 xl:col-span-3 lg:col-span-5 md:col-span-6  col-span-2"
          data={symbolList}
          onChange={(pageNo: number, text: string) =>
            getSymbolList(text, pageNo)
          }
          onSubmit={(value: any) => onChange('instrument', value)}
          defaultValue={instrument}
        />
        <Dropdown
          className="2xl:col-span-2 xl:col-span-3 lg:col-span-5 md:col-span-6  col-span-2"
          label="نام پرونده"
          data={formListData}
          showKey="formName"
          onChange={(value: any) => {
            onChange('selectedForm', value);
          }}
          value={selectedForm}
        />
        <Dropdown
          className="2xl:col-span-2 xl:col-span-3 lg:col-span-5 md:col-span-6  col-span-2"
          label="وضعیت"
          data={orderStatusList}
          showKey="orderStatusTitle"
          onChange={(value: any) => onChange('selectedOrderStatus', value)}
          value={selectedOrderStatus}
        />
        <TextField
          className="2xl:col-span-2 xl:col-span-3 lg:col-span-5 md:col-span-6  col-span-2"
          label="شماره پیگیری"
          onChange={(value: string) => onChange('trackingNo', value)}
          value={deSeparator(trackingNo)}
          // type="number"
        />

        <div className="2xl:col-span-2 xl:col-span-3 lg:col-span-5 md:col-span-6  col-span-2 !z-10">
          <DatePicker
            parentClassName="!w-[85%] "
            label="تاریخ "
            onChange={(value: string) => onChange('date', value)}
            value={date}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          className="bg-blue text-white w-[115px]"
          onClick={() => onSearch()}
        >
          جستجو
        </Button>
      </div>
      <div className="mt-4">
        <Radio.Group
          onChange={handleModeChange}
          value={mode}
          style={{ marginBottom: 5 }}
        >
          <Radio.Button value="cartable">کارتابل</Radio.Button>
          <Radio.Button value="history">سوابق جاری</Radio.Button>
          {/* <Radio.Button value="draft">ذخیره موقت</Radio.Button> */}
        </Radio.Group>
        {mode === 'cartable' && (
          <Table
            columns={tableHeader}
            className="col-span-12 grid grid-cols-12 "
            data={cartableList?.items}
            onChangePage={onChangePage}
            totalPages={cartableList?.totalPages}
            pageSize={10}
          />
        )}
        {mode === 'history' && (
          <Table
            columns={tableHeader}
            className="col-span-12 grid grid-cols-12 "
            data={cardBoardRecordList?.items}
            onChangePage={onChangeRecordPage}
            totalPages={cardBoardRecordList?.totalPages}
            pageSize={10}
          />
        )}
        {mode === 'draft' && (
          <Table
            columns={tableHeader2}
            className="col-span-12 grid grid-cols-12 "
            data={archiveList?.items}
            onChangePage={onChangeArchivePage}
            totalPages={archiveList?.totalPages}
            pageSize={10}
          />
        )}
      </div>
    </div>
  );
}

export default withAlert(Cartable);
