import ReactCodeInput from 'react-verification-code-input';
import { Button, Icon, TextField, Image } from '@tse/components/atoms';
import { useState, useEffect, useForm } from '@tse/utils';
import './style.scss';
import { CaptchaType } from './TrainingRequest';

interface InputVerifyType {
  onChange?: (...param: any) => void;
  reSend?: (...param: any) => void;
  onBack?: (...param: any) => void;
  onClick?: (...param: any) => void;
  phoneNumber?: string | number;
  handleGetCaptcha?: any;
  captcha?: CaptchaType;
}

const chars = 5;
const interval = 180;

export const InputVerify = ({
  onChange,
  reSend,
  phoneNumber = '09125',
  onBack,
  onClick,
  captcha,
  handleGetCaptcha,
}: InputVerifyType) => {
  const [timer, setTimer] = useState(interval);
  const [verify, setVerify] = useState('');
  const isZero = timer === 0;

  const {
    handleSubmit,
    formState: { errors },
    register,
  } = useForm();

  useEffect(() => handleGetCaptcha(), []);

  useEffect(() => {
    if (!isZero) {
      setTimeout(() => {
        setTimer(timer - 1);
      }, 1000);
    }
  }, [timer, isZero]);

  const reSendCode = (captcha: any) => {
    setTimer(interval);
    reSend?.(captcha);
  };

  const handleComplete = (param: string) => {
    setVerify(param);
  };

  const handleClick = (captcha: any) => {
    onClick?.({ verify, ...captcha });
  };

  return (
    <form className="grid grid-cols-12" onSubmit={handleSubmit(handleClick)}>
      <div className="col-span-12 flex justify-between">
        <Button onClick={onBack}>
          <span className="text-blue">ویرایش شماره</span>
        </Button>
        <span className="">{phoneNumber}</span>
      </div>
      <div className="col-span-12 my-4">
        <span className="text-black text-base">
          کد {chars} رقمی ارسال شده را وارد کنید
        </span>
        <ReactCodeInput
          className="react-code-input"
          fields={chars}
          autoFocus
          required
          onChange={onChange}
          onComplete={handleComplete}
          fieldWidth={70}
        />
      </div>
      <div className="col-span-12">
        {!isZero && <span>{`${timer} ثانیه`}</span>}
        {isZero && (
          <div className="flex justify-center">
            <Button type="button" onClick={handleSubmit(reSendCode)}>
              <span> ارسال مجدد</span>
            </Button>
          </div>
        )}
      </div>
      <div className="col-span-12 grid grid-cols-12 my-5">
        <section className="col-span-6">
          <TextField
            className="w-full"
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
        <div className="col-span-6 flex flex-row items-center gap-x-4">
          <Button onClick={handleGetCaptcha} type="button">
            <Icon classname="icon-reload" />
          </Button>
          <Image
            src={captcha?.image && `data:"jpg";base64,${captcha.image}`}
            alt="captcha"
          />
        </div>
      </div>
      <Button className="bg-purple col-span-12">
        <span className="text-white">ارسال</span>
      </Button>
    </form>
  );
};
