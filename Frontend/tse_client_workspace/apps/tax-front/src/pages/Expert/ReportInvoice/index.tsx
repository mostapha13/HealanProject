import { SimpleForm } from '@tse/components/molecules';
import { HeaderTypes, ListType, onAlertProps } from '@tse/types';
import {
  useState,
  useEffect,
  useRef,
  useStates,
  useSearchParams,
} from '@tse/utils';
import withAlert from '../../../hoc/withAlert';
// import { getSematPickupTime, setSematPickupTime } from './service';
import Item from 'antd/lib/list/Item';
import { TextField, Button, Icon } from '@tse/components/atoms';
import { Table } from 'apps/tax-front/src/components/Table';
import LoadingModal from 'apps/tax-front/src/components/Loading';
import { getEndPeriodReport } from './service';
import { convertDateAndTimeToJalali, separator } from '@tse/tools';

interface ReportInvoiceType {
  onAlert: onAlertProps;
  visibleLoading?: boolean;
  endPeriodReportData?: any;
}
const initialState = {
  visibleLoading: false,
  endPeriodReportData: [],
};
function ReportInvoice(props: ReportInvoiceType) {
  const { onAlert } = props;
  const [searchParams] = useSearchParams();
  const [isLoading, setLoading] = useState(false);
  const [state, setState] = useStates<any>(initialState);
  const { visibleLoading, endPeriodReportData } = state;
  const indicatorNumber: any = searchParams.get('indicatorNumber');
  const periodId: any = searchParams.get('periodId');
  const perriodTitle: any = searchParams.get('perriodTitle');
  const childRef: any = useRef();
  const tableHeader: HeaderTypes[] = [
    {
      title: 'نوع فرآیند',
      dataIndex: 'invoiceStateTitle',
      key: 'invoiceStateTitle',
      className: 'col-span-3',
      sorter: false,
    },
    {
      title: 'تاریخ انجام',
      dataIndex: 'sendDate',
      key: 'sendDate',
      className: 'col-span-3',
      sorter: false,
      render: (item: any) => <span>{convertDateAndTimeToJalali(item)}</span>,
    },
    {
      title: 'شماره اندیکاتور',
      dataIndex: 'indicatorNumber',
      key: 'indicatorNumber',
      className: 'col-span-1',
      sorter: false,
    },
    {
      title: 'تعداد',
      dataIndex: 'count',
      key: 'count',
      className: 'col-span-4',
      sorter: false,
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'جمع مبلغ',
      dataIndex: 'sumVolume',
      key: 'sumVolume',
      className: 'col-span-4',
      sorter: false,
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'مجموع کارمزد',
      dataIndex: 'sumFee',
      key: 'sumFee',
      className: 'col-span-4',
      sorter: false,
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'توضیحات',
      dataIndex: 'description',
      key: 'description',
      className: 'col-span-4',
      sorter: false,
    },
  ];
  useEffect(() => {
    setState({ visibleLoading: true });
    getEndPeriodReport({
      periodId: periodId,
      onSuccess: (res) => {
        setState({
          endPeriodReportData: res?.data,
          visibleLoading: false,
        });
      },
      onFail,
    });
  }, []);

  const onFail = (error: any) => {
    setLoading(false);
    onAlert(error);
  };
  const onPrint = () => {
    window.print();
  };
  return (
    <div className="p-10 grid grid-cols-12">
      <div className="px-6 col-span-12 flex justify-between border-b-2 border-lightGray">
        <h2 className="text-lg font-medium  py-4 ">
          گزارش صورتحساب {perriodTitle}
        </h2>
        <Icon
          name="icon-print"
          onClick={onPrint}
          classname="cursor-pointer text-2xl text-gray5 py-4 col-span-4"
        />
      </div>
      <div className="border-2 col-span-12 border-grayBackground mt-6">
        <Table
          className=""
          columns={tableHeader}
          data={endPeriodReportData}
          //   pageSize={pageSize}
          //   totalPages={allBuyersCode?.pageInfo?.totalCount / pageSize}
          //   onChangePage={handlePageChange}
          //   pageNumber={pageNumber}
          // onChange={handleChangeTable}
        />
      </div>
      <LoadingModal visible={visibleLoading} />
    </div>
  );
}

export default withAlert(ReportInvoice);
