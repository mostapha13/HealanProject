import { SimpleForm } from '@tse/components/molecules';
import { HeaderTypes, ListType, onAlertProps, TableOnChange } from '@tse/types';
import { useState, useEffect, useRef, useStates } from '@tse/utils';
import withAlert from '../../../hoc/withAlert';
import {
  getSematDataReport,
  getSematPickupTime,
  setSematPickupTime,
} from './service';
import Item from 'antd/lib/list/Item';
import { TextField, Button } from '@tse/components/atoms';
import { Table } from 'apps/tax-front/src/components/Table';
import { convertDateToJalali, separator } from '@tse/tools';

interface SetSamatOffsetType {
  onAlert: onAlertProps;
}

const tableHeader: HeaderTypes[] = [
  {
    title: 'تاریخ',
    dataIndex: 'date',
    key: 'date',
    className: 'col-span-2',
    render: (item: string) => <span>{convertDateToJalali(item)}</span>,
  },
  {
    title: 'روز',
    dataIndex: 'day',
    key: 'day',
    className: 'col-span-2',
  },
  {
    title: 'تعداد کل',
    dataIndex: 'clearingCount',
    key: 'clearingCount',
    className: 'col-span-2',
    render: (item: number) => <span>{separator(item)}</span>,
  },
  {
    title: 'تعداد دریافت شده',
    dataIndex: 'clearingCountDetails',
    key: 'clearingCountDetails',
    className: 'col-span-2',
    render: (item: number) => <span>{separator(item)}</span>,
  },
  {
    title: 'صحت اطلاعات',
    dataIndex: '',
    key: '',
    className: 'col-span-1',
    render: (item: any, record: any) => (
      <span
        className={`${
          Number(record?.clearingCount) == Number(record?.clearingCountDetails)
            ? 'text-green'
            : 'text-red'
        }`}
      >
        {Number(record?.clearingCount) == Number(record?.clearingCountDetails)
          ? 'تایید'
          : 'عدم تایید'}
      </span>
    ),
  },
];
const initialState = {
  sematPickupTimeId: '',
  sematPickupTimeError: false,
  sematPickupTime: '',
  pageNumber: 1,
  reportData: null,
};

function SetSamatOffset(props: SetSamatOffsetType) {
  const { onAlert } = props;
  const [values, setValues] = useState({});
  const [isLoading, setLoading] = useState(false);
  const [sort, setSort] = useState<{
    AscSort?: boolean | '';
    SrtField?: string | number;
  }>({});
  const [state, setState] = useStates<any>(initialState);
  const {
    sematPickupTimeId,
    sematPickupTimeError,
    sematPickupTime,
    pageNumber,
    reportData,
  } = state;
  const childRef: any = useRef();
  const pageSize = 31;

  useEffect(() => {
    handelGetSematDataReport();
    getSematPickupTime({
      onSuccess: (res) => {
        setState({
          sematPickupTimeId: res?.data?.id,
          sematPickupTime: res?.data?.pickupTime,
        });
      },
      onFail,
    });
  }, []);
  const handelGetSematDataReport = () => {
    const data = {
      pageNumber: pageNumber,
      pageSize: pageSize,
    };
    getSematDataReport({
      data: data,
      onSuccess: (res) => {
        setState({ reportData: res });
      },
      onFail,
    });
  };
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
  const onFail = (error: any) => {
    setLoading(false);
    onAlert(error);
  };

  function handleSubmit() {
    if (sematPickupTime) {
      setState({
        sematPickupTimeError: false,
      });
      setSematPickupTime({
        id: sematPickupTimeId,
        pickupTime: sematPickupTime,
        onSuccess: (res) => {
          if (res?.isSuccess) {
            onAlert({
              type: 'success',
              message: 'آفست دریافت اطلاعات با موفقیت ثبت گردید',
            });
          }
        },
        onFail,
      });
    } else {
      setState({
        ...(!sematPickupTime && { sematPickupTimeError: true }),
      });
    }
  }

  return (
    <div className="p-10">
      <div className="px-6">
        <h2 className="col-span-full text-lg font-medium border-b-2 py-4 border-lightGray">
          دریافت اطلاعات سمات
        </h2>
        <div className=" grid grid-cols-8 gap-4 py-10 px-4 mt-6 shadow-[0_0px_5px_rgba(0,0,0,0.2)]">
          {/* <TextField
            required
            className="col-span-2"
            id="outlined-required"
            label="Required"
            defaultValue="Hello World"
          /> */}
          <TextField
            className="col-span-2 h-8"
            label="آفست دریافت اطلاعات (روز)"
            onChange={(e: string) => setState({ sematPickupTime: e })}
            value={sematPickupTime}
            required
            error={sematPickupTimeError}
            // errorMessage="آفست استعلام را وارد نمایید"
          />
          <div className="flex w-full items-center justify-center h-8">
            <Button
              onClick={handleSubmit}
              className="col-span-1 bg-buttonBlue mr-10 mt-2  w-full rounded  px-8 text-white"
            >
              ثبت
            </Button>
          </div>
        </div>
        <div className="gap-4 py-10 px-4 mt-6 shadow-[0_0px_5px_rgba(0,0,0,0.2)]">
          <Table
            className="py-6 col-span-12"
            columns={tableHeader}
            data={reportData?.data}
            pageSize={pageSize}
            totalPages={reportData?.pageInfo?.totalCount / pageSize}
            onChangePage={handlePageChange}
            pageNumber={pageNumber}
            onChange={handleChangeTable}
          />
        </div>
      </div>
    </div>
  );
}

export default withAlert(SetSamatOffset);
