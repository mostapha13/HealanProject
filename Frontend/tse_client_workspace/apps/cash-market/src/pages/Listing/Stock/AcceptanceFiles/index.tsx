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
  Button,
  Icon,
  SelectWithBadge,
} from '@tse/components/atoms';
import NewSelect from 'apps/cash-market/src/components/atoms/NewSelect';
import ListingFileCard from 'apps/cash-market/src/components/molecules/ListingFileCard';
import { Table } from '@tse/components/organism';
import { HeaderTypes } from '@tse/types';
import {
  exportDossierList,
  getAcceptanceExpertUser,
  getConsultingCompanyList,
  getDossierLevelSummary,
  getDossierList,
} from 'apps/cash-market/src/Controller/Listing/Stock';
import { Pagination } from 'antd';
import { convertDateToJalali, downloadFile } from '@tse/tools';
import { getDossierYears } from 'apps/cash-market/src/Controller/Listing/PublicInfo';
import { ListingCreateButton } from 'apps/cash-market/src/components/atoms/ListingCreateButton';
const PageSize = 12;
const initialState = {
  isCardView: true,
  selectedTabId: 1,
  dossierListData: [],
  pageNumber: 1,
  pageNoCardView: 1,
  dossierLevelSummaryData: [],
  dossierLevelTypeId: 'All',
  expertUserList: [],
  userRef: null,
  dossierYearsList: [],
  dossierYear: '',
  companyListData: [],
  auditingCompanyRef: null,
};
const AcceptanceFiles = ({ onAlert }: any) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useStates<any>(initialState);
  const {
    isCardView,
    selectedTabId,
    dossierListData,
    pageNumber,
    pageNoCardView,
    dossierLevelSummaryData,
    dossierLevelTypeId,
    expertUserList,
    userRef,
    dossierYearsList,
    dossierYear,
    auditingCompanyRef,
    companyListData,
  } = state;
  const tableHeader: HeaderTypes[] = [
    {
      title: 'مرحله',
      dataIndex: 'dossierLevelTypeName',
      key: 'dossierLevelTypeName',
      className: 'col-span-2',
    },
    {
      title: 'نام شرکت',
      dataIndex: 'companyName',
      key: 'companyName',
      className: 'col-span-2',
    },
    {
      title: 'آخرین وضعیت',
      dataIndex: 'dossierId',
      key: 'dossierId',
      className: 'col-span-1',
    },
    {
      title: 'مبلغ سرمایه(میلیارد ریال)',
      dataIndex: 'dossierId',
      key: 'dossierId',
      className: 'col-span-1',
    },
    {
      title: 'تاریخ پذیرش',
      dataIndex: 'dossierDate',
      key: 'dossierDate',
      className: 'col-span-1',
      render: (item: string) => <span>{convertDateToJalali(item)}</span>,
    },
    {
      title: 'تاریخ‌های هیئت پذیرش',
      dataIndex: 'dossierDate',
      key: 'dossierDate',
      className: 'col-span-1',
      render: (item: string) => <span>{convertDateToJalali(item)}نمایش</span>,
    },
    {
      title: 'شماره جلسات هیئت پذیرش',
      dataIndex: 'companyName',
      key: 'companyName',
      className: 'col-span-1',
      render: (item: string) => <span>جلسه</span>,
    },
    {
      title: 'آخرین مهلت درج',
      dataIndex: 'dossierDate',
      key: 'dossierDate',
      className: 'col-span-1',
      render: (item: string) => <span>{convertDateToJalali(item)}نمایش</span>,
    },
    {
      title: 'تاریخ درج',
      dataIndex: 'dossierDate',
      key: 'dossierDate',
      className: 'col-span-1',
      render: (item: string) => <span>{convertDateToJalali(item)}نمایش</span>,
    },
    {
      title: 'تاریخ عرضه گشایش نماد',
      dataIndex: 'dossierDate',
      key: 'dossierDate',
      className: 'col-span-1',
      render: (item: string) => <span>{convertDateToJalali(item)}نمایش</span>,
    },
  ];
  useEffect(() => {
    handleGetDossierList(1);
    handleGetDossierLevelSummary();
    handleGetDossierYears();
    handleGetAcceptanceExpertUser();
    handleGetConsultingCompanyList();
  }, []);
  useEffect(() => {
    handleGetDossierList(1);
    setState({ pageNumber: 1, pageNoCardView: 1 });
  }, [
    isCardView,
    dossierLevelTypeId,
    dossierYear,
    userRef,
    auditingCompanyRef,
  ]);
  useEffect(() => {
    setState({ dossierLevelTypeId: 'All' });
    handleGetDossierLevelSummary();
  }, [dossierYear, userRef, auditingCompanyRef]);
  const onFail = (error: any) => {
    onAlert(error);
  };
  const onChangeTablePage = (pageNo: number) => {
    setState({ pageNumber: pageNo });
    handleGetDossierList(pageNo);
  };
  const handleGetDossierList = (PageNumber?: number) => {
    const rawData = {
      PageNumber: PageNumber,
      PageSize,
      DossierLevelTypeId: dossierLevelTypeId,
      AuditingCompanyRef: auditingCompanyRef,
      UserRef: userRef,
      DossierYear: dossierYear,
    };
    const data = Object.fromEntries(
      Object.entries(rawData).filter(
        ([key, value]) => value !== '' && value !== null
      )
    );
    getDossierList({
      data,
      onSuccess: (res: any) => {
        setState({ dossierListData: res });
      },
      onFail,
    });
  };
  const onChangeCardView = (pageNoCardView: number) => {
    setState({ pageNoCardView });
    handleGetDossierList(pageNoCardView);
  };
  const handleGetDossierLevelSummary = () => {
    const rawData = {
      PageNumber: 1,
      PageSize: 100,
      AuditingCompanyRef: auditingCompanyRef,
      UserRef: userRef,
      DossierYear: dossierYear,
    };
    const data = Object.fromEntries(
      Object.entries(rawData).filter(
        ([key, value]) => value !== '' && value !== null
      )
    );
    getDossierLevelSummary({
      data,
      onSuccess: (res: any) => {
        setState({ dossierLevelSummaryData: res });
      },
      onFail,
    });
  };
  const exportDossierListToExcel = () => {
    const rawData = {
      DossierLevelTypeId: dossierLevelTypeId,
      AuditingCompanyRef: auditingCompanyRef,
      UserRef: userRef,
      DossierYear: dossierYear,
    };
    const data = Object.fromEntries(
      Object.entries(rawData).filter(
        ([key, value]) => value !== '' && value !== null
      )
    );
    exportDossierList({
      data,
      onSuccess: downloadExcelFile,
      onFail,
    });
  };
  const downloadExcelFile = (file: any) => {
    downloadFile(file, 'reportDossierList.xlsx');
  };
  const handleGetDossierYears = () => {
    getDossierYears({
      onSuccess: (res: any) =>
        setState({
          dossierYearsList: res?.map((item: any) => {
            const data = {
              name: item,
              value: item,
            };
            return data;
          }),
        }),
      onFail,
    });
  };
  const handleGetAcceptanceExpertUser = () => {
    getAcceptanceExpertUser({
      onSuccess: (res: any) =>
        setState({
          expertUserList: res,
        }),
      onFail,
    });
  };
  const handleGetConsultingCompanyList = () => {
    getConsultingCompanyList({
      onSuccess: (res: any) =>
        setState({
          companyListData: res,
        }),
      onFail,
    });
  };
  return (
    <div className="border-2 border-lightGray  grid grid-cols-12">
      <div className=" col-span-12 justify-between mx-4 items-center flex border-b-2 border-lightGray">
        <span className=" p-2 font-bold">پرونده‌های پذیرش سهام</span>
        <div className="">
          <a className="mx-4" href="listing-stock/new-dossier">
            <ListingCreateButton className="p-4" buttonName="ثبت پرونده جدید" />
          </a>
          <Icon
            name="icon-listing-1"
            classname={`cursor-pointer text-xl mx-2 ${
              isCardView ? ' text-blue' : ''
            }`}
            onClick={() =>
              setState({ isCardView: true, pageNoCardView: 1, pageNumber: 1 })
            }
          />
          <Icon
            name="icon-listing-2"
            classname={`cursor-pointer text-xl ${
              !isCardView ? ' text-blue' : ''
            }`}
            onClick={() =>
              setState({ isCardView: false, pageNumber: 1, pageNoCardView: 1 })
            }
          />
        </div>
      </div>
      <section className="col-span-12 grid grid-cols-12 m-4 gap-4">
        <SelectWithBadge
          label="مرحله پذیرش"
          className="2xl:col-span-3 xl:col-span-3 lg:col-span-6 md:col-span-6  col-span-4"
          options={[
            ...dossierLevelSummaryData,
            {
              dossierLevelName: 'همه',
              dossierLevelTypeId: '',
              dossierCount: 0,
            },
          ]}
          onChange={(value: any) => {
            console.log('value', value);
            setState({
              dossierLevelTypeId: value?.dossierLevelTypeId,
            });
          }}
          showKey="dossierLevelName"
          selectedKey="dossierLevelTypeId"
          badgeName="dossierCount"
          value={dossierLevelTypeId}
          errorMessage={state?.companyRegistrationTypeError}
          withBadge
        />
        <NewSelect
          label="سال پذیرش"
          className="2xl:col-span-3 xl:col-span-3 lg:col-span-6 md:col-span-6  col-span-4"
          options={[
            {
              name: 'همه',
              value: '',
            },
            ...dossierYearsList,
          ]}
          onChange={(value: any) =>
            setState({
              dossierYear: value,
            })
          }
          showKey="name"
          selectedKey="value"
          value={dossierYear}
        />
        <NewSelect
          label="کارشناسان"
          className="2xl:col-span-3 xl:col-span-3 lg:col-span-6 md:col-span-6  col-span-4"
          options={[
            {
              fullName: 'همه',
              userId: '',
            },
            ...expertUserList,
          ]}
          onChange={(value: any) =>
            setState({
              userRef: value,
            })
          }
          showKey="fullName"
          selectedKey="userId"
          value={userRef}
        />
        <AntdSelectSearch
          className="2xl:col-span-3 xl:col-span-3 lg:col-span-6 md:col-span-6  col-span-4"
          label="شرکت‌های مشاور"
          onChange={(value: any) => {
            if (value?.companyName !== undefined) {
              setState({
                auditingCompanyRef: value?.companyId,
              });
            } else if (value == '') {
              setState({
                companyName: null,
              });
            }
            // handleGetUserList(value, 1);
          }}
          value={auditingCompanyRef}
          data={[
            {
              companyName: 'همه',
              companyId: '',
            },
            ...companyListData,
          ]}
          showKey="companyName"
          idKey="companyId"
        />
      </section>
      {isCardView ? (
        <>
          <section className="col-span-12 grid grid-cols-12 m-4 gap-4 mt-8">
            {dossierListData?.items?.length > 0 &&
              dossierListData?.items?.map((data: any) => {
                return <ListingFileCard data={data} />;
              })}
          </section>
          <div className=" 2xl:col-span-12 xl:col-span-12 col-span-12 flex items-center justify-end my-8">
            <Pagination
              onChange={onChangeCardView}
              hideOnSinglePage
              responsive
              total={dossierListData?.totalCount}
              defaultCurrent={pageNoCardView}
              pageSize={PageSize}
              current={pageNoCardView}
            />
          </div>
        </>
      ) : (
        <section className="col-span-12  m-4  mt-8">
          <div className="col-span-12 flex justify-end my-4 ">
            <Button
              className="border border-green text-green w-[115px] "
              onClick={exportDossierListToExcel}
            >
              خروجی اکسل
            </Button>
          </div>
          <Table
            columns={tableHeader}
            className="col-span-12 grid grid-cols-12 "
            data={dossierListData?.items}
            onChangePage={onChangeTablePage}
            totalPages={dossierListData?.totalPages}
            pageSize={PageSize}
            pageNumber={pageNumber}
            disableRow
          />
        </section>
      )}
    </div>
  );
};
export default withAlert(AcceptanceFiles);
