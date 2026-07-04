import withAlert from 'apps/cash-market/src/hoc/withAlert';
import {
  useStates,
  useEffect,
  useState,
  useNavigate,
  useSearchParams,
} from '@tse/utils';
import { Icon, NewSelectSearch, TextField } from '@tse/components/atoms';
import NewSelect from 'apps/cash-market/src/components/atoms/NewSelect';
import { ListingSubmitButton } from 'apps/cash-market/src/components/atoms/ListingSubmitButton';
import { Table } from '@tse/components/organism';
import { HeaderTypes } from '@tse/types';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import FindInPageOutlinedIcon from '@mui/icons-material/FindInPageOutlined';
import {
  getCompanyRegistrationTypes,
  getFinalShareholderList,
  getFinalShareHolderType,
  registerFinalShareholder,
} from 'apps/cash-market/src/Controller/Listing/BasicData';
import { deSeparator } from '@tse/tools';
import { ListingUploadLogo } from 'apps/cash-market/src/components/ListingLogoUpload';

const initialState = {
  finalShareHolderId: null,
  finalShareHolderTypeData: [],
  finalShareHolderType: '',
  finalShareHolderTypeError: false,
  finalShareHolderName: '',
  finalShareHolderNameError: false,
  webSite: '',
  prefixNumber: '',
  landline: '',
  email: '',
  address: '',
  companyRegistrationTypeData: [],
  companyRegistrationType: '',
  nationalId: '',
  nationalIdError: false,
  logoId: '',
  finalShareHolderListData: [],
  filterText: '',
  pageNumber: 1,
};
const PageSize = 10;

function FinalShareholder({ onAlert }: any) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useStates<any>(initialState);
  const {
    finalShareHolderId,
    finalShareHolderTypeData,
    finalShareHolderType,
    finalShareHolderName,
    webSite,
    prefixNumber,
    landline,
    email,
    address,
    companyRegistrationTypeData,
    companyRegistrationType,
    nationalId,
    logoId,
    finalShareHolderListData,
    filterText,
    pageNumber,
  } = state;

  const tableHeader: HeaderTypes[] = [
    {
      title: 'نام شرکت',
      dataIndex: 'finalShareHolderName',
      key: 'finalShareHolderName',
      className: 'col-span-2',
    },
    {
      title: 'نوع سهامدار',
      dataIndex: 'finalShareHolderTypeName',
      key: 'finalShareHolderTypeName',
      className: 'col-span-2',
    },
    {
      title: 'نوع شرکت',
      dataIndex: 'companyRegistrationTypeName',
      key: 'companyRegistrationTypeName',
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
      title: 'ایمیل',
      dataIndex: 'email',
      key: 'email',
      className: 'col-span-1',
    },
    {
      title: 'جزئیات',
      dataIndex: 'finalShareHolderId',
      key: 'finalShareHolderId',
      className: 'col-span-1',
      render: (item: number) => {
        return (
          <a href={`/listing-basicdata/final-share-holder-detail?id=${item}`}>
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
  const onFail = (error: any) => {
    onAlert(error);
  };
  useEffect(() => {
    handelGetCompanyRegistrationTypes();
    handleGetFinalShareHolderType();
    handleGetFinalShareholderList('', 1);
  }, []);
  const handelGetCompanyRegistrationTypes = () => {
    getCompanyRegistrationTypes({
      onSuccess: (res: any) => setState({ companyRegistrationTypeData: res }),
      onFail,
    });
  };
  const handleGetFinalShareHolderType = () => {
    getFinalShareHolderType({
      onSuccess: (res: any) => setState({ finalShareHolderTypeData: res }),
      onFail,
    });
  };
  const handleGetFinalShareholderList = (text?: string, pageNo?: number) => {
    getFinalShareholderList({
      data: {
        FilterText: text,
        PageNumber: pageNo,
        PageSize,
      },
      onSuccess: (res: any) => setState({ finalShareHolderListData: res }),
      onFail,
    });
  };
  const onChangeTablePage = (pageNo: number) => {
    handleGetFinalShareholderList(filterText, pageNo);
    setState({ pageNumber: 1 });
  };
  const onChangeFilterText = (filterText: string) => {
    handleGetFinalShareholderList(filterText, 1);
  };
  const setErrorMessage = (key: string) => {
    const errorMessage = true;
    setState({ [`${key}Error`]: errorMessage });
  };
  const onSubmitClick = () => {
    if (finalShareHolderType && finalShareHolderName && nationalId) {
      const rawData = {
        finalShareHolderId: finalShareHolderId ? finalShareHolderId : null,
        finalShareHolderName,
        finalShareHolderTypeId: finalShareHolderType,
        companyRegistrationTypeId: companyRegistrationType,
        nationalId,
        webSite,
        email,
        landline,
        prefixNumber,
        address,
        logoId,
      };
      const data = Object.fromEntries(
        Object.entries(rawData).filter(
          ([key, value]) => value !== '' && value !== null
        )
      );
      registerFinalShareholder({
        data,
        onSuccess: (res: any) => onSuccessSave(res),
        onFail,
      });
    } else {
      !finalShareHolderType && setErrorMessage('finalShareHolderType');
      !finalShareHolderName && setErrorMessage('finalShareHolderName');
      !nationalId && setErrorMessage('nationalId');
    }
  };
  const onSuccessSave = (res: any) => {
    setState({
      finalShareHolderId: null,
      finalShareHolderType: '',
      finalShareHolderName: '',
      webSite: '',
      prefixNumber: '',
      landline: '',
      email: '',
      address: '',
      companyRegistrationType: '',
      nationalId: '',
      logoId: '',
      pageNumber: 1,
    });
    handleGetFinalShareholderList('', 1);
    onAlert({
      type: 'success',
      message: 'اطلاعات با موفقیت ثبت گردید',
    });
  };
  const onEditClick = (record: any) => {
    setState({
      finalShareHolderId: record?.finalShareHolderId,
      finalShareHolderType: record?.finalShareHolderTypeId,
      finalShareHolderName: record?.finalShareHolderName,
      webSite: record?.webSite,
      prefixNumber: record?.prefixNumber,
      landline: record?.landline,
      email: record?.email,
      address: record?.address,
      companyRegistrationType: record?.companyRegistrationTypeId,
      nationalId: record?.nationalId,
      logoId: record?.attachment,
    });
  };
  return (
    <>
      <div className="border-2 border-lightGray  grid grid-cols-12">
        <div className=" col-span-12 items-start flex border-b-2 border-lightGray">
          <span className=" p-2 font-bold">فرم ثبت نام سهامدار نهایی جدید</span>
        </div>
        <div className="col-span-12 items-start   mx-4 mt-4 border-b border-listingTertiaryColor">
          <span className=" p-4  text-listingTertiaryColor ">
            مشخصات سهامدار :
          </span>
        </div>
        <div className="col-span-12 grid grid-cols-12 gap-4 m-4 mt-8">
          <NewSelect
            label="نوع سهامدار"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            options={[
              {
                finalShareHolderTypeName: '',
                finalShareHolderTypeId: '',
              },
              ...finalShareHolderTypeData,
            ]}
            onChange={(value: any) =>
              setState({
                finalShareHolderType: value,
                finalShareHolderTypeError: false,
              })
            }
            showKey="finalShareHolderTypeName"
            selectedKey="finalShareHolderTypeId"
            required
            value={finalShareHolderType}
            errorMessage={state?.finalShareHolderTypeError}
          />
          <TextField
            label="نام شرکت یا نهاد"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            value={finalShareHolderName}
            onChange={(value: any) =>
              setState({
                finalShareHolderName: value,
                finalShareHolderNameError: '',
              })
            }
            required
            errorMessage={state?.finalShareHolderNameError}
          />
          <TextField
            label="وب سایت"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            value={webSite}
            onChange={(value: any) =>
              setState({
                webSite: value,
              })
            }
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
            // type="numeric"
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
            نوع شرکت و زمینه فعالیت :
          </span>
        </div>
        <div className="col-span-12 grid grid-cols-12 gap-4 m-4 mt-8">
          <NewSelect
            label="نوع شرکت"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            options={[
              {
                companyRegistrationTypeName: 'هیچکدام',
                companyRegistrationTypeId: '',
              },
              ...companyRegistrationTypeData,
            ]}
            onChange={(value: any) =>
              setState({ companyRegistrationType: value })
            }
            showKey="companyRegistrationTypeName"
            selectedKey="companyRegistrationTypeId"
            value={companyRegistrationType}
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
        </div>
        <div className="col-span-12 ">
          <ListingUploadLogo
            fileData={(data: any) =>
              data?.fileId
                ? setState({ logoId: data?.fileId })
                : setState({ logoId: '' })
            }
            withHeader
            onChangeFromParent={logoId}
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
              data={finalShareHolderListData?.items}
              onChangePage={onChangeTablePage}
              totalPages={finalShareHolderListData?.totalPages}
              pageSize={PageSize}
              pageNumber={pageNumber}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default withAlert(FinalShareholder);
