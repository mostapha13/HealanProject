import withAlert from 'apps/cash-market/src/hoc/withAlert';
import {
  useStates,
  useEffect,
  useState,
  useNavigate,
  useSearchParams,
} from '@tse/utils';
import { Button, TextField, Icon, Image } from '@tse/components/atoms';
import {
  convertDateAndTime,
  convertDateAndTimeJalali,
  convertDateAndTimeToJalali,
  convertDateToJalali,
  downloadFile,
  loadFromStorage,
  separator,
} from '@tse/tools';
import {} from 'apps/cash-market/src/Controller';
import { HeaderTypes } from '@tse/types';
import { Table } from '@tse/components/organism';
import {
  getAdsBuy,
  getTransactionDay,
} from 'apps/cash-market/src/Controller/StockMarket/WholeSale';
import { FILE_BASE_URL } from 'apps/cash-market/src/constants';
import { AutoCompleteInput } from 'apps/cash-market/src/components/AutoCompleteInput';
import { SearchInput } from '@tse/components/molecules';
import { Modal, Pagination } from 'antd';
import noDataImage from 'apps/cash-market/src/assets/images/noData.png';
const pageSize = 6;
const initialState = {
  isCardView: true,
  changePage: 'request',
  pageNo: 1,
  pageNoCardView: 1,
  wholeSaleData: {},
  modalTableData: [],
  searchText: '',
};

function TransactionDayList({ onAlert }: any) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useStates<any>(initialState);
  const {
    changePage,
    pageNo,
    pageNoCardView,
    isCardView,
    transactionDayData,
    modalTableData,
    searchText,
  } = state;
  const tableViewColumns: HeaderTypes[] = [
    {
      title: 'نام نماد',
      dataIndex: 'symbol',
      key: 'symbol',
      className: 'col-span-2 !justify-start',
    },
    {
      title: 'تعداد کل سهام قابل واگذاری',
      dataIndex: 'tradeVolume',
      key: 'tradeVolume',
      className: 'col-span-2 !justify-center',
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'درصد کل سهام قابل واگذاری',
      dataIndex: 'tradePercent',
      key: 'tradePercent',
      className: 'col-span-2 !justify-center',
    },
    {
      title: 'قیمت پایه هر سهم(ریال)',
      dataIndex: 'basePrice',
      key: 'basePrice',
      className: 'col-span-2 !justify-center',
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'تاریخ عرضه',
      dataIndex: 'tradeDate',
      key: 'tradeDate',
      className: 'col-span-2 !justify-start',
      render: (item: any) => <span>{convertDateToJalali(item)}</span>,
    },
    {
      title: 'لیست متقاضیان',
      dataIndex: 'tradeDate',
      key: 'tradeDate',
      className: 'col-span-1 !justify-start',
      render: (item: any, record: any) => (
        <a
          className="font-extra-bold text-2xl items-center justify-center"
          href={`/transaction/transaction-day-seller?id=${record?.orderId}&wholesaleId=${record?.id}`}
        >
          ...
        </a>
      ),
    },
  ];
  useEffect(() => {
    handleGetTransactionDay();
  }, []);
  useEffect(() => {
    handleGetTransactionDay();
  }, [pageNoCardView, pageNo, searchText, isCardView]);
  const handleGetTransactionDay = () => {
    getTransactionDay({
      data: {
        Title: searchText,
        PageNumber: isCardView ? pageNoCardView : pageNo,
        pageSize: pageSize,
      },
      onSuccess: (res: any) => {
        setState({ transactionDayData: res });
      },
      onFail,
    });
  };

  const onFail = (error: any) => {
    onAlert(error);
  };
  const onChangePage = (pageNo: number) => {
    setState({
      pageNo,
    });
  };
  const onChangeCardView = (pageNoCardView: number) => {
    setState({ pageNoCardView });
  };
  const onSearch = (text: string) => {
    setState({
      searchText: text,
      pageNo: 1,
      pageNoCardView: 1,
    });
  };

  return (
    <div className="border-2 border-lightGray w-full grid grid-cols-12">
      <div className=" col-span-12 justify-between mx-4 items-center flex border-b-2 border-lightGray">
        <span className=" p-2 font-bold">متقاضی خرید</span>
        <div className="">
          <Icon
            name="icon-listing-1"
            classname={`cursor-pointer text-xl mx-2 ${
              isCardView ? ' text-blue' : ''
            }`}
            onClick={() => setState({ isCardView: true, pageNoCardView: 1 })}
          />
          <Icon
            name="icon-listing-2"
            classname={`cursor-pointer text-xl ${
              !isCardView ? ' text-blue' : ''
            }`}
            onClick={() => setState({ isCardView: false, pageNo: 1 })}
          />
        </div>
      </div>
      <div className="flex col-span-12 items-center justify-center !mt-6">
        <SearchInput
          className="w-[30%]"
          onChange={onSearch}
          value={searchText}
        />
      </div>
      {isCardView &&
      transactionDayData?.items != undefined &&
      transactionDayData?.items.length > 0 ? (
        <div className=" col-span-12 gap-6 mx-4 grid 2xl:grid-cols-3 xl:grid-cols-2 grid-cols-1 mt-8 mb-4">
          {transactionDayData?.items?.map((item: any) => {
            return (
              <div className=" col-span-1 border-2 border-lightGray rounded-lg">
                <div className="flex w-full items-center py-2  border-r-8 justify-center border-r-blue  ">
                  <span className=" text-lg font-bold ">{item?.symbol}</span>
                </div>
                <div className="w-full flex flex-col px-2 border-t-2 border-t-lightGray">
                  <div className="w-full flex justify-between pt-6">
                    <span className=" text-gray">
                      تعداد کل سهام قابل واگذاری
                    </span>
                    <span className=" font-bold">
                      {separator(item?.tradeVolume)}
                    </span>
                  </div>
                  <div className="w-full flex justify-between pt-6">
                    <span className=" text-gray">
                      درصد کل سهام قابل واگذاری
                    </span>
                    <span className=" font-bold">{item?.tradePercent}</span>
                  </div>
                  <div className="w-full flex justify-between pt-6">
                    <span className=" text-gray">قیمت پایه هر سهم(ریال)</span>
                    <span className=" font-bold">
                      {separator(item?.basePrice)}
                    </span>
                  </div>
                  <div className="w-full flex justify-between pt-6 py-6">
                    <span className=" text-gray">تاریخ عرضه</span>
                    <span className=" font-bold">
                      {convertDateToJalali(item?.tradeDate)}
                    </span>
                  </div>
                </div>
                <div className="w-full grid grid-cols-1 rounded-b-lg">
                  <a
                    href={`/transaction/transaction-day-seller?id=${item?.orderId}&wholesaleId=${item?.id}`}
                    className=" col-span-1 flex bg-lightGray items-center justify-center"
                  >
                    <span className="font-bold underline py-2">
                      لیست متقاضیان
                    </span>
                  </a>
                </div>
              </div>
            );
          })}
          {transactionDayData?.totalCount != undefined && (
            <div className=" 2xl:col-span-3 xl:col-span-2 col-span-1 flex items-center justify-center my-8">
              <Pagination
                onChange={onChangeCardView}
                hideOnSinglePage
                responsive
                total={transactionDayData?.totalCount}
                defaultCurrent={pageNoCardView}
                pageSize={pageSize}
                current={pageNoCardView}
              />
            </div>
          )}
        </div>
      ) : transactionDayData?.items?.length > 0 &&
        !isCardView &&
        transactionDayData?.items != undefined ? (
        <div className="col-span-12  mx-4 mt-8 mb-4">
          <Table
            data={transactionDayData?.items}
            columns={tableViewColumns}
            wrapperClassName="!mt-4"
            onChangePage={onChangePage}
            totalPages={transactionDayData?.totalCount / pageSize}
            pageSize={pageSize}
            pageNumber={pageNo}
            className="col-span-12 grid grid-cols-12 "
          />
        </div>
      ) : transactionDayData?.items == undefined ||
        transactionDayData?.items.length == 0 ? (
        <div className="col-span-4 col-start-4 flex items-center justify-center p-10 mt-10">
          <Image src={noDataImage} />
        </div>
      ) : null}
    </div>
  );
}
export default withAlert(TransactionDayList);
