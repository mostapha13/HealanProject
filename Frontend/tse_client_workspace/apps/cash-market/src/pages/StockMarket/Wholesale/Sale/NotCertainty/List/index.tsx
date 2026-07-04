/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import { Button, TextField, Icon } from '@tse/components/atoms';
import { SymbolModal, Table } from '@tse/components/organism';
import { DatePicker } from '@tse/components/molecules';
import { useEffect, useStates, useNavigate, useState } from '@tse/utils';
import { getInstrumentList } from 'apps/cash-market/src/Controller';
import withAlert from 'apps/cash-market/src/hoc/withAlert';
import { convertDateToJalali, separator } from '@tse/tools';
import { Radio } from 'antd';
import type { RadioChangeEvent } from 'antd';
import { HeaderTypes, TableOnChange } from '@tse/types';
import {
  getWholesaleByBroker,
  getWholesaleNow,
  getWholeSaleType,
} from 'apps/cash-market/src/Controller/StockMarket/WholeSale';
import NewSelect from 'apps/cash-market/src/components/atoms/NewSelect';

const tableHeader: HeaderTypes[] = [
  {
    title: 'نماد',
    dataIndex: 'symbol',
    key: 'symbol',
    className: 'col-span-1',
  },
  {
    title: 'نام شرکت',
    dataIndex: 'symbolName',
    key: 'symbolName',
    className: 'col-span-2',
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
    className: 'col-span-1',
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
    className: 'col-span-2',
  },
  {
    title: 'درخواست عدم قطعیت معامله',
    dataIndex: 'instrumentName',
    key: 'instrumentName',
    className: 'col-span-2 !justify-center',
    render: (item: any, record: any) => (
      <a href={`transaction/not-certainty-request?id=${record?.orderId}`}>
        <Icon name="icon-refund" classname="text-lg text-black" />
      </a>
    ),
  },
];

const initialState = {
  symbolList: [],
  instrument: null,
  cardBoardList: [],
  TrackingNumber: '',
  TradeDate: '',
  tableData: [],
  PageNumber: 1,
};

function NotCertaintyListSellWholesale({ onAlert }: any) {
  const PageSize = 10;
  const [state, setState] = useStates<any>(initialState);
  const {
    symbolList,
    instrument,
    cardBoardList,
    TrackingNumber,
    TradeDate,
    tableData,
    PageNumber,
  } = state;

  useEffect(() => {
    getSymbolList('', 1);
    getWholesaleByBrokerData(1, false);
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

  const onFail = (error: any) => {
    onAlert(error);
  };

  const onChange = (key: string, value: any) => {
    setState({
      [key]: value,
    });
  };

  const onChangePage = (pageNo: number) => {
    getWholesaleByBrokerData(pageNo, false);
    setState({ PageNumber: pageNo });
  };

  const getWholesaleByBrokerData = (
    PageNumber?: any,
    isRemoveFilter?: boolean
  ) => {
    if (isRemoveFilter) {
      setState({
        instrument: null,
        TrackingNumber: '',
        TradeDate: '',
        PageNumber: 1,
      });
    }
    getWholesaleNow({
      data: isRemoveFilter
        ? {
            InstrumentId: '',
            TrackingNumber: '',
            TradeDate: '',
            PageNumber: 1,
            PageSize,
          }
        : {
            InstrumentId: instrument?.instrumentId
              ? instrument?.instrumentId
              : '',
            TrackingNumber,
            TradeDate,
            PageNumber,
            PageSize,
          },
      onSuccess: (res: any) => setState({ tableData: res }),
      onFail,
    });
  };

  return (
    <div className="border-2 border-lightGray w-full grid grid-cols-12 p-4 ">
      <div className=" col-span-12 items-start flex border-b-2 border-lightGray">
        <span className=" p-2 font-bold">قطعیت معامله</span>
      </div>
      <div className="grid grid-cols-12 col-span-12 gap-4 mt-8 mb-2">
        <SymbolModal
          className="col-span-3"
          data={symbolList}
          onChange={(pageNo: number, text: string) =>
            getSymbolList(text, pageNo)
          }
          onSubmit={(value: any) => onChange('instrument', value)}
          defaultValue={instrument}
        />
        <TextField
          className="col-span-3"
          label="شماره پیگیری"
          onChange={(value: string) => onChange('TrackingNumber', value)}
          value={TrackingNumber}
          type="number"
        />

        <div className="col-span-3 !z-10">
          <DatePicker
            parentClassName="!w-[85%] "
            label="تاریخ "
            onChange={(value: string) => onChange('TradeDate', value)}
            value={TradeDate}
            onClearDate={() => onChange('TradeDate', '')}
          />
        </div>
      </div>
      <div className="flex justify-end  col-span-12">
        <Button
          className="border border-blue text-blue w-[115px] ml-2"
          onClick={() => getWholesaleByBrokerData(1, true)}
        >
          حذف فیلتر
        </Button>
        <Button
          className="bg-blue text-white w-[115px]"
          onClick={() => getWholesaleByBrokerData(1)}
        >
          فیلتر
        </Button>
      </div>
      <div className="mt-4 col-span-12">
        <Table
          columns={tableHeader}
          className="col-span-12 grid grid-cols-12 "
          data={tableData?.items}
          onChangePage={onChangePage}
          totalPages={tableData?.totalPages}
          pageSize={PageSize}
          pageNumber={PageNumber}
          //   onChange={handleChangeTable}
        />
      </div>
    </div>
  );
}

export default withAlert(NotCertaintyListSellWholesale);
