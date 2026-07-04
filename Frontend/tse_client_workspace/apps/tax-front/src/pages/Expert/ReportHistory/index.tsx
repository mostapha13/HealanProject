import { Button, Select } from '@tse/components/atoms';
import type {
  ErrorType,
  HeaderTypes,
  onAlertProps,
  TableOnChange,
} from '@tse/types';
import {
  useEffect,
  useNavigate,
  useRef,
  useState,
  useStates,
} from '@tse/utils';
import withAlert from '../../../hoc/withAlert';
import { SimpleForm } from '@tse/components/molecules';
import type { ListType } from '@tse/types';

import { FILE_BASE_URL } from 'apps/tax-front/src/constants';

import { getAllPeriod, getInvoiceReport } from './service';
import { separator } from '@tse/tools';
import { Table } from 'apps/tax-front/src/components/Table';
interface SendPackageTypes {
  onAlert: onAlertProps;
}
const tableHeader: HeaderTypes[] = [
  {
    title: 'تعداد رکورد',
    dataIndex: 'invoiceCount',
    key: 'invoiceCount',
    className: 'col-span-4',
    render: (item: any) => <span>{separator(item)}</span>,
  },
  {
    title: 'جمع مبلغ (ریال)',
    dataIndex: 'invoiceSum',
    key: 'invoiceSum',
    className: 'col-span-4',
    render: (item: any) => <span>{separator(item)}</span>,
  },
  {
    title: 'شناسه کالا',
    dataIndex: 'sstId',
    key: 'sstId',
    className: 'col-span-4',
  },
  {
    title: 'شماره اندیکاتور',
    dataIndex: 'indicatorNumber',
    key: 'indicatorNumber',
    className: 'col-span-4',
  },
  {
    title: 'وضعیت',
    dataIndex: 'invoiceStateTypeName',
    key: 'invoiceStateTypeName',
    className: 'col-span-4',
    // render: (item: any) => <span>{separator(item)}</span>,
  },
];
const initialState = {
  pageNumber: 1,
  tableData: [],
  periodId: null,
};
const pageSize = 10;
function ReportHistory({ onAlert }: SendPackageTypes) {
  const [firstLoading, setFirstLoading] = useState(false);
  const [sendMessage, setSendMessage] = useState('');
  const [allPeriodData, setAllPeriodData] = useState<any>([]);
  const [sort, setSort] = useState<{
    AscSort?: boolean | '';
    SrtField?: string | number;
  }>({});
  const [state, setState] = useStates<any>(initialState);
  const { pageNumber, tableData, periodId } = state;

  const childRef: any = useRef();
  const formList: ListType[] = [
    {
      itemType: 'select',
      className: 'col-span-2',
      label: 'دوره',
      required: true,
      require: 'دوره نمی تواند خالی باشد',
      name: 'period',

      options: [
        { name: '', value: '' },
        ...allPeriodData?.map((item: any) => ({
          name: item?.title,
          value: item?.id,
        })),
      ],
    },

    {
      itemType: 'button',
      value: 'گزارش',
      className: 'col-span-2 grid justify-end    ',
      buttonClassName: 'bg-buttonBlue border-2 border-lightBlue',
      buttonTitleClassName: 'text-white',
    },
  ];

  useEffect(() => {
    handleGetAllPeriod();
  }, []);

  const handGetInvoiceReport = (periodId: number, pageNumber: number) => {
    getInvoiceReport({
      pageSize,
      pageNumber,
      periodId: periodId,
      onSuccess: (res) => {
        setState({ tableData: res });
      },
      onFail,
    });
  };

  const onSubmitForm = (item: any) => {
    setState({ periodId: item?.period });
    handGetInvoiceReport(item?.period, 1);
  };

  function handleGetAllPeriod() {
    getAllPeriod({
      onSuccess: (res) => {
        setAllPeriodData(res?.data);
      },
      onFail,
    });
  }

  function onFail(error: ErrorType) {
    onAlert?.({ message: error?.data?.message || error.data, ...error });
    // setIsloading(false);
  }
  const handlePageChange = (page: number) => {
    setState({ pageNumber: page });
    handGetInvoiceReport(periodId, page);
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

  return (
    <div className=" p-10 ">
      <div className=" px-6 py-3 grid grid-cols-12  mb-3 border-li shadow-[0_0px_5px_rgba(0,0,0,0.2)]">
        <span className=" col-span-12 border-b-2 border-lightGray text-base font-bold">
          گزارش سوابق
        </span>
        <div className=" col-span-12 grid grid-cols-12 ">
          <div className="col-span-12 py-6 ">
            {allPeriodData != undefined && (
              <SimpleForm
                list={formList}
                className="col-span-12 grid grid-cols-12 pl-2 gap-4"
                onSubmit={onSubmitForm}
                // values={sendMessage}
                reference={childRef}
                isLoading={firstLoading}
              />
            )}
          </div>
        </div>
      </div>
      <div className=" px-6 py-3 my-12 grid grid-cols-12  mb-3 border-li shadow-[0_0px_5px_rgba(0,0,0,0.2)]">
        <div className=" col-span-12">
          <Table
            withRow
            columns={tableHeader}
            data={tableData?.data}
            pageSize={pageSize}
            totalPages={tableData?.pageInfo?.totalCount / pageSize}
            onChangePage={handlePageChange}
            pageNumber={pageNumber}
            onChange={handleChangeTable}
          />
        </div>
      </div>
    </div>
  );
}
export default withAlert(ReportHistory);
