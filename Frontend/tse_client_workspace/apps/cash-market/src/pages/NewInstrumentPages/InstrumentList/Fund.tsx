import { Button, Icon } from '@tse/components/atoms';
import { SymbolModal, Table } from '@tse/components/organism';
import { DatePicker } from '@tse/components/molecules';
import { convertDateToJalali, downloadFile, separator } from '@tse/tools';
import { HeaderTypes } from '@tse/types';
import { useEffect, useStates, useNavigate } from '@tse/utils';
import {
  exportToExcelFund,
  exportWordFund,
  getInstrumentFundList,
  getInstrumentInfoByName,
  getInstrumentListFund,
} from '../../../Controller/Instrument';
import withAlert from '../../../hoc/withAlert';
import tse from '../../../assets/images/tse.png';
import tsetmc from '../../../assets/images/tsetmc.png';
import { EyeOutlined, FileWordOutlined } from '@ant-design/icons';
import { getInstrumentList } from 'apps/cash-market/src/Controller';
import { NEW_INSTRUMENT_BASE_URL } from 'apps/cash-market/src/constants';
import { InstrumetListModal } from 'apps/cash-market/src/components/atoms/InstrumentList';
interface listInterfaces {
  items: any[];
  totalPages: number;
}

interface initialStateInterface {
  instrumentList?: listInterfaces;
  startTime?: string;
  endTime?: string;
  pageNo?: number;
  symbolList?: any;
  selectedInstrument?: any;
}

const initialState = {
  instrumentList: {
    items: [],
    totalPages: 1,
  },
  startTime: '',
  endTime: '',
  pageNo: 1,
  symbolList: [],
  selectedInstrument: null,
};

function Fund({ onAlert }: any) {
  const navigate = useNavigate();
  const [state, setState] = useStates<initialStateInterface>(initialState);
  const {
    instrumentList,
    startTime,
    endTime,
    pageNo,
    symbolList,
    selectedInstrument,
  } = state;
  useEffect(() => {
    getSymbolList('', 1);
    getList();
  }, []);
  useEffect(() => {
    getList();
  }, [pageNo]);

  const getList = () => {
    const data = {
      PageNumber: pageNo,
      FromDate: startTime,
      ToDate: endTime,
      InstrumentName: selectedInstrument?.symbol
        ? selectedInstrument.symbol
        : '',
    };
    getInstrumentFundList({ data, onSuccess: onSuccessList, onFail });
  };

  const onSuccessList = (res: any) => {
    setState({
      instrumentList: res,
    });
  };
  const getSymbolList = (text: string, pageNo: number) => {
    const data = {
      SearchText: text,
      PageNumber: pageNo,
    };
    getInstrumentListFund({ data, onSuccess: onSuccessSymbolList, onFail });
  };

  const onSuccessSymbolList = (list: any) => {
    setState({
      symbolList: list,
    });
  };
  const onFail = () => {
    onAlert();
  };
  const columns: HeaderTypes[] = [
    {
      title: 'نماد معاملاتی',
      dataIndex: 'instrumentName',
      key: 'instrumentName',
      className: 'col-span-2',
    },
    {
      title: 'روش پذیره نویسی',
      dataIndex: 'underwritingMethod',
      key: 'underwritingMethod',
      className: 'col-span-2',
      render: (item: any) => <span>{item?.underwritingMethodName}</span>,
    },
    {
      title: 'قیمت عرضه',
      dataIndex: 'supplyPrice',
      key: 'supplyPrice',
      className: 'col-span-1',
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'تاریخ شروع پذیره‌نویسی',
      dataIndex: 'underwritingStartDate',
      key: 'underwritingStartDate',
      className: 'col-span-1',
      render: (item: any) => <span>{convertDateToJalali(item)}</span>,
    },
    {
      title: 'تاریخ پایان پذیره نویسی',
      dataIndex: 'underwritingEndDate',
      key: 'underwritingEndDate',
      className: 'col-span-1',
      render: (item: any) => <span>{convertDateToJalali(item)}</span>,
    },
    {
      title: 'لینک نماد',
      dataIndex: 'instrumentName',
      key: 'instrumentName',
      className: 'col-span-1',
      render: (_: any, record: any) => (
        <div className="flex items-center justify-around gap-1">
          <img
            alt="tse"
            src={tse}
            className="cursor-pointer"
            onClick={() => onOpenLink(record.instrumentName, true)}
          />
          <img
            alt="tsetmc"
            src={tsetmc}
            className="cursor-pointer"
            onClick={() => onOpenLink(record.instrumentName, false)}
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
    navigate(
      `/instrument/instrument-fund-details?id=${record.instrumentFundId}`
    );
  };

  // const onRemove = (item: any): void => {
  //   const data = {
  //     id: item.tradeOptionId,
  //   };
  //   removeDebitBond({ data, onSuccess: getList, onFail });
  // };

  const onEdit = (record: any) => {
    navigate(`/instrument/new-instrument?tab=5&id=${record.instrumentFundId}`);
  };

  const onCreateSome = (record: any): void => {
    navigate(
      `/instrument/new-instrument?tab=5&id=${record.instrumentFundId}&isCopy=true`
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
      startTime: '',
      endTime: '',
      pageNo: 1,
      selectedInstrument: null,
    });
    const data = {
      StartTime: '',
      EndTime: '',
      PageNumber: 1,
      InstrumentName: '',
    };
    getInstrumentFundList({ data, onSuccess: onSuccessList, onFail });
  };
  const exportFile = () => {
    const data = {
      StartTime: startTime,
      EndTime: endTime,
    };
    exportToExcelFund({ data, onSuccess: onSuccessExport, onFail });
  };
  const onSuccessExport = (res: any) => {
    downloadFile(res, 'instrumentFund.xlsx');
  };
  const exportWord = (item: any) => {
    const data = {
      id: item?.instrumentFundId,
    };
    exportWordFund({ data, onSuccess: onSuccessExportWord, onFail });
  };
  const onSuccessExportWord = (res: any) => {
    downloadFile(res, 'instrumentFund.docx');
  };
  return (
    <div>
      <div className="my-4 grid grid-cols-12 gap-4 ">
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
            label="از تاریخ سررسید"
            onChange={(value: string) => setState({ startTime: value })}
            value={startTime}
          />
        </div>
        <div className="col-span-2 !z-10">
          <DatePicker
            parentClassName="!w-[85%]"
            label="تا تاریخ سررسید"
            onChange={(value: string) => setState({ endTime: value })}
            value={endTime}
          />
        </div>
        <div className="col-span-6 flex flex-row justify-end">
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

      <Table
        data={instrumentList?.items}
        columns={columns}
        wrapperClassName="!mt-4"
        onChangePage={onChangePage}
        totalPages={instrumentList?.totalPages}
        pageSize={10}
        className="col-span-12 grid grid-cols-12 "
      />
    </div>
  );
}

export default withAlert(Fund);
