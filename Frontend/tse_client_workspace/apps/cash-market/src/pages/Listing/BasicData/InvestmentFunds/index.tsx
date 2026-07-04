import withAlert from 'apps/cash-market/src/hoc/withAlert';
import { useStates, useEffect, useState, useSearchParams } from '@tse/utils';
import { Icon, NewSelectSearch, TextField } from '@tse/components/atoms';
import NewSelect from 'apps/cash-market/src/components/atoms/NewSelect';
import { ListingSubmitButton } from 'apps/cash-market/src/components/atoms/ListingSubmitButton';
import { Table } from '@tse/components/organism';
import { deSeparator } from '@tse/tools';
import { HeaderTypes } from '@tse/types';
import FindInPageOutlinedIcon from '@mui/icons-material/FindInPageOutlined';
import {
  getCashList,
  getCashType,
  saveCash,
} from 'apps/cash-market/src/Controller/Listing/BasicData';

const initialState = {
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
  cashName: '',
  founder: '',
  trustee: '',
  manager: '',
  marketMaking: '',
  auditor: '',
  durationOfActivityInYear: '',
  numberOfDistributableInvestmentUnits: '',
  numberOfPreferredInvestmentUnitsUnderwritten: '',
  numberOfNormalInvestmentUnitsThatCanBeAccepted: '',
  cashList: [],
  filterText: '',
  economicCode: '',
  cashTypes: [],
  selectedCashType: '',
  cashNameError: false,
  cashId: '',
  pageNumber: '',
};
const pageSize = 10;

function InvestmentFunds({ onAlert }: any) {
  const [searchParams] = useSearchParams();
  const [state, setState] = useStates<any>(initialState);
  const {
    cashName,
    webSite,
    founder,
    trustee,
    manager,
    marketMaking,
    auditor,
    durationOfActivityInYear,
    numberOfDistributableInvestmentUnits,
    numberOfPreferredInvestmentUnitsUnderwritten,
    numberOfNormalInvestmentUnitsThatCanBeAccepted,
    cashList,
    filterText,
    economicCode,
    nationalId,
    email,
    landline,
    prefixNumber,
    address,
    cashTypes,
    selectedCashType,
    cashNameError,
    cashId,
    pageNumber,
  } = state;
  const PageSize = 10;

  useEffect(() => {
    handleGetCashList();
    handleGetCashTypes();
  }, []);

  const handleGetCashList = (text?: string, pageNo?: number) => {
    const data = {
      FilterText: text,
      PageNumber: pageNo ? pageNo : 1,
      PageSize,
    };
    getCashList({
      data,
      onSuccess: (res: any) => setState({ cashList: res }),
      onFail,
    });
  };
  const handleGetCashTypes = () => {
    const data = {};
    getCashType({
      data,
      onSuccess: (res: any) => setState({ cashTypes: res }),
      onFail,
    });
  };

  const onChangeTablePage = (pageNo: number) => {
    handleGetCashList(filterText, pageNo);
    setState({ pagenumber: pageNo });
  };
  const onChangeFilterText = (filterText: string) => {
    handleGetCashList(filterText, 1);
  };

  const onFail = (error: any) => {
    onAlert(error);
  };

  const setErrorMessage = (key: string) => {
    const errorMessage = true;
    setState({ [`${key}Error`]: errorMessage });
  };

  const handleSaveCashList = () => {
    if (cashName) {
      const rawData = {
        cashId: cashId ? cashId : null,
        cashName,
        cashTypeId: selectedCashType,
        economicCode,
        nationalId,
        webSite,
        email,
        landline,
        prefixNumber,
        address,
        founder,
        trustee,
        manager,
        marketMaking,
        auditor,
        durationOfActivityInYear,
        numberOfDistributableInvestmentUnits,
        numberOfPreferredInvestmentUnitsUnderwritten,
        numberOfNormalInvestmentUnitsThatCanBeAccepted,
      };

      const data = Object.fromEntries(
        Object.entries(rawData).filter(
          ([key, value]) => value !== '' && value !== null
        )
      );

      saveCash({
        data,
        onSuccess: (res: any) => onSuccessSave(res),
        onFail,
      });
    } else {
      !cashName && setErrorMessage('cashName');
    }
  };

  const onSuccessSave = (res: any) => {
    setState({
      // cashList: res,
      auditor: '',
      address: '',
      email: '',
      founder: '',
      manager: '',
      economicCode: '',
      numberOfDistributableInvestmentUnits: '',
      numberOfNormalInvestmentUnitsThatCanBeAccepted: '',
      numberOfPreferredInvestmentUnitsUnderwritten: '',
      marketMaking: '',
      nationalId: null,
      durationOfActivityInYear: '',
      landline: '',
      prefixNumber: '',
      cashName: '',
      webSite: '',
      selectedCashType: null,
      pageNumber: 1,
    });
    handleGetCashList();
    onAlert({
      type: 'success',
      message: 'اطلاعات با موفقیت ثبت گردید',
    });
  };

  const onEditClick = (record: any) => {
    const {
      cashId,
      address,
      auditor,
      email,
      manager,
      landline,
      founder,
      economicCode,
      numberOfDistributableInvestmentUnits,
      numberOfNormalInvestmentUnitsThatCanBeAccepted,
      numberOfPreferredInvestmentUnitsUnderwritten,
      durationOfActivityInYear,
      marketMaking,
      nationalId,
      prefixNumber,
      cashName,
      cashTypeId,
      webSite,
    } = record;

    setState({
      cashId,
      auditor,
      address,
      email,
      founder,
      manager,
      economicCode,
      numberOfDistributableInvestmentUnits,
      numberOfNormalInvestmentUnitsThatCanBeAccepted,
      numberOfPreferredInvestmentUnitsUnderwritten,
      marketMaking,
      nationalId,
      durationOfActivityInYear,
      landline,
      prefixNumber,
      cashName,
      webSite,
      selectedCashType: cashTypeId,
    });
  };

  const tableHeader: HeaderTypes[] = [
    {
      title: 'نام صندوق',
      dataIndex: 'cashName',
      key: 'cashName',
      className: 'col-span-3',
    },
    {
      title: 'نوع صندوق',
      dataIndex: 'cashType',
      key: 'cashType',
      className: 'col-span-2',
      render: (item: any) => <span>{item?.cashTypeName}</span>,
    },
    {
      title: 'مدیر',
      dataIndex: 'manager',
      key: 'manager',
      className: 'col-span-2',
    },
    {
      title: 'آدرس وب سایت',
      dataIndex: 'webSite',
      key: 'webSite',
      className: 'col-span-2',
    },
    {
      title: 'جزئیات',
      dataIndex: 'cashId',
      key: 'cashId',
      className: 'col-span-1',
      render: (item: any) => {
        return (
          <a href={`/listing-basicdata/investment-funds-detail?id=${item}`}>
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

  return (
    <>
      <div className="border-2 border-lightGray  grid grid-cols-12">
        <div className=" col-span-12 items-start flex border-b-2 border-lightGray">
          <span className=" p-2 font-bold">
            فرم ثبت نام صندوق سرمایه گذاری جدید
          </span>
        </div>
        <div className="col-span-12 items-start   mx-4 mt-4 border-b border-listingTertiaryColor">
          <span className=" p-4  text-listingTertiaryColor ">
            مشخصات صندوق سرمایه گذاری :
          </span>
        </div>
        <div className="col-span-12 grid grid-cols-12 gap-4 m-4 mt-8">
          <TextField
            label="نام صندوق"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            value={cashName}
            onChange={(value: any) =>
              setState({
                cashName: value,
                cashNameError: '',
              })
            }
            required
            errorMessage={cashNameError}
          />
          <NewSelect
            label="نوع صندوق"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            options={[
              {
                cashTypeName: "",
                cashTypeId: null,
              },
              ...cashTypes,
            ]}
            onChange={(value: any) => setState({ selectedCashType: value })}
            showKey="cashTypeName"
            selectedKey="cashTypeId"
            value={selectedCashType}
            required
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
            maxLength={13}
            // type="number"
          />
          <TextField
            label="کد اقتصادی"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            value={deSeparator(economicCode)}
            onChange={(value: any) =>
              setState({
                economicCode: value,
                economicCodeError: '',
              })
            }
            maxLength={11}
            // type="number"
          />
          <TextField
            label="آدرس "
            className="2xl:col-span-8 xl:col-span-8 lg:col-span-8 md:col-span-6  col-span-8"
            value={address}
            onChange={(value: any) =>
              setState({
                address: value,
                addressError: '',
              })
            }
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
            maxLength={4}
            // type="number"
          />

          <TextField
            label="شماره تلفن ثابت"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            value={landline}
            onChange={(value: any) =>
              setState({
                landline: value,
                landlineError: '',
              })
            }
            errorMessage={state?.landlineError}
            maxLength={8}
            // type="number"
          />

          <TextField
            label="ایمیل"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            value={email}
            onChange={(value: any) =>
              setState({
                email: value,
                emailError: '',
              })
            }
          />

          <TextField
            label="وب سایت"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            value={webSite}
            onChange={(value: any) =>
              setState({
                webSite: value,
                websiteError: '',
              })
            }
          />

          <TextField
            label="موسس/موسسان"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            value={founder}
            onChange={(value: any) =>
              setState({
                founder: value,
                founderError: '',
              })
            }
          />

          <TextField
            label="متولی"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            value={trustee}
            onChange={(value: any) =>
              setState({
                trustee: value,
                trusteeError: '',
              })
            }
          />

          <TextField
            label="مدیر"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            value={manager}
            onChange={(value: any) =>
              setState({
                manager: value,
                mangerError: '',
              })
            }
          />
          <TextField
            label="بازارگردان"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            value={marketMaking}
            onChange={(value: any) =>
              setState({
                marketMaking: value,
                marketMakingError: '',
              })
            }
          />
          <TextField
            label="حسابرس"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            value={auditor}
            onChange={(value: any) =>
              setState({
                auditor: value,
                auditorError: '',
              })
            }
          />
          <TextField
            label="مدیریت فعالیت"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            value={durationOfActivityInYear}
            onChange={(value: any) =>
              setState({
                durationOfActivityInYear: value,
                durationOfActivityInYearError: '',
              })
            }
          />
          <TextField
            label="تعداد واحدهای سرمایه گذاری قابل انتشار"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            value={numberOfDistributableInvestmentUnits}
            onChange={(value: any) =>
              setState({
                numberOfDistributableInvestmentUnits: value,
                numberOfDistributableInvestmentUnitsError: '',
              })
            }
          />

          <TextField
            label="تعداد واحدهای سرمایه گذاری ممتاز پذیره نویسی شده"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            value={numberOfPreferredInvestmentUnitsUnderwritten}
            onChange={(value: any) =>
              setState({
                numberOfPreferredInvestmentUnitsUnderwritten: value,
                numberOfPreferredInvestmentUnitsUnderwrittenError: '',
              })
            }
          />
          <TextField
            label="تعداد واحدهای سرمایه گذاری عادی قابل پذیره نویسی"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            value={numberOfNormalInvestmentUnitsThatCanBeAccepted}
            onChange={(value: any) =>
              setState({
                numberOfNormalInvestmentUnitsThatCanBeAccepted: value,
                numberOfNormalInvestmentUnitsThatCanBeAcceptedError: '',
              })
            }
          />
        </div>

        <div className="col-span-12 flex justify-end m-4 mt-8">
          <ListingSubmitButton
            width={'w-[160px]'}
            buttonName={'ثبت در سامانه'}
            onClick={handleSaveCashList}
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
              data={cashList?.items}
              onChangePage={onChangeTablePage}
              totalPages={cashList?.totalPages}
              pageSize={pageSize}
              pageNumber={pageNumber}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default withAlert(InvestmentFunds);
