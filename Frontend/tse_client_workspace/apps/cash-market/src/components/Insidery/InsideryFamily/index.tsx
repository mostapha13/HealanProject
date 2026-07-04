import './InsideryFamily.scss';
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
  getStaffFamilyData,
  getStaffFamilyInfo,
  removeStaffFamily,
  getStaffFamilyListData,
  saveStaffFamily,
} from 'apps/cash-market/src/Controller/Insidery/InsideryInfo';
import { DatePicker } from '@tse/components/molecules';
import { HeaderTypes } from '@tse/types';
import { convertDateToJalali, deSeparator } from '@tse/tools';
import { Popconfirm } from 'antd';

export default function InsideryFamily({ onAlert, onNext, onBack }: any) {
  ///////////Start initial///////

  const initialState = {
    id: null,
    nationalIdentifier: '',
    firstName: '',
    lastName: '',
    startDate: '',
    originInfo: '',
    sejamCode: '',
    staffFamilyValue: '',
    staffFamilyError: false,
    staffFamilyList: [],
    staffFamilyDataList: [],
    dependentType: 1,
  };
  const PageSize = 6;
  const [state, setState] = useStates<any>(initialState);
  const {
    id,
    nationalIdentifier,
    firstName,
    lastName,
    startDate,
    originInfo,
    staffFamily,
    sejamCode,
    staffFamilyValue,
    staffFamilyError,
    staffFamilyList,
    staffFamilyDataList,
    dependentType,
  } = state;

  const setErrorMessage = (key: string) => {
    const errorMessage = ' ';
    setState({ [`${key}Error`]: errorMessage });
  };

  useEffect(() => {
    handelStaffFamilyData('', 1);
    handelStaffFamilyDataList('', 1);
  }, []);

  useEffect(() => {
    if (sejamCode == '' || staffFamilyValue.id == null) {
      setState({ sejamCodeError: '' });
    } else {
      ////////////////////////حقیقی
      if (dependentType === 1) {
        if (!sejamCode?.startsWith('9')) {
          setState({
            sejamCodeError: 'کد جدید بورسی شخص حقیقی باید با 9 شروع شود',
          });
        } else if (sejamCode.length !== 11) {
          setState({
            sejamCodeError: 'کد جدید بورسی شخص حقیقی باید 11 رقم باشد',
          });
        } else {
          setState({ sejamCodeError: '' });
        }
      }

      ////////////////////////حقوقی
      else if (dependentType === 2) {
        if (!sejamCode?.startsWith('8')) {
          setState({
            sejamCodeError: 'کد جدید بورسی شخص حقوقی باید با 8 شروع شود',
          });
        } else if (sejamCode.length !== 8) {
          setState({
            sejamCodeError: 'کد جدید بورسی شخص حقوقی باید 8 رقم باشد',
          });
        } else {
          setState({ sejamCodeError: '' });
        }
      } else if (dependentType === 3) {
        // ////////////////////////صندوق
        if (!sejamCode?.startsWith('6')) {
          setState({
            sejamCodeError: 'کد جدید بورسی صندوق باید با 6 شروع شود',
          });
        } else if (sejamCode.length !== 7) {
          setState({ sejamCodeError: 'کد جدید بورسی صندوق باید 7 رقم باشد' });
        } else {
          setState({ sejamCodeError: '' });
        }
      } else {
        setState({ sejamCodeError: '' });
      }
    }
  }, [sejamCode]);
  ///////////End initial////////

  ///////////Start setup////////

  const onFail = (error: any) => {
    onAlert(error);
  };

  const onSuccessSave = () => {
    onAlert({ message: 'عملیات با موفقیت انجام شد', type: 'success' });
    handelStaffFamilyDataList('', 1);
    setState({
      id: null,
      nationalIdentifier: '',
      firstName: '',
      lastName: '',
      startDate: '',
      originInfo: '',
      sejamCode: '',
      staffFamily: [],
      staffFamilyValue: '',
    });
  };

  const onContinue = () => {
    onNext();
  };

  const onBackForm = () => {
    onBack();
  };

  const onSuccessStaffFamilyList = (list: any) => {
    setState({
      staffFamilyList: list,
    });
    handelStaffFamilyDataList('', 1);
  };

  const onSearchStaffFamilySelectData = (e: any) => {
    handelStaffFamilyDataList(e);
  };

  const onSubmit = () => {
    if (nationalIdentifier && lastName && sejamCode && staffFamilyValue) {
      const data = {
        userId: id == null ? null : id,
        nationalIdentifier,
        firstName: firstName == '' ? null : firstName,
        lastName,
        sejamCode: sejamCode,
        startDate: startDate == '' ? null : startDate,
        originInfo: originInfo == '' ? null : originInfo,
        dependentId: staffFamilyValue.id,
      };
      saveStaffFamily({ data, onSuccess: onSuccessSave, onFail });
    } else {
      !nationalIdentifier && setErrorMessage('nationalIdentifier');
      !lastName && setErrorMessage('lastName');
      !staffFamily && setErrorMessage('staffFamily');
      !sejamCode && setErrorMessage('sejamCode');
    }
  };

  const onEditClick = (record: any) => {
    const data = { userId: record?.userId };
    handleStaffFamilyInfo(data);
  };

  const onEditStaffFamily = (staffFamilyInfo: any) => {
    setState({
      id: staffFamilyInfo.userId,
      dependentId: staffFamilyInfo?.dependent?.id,
      nationalIdentifier: staffFamilyInfo.nationalIdentifier,
      firstName:
        staffFamilyInfo.firstName == null ? '' : staffFamilyInfo.firstName,
      lastName: staffFamilyInfo.lastName,
      sejamCode: staffFamilyInfo.sejamCode,
      startDate:
        staffFamilyInfo.startDate == null ? '' : staffFamilyInfo.startDate,
      originInfo:
        staffFamilyInfo.originInfo == null ? '' : staffFamilyInfo.originInfo,
      staffFamilyValue: {
        id: staffFamilyInfo?.dependent?.id,
        title: staffFamilyInfo?.dependent?.title,
      },
    });
  };

  function handelStaffFamily(value: any) {
    if (value?.id != undefined) {
      setState({
        sejamCode: '',
        staffFamilyValue: {
          id: value?.id,
          title: value?.title,
        },
        staffFamilyError: false,
      });

      if (value?.id === 8) {
        setState({ dependentType: 2 });
      } else if (value?.id === 10) {
        setState({ dependentType: 3 });
      } else {
        setState({ dependentType: 1 });
      }
    } else if (value == '') {
      setState({
        staffFamilyValue: null,
        staffFamilyError: false,
      });
    }
  }
  
  const tableHeader: HeaderTypes[] = [
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
      className: 'col-span-1',
    },
    {
      title: 'نام',
      dataIndex: 'firstName',
      key: 'firstName',
      className: 'col-span-1',
    },
    {
      title: 'نام خانوادگی/شرکت',
      dataIndex: 'lastName',
      key: 'lastName',
      className: 'col-span-2',
    },
    {
      title: 'کد جدید بورسی',
      dataIndex: 'sejamCode',
      key: 'sejamCode',
      className: 'col-span-21',
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
      className: 'col-span-1',
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
          onConfirm={() => handleRemoveStaffFamily(record)}
        >
          <Icon name="icon-delete" classname="text-red cursor-pointer" />
        </Popconfirm>
      ),
    },
  ];

  ///////////End setup/////////

  ///////////Start API////////

  const handelStaffFamilyData = (text: string, pageNo: number) => {
    const data = {
      Filter: text,
      PageNumber: pageNo,
    };
    getStaffFamilyData({ data, onSuccess: onSuccessStaffFamilyList, onFail });
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

  const handleStaffFamilyInfo = (data: any) => {
    getStaffFamilyInfo({
      data,
      onSuccess: (res: any) => {
        onEditStaffFamily(res);
      },
      onFail,
    });
  };

  const handleRemoveStaffFamily = (record: any) => {
    removeStaffFamily({
      data: record,
      onSuccess: () => handelStaffFamilyData('', 1),
      onFail,
    });
  };

  ///////////End API/////////

  return (
    <div className="flex justify-center flex-col w-[80%]">
      <div className="shadow-[0_0_15px_-10px_rgba(0,0,0,0.75)] rounded-[10px] p-[20px] bg-white min-h-[215px] flex flex-wrap gap-4">
        <div className="InsideryDateTextField w-60">
          <AntdSelectSearch
            label="نسبت با صاحب سمت"
            className="w-full" //"2xl:col-span-12 xl:col-span-12 lg:col-span-12 md:col-span-6  col-span-4 "
            data={staffFamilyList}
            required
            onChange={(value: any) => {
              handelStaffFamily(value);
            }}
            onSearch={(value: any) => onSearchStaffFamilySelectData(value)}
            showKey="title"
            idKey="title"
            value={staffFamilyValue}
            error={staffFamilyError}
          />
        </div>

        <div className="InsideryDateTextField w-60">
          <TextField
            label="کد ملی / شناسه ملی"
            className=""
            value={nationalIdentifier}
            onChange={(value: any) =>
              setState({
                nationalIdentifier: value,
                nationalIdentifierError: '',
              })
            }
            required
            errorMessage={state?.nationalIdentifierError}
          />
        </div>
        {dependentType === 1 && (
          <div className="InsideryDateTextField w-60">
            <TextField
              label="نام"
              className=""
              value={firstName}
              onChange={(value: any) =>
                setState({
                  firstName: value,
                  firstNameError: '',
                })
              }

              // type="number"
            />
          </div>
        )}

        <div className="InsideryDateTextField w-60">
          <TextField
            label="نام خانوادگی / شرکت"
            className=""
            value={lastName}
            onChange={(value: any) =>
              setState({
                lastName: value,
                lastNameError: '',
              })
            }
            required
            errorMessage={state?.lastNameError}
            // type="number"
          />
        </div>

        <div className="InsideryDateTextField w-60">
          <TextField
            label="کد جدید بورسی"
            required
            className=""
            value={deSeparator(sejamCode)}
            onChange={(value: any) => {
              setState({
                sejamCode: value,
              });
            }}
            // required
            errorMessage={state?.sejamCodeError}
            // type="numeric"
          />
        </div>

        <div className="InsideryDatePicker w-60">
          <DatePicker
            label=" تاریخ تولد/ تاریخ تاسیس "
            value={startDate}
            onChange={(value: any) =>
              setState({
                startDate: value,
                startDateError: '',
              })
            }
          />
        </div>

        <div className="InsideryDateTextField w-60">
          <TextField
            label="نام پدر / محل ثبت"
            className=""
            value={originInfo}
            onChange={(value: any) =>
              setState({
                originInfo: value,
                originInfoError: '',
              })
            }
          />
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
          data={staffFamilyDataList?.items}
          totalPages={staffFamilyDataList?.totalPages}
          pageSize={staffFamilyDataList?.pageSize}
          pageNumber={staffFamilyDataList?.pageNumber}
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

        <div>
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
