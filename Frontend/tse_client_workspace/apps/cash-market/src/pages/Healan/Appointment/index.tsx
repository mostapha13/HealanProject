import React from 'react';
import withAlert from 'apps/cash-market/src/hoc/withAlert';
import {
  useStates,
  useEffect,
  useState,
  useNavigate,
  useSearchParams,
} from '@tse/utils';
import {
  AntdSelectSearch,
  Icon,
  Image,
  NewSelectSearch,
  SelectMultiple,
  TextField,
  Upload,
} from '@tse/components/atoms';
import NewSelect from 'apps/cash-market/src/components/atoms/NewSelect';
import Checkbox from '@mui/material/Checkbox';
import { Table } from '@tse/components/organism';
import { HeaderTypes } from '@tse/types';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import FindInPageOutlinedIcon from '@mui/icons-material/FindInPageOutlined';
import { downloadFileApi, uploadFile } from 'apps/cash-market/src/Controller';
import { Popconfirm, Tooltip } from 'antd';
import { ListingCreateButton } from 'apps/cash-market/src/components/atoms/ListingCreateButton';
import { CreatePatientModal } from './CreatePatientModal';
import {
  convertDateAndTimeToJalali,
  convertDateToJalaliYear,
  deSeparator,
  downloadFile,
  generateGuid,
  generateRandomNumber,
} from '@tse/tools';
import {
  getAuditingPostType,
  getCompanyInfo,
  getCompanyList,
  getCompanyRegistrationTypes,
  getCompanyTypes,
  getCompanyUserPostTypes,
  getUsers,
  registerCompany,
} from 'apps/cash-market/src/Controller/Listing/BasicData';
import { DownloadOutlined } from '@ant-design/icons';
import { ListingUploadLogo } from 'apps/cash-market/src/components/ListingLogoUpload';
import {
  getAppointmentInfo,
  getAppointmentList,
  getDoctorList,
  getInsuranceList,
  getPatientList,
  getserviceType,
  saveAppointment,
} from 'apps/cash-market/src/Controller/Healan';
import { HealanSubmitButton } from 'apps/cash-market/src/components/Healan/HealanSubmitButton';
import FormControlLabel from '@mui/material/FormControlLabel';
import { CreateDoctorModal } from './CreateDoctorModal';

function AcceptanceCompanies({ onAlert }: any) {
  ///////////Start initial///////
  const initialState = {
    serviceTypesData: [],
    appointments: [],
    AppointmentId: '',
    PatientId: '',
    Patient: null,
    PatientName: '',
    PatientNameError: false,
    DoctorId: '',
    Doctor: null,
    DoctorName: '',
    DoctorNameError: false,
    DurationMinutes: '',
    Note: '',
    PrimaryInsuranceCompanyId: null,
    PrimaryInsuranceCompany: null,
    ConfirmPrimaryInsuranceCompany: '',
    SecondInsuranceCompanyId: null,
    SecondInsuranceCompany: null,
    ConfirmSecondInsuranceCompany: '',
    serviceTypeIds: [],
    serviceTypeIdsError: false,
    PatientData: [],
    DoctorData: [],
    filterText: '',
    AppointmentListData: [],
    InsuranceData: [],
    modalId: '',
    pageNumber: 1,
  };
  const PageSize = 10;

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useStates<any>(initialState);

  const setErrorMessage = (key: string) => {
    const errorMessage = ' ';
    setState({ [`${key}Error`]: errorMessage });
  };

  const {
    serviceTypesData,
    appointments,
    AppointmentId,
    PatientId,
    Patient,
    PatientName,
    PatientNameError,
    DoctorId,
    Doctor,
    DoctorName,
    DoctorNameError,
    DurationMinutes,
    Note,
    PrimaryInsuranceCompanyId,
    PrimaryInsuranceCompany,
    ConfirmPrimaryInsuranceCompany,
    SecondInsuranceCompanyId,
    SecondInsuranceCompany,
    ConfirmSecondInsuranceCompany,
    serviceTypeIds,
    serviceTypeIdsError,
    PatientData,
    DoctorData,
    filterText,
    AppointmentListData,
    InsuranceData,
    modalId,
    isOpenPatientModal,
    isOpenDoctorModal,
    pageNumber,
  } = state;

  useEffect(() => {
    handleGetappointments('', 1, 'AppointmentListData');
    handleGetserviceTypesData('', 1);
    handleGetDoctorList('', 1, 'DoctorData');
    handleGetPatientList('', 1, 'PatientData');
    handleGetInsuranceList('', 1, 'InsuranceData');
  }, []);
  ///////////End initial////////

  ///////////Start setup////////

  const onFail = (error: any) => {
    onAlert(error);
  };

  const onSuccessSave = (res: any) => {
    setState({
      appointments: [],
      serviceTypesData: [],
      filter: '',
      pageNumber: 1,
      lang: 'Fa',
      AppointmentId: '',
      PatientId: '',
      Patient: null,
      PatientName: '',
      PatientNameError: false,
      DoctorId: '',
      Doctor: null,
      DurationMinutes: '',
      Note: '',
      PrimaryInsuranceCompanyId: null,
      PrimaryInsuranceCompany: null,
      ConfirmPrimaryInsuranceCompany: '',
      SecondInsuranceCompanyId: null,
      SecondInsuranceCompany: null,
      ConfirmSecondInsuranceCompany: '',
      serviceTypeIds: [],
    });

    handleGetappointments('', 1, 'AppointmentListData');
    onAlert({
      type: 'success',
      message: 'اطلاعات با موفقیت ثبت گردید',
    });
  };

  const onChangeTablePage = (pageNo: number) => {
    pageNo = pageNo == 0 ? 1 : pageNo;
    handleGetappointments(filterText, pageNo, 'AppointmentListData');
    setState({ pageNumber: pageNo });
  };

  const onChangeFilterText = (filterText: string) => {
    handleGetappointments(filterText, 1, 'AppointmentListData');
  };

  const onEditClick = (record: any) => {
    const data = { appointmentId: record };
    handleGetAppointmentInfo(data);
  };

  const onChangeState = (key: string, value: string) => {
    setState({
      [key]: value,
    });
  };

  const onSuccessPatientModalSave = () => {
    ///get companylist
    handleGetPatientList('', 1, 'All');
  };

  const onSuccessDoctorModalSave = () => {
    ///get companylist
    handleGetDoctorList('', 1, 'All');
  };

  const onEditUser = (userInfoList: any) => {
    handleGetserviceTypesData('', 1);
    handleGetappointments('', 1, 'AppointmentListData');
    const serviceTypeIds = userInfoList?.serviceTypes?.map((item: any) => {
      return item?.serviceTypeId;
    });
    setState({
      AppointmentId: userInfoList.appointmentId,
      PatientId: userInfoList.patientId,
      Patient: userInfoList.patient,
      PatientName: userInfoList.patientName,
      DoctorId: userInfoList.doctorId,
      Doctor: userInfoList.doctor,
      DurationMinutes: userInfoList.durationMinutes,
      Note: userInfoList.note,
      PrimaryInsuranceCompanyId: userInfoList.primaryInsuranceCompanyId,
      PrimaryInsuranceCompany: userInfoList.primaryInsuranceCompany,
      ConfirmPrimaryInsuranceCompany:
        userInfoList.confirmPrimaryInsuranceCompany,
      SecondInsuranceCompanyId: userInfoList.secondInsuranceCompanyId,
      SecondInsuranceCompany: userInfoList.secondInsuranceCompany,
      ConfirmSecondInsuranceCompany: userInfoList.confirmSecondInsuranceCompany,
      serviceTypeIds: serviceTypeIds || [],
    });
  };

  const onSubmit = () => {
    if (PatientId && DoctorId) {
      const data = {
        AppointmentId: AppointmentId == '' ? null : AppointmentId,
        PatientId: PatientId,
        DoctorId: DoctorId,
        DurationMinutes: DurationMinutes == '' ? null : DurationMinutes,
        Note: Note == '' ? null : Note,
        PrimaryInsuranceCompanyId:
          PrimaryInsuranceCompanyId == '' ? null : PrimaryInsuranceCompanyId,
        ConfirmPrimaryInsuranceCompany:
          ConfirmPrimaryInsuranceCompany == ''
            ? false
            : ConfirmPrimaryInsuranceCompany,
        SecondInsuranceCompanyId:
          SecondInsuranceCompanyId == '' ? null : SecondInsuranceCompanyId,
        ConfirmSecondInsuranceCompany:
          ConfirmSecondInsuranceCompany == ''
            ? false
            : ConfirmSecondInsuranceCompany,
        serviceTypeIds: serviceTypeIds == '' ? null : serviceTypeIds,
      };

      saveAppointment({ data, onSuccess: onSuccessSave, onFail });
    } else {
      !PatientName && setErrorMessage('PatientName');
      !DoctorId && setErrorMessage('DoctorId');
    }

    handleGetappointments('', 1);
  };
  const formTableHeader: HeaderTypes[] = [
    {
      title: 'تاریخ ویزیت',
      dataIndex: 'appointmentDate',
      key: 'appointmentDate',
      className: 'col-span-1',
      render: (item: any, record: any) => (
        <span>{convertDateAndTimeToJalali(record?.appointmentDate)}</span>
      ),
    },
    {
      title: 'نام بیمار',
      dataIndex: 'patientId',
      key: 'patientId',
      className: 'col-span-2',
      render: (item: any, record: any) => (
        <span>
          {record.patient.firstName} {record.patient.lastName}
        </span>
      ),
    },
    {
      title: 'نام دکتر',
      dataIndex: 'doctorId',
      key: 'doctorId',
      className: 'col-span-1',
      render: (item: any, record: any) => (
        <span>
          {record.doctor.firstName} {record.doctor.lastName}
        </span>
      ),
    },
    {
      title: 'مدت زمان ویزیت',
      dataIndex: 'durationMinutes',
      key: 'durationMinutes',
      className: 'col-span-1',
    },
    {
      title: 'یادداشت مسئول پذیرش',
      dataIndex: 'note',
      key: 'note',
      className: 'col-span-1',
      render: (item: any) => (
        <Tooltip title={item} placement="right">
          <span>{item.length > 13 ? item.substring(0, 10) + '...' : item}</span>
        </Tooltip>
      ),
    },
    {
      title: 'بیمه اصلی',
      dataIndex: 'primaryInsuranceCompanyId',
      key: 'primaryInsuranceCompanyId',
      className: 'col-span-1',
      render: (item: any, record: any) => (
        <>
          <span>{record.primaryInsuranceCompany?.name}</span>
          <span>
            {record.confirmPrimaryInsuranceCompany ? (
              <Icon name="icon-ok" classname="text-green text-base pt-1" />
            ) : (
              <Icon
                name="icon-cancel"
                classname=" text-dossierModalTableRejectButton text-base pt-1"
              />
            )}
          </span>
        </>
      ),
    },
    {
      title: 'بیمه تکمیلی',
      dataIndex: 'secondInsuranceCompanyId',
      key: 'secondInsuranceCompanyId',
      className: 'col-span-1',
      render: (item: any, record: any) => (
        <>
          <span>{record.secondInsuranceCompany?.name}</span>
          <span>
            {record.confirmSecondInsuranceCompany ? (
              <Icon name="icon-ok" classname="text-green text-base pt-1" />
            ) : (
              <Icon
                name="icon-cancel"
                classname=" text-dossierModalTableRejectButton text-base pt-1"
              />
            )}
          </span>
        </>
      ),
    },

    {
      title: 'خدمات ارائه شده',
      dataIndex: 'serviceTypes',
      key: 'serviceTypes',
      className: 'col-span-1',
      render: (item: any, record: any) =>
        record.serviceTypes.map((service: any) => service.title).join('\n '),
    },
    {
      title: 'پرداخت',
      dataIndex: 'appointmentId',
      key: 'appointmentId',
      className: 'col-span-1',
      render: (item: any, record: any) => {
        return (
          <>
            {record?.invoices[0]?.invoiceStatusTypeId != undefined &&
            record?.invoices[0]?.invoiceStatusTypeId == 'Paied' ? (
              <Icon name="icon-ok" classname="text-green text-base pt-1" />
            ) : (
              <a href={`/listing-basicdata/getInvoice?appointmentId=${item}`}>
                <FindInPageOutlinedIcon className="text-listingTertiaryColor " />
              </a>
            )}
          </>
        );
      },
    },
    {
      title: 'ویرایش',
      dataIndex: 'appointmentId',
      key: 'appointmentId',
      className: 'col-span-1',
      render: (item: any) => {
        return (
          <Icon
            name="icon-edit"
            classname="text-listingTertiaryColor text-lg cursor-pointer"
            onClick={() => onEditClick(item)}
          />
        );
      },
    },
  ];

  ///////////End setup////////

  ///////////Start API////////

  const handleGetappointments = (
    text?: string,
    pageNo?: number,
    componentState?: string
  ) => {
    getAppointmentList({
      data: {
        FilterText: text,
        PageNumber: pageNo,
        PageSize,
      },
      onSuccess: (res: any) => {
        if (componentState === 'AppointmentListData') {
          setState({
            AppointmentListData: res,
          });
        } else {
          setState({ [`${componentState}`]: res });
        }
      },
      onFail,
    });
  };

  const handleGetAppointmentInfo = (data: any) => {
    getAppointmentInfo({
      data,
      onSuccess: (res: any) => {
        onEditUser(res);
      },
      onFail,
    });
  };

  const handleGetserviceTypesData = (text: string, pageNo?: number) => {
    const data = {
      FilterText: text,
      PageNumber: pageNo,
      PageSize,
    };
    getserviceType({
      data,
      onSuccess: (res: any) => {
        setState({
          // serviceTypeIds: res.items,
          serviceTypesData: res.items,
        });
      },
      onFail,
    });
  };

  const handleGetPatientList = (
    text?: string,
    pageNo?: number,
    componentState?: string
  ) => {
    getPatientList({
      data: {
        FilterText: text,
        PageNumber: pageNo,
        PageSize,
      },
      onSuccess: (res: any) => {
        if (componentState === 'PatientData') {
          setState({
            PatientData: res,
          });
        } else {
          setState({ [`${componentState}`]: res });
        }
      },
      onFail,
    });
  };

  const handleGetDoctorList = (
    text?: string,
    pageNo?: number,
    componentState?: string
  ) => {
    getDoctorList({
      data: {
        FilterText: text,
        PageNumber: pageNo,
        PageSize,
      },
      onSuccess: (res: any) => {
        if (componentState === 'DoctorData') {
          setState({
            DoctorData: res,
          });
        } else {
          setState({ [`${componentState}`]: res });
        }
      },
      onFail,
    });
  };

  const handleGetInsuranceList = (
    text?: string,
    pageNo?: number,
    componentState?: string
  ) => {
    getInsuranceList({
      data: {
        FilterText: text,
        PageNumber: pageNo,
        PageSize,
      },
      onSuccess: (res: any) => {
        if (componentState === 'insuranceData') {
          setState({
            InsuranceData: res,
          });
        } else {
          setState({ [`${componentState}`]: res });
        }
      },
      onFail,
    });
  };

  ////////////End API////////

  return (
    <>
      <div className="border-2 border-lightGray  grid grid-cols-12">
        <div className=" col-span-12 items-start flex border-b-2 border-lightGray">
          <span className=" p-2 font-bold">فرم ثبت ویزیت بیمار</span>
        </div>

        <div className="col-span-12 grid grid-cols-12 gap-4 m-4 mt-8">
          <div className="col-span-12 flex justify-between mx-4 mt-8 border-b border-listingTertiaryColor">
            <span className=" p-4  text-listingTertiaryColor "> بیمار :</span>
            <div className="col-span-12 flex justify-end mx-4 ">
              <HealanSubmitButton
                width={'w-[160px]'}
                buttonName="افزودن بیمار"
                onClick={() => {
                  setState({
                    modalId: 'patient',
                    isOpenPatientModal: true,
                  });
                }}
              />
            </div>
          </div>
          <div className="col-span-12 grid grid-cols-12 gap-4 m-4 mt-8">
            <AntdSelectSearch
              className="2xl:col-span-4 xl:col-span-4 lg:col-span-12 md:col-span-12  col-span-4"
              label="بیمار"
              onChange={(value: any) => {
                if (value?.fullName !== undefined) {
                  setState({
                    PatientId: value.patientId,
                    Patient: value,
                  });
                } else if (value == '') {
                  setState({
                    PatientId: null,
                  });
                }
                handleGetPatientList(value, 1, 'PatientData');
              }}
              value={Patient}
              required
              data={PatientData?.items}
              showKey="fullName"
              idKey="patientId"
            />
          </div>

          <div className="col-span-12 flex justify-between mx-4 mt-8 border-b border-listingTertiaryColor">
            <span className=" p-4  text-listingTertiaryColor "> پزشک :</span>

            <div className="col-span-12 flex justify-end mx-4 ">
              <HealanSubmitButton
                width={'w-[160px]'}
                buttonName="افزودن پزشک"
                onClick={() => {
                  setState({
                    modalId: 'doctor',
                    isOpenDoctorModal: true,
                  });
                }}
              />
            </div>
          </div>
          <div className="col-span-12 grid grid-cols-12 gap-4 m-4 mt-8">
            <AntdSelectSearch
              className="2xl:col-span-8 xl:col-span-8 lg:col-span-12 md:col-span-12  col-span-4"
              label="پزشک"
              onChange={(value: any) => {
                if (value?.fullName !== undefined) {
                  setState({
                    DoctorId: value.doctorId,
                    Doctor: value,
                  });
                } else if (value == '') {
                  setState({
                    DoctorId: null,
                  });
                }
                handleGetDoctorList(value, 1, 'DoctorData');
              }}
              value={Doctor}
              required
              data={DoctorData?.items}
              showKey="fullName"
              idKey="doctorId"
            />
          </div>
          <div className="col-span-12 items-start   mx-4 mt-4 border-b border-listingTertiaryColor">
            <span className=" p-4  text-listingTertiaryColor ">
              مشخصات بیمار :
            </span>
          </div>
          <TextField
            label="مدت زمان تقریبی ویزیت"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            value={deSeparator(DurationMinutes)}
            onChange={(value: any) =>
              setState({
                DurationMinutes: value,
              })
            }
            maxLength={2}
          />
          <TextField
            label="یادداشت مسئول پذیرش"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            value={Note}
            onChange={(value: any) => {
              setState({
                Note: value,
                NoteError: '',
              });
            }}
            required
            error={state?.NoteError}
          />

          <AntdSelectSearch
            className="2xl:col-span-8 xl:col-span-8 lg:col-span-12 md:col-span-12  col-span-4"
            label="بیمه اصلی"
            onChange={(value: any) => {
              if (value !== undefined) {
                setState({
                  PrimaryInsuranceCompanyId: value.insuranceCompanyId,
                  PrimaryInsuranceCompany: value,
                });
              } else if (value == '') {
                setState({
                  PrimaryInsuranceCompanyId: null,
                });
              }
              handleGetInsuranceList(value, 1, 'insuranceData');
            }}
            value={PrimaryInsuranceCompany}
            required
            data={InsuranceData?.items}
            showKey="name"
            idKey="insuranceCompanyId"
          />

          <FormControlLabel
            control={<Checkbox checked={ConfirmPrimaryInsuranceCompany} />}
            label="تایید بیمه اصلی"
            className="!m-0 !text-extratiny col-span-3"
            onClick={() =>
              setState({
                ConfirmPrimaryInsuranceCompany: !ConfirmPrimaryInsuranceCompany,
              })
            }
          />

          <AntdSelectSearch
            className="2xl:col-span-8 xl:col-span-8 lg:col-span-12 md:col-span-12  col-span-4"
            label="بیمه تکمیلی"
            onChange={(value: any) => {
              if (value !== undefined) {
                setState({
                  SecondInsuranceCompanyId: value.insuranceCompanyId,
                  SecondInsuranceCompany: value,
                });
              } else if (value == '') {
                setState({
                  SecondInsuranceCompanyId: null,
                });
              }
              handleGetInsuranceList(value, 1, 'insuranceData');
            }}
            value={SecondInsuranceCompany}
            required
            data={InsuranceData?.items}
            showKey="name"
            idKey="insuranceCompanyId"
          />

          <FormControlLabel
            control={<Checkbox checked={ConfirmSecondInsuranceCompany} />}
            label="تایید بیمه تکمیلی"
            className="!m-0 !text-extratiny col-span-3"
            onClick={() =>
              setState({
                ConfirmSecondInsuranceCompany: !ConfirmSecondInsuranceCompany,
              })
            }
          />
        </div>
        <div className="col-span-12 items-start  mx-4 mt-8 border-b border-listingTertiaryColor">
          <span className=" p-4 text-listingTertiaryColor ">نوع خدمات :</span>
        </div>
        <div className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 m-5 md:col-span-6 col-span-4">
          <SelectMultiple
            placeholder="خدمات درخواستی بیمار"
            options={serviceTypesData}
            value={serviceTypeIds}
            limit={10}
            onChange={(value: any) => {
              setState({
                serviceTypeIds: value,
                serviceTypeIdsError: false,
              });
            }}
            showKey="title"
            selectedKey="serviceTypeId"
            error={serviceTypeIdsError}
            required
          />
        </div>
      </div>

      <div className="col-span-12 flex justify-end mx-4 ">
        <HealanSubmitButton
          width={'w-[160px]'}
          buttonName={'ثبت در سامانه'}
          onClick={onSubmit}
        />
      </div>
      <div className="col-span-12 grid grid-cols-12 justify-end m-4 mt-8">
        <TextField
          label="جستجو"
          className="2xl:col-span-3 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
          value={filterText}
          onChange={(value: any) => {
            onChangeFilterText(value);
            setState({
              filterText: value,
            });
          }}
        />
        <div className="col-span-12 my-4">
          <Table
            columns={formTableHeader}
            className="col-span-12 grid grid-cols-12 "
            data={AppointmentListData?.items}
            onChangePage={onChangeTablePage}
            totalPages={AppointmentListData?.totalPages}
            pageSize={PageSize}
            pageNumber={pageNumber}
          />
        </div>
      </div>

      <CreatePatientModal
        modalId={modalId}
        isOpen={isOpenPatientModal}
        onChangeState={onChangeState}
        onAlert={onAlert}
        onSuccessModalSave={onSuccessPatientModalSave}
      />

      <CreateDoctorModal
        modalId={modalId}
        isOpen={isOpenDoctorModal}
        onChangeState={onChangeState}
        onAlert={onAlert}
        onSuccessModalSave={onSuccessDoctorModalSave}
      />
    </>
  );
}

export default withAlert(AcceptanceCompanies);
