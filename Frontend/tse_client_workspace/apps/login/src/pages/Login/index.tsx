import {
  Image,
  TextField,
  Button,
  Icon,
  ConfirmCode,
} from '@tse/components/atoms';
import { useState, useForm, useEffect } from '@tse/utils';
import LoginBG from '../../assets/images/LoginBG.png';
import { getCaptcha } from '../../Controller';
import './styles.scss';

interface LoginTypes {
  pageName?: string;
  captcha: any;
}

const initialState = {
  pageName: 'login',
  captcha: null,
  phoneNumber: '',
};

function Login() {
  const [state, setState] = useState<any>(initialState);
  const {
    handleSubmit,
    formState: { errors },
    register,
  } = useForm();
  const { captcha, pageName, phoneNumber } = state;

  const CaptchaSection = () => {
    return (
      <>
        <div className="flex items-center">
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

          <Button onClick={handleGetCaptcha}>
            <Icon classname="icon-reload" />
          </Button>
          <Image
            src={captcha?.image && `data:"jpg";base64,${captcha?.image}`}
            alt="captcha"
            className="w-[73px] h-[28px]"
          />
        </div>
        <div>
          <Button className="bg-blue text-white w-full" onClick={onLogin}>
            ورود
          </Button>
          <div className="flex flex-row justify-between items-center px-2">
            <Button className="text-extratiny" onClick={handleGetCaptcha}>
              ثبت نام در سامانه
            </Button>
            <Button className="text-extratiny" onClick={handleGetCaptcha}>
              پیگیری وضعیت
            </Button>
          </div>
        </div>
      </>
    );
  };

  const LoginSection = () => {
    return (
      <div className="grid p-11 gap-4">
        <TextField label="شماره موبایل" />
        <TextField label="رمز عبور" type="password" />
        <CaptchaSection />
      </div>
    );
  };

  const ConfirmCodeSection = () => {
    const chars = 5;
    const interval = 180;
    const [timer, setTimer] = useState(interval);
    const [verify, setVerify] = useState('');
    const isZero = timer === 0;

    const {
      handleSubmit,
      formState: { errors },
      register,
    } = useForm();

    useEffect(() => handleGetCaptcha(), []);

    const onClick = (data: any) => {};
    const reSend = (data: any) => {};

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

    const handleSubmitVerify = (captcha: any) => {
      onClick?.({ verify, ...captcha });
    };

    const handleBack = () => {};

    const handleReSendSMS = (res: any) => {};

    return (
      <div className="grid p-8 gap-4">
        <ConfirmCode
          phoneNumber={phoneNumber}
          onBack={handleBack}
          onClick={handleSubmitVerify}
          reSend={(res: any) => {
            handleGetCaptcha();
            handleReSendSMS(res);
          }}
          captcha={captcha}
          handleGetCaptcha={handleGetCaptcha}
        />
        <CaptchaSection />
      </div>
    );
  };

  const handleGetCaptcha = () => {};

  const onLogin = () => {
    setState({
      pageName: 'loginConfirmCode',
    });
  };

  return (
    <div className=" flex h-screen justify-center py-32">
      <div className=" rounded shadow-[0_0px_4px_rgba(0,0,0,0.2)] flex overflow-hidden ">
        <div className="col-span-6">
          <Image src={LoginBG} className="h-full w-[343px]" />
        </div>
        <div className="col-span-6 pb-12 bg-white flex flex-1 flex-col">
          <h3 className="bg-lightGray py-4 text-center font-bold text-black">
            ورود به سامانه های بورس اوراق بهادار
          </h3>
          <div className="container">
            {pageName === 'login' && <LoginSection />}
            {pageName === 'loginConfirmCode' && <ConfirmCodeSection />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
