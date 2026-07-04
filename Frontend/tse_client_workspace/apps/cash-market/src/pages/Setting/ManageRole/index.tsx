/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import {
  Button,
  TextField,
  Dropdown,
  NewSelectSearch,
} from '@tse/components/atoms';
import { SymbolModal, Table } from '@tse/components/organism';
import { DatePicker } from '@tse/components/molecules';
import { useEffect, useStates, useNavigate, useState } from '@tse/utils';
import {} from '../../../Controller';
import withAlert from '../../../hoc/withAlert';
import {
  convertDate,
  loadFromStorage,
  convertDateAndTimeJalali,
} from '@tse/tools';
import { HeaderTypes, TableOnChange } from '@tse/types';
import NewSelect from 'apps/cash-market/src/components/atoms/NewSelect';
import TreeCheckBox from 'apps/cash-market/src/components/atoms/TreeCheckBox';
import {
  getAccessRole,
  getRole,
  saveAccessRole,
} from 'apps/cash-market/src/Controller/Identity';
import { message } from 'antd';

const initialState = {
  PageNumber: '',
  PageSize: 10,
  roleData: [],
  selectedRole: null,
  accessRoleData: [],
  checkedItems: [],
  updateAccessRoleData: [],
  initialCheckedKeys: [],
  selectedRoleError: false,
};

function ManageRole({ onAlert }: any) {
  const [state, setState] = useStates<any>(initialState);
  const {
    ToDate,
    PageSize,
    roleData,
    selectedRole,
    accessRoleData,
    checkedItems,
    updateAccessRoleData,
    initialCheckedKeys,
    selectedRoleError,
  } = state;

  useEffect(() => {
    getRoleData('');
  }, []);
  useEffect(() => {
    getAccessRoleData(selectedRole?.roleId);
  }, [selectedRole]);
  useEffect(() => {
    const collectKeysWithAccess = (items: any) => {
      let keys: any = [];
      items?.forEach((item: any) => {
        if (item.hasAccess) {
          keys.push(item.key);
        }
        if (item?.children?.length > 0) {
          keys = keys.concat(collectKeysWithAccess(item.children));
        }
      });
      return keys;
    };
    setState({ initialCheckedKeys: collectKeysWithAccess(accessRoleData) });
  }, [accessRoleData]);
  useEffect(() => {
    const updateHasAccess = (items: any, keys: any) => {
      const updatedItems = items?.map((item: any) => {
        const updatedItem = {
          ...item,
          hasAccess: keys.includes(item.key),
          children: item.children ? updateHasAccess(item.children, keys) : [],
        };
        return updatedItem;
      });
      return updatedItems;
    };
    setState({
      updateAccessRoleData: updateHasAccess(accessRoleData, checkedItems),
    });
  }, [checkedItems]);
  const onFail = (error: any) => {
    onAlert(error);
  };

  const onChange = (key: string, value: any) => {
    setState({
      [key]: value,
    });
  };
  const getRoleData = (text: any) => {
    const data = {
      AccessSystemId: 1,
      SearchText: text,
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
  const getAccessRoleData = (roleId: any) => {
    const data = {
      RoleId: roleId,
      AccessSystemId: 1,
    };
    getAccessRole({
      data,
      onSuccess: (res: any) => {
        setState({
          accessRoleData: res?.items,
        });
      },
      onFail,
    });
  };
  const saveParameter = () => {
    if (selectedRole) {
      const data = {
        roleId: selectedRole?.roleId,
        items:
          updateAccessRoleData?.length > 0
            ? updateAccessRoleData
            : accessRoleData,
      };
      saveAccessRole({
        data,
        onSuccess: (res: any) => {
          onAlert({
            message: 'سطح دسترسی با موفقیت به روزرسانی گردید.',
            type: 'success',
          });
        },
        onFail,
      });
    } else {
      selectedRole?.roleId == undefined &&
        setState({ selectedRoleError: true });
    }
  };
  return (
    <div className="shadow-[0_0px_4px_rgba(0,0,0,0.2)] rounded-sm p-3 pb-10">
      <span className="font-bold">مدیریت دسترسی‌ها</span>
      <div className="grid grid-cols-12 gap-4 mt-8 mb-2">
        <div className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-5  col-span-2 flex-col flex">
          <NewSelectSearch
            className="col-span-4"
            label="انتخاب نقش"
            onChange={(value: any) => {
              if (value?.roleId != undefined) {
                setState({
                  selectedRole: value,
                  selectedRoleError: false,
                });
              } else if (value == '') {
                setState({
                  selectedRole: null,
                });
              }
              getRoleData(value);
            }}
            value={selectedRole}
            required
            error={selectedRoleError}
            data={roleData}
            showKey="roleTitle"
          />
        </div>
        {accessRoleData != undefined && (
          <>
            <div className=" col-span-12 mt-10">
              <span className="font-bold">لیست دسترسی ها</span>
            </div>
            <div className="col-span-12 mt-6">
              <TreeCheckBox
                data={accessRoleData}
                initialCheckedKeys={initialCheckedKeys}
                checkedKeysProps={(item: any) =>
                  setState({ checkedItems: item })
                }
              />
            </div>
            <div className="col-span-12 flex justify-end my-6 mx-6">
              <Button
                className="border border-blue text-white bg-blue w-[100px] mr-4"
                onClick={saveParameter}
              >
                ثبت
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default withAlert(ManageRole);
