import { Button, Image, TextField } from '@tse/components/atoms';
import type { ErrorType, HeaderTypes, onAlertProps } from '@tse/types';
import { useEffect, useRef, useState, useNavigate } from '@tse/utils';
import withAlert from '../../hoc/withAlert';
import { Radio, Select } from 'antd';
import type { RadioChangeEvent } from 'antd';
import { Form, Input, Space } from 'antd';
import { getSettingTest } from './service';
import { userManager } from '../../store/userManager';

interface SetBasicInfoTypes {
  onAlert: onAlertProps;
}

function NavigatePage({ onAlert }: SetBasicInfoTypes) {
  const navigate = useNavigate();

  useEffect(() => {
    userManager.getUser().then((user) => {
      if (user === null) {
        handleGetSettingTest();
      } else {
        navigate('/user/dashboard');
      }
    });
  }, []);

  function handleGetSettingTest() {
    getSettingTest({
      onSuccess: (res: any) => {
        // console.log('resssss', res);
      },
      onFail,
    });
  }
  const onFail = (error: any) => {
    onAlert(error);
  };
  return (
    <div className="p-10 mx-4 my-4">
      <span>شما در حال انتقال به صفحه مورد نظر هستید ....</span>
    </div>
  );
}
export default withAlert(NavigatePage);
