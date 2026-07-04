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
  TextField,
  Upload,
} from '@tse/components/atoms';
import NewSelect from 'apps/cash-market/src/components/atoms/NewSelect';
import { ListingSubmitButton } from 'apps/cash-market/src/components/atoms/ListingSubmitButton';
import { Table } from '@tse/components/organism';
import { HeaderTypes } from '@tse/types';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import FindInPageOutlinedIcon from '@mui/icons-material/FindInPageOutlined';
import { uploadFile } from 'apps/cash-market/src/Controller';
import emptyPicture from 'apps/cash-market/src/assets/images/emptyPicture.jpg';
import { deSeparator, generateRandomNumber } from '@tse/tools';
import { ListingUploadLogo } from 'apps/cash-market/src/components/ListingLogoUpload';
import { Popconfirm } from 'antd';
import {
  getAuditingCompanyList,
  getAuditingPostType,
  getUsers,
  registerAuditingCompany,
} from 'apps/cash-market/src/Controller/Listing/BasicData';

const initialState = {
  companyId: null,
  companyName: '',
  companyNameError: false,
  categoryNumber: '',
  categoryNumberError: false,
  prefixNumber: '',
  landline: '',
  address: '',
  userListData: [],
  userName: null,
  userNameError: false,
  auditingPostTypeData: [],
  auditingPostType: '',
  auditingPostTypeName: '',
  auditingPostTypeError: false,
  auditingCompanyUserInfos: [],
  companyLogoFileId: '',
  AuditingCompanyListData: [],
  searchText: '',
  pageNumber: 1,
};
const PageSize = 10;
function AuditCompanies({ onAlert }: any) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useStates<any>(initialState);
  const {
    companyId,
    companyName,
    categoryNumber,
    prefixNumber,
    landline,
    address,
    userListData,
    userName,
    auditingPostTypeData,
    auditingPostType,
    auditingPostTypeName,
    auditingCompanyUserInfos,
    companyLogoFileId,
    AuditingCompanyListData,
    searchText,
    pageNumber,
  } = state;
  const tableHeader: HeaderTypes[] = [
    {
      title: 'نام موسسه',
      dataIndex: 'companyName',
      key: 'companyName',
      className: 'col-span-3',
    },
    {
      title: 'نام مدیرعامل',
      dataIndex: 'ceoName',
      key: 'ceoName',
      className: 'col-span-2',
    },
    {
      title: 'شماره تماس',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
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
      title: 'طبقه',
      dataIndex: 'categoryNumber',
      key: 'categoryNumber',
      className: 'col-span-2',
    },
    {
      title: 'جزئیات',
      dataIndex: 'companyId',
      key: 'companyId',
      className: 'col-span-1',
      render: (item: any) => {
        return (
          <a href={`/listing-basicdata/audit-companies-detail?id=${item}`}>
            <FindInPageOutlinedIcon className="text-listingTertiaryColor " />
          </a>
        );
      },
    },
    {
      title: 'ویرایش',
      dataIndex: 'instrumentName',
      key: 'instrumentName',
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
  const auditingPostTableHeader: HeaderTypes[] = [
    {
      title: 'نام و نام‌خانوادگی',
      dataIndex: 'userName',
      key: 'userName',
      className: 'col-span-5',
    },
    {
      title: 'سمت',
      dataIndex: 'auditingPostTypeName',
      key: 'auditingPostTypeName',
      className: 'col-span-5',
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
            onConfirm={() => onRemoveTableItem(item)}
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
  useEffect(() => {
    handleGetUserList('', 1);
    handleGetAuditingPostTypeData();
  }, []);

  const onFail = (error: any) => {
    onAlert(error);
  };
  const setErrorMessage = (key: string) => {
    const errorMessage = true;
    setState({ [`${key}Error`]: errorMessage });
  };

  const onSubmitCompanyUserInfo = () => {
    if (auditingPostType && userName) {
      setState({
        auditingCompanyUserInfos: [
          ...auditingCompanyUserInfos,
          {
            tableId: generateRandomNumber(),
            userName: userName?.fullName,
            userRef: userName?.userId,
            auditingPostTypeId: auditingPostType,
            auditingPostTypeName,
          },
        ],

        userName: {
          fullName: '',
        },
        userRef: '',
        auditingPostType: '',
        auditingPostTypeName: '',
      });
    } else {
      !auditingPostType && setErrorMessage('auditingPostType');
      !userName?.userId && setErrorMessage('userName');
    }
  };
  const onRemoveTableItem = (item: any) => {
    const newArrayData = auditingCompanyUserInfos?.filter(
      (filter: any) => item?.tableId != filter?.tableId
    );
    setState({ auditingCompanyUserInfos: newArrayData });
  };
  const onSubmitClick = () => {
    if (companyName && categoryNumber) {
      const rawData = {
        companyId: companyId ? companyId : null,
        companyName,
        address,
        landline,
        prefixNumber,
        categoryNumber: parseInt(categoryNumber),
        auditingCompanyUserInfos,
        companyLogoFileId: companyLogoFileId?.fileId,
      };
      const data = Object.fromEntries(
        Object.entries(rawData).filter(
          ([key, value]) => value !== '' && value !== null
        )
      );
      registerAuditingCompany({
        data,
        onSuccess: (res: any) => onSuccessSave(res),
        onFail,
      });
    } else {
      !companyName && setErrorMessage('companyName');
      !categoryNumber && setErrorMessage('categoryNumber');
    }
  };
  const onSuccessSave = (res: any) => {
    onAlert({
      type: 'success',
      message: 'اطلاعات با موفقیت ثبت گردید',
    });
    setState({
      companyId: '',
      companyName: '',
      categoryNumber: '',
      prefixNumber: '',
      landline: '',
      address: '',
      auditingCompanyUserInfos: [],
      companyLogoFileId: '',
      pageNumber: 1,
    });
    handleGetUserList('', 1);
    handleGetAuditingCompanyList('', 1);
  };
  const onEditClick = (record: any) => {
    setState({
      companyId: record?.companyId,
      companyName: record?.companyName,
      categoryNumber: String(record?.categoryNumber),
      prefixNumber: record?.prefixNumber,
      landline: record?.landline,
      address: record?.address,
      auditingCompanyUserInfos: record?.auditingCompanyUsers,
      companyLogoFileId: record?.attachment,
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
  const handleGetAuditingCompanyList = (text?: string, pageNo?: number) => {
    getAuditingCompanyList({
      data: {
        FilterText: text,
        PageNumber: pageNo,
        PageSize,
      },
      onSuccess: (res: any) => setState({ AuditingCompanyListData: res }),
      onFail,
    });
  };
  const handleGetAuditingPostTypeData = () => {
    getAuditingPostType({
      onSuccess: (res: any) => setState({ auditingPostTypeData: res }),
      onFail,
    });
  };
  const onChangeTablePage = (pageNo: number) => {
    handleGetAuditingCompanyList(searchText, pageNo);
    setState({ pageNumber: pageNo });
  };
  const onChangeSearchText = (searchText: string) => {
    handleGetAuditingCompanyList(searchText, 1);
  };
  console.log('auditingPostType', auditingPostType);

  return (
    <>
      <div className="border-2 border-lightGray  grid grid-cols-12">
        <div className=" col-span-12 items-start flex border-b-2 border-lightGray">
          <span className=" p-2 font-bold">فرم ثبت نام حسابرسان معتمد</span>
        </div>
        <div className="col-span-12 items-start   mx-4 mt-4 border-b border-listingTertiaryColor">
          <span className=" p-4  text-listingTertiaryColor ">
            مشخصات موسسه :
          </span>
        </div>
        <div className="col-span-12 grid grid-cols-12 gap-4 m-4 mt-8">
          <TextField
            label="نام شرکت یا نهاد"
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
            label="طبقه"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            value={deSeparator(categoryNumber)}
            onChange={(value: any) =>
              setState({
                categoryNumber: value,
                categoryNumberError: '',
              })
            }
            required
            errorMessage={state?.categoryNumberError}
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
            label="آدرس دفتر مرکزی"
            className="2xl:col-span-8 xl:col-span-8 lg:col-span-8 md:col-span-6  col-span-8"
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
                  userNameError: false,
                });
              } else if (value == '') {
                setState({
                  userName: null,
                });
              }
              handleGetUserList(value, 1);
            }}
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
            options={[
              { auditingPostTypeName: '', auditingPostTypeId: '' },
              ...auditingPostTypeData,
            ]}
            onChange={(value: any) =>
              setState({
                auditingPostType: value,
                auditingPostTypeError: false,
                auditingPostTypeName: auditingPostTypeData.filter(
                  (item: any) => item?.auditingPostTypeId == value
                )?.[0]?.auditingPostTypeName,
              })
            }
            showKey="auditingPostTypeName"
            selectedKey="auditingPostTypeId"
            required
            value={auditingPostType}
            errorMessage={state?.auditingPostTypeError}
          />
          <div className="col-span-4 flex justify-end">
            <ListingSubmitButton onClick={onSubmitCompanyUserInfo} />
          </div>
          {auditingCompanyUserInfos.length > 0 && (
            <div className="col-span-12 my-4">
              <Table
                columns={auditingPostTableHeader}
                className="col-span-12 grid grid-cols-12 "
                data={auditingCompanyUserInfos}
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
                ? setState({ companyLogoFileId: data })
                : setState({ companyLogoFileId: '' })
            }
            withHeader
            onChangeFromParent={companyLogoFileId}
            onAlert
          />
        </div>
        <div className="col-span-12 flex justify-end m-4 mt-8">
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
            value={searchText}
            onChange={(value: any) => {
              setState({ searchText: value });
              onChangeSearchText(value);
            }}
          />
          <div className="col-span-12 my-4">
            <Table
              columns={tableHeader}
              className="col-span-12 grid grid-cols-12 "
              data={AuditingCompanyListData?.items}
              onChangePage={onChangeTablePage}
              totalPages={AuditingCompanyListData?.totalPages}
              pageSize={PageSize}
              pageNumber={pageNumber}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default withAlert(AuditCompanies);
