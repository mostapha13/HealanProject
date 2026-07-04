import { Button, Icon, Select, NestedTable } from '@tse/components/atoms';
import { DatePicker } from '@tse/components/molecules';
import { convertDateToJalali, downloadFile } from '@tse/tools';
import { HeaderTypes } from '@tse/types';
import { useEffect, useStates, useNavigate } from '@tse/utils';
import {
  getInstrumentOptionList,
  removeInstrumentOption,
  getInstrumentInfoByName,
  exportToExcelOption,
  exportWordOption,
  getInstrumentListOption,
} from '../../../Controller/Instrument';
import withAlert from '../../../hoc/withAlert';
import { Popconfirm } from 'antd';
import tse from '../../../assets/images/tse.png';
import tsetmc from '../../../assets/images/tsetmc.png';
import { EyeOutlined, FileWordOutlined } from '@ant-design/icons';
import { getInstrumentList } from 'apps/cash-market/src/Controller';
import { SymbolModal } from '@tse/components/organism';
import { InstrumetListModal } from 'apps/cash-market/src/components/atoms/InstrumentList';
import NewSelect from 'apps/cash-market/src/components/atoms/NewSelect';
interface listInterfaces {
  items: any[];
  totalPages: number;
}

interface initialStateInterface {
  instrumentList?: listInterfaces;
  contractType?: any;
  startTime?: string;
  endTime?: string;
  pageNo?: number;
  symbolList?: any;
  selectedInstrument?: any;
}

const contractTypeList = [
  {
    value: '',
    name: '',
  },
  {
    value: 1,
    name: 'باز نشده',
  },
  {
    value: 2,
    name: 'باز',
  },
  {
    value: 3,
    name: 'سررسید شده',
  },
  {
    value: 4,
    name: 'در روز تسویه',
  },
];

const initialState = {
  instrumentList: {
    items: [],
    totalPages: 1,
  },
  contractType: '',
  startTime: '',
  endTime: '',
  pageNo: 1,
  symbolList: [],
  selectedInstrument: null,
};

function Option({ onAlert }: any) {
  const navigate = useNavigate();
  const [state, setState] = useStates<initialStateInterface>(initialState);
  const {
    instrumentList,
    contractType,
    startTime,
    endTime,
    pageNo,
    symbolList,
    selectedInstrument,
  } = state;

  useEffect(() => {
    getSymbolList('', 1);
  }, []);

  useEffect(() => {
    getList();
  }, [pageNo]);

  const getList = () => {
    const data = {
      ContractType: contractType,
      StartTime: startTime,
      EndTime: endTime,
      PageNumber: pageNo,
      InstrumentName: selectedInstrument?.symbol
        ? selectedInstrument.symbol
        : '',
    };
    getInstrumentOptionList({ data, onSuccess: onSuccessList, onFail });
  };

  const onSuccessList = (res: any) => {
    const newData: any = [];
    res.items.map((item: any, i: number) => {
      newData.push({
        key: i + 1,
        optionInstruments: [
          {
            buyDescription: item.buyDescription,
            buyInstrumentName: item.buyInstrumentName,
            sellDescription: item.sellDescription,
            sellInstrumentName: item.sellInstrumentName,
          },
        ],
        ...item,
      });
    });
    setState({
      instrumentList: { ...res, items: newData },
    });
  };
  const getSymbolList = (text: string, pageNo: number) => {
    const data = {
      SearchText: text,
      PageNumber: pageNo,
    };
    getInstrumentListOption({ data, onSuccess: onSuccessSymbolList, onFail });
  };

  const onSuccessSymbolList = (list: any) => {
    setState({
      symbolList: list,
    });
  };
  const onFail = () => {
    onAlert();
  };

  const exportFile = () => {
    const data = {
      StartTime: startTime,
      EndTime: endTime,
    };
    exportToExcelOption({ data, onSuccess: onSuccessExport, onFail });
  };

  const onSuccessExport = (res: any) => {
    downloadFile(res, 'instrumentOption.xlsx');
  };

  const columns: HeaderTypes[] = [
    {
      title: 'نماد',
      dataIndex: 'baseInstrumentName',
      key: 'baseInstrumentName',
      className: 'col-span-1',
    },

    {
      title: 'هدف از انتشار',
      dataIndex: 'hasFinancingPurpose',
      key: 'hasFinancingPurpose',
      className: 'col-span-1',
      render: (value: boolean) => (
        <span>{value ? 'تامین مالی' : 'حمایت از بازار'}</span>
      ),
    },
    {
      title: 'تاریخ شروع',
      dataIndex: 'fromDate',
      key: 'fromDate',
      className: 'col-span-1',
      render: (item: any) => <span>{convertDateToJalali(item)}</span>,
    },
    {
      title: 'تاریخ پایان',
      dataIndex: 'toDate',
      key: 'toDate',
      className: 'col-span-1',
      render: (item: any) => <span>{convertDateToJalali(item)}</span>,
    },
    {
      title: 'لینک نماد',
      dataIndex: 'baseInstrumentName',
      key: 'baseInstrumentName',
      className: 'col-span-2',
      render: (_: any, record: any) => (
        <div className="flex items-center justify-around">
          <img
            alt="tse"
            src={tse}
            className="cursor-pointer"
            onClick={() => onOpenLink(record.baseInstrumentName, true)}
          />
          <img
            alt="tsetmc"
            src={tsetmc}
            className="cursor-pointer"
            onClick={() => onOpenLink(record.baseInstrumentName, false)}
          />
        </div>
      ),
    },
    {
      title: 'عملیات',
      dataIndex: 'action',
      key: 'action',
      className: 'col-span-1',
      render: (_: any, item: any) => (
        <div className="flex flex-row items-center justify-center">
          <EyeOutlined
            className="text-lg !text-blue mb-1 ml-1 cursor-pointer"
            onClick={() => onDetail(item)}
          />
          {!item.isDeleted && (
            <>
              <Icon
                name="icon-edit"
                classname="text-green text-lg cursor-pointer"
                onClick={() => onEdit(item)}
              />

              {/* <Popconfirm
                title="آیا مطمِن هستید؟"
                okText="بله"
                cancelText="خیر"
                onConfirm={() => onRemove(item)}
              >
                <Icon
                  name="icon-delete"
                  classname="text-red text-lg cursor-pointer"
                />
              </Popconfirm> */}
            </>
          )}
          <FileWordOutlined
            className="text-lg !text-green mb-1 mr-1 cursor-pointer"
            onClick={() => exportWord(item)}
          />
        </div>
      ),
    },
    {
      title: '',
      dataIndex: 'action',
      key: 'action',
      className: 'col-span-2',
      render: (_: any, item: any) => (
        <Button
          className="border border-blue text-blue w-[120px] ml-2"
          onClick={() => onCreateSome(item)}
        >
          ساخت قرارداد مشابه
        </Button>
      ),
    },
  ];

  const childColumns: HeaderTypes[] = [
    {
      title: 'نام نماد اختیار خرید',
      dataIndex: 'buyInstrumentName',
      key: 'buyInstrumentName',
      className: 'col-span-1',
    },
    {
      title: 'شرح نماد خرید',
      dataIndex: 'buyDescription',
      key: 'buyDescription',
      className: 'col-span-2',
    },
    {
      title: 'لینک نماد خرید',
      dataIndex: 'baseInstrumentName',
      key: 'baseInstrumentName',
      className: 'col-span-1',
      render: (_: any, record: any) => (
        <div className="flex items-center justify-around">
          <img
            alt="tse"
            src={tse}
            className="cursor-pointer"
            onClick={() => onOpenLink(record.buyInstrumentName, true)}
          />
          <img
            alt="tsetmc"
            src={tsetmc}
            className="cursor-pointer"
            onClick={() => onOpenLink(record.buyInstrumentName, false)}
          />
        </div>
      ),
    },
    {
      title: 'نام نماد اختیار فروش',
      dataIndex: 'sellInstrumentName',
      key: 'sellInstrumentName',
      className: 'col-span-1',
    },
    {
      title: 'شرح نماد فروش',
      dataIndex: 'sellDescription',
      key: 'sellDescription',
      className: 'col-span-2',
    },
    {
      title: 'لینک نماد فروش',
      dataIndex: 'baseInstrumentName',
      key: 'baseInstrumentName',
      className: 'col-span-1',
      render: (_: any, record: any) => (
        <div className="flex items-center justify-around">
          <img
            alt="tse"
            src={tse}
            className="cursor-pointer"
            onClick={() => onOpenLink(record.sellInstrumentName, true)}
          />
          <img
            alt="tsetmc"
            src={tsetmc}
            className="cursor-pointer"
            onClick={() => onOpenLink(record.sellInstrumentName, false)}
          />
        </div>
      ),
    },
  ];

  const onOpenLink = (name: string, isTse: boolean) => {
    const data = {
      name,
    };
    getInstrumentInfoByName({
      data,
      onSuccess: (e) => {
        if (isTse) {
          e.instrumentId
            ? window.open(
                `https://www.tse.ir/instrument/view?cat=cash&id=${e.instrumentId}`
              )
            : onAlert({ message: 'نمادی با این نام یافت نشد!' });
        } else {
          e.insCode
            ? window.open(`http://www.tsetmc.com/instInfo/${e.insCode}`)
            : onAlert({ message: 'نمادی با این نام یافت نشد!' });
        }
      },
      onFail,
    });
  };

  const onDetail = (record: any) => {
    navigate(`/instrument/instrument-option-details?id=${record.optionId}`);
  };

  const onEdit = (e: any) => {
    navigate(`/instrument/new-instrument?tab=3&id=${e.optionId}`);
  };

  const onRemove = (item: any): void => {
    const data = {
      id: item.optionId,
    };
    removeInstrumentOption({ data, onSuccess: getList, onFail });
  };

  const onCreateSome = (record: any): void => {
    navigate(
      `/instrument/new-instrument?tab=3&id=${record.optionId}&isCopy=true`
    );
  };
  const onChangePage = (pageNo: number) => {
    setState({
      pageNo,
    });
  };

  const onSearch = () => {
    getList();
  };
  const onClearFilter = () => {
    setState({
      contractType: '',
      startTime: '',
      endTime: '',
      pageNo: 1,
      selectedInstrument: null,
    });
    const data = {
      ContractType: '',
      StartTime: '',
      EndTime: '',
      PageNumber: 1,
      InstrumentName: '',
    };
    getInstrumentOptionList({ data, onSuccess: onSuccessList, onFail });
  };
  const exportWord = (item: any) => {
    const data = {
      id: item?.optionId,
    };
    exportWordOption({ data, onSuccess: onSuccessExportWord, onFail });
  };
  const onSuccessExportWord = (res: any) => {
    downloadFile(res, 'instrumentOption.docx');
  };

  return (
    <div>
      <div className="my-4 grid grid-cols-12 gap-4 ">
        <div className="col-span-2">
          <NewSelect
            label="نوع قرارداد"
            options={contractTypeList}
            onChange={(value: any) => {
              setState({
                contractType: value,
              });
            }}
            value={contractType}
            showKey="name"
            selectedKey="value"
          />
        </div>
        <InstrumetListModal
          className="col-span-2"
          data={symbolList}
          onChange={(pageNo: number, text: string) =>
            getSymbolList(text, pageNo)
          }
          onSubmit={(value: any) =>
            setState({
              selectedInstrument: value,
            })
          }
          defaultValue={selectedInstrument}
          label="نماد"
          rowKey="symbolName"
        />
        <div className="col-span-2 !z-10">
          <DatePicker
            parentClassName="!w-[85%]"
            label="تاریخ شروع "
            onChange={(value: string) => setState({ startTime: value })}
            value={startTime}
          />
        </div>
        <div className="col-span-2 !z-10">
          <DatePicker
            parentClassName="!w-[85%] "
            label="تاریخ پایان "
            onChange={(value: string) => setState({ endTime: value })}
            value={endTime}
          />
        </div>
        <div className="col-span-4 flex flex-row justify-end">
          <Button
            className="border bg-blue text-white w-[110px] ml-2"
            onClick={onSearch}
          >
            فیلتر
          </Button>
          <Button
            className="border bg-white text-blue w-[110px] ml-2"
            onClick={onClearFilter}
          >
            حذف فیلتر
          </Button>
        </div>
        <div className="col-span-12 flex flex-row justify-end">
          <Button
            className="border bg-white text-blue w-[110px] ml-2"
            onClick={exportFile}
          >
            دانلود فایل اکسل
          </Button>
        </div>
      </div>
      {/* <Table
        columns={columns}
        className="col-span-12 grid grid-cols-12 "
        data={instrumentList?.items}
        onChangePage={onChangePage}
        totalPages={instrumentList?.totalPages}
        pageSize={10}
      /> */}

      <NestedTable
        data={instrumentList?.items}
        childColumns={childColumns}
        columns={columns}
        childKey="optionInstruments"
        wrapperClassName="!mt-4"
        scroll={{ x: 'calc(600px + 30%)' }}
        onChangePage={onChangePage}
        totalPages={instrumentList?.totalPages}
        pageSize={10}
      />
    </div>
  );
}

export default withAlert(Option);
