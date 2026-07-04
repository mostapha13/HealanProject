import { getAppointmentInfo, getAppointmentList, getCurrentAppointment } from 'apps/cash-market/src/Controller/Healan';
import withAlert from 'apps/cash-market/src/hoc/withAlert'
import React from 'react'
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
import { HeaderTypes } from '@tse/types';
import {
  convertDateAndTimeToJalali,
  convertDateToJalaliYear,
  deSeparator,
  downloadFile,
  generateGuid,
  generateRandomNumber,
} from '@tse/tools';
import { Popconfirm, Tooltip } from 'antd';
import FindInPageOutlinedIcon from '@mui/icons-material/FindInPageOutlined';
import { Table } from '@tse/components/organism';

function order({onAlert}:any) {

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

 
  const [state,setState]=useStates<any>(initialState)

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

  const PageSize = 10;

useEffect(() => {
  handleGetCurrentAppointments('', 1, 'CurrentAppointmentListData');
 }, [])
  
 const setErrorMessage = (key: string) => {
  const errorMessage = ' ';
  setState({ [`${key}Error`]: errorMessage });
};

  ///////////End initial////////


  ///////////Start setup////////

  const onFail = (error: any) => {
    onAlert(error);
  };

  const onAppointmentInfoClick = (record: any) => {
    const data = { appointmentId: record };
    handleGetAppointmentInfo(data);
  };

  const onChangeFilterText = (filterText: string) => {
    handleGetCurrentAppointments(filterText, 1, 'AppointmentListData');
  };

  
  const onChangeTablePage = (pageNo: number) => {
    pageNo = pageNo == 0 ? 1 : pageNo;
    handleGetCurrentAppointments(filterText, pageNo, 'AppointmentListData');
    setState({ pageNumber: pageNo });
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
          {record.patient.firstName} {record.patient.lastName} ({record.patient.nationalCode})
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
      title: 'ثبت نسخه',
      dataIndex: 'appointmentId',
      key: 'appointmentId',
      className: 'col-span-1',
      render: (item: any) => {
        return (
          <>
         
            <a href={`/listing-basicdata/getOrder?appointmentId=${item}`}>
              <FindInPageOutlinedIcon className="text-listingTertiaryColor " />
            </a>
         
        </>
        );
      },
    },
  ];

  ///////////End setup////////

 ///////////Start API////////
 
   const handleGetCurrentAppointments = (
     text?: string,
     pageNo?: number,
     componentState?: string
   ) => {
    getCurrentAppointment({
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
        //   onEditUser(res);
         },
         onFail,
       });
     };
     
     
 ///////////End API////////
 return (
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
  )
}
export default withAlert(order)