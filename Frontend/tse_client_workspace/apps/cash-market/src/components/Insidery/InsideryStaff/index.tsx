import React from 'react';
import './InsideryStaff.scss';
import { Button, TextField, SelectMultiple } from '@tse/components/atoms';
import { DatePicker } from '@tse/components/molecules';
import { useStates, useEffect, useNavigate } from '@tse/utils';
import { Radio } from 'antd';
import {
  getStaff,
  getstaffFamilyList,
  saveInsideryStaff,
} from 'apps/cash-market/src/Controller/Insidery/InsideryInfo';
import { convertDateToJalali } from '@tse/tools';

export default function InsideryStaff({ onAlert, onNext }: any) {
  ///////////Start initial///////

  const initialState = {
    userName: '',
    nationalIdentifier: '',
    firstName: '',
    lastName: '',
    positionTitle: '',
    personnelCode: '',
    originInfo: '',
    startDate: null,
    isMarried: 0,
    staffFamily: [],
    staffFamilyError: '',
    staffFamilyList: [],
    dependentsId: [],
  };
  const PageSize = 6;
  const [state, setState] = useStates<any>(initialState);
  const {
    userName,
    nationalIdentifier,
    firstName,
    lastName,
    positionTitle,
    personnelCode,
    originInfo,
    startDate,
    isMarried,
    staffFamily,
    staffFamilyError,
    staffFamilyList,
    dependentsId,
  } = state;

  const setErrorMessage = (key: string) => {
    const errorMessage = ' ';
    setState({ [`${key}Error`]: errorMessage });
  };

  const isMarriedData = [
    {
      id: 1,
      title: 'بله',
    },
    {
      id: 0,
      title: 'خیر',
    },
  ];

  useEffect(() => {
    handleGetStaff();
    handelFamilyList();
  }, []);

  ///////////End initial////////

  ///////////Start setup////////

  const onSuccessSave = () => {
    onAlert({ message: 'عملیات با موفقیت انجام شد', type: 'success' });
    setState({
      userName: '',
      nationalIdentifier: '',
      firstName: '',
      lastName: '',
      positionTitle: '',
      personnelCode: '',
      originInfo: '',
      startDate: '',
      isMarried: 0,
      staffFamily: [],
    });
    onNext();
  };

  const onFail = (error: any) => {
    onAlert(error);
  };

  const onCheckStaffFamily = (selected: any) => {
    if (isMarried) {
      if (!selected.includes(1)) selected = [1, ...selected];
      if (selected.includes(9))
        selected = selected.filter((item: number) => item !== 9);
      setState({
        staffFamily: selected,
        staffFamilyError: selected.length > 0 ? '' : 'staffFamilyError',
      });
    } else {
      if (selected.includes(1))
        selected = selected.filter((item: number) => item !== 1);
      if (selected.includes(9)) selected = 9;
      setState({
        staffFamily: selected,
        staffFamilyError: selected.length > 0 ? '' : 'staffFamilyError',
      });
    }
  };

  const onChangeIsMarried = (e: any) => {
    const isMarried = e.target.value;
    setState({ isMarried: isMarried });
    if (isMarried == 1) setState({ staffFamily: [1] });

    if (isMarried == 0) setState({ staffFamily: [9] });
  };

  const onSubmit = () => {
    if (
      userName &&
      nationalIdentifier &&
      firstName &&
      lastName &&
      positionTitle &&
      staffFamily.length > 0
    ) {
      const data = {
        nationalIdentifier,
        personnelCode: personnelCode == '' ? null : personnelCode,
        originInfo: originInfo == '' ? null : originInfo,
        startDate: startDate == '' ? null : startDate,
        isMarried: isMarried == 0 ? false : true,
        dependentsId: staffFamily,
      };
      saveInsideryStaff({ data, onSuccess: onSuccessSave, onFail });
    } else {
      !userName && setErrorMessage('userName');
      !nationalIdentifier && setErrorMessage('nationalIdentifier');
      !firstName && setErrorMessage('firstName');
      !lastName && setErrorMessage('lastName');
      !positionTitle && setErrorMessage('positionTitle');
      !isMarried && setErrorMessage('isMarried');
      staffFamily.length == 0 && setErrorMessage('staffFamily');
    }
  };

  ///////////End setup/////////

  ///////////Start API////////

  const handleGetStaff = () => {
    getStaff({
      onSuccess: (res: any) => {
        setState({
          userId: res.userId == null ? null : res.userId,
          userName: res.userName,
          nationalIdentifier: res.nationalIdentifier,
          firstName: res.firstName,
          lastName: res.lastName,
          positionTitle: res.positionTitle,
          personnelCode: res.personnelCode == null ? '' : res.personnelCode,
          originInfo: res.originInfo == null ? '' : res.originInfo,
          startDate: res.startDate == null ? '' : res.startDate,
          isMarried: res.isMarried == true ? 1 : 0,
          staffFamily:
            res.dependents.length == 0 && res.isMarried == true
              ? [1]
              : res.dependents.length == 0 &&
                (res.isMarried == false || res.isMarried == null)
              ? [9]
              : res.dependents.map((item: any) => item.id),
        });
      },
      onFail,
    });
  };

  const handelFamilyList = () => {
    getstaffFamilyList({
      onSuccess: (res: any) => {
        const data = res.map((item: any) => ({
          value: item.id,
          name: item.title,
        }));
        setState({ staffFamilyList: data });
      },
      onFail,
    });
  };

  ////////////End API////////

  return (
    <div className="InsideryStaffContainer">
      <div className="InsideryStaffForm">
        <div className="InsideryStaffFormItem">
          <TextField
            label="شماره موبایل"
            className="bg-[#f7f7f7]"
            value={userName}
            onChange={(value: any) =>
              setState({
                userName: value,
                userNameError: '',
              })
            }
            required
            readOnly
            errorMessage={state?.userNameError}
            // type="number"
          />

          <TextField
            label="کدملی"
            className="bg-[#f7f7f7]"
            value={nationalIdentifier}
            onChange={(value: any) =>
              setState({
                nationalIdentifier: value,
                nationalIdentifierError: '',
              })
            }
            required
            errorMessage={state?.nationalIdentifierError}
            // type="number"
          />
        </div>

        <div className="InsideryStaffFormItem">
          <TextField
            label="نام"
            className="bg-[#f7f7f7]"
            value={firstName}
            onChange={(value: any) =>
              setState({
                firstName: value,
                firstNameError: '',
              })
            }
            required
            readOnly
            errorMessage={state?.firstNameError}
            // type="number"
          />

          <TextField
            label="نام خانوادگی"
            className="bg-[#f7f7f7]"
            value={lastName}
            onChange={(value: any) =>
              setState({
                lastName: value,
                lastNameError: '',
              })
            }
            required
            readOnly
            errorMessage={state?.lastNameError}
            // type="number"
          />
        </div>

        <div className="InsideryStaffFormItem">
          <TextField
            label="سمت"
            className="bg-[#f7f7f7]"
            value={positionTitle}
            onChange={(value: any) =>
              setState({
                positionTitle: value,
                positionTitleError: '',
              })
            }
            required
            readOnly
            errorMessage={state?.positionTitleError}
            // type="number"
          />

          <TextField
            label="کد پرسنلی"
            className="bg-[#f7f7f7]"
            value={personnelCode}
            readOnly
            onChange={(value: any) =>
              setState({
                personnelCode: value,
                personnelCodeError: '',
              })
            }
            errorMessage={state?.personnelCodeError}
            // type="number"
          />
        </div>

        <div className="InsideryStaffFormItem4">
          <div className="InsideryDateTextField">
            <TextField
              label="نام پدر"
              className="bg-[#f7f7f7]"
              value={originInfo}
              readOnly
              onChange={(value: any) =>
                setState({
                  originInfo: value,
                  originInfoError: '',
                })
              }

              // type="number"
            />
          </div>

          <div className="InsideryDatePicker">
          <TextField
          label=" تاریخ تولد "
              className="bg-[#f7f7f7]"
              value={convertDateToJalali(startDate)}
              readOnly
              onChange={(value: any) =>
                setState({
                  startDate: value,
                  startDateError: '',
                })
              }

              // type="number"
            />
 
          </div>
        </div>

        <div className="InsideryStaffFormItem5">
          <div>
            <span className="text-extratiny">آبا متاهل هستید؟ *</span>
            <Radio.Group
              // onChange={(e) => setState({ isMarried: e.target.value })}
              onChange={(e) => onChangeIsMarried(e)}
              value={isMarried}
              style={{ marginBottom: 10, width: '100%' }}
            >
              {isMarriedData.map((item: any) => (
                <Radio className="text-extratiny" value={item.id}>
                  {item.title}
                </Radio>
              ))}
            </Radio.Group>
          </div>
        </div>

        <div className="InsideryStaffFormItemSelectMultiple">
          <SelectMultiple
            placeholder="کدام یک از افراد ذیل تحت تکفل یا ولایت خود را دارید؟"
            options={staffFamilyList}
            onChange={(value: any) => onCheckStaffFamily(value)}
            value={staffFamily}
            limit={9}
            required
            errorMessage={state?.staffFamilyError}
          />
        </div>
      </div>

      <div className="col-span-4 flex justify-end mt-5 ml-15 items-center">
        <Button
          className="bg-[#B18F47] text-white w-[150px] h-[50px] ml-9"
          onClick={onSubmit}
        >
          ادامه
        </Button>
      </div>
    </div>
  );
}
