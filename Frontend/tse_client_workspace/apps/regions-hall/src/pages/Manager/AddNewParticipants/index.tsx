import { Icon, Modal } from '@tse/components/atoms';
import { SimpleForm } from '@tse/components/molecules';
import { Table } from '@tse/components/organism';
import {
  ErrorType,
  HeaderTypes,
  ListType,
  onAlertProps,
  TableOnChange,
} from '@tse/types';
import {
  memo,
  useEffect,
  useRecoilState,
  useRef,
  useState,
  persianTools,
} from '@tse/utils';
import withAlert from '../../../hoc/withAlert';
import { userInfoAtom } from '../../../store/userProfile';
import {
  insertCourseParticipants,
  updateCourseParticipants,
  getCourseParticipantsReport,
  deleteCourse,
  getCourses,
} from './service';

interface RegisterType {
  onAlert: onAlertProps;
}
const PageSize = 10;

function AddNewCourseParticipants(props: RegisterType) {
  const { onAlert } = props;
  const childRef: any = useRef();
  const [state, setState] = useState<any>({});
  const [loading, setloading] = useState<boolean>(false);
  const [data, setData] = useState<{
    lst?: any[];
    countAll?: number;
    pageNumber?: number;
  }>({});
  const [sort, setSort] = useState<{
    AscSort?: boolean | '';
    SrtField?: string | number;
  }>({});
  const [modalTableData, setModalTableData] = useState<{
    lst?: any[];
    countAll?: number;
    pageNumber?: number;
  }>({});
  const [info] = useRecoilState(userInfoAtom);
  const [pageNumber, setPageNumber] = useState<number | undefined>(1);

  useEffect(() => {
    handleGetCourseParticipantsReport();
  }, [pageNumber, sort.SrtField, sort.AscSort]);

  useEffect(() => {
    handleGetCourses();
  }, []);

  const handleEdit = (values: any) => {
    setState({
      ...values,
      course_Name: {
        id: values.course_Id,
        name: values.course_Name,
      },
    });
  };

  const handleGetCourses = (PageNumber?: number) => {
    getCourses({
      PageSize,
      PageNumber,
      onFail,
      onSuccess: setModalTableData,
      ids: [info.talar_ID],
    });
  };

  const handlePageChange = (PageNumber: number) => {
    setPageNumber(PageNumber);
  };

  const handleGetCourseParticipantsReport = (PageNumber?: number) => {
    getCourseParticipantsReport({
      PageSize,
      PageNumber: pageNumber,
      onFail,
      onSuccess: setData,
      AscSort: sort.AscSort,
      SrtField: sort.SrtField,
    });
  };

  const onSuccess = () => {
    handleGetCourseParticipantsReport();
    onClear();
    onAlert({ type: 'success', message: 'اطلاعات با موفقیت ثبت شد' });
    setloading(false);
  };

  const onFail = (error: ErrorType) => {
    setloading(false);
    onAlert?.({ message: error.data });
  };

  const handleSubmit = ({ course_Name, ...params }: any) => {
    if (!persianTools.verifyIranianNationalId(params.nationalCode)) {
      onAlert?.({ message: 'فرمت کد ملی اشتباه است!' });
      return;
    }
    setloading(true);
    const data = {
      ...params,
      talar_Id: info.talar_ID,
      course_Id: course_Name?.id,
    };
    if (params.id) {
      updateCourseParticipants({
        data,
        onSuccess,
        onFail,
      });
      return;
    }
    insertCourseParticipants({
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
        handleGetCourseParticipantsReport();
        onAlert({ message: 'با موفقیت حذف شد', type: 'success' });
      },
      onFail,
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
      name: 'course_Name',
      itemType: 'modalSingleSelect',
      tableData: modalTableData,
      modalTableHeader: modalTableHeader,
      require: 'نام دوره نمی تواند خالی باشد',
      onChangePage: handleGetCourses,
      inputWrapperClassName: '!cursor-pointer',
      readOnly: true,
    },
    {
      className: 'col-span-3',
      label: 'نام',
      name: 'name',
      require: 'نام نمی تواند خالی باشد',
    },
    {
      className: 'col-span-3',
      label: 'نام خانوادگی',
      name: 'family_Name',
      require: 'نام خانوادگی نمی تواند خالی باشد',
    },
    {
      className: 'col-span-3',
      label: 'کد ملی',
      name: 'nationalCode',
      require: 'کد ملی نمی تواند خالی باشد',
      rule: {
        patern: '^([0-9]){10}$',
      },
    },
    {
      className: 'col-span-3',
      label: 'شماره موبایل',
      name: 'mobile_No',
      require: 'شماره موبایل نمی تواند خالی باشد',
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
      itemType: 'button',
      value: 'ثبت اطلاعات',
      className: 'col-span-2',
    },
  ];

  const tableHeader: HeaderTypes[] = [
    {
      title: 'نام دوره آموزشی',
      dataIndex: 'course_Name',
      key: 'course_Name',
      className: 'col-span-2',
      sorter: true,
    },
    {
      title: 'نام',
      dataIndex: 'name',
      key: 'name',
      className: 'col-span-1',
      sorter: true,
    },
    {
      title: 'نام خانوادگی',
      dataIndex: 'family_Name',
      key: 'family_Name',
      className: 'col-span-2',
      sorter: true,
    },
    {
      title: 'کد ملی',
      dataIndex: 'nationalCode',
      key: 'nationalCode',
      className: 'col-span-2',
      sorter: true,
    },
    {
      title: 'شماره موبایل',
      dataIndex: 'mobile_No',
      key: 'mobile_No',
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

  return (
    <>
      <div className="rounded shadow-simple px-6 py-3 grid grid-cols-12 gap-4 mb-3">
        <h2 className="col-span-full text-lg font-medium">ثبت شرکت کننده</h2>
        <SimpleForm
          className="col-span-12 grid grid-cols-12 gap-5"
          list={formList}
          onSubmit={handleSubmit}
          values={state}
          reference={childRef}
          isLoading={loading}
        />
      </div>
      <Table
        className="col-span-12 border-lightPurple grid grid-cols-12"
        columns={tableHeader}
        data={data.lst}
        totalPages={(data?.countAll || 1) / PageSize}
        pageSize={PageSize}
        onChangePage={handlePageChange}
        onChange={handleChangeTable}
      />
    </>
  );
}

export default memo(withAlert(AddNewCourseParticipants));

const modalTableHeader: HeaderTypes[] = [
  {
    title: 'نام دوره آموزشی',
    dataIndex: 'name',
    key: 'name',
    className: 'col-span-4',
  },
  {
    title: 'نام مدرس',
    dataIndex: 'teacherName',
    key: 'teacherName',
    className: 'col-span-3',
  },
  {
    title: 'تعداد ساعات آموزشی',
    dataIndex: 'training_Hour',
    key: 'training_Hour',
    className: 'col-span-3',
  },
];
