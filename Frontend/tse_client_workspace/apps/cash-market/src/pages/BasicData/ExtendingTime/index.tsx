import { useEffect, useStates } from '@tse/utils';
import { TextField, Button } from '@tse/components/atoms';
import {
  getSettingList,
  saveSetting,
  removeSetting,
} from '../../../Controller';
import withAlert from '../../../hoc/withAlert';

interface stateInterface {
  settingList?: any;
  time: string;
  timeError: boolean;
}

const initialState = {
  settingList: [],
  time: '',
  timeError: false,
};
function ExtendingTime({ onAlert }: any) {
  const [state, setState] = useStates<any>(initialState);
  const { settingList, time, timeError } = state;

  useEffect(() => {
    getList();
  }, []);

  const getList = () => {
    getSettingList({ onSuccess: onSuccessList, onFail });
  };

  const onSuccessList = (res: any) => {
    setState({
      settingList: res,
      time: res[0].value,
    });
  };

  const onFail = (error: any) => {
    onAlert(error);
  };

  const onChange = (value: string) => {
    setState({
      time: value,
      timeError: false,
    });
  };

  const onSuccessSave = () => {
    onAlert({ message: 'عملیات با موفقیت انجام شد', type: 'success' });
  };

  const submit = () => {
    const data = {
      saveSettingItems: [
        {
          ...settingList[0],
          value: time,
        },
      ],
    };
    saveSetting({ data, onSuccess: onSuccessSave, onFail });
  };
  return (
    <div className="shadow-[0_0px_4px_rgba(0,0,0,0.2)] rounded-sm p-6">
      <span className="font-bold">تعیین زمان مهلت تمدید</span>
      <div className=" flex flex-row items-center mt-6">
        <TextField
          label="حداکثر مهلت زمان(روز)"
          onChange={onChange}
          value={time}
          required
          error={timeError}
          type="number"
        />
        <Button className="bg-blue text-white w-[115px] mr-4" onClick={submit}>
          ثبت
        </Button>
      </div>
    </div>
  );
}

export default withAlert(ExtendingTime);
