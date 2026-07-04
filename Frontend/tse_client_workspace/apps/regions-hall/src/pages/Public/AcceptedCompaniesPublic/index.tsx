/* eslint-disable react-hooks/exhaustive-deps */
import { Input } from '@tse/components/atoms';
import { Table } from '@tse/components/organism';
import { convertDateToJalali, getClickableLink } from '@tse/tools';
import { HeaderTypes, onAlertProps, TableOnChange } from '@tse/types';
import { useState, useEffect } from '@tse/utils';
import withAlert from '../../../hoc/withAlert';
import { getCompanies } from './service';

interface AcceptedCompaniesTypes {
  onAlert: onAlertProps;
}

const PageSize = 10;

type DataCompaniesType = {
  lst?: {
    id?: string;
    title?: string;
    talar_Id?: string;
    instrumentName?: string;
    url?: string;
    ceo?: string;
    tel?: string;
    ipo_Date?: string;
    address?: string;
  }[];
  countAll?: number;
  pageNumber?: number;
};

function AcceptedCompanies(props: AcceptedCompaniesTypes) {
  const { onAlert } = props;
  const [companies, setCompanies] = useState<DataCompaniesType>({});
  const [sort, setSort] = useState<{
    AscSort?: boolean | '';
    SrtField?: string | number;
  }>({});
  const [isLoading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState<number | undefined>(1);
  const [filterText, setFilterText] = useState<string>('');

  const handlePageChange = (PageNumber: number) => {
    setPageNumber(PageNumber);
  };

  const handleGetCompanies = () => {
    setLoading(true);
    getCompanies({
      PageSize,
      PageNumber: pageNumber,
      onSuccess,
      onFail,
      AscSort: sort.AscSort,
      SrtField: sort.SrtField,
      Filter: filterText,
    });
  };

  const onSuccess = (data: DataCompaniesType) => {
    setLoading(false);
    setCompanies(data);
  };

  const onFail = (error: string) => {
    setLoading(false);
    onAlert({ error });
  };

  useEffect(handleGetCompanies, [
    pageNumber,
    sort.AscSort,
    sort.SrtField,
    filterText,
  ]);

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
      dataIndex: 'companyName',
      key: 'companyName',
      title: 'نام شرکت',
      className: 'col-span-3',
      sorter: true,
    },
    {
      dataIndex: 'instrumentName',
      key: 'instrumentName',
      title: 'نماد',
      className: 'col-span-2',
      sorter: true,
      render: (item: any, record: any) => (
        <a
          href={`https://www.tse.ir/instrument/view?cat=cash&id=${record?.instrumentId}`}
          target="_blank"
          rel="noreferrer"
        >
          {item}
        </a>
      ),
    },
    {
      dataIndex: 'url',
      key: 'url',
      title: 'آدرس وبسایت',
      className: 'col-span-2',
      sorter: true,
      render: (item: any) => (
        <a href={getClickableLink(item)} target="_blank" rel="noreferrer">
          {item}
        </a>
      ),
    },
    // {
    //   dataIndex: 'ceo',
    //   key: 'ceo',
    //   title: 'نام مدیرعامل',
    //   className: 'col-span-1',
    //   sorter: true,
    // },
    {
      dataIndex: 'tel',
      key: 'tel',
      title: 'تلفن امور سهام',
      className: 'col-span-2',
      sorter: true,
    },
    {
      dataIndex: 'ipo_Date',
      key: 'ipo_Date',
      title: 'تاریخ عرضه',
      className: 'col-span-2',
      sorter: true,
      render: (item: any) => <span>{convertDateToJalali(item)}</span>,
    },
    // {
    //   dataIndex: 'address',
    //   key: 'address',
    //   title: 'آدرس امور سهام',
    //   className: 'col-span-3',
    //   sorter: true,
    // },
  ];

  const handleChangeFilter = (filterText: string) => {
    setFilterText(filterText);
  };

  return (
    <div className="rounded shadow-simple px-6 py-3 grid grid-cols-12 gap-4 mb-3">
      <h2 className="col-span-12 text-lg font-medium ">ناشران استانی</h2>
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
        data={companies.lst}
        isLoading={isLoading}
        pageNumber={pageNumber}
        totalPages={(companies?.countAll || 1) / PageSize}
        onChangePage={handlePageChange}
        onChange={handleChangeTable}
      />
    </div>
  );
}

export default withAlert(AcceptedCompanies);

const dataMock = {
  lst: [
    {
      title: 'الکتریک شرق',
      date: '2022-04-06',
      symbol: 'خشرق1',
      website: 'majid@mail.com',
      managerName: 'مجید درویش نژاد',
      telNo: '091245454',
    },
    {
      title: 'ایران خودرو',
      date: '2022-04-06',
      symbol: 'خشرق1',
      website: 'majid@mail.com',
      managerName: 'مجید درویش نژاد',
      telNo: '091245454',
    },
  ],
  countAll: 5,
  pageNumber: 1,
};
