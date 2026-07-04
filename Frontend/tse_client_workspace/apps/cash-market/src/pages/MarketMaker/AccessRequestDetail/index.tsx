import { Button, TextField } from '@tse/components/atoms';
import { useEffect, useStates, useNavigate } from '@tse/utils';
import { Table } from '@tse/components/organism';
import { getQueryParams, convertDateToJalali } from '@tse/tools';
import {
  getAccessRequestById,
  confirmAccessRequest,
  rejectAccessRequest,
  rejectFile,
  confirmFile,
} from '../../../Controller';
import withAlert from '../../../hoc/withAlert';
import ConfirmFile from 'apps/cash-market/src/components/PageFeature/ConfirmFile';

import { HeaderTypes } from '@tse/types';

const accountHeader: HeaderTypes[] = [
  {
    title: 'نام صندوق',
    dataIndex: 'marketMakerUser',
    key: 'marketMakerUser',
    className: 'col-span-3',
    render: (item: any) => <span>{item?.fund?.fundName}</span>,
  },
  {
    title: 'نام نماینده',
    dataIndex: 'marketMakerUser',
    key: 'marketMakerUser',
    className: 'col-span-2',
    render: (item: any) => (
      <span>
        {item?.firstName} {item?.lastName}
      </span>
    ),
  },
  {
    title: 'نام مدیر صندوق',
    dataIndex: 'fundManagerName',
    key: 'fundManagerName',
    className: 'col-span-2',
  },
  {
    title: 'نام حسابرس',
    dataIndex: 'auditorName',
    key: 'auditorName',
    className: 'col-span-2',
  },
  {
    title: 'سرمایه ثبتی صندوق',
    dataIndex: 'registeredCapital',
    key: 'registeredCapital',
    className: 'col-span-2',
  },
];

const contactsHeader: HeaderTypes[] = [
  {
    title: 'نام و نام خانوادگی',
    dataIndex: 'name',
    key: 'name',
    className: 'col-span-4',
  },
  {
    title: 'سمت',
    dataIndex: 'role',
    key: 'role',
    className: 'col-span-4',
  },
  {
    title: 'شماره تماس',
    dataIndex: 'phoneNumber',
    key: 'phoneNumber',
    className: 'col-span-3',
  },
];

const initialState = {
  profileDetail: null,
  contactInfo: [],
  fileData: [],
  publicMessage: '',
};

function AccessRequestDetail({ onAlert }: any) {
  const navigate = useNavigate();
  const [state, setState] = useStates<any>(initialState);
  const { profileDetail, contactInfo, fileData, publicMessage } = state;
  const OrderId = getQueryParams('id', window.location.href);

  const TitleRender = ({ record, index }: any) => {
    let title = '';
    switch (index) {
      case 0:
        title = 'نامه ارکان صندوق مبنی بر انتخاب مدیر صندوق';
        break;
      case 1:
        title = 'نامه صندوق مبنی بر درخواست عضویت در اتوماسیون ';
        break;
      case 2:
        title = 'مجوز شروع عملیات بازارگردانی از سازمان بورس اوراق بهادار ';
        break;
      case 3:
        title = 'امیدنامه';
        break;
      case 4:
        title = 'تغییرات ';
        break;
    }

    return (
      <ConfirmFile
        title={title}
        src={record}
        type={record?.fileType}
        onReject={() => onRejectFile(record.orderFileId)}
        onConfirm={() => onConfirmFile(record.orderFileId)}
      />
    );
  };

  const onRejectFile = (orderFileId: string) => {
    const data = {
      orderFileId,
    };
    rejectFile({ data, onSuccess: onSuccessConfirmFile, onFail });
  };

  const onConfirmFile = (orderFileId: string) => {
    const data = {
      orderFileId,
    };
    confirmFile({ data, onSuccess: onSuccessConfirmFile, onFail });
  };

  const onSuccessConfirmFile = () => {
    onAlert({ message: 'عملیات با موفقیت انجام شد', type: 'success' });
    getProfileDetail();
  };

  const StatusRender = ({ data, id }: { id: number; data: any }) => {
    const color =
      data[id]?.acceptStatus?.acceptStatusId === 'Confirmed'
        ? 'text-green'
        : data[id]?.acceptStatus?.acceptStatusId === 'Rejected'
        ? 'text-red'
        : '';
    return <span className={color}>{data[id]?.acceptStatus?.name || '-'}</span>;
  };

  const filesHeader = [
    {
      title: 'عنوان مدرک',
      dataIndex: 'fileName',
      key: 'fileName',
      className: 'col-span-6',
      render: (item: any, record: any, i: number) => (
        <TitleRender record={record} index={i} />
      ),
    },
    {
      title: 'تاریخ ثبت',
      dataIndex: 'createDate',
      key: 'createDate',
      className: 'col-span-3',
      render: (item: any) => <span>{convertDateToJalali(item)}</span>,
    },
    {
      title: 'تایید/رد کارشناس',
      dataIndex: 'orderFileAccepts',
      key: 'orderFileAccepts',
      className: 'col-span-2',
      render: (item: any) => <StatusRender data={item} id={0} />,
    },
  ];

  useEffect(() => {
    getProfileDetail();
  }, []);

  const getProfileDetail = () => {
    const data = {
      OrderId,
    };
    getAccessRequestById({ data, onSuccess: onSuccessDetail, onFail });
  };

  const onSuccessDetail = (res: any) => {
    setState({
      profileDetail: res,
      contactInfo: [
        {
          name: `${res.marketMakerUser.firstName} ${res.marketMakerUser.lastName}`,
          role: 'نماینده صندوق',
          phoneNumber: res.marketMakerUser.phoneNumber,
        },
        {
          name: res.fundManagerName,
          role: 'مدیر صندوق',
          phoneNumber: res.marketMakerManagerPhoneNumber,
        },
      ],
      fileData: [
        {
          ...res.fundManagerChoosingLetterFile,
        },
        {
          ...res.membershipRequestLetterFile,
        },
        { ...res.activityStartLicenseFile },
        { ...res.hopeLetterFile },
        { ...res.changesFile },
      ],
    });
  };

  const onFail = (error: any) => {
    onAlert(error);
  };

  const onConfirm = () => {
    const data = {
      orderId: OrderId,
      publicMessage,
    };
    confirmAccessRequest({ data, onSuccess: onSuccessConfirmForm, onFail });
  };

  const onSuccessConfirmForm = () => {
    onAlert({ message: 'عملیات با موفقیت انجام شد', type: 'success' });
    navigate('/cartable');
  };

  const goBack = () => {
    navigate('/cartable');
  };

  const onChangeText = (key: string, value: any) => {
    setState({
      [key]: value,
    });
  };

  const onReject = () => {
    const data = {
      orderId: OrderId,
      publicMessage,
    };
    rejectAccessRequest({ data, onSuccess: onSuccessConfirmForm, onFail });
  };

  return (
    <>
      <div className="grid shadow-[0_0px_4px_rgba(0,0,0,0.2)] rounded-sm p-3">
        <span className="font-bold mr-3">اطلاعات حساب کاربری</span>
        <Table
          columns={accountHeader}
          className="col-span-12 grid grid-cols-12"
          wrapperClassName="!m-4"
          data={[profileDetail]}
          isPagination={false}
        />

        <span className="font-bold mt-8 mr-3">اطلاعات تماس</span>
        <Table
          columns={contactsHeader}
          className="col-span-12 grid grid-cols-12"
          wrapperClassName="!m-4"
          data={contactInfo}
          isPagination={false}
        />

        <span className="font-bold mt-12 mr-3">مدارک</span>
        {fileData && (
          <Table
            columns={filesHeader}
            className="col-span-12 grid grid-cols-12"
            wrapperClassName="!m-4"
            data={profileDetail?.order?.orderFiles}
            isPagination={false}
          />
        )}
        <span className="font-bold mt-12 mb-3 mr-3">توضیحات</span>
        <TextField
          multiline
          label="متن پیام"
          onChange={(e: any) => onChangeText('publicMessage', e)}
          fullWidth
          className="!mb-5 mr-3"
        />
      </div>
      <div className="flex items-start justify-end pt-3">
        <Button
          className="border-green border text-green w-[100px]"
          onClick={onConfirm}
        >
          تایید
        </Button>

        <Button
          className="border-red border text-red w-[100px]  mr-3"
          onClick={onReject}
        >
          عدم تایید
        </Button>
        <Button
          className="border-blue border text-blue w-[100px] mr-3"
          onClick={goBack}
        >
          بازگشت
        </Button>
      </div>
    </>
  );
}

export default withAlert(AccessRequestDetail);
