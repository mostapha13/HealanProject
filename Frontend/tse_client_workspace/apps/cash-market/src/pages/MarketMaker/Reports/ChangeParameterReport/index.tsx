/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import {
  Button,
  TextField,
  Upload,
  CheckList,
  Modal,
  NewSelectSearch,
  Dropdown,
} from '@tse/components/atoms';
import { SymbolModal, Table, InvestorModal } from '@tse/components/organism';
import { DatePicker } from '@tse/components/molecules';
import { useEffect, useStates, useNavigate, useSearchParams } from '@tse/utils';
import { convertDateToJalali, downloadFile, separator } from '@tse/tools';
import {
  getFundList,
  getInstrumentList,
  getMarketMakerChangeParameterTemp,
  getMarketMakerChangeParameterTempExportToExcel,
  getMarketMakerChangeParameterTempInstrument,
  getMarketMakerChangeParameterTempInstrumentExportToExcel,
} from '../../../../Controller';
import withAlert from '../../../../hoc/withAlert';
import { HeaderTypes } from '@tse/types';
import { Radio } from 'antd';

const tableHeaderFund: HeaderTypes[] = [
  {
    title: 'نماد',
    dataIndex: 'symbol',
    key: 'symbol',
    className: 'col-span-1',
    render: (item: any) => <span>{item}</span>,
  },
  {
    title: 'نام شرکت',
    dataIndex: 'companyName',
    key: 'companyName',
    className: 'col-span-1 overflow-hidden',
    render: (item: any) => <span>{item}</span>,
  },
  {
    title: 'حداقل حجم معامله روزانه',
    dataIndex: 'minValue',
    key: 'minValue',
    className: 'col-span-1',
    render: (item: any) => <span>{separator(item)}</span>,
  },
  {
    title: 'حداقل حجم قابل سفارش انباشته',
    dataIndex: 'maxOrder',
    key: 'maxOrder',
    className: 'col-span-1',
    render: (item: any) => <span>{separator(item)}</span>,
  },
  {
    title: 'دامنه مظنه',
    dataIndex: 'tolerance',
    key: 'tolerance',
    className: 'col-span-1',
  },
  {
    title: 'طبقه نقد شوندگی',
    dataIndex: 'liquidity',
    key: 'liquidity',
    className: 'col-span-1',
  },
  {
    title: 'از تاریخ',
    dataIndex: 'fromDate',
    key: 'fromDate',
    className: 'col-span-1',
    render: (item: any) => <span>{convertDateToJalali(item)}</span>,
  },
  {
    title: 'تا تاریخ',
    dataIndex: 'toDate',
    key: 'toDate',
    className: 'col-span-1',
    render: (item: any) => <span>{convertDateToJalali(item)}</span>,
  },

  {
    title: 'بازارگردان',
    dataIndex: 'fundName',
    key: 'fundName',
    className: 'col-span-2',
  },
  {
    title: 'نوع تغییر موقت',
    dataIndex: 'typeName',
    key: 'typeName',
    className: 'col-span-1',
    render: (item: any, record: any) =>
      record?.typeId == 0 ? (
        <div>
          <span className="text-[#FF6E04]">{item}</span>
        </div>
      ) : record?.typeId == 1 ? (
        <div>
          <span className="text-red">{item}</span>
        </div>
      ) : record?.typeId == 2 ? (
        <div>
          <span className="text-green">{item}</span>
        </div>
      ) : record?.typeId == 3 ? (
        <div>
          <span className="text-[#780065]">{item}</span>
        </div>
      ) : null,
  },
];
const tableHeaderSymbol: HeaderTypes[] = [
  {
    title: 'نماد',
    dataIndex: 'symbol',
    key: 'symbol',
    className: 'col-span-1',
    render: (item: any) => <span>{item}</span>,
  },
  {
    title: 'نام شرکت',
    dataIndex: 'companyName',
    key: 'companyName',
    className: 'col-span-2 overflow-hidden',
    render: (item: any) => <span>{item}</span>,
  },
  {
    title: 'حداقل حجم معامله روزانه',
    dataIndex: 'minValue',
    key: 'minValue',
    className: 'col-span-1',
    render: (item: any) => <span>{separator(item)}</span>,
  },
  {
    title: 'حداقل حجم قابل سفارش انباشته',
    dataIndex: 'maxOrder',
    key: 'maxOrder',
    className: 'col-span-2',
    render: (item: any) => <span>{separator(item)}</span>,
  },
  {
    title: 'دامنه مظنه',
    dataIndex: 'tolerance',
    key: 'tolerance',
    className: 'col-span-1',
  },
  {
    title: 'طبقه نقد شوندگی',
    dataIndex: 'liquidity',
    key: 'liquidity',
    className: 'col-span-1',
  },
  {
    title: 'از تاریخ',
    dataIndex: 'fromDate',
    key: 'fromDate',
    className: 'col-span-1',
    render: (item: any) => <span>{convertDateToJalali(item)}</span>,
  },
  {
    title: 'تا تاریخ',
    dataIndex: 'toDate',
    key: 'toDate',
    className: 'col-span-1',
    render: (item: any) => <span>{convertDateToJalali(item)}</span>,
  },
  {
    title: 'نوع تغییر موقت',
    dataIndex: 'typeName',
    key: 'typeName',
    className: 'col-span-1',
    render: (item: any, record: any) =>
      record?.typeId == 0 ? (
        <div>
          <span className="text-[#FF6E04]">{item}</span>
        </div>
      ) : record?.typeId == 1 ? (
        <div>
          <span className="text-red">{item}</span>
        </div>
      ) : record?.typeId == 2 ? (
        <div>
          <span className="text-green">{item}</span>
        </div>
      ) : record?.typeId == 3 ? (
        <div>
          <span className="text-[#780065]">{item}</span>
        </div>
      ) : null,
  },
];
const initialState = {
  baseOnID: 'symbol',
  symbolList: [],
  instrument: null,
  instrumentId: '',
  tableData: [],
  fundList: [],
  selectedFund: null,
  changeTypeValue: '',
  fromDate: '',
  toDate: '',
  pageNo: 1,
};
const typeList = [
  {
    id: 'symbol',
    name: 'براساس نماد',
  },
  {
    id: 'fund',
    name: 'براساس بازارگردان',
  },
];
const changeType = [
  {
    value: 'موقت',
    key: 0,
  },
  {
    value: 'کاهش',
    key: 1,
  },
  {
    value: 'افزایش',
    key: 2,
  },
  {
    value: 'طبقه نقدشوندگی',
    key: 3,
  },
];

function ChangeParameterReport({ onAlert }: any) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useStates<any>(initialState);
  const {
    baseOnID,
    symbolList,
    instrument,
    instrumentId,
    tableData,
    instrumentError,
    fundList,
    selectedFund,
    changeTypeValue,
    fromDate,
    toDate,
    pageNo,
  } = state;

  useEffect(() => {
    getSymbolList('', 1);
    getFund('', 1);
    getMarketMakerChangeParameterTempInstrumentData(1);
  }, []);
  useEffect(() => {
    if (baseOnID == 'symbol') {
      getMarketMakerChangeParameterTempInstrumentData(pageNo);
    } else {
      getMarketMakerChangeParameterTempData(pageNo);
    }
  }, [baseOnID]);

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
  const getFund = (text: string, pageNo: number) => {
    const data = {
      FundName: text,
      PageNumber: pageNo,
    };
    getFundList({ data, onSuccess: onSuccessBroker, onFail });
  };

  const onSuccessBroker = (res: any) => {
    setState({
      fundList: res,
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
  const getMarketMakerChangeParameterTempData = (pageNo: number) => {
    const data = {
      InstrumentId: instrumentId,
      FundId: selectedFund?.fundId,
      TypeId: changeTypeValue?.key,
      FromDate: fromDate,
      ToDate: toDate,
      PageNumber: pageNo,
      PageSize: 10,
    };
    getMarketMakerChangeParameterTemp({
      data,
      onSuccess: (res: any) => {
        setState({ tableData: res });
      },
      onFail,
    });
  };
  const getMarketMakerChangeParameterTempExportToExcelData = () => {
    const data = {
      InstrumentId: instrumentId,
      FundId: selectedFund?.fundId,
      TypeId: changeTypeValue?.key,
      FromDate: fromDate,
      ToDate: toDate,
    };
    getMarketMakerChangeParameterTempExportToExcel({
      data,
      onSuccess: downloadExcelFile,
      onFail,
    });
  };
  const getMarketMakerChangeParameterTempInstrumentData = (pageNo: number) => {
    const data = {
      InstrumentId: instrumentId,
      TypeId: changeTypeValue?.key,
      FromDate: fromDate,
      ToDate: toDate,
      PageNumber: pageNo,
      PageSize: 10,
    };
    getMarketMakerChangeParameterTempInstrument({
      data,
      onSuccess: (res: any) => {
        setState({ tableData: res });
      },
      onFail,
    });
  };
  const getMarketMakerChangeParameterTempInstrumentExportToExcelData = () => {
    const data = {
      InstrumentId: instrumentId,
      TypeId: changeTypeValue?.key,
      FromDate: fromDate,
      ToDate: toDate,
    };
    getMarketMakerChangeParameterTempInstrumentExportToExcel({
      data,
      onSuccess: downloadExcelFile,
      onFail,
    });
  };
  const onChangePage = (pageNum: number) => {
    if (baseOnID == 'symbol') {
      getMarketMakerChangeParameterTempInstrumentData(pageNum);
    } else {
      getMarketMakerChangeParameterTempData(pageNum);
    }
  };

  const onFilterClick = () => {
    if (baseOnID == 'symbol') {
      getMarketMakerChangeParameterTempInstrumentData(pageNo);
    } else {
      getMarketMakerChangeParameterTempData(pageNo);
    }
  };
  const onRemoveFilter = () => {
    setState({
      instrument: null,
      instrumentId: '',
      selectedFund: { fundId: '', fundName: '' },
      baseOnID: 'symbol',
      fromDate: null,
      toDate: null,
      changeTypeValue: '',
      pageNo: 1,
    });
    getMarketMakerChangeParameterTempInstrumentData(1);
  };
  const exportExcel = () => {
    if (baseOnID == 'symbol') {
      getMarketMakerChangeParameterTempInstrumentExportToExcelData();
    } else {
      getMarketMakerChangeParameterTempExportToExcelData();
    }
  };
  const downloadExcelFile = (file: any) => {
    downloadFile(file, `reportChangeParameter${baseOnID}.xlsx`);
  };
  const onChange = (key: string, value: any) => {
    setState({
      [key]: value,
    });
  };
  const pageTitle = 'گزارش تغییر پارامتر بازارگردانی';

  return (
    <>
      <div className="shadow-[0_0px_4px_rgba(0,0,0,0.2)] rounded-sm p-3">
        <span className="font-bold">{pageTitle}</span>
        <div className="col-span-12 mt-4">
          <Radio.Group
            onChange={(e) =>
              setState({ baseOnID: e.target.value, tableData: [] })
            }
            value={baseOnID}
            style={{ marginBottom: 10, width: '100%', marginTop: 10 }}
          >
            {typeList.map((item: any) => (
              <Radio className="text-extratiny font-bold" value={item.id}>
                {item.name}
              </Radio>
            ))}
          </Radio.Group>
        </div>
        <div className="grid grid-cols-12 gap-4 mt-8 mb-6">
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
          <Dropdown
            className="col-span-3"
            label="نوع تغییر"
            data={changeType}
            showKey="value"
            value={changeTypeValue}
            onChange={(e: any) => setState({ changeTypeValue: e })}
          />
          {baseOnID == 'fund' && (
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
              data={fundList?.items}
              showKey="fundName"
            />
          )}
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
          <div className=" col-span-12 flex justify-end">
            <Button
              className="border border-green text-green w-[115px] "
              onClick={exportExcel}
            >
              خروجی اکسل
            </Button>
            <Button
              className="border-blue border bg-white  text-blue w-[115px] mr-4 "
              onClick={onRemoveFilter}
            >
              حذف فیلتر
            </Button>
            <Button
              className="border-blue border bg-blue  text-white w-[115px] mr-4 "
              onClick={onFilterClick}
            >
              جستجو
            </Button>
          </div>
        </div>
        <div className="my-4">
          <Table
            data={tableData?.items}
            columns={baseOnID == 'symbol' ? tableHeaderSymbol : tableHeaderFund}
            className="col-span-12 grid grid-cols-12 "
            wrapperClassName="!mt-4"
            scroll={{ x: 'calc(500px + 50%)' }}
            onChangePage={onChangePage}
            totalPages={tableData?.totalPages}
            pageSize={10}
          />
        </div>
      </div>
    </>
  );
}

export default withAlert(ChangeParameterReport);
