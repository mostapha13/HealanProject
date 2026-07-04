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

const User = ({ onAlert }: any) => {
  ///////////Start initial///////

  const initialState = {
    users: [],
    filter: '',
    pageNumber: 1,
    lang: 'Fa',
    userId: null,
    firstName: '',
    isActive: false,
    lastName: '',
    nationalIdentifier: '',
    positionTitle: '',
    userName: '',
    personnelCode: '',
    originInfo: '',
    startDate: null,
  };
  const PageSize = 6;

  const [state, setState] = useStates<any>(initialState);
  const {
    users,
    filter,
    pageNumber,
    lang,
    userId,
    firstName,
    isActive,
    lastName,
    nationalIdentifier,
    positionTitle,
    userName,
    personnelCode,
    originInfo,
    startDate
  } = state;

  const setErrorMessage = (key: string) => {
    const errorMessage = ' ';
    setState({ [`${key}Error`]: errorMessage });
  };

  useEffect(() => {
    handlegetUsers('', 1);
  }, []);

  ///////////End initial////////

  ///////////Start setup////////

  const onFail = (error: any) => {
    onAlert(error);
  };

  const onSuccessSave = (res: any) => {
    setState({
      userId: null,
      userName: '',
      firstName: '',
      lastName: '',
      nationalIdentifier: '',
      positionTitle: '',
      isActive: false,
      users: [],
      filter: '',
      pageNumber: 1,
      personnelCode: '',
      originInfo: '',
      startDate: null,
    });
    handlegetUsers('', 1);
    onAlert({
      type: 'success',
      message: 'اطلاعات با موفقیت ثبت گردید',
    });
  };

  const onChangeTablePage = (pageNo: number) => {
    pageNo = pageNo == 0 ? 1 : pageNo;
    handlegetUsers(filter, pageNo);
    setState({ pageNumber: pageNo });
  };

  const onChangeFilterText = (filterText: string) => {
    handlegetUsers(filterText, 1);
  };

  const onEditClick = (record: any) => {
    const data = { userId: record?.userId };
    handleGetUserInfo(data);
  };

  const onEditUser = (userInfoList: any) => {
    setState({
      userId: userInfoList.userId,
      firstName: userInfoList.firstName,
      lastName: userInfoList.lastName,
      nationalIdentifier: userInfoList.nationalIdentifier,
      positionTitle: userInfoList.positionTitle,
      isActive: userInfoList.isActive,
      userName: userInfoList.userName,
      personnelCode:userInfoList.personnelCode,
      originInfo:userInfoList.originInfo,
      startDate:userInfoList.startDate
    });
  };

  const onSubmit = () => {
    if (userName && firstName && lastName && positionTitle && nationalIdentifier && startDate && personnelCode && originInfo) {
      const data = {
        userName,
        firstName,
        lastName,
        nationalIdentifier:nationalIdentifier==''?null:nationalIdentifier,
        positionTitle,
        startDate,
        personnelCode,
        originInfo,

        userId: userId == null || userId == 0 ? null : userId,
      };

      saveInsideryUser({ data, onSuccess: onSuccessSave, onFail });
    } else {
      !userName && setErrorMessage('userName');
      !firstName && setErrorMessage('firstName');
      !lastName && setErrorMessage('lastName');
      !positionTitle && setErrorMessage('positionTitle');
      !nationalIdentifier && setErrorMessage('nationalIdentifier');
      !startDate && setErrorMessage('startDate');
      !personnelCode && setErrorMessage('personnelCode');
      !originInfo && setErrorMessage('originInfo');
      !startDate && setErrorMessage('startDate');      
    }

    handlegetUsers('', 1);
  };
  
  const tableHeader: HeaderTypes[] = [
    {
      title: 'نام',
      dataIndex: 'firstName',
      key: 'firstName',
      className: 'col-span-1',
    },
    {
      title: 'نام خانوادگی',
      dataIndex: 'lastName',
      key: 'lastName',
      className: 'col-span-1',
    },
    {
      title: 'شماره موبایل',
      dataIndex: 'userName',
      key: 'userName',
      className: 'col-span-1',
    },
    {
      title: 'کدملی',
      dataIndex: 'nationalIdentifier',
      key: 'nationalIdentifier',
      className: 'col-span-1',
    },
    {
      title: 'سمت',
      dataIndex: 'positionTitle',
      key: 'positionTitle',
      className: 'col-span-1',
    },
    {
      title: 'کدپرسنلی',
      dataIndex: 'personnelCode',
      key: 'personnelCode',
      className: 'col-span-1',
    },
    {
      title: 'نام پدر',
      dataIndex: 'originInfo',
      key: 'originInfo',
      className: 'col-span-1',
    },
    {
      title: 'تاریخ تولد',
      dataIndex: 'startDate',
      key: 'startDate',
      className: 'col-span-1',
     render: (item: any) => <span>{convertDateToJalali(item)}</span>,
    },
    {
      title: 'وضعیت',
      dataIndex: 'isActive',
      key: 'isActive',
      className: 'col-span-1',
      render: (item: any, record: any) => {
        return item ? (
          <Icon
            name="icon-ok-circle"
            classname=" text-lg cursor-pointer text-green"
            onClick={() => handelChangeUserStatus(record)}
          />
        ) : (
          <Icon
            name="icon-cancel-circle"
            classname=" text-lg cursor-pointer text-red"
            onClick={() => handelChangeUserStatus(record)}
          />
        );
      },
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

  const handlegetUsers = (text?: string, pageNo?: number) => {
    getUserList({
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
      onSuccess: () => handlegetUsers('', 1),
      onFail,
    });
  };
  const handleRemoveUser = (record: any) => {
    removeUser({
      data: record,
      onSuccess: () => handlegetUsers('', 1),
      onFail,
    });
  };

  const handleGetUserInfo = (data: any) => {
    getUsersInfo({
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
            label="شماره موبایل"
            className=""
            value={userName}
            onChange={(value: any) =>
              setState({
                userName: value,
                userNameError: '',
              })
            }
            required
            errorMessage={state?.userNameError}
            // type="number"
          />
        </div>

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
            value={nationalIdentifier}
            onChange={(value: any) =>
              setState({
                nationalIdentifier: value,
                nationalIdentifierError: '',
              })
            }
            errorMessage={state?.nationalIdentifierError}
            // type="number"
          />
        </div>

        <div className="InsideryDateTextField w-80">
          <TextField
            label="سمت"
            className=""
            value={positionTitle}
            onChange={(value: any) =>
              setState({
                positionTitle: value,
                positionTitleError: '',
              })
            }
            required
            errorMessage={state?.positionTitleError}
            // type="number"
          />
        </div>
        <div className="InsideryDateTextField w-80">
          <TextField
            label="کد پرسنلی"
            className=""
            value={personnelCode}
            onChange={(value: any) =>
              setState({
                personnelCode: value,
                personnelCodeError: '',
              })
            }
            required
            errorMessage={state?.personnelCodeError}
            // type="number"
          />
        </div>
        <div className="InsideryDateTextField w-80">
          <TextField
            label="نام پدر"
            className=""
            value={originInfo}
            onChange={(value: any) =>
              setState({
                originInfo: value,
                originInfoError: '',
              })
            }
            required
            errorMessage={state?.originInfoError}
            // type="number"
          />
        </div>
        
        <div className="InsideryDatePicker w-60">
          <DatePicker
          required
          error={state?.startDateError}
            label=" تاریخ تولد "
            value={startDate}
            onChange={(value: any) =>
              setState({
                startDate: value,
                startDateError: '',
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
