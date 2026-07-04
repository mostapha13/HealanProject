/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { memo, useEffect, useState, CSVLink } from '@tse/utils';
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
import { getCourseExcellReport, getCourseReport } from './service';
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
  To?: string;
  PageNumber?: number;
}

const PageSize = 10;

function Reports(props: ReportsType) {
  const { onAlert } = props;
  const [csv, setCsv] = useState<string>('');
  const [sort, setSort] = useState<{
    AscSort?: boolean | '';
    SrtField?: string | number;
  }>({});
  const [isModalVisible, setIsModalVisible] = useState<string | null>('');
  const [date, setDate] = useState<DateType>({
    From: '',
    To: '',
  });

  const [reportData, setReportData] = useState<ReportDataObjectType>({});

  const handleGetCourseReport = ({ PageNumber }: DateType) => {
    getCourseReport?.({
      PageSize,
      PageNumber,
      From: date.From,
      To: date.To,
      onFail,
      onSuccess,
      AscSort: sort.AscSort,
      SrtField: sort.SrtField,
    });
  };

  const onSubmitForm = (date: DateType) => {
    setDate(date);
  };

  useEffect(() => {
    if (date.From && date.To) {
      handleGetCourseReport({});
    }
  }, [date.From, date.To, sort.SrtField, sort.AscSort]);

  const onFail = (error: ErrorType) => {
    onAlert?.(error);
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
      title: 'ظرفیت',
      dataIndex: 'capacity',
      key: 'capacity',
      className: 'col-span-1',
      sorter: true,
    },
    {
      title: 'تاریخ برگزاری',
      dataIndex: 'course_Date',
      key: 'course_Date',
      sorter: true,
      className: 'col-span-2',
      render: (_: any, record: any) => {
        return <span>{convertDateToJalali(record.course_Date)}</span>;
      },
    },
    {
      title: 'تعداد ساعات آموزشی',
      dataIndex: 'training_Hour',
      key: 'training_Hour',
      className: 'col-span-2',
      sorter: true,
    },
    {
      title: 'تعداد نفرات',
      dataIndex: 'numberOfStudents',
      key: 'numberOfStudents',
      className: 'col-span-1',
      sorter: true,
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

  return (
    <>
      <div className="rounded shadow-simple px-6 py-3 gap-4 mb-3">
        <h2 className="col-span-full text-lg font-medium mb-10">
          گزارش های کلاس های آموزشی
        </h2>
        <div className="grid grid-cols-12 my-2">
          <SimpleForm
            list={formList}
            className="col-span-10 grid grid-cols-12 pl-2 gap-4"
            onSubmit={onSubmitForm}
          />
          <section className="col-span-2">
            <Button
              className={`border-[1px] border-green w-full gap-2 ${
                !date.From && !date.To && 'opacity-40'
              }`}
            >
              {date.From && date.To && (
                <CSVLink
                  data={csv}
                  target="_blank"
                  filename="گزارش کلاس های آموزشی"
                >
                  <span className="text-extratiny font-normal text-black">
                    دانلود فایل اکسل
                  </span>
                </CSVLink>
              )}
              {!date.From && !date.To && (
                <span
                  className={`text-extratiny font-normal ${
                    !date.From && !date.To && 'opacity-40'
                  }`}
                >
                  دانلود فایل اکسل
                </span>
              )}
              <Icon name="icon-excel" classname="text-green" />
            </Button>
          </section>
        </div>
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

const formList: ListType[] = [
  {
    itemType: 'datePicker',
    className: 'col-span-4',
    label: 'از تاریخ',
    required: true,
    require: 'تاریخ نمی تواند خالی باشد',
    name: 'From',
  },
  {
    itemType: 'datePicker',
    className: 'col-span-4',
    label: 'تا تاریخ',
    required: true,
    require: 'تاریخ نمی تواند خالی باشد',
    name: 'To',
  },
  {
    itemType: 'button',
    value: 'نمایش',
    className: 'col-span-4 grid justify-end',
  },
];
