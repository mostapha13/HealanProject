/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import {
  Button,
  TextField,
  Upload,
  CheckList,
  Modal,
  NewSelectSearch,
} from '@tse/components/atoms';
import { SymbolModal, Table, InvestorModal } from '@tse/components/organism';
import { DatePicker } from '@tse/components/molecules';
import { useEffect, useStates, useNavigate, useSearchParams } from '@tse/utils';
import { convertDateToJalali, downloadFile, separator } from '@tse/tools';
import {
  getFundList,
  getInstrumentList,
  getMarketMakerInstrumentItem,
  getMarketMakerInstrumentItemExportToExcel,
  getMarketMakerInstrumentParameterExportToExcel,
  getMarketMakerInstrumentTemp,
} from '../../../../Controller';
import withAlert from '../../../../hoc/withAlert';
import { HeaderTypes } from '@tse/types';
import { Radio } from 'antd';

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
    dataIndex: 'startDate',
    key: 'startDate',
    className: 'col-span-1',
    render: (item: any) => <span>{convertDateToJalali(item)}</span>,
  },
  {
    title: 'تا تاریخ',
    dataIndex: 'endDate',
    key: 'endDate',
    className: 'col-span-1',
    render: (item: any) => <span>{convertDateToJalali(item)}</span>,
  },
  {
    title: 'کارگزار',
    dataIndex: 'brokerName',
    key: 'brokerName',
    className: 'col-span-1',
  },
  {
    title: 'بازارگردان',
    dataIndex: 'fundName',
    key: 'fundName',
    className: 'col-span-2',
  },
];
const tableHeader2: HeaderTypes[] = [
  {
    title: 'نماد',
    dataIndex: 'symbol',
    key: 'symbol',
    className: 'col-span-2',
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
];
const initialState = {
  typeId: true,
  symbolList: [],
  instrument: null,
  instrumentId: '',
  tableData: [],
  fundList: [],
  selectedFund: null,
  tableData2: [],
  isShowTable: false,
};
const typeList = [
  {
    id: true,
    name: 'جاری',
  },
  {
    id: false,
    name: 'آرشیو',
  },
];

function InstrumentMarketMaker({ onAlert }: any) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useStates<any>(initialState);
  const {
    typeId,
    symbolList,
    instrument,
    instrumentId,
    tableData,
    instrumentError,
    fundList,
    selectedFund,
    tableData2,
    isShowTable,
  } = state;

  useEffect(() => {
    getSymbolList('', 1);
    getFund('', 1);
    getMarketMakerInstrumentItemData(1, '', '', true);
    // getMarketMakerInstrumentTempData(1);
  }, []);
  useEffect(() => {
    getMarketMakerInstrumentItemData(1, instrumentId, selectedFund, typeId);
  }, [typeId]);

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
  const getMarketMakerInstrumentItemData = (
    pageNo: number,
    instrumentId?: string,
    fundId?: string,
    typeId?: boolean
  ) => {
    const data = {
      InstrumentId: instrumentId,
      FundId: fundId,
      IsActive: typeId,
      PageNumber: pageNo,
      PageSize: 10,
    };
    getMarketMakerInstrumentItem({
      data,
      onSuccess: (res: any) => {
        setState({ tableData: res });
      },
      onFail,
    });
  };
  const getMarketMakerInstrumentTempData = (
    pageNo: number,
    instrumentId?: string,
    fundId?: string
  ) => {
    const data = {
      InstrumentId: instrumentId,
      FundId: fundId,
      PageNumber: pageNo,
      PageSize: 10,
    };
    getMarketMakerInstrumentTemp({
      data,
      onSuccess: (res: any) => {
        setState({ tableData2: res });
      },
      onFail,
    });
  };
  const onChangePageFirstTable = (pageNo: number) => {
    getMarketMakerInstrumentItemData(
      pageNo,
      instrumentId,
      selectedFund?.fundId,
      typeId
    );
  };
  const onChangePageSecondTable = (pageNo: number) => {
    getMarketMakerInstrumentTempData(
      pageNo,
      instrumentId,
      selectedFund?.fundId
    );
  };
  const onReportClick = () => {
    // setState({ isShowTable: true });
    getMarketMakerInstrumentItemData(
      1,
      instrumentId,
      selectedFund?.fundId,
      typeId
    );
    if (instrument != null) {
      getMarketMakerInstrumentTempData(1, instrumentId, selectedFund?.fundId);
    }
  };
  const onRemoveFilter = () => {
    setState({
      instrument: null,
      instrumentId: '',
      selectedFund: { fundId: '', fundName: '' },
      typeId: true,
      tableData2: [],
      // isShowTable: false,
    });
    getMarketMakerInstrumentItemData(1, '', '', true);
    // getMarketMakerInstrumentTempData(1);
  };
  const getInstrumentItemExportToExcel = () => {
    const data = {
      InstrumentId: instrumentId,
      FundId: selectedFund?.fundId,
      IsActive: typeId,
    };
    getMarketMakerInstrumentItemExportToExcel({
      data,
      onSuccess: downloadExcelFile,
      onFail,
    });
    // if (!typeId) {
    //   setState({ instrumentError: false });
    //   getMarketMakerInstrumentItemExportToExcel({
    //     data,
    //     onSuccess: downloadExcelFile,
    //     onFail,
    //   });
    // } else {
    //   if (instrument) {
    //     getMarketMakerInstrumentItemExportToExcel({
    //       data,
    //       onSuccess: downloadExcelFile,
    //       onFail,
    //     });
    //   } else {
    //     setState({ instrumentError: true });
    //   }
    // }
  };
  const downloadExcelFile = (file: any) => {
    downloadFile(file, 'reportInstrumentItem.xlsx');
  };
  const pageTitle = 'گزارش نماد دارای بازارگردان';

  return (
    <>
      <div className="shadow-[0_0px_4px_rgba(0,0,0,0.2)] rounded-sm p-3">
        <span className="font-bold">{pageTitle}</span>
        <div className="col-span-12 mt-4">
          <Radio.Group
            onChange={(e) => setState({ typeId: e.target.value })}
            value={typeId}
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
          <div className=" col-span-6 flex justify-end">
            <Button
              className="border border-green text-green w-[115px] "
              onClick={getInstrumentItemExportToExcel}
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
              onClick={onReportClick}
            >
              گزارش
            </Button>
          </div>
        </div>
        {/* {isShowTable && ( */}
        <div className="my-4">
          <span className="col-span-12 font-bold ">پارامتر ثابت</span>
          <Table
            data={tableData?.items}
            columns={tableHeader}
            className="col-span-12 grid grid-cols-12 "
            wrapperClassName="!mt-4"
            scroll={{ x: 'calc(500px + 50%)' }}
            onChangePage={onChangePageFirstTable}
            totalPages={tableData?.totalPages}
            pageSize={10}
          />
        </div>
        {/* )} */}
        {tableData2?.items != undefined && (
          <div className="my-4">
            <span className="col-span-12 font-bold ">پارامتر موقت</span>
            <Table
              data={tableData2?.items}
              columns={tableHeader2}
              className="col-span-12 grid grid-cols-12 "
              wrapperClassName="!mt-4"
              scroll={{ x: 'calc(500px + 50%)' }}
              onChangePage={onChangePageSecondTable}
              totalPages={tableData2?.totalPages}
              pageSize={10}
            />
          </div>
        )}
      </div>
    </>
  );
}

export default withAlert(InstrumentMarketMaker);
