import {
  Icon,
  TextField,
  Upload,
  Button,
  SearchField,
} from '@tse/components/atoms';
import { Table } from '@tse/components/organism';
import { useStates, useEffect, useNavigate } from '@tse/utils';
import {
  saveAccessRequest,
  uploadFile,
  getSimilarFunds,
  getUserInfo,
  getAccessRequestById,
} from '../../Controller';
import withAlert from '../../hoc/withAlert';
import Checkbox from '@mui/material/Checkbox';
import { convertDateToJalali } from '@tse/tools';
import { Modal } from 'antd';
const { confirm, success } = Modal;

const messageHeader = [
  {
    title: 'متن پیام',
    dataIndex: 'comment',
    key: 'comment',
    className: 'col-span-7',
  },
  {
    title: 'تاریخ ارسال',
    dataIndex: 'commentDate',
    key: 'commentDate',
    className: 'col-span-2',
    render: (item: any) => <span>{convertDateToJalali(item)}</span>,
  },
  {
    title: 'فرستنده',
    dataIndex: 'marketUserName',
    key: 'marketUserName',
    className: 'col-span-2',
  },
];

const initialState = {
  similarFundsList: null,
  fundName: '',
  phoneNumber: '',
  firstName: '',
  lastName: '',
  marketMakerManagerPhoneNumber: '',
  fundManagerName: '',
  auditorName: '',
  registeredCapital: '',
  fundManagerChoosingLetterFileId: null,
  membershipRequestLetterFileId: null,
  activityStartLicenseFileId: null,
  hopeLetterFileId: null,
  changesFileId: null,
  fundNameError: false,
  firstNameError: false,
  lastNameError: false,
  marketMakerManagerPhoneNumberError: false,
  fundManagerNameError: false,
  auditorNameError: false,
  registeredCapitalError: false,
  fundManagerChoosingLetterFileIdError: false,
  membershipRequestLetterFileIdError: false,
  activityStartLicenseFileIdError: false,
  hopeLetterFileIdError: false,
  changesFileIdError: false,
  isChecked: false,
  isRejected: false,
  comment: [],
};
function Profile({ onAlert }: any) {
  const navigate = useNavigate();
  const [state, setState] = useStates<any>(initialState);
  const {
    similarFundsList,
    phoneNumber,
    firstName,
    lastName,
    fundName,
    marketMakerManagerPhoneNumber,
    fundManagerName,
    auditorName,
    registeredCapital,
    fundManagerChoosingLetterFileId,
    membershipRequestLetterFileId,
    activityStartLicenseFileId,
    hopeLetterFileId,
    changesFileId,
    isChecked,
    fundNameError,
    firstNameError,
    lastNameError,
    marketMakerManagerPhoneNumberError,
    fundManagerNameError,
    auditorNameError,
    registeredCapitalError,
    fundManagerChoosingLetterFileIdError,
    membershipRequestLetterFileIdError,
    activityStartLicenseFileIdError,
    hopeLetterFileIdError,
    changesFileIdError,
    isRejected,
    comment,
  } = state;

  useEffect(() => {
    getUserInfo({ onSuccess: onSuccessUserInfo, onFail });
    getAccessRequestById({
      onSuccess: onSuccessDetail,
      onFail,
    });
  }, []);

  useEffect(() => {
    getSimilarFundsList(fundName);
  }, [fundName]);

  const onSuccessDetail = (res: any) => {
    setState({
      firstName: res.marketMakerUser?.firstName,
      lastName: res.marketMakerUser?.lastName,
      fundName: res.marketMakerUser?.fund.fundName,
      marketMakerManagerPhoneNumber: res.marketMakerManagerPhoneNumber,
      fundManagerName: res.fundManagerName,
      auditorName: res.auditorName,
      registeredCapital: res.registeredCapital,
      fundManagerChoosingLetterFileId: res.order?.orderFiles[0],
      membershipRequestLetterFileId: res.order?.orderFiles[1],
      activityStartLicenseFileId: res.order?.orderFiles[2],
      hopeLetterFileId: res.order?.orderFiles[3],
      changesFileId: res.order?.orderFiles[4],
      isRejected:
        res.marketMakerAccessRequestState?.marketMakerAccessRequestStateId ===
        'Rejected'
          ? true
          : false,

      comment: res.order?.comments,
    });
  };
  const onSuccessUserInfo = (res: any) => {
    setState({
      phoneNumber: res.userSummaryReply.phoneNumber,
    });
  };

  const getSimilarFundsList = (FundName: string) => {
    const data = {
      FundName,
    };

    getSimilarFunds({ data, onSuccess: onSuccessSimilarFund, onFail });
  };

  const onSuccessSimilarFund = (res: any) => {
    setState({
      similarFundsList: res,
    });
  };
  const onChange = (key: string, item: any) => {
    const errorKey = `${key}Error`;
    setState({
      [key]: item,
      [errorKey]: false,
    });
  };

  const onChangeFile = (e: any, key: string) => {
    uploadFile({
      data: e.target.files[0],
      onSuccess: (res: any) => onSuccessUpload(res, key),
      onFail,
    });
  };

  const onFail = (error: any) => {
    onAlert(error);
  };

  const onSuccessUpload = (res: any, key: string) => {
    const errorKey = `${key}Error`;
    setState({
      [key]: res,
      [errorKey]: false,
    });
  };

  const config = {
    title: '',
    content: <div>آیا از صحت اطلاعات وارد شده اطمینان دارید؟</div>,
    onOk() {
      onSave();
    },
    okText: 'بله',
    cancelText: 'خیر',
  };
  const submit = () => {
    if (
      firstName &&
      lastName &&
      fundName &&
      marketMakerManagerPhoneNumber &&
      fundManagerName &&
      auditorName &&
      registeredCapital &&
      fundManagerChoosingLetterFileId &&
      membershipRequestLetterFileId &&
      activityStartLicenseFileId &&
      hopeLetterFileId &&
      changesFileId
    ) {
      confirm(config);
    } else {
      setState({
        ...(!firstName && { firstNameError: true }),
        ...(!lastName && { lastNameError: true }),
        ...(!fundName && { fundNameError: true }),
        ...(!marketMakerManagerPhoneNumber && {
          marketMakerManagerPhoneNumberError: true,
        }),
        ...(!fundManagerName && { fundManagerNameError: true }),
        ...(!auditorName && { auditorNameError: true }),
        ...(!registeredCapital && { registeredCapitalError: true }),
        ...(!fundManagerChoosingLetterFileId && {
          fundManagerChoosingLetterFileIdError: true,
        }),
        ...(!membershipRequestLetterFileId && {
          membershipRequestLetterFileIdError: true,
        }),
        ...(!activityStartLicenseFileId && {
          activityStartLicenseFileIdError: true,
        }),
        ...(!hopeLetterFileId && { hopeLetterFileIdError: true }),
        ...(!changesFileId && { changesFileIdError: true }),
      });
    }
  };

  const onSave = () => {
    const data = {
      firstName,
      lastName,
      fundName,
      marketMakerManagerPhoneNumber,
      fundManagerName,
      auditorName,
      registeredCapital: Number(registeredCapital),
      orderFiles: [
        {
          fileId: fundManagerChoosingLetterFileId?.fileId,
          marketMakerFileTypeId: 9,
        },
        {
          fileId: membershipRequestLetterFileId?.fileId,
          marketMakerFileTypeId: 10,
        },
        {
          fileId: activityStartLicenseFileId?.fileId,
          marketMakerFileTypeId: 11,
        },
        {
          fileId: hopeLetterFileId?.fileId,
          marketMakerFileTypeId: 12,
        },
        {
          fileId: changesFileId?.fileId,
          marketMakerFileTypeId: 13,
        },
      ],
    };
    saveAccessRequest({ data, onSuccess: onSuccessSave, onFail });
  };

  const onSuccessSave = (res: any) => {
    success({
      content: (
        <div className="flex flex-col gap-1">
          <span>ثبت اطلاعات پروفایل با موفقیت انجام شد.</span>
          <span>کد رهگیری شما : {res.order.trackingNumber}</span>
        </div>
      ),
      okText: 'باشه',
      onOk() {
        navigate('/profile-detail');
      },
    });
  };

  const title = isRejected
    ? ' کاربر گرامی ، اطلاعات شما از طرف کارشناس رد شده است لطفا دوباره بررسی نمایید و ارسال کنید.'
    : '';
  // : ' کاربر گرامی ، در صورت دسترسی به پنل ابتدا باید حساب کاربری خود را احراز هویت نمایید.';

  return (
    <div>
      <div className="bg-[#FFD3D3] rounded p-2 mb-2 items-center">
        <Icon name="icon-cancel-circle" classname="text-red text-xl" />
        <span className="mr-2">{title}</span>
      </div>
      <div className="shadow-[0_0px_4px_rgba(0,0,0,0.2)] rounded-sm p-3">
        <span className="font-bold"> توضیحات کارشناس</span>
        <Table
          columns={messageHeader}
          className="col-span-12 grid grid-cols-12"
          wrapperClassName="!m-4"
          data={comment}
          isPagination={false}
        />

        <span className="font-bold">اطلاعات حساب کاربری</span>
        <div className="grid grid-cols-12 gap-4 mt-8 mb-12">
          <TextField
            className="col-span-3"
            label="شماره تماس نماینده صندوق"
            value={phoneNumber}
            disabled
          />
          <SearchField
            className="col-span-3"
            label="نام کامل صندوق "
            onChange={(value: any) => onChange('fundName', value)}
            value={fundName}
            required
            error={fundNameError}
            data={similarFundsList}
            showKey="fundName"
          />
          <TextField
            className="col-span-3"
            label="نام نماینده "
            onChange={(value: any) => onChange('firstName', value)}
            value={firstName}
            required
            error={firstNameError}
          />
          <TextField
            className="col-span-3"
            label="نام خانوادگی نماینده"
            onChange={(value: any) => onChange('lastName', value)}
            value={lastName}
            required
            error={lastNameError}
          />
          <TextField
            className="col-span-3"
            label="نام مدیر صندوق "
            onChange={(value: any) => onChange('fundManagerName', value)}
            value={fundManagerName}
            required
            error={fundManagerNameError}
          />
          <TextField
            className="col-span-3"
            label="شماره تماس مدیر صندوق"
            onChange={(value: any) =>
              onChange('marketMakerManagerPhoneNumber', value)
            }
            value={marketMakerManagerPhoneNumber}
            required
            error={marketMakerManagerPhoneNumberError}
            type="number"
          />
          <TextField
            className="col-span-3"
            label="نام حسابرس "
            onChange={(value: any) => onChange('auditorName', value)}
            value={auditorName}
            required
            error={auditorNameError}
          />
          <TextField
            className="col-span-3"
            label="سرمایه ثبتی صندوق "
            onChange={(value: any) => onChange('registeredCapital', value)}
            value={registeredCapital}
            required
            error={registeredCapitalError}
            type="numeric"
          />
        </div>
        <span className="font-bold">مدارک</span>
        <div className="flex flex-row items-center w-[65%] justify-between mb-4 mt-8">
          <span className="ml-4 whitespace-pre">
            نامه ارکان صندوق مبنی بر انتخاب مدیر صندوق :
          </span>
          <Upload
            onChange={(file: any) =>
              onChangeFile(file, 'fundManagerChoosingLetterFileId')
            }
            value={fundManagerChoosingLetterFileId?.fileName}
            href={fundManagerChoosingLetterFileId?.link}
            name="fundManagerChoosingLetterFileId"
            onDelete={() => onChange('fundManagerChoosingLetterFileId', null)}
            error={fundManagerChoosingLetterFileIdError}
          />
        </div>
        <div className="flex flex-row items-center w-[65%] justify-between mb-4">
          <span className="ml-4 whitespace-pre">
            نامه صندوق مبنی بر درخواست عضویت در اتوماسیون :
          </span>
          <Upload
            onChange={(file: any) =>
              onChangeFile(file, 'membershipRequestLetterFileId')
            }
            value={membershipRequestLetterFileId?.fileName}
            href={membershipRequestLetterFileId?.link}
            name="membershipRequestLetterFileId"
            onDelete={() => onChange('membershipRequestLetterFileId', null)}
            error={membershipRequestLetterFileIdError}
          />
        </div>
        <div className="flex flex-row items-center w-[65%] justify-between mb-4">
          <span className="ml-4 whitespace-pre">
            مجوز شروع عملیات بازارگردانی از سازمان بورس اوراق بهادار :
          </span>
          <Upload
            onChange={(file: any) =>
              onChangeFile(file, 'activityStartLicenseFileId')
            }
            value={activityStartLicenseFileId?.fileName}
            href={activityStartLicenseFileId?.link}
            name="activityStartLicenseFileId"
            onDelete={() => onChange('activityStartLicenseFileId', null)}
            error={activityStartLicenseFileIdError}
          />
        </div>
        <div className="flex flex-row items-center w-[65%] justify-between mb-4">
          <span className="ml-4 whitespace-pre">امیدنامه :</span>
          <Upload
            onChange={(file: any) => onChangeFile(file, 'hopeLetterFileId')}
            value={hopeLetterFileId?.fileName}
            href={hopeLetterFileId?.link}
            name="hopeLetterFileId"
            onDelete={() => onChange('hopeLetterFileId', null)}
            error={hopeLetterFileIdError}
          />
        </div>
        <div className="flex flex-row items-center w-[65%] justify-between mb-12">
          <span className="ml-4 whitespace-pre">تغییرات :</span>
          <Upload
            onChange={(file: any) => onChangeFile(file, 'changesFileId')}
            value={changesFileId?.fileName}
            href={changesFileId?.link}
            name="changesFileId"
            onDelete={() => onChange('changesFileId', null)}
            error={changesFileIdError}
          />
        </div>
        <div className=" border-t border-gray mt-8 pt-4">
          <div className="bg-lightGray rounded p-1 mb-2 items-center">
            <Checkbox
              value={isChecked}
              onClick={() => onChange('isChecked', !isChecked)}
            />
            <span className=" text-extratiny">
              اینجانب مدیر این صندوق بازارگردانی ، متعهد می شوم ، که تمامی
              اطلاعات فوق صحیح بوده و هرگونه تغییر در این اطلاعات را در اسرع وقت
              بروزرسانی کنم.
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-start justify-end pt-3">
        <Button
          className="bg-blue text-white w-[115px] mr-4"
          disabled={!isChecked}
          onClick={submit}
        >
          ارسال مدارک
        </Button>
      </div>
    </div>
  );
}

export default withAlert(Profile);
