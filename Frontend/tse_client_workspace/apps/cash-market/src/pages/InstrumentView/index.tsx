/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import { SearchInput } from '@tse/components/molecules';
import { useEffect, useStates } from '@tse/utils';
import { getInstrumentWatch } from '../../Controller';
import withAlert from '../../hoc/withAlert';
import { Table } from 'antd';
import InfoModal from './InfoModal';
import {
  convertDateToJalali,
  separator,
  convertDateAndTimeToJalali,
} from '@tse/tools';
import './styles.scss';

const initialState = {
  searchText: '',
  instrumentWatchList: [],
};

const activeCountColumns = [
  {
    title: 'نام بازارگردان',
    dataIndex: 'marketMakerName',
    className: 'col-span-6 overflow-hidden',
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

const parameterColumns = [
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
    className: 'col-span-1',
  },
  {
    title: 'دامنه نوسان',
    dataIndex: 'oscillation',
    key: 'oscillation',
    className: 'col-span-1',
    render: (item: any) => <span>{separator(item)}</span>,
  },
  {
    title: 'نقدشوندگی',
    dataIndex: 'liquidity',
    key: 'liquidity',
    className: 'col-span-2',
    render: (item: any) => <span>{separator(item)}</span>,
  },
  {
    title: 'از تاریخ/از ساعت',
    dataIndex: 'fromDate',
    key: 'fromDate',
    className: 'col-span-2',
    render: (item: any) => <span>{convertDateAndTimeToJalali(item)}</span>,
  },
  {
    title: 'تا تاریخ/تا ساعت',
    dataIndex: 'toDate',
    key: 'toDate',
    className: 'col-span-2',
    render: (item: any) => <span>{convertDateAndTimeToJalali(item)}</span>,
  },
];

const columns: any[] = [
  {
    title: 'نام نماد',
    dataIndex: 'symbolName',
    className: 'col-span-4 overflow-hidden',
  },
  {
    title: 'سرمایه فعلی شرکت (ريال)',
    dataIndex: 'invesment',
    className: 'col-span-2 overflow-hidden',
    render: (item: any) => <span>{separator(item)}</span>,
  },
  {
    title: 'تعداد بازارگردان فعال',
    dataIndex: 'activeMarketMakers',
    key: 'activeMarketMakers',
    className: 'col-span-2 overflow-hidden',
    render: (item: any, record: any) => (
      <div className="flex flex-row items-center justify-center">
        <span>{item.length}</span>
        <InfoModal
          columns={activeCountColumns}
          data={item}
          title={`تعداد بازارگردان های فعال نماد ${record.symbolName}`}
        />
      </div>
    ),
  },
  {
    title: 'تعداد درخواست های باز',
    key: 'symbol',
    dataIndex: 'symbol',
    children: [
      {
        title: 'شروع',
        dataIndex: 'marketMakerRequestStarts',
        key: 'marketMakerRequestStarts',
        className: 'col-span-1 overflow-hidden',
        render: (item: any, record: any) => (
          <div className="flex flex-row items-center justify-center">
            <span>{item.length}</span>
            <InfoModal
              columns={activeCountColumns}
              data={item}
              title={`درخواست های باز شروع بازارگردانی نماد ${record.symbolName}`}
            />
          </div>
        ),
      },
      {
        title: 'تمدید',
        dataIndex: 'marketMakerRequestExtendings',
        key: 'marketMakerRequestExtendings',
        className: 'col-span-1 overflow-hidden',
        render: (item: any, record: any) => (
          <div className="flex flex-row items-center justify-center">
            <span>{item.length}</span>
            <InfoModal
              columns={activeCountColumns}
              data={item}
              title={`درخواست های باز تمدید بازارگردانی نماد ${record.symbolName}`}
            />
          </div>
        ),
      },
      {
        title: 'انصراف',
        dataIndex: 'marketMakerRequestQuits',
        key: 'marketMakerRequestQuits',
        className: 'col-span-1 overflow-hidden',
        render: (item: any, record: any) => (
          <div className="flex flex-row items-center justify-center">
            <span>{item.length}</span>
            <InfoModal
              columns={activeCountColumns}
              data={item}
              title={`درخواست های باز انصراف بازارگردانی نماد ${record.symbolName}`}
            />
          </div>
        ),
      },
    ],
  },
  {
    title: 'اطلاعات مربوط به پارامتر نماد',
    dataIndex: 'instrumentParameters',
    key: 'instrumentParameters',
    className: 'col-span-2 overflow-hidden',
    render: (item: any, record: any) => (
      <InfoModal
        columns={parameterColumns}
        data={item}
        title={`اطلاعات مربوط به پارامتر نماد ${record.symbolName}`}
      />
    ),
  },
];

function InstrumentView({ onAlert }: any) {
  const [state, setState] = useStates<any>(initialState);
  const { searchText, instrumentWatchList } = state;

  useEffect(() => {
    getInstrumentWatchList('', 1);
  }, []);

  const getInstrumentWatchList = (text: string, pageNo: number) => {
    const data = {
      Symbol: text,
      PageNumber: pageNo,
      PageSize: 10,
    };
    getInstrumentWatch({
      data,
      onSuccess: onSuccessWatch,
      onFail,
    });
  };

  const onSuccessWatch = (res: any) => {
    setState({
      instrumentWatchList: res,
    });
  };

  const onFail = (error: any) => {
    onAlert(error);
  };

  const onSearch = (text: string) => {
    setState({
      searchText: text,
    });
    getInstrumentWatchList(text, 1);
  };

  const onChangePage = (pageNo: number) => {
    getInstrumentWatchList(searchText, pageNo);
  };

  return (
    <div className="shadow-[0_0px_4px_rgba(0,0,0,0.2)] rounded-sm p-3">
      <span className="font-bold">دیده بان نماد</span>
      <div className="grid grid-cols-12 !mt-6">
        <SearchInput
          className=" col-span-5"
          onChange={onSearch}
          placeholder="جستجو نماد"
        />
      </div>
      <Table
        columns={columns}
        dataSource={instrumentWatchList?.items}
        className="!mt-6 symbol-table"
        pagination={{
          onChange: onChangePage,
          pageSize: 10,
          total: instrumentWatchList?.totalPages * 10,
          position: ['bottomRight'],
          showSizeChanger: false,
          hideOnSinglePage: true,
        }}
      />
    </div>
  );
}

export default withAlert(InstrumentView);
