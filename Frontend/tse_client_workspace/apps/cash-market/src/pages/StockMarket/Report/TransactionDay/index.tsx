/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import {
  Button,
  TextField,
  Upload,
  CheckList,
  Modal,
} from '@tse/components/atoms';
import { SymbolModal, Table, InvestorModal } from '@tse/components/organism';
import { DatePicker } from '@tse/components/molecules';
import { useEffect, useStates, useNavigate, useSearchParams } from '@tse/utils';
import {
  convertDateAndTime,
  convertDateToJalali,
  downloadFile,
  separator,
} from '@tse/tools';
import withAlert from '../../../../hoc/withAlert';
import { HeaderTypes } from '@tse/types';
import { Radio } from 'antd';
import { getNotCertaintyCurrentDateReport } from 'apps/cash-market/src/Controller/StockMarket/WholeSale';
import { getInstrumentList } from 'apps/cash-market/src/Controller';

const tableHeader: HeaderTypes[] = [
  {
    title: 'نماد',
    dataIndex: 'symbol',
    key: 'symbol',
    className: 'col-span-1',
    render: (item: any) => <span>{item}</span>,
  },
  {
    title: 'نام شرکت',
    dataIndex: 'symbolName',
    key: 'symbolName',
    className: 'col-span-2',
    render: (item: any) => <span>{item}</span>,
  },
  {
    title: 'تعداد سهام قابل عرضه',
    dataIndex: 'tradeVolume',
    key: 'tradeVolume',
    className: 'col-span-2',
    render: (item: any) => <span>{separator(item)}</span>,
  },
  {
    title: 'تاریخ درخواست',
    dataIndex: 'tradeDate',
    key: 'tradeDate',
    className: 'col-span-2',
    render: (item: any) => <span>{convertDateToJalali(item)}</span>,
  },
  {
    title: 'نوع فروش',
    dataIndex: 'wholesaleTypeName',
    key: 'wholesaleTypeName',
    className: 'col-span-1',
  },
  {
    title: 'شماره پیگیری',
    dataIndex: 'trackingNumber',
    key: 'trackingNumber',
    className: 'col-span-1',
  },
  {
    title: 'وضعیت معامله',
    dataIndex: 'status',
    key: 'status',
    className: 'col-span-1',
    render: (item: any) => (
      <span className={`${item ? 'text-green' : 'text-red'}`}>
        {item ? 'ارسال شده' : 'ارسال نشده'}
      </span>
    ),
  },
  {
    title: 'مهلت ارسال قطعیت معامله',
    dataIndex: 'deadlineDate',
    key: 'deadlineDate',
    className: 'col-span-1',
    render: (item: any) => <span>{convertDateToJalali(item)}</span>,
  },
];

const initialState = {
  symbolList: [],
  instrument: null,
  instrumentId: '',
  tableData: [],
};
const pageSize = 10;

function ReportTransactionDay({ onAlert }: any) {
  const [state, setState] = useStates<any>(initialState);
  const { symbolList, instrument, instrumentId, tableData, instrumentError } =
    state;

  useEffect(() => {
    getSymbolList('', 1);
    handleGetNotCertaintyCurrentDateReport(1);
  }, []);

  const getSymbolList = (text: string, pageNo: number) => {
    const data = {
      SearchText: text,
      PageNumber: pageNo,
    };
    getInstrumentList({ data, onSuccess: onSuccessSymbolList, onFail });
  };

  const onSuccessSymbolList = (list: any) => {
    setState({
      symbolList: list,
    });
  };
  const handleGetNotCertaintyCurrentDateReport = (
    pageNo: number,
    instrumentId?: string
  ) => {
    const data = {
      InstrumentId: instrumentId,
      PageNumber: pageNo,
      PageSize: pageSize,
    };
    getNotCertaintyCurrentDateReport({
      data,
      onSuccess: (res: any) => {
        setState({ tableData: res });
      },
      onFail,
    });
  };
  const onFail = (error: any) => {
    onAlert(error);
  };

  const onSubmitSymbol = (e: any) => {
    setState({
      instrument: e,
      instrumentError: false,
      instrumentId: e.instrumentId,
    });
  };
  const onChangePage = (pageNo: number) => {
    handleGetNotCertaintyCurrentDateReport(pageNo, instrumentId);
  };
  const onSearchClick = () => {
    handleGetNotCertaintyCurrentDateReport(1, instrumentId ? instrumentId : '');
  };
  const onRemoveFilter = () => {
    setState({ instrument: null, instrumentId: '' });
    handleGetNotCertaintyCurrentDateReport(1);
  };
  const pageTitle = 'گزارش روز معامله-عدم ارسال قطعیت معامله';

  return (
    <>
      <div className="shadow-[0_0px_4px_rgba(0,0,0,0.2)] rounded-sm p-3">
        <span className="font-bold">{pageTitle}</span>
        <div className="grid grid-cols-12 gap-4 mt-8 mb-2">
          <SymbolModal
            className="col-span-3"
            data={symbolList}
            onChange={(pageNo: number, text: string) =>
              getSymbolList(text, pageNo)
            }
            onSubmit={onSubmitSymbol}
            defaultValue={instrument}
            required
            error={instrumentError}
            // disabled={isExtending}
          />
          <div className="col-span-9 flex justify-end">
            <Button
              className="border-blue border bg-white  text-blue w-[115px] mr-4"
              onClick={onRemoveFilter}
            >
              حذف فیلتر
            </Button>
            <Button
              className="border-blue border bg-blue  text-white w-[115px] mr-4"
              onClick={onSearchClick}
            >
              جستجو
            </Button>
          </div>
        </div>

        <Table
          data={tableData?.items}
          columns={tableHeader}
          className="col-span-12 grid grid-cols-12 "
          wrapperClassName="!mt-4"
          scroll={{ x: 'calc(500px + 50%)' }}
          onChangePage={onChangePage}
          totalPages={tableData?.totalPages}
          pageSize={10}
        />
      </div>
    </>
  );
}

export default withAlert(ReportTransactionDay);
