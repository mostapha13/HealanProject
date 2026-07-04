import withAlert from 'apps/cash-market/src/hoc/withAlert';
import {
  useStates,
  useEffect,
  useState,
  useNavigate,
  useSearchParams,
} from '@tse/utils';
import { Modal, Popconfirm, Radio } from 'antd';
import { SymbolModal, Table } from '@tse/components/organism';
import {
  Button,
  Collapse,
  Icon,
  TextField,
  Upload,
} from '@tse/components/atoms';
import { uploadFile } from 'apps/cash-market/src/Controller';

import { HeaderTypes, onAlertProps } from '@tse/types';

import React, { useMemo } from 'react';
import { generateRandomNumber, separator } from '@tse/tools';
import {
  getWholesaleBuyerInqueryById,
  saveWholesaleBuyerInquery,
} from 'apps/cash-market/src/Controller/StockMarket/WholeSale';
export interface InqueryDataModal {
  isOpen?: boolean;
  onChangeState?: any;
  onAlert?: any;
  wholesaleBuyerInfoId?: string;
  onSuccessSave?: any;
  isDeputyPage?: boolean;
  isDetailPage?: boolean;
  isUploadDocPage?: boolean;
  isDetailPageWithoutEnterData?: boolean;
}
export function InqueryDataModal(props: InqueryDataModal) {
  const initialState = {
    hasDebtBank: true,
    priceValueBank: '',
    priceValueBankError: false,
    inqueryDescriptionBank: '',
    inqueryDescriptionBankError: false,
    uploadFileBank: null,
    uploadFileBankError: false,
    ////////////////////////////
    hasDebtInsurance: true,
    priceValueInsurance: '',
    priceValueInsuranceError: false,
    inqueryDescriptionInsurance: '',
    inqueryDescriptionInsuranceError: false,
    uploadFileInsurance: null,
    uploadFileErrorInsurance: false,
    ////////////////////////////
    hasDebtTax: true,
    priceValueTax: '',
    priceValueTaxError: false,
    inqueryDescriptionTax: '',
    inqueryDescriptionTaxError: false,
    uploadFileTax: null,
    uploadFileErrorTax: false,
    ////////////////////////////
    hasDebtPrivate: true,
    priceValuePrivate: '',
    priceValuePrivateError: false,
    inqueryDescriptionPrivate: '',
    inqueryDescriptionPrivateError: false,
    uploadFilePrivate: null,
    uploadFileErrorPrivate: false,
  };
  const [state, setState] = useStates<any>(initialState);
  const {
    hasDebtBank,
    priceValueBank,
    priceValueBankError,
    inqueryDescriptionBank,
    inqueryDescriptionBankError,
    uploadFileBank,
    uploadFileBankError,
    ////////////////////
    hasDebtInsurance,
    priceValueInsurance,
    priceValueInsuranceError,
    inqueryDescriptionInsurance,
    inqueryDescriptionInsuranceError,
    uploadFileInsurance,
    uploadFileInsuranceError,
    ////////////////////////
    hasDebtTax,
    priceValueTax,
    priceValueTaxError,
    inqueryDescriptionTax,
    inqueryDescriptionTaxError,
    uploadFileTax,
    uploadFileTaxError,
    ////////////////////////
    hasDebtPrivate,
    priceValuePrivate,
    priceValuePrivateError,
    inqueryDescriptionPrivate,
    inqueryDescriptionPrivateError,
    uploadFilePrivate,
    uploadFilePrivateError,
  } = state;
  const {
    isOpen,
    onChangeState,
    onAlert,
    wholesaleBuyerInfoId,
    onSuccessSave,
    isDeputyPage,
    isDetailPage,
    isUploadDocPage,
    isDetailPageWithoutEnterData,
  } = props;
  useEffect(() => {
    if (isOpen) {
      getWholesaleBuyerInqueryByIdData();
    }
  }, [wholesaleBuyerInfoId, isOpen]);
  const setErrorMessage = (key: string) => {
    const errorMessage = '.';
    setState({ [`${key}Error`]: errorMessage });
  };
  const onFail = (error: any) => {
    // onAlert(error);
  };
  const getWholesaleBuyerInqueryByIdData = () => {
    getWholesaleBuyerInqueryById({
      data: {
        WholesaleBuyerInfoId: wholesaleBuyerInfoId,
      },
      onSuccess: (res) => {
        res?.map((item: any) => {
          viewModel?.map((model: any) => {
            if (item?.inqueryTypeId == model?.inqueryTypeId) {
              setState({
                [`${model?.hasDebt}`]: item?.hasDebt,
                [`${model?.priceState}`]: item?.priceValue,
                [`${model?.inqueryDescriptionState}`]: item?.inqueryDescription,
                [`${model?.uploadFileState}`]: item?.inqueryFile,
              });
            }
          });
        });
      },
      onFail,
    });
  };
  const viewModel = [
    {
      title: 'بدهی بانکی',
      inqueryTypeId: 1,
      debtList: [
        { name: 'دارد', id: true },
        { name: 'ندارد', id: false },
      ],
      hasDebt: 'hasDebtBank',
      hasDebtValue: hasDebtBank,
      price: priceValueBank,
      priceState: 'priceValueBank',
      priceError: priceValueBankError,
      priceErrorState: 'priceValueBankError',
      inqueryDescription: inqueryDescriptionBank,
      inqueryDescriptionState: 'inqueryDescriptionBank',
      inqueryDescriptionEroor: inqueryDescriptionBankError,
      inqueryDescriptionEroorState: 'inqueryDescriptionBankError',
      uploadFile: uploadFileBank,
      uploadFileState: 'uploadFileBank',
      uploadFileError: uploadFileBankError,
      uploadFileErrorState: 'uploadFileBankError',
    },
    {
      title: 'بدهی بیمه ای',
      inqueryTypeId: 2,
      debtList: [
        { name: 'دارد', id: true },
        { name: 'ندارد', id: false },
      ],
      hasDebt: 'hasDebtInsurance',
      hasDebtValue: hasDebtInsurance,
      price: priceValueInsurance,
      priceState: 'priceValueInsurance',
      priceError: priceValueInsuranceError,
      priceErrorState: 'priceValueInsuranceError',
      inqueryDescription: inqueryDescriptionInsurance,
      inqueryDescriptionState: 'inqueryDescriptionInsurance',
      inqueryDescriptionEroor: inqueryDescriptionInsuranceError,
      inqueryDescriptionEroorState: 'inqueryDescriptionInsuranceError',
      uploadFile: uploadFileInsurance,
      uploadFileState: 'uploadFileInsurance',
      uploadFileError: uploadFileInsuranceError,
      uploadFileErrorState: 'uploadFileInsuranceError',
    },
    {
      title: 'بدهی مالیاتی',
      inqueryTypeId: 3,
      debtList: [
        { name: 'دارد', id: true },
        { name: 'ندارد', id: false },
      ],
      hasDebt: 'hasDebtTax',
      hasDebtValue: hasDebtTax,
      price: priceValueTax,
      priceState: 'priceValueTax',
      priceError: priceValueTaxError,
      priceErrorState: 'priceValueTaxError',
      inqueryDescription: inqueryDescriptionTax,
      inqueryDescriptionState: 'inqueryDescriptionTax',
      inqueryDescriptionEroor: inqueryDescriptionTaxError,
      inqueryDescriptionEroorState: 'inqueryDescriptionTaxError',
      uploadFile: uploadFileTax,
      uploadFileState: 'uploadFileTax',
      uploadFileError: uploadFileTaxError,
      uploadFileErrorState: 'uploadFileTaxError',
    },
    {
      title: 'بدهی خصوصی سازی',
      inqueryTypeId: 4,
      debtList: [
        { name: 'دارد', id: true },
        { name: 'ندارد', id: false },
      ],
      hasDebt: 'hasDebtPrivate',
      hasDebtValue: hasDebtPrivate,
      price: priceValuePrivate,
      priceState: 'priceValuePrivate',
      priceError: priceValuePrivateError,
      priceErrorState: 'priceValuePrivateError',
      inqueryDescription: inqueryDescriptionPrivate,
      inqueryDescriptionState: 'inqueryDescriptionPrivate',
      inqueryDescriptionEroor: inqueryDescriptionPrivateError,
      inqueryDescriptionEroorState: 'inqueryDescriptionPrivateError',
      uploadFile: uploadFilePrivate,
      uploadFileState: 'uploadFilePrivate',
      uploadFileError: uploadFilePrivateError,
      uploadFileErrorState: 'uploadFilePrivateError',
    },
  ];

  const onBackClick = () => {
    onChangeState('isInqueryModalVisible', false);
  };
  return (
    <>
      <Modal
        visible={isOpen}
        closable={false}
        style={{ textAlign: 'center', padding: '0px' }}
        title={'استعلام و نظرات'}
        footer={null}
        centered
        width={'80%'}
      >
        <>
          <div className="grid grid-cols-12 gap-4 mt-8  ">
            {viewModel?.map((item: any) => (
              <div className="grid grid-cols-12 col-span-12 gap-4 mt-8  ">
                <div className="2xl:col-span-3 xl:col-span-3 lg:col-span-4 md:col-span-6 grid grid-cols-3 items-center justify-center ">
                  <span className=" flex justify-start">{item.title} :</span>
                  <span className=" font-bold">
                    {item?.hasDebtValue ? 'دارد' : 'ندارد'}
                  </span>
                </div>
                {item?.hasDebtValue && (
                  <div className="2xl:col-span-2 xl:col-span-2 lg:col-span-4 md:col-span-3  col-span-2 flex justify-start">
                    <span className=" text-gray ml-4">مبلغ :</span>
                    <span className=" font-bold">{separator(item?.price)}</span>
                  </div>
                )}
                <div className="2xl:col-span-2 xl:col-span-2 lg:col-span-4 md:col-span-3  col-span-2 flex justify-start">
                  <span className=" text-gray ml-4">توضیحات :</span>
                  <span className=" font-bold">{item?.inqueryDescription}</span>
                </div>

                <div className=" 2xl:col-span-4 xl:col-span-5 lg:col-span-12 md:col-span-12  col-span-3">
                  <Upload
                    value={item?.uploadFile?.fileName}
                    href={item?.uploadFile?.link}
                    name={item.uploadFileState}
                    error={item?.uploadFileError}
                  />
                </div>
              </div>
            ))}
            <div className="col-span-12 flex justify-end mt-14 mx-4 ">
              <Button
                onClick={onBackClick}
                className="bg-gray w-24 h-9 mx-4 text-white "
              >
                بازگشت
              </Button>
            </div>
          </div>
        </>
      </Modal>
    </>
  );
}
