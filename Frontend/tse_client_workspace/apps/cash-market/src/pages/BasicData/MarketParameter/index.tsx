/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import {
  TextField,
  Button,
  Icon,
  Collapse,
  TimePickerInput,
  TreeTable,
  NestedTable,
  getColumnSearchProps,
} from '@tse/components/atoms';
import { SymbolModal, Table } from '@tse/components/organism';
import { SearchInput, DatePicker } from '@tse/components/molecules';
import { useEffect, useStates } from '@tse/utils';
import {
  getParameterTypeList,
  getInstrumentList,
  getInstrumentParameterTempList,
  saveInstrumentParameterTemp,
} from '../../../Controller';
import withAlert from '../../../hoc/withAlert';
import { HeaderTypes } from '@tse/types';
import {
  convertDateToJalali,
  separator,
  convertDateToJalaliHour,
  convertDateAndTimeJalali,
} from '@tse/tools';

const initialState = {
  typeList: [],
  symbolList: [],
  minValue: '',
  maxOrder: '',
  tolerance: '',
  parameterChangeType: null,
  instrument: null,
  parameterList: null,
  selectedParameter: null,
  minValueError: false,
  maxOrderError: false,
  toleranceError: false,
  instrumentError: false,
  oscillation: '',
  liquidity: '',
  oscillationError: false,
  liquidityError: false,
  fromDate: '',
  toDate: '',
  fromTime: '',
  toTime: '',
  fromDateError: false,
  toDateError: false,
  fromTimeError: false,
  toTimeError: false,
  selectedItems: [],
  expanded: false,
  searchInput: '',
};

function MarketParameter({ onAlert }: any) {
  const [state, setState] = useStates<any>(initialState);
  const {
    symbolList,
    minValue,
    maxOrder,
    tolerance,
    parameterChangeType,
    instrument,
    parameterList,
    selectedParameter,
    minValueError,
    maxOrderError,
    toleranceError,
    instrumentError,
    oscillation,
    liquidity,
    oscillationError,
    liquidityError,
    fromDate,
    toDate,
    fromTime,
    toTime,
    fromDateError,
    toDateError,
    fromTimeError,
    toTimeError,
    selectedItems,
    expanded,
    searchInput,
  } = state;

  const tableHeader: HeaderTypes[] = [
    {
      title: 'نام نماد',
      dataIndex: 'orderDetail',
      key: 'orderDetail',
      width: 100,
      className: 'overflow-hidden',
      render: (item: any) => (
        <span>{item?.instrumentParameter?.instrument?.symbolName}</span>
      ),
      fixed: 'left',
      // ...getColumnSearchProps('', (e: string) => getParameterList(1, e, '')),
    },
    {
      title: 'نام بازارگردان',
      dataIndex: 'marketMakerUser',
      key: 'marketMakerUser',
      width: 140,
      render: (item: any) => (
        <span>{`${item.firstName} ${item.lastName}`}</span>
      ),
      // ...getColumnSearchProps('', (e: string) => getParameterList(1, '', e)),
    },
    {
      title: 'تاریخ شروع بازارگردانی',
      dataIndex: 'orderDetail',
      key: 'orderDetail',
      width: 150,
      render: (item: any) => (
        <span>{convertDateToJalali(item?.startDate)}</span>
      ),
    },
    {
      title: 'تاریخ پایان بازارگردانی',
      dataIndex: 'orderDetail',
      key: 'orderDetail',
      width: 150,
      render: (item: any) => (
        <span>{convertDateToJalali(item?.startDate)}</span>
      ),
    },
    {
      title: 'حداقل حجم معامله',
      dataIndex: 'orderDetail',
      key: 'orderDetail',
      width: 150,
      render: (item: any) => (
        <span>{separator(item?.instrumentParameter?.minValue)}</span>
      ),
    },
    {
      title: 'سفارش انباشته',
      dataIndex: 'orderDetail',
      key: 'orderDetail',
      width: 150,
      render: (item: any) => (
        <span>{separator(item?.instrumentParameter?.maxOrder)}</span>
      ),
    },
    {
      title: 'دامنه مظنه',
      dataIndex: 'orderDetail',
      key: 'orderDetail',
      width: 120,
      render: (item: any) => (
        <span>{item?.instrumentParameter?.tolerance}</span>
      ),
    },

    {
      title: 'دامنه نوسان',
      dataIndex: 'orderDetail',
      key: 'orderDetail',
      width: 120,
      render: (item: any) => (
        <span>{item?.instrumentParameter?.oscillation}</span>
      ),
    },
    {
      title: 'طبقه نقدشوندگی',
      dataIndex: 'orderDetail',
      key: 'orderDetail',
      width: 120,
      render: (item: any) => (
        <span>{separator(item?.instrumentParameter?.liquidity)}</span>
      ),
    },
    {
      title: 'از تاریخ/از ساعت',
      dataIndex: 'orderDetail',
      key: 'orderDetail',
      width: 150,
      render: (item: any) => (
        <span>
          {convertDateAndTimeJalali(item?.instrumentParameter?.fromDate)}
        </span>
      ),
    },
  ];

  const childTableHeader: HeaderTypes[] = [
    {
      title: '',
      width: 7,
      className: '!bg-[#e9eaff]',
    },
    {
      title: 'نوع پارامتر',
      width: 100,
      render: () => <span>موقت</span>,
    },
    {
      title: 'حداقل حجم معامله',
      dataIndex: 'minValue',
      key: 'minValue',
      width: 120,
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'سفارش انباشته',
      dataIndex: 'maxOrder',
      key: 'maxOrder',
      width: 120,
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
      render: (item: any) => <span>{item}</span>,
    },
    {
      title: 'طبقه نقدشوندگی',
      dataIndex: 'liquidity',
      key: 'liquidity',
      width: 80,
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'از تاریخ/از ساعت',
      dataIndex: 'fromDate',
      key: 'fromDate',
      width: 80,
      render: (item: any) => <span>{convertDateAndTimeJalali(item)}</span>,
    },
    {
      title: 'تا تاریخ/تا ساعت',
      dataIndex: 'toDate',
      key: 'toDate',
      width: 100,
      render: (item: any) => <span>{convertDateAndTimeJalali(item)}</span>,
    },
  ];

  const isCapitalIncrease = parameterChangeType === 'CapitalIncrease';

  useEffect(() => {
    getTypeList();
    getSymbolList('', 1);
    getParameterList(1, '', '');
  }, []);

  const getParameterList = (
    pageNo: number,
    InstrumentName: string,
    MarketMakerName: string
  ) => {
    const data = {
      InstrumentName,
      MarketMakerName,
      PageNumber: pageNo,
      PageSize: 10,
    };
    getInstrumentParameterTempList({
      data,
      onSuccess: onSuccessParameterList,
      onFail,
    });
  };

  const onSuccessParameterList = (value: any) => {
    const newData: any = [];
    value.items?.map((item: any, i: number) => {
      newData.push({ key: i + 1, ...item });
    });
    setState({
      parameterList: { ...value, items: newData },
    });
  };

  const getTypeList = () => {
    getParameterTypeList({ onSuccess: onSuccessTypeList, onFail });
  };

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

  const onSuccessTypeList = (list: any) => {
    setState({
      typeList: list,
      parameterChangeType: list[0].parameterChangeTypeId,
    });
  };

  const onFail = (error: any) => {
    onAlert(error);
  };

  const onChange = (value: string, key: string) => {
    const errorKey = `${key}Error`;
    setState({
      [key]: value,
      [errorKey]: false,
    });
  };

  const saveParameter = (isEdit: boolean) => {
    const isToDate = isCapitalIncrease ? true : toDate && toTime;
    if (
      minValue &&
      maxOrder &&
      tolerance &&
      oscillation &&
      liquidity &&
      fromDate &&
      fromTime &&
      isToDate
    ) {
      const data = {
        orderIds: selectedItems,
        isEdit,
        minValue: Number(minValue),
        maxOrder: Number(maxOrder),
        tolerance: Number(tolerance),
        oscillation: oscillation,
        liquidity: liquidity,
        fromDate: `${fromDate}T${fromTime}:00`,
        toDate: `${toDate}T${toTime}:00`,
      };
      saveInstrumentParameterTemp({ data, onSuccess: onSuccessSave, onFail });
    } else {
      setState({
        ...(!tolerance && { toleranceError: true }),
        ...(!maxOrder && { maxOrderError: true }),
        ...(!minValue && { minValueError: true }),
        ...(!oscillation && { oscillationError: true }),
        ...(!liquidity && { liquidityError: true }),
        ...(!fromDate && { fromDateError: true }),
        ...(!toDate && { toDateError: true }),
        ...(!fromTime && { fromTimeError: true }),
        ...(!toTime && { toTimeError: true }),
      });
    }
  };

  const onSuccessSave = () => {
    setState({
      minValue: '',
      maxOrder: '',
      tolerance: '',
      oscillation: '',
      liquidity: '',
      fromDate: '',
      toDate: '',
      fromTime: '',
      toTime: '',
      instrument: null,
    });
    getParameterList(1, '', '');
  };

  const onChangePage = (pageNo: number) => {
    getParameterList(pageNo, '', '');
  };

  const onSelect = (selectedRowKeys: any, selectedRows: any) => {
    const itemKeys: any = [];
    selectedRows?.map((item: any) => itemKeys.push(item.orderDetail.orderId));
    const isEmptyList = itemKeys.length ? true : false;
    setState({
      selectedItems: itemKeys,
      expanded: isEmptyList,
    });
  };
  const rowSelection: any = {
    selectedItems,
    onChange: onSelect,
  };

  return (
    <>
      <Collapse
        className="shadow-[0_0px_4px_rgba(0,0,0,0.2)] rounded-sm p-1 mb-3"
        title="تغییر موقت پارامترهای بازارگردانی"
        expanded={expanded}
      >
        <div>
          <div className="grid grid-cols-12 gap-4 mt-2 mb-2">
            <TextField
              className="col-span-3"
              label="حداقل حجم معامله"
              value={separator(minValue)}
              type="numeric"
              onChange={(value) => onChange(value, 'minValue')}
              error={minValueError}
            />
            <TextField
              className="col-span-3"
              label="سفارش انباشته"
              value={maxOrder}
              type="numeric"
              onChange={(value) => onChange(value, 'maxOrder')}
              error={maxOrderError}
            />
            <TextField
              className="col-span-3"
              label="دامنه مظنه"
              value={tolerance}
              type="numeric"
              onChange={(value) => onChange(value, 'tolerance')}
              error={toleranceError}
            />
            <TextField
              className="col-span-3"
              label="دامنه نوسان"
              value={oscillation}
              type="numeric"
              onChange={(value) => onChange(value, 'oscillation')}
              error={oscillationError}
            />
            <TextField
              className="col-span-3"
              label="طبقه نقدشوندگی"
              value={liquidity}
              type="numeric"
              onChange={(value) => onChange(value, 'liquidity')}
              error={liquidityError}
            />
            <div className="col-span-3">
              <DatePicker
                parentClassName="!w-[85%]"
                label="از تاریخ *"
                value={fromDate}
                onChange={(value: any) => onChange(value, 'fromDate')}
                error={fromDateError}
              />
            </div>

            <TimePickerInput
              className="col-span-3"
              label="از ساعت"
              value={fromTime}
              onChange={(value: any) => onChange(value, 'fromTime')}
              required
              error={fromTimeError}
            />

            <div className="col-span-3">
              <DatePicker
                parentClassName="!w-[85%]"
                label="تا تاریخ  *"
                value={toDate}
                onChange={(value: any) => onChange(value, 'toDate')}
                error={toDateError}
              />
            </div>

            <TimePickerInput
              className="col-span-3"
              label="تا ساعت"
              value={toTime}
              onChange={(value: any) => onChange(value, 'toTime')}
              error={toTimeError}
            />
          </div>
        </div>

        <div className="flex w-full justify-end">
          <Button
            className=" border border-red text-red w-[115px] mr-4"
            onClick={() => saveParameter(true)}
          >
            تصحیح پارامتر
          </Button>
          <Button
            className="bg-blue text-white w-[115px] mr-4"
            onClick={() => saveParameter(false)}
          >
            ثبت
          </Button>
        </div>
      </Collapse>
      <div className="col-span-12 grid grid-cols-12 mt-8">
        <TextField
          className="2xl:col-span-3 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
          label="جستجو بر اساس نام نماد"
          value={searchInput}
          onChange={(value) => {
            onChange(value, 'searchInput');
            getParameterList(1, value, '');
          }}
        />
      </div>
      <NestedTable
        data={parameterList?.items}
        childColumns={childTableHeader}
        columns={tableHeader}
        childKey="instrumentParameterTemps"
        className=""
        wrapperClassName="!mt-4"
        scroll={{ x: 'calc(700px + 50%)' }}
        rowSelection={rowSelection}
        onChangePage={onChangePage}
        totalPages={parameterList?.totalPages}
        pageSize={10}
      />
    </>
  );
}

export default withAlert(MarketParameter);
