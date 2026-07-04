import React from 'react';
import './InsideryFamilyTransaction.scss';
import {
  Button,
  TextField,
  Select,
  Icon,
  AntdSelectSearch,
} from '@tse/components/atoms';
import { Table } from '@tse/components/organism';
import { useStates, useEffect } from '@tse/utils';
import {
  saveStaffTransaction,
  getInstrumentType,
  getReasonType,
  getBrokerType,
  getStaffFamily,
  removeStaffFamilyTransaction,
  getStaffFamilyTransactionInfo,
  saveStaffFamilyTransaction,
  getStaffFamilyTransactionListData,
  getstaffFamilyList,
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
import { HeaderTypes } from '@tse/types';
import { Popconfirm } from 'antd';
import { convertDateToJalali, separator } from '@tse/tools';

export default function InsideryFamilyTransaction({
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
    selectedStaffFamilyValue: '',
    selectedStaffFamilyError: false,
    brokerList: [],
    selectedBrokerValue: '',
    selectBrokerError: false,
    selectedReasonValue: '',
    selectReasonError: false,
    staffFamilyList: [],
    staffFamilyTransactionList: [],
  };

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
    selectedStaffFamilyValue,
    selectedStaffFamilyError,
    brokerList,
    selectedBrokerValue,
    selectBrokerError,
    selectedReasonValue,
    selectReasonError,
    staffFamilyList,
    staffFamilyTransactionList,
  } = state;
  const PageSize = 6;

  const setErrorMessage = (key: string) => {
    const errorMessage = ' ';
    setState({ [`${key}Error`]: errorMessage });
  };

  useEffect(() => {
    handelStaffFamilyList();
    handelSymbolList('', 1);
    handelReasonList('', 1);
    handelBroker('', 1);
    handleStaffFamilyTransactionList('', 1);
  }, []);

  ///////////End initial////////

  ///////////Start setup////////

  const onFail = (error: any) => {
    onAlert(error);
  };

  const onContinue = () => {
    onNext();
  };

  const onBackForm = () => {
    onBack();
  };

  const onSuccessSave = () => {
    onAlert({ message: 'عملیات با موفقیت انجام شد', type: 'success' });
    handleStaffFamilyTransactionList('', 1);
    setState({
      id: null,
      instrumentId: '',
      transactionDate: '',
      volume: '',
      amount: '',
      brokerId: '',
      reasonId: '',
      selectedValue: '',
      selectedInstrumentValue: '',
      selectedReasonValue: '',
      selectedBrokerValue: '',
      selectedStaffFamilyValue: '',
    });

    handelSymbolList('', 1);
    handelReasonList('', 1);
    handelBroker('', 1);
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

  const onSearchBrokerSelectData = (e: any) => {
    handelBroker(e, 1);
  };

  const onSearchReasonSelectData = (e: any) => {
    handelReasonList(e);
  };

  const onSearchInstrumentSelectData = (e: any) => {
    handelInstrumentList(e);
  };

  const onSearchStaffFamilySelectData = (e: any) => {
    getstaffFamilyList(e);
  };
  const onSubmit = () => {
    if (
      selectedInstrumentValue &&
      volume &&
      amount &&
      selectedBrokerValue &&
      selectedStaffFamilyValue
    ) {
      const data = {
        id: id == 0 || id == null ? null : id,
        userId: selectedStaffFamilyValue.userId,
        instrumentId: selectedInstrumentValue.instrumentId,
        transactionDate: transactionDate == '' ? null : transactionDate,
        volume,
        amount,
        brokerId: selectedBrokerValue.brokerId,
        reasonId:
          selectedReasonValue == null ? null : selectedReasonValue.reasonId,
      };
      saveStaffFamilyTransaction({ data, onSuccess: onSuccessSave, onFail });
    } else {
      !selectedInstrumentValue && setErrorMessage('selectInstrument');
      !volume && setErrorMessage('volume');
      !amount && setErrorMessage('amount');
      !brokerId && setErrorMessage('brokerId');
      !selectedBrokerValue && setErrorMessage('selectBroker');
      !selectedStaffFamilyValue && setErrorMessage('selectedStaffFamily');
    }
  };

  const onEditClick = (record: any) => {
    const data = { id: record?.id };
    handleStaffFamilyTransactionInfo(data);
  };

  const onEditStaffFamily = (userInfoList: any) => {
    setState({
      id: userInfoList.id,
      selectedStaffFamilyValue: {
        userId: userInfoList.relativeInfo.userId,
        fullName: userInfoList.relativeInfo.fullName,
      },
      selectedInstrumentValue: {
        instrumentId: userInfoList.instrument.instrumentId,
        symbol: userInfoList.instrument.symbol,
      },
      transactionDate:
        userInfoList.transactionDate && userInfoList.transactionDate,
      volume: userInfoList.volume,
      amount: userInfoList.amount,
      selectedBrokerValue: {
        brokerId: userInfoList.broker.brokerId,
        brokerName: userInfoList.broker.brokerName,
      },
      selectedReasonValue: userInfoList.transactionReason && {
        reasonId: userInfoList.transactionReason.id,
        reasonName: userInfoList.transactionReason.name,
      },
    });
  };

  const tableHeader: HeaderTypes[] = [
    {
      title: 'نام و نام خانوادگی شخص وابسته',
      key: 'relativeInfo',
      className: 'col-span-2',
      render: (item: any) =>
        `${item?.relativeInfo?.firstName == null ? '' : item?.relativeInfo?.firstName} ${item?.relativeInfo?.lastName}` || '-',},
    {
      title: 'نماد',
      key: 'symbol',
      className: 'col-span-2',
      render: (item: any) => item.instrument.symbol || '-',
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
      className: 'col-span-1',
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
      key: 'brokerName',
      className: 'col-span-2',
      render: (item: any) => item?.broker?.brokerName || '-',
    },
    {
      title: 'دلیل معامله',
      key: 'transactionReason',
      className: 'col-span-1',
      render: (item: any) => item?.transactionReason?.name || '-',
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
          onConfirm={() => handleRemoveStaffFamilyTransaction(record)}
        >
          <Icon name="icon-delete" classname="text-red cursor-pointer" />
        </Popconfirm>
      ),
    },
  ];

  ///////////End setup/////////

  ///////////Start API////////

  const handelSymbolList = (text: string, pageNo: number) => {
    const data = {
      SearchText: text,
      PageNumber: pageNo,
    };
    getInstrumentList({ data, onSuccess: onSuccessSymbolList, onFail });
  };

  const handelReasonList = (text?: string, pageNo?: number) => {
    const data = {
      Filter: text,
      PageNumber: pageNo ?? 1,
      PageSize: PageSize ?? 10,
    };
    getReasonType({ onSuccess: onSuccessReasonList, onFail });
  };

  const handelInstrumentList = (text?: string, pageNo?: number) => {
    const data = {
      SearchText: text,
      PageNumber: pageNo,
    };
    getInstrumentList({ data, onSuccess: onSuccessSymbolList, onFail });
  };

  const handelBroker = (text: string, pageNo: number) => {
    const data = {
      SearchText: text,
      PageNumber: pageNo,
    };
    geBrokerList({ data, onSuccess: onSuccessBroker, onFail });
  };

  const handelStaffFamilyList = (text?: string, pageNo?: number) => {
    const data = {
      Filter: text,
      PageNumber: pageNo ?? 1,
      PageSize: PageSize ?? 10,
    };

    getStaffFamily({
      data,
      onSuccess: (res) => {
        setState({
          staffFamilyList: res,
          selectedReasonType: res?.brokerId,
        });
      },
      onFail,
    });
  };

  const handleStaffFamilyTransactionList = (text?: string, pageNo?: number) => {
    const data = {
      Filter: text,
      PageNumber: pageNo ?? 1,
      PageSize: PageSize ?? 10,
    };
    getStaffFamilyTransactionListData({
      data,
      onSuccess: (res: any) => {
        setState({ staffFamilyTransactionList: res.items });
      },
      onFail,
    });
  };

  const handleRemoveStaffFamilyTransaction = (record: any) => {
    removeStaffFamilyTransaction({
      data: record,
      onSuccess: () => handleStaffFamilyTransactionList('', 1),
      onFail,
    });
  };

  const handleStaffFamilyTransactionInfo = (data: any) => {
    getStaffFamilyTransactionInfo({
      data,
      onSuccess: (res: any) => {
        onEditStaffFamily(res);
      },
      onFail,
    });
  };

  ////////////End API////////

  return (
    <div className="flex justify-center flex-col w-[80%] mb-6">
      <div className="shadow-[0_0_15px_-10px_rgba(0,0,0,0.75)] rounded-[10px] p-[20px] bg-white min-h-[215px] flex flex-wrap gap-4">
        <div className="InsideryStaffFormItem">
          <div className="InsideryDateTextField w-60">
            <AntdSelectSearch
              label="نام و نام خانوادگی شخص وابسته"
              className="w-full"
              data={staffFamilyList}
              required
              onChange={(value: any) => {
                if (value?.userId != undefined) {
                  setState({
                    selectedStaffFamilyValue: {
                      userId: value?.userId,
                      fullName: value?.fullName,
                    },
                    selectedStaffFamilyError: false,
                  });
                } else if (value == '') {
                  setState({
                    selectedStaffFamilyValue: null,
                    selectedStaffFamilyError: false,
                  });
                }
              }}
              onSearch={(value: any) => onSearchStaffFamilySelectData(value)}
              showKey="fullName"
              idKey="userId"
              value={selectedStaffFamilyValue}
              error={selectedStaffFamilyError}
            />
          </div>

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
              required
              min={1}
              type="numeric"
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
              required
              min={1}
              type="numeric"
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
      <div className="shadow-[0_0_15px_-10px_rgba(0,0,0,0.75)] rounded-[20px] mt-[10px] p-[20px] bg-white min-h-[400px]">
        <Table
          columns={tableHeader}
          className="col-span-12 grid grid-cols-12 "
          data={staffFamilyTransactionList}
          // onChangePage={onChangeTablePage}
          totalPages={staffFamilyTransactionList?.totalPages}
          pageSize={staffFamilyTransactionList?.pageSize}
          pageNumber={staffFamilyTransactionList?.pageNumber}
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
