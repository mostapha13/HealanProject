import { SimpleForm } from '@tse/components/molecules';
import { HeaderTypes, ListType, onAlertProps, TableOnChange } from '@tse/types';
import {
  useState,
  useEffect,
  useRef,
  useStates,
  useNavigate,
} from '@tse/utils';
import withAlert from '../../../hoc/withAlert';
import Item from 'antd/lib/list/Item';
import { TextField, Button } from '@tse/components/atoms';
import { Table } from 'apps/tax-front/src/components/Table';
import { DatePicker } from '@tse/components/molecules';
import { cleanPeriodData, getAllPeriod } from './service';
import { convertDateToJalali } from '@tse/tools';

interface SetSamatOffsetType {
  onAlert: onAlertProps;
}

const initialState = {
  fromDate: '',
  toDate: '',
  pageNumber: 1,
  tableData: [],
};

function CalibrationInformation(props: SetSamatOffsetType) {
  const { onAlert } = props;
  const [values, setValues] = useState({});
  const [isLoading, setLoading] = useState(false);
  const [sort, setSort] = useState<{
    AscSort?: boolean | '';
    SrtField?: string | number;
  }>({});
  const [state, setState] = useStates<any>(initialState);
  const { fromDate, toDate, pageNumber, tableData } = state;
  const childRef: any = useRef();
  const pageSize = 10;
  const navigate = useNavigate();

  const tableHeader: HeaderTypes[] = [
    {
      title: 'نام دوره',
      dataIndex: 'title',
      key: 'title',
      className: 'col-span-2',
    },
    {
      title: 'از تاریخ',
      dataIndex: 'startDate',
      key: 'startDate',
      className: 'col-span-2',
      render: (item: any) => <span>{convertDateToJalali(item)}</span>,
    },
    {
      title: 'تا تاریخ',
      dataIndex: 'endDate',
      key: 'endDate',
      className: 'col-span-2',
      render: (item: any) => <span>{convertDateToJalali(item)}</span>,
    },
    {
      title: 'کالیبره کردن',
      dataIndex: 'isCollaborate',
      key: 'isCollaborate',
      className: 'col-span-2',
      render: (item: boolean, record: any) =>
        !item ? (
          <a
            // href="/user/dashboard"
            onClick={() => onCleanDataClick(record?.id)}
          >
            <span className=" text-buttonBlue underline">کالیبره</span>
          </a>
        ) : null,
    },
  ];
  const handlePageChange = (page: number) => {
    setState({ pageNumber: page });
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
  useEffect(() => {
    getAllPeriodData();
  }, []);
  const onFail = (error: any) => {
    setLoading(false);
    onAlert(error);
  };
  const getAllPeriodData = () => {
    getAllPeriod({
      onSuccess: (res: any) => {
        setState({ tableData: res?.data });
      },
      onFail,
    });
  };
  const onCleanDataClick = (periodId: number) => {
    cleanPeriodData({
      id: periodId,
      onSuccess: (res: any) => {
        getAllPeriodData();
        onAlert({
          message:
            'فرآیند کالیبر اطلاعات در حال انجام است و ممکن است کمی زمانبر باشد.',
          type: 'success',
        });
        navigate('/');
      },
      onFail,
    });
  };
  return (
    <div className="p-10">
      <div className="px-6">
        <h2 className="col-span-full text-lg font-medium border-b-2 py-4 border-lightGray">
          کالیبره کردن اطلاعات
        </h2>

        <div className="gap-4 py-10 px-4 mt-6 shadow-[0_0px_5px_rgba(0,0,0,0.2)]">
          <Table
            className="py-6 col-span-12"
            columns={tableHeader}
            data={tableData}
            pageSize={pageSize}
            // totalPages={searchInvoiceData?.pageInfo?.totalCount / pageSize}
            onChangePage={handlePageChange}
            pageNumber={pageNumber}
            onChange={handleChangeTable}
          />
        </div>
      </div>
    </div>
  );
}

export default withAlert(CalibrationInformation);
