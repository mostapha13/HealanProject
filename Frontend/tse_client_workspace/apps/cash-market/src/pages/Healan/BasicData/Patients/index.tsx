import React from 'react';
import { Button, TextField, Icon } from '@tse/components/atoms';
import { Table } from '@tse/components/organism';
import { useStates, useEffect } from '@tse/utils';
import './style.scss';
import { HeaderTypes } from '@tse/types';
import { Popconfirm } from 'antd';
import { DatePicker } from '@tse/components/molecules';
import {
  getUserList,
  saveInsideryUser,
  getUsersInfo,
  removeUser,
  changeUserStatus,
} from 'apps/cash-market/src/Controller/Insidery/InsideryInfo';
import withAlert from 'apps/cash-market/src/hoc/withAlert';
import { convertDateToJalali } from '@tse/tools';
import { getPatientInfo, getPatientList, savePatient } from 'apps/cash-market/src/Controller/Healan';

const User = ({ onAlert }: any) => {
  ///////////Start initial///////

  const initialState = {
    users: [],
    filter: '',
    pageNumber: 1,
    lang: 'Fa',
    patientId: null,
    userId: null,
    firstName: '',
    lastName: '',
    nationalCode: '',
    phoneNumber: '',
    birthdate: null,
    serviceTypes: null,
    insurances: null,
  };
  const PageSize = 10;

  const [state, setState] = useStates<any>(initialState);
  const {
    users,
    filter,
    pageNumber,
    lang,
    patientId,
    userId,
    firstName,
    lastName,
    nationalCode,
    phoneNumber,
    birthdate,
    serviceTypes,
    insurances,
  } = state;

  const setErrorMessage = (key: string) => {
    const errorMessage = ' ';
    setState({ [`${key}Error`]: errorMessage });
  };

  useEffect(() => {
    handlegetpatients('', 1);
  }, []);

  ///////////End initial////////

  ///////////Start setup////////

  const onFail = (error: any) => {
    onAlert(error);
  };

  const onSuccessSave = (res: any) => {
    setState({
      users: [],
      filter: '',
      pageNumber: 1,
      lang: 'Fa',
      patientId: null,
      userId: null,
      firstName: '',
      lastName: '',
      nationalCode: '',
      phoneNumber: '',
      birthdate: null,
      serviceTypes: null,
      insurances: null,
    });
    handlegetpatients('', 1);
    onAlert({
      type: 'success',
      message: 'اطلاعات با موفقیت ثبت گردید',
    });
  };

  const onChangeTablePage = (pageNo: number) => {
    pageNo = pageNo == 0 ? 1 : pageNo;
    handlegetpatients(filter, pageNo);
    setState({ pageNumber: pageNo });
  };

  const onChangeFilterText = (filterText: string) => {
    handlegetpatients(filterText, 1);
  };

  const onEditClick = (record: any) => {
    const data = { patientId: record?.patientId };
    handleGetPatientInfo(data);
  };

  const onEditUser = (userInfoList: any) => {
 
    setState({
      patientId: userInfoList.patientId,
      userId:userInfoList.userId,
      firstName: userInfoList.firstName,
      lastName: userInfoList.lastName,
      nationalCode: userInfoList.nationalCode,
      phoneNumber: userInfoList.phoneNumber,
      birthdate: userInfoList.birthdate,
      serviceTypes: userInfoList.serviceTypes,
      insurances: userInfoList.insurances,
  
    });
  };

  const onSubmit = () => {
    if (firstName && lastName && nationalCode && phoneNumber) {
      const data = {
        firstName,
        lastName,
        nationalCode: nationalCode == '' ? null : nationalCode,
        phoneNumber: phoneNumber ,
        birthdate: birthdate == '' ? null : birthdate,
        serviceTypes: serviceTypes == '' ? null : serviceTypes,
        insurances: insurances == '' ? null : insurances,
        patientId: patientId == null || patientId == 0 ? null : patientId,
        userId:
          userId == null || userId == 0 ? null : userId,
      };

   
      savePatient({ data, onSuccess: onSuccessSave, onFail });
    } else {
      !firstName && setErrorMessage('firstName');
      !lastName && setErrorMessage('lastName');
      !nationalCode && setErrorMessage('nationalCode');
      !phoneNumber && setErrorMessage('phoneNumber');
    }

    handlegetpatients('', 1);
  };

  const tableHeader: HeaderTypes[] = [
    {
      title: 'نام',
      dataIndex: 'firstName',
      key: 'firstName',
      className: 'col-span-2',
    },
    {
      title: 'نام خانوادگی',
      dataIndex: 'lastName',
      key: 'lastName',
      className: 'col-span-2',
    },
    {
      title: 'کدملی',
      dataIndex: 'nationalCode',
      key: 'nationalCode',
      className: 'col-span-2',
    },
    {
      title: 'شماره موبایل',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
      className: 'col-span-2',
    },
    {
      title: 'تاریخ تولد',
      dataIndex: 'birthdate',
      key: 'birthdate',
      className: 'col-span-1',
      render: (item: any) => <span>{convertDateToJalali(item)}</span>,
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
          onConfirm={() => handleRemoveUser(record)}
        >
          <Icon name="icon-delete" classname="text-red cursor-pointer" />
        </Popconfirm>
      ),
    },
  ];

  ///////////End setup/////////

  ///////////Start API////////

  const handlegetpatients = (text?: string, pageNo?: number) => {
    getPatientList({
      data: {
        Filter: text,
        PageNumber: pageNo,
        PageSize,
        lang,
      },
      onSuccess: (res: any) => setState({ users: res }),
      onFail,
    });
  };

  const handelChangeUserStatus = (record: any) => {
    const data = {
      userId: record?.userId,
    };

    changeUserStatus({
      data,
      onSuccess: () => handlegetpatients('', 1),
      onFail,
    });
  };
  const handleRemoveUser = (record: any) => {
    removeUser({
      data: record,
      onSuccess: () => handlegetpatients('', 1),
      onFail,
    });
  };

  const handleGetPatientInfo = (data: any) => {
    getPatientInfo({
      data,
      onSuccess: (res: any) => {
        onEditUser(res);
      },
      onFail,
    });
  };

  ////////////End API////////

  return (
    <>
      <div className="shadow-[0_0_15px_-10px_rgba(0,0,0,0.75)] rounded-[10px] p-[30px] bg-white min-h-[100px] flex flex-wrap gap-6">
        <div className="InsideryDateTextField w-80">
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
            required
            errorMessage={state?.firstNameError}
            // type="number"
          />
        </div>

        <div className="InsideryDateTextField w-80">
          <TextField
            label="نام خانوادگی"
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

        <div className="InsideryDateTextField w-80">
          <TextField
            label="کدملی"
            className=""
            required
            value={nationalCode}
            onChange={(value: any) =>
              setState({
                nationalCode: value,
                nationalCodeError: '',
              })
            }
            errorMessage={state?.nationalCodeError}
            // type="number"
          />
        </div>

        <div className="InsideryDateTextField w-80">
          <TextField
            label="شماره موبایل"
            className=""
            value={phoneNumber}
            onChange={(value: any) =>
              setState({
                phoneNumber: value,
                phoneNumberError: '',
              })
            }
            // type="number"
          />
        </div>

        <div className="InsideryDatePicker w-60">
          <DatePicker
            required
            error={state?.birthdateError}
            label=" تاریخ تولد "
            value={birthdate}
            onChange={(value: any) =>
              setState({
                birthdate: value,
                birthdateError: '',
              })
            }
          />
        </div>
        <div className="flex justify-end w-full">
          <Button
            className="bg-blue text-white w-[130px] h-[40px] ml-9"
            onClick={onSubmit}
          >
            افزودن
          </Button>
        </div>
      </div>
      <div className="shadow-[0_0_15px_-10px_rgba(0,0,0,0.75)] rounded-[20px] mt-[10px] p-[20px] bg-white min-h-[500px]">
        <div className="mt-6 mb-6 w-80">
          <TextField
            label="جستجو"
            className="2xl:col-span-3 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            value={filter}
            onChange={(value: any) => {
              onChangeFilterText(value);
              setState({
                filter: value,
              });
            }}
          />
        </div>
        <Table
          columns={tableHeader}
          className="col-span-12 grid grid-cols-12 "
          data={users?.items}
          onChangePage={onChangeTablePage}
          totalPages={users?.totalPages}
          pageSize={PageSize}
          pageNumber={pageNumber}
        />
      </div>
    </>
  );
};

export default withAlert(User);
