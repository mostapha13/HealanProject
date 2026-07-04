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
import {
  getInstrumentList,
  getMarketMakerInstrumentParameter,
  getMarketMakerInstrumentParameterExportToExcel,
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
    className: 'col-span-2 overflow-hidden',
    render: (item: any) => <span>{item}</span>,
  },
  {
    title: 'حداقل حجم معامله روزانه',
    dataIndex: 'minValue',
    key: 'minValue',
    className: 'col-span-2',
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

function ParameterReport({ onAlert }: any) {
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
  } = state;

  useEffect(() => {
    getSymbolList('', 1);
    getMarketMakerInstrumentParameterData(1, '', true);
  }, []);
  useEffect(() => {
    getMarketMakerInstrumentParameterData(
      1,
      instrumentId ? instrumentId : '',
      typeId
    );
  }, [typeId, instrumentId]);

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
  const getMarketMakerInstrumentParameterData = (
    pageNo: number,
    instrumentId?: string,
    isActive?: boolean
  ) => {
    const data = {
      InstrumentId: instrumentId,
      IsActive: isActive,
      PageNumber: pageNo,
      PageSize: 10,
    };
    getMarketMakerInstrumentParameter({
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
    getMarketMakerInstrumentParameterData(pageNo, instrumentId, typeId);
  };
  const getInstrumentParameterExportToExcel = () => {
    const data = {
      InstrumentId: instrumentId,
      IsActive: typeId,
    };
    getMarketMakerInstrumentParameterExportToExcel({
      data,
      onSuccess: downloadExcelFile,
      onFail,
    });
  };
  const downloadExcelFile = (file: any) => {
    downloadFile(file, 'reportInstrumentParameter.xlsx');
  };
  const pageTitle = 'گزارش پارامتر بازارگردانی';

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
              className="border border-green text-green w-[115px] ml-2"
              onClick={getInstrumentParameterExportToExcel}
            >
              خروجی اکسل
            </Button>
            <Button
              className="border-blue border bg-white  text-blue w-[115px] mr-4"
              onClick={() => setState({ instrument: null, instrumentId: '' })}
            >
              حذف فیلتر
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

export default withAlert(ParameterReport);
