import React from 'react';
import { Button, TextField, Icon, AntdSelectSearch, SelectMultiple } from '@tse/components/atoms';
import { Table } from '@tse/components/organism';
import { useStates, useEffect } from '@tse/utils';
import './style.scss';
import { HeaderTypes } from '@tse/types';
import { Popconfirm } from 'antd';
import { DatePicker } from '@tse/components/molecules';
import {
  getUserList,
  saveInsideryUser,
  getUsersInfo,
  removeUser,
  changeUserStatus,
} from 'apps/cash-market/src/Controller/Insidery/InsideryInfo';
import withAlert from 'apps/cash-market/src/hoc/withAlert';
import { convertDateToJalali } from '@tse/tools';
import {
  getCompanyInfo,
  getCompanyList,
  getCompanyRegistrationTypes,
  getPatientInfo,
  getPatientList,
  saveCompany,
  savePatient,
} from 'apps/cash-market/src/Controller/Healan';
import NewSelect from 'apps/cash-market/src/components/atoms/NewSelect';
import { ListingUploadLogo } from 'apps/cash-market/src/components/ListingLogoUpload';

const Company = ({ onAlert }: any) => {
  ///////////Start initial///////

  const initialState = {
    companies: [],
    filter: '',
    pageNumber: 1,
    lang: 'Fa',
    companyId: null,
    companyName: '',
    parentCompanyRef: null,
    latinCompanyName: '',
    establishmentDate: null,
    companyRegistrationTypeData:[],
    activitySubject: '',
    companyRegistrationTypeId: null,
    nationalId: '',
    webSite: '',
    address: '',
    operationDate: null,
    registrationNumber: '',
    registrationDate: null,
    email: '',
    landline: '',
    prefixNumber: '',
    attachmentLogo: null,
    childsRefCompanies: null,
    companyParentData: [],
    companyChildData: [],
  };
  const PageSize = 10;

  const [state, setState] = useStates<any>(initialState);
  const {
    companies,
    filter,
    pageNumber,
    lang,
    companyId,
    companyName,
    parentCompanyRef,
    latinCompanyName,
    establishmentDate,
    companyRegistrationTypeData,
    activitySubject,
    companyRegistrationTypeId,
    nationalId,
    webSite,
    address,
    operationDate,
    registrationNumber,
    registrationDate,
    email,
    landline,
    prefixNumber,
    attachmentLogo,
    childsRefCompanies,
    companyParentData,
    companyChildData
  } = state;

  const setErrorMessage = (key: string) => {
    const errorMessage = ' ';
    setState({ [`${key}Error`]: errorMessage });
  };

  useEffect(() => {
    handelGetCompanyRegistrationTypes();
    handleGetCompanyList('', 1, 'All');
 
  }, []);

  ///////////End initial////////

  ///////////Start setup////////

  const onFail = (error: any) => {
    onAlert(error);
  };

  const onSuccessSave = (res: any) => {
    setState({
      companies: [],
      filter: '',
      pageNumber: 1,
      lang: 'Fa',
      companyId: null,
      companyName: '',
      parentCompanyRef: null,
      latinCompanyName: '',
      establishmentDate: null,
      activitySubject: '',
      companyRegistrationTypeId: null,
      nationalId: '',
      webSite: '',
      address: '',
      operationDate: null,
      registrationNumber: '',
      registrationDate: null,
      email: '',
      landline: '',
      prefixNumber: '',
      attachmentLogo: null,
      childsRefCompanies: null,
    });
 
    handleGetCompanyList('', 1, 'All');
    onAlert({
      type: 'success',
      message: 'اطلاعات با موفقیت ثبت گردید',
    });
  };

  const onChangeFilterText = (filter: string) => {
    handleGetCompanyList(filter, 1, 'companyListData');
  };
  const onChangeTablePage = (pageNo: number) => {
    handleGetCompanyList(filter, pageNo, 'companyListData');
    setState({ pageNumber: pageNo });
  };
 
  const onEditClick = (record: any) => {
    const data = { companyId: record?.companyId };
    handleGetCompanyInfo(data);
  };

  const onEditUser = (userInfoList: any) => {
    console.log('userInfoList', userInfoList);
    setState({
      companyId:userInfoList.companyId,
      companyName:userInfoList.companyName,
      parentCompanyRef:userInfoList.parentCompanyRef,
      latinCompanyName:userInfoList.latinCompanyName,
      establishmentDate:userInfoList.establishmentDate,
      activitySubject:userInfoList.activitySubject,
      companyRegistrationTypeId:userInfoList.companyRegistrationTypeId,
      nationalId:userInfoList.nationalId,
      webSite:userInfoList.webSite,
      address:userInfoList.address,
      operationDate:userInfoList.operationDate,
      registrationNumber:userInfoList.registrationNumber,
      registrationDate:userInfoList.registrationDate,
      email:userInfoList.email,
      landline:userInfoList.landline,
      prefixNumber:userInfoList.prefixNumber,
      attachmentLogo:userInfoList.attachmentLogo,
      childsRefCompanies:userInfoList.childsRefCompanies,
    });
  };

  const onSubmit = () => {
    if (companyName && companyRegistrationTypeId && landline && prefixNumber) {
      const data = { 
        companyId: companyId == null || companyId == 0 ? null : companyId,
        companyName,
        parentCompanyRef,
        latinCompanyName,
        establishmentDate,
        activitySubject,
        companyRegistrationTypeId,
        nationalId,
        webSite,
        address,
        operationDate,
        registrationNumber,
        registrationDate,
        email,
        landline,
        prefixNumber,
        attachmentLogo,
        childsRefCompanies,
      };

      saveCompany({ data, onSuccess: onSuccessSave, onFail });
    } else {
      !companyName && setErrorMessage('companyName');
      !companyRegistrationTypeId && setErrorMessage('companyRegistrationTypeId');
      !landline && setErrorMessage('landline');
      !prefixNumber && setErrorMessage('prefixNumber');
    }

    handleGetCompanyList('', 1,'all');
  };

  const tableHeader: HeaderTypes[] = [
    {
      title: 'نام',
      dataIndex: 'companyName',
      key: 'companyName',
      className: 'col-span-2',
    },
    {
      title: 'نام انگلیسی',
      dataIndex: 'latinCompanyName',
      key: 'latinCompanyName',
      className: 'col-span-2',
    },
    {
      title: 'تاریخ‌تاسیس',
      dataIndex: 'establishmentDate',
      key: 'establishmentDate',
      className: 'col-span-2',
    },
    {
      title: 'نوع شرکت',
      dataIndex: 'companyRegistrationTypeId',
      key: 'companyRegistrationTypeId',
      className: 'col-span-2',
    },
    {
      title: 'شماره تماس',
      dataIndex: 'landline',
      key: 'landline',
      className: 'col-span-1',
      render: (item: any) => <span>{prefixNumber}{landline}</span>,
    },
    {
      title: 'ویرایش',
      dataIndex: 'edit',
      key: 'edit',
      className: 'col-span-1',
      render: (item: any, record: any) => {
        return (
          <Icon
            name="icon-edit"
            classname="text-listingTertiaryColor text-lg cursor-pointer"
            onClick={() => onEditClick(record)}
          />
        );
      },
    },
    {
      title: 'حذف',
      key: 'delete',
      className: 'col-span-1',
      render: (item: any, record: any) => (
        <Popconfirm
          title="آیا مطمئن هستید؟"
          okText="بله"
          cancelText="خیر"
          onConfirm={() => handleRemoveUser(record)}
        >
          <Icon name="icon-delete" classname="text-red cursor-pointer" />
        </Popconfirm>
      ),
    },
  ];

  ///////////End setup/////////

  ///////////Start API////////

  // const handlegetCompanies = (text?: string, pageNo?: number) => {
  //   getCompanyList({
  //     data: {
  //       Filter: text,
  //       PageNumber: pageNo,
  //       PageSize,
  //       lang,
  //     },
  //     onSuccess: (res: any) => setState({ users: res }),
  //     onFail,
  //   });
  // };

    const handleGetCompanyList = (
      text?: string,
      pageNo?: number,
      componentState?: string
    ) => {
      getCompanyList({
        data: {
          FilterText: text,
          PageNumber: pageNo,
          PageSize,
        },
        onSuccess: (res: any) => {
          console.log(res,componentState)
          if (componentState === 'All') {
            setState({
              companyListData: res,
              companyParentData: res,
              companyChildData: res,
              companies:res
            });
          } else {
            setState({ [`${componentState}`]: res });
          }
        },
        onFail,
      });
    };

 

  const handelChangeUserStatus = (record: any) => {
    const data = {
      companyId: record?.companyId,
    };

    changeUserStatus({
      data,
      onSuccess: () => handleGetCompanyList('', 1),
      onFail,
    });
  };
  const handleRemoveUser = (record: any) => {
    removeUser({
      data: record,
      onSuccess: () => handleGetCompanyList('', 1),
      onFail,
    });
  };

  const handleGetCompanyInfo = (data: any) => {
    getCompanyInfo({
      data,
      onSuccess: (res: any) => {
        onEditUser(res);
      },
      onFail,
    });
  };

    const handelGetCompanyRegistrationTypes = () => {
      getCompanyRegistrationTypes({
        onSuccess: (res: any) => setState({ companyRegistrationTypeData: res }),
        onFail,
      });
    };

  ////////////End API////////

  return (
    <>
      <div className="shadow-[0_0_15px_-10px_rgba(0,0,0,0.75)] rounded-[10px] p-[30px] bg-white min-h-[100px] flex flex-wrap gap-6">



        <div className="InsideryDateTextField w-80">
          <TextField
            label="نام"
            className=""
            required
            value={companyName}
            onChange={(value: any) =>
              setState({
                companyName: value,
                companyNameError: '',
              })
            }
            errorMessage={state?.companyNameError}
            // type="number"
          />
        </div>



        <div className="InsideryDateTextField w-80">
          <TextField
            label="نام انگلیسی"
            className=""
            value={latinCompanyName}
            onChange={(value: any) =>
              setState({
                latinCompanyName: value,
                latinCompanyNameError: '',
              })
            }
            errorMessage={state?.latinCompanyNameError}
            // type="number"
          />
        </div>

        <div className="InsideryDateTextField w-80">
          <TextField
            label="فعالیت شرکت"
            className=""
            value={activitySubject}
            onChange={(value: any) =>
              setState({
                activitySubject: value,
                activitySubjectError: '',
              })
            }
            errorMessage={state?.activitySubjectError}
            // type="number"
          />
        </div>

        <div className="InsideryDateTextField w-80">
                  <NewSelect
                    label="نوع شرکت"
                    className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
                    options={[
                      {
                        companyRegistrationTypeName: '',
                        companyRegistrationTypeId: '',
                      },
                      ...companyRegistrationTypeData,
                    ]}
                    onChange={(value: any) =>
                      setState({
                        companyRegistrationTypeId: value,
                        companyRegistrationTypeError: false,
                      })
                    }
                    showKey="companyRegistrationTypeName"
                    selectedKey="companyRegistrationTypeId"
                    value={companyRegistrationTypeId}
                    errorMessage={state?.companyRegistrationTypeError}
                    required={true}
                  />
     </div>


        <div className="InsideryDateTextField w-80">
          <TextField
            label="کد‌ملی شرکت"
            className=""
            value={nationalId}
            onChange={(value: any) =>
              setState({
                nationalId: value,
                nationalIdError: '',
              })
            }
            errorMessage={state?.nationalIdError}
            // type="number"
          />
        </div>
        <div className="InsideryDateTextField w-80">
          <TextField
            label="وب سایت"
            className=""
            value={webSite}
            onChange={(value: any) =>
              setState({
                webSite: value,
                webSiteError: '',
              })
            }
            errorMessage={state?.webSiteError}
            // type="number"
          />
        </div>

        <div className="InsideryDateTextField w-80">
          <TextField
            label="آدرس"
            className=""
            value={address}
            onChange={(value: any) =>
              setState({
                address: value,
                addressError: '',
              })
            }
            errorMessage={state?.addressError}
            // type="number"
          />
        </div>


        <div className="InsideryDateTextField w-80">
          <TextField
            label="ایمیل"
            className=""
            value={email}
            onChange={(value: any) =>
              setState({
                email: value,
                emailError: '',
              })
            }
            // type="number"
          />
        </div>

        <div className="InsideryDateTextField w-80">
          <TextField
            label="پیش‌شماره"
            className=""
            value={prefixNumber}
            onChange={(value: any) =>
              setState({
                prefixNumber: value
              })
            }
             type="number"
          />
        </div>

        <div className="InsideryDateTextField w-80">
          <TextField
            label="تلفن‌ثابت"
            className=""
            value={landline}
            onChange={(value: any) =>
              setState({
                landline: value
              })
            }
             type="number"
          />
        </div>

        <div className="InsideryDateTextField w-80">
          <TextField
            label="شماره ثبت"
            className=""
            value={registrationNumber}
            onChange={(value: any) =>
              setState({
                registrationNumber: value,
                registrationNumberError: '',
              })
            }
            // type="number"
          />
        </div>

        <div className="InsideryDatePicker w-80">
          <DatePicker
            error={state?.establishmentDateError}
            label=" تاریخ تاسیس"
            value={establishmentDate}
            onChange={(value: any) =>
              setState({
                establishmentDate: value,
                establishmentDateError: '',
              })
            }
          />
        </div>



        <div className="InsideryDatePicker w-80">
          <DatePicker
            error={state?.registrationDateError}
            label="تاریخ ثبت"
            value={registrationDate}
            onChange={(value: any) =>
              setState({
                registrationDate: value,
                registrationDateError: '',
              })
            }
          />
        </div>


        <div className="InsideryDatePicker w-80">
          <DatePicker
            error={state?.operationDateError}
            label="تاریخ بهره‌برداری"
            value={operationDate}
            onChange={(value: any) =>
              setState({
                operationDate: value,
                operationDateError: '',
              })
            }
          />
        </div>


        <div className="InsideryDatePicker w-80">
                  <AntdSelectSearch
                    className="2xl:col-span-8 xl:col-span-8 lg:col-span-12 md:col-span-12  col-span-4"
                    label="شرکت مادر"
                    onChange={(value: any) => {
                      if (value?.companyName !== undefined) {
                        setState({
                          parentCompanyRef: value,
                        });
                      } else if (value == '') {
                        setState({
                          parentCompanyRef: null,
                        });
                      }
                      handleGetCompanyList(value, 1, 'companyParentData');
                    }}
                    value={parentCompanyRef}
                    data={companyParentData?.items}
                    showKey="companyName"
                    idKey="companyId"
                  />
                </div>
      
                <div className="InsideryDatePicker w-80">
                  <div className="2xl:col-span-8 xl:col-span-8 lg:col-span-12 md:col-span-12  col-span-8">
                    <SelectMultiple
                      placeholder="شرکت زیرمجموعه"
                      options={companyChildData?.items}
                      value={childsRefCompanies}
                      limit={10}
                      onChange={(value: any) => {
                        setState({
                          childsRefCompanies: value,
                        });
                      }}
                      onSearch={(value: any) =>
                        handleGetCompanyList(value, 1, 'companyChildData')
                      }
                      showKey="companyName"
                      selectedKey="companyId"
                    />
                  </div>
                </div>

                <div className="col-span-12 ">
                  <ListingUploadLogo
                    fileData={(data: any) =>
                      data?.fileId
                        ? setState({ attachmentLogo: data })
                        : setState({ attachmentLogo: '' })
                    }
                    withHeader
                    onChangeFromParent={attachmentLogo}
                    onAlert
                  />
                </div>
                
        <div className="flex justify-end w-full">
          <Button
            className="bg-blue text-white w-[130px] h-[40px] ml-9"
            onClick={onSubmit}
          >
            افزودن
          </Button>
        </div>
      </div>
      <div className="shadow-[0_0_15px_-10px_rgba(0,0,0,0.75)] rounded-[20px] mt-[10px] p-[20px] bg-white min-h-[500px]">
        <div className="mt-6 mb-6 w-80">
          <TextField
            label="جستجو"
            className="2xl:col-span-3 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            value={filter}
            onChange={(value: any) => {
              onChangeFilterText(value);
              setState({
                filter: value,
              });
            }}
          />
        </div>
        <Table
          columns={tableHeader}
          className="col-span-12 grid grid-cols-12 "
          data={companies?.items}
          onChangePage={onChangeTablePage}
          totalPages={companies?.totalPages}
          pageSize={PageSize}
          pageNumber={pageNumber}
        />
      </div>
    </>
  );
};

export default withAlert(Company);
