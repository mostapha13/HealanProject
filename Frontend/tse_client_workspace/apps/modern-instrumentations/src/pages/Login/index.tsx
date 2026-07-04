import type { ListType, onAlertProps } from '@tse/types';
import { Image } from '@tse/components/atoms';
import { request, saveToStorage } from '@tse/tools';
import { useState, useNavigate } from '@tse/utils';
import { SimpleForm } from '@tse/components/molecules';
import LoginBG from '../../assets/images/LoginBG.png';
import TSELogo from '../../assets/images/TextLogo.png';
import { baseUrl } from '../../constants';
import withAlert from '../../hoc/withAlert';

interface LoginTypes {
  onAlert: onAlertProps;
}

function Login(props: LoginTypes) {
  const navigate = useNavigate();
  const [isLoading, setLoading] = useState<boolean>(false);
  const list: ListType[] = [
    {
      name: 'username',
      label: 'نام کاربری',
      require: 'نام کاربری را وارد کنید',
    },
    {
      name: 'password',
      label: 'رمز عبور',
      type: 'password',
      require: 'رمز عبور را وارد کنید',
    },
    {
      value: 'ورود',
      type: 'submit',
      itemType: 'button',
      color: 'bg-teal',
      className: 'grid grid-cols-12',
      buttonClassName: 'bg-teal col-span-12',
    },
  ];

  function handleSubmitLogin(data: any) {
    setLoading(true);
    postLogin({ data, onSuccess, onFail });
  }

  const onSuccess = (res?: any) => {
    saveToStorage('token', res.access);
    saveToStorage('isLogin', true);
    setLoading(false);
    navigate('/dashboard/list', { replace: false });
  };

  const onFail = (error: any) => {
    setLoading(false);
    props.onAlert({ message: error.data });
  };

  const LoginFormScreen = () => {
    return (
      <SimpleForm
        isLoading={isLoading}
        autoComplete="on"
        {...{
          onSubmit: handleSubmitLogin,
          list,
        }}
        className="w-[100%] px-16 flex flex-col gap-2"
      />
    );
  };

  return (
    <div className="flex flex-1 flex-row h-[100vh] overflow-hidden justify-center items-center">
      <Image
        src={LoginBG}
        className="absolute top-0 left-0 bottom-0 right-0 w-full h-full -z-10"
      />
      <div className="flex-col bg-white content-center overflow-hidden flex justify-center items-center rounded shadow w-[30rem]">
        <h3 className="py-4 w-full text-center font-bold text-black bg-lightGray m-0">
          ورود به سامانه ابزارهای نوین
        </h3>
        <div className="w-full bg-white py-12 justify-center items-center flex flex-col">
          <Image src={TSELogo} className="h-[2.4rem] mb-5" />
          <LoginFormScreen />
        </div>
      </div>
    </div>
  );
}

export default withAlert(Login);

async function postLogin({ data, onSuccess, onFail }: any) {
  try {
    const res = await request.post({
      baseUrl,
      url: 'Account/Login',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
