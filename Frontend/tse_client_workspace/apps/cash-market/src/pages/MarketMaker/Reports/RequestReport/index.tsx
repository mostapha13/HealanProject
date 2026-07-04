import {
  Button,
  TextField,
  Dropdown,
  CheckList,
  NewSelectSearch,
} from '@tse/components/atoms';
import { SymbolModal, Table } from '@tse/components/organism';
import { DatePicker } from '@tse/components/molecules';
import { useEffect, useStates } from '@tse/utils';
import {
  getInstrumentList,
  getFundList,
  getRequestReport,
  getRequestReportExport,
  getWorkFlowType,
} from '../../../../Controller';
import withAlert from '../../../../hoc/withAlert';
import {
  convertDate,
  loadFromStorage,
  convertDateAndTimeJalali,
  convertDateAndTime,
  downloadFile,
} from '@tse/tools';

import { HeaderTypes } from '@tse/types';

const tableHeader: HeaderTypes[] = [
  {
    title: 'نام درخواست',
    dataIndex: 'formTitle',
    key: 'formTitle',
    className: 'col-span-2',
    render: (item: any, record: any) => (
      <a
        className={`${!record.hasObserved && 'font-bold'}`}
        href={`${record.formUrl}?id=${record.orderId}&history=${true}`}
      >
        {item}
      </a>
    ),
  },
  {
    title: 'نماد',
    dataIndex: 'instrumentName',
    key: 'instrumentName',
    className: 'col-span-2',
  },
  {
    title: 'فرستنده',
    dataIndex: 'sender',
    key: 'sender',
    className: 'col-span-1',
  },
  {
    title: 'گیرنده',
    dataIndex: 'reciever',
    key: 'reciever',
    className: 'col-span-1',
  },
  {
    title: 'تاریخ و ساعت',
    dataIndex: 'createDate',
    key: 'createDate',
    className: 'col-span-2',
    render: (item: any) => <span>{convertDateAndTimeJalali(item)}</span>,
  },
  {
    title: 'نوع عملیات',
    dataIndex: 'workFlowType',
    key: 'workFlowType',
    className: 'col-span-2',
  },
  {
    title: 'شماره پیگیری',
    dataIndex: 'trackingNumber',
    key: 'trackingNumber',
    className: 'col-span-1',
  },
];

// const workFlowType = [
//   {
//     key: 'MarketMakerStart',
//     value: 'درخواست بازارگردانی',
//   },
//   {
//     key: 'MarketMakerExtending',
//     value: 'تمدید بازارگردانی',
//   },
//   {
//     key: 'MarketMakerQuitOrderRequest',
//     value: 'انصراف از بازارگردانی',
//   },
//   {
//     key: 'OrderCommitmentIncDecs',
//     value: 'تغییر پارامتر',
//   },
//   {
//     key: 'OrderChangeBrokers',
//     value: 'تغییر کارگزار',
//   },
// ];

const initialState = {
  symbolList: [],
  instrument: null,
  FundList: null,
  selectedFund: null,
  fromDate: '',
  toDate: '',
  WorkFlowTypeId: [],
  formTitle: '',
  trackingNumber: '',
  reportList: [],
  workFlowType: [],
};

function RequestReport({ onAlert }: any) {
  const [state, setState] = useStates<any>(initialState);
  const {
    symbolList,
    instrument,
    FundList,
    selectedFund,
    fromDate,
    WorkFlowTypeId,
    formTitle,
    trackingNumber,
    reportList,
    toDate,
    workFlowType,
  } = state;

  useEffect(() => {
    getFund('', 1);
    getSymbolList('', 1);
    getWorkFlowTypeData();
  }, []);
  const getSymbolList = (text: string, pageNo: number) => {
    const data = {
      SearchText: text,
      PageNumber: pageNo,
    };
    getInstrumentList({ data, onSuccess: onSuccessSymbolList, onFail });
  };

  const getFund = (text: string, pageNo: number) => {
    const data = {
      FundName: text,
      PageNumber: pageNo,
    };
    getFundList({ data, onSuccess: onSuccessFundL, onFail });
  };

  const onSuccessFundL = (res: any) => {
    setState({
      FundList: res,
    });
  };

  const onSuccessSymbolList = (list: any) => {
    setState({
      symbolList: list,
    });
  };
  const getWorkFlowTypeData = () => {
    getWorkFlowType({
      onSuccess: (res: any) => {
        setState({ workFlowType: res });
      },
      onFail,
    });
  };

  const onFail = (error: any) => {
    onAlert(error);
  };

  const onChange = (key: string, value: any) => {
    setState({
      [key]: value,
    });
  };

  const downloadOrderFile = (file: any) => {
    downloadFile(file, 'reportExport.xlsx');
  };

  const onSearch = (isExport: boolean, pageNo: number) => {
    const data = {
      instrumentId: instrument?.instrumentId,
      FundId: selectedFund?.fundId,
      FormTitle: formTitle,
      TrackingNumber: trackingNumber,
      WorkFlowTypeId: WorkFlowTypeId?.name,
      FromDate: convertDateAndTime(fromDate),
      PageNumber: pageNo,
      PageSize: 10,
      ToDate: convertDateAndTime(toDate),
    };

    if (isExport) {
      getRequestReportExport({
        data,
        onSuccess: downloadOrderFile,
        onFail,
      });
    } else {
      getRequestReport({
        data,
        onSuccess: onSuccessReport,
        onFail,
      });
    }
  };

  const onSuccessReport = (res: any) => {
    setState({
      reportList: res,
    });
  };

  const onChangePage = (pageNo: number) => {
    onSearch(false, pageNo);
  };
  const onRemoveFilter = () => {
    setState({
      instrument: null,
      selectedFund: null,
      trackingNumber: '',
      WorkFlowTypeId: [],
      formTitle: '',
      fromDate: '',
      toDate: '',
    });
    const data = {
      PageNumber: 1,
      PageSize: 10,
    };
    getRequestReport({
      data,
      onSuccess: onSuccessReport,
      onFail,
    });
  };

  return (
    <>
      <div className="shadow-[0_0px_4px_rgba(0,0,0,0.2)] rounded-sm p-3 mb-2">
        <span className="font-bold">درخواست ها</span>
        <div className="grid grid-cols-12 gap-4 mt-4">
          <SymbolModal
            className="col-span-3"
            data={symbolList}
            onChange={(pageNo: number, text: string) =>
              getSymbolList(text, pageNo)
            }
            onSubmit={(value: any, ids: any) => onChange('instrument', value)}
            defaultValue={instrument}
          />
          <NewSelectSearch
            className="col-span-3"
            label="بازارگردان"
            onChange={(value: any) => {
              if (value?.fundName !== undefined) {
                setState({
                  selectedFund: value,
                  // selectedFundError: '',
                });
              } else if (value == '') {
                setState({
                  selectedFund: null,
                });
              }
              getFund(value, 1);
            }}
            value={selectedFund}
            data={FundList?.items}
            showKey="fundName"
          />

          <TextField
            className="col-span-3"
            label="شماره پیگیری"
            onChange={(value: any) => onChange('trackingNumber', value)}
            value={trackingNumber}
          />

          <Dropdown
            className="col-span-3"
            label="نوع عملیات"
            data={workFlowType}
            showKey="displayName"
            value={WorkFlowTypeId}
            onChange={(e: any) => onChange('WorkFlowTypeId', e)}
          />
          <TextField
            className="col-span-3"
            label="نام درخواست"
            onChange={(value: any) => onChange('formTitle', value)}
            value={formTitle}
          />

          <div className="col-span-3 z-10">
            <DatePicker
              parentClassName="!w-[85%]"
              label="از تاریخ"
              value={fromDate}
              onChange={(value: any) => onChange('fromDate', value)}
              onClearDate={() => onChange('fromDate', '')}
            />
          </div>

          <div className="col-span-3 z-10">
            <DatePicker
              parentClassName="!w-[85%]"
              label="تا تاریخ"
              value={toDate}
              onChange={(value: any) => onChange('toDate', value)}
              onClearDate={() => onChange('toDate', '')}
            />
          </div>
        </div>
        <div className="flex justify-end mt-2">
          <Button
            className="border border-green text-green w-[115px] ml-2"
            onClick={() => onSearch(true, 1)}
          >
            خروجی اکسل
          </Button>
          <Button
            className="border-blue border bg-white  text-blue w-[115px] mx-4 "
            onClick={onRemoveFilter}
          >
            حذف فیلتر
          </Button>
          <Button
            className="bg-blue text-white w-[115px] mr-2"
            onClick={() => onSearch(false, 1)}
          >
            جستجو
          </Button>
        </div>
      </div>
      {reportList && (
        <Table
          columns={tableHeader}
          className="col-span-12 grid grid-cols-12 "
          data={reportList?.items}
          onChangePage={onChangePage}
          totalPages={reportList?.totalPages}
          pageSize={10}
        />
      )}
    </>
  );
}

export default withAlert(RequestReport);
