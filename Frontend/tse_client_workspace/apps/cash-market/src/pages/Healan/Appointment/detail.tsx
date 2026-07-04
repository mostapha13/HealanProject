import React from 'react';
import withAlert from 'apps/cash-market/src/hoc/withAlert';
import { useSearchParams } from 'react-router-dom';
import {
  getAppointmentInfo,
  getPatientList,
  getPaymentMethodTypes,
  invoicePay,
} from 'apps/cash-market/src/Controller/Healan';
import {
  AntdSelectSearch,
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

const initialState = {
  appointmentInfo: {},
  invoiceId: '',
  paymentReference: '',
  description: null,
  paymentMethodTypeId: '',
  paymentMethodTypeName: '',
  paymentMethodTypeError: '',
  paymentMethodTypeData: [],
  paymentMethodType: null,
};
const PageSize = 10;

function AppointmentDetail({ onAlert }: any) {
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
    paymentReference,
    description,
    paymentMethodTypeId,
    paymentMethodTypeName,
    paymentMethodTypeError,
    paymentMethodTypeData,
    paymentMethodType,
  } = state;

  useEffect(() => {
    handelGetAppointmentInfo();
     handelGetPaymentMethodTypes();
  }, []);

  useEffect(() => {
    handelGetAppointmentInfo();
  }, [location.pathname,location.search]);

  const handelGetAppointmentInfo = () => {
    const data = { appointmentId: appointmentId ? appointmentId : null };

    getAppointmentInfo({
      data,
      onSuccess: (res: any) => {
        setState({ appointmentInfo: res,invoiceId:res.invoices[0].invoiceId });
      },
      onFail,
    });
  };
  const onFail = (error: any) => {
    onAlert(error);
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
    if (invoiceId && paymentReference) {
      const data = {
        invoiceId,
        paymentReference,
        description,
      };
      invoicePay({ data, onSuccess: onSuccessSave, onFail });
      navigate("/listing-basicdata/appointment");
    } else {
      !invoiceId && setErrorMessage('invoiceId');
      !paymentReference && setErrorMessage('paymentReference');
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
      <div>{appointmentInfo?.appointmentTypeName}</div>
      <div>
        {appointmentInfo?.serviceTypes?.map((item: any) => {
          return (
            <div className="bg-[#f0efef] rounded-full py-2 px-4 flex flex-row  items-center">
              <div className="rounded-full w-[0.45rem] h-[0.45rem] border-gray bg-gray" />
              <span className="px-1">{item?.title} </span>
            </div>
          );
        })}
      </div>
      <div>
        مبلغ قابل پرداخت:
        {appointmentInfo?.invoices?.map((item: any) => {
          return (
            <div className="bg-[#2c1d6b] text-2xl text-white rounded-full flex justify-center  w-[660px]">
              <span className="px-1">{separator(item?.totalAmount)} ریال</span>
            </div>
          );
        })}
      </div>

      <div className="shadow-[0_0_15px_-10px_rgba(0,0,0,0.75)] rounded-[10px] p-[30px] bg-white min-h-[100px] flex flex-wrap gap-6">
        <div className="InsideryDateTextField w-80">
          <TextField
            label="منبع پرداخت"
            className=""
            required
            value={paymentReference}
            onChange={(value: any) =>
              setState({
                paymentReference: value,
                paymentReferenceError: '',
              })
            }
            errorMessage={state?.paymentReferenceError}
          />
        </div>

        {/* <div className="col-span-12 grid grid-cols-12 gap-4 m-4 mt-8">
            <AntdSelectSearch
              className="2xl:col-span-4 xl:col-span-4 lg:col-span-12 md:col-span-12  col-span-4"
              label="نوع پرداخت"
              onChange={(value: any) => {
                if (value !== undefined) {
                  setState({
                    paymentMethodTypeId: value.paymentMethodTypeId,
                     paymentMethodType:value
                  });
                } else if (value == '') {           
                  setState({
                    paymentMethodTypeId: null,
                  });
                }
              }}
              value={paymentMethodType}
              required
              data={paymentMethodTypeData}
              showKey="paymentMethodTypeName"
              idKey="paymentMethodTypeId"
            />
          </div> */}

        <div className="InsideryDateTextField w-80">
          <TextField
            label="توضیحات"
            className=""
            required
            value={description}
            onChange={(value: any) =>
              setState({
                description: value,
                descriptionError: '',
              })
            }
            errorMessage={state?.descriptionError}
            // type="number"
          />
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
    </>
  );
}

export default withAlert(AppointmentDetail);
