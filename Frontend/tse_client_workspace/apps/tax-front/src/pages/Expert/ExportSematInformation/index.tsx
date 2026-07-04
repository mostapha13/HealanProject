import { Icon, TextField } from '@tse/components/atoms';
import { SimpleForm } from '@tse/components/molecules';
import { Table } from 'apps/tax-front/src/components/Table';
import {
  ErrorType,
  HeaderTypes,
  ListType,
  onAlertProps,
  TableOnChange,
} from '@tse/types';
import { useState, useEffect, useRef } from '@tse/utils';
import withAlert from '../../../hoc/withAlert';
import { exportSematDataThirdParty } from './service';
import LoadingModal from 'apps/tax-front/src/components/Loading';
import { downloadFile } from '@tse/tools';

interface SetPeriodType {
  onAlert: onAlertProps;
}

const PageSize = 10;

function SetPeriod(props: SetPeriodType) {
  const { onAlert } = props;
  const [state, setState] = useState<any>({});
  const [values, setValues] = useState({});
  const [isLoading, setLoading] = useState(false);
  const [data, setData] = useState<any>();

  const childRef: any = useRef();

  const onFail = (error: any) => {
    console.log('error', error);
    setLoading(false);
    if (error?.status == 404) {
      onAlert({
        type: 'error',
        message: 'موردی یافت نشد.',
      });
    } else {
      onAlert(error);
    }
  };

  const formList: ListType[] = [
    {
      itemType: 'select',
      className: 'col-span-3',
      label: 'نوع  خریدار',
      required: true,
      require: 'نوع خریدار نمی تواند خالی باشد',
      name: 'CustomerType',
      options: [
        { name: '', value: '' },
        { name: 'حقیقی', value: '1' },
        { name: 'حقوقی', value: '2' },
      ],
    },
    {
      name: 'StartDate',
      label: 'از تاریخ',
      itemType: 'datePicker',
      className: 'col-span-3',
      require: 'از تاریخ را وارد کنید',
    },
    {
      name: 'EndDate',
      label: 'تا تاریخ',
      itemType: 'datePicker',
      className: 'col-span-3',
      require: 'تا تاریخ را وارد کنید',
    },
    {
      name: 'submit',
      value: 'دریافت فایل',
      type: 'submit',
      itemType: 'button',
      buttonClassName: 'bg-buttonBlue',
      className: 'col-span-3 w-[40%] mr-10 ',
    },
  ];

  function handleSubmit(param: any) {
    setLoading(true);
    setData(param);
    exportSematDataThirdParty({
      data: param,
      onSuccess: (res: any) => {
        setLoading(false);
        downloadExportFile(
          res,
          'file' +
            ' ' +
            'Fr:' +
            ' ' +
            param?.StartDate +
            ' ' +
            'To:' +
            ' ' +
            param?.EndDate +
            '.csv'
        );
        onAlert({
          type: 'success',
          message: 'فایل با موفقیت دانلود شد.',
        });
      },
      onFail,
    });
  }
  const downloadExportFile = (data: any, name: any) => {
    if (data != null) {
      downloadFile(data, name);
    }
  };
  return (
    <div className="p-10">
      <div className="px-6">
        <h2 className="col-span-full text-lg font-medium border-b-2 py-4 border-lightGray">
          خروجی اطلاعات سمات
        </h2>
        <div className=" grid grid-cols-12 gap-4 py-10 px-4 mt-6 shadow-[0_0px_5px_rgba(0,0,0,0.2)]">
          <SimpleForm
            className="col-span-12 grid grid-cols-12 gap-5"
            list={formList}
            onSubmit={handleSubmit}
            values={values}
            isLoading={isLoading}
            reference={childRef}
          />
        </div>
      </div>
      <LoadingModal visible={isLoading} />
    </div>
  );
}

export default withAlert(SetPeriod);
