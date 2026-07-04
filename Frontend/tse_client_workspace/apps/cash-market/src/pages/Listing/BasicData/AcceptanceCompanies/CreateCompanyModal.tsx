import withAlert from 'apps/cash-market/src/hoc/withAlert';
import { useStates, useEffect } from '@tse/utils';
import { Modal, Popconfirm, Radio } from 'antd';
import { SymbolModal, Table } from '@tse/components/organism';
import { Button, Icon, TextField } from '@tse/components/atoms';
import { HeaderTypes, onAlertProps } from '@tse/types';
import React, { useMemo } from 'react';

import NewSelect from 'apps/cash-market/src/components/atoms/NewSelect';
import { ListingCancelButton } from 'apps/cash-market/src/components/atoms/ListingCancelButton';
import { ListingSubmitButton } from 'apps/cash-market/src/components/atoms/ListingSubmitButton';
import { deSeparator } from '@tse/tools';
import {
  getCompanyRegistrationTypes,
  registerCompany,
} from 'apps/cash-market/src/Controller/Listing/BasicData';
export interface CreateCompanyModalProps {
  isOpen?: boolean;
  onChangeState?: any;
  onAlert?: any;
  onSuccessModalSave?: any;
  modalId?: string;
}
const initialState = {
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
};
export function CreateCompanyModal(props: CreateCompanyModalProps) {
  const [state, setState] = useStates<any>(initialState);
  const {
    modalCompanyName,
    modalCompanyNameError,
    modalWebSite,
    modalPrefixNumber,
    modalLandline,
    modalEmail,
    modalAddress,
    modalCompanyRegistrationTypeData,
    modalCompanyRegistrationTypeId,
    modalCompanyRegistrationTypeName,
    modalNationalId,
    modalNationalIdError,
    modalCompanyRegistrationTypeError,
  } = state;
  const { isOpen, onChangeState, onAlert, onSuccessModalSave, modalId } = props;

  useEffect(() => {
    if (isOpen) {
      handelGetCompanyRegistrationTypes();
    }
  }, [isOpen]);
  const onFail = (error: any) => {
    onAlert(error);
  };
  const setErrorMessage = (key: string) => {
    const errorMessage = '.';
    setState({ [`${key}Error`]: errorMessage });
  };
  const handelGetCompanyRegistrationTypes = () => {
    getCompanyRegistrationTypes({
      onSuccess: (res: any) =>
        setState({ modalCompanyRegistrationTypeData: res }),
      onFail,
    });
  };
  const onRegisterCompanyClick = () => {
    if (modalCompanyName && modalNationalId && modalCompanyRegistrationTypeId) {
      const rawData = {
        companyName: modalCompanyName,
        webSite: modalWebSite,
        prefixNumber: modalPrefixNumber,
        landline: modalLandline,
        email: modalEmail,
        address: modalAddress,
        companyRegistrationTypeId: modalCompanyRegistrationTypeId,
        nationalId: modalNationalId,
      };
      const data = Object.fromEntries(
        Object.entries(rawData).filter(
          ([key, value]) => value !== '' && value !== null
        )
      );
      registerCompany({
        data,
        onSuccess: (res: any) => onSuccessSaveRegisterCompany(res),
        onFail,
      });
    } else {
      !modalCompanyName && setErrorMessage('modalCompanyName');
      !modalNationalId && setErrorMessage('modalNationalId');
      !modalCompanyRegistrationTypeId &&
        setErrorMessage('modalCompanyRegistrationType');
    }
  };
  const onSuccessSaveRegisterCompany = (res: any) => {
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
    onAlert({ message: 'عملیات با موفقیت انجام شد', type: 'success' });
    onChangeState('isOpenCreateCompanyModal', false);
    onSuccessModalSave();
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
    onChangeState('isOpenCreateCompanyModal', false);
  };
  return (
    <>
      <Modal
        visible={isOpen}
        closable={false}
        style={{ textAlign: 'center', padding: '0px' }}
        title={
          modalId === 'mainCompany' ? 'ایجاد شرکت مادر' : 'ایجاد شرکت زیرمجموعه'
        }
        footer={null}
        centered
        width={'80%'}
      >
        <div className="grid grid-cols-12 gap-4 mt-8  ">
          <div className="col-span-12 grid grid-cols-12 gap-4 m-4 mt-8">
            <TextField
              label="نام شرکت یا نهاد"
              className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
              value={modalCompanyName}
              onChange={(value: any) =>
                setState({
                  modalCompanyName: value,
                  modalCompanyNameError: false,
                })
              }
              required
              errorMessage={modalCompanyNameError}
            />
            <TextField
              label="وب‌سایت"
              className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
              value={modalWebSite}
              onChange={(value: any) =>
                setState({
                  modalWebSite: value,
                })
              }
            />
            <TextField
              label="پیش شماره تلفن دفتر مرکزی"
              className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
              value={deSeparator(modalPrefixNumber)}
              onChange={(value: any) =>
                setState({
                  modalPrefixNumber: value,
                })
              }
              maxLength={3}
            />
            <TextField
              label="شماره تلفن دفتر مرکزی"
              className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
              value={deSeparator(modalLandline)}
              onChange={(value: any) =>
                setState({
                  modalLandline: value,
                })
              }
              maxLength={8}
            />
            <TextField
              label="ایمیل"
              className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
              value={modalEmail}
              onChange={(value: any) =>
                setState({
                  modalEmail: value,
                })
              }
            />
            <NewSelect
              label="نوع شرکت"
              className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
              options={[
                {
                  modalCompanyRegistrationTypeName: 'هیچکدام',
                  modalCompanyRegistrationTypeId: '',
                },
                ...modalCompanyRegistrationTypeData,
              ]}
              onChange={(value: any) =>
                setState({
                  modalCompanyRegistrationTypeId: value,
                  modalCompanyRegistrationTypeError: false,
                })
              }
              showKey="companyRegistrationTypeName"
              selectedKey="companyRegistrationTypeId"
              value={modalCompanyRegistrationTypeId}
              errorMessage={modalCompanyRegistrationTypeError}
              required
            />
            <TextField
              label="آدرس دفتر مرکزی"
              className="2xl:col-span-8 xl:col-span-8 lg:col-span-8 md:col-span-12  col-span-8"
              value={modalAddress}
              onChange={(value: any) =>
                setState({
                  modalAddress: value,
                })
              }
            />

            <TextField
              label="شناسه ملی"
              className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
              value={deSeparator(modalNationalId)}
              onChange={(value: any) =>
                setState({
                  modalNationalId: value,
                  modalNationalIdError: '',
                })
              }
              required
              errorMessage={state?.modalNationalIdError}
              maxLength={13}
            />
          </div>
          <div className="col-span-12 flex justify-end m-4 ">
            <ListingCancelButton onClick={onCancelClick} />
            <ListingSubmitButton
              width={'w-[160px]'}
              buttonName={'ثبت در سامانه'}
              onClick={onRegisterCompanyClick}
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
