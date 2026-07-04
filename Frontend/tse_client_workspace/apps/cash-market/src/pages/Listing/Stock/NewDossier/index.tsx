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
  TextField,
  Upload,
  AntdSelectSearch,
  TreeSelectSearch,
} from '@tse/components/atoms';
import { ListingSubmitButton } from 'apps/cash-market/src/components/atoms/ListingSubmitButton';
import { Table } from '@tse/components/organism';
import { HeaderTypes } from '@tse/types';
import FindInPageOutlinedIcon from '@mui/icons-material/FindInPageOutlined';
import { getRole } from 'apps/cash-market/src/Controller/Identity';
import { uploadFile } from 'apps/cash-market/src/Controller';
import {
  getUsers,
  getUsersInfo,
  saveUsers,
  getCompanyList,
} from 'apps/cash-market/src/Controller/Listing/BasicData';
import {
  getNextDossierNumber,
  saveDossier,
  getIndustryList,
  getDossierInfo,
} from 'apps/cash-market/src/Controller/Listing/Stock';
import { Popconfirm } from 'antd';
import type { TreeSelectProps } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { deSeparator, downloadFile, generateGuid } from '@tse/tools';
import { downloadFileApi } from 'apps/cash-market/src/Controller';
import { DatePicker } from '@tse/components/molecules';

const initialState = {
  userName: '',
  personnelNumber: '',
  phoneNumber: '',
  attachmentRef: '',
  companyRegistrationType: [],
  email: '',
  landLine: '',
  prefixNumber: '',
  address: '',
  creator: '',
  modifier: '',
  creationDate: '',
  modificationDate: '',
  companyName: '',
  selectedRole: [],
  selectedRoleError: false,
  users: [],
  companyList: [],
  selectedCompany: null,
  phoneNumberError: false,
  fixedPhoneNumber: '',
  userId: null,
  filterText: '',
  userInfoList: [],
  dossierAttachmentTitle: '',
  dossierAttachmentFile: null,
  dossierAttachment: [],
  selectedUser: null,
  selectedConsultingCompany: null,
  industryId: null,
  dossierDate: '',
  dossierNumber: '',
  faxNumber: '',
  factoryAddress: '',
  factoryLandLine: '',
  factoryPrefixNumber: '',
  factoryFaxNumber: '',
  factoryPrefixFaxNumber: '',
  prefixFaxNumber: '',
  industryList: null,
  industrySearchText: '',
  searchValue: '',
  // dossierId: null,
  dossierDateError: false,
  companyError: false,
  userError: false,
  consultingCompanyError: false,
  industryError: false,
};

function NewListingDossier({ onAlert }: any) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useStates<any>(initialState);
  const dossierId =
    searchParams.get('id') != null ? searchParams.get('id') : null;

  const PageSize = 10;
  const {
    users,
    companyList,
    selectedCompany,
    prefixNumber,
    landLine,
    userId,
    filterText,
    dossierAttachmentTitle,
    dossierAttachmentFile,
    dossierAttachment,
    selectedUser,
    selectedConsultingCompany,
    dossierDate,
    industryId,
    dossierNumber,
    faxNumber,
    factoryAddress,
    factoryLandLine,
    factoryPrefixNumber,
    address,
    factoryFaxNumber,
    factoryPrefixFaxNumber,
    prefixFaxNumber,
    industryList,
    industrySearchText,
    searchValue,
    // dossierId,
    dossierDateError,
    companyError,
    userError,
    consultingCompanyError,
    industryError,
  } = state;

  useEffect(() => {
    getRoleData('');
    handlegetUsers('', 1);
    handleGetCompanyList();
    handleGetNextDossierNumber();
    handleGetIndustryList('');
  }, []);

  useEffect(() => {
    if (dossierId != null) {
      const data = { DossierId: dossierId }
      handleGetDossierInfo(data);
    }
  }, [dossierId]);

  const handleGetDossierInfo = (data: any) => {
    // const data = { DossierId: dossierId ? dossierId : 14 };
    getDossierInfo({
      data,
      onSuccess: (res: any) => onSuccessGetDossierInfo(res),
      onFail,
    });
  };

  const onSuccessGetDossierInfo = (res: any) => {
    const {
      dossierId,
      dossierNumber,
      dossierDate,
      user,
      industry,
      adviserCompany,
      dossierAttachmentFiles,
      landLine,
      prefixNumber,
      faxNumber,
      prefixFaxNumber,
      address,
      industryRef,
      company,
      factoryLandLine,
      factoryPrefixNumber,
      factoryFaxNumber,
      factoryPrefixFaxNumber,
      factoryAddress,
    } = res;
    setState({
      dossierId: dossierId ? dossierId : null,
      dossierNumber,
      dossierDate,
      selectedCompany: company,
      selectedUser: user,
      industryId: industryRef,
      // industryList: industry,
      selectedConsultingCompany: adviserCompany,
      prefixNumber,
      landLine,
      prefixFaxNumber,
      faxNumber,
      address,
      factoryPrefixNumber,
      factoryLandLine,
      factoryPrefixFaxNumber,
      factoryFaxNumber,
      factoryAddress,
      dossierAttachment: dossierAttachmentFiles,
    });
  };

  const handleGetIndustryList = (value: string) => {
    const data = {
      FilterText: value,
      PageNumber: 1,
      PageSize: 20,
    };
    getIndustryList({
      data,
      onSuccess: (res: any) => onSucessGetIndustry(res),
      onFail,
    });
  };

  const convertTreeData = (data: any) => {
    return data?.map((item: any) => ({
      title: item.title,
      value: item.industryId,
      children: convertTreeData(item.childs),
    }));
  };

  const onSucessGetIndustry = (data: any) => {
    const newData = data?.items?.map((item: any) => ({
      title: item.title,
      value: item.industryId,
      children: item?.childs?.length > 0 ? convertTreeData(item.childs) : [],
    }));
    setState({ industryList: newData });
  };

  const handleGetNextDossierNumber = () => {
    getNextDossierNumber({
      onSuccess: (res: any) => setState({ dossierNumber: res?.dossierNumber }),
      onFail,
    });
  };

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

  const handleSaveDossier = () => {
    if (
      dossierNumber &&
      dossierDate &&
      selectedCompany &&
      selectedUser &&
      industryId &&
      selectedConsultingCompany
    ) {
      const rawData = {
        dossierId: dossierId ? dossierId : null,
        dossierNumber,
        dossierDate,
        companyRef: selectedCompany?.companyId,
        userRef: selectedUser?.userId,
        industryRef: industryId,
        adviserCompanyRef: selectedConsultingCompany?.companyId,
        landLine,
        prefixNumber,
        faxNumber,
        prefixFaxNumber,
        address,
        factoryLandLine,
        factoryPrefixNumber,
        factoryFaxNumber,
        factoryPrefixFaxNumber,
        factoryAddress,
        dossierAttachmentFiles: dossierAttachment,
      };
      const data = Object.fromEntries(
        Object.entries(rawData)?.filter(
          ([key, value]) => value !== '' && value !== null
        )
      );

      saveDossier({
        data,
        onSuccess: (res: any) => onSuccessSaveDossier(res),
        onFail,
      });
    } else {
      !dossierNumber && setErrorMessage('dossierNumber');
      !dossierDate && setErrorMessage('dossierDate');
      !industryId && setErrorMessage('industryId');
      industryId == null && setErrorMessage('industry');
      selectedCompany == null && setErrorMessage('company');
      selectedConsultingCompany == null && setErrorMessage('consultingCompany');
      selectedUser?.length == null && setErrorMessage('user');
    }
  };

  const onSuccessSaveDossier = (res: any) => {
    setState({
      dossierId: null,
      dossierNumber: '',
      dossierDate: '',
      companyRef: '',
      userRef: '',
      industryRef: '',
      adviserCompanyRef: '',
      landLine: '',
      prefixNumber: '',
      faxNumber: '',
      prefixFaxNumber: '',
      address: '',
      factoryLandLine: '',
      factoryPrefixNumber: '',
      factoryFaxNumber: '',
      factoryPrefixFaxNumber: '',
      factoryAddress: '',
      dossierAttachmentFiles: null,
      dossierAttachmentTitle: '',
      dossierAttachment: '',
      pageNumber: 1,
    });
    handlegetUsers('', 1);
    onAlert({
      type: 'success',
      message: 'اطلاعات با موفقیت ثبت گردید',
    });
    navigate('/listing-stock/acceptance-dossieres');
  };

  const onRemoveCompanyAttachments = (item: any) => {
    const newArrayData = dossierAttachment?.filter(
      (filter: any) => item?.tableId != filter?.tableId
    );
    setState({ dossierAttachment: newArrayData });
  };

  const licenseTableHeader: HeaderTypes[] = [
    {
      title: 'موضوع مدرک',
      dataIndex: 'title',
      key: 'title',
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

  const onChangeFilterText = (filterText: string) => {
    handlegetUsers(filterText, 1);
  };

  const onChangeTablePage = (pageNo: number) => {
    handlegetUsers(filterText, pageNo);
  };

  const onChangeDossierAttachmentFile = (e: any) => {
    uploadFile({
      data: e.target.files[0],
      onSuccess: (res: any) => {
        setState({
          dossierAttachmentFile: res,
          dossierAttachmentFileError: false,
        });
      },
      onFail,
    });
  };
  const onRemoveDossierAttachmentFile = () => {
    setState({
      dossierAttachmentFile: null,
    });
  };

  const onSubmitdossierAttachment = () => {
    if (dossierAttachmentTitle && dossierAttachmentFile) {
      setState({
        dossierAttachment: [
          ...dossierAttachment,
          {
            tableId: generateGuid(),
            attachment: dossierAttachmentFile,
            title: dossierAttachmentTitle,
          },
        ],
        dossierAttachmentFile: null,
        dossierAttachmentTitle: '',
      });
    } else {
      !dossierAttachmentTitle && setErrorMessage('dossierAttachmentTitle');
      !dossierAttachmentFile && setErrorMessage('dossierAttachmentFile');
    }
  };

  const onChangeDate = (key: any, value: any) => {
    setState({ [key]: value, dossierDateError: false });
  };

  const onChangeIndustry = (newValue: string, option: any) => {
    setState({ industryId: newValue, industryError: false });
  };

  const onPopupScroll: TreeSelectProps['onPopupScroll'] = (e) => {
    console.log('onPopupScroll', e);
  };

  const onSearchTreeSelect = (value: string) => {
    setState({ searchValue: value });
    handleGetIndustryList(value);
  };

  return (
    <>
      <div className="border-2 border-lightGray  grid grid-cols-12">
        <div className=" col-span-12 items-start flex border-b-2 border-lightGray">
          <span className=" p-2 font-bold">فرم ثبت پرونده جدید سهام</span>
        </div>
        <div className="col-span-12 items-start   mx-4 mt-4 border-b border-listingTertiaryColor">
          <span className=" p-4  text-listingTertiaryColor ">
            شماره و تاریخ پرونده :
          </span>
        </div>
        <div className="col-span-12 grid grid-cols-12 gap-4 m-4 mt-8">
          <TextField
            label="شماره پرونده"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            value={deSeparator(dossierNumber)}
            onChange={(value: any) =>
              setState({
                dossierNumber: value,
              })
            }
            readOnly
          />
          <div className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4 z-10">
            <DatePicker
              parentClassName="!w-[85%]"
              label="تاریخ ایجاد پرونده"
              value={dossierDate}
              onChange={(value: any) => onChangeDate('dossierDate', value)}
              onClearDate={() => onChangeDate('dossierDate', '')}
              error={dossierDateError}
              required
            />
          </div>
        </div>

        <div className="col-span-12 flex justify-between mx-4 mt-8 border-b border-listingTertiaryColor">
          <span className=" p-4  text-listingTertiaryColor ">
            مشخصات شرکت بورسی :
          </span>
        </div>
        <div className="col-span-12 grid grid-cols-12 gap-4 m-4 mt-8">
          <AntdSelectSearch
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            label="نام شرکت یا نهاد"
            onChange={(value: any) => {
              if (value?.companyName !== undefined) {
                setState({ selectedCompany: value, companyError: false });
              } else if (value == '') {
                setState({ selectedCompany: null });
              }
              handleGetCompanyList();
            }}
            value={selectedCompany}
            data={companyList?.items}
            showKey="companyName"
            idKey="companyId"
            required
            error={companyError}
          />
          <AntdSelectSearch
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            label="کارشناس پذیرش"
            onChange={(value: any) => {
              if (value?.fullName !== undefined) {
                setState({
                  selectedUser: value,
                });
              } else if (value == '') {
                setState({
                  selectedUser: null,
                });
              }
              handlegetUsers();
            }}
            value={selectedUser}
            data={users?.items}
            showKey="fullName"
            idKey="userId"
            error={userError}
          />
          <TreeSelectSearch
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4 p-2"
            value={industryId}
            treeNodeFilterProp="title"
            label="صنعت"
            onChange={onChangeIndustry}
            treeData={industryList}
            onPopupScroll={onPopupScroll}
            onSearch={onSearchTreeSelect}
            searchValue={searchValue}
            error={industryError}
          />
          <AntdSelectSearch
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            label="شرکت مشاور"
            onChange={(value: any) => {
              if (value?.companyName !== undefined) {
                setState({
                  selectedConsultingCompany: value,
                });
              } else if (value == '') {
                setState({
                  selectedConsultingCompany: null,
                });
              }
              handleGetCompanyList();
            }}
            value={selectedConsultingCompany}
            data={companyList?.items}
            showKey="companyName"
            idKey="companyId"
            error={consultingCompanyError}
          />
          <TextField
            label=" پیش شماره تلفن شرکت "
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            value={prefixNumber}
            onChange={(value: any) =>
              setState({
                prefixNumber: value,
              })
            }
            maxLength={4}
          />
          <TextField
            label="شماره تلفن شرکت"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            value={landLine}
            onChange={(value: any) =>
              setState({
                landLine: value,
              })
            }
            maxLength={8}
          />
          <TextField
            label="پیش شماره فکس"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            value={prefixFaxNumber}
            onChange={(value: any) =>
              setState({
                prefixFaxNumber: value,
              })
            }
            maxLength={4}
          />
          <TextField
            label="فکس"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6 col-span-4"
            value={faxNumber}
            onChange={(value: any) =>
              setState({
                faxNumber: value,
              })
            }
            maxLength={8}
          />
          <TextField
            label="آدرس شرکت"
            className="2xl:col-span-12 xl:col-span-12 lg:col-span-12 md:col-span-12  col-span-4"
            value={address}
            onChange={(value: any) =>
              setState({
                address: value,
              })
            }
          />
        </div>

        <div className="col-span-12 items-start mx-4 mt-8 border-b border-listingTertiaryColor">
          <span className=" p-4  text-listingTertiaryColor ">
            آپلود مدارک درخواست پذیرش :
          </span>
        </div>
        <div className="col-span-12 grid grid-cols-12 gap-4 m-4 mt-8">
          <TextField
            label="موضوع مدرک"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-12 col-span-4"
            value={dossierAttachmentTitle}
            onChange={(value: any) =>
              setState({
                dossierAttachmentTitle: value,
                dossierAttachmentTitleError: false,
              })
            }
            required
            errorMessage={state?.dossierAttachmentTitleError}
          />

          <div className=" 2xl:col-span-4 xl:col-span-6 lg:col-span-8 md:col-span-12 col-span-4 mt-1">
            <Upload
              onChange={(file: any) => onChangeDossierAttachmentFile(file)}
              value={dossierAttachmentFile?.fileName}
              href={dossierAttachmentFile?.link}
              name="dossierAttachmentFile"
              onDelete={() => onRemoveDossierAttachmentFile()}
              //error={state?.dossierAttachmentFileError}
            />
          </div>
          <div className=" 2xl:col-span-4 xl:col-span-2 lg:col-span-12 md:col-span-12  col-span-4 flex justify-end ">
            <ListingSubmitButton onClick={onSubmitdossierAttachment} />
          </div>
          {dossierAttachment?.length > 0 && (
            <div className="col-span-12 my-4">
              <Table
                columns={licenseTableHeader}
                className="col-span-12 grid grid-cols-12 "
                data={dossierAttachment}
                // onChangePage={onChangeTablePage}
                totalPages={1}
                pageSize={100}
              />
            </div>
          )}
        </div>
        <div className="col-span-12 flex justify-between mx-4 mt-8 border-b border-listingTertiaryColor">
          <span className=" p-4  text-listingTertiaryColor ">
            مشخصات کارخانه :
          </span>
        </div>
        <div className="col-span-12 grid grid-cols-12 gap-4 m-4 mt-8">
          <TextField
            label="پیش شماره تلفن کارخانه "
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-6 md:col-span-6  col-span-4"
            value={factoryPrefixNumber}
            onChange={(value: any) =>
              setState({
                factoryPrefixNumber: value,
              })
            }
            maxLength={4}
          />
          <TextField
            label="شماره تلفن کارخانه "
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-6 md:col-span-6  col-span-4"
            value={factoryLandLine}
            onChange={(value: any) =>
              setState({
                factoryLandLine: value,
              })
            }
            maxLength={8}
          />
          <TextField
            label="پیش شماره فکس"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            value={factoryPrefixFaxNumber}
            onChange={(value: any) =>
              setState({
                factoryPrefixFaxNumber: value,
              })
            }
            maxLength={4}
          />
          <TextField
            label="فکس"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-6 md:col-span-6  col-span-4"
            value={factoryFaxNumber}
            onChange={(value: any) =>
              setState({
                factoryFaxNumber: value,
              })
            }
            maxLength={8}
          />
          <TextField
            label="آدرس کارخانه"
            className="2xl:col-span-12 xl:col-span-12 lg:col-span-12 md:col-span-12  col-span-4"
            // defaultValue={selectedCompany?.phoneNumber}
            value={factoryAddress}
            onChange={(value: any) =>
              setState({
                factoryAddress: value,
              })
            }
          />
        </div>
        <div className="col-span-12 items-start mx-4 mt-8 border-b border-listingTertiaryColor" />
        <div className="col-span-12 flex justify-end m-4 pt-5">
          <ListingSubmitButton
            width={'w-[160px]'}
            buttonName={'ثبت در سامانه'}
            onClick={handleSaveDossier}
          />
        </div>
      </div>
    </>
  );
}

export default withAlert(NewListingDossier);
