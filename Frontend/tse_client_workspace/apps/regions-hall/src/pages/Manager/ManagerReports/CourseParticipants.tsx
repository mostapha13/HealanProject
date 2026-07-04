import { memo, useEffect, useState } from '@tse/utils';
import { Table } from '@tse/components/organism';
import type {
  ErrorType,
  HeaderTypes,
  onAlertProps,
  TableOnChange,
} from '@tse/types';
import { getCourseParticipants } from './service';
import withAlert from '../../../hoc/withAlert';
import { Button, Icon } from '@tse/components/atoms';
import { baseUrl } from '../../../constants';

const PageSize = 10;

interface CourseParticipantsTypes {
  record?: any;
  onAlert?: onAlertProps;
}

function CourseParticipants(props: CourseParticipantsTypes) {
  const { record, onAlert } = props;
  const [tableData, setTableData] = useState<any>({});
  const [sort, setSort] = useState<{
    AscSort?: boolean | '';
    SrtField?: string | number;
  }>({});
  const [pageNumber, setPageNumber] = useState<number | undefined>(1);

  const handleGetCourseParticipants = () => {
    getCourseParticipants({
      onFail,
      onSuccess,
      id: record.id,
      PageSize,
      PageNumber: pageNumber,
      AscSort: sort.AscSort,
      SrtField: sort.SrtField,
    });
  };

  useEffect(handleGetCourseParticipants, [
    record.id,
    pageNumber,
    sort.AscSort,
    sort.SrtField,
  ]);

  const onSuccess = (data: any) => {
    setTableData(data);
  };

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

  const handlePageChange = (PageNumber: number) => {
    setPageNumber(PageNumber);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button className="px-6 border-[1px] gap-2 border-green w-fit">
          <a
            className="text-extratiny font-normal text-black"
            target="blank"
            href={`${baseUrl}CourseParticipants/CourseParticipantsExcellByCourse?id=${record.id}`}
          >
            دانلود فایل اکسل
          </a>
          <Icon name="icon-excel" classname="text-green" />
        </Button>
      </div>
      <Table
        className="col-span-12 border-lightPurple grid grid-cols-12"
        columns={modalTableHeader}
        data={tableData?.lst}
        totalPages={(tableData?.countAll || 1) / PageSize}
        pageSize={PageSize}
        onChangePage={handlePageChange}
        onChange={handleChangeTable}
      />
    </div>
  );
}

export default withAlert(memo(CourseParticipants));

const modalTableHeader: HeaderTypes[] = [
  {
    title: 'نام',
    dataIndex: 'name',
    key: 'name',
    className: 'col-span-2',
    sorter: true,
  },
  {
    title: 'نام خانوادگی',
    dataIndex: 'family_Name',
    key: 'family_Name',
    className: 'col-span-3',
    sorter: true,
  },
  {
    title: 'کدملی',
    dataIndex: 'nationalCode',
    key: 'nationalCode',
    className: 'col-span-3',
    sorter: true,
  },
  {
    title: 'شماره موبایل',
    dataIndex: 'mobile_No',
    key: 'mobile_No',
    className: 'col-span-3',
    sorter: true,
  },
];
