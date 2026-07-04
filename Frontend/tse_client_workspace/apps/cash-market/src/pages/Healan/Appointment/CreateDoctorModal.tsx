import withAlert from 'apps/cash-market/src/hoc/withAlert';
import { useStates, useEffect } from '@tse/utils';
import { Modal, Popconfirm, Radio } from 'antd';
import { SymbolModal, Table } from '@tse/components/organism';
import { AntdSelectSearch, Button, Icon, TextField } from '@tse/components/atoms';
import { HeaderTypes, onAlertProps } from '@tse/types';
import React, { useMemo } from 'react';
import { DatePicker } from '@tse/components/molecules';
import NewSelect from 'apps/cash-market/src/components/atoms/NewSelect';
import { ListingCancelButton } from 'apps/cash-market/src/components/atoms/ListingCancelButton';
import { ListingSubmitButton } from 'apps/cash-market/src/components/atoms/ListingSubmitButton';
import { deSeparator } from '@tse/tools';
import { getCompanyList, getDoctorInfo, getDoctorList, getMedicalGroupTypes, removeDoctor, saveDoctor } from 'apps/cash-market/src/Controller/Healan';
import { HealanCancelButton } from 'apps/cash-market/src/components/Healan/HealanCancelButton';
import { HealanSubmitButton } from 'apps/cash-market/src/components/Healan/HealanSubmitButton';

export interface CreateDoctorModalProps {
  isOpen?: boolean;
  onChangeState?: any;
  onAlert?: any;
  onSuccessModalSave?: any;
  modalId?: string;
}
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

export function CreateDoctorModal(props: CreateDoctorModalProps) {
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
  const { isOpen, onChangeState, onAlert, onSuccessModalSave, modalId } = props;

  useEffect(() => {
    if (isOpen) {
      handleGetCompanyList('', 1);
      handleGetMedicalGroupTypes('', 1);
    }
  }, [isOpen]);
  const onFail = (error: any) => {
    onAlert(error);
  };
  const setErrorMessage = (key: string) => {
    const errorMessage = '.';
    setState({ [`${key}Error`]: errorMessage });
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
  
  const onCancelClick = () => {
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
    onChangeState('isOpenDoctorModal', false);
  };


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
      <Modal
        visible={isOpen}
        closable={false}
        style={{ textAlign: 'center', padding: '0px' }}
        title={
          modalId === 'doctor' ? 'افزودن پزشک' : 'افزودن پزشک'
        }
        footer={null}
        centered
        width={'80%'}
      >
 
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
    
            <div className="InsideryDatePicker w-60">
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

            <div className="InsideryDatePicker w-60">
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

            <div className="InsideryDatePicker w-60">
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

            <div className="InsideryDatePicker w-60">
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
             <div className="col-span-12 flex justify-end m-4">
               <HealanCancelButton onClick={onCancelClick} />
               <HealanSubmitButton
                 width={'w-[160px]'}
                 buttonName={'ثبت در سامانه'}
                 onClick={onSubmit}
               />
             </div>
            </div>
            
          </div>
   
      </Modal>
    </>
  );
}
