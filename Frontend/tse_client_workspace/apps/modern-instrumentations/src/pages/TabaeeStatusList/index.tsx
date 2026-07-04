import { Button, Icon, Input, Select } from '@tse/components/atoms';
import { Table } from '@tse/components/organism';

import type {
  ErrorType,
  HeaderTypes,
  onAlertProps,
  TableOnChange,
} from '@tse/types';
import {
  useState,
  Link,
  useResetRecoilState,
  useEffect,
  useStates,
} from '@tse/utils';
import withAlert from '../../hoc/withAlert';
import { tabaeeStatusAtom } from '../../store/TabaeeStatus';
import { getTabaeeStatus, handleGetFilterAllData } from './service';

const PageSize = 12;
interface ListDataType {
  lst?: any[];
  countAll?: number;
  pageNumber?: number;
}

interface FilterType {
  Instrument?: string | number;
  InstrumentStatus?: string | number;
  HadafAzEnteshar?: string | number;
  Nasher?: string | number;
  SalEnteshar?: string | number;
  KargozareArzeKonande?: string | number;
}

interface FilterDataServerType {
  Instrument?: { lst?: any[] };
  InstrumentStatus?: { lst?: any[] };
  HadafAzEnteshar?: { lst?: any[] };
  Nasher?: { lst?: any[] };
  SalEnteshar?: { lst?: any[] };
  KargozareArzeKonande?: { lst?: any[] };
}

interface TabaeeStatusListType {
  onAlert?: onAlertProps;
}

function TabaeeStatusList(props: TabaeeStatusListType) {
  const resetList = useResetRecoilState(tabaeeStatusAtom);
  const [pageNumber, setPageNumber] = useState<number | undefined>(1);
  const [filter, setFilter] = useStates<FilterType>({});
  const [filterDataServer, setFilterDataServer] =
    useStates<FilterDataServerType>({});
  const [isLoading, setLoading] = useState(false);
  const [sort, setSort] = useState<{
    AscSort?: boolean | '';
    SrtField?: string | number;
  }>({});

  const [list, setList] = useState<ListDataType>({});

  useEffect(() => {
    handleGetFilterAllData({
      onSuccess: async (result) => {
        const res = await result;
        setFilterDataServer({
          HadafAzEnteshar: res?.[0],
          InstrumentStatus: res?.[1],
        });
        setLoading(false);
      },
      onFail,
    });
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setLoading(true);
      getTabaeeStatus({
        onFail,
        onSuccess: (result) => {
          setList(result);
          setLoading(false);
        },
        AscSort: sort.AscSort,
        PageNumber: pageNumber,
        SrtField: sort.SrtField,
        PageSize,
        Instrument: filter?.Instrument,
        InstrumentStatus: filter?.InstrumentStatus,
        HadafAzEnteshar: filter?.HadafAzEnteshar,
        Nasher: filter?.Nasher,
        KargozareArzeKonande: filter?.KargozareArzeKonande,
        SalEnteshar: filter?.SalEnteshar,
      });
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [
    sort.AscSort,
    sort.SrtField,
    pageNumber,
    filter?.Instrument,
    filter?.InstrumentStatus,
    filter?.HadafAzEnteshar,
    filter?.Nasher,
    filter?.KargozareArzeKonande,
    filter?.SalEnteshar,
  ]);

  function onFail(error: ErrorType) {
    setLoading(false);
    props?.onAlert?.(error);
  }

  function handlePageChange(PageNumber: number) {
    setPageNumber(PageNumber);
  }

  function handleChangeTable(par?: TableOnChange) {
    const isSortType =
      par?.sorter?.order === 'ascend'
        ? true
        : par?.sorter?.order === 'descend'
        ? false
        : '';
    if (!par?.sorter?.order) {
      setSort({});
      return;
    }
    setSort({ AscSort: isSortType, SrtField: par?.sorter?.columnKey });
  }

  const tableHeader: HeaderTypes[] = [
    {
      dataIndex: 'instrument',
      key: 'instrument',
      title: 'نماد تبعی',
      className: 'col-span-1',
      sorter: true,
      filterDropdown: ({ confirm, setSelectedKeys, selectedKeys }: any) => {
        return (
          <div className="p-2 gap-2 flex">
            <Input
              placeholder="نماد تبعی"
              wrapperClassName="border-t-0 border-r-0 border-l-0 rounded-none"
              parentClassName="col-span-1"
              name="Instrument"
              onChange={setSelectedKeys}
              value={selectedKeys}
            />
            <Button
              className="bg-tealLight min-h-[2rem] rounded px-4"
              type="submit"
              onClick={() => {
                confirm({ closeDropdown: false });
                setFilter({ Instrument: selectedKeys });
              }}
            >
              فیلتر
            </Button>
          </div>
        );
      },
    },
    {
      dataIndex: 'instrumentStatus',
      key: 'instrumentStatus',
      title: 'وضعیت نماد',
      className: 'col-span-2',
      sorter: true,
      filterDropdown: ({ confirm, setSelectedKeys, selectedKeys }: any) => {
        return (
          <div className="p-2 gap-2 flex">
            <Select
              className="col-span-2 border-t-0 border-r-0 border-l-0 rounded-none"
              options={[
                { name: 'همه', value: '' },
                ...((filterDataServer?.InstrumentStatus?.lst?.map(
                  (item: any) => ({
                    name: item.name,
                    value: item.name,
                  })
                ) as []) || []),
              ]}
              defaultValue={selectedKeys}
              onChange={setSelectedKeys}
            />
            <Button
              className="bg-tealLight min-h-[2rem] rounded px-4"
              onClick={() => {
                confirm({ closeDropdown: false });
                setFilter({ InstrumentStatus: selectedKeys });
              }}
            >
              فیلتر
            </Button>
          </div>
        );
      },
    },
    {
      dataIndex: 'hadafAzEnteshar',
      key: 'hadafAzEnteshar',
      title: 'هدف از انتشار',
      className: 'col-span-2',
      sorter: true,
      filterDropdown: ({ confirm, setSelectedKeys, selectedKeys }: any) => {
        return (
          <div className="p-2 gap-2 flex">
            <Select
              className="col-span-2 border-t-0 border-r-0 border-l-0 rounded-none"
              options={[
                { name: 'همه', value: '' },
                ...((filterDataServer?.HadafAzEnteshar?.lst?.map(
                  (item: any) => ({
                    name: item.name,
                    value: item.name,
                  })
                ) as []) || []),
              ]}
              defaultValue={selectedKeys}
              onChange={setSelectedKeys}
            />
            <Button
              className="bg-tealLight min-h-[2rem] rounded px-4"
              onClick={() => {
                confirm({ closeDropdown: false });
                setFilter({ HadafAzEnteshar: selectedKeys });
              }}
            >
              فیلتر
            </Button>
          </div>
        );
      },
    },
    {
      dataIndex: 'nasher',
      key: 'nasher',
      title: 'ناشر',
      className: 'col-span-2',
      sorter: true,
      filterDropdown: ({ confirm, setSelectedKeys, selectedKeys }: any) => {
        return (
          <div className="p-2 gap-2 flex">
            <Input
              placeholder="ناشر"
              wrapperClassName="border-t-0 border-r-0 border-l-0 rounded-none"
              parentClassName="col-span-2"
              name="Nasher"
              value={selectedKeys}
              onChange={setSelectedKeys}
            />
            <Button
              className="bg-tealLight min-h-[2rem] rounded px-4"
              onClick={() => {
                confirm({ closeDropdown: false });
                setFilter({ Nasher: selectedKeys });
              }}
            >
              فیلتر
            </Button>
          </div>
        );
      },
    },
    {
      dataIndex: 'kargozareArzeKonande',
      key: 'kargozareArzeKonande',
      title: 'کارگزار عرضه کننده',
      className: 'col-span-2',
      sorter: true,
      filterDropdown: ({ confirm, setSelectedKeys, selectedKeys }: any) => {
        return (
          <div className="p-2 gap-2 flex">
            <Input
              placeholder="کارگزار عرضه کننده"
              wrapperClassName="border-t-0 border-r-0 border-l-0 rounded-none"
              parentClassName="col-span-2"
              name="KargozareArzeKonande"
              onChange={setSelectedKeys}
              value={selectedKeys}
            />
            <Button
              className="bg-tealLight min-h-[2rem] rounded px-4"
              onClick={() => {
                confirm({ closeDropdown: false });
                setFilter({ KargozareArzeKonande: selectedKeys });
              }}
            >
              فیلتر
            </Button>
          </div>
        );
      },
    },
    {
      dataIndex: 'salEnteshar',
      key: 'salEnteshar',
      title: 'سال انتشار',
      className: 'col-span-1',

      filterDropdown: ({ confirm, setSelectedKeys, selectedKeys }: any) => {
        return (
          <div className="p-2 gap-2 flex">
            <Input
              placeholder="سال انتشار"
              wrapperClassName="border-t-0 border-r-0 border-l-0 rounded-none"
              parentClassName="col-span-1"
              name="SalEnteshar"
              onChange={setSelectedKeys}
              value={selectedKeys}
            />
            <Button
              className="bg-tealLight min-h-[2rem] rounded px-4"
              onClick={() => {
                confirm({ closeDropdown: false });
                setFilter({ SalEnteshar: selectedKeys });
              }}
            >
              فیلتر
            </Button>
          </div>
        );
      },
    },
    {
      title: 'ویرایش',
      className: 'col-span-1 flex',
      render: (_: any, record: any) => {
        return (
          <Link to={`/dashboard/tabaee-status/${record.id}`}>
            <Icon name="icon-edit" classname="cursor-pointer" />
          </Link>
        );
      },
    },
  ];

  return (
    <div>
      <Button onClick={resetList} className="mb-4">
        <Link
          className="text-black bg-tealLight min-h-[2rem] rounded px-4 flex items-center justify-center gap-2"
          to="/dashboard/tabaee-status"
        >
          <Icon name="icon-add" />
          <span>افزودن رکورد جدید</span>
        </Link>
      </Button>
      <Table
        className="col-span-12 grid grid-cols-12"
        wrapperClassName="border-teal border-[1px]"
        columns={tableHeader}
        data={list.lst}
        isLoading={isLoading}
        pageNumber={pageNumber}
        totalPages={(list?.countAll || 1) / PageSize}
        pageSize={PageSize}
        onChangePage={handlePageChange}
        onChange={handleChangeTable}
      />
    </div>
  );
}

export default withAlert(TabaeeStatusList);
