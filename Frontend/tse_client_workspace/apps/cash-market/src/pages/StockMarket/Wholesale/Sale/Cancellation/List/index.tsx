/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import { Button, TextField, Icon } from '@tse/components/atoms';
import { SymbolModal, Table } from '@tse/components/organism';
import { DatePicker } from '@tse/components/molecules';
import { useEffect, useStates, useNavigate, useState } from '@tse/utils';
import { getInstrumentList } from 'apps/cash-market/src/Controller';
import withAlert from 'apps/cash-market/src/hoc/withAlert';
import { convertDateToJalali } from '@tse/tools';
import { Radio } from 'antd';
import type { RadioChangeEvent } from 'antd';
import { HeaderTypes, TableOnChange } from '@tse/types';
import {
  getCancellationWholesaleByBroker,
  getWholeSaleType,
} from 'apps/cash-market/src/Controller/StockMarket/WholeSale';
import NewSelect from 'apps/cash-market/src/components/atoms/NewSelect';

const tableHeader: HeaderTypes[] = [
  {
    title: 'نماد',
    dataIndex: 'symbol',
    key: 'symbol',
    className: 'col-span-3',
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
    className: 'col-span-2',
  },
  {
    title: 'شماره پیگیری',
    dataIndex: 'trackingNumber',
    key: 'trackingNumber',
    className: 'col-span-2',
  },
  {
    title: 'درخواست انصراف از فروش',
    dataIndex: 'instrumentName',
    key: 'instrumentName',
    className: 'col-span-2 !justify-center',
    render: (item: any, record: any) => (
      <a
        href={`stock/cancel-request-sell-wholesale?wholesaleInstrumentId=${record?.instrumentId}&wholesaleId=${record?.wholesaleId}&wholesaleOrderId=${record?.wholesaleOrderId}&wholesaleTypeId=${record?.wholesaleTypeId}`}
      >
        <Icon name="icon-enseraf" classname="text-lg text-black" />
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
  WholesaleTypeData: [],
  WholesaleTypeId: '',
  WholesaleTypeName: '',
};

function CanellationListSellWholesale({ onAlert }: any) {
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
    WholesaleTypeData,
    WholesaleTypeId,
    WholesaleTypeName,
  } = state;

  useEffect(() => {
    getSymbolList('', 1);
    getCancellationWholesaleByBrokerData(1, false);
    getWholesaleTypeData();
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
  const getWholesaleTypeData = () => {
    getWholeSaleType({
      onSuccess: (res: any) => setState({ WholesaleTypeData: res }),
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

  const onChangePage = (pageNo: number) => {
    getCancellationWholesaleByBrokerData(pageNo, false);
    setState({ PageNumber: pageNo });
  };

  const getCancellationWholesaleByBrokerData = (
    PageNumber?: any,
    isRemoveFilter?: boolean
  ) => {
    if (isRemoveFilter) {
      setState({
        instrument: null,
        TrackingNumber: '',
        TradeDate: '',
        PageNumber: 1,
        WholesaleTypeId: '',
      });
    }
    getCancellationWholesaleByBroker({
      data: isRemoveFilter
        ? {
            InstrumentId: '',
            TrackingNumber: '',
            TradeDate: '',
            PageNumber: 1,
            PageSize,
            WholesaleTypeId,
          }
        : {
            InstrumentId: instrument?.instrumentId
              ? instrument?.instrumentId
              : '',
            TrackingNumber,
            TradeDate,
            PageNumber,
            PageSize,
            WholesaleTypeId,
          },
      onSuccess: (res: any) => setState({ tableData: res }),
      onFail,
    });
  };

  return (
    <div className="border-2 border-lightGray w-full grid grid-cols-12 p-4 min-h-[500px]">
      <div className=" col-span-12 items-start flex border-b-2 border-lightGray">
        <span className=" p-2 font-bold">درخواست انصراف از فروش</span>
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
        <div className="2xl:col-span-3 xl:col-span-3 lg:col-span-3 md:col-span-12 col-span-3 mx-2">
          <NewSelect
            label="نوع فروش"
            className=" col-span-2"
            options={[{ name: '', id: '' }, ...WholesaleTypeData]}
            onChange={(value: any) => {
              setState({
                WholesaleTypeId: value,
                WholesaleTypeName: WholesaleTypeData.filter(
                  (item: any) => item?.id === value
                )?.[0]?.name,
              });
            }}
            showKey="name"
            selectedKey="id"
            // required
            value={WholesaleTypeId}
            // errorMessage={state?.wholesaleReturnReasonTypeIdError}
          />
        </div>
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
          onClick={() => getCancellationWholesaleByBrokerData(1, true)}
        >
          حذف فیلتر
        </Button>
        <Button
          className="bg-blue text-white w-[115px]"
          onClick={() => getCancellationWholesaleByBrokerData(1)}
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

export default withAlert(CanellationListSellWholesale);
