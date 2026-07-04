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
import { getAdsBuy } from 'apps/cash-market/src/Controller/StockMarket/WholeSale';
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
  isModalVisible: false,
  wholeSaleData: {},
  modalTableData: [],
  searchText: '',
};
import { ShoppingOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';

function WholeSaleBuyAdList({ onAlert }: any) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useStates<any>(initialState);
  const {
    changePage,
    pageNo,
    pageNoCardView,
    isCardView,
    isModalVisible,
    wholeSaleData,
    modalTableData,
    searchText,
  } = state;
  const tableViewColumns: HeaderTypes[] = [
    {
      title: 'نام شرکت',
      dataIndex: 'symbolName',
      key: 'symbolName',
      className: 'col-span-1 !justify-start',
      render: (item: any) => (
        <Tooltip title={item} placement="right">
          <span>{item}</span>
        </Tooltip>
      ),
    },
    {
      title: 'نام نماد',
      dataIndex: 'symbol',
      key: 'symbol',
      className: 'col-span-1 !justify-start',
    },
    {
      title: 'نام کارگزار',
      dataIndex: 'brokerName',
      key: 'brokerName',
      className: 'col-span-1 !justify-start',
    },
    {
      title: 'شرایط واگذاری',
      dataIndex: 'wholesaleTypeName',
      key: 'wholesaleTypeName',
      className: 'col-span-1 !justify-center',
    },
    {
      title: 'تعداد کل سهام قابل واگذاری',
      dataIndex: 'tradeVolume',
      key: 'tradeVolume',
      className: 'col-span-1 !justify-center',
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'درصد کل سهام قابل واگذاری',
      dataIndex: 'tradePercent',
      key: 'tradePercent',
      className: 'col-span-1 !justify-center',
    },
    {
      title: 'قیمت پایه هر سهم(ریال)',
      dataIndex: 'basePrice',
      key: 'basePrice',
      className: 'col-span-1 !justify-center',
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'تاریخ عرضه',
      dataIndex: 'tradeDate',
      key: 'tradeDate',
      className: 'col-span-1 !justify-start',
      render: (item: any) => <span>{convertDateToJalali(item)}</span>,
    },
    {
      title: 'مهلت ارسال مدارک',
      dataIndex: 'deadlineDate',
      key: 'deadlineDate',
      className: 'col-span-1 !justify-start',
      render: (item: any) => <span>{convertDateToJalali(item)}</span>,
    },
    {
      title: 'نوع معامله',
      dataIndex: 'wholeSaleTradeTypeName',
      key: 'wholeSaleTradeTypeName',
      className: 'col-span-1 !justify-start',
    },
    {
      title: 'اطلاعات و خرید',
      dataIndex: '',
      key: '',
      className: 'col-span-1 !justify-center',
      render: (item: any, record: any) => (
        <div className="flex flex-row">
          <a
            onClick={() =>
              setState({
                isModalVisible: true,
                modalTableData: record?.wholesaleSellers,
              })
            }
            className=" font-extra-bold text-lg mx-2"
          >
            <Tooltip title="اطلاعات فروشندگان" placement="right">
              <InfoCircleOutlined className=" cursor-pointer" />
            </Tooltip>
          </a>
          <a
            href={`/stock/request-buy-wholesale?wholesaleId=${record?.id}&type=${record?.wholesaleTypeName}&orderId=${record?.orderId}&instrumentId=${record?.instrumentId}&wholesaleTypeId=${record?.wholesaleTypeId}&tradeVolume=${record?.tradeVolume}`}
            className=" font-extra-bold text-lg mx-2"
          >
            <Tooltip title="خرید">
              <ShoppingOutlined className=" cursor-pointer" />
            </Tooltip>
          </a>
        </div>
      ),
    },
  ];
  const modalColumns: HeaderTypes[] = [
    {
      title: 'فروشنده',
      dataIndex: 'sellerName',
      key: 'sellerName',
      className: 'col-span-6 !justify-start',
    },
    {
      title: 'درصد عرضه',
      dataIndex: 'cashSharePercent',
      key: 'cashSharePercent',
      className: 'col-span-5 !justify-start',
    },
  ];
  useEffect(() => {
    handleGetWholeSale();
  }, []);
  useEffect(() => {
    handleGetWholeSale();
  }, [pageNoCardView, pageNo, searchText, isCardView]);
  const handleGetWholeSale = () => {
    getAdsBuy({
      data: {
        SearchTitle: searchText,
        PageNumber: isCardView ? pageNoCardView : pageNo,
        pageSize: pageSize,
      },
      onSuccess: (res: any) => {
        setState({ wholeSaleData: res });
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
  const SellerInformationModal = () => {
    return (
      <>
        <Modal
          visible={isModalVisible}
          closable={true}
          style={{ textAlign: 'center', padding: '0px' }}
          title={'اطلاعات فروشدگان'}
          footer={null}
          centered
          width={'40%'}
          onCancel={() => setState({ isModalVisible: false })}
        >
          <div className="col-span-12  mx-4 mt-8 mb-4">
            <Table
              data={modalTableData}
              columns={modalColumns}
              wrapperClassName="!mt-4"
              // onChangePage={onChangePageModal}
              totalPages={1}
              pageSize={200}
              scroll={{ x: 'calc(200px + 50%)' }}
              className="col-span-12 grid grid-cols-12 "
            />
          </div>
        </Modal>
      </>
    );
  };

  return (
    <div className="border-2 border-lightGray w-full grid grid-cols-12">
      <div className=" col-span-12 justify-between mx-4 items-center flex border-b-2 border-lightGray">
        <span className=" p-2 font-bold">آگهی‌های عرضه عمده</span>
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
      wholeSaleData?.items != undefined &&
      wholeSaleData?.items.length > 0 ? (
        <div className=" col-span-12 gap-6 mx-4 grid 2xl:grid-cols-3 xl:grid-cols-2 grid-cols-1 mt-8 mb-4">
          {wholeSaleData?.items?.map((item: any) => {
            return (
              <div className=" col-span-1 border-2 border-lightGray rounded-lg">
                <div className="flex w-full items-center py-2  border-r-8 justify-center border-r-blue  ">
                  <span className=" text-lg font-bold ">
                    {item?.symbolName}
                  </span>
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
                  <div className="w-full flex justify-between pt-6">
                    <span className=" text-gray">تاریخ عرضه</span>
                    <span className=" font-bold">
                      {convertDateToJalali(item?.tradeDate)}
                    </span>
                  </div>
                  <div className="w-full flex justify-between pt-6">
                    <span className=" text-gray">درصد حصه نقدی</span>
                    <span className=" font-bold">{item?.cashSharePercent}</span>
                  </div>
                  <div className="w-full flex justify-between pt-6">
                    <span className=" text-gray">شرایط واگذاری</span>
                    <span className=" font-bold">
                      {item?.wholesaleTypeName}
                    </span>
                  </div>
                  <div className="w-full flex justify-between pt-6">
                    <span className=" text-gray">نوع معامله</span>
                    <span className=" font-bold">
                      {item?.wholeSaleTradeTypeName}
                    </span>
                  </div>
                  <div className="w-full flex justify-between pt-6">
                    <span className=" text-gray">نام کارگزار</span>
                    <span className=" font-bold">{item?.brokerName}</span>
                  </div>
                  <div className="w-full flex justify-between py-6">
                    <span className=" text-blue">مهلت ارسال مدارک</span>
                    <span className="text-blue font-bold">
                      {convertDateToJalali(item?.deadlineDate)}
                    </span>
                  </div>
                </div>
                <div className="w-full grid grid-cols-2 rounded-b-lg">
                  <a
                    href={`/stock/request-buy-wholesale?wholesaleId=${item?.id}&type=${item?.wholesaleTypeName}&orderId=${item?.orderId}&instrumentId=${item?.instrumentId}&wholesaleTypeId=${item?.wholesaleTypeId}&tradeVolume=${item?.tradeVolume}`}
                    className=" col-span-1 flex bg-lightGray items-center justify-center border-l-2 border-gray"
                  >
                    <span className="font-bold underline py-2">
                      درخواست خرید
                    </span>
                  </a>
                  <a
                    onClick={() =>
                      setState({
                        isModalVisible: true,
                        modalTableData: item?.wholesaleSellers,
                      })
                    }
                    className=" col-span-1 flex bg-lightGray items-center justify-center"
                  >
                    <span className="font-bold underline py-2">
                      اطلاعات فروشنده
                    </span>
                  </a>
                </div>
              </div>
            );
          })}
          {wholeSaleData?.totalCount != undefined && (
            <div className=" 2xl:col-span-3 xl:col-span-2 col-span-1 flex items-center justify-center my-8">
              <Pagination
                onChange={onChangeCardView}
                hideOnSinglePage
                responsive
                total={wholeSaleData?.totalCount}
                defaultCurrent={pageNoCardView}
                pageSize={pageSize}
                current={pageNoCardView}
              />
            </div>
          )}
        </div>
      ) : wholeSaleData?.items?.length > 0 &&
        !isCardView &&
        wholeSaleData?.items != undefined ? (
        <div className="col-span-12  mx-4 mt-8 mb-4">
          <Table
            data={wholeSaleData?.items}
            columns={tableViewColumns}
            wrapperClassName="!mt-4"
            onChangePage={onChangePage}
            totalPages={wholeSaleData?.totalCount / pageSize}
            pageSize={pageSize}
            pageNumber={pageNo}
            className="col-span-12 grid grid-cols-12 "
          />
        </div>
      ) : wholeSaleData?.items == undefined ||
        wholeSaleData?.items.length == 0 ? (
        <div className="col-span-4 col-start-4 flex items-center justify-center p-10 mt-10">
          <Image src={noDataImage} />
        </div>
      ) : null}
      <SellerInformationModal />
    </div>
  );
}
export default withAlert(WholeSaleBuyAdList);
