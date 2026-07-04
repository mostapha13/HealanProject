import { SimpleForm } from '@tse/components/molecules';
import { ListType, onAlertProps } from '@tse/types';
import { useState, useEffect, useRef } from '@tse/utils';
import withAlert from '../../../hoc/withAlert';
import {
  setPublicAndPrivateKey,
  getPublicAndPrivateKey,
  setUniqueId,
} from './service';

interface SetKeyAndUniqueIdType {
  onAlert: onAlertProps;
}

function SetKeyAndUniqueId(props: SetKeyAndUniqueIdType) {
  const { onAlert } = props;
  const [values, setValues] = useState({});
  const [keyValues, setKeyValues] = useState({});
  const [isLoading, setLoading] = useState(false);
  const [publicAndPrivateKeyId, setPublicAndPrivateKeyId] = useState('');
  const [publicAndPrivateKey, setPublicAndPrivateKey] = useState({});

  const childRef: any = useRef();
  useEffect(() => {
    getPublicAndPrivateKey({
      onSuccess: (res) => {
        setPublicAndPrivateKeyId(res?.data?.id);
        setKeyValues({
          privateKey: res?.data?.privateKey,
          publicKey: res?.data?.publicKey,
        });
        setValues({
          uniqueId: res?.data?.taxKeyDec,
        });
      },
      onFail,
    });
  }, []);

  const keyFormList: ListType[] = [
    {
      itemType: 'input',
      className: 'col-span-6 ',
      label: 'کلید عمومی',
      required: true,
      require: 'کلید عمومی را وارد نمایید',
      name: 'publicKey',
      multiline: true,
    },
    {
      itemType: 'input',
      className: 'col-span-6 max-h-[300px]',
      label: 'کلید خصوصی',
      required: true,
      multiline: true,
      require: 'کلید خصوصی را وارد نمایید.',
      name: 'privateKey',
    },
    {
      name: 'submit',
      value: 'ثبت',
      type: 'submit',
      itemType: 'button',
      buttonClassName: 'bg-buttonBlue',
      className: 'col-span-1',
    },
  ];
  const uniqueIdFormList: ListType[] = [
    {
      itemType: 'input',
      className: 'col-span-3',
      label: 'شناسه یکتا',
      required: true,
      require: 'شناسه یکتا را وارد نمایید',
      name: 'uniqueId',
    },

    {
      name: 'submit',
      value: 'ثبت',
      type: 'submit',
      itemType: 'button',
      buttonClassName: 'bg-buttonBlue',
      className: 'col-span-1 ',
    },
  ];

  const onFail = (error: any) => {
    setLoading(false);
    onAlert(error);
  };

  function handleKeySubmit(param: any) {
    setPublicAndPrivateKey({
      id: publicAndPrivateKeyId,
      publicKey: param?.publicKey,
      privateKey: param?.privateKey,
      onSuccess: (res: any) => {
        if (res?.data?.isSuccess) {
          onAlert({ type: 'success', message: 'کلید با موفقیت ثبت گردید' });
        }
      },
      onFail,
    });
    // insertApplicationUser({ data: param, onSuccess, onFail });
  }
  function handleUniqueIdSubmit(param: any) {
    setUniqueId({
      id: publicAndPrivateKeyId,
      uniqueId: param?.uniqueId,
      onSuccess: (res) => {
        if (res?.data?.isSuccess) {
          onAlert({
            type: 'success',
            message: 'شناسه یکتا با موفقیت ثبت گردید',
          });
        }
      },
      onFail,
    });
  }

  return (
    <div className="p-10">
      <div className="px-6">
        <h2 className="col-span-full text-lg font-medium border-b-2 py-4 border-lightGray">
          تعریف امضای دیجیتال
        </h2>
        <h3 className="mt-4">
          * به دلیل مسائل امنیتی امکان نمایش اطلاعات این صفحه به طور کامل وجود
          ندارد.
        </h3>
        <div className=" grid grid-cols-12 gap-4 py-10 px-4 mt-6 shadow-[0_0px_5px_rgba(0,0,0,0.2)]">
          <SimpleForm
            className="col-span-12 grid grid-cols-12 gap-4"
            list={keyFormList}
            onSubmit={handleKeySubmit}
            values={keyValues}
            isLoading={isLoading}
            reference={childRef}
          />
        </div>
      </div>
      <div className="px-6 mt-6">
        <h2 className="col-span-full text-lg font-medium border-b-2 py-4 border-lightGray">
          ثبت شناسه یکتا
        </h2>
        <div className=" grid grid-cols-12  py-10 px-4 mt-6 shadow-[0_0px_5px_rgba(0,0,0,0.2)]">
          <SimpleForm
            className="col-span-12 grid grid-cols-12 gap-4"
            list={uniqueIdFormList}
            onSubmit={handleUniqueIdSubmit}
            values={values}
            isLoading={isLoading}
            reference={childRef}
          />
        </div>
      </div>
    </div>
  );
}

export default withAlert(SetKeyAndUniqueId);
