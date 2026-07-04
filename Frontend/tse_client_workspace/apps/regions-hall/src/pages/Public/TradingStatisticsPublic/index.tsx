import { Button, Select, Image, Icon } from '@tse/components/atoms';
import type { ErrorType, HeaderTypes, onAlertProps } from '@tse/types';
import { useEffect, useState, useStates } from '@tse/utils';
import withAlert from '../../../hoc/withAlert';
import excelLogo from '../../../assets/images/ExcelLogo.png';
import { getTradingStatistics } from './service';
import {
  loadFromStorage,
  monthGenerator,
  lastYearsGenerator,
  separator,
} from '@tse/tools';
import * as _ from 'lodash';
import { fileBaseUrl } from '../../../constants';
import { Table } from '@tse/components/organism';
import { baseUrl } from '../../../constants';

interface TalarStatisticsPublicTypes {
  onAlert: onAlertProps;
}
const initialState = {
  sumOfBuyVolume: '',
  sumOfSellVolume: '',
  sumOfBuyValue: '',
  sumOfSellValue: '',
  sumOfBuyCount: '',
  sumOfSellCount: '',
};
const PageSize = 12;
function TradingStatisticsPublic({ onAlert }: TalarStatisticsPublicTypes) {
  const [isLoading, setLoading] = useState<boolean>(false);
  const [changeYear, setChangeYear] = useState<string>('1403');
  const [tradingDetails, setTradingDetails] = useState<any>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<string>('StockMarket');
  const talarData = loadFromStorage('hasProvince');
  const talarId = talarData?.guid || '';
  const [state, setState] = useStates<any>(initialState);
  const {
    sumOfBuyVolume,
    sumOfSellVolume,
    sumOfBuyValue,
    sumOfSellValue,
    sumOfBuyCount,
    sumOfSellCount,
  } = state;

  const tableHeader: HeaderTypes[] = [
    {
      title: 'کد ماه',
      dataIndex: 'month',
      key: 'month',
      className: 'col-span-1 !justify-center',
    },
    {
      title: 'شرح فارسی ماه',
      dataIndex: 'month',
      key: 'month',
      className: 'col-span-1 !justify-center',
      render: (item: any) => persianMonth(item),
    },
    {
      title: 'حجم خرید',
      dataIndex: 'buyVolume',
      key: 'buyVolume',
      className: 'col-span-2 !justify-center',
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'حجم فروش',
      dataIndex: 'sellVolume',
      key: 'sellVolume',
      className: 'col-span-2 !justify-center',
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'ارزش خرید',
      dataIndex: 'buyValue',
      key: 'buyValue',
      className: 'col-span-2 !justify-center',
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'ارزش فروش',
      dataIndex: 'sellValue',
      key: 'sellValue',
      className: 'col-span-2 !justify-center',
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'دفعات خرید',
      dataIndex: 'buyCount',
      key: 'buyCount',
      className: 'col-span-1 !justify-center',
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'دفعات فروش',
      dataIndex: 'sellCount',
      key: 'sellCount',
      className: 'col-span-1 !justify-center',
      render: (item: any) => <span>{separator(item)}</span>,
    },
  ];
  const market = [
    {
      id: 'StockMarket',
      title: 'بازار سهام',
    },
    {
      id: 'DebtSecuritiesMarket',
      title: 'بازار اوراق بدهی',
    },
    {
      id: 'DerivativeSecuritiesMarket',
      title: 'بازار اوراق مشتقه',
    },
    {
      id: 'ProfessionalInvestmentMarket',
      title: 'بازار سرمایه‌گذاری حرفه‌ای',
    },
    {
      id: 'InvestmentFundsMarket',
      title: 'بازار صندوق‌های سرمایه‌گذاری',
    },
    {
      id: 'Total',
      title: 'مجموع تمامی بازارها',
    },
  ];
  useEffect(() => {
    handleGetTradingStatistics(changeYear, selectedCategory);
  }, [changeYear, selectedCategory]);

  const onChangeYear = (item: string) => {
    setChangeYear(item);
  };
  function handleGetTradingStatistics(year: string, type: string) {
    setLoading(true);
    const talarData = loadFromStorage('hasProvince');
    const guid = talarData?.guid || '';
    getTradingStatistics({
      year: year,
      id: guid,
      type: type,
      onSuccess: (res) => {
        // const merged = _.merge(
        //   _.keyBy(res?.lst, 'tr_Month'),
        //   _.keyBy(monthGenerator(), 'value')
        // );
        // const values = _.values(merged);
        onSuccess(res);
      },
      onFail,
    });
  }
  const onFail = (error: ErrorType) => {
    setLoading(false);
    onAlert(error);
  };
  const onSuccess = (res: any) => {
    setTradingDetails(res);
    setLoading(false);
    const sumOfBuyVolume = res?.reduce(
      (acc: any, curr: any) => acc + parseFloat(curr.buyVolume),
      0
    );
    const sumOfSellVolume = res?.reduce(
      (acc: any, curr: any) => acc + parseFloat(curr.sellVolume),
      0
    );
    const sumOfBuyValue = res?.reduce(
      (acc: any, curr: any) => acc + parseFloat(curr.buyValue),
      0
    );
    const sumOfSellValue = res?.reduce(
      (acc: any, curr: any) => acc + parseFloat(curr.sellValue),
      0
    );
    const sumOfBuyCount = res?.reduce(
      (acc: any, curr: any) => acc + parseFloat(curr.buyCount),
      0
    );
    const sumOfSellCount = res?.reduce(
      (acc: any, curr: any) => acc + parseFloat(curr.sellCount),
      0
    );
    setState({
      sumOfBuyVolume: sumOfBuyVolume,
      sumOfSellVolume: sumOfSellVolume,
      sumOfBuyValue: sumOfBuyValue,
      sumOfSellValue: sumOfSellValue,
      sumOfBuyCount: sumOfBuyCount,
      sumOfSellCount: sumOfSellCount,
    });
  };
  const persianMonth = (month: number) => {
    let title = '';
    switch (month) {
      case 1:
        title = 'فروردین';
        break;
      case 2:
        title = 'اردیبهشت';
        break;
      case 3:
        title = 'خرداد';
        break;
      case 4:
        title = 'تیر';
        break;
      case 5:
        title = 'مرداد';
        break;
      case 6:
        title = 'شهریور';
        break;
      case 7:
        title = 'مهر';
        break;
      case 8:
        title = 'آبان';
        break;
      case 9:
        title = 'آذر';
        break;
      case 10:
        title = 'دی';
        break;
      case 11:
        title = 'بهمن';
        break;
      case 12:
        title = 'اسفند';
        break;
    }
    return title;
  };
  return (
    <div className="rounded shadow-simple px-6 py-3 grid grid-cols-12 gap-4 mb-3">
      <h2 className="col-span-12 text-lg font-medium ">آمار معاملات</h2>
      <div className="2xl:col-span-3 xl:col-span-6 lg:col-span-6 md:col-span-6 col-span-6">
        <Select
          onChange={(item) => onChangeYear(String(item))}
          options={lastYearsGenerator(4)}
          defaultValue={changeYear}
        />
      </div>
      <div className="2xl:col-span-9 xl:col-span-6 lg:col-span-6 md:col-span-6 col-span-6 flex justify-end">
        <Button className="px-6 border-[1px] gap-2 border-green w-fit">
          <a
            className="text-extratiny font-normal text-black"
            target="blank"
            href={`${baseUrl}Trading_Statistics/Export?talarId=${talarId}&year=${changeYear}`}
          >
            دانلود فایل اکسل
          </a>
          <Icon name="icon-excel" classname="text-green" />
        </Button>
      </div>
      <div className="grid grid-cols-12 col-span-12 justify-center items-center mb-5 mt-10">
        <section className="col-span-12 grid grid-cols-12 mb-2 gap-1">
          {market.map((item: any) => {
            return (
              <span
                onClick={() => setSelectedCategory(item.id)}
                className={`bg-lightGray cursor-pointer p-1 col-span-4 text-center border-[1px] border-purple ${
                  selectedCategory === item.id ? 'bg-purple text-white' : ''
                }`}
              >
                {item.title}
              </span>
            );
          })}
        </section>
        <div className=" col-span-12 mt-10">
          <Table
            className="col-span-12 grid grid-cols-12"
            wrapperClassName="col-span-12"
            columns={tableHeader}
            data={tradingDetails}
            disableRow
            // scroll={{ x: 'calc(500px + 50%)' }}
            // totalPages={(data?.countAll || 1) / PageSize}
            pageSize={PageSize}
            // onChangePage={handlePageChange}
            // pageNumber={pageNumber}
            isLoading={isLoading}
            // onChange={handleChangeTable}
          />
          <section className="col-span-12 grid grid-cols-12 border border-t-0  bg-gray min-h-[30px]">
            <div className=" col-span-2 flex items-center justify-center border-l ">
              <span className=" font-bold">جمع کل</span>
            </div>
            <div className=" col-span-2 flex items-center justify-center border-l ">
              <span className=" font-bold">{separator(sumOfBuyVolume)}</span>
            </div>
            <div className=" col-span-2 flex items-center justify-center border-l">
              <span className=" font-bold">{separator(sumOfSellVolume)}</span>
            </div>
            <div className=" col-span-2 flex items-center justify-center border-l ">
              <span className=" font-bold">{separator(sumOfBuyValue)}</span>
            </div>
            <div className=" col-span-2 flex items-center justify-center border-l ">
              <span className=" font-bold">{separator(sumOfSellValue)}</span>
            </div>
            <div className=" col-span-1 flex items-center justify-center border-l ">
              <span className=" font-bold">{separator(sumOfBuyCount)}</span>
            </div>
            <div className=" col-span-1 flex items-center justify-center">
              <span className=" font-bold">{separator(sumOfSellCount)}</span>
            </div>
          </section>
        </div>
        {/* <div className="col-span-12 text-lg font-medium bg-[#ebebeb] py-3 flex flex-row space-x-4 justify-between items-center px-3 ">
          <h2>سال {changeYear}</h2>
          <Image src={excelLogo} className="h-[1.5rem]" />
        </div>
        {tradingDetails.map((item: any) => {
          return (
            <a
              className={`bg-[#ebebeb] col-span-4 '
                    ${item?.tr_Month ? '' : 'pointer-events-none opacity-30'}`}
              href={`${fileBaseUrl}Download/${item.tr_Files_Id}`}
            >
              <Button
                className={
                  'flex flex-col justify-center items-center w-24 h-24'
                }
                isLoading={isLoading}
              >
                <h2 className="text-base font-medium mb-2">{item.name}</h2>
                <Image src={excelLogo} className="h-[1.8rem]" />
              </Button>
            </a>
          );
        })} */}
      </div>
    </div>
  );
}
export default withAlert(TradingStatisticsPublic);
