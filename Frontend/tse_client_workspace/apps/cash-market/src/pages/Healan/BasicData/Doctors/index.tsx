import React from 'react';
import {
  Button,
  TextField,
  Icon,
  AntdSelectSearch,
} from '@tse/components/atoms';
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
import {
  getCompanyList,
  getDoctorInfo,
  getDoctorList,
  getMedicalGroupTypes,
  getPatientInfo,
  getPatientList,
  removeDoctor,
  saveDoctor,
  savePatient,
} from 'apps/cash-market/src/Controller/Healan';

const Doctor = ({ onAlert }: any) => {
  ///////////Start initial///////

  const initialState = {
    doctors: [],
    companyData: [],
    medicalGroupTypeData: [],
    filter: '',
    pageNumber: 1,
    lang: 'Fa',
    doctorId: null,
    companyId: '',
    firstName: '',
    lastName: '',
    nationalCode: '',
    personnelNumber: '',
    mobile: '',
    birthdate: null,
    medicalGroupTypeId: null,
    medicalSystemNumber: '',
  };
  const PageSize = 10;

  const [state, setState] = useStates<any>(initialState);
  const {
    doctors,
    companyData,
    medicalGroupTypeData,
    filter,
    pageNumber,
    lang,
    doctorId,
    companyId,
    firstName,
    lastName,
    nationalCode,
    personnelNumber,
    mobile,
    birthdate,
    medicalGroupTypeId,
    medicalSystemNumber,
  } = state;

  const setErrorMessage = (key: string) => {
    const errorMessage = ' ';
    setState({ [`${key}Error`]: errorMessage });
  };

  useEffect(() => {
    handlegetDoctors('', 1);
    handleGetCompanyList('', 1);
    handleGetMedicalGroupTypes('', 1);
  }, []);

  ///////////End initial////////

  ///////////Start setup////////

  const onFail = (error: any) => {
    onAlert(error);
  };

  const onSuccessSave = (res: any) => {
    setState({
      doctors: [],
      companyData: [],
      medicalGroupTypeData: [],
      filter: '',
      pageNumber: 1,
      lang: 'Fa',
      doctorId: null,
      companyId: '',
      firstName: '',
      lastName: '',
      nationalCode: '',
      personnelNumber: '',
      mobile: '',
      birthdate: null,
      medicalGroupTypeId: null,
      medicalSystemNumber: '',
    });
    handlegetDoctors('', 1);
    onAlert({
      type: 'success',
      message: 'اطلاعات با موفقیت ثبت گردید',
    });
  };

  const onChangeTablePage = (pageNo: number) => {
    pageNo = pageNo == 0 ? 1 : pageNo;
    handlegetDoctors(filter, pageNo);
    setState({ pageNumber: pageNo });
  };

  const onChangeFilterText = (filterText: string) => {
    handlegetDoctors(filterText, 1);
  };

  const onEditClick = (record: any) => {
    const data = { doctorId: record?.doctorId };
    handleGetDoctorInfo(data);
  };

  const onEditDoctor = (userInfoList: any) => {

    setState({
      doctorId: userInfoList.doctorId,
      companyId: userInfoList.companyId,
      firstName: userInfoList.firstName,
      lastName: userInfoList.lastName,
      nationalCode: userInfoList.nationalCode,
      personnelNumber: userInfoList.personnelNumber,
      mobile: userInfoList.mobile,
      birthdate: userInfoList.birthdate,
      medicalGroupTypeId: userInfoList.medicalGroupTypeId,
      medicalSystemNumber: userInfoList.medicalSystemNumber,
     
    });
  };

  const onSubmit = () => {
    if (
      companyId &&
      firstName &&
      lastName &&
      nationalCode &&
      mobile &&
      medicalGroupTypeId &&
      medicalSystemNumber
    ) {
      const data = {
        doctorId: doctorId == null || doctorId == 0 ? null : doctorId,
        companyId,
        firstName,
        lastName,
        nationalCode,
        personnelNumber: personnelNumber == '' ? null : personnelNumber,
        mobile,
        birthdate: birthdate == '' ? null : birthdate,
        medicalGroupTypeId,
        medicalSystemNumber,
      };

      saveDoctor({ data, onSuccess: onSuccessSave, onFail });
    } else {
      !companyId && setErrorMessage('companyId');
      !firstName && setErrorMessage('firstName');
      !lastName && setErrorMessage('lastName');
      !nationalCode && setErrorMessage('nationalCode');
      !mobile && setErrorMessage('mobile');
      !medicalGroupTypeId && setErrorMessage('medicalGroupTypeId');
      !medicalSystemNumber && setErrorMessage('medicalSystemNumber');
    }

    handlegetDoctors('', 1);
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
      title: 'شماره موبایل',
      dataIndex: 'mobile',
      key: 'mobile',
      className: 'col-span-2',
    },
    {
      title: 'گروه پزشکی',
      dataIndex: 'medicalGroupTypeId',
      key: 'medicalGroupTypeId',
      className: 'col-span-2',
      render: (item: any, record: any) => (
        <span>{record.medicalGroupTypeName}</span>
      ),
    },
    {
      title: 'شماره نظام پزشکی',
      dataIndex: 'medicalSystemNumber',
      key: 'medicalSystemNumber',
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
          onConfirm={() => handleRemoveDoctor(record)}
        >
          <Icon name="icon-delete" classname="text-red cursor-pointer" />
        </Popconfirm>
      ),
    },
  ];

  ///////////End setup/////////

  ///////////Start API////////

  const handlegetDoctors = (text?: string, pageNo?: number) => {
    getDoctorList({
      data: {
        Filter: text,
        PageNumber: pageNo,
        PageSize,
        lang,
      },
      onSuccess: (res: any) => setState({ doctors: res }),
      onFail,
    });
  };
  const handleGetCompanyList = (text?: string, pageNo?: number) => {
    getCompanyList({
      data: {
        Filter: text,
        PageNumber: pageNo,
        PageSize,
        lang,
      },
      onSuccess: (res: any) => setState({ companyData: res }),
      onFail,
    });
  };

  const handelChangeUserStatus = (record: any) => {
    const data = {
      userId: record?.userId,
    };

    changeUserStatus({
      data,
      onSuccess: () => handlegetDoctors('', 1),
      onFail,
    });
  };
  const handleRemoveDoctor = (record: any) => {
    removeDoctor({
      data: record,
      onSuccess: () => handlegetDoctors('', 1),
      onFail,
    });
  };

  const handleGetDoctorInfo = (data: any) => {
 
    getDoctorInfo({
      data,
      onSuccess: (res: any) => {
        onEditDoctor(res);
      },
      onFail,
    });
  };
  const handleGetMedicalGroupTypes = (text?: string, pageNo?: number) => {
    getMedicalGroupTypes({
      data: {
        Filter: text,
        PageNumber: pageNo,
        PageSize,
        lang,
      },
      onSuccess: (res: any) => setState({ medicalGroupTypeData: res }),
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
            label="شماره پرسنلی"
            className=""
            value={personnelNumber}
            onChange={(value: any) =>
              setState({
                personnelNumber: value,
                personnelNumberError: '',
              })
            }
            // type="number"
          />
        </div>
        <div className="InsideryDateTextField w-80">
          <TextField
            label="شماره موبایل"
            className=""
            value={mobile}
            onChange={(value: any) =>
              setState({
                mobile: value,
                mobileError: '',
              })
            }
            // type="number"
          />
        </div>

        <div className="InsideryDateTextField w-80">
          <TextField
            label="شماره نظام پزشکی"
            className=""
            value={medicalSystemNumber}
            onChange={(value: any) =>
              setState({
                medicalSystemNumber: value,
                medicalSystemNumberError: '',
              })
            }
            type="number"
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
        <div className="InsideryDateTextField w-80">
          <AntdSelectSearch
            className="2xl:col-span-8 xl:col-span-8 lg:col-span-12 md:col-span-12  col-span-8"
            label=" محل خدمت پزشک"
            onChange={(value: any) => {
              if (value !== undefined) {
                setState({
                  companyId: value.companyId,
                });
              } else if (value == '') {
                setState({
                  companyId: null,
                });
              }
              handleGetCompanyList(value, 1);
            }}
            value={companyId}
            required
            data={companyData?.items}
            showKey="companyName"
            idKey="companyId"
          />
        </div>
        <div className="InsideryDateTextField w-80">
          <AntdSelectSearch
            className="2xl:col-span-8 xl:col-span-8 lg:col-span-12 md:col-span-12  col-span-8"
            label=" گروه شغلی پزشک"
            onChange={(value: any) => {
              if (value !== undefined) {
                setState({
                  medicalGroupTypeId: value.key,
                });
              } else if (value == '') {
                setState({
                  medicalGroupTypeId: null,
                });
              }
              handleGetMedicalGroupTypes(value, 1);
            }}
            value={medicalGroupTypeId}
            required
            data={medicalGroupTypeData}
            showKey="displayName"
            idKey="key"
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
          data={doctors?.items}
          onChangePage={onChangeTablePage}
          totalPages={doctors?.totalPages}
          pageSize={PageSize}
          pageNumber={pageNumber}
        />
      </div>
    </>
  );
};

export default withAlert(Doctor);
