import { Icon, TextField } from '@tse/components/atoms';
import { SimpleForm } from '@tse/components/molecules';
import { Table } from '@tse/components/organism';
import { ListType, HeaderTypes, onAlertProps, TableOnChange } from '@tse/types';
import {
  useEffect,
  useRecoilState,
  useRef,
  useState,
  useStates,
} from '@tse/utils';
import withAlert from '../../../hoc/withAlert';
import { userInfoAtom } from '../../../store/userProfile';
import {
  getNahadMali,
  getNahadMaliType,
  insertNahadMali,
  updateNahadMali,
  deleteNahadMali,
  getKargozariType,
} from './service';

interface AcceptedCompaniesTypes {
  onAlert: onAlertProps;
}

interface FilterType {
  selectFilter?: string;
  Filter?: string;
}

const PageSize = 10;

function FinancialInstitutions(props: AcceptedCompaniesTypes) {
  const { onAlert } = props;
  const childRef: any = useRef();
  const [state, setState] = useState<any>({});
  const [info] = useRecoilState(userInfoAtom);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [filter, setFilter] = useStates<FilterType>({
    selectFilter: '',
    Filter: '',
  });
  const [isLoading, setLoading] = useState(false);
  const [sort, setSort] = useState<{
    AscSort?: boolean | '';
    SrtField?: string | number;
  }>({});
  const [nahadMaliType, setNahadMaliType] = useState<any>({
    lst: [],
    pageNumber: 0,
    countAll: 0,
  });

  const [kargozari, setKargozari] = useState<any>({
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
    filter.selectFilter === 'c3f676f3-ba56-45bb-a263-707a58610178' &&
    selectedCategory === 'c3f676f3-ba56-45bb-a263-707a58610178';

  const isKargozariForTable =
    selectedCategory === 'c3f676f3-ba56-45bb-a263-707a58610178';

  const handlePageChange = (PageNumber: number) => {
    setPageNumber(PageNumber);
  };

  const handleGetNahadMali = () => {
    getNahadMali({
      id: info.talar_ID,
      PageNumber: pageNumber,
      onSuccess: setNahadMali,
      onFail,
      AscSort: sort.AscSort,
      SrtField: sort.SrtField,
      Nahad_Mali_Type_Id: selectedCategory,
      Filter: filter.Filter,
    });
  };

  useEffect(() => {
    handleGetNahadMali();
  }, [
    pageNumber,
    sort.AscSort,
    sort.SrtField,
    selectedCategory,
    filter.Filter,
  ]);

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

  useEffect(() => {
    getKargozariType({ onSuccess: setKargozari, onFail });
  }, []);

  const onFail = (error: any) => {
    setLoading(false);
    onAlert(error);
  };

  const handleSubmit = ({ brokerType_Name, broker_TypeId, ...params }: any) => {
    const data = {
      ...params,
      talar_Id: info.talar_ID,
      ...(isKargozari && {
        broker_TypeId,
      }),
    };
    if (params.id) {
      updateNahadMali({
        data,
        onSuccess,
        onFail,
      });
      return;
    }
    insertNahadMali({
      data,
      onSuccess,
      onFail,
    });
  };

  function onSuccess() {
    onClear();
    handleGetNahadMali();
    onClear();
    onAlert({ type: 'success', message: 'اطلاعات با موفقیت ثبت شد' });
  }

  function onClear() {
    childRef?.current?.onClear();
    setState({});
  }

  function handleEdit(values: any) {
    setFilter({ selectFilter: values.nahad_Mali_Type_Id });

    setState(values);
  }

  function handleDelete({ id }: any) {
    deleteNahadMali({
      id,
      onSuccess: () => {
        handleGetNahadMali();
        onAlert({ message: 'با موفقیت حذف شد', type: 'success' });
      },
      onFail,
    });
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

  const formList: ListType[] = [
    {
      name: 'hallName',
      label: 'نام بورس منطقه ای',
      inputWrapperClassName: 'group-focus-within:border-purple',
      className: 'col-span-3 md:col-span-6',
      disabled: true,
      value: info.talarName,
    },
    {
      name: 'title',
      label: 'نام نهاد مالی',
      require: 'نام نهاد مالی را وارد کنید',
      inputWrapperClassName: 'group-focus-within:border-purple',
      className: 'col-span-3 md:col-span-6',
    },
    {
      name: 'nahad_Mali_Type_Id',
      label: 'نوع نهاد مالی',
      require: 'فیلد اجباری',
      onChange: (res: any) => {
        setFilter({ selectFilter: res });
      },
      options: [
        { name: 'هیچکدام', value: '' },
        ...nahadMaliType.lst.map((item: any) => ({
          name: item.title,
          value: item.id,
        })),
      ],
      itemType: 'select',
      className: 'col-span-3 md:col-span-6',
    },
    isKargozari
      ? {
          itemType: 'select',
          name: 'broker_TypeId',
          label: 'نوع مجوز کارگزاری',
          require: 'فیلد اجباری',
          className: 'col-span-3',
          options: [
            { name: 'هیچکدام', value: '' },
            ...kargozari.lst.map((item: any) => ({
              name: item.title,
              value: item.id,
            })),
          ],
        }
      : ({
          itemType: 'none',
        } as any),
    {
      name: 'telNo',
      type: 'number',
      label: 'شماره تلفن',
      require: 'شماره تلفن را وارد کنید',
      inputWrapperClassName: 'group-focus-within:border-purple',
      className: 'col-span-3',
    },
    {
      name: 'address',
      label: 'آدرس',
      require: 'آدرس را وارد کنید',
      inputWrapperClassName: 'group-focus-within:border-purple',
      className: `${isKargozari ? 'col-span-9' : 'col-span-12'}`,
    },
    {
      value: 'انصراف',
      type: 'submit',
      itemType: 'button',
      buttonTitleClassName: 'text-purple',
      onClick: onClear,
      tag: 'div',
      className: 'grid col-span-10 justify-end',
      buttonClassName: 'bg-white border-purple border-[1px] col-span-1',
    },
    {
      value: 'اعمال تغییرات',
      type: 'submit',
      itemType: 'button',
      buttonClassName: 'bg-purple',
      className: 'grid col-span-2 flex items-end justify-end',
    },
  ];

  const tableColumns: HeaderTypes[] = [
    {
      dataIndex: 'title',
      key: 'title',
      title: 'نام نهاد مالی',
      className: 'col-span-2',
      sorter: true,
    },
    // {
    //   dataIndex: 'nahad_Mali_Type_Name',
    //   key: 'nahad_Mali_Type_Name',
    //   title: 'نوع نهاد مالی',
    //   className: 'col-span-1',
    //   sorter: true,
    // },
    isKargozariForTable
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
      className: `${isKargozariForTable ? 'col-span-3' : 'col-span-4'}`,
      sorter: true,
    },
    {
      dataIndex: 'icon-edit',
      title: 'ویرایش',
      render: (_: any, record: any) => {
        return (
          <Icon
            name="icon-edit"
            classname=" cursor-pointer"
            onClick={() => handleEdit(record)}
          />
        );
      },
      className: 'col-span-1 flex items-center',
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

  return (
    <>
      <div className="rounded shadow-simple px-6 py-3 grid grid-cols-12 gap-4 mb-3">
        <h2 className="col-span-full text-lg font-medium">
          ثبت اطلاعات نهادهای مالی مستقر در استان
        </h2>
        <SimpleForm
          className="col-span-12 grid grid-cols-12 gap-5"
          list={formList}
          onSubmit={handleSubmit}
          reference={childRef}
          isLoading={isLoading}
          values={state}
        />
      </div>
      {nahadMaliType.lst?.length > 0 && (
        <section className="col-span-12 grid grid-cols-12 gap-1">
          {nahadMaliType.lst.map((item: any) => {
            return (
              <span
                onClick={() => setSelectedCategory(item.id)}
                className={`bg-lightGray cursor-pointer p-1 col-span-3 text-center border-[1px] border-purple ${
                  selectedCategory === item.id ? 'bg-purple text-white' : ''
                }`}
              >
                {item.title}
              </span>
            );
          })}
        </section>
      )}
      <TextField
        className="!my-3"
        type="text"
        label="جستجو"
        onChange={(text: string) => setFilter({ Filter: text })}
        iconName="icon-search"
      />
      <Table
        className="col-span-12 border-lightPurple grid grid-cols-12"
        columns={tableColumns}
        data={nahadMali.lst}
        totalPages={(nahadMali?.countAll || 1) / PageSize}
        isLoading={isLoading}
        pageSize={PageSize}
        onChangePage={handlePageChange}
        pageNumber={pageNumber}
        onChange={handleChangeTable}
      />
    </>
  );
}

export default withAlert(FinancialInstitutions);
