import React from 'react';
import {
  Button,
  TextField,
  Icon,
  AntdSelectSearch,
} from '@tse/components/atoms';
import { Table } from '@tse/components/organism';
import { useStates, useEffect, useNavigate } from '@tse/utils';
import {
  saveStaffTransaction,
  getInstrumentType,
  getReasonType,
  getStaffTransactions,
  getStaffTransaction,
  removeStaffTransaction,
  getMenus,
} from 'apps/cash-market/src/Controller/Insidery/InsideryInfo';
import {
  getParameterTypeList,
  getInstrumentList,
  geBrokerList,
  saveInstrumentParameter,
  uploadFile,
  instrumentParameterLoad,
  instrumentParameterImport,
  getInstrumentParameterList,
} from '../../../Controller';
import { DatePicker } from '@tse/components/molecules';
import './InsideryStaffTransaction.scss';
import { HeaderTypes } from '@tse/types';
import { Popconfirm } from 'antd';
import {
  convertDateToJalali,
  separator,
} from '@tse/tools';

export default function InsideryStaffTransaction({
  onAlert,
  onNext,
  onBack,
}: any) {
  ///////////Start initial///////

  const initialState = {
    id: null,
    instrumentId: '',
    transactionDate: '',
    volume: '',
    amount: '',
    brokerId: '',
    reason: '',
    instrumentList: [],
    reasonList: [],
    selectedReasonType: null,
    selectedInstrumentValue: '',
    selectInstrumentError: false,
    brokerList: [],
    selectedBrokerValue: '',
    selectBrokerError: false,
    stafTransactionList: [],
    selectReasonError: false,
    selectedReasonValue: '',
  };
  const PageSize = 6;
  const [state, setState] = useStates<any>(initialState);
  const {
    id,
    instrumentId,
    transactionDate,
    volume,
    amount,
    brokerId,
    reason,
    instrumentList,
    reasonList,
    selectedReasonType,
    selectedInstrumentValue,
    selectInstrumentError,
    brokerList,
    selectedBrokerValue,
    selectBrokerError,
    stafTransactionList,
    selectedReasonValue,
    selectReasonError,
  } = state;

  const setErrorMessage = (key: string) => {
    const errorMessage = ' ';
    setState({ [`${key}Error`]: errorMessage });
  };

  useEffect(() => {
    handelInstrumentList('', 1);
    handelReasonList('', 1);
    handelBroker('', 1);
    handelStaffTransactions();
  }, []);

  ///////////End initial////////

  ///////////Start setup////////

  const onSuccessSave = () => {
    onAlert({ message: 'عملیات با موفقیت انجام شد', type: 'success' });
    handelStaffTransactions();
    setState({
      id:'',
      instrumentId: '',
      transactionDate: '',
      volume: '',
      amount: '',
      brokerId: '',
      reasonId: '',
      selectedValue: '',
      selectedInstrumentValue: [],
      selectedBrokerValue: [],
      selectedReasonValue: [],
    });
    handelInstrumentList('', 1);
    handelReasonList('', 1);
    handelBroker('', 1);
  };
  const onFail = (error: any) => {
    onAlert(error);
  };

  const onContinue = () => {
    onNext();
  };

  const onBackForm = () => {
    onBack();
  };

  const onSuccessSymbolList = (list: any) => {
    setState({
      instrumentList: list,
    });
  };

  const onSuccessReasonList = (list: any) => {
    setState({
      reasonList: list.map((item: any) => ({
        reasonId: item.id,
        reasonName: item.name,
      })),
    });
  };


  const onSuccessBroker = (res: any) => {
    setState({
      brokerList: res,
    });
  };

  const onSearchBrokerSelectData = (e: string) => {
    handelBroker(e, 1);
  };

  const onSearchReasonSelectData = (e: string) => {
    handelReasonList(e);
  };

  const onSearchInstrumentSelectData = (e: string) => {
    handelInstrumentList(e, 1);
  };

  const onSubmit = () => {
    if (selectedInstrumentValue && volume && amount && selectedBrokerValue) {
      const data = {
        id: id == 0 || id == null ? null : id,
        instrumentId: selectedInstrumentValue.instrumentId,
        transactionDate: transactionDate==''?null:transactionDate,
        volume: volume,
        amount: amount,
        brokerId: selectedBrokerValue.brokerId,
        reasonId: selectedReasonValue==''?null:selectedReasonValue.reasonId,
      };
      saveStaffTransaction({ data, onSuccess: onSuccessSave, onFail });
    } else {
      !selectedInstrumentValue && setErrorMessage('selectInstrument');
      !volume && setErrorMessage('volume');
      !amount && setErrorMessage('amount');
      !selectedBrokerValue && setErrorMessage('selectBroker');
    }
  };

  const onEditClick = (record: any) => {
    const data = { id: record?.id };
    handleStaffTransactionInfo(data);
  };

  const onEditStaffTransaction = (transactionInfo: any) => {
    setState({
      id: transactionInfo.id,
      amount: transactionInfo.amount,
      instrumentId: transactionInfo.instrument.instrumentId,
      transactionDate:transactionInfo.transactionDate && transactionInfo.transactionDate,
      volume: transactionInfo.volume,
      selectedReasonType: transactionInfo.transactionReason==null?'':transactionInfo.transactionReason.id,
      selectedReasonValue:transactionInfo.transactionReason==null?'':{
        reasonId: transactionInfo.transactionReason.id,
        reasonName: transactionInfo.transactionReason.name,
      },
      selectedBrokerValue: {
        brokerId: transactionInfo.broker.brokerId,
        brokerName: transactionInfo.broker.brokerName,
      },
      selectedInstrumentValue: {
        instrumentId: transactionInfo.instrument.instrumentId,
        symbol: transactionInfo.instrument.symbol,
      },
    });
  };

  const tableHeader: HeaderTypes[] = [
    {
      title: 'نماد',
      key: 'instrument',
      className: 'col-span-2',
      render: (item: any) => item?.instrument?.symbol,
    },
    {
      title: 'تاریخ معامله',
      dataIndex: 'transactionDate',
      key: 'transactionDate',
      className: 'col-span-1',
      render: (item: any) => <span>{convertDateToJalali(item)}</span>,
    },
    {
      title: 'حجم معامله',
      dataIndex: 'volume',
      key: 'volume',
      className: 'col-span-2 !justify-start',
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'ارزش معامله',
      dataIndex: 'amount',
      key: 'amount',
      className: 'col-span-1',
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'کارگزاری',
      key: 'broker',
      className: 'col-span-2',
      render: (item: any) => item?.broker?.brokerName,
    },
    {
      title: 'دلیل معامله',
      key: 'transactionReason',
      className: 'col-span-2',
      render: (item: any) => item?.transactionReason?.name,
    },

    {
      title: 'ویرایش',
      dataIndex: 'edit',
      key: 'edit',
      className: 'col-span-1',
      render: (item: any, record: any) => {
        return (
          <Icon
            name="icon-edit"
            classname="text-listingTertiaryColor text-lg cursor-pointer"
            onClick={() => onEditClick(record)}
          />
        );
      },
    },
    {
      title: 'حذف',
      key: 'delete',
      className: 'col-span-1',
      render: (item: any, record: any) => (
        <Popconfirm
          title="آیا مطمئن هستید؟"
          okText="بله"
          cancelText="خیر"
          onConfirm={() => handleRemoveStaffTransaction(record)}
        >
          <Icon name="icon-delete" classname="text-red cursor-pointer" />
        </Popconfirm>
      ),
    },
  ];

  ///////////End setup/////////

  ///////////Start API////////

  const handelInstrumentList = (text: string, pageNo: number) => {
    const data = {
      SearchText: text,
      PageNumber: pageNo,
    };
    getInstrumentList({ data, onSuccess: onSuccessSymbolList, onFail });
  };

  const handelReasonList = (text?: string, pageNo?: number) => {
    getReasonType({ onSuccess: onSuccessReasonList, onFail });
  };

  const handelStaffTransactions = () => {
    getStaffTransactions({
      onSuccess: (res) => {
        setState({
          stafTransactionList: res,
        });
      },
      onFail,
    });
  };

  const handelBroker = (text: string, pageNo: number) => {
    const data = {
      SearchText: text,
      PageNumber: pageNo,
    };
    geBrokerList({ data, onSuccess: onSuccessBroker, onFail });
  };

  const handleStaffTransactionInfo = (data: any) => {
    getStaffTransaction({
      data,
      onSuccess: (res: any) => {
        onEditStaffTransaction(res);
      },
      onFail,
    });
  };

  const handleRemoveStaffTransaction = (record: any) => {
    removeStaffTransaction({
      data: record,
      onSuccess: () => handelStaffTransactions(),
      onFail,
    });
  };

  ////////////End API////////

  return (
    <div className="InsideryStaffTransactionContainer">
      <div className="InsideryStaffTransactionForm">
        <div className="InsideryStaffFormItem">
          <div className="InsideryDateTextField w-60">
            <AntdSelectSearch
              label="نماد"
              className="w-full" //"2xl:col-span-12 xl:col-span-12 lg:col-span-12 md:col-span-6  col-span-4 "
              data={instrumentList}
              required
              onChange={(value: any) => {
                if (value?.instrumentId != undefined) {
                  setState({
                    selectedInstrumentValue: {
                      instrumentId: value?.instrumentId,
                      symbol: value?.symbol,
                    },
                    selectInstrumentError: false,
                  });
                } else if (value == '') {
                  setState({
                    selectedInstrumentValue: null,
                    selectInstrumentError: false,
                  });
                }
              }}
              onSearch={(value: any) => onSearchInstrumentSelectData(value)}
              showKey="symbol"
              idKey="symbol"
              value={selectedInstrumentValue}
              error={selectInstrumentError}
            />
          </div>

          <div className="InsideryDatePicker w-60">
            <DatePicker
              label=" تاریخ معامله "
              value={transactionDate}
              onChange={(value: any) =>
                setState({
                  transactionDate: value,
                  transactionDateError: '',
                })
              }
            />
          </div>

          <div className="InsideryDateTextField w-60">
            <TextField
              label="حجم معامله"
              className=""
              value={separator(volume)}
              onChange={(value: any) =>
                setState({
                  volume: value,
                  volumeError: '',
                })
              }
              type="numeric"
              required
              min={1}
              errorMessage={state?.volumeError}
            />
          </div>

          <div className="InsideryDateTextField w-60">
            <TextField
              label="ارزش معامله"
              className=""
              value={separator(amount)}
              onChange={(value: any) =>
                setState({
                  amount: value,
                  amountError: '',
                })
              }
               type="numeric"
               required
               min={1}
               errorMessage={state?.amountError}
            />
          </div>

          <div className="InsideryDateTextField w-60">
            <AntdSelectSearch
              label="کارگزاری"
              className="w-full" //"2xl:col-span-12 xl:col-span-12 lg:col-span-12 md:col-span-6  col-span-4 "
              data={brokerList}
              required
              onChange={(value: any) => {
                if (value?.brokerId != undefined) {
                  setState({
                    selectedBrokerValue: {
                      brokerId: value.brokerId,
                      brokerName: value.brokerName,
                    },
                    selectBrokerError: false,
                  });
                } else if (value == '') {
                  setState({
                    selectedBrokerValue: null,
                    selectBrokerError: false,
                  });
                }
              }}
              onSearch={(value: any) => onSearchBrokerSelectData(value)}
              showKey="brokerName"
              idKey="brokerName"
              value={selectedBrokerValue}
              error={selectBrokerError}
            />
          </div>

          <div className="InsideryDateTextField w-60">
            <AntdSelectSearch
              label="دلیل"
              className="w-full"
              data={reasonList}
              required
              onChange={(value: any) => {
                if (value?.reasonId != undefined) {
                  setState({
                    selectedReasonValue: {
                      reasonId: value?.reasonId,
                      reasonName: value?.reasonName,
                    },
                    selectReasonError: false,
                  });
                } else if (value == '') {
                  setState({
                    selectedReasonValue: null,
                    selectReasonError: false,
                  });
                }
              }}
              onSearch={(value: any) => onSearchReasonSelectData(value)}
              showKey="reasonName"
              idKey="reasonId"
              value={selectedReasonValue}
              error={selectReasonError}
            />
          </div>
        </div>
        <div className="flex justify-end w-full">
          <Button
            className="bg-[#10375C] text-white w-[130px] h-[40px] ml-9"
            onClick={onSubmit}
          >
            افزودن
          </Button>
        </div>
      </div>
      <div className="InsideryStaffTransactionTable">
        <Table
          columns={tableHeader}
          className="col-span-12 grid grid-cols-12 "
          data={stafTransactionList?.items}
          totalPages={stafTransactionList?.totalPages}
          pageSize={stafTransactionList?.pageSize}
          pageNumber={stafTransactionList?.pageNumber}
          disableRow
        />
      </div>

      <div className="col-span-4 flex justify-end mt-5 ml-15 items-center">
        <div
          className=" w-24 ml-2 justify-center items-center cursor-pointer"
          onClick={onBackForm}
        >
          <Icon
            name="icon-right-open"
            classname="text-listingTertiaryColor text-lg cursor-pointer"
          />
          <span className="back">قبلی</span>
        </div>

        <div className="">
          <Button
            className="bg-[#B18F47] text-white w-[150px] h-[50px] ml-9"
            onClick={onContinue}
          >
            ادامه
          </Button>
        </div>
      </div>
    </div>
  );
}
