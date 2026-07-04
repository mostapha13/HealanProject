import { Button, Icon, TextField, Image } from '@tse/components/atoms';
import { ErrorType, onAlertProps } from '@tse/types';
import { memo, persianTools, useEffect, useForm, useState } from '@tse/utils';
import withAlert from '../../../hoc/withAlert';
import { InputVerify } from './InputVerify';
import {
  getCaptcha,
  postCheckData,
  postActiveSubmition,
  postReSendSms,
} from './service';

interface TrainingRequestType {
  onAlert?: onAlertProps;
  record?: any;
  onClose?: () => void;
}

interface UserDataType {
  name?: string;
  lastName?: string;
  nationalCode?: string;
  phoneNumber?: string;
  captchaCode?: string;
}

interface UserResultDataType {
  course_Id?: string;
  courses?: string;
  family_Name?: string;
  id?: string;
  is_Active?: boolean;
  mobile_No?: string;
  name?: string;
  nationalCode?: string;
  sms_Code?: string;
}

export type CaptchaType = {
  captchaKey?: string;
  image?: string;
};

interface ActiveSubmitionType {
  id?: string;
  verify?: string;
  captchaKey?: string;
  captchaCode?: string;
}

type FormNameType = 'form' | 'otp';

function TrainingRequest(props: TrainingRequestType) {
  const { record, onClose, onAlert } = props;
  const [formName, setFormName] = useState<FormNameType>('form');
  const [userData, setUserData] = useState<UserDataType>({});
  const [userResult, setUserResult] = useState<UserResultDataType>({});
  const [captcha, setCaptcha] = useState<CaptchaType>({});
  const {
    handleSubmit,
    formState: { errors },
    register,
  } = useForm();

  function handleGetCaptcha() {
    getCaptcha({
      onFail: (error: ErrorType) => {
        onAlert?.({ message: error.data });
      },
      onSuccess: setCaptcha,
    });
  }

  useEffect(handleGetCaptcha, []);

  function handleSubmitForm(params: UserDataType) {
    setUserData(params);
    const data = {
      ...params,
      courseId: record.id,
      captchaKey: captcha.captchaKey,
    };
    postCheckData<any>({
      data,
      onFail,
      onSuccess: (res: { model: UserResultDataType }) => {
        setUserResult(res.model);
        handleChangeView('otp');
      },
    });
  }

  function handleChangeView(route: FormNameType) {
    setFormName(route);
  }

  function onFail(error: ErrorType) {
    onAlert?.({ message: error.data });
    handleGetCaptcha();
  }

  function handleSubmitVerify({ verify, ...params }: ActiveSubmitionType) {
    const data = {
      ...params,
      captchaKey: captcha.captchaKey,
      id: userResult.id,
      sms: verify,
    };
    postActiveSubmition({
      data,
      onFail,
      onSuccess: () => {
        onAlert?.({ message: 'ثبت نام با موفقیت انجام شد', type: 'success' });
        onClose?.();
      },
    });
  }

  function handleReSendSMS(params: ActiveSubmitionType) {
    const data = {
      ...params,
      captchaKey: captcha.captchaKey,
      id: userResult.id,
    };
    postReSendSms({
      data,
      onFail,
      onSuccess: () => {
        onAlert?.({ message: 'ارسال مجدد پیام انجام شد', type: 'success' });
      },
    });
  }

  function handleBack() {
    handleChangeView('form');
    handleGetCaptcha();
  }

  return (
    <>
      {formName === 'form' && (
        <form
          onSubmit={handleSubmit(handleSubmitForm)}
          className="grid grid-cols-12 gap-2"
        >
          <div className="col-span-6">
            <TextField
              {...{
                label: 'نام',
                register: register('name', {
                  required: 'نام اجباری است',
                }),
              }}
            />
            {errors['name'] && (
              <span className="text-red text-tiny flex text-right">
                {errors['name']?.message}
              </span>
            )}
          </div>
          <div className="col-span-6">
            <TextField
              label="نام خانوادگی"
              register={register('lastName', {
                required: 'نام خانوادگی اجباری است',
              })}
            />
            {errors['lastName'] && (
              <span className="text-red text-tiny flex text-right">
                {errors['lastName']?.message}
              </span>
            )}
          </div>
          <div className="col-span-6">
            <TextField
              label="کد ملی"
              register={register('nationalCode', {
                required: 'کد ملی اجباری است',
                validate: (param: string) => {
                  if (!persianTools.verifyIranianNationalId(param)) {
                    return 'فرمت کد ملی اشتباه است';
                  }
                  return true;
                },
              })}
            />
            {errors['nationalCode'] && (
              <span className="text-red text-tiny flex text-right">
                {errors['nationalCode']?.message}
              </span>
            )}
          </div>
          <div className="col-span-6">
            <TextField
              label="شماره موبایل"
              type="number"
              register={register('phoneNumber', {
                required: 'شماره موبایل اجباری است',
                // validate: (param: string) => {
                //   if (!persianTools.phoneNumberValidator(param)) {
                //     return 'فرمت شماره موبایل اشتباه است';
                //   }
                //   return true;
                // },
              })}
            />
            {errors['phoneNumber'] && (
              <span className="text-red text-tiny flex text-right">
                {errors['phoneNumber']?.message}
              </span>
            )}
          </div>
          <div className="col-span-12 mt-10 grid grid-cols-12 gap-x-2">
            <section className="col-span-6">
              <TextField
                label="متن امنیتی"
                register={register('captchaCode', {
                  required: 'متن امنیتی اجباری است',
                })}
              />
              {errors['captchaCode'] && (
                <span className="text-red text-tiny flex text-right">
                  {errors['captchaCode']?.message}
                </span>
              )}
            </section>
            <div className="col-span-6 flex flex-row items-center">
              <Button onClick={handleGetCaptcha} type="button">
                <Icon classname="icon-reload" />
              </Button>
              <Image
                src={captcha.image && `data:"jpg";base64,${captcha.image}`}
                alt="captcha"
              />
            </div>
          </div>
          <div className="col-span-12 grid grid-cols-12">
            <Button className="bg-purple col-span-6">
              <span className="text-white">ارسال کد</span>
            </Button>
          </div>
        </form>
      )}
      {formName === 'otp' && (
        <InputVerify
          phoneNumber={userData.phoneNumber}
          onBack={handleBack}
          onClick={handleSubmitVerify}
          reSend={(res: ActiveSubmitionType) => {
            handleGetCaptcha();
            handleReSendSMS(res);
          }}
          captcha={captcha}
          handleGetCaptcha={handleGetCaptcha}
        />
      )}
    </>
  );
}

export default memo(withAlert(TrainingRequest));
