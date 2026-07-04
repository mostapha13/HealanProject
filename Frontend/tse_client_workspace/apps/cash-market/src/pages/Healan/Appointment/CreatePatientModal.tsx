import withAlert from 'apps/cash-market/src/hoc/withAlert';
import { useStates, useEffect } from '@tse/utils';
import { Modal, Popconfirm, Radio } from 'antd';
import { SymbolModal, Table } from '@tse/components/organism';
import { Button, Icon, TextField } from '@tse/components/atoms';
import { HeaderTypes, onAlertProps } from '@tse/types';
import React, { useMemo } from 'react';
import { DatePicker } from '@tse/components/molecules';
import NewSelect from 'apps/cash-market/src/components/atoms/NewSelect';
import { ListingCancelButton } from 'apps/cash-market/src/components/atoms/ListingCancelButton';
import { ListingSubmitButton } from 'apps/cash-market/src/components/atoms/ListingSubmitButton';
import { deSeparator } from '@tse/tools';
import { savePatient } from 'apps/cash-market/src/Controller/Healan';
import { HealanCancelButton } from 'apps/cash-market/src/components/Healan/HealanCancelButton';
import { HealanSubmitButton } from 'apps/cash-market/src/components/Healan/HealanSubmitButton';

export interface CreatePatientModalProps {
  isOpen?: boolean;
  onChangeState?: any;
  onAlert?: any;
  onSuccessModalSave?: any;
  modalId?: string;
}
const initialState = {
  modalPatientId: null,
  modalUserId: null,
  modalFirstName: '',
  modalLastName: '',
  modalNationalCode: '',
  modalPhoneNumber: '',
  modalBirthdate: null,
  modalServiceTypes: null,
  modalInsurances: null,
};

export function CreatePatientModal(props: CreatePatientModalProps) {
  const [state, setState] = useStates<any>(initialState);
  const {
    modalPatientId,
    modalUserId,
    modalFirstName,
    modalLastName,
    modalNationalCode,
    modalPhoneNumber,
    modalBirthdate,
    modalServiceTypes,
    modalInsurances,
  } = state;
  const { isOpen, onChangeState, onAlert, onSuccessModalSave, modalId } = props;

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

  const onSubmit = () => {
    if (
      modalFirstName &&
      modalLastName &&
      modalNationalCode &&
      modalPhoneNumber
    ) {
      const rawData = {
        firstName:modalFirstName,
        lastName:modalLastName,
        nationalCode: modalNationalCode == '' ? null : modalNationalCode,
        phoneNumber: modalPhoneNumber,
        birthdate: modalBirthdate == '' ? null : modalBirthdate,
        serviceTypes: modalServiceTypes == '' ? null : modalServiceTypes,
        insurances: modalInsurances == '' ? null : modalInsurances,
        patientId:
          modalPatientId == null || modalPatientId == 0 ? null : modalPatientId,
        userId: modalUserId == null || modalUserId == 0 ? null : modalUserId,
      };
      const data = Object.fromEntries(
        Object.entries(rawData).filter(
          ([key, value]) => value !== '' && value !== null
        )
      );

      savePatient({ data, onSuccess: onSuccessSave, onFail });
    } else {
      !modalFirstName && setErrorMessage('modalFirstName');
      !modalLastName && setErrorMessage('modalLastName');
      !modalNationalCode && setErrorMessage('modalNationalCode');
      !modalPhoneNumber && setErrorMessage('modalPhoneNumber');
    }
  };
  const onSuccessSave = (res: any) => {
    setState({
      modalPatientId: null,
      modalUserId: null,
      modalFirstName: '',
      modalLastName: '',
      modalNationalCode: '',
      modalPhoneNumber: '',
      modalBirthdate: null,
      modalServiceTypes: null,
      modalInsurances: null,
    });
    // handlegetpatients('', 1);
    onAlert({
      type: 'success',
      message: 'اطلاعات با موفقیت ثبت گردید',
    });
  };

  const onCancelClick = () => {
    setState({
      modalCompanyName: '',
      modalCompanyNameError: false,
      modalWebSite: '',
      modalPrefixNumber: '',
      modalLandline: '',
      modalEmail: '',
      modalAddress: '',
      modalCompanyRegistrationTypeData: '',
      modalCompanyRegistrationTypeId: '',
      modalCompanyRegistrationTypeName: '',
      modalCompanyRegistrationTypeError: false,
      modalNationalId: '',
      modalNationalIdError: false,
    });
    onChangeState('isOpenPatientModal', false);
  };
  return (
    <>
      <Modal
        visible={isOpen}
        closable={false}
        style={{ textAlign: 'center', padding: '0px' }}
        title={modalId === 'patient' ? 'ایجاد  بیمار' : 'ایجاد بیمار '}
        footer={null}
        centered
        width={'80%'}
      >
        <div className="shadow-[0_0_15px_-10px_rgba(0,0,0,0.75)] rounded-[10px] p-[30px] bg-white min-h-[100px] flex flex-wrap gap-6">
          <div className="InsideryDateTextField w-80">
            <TextField
              label="نام"
              className=""
              value={modalFirstName}
              onChange={(value: any) =>
                setState({
                  modalFirstName: value,
                  modalfirstNameError: '',
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
              value={modalLastName}
              onChange={(value: any) =>
                setState({
                  modalLastName: value,
                  modalLastNameError: '',
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
              value={modalNationalCode}
              onChange={(value: any) =>
                setState({
                  modalNationalCode: value,
                  modalNationalCodeError: '',
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
              value={modalPhoneNumber}
              onChange={(value: any) =>
                setState({
                  modalPhoneNumber: value,
                  modalPhoneNumberError: '',
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
              value={modalBirthdate}
              onChange={(value: any) =>
                setState({
                  modalBirthdate: value,
                  modalBirthdateError: '',
                })
              }
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
            </div>{' '}
          </div>
        </div>
      </Modal>
    </>
  );
}
