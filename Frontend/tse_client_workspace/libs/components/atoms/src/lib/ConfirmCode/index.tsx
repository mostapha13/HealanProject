import ReactCodeInput from 'react-verification-code-input';
import { Button } from '@tse/components/atoms';
import { useState, useEffect } from '@tse/utils';
import './styles.scss';

interface CaptchaType {
  captchaKey?: string;
  image?: string | undefined;
}

interface InputVerifyType {
  onChange?: (...param: any) => void;
  reSend?: (...param: any) => void;
  onBack?: (...param: any) => void;
  onClick?: (...param: any) => void;
  phoneNumber?: string | number;
  handleGetCaptcha?: any;
  captcha?: CaptchaType;
}

const chars = 6;
const interval = 60;

export const ConfirmCode = ({
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

  //useEffect(() => handleGetCaptcha(), []);

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

  return (
    <div className="grid grid-cols-12">
      <div className="col-span-12 flex justify-between">
        <Button onClick={onBack}>
          <span className="text-blue">ویرایش شماره</span>
        </Button>
        <span className="">{phoneNumber}</span>
      </div>
      <div className="col-span-12 my-2 grid">
        <span className="text-black text-extratiny text-center">
          کد {chars} رقمی ارسال شده را وارد کنید
        </span>
        <ReactCodeInput
          className="react-code-input"
          fields={chars}
          autoFocus
          required
          onChange={onChange}
          onComplete={handleComplete}
          fieldWidth={25}
          fieldHeight={40}
        />
      </div>
      <div className="col-span-12 grid">
        {!isZero && (
          <span className="text-center text-extratiny">{`${timer} ثانیه`}</span>
        )}
        {isZero && (
          <div className="flex justify-center">
            <Button onClick={reSendCode}>
              <span className="text-gray text-extratiny"> ارسال مجدد</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
