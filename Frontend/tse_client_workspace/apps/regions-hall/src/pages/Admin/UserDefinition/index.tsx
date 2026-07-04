import { Icon, TextField } from '@tse/components/atoms';
import { SimpleForm } from '@tse/components/molecules';
import { Table } from '@tse/components/organism';
import {
  ErrorType,
  HeaderTypes,
  ListType,
  onAlertProps,
  TableOnChange,
} from '@tse/types';
import { useState, useEffect, useRef } from '@tse/utils';
import withAlert from '../../../hoc/withAlert';
import {
  getApplicationUser,
  getTalars,
  insertApplicationUser,
  updateApplicationUser,
  getApplicationRole,
  deleteApplicationUser,
} from './service';

interface UserDefinitionType {
  onAlert: onAlertProps;
}

const PageSize = 20;
const mockRole = {
  lst: [
    {
      id: 'RegionHallManager',
      name: 'مدیر تالار',
    },
    {
      id: 'RegionHallAdmin',
      name: 'مدیر سیستم',
    },
    {
      id: 'RegionHallFieldWorker',
      name: 'آمار تالار',
    },
  ],
  countAll: 2,
  pageNumber: 1,
};

function UserDefinition(props: UserDefinitionType) {
  const { onAlert } = props;
  const [state, setState] = useState<any>({});
  const [usersList, setUsersList] = useState<any>({});
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

  const handleGetTalars = () => {
    getTalars({
      onSuccess: (res: any) => setHalls(res.lst),
      onFail,
    });
  };
  const handlePageChange = (PageNumber: number) => {
    setPageNumber(PageNumber);
  };

  const handleGetApplicationsUser = () => {
    getApplicationUser({
      PageSize,
      PageNumber: pageNumber,
      onSuccess: (res: any) => setUsersList(res),
      onFail,
      AscSort: sort.AscSort,
      SrtField: sort.SrtField,
      Filter,
    });
  };

  const handleGetApplicationRole = () => {
    getApplicationRole({
      onSuccess: (res: any) => setRoles(res.lst),
      onFail,
    });
  };

  useEffect(() => {
    handleGetTalars();
    // handleGetApplicationRole();
    setRoles(mockRole.lst);
  }, []);

  useEffect(() => {
    handleGetApplicationsUser();
  }, [pageNumber, sort.SrtField, sort.AscSort, Filter]);

  const onFail = (error: any) => {
    setLoading(false);
    onAlert(error);
  };

  const tableColumns: HeaderTypes[] = [
    {
      title: 'نام',
      dataIndex: 'firstname',
      key: 'firstname',
      className: 'col-span-2',
      sorter: true,
    },
    {
      title: 'نام خانوادگی',
      dataIndex: 'lastname',
      key: 'lastname',
      className: 'col-span-2',
      sorter: true,
    },
    {
      title: 'نام تالار-دفتر منطقه ای',
      // dataIndex: 'talarName',
      // key: 'talarName',
      className: 'col-span-2',
      sorter: true,
      render: (_: any, record: any) => {
        // return record?.roleTitles;
        const talarNames = record?.userTalars?.map(
          (talar: any) => talar?.talarName
        );
        return <span>{talarNames?.join(', ')}</span>;
      },
    },
    {
      title: 'نقش سیستمی',
      dataIndex: 'roleTitles',
      key: 'roleTitles',
      className: 'col-span-2',
      sorter: true,
    },
    // {
    //   title: 'ایمیل',
    //   dataIndex: 'email',
    //   key: 'email',
    //   className: 'col-span-2',
    //   sorter: true,
    // },
    {
      title: 'وضعیت',
      dataIndex: 'lockoutEnabledPersian',
      key: 'lockoutEnabled',
      className: 'col-span-2',
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
    // {
    //   title: 'حذف',
    //   className: 'col-span-1 flex items-center',
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

  const formList: ListType[] = [
    {
      name: 'firstname',
      label: 'نام',
      color: 'purple',
      disabled: true,
      inputWrapperClassName: 'group-focus-within:border-purple',
      className: 'grid grid-cols-12 col-span-3',
    },
    {
      name: 'lastname',
      label: 'نام خانوادگی',
      color: 'purple',
      disabled: true,
      inputWrapperClassName: 'group-focus-within:border-purple',
      className: 'grid grid-cols-12 col-span-3',
    },
    // {
    //   name: 'talar_ID',
    //   label: 'نام تالار-دفتر منطقه ای',
    //   itemType: 'select',
    //   options: [
    //     { name: 'هیچکدام', value: '' },
    //     ...halls.map((item) => ({ name: item.talar_Name, value: item.id })),
    //   ],
    //   color: 'purple',
    //   inputWrapperClassName: 'group-focus-within:border-purple',
    //   className: 'grid grid-cols-12 col-span-3',
    // },
    {
      itemType: 'selectMultiple',
      label: 'نام تالار-دفتر منطقه ای',
      name: 'talar_ID',
      require: 'نام تالار نمی تواند خالی باشد',
      className: 'col-span-3',
      mode: 'tags',
      placeholder: 'نام تالار-دفتر منطقه ای*',
      limit: 100,
      options: [
        { name: 'هیچکدام', value: '' },
        ...halls.map((item) => ({ name: item.talar_Name, value: item.id })),
      ],
    },
    // {
    //   name: 'phoneNumber',
    //   label: 'شماره تماس',
    //   // disabled: true,
    //   color: 'purple',
    //   inputWrapperClassName: 'group-focus-within:border-purple',
    //   className: 'grid grid-cols-12 col-span-3',
    // },
    {
      name: 'lockoutEnabled',
      label: 'وضعیت',
      options: [
        { name: 'فعال', value: 'false' },
        { name: 'غیر فعال', value: 'true' },
      ],
      itemType: 'select',
      className: 'col-span-3',
    },
    // {
    //   name: 'email',
    //   label: 'ایمیل',
    //   color: 'purple',
    //   disabled: true,
    //   inputWrapperClassName: 'group-focus-within:border-purple',
    //   className: 'grid grid-cols-12 col-span-3',
    // },
    {
      name: 'roleNames',
      label: 'نقش سیستمی',
      placeholder: 'کارشناس',
      itemType: 'select',
      color: 'purple',
      require: 'نقش سیستمی باید انتخاب شود',
      options: [
        { name: 'هیچ کدام', value: '' },
        ...roles.map((item) => ({ name: item.name, value: item.id })),
      ],
      inputWrapperClassName: 'group-focus-within:border-purple',
      className: 'grid grid-cols-12 col-span-3',
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
      name: 'submit',
      value: 'ثبت',
      type: 'submit',
      itemType: 'button',
      buttonClassName: 'bg-purple',
      className: 'col-span-2 justify-end',
    },
  ];

  function onClear() {
    childRef?.current?.onClear();
    setState({});
  }

  function handleEdit(values: any) {
    const talar_ID = values?.userTalars?.map((item: any) => item.talar_ID);
    if (values.roleId === '00000000-0000-0000-0000-000000000000') {
      const { roleId, ...rest } = values;
      setState({ roleId: '', talar_ID: talar_ID, ...rest });
      return;
    }
    setState({ ...values, email: values.email || '', talar_ID: talar_ID });
  }

  // function handleDelete(param: { id: string }) {
  //   deleteApplicationUser({
  //     id: param.id,
  //     onSuccess: handleGetApplicationsUser,
  //     onFail: (error: ErrorType) => onAlert({ message: error?.data }),
  //   });
  // }

  function handleSubmit(param: {
    id: string;
    lockoutEnabled: string;
    roleNames: any;
    talar_ID: any;
  }) {
    const userTalars = param?.talar_ID?.map((talar_ID: any) => ({ talar_ID }));
    const lockoutEnabled = param.lockoutEnabled === 'true' ? true : false;
    const roleNames = [...param?.roleNames];
    if (param.id) {
      setLoading(true);
      updateApplicationUser({
        data: {
          ...param,
          lockoutEnabled: lockoutEnabled,
          roleNames: roleNames,
          userTalars: userTalars,
        },
        onSuccess: (res) => {
          setLoading(false);
          onAlert({ message: res.message, type: 'success' });
          handleGetApplicationsUser();
          onClear();
        },
        onFail,
      });
      return;
    }
    onAlert({ message: 'کاربری جهت ویرایش انتخاب نشده است' });
    // insertApplicationUser({ data: param, onSuccess, onFail });
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

  const newData = usersList?.lst?.map((item: any) => {
    return {
      ...item,
      lockoutEnabledPersian: item.lockoutEnabled ? 'غیر فعال' : 'فعال',
    };
  });
  return (
    <>
      <div className="rounded shadow-simple px-6 py-3 grid grid-cols-12 gap-4">
        <h2 className="col-span-full text-lg font-medium">تعریف کاربر</h2>
        <SimpleForm
          className="col-span-12 grid grid-cols-12 gap-5"
          list={formList}
          onSubmit={handleSubmit}
          values={state}
          isLoading={isLoading}
          reference={childRef}
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
        columns={tableColumns}
        data={newData}
        isLoading={isLoading}
        onChangePage={handlePageChange}
        totalPages={(usersList?.countAll || 1) / PageSize}
        onChange={handleChangeTable}
        pageNumber={pageNumber}
        pageSize={PageSize}
      />
    </>
  );
}

export default withAlert(UserDefinition);
