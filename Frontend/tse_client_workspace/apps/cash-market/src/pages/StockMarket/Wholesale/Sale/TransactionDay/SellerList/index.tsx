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
  exportWholesaleSeller,
  getTransactionDayDetail,
  getWholeSale,
} from 'apps/cash-market/src/Controller/StockMarket/WholeSale';
import { InqueryDataModal } from './InqueryModal';
import { AbilityDataModal } from './AbilityModal';

const initialState = {
  detailData: null,
  transactionBuyers: null,
  isInqueryModalVisible: false,
  wholesaleBuyerInfoId: '',
  isAbilityModalVisible: false,
  personTypeId: '',
};

function TransactionSellerList({ onAlert }: any) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useStates<any>(initialState);
  const {
    detailData,
    transactionBuyers,
    isInqueryModalVisible,
    wholesaleBuyerInfoId,
    isAbilityModalVisible,
    personTypeId,
  } = state;
  const orderId = searchParams.get('id') != null ? searchParams.get('id') : '';
  const wholesaleId =
    searchParams.get('wholesaleId') != null
      ? searchParams.get('wholesaleId')
      : '';
  const sellerColumns: HeaderTypes[] = [
    {
      title: 'نام کارگزار',
      dataIndex: 'fundName',
      key: 'fundName',
      className: 'col-span-3 !justify-start',
    },
    {
      title: 'نوع شخصیت',
      dataIndex: 'personTypeName',
      key: 'personTypeName',
      className: 'col-span-1 !justify-center',
    },
    {
      title: 'نام متقاضی',
      dataIndex: 'fullName',
      key: 'fullName',
      className: 'col-span-1 !justify-center',
    },
    {
      title: 'کد ملی/شناسه شرکت',
      dataIndex: 'buyerCode',
      key: 'buyerCode',
      className: 'col-span-1 !justify-center',
    },
    {
      title: 'تعداد سهام یا حق تقدم سهام مورد تقاضا',
      dataIndex: 'buyCount',
      key: 'buyCount',
      className: 'col-span-2 !justify-center',
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'درصد از کل سرمایه(سهام)پایه شرکت',
      dataIndex: 'buyPercent',
      key: 'buyPercent',
      className: 'col-span-1 !justify-center',
    },
    {
      title: 'استعلام',
      dataIndex: 'hasInquiry',
      className: 'col-span-1 !justify-center',
      key: 'hasInquiry',
      render: (item: any, record: any) => (
        <Icon
          name="icon-search-estelaam"
          classname={`text-lg cursor-pointer`}
          onClick={() => {
            setState({
              isInqueryModalVisible: true,
              wholesaleBuyerInfoId: record?.buyerInfoId,
            });
          }}
        />
      ),
    },
    {
      title: 'تمکن مالی',
      dataIndex: 'hasAbility',
      className: 'col-span-1 !justify-center',
      key: 'hasAbility',
      render: (item: any, record: any) => (
        <Icon
          name="icon-wallet-info"
          classname={` text-lg cursor-pointer`}
          onClick={() => {
            setState({
              isAbilityModalVisible: true,
              wholesaleBuyerInfoId: record?.buyerInfoId,
              personTypeId: record?.personTypeId,
            });
          }}
        />
      ),
    },
  ];
  useEffect(() => {
    handleGetTransactionDayDetail();
  }, []);
  const handleGetTransactionDayDetail = () => {
    const data = {
      WholesaleId: wholesaleId,
    };
    getTransactionDayDetail({
      data: data,
      onSuccess: (res: any) => {
        setState({
          detailData: res?.transactionDay,
          transactionBuyers: res?.transactionBuyers,
        });
      },
      onFail,
    });
  };
  const handleExportWholesaleSeller = () => {
    const data = {
      WholesaleId: wholesaleId,
    };
    exportWholesaleSeller({
      data,
      onSuccess: downloadExportFile,
      onFail,
    });
  };
  const downloadExportFile = (file: any) => {
    downloadFile(file, `wholesaleSellerList.xlsx`);
  };
  const onFail = (error: any) => {
    onAlert(error);
  };
  const onChangeState = (key: string, value: string) => {
    setState({
      [key]: value,
    });
  };

  return (
    <div className="border-2 border-lightGray w-full grid grid-cols-12">
      <div className=" col-span-12 items-start flex mt-2 mx-4">
        <span className=" p-2 font-bold text-blue underline">
          اطلاعات عرضه :
        </span>
      </div>
      <div className="grid col-span-12 grid-cols-10 gap-4 justify-between mx-4 shadow-md p-4">
        <div className="col-span-2 flex flex-col my-2">
          <span className=" font-bold">نماد :</span>
          <span className=" py-2 ">{detailData?.symbol}</span>
        </div>
        <div className="col-span-2 flex flex-col my-2">
          <span className=" font-bold">نام شرکت :</span>
          <span className=" py-2 ">{detailData?.companyName}</span>
        </div>
        <div className="col-span-2 flex flex-col my-2">
          <span className=" font-bold">تعداد کل سهام شرکت :</span>
          <span className=" py-2 ">
            {separator(detailData?.tradeTotalNumber)}
          </span>
        </div>
        <div className="col-span-2 flex flex-col my-2">
          <span className=" font-bold">تعداد سهام قابل عرضه :</span>
          <span className=" py-2 ">{separator(detailData?.tradeVolume)}</span>
        </div>
        <div className="col-span-2 flex flex-col my-2">
          <span className=" font-bold">درصد سهام قابل عرضه :</span>
          <span className=" py-2 ">{detailData?.tradePercent}</span>
        </div>
        <div className="col-span-2 flex flex-col my-2">
          <span className=" font-bold">قیمت پایه :</span>
          <span className=" py-2 ">{separator(detailData?.basePrice)}</span>
        </div>
        <div className="col-span-2 flex flex-col my-2">
          <span className=" font-bold">تاریخ عرضه :</span>
          <span className=" py-2 ">
            {convertDateToJalali(detailData?.tradeDate)}
          </span>
        </div>
      </div>
      <div className="grid col-span-12 grid-cols-12 gap-4 justify-between mx-4">
        <div className=" col-span-12 justify-between flex mt-2">
          <span className=" p-2 font-bold text-blue underline">
            لیست متقاضیان :
          </span>
          <a
            className="border border-blue items-center justify-center p-2 rounded"
            onClick={handleExportWholesaleSeller}
          >
            <Icon name="icon-download text-blue text-md" />
            <span className=" p-2 font-bold text-blue">
              دانلود لیست متقاضیان
            </span>
          </a>
        </div>
        <div className="col-span-12 mb-4">
          <Table
            columns={sellerColumns}
            className="col-span-12 grid grid-cols-12 text-center"
            dataSource={transactionBuyers}
            pageSize={1000}
            scrollX={300}
          />
        </div>
        <div className="col-span-12 flex justify-end mb-4">
          <a
            href="/transaction/transaction-day-list"
            className="border-blue border text-blue w-[120px] h-[35px]  flex items-center justify-center rounded"
            // onClick={onConfirm}
          >
            بازگشت
          </a>
        </div>
      </div>
      <InqueryDataModal
        isOpen={isInqueryModalVisible}
        onAlert={onAlert}
        onChangeState={onChangeState}
        wholesaleBuyerInfoId={wholesaleBuyerInfoId}
      />
      <AbilityDataModal
        isOpen={isAbilityModalVisible}
        onChangeState={onChangeState}
        onAlert={onAlert}
        wholesaleBuyerInfoId={wholesaleBuyerInfoId}
        personTypeId={personTypeId}
      />
    </div>
  );
}
export default withAlert(TransactionSellerList);
