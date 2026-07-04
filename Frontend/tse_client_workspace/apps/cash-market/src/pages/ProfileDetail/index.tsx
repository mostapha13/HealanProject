import { Icon, Upload } from '@tse/components/atoms';
import { useEffect, useStates } from '@tse/utils';
import { Table } from '@tse/components/organism';
import { getAccessRequestById, getUserInfo } from '../../Controller';
import withAlert from '../../hoc/withAlert';

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
  isActive: false,
};

function ProfileDetail({ onAlert }: any) {
  const [state, setState] = useStates<any>(initialState);
  const { profileDetail, contactInfo, isActive } = state;

  useEffect(() => {
    getProfileDetail();
  }, []);

  const getProfileDetail = () => {
    getAccessRequestById({ onSuccess: onSuccessDetail, onFail });
  };

  const onSuccessDetail = (res: any) => {
    setState({
      profileDetail: res,
      contactInfo: [
        {
          name: `${res.marketMakerUser?.firstName || ''} ${
            res.marketMakerUser?.lastName || ''
          }`,
          role: 'نماینده صندوق',
          phoneNumber: res.marketMakerUser?.phoneNumber,
        },
        {
          name: res.fundManagerName,
          role: 'مدیر صندوق',
          phoneNumber: res.marketMakerManagerPhoneNumber,
        },
      ],
    });
    getUserInfo({ onSuccess: onSuccessUserInfo, onFail });
  };

  const onSuccessUserInfo = (res: any) => {
    setState({
      isActive: res.hasConfirmed,
    });
  };

  const onFail = (error: any) => {
    onAlert(error);
  };
  return (
    <>
      {!isActive && (
        <div className="bg-[#D1D35D4D] rounded p-2 mb-2 items-center flex">
          <Icon name="icon-warning" classname="text-[#FD8900] text-xl" />
          <div className="flex justify-between items-center flex-1">
            <span className="mr-2">
              کاربر گرامی ، مدارک شما در حال بررسی می باشد.
            </span>
            <span>کد رهگیری شما : {profileDetail?.order?.trackingNumber}</span>
          </div>
        </div>
      )}
      <div className="grid shadow-[0_0px_4px_rgba(0,0,0,0.2)] rounded-sm p-3">
        <span className="font-bold">اطلاعات حساب کاربری</span>
        <Table
          columns={accountHeader}
          className="col-span-12 grid grid-cols-12"
          wrapperClassName="!m-4"
          data={[profileDetail]}
          isPagination={false}
        />

        <span className="font-bold mt-12">اطلاعات تماس</span>
        <Table
          columns={contactsHeader}
          className="col-span-12 grid grid-cols-12"
          wrapperClassName="!m-4"
          data={contactInfo}
          isPagination={false}
        />

        <span className="font-bold mt-12">مدارک</span>
        <div className="flex flex-row items-center w-[65%] justify-between mb-4 mt-8">
          <span className="ml-4 whitespace-pre">
            نامه ارکان صندوق مبنی بر انتخاب مدیر صندوق :
          </span>
          <Upload
            value={profileDetail?.order?.orderFiles[0]?.fileName}
            href={profileDetail?.order?.orderFiles[0]?.link}
            name="fundManagerChoosingLetterFileId"
            placeholder="نام فایل"
          />
        </div>

        <div className="flex flex-row items-center w-[65%] justify-between mb-4">
          <span className="ml-4 whitespace-pre">
            نامه صندوق مبنی بر درخواست عضویت در اتوماسیون :
          </span>
          <Upload
            placeholder="نام فایل"
            value={profileDetail?.order?.orderFiles[1]?.fileName}
            href={profileDetail?.order?.orderFiles[1]?.link}
            name="membershipRequestLetterFileId"
          />
        </div>

        <div className="flex flex-row items-center w-[65%] justify-between mb-4">
          <span className="ml-4 whitespace-pre">
            مجوز شروع عملیات بازارگردانی از سازمان بورس اوراق بهادار :
          </span>
          <Upload
            placeholder="نام فایل"
            value={profileDetail?.order?.orderFiles[2]?.fileName}
            href={profileDetail?.order?.orderFiles[2]?.link}
            name="activityStartLicenseFileId"
          />
        </div>

        <div className="flex flex-row items-center w-[65%] justify-between mb-4">
          <span className="ml-4 whitespace-pre">امیدنامه :</span>
          <Upload
            placeholder="نام فایل"
            value={profileDetail?.order?.orderFiles[3]?.fileName}
            href={profileDetail?.order?.orderFiles[3]?.link}
            name="hopeLetterFileId"
          />
        </div>

        <div className="flex flex-row items-center w-[65%] justify-between mb-12">
          <span className="ml-4 whitespace-pre">تغییرات :</span>
          <Upload
            placeholder="نام فایل"
            value={profileDetail?.order?.orderFiles[4]?.fileName}
            href={profileDetail?.order?.orderFiles[4]?.link}
            name="changesFileId"
          />
        </div>
      </div>
    </>
  );
}

export default withAlert(ProfileDetail);
