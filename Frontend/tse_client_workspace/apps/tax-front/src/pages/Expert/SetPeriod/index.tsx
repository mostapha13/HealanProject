import { Icon, TextField } from '@tse/components/atoms';
import { SimpleForm } from '@tse/components/molecules';
import { Table } from 'apps/tax-front/src/components/Table';
import {
  ErrorType,
  HeaderTypes,
  ListType,
  onAlertProps,
  TableOnChange,
} from '@tse/types';
import { useState, useEffect, useRef } from '@tse/utils';
import withAlert from '../../../hoc/withAlert';
import { setPeriod, getAllPeriod } from './service';
import { convertDateToJalali } from '@tse/tools';
interface SetPeriodType {
  onAlert: onAlertProps;
}

const PageSize = 10;

function SetPeriod(props: SetPeriodType) {
  const { onAlert } = props;
  const [state, setState] = useState<any>({});
  const [usersList, setUsersList] = useState<any>({});
  const [values, setValues] = useState({});
  const [Filter, setFilter] = useState<string>('');
  const [halls, setHalls] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setLoading] = useState(false);
  const childRef: any = useRef();
  const [sort, setSort] = useState<{
    AscSort?: boolean | '';
    SrtField?: string | number;
  }>({});
  const [pageNumber, setPageNumber] = useState<number | undefined>(1);
  const [periodTableData, setPeriodTableData] = useState<any>();

  useEffect(() => {
    handleGetAllPeriod();
  }, []);

  const handleGetAllPeriod = () => {
    getAllPeriod({
      onSuccess: (res) => {
        setPeriodTableData(res?.data);
      },
      onFail,
    });
  };
  const handlePageChange = (PageNumber: number) => {
    setPageNumber(PageNumber);
  };

  const onFail = (error: any) => {
    setLoading(false);
    onAlert(error);
  };

  const tableColumns: HeaderTypes[] = [
    {
      title: 'عنوان',
      dataIndex: 'title',
      key: 'title',
      className: 'w-[30%] items-center justify-center',
    },
    {
      title: 'از تاریخ',
      dataIndex: 'startDate',
      key: 'startDate',
      className: 'w-[30%] items-center justify-center',
      render: (item: any) => <span>{convertDateToJalali(item)}</span>,
    },
    {
      title: 'تا تاریخ',
      dataIndex: 'endDate',
      key: 'endDate',
      className: 'w-[30%] items-center justify-center',
      render: (item: any) => <span>{convertDateToJalali(item)}</span>,
    },
    // {
    //   dataIndex: 'icon-edit',
    //   title: 'ویرایش',
    //   render: (_: any, record: any) => {
    //     return (
    //       <Icon
    //         name="icon-delete"
    //         classname=" cursor-pointer"
    //         onClick={() => handleEdit(record)}
    //       />
    //     );
    //   },
    //   className: 'w-[80px] items-center justify-center',
    // },
  ];

  const formList: ListType[] = [
    {
      name: 'title',
      label: 'عنوان',
      //   color: 'purple',
      className: 'col-span-3',
      require: 'عنوان را وارد کنید',
    },
    {
      name: 'startDate',
      label: 'از تاریخ',
      itemType: 'datePicker',
      className: 'col-span-3',
      require: 'از تاریخ را وارد کنید',
    },
    {
      name: 'endDate',
      label: 'تا تاریخ',
      itemType: 'datePicker',
      className: 'col-span-3',
      require: 'تا تاریخ را وارد کنید',
    },
    {
      name: 'submit',
      value: 'ثبت',
      type: 'submit',
      itemType: 'button',
      buttonClassName: 'bg-buttonBlue',
      className: 'col-span-3 w-[40%] mr-10 ',
    },
  ];

  function onClear() {
    childRef?.current?.onClear();
    setState({});
  }

  function handleEdit(values: any) {
    setValues(values);
  }

  // function handleDelete(param: { id: string }) {
  //   deleteApplicationUser({
  //     id: param.id,
  //     onSuccess: handleGetApplicationsUser,
  //     onFail: (error: ErrorType) => onAlert({ message: error?.data }),
  //   });
  // }

  function handleSubmit(param: any) {
    setPeriod({
      data: param,
      onSuccess: (res) => {
        if (res?.isSuccess) {
          onAlert({ type: 'success', message: 'دوره با موفقیت ثبت گردید' });
          handleGetAllPeriod();
        }
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

  const data = [
    {
      title: 'فروردین',
      from: '1402/01/06',
      toDate: '1402/02/06',
    },
    {
      title: 'فروردین',
      from: '1402/01/06',
      toDate: '1402/02/06',
    },
    {
      title: 'فروردین',
      from: '1402/01/06',
      toDate: '1402/02/06',
    },
  ];
  return (
    <div className="p-10">
      <div className="px-6">
        <h2 className="col-span-full text-lg font-medium border-b-2 py-4 border-lightGray">
          تعریف دوره
        </h2>
        <div className=" grid grid-cols-12 gap-4 py-10 px-4 mt-6 shadow-[0_0px_5px_rgba(0,0,0,0.2)]">
          <SimpleForm
            className="col-span-12 grid grid-cols-12 gap-5"
            list={formList}
            onSubmit={handleSubmit}
            values={values}
            isLoading={isLoading}
            reference={childRef}
          />
        </div>
      </div>
      <div className="px-6 mt-6">
        <TextField
          className="!my-3"
          type="text"
          label="جستجو"
          onChange={setFilter}
          iconName="icon-search"
        />
        <div className="border-2 border-grayBackground">
          <Table
            className=""
            columns={tableColumns}
            data={periodTableData}
            isLoading={isLoading}
            onChangePage={handlePageChange}
            totalPages={(periodTableData?.length || 1) / PageSize}
            onChange={handleChangeTable}
            pageNumber={pageNumber}
            pageSize={PageSize}
          />
        </div>
      </div>
    </div>
  );
}

export default withAlert(SetPeriod);
