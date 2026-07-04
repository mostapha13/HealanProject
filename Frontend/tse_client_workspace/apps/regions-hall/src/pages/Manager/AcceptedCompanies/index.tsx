import { Icon, TextField } from '@tse/components/atoms';
import { SimpleForm } from '@tse/components/molecules';
import { SymbolModal, Table } from '@tse/components/organism';
import { convertDateToJalali, getClickableLink } from '@tse/tools';
import { HeaderTypes, ListType, onAlertProps, TableOnChange } from '@tse/types';
import { useRecoilState, useState, useEffect, useRef } from '@tse/utils';
import withAlert from '../../../hoc/withAlert';
import { userInfoAtom } from '../../../store/userProfile';
import {
  deleteCompany,
  insertCompany,
  getCompanies,
  updateCompany,
  getInstrumentList,
} from './service';
import { NewSymbolModal } from 'apps/regions-hall/src/components/NewSymboleModal';

interface AcceptedCompaniesTypes {
  onAlert: onAlertProps;
}

const PageSize = 10;

function AcceptedCompanies(props: AcceptedCompaniesTypes) {
  const { onAlert } = props;
  const childRef: any = useRef();
  const [info] = useRecoilState(userInfoAtom);
  const [state, setState] = useState({});
  const [Filter, setFilter] = useState<string>('');
  const [companies, setCompanies] = useState<{
    lst?: any[];
    countAll?: number;
    pageNumber?: number;
  }>({});
  const [sort, setSort] = useState<{
    AscSort?: boolean | '';
    SrtField?: string | number;
  }>({});
  const [isLoading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState<number | undefined>(1);
  const [symbolList, setSymbolList] = useState<any>([]);
  const [instrument, setInstrument] = useState<any>(null);
  const [instrumentError, setInstrumentError] = useState(false);
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    getSymbolList('', 1);
  }, []);

  const handlePageChange = (PageNumber: number) => {
    setPageNumber(PageNumber);
  };

  const handleGetCompanies = () => {
    getCompanies({
      PageSize,
      PageNumber: pageNumber,
      onSuccess: setCompanies,
      onFail,
      AscSort: sort.AscSort,
      SrtField: sort.SrtField,
      Filter,
      TalarId: info?.talar_ID,
    });
  };

  useEffect(handleGetCompanies, [
    pageNumber,
    sort.AscSort,
    sort.SrtField,
    Filter,
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

  function onClear() {
    setState({});
    setInstrument(null);
    setCompanyName('');
    childRef?.current?.onClear();
  }
  const getSymbolList = (text: string, pageNo: number) => {
    const data = {
      Filter: text,
      PageNumber: pageNo,
    };
    getInstrumentList({ data, onSuccess: onSuccessSymbolList, onFail });
  };

  const onSuccessSymbolList = (list: any) => {
    setSymbolList(list);
  };
  const onSubmitSymbol = (e: any) => {
    setInstrument(e);
    setInstrumentError(false);
    setCompanyName(e?.companyName);

    // setState({
    //   instrument: e,
    //   instrumentError: false,
    // });
    // getActiveInstrument(e.instrumentId);
  };
  const tableHeader: HeaderTypes[] = [
    {
      dataIndex: 'instrumentName',
      key: 'instrumentName',
      title: 'نماد',
      className: 'col-span-1',
      sorter: true,
    },
    {
      dataIndex: 'companyName',
      key: 'companyName',
      title: 'نام شرکت',
      className: 'col-span-2',
      sorter: true,
    },
    {
      dataIndex: 'url',
      key: 'url',
      title: 'آدرس وبسایت',
      className: 'col-span-2',
      sorter: true,
      render: (item: any) => (
        <a
          href={getClickableLink(item)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {item}
        </a>
      ),
    },
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
    {
      title: 'ویرایش',
      className: 'col-span-1 flex items-center',
      render: (_: any, record: any) => {
        return (
          <Icon
            name="icon-edit"
            classname=" cursor-pointer"
            onClick={() => handleEdit(record)}
          />
        );
      },
    },
    {
      title: 'حذف',
      className: 'col-span-1 flex items-center',
      render: (_: any, record: any) => {
        return (
          <Icon
            name="icon-delete"
            classname="text-red cursor-pointer"
            onClick={() => handleDelete(record)}
          />
        );
      },
    },
  ];

  const formList: ListType[] = [
    {
      itemType: 'element',
      // name: 'instrumentName',
      // label: 'نماد',
      // require: 'نام نماد را وارد کنید',
      chidlren: (
        <NewSymbolModal
          className="col-span-3"
          data={symbolList}
          onChange={(pageNo: number, text: string) =>
            getSymbolList(text, pageNo)
          }
          onSubmit={onSubmitSymbol}
          defaultValue={instrument}
          required
          error={instrumentError}
          showKey={'symbol'}
          label="نماد"
        />
      ),
    },
    {
      itemType: 'element',
      chidlren: (
        <TextField
          label="نام شرکت"
          className="2xl:col-span-3 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
          value={companyName}
          onChange={(value: any) => console.log(value)}
          readOnly
        />
      ),
    },
    // {
    //   name: 'title',
    //   label: 'نام شرکت',
    //   require: 'نام بورس منطقه ای را وارد کنید',
    //   className: 'grid grid-cols-12 col-span-3',
    // },
    // {
    //   name: 'instrumentName',
    //   label: 'نماد',
    //   require: 'نام نماد را وارد کنید',
    //   className: 'grid grid-cols-12 col-span-3',
    // },
    {
      name: 'url',
      label: 'آدرس وبسایت',
      require: 'آدرس وبسایت را وارد کنید',
      className: 'grid grid-cols-12 col-span-3',
      prefix: 'https://',
      type: 'website',
    },
    // {
    //   name: 'ceo',
    //   label: 'نام مدیر عامل',
    //   require: 'نام مدیر عامل را وارد کنید',
    //   color: 'purple',
    //   className: 'grid grid-cols-12 col-span-3',
    // },
    {
      name: 'tel',
      label: 'تلفن امور سهام',
      require: 'تلفن امور سهام را وارد کنید',
      color: 'purple',
      className: 'grid grid-cols-12 col-span-3',
      // type: 'number',
    },
    {
      name: 'ipo_Date',
      itemType: 'datePicker',
      label: 'تاریخ عرضه',
      require: 'تاریخ عرضه را وارد کنید',
      className: 'col-span-3',
    },
    {
      value: 'انصراف',
      type: 'submit',
      itemType: 'button',
      buttonTitleClassName: 'text-purple',
      onClick: onClear,
      tag: 'div',
      buttonClassName: 'bg-white border-purple border-[1px] col-span-2',
      className: 'grid col-span-7 justify-end',
    },
    {
      value: 'ثبت',
      type: 'submit',
      itemType: 'button',
      buttonClassName: 'bg-purple',
      className: 'col-span-2',
    },
  ];

  function handleEdit(values: any) {
    setState(values);
    setCompanyName(values?.companyName);
    setInstrument({
      instrumentId: values?.instrumentId,
      symbolName: values?.instrumentName,
      companyName: values?.companyName,
      symbol: values?.symbol,
    });
  }
  function handleDelete({ id }: any) {
    deleteCompany({
      id,
      onSuccess: () => {
        handleGetCompanies();
        onAlert({ message: 'با موفقیت حذف شد', type: 'success' });
      },
      onFail,
    });
  }

  const onFail = (error: string) => {
    setLoading(false);
    onAlert({ error });
  };

  function handleSubmit(param: { id: string; url: string }) {
    setLoading(true);
    // setInstrumentError(true);

    const data = {
      ...param,
      talar_Id: info.talar_ID,
      id: param.id,
      companyName: instrument?.companyName,
      instrumentName: instrument?.symbolName,
      instrumentId: instrument?.instrumentId,
      title: instrument?.companyName,
    };
    if (param.id) {
      updateCompany({ data, onSuccess, onFail });
      return;
    }
    insertCompany({
      data,
      onSuccess,
      onFail,
    });
  }

  const onSuccess = () => {
    childRef?.current?.onClear();
    setInstrument(null);
    setCompanyName('');
    onAlert({ type: 'success', message: 'با موفقیت ثبت شد' });
    getCompanies({
      TalarId: info?.talar_ID,
      onSuccess: (data: any) => setCompanies(data),
      onFail,
    });
    setLoading(false);
  };

  return (
    <>
      <div className="rounded shadow-simple px-6 py-3 grid grid-cols-12 gap-4">
        <h2 className="col-span-full text-lg font-medium">ناشران استانی</h2>
        <SimpleForm
          className="col-span-12 grid grid-cols-12 gap-2"
          list={formList}
          onSubmit={handleSubmit}
          values={state}
          reference={childRef}
          isLoading={isLoading}
        />
      </div>
      <TextField
        className="!my-3"
        type="text"
        label="جستجو"
        onChange={setFilter}
        iconName="icon-search"
      />
      <Table
        className="col-span-12 border-lightPurple grid grid-cols-12"
        columns={tableHeader}
        data={companies.lst}
        isLoading={isLoading}
        pageNumber={pageNumber}
        totalPages={(companies?.countAll || 1) / PageSize}
        onChangePage={handlePageChange}
        onChange={handleChangeTable}
      />
    </>
  );
}

export default withAlert(AcceptedCompanies);
