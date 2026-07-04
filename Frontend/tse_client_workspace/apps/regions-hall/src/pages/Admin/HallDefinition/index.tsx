import { SimpleForm } from '@tse/components/molecules';
import { Icon, TextField } from '@tse/components/atoms';
import { Table } from '@tse/components/organism';
import type {
  ErrorType,
  HeaderTypes,
  ListType,
  onAlertProps,
  TableOnChange,
} from '@tse/types';
import { useState, useEffect, useRef } from '@tse/utils';
import { getTalars, postTalar, deleteTalar, updateTalar } from './service';
import withAlert from '../../../hoc/withAlert';

interface HallDefinition {
  onAlert: onAlertProps;
}

const PageSize = 10;

function HallDefinition(props: HallDefinition) {
  const { onAlert } = props;
  const childRef: any = useRef();
  const [values, setValues] = useState({});
  const [data, setData] = useState<any>({});
  const [Filter, setFilter] = useState<string>('');
  const [isLoading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState<number | undefined>(1);
  const [sort, setSort] = useState<{
    AscSort?: boolean | '';
    SrtField?: string | number;
  }>({});

  const tableHeader: HeaderTypes[] = [
    {
      title: 'نام بورس منطقه ای',
      dataIndex: 'talar_Name',
      key: 'talar_Name',
      className: 'col-span-9',
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
      className:
        '2xl:col-span-2 xl:col-span-2 lg:col-span-2 md:col-span-2 flex items-center',
    },
    // {
    //   title: 'حذف',
    //   className:
    //     '2xl:col-span-2 xl:col-span-2 lg:col-span-2 md:col-span-2 flex items-center',
    //   render: (_: any, record: any) => {
    //     return (
    //       <Icon
    //         name="icon-delete"
    //         classname="text-red cursor-pointer"
    //         onClick={() => handleDelete(record)}
    //       />
    //     );
    //   },
    // },
  ];

  // const list: ListType[] = [
  //   {
  //     name: 'talar_Name',
  //     label: 'نام بورس منطقه ای',
  //     require: 'نام بورس منطقه ای را وارد کنید',
  //     color: 'purple',
  //     inputWrapperClassName: 'group-focus-within:border-purple',
  //     className: 'grid grid-cols-12 col-span-3',
  //   },
  //   {
  //     value: 'انصراف',
  //     type: 'submit',
  //     itemType: 'button',
  //     buttonTitleClassName: 'text-purple',
  //     onClick: onClear,
  //     tag: 'div',
  //     buttonClassName: 'bg-white border-purple border-[1px] col-span-2',
  //     className: 'grid col-span-7 justify-end',
  //   },
  //   {
  //     value: 'ثبت',
  //     type: 'submit',
  //     itemType: 'button',
  //     buttonClassName: 'bg-purple',
  //     className: 'col-span-2',
  //   },
  // ];

  function onClear() {
    childRef?.current?.onClear();
  }
  const handlePageChange = (PageNumber: number) => {
    setPageNumber(PageNumber);
  };
  const handleGetTalars = () => {
    getTalars({
      PageSize,
      PageNumber: pageNumber,
      onSuccess: (res: any) => setData(res),
      onFail,
      AscSort: sort.AscSort,
      SrtField: sort.SrtField,
      Filter,
    });
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

  useEffect(handleGetTalars, [pageNumber, sort.SrtField, sort.AscSort, Filter]);

  function handleEdit(values: any) {
    setValues(values);
  }

  // function handleDelete({ id }: any) {
  //   deleteTalar({
  //     id,
  //     onSuccess: () => {
  //       handleGetTalars();
  //       onAlert({ message: 'با موفقیت حذف شد', type: 'success' });
  //     },
  //     onFail: (error: ErrorType) => onAlert({ message: error?.data }),
  //   });
  // }

  // function handleSubmit(param: { id: string }) {
  //   setLoading(true);
  //   if (param.id) {
  //     updateTalar({ data: param, onSuccess, onFail });
  //     return;
  //   }
  //   postTalar({ data: param, onSuccess, onFail });
  // }

  // function onSuccess() {
  //   childRef?.current?.onClear();
  //   handleGetTalars();
  //   setLoading(false);
  // }

  function onFail(error: ErrorType) {
    setLoading(false);
    onAlert(error);
  }

  return (
    <>
      <div className="rounded shadow-simple px-6 py-3 grid grid-cols-12 gap-4">
        <h2 className="col-span-full text-lg font-medium">
          تعریف بورس منطقه ای
        </h2>
        {/* <SimpleForm
          className="col-span-12 grid grid-cols-12 gap-2"
          list={list}
          onSubmit={handleSubmit}
          values={values}
          reference={childRef}
          isLoading={isLoading}
        /> */}
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
        data={data?.lst}
        pageSize={PageSize}
        totalPages={(data?.countAll || 1) / PageSize}
        pageNumber={pageNumber}
        onChangePage={handlePageChange}
        onChange={handleChangeTable}
      />
    </>
  );
}

export default withAlert(HallDefinition);
