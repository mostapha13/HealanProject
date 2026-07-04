import React from 'react';
import withAlert from 'apps/cash-market/src/hoc/withAlert';
import { useSearchParams } from 'react-router-dom';
import { DatePicker } from '@tse/components/molecules';
import {
  getAppointmentInfo,
  getPatientList,
  getPaymentMethodTypes,
  invoicePay,
} from 'apps/cash-market/src/Controller/Healan';
import {
  AntdSelectSearch,
  AntdTextArea,
  Icon,
  Image,
  NewSelectSearch,
  SelectMultiple,
  TextField,
  Upload,
} from '@tse/components/atoms';
import { HealanSubmitButton } from 'apps/cash-market/src/components/Healan/HealanSubmitButton';
import { separator } from '@tse/tools';
import NewSelect from 'apps/cash-market/src/components/atoms/NewSelect';
import { useEffect, useNavigate, useStates } from '@tse/utils';
import { CreateImagingModal } from './CreateImagingModal';
import { CreateLabModal } from './CreateLabModal';
import { CreatePrescriptionDrugModal } from './CreatePrescriptionDrugModal';

const initialState = {
  appointmentInfo: {},
  invoiceId: '',
  nextAppointmentDate: '',
  notes: null,
  paymentMethodTypeId: '',
  paymentMethodTypeName: '',
  paymentMethodTypeError: '',
  paymentMethodTypeData: [],
  paymentMethodType: null,
  modalId: '',
  imagingModal: null,
  labModal: null,
  prescriptionDrugModal: null,

};
const PageSize = 10;

function OrderDetail({ onAlert }: any) {
  const [state, setState] = useStates<any>(initialState);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appointmentId =
    searchParams.get('appointmentId') != null
      ? searchParams.get('appointmentId')
      : null;

  const {
    appointmentInfo,
    invoiceId,
    nextAppointmentDate,
    notes,
    paymentMethodTypeId,
    paymentMethodTypeName,
    paymentMethodTypeError,
    paymentMethodTypeData,
    paymentMethodType,
    modalId,
    imagingModal,
    labModal,
    prescriptionDrugModal,
    isOpenImagingModal,
    isOpenLabModal,
    isOpenPrescriptionDrugModal,
  } = state;

  useEffect(() => {
    handelGetAppointmentInfo();
    handelGetPaymentMethodTypes();
  }, []);

  useEffect(() => {
    handelGetAppointmentInfo();
  }, [location.pathname, location.search]);

  const handelGetAppointmentInfo = () => {
    const data = { appointmentId: appointmentId ? appointmentId : null };

    getAppointmentInfo({
      data,
      onSuccess: (res: any) => {
        setState({
          appointmentInfo: res,
          invoiceId: res.invoices[0].invoiceId,
        });
      },
      onFail,
    });
  };
  const onFail = (error: any) => {
    onAlert(error);
  };

  const onChangeState = (key: string, value: string) => {
    setState({
      [key]: value,
    });
  };


  const setErrorMessage = (key: string) => {
    const errorMessage = ' ';
    setState({ [`${key}Error`]: errorMessage });
  };

  const handelGetPaymentMethodTypes = () => {
    getPaymentMethodTypes({
      onSuccess: (res: any) => {
        setState({ paymentMethodTypeData: res });
      },
      onFail,
    });
  };

  const onSubmit = () => {
    if (invoiceId) {
      const data = {
        invoiceId,
        nextAppointmentDate,
        notes,
      };
      invoicePay({ data, onSuccess: onSuccessSave, onFail });
      navigate('/listing-basicdata/appointment');
    } else {
      !invoiceId && setErrorMessage('invoiceId');
    }
  };

  const onSuccessSave = (res: any) => {
    onAlert({
      type: 'success',
      message: 'اطلاعات با موفقیت ثبت گردید',
    });
  };

  return (
    <>
      <div className="flex justify-center bg-[#2c1d6b] text-2xl text-white rounded-full p-2 mb-2 text-center">
        <div className="flex-1">
          {appointmentInfo?.patient?.firstName}{' '}
          {appointmentInfo?.patient?.lastName}
        </div>
        <div className="flex-1">{appointmentInfo?.patient?.nationalCode} </div>
      </div>

      <div className="shadow-[0_0_15px_-10px_rgba(0,0,0,0.75)] rounded-[10px] p-[30px] bg-white min-h-[100px] flex flex-wrap gap-6">
        <div className="InsideryDatePicker w-60">
          <DatePicker
            required
            error={state?.nextAppointmentDateError}
            label=" تاریخ ویزیت بعدی"
            value={nextAppointmentDate}
            onChange={(value: any) =>
              setState({
                nextAppointmentDate: value,
                nextAppointmentDateError: '',
              })
            }
          />
        </div>

        <div className="InsideryDateTextField w-full">
          <AntdTextArea
            className={'col-span-12 items-center justify-center rounded-lg'}
            placeholder="یادداشت"
            numberOfRows={4}
            onChange={(value: any) =>
              setState({
                notes: value,
                notesError: '',
              })
            }
            value={notes}
            error={state?.textAreaError}
          />
        </div>
      </div>

      <div className="col-span-12 grid grid-cols-12 gap-4 m-4 mt-8">
        <div className="col-span-3 flex justify-between mx-4 mt-8 border-b border-listingTertiaryColor">
          <span className=" p-4  text-listingTertiaryColor "> دارو :</span>
          <div className="col-span-12 flex justify-end mx-4 ">
            <HealanSubmitButton
              width={'w-[160px]'}
              buttonName="افزودن دارو"
              onClick={() => {
                setState({
                  modalId: 'prescriptionDrugModal',
                  isOpenPrescriptionDrugModal: true,
                });
              }}
            />
          </div>
        </div>
        <div className="col-span-3 flex justify-between mx-4 mt-8 border-b border-listingTertiaryColor">
          <span className=" p-4  text-listingTertiaryColor "> تصویر :</span>
          <div className="col-span-12 flex justify-end mx-4 ">
            <HealanSubmitButton
              width={'w-[160px]'}
              buttonName="افزودن تصویر"
              onClick={() => {
                setState({
                  modalId: 'imagingModal',
                  isOpenImagingModal: true,
                });
              }}
            />
          </div>
        </div>
        <div className="col-span-3 flex justify-between mx-4 mt-8 border-b border-listingTertiaryColor">
          <span className=" p-4  text-listingTertiaryColor "> آزمایش :</span>
          <div className="col-span-12 flex justify-end mx-4 ">
            <HealanSubmitButton
              width={'w-[160px]'}
              buttonName="افزودن آزمایش"
              onClick={() => {          
                setState({
                  modalId: 'labModal',
                  isOpenLabModal: true,
                });
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end w-full">
        <div className="col-span-12 flex justify-end m-4">
          <HealanSubmitButton
            width={'w-[160px]'}
            buttonName={'پرداخت'}
            onClick={onSubmit}
          />
        </div>
      </div>

      <CreateImagingModal
        modalId={modalId}
        isOpen={isOpenImagingModal}
        onChangeState={onChangeState}
        onAlert={onAlert}
        // onSuccessModalSave={onSuccessDoctorModalSave}
      />

      <CreateLabModal
        modalId={modalId}
        isOpen={isOpenLabModal}
        onChangeState={onChangeState}
        onAlert={onAlert}
        // onSuccessModalSave={onSuccessDoctorModalSave}
      />

      <CreatePrescriptionDrugModal
        modalId={modalId}
        isOpen={isOpenPrescriptionDrugModal}
        onChangeState={onChangeState}
        onAlert={onAlert}
        // onSuccessModalSave={onSuccessDoctorModalSave}
      />
    </>
  );
}

export default withAlert(OrderDetail);
