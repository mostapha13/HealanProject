import { Input, Image } from '@tse/components/atoms';
import { Table } from '@tse/components/organism';
import { loadFromStorage, convertDateToJalali } from '@tse/tools';
import type {
  ErrorType,
  HeaderTypes,
  onAlertProps,
  ResultType,
  TableOnChange,
} from '@tse/types';
import { useEffect, useNavigate, useState } from '@tse/utils';
import withAlert from '../../../hoc/withAlert';

import { getNews } from './service';
import { getNewsCategory } from './service';
import { fileBaseUrl } from '../../../constants';
import type { NewsDataLstType } from '../../Manager/NewsAndEvents';

const PageSize = 10;

interface DataType {
  lst?: NewsDataLstType[];
  countAll?: number;
  pageNumber?: number;
}

interface NewsEventsPublicType {
  onAlert?: onAlertProps;
}

function NewsEventsPublic(props: NewsEventsPublicType) {
  const { onAlert } = props;
  const navigate = useNavigate();
  const talarData = loadFromStorage('hasProvince');
  const [data, setData] = useState<DataType>({});
  const [pageNumber, setPageNumber] = useState<number | undefined>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [filterText, setFilterText] = useState<string>('');
  const [newsCategory, setNewsCategory] = useState<ResultType>({ lst: [] });
  const [selectedCategory, setSelectedCategory] = useState<string>('news');
  const [sort, setSort] = useState<{
    AscSort?: boolean | '';
    SrtField?: string | number;
  }>({});

  useEffect(() => {
    setIsLoading(true);
    getNews({
      id: talarData.guid,
      onFail,
      onSuccess,
      AscSort: sort.AscSort,
      SrtField: sort.SrtField,
      Filter: filterText,
      CategoryId: selectedCategory,
    });
  }, [sort.SrtField, sort.AscSort, filterText, selectedCategory]);

  const onFail = (error: ErrorType) => {
    setIsLoading(false);
    onAlert?.(error);
  };

  const onSuccess = (data: DataType) => {
    setIsLoading(false);
    setData(data);
  };

  const handleGetNewsCategory = () => {
    getNewsCategory({
      onFail,
      onSuccess: (res) => {
        setNewsCategory(res);
        setSelectedCategory(res?.lst?.[0]?.id);
      },
    });
  };

  useEffect(handleGetNewsCategory, []);

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

  const handleSelectCategory = (pageName: string) => {
    setSelectedCategory(pageName);
  };

  const handleNavigate = (item: NewsDataLstType) => {
    navigate('/view/news-events-details-public', {
      replace: true,
      state: item,
    });
  };

  const newData = data?.lst?.map((item: NewsDataLstType) => ({
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
        src={`${fileBaseUrl}Download/${item.news_Icon_Id}`}
        alt="لوگو"
      />
    ),
    ...item,
  }));

  return (
    <div className="rounded shadow-simple px-6 py-3 grid grid-cols-12 gap-4 mb-3">
      <h2 className="col-span-12 text-lg font-medium ">
        اخبار, رویداد ها و اطلاعیه ها
      </h2>
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
      {newsCategory.lst?.length > 0 && (
        <section className="col-span-12 grid grid-cols-12">
          {newsCategory.lst.map((item) => {
            return (
              <span
                onClick={handleSelectCategory.bind(null, item.id)}
                className={`bg-lightGray cursor-pointer p-1 col-span-2 text-center border-2 border-purple ${
                  selectedCategory === item.id ? 'bg-purple text-white' : ''
                }`}
              >
                {item.name}
              </span>
            );
          })}
        </section>
      )}
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

export default withAlert(NewsEventsPublic);

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
    dataIndex: 'start_Date',
    key: 'start_Date',
    className: 'col-span-2',
    sorter: true,
    title: 'تاریخ ثبت',
    render: (item: any) => {
      return <span>{convertDateToJalali(item)}</span>;
    },
  },
];
