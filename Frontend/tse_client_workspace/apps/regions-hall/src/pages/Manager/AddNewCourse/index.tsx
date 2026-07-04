import { Icon, TextField } from '@tse/components/atoms';
import { SimpleForm } from '@tse/components/molecules';
import { Table } from '@tse/components/organism';
import {
  convertDateToJalali,
  loadFromStorage,
  loadFromSession,
} from '@tse/tools';
import {
  ErrorType,
  HeaderTypes,
  ListType,
  onAlertProps,
  TableOnChange,
} from '@tse/types';
import { memo, useEffect, useRecoilState, useRef, useState } from '@tse/utils';
import withAlert from '../../../hoc/withAlert';
import { userInfoAtom } from '../../../store/userProfile';
import {
  insertCourse,
  updateCourse,
  getCourseReport,
  deleteCourse,
} from './service';
import { fileBaseUrl, uploadFileBaseUrl } from '../../../constants';

interface RegisterType {
  onAlert: onAlertProps;
}
const PageSize = 10;

const uploadUrl = `${uploadFileBaseUrl}Upload`;

function Register(props: RegisterType) {
  const { onAlert } = props;
  const token = loadFromSession('token');
  const childRef: any = useRef();
  const [state, setState] = useState<any>({});
  const [Filter, setFilter] = useState<string>('');
  const [loading, setloading] = useState<boolean>(false);
  const [sort, setSort] = useState<{
    AscSort?: boolean | '';
    SrtField?: string | number;
  }>({});
  const [data, setData] = useState<{
    lst?: any[];
    countAll?: number;
    pageNumber?: number;
  }>({});
  const [info] = useRecoilState(userInfoAtom);
  const [pageNumber, setPageNumber] = useState<number | undefined>(1);

  useEffect(() => {
    handleGetCourseReport();
  }, [pageNumber, sort.SrtField, sort.AscSort, Filter]);

  const handleEdit = (values: any) => {
    setState(values);
  };

  const handlePageChange = (PageNumber: number) => {
    setPageNumber(PageNumber);
  };

  const handleGetCourseReport = () => {
    getCourseReport({
      PageSize,
      PageNumber: pageNumber,
      onFail,
      onSuccess: setData,
      AscSort: sort.AscSort,
      SrtField: sort.SrtField,
      ids: [info.talar_ID],
      Filter,
    });
  };

  const onSuccess = () => {
    handleGetCourseReport();
    childRef?.current?.onClear();
    onAlert({ type: 'success', message: 'اطلاعات با موفقیت ثبت شد' });
    setloading(false);
  };

  const onFail = (error: ErrorType) => {
    setloading(false);
    onAlert?.({ message: error?.data?.message || error.data, ...error });
  };

  const handleSubmit = (params: any) => {
    setloading(true);
    const data = {
      ...params,
      talar_Id: info.talar_ID,
      file_Id: params?.file_Id?.fileId.fileId || params?.file_Id?.fileId,
    };
    if (params.id) {
      updateCourse({
        data,
        onSuccess,
        onFail,
      });
      return;
    }
    insertCourse({
      data,
      onSuccess,
      onFail,
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

  function handleDeleteCourse({ id }: any) {
    deleteCourse({
      id,
      onSuccess: () => {
        handleGetCourseReport();
        onAlert({ message: 'با موفقیت حذف شد', type: 'success' });
      },
      onFail: (error: ErrorType) => onAlert({ message: error?.data }),
    });
  }

  function onClear() {
    setState({});
    childRef?.current?.onClear();
  }

  const formList: ListType[] = [
    {
      className: 'col-span-3',
      label: 'نام دوره',
      name: 'name',
      require: 'نام دوره نمی تواند خالی باشد',
    },
    {
      className: 'col-span-3',
      label: 'نام مدرس',
      name: 'teacherName',
      require: 'نام مدرس نمی تواند خالی باشد',
    },
    {
      itemType: 'datePicker',
      className: 'col-span-3',
      label: 'تاریخ برگزاری',
      name: 'course_Date',
      require: 'وارد کردن تاریخ برگزاری اجباری است',
    },
    {
      className: 'col-span-3',
      label: 'تعداد ساعات آموزشی',
      name: 'training_Hour',
      type: 'number',
      require: 'تعداد ساعات آموزشی نمی تواند خالی باشد',
    },
    {
      className: 'col-span-3',
      label: 'ظرفیت',
      name: 'capacity',
      type: 'number',
      require: 'ظرفیت نمی تواند خالی باشد',
    },
    {
      name: 'file_Id',
      itemType: 'file',
      require: 'ارسال فایل اجباری است',
      className: 'col-span-5',
      link: `${fileBaseUrl}Download/`,
      uploadUrl,
      token,
      onFail,
    },
    {
      value: 'انصراف',
      type: 'submit',
      itemType: 'button',
      buttonTitleClassName: 'text-purple',
      onClick: onClear,
      tag: 'div',
      buttonClassName: 'bg-white border-purple border-[1px] col-span-2',
      className: 'grid col-span-2 justify-end',
    },
    {
      itemType: 'button',
      value: 'ثبت اطلاعات',
      className: 'col-span-2',
    },
  ];

  const tableHeader: HeaderTypes[] = [
    {
      title: 'نام دوره آموزشی',
      dataIndex: 'name',
      key: 'name',
      className: 'col-span-2',
      sorter: true,
    },
    {
      title: 'نام مدرس',
      dataIndex: 'teacherName',
      key: 'teacherName',
      className: 'col-span-2',
      sorter: true,
    },
    {
      title: 'تاریخ برگزاری',
      dataIndex: 'course_Date',
      key: 'course_Date',
      className: 'col-span-2',
      sorter: true,
      render: (_: any, record: any) => {
        return <span>{convertDateToJalali(record.course_Date)}</span>;
      },
    },
    {
      title: 'تعداد ساعات آموزشی',
      dataIndex: 'training_Hour',
      key: 'training_Hour',
      className: 'col-span-1',
      sorter: true,
    },
    {
      title: 'ظرفیت',
      dataIndex: 'capacity',
      key: 'capacity',
      className: 'col-span-1',
      sorter: true,
    },
    {
      title: 'فایل',
      dataIndex: 'file_Id',
      key: 'file_Id',
      className: 'col-span-1',
      sorter: true,
      render: (item: any) => {
        return (
          <a
            href={`${fileBaseUrl}Download/${item?.fileId}`}
            target="_blank"
            rel="noreferrer"
            className="text-link underline cursor-pointer"
          >
            {item?.fileName && 'دانلود سرفصل'}
          </a>
        );
      },
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
            onClick={() => handleDeleteCourse(record)}
          />
        );
      },
    },
  ];

  const newData = data?.lst?.map((item: any) => ({
    ...item,
    file_Id: {
      fileName: 'file',
      fileId: item.file_Id,
    },
  }));
  return (
    <>
      <div className="rounded shadow-simple px-6 py-3 grid grid-cols-12 gap-4">
        <h2 className="col-span-full text-lg font-medium">ثبت دوره آموزشی</h2>
        <SimpleForm
          className="col-span-12 grid grid-cols-12 gap-5"
          list={formList}
          onSubmit={handleSubmit}
          values={state}
          reference={childRef}
          isLoading={loading}
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
        data={newData}
        totalPages={(data?.countAll || 1) / PageSize}
        pageSize={PageSize}
        onChangePage={handlePageChange}
        pageNumber={pageNumber}
        onChange={handleChangeTable}
      />
    </>
  );
}

export default memo(withAlert(Register));
