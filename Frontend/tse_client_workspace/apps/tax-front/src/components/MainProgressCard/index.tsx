import { Button, Select, Icon } from '@tse/components/atoms';
import type { ErrorType, onAlertProps } from '@tse/types';
import { useEffect, useState } from '@tse/utils';
import { PieChart } from '@tse/components/organism';
import { convertDateToJalali } from '@tse/tools';
import { changePacketSendState } from './service';
import { baseUrl } from '../../constants';

export interface MainProgressCardProps {
  onChange?: any;
  data?: any;
  onAlert: onAlertProps;
  onStateChange?: any;
}
function MainProgressCard(props: MainProgressCardProps) {
  const { data, onAlert, onStateChange } = props;
  const [isLoading, setLoading] = useState<boolean>(false);
  const pieChartData = [
    // {
    //   name: 'Process',
    //   y: data[0]?.processPercent,
    //   sliced: false,
    //   selected: false,
    // },+
    {
      name: 'ناموفق',
      y: data[0]?.faieldProcessPercent,
      sliced: false,
      selected: false,
    },
    {
      name: 'موفق',
      y: data[0]?.successProcessPercent,
      sliced: false,
      selected: false,
    },
  ];
  const pieChartProcessData = [
    // {
    //   name: 'Process',
    //   y: data[0]?.processPercent,
    //   sliced: false,
    //   selected: false,
    // },+
    {
      name: 'پردازش شده',
      y: data[0]?.processPercent,
      sliced: false,
      selected: false,
    },
    {
      name: 'باقیمانده',
      y: 100 - data[0]?.processPercent,
      sliced: false,
      selected: false,
    },
  ];
  const cardItems = [
    {
      title: 'ارسال شده',
      percent: data[0]?.processPercent.toFixed(2) + '%',
      logo: '',
      color: 'bg-[#FFD12F]',
      processState: 3,
    },
    {
      title: 'ناموفق',
      percent: data[0]?.faieldProcessPercent.toFixed(2) + '%',
      logo: '',
      color: 'bg-[#FF7676]',
      processState: 2,
    },
    {
      title: 'موفق',
      percent: data[0]?.successProcessPercent.toFixed(2) + '%',
      logo: '',
      color: 'bg-[#91D0BD]',
      processState: 1,
    },
    // {
    //   title: 'Valid',
    //   percent: '--',
    //   logo: '',
    //   color: 'bg-[#5EC5E5]',
    // },
    // {
    //   title: 'Invalid',
    //   percent: '--',
    //   logo: '',
    //   color: 'bg-[#FF7F08]',
    // },
  ];
  const onFail = (error: any) => {
    setLoading(false);
    onAlert({ type: 'error', message: error?.data?.message });
  };
  const onPauseButtonClick = () => {
    setLoading(true);
    onStateChange(3);
    changePacketSendState({
      id: data[0]?.id,
      indicatorNumber: data[0]?.indicatorNumber,
      periodId: data[0]?.periodId,
      packetSendState: 3,
      onSuccess: (res) => {
        setLoading(false);
        if (res?.data?.isSuccess) {
          onAlert({
            type: 'success',
            message: 'ارسال بسته متوقف گردید',
          });
        }
      },
      onFail,
    });
  };
  const onResumeButtonClick = () => {
    setLoading(true);
    onStateChange(2);
    changePacketSendState({
      id: data[0]?.id,
      indicatorNumber: data[0]?.indicatorNumber,
      periodId: data[0]?.periodId,
      packetSendState: 2,
      onSuccess: (res) => {
        setLoading(false);
        if (res?.data?.isSuccess) {
          onAlert({
            type: 'success',
            message: 'ارسال بسته شروع گردید',
          });
        }
      },
      onFail,
    });
  };

  return (
    <div>
      <div className="bg-white 2xl:w-[330px] w-[350px] h-[490px] px-4 py-4 rounded-lg">
        <div className="w-[100%] flex flex-row items-center justify-between ">
          <span className=" font-bold">{data[0]?.periodTitle}</span>
          <div className="flex flex-col">
            <div>
              <span className=" text-gray">تاریخ ارسال :</span>
              <span className=" text-gray">
                {convertDateToJalali(data[0]?.sentDate)}
              </span>
            </div>
            <div>
              <span className=" text-gray">شماره اندیکاتور :</span>
              <span className=" text-gray"> {data[0]?.indicatorNumber}</span>
            </div>
          </div>
        </div>
        <div className="w-[100%] flex flex-row justify-between my-6 ">
          <PieChart
            data={pieChartProcessData}
            title="درصد پیشرفت"
            color={['#FFD12F', '#e3e3e3']}
          />
          <PieChart data={pieChartData} title="وضعیت بسته" />
        </div>
        <div className="w-[100%] flex flex-col mt-8">
          {cardItems?.map((item: any) => {
            return (
              <div className=" flex flex-row-reverse w-[100%] items-center justify-center text-center">
                <div className="w-[40%] flex flex-row items-center justify-end">
                  <a
                    href={
                      baseUrl +
                      `Invoice/ExportActiveInvoiceByPeriodId/${data[0]?.periodId}/${data[0]?.indicatorNumber}/${item?.processState}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="text-tiny font-bold truncate"
                    // onClick={() => exportExcelClick(item)}
                  >
                    <span className=" underline"></span>
                    <Icon
                      name="icon-file-excel"
                      classname=" text-green mr-1 text-lg"
                    />
                  </a>
                </div>
                <span className="w-[20%]">{item?.percent}</span>
                <div className="w-[40%] text-left flex flex-row items-center">
                  <div className={`w-3 h-3 rounded ${item?.color} mb-1 ml-1`} />
                  <span> {item?.title} :</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="w-[100%] flex flex-row items-center justify-around my-10">
          {data[0]?.packetSendState === 2 ? (
            <Button
              isLoading={isLoading}
              onClick={onPauseButtonClick}
              className="text-red  border-2 border-lightGrayOpacity rounded-lg w-[80%]"
            >
              توقف
            </Button>
          ) : data[0]?.packetSendState === 3 ? (
            <Button
              isLoading={isLoading}
              onClick={onResumeButtonClick}
              className="text-blue  border-2 border-lightGrayOpacity rounded-lg w-[80%]"
            >
              شروع مجدد
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
export default MainProgressCard;
