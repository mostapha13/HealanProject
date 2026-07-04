import withAlert from 'apps/cash-market/src/hoc/withAlert';
import {
  useStates,
  useEffect,
  useState,
  useNavigate,
  useSearchParams,
} from '@tse/utils';
import ImageUploadPreview from 'apps/cash-market/src/components/ImageUploadPreview';
import { Button, TextField, Modal } from '@tse/components/atoms';
import {
  convertDateAndTime,
  convertDateAndTimeJalali,
  convertDateAndTimeToJalali,
  convertDateToJalali,
  downloadFile,
  loadFromStorage,
  separator,
} from '@tse/tools';
import {
  getOrderWorkFlow,
  getInitialSupplyByOrderId,
  initialSupplyConfirm,
  initialSupplyReject,
  exportInitialSupplyNotification,
} from 'apps/cash-market/src/Controller';
import { Radio } from 'antd';
import type { RadioChangeEvent } from 'antd';
import WorkFlow from 'apps/cash-market/src/components/PageFeature/WorkFlow';
import { HeaderTypes } from '@tse/types';
import { Table } from '@tse/components/organism';
import { getWholeSale } from 'apps/cash-market/src/Controller/StockMarket/WholeSale';
import { FILE_BASE_URL } from 'apps/cash-market/src/constants';
const initialState = {
  changePage: 'request',
  pageNo: 1,
  wholeSaleCashData: {},
  workFlow: null,
  wholesaleSellerFiles: [],
  sumOfCashSharePercent: '',
  isCondition: false,
};
function WholeSaleSellRequestTracking({ onAlert }: any) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useStates<any>(initialState);
  const [uploadFileListItemOthers, setUploadFileListItemOthers] = useState<any>(
    []
  );
  const {
    changePage,
    wholeSaleCashData,
    workFlow,
    wholesaleSeller,
    sumOfCashSharePercent,
    isCondition,
  } = state;
  const orderId =
    searchParams.get('id') != null ? searchParams.get('id') : null;
  const sellerColumns: HeaderTypes[] = [
    {
      title: 'شناسه',
      dataIndex: 'tableId',
      className: 'col-span-1 !justify-start',
      key: 'tableId',
    },
    {
      title: 'حقیقی/حقوقی',
      dataIndex: 'personTypeName',
      className: 'col-span-2 !justify-start',
      key: 'personTypeName',
    },
    {
      title: 'نام عرضه کننده',
      dataIndex: 'sellerName',
      className: 'col-span-2 !justify-start',
      key: 'sellerName',
    },
    {
      title: 'نام خانوادگی/نام شرکت',
      dataIndex: 'sellerFamily',
      className: 'col-span-2 !justify-start',
      key: 'sellerFamily',
    },
    {
      title: 'کد بورسی',
      dataIndex: 'sellerCode',
      className: 'col-span-1 !justify-start',
      key: 'sellerCode',
    },
    {
      title: 'تعداد سهم',
      dataIndex: 'shareCount',
      className: 'col-span-1 !justify-start',
      key: 'shareCount',
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'درصد فروش از کل معامله',
      dataIndex: 'cashSharePercent',
      className: 'col-span-2 !justify-start',
      key: 'cashSharePercent',
    },
  ];
  const columns: HeaderTypes[] = [
    {
      title: 'کاربر ',
      dataIndex: 'marketUserName',
      key: 'marketUserName',
      className: 'col-span-2',
    },
    {
      title: 'نوع پیام ',
      dataIndex: 'isPrivate',
      key: 'isPrivate',
      className: 'col-span-2',
      render: (item: any) => <span>{item === true ? 'خصوصی' : 'عمومی'}</span>,
    },
    {
      title: 'تاریخ ',
      dataIndex: 'commentDate',
      key: 'commentDate',
      className: 'col-span-2',
      render: (item: any) => <span>{convertDateAndTimeToJalali(item)}</span>,
    },
    {
      title: 'پیام ',
      dataIndex: 'comment',
      key: 'comment',
      className: 'col-span-5',
    },
  ];
  const sellerDocumentType: HeaderTypes[] = [
    {
      title: 'گیرنده نامه',
      dataIndex: 'permitNo',
      className: 'col-span-3 !justify-start',
      key: 'permitNo',
    },
    {
      title: 'شماره نامه',
      dataIndex: 'permitNo',
      className: 'col-span-2 !justify-start',
      key: 'permitNo',
    },
    {
      title: 'تاریخ نامه',
      dataIndex: 'permitDate',
      className: 'col-span-3 !justify-start',
      key: 'permitDate',
      render: (item: string) => <span>{convertDateToJalali(item)}</span>,
    },
    {
      title: 'فایل',
      dataIndex: 'permitFile',
      className: 'col-span-3 !justify-start',
      key: 'permitFile',
      render: (item: any) => (
        <a
          target="_blank"
          rel="noreferrer"
          href={`${FILE_BASE_URL}Download/${item}`}
        >
          <span>دانلود فایل ضمیمه</span>
        </a>
      ),
    },
  ];

  useEffect(() => {
    handleGetWholeSale(orderId);
    getWorkFlow();
  }, []);
  useEffect(() => {
    let uploadFileListItemOthers: any = [];
    wholesaleSeller?.forEach((data: any) => {
      data?.wholesaleSellerFiles?.forEach((file: any) => {
        uploadFileListItemOthers.push(file);
      });
    });
    setUploadFileListItemOthers(uploadFileListItemOthers);
  }, [wholesaleSeller]);
  useEffect(() => {
    const sumOfCashSharePercent = wholesaleSeller?.reduce(
      (acc: any, curr: any) => acc + parseFloat(curr.cashSharePercent),
      0
    );
    setState({
      sumOfCashSharePercent: sumOfCashSharePercent,
    });
  }, [wholesaleSeller]);
  const handleGetWholeSale = (orderId: any) => {
    getWholeSale({
      orderId: orderId,
      onSuccess: (item) => {
        setState({
          wholeSaleCashData: item,
          wholesaleSeller: item?.wholesaleSellers,
        });
        if (item?.wholesaleTypeId == '25e89117-17a8-465d-a1fb-2f1a80888773') {
          setState({ isCondition: true });
        }
      },
      onFail,
    });
  };
  const getWorkFlow = () => {
    const data = {
      OrderId: orderId,
    };
    getOrderWorkFlow({ data, onSuccess: onSuccessWorkFlow, onFail });
  };

  const onSuccessWorkFlow = (res: any) => {
    setState({
      workFlow: res,
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
  const handleModeChange = (e: RadioChangeEvent) => {
    setState({ changePage: e.target.value });
  };

  return (
    <div>
      <div className="border-2 border-lightGray">
        <div className="my-1">
          <Radio.Group onChange={handleModeChange} value={changePage}>
            <Radio.Button value="request">فرآیند فعلی</Radio.Button>
            <Radio.Button value="workflow">گردش کار</Radio.Button>
          </Radio.Group>
        </div>
        {changePage == 'request' && (
          <div className="w-full grid grid-cols-10 ">
            <div className=" col-span-10 items-start flex border-b-2  justify-between bg-lightGray border-lightGray  px-4">
              <div className=" flex flex-row">
                <span className=" p-2 font-bold ">درخواست :</span>
                <span className=" p-2  ">
                  {wholeSaleCashData?.workFlowName}
                </span>
              </div>
              <div className=" flex flex-row">
                <span className=" p-2 font-bold ">کد پیگیری :</span>
                <span className=" p-2  ">
                  {wholeSaleCashData?.trackingNumber}
                </span>
              </div>
              <div className=" flex flex-row">
                <span className=" p-2 font-bold ">وضعیت :</span>
                <span className=" p-2  ">
                  {wholeSaleCashData?.orderStatusName}
                </span>
              </div>
            </div>
            <div className="col-span-10 gap-4 justify-between mt-2 ">
              <div className=" col-span-10 items-start flex mt-2">
                <span className=" p-2 font-bold text-blue underline">
                  مکاتبات :
                </span>
              </div>
              <div className="mx-4">
                <Table
                  columns={sellerDocumentType}
                  className="col-span-10 grid grid-cols-12 text-center"
                  dataSource={wholeSaleCashData?.wholeSaleDocumentTypes}
                  pageSize={1000}
                  scrollX={300}
                />
              </div>
            </div>
            <div className="grid col-span-10 grid-cols-10 gap-4 justify-between mx-4 mt-2 ">
              <div className="col-span-2 flex flex-row items-center ">
                <div className=" font-bold w-4 h-4 bg-blue rounded-full" />
                <span className=" py-2 mx-2">
                  {wholeSaleCashData?.wholesaleTradeTypesName}
                </span>
              </div>
            </div>
            <div className="grid col-span-10 grid-cols-10 gap-4 justify-between mx-4 mt-2">
              <div className="col-span-2 flex flex-row items-center ">
                <div className=" font-bold w-4 h-4 bg-blue rounded-full" />
                <span className=" py-2 mx-2">
                  {wholeSaleCashData?.wholesaleTypeName}
                </span>
              </div>
            </div>
            <div className=" col-span-10 items-start flex mt-2">
              <span className=" p-2 font-bold text-blue underline">
                اطلاعات عرضه :
              </span>
            </div>
            <div className="grid col-span-10 grid-cols-10 gap-4 justify-between mx-4">
              <div className="col-span-2 flex flex-col my-2">
                <span className=" font-bold">نماد :</span>
                <span className=" py-2 ">{wholeSaleCashData?.symbol}</span>
              </div>
              <div className="col-span-2 flex flex-col my-2">
                <span className=" font-bold">نام شرکت :</span>
                <span className=" py-2 ">{wholeSaleCashData?.symbolName}</span>
              </div>
              <div className="col-span-2 flex flex-col my-2">
                <span className=" font-bold">تعداد کل سهام شرکت :</span>
                <span className=" py-2 ">
                  {separator(wholeSaleCashData?.tradeTotalNumber)}
                </span>
              </div>
              <div className="col-span-2 flex flex-col my-2">
                <span className=" font-bold">تعداد سهام قابل عرضه :</span>
                <span className=" py-2 ">
                  {separator(wholeSaleCashData?.tradeVolume)}
                </span>
              </div>
              <div className="col-span-2 flex flex-col my-2">
                <span className=" font-bold">درصد سهام قابل عرضه :</span>
                <span className=" py-2 ">
                  {wholeSaleCashData?.cashSharePercent}
                </span>
              </div>
              <div className="col-span-2 flex flex-col my-2">
                <span className=" font-bold">قیمت پایه :</span>
                <span className=" py-2 ">
                  {separator(wholeSaleCashData?.basePrice)}
                </span>
              </div>
              {isCondition && (
                <div className="col-span-2 flex flex-col my-2">
                  <span className=" font-bold">درصد حصه نقدی :</span>
                  <span className=" py-2 ">
                    {separator(wholeSaleCashData?.cashSharePercent)}
                  </span>
                </div>
              )}
              <div className="col-span-2 flex flex-col my-2">
                <span className=" font-bold">تاریخ عرضه :</span>
                <span className=" py-2 ">
                  {convertDateToJalali(wholeSaleCashData?.tradeDate)}
                </span>
              </div>
            </div>

            <div className="grid col-span-10 grid-cols-10 gap-4  justify-between mx-4 mt-4">
              <div className=" col-span-10 items-start flex mt-2 ">
                <span className=" p-2 font-bold text-blue underline">
                  اطلاعات عرضه کنندگان :
                </span>
              </div>

              <div className="col-span-10 py-2 pl-4">
                <div className=" col-span-10 flex flex-row justify-end">
                  <span>مجموع تعداد : {wholesaleSeller?.length} </span>
                  <span className="mx-2 font-extra-bold"> | </span>
                  <span>مجموع درصد از کل سرمایه : {sumOfCashSharePercent}</span>
                </div>
                <Table
                  columns={sellerColumns}
                  className="col-span-10 grid grid-cols-12 text-center"
                  dataSource={wholeSaleCashData?.wholesaleSellers}
                  pageSize={1000}
                  scrollX={300}
                />
              </div>
            </div>
            <div className="grid col-span-10 grid-cols-10 gap-4  justify-between mx-4 mt-4">
              <div className=" col-span-10 items-start flex  ">
                <span className="  font-bold text-blue underline">
                  اطلاعات رابط :
                </span>
              </div>
              <div className="col-span-2 flex flex-col">
                <span className=" font-bold">نام و نام خانوادگی :</span>
                <span className=" py-2 ">
                  {wholeSaleCashData?.responsibleName}
                </span>
              </div>
              <div className="col-span-2 flex flex-col">
                <span className=" font-bold">سمت :</span>
                <span className=" py-2 ">
                  {wholeSaleCashData?.responsiblePost}
                </span>
              </div>
              <div className="col-span-2 flex flex-col">
                <span className=" font-bold">شماره همراه :</span>
                <span className=" py-2 ">
                  {wholeSaleCashData?.responsibleMobile}
                </span>
              </div>
            </div>
            {wholeSaleCashData?.message?.length > 0 && (
              <div className="grid col-span-10 grid-cols-12 gap-4  justify-between mx-4 mt-4">
                <div className=" col-span-12 items-start flex  ">
                  <span className="  font-bold text-blue underline">
                    توضیحات :
                  </span>
                </div>
                <div className=" col-span-12  pb-4">
                  <Table
                    data={wholeSaleCashData?.message}
                    columns={columns}
                    wrapperClassName="!mt-4"
                    onChangePage={onChangePage}
                    totalPages={1}
                    pageSize={10}
                    className="col-span-12 grid grid-cols-12 "
                  />
                </div>
              </div>
            )}
            <div className="grid col-span-10 grid-cols-10 gap-4  justify-between mx-4 mt-4 ">
              <div className=" col-span-10 items-start flex  ">
                <span className="  font-bold text-blue underline">مدارک :</span>
              </div>
              <div className=" col-span-10 grid grid-cols-4 pb-4 bg-[#EEEBFF] mb-4 px-4">
                {wholeSaleCashData?.publicFiles?.length > 0 &&
                  wholeSaleCashData?.publicFiles?.map(
                    (item: any, index: any) => (
                      <ImageUploadPreview
                        className="2xl:col-span-1 xl:col-span-2 lg:col-span-2 md:col-span-4  col-span-1"
                        data={item}
                        onAlert={onAlert}
                      />
                    )
                  )}
              </div>
            </div>
            <div className="grid col-span-10 grid-cols-10 gap-4  justify-between mx-4 mt-4 ">
              <div className=" col-span-10 items-start flex  ">
                <span className="  font-bold text-blue underline">
                  مدارک و مستندات عرضه کننده :
                </span>
              </div>
              {uploadFileListItemOthers?.length > 0 &&
                wholeSaleCashData?.wholesaleSellers?.map(
                  (parentItem: any, index: any) => (
                    <div className="grid col-span-10 grid-cols-12 gap-4  justify-between  mt-4 mb-4 bg-[#EEEBFF]">
                      <div className="col-span-12">
                        <span className=" font-bold m-4">{`${parentItem?.sellerFamily} `}</span>
                      </div>

                      <div className=" col-span-12 grid grid-cols-4 pb-4  mb-4 px-4">
                        {uploadFileListItemOthers?.map(
                          (item: any, index: any) =>
                            item?.tableId === parentItem?.tableId && (
                              <ImageUploadPreview
                                className="2xl:col-span-1 xl:col-span-2 lg:col-span-2 md:col-span-4  col-span-1"
                                data={item}
                                onAlert={onAlert}
                              />
                            )
                        )}
                      </div>
                    </div>
                  )
                )}
            </div>
          </div>
        )}
      </div>
      {changePage == 'workflow' && <WorkFlow data={workFlow} />}
      {changePage != 'workflow' ? (
        <div className="flex justify-end my-4">
          <a
            href="/cartable"
            className="border-blue border ml-4 text-blue w-[120px] h-[35px]  flex items-center justify-center rounded"
            // onClick={onConfirm}
          >
            بازگشت
          </a>
        </div>
      ) : null}
    </div>
  );
}
export default withAlert(WholeSaleSellRequestTracking);
