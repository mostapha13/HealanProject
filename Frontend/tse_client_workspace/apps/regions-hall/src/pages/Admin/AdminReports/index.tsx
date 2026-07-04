import { memo, useEffect, CSVLink, useState } from '@tse/utils';
import withAlert from '../../../hoc/withAlert';
import { Table } from '@tse/components/organism';
import { SimpleForm } from '@tse/components/molecules';
import { Button, Icon, Modal } from '@tse/components/atoms';
import { convertDateToJalali } from '@tse/tools';
import type {
  ErrorType,
  HeaderTypes,
  ListType,
  onAlertProps,
  TableOnChange,
} from '@tse/types';
import { getCourseExcellReport, getCourseReport, getTalars } from './service';
import CourseParticipants from './CourseParticipants';

interface ReportsType {
  onAlert?: onAlertProps;
}

interface ReportDataType {
  name?: string;
  id?: string;
  teacherName?: string;
  course_Date?: string;
  training_Hour?: number;
  capacity?: number;
}

interface ReportDataObjectType {
  lst?: ReportDataType[];
  countAll?: number;
  pageNumber?: number;
}

interface DateType {
  From?: string;
  Talar_Ids?: string;
  To?: string;
  PageNumber?: number;
}

const PageSize = 10;

function Reports(props: ReportsType) {
  const { onAlert } = props;
  const [halls, setHalls] = useState<any[]>([]);
  const [csv, setCsv] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState<string | null>('');
  const [sort, setSort] = useState<{
    AscSort?: boolean | '';
    SrtField?: string | number;
  }>({});
  const [date, setDate] = useState<DateType>({
    From: '',
    To: '',
    Talar_Ids: '',
  });

  const [reportData, setReportData] = useState<ReportDataObjectType>({});

  const handleGetTalars = () => {
    getTalars({
      onSuccess: (res: any) => setHalls(res.lst),
      onFail,
    });
  };

  useEffect(() => {
    handleGetTalars();
  }, []);

  const handleGetCourseReport = ({ PageNumber }: DateType) => {
    getCourseReport?.({
      PageSize,
      PageNumber,
      From: date.From,
      To: date.To,
      id: date?.Talar_Ids,
      onFail,
      onSuccess,
      AscSort: sort.AscSort,
      SrtField: sort.SrtField,
    });
  };

  const onSubmitForm = (data: DateType) => {
    setDate(data);
  };

  useEffect(() => {
    if (date.From && date.To) {
      handleGetCourseReport({});
    }
  }, [date.From, date.To, date.Talar_Ids, sort.SrtField, sort.AscSort]);

  const onFail = (error: ErrorType) => {
    onAlert?.(error);
  };

  const onSuccess = (data: ReportDataObjectType) => {
    setReportData(data);
    handleGetCourseExcellReport();
  };

  const handleGetCourseExcellReport = () => {
    getCourseExcellReport<any>({
      data: date,
      onFail,
      onSuccess: setCsv,
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

  const tableHeader: HeaderTypes[] = [
    {
      title: 'بورس منطقه ای',
      dataIndex: 'talarName',
      key: 'talarName',
      className: 'col-span-2',
      sorter: true,
    },
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
      className: 'col-span-1',
      sorter: true,
      render: (_: any, record: any) => {
        return <span>{convertDateToJalali(record.course_Date)}</span>;
      },
    },
    {
      title: 'ظرفیت',
      dataIndex: 'capacity',
      sorter: true,
      key: 'capacity',
      className: 'col-span-1',
    },

    {
      title: 'شرکت کننده ها',
      dataIndex: 'numberOfStudents',
      sorter: true,
      key: 'numberOfStudents',
      className: 'col-span-2',
    },

    {
      title: '',
      className: 'col-span-1',
      render: (_: any, record: any) => {
        return (
          <>
            <Button
              onClick={() => {
                setIsModalVisible(record.id);
              }}
            >
              <Icon name="icon-doc-text" classname="text-purple" />
            </Button>
            {isModalVisible && (
              <Modal
                hideFooter
                handleOk={() => setIsModalVisible(null)}
                handleCancel={() => setIsModalVisible(null)}
                isModalVisible={isModalVisible === record.id}
                title={`لیست افراد ${record.name}`}
              >
                <CourseParticipants {...{ record }} />
              </Modal>
            )}
          </>
        );
      },
    },
  ];

  const formList: ListType[] = [
    {
      itemType: 'selectMultiple',
      className:
        '2xl:col-span-3 xl:col-span-3 lg:col-span-6 md:col-span-6 sm:col-span-6 xs:col-span-11',
      label: 'نام بورس منطقه ای',
      name: 'Talar_Ids',
      require: 'نام بورس منطقه ای نمی تواند خالی باشد',
      options: [
        ...halls.map((item) => ({ name: item.talar_Name, value: item.id })),
      ],
    },
    {
      itemType: 'datePicker',
      className: '2xl:col-span-2 xl:col-span-2 lg:col-span-5 md:col-span-5',
      label: 'از تاریخ',
      required: true,
      require: 'تاریخ نمی تواند خالی باشد',
      name: 'From',
    },
    {
      itemType: 'datePicker',
      className:
        '2xl:col-span-2 xl:col-span-2 lg:col-span-11 md:col-span-11 sm:col-span-11 xs:col-span-11',
      label: 'تا تاریخ',
      required: true,
      require: 'تاریخ نمی تواند خالی باشد',
      name: 'To',
    },
    {
      itemType: 'button',
      value: 'نمایش',
      className:
        '2xl:col-span-2 xl:col-span-2 lg:col-span-6 md:col-span-6 grid justify-end lg:justify-start md:justify-start',
    },
    {
      itemType: 'element',
      chidlren: (
        <Button
          className={`2xl:col-span-2 xl:col-span-2 lg:col-span-5 md:col-span-5 px-6 border-[1px] gap-2 border-green w-full ${
            !date.From && !date.To && 'opacity-40'
          }`}
        >
          {date.From && date.To && (
            <CSVLink
              data={csv}
              target="_blank"
              filename="گزارش کلاس های آموزشی"
            >
              <span className="whitespace-pre text-extratiny font-normal text-black">
                دانلود فایل اکسل
              </span>
            </CSVLink>
          )}
          {!date.From && !date.To && (
            <span
              className={`whitespace-pre text-extratiny font-normal ${
                !date.From && !date.To && 'opacity-40'
              }`}
            >
              دانلود فایل اکسل
            </span>
          )}
          <Icon name="icon-excel" classname="text-green" />
        </Button>
      ),
    },
  ];

  return (
    <>
      <div className="rounded shadow-simple px-6 py-3 gap-4 mb-3">
        <h2 className="col-span-full text-lg font-medium mb-10">
          گزارش های کلاس های آموزشی
        </h2>
        <SimpleForm
          list={formList}
          className="grid grid-cols-11 gap-4"
          onSubmit={onSubmitForm}
        />
      </div>
      {reportData.lst && (
        <Table
          className="col-span-12 border-lightPurple grid grid-cols-12"
          columns={tableHeader}
          data={reportData.lst}
          pageSize={PageSize}
          totalPages={(reportData?.countAll || 1) / PageSize}
          onChangePage={() => handleGetCourseReport({})}
          onChange={handleChangeTable}
        />
      )}
    </>
  );
}

export default memo(withAlert(Reports));
