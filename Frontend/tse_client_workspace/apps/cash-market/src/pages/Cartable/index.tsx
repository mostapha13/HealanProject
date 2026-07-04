/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import {
  Button,
  TextField,
  Dropdown,
  NewSelectSearch,
} from '@tse/components/atoms';
import { SymbolModal, Table } from '@tse/components/organism';
import { DatePicker } from '@tse/components/molecules';
import { useEffect, useStates, useNavigate, useState } from '@tse/utils';
import {
  getInstrumentList,
  getUserCardBoardList,
  getFundList,
  getUserCardBoardRecordList,
  getUserCardBoardArchiveList,
} from '../../Controller';
import withAlert from '../../hoc/withAlert';
import {
  convertDate,
  loadFromStorage,
  convertDateAndTimeJalali,
} from '@tse/tools';
import { Radio } from 'antd';
import type { RadioChangeEvent } from 'antd';
import { HeaderTypes, TableOnChange } from '@tse/types';

const ActionButton = ({ data }: any) => {
  const navigate = useNavigate();

  return (
    <>
      <Button
        onClick={() => navigate(`${'/request-extending'}?id=${data.orderId}`)}
        className="border border-green text-green w-[115px] ml-1"
        disabled={!data.canExtendOrCancel}
      >
        تمدید
      </Button>
      <Button
        onClick={() => navigate(`${'/cancel-request'}?id=${data.orderId}`)}
        className="border border-red text-red w-[115px]"
        disabled={!data.canExtendOrCancel}
      >
        انصراف
      </Button>
    </>
  );
};

const tableHeader: HeaderTypes[] = [
  {
    title: 'نماد',
    dataIndex: 'instrumentName',
    key: 'instrumentName',
    className: 'col-span-1',
    sorter: true,
    render: (item: any, record: any) => (
      <a
        className=" text-black"
        href={`${record.formUrl}?id=${record.orderId}`}
      >
        {item}
      </a>
    ),
  },
  {
    title: 'نام فرم',
    dataIndex: 'formName',
    key: 'formName',
    className: 'col-span-3',
    sorter: true,
    render: (item: any, record: any) => (
      <a
        className={`${!record.hasObserved && 'font-extra-bold'} ${
          record?.formStateId === 'Rejected' ? 'text-red' : 'text-black'
        }`}
        href={`${record.formUrl}?id=${record.orderId}`}
      >
        {item}
      </a>
    ),
  },
  {
    title: 'فرستنده',
    dataIndex: 'senderGroupName',
    key: 'senderGroupName',
    className: 'col-span-1',
    sorter: true,
  },
  {
    title: 'گیرنده',
    dataIndex: 'receiverGroupName',
    key: 'receiverGroupName',
    className: 'col-span-1',
    sorter: true,
  },
  {
    title: 'تاریخ و ساعت',
    dataIndex: 'workFlowDate',
    key: 'workFlowDate',
    className: 'col-span-2',
    sorter: true,
    render: (item: any) => <span>{convertDateAndTimeJalali(item)}</span>,
  },
  {
    title: 'نوع عملیات',
    dataIndex: 'workFlowTypeName',
    key: 'workFlowTypeName',
    className: 'col-span-2',
    sorter: true,
  },
  {
    title: 'شماره پیگیری',
    dataIndex: 'trackingNumber',
    key: 'trackingNumber',
    className: 'col-span-1',
    sorter: true,
  },
];

const tableHeaderHistory: HeaderTypes[] = [
  {
    title: 'نماد',
    dataIndex: 'instrumentName',
    key: 'instrumentName',
    className: 'col-span-1',
    sorter: true,
    render: (item: any, record: any) => (
      <a
        className=" text-black"
        href={`${record.formUrl}?id=${record.orderId}&history=${true}`}
      >
        {item}
      </a>
    ),
  },
  {
    title: 'نام فرم',
    dataIndex: 'formName',
    key: 'formName',
    className: 'col-span-3',
    sorter: true,
    render: (item: any, record: any) => (
      <a
        className={`${!record.hasObserved && 'font-extra-bold'} ${
          record?.formStateId === 'Rejected' ? 'text-red' : 'text-black'
        }`}
        href={`${record.formUrl}?id=${record.orderId}&history=${true}`}
      >
        {item}
      </a>
    ),
  },
  {
    title: 'فرستنده',
    dataIndex: 'senderGroupName',
    key: 'senderGroupName',
    className: 'col-span-1',
    sorter: true,
  },
  {
    title: 'گیرنده',
    dataIndex: 'receiverGroupName',
    key: 'receiverGroupName',
    className: 'col-span-1',
    sorter: true,
  },
  {
    title: 'تاریخ و ساعت',
    dataIndex: 'workFlowDate',
    key: 'workFlowDate',
    className: 'col-span-2',
    sorter: true,
    render: (item: any) => <span>{convertDateAndTimeJalali(item)}</span>,
  },
  {
    title: 'نوع عملیات',
    dataIndex: 'workFlowTypeName',
    key: 'workFlowTypeName',
    className: 'col-span-2',
    sorter: true,
  },
  {
    title: 'شماره پیگیری',
    dataIndex: 'trackingNumber',
    key: 'trackingNumber',
    className: 'col-span-1',
    sorter: true,
  },
];
const tableHeader2: HeaderTypes[] = [
  {
    title: 'نماد',
    dataIndex: 'symbolName',
    key: 'symbolName',
    className: 'col-span-2',
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
    title: 'شماره پیگیری',
    dataIndex: 'trackingNumber',
    key: 'trackingNumber',
    className: 'col-span-2',
  },
  {
    title: 'درخواست',
    dataIndex: 'trackingNumber',
    key: 'trackingNumber',
    className: 'col-span-3',
    render: (item: any, record: any) => <ActionButton data={record} />,
  },
];

const initialState = {
  symbolList: [],
  instrument: null,
  FundList: [],
  selectedFund: null,
  cardBoardList: [],
  trackingNo: '',
  date: '',
  mode: 'cartable',
  cardBoardRecordList: [],
  archiveList: [],
};

function Cartable({ onAlert }: any) {
  const [state, setState] = useStates<any>(initialState);
  const {
    symbolList,
    instrument,
    FundList,
    cardBoardList,
    selectedFund,
    trackingNo,
    date,
    mode,
    cardBoardRecordList,
    archiveList,
  } = state;
  const hasAccess = loadFromStorage('hasAccess');
  const isCancelOrContinueMode =
    window.location.pathname === '/stock/request-cancel-continue-marketing'
      ? true
      : false;
  const isCartable =
    window.location.pathname === '/stock/cartable' ? true : false;
  const [sortCartable, setSortCartable] = useState<{
    SortedByAsc?: boolean | '';
    SortedBy?: string | number;
  }>({});
  const [sortArchive, setSortArchive] = useState<{
    SortedByAsc?: boolean | '';
    SortedBy?: string | number;
  }>({});
  useEffect(() => {
    if (isCancelOrContinueMode) {
     // setState({ mode: 'archive' });
    } else if (isCartable) {
     // setState({ mode: 'cartable' });
    }
  }, [isCartable]);
  useEffect(() => {
    //getSymbolList('', 1);
    //getFund('', 1);
    //getCardBoardList(1);
  }, []);

  useEffect(() => {
    if (mode === 'cartable') {
     // getCardBoardList(1);
    } else if (mode === 'history') {
     // getCardBoardRecordList(1);
    } else if (mode === 'archive') {
    //  getArchiveList(1);
    }
  }, [mode]);
  useEffect(() => {
   // getCardBoardList(1);
  }, [sortCartable?.SortedByAsc, sortCartable?.SortedBy]);
  useEffect(() => {
   // getCardBoardRecordList(1);
  }, [sortArchive?.SortedByAsc, sortArchive?.SortedBy]);

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
    FundId: selectedFund?.fundId,
    TrackingNumber: trackingNo,
    OrderDate: convertDate(date),
    PageSize: 10,
  };

  const initialData = {
    InstrumentId: null,
    FundId: null,
    TrackingNumber: '',
    OrderDate: '',
  };

  const getCardBoardList = (pageNo: number, isRemoveFilter?: boolean) => {
    getUserCardBoardList({
      data: isRemoveFilter
        ? {
            ...initialData,
            PageNumber: pageNo,
            SortedByAsc: sortCartable.SortedByAsc,
            SortedBy: sortCartable.SortedBy,
          }
        : {
            ...data,
            PageNumber: pageNo,
            PageSize: 10,
            SortedByAsc: sortCartable.SortedByAsc,
            SortedBy: sortCartable.SortedBy,
          },
      onSuccess: onSuccessCardBoard,
      onFail,
    });
  };

  const getCardBoardRecordList = (pageNo: number, isRemoveFilter?: boolean) => {
    getUserCardBoardRecordList({
      data: isRemoveFilter
        ? {
            ...initialData,
            PageNumber: pageNo,
            SortedByAsc: sortArchive.SortedByAsc,
            SortedBy: sortArchive.SortedBy,
          }
        : {
            ...data,
            PageNumber: pageNo,
            PageSize: 10,
            SortedByAsc: sortArchive.SortedByAsc,
            SortedBy: sortArchive.SortedBy,
          },
      onSuccess: onSuccessCardRecordBoard,
      onFail,
    });
  };
  const getArchiveList = (pageNo: number, isRemoveFilter?: boolean) => {
    getUserCardBoardArchiveList({
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

  const onSuccessCardBoard = (res: any) => {
    setState({
      cardBoardList: res,
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
  const onChangePage = (pageNo: number) => {
   // getCardBoardList(pageNo);
  };

  const onChangeRecordPage = (pageNo: number) => {
   // getCardBoardRecordList(pageNo);
  };

  const onChangeArchivePage = (pageNo: number) => {
   // getArchiveList(pageNo);
  };

  const onSearch = (isRemoveFilter?: boolean) => {
    if (isRemoveFilter) {
      setState({
        instrument: null,
        selectedFund: {
          fundName: '',
          fundId: '',
        },
        trackingNo: '',
        date: '',
      });
    }
    if (mode === 'cartable') {
      getCardBoardList(1, isRemoveFilter);
    } else if (mode === 'history') {
      getCardBoardRecordList(1, isRemoveFilter);
    } else if (mode === 'archive') {
      getArchiveList(1, isRemoveFilter);
    }
  };

  const handleModeChange = (e: RadioChangeEvent) => {
    setState({
      mode: e.target.value,
    });
  };
  const handleChangeTable = (par?: TableOnChange) => {
    const isSortType =
      par?.sorter?.order === 'ascend'
        ? true
        : par?.sorter?.order === 'descend'
        ? false
        : '';
    if (!par?.sorter?.order) {
      setSortCartable({});
      return;
    }
    setSortCartable({
      SortedByAsc: isSortType,
      SortedBy: par?.sorter?.columnKey,
    });
  };
  const handleChangeTableArchive = (par?: TableOnChange) => {
    const isSortType =
      par?.sorter?.order === 'ascend'
        ? true
        : par?.sorter?.order === 'descend'
        ? false
        : '';
    if (!par?.sorter?.order) {
      setSortArchive({});
      return;
    }
    setSortArchive({
      SortedByAsc: isSortType,
      SortedBy: par?.sorter?.columnKey,
    });
  };

  return (
    <div className="shadow-[0_0px_4px_rgba(0,0,0,0.2)] rounded-sm p-3">
      <span className="font-bold">کارتابل کاری</span>
      <div className="grid grid-cols-12 gap-4 mt-8 mb-2">
        <SymbolModal
          className="col-span-3"
          data={symbolList}
          onChange={(pageNo: number, text: string) =>
            getSymbolList(text, pageNo)
          }
          onSubmit={(value: any) => onChange('instrument', value)}
          defaultValue={instrument}
        />
        {/* <Dropdown
          className="col-span-3"
          label="انتخاب بازارگردان"
          data={FundList?.items}
          showKey="fundName"
          onChange={(value: any) => onChange('selectedFund', value)}
          value={selectedFund}
        /> */}
        <NewSelectSearch
          className="col-span-3"
          label="انتخاب بازارگردان"
          onChange={(value: any) => {
            if (value?.fundName !== undefined) {
              setState({
                selectedFund: value,
                // selectedFundError: '',
              });
            } else if (value == '') {
              setState({
                selectedFund: null,
              });
            }
            getFund(value, 1);
          }}
          value={selectedFund}
          data={FundList?.items}
          showKey="fundName"
        />
        <TextField
          className="col-span-3"
          label="شماره پیگیری"
          onChange={(value: string) => onChange('trackingNo', value)}
          value={trackingNo}
          type="number"
        />

        <div className="col-span-3 !z-10">
          <DatePicker
            parentClassName="!w-[85%] "
            label="تاریخ "
            onChange={(value: string) => onChange('date', value)}
            value={date}
            onClearDate={() => onChange('date', '')}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          className="border border-blue text-blue w-[115px] ml-2"
          onClick={() => onSearch(true)}
        >
          حذف فیلتر
        </Button>
        <Button
          className="bg-blue text-white w-[115px]"
          onClick={() => onSearch()}
        >
          فیلتر
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
          {!hasAccess && (
            <Radio.Button value="archive">تمدید/انصراف</Radio.Button>
          )}
        </Radio.Group>
        {mode === 'cartable' && (
          <Table
            columns={tableHeader}
            className="col-span-12 grid grid-cols-12 "
            data={cardBoardList?.items}
            onChangePage={onChangePage}
            totalPages={cardBoardList?.totalPages}
            pageSize={10}
            onChange={handleChangeTable}
          />
        )}
        {mode === 'history' && (
          <Table
            columns={tableHeaderHistory}
            className="col-span-12 grid grid-cols-12 "
            data={cardBoardRecordList?.items}
            onChangePage={onChangeRecordPage}
            totalPages={cardBoardRecordList?.totalPages}
            pageSize={10}
            onChange={handleChangeTableArchive}
          />
        )}
        {mode === 'archive' && (
          <Table
            columns={tableHeader2}
            className="col-span-12 grid grid-cols-12 "
            data={archiveList.items}
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
