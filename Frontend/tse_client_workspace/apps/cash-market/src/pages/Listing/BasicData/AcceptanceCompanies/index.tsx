import withAlert from 'apps/cash-market/src/hoc/withAlert';
import {
  useStates,
  useEffect,
  useState,
  useNavigate,
  useSearchParams,
} from '@tse/utils';
import {
  AntdSelectSearch,
  Icon,
  Image,
  NewSelectSearch,
  SelectMultiple,
  TextField,
  Upload,
} from '@tse/components/atoms';
import NewSelect from 'apps/cash-market/src/components/atoms/NewSelect';
import { ListingSubmitButton } from 'apps/cash-market/src/components/atoms/ListingSubmitButton';
import { Table } from '@tse/components/organism';
import { HeaderTypes } from '@tse/types';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import FindInPageOutlinedIcon from '@mui/icons-material/FindInPageOutlined';
import { downloadFileApi, uploadFile } from 'apps/cash-market/src/Controller';
import { Popconfirm } from 'antd';
import { ListingCreateButton } from 'apps/cash-market/src/components/atoms/ListingCreateButton';
import { CreateCompanyModal } from './CreateCompanyModal';
import {
  deSeparator,
  downloadFile,
  generateGuid,
  generateRandomNumber,
} from '@tse/tools';
import {
  getAuditingPostType,
  getCompanyInfo,
  getCompanyList,
  getCompanyRegistrationTypes,
  getCompanyTypes,
  getCompanyUserPostTypes,
  getUsers,
  registerCompany,
} from 'apps/cash-market/src/Controller/Listing/BasicData';
import { DownloadOutlined } from '@ant-design/icons';
import { ListingUploadLogo } from 'apps/cash-market/src/components/ListingLogoUpload';

const initialState = {
  companyId: '',
  companyName: '',
  companyNameError: false,
  webSite: '',
  webSiteError: false,
  prefixNumber: '',
  landline: '',
  email: '',
  address: '',
  companyRegistrationTypeData: [],
  companyRegistrationTypeName: '',
  companyRegistrationTypeId: '',
  companyRegistrationTypeError: false,
  nationalId: '',
  nationalIdError: false,
  companyTypesData: [],
  companyTypes: [],
  companyTypesError: false,
  userListData: [],
  userName: null,
  userNameError: false,
  postTypeData: [],
  postTypeId: '',
  postTypeName: '',
  postTypeError: false,
  userInfoFile: null,
  userInfoFileError: false,
  companyUserInfoAttachments: [],
  companyAttachments: [],
  companyAttachmentTitle: '',
  companyAttachmentTitleError: false,
  companyAttachmentFile: null,
  companyAttachmentFileError: false,
  attachmentLogo: null,
  filterText: '',
  companyListData: [],
  companyParentData: [],
  companyChildData: [],
  parentCompanyRef: null,
  childsRefCompanies: [],
  pageNumber: 1,
};
const PageSize = 10;
function AcceptanceCompanies({ onAlert }: any) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useStates<any>(initialState);
  const {
    companyId,
    companyName,
    webSite,
    prefixNumber,
    landline,
    email,
    address,
    companyRegistrationTypeData,
    companyRegistrationTypeName,
    companyRegistrationTypeId,
    companyRegistrationTypeError,
    nationalId,
    companyTypesData,
    companyTypes,
    companyTypesError,
    userListData,
    userName,
    postTypeData,
    postTypeId,
    postTypeName,
    userInfoFile,
    companyUserInfoAttachments,
    companyAttachments,
    companyAttachmentTitle,
    companyAttachmentFile,
    attachmentLogo,
    filterText,
    companyListData,
    companyParentData,
    companyChildData,
    parentCompanyRef,
    childsRefCompanies,
    isOpenCreateCompanyModal,
    modalId,
    pageNumber,
  } = state;
  const ceoTableHeader: HeaderTypes[] = [
    {
      title: 'نام و نام خانوادگی',
      dataIndex: 'fullName',
      key: 'fullName',
      className: 'col-span-4',
    },
    {
      title: 'سمت',
      dataIndex: 'postType',
      key: 'postType',
      className: 'col-span-3',
      render: (item: any) => <span>{item?.postTypeName}</span>,
    },
    {
      title: 'مدرک',
      dataIndex: 'attachment',
      key: 'attachment',
      className: 'col-span-3',
      render: (item: any) => (
        <DownloadOutlined
          onClick={() => handleDownload(item)}
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
          {/* <Icon
            name="icon-edit"
            classname="text-listingTertiaryColor text-lg cursor-pointer"
            //   onClick={() => onEditSellerTable(item)}
          /> */}
          <Popconfirm
            title="آیا اطمینان دارید؟"
            okText="بله"
            cancelText="خیر"
            onConfirm={() => onRemoveCompanyUserInfo(item)}
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
  const licenseTableHeader: HeaderTypes[] = [
    {
      title: 'موضوع مدرک',
      dataIndex: 'companyAttachmentTitle',
      key: 'companyAttachmentTitle',
      className: 'col-span-5',
    },
    {
      title: 'فایل مجوز',
      dataIndex: 'attachment',
      key: 'attachment',
      className: 'col-span-5',
      render: (item: any) => (
        <DownloadOutlined
          onClick={() => handleDownload(item)}
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
  const formTableHeader: HeaderTypes[] = [
    {
      title: 'نام شرکت',
      dataIndex: 'companyName',
      key: 'companyName',
      className: 'col-span-3',
    },
    {
      title: 'نام مدیرعامل',
      dataIndex: 'instrumentName',
      key: 'instrumentName',
      className: 'col-span-2',
    },
    {
      title: 'شماره تماس',
      dataIndex: 'instrumentName',
      key: 'instrumentName',
      className: 'col-span-2',
      render: (item: any, infoData: any) => (
        <span>
          {infoData?.prefixNumber
            ? infoData?.prefixNumber + '-' + infoData?.landline
            : infoData?.landline}
        </span>
      ),
    },
    {
      title: 'وبسایت',
      dataIndex: 'website',
      key: 'website',
      className: 'col-span-2',
      render: (item: any) => {
        return (
          <a target="_blank" rel="noreferrer" href={item}>
            {item}
          </a>
        );
      },
    },
    {
      title: 'جزئیات',
      dataIndex: 'companyId',
      key: 'companyId',
      className: 'col-span-1',
      render: (item: any) => {
        return (
          <a href={`/listing-basicdata/acceptance-companies-detail?id=${item}`}>
            <FindInPageOutlinedIcon className="text-listingTertiaryColor " />
          </a>
        );
      },
    },
    {
      title: 'ویرایش',
      dataIndex: 'companyId',
      key: 'companyId',
      className: 'col-span-1',
      render: (item: any) => {
        return (
          <Icon
            name="icon-edit"
            classname="text-listingTertiaryColor text-lg cursor-pointer"
            onClick={() => onEditClick(item)}
          />
        );
      },
    },
  ];
  useEffect(() => {
    handelGetCompanyRegistrationTypes();
    handleGetCompanyTypesData('');
    handleGetPostTypeData();
    handleGetUserList();
    handleGetCompanyList('', 1, 'All');
  }, []);
  const onFail = (error: any) => {
    onAlert(error);
  };
  const setErrorMessage = (key: string) => {
    const errorMessage = true;
    setState({ [`${key}Error`]: errorMessage });
  };
  const handleDownload = (data: any) => {
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
  const onChangeUserInfoFile = (e: any) => {
    uploadFile({
      data: e.target.files[0],
      onSuccess: (res: any) =>
        setState({ userInfoFile: res, userInfoFileError: false }),
      onFail,
    });
  };
  const onRemoveUserInfoFile = () => {
    setState({
      userInfoFile: null,
    });
  };
  const onChangeCompanyAttachmentFile = (e: any) => {
    uploadFile({
      data: e.target.files[0],
      onSuccess: (res: any) =>
        setState({
          companyAttachmentFile: res,
          companyAttachmentFileError: false,
        }),
      onFail,
    });
  };
  const onRemoveCompanyAttachmentFile = () => {
    setState({
      companyAttachmentFile: null,
    });
  };

  const onChangeState = (key: string, value: string) => {
    setState({
      [key]: value,
    });
  };
  const handelGetCompanyRegistrationTypes = () => {
    getCompanyRegistrationTypes({
      onSuccess: (res: any) => setState({ companyRegistrationTypeData: res }),
      onFail,
    });
  };
  const handleGetCompanyTypesData = (text: any) => {
    const data = {
      SearchText: text,
      AccessSystemId: 1,
    };
    getCompanyTypes({
      data,
      onSuccess: (res: any) => {
        setState({
          companyTypesData: res,
        });
      },
      onFail,
    });
  };
  const handleGetUserList = (text?: string, pageNo?: number) => {
    getUsers({
      data: {
        FilterText: text,
        PageNumber: pageNo,
        PageSize,
      },
      onSuccess: (res: any) => setState({ userListData: res }),
      onFail,
    });
  };
  const handleGetPostTypeData = () => {
    getCompanyUserPostTypes({
      onSuccess: (res: any) => setState({ postTypeData: res }),
      onFail,
    });
  };
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
        if (componentState === 'All') {
          setState({
            companyListData: res,
            companyParentData: res,
            companyChildData: res,
          });
        } else {
          setState({ [`${componentState}`]: res });
        }
      },
      onFail,
    });
  };
  const onSubmitCompanyUserInfo = () => {
    if (userName && postTypeId && userInfoFile) {
      setState({
        companyUserInfoAttachments: [
          ...companyUserInfoAttachments,
          {
            tableId: generateGuid(),
            attachment: userInfoFile,
            userRef: userName?.userId,
            fullName: userName?.fullName,
            postType: {
              postTypeId: postTypeId,
              postTypeName: postTypeName,
            },
            ///////////////////////////not set yet/////////////////////
            hasRightDigitalSign: true,
          },
        ],
        userName: {
          fullName: '',
        },
        userRef: '',
        postTypeId: '',
        postTypeName: '',
        userInfoFile: null,
      });
    } else {
      !userName?.fullName && setErrorMessage('userName');
      !postTypeId && setErrorMessage('postType');
      !userInfoFile && setErrorMessage('userInfoFile');
    }
  };
  const onRemoveCompanyUserInfo = (item: any) => {
    const newArrayData = companyUserInfoAttachments?.filter(
      (filter: any) => item?.tableId != filter?.tableId
    );
    setState({ companyUserInfoAttachments: newArrayData });
  };
  const onSubmitCompanyAttachments = () => {
    if (companyAttachmentTitle && companyAttachmentFile) {
      setState({
        companyAttachments: [
          ...companyAttachments,
          {
            tableId: generateGuid(),
            attachment: companyAttachmentFile,
            companyAttachmentTitle: companyAttachmentTitle,
          },
        ],
        companyAttachmentFile: null,
        companyAttachmentTitle: '',
      });
    } else {
      !companyAttachmentTitle && setErrorMessage('companyAttachmentTitle');
      !companyAttachmentFile && setErrorMessage('companyAttachmentFile');
    }
  };
  const onRemoveCompanyAttachments = (item: any) => {
    const newArrayData = companyAttachments?.filter(
      (filter: any) => item?.tableId != filter?.tableId
    );
    setState({ companyAttachments: newArrayData });
  };
  const onSuccessModalSave = () => {
    ///get companylist
    handleGetCompanyList('', 1, 'All');
  };
  // const SelectCertificateFromTokenByUI = () => {
  //   if (Dastine.isInstalled) {
  //     try {
  //       Dastine.SelectCertificateFromTokenByUI('', '', function (event: any) {
  //         console.log('dastineeeeeeee', event.data.Result);
  //       });
  //     } catch (e) {
  //       alert(e);
  //     }
  //   } else {
  //     if (Dastine.errorMessage == 'DASTINE_NOT_INSTALLED')
  //       alert(Dastine.errorMessage + '\n Get it from:\n');
  //     else alert(Dastine.errorMessage);
  //   }
  // };
  const onChangeFilterText = (filterText: string) => {
    handleGetCompanyList(filterText, 1, 'companyListData');
  };
  const onChangeTablePage = (pageNo: number) => {
    handleGetCompanyList(filterText, pageNo, 'companyListData');
    setState({ pageNumber: pageNo });
  };
  const onSubmitClick = () => {
    if (companyName && nationalId && companyRegistrationTypeId) {
      const rawData = {
        companyId: companyId ? companyId : null,
        companyName: companyName,
        parentCompanyRef: parentCompanyRef?.companyId,
        companyRegistrationTypeId,
        nationalId,
        webSite,
        address,
        email,
        landline,
        prefixNumber,
        attachmentLogo,
        childsRefCompanies,
        companyTypes,
        companyUserInfoAttachments,
        companyAttachments,
      };

      const data = Object.fromEntries(
        Object.entries(rawData).filter(
          ([key, value]) => value !== '' && value !== null
        )
      );
      registerCompany({
        data,
        onSuccess: (res: any) => onSuccessSaveRegisterCompany(res),
        onFail,
      });
    } else {
      !companyName && setErrorMessage('companyName');
      !nationalId && setErrorMessage('nationalId');
      !companyRegistrationTypeId && setErrorMessage('companyRegistrationType');
      companyTypes?.length == 0 && setErrorMessage('companyTypes');
      onAlert({
        message: 'اطلاعات لازم را به طور کامل وارد نمایید.',
        type: 'error',
      });
    }
  };
  const onSuccessSaveRegisterCompany = (res: any) => {
    setState({
      companyId: '',
      companyName: '',
      webSite: '',
      prefixNumber: '',
      landline: '',
      email: '',
      address: '',
      companyRegistrationTypeName: '',
      companyRegistrationTypeId: '',
      nationalId: '',
      companyTypes: [],
      userName: null,
      userNameError: false,
      postTypeId: '',
      postTypeName: '',
      userInfoFile: null,
      companyUserInfoAttachments: [],
      companyAttachments: [],
      companyAttachmentTitle: '',
      companyAttachmentFile: null,
      attachmentLogo: '',
      parentCompanyRef: null,
      childsRefCompanies: [],
      pageNumber: 1,
    });
    onAlert({ message: 'اطلاعات با موفقیت ثبت گردید.', type: 'success' });
    handleGetCompanyList('', 1, 'All');
  };
  const onEditClick = (companyId: any) => {
    const data = {
      companyId,
    };
    getCompanyInfo({
      data,
      onSuccess: (res: any) => onSuccessEdit(res),
      onFail,
    });
  };
  const onSuccessEdit = (data: any) => {
    const companyTypesData = data?.companyTypes?.map((item: any) => {
      return item?.companyTypeId;
    });
    const childsRefCompaniesData = data?.childsRefCompanies?.map(
      (item: any) => {
        return item?.companyId;
      }
    );
    setState({
      companyId: data?.companyId,
      companyName: data?.companyName,
      parentCompanyRef: data?.parentRefCompany,
      companyRegistrationTypeId: data?.companyRegistrationTypeId,
      nationalId: data?.nationalId,
      webSite: data?.webSite,
      address: data?.address,
      email: data?.email,
      landline: data?.landline,
      prefixNumber: data?.prefixNumber,
      attachmentLogo: data?.attachmentLogo,
      childsRefCompanies: childsRefCompaniesData,
      companyTypes: companyTypesData,
      companyUserInfoAttachments: data?.companyUsers,
      companyAttachments: data?.companyAttachments,
    });
  };
  return (
    <>
      <div className="border-2 border-lightGray  grid grid-cols-12">
        <div className=" col-span-12 items-start flex border-b-2 border-lightGray">
          <span className=" p-2 font-bold">فرم ثبت نام شرکت مشاور جدید</span>
        </div>
        <div className="col-span-12 items-start   mx-4 mt-4 border-b border-listingTertiaryColor">
          <span className=" p-4  text-listingTertiaryColor ">
            مشخصات شرکت :
          </span>
        </div>
        <div className="col-span-12 grid grid-cols-12 gap-4 m-4 mt-8">
          <TextField
            label="نام شرکت"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            value={companyName}
            onChange={(value: any) =>
              setState({
                companyName: value,
                companyNameError: '',
              })
            }
            required
            errorMessage={state?.companyNameError}
          />
          <TextField
            label="وب‌سایت"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            value={webSite}
            onChange={(value: any) =>
              setState({
                webSite: value,
                webSiteError: '',
              })
            }
            // required
            // error={state?.webSiteError}
          />
          <TextField
            label="پیش شماره تلفن دفتر مرکزی"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            value={deSeparator(prefixNumber)}
            onChange={(value: any) =>
              setState({
                prefixNumber: value,
              })
            }
            maxLength={3}
          />
          <TextField
            label="شماره تلفن دفتر مرکزی"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            value={deSeparator(landline)}
            onChange={(value: any) =>
              setState({
                landline: value,
              })
            }
            maxLength={8}
          />
          <TextField
            label="ایمیل"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            value={email}
            onChange={(value: any) =>
              setState({
                email: value,
              })
            }
          />
          <TextField
            label="آدرس دفتر مرکزی"
            className="2xl:col-span-8 xl:col-span-8 lg:col-span-8 md:col-span-12  col-span-8"
            value={address}
            onChange={(value: any) =>
              setState({
                address: value,
              })
            }
          />
        </div>
        <div className="col-span-12 items-start   mx-4 mt-8 border-b border-listingTertiaryColor">
          <span className=" p-4  text-listingTertiaryColor ">
            نوع شرکت و زمینه فعالیت :
          </span>
        </div>
        <div className="col-span-12 grid grid-cols-12 gap-4 m-4 mt-8">
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
          <TextField
            label="شناسه ملی"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            value={deSeparator(nationalId)}
            onChange={(value: any) =>
              setState({
                nationalId: value,
                nationalIdError: '',
              })
            }
            required
            errorMessage={state?.nationalIdError}
            maxLength={13}
          />
          <div className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4">
            <SelectMultiple
              placeholder="نقش"
              options={companyTypesData}
              value={companyTypes}
              limit={10}
              onChange={(value: any) => {
                setState({
                  companyTypes: value,
                  companyTypesError: false,
                });
              }}
              showKey="companyTypeName"
              selectedKey="companyTypeId"
              error={companyTypesError}
              required
            />
          </div>
        </div>
        <div className="col-span-12 items-start mx-4 mt-8 border-b border-listingTertiaryColor">
          <span className=" p-4  text-listingTertiaryColor ">
            مدیر عامل و اعضای هیئت مدیره :
          </span>
        </div>
        <div className="col-span-12 grid grid-cols-12 gap-4 m-4 mt-8">
          <AntdSelectSearch
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            label="نام و نام خانوادگی"
            onChange={(value: any) => {
              if (value?.fullName !== undefined) {
                setState({
                  userName: value,
                  userNameError: '',
                });
              } else if (value == '') {
                setState({
                  userName: null,
                });
              }
            }}
            onSearch={(serachText: any) => handleGetUserList(serachText, 1)}
            value={userName}
            data={userListData?.items}
            showKey="fullName"
            idKey="userId"
            required
            error={state.userNameError}
          />
          <NewSelect
            label="سمت"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            options={[{ postTypeName: '', postTypeId: '' }, ...postTypeData]}
            onChange={(value: any) =>
              setState({
                postTypeId: value,
                postTypeError: false,
                postTypeName: postTypeData.filter(
                  (item: any) => item?.postTypeId == value
                )?.[0]?.postTypeName,
              })
            }
            showKey="postTypeName"
            selectedKey="postTypeId"
            required
            value={postTypeId}
            errorMessage={state?.postTypeError}
          />
          <div className=" 2xl:col-span-4 xl:col-span-8 lg:col-span-8 md:col-span-8  col-span-4 mt-1">
            <Upload
              onChange={(file: any) => onChangeUserInfoFile(file)}
              value={userInfoFile?.fileName}
              href={userInfoFile?.link}
              name="userInfoFile"
              onDelete={() => onRemoveUserInfoFile()}
              error={state?.userInfoFileError}
            />
          </div>
          <div className="col-span-12 flex justify-end mt-8">
            <ListingSubmitButton onClick={onSubmitCompanyUserInfo} />
          </div>
          {companyUserInfoAttachments?.length > 0 && (
            <div className="col-span-12 my-4">
              <Table
                columns={ceoTableHeader}
                className="col-span-12 grid grid-cols-12 "
                data={companyUserInfoAttachments}
                // onChangePage={onChangeTablePage}
                totalPages={1}
                pageSize={100}
              />
            </div>
          )}
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
            value={companyAttachmentTitle}
            onChange={(value: any) =>
              setState({
                companyAttachmentTitle: value,
                companyAttachmentTitleError: false,
              })
            }
            required
            errorMessage={state?.companyAttachmentTitleError}
          />

          <div className=" 2xl:col-span-4 xl:col-span-6 lg:col-span-8 md:col-span-12  col-span-4 mt-1">
            <Upload
              onChange={(file: any) => onChangeCompanyAttachmentFile(file)}
              value={companyAttachmentFile?.fileName}
              href={companyAttachmentFile?.link}
              name="companyAttachmentFile"
              onDelete={() => onRemoveCompanyAttachmentFile()}
              error={state?.companyAttachmentFileError}
            />
          </div>
          <div className=" 2xl:col-span-4 xl:col-span-2 lg:col-span-12 md:col-span-12  col-span-4 flex justify-end ">
            <ListingSubmitButton onClick={onSubmitCompanyAttachments} />
          </div>
          {companyAttachments.length > 0 && (
            <div className="col-span-12 my-4">
              <Table
                columns={licenseTableHeader}
                className="col-span-12 grid grid-cols-12 "
                data={companyAttachments}
                // onChangePage={onChangeTablePage}
                totalPages={1}
                pageSize={100}
              />
            </div>
          )}
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
        <div className="col-span-12 flex justify-between mx-4 mt-8 border-b border-listingTertiaryColor">
          <span className=" p-4  text-listingTertiaryColor ">شرکت مادر :</span>
          <ListingCreateButton
            className="p-4"
            buttonName="ایجاد شرکت مادر"
            onClick={() => {
              setState({
                modalId: 'mainCompany',
                isOpenCreateCompanyModal: true,
              });
            }}
          />
        </div>
        <div className="col-span-12 grid grid-cols-12 gap-4 m-4 mt-8">
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
            required
            data={companyParentData?.items}
            showKey="companyName"
            idKey="companyId"
          />
        </div>
        <div className="col-span-12 flex justify-between mx-4 mt-8 border-b border-listingTertiaryColor">
          <span className=" p-4  text-listingTertiaryColor ">
            شرکت زیرمجموعه :
          </span>
          <ListingCreateButton
            className="p-4"
            buttonName="ایجاد شرکت زیرمجموعه"
            onClick={() => {
              setState({
                modalId: 'subCompany',
                isOpenCreateCompanyModal: true,
              });
            }}
          />
        </div>
        <div className="col-span-12 grid grid-cols-12 gap-4 m-4 mt-8 pb-20">
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
        <div className="col-span-12 flex justify-end mx-4 ">
          <ListingSubmitButton
            width={'w-[160px]'}
            buttonName={'ثبت در سامانه'}
            onClick={onSubmitClick}
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
              columns={formTableHeader}
              className="col-span-12 grid grid-cols-12 "
              data={companyListData?.items}
              onChangePage={onChangeTablePage}
              totalPages={companyListData?.totalPages}
              pageSize={PageSize}
              pageNumber={pageNumber}
            />
          </div>
        </div>
      </div>
      <CreateCompanyModal
        modalId={modalId}
        isOpen={isOpenCreateCompanyModal}
        onChangeState={onChangeState}
        onAlert={onAlert}
        onSuccessModalSave={onSuccessModalSave}
      />
    </>
  );
}

export default withAlert(AcceptanceCompanies);
