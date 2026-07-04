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

export interface CreatePrescriptionDrugModalProps {
  isOpen?: boolean;
  onChangeState?: any;
  onAlert?: any;
  onSuccessModalSave?: any;
  modalId?: string;
}
const initialState = {
  tempPrescriptionDrug:[],
  prescriptionDrug:[],
  prescriptionDrugId:'',
  prescriptionId:'',
  drugName:'',
  dosage:'',
  usageInstructions:'',
  filter: '',
  pageNumber: 1,
  lang: 'Fa',
};
const PageSize = 10;

export function CreatePrescriptionDrugModal(props: CreatePrescriptionDrugModalProps) {
  const [state, setState] = useStates<any>(initialState);
  const {
    tempPrescriptionDrug,
    prescriptionDrug,
    prescriptionDrugId,
    prescriptionId,
    drugName,
    dosage,
    usageInstructions,
    filter,
    pageNumber,
    lang
  } = state;
  const { isOpen, onChangeState, onAlert, onSuccessModalSave, modalId } = props;



  ///////////ُStart setup////////

  

  const formTableHeader: HeaderTypes[] = [
    {
      title: 'نام دارو',
      dataIndex: 'drugName',
      key: 'drugName',
      className: 'col-span-2',
      render: (item: any, record: any) => (
        <span>{record?.drugName}</span>
      ),
    },
    {
      title: 'دوز',
      dataIndex: 'dosage',
      key: 'dosage',
      className: 'col-span-2',
      render: (item: any, record: any) => (
        <span>
          {record.dosage}
        </span>
      ),
    },

    {
      title: 'نحوه استفاده',
      dataIndex: 'usageInstructions',
      key: 'usageInstructions',
      className: 'col-span-7',
      render: (item: any, record: any) => (
        <span>
          {record.usageInstructions}
        </span>
      ),
    }   
  ];
  
  ///////////End setup////////
  useEffect(() => {
    if (isOpen) {

    }
  }, [isOpen]);

  const onFail = (error: any) => {
    onAlert(error);
  };
  const setErrorMessage = (key: string) => {
    const errorMessage = '.';
    setState({ [`${key}Error`]: errorMessage });
  };
 const onTempSubmit=()=>{

  if (
    // prescriptionId &&
    drugName &&
    dosage &&
    usageInstructions
  ) {
    const data = 
    {
      _tempId:Date.now(),
      prescriptionDrugId: prescriptionDrugId == null || prescriptionDrugId == 0 ? null : prescriptionDrugId,
      prescriptionId,
      drugName,
      dosage,
      usageInstructions
    };
    handleSaveTempDrug(data);
  } else {
    !prescriptionId && setErrorMessage('prescriptionId');
    !drugName && setErrorMessage('drugName');
    !dosage && setErrorMessage('dosage');
    !usageInstructions && setErrorMessage('usageInstructions');
  }
 }


  const onSubmit = () => {
    if (
      prescriptionId &&
      drugName &&
      dosage &&
      usageInstructions
    ) {
      const data = 
      {
        prescriptionDrugId: prescriptionDrugId == null || prescriptionDrugId == 0 ? null : prescriptionDrugId,
        prescriptionId,
        drugName,
        dosage,
        usageInstructions
      };

      saveDoctor({ data, onSuccess: onSuccessSave, onFail });
    } else {
      !prescriptionId && setErrorMessage('prescriptionId');
      !drugName && setErrorMessage('drugName');
      !dosage && setErrorMessage('dosage');
      !usageInstructions && setErrorMessage('usageInstructions');
    }

    // handlegetDoctors('', 1);
  };
  const onSuccessSave = (res: any) => {
    setState({
      prescriptionDrug:[],
      prescriptionDrugId:'',
      prescriptionId:'',
      drugName:'',
      dosage:'',
      usageInstructions:'',
      filter: '',
      pageNumber: 1,
      lang: 'Fa'      
    });
    handlegetDoctors('', 1);
    onAlert({
      type: 'success',
      message: 'اطلاعات با موفقیت ثبت گردید',
    });
  };
  
  const onCancelClick = () => {
    setState({
      prescriptionDrug:[],
      prescriptionDrugId:'',
      prescriptionId:'',
      drugName:'',
      dosage:'',
      usageInstructions:'',
      filter: '',
      pageNumber: 1,
      lang: 'Fa'   
    });
    onChangeState('isOpenPrescriptionDrugModal', false);
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
  
 const handleSaveTempDrug=(data:any)=>{ 
  console.log(data)
  setState((prev:any)=>({
    tempPrescriptionDrug:[...prev.tempPrescriptionDrug || [],data]
  }))

 }
    
    ////////////End API////////
    
  return (
    <>
      <Modal
        visible={isOpen}
        closable={false}
        style={{ textAlign: 'center', padding: '0px' }}
        title={
          modalId === 'prescriptionDrugModal' ? 'افزودن دارو' : 'افزودن دارو'
        }
        footer={null}
        centered
        width={'80%'}
      >
 
        <div className="shadow-[0_0_15px_-10px_rgba(0,0,0,0.75)] rounded-[10px] p-[30px] bg-white min-h-[100px] flex flex-wrap gap-6">
            <div className="InsideryDateTextField w-80">
                       <TextField
                         label="نام دارو"
                         className=""
                         value={drugName}
                         onChange={(value: any) =>
                           setState({
                            drugName: value,
                            drugNameError: '',
                           })
                         }
                         required
                         errorMessage={state?.drugNameError}
                         // type="number"
                       />
            </div>
    
            <div className="InsideryDateTextField w-80">
               <TextField
                    label="دوز دارو"
                    className=""
                    value={dosage}
                    onChange={(value: any) =>
                      setState({
                        dosage: value,
                        dosageError: '',
                      })
                    }
                    required
                    errorMessage={state?.dosageError}
                    // type="number"
                  />
            </div>
    
            <div className="InsideryDateTextField w-80">
                    <TextField
                      label="نحوه استفاده"
                      className=""
                      required
                      value={usageInstructions}
                      onChange={(value: any) =>
                        setState({
                          usageInstructions: value,
                          usageInstructionsError: '',
                        })
                      }
                      errorMessage={state?.usageInstructionsError}
                      // type="number"
                    />
            </div>
     
            <div className="InsideryDateTextField w-80">
            <HealanSubmitButton
                 buttonName={'افزودن'}
                 onClick={onTempSubmit}
               />
            </div>
 
         

            
          </div>
   
              <div className="col-span-12 my-4">
                <Table
                   columns={formTableHeader}
                  className="col-span-12 grid grid-cols-12 "
                   data={tempPrescriptionDrug}
                  // onChangePage={onChangeTablePage}
                  // totalPages={AppointmentListData?.totalPages}
                  pageSize={PageSize}
                  pageNumber={pageNumber}
                  rowKey='_tempId'
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
      </Modal>
    </>
  );
}
