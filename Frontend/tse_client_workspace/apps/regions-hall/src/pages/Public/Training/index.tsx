import { Button, Icon, Input, Modal } from '@tse/components/atoms';
import { Table } from '@tse/components/organism';
import { convertDateToJalali, loadFromStorage } from '@tse/tools';
import {
  ErrorType,
  HeaderTypes,
  onAlertProps,
  TableOnChange,
} from '@tse/types';
import { memo, useEffect, useState } from '@tse/utils';
import { fileBaseUrl } from '../../../constants';
import withAlert from '../../../hoc/withAlert';
import { getCourseParticipantsReport } from './service';
import TrainingRequest from './TrainingRequest';

interface RegisterType {
  onAlert: onAlertProps;
}
const PageSize = 10;

function Training(props: RegisterType) {
  const { onAlert } = props;
  const talarData = loadFromStorage('hasProvince');
  const [isModalVisible, setIsModalVisible] = useState<string | null>('');
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

  const [pageNumber, setPageNumber] = useState<number | undefined>(1);
  const [filterText, setFilterText] = useState<string>('');

  useEffect(() => {
    handleGetCourseParticipantsReport();
  }, [pageNumber, sort.SrtField, sort.AscSort, filterText]);

  const handlePageChange = (PageNumber: number) => {
    setPageNumber(PageNumber);
  };

  const handleGetCourseParticipantsReport = () => {
    setloading(true);
    getCourseParticipantsReport({
      PageSize,
      PageNumber: pageNumber,
      onFail,
      onSuccess,
      AscSort: sort.AscSort,
      SrtField: sort.SrtField,
      Filter: filterText,
      ids: [talarData?.guid],
    });
  };

  const onSuccess = (data: any) => {
    setloading(false);
    setData(data);
  };

  const onFail = (error: ErrorType) => {
    setloading(false);
    onAlert?.(error);
  };

  const handleChangeFilter = (filterText: string) => {
    setFilterText(filterText);
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
      render: (item: any) => <span>{convertDateToJalali(item)}</span>,
    },
    {
      title: 'تعداد ساعات آموزشی',
      dataIndex: 'training_Hour',
      key: 'training_Hour',
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
      title: 'فایل',
      dataIndex: 'file_Id',
      key: 'file_Id',
      className: 'col-span-1',
      sorter: true,
      render: (item: string) => {
        return (
          <a
            href={`${fileBaseUrl}Download/${item}`}
            target="_blank"
            rel="noreferrer"
            className="text-link underline cursor-pointer"
          >
            {item && 'دانلود سرفصل'}
          </a>
        );
      },
    },
    {
      title: 'ثبت نام',
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
                title={`ثبت نام ${record.name}`}
              >
                <TrainingRequest
                  onClose={() => setIsModalVisible(null)}
                  {...{ record }}
                />
              </Modal>
            )}
          </>
        );
      },
    },
  ];

  return (
    <div className="rounded shadow-simple px-6 py-3 grid grid-cols-12 gap-4 mb-3">
      <h2 className="col-span-12 text-lg font-medium">دوره های آموزشی</h2>
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
        data={data.lst}
        totalPages={(data?.countAll || 1) / PageSize}
        pageSize={PageSize}
        onChangePage={handlePageChange}
        onChange={handleChangeTable}
        loading={loading}
        pageNumber={pageNumber}
      />
    </div>
  );
}

export default memo(withAlert(Training));
