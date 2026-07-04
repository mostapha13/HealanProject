import type { ListType, onAlertProps, ErrorType } from '@tse/types';
import { request, saveToStorage } from '@tse/tools';
import { useState, useNavigate, useForm, useEffect, axios } from '@tse/utils';
import { SimpleForm } from '@tse/components/molecules';
import LoginBG from '../../assets/images/LoginBG.png';
import TSELogo from '../../assets/images/TextLogo.png';
import withAlert from '../../hoc/withAlert';
import { Button, Icon, TextField, Image } from '@tse/components/atoms';
import { postLogin, getCaptcha, getProfile } from './service';
import { Controller } from 'react-hook-form';
import React from 'react';
import { userManager } from '../../store/userManager';

interface LoginTypes {
  onAlert: onAlertProps;
}
export type CaptchaType = {
  captchaKey?: string;
  image?: string;
};
interface LoginFormScreenProps {
  handleGetCaptcha: () => void;
  captcha: CaptchaType;
  onSubmit: (params: any) => void;
  errors: any;
  register: any;
  control: any;
}

const LoginFormScreen = React.memo(
  ({
    handleGetCaptcha,
    captcha,
    onSubmit,
    errors,
    register,
    control,
  }: LoginFormScreenProps) => {
    return (
      <form
        onSubmit={onSubmit}
        autoComplete="on"
        className="grid grid-cols-12 gap-4 px-10"
      >
        <div className="col-span-12">
          <Controller
            name={'username'}
            control={control}
            render={({ field }: any) => {
              return (
                <TextField
                  onChange={field?.onChange}
                  label="نام کاربری"
                  className="w-full"
                  register={register('username', {
                    required: 'نام کاربری اجباری است',
                  })}
                />
              );
            }}
          />
          {errors['username'] && (
            <span className="text-red text-tiny flex text-right">
              {errors['username']?.message}
            </span>
          )}
        </div>
        <div className="col-span-12">
          <Controller
            name={'password'}
            control={control}
            render={({ field }: any) => {
              return (
                <TextField
                  onChange={field?.onChange}
                  label="رمز عبور"
                  type="password"
                  className="w-full"
                  register={register('password', {
                    required: 'رمز عبور اجباری است',
                  })}
                />
              );
            }}
          />
          {errors['password'] && (
            <span className="text-red text-tiny flex text-right">
              {errors['password']?.message}
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
              className=" max-h-10"
              src={captcha.image && `data:"jpg";base64,${captcha.image}`}
              alt="captcha"
            />
          </div>
        </div>
        <div className="col-span-12 grid grid-cols-12">
          <Button className="bg-purple col-span-12">
            <span className="text-white">ورود</span>
          </Button>
        </div>
      </form>
    );
  }
);
function Login(props: LoginTypes) {
  const navigate = useNavigate();
  const [isLoading, setLoading] = useState<boolean>(false);
  const [captcha, setCaptcha] = useState<CaptchaType>({});
  userManager.getUser().then((user) => {
    if (!user?.expired) {
      // Set the authorization header for axios
      axios.defaults.headers.common['Authorization'] =
        'Bearer ' + user?.access_token;
    }
  });
  const list: ListType[] = [
    {
      name: 'username',
      label: 'نام کاربری',
      require: 'نام کاربری را وارد کنید',
      color: 'purple',
    },
    {
      name: 'password',
      label: 'رمز عبور',
      type: 'password',
      require: 'رمز عبور را وارد کنید',
      color: 'purple',
    },
    {
      value: 'ورود',
      type: 'submit',
      itemType: 'button',
      color: 'bg-purple',
      className: 'grid grid-cols-12',
      buttonClassName: 'bg-purple col-span-12',
    },
  ];
  const {
    handleSubmit,
    formState: { errors },
    register,
    control,
  } = useForm();
  // function handleSubmitLogin(params: any) {
  //   console.log('parararar', params);
  //   const data = {
  //     ...params,
  //     captchaKey: captcha.captchaKey,
  //   };
  //   setLoading(true);
  //   postLogin({ data, onSuccess, onFail });
  // }
  useEffect(() => {
    handleGetProfile();
  }, []);
  function handleGetProfile() {
    getProfile({
      onSuccess,
      onFail,
    });
  }

  const onSuccess = (res?: any) => {
    // saveToStorage('token', res.access);
    // saveToStorage('isLogin', true);
    // setLoading(false);
    // if (res?.roleNames?.[0] === 'Admin') {
    //   navigate('/dashboard/user-definition', { replace: false });
    //   return;
    // }
    // navigate('/dashboard/submit-info/province-details', { replace: false });
  };

  const onFail = (error: any) => {
    // handleGetCaptcha();
    // setLoading(false);
    props.onAlert(error);
  };
  // function handleGetCaptcha() {
  //   getCaptcha({
  //     onFail: (error: ErrorType) => {
  //       // onAlert?.({ message: error.data });
  //     },
  //     onSuccess: setCaptcha,
  //   });
  // }

  // useEffect(handleGetCaptcha, []);
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     handleGetCaptcha();
  //   }, 40000);
  //   return () => clearInterval(interval);
  // }, []);

  // const LoginFormScreen = () => {
  //   return (
  //     <SimpleForm
  //       isLoading={isLoading}
  //       autoComplete="on"
  //       {...{
  //         onSubmit: handleSubmitLogin,
  //         list,
  //       }}
  //       className="w-[100%] px-16 flex flex-col gap-2"
  //     />
  //   );
  // };
  // const LoginFormScreen = () => {
  //   return (
  //     <form
  //       onSubmit={handleSubmit(handleSubmitLogin)}
  //       autoComplete="on"
  //       className="grid grid-cols-12 gap-4 px-10"
  //     >
  //       <div className="col-span-12">
  //         <Controller
  //           name={'username'}
  //           control={control}
  //           render={({ field }: any) => {
  //             return (
  //               <TextField
  //                 onChange={field?.onChange}
  //                 label="نام کاربری"
  //                 className="w-full"
  //                 register={register('username', {
  //                   required: 'نام کاربری اجباری است',
  //                 })}
  //               />
  //             );
  //           }}
  //         />
  //         {errors['username'] && (
  //           <span className="text-red text-tiny flex text-right">
  //             {errors['username']?.message}
  //           </span>
  //         )}
  //       </div>
  //       <div className="col-span-12">
  //         <Controller
  //           name={'password'}
  //           control={control}
  //           render={({ field }: any) => {
  //             return (
  //               <TextField
  //                 onChange={field?.onChange}
  //                 label="رمز عبور"
  //                 type="password"
  //                 className="w-full"
  //                 register={register('password', {
  //                   required: 'رمز عبور اجباری است',
  //                 })}
  //               />
  //             );
  //           }}
  //         />
  //         {errors['password'] && (
  //           <span className="text-red text-tiny flex text-right">
  //             {errors['password']?.message}
  //           </span>
  //         )}
  //       </div>
  //       <div className="col-span-12 mt-10 grid grid-cols-12 gap-x-2">
  //         <section className="col-span-6">
  //           <TextField
  //             label="متن امنیتی"
  //             register={register('captchaCode', {
  //               required: 'متن امنیتی اجباری است',
  //             })}
  //           />
  //           {errors['captchaCode'] && (
  //             <span className="text-red text-tiny flex text-right">
  //               {errors['captchaCode']?.message}
  //             </span>
  //           )}
  //         </section>
  //         <div className="col-span-6 flex flex-row items-center">
  //           <Button onClick={handleGetCaptcha} type="button">
  //             <Icon classname="icon-reload" />
  //           </Button>
  //           <Image
  //             className=" max-h-10"
  //             src={captcha.image && `data:"jpg";base64,${captcha.image}`}
  //             alt="captcha"
  //           />
  //         </div>
  //       </div>
  //       <div className="col-span-12 grid grid-cols-12">
  //         <Button className="bg-purple col-span-12">
  //           <span className="text-white">ورود</span>
  //         </Button>
  //       </div>
  //     </form>
  //   );
  // };
  return (
    <div>
      <span className="flex font-extra-bold mt-10 mx-4">
        شما در حال انتقال به صفحه مورد نظر هستید...
      </span>
    </div>

    // <div className="flex flex-1 flex-row h-[100vh] overflow-hidden justify-center items-center">
    //   <span>loadddd</span>
    //   <Image
    //     src={LoginBG}
    //     className="absolute top-0 left-0 bottom-0 right-0 w-full h-full -z-10"
    //   />
    //   <div className="flex-col bg-white content-center overflow-hidden flex justify-center items-center rounded shadow w-[30rem]">
    //     <h3 className="py-4 w-full text-center font-bold text-black bg-lightGray m-0">
    //       ورود به سامانه تالار و دفاتر مناطق
    //     </h3>
    //     <div className="w-full bg-white py-12 justify-center items-center flex flex-col">
    //       <Image src={TSELogo} className="h-[2.4rem] mb-5" />
    //       <LoginFormScreen
    //         handleGetCaptcha={handleGetCaptcha}
    //         captcha={captcha}
    //         onSubmit={handleSubmit(handleSubmitLogin)}
    //         errors={errors}
    //         register={register}
    //         control={control}
    //       />
    //     </div>
    //   </div>
    // </div>
  );
}

export default withAlert(Login);
