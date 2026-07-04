import { Input } from '@tse/components/atoms';
import { Table } from '@tse/components/organism';
import { HeaderTypes, onAlertProps, TableOnChange } from '@tse/types';
import { useEffect, useState, lodash } from '@tse/utils';
import withAlert from '../../../hoc/withAlert';
import { getNahadMali, getNahadMaliType } from './service';
import { loadFromStorage } from '@tse/tools';

interface FinancialInstitutionsTypes {
  onAlert: onAlertProps;
}
const PageSize = 10;

function FinancialInstitutionsPublic(props: FinancialInstitutionsTypes) {
  const { onAlert } = props;
  const [isLoading, setLoading] = useState(false);
  const [filterText, setFilterText] = useState<string>('');
  const [sort, setSort] = useState<{
    AscSort?: boolean | '';
    SrtField?: string | number;
  }>({});

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [nahadMaliType, setNahadMaliType] = useState<any>({
    lst: [],
    pageNumber: 0,
    countAll: 0,
  });

  const [nahadMali, setNahadMali] = useState({
    lst: [],
    pageNumber: 0,
    countAll: 0,
  });
  const [pageNumber, setPageNumber] = useState<number | undefined>(1);

  const isKargozari =
    selectedCategory === 'c3f676f3-ba56-45bb-a263-707a58610178';

  const handlePageChange = (PageNumber: number) => {
    setPageNumber(PageNumber);
  };

  const handleGetNahadMali = () => {
    const talarData = loadFromStorage('hasProvince');
    const guid = talarData?.guid || '';
    getNahadMali({
      id: guid,
      PageNumber: pageNumber,
      onSuccess: setNahadMali,
      onFail,
      AscSort: sort.AscSort,
      SrtField: sort.SrtField,
      Filter: filterText,
      Nahad_Mali_Type_Id: selectedCategory,
    });
  };

  useEffect(() => {
    handleGetNahadMali();
  }, [pageNumber, sort.AscSort, sort.SrtField, filterText, selectedCategory]);

  useEffect(() => {
    getNahadMaliType({
      onSuccess: (res: any) => {
        const lst = [...res.lst]
          ?.sort(
            (prev: any, next: any) => prev.is_Kargozari - next.is_Kargozari
          )
          .reverse();
        setSelectedCategory(lst[0].id);
        setNahadMaliType({ ...res, lst });
      },
      onFail,
    });
  }, []);

  const onFail = (error: any) => {
    setLoading(false);
    onAlert(error);
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
  const handleChangeFilter = (filterText: string) => {
    setFilterText(filterText);
  };

  const tableColumns: HeaderTypes[] = [
    {
      dataIndex: 'title',
      key: 'title',
      title: 'نام نهاد مالی',
      className: 'col-span-2',
      sorter: true,
    },
    isKargozari
      ? {
          dataIndex: 'brokerType_Name',
          key: 'brokerType_Name',
          title: 'نوع کارگزاری',
          className: 'col-span-2',
          sorter: true,
        }
      : ({} as any),
    {
      dataIndex: 'telNo',
      key: 'telNo',
      title: 'شماره تلفن',
      className: 'col-span-2',
      sorter: true,
    },
    {
      dataIndex: 'address',
      key: 'address',
      title: 'آدرس',
      className: `${isKargozari ? 'col-span-5' : 'col-span-6'}`,
      sorter: true,
    },
  ];

  return (
    <div className="rounded shadow-simple px-6 py-3 grid grid-cols-12 gap-4 mb-3">
      <h2 className="col-span-12 text-lg font-medium ">
        اطلاعات نهادهای مالی مستقر در استان
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
      {nahadMaliType.lst?.length > 0 && (
        <section className="col-span-12 grid grid-cols-12 mb-2 gap-1">
          {nahadMaliType.lst.map((item: any) => {
            return (
              <span
                onClick={() => setSelectedCategory(item.id)}
                className={`bg-lightGray cursor-pointer p-1 col-span-4 text-center border-[1px] border-purple ${
                  selectedCategory === item.id ? 'bg-purple text-white' : ''
                }`}
              >
                {item.title}
              </span>
            );
          })}
        </section>
      )}
      <Table
        className="col-span-12 border-lightPurple grid grid-cols-12"
        wrapperClassName="col-span-12"
        columns={tableColumns}
        data={nahadMali.lst}
        totalPages={(nahadMali?.countAll || 1) / PageSize}
        isLoading={isLoading}
        pageSize={PageSize}
        onChangePage={handlePageChange}
        pageNumber={pageNumber}
        onChange={handleChangeTable}
      />
    </div>
  );
}
export default withAlert(FinancialInstitutionsPublic);
