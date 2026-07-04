import React from 'react';
import './InsideryFinal.scss';
import { Button, TextField, Icon } from '@tse/components/atoms';
import { Table } from '@tse/components/organism';
import { useStates, useEffect, useNavigate } from '@tse/utils';
import { HeaderTypes } from '@tse/types';
import {
  done,
  getStaff,
  getStaffFamilyData,
  getStaffFamilyListData,
  getStaffFamilyTransactionListData,
  getStaffTransactions,
} from 'apps/cash-market/src/Controller/Insidery/InsideryInfo';
import { convertDateToJalali, separator } from '@tse/tools';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';

export default function InsideryFinal({ onAlert, onNext, onBack }: any) {
  ///////////Start initial///////

  const initialState = {
    staffFamilyList: [],
    symbol: '',
    reason: '',
    userName: '',
    nationalIdentifier: '',
    firstName: '',
    lastName: '',
    positionTitle: '',
    personnelCode: '',
    originInfo: '',
    startDate: '',
    familyCount: '0',
    isMarried: false,
    staffFamilyDataList: [],
    stafTransactionList: [],
    staffFamilyTransactionList: [],
    chnageStatus: false,
  };
  const PageSize = 6;
  const [state, setState] = useStates<any>(initialState);
  const {
    staffFamilyList,
    symbol,
    reason,
    userName,
    nationalIdentifier,
    firstName,
    lastName,
    positionTitle,
    personnelCode,
    originInfo,
    startDate,
    familyCount,
    isMarried,
    staffFamilyDataList,
    stafTransactionList,
    staffFamilyTransactionList,
    chnageStatus,
  } = state;

  const navigate = useNavigate();

  useEffect(() => {
    handelStaffFamilyDataList('', 1);
    handelStaffTransactions('', 1);
    handleStaffFamilyTransactionList('', 1);
    handleGetStaff();
    handelStaffFamilyData('', 1);
  }, []);

  ///////////End initial////////

  ///////////Start setup////////

  const onFail = (error: any) => {
    onAlert(error);
  };

  const onBackForm = () => {
    onBack();
  };

  const onSuccessDone = () => {
    onAlert({ message: 'عملیات با موفقیت انجام شد', type: 'success' });
    navigate('/cartable');
  };

  const onSubmit = () => {
    if (chnageStatus) done({ onSuccess: onSuccessDone, onFail });
  };

  const staffTransactionTableHeader: HeaderTypes[] = [
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
      className: 'col-span-2',
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
      className: 'col-span-2',
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
  ];

  const staffFamilyTableHeader: HeaderTypes[] = [
    {
      title: 'نسبت با صاحب سمت',
      key: 'dependent',
      className: 'col-span-2',
      render: (item: any) => item?.dependent?.title || '-',
    },
    {
      title: 'کدملی/شناسه ملی',
      dataIndex: 'nationalIdentifier',
      key: 'nationalIdentifier',
      className: 'col-span-2',
    },
    {
      title: 'نام',
      dataIndex: 'firstName',
      key: 'firstName',
      className: 'col-span-2',
    },
    {
      title: 'نام خانوادگی/شرکت',
      dataIndex: 'lastName',
      key: 'lastName',
      className: 'col-span-2',
    },
    {
      title: 'تاریخ تولد/تاریخ تاسیس',
      dataIndex: 'startDate',
      key: 'startDate',
      className: 'col-span-2',
      render: (item: any) => <span>{convertDateToJalali(item)}</span>,
    },
    {
      title: 'نام پدر/محل ثبت',
      dataIndex: 'originInfo',
      key: 'originInfo',
      className: 'col-span-2',
    },
  ];

  const staffFamilyTransactionTableHeader: HeaderTypes[] = [
    {
      title: 'نام و نام خانوادگی',
      key: 'relativeInfo',
      className: 'col-span-2',
      render: (item: any) =>
        `${item?.relativeInfo?.firstName} ${item?.relativeInfo?.lastName}` ||
        '-',
    },
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
    },
    {
      title: 'ارزش معامله',
      dataIndex: 'amount',
      key: 'amount',
      className: 'col-span-2',
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
      className: 'col-span-2',
      render: (item: any) => item?.transactionReason?.name || '-',
    },
  ];

  ///////////End setup/////////

  ///////////Start API////////

  const handleGetStaff = () => {
    getStaff({
      onSuccess: (res: any) => {
        setState({
          userId: res.userId == null ? null : res.userId,
          userName: res.userName,
          nationalIdentifier: res.nationalIdentifier,
          firstName: res.firstName,
          lastName: res.lastName,
          positionTitle: res.positionTitle,
          personnelCode: res.personnelCode == null ? '' : res.personnelCode,
          originInfo: res.originInfo == null ? '' : res.originInfo,
          startDate: res.startDate == null ? '' : res.startDate,
          isMarried: res.isMarried == true ? 1 : 0,
          staffFamily:
            res.dependents == null && res.isMarried == true
              ? [1]
              : res.dependents == null &&
                (res.isMarried == false || res.isMarried == null)
              ? [9]
              : res.dependents.map((item: any) => item.title),
        });
      },
      onFail,
    });
  };

  const handelStaffFamilyData = (text: string, pageNo: number) => {
    const data = {
      Filter: text,
      PageNumber: pageNo,
    };
    getStaffFamilyData({
      data,
      onSuccess: (res: any) => setState({ familyCount: res.length }),
      onFail,
    });
  };

  const handelStaffFamilyDataList = (text?: string, pageNo?: number) => {
    const data = {
      Filter: text,
      PageNumber: pageNo ?? 1,
      PageSize: PageSize ?? 10,
    };

    getStaffFamilyListData({
      data,
      onSuccess: (res: any) => {
        setState({
          staffFamilyDataList: res,
        });
      },
      onFail,
    });
  };

  const handelStaffTransactions = (text?: string, pageNo?: number) => {
    const data = {
      Filter: text,
      PageNumber: pageNo ?? 1,
      PageSize: PageSize ?? 10,
    };
    getStaffTransactions({
      data,
      onSuccess: (res) => {
        setState({
          stafTransactionList: res,
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

  ////////////End API////////

  return (
    <div className="flex-2 min-h-[919px] mt-6">
      <div className="min-h-[700px] flex flex-col align-middle justify-center w-[80%] shadow-[0_0_15px_-10px_rgba(0,0,0,0.75)] rounded-[10px] bg-white my-2.5 mx-auto p-4">
        <div className="min-h-[170px] w-[95%] mb-6 border-[2px] border-solid border-[#cbcbcb] border-l-transparent relative">
          <span className="absolute top-[-13px] bg-white mr-12 pl-6 pr-6">
            اطلاعات شخصی
          </span>

          <div className="flex flex-wrap gap-4 mr-2 p-4">
            <div className="w-60 mt-4">
              <TextField
                label="شماره موبایل"
                className=""
                value={userName}
                readOnly

                // type="number"
              />
            </div>

            <div className="w-60 mt-4">
              <TextField
                label="کدملی"
                className=""
                value={nationalIdentifier}
                readOnly

                // type="number"
              />
            </div>

            <div className="w-60 mt-4">
              <TextField
                label="نام"
                className=""
                value={firstName}
                readOnly

                // type="number"
              />
            </div>
            <div className=" w-60 mt-4">
              <TextField
                label="نام خانوادگی"
                className=""
                value={lastName}
                readOnly

                // type="number"
              />
            </div>

            <div className="w-60  mt-4">
              <TextField
                label="سمت"
                className=""
                value={positionTitle}
                readOnly

                // type="number"
              />
            </div>

            <div className="w-60 mt-4">
              <TextField
                label="کدپرسنلی"
                className=""
                value={personnelCode}
                readOnly

                // type="number"
              />
            </div>

            <div className="w-60 mt-4">
              <TextField
                label="نام پدر"
                className=""
                value={originInfo}
                readOnly

                // type="number"
              />
            </div>

            <div className="w-60 mt-4">
              <TextField
                label="تاریخ تولد"
                className=""
                value={convertDateToJalali(startDate)}
                readOnly

                // type="number"
              />
            </div>

            <div className="w-60 mt-4">
              <TextField
                label="افراد تحت تکفل یا ولایت"
                className=""
                value={familyCount}
                readOnly

                // type="number"
              />
            </div>

            <div className="w-60 mt-4">
              <TextField
                label="آیا متاهل هستید؟"
                className=""
                value={isMarried ? 'بلی' : 'خیر'}
                readOnly

                // type="number"
              />
            </div>
          </div>
        </div>

        <div className=" min-h-[130px] w-[95%] mb-6 border-[2px] border-solid border-[#cbcbcb] border-l-transparent relative">
          <span className="absolute top-[-13px] bg-white mr-12 pl-6 pr-6">
            اطلاعات معاملات شخصی
          </span>

          <div className="flex justify-center align-middle w-full mt-6 mb-6 pr-2">
            <Table
              columns={staffTransactionTableHeader}
              className="col-span-12 grid grid-cols-12 "
              data={stafTransactionList?.items}
              totalPages={stafTransactionList?.totalPages}
              pageSize={stafTransactionList?.pageSize}
              pageNumber={stafTransactionList?.pageNumber}
              disableRow
            />
          </div>
        </div>

        <div className=" min-h-[130px] w-[95%] mb-6 border-[2px] border-solid border-[#cbcbcb] border-l-transparent relative">
          <span className="absolute top-[-13px] bg-white mr-12 pl-6 pr-6">
            اطلاعات اشخاص وابسته
          </span>

          <div className="flex justify-center align-middle w-full mt-6 mb-6  pr-2">
            <Table
              columns={staffFamilyTableHeader}
              className="col-span-12 grid grid-cols-12 "
              data={staffFamilyDataList?.items}
              totalPages={staffFamilyDataList?.totalPages}
              pageSize={staffFamilyDataList?.pageSize}
              pageNumber={staffFamilyDataList?.pageNumber}
              disableRow
            />
          </div>
        </div>
        <div className=" min-h-[130px] w-[95%] mb-6 border-[2px] border-solid border-[#cbcbcb] border-l-transparent relative">
          <span className="absolute top-[-13px] bg-white mr-12 pl-6 pr-6">
            اطلاعات معاملات اشخاص وابسته
          </span>
          <div className="flex justify-center align-middle w-full mt-6 mb-6  pr-2">
            <Table
              columns={staffFamilyTransactionTableHeader}
              className="col-span-12 grid grid-cols-12 "
              data={staffFamilyTransactionList}
              totalPages={staffFamilyTransactionList?.totalPages}
              pageSize={staffFamilyTransactionList?.pageSize}
              pageNumber={staffFamilyTransactionList?.pageNumber}
              disableRow
            />
          </div>
        </div>
        <div>
          <Checkbox onClick={() => setState({ chnageStatus: !chnageStatus })} />
          <span className={chnageStatus ? 'text-extratin' : 'text-red'}>
            اینجانب، متعهد می شوم، که تمامی اطلاعات فوق صحیح بوده و هرگونه تغییر
            در این اطلاعات را در اسرع وقت بروزرسانی کنم.
          </span>
        </div>
      </div>

      <div className="col-span-4 flex justify-end mt-5 ml-32 items-center mb-6 ">
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
            onClick={onSubmit}
          >
            ثبت نهایی
          </Button>
        </div>
      </div>
    </div>
  );
}
