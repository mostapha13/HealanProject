import { Button, CheckList, NestedTable } from '@tse/components/atoms';
import { SymbolModal } from '@tse/components/organism';
import { DatePicker } from '@tse/components/molecules';
import { useEffect, useStates } from '@tse/utils';
import {
  getInstrumentList,
  getFundList,
  getParameterReport,
  getParameterReportExport,
} from '../../Controller';
import withAlert from '../../hoc/withAlert';
import {
  convertDateAndTimeJalali,
  convertDateToJalali,
  separator,
  downloadFile,
} from '@tse/tools';

import { HeaderTypes } from '@tse/types';

const initialState = {
  symbolList: [],
  instrument: null,
  FundList: null,
  selectedFund: null,
  fromDate: '',
  toDate: '',
  reportList: null,
  parameterType: null,
  InstrumentIds: [],
  parameterTypeError: false,
  instrumentError: false,
};

const tableHeader: HeaderTypes[] = [
  {
    title: 'نوع پارامتر',
    dataIndex: 'parameterType',
    key: 'parameterType',
    width: 150,
    render: (item: any) => <span>{item === 'Temp' ? 'موقت' : 'دائم'}</span>,
  },
  {
    title: 'نام کاربر ویرایش کننده',
    dataIndex: 'userName',
    key: 'userName',
    width: 120,
  },
  {
    title: 'تاریخ ساعت اعمال',
    dataIndex: 'createDate',
    key: 'createDate',
    width: 120,
    render: (item: any) => <span>{convertDateAndTimeJalali(item)}</span>,
  },
  {
    title: 'حداقل حجم',
    dataIndex: 'minValue',
    key: 'minValue',
    width: 80,
    render: (item: any) => <span>{separator(item)}</span>,
  },
  {
    title: 'حداقل سفارش انباشته',
    dataIndex: 'maxOrder',
    key: 'maxOrder',
    width: 80,
    render: (item: any) => <span>{separator(item)}</span>,
  },
  {
    title: 'دامنه مظنه',
    dataIndex: 'tolerance',
    key: 'tolerance',
    width: 80,
  },
  {
    title: 'دامنه نوسان',
    dataIndex: 'oscillation',
    key: 'oscillation',
    width: 80,
    render: (item: any) => <span>{separator(item)}</span>,
  },
  {
    title: 'نقدشوندگی',
    dataIndex: 'liquidity',
    key: 'liquidity',
    width: 80,
    render: (item: any) => <span>{separator(item)}</span>,
  },
  {
    title: 'از تاریخ',
    dataIndex: 'fromDate',
    key: 'fromDate',
    width: 100,
    render: (item: any) => <span>{convertDateToJalali(item)}</span>,
  },
  {
    title: 'تا تاریخ',
    dataIndex: 'toDate',
    key: 'toDate',
    width: 100,
    render: (item: any) => <span>{convertDateToJalali(item)}</span>,
  },
];

const childTableHeader: HeaderTypes[] = [
  {
    title: '',
    width: 7,
    className: '!bg-[#e9eaff]',
  },
  {
    title: 'نام بازارگردان',
    width: 100,
    dataIndex: 'marketMakerName',
    key: 'marketMakerName',
  },
  {
    title: 'تاریخ شروع بازارگردانی',
    dataIndex: 'startDate',
    key: 'startDate',
    width: 100,
    render: (item: any) => <span>{convertDateToJalali(item)}</span>,
  },
  {
    title: 'تاریخ پایان بازارگردانی',
    dataIndex: 'endDate',
    key: 'endDate',
    width: 100,
    render: (item: any) => <span>{convertDateToJalali(item)}</span>,
  },
];

const parameterTypeList = [
  {
    key: 'Temp',
    value: 'موقت',
  },
  {
    key: 'Permanent',
    value: 'دائم',
  },
];

function ParameterReport({ onAlert }: any) {
  const [state, setState] = useStates<any>(initialState);
  const {
    symbolList,
    instrument,
    FundList,
    selectedFund,
    fromDate,
    toDate,
    reportList,
    parameterType,
    InstrumentIds,
    parameterTypeError,
    instrumentError,
  } = state;

  useEffect(() => {
    getFund('', 1);
    getSymbolList('', 1);
  }, []);

  const onSuccessReport = (res: any) => {
    res.items.map((item: any, i: number) => {
      item.insrumentParameterAndInstrumentParameterTemps.forEach(function (
        element: any,
        index: number
      ) {
        element.key = Number(`${i + 1}${index + 1}`);
      });
    });
    setState({
      reportList: res,
    });
  };

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

  const onFail = (error: any) => {
    onAlert(error);
  };

  const onChange = (key: string, value: any) => {
    const errorKey = `${key}Error`;
    setState({
      [key]: value,
      [errorKey]: false,
    });
  };

  const downloadOrderFile = (file: any) => {
    downloadFile(file, 'reportExport.xlsx');
  };

  const onSearch = (isExport: boolean) => {
    if (parameterType && instrument) {
      const ParameterTypesKeys: any = [];
      parameterType?.map((item: any) => ParameterTypesKeys.push(item.key));

      const MarketMakers: any = [];
      selectedFund?.map((item: any) => MarketMakers.push(item.fundId));
      const data = {
        InstrumentIds: InstrumentIds,
        ParameterTypes: ParameterTypesKeys,
        MarketMakers,
        FromDate: fromDate,
        ToDate: toDate,
        PageNumber: 1,
        PageSize: 10,
      };

      if (isExport) {
        getParameterReportExport({
          data,
          onSuccess: downloadOrderFile,
          onFail,
        });
      } else {
        getParameterReport({
          data,
          onSuccess: onSuccessReport,
          onFail,
        });
      }
    } else {
      setState({
        ...(!instrument && { instrumentError: true }),
        ...(!parameterType && { parameterTypeError: true }),
      });
    }
  };

  const onSubmitInstrument = (item: any, ids: any) => {
    setState({
      InstrumentIds: ids,
      instrument: item,
      instrumentError: false,
    });
  };

  return (
    <>
      <div className="shadow-[0_0px_4px_rgba(0,0,0,0.2)] rounded-sm p-3 mb-2 ">
        <span className="font-bold">ناشر و پارامترهای بازارگردانی</span>
        <div className="grid grid-cols-12 gap-4 mt-4">
          <SymbolModal
            className="col-span-3"
            data={symbolList}
            onChange={(pageNo: number, text: string) =>
              getSymbolList(text, pageNo)
            }
            onSubmit={onSubmitInstrument}
            defaultValue={instrument}
            type="check"
            required
            error={instrumentError}
          />

          <CheckList
            className="col-span-3"
            label="بازارگردان"
            data={FundList?.items}
            showKey="fundName"
            idKey="fundId"
            max={2}
            onChange={(value: any) => onChange('selectedFund', value)}
            value={selectedFund}
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
              label="تا تاریخ "
              value={toDate}
              onChange={(value: any) => onChange('toDate', value)}
              onClearDate={() => onChange('toDate', '')}
            />
          </div>

          <CheckList
            className="col-span-3"
            label="نوع پارامتر"
            data={parameterTypeList}
            showKey="value"
            idKey="key"
            max={2}
            onChange={(value: any) => onChange('parameterType', value)}
            value={parameterType}
            required
            error={parameterTypeError}
          />
        </div>
        <div className="flex justify-end">
          <Button
            className="border border-green text-green w-[115px] ml-2"
            onClick={() => onSearch(true)}
          >
            فایل کلی اکسل
          </Button>
          <Button
            className="bg-blue text-white w-[115px]"
            onClick={() => onSearch(false)}
          >
            جستجو
          </Button>
        </div>
      </div>

      {reportList?.items.map((item: any) => {
        return (
          <div className="mt-8">
            <span className="bg-[#e9eaff] font-bold px-8 rounded">
              {item.symbolName}
            </span>

            <NestedTable
              data={item?.insrumentParameterAndInstrumentParameterTemps}
              childColumns={childTableHeader}
              columns={tableHeader}
              childKey="insrumentParameterMarketMakers"
              wrapperClassName="!mt-4"
              scroll={{ x: 'calc(700px + 50%)' }}
              childClassName="w-full"
              pageSize={10}
            />
          </div>
        );
      })}
    </>
  );
}

export default withAlert(ParameterReport);
