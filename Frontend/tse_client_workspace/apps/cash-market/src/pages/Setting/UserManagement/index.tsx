/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import {
  TextField,
  Button,
  Dropdown,
  Icon,
  SelectMultiple,
  NewSelectSearch,
} from '@tse/components/atoms';
import { SearchInput } from '@tse/components/molecules';
import { Table } from '@tse/components/organism';
import { useEffect, useStates } from '@tse/utils';
import {
  getMarketMakerGroupList,
  getFundList,
  saveUser,
  getUserList,
} from '../../../Controller';
import withAlert from '../../../hoc/withAlert';
import { HeaderTypes } from '@tse/types';
import { getRole } from 'apps/cash-market/src/Controller/Identity';
import { deSeparator } from '@tse/tools';

const statusData = [
  {
    id: 0,
    value: 'غیر فعال',
  },
  {
    id: 1,
    value: 'فعال',
  },
];

const initialState = {
  groupList: [],
  fundList: [],
  marketMakerGroup: null,
  marketMakerGroupError: null,
  fund: null,
  firstName: '',
  firstNameError: false,
  lastName: '',
  lastNameError: false,
  phoneNumber: '',
  phoneNumberError: false,
  isActive: statusData[1],
  userList: [],
  selectedUser: null,
  isDisableFund: false,
  selectedRole: [],
  roleData: [],
  selectedRoleError: false,
  selectedRoleApi: null,
  selectedSubFunds: [],
  selectedSubFundsApi: null,
  pageNumber: 1,
};

function UserManagement({ onAlert }: any) {
  const [state, setState] = useStates<any>(initialState);
  const {
    groupList,
    fundList,
    marketMakerGroup,
    fund,
    firstName,
    lastName,
    phoneNumber,
    isActive,
    userList,
    selectedUser,
    marketMakerGroupError,
    firstNameError,
    lastNameError,
    phoneNumberError,
    isDisableFund,
    selectedRole,
    selectedRoleApi,
    roleData,
    selectedRoleError,
    selectedSubFunds,
    selectedSubFundsApi,
    pageNumber,
  } = state;
  const tableHeader: HeaderTypes[] = [
    {
      title: 'نام',
      dataIndex: 'firstName',
      key: 'firstName',
      className: 'col-span-1',
    },
    {
      title: 'نام خانوادگی',
      dataIndex: 'lastName',
      key: 'lastName',
      className: 'col-span-1',
    },
    {
      title: 'نام گروه',
      dataIndex: 'marketMakerUserGroup',
      key: 'marketMakerUserGroup',
      className: 'col-span-2',
      render: (item: any) => <span>{item?.groupName}</span>,
    },
    {
      title: 'نام صندوق',
      dataIndex: 'fund',
      key: 'fund',
      className: 'col-span-2',
      render: (item: any) => <span>{item?.fundName}</span>,
    },
    {
      title: 'شماره موبایل',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
      className: 'col-span-1',
    },
    {
      title: 'نقش',
      dataIndex: 'marketMakerUserRoles',
      key: 'marketMakerUserRoles',
      className: 'col-span-2',
      render: (item: any) => (
        <span>{item?.map((i: any) => i.displayName).join(' , ')}</span>
      ),
    },
    {
      title: 'وضعیت',
      dataIndex: 'isActive',
      key: 'isActive',
      className: 'col-span-1',
      render: (item: any) => <span>{item ? 'فعال' : 'غیر فعال'}</span>,
    },
    {
      title: 'ویرایش',
      dataIndex: 'hallName',
      key: 'hallName',
      className: 'col-span-1',
      render: (_: any, record: any) => (
        <Icon
          name="icon-edit"
          classname="cursor-pointer"
          onClick={() => onEdit(record)}
        />
      ),
    },
  ];
  // const groupList = [
  //   {
  //     marketMakerUserGroupId: 'MarketMaker',
  //     groupName: 'کارگزار بازار سهام',
  //   },
  //   {
  //     marketMakerUserGroupId: 'MarketMakerExpert',
  //     groupName: 'کارشناس بازار سهام',
  //   },
  //   {
  //     marketMakerUserGroupId: 'MarketMakerManager',
  //     groupName: 'مدیر بازار سهام',
  //   },
  // ];
  useEffect(() => {
    getGroupList();
    getFund('', 1);
    getUsers(1, '');
    getRoleData('');
  }, []);
  useEffect(() => {
    setState({ fund: { fundName: '' }, selectedSubFunds: [] });
  }, [marketMakerGroup]);
  useEffect(() => {
    if (marketMakerGroup?.marketMakerUserGroupId === 'MarketMaker') {
      setState({
        isDisableFund: false,
      });
    } else {
      setState({
        isDisableFund: true,
      });
    }
  }, [marketMakerGroup]);
  useEffect(() => {
    const newSelectedRole = selectedRole?.map((role: any) => {
      return {
        name: role,
      };
    });
    setState({
      selectedRoleApi: newSelectedRole,
    });
  }, [selectedRole]);

  useEffect(() => {
    const newSelectedSubFunds = selectedSubFunds?.map((id: any) => {
      return {
        fundId: id,
      };
    });
    setState({
      selectedSubFundsApi: newSelectedSubFunds,
    });
  }, [selectedSubFunds]);

  const onEdit = (record: any) => {
    console.log('reccord', record);
    const {
      marketMakerUserGroup,
      fund,
      firstName,
      lastName,
      phoneNumber,
      isActive,
      marketMakerUserRoles,
      relatedFunds,
    } = record;

    setState({
      selectedUser: record,
      marketMakerGroup: marketMakerUserGroup,
      fund,
      firstName,
      lastName,
      phoneNumber,
      isActive: isActive ? statusData[1] : statusData[0],
      selectedRole: marketMakerUserRoles?.map((item: any) => {
        return item?.name;
      }),
      selectedSubFunds: relatedFunds?.map((item: any) => {
        return item?.fundId;
      }),
    });
  };

  const getGroupList = () => {
    getMarketMakerGroupList({ onSuccess: onSuccessGroupList, onFail });
  };

  const onSuccessGroupList = (list: any) => {
    const newGroupData = list?.items?.map((item: any) => {
      return {
        marketMakerUserGroupId: item?.workFlowUserGroupId,
        groupName: item?.groupName,
      };
    });
    setState({
      groupList: newGroupData,
    });
  };

  const onFail = (error: any) => {
    onAlert(error);
  };

  const getFund = (text: string, pageNo: number) => {
    const data = {
      FundName: text,
      PageNumber: pageNo,
    };
    getFundList({ data, onSuccess: onSuccessFundList, onFail });
  };

  const onSuccessFundList = (result: any) => {
    setState({
      fundList: result.items,
    });
  };

  const onChange = (key: string, value: any) => {
    const errorKey = `${key}Error`;
    setState({
      [key]: value,
      [errorKey]: false,
    });
  };
  const submit = () => {
    const isActiveValue = isActive.id === 1 ? true : false;
    if (
      firstName &&
      lastName &&
      phoneNumber &&
      marketMakerGroup &&
      selectedRoleApi
    ) {
      const data = {
        ...(selectedUser && {
          marketMakerUserId: selectedUser.marketMakerUserId,
        }),
        firstName,
        lastName,
        phoneNumber,
        isActive: isActiveValue,
        marketMakerUserGroup: marketMakerGroup,
        fund,
        marketMakerUserRoles: selectedRoleApi,
        relatedFunds: selectedSubFundsApi,
      };
      saveUser({ data, onSuccess: onSuccessSave, onFail });
    } else {
      setState({
        ...(!firstName && { firstNameError: true }),
        ...(!lastName && { lastNameError: true }),
        ...(!marketMakerGroup && { marketMakerGroupError: true }),
        ...(!phoneNumber && { phoneNumberError: true }),
        ...(!selectedRoleApi && { selectedRoleError: true }),
      });
    }
  };

  const onSuccessSave = () => {
    onAlert({ message: 'عملیات با موفقیت انجام شد', type: 'success' });
    setState({
      firstName: '',
      lastName: '',
      phoneNumber: '',
      marketMakerUserGroup: null,
      marketMakerGroup: null,
      selectedRoleApi: null,
      selectedRole: [],
      fund: { fundName: '' },
      selectedSubFunds: [],
      selectedSubFundsApi: null,
      pageNumber: 1,
    });
    getUsers(1, '');
  };

  const getUsers = (pageNo: number, text: string) => {
    const data = {
      UserName: text,
      PageNumber: pageNo,
      PageSize: 10,
    };
    getUserList({
      data,
      onSuccess: (e: any) => onChange('userList', e),
      onFail,
    });
  };

  const onSearch = (text: string) => {
    getUsers(1, text);
  };

  const onChangePage = (pageNo: number) => {
    getUsers(pageNo, '');
    setState({ pageNumber: pageNo });
  };
  const getRoleData = (text: any) => {
    const data = {
      SearchText: text,
      AccessSystemId: 1,
    };
    getRole({
      data,
      onSuccess: (res: any) => {
        setState({
          roleData: res,
        });
      },
      onFail,
    });
  };
  return (
    <>
      <div className="shadow-[0_0px_4px_rgba(0,0,0,0.2)] rounded-sm p-3">
        <span className="font-bold">ایجاد کاربر جدید</span>
        <section className="grid grid-cols-12 gap-4 mt-8 mb-2 ">
          <TextField
            className="col-span-3"
            label="نام"
            value={firstName}
            onChange={(e: any) => onChange('firstName', e)}
            required
            error={firstNameError}
            type="text"
          />
          <TextField
            className="col-span-3"
            label="نام خانوادگی"
            value={lastName}
            onChange={(e: any) => onChange('lastName', e)}
            required
            error={lastNameError}
          />
          <Dropdown
            className="col-span-3"
            label="گروه کاری *"
            data={groupList}
            showKey="groupName"
            value={marketMakerGroup}
            onChange={(e: any) => onChange('marketMakerGroup', e)}
            error={marketMakerGroupError}
          />
          {/* <Dropdown
            className="col-span-3"
            label="نام صندوق"
            data={fundList}
            showKey="fundName"
            value={fund}
            onChange={(e: any) => onChange('fund', e)}
            isDisable={isDisableFund}
          /> */}
          <NewSelectSearch
            className="col-span-3"
            label="نام صندوق"
            onChange={(value: any) => {
              if (value?.fundName !== undefined) {
                setState({
                  fund: value,
                });
              } else if (value == '') {
                setState({
                  fund: null,
                });
              }
              getFund(value, 1);
            }}
            value={fund}
            data={fundList}
            showKey="fundName"
            isDisable={isDisableFund}
          />
          <div className="col-span-3">
            <SelectMultiple
              placeholder="صندوق‌ زیرمجموعه"
              options={fundList}
              value={selectedSubFunds}
              limit={10}
              onChange={(value: any) => {
                setState({
                  selectedSubFunds: value,
                });
              }}
              showKey="fundName"
              selectedKey="fundId"
              onSearch={(serachText: any) => getFund(serachText, 1)}
              disabled={isDisableFund}
            />
          </div>
          <TextField
            className="col-span-3"
            label="شماره موبایل"
            value={deSeparator(phoneNumber)}
            onChange={(e: any) => onChange('phoneNumber', e)}
            required
            error={phoneNumberError}
            // type="number"
            maxLength={11}
          />
          <div className="col-span-3">
            <SelectMultiple
              placeholder="نقش"
              options={roleData}
              value={selectedRole}
              limit={10}
              onChange={(value: any) => {
                setState({
                  selectedRole: value,
                  selectedRoleError: '',
                });
              }}
              required
              errorMessage={selectedRoleError}
              showKey="roleTitle"
              selectedKey="roleName"
            />
          </div>
          <Dropdown
            className="col-span-3"
            label="وضعیت"
            value={isActive}
            data={statusData}
            showKey="value"
            onChange={(e: any) => onChange('isActive', e)}
          />
        </section>
        <div className="flex w-full justify-end">
          <Button
            className="bg-blue text-white w-[115px] mr-4"
            onClick={submit}
          >
            ثبت
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-12 !mt-6">
        <SearchInput className=" col-span-5" onChange={onSearch} />
      </div>
      <Table
        columns={tableHeader}
        data={userList?.items}
        className="col-span-12 grid grid-cols-12 "
        wrapperClassName="!mt-6"
        totalPages={userList?.totalPages}
        pageSize={10}
        onChangePage={onChangePage}
        pageNumber={pageNumber}
      />
    </>
  );
}

export default withAlert(UserManagement);
