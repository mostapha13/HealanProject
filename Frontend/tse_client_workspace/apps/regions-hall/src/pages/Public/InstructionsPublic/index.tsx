import { Input, Image } from '@tse/components/atoms';
import { Table } from '@tse/components/organism';
import type {
  ErrorType,
  HeaderTypes,
  onAlertProps,
  TableOnChange,
} from '@tse/types';
import { useEffect, useNavigate, useState } from '@tse/utils';
import { convertDateToJalali } from '@tse/tools';
import withAlert from '../../../hoc/withAlert';
import { getInstructions } from './service';
import { fileBaseUrl } from '../../../constants';
import type { InstructionDataLstType } from '../../Admin/InstructionDefinition';

const PageSize = 10;

interface DataType {
  lst?: InstructionDataLstType[];
  countAll?: number;
  pageNumber?: number;
}

interface InstructionsPublicType {
  onAlert?: onAlertProps;
}

function InstructionsPublic(props: InstructionsPublicType) {
  const { onAlert } = props;
  const navigate = useNavigate();
  const [data, setData] = useState<DataType>({});
  const [pageNumber, setPageNumber] = useState<number | undefined>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [filterText, setFilterText] = useState<string>('');
  const [sort, setSort] = useState<{
    AscSort?: boolean | '';
    SrtField?: string | number;
  }>({});

  useEffect(() => {
    setIsLoading(true);
    getInstructions({
      onFail,
      onSuccess,
      AscSort: sort.AscSort,
      SrtField: sort.SrtField,
      Filter: filterText,
    });
  }, [sort.SrtField, sort.AscSort, filterText]);

  const onFail = (error: ErrorType) => {
    setIsLoading(false);
    onAlert?.(error);
  };

  const onSuccess = (data: DataType) => {
    setIsLoading(false);
    setData(data);
  };

  const handleChangeFilter = (filterText: string) => {
    setFilterText(filterText);
  };

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

  const handlePageChange = (PageNumber: number) => {
    setPageNumber(PageNumber);
  };

  const handleNavigate = (item: InstructionDataLstType) => {
    navigate('/view/instructions-details-public', {
      replace: true,
      state: item,
    });
  };

  const newData = data?.lst?.map((item: InstructionDataLstType) => ({
    link: (
      <span
        onClick={handleNavigate.bind(null, item)}
        className="text-link underline cursor-pointer"
      >
        {item.title}
      </span>
    ),
    logo: (
      <Image
        className="col-span-3 shadow-simple"
        src={`${fileBaseUrl}Download/${item.ins_Icon_Id}`}
        alt="خبر"
      />
    ),
    ...item,
  }));

  return (
    <div className="rounded shadow-simple px-6 py-3 grid grid-cols-12 gap-4 mb-3">
      <h2 className="col-span-12 text-lg font-medium ">دستورالعمل ها</h2>
      <section className="col-span-3">
        <Input
          onChange={handleChangeFilter}
          value={filterText}
          wrapperClassName="bg-lightGray"
          inputClassName="bg-lightGray"
          iconName="icon-search"
          placeholder="جستجو"
        />
      </section>
      <Table
        className="col-span-12 border-lightPurple grid grid-cols-12"
        wrapperClassName="col-span-12"
        columns={tableHeader}
        data={newData}
        totalPages={(data?.countAll || 1) / PageSize}
        pageSize={PageSize}
        onChangePage={handlePageChange}
        pageNumber={pageNumber}
        isLoading={isLoading}
        onChange={handleChangeTable}
      />
    </div>
  );
}

export default withAlert(InstructionsPublic);

const tableHeader: HeaderTypes[] = [
  {
    dataIndex: 'logo',
    key: 'logo',
    className: 'col-span-1',
  },
  {
    dataIndex: 'link',
    key: 'title',
    className: 'col-span-8',
    sorter: true,
    title: 'موضوع',
  },
  {
    dataIndex: 'startDate',
    key: 'startDate',
    className: 'col-span-2',
    sorter: true,
    title: 'تاریخ ثبت',
    render: (item: any) => {
      return <span>{convertDateToJalali(item)}</span>;
    },
  },
];
