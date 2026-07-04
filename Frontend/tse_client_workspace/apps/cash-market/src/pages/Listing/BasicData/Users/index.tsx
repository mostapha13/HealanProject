import withAlert from 'apps/cash-market/src/hoc/withAlert';
import {
  useStates,
  useEffect,
  useState,
  useNavigate,
  useSearchParams,
} from '@tse/utils';
import {
  Icon,
  NewSelectSearch,
  TextField,
  SelectMultiple,
  Upload,
  Image,
  Collapse,
  Button,
  AntdSelectSearch,
} from '@tse/components/atoms';
import { ListingSubmitButton } from 'apps/cash-market/src/components/atoms/ListingSubmitButton';
import { Table } from '@tse/components/organism';
import { HeaderTypes } from '@tse/types';
import FindInPageOutlinedIcon from '@mui/icons-material/FindInPageOutlined';
import { getRole } from 'apps/cash-market/src/Controller/Identity';
import { getUserInfo, uploadFile } from 'apps/cash-market/src/Controller';
import { ListingCreateButton } from 'apps/cash-market/src/components/atoms/ListingCreateButton';
import {
  getUsers,
  getUsersInfo,
  saveUsers,
  getCompanyList,
} from 'apps/cash-market/src/Controller/Listing/BasicData';
import { ListingUploadLogo } from 'apps/cash-market/src/components/ListingLogoUpload';
import { Popconfirm } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import {
  deSeparator,
  downloadFile,
  generateRandomNumber,
  generateGuid,
} from '@tse/tools';
import { downloadFileApi } from 'apps/cash-market/src/Controller';
import NewSelect from 'apps/cash-market/src/components/atoms/NewSelect';

const initialState = {
  firstName: '',
  lastName: '',
  userName: '',
  personnelNumber: '',
  phoneNumber: '',
  attachmentRef: '',
  companyRegistrationType: [],
  nationalId: '',
  webSite: '',
  email: '',
  landline: '',
  prefixNumber: '',
  address: '',
  creator: '',
  modifier: '',
  creationDate: '',
  modificationDate: '',
  companyName: '',
  roleData: [],
  selectedRole: [],
  selectedRoleError: false,
  docFile: {},
  users: [],
  extensionCompanyPhoneNumber: '',
  logoAttactment: '',
  companyList: [],
  selectedCompany: null,
  firstNameError: false,
  lastNameError: false,
  phoneNumberError: false,
  roleDataError: false,
  fixedPhoneNumber: '',
  userId: null,
  filterText: '',
  userInfoList: [],
  userAttachmentTitle: '',
  userAttachmentFile: null,
  userAttachments: [],
  pageNumber: 1,
  selectedUserStatus: '',
};

function ListingUsers({ onAlert }: any) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useStates<any>(initialState);
  const admissionUserId =
    searchParams.get('id') != null ? searchParams.get('id') : null;

  const PageSize = 10;
  const {
    firstName,
    firstNameError,
    lastNameError,
    phoneNumberError,
    roleDataError,
    lastName,
    personnelNumber,
    phoneNumber,
    floor,
    companyName,
    roleData,
    selectedRole,
    selectedRoleError,
    docFile,
    users,
    extensionCompanyPhoneNumber,
    logoAttactment,
    companyList,
    selectedCompany,
    prefixNumber,
    landline,
    fixedPhoneNumber,
    userId,
    filterText,
    userAttachmentTitle,
    userAttachmentFile,
    userAttachments,
    pageNumber,
    selectedUserStatus,
  } = state;

  const userStatus = [
    { id: 'notActive', title: 'غیرفعال' },
    { id: 'active', title: 'فعال' },
  ];

  useEffect(() => {
    getRoleData('');
    handlegetUsers('', 1);
    handleGetCompanyList();
  }, []);

  useEffect(() => {
    if (admissionUserId != null) {
      const data = { userId: admissionUserId ? admissionUserId : null };
      handleGetUserInfo(data);
    }
  }, [admissionUserId]);

  const handleGetCompanyList = () => {
    const data = { PageNumber: 1, PageSize: 20 };
    getCompanyList({
      data,
      onSuccess: (res: any) => setState({ companyList: res }),
      onFail,
    });
  };

  const handlegetUsers = (text?: string, pageNo?: number) => {
    getUsers({
      data: {
        FilterText: text,
        PageNumber: pageNo,
        PageSize,
      },
      onSuccess: (res: any) => setState({ users: res }),
      onFail,
    });
  };

  const setErrorMessage = (key: string) => {
    const errorMessage = true;
    setState({ [`${key}Error`]: errorMessage });
  };

  const onSuccessSaveUser = (res: any) => {
    setState({
      userId: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      prefixNumber: '',
      landline: '',
      personnelNumber: '',
      logoAttactment: '',
      extensionCompanyPhoneNumber: '',
      selectedRole: [],
      fixedPhoneNumber: '',
      pageNumber: 1,
    });
    handlegetUsers('', 1);
    onAlert({
      type: 'success',
      message: 'اطلاعات با موفقیت ثبت گردید',
    });
  };

  const handleRegisterUsers = () => {
    const roles = selectedRole.map((item: any) => ({
      name: item,
      displayName: item,
    }));
    if (firstName && lastName && phoneNumber && selectedRole?.length != 0) {
      const rawData = {
        userId: userId ? userId : null,
        // identityUserId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        firstName,
        lastName,
        phoneNumber,
        prefixNumber,
        companyId: selectedCompany?.companyId,
        personnelNumber,
        userRoles: roles,
        extensionCompanyPhoneNumber,
        userAttachments,
        attachment: logoAttactment,
        landline,
        isActive: selectedUserStatus == 'active' ? true : false,
        // industryId: 0,
      };
      const data = Object.fromEntries(
        Object.entries(rawData)?.filter(
          ([key, value]) => value !== '' && value !== null
        )
      );

      saveUsers({
        data,
        onSuccess: (res: any) => onSuccessSaveUser(res),
        onFail,
      });

      handlegetUsers('', 1);
    } else {
      !firstName && setErrorMessage('firstName');
      !lastName && setErrorMessage('lastName');
      !phoneNumber && setErrorMessage('phoneNumber');
      selectedRole?.length == 0 && setErrorMessage('selectedRole');
    }
  };

  const onShowUserDetail = (record: any): void => {
    navigate(`users-profile?id=${record.userId}`);
  };

  const onRemoveCompanyAttachments = (item: any) => {
    const newArrayData = userAttachments?.filter(
      (file: any) => item?.tableId != file?.tableId
    );
    setState({ userAttachments: newArrayData });
  };

  const tableHeader: HeaderTypes[] = [
    {
      title: 'نام',
      dataIndex: 'firstName',
      key: 'firstName',
      className: 'col-span-2',
    },
    {
      title: 'نام خانوادگی',
      dataIndex: 'lastName',
      key: 'lastName',
      className: 'col-span-2',
    },
    {
      title: 'نقش سازمانی',
      dataIndex: 'userRoles',
      key: 'userRoles',
      className: 'col-span-2',
      // render: (item: any) => {
      //   console.log('item new', item);
      // },
    },
    // {
    //   title: 'نام کاربری',
    //   dataIndex: 'userName',
    //   key: 'userName',
    //   className: 'col-span-1',
    // },
    {
      title: 'شماره تماس',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
      className: 'col-span-2',
    },
    {
      title: 'وضعیت',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
      className: 'col-span-1',
      render: (item: any) => {
        return <span>{item == true ? 'فعال' : 'غیرفعال'}</span>;
      },
    },
    {
      title: 'جزئیات',
      dataIndex: 'userId',
      key: 'userId',
      className: 'col-span-1',
      render: (item: any) => {
        return (
          <a href={`/listing-basicdata/users-profile?id=${item}`}>
            <FindInPageOutlinedIcon className="text-listingTertiaryColor " />
          </a>
        );
      },
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
  ];

  const licenseTableHeader: HeaderTypes[] = [
    {
      title: 'موضوع مدرک',
      dataIndex: 'subject',
      key: 'subject',
      className: 'col-span-5',
    },
    {
      title: 'فایل مجوز',
      dataIndex: 'attachment',
      key: 'attachment',
      className: 'col-span-5',
      render: (item: any) => (
        <DownloadOutlined
          onClick={() => handleDownloadAttachment(item)}
          className="text-xl !text-black "
        />
      ),
    },
    {
      title: 'عملیات',
      dataIndex: 'action',
      key: 'action',
      className: 'col-span-1 !justify-center',
      render: (_: any, item: any) => (
        <div className="flex flex-row items-center justify-center">
          <Popconfirm
            title="آیا اطمینان دارید؟"
            okText="بله"
            cancelText="خیر"
            onConfirm={() => onRemoveCompanyAttachments(item)}
          >
            <Icon
              name="icon-delete"
              classname="text-red text-lg cursor-pointer"
            />
          </Popconfirm>
        </div>
      ),
    },
  ];
  const handleDownloadAttachment = (data: any) => {
    downloadFileApi({
      data: data?.fileId,
      onSuccess: (res: any) => downloadExportDoc(res, data?.fileName),
      onFail: (err: any) => console.log('onFail', err),
    });
  };
  const downloadExportDoc = (data: any, name: any) => {
    if (data != null) {
      downloadFile(data, name);
    }
  };

  const onEditClick = (record: any) => {
    const data = { userId: record?.userId };
    handleGetUserInfo(data);
  };

  const handleGetUserInfo = (data: any) => {
    getUsersInfo({
      data,
      onSuccess: (res: any) => onHandleEditUser(res),
      onFail,
    });
  };

  const onHandleEditUser = (userInfoList: any) => {
    const roles = userInfoList?.userRoles?.map((item: any) => item?.name);

    setState({
      userId: userInfoList?.userId,
      firstName: userInfoList?.firstName,
      lastName: userInfoList?.lastName,
      phoneNumber: userInfoList?.phoneNumber,
      prefixNumber: userInfoList?.prefixNumber,
      landline: userInfoList?.landline,
      selectedCompany: {
        companyId: userInfoList?.company?.companyId,
        companyName: userInfoList?.company?.companyName,
      },
      personnelNumber: userInfoList?.personnelNumber,
      selectedRole: roles,
      logoAttactment: userInfoList?.attachment,
      extensionCompanyPhoneNumber: userInfoList?.extensionCompanyPhoneNumber,
      fixedPhoneNumber:
        fixedPhoneNumber != ''
          ? userInfoList?.phoneNumber
            ? String(userInfoList?.prefixNumber) +
              '-' +
              String(userInfoList?.landline)
            : ''
          : '',
      userAttachments: userInfoList?.userAttachments,
      selectedUserStatus:
        userInfoList?.isActive == true ? 'active' : 'notActive',
    });
  };

  const onFail = (error: any) => {
    onAlert(error);
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

  const onChangeFile = (file: any) => {
    console.log('file', file);

    uploadFile({
      data: file.target.files[0],
      onSuccess: (res: any) => setState({ docFile: res }),
      onFail,
    });
  };
  const onRemoveFile = () => {
    setState({
      docFile: {},
    });
  };
  const onChangeFilterText = (filterText: string) => {
    handlegetUsers(filterText, 1);
  };

  const onChangeTablePage = (pageNo: number) => {
    handlegetUsers(filterText, pageNo);
    setState({ pageNumber: pageNo });
  };

  const onChangeUserAttachmentFile = (e: any) => {
    console.log('e', e);

    uploadFile({
      data: e.target.files[0],
      onSuccess: (res: any) => {
        setState({
          userAttachmentFile: res,
          userAttachmentFileError: false,
        });
      },
      onFail,
    });
  };
  const onRemoveUserAttachmentFile = () => {
    setState({
      userAttachmentFile: null,
    });
  };

  const onSubmitUserAttachments = () => {
    if (userAttachmentTitle && userAttachmentFile) {
      setState({
        userAttachments: [
          ...userAttachments,
          {
            tableId: generateGuid(),
            attachment: userAttachmentFile,
            subject: userAttachmentTitle,
          },
        ],
        userAttachmentFile: null,
        userAttachmentTitle: '',
      });
    } else {
      !userAttachmentTitle && setErrorMessage('userAttachmentTitle');
      !userAttachmentFile && setErrorMessage('userAttachmentFile');
    }
  };

  return (
    <>
      <div className="border-2 border-lightGray  grid grid-cols-12">
        <div className=" col-span-12 items-start flex border-b-2 border-lightGray">
          <span className=" p-2 font-bold">فرم ثبت نام کاربر جدید</span>
        </div>
        <div className="col-span-12 items-start   mx-4 mt-4 border-b border-listingTertiaryColor">
          <span className=" p-4  text-listingTertiaryColor ">
            مشخصات فردی :
          </span>
        </div>
        <div className="col-span-12 grid grid-cols-12 gap-4 m-4 mt-8">
          <TextField
            label="نام"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            value={firstName}
            onChange={(value: any) =>
              setState({
                firstName: value,
                firstNameError: false,
              })
            }
            required
            errorMessage={firstNameError}
          />
          <TextField
            label="نام خانوادگی"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            value={lastName}
            onChange={(value: any) =>
              setState({
                lastName: value,
                lastNameError: false,
              })
            }
            required
            errorMessage={lastNameError}
          />
          <TextField
            label="شماره تلفن همراه"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            value={deSeparator(phoneNumber)}
            onChange={(value: any) =>
              setState({
                phoneNumber: value,
                phoneNumberError: false,
              })
            }
            required
            errorMessage={phoneNumberError}
            maxLength={11}
            // type="number"
          />
          <TextField
            label="پیش شماره تلفن ثابت"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            value={prefixNumber}
            onChange={(value: any) =>
              setState({
                prefixNumber: value,
                prefixNumberError: '',
              })
            }
            errorMessage={state?.sellersNameError}
            maxLength={4}
          />

          <TextField
            label="شماره تلفن ثابت"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            value={deSeparator(landline)}
            onChange={(value: any) =>
              setState({
                landline: value,
                landLineError: '',
              })
            }
            errorMessage={state?.landlineError}
            maxLength={8}
            // type="number"
          />
          <NewSelect
            label="وضعیت کاربر"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            options={[
              {
                title: 'هیچکدام',
                id: null,
              },
              ...userStatus,
            ]}
            onChange={(value: any) => setState({ selectedUserStatus: value })}
            showKey="title"
            selectedKey="id"
            value={selectedUserStatus}
          />
        </div>

        <div className="col-span-12 flex justify-between mx-4 mt-8 border-b border-listingTertiaryColor">
          <span className=" p-4  text-listingTertiaryColor ">
            مشخصات شرکت استخدامی :
          </span>
          <a href={`/listing-basicdata/acceptance-companies`}>
            <ListingCreateButton className="p-4" buttonName="ثبت شرکت جدید" />
          </a>
        </div>
        <div className="col-span-12 grid grid-cols-12 gap-4 m-4 mt-8">
          <AntdSelectSearch
            className="col-span-4"
            label="نام شرکت یا نهاد"
            onChange={(value: any) => {
              if (value?.companyName !== undefined) {
                setState({
                  selectedCompany: value,
                  fixedPhoneNumber: value?.landline
                    ? String(value?.prefixNumber) +
                      '-' +
                      String(value?.landline)
                    : '',
                });
              } else if (value == '') {
                setState({
                  selectedCompany: null,
                });
              }
              handleGetCompanyList();
            }}
            value={selectedCompany}
            data={companyList?.items}
            showKey="companyName"
            idKey="companyId"
          />

          <TextField
            label="شماره پرسنلی"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6 col-span-4"
            value={personnelNumber}
            onChange={(value: any) =>
              setState({
                personnelNumber: value,
                personnelNumberError: '',
              })
            }
            errorMessage={state?.sellersNameError}
            type='number'
          />
          <div className="col-span-4">
            <SelectMultiple
              placeholder="نقش"
              options={roleData}
              value={selectedRole}
              limit={10}
              onChange={(value: any) => {
                setState({
                  selectedRole: value,
                  selectedRoleError: false,
                });
                getRoleData(value);
              }}
              required
              error={selectedRoleError}
              showKey="roleTitle"
              selectedKey="roleName"
            />
          </div>
          <TextField
            label="شماره داخلی"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            value={extensionCompanyPhoneNumber}
            onChange={(value: any) =>
              setState({
                extensionCompanyPhoneNumber: value,
                extensionCompanyPhoneNumberError: '',
              })
            }
            type='number'
          />
          <TextField
            label="شماره تلفن ثابت نهاد"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            readOnly
            // defaultValue={selectedCompany?.phoneNumber}
            value={fixedPhoneNumber}
          />
        </div>

        <div className="col-span-12 ">
          <ListingUploadLogo
            fileData={(data: any) =>
              data?.fileId
                ? setState({ logoAttactment: data })
                : setState({ logoAttactment: '' })
            }
            withHeader
            onChangeFromParent={logoAttactment}
          />
        </div>
        <div className="col-span-12 items-start mx-4 mt-8 border-b border-listingTertiaryColor">
          <span className=" p-4  text-listingTertiaryColor ">
            آپلود مجوزها :
          </span>
        </div>
        <div className="col-span-12 grid grid-cols-12 gap-4 m-4 mt-8">
          <TextField
            label="موضوع مدرک"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-12 col-span-4"
            value={userAttachmentTitle}
            onChange={(value: any) =>
              setState({
                userAttachmentTitle: value,
                userAttachmentTitleError: false,
              })
            }
            required
            errorMessage={state?.userAttachmentTitleError}
          />

          <div className=" 2xl:col-span-4 xl:col-span-6 lg:col-span-8 md:col-span-12 col-span-4 mt-1">
            <Upload
              onChange={(file: any) => onChangeUserAttachmentFile(file)}
              value={userAttachmentFile?.fileName}
              href={userAttachmentFile?.link}
              name="userAttachmentFile"
              onDelete={() => onRemoveUserAttachmentFile()}
              //error={state?.userAttachmentFileError}
            />
          </div>
          <div className=" 2xl:col-span-4 xl:col-span-2 lg:col-span-12 md:col-span-12  col-span-4 flex justify-end ">
            <ListingSubmitButton onClick={onSubmitUserAttachments} />
          </div>
          {userAttachments?.length > 0 && (
            <div className="col-span-12 my-4">
              <Table
                columns={licenseTableHeader}
                className="col-span-12 grid grid-cols-12 "
                data={userAttachments}
                // onChangePage={onChangeTablePage}
                totalPages={1}
                pageSize={100}
              />
            </div>
          )}
        </div>
        <div className="col-span-12 items-start mx-4 mt-8 border-b border-listingTertiaryColor">
          <span className=" p-4  text-listingTertiaryColor ">
            {/* آپلود مجوزها : */}
          </span>
        </div>
        <div className="col-span-12 flex justify-end mx-4 pt-5">
          <ListingSubmitButton
            width={'w-[160px]'}
            buttonName={'ثبت در سامانه'}
            onClick={handleRegisterUsers}
          />
        </div>
        <div className="col-span-12 grid grid-cols-12 justify-end m-4 mt-8">
          <TextField
            label="جستجو"
            className="2xl:col-span-3 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            value={filterText}
            onChange={(value: any) => {
              onChangeFilterText(value);
              setState({
                filterText: value,
              });
            }}
          />
          <div className="col-span-12 my-4">
            <Table
              columns={tableHeader}
              className="col-span-12 grid grid-cols-12 "
              data={users?.items}
              onChangePage={onChangeTablePage}
              totalPages={users?.totalPages}
              pageSize={PageSize}
              pageNumber={pageNumber}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default withAlert(ListingUsers);
