import { Button, Select, Icon } from '@tse/components/atoms';
import type { ErrorType, onAlertProps } from '@tse/types';
import { useEffect, useState } from '@tse/utils';
import { PieChart } from '@tse/components/organism';
import { convertDateToJalali } from '@tse/tools';
import {
  EndPeriod,
  GetInqueryValidInvalid,
  ResendInvoiceInternalError,
} from './service';
import { baseUrl } from '../../constants';
import { Tooltip } from 'antd';

export interface ProgressCardProps {
  failModalVisibleClick?: any;
  invalidModalVisibleClick?: any;
  detailsModalVisibleClick?: any;
  onChange?: any;
  data?: any;
  onFinishedInvoiceChange?: any;
  onAlert: onAlertProps;
}
function ProgressCard(props: ProgressCardProps) {
  const {
    failModalVisibleClick,
    invalidModalVisibleClick,
    detailsModalVisibleClick,
    data,
    onFinishedInvoiceChange,
    onAlert,
  } = props;
  const [queryStatusClick, setQueryStatusClick] = useState(false);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [queryStatusData, setQueryStatusData] = useState<any>();

  // const [failModalVisibleClick, setFailModalVisibleClick] = useState('');
  // const [invalidModalVisible, setInvalidModalVisible] = useState(false);
  // const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const pieChartData = [
    {
      name: 'ناموفق',
      y: data?.faieldInvoicePersent,
      sliced: false,
      selected: false,
    },
    {
      name: 'موفق',
      y: data?.successInvoicePersent,
      sliced: false,
      selected: false,
    },
  ];
  const validInvalidPieChartData = [
    {
      name: 'ناموفق',
      y: queryStatusData?.invalidPercent,
      sliced: false,
      selected: false,
    },
    {
      name: 'موفق',
      y: queryStatusData?.validPercent,
      sliced: false,
      selected: false,
    },
  ];
  const cardItems = [
    {
      title: 'ارسال شده',
      percent: '100%',
      logo: '',
      color: 'bg-[#FFD12F]',
      invoiceState: 3,
    },
    {
      title: 'ناموفق',
      percent: data?.faieldInvoicePersent + '%',
      logo: '',
      color: 'bg-[#FF7676]',
      invoiceState: 2,
    },
    {
      title: 'موفق',
      percent: data?.successInvoicePersent + '%',
      logo: '',
      color: 'bg-[#91D0BD]',
      invoiceState: 1,
    },
  ];
  const queryStatusItems = [
    {
      allData: data,
      title: 'Valid',
      name: 'موفق',
      percent: queryStatusData?.validPercent + '%',
      logo: '',
      color: 'bg-[#5EC5E6]',
      validationState: 1,
    },
    {
      allData: data,
      title: 'Invalid',
      name: 'ناموفق',
      percent: queryStatusData?.invalidPercent + '%',
      logo: '',
      color: 'bg-[#FF7F08]',
      validationState: 2,
    },
  ];
  const onFail = (error: any) => {
    setLoading(false);
    onAlert({ type: 'error', message: error?.data?.message });
  };

  const getInqueryStatus = () => {
    GetInqueryValidInvalid({
      periodId: data?.periodId,
      indicatorNumber: data?.indicatorNumber,
      onSuccess: (res) => {
        if (res?.isSuccess) {
          setQueryStatusClick(!queryStatusClick);
          setQueryStatusData(res?.data);
        }
      },
      onFail,
    });
  };
  const onEndPeriodClick = () => {
    EndPeriod({
      periodId: data?.periodId,
      onSuccess: (res) => {
        if (res?.data?.isSuccess) {
          onFinishedInvoiceChange();
          onAlert({
            type: 'success',
            message: 'بسته انتخابی با موفقیت خاتمه یافت.',
          });
        }
      },
      onFail,
    });
  };
  const resendInvoiceError = () => {
    ResendInvoiceInternalError({
      periodId: data?.periodId,
      indicatorNumber: data?.indicatorNumber,
      onSuccess: (res) => {
        console.log('resss', res);
        if (res?.data?.isSuccess) {
          onAlert({
            type: 'success',
            message: 'داده های خطادار مجدد ارسال گردید.',
          });
        }
      },
      onFail,
    });
  };

  return (
    <div>
      {queryStatusClick && (
        <div className="bg-white w-[300px] h-[450px] px-4 py-4 rounded-lg border-b-4 border-black ml-4">
          <Icon
            onClick={() => setQueryStatusClick(!queryStatusClick)}
            name="icon-cancel"
            classname=" text-black mr-1 text-2xl "
          />
          <div className=" flex items-center justify-center flex-col">
            <PieChart
              title="استعلام"
              width={180}
              height={180}
              data={validInvalidPieChartData}
            />
            <div className="flex flex-col w-[100%] mt-6">
              {queryStatusItems?.map((item: any) => {
                return (
                  <div className=" flex flex-row-reverse w-[100%] items-center justify-center text-center ">
                    <div className="w-[40%] flex flex-row-reverse items-center">
                      <Tooltip title="استعلام">
                        <a
                          href={
                            baseUrl +
                            `Invoice/ExportInqueryByPeriodId/${data?.periodId}/${data?.indicatorNumber}/${item?.validationState}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="text-tiny font-bold truncate"
                        >
                          <Icon
                            name="icon-file-excel"
                            classname=" text-green mr-1 text-lg"
                          />
                        </a>
                      </Tooltip>
                      <Tooltip title="بسته ارسال">
                        <a
                          href={
                            baseUrl +
                            `Invoice/ExportInqueryDetailsByPeriodId/${data?.periodId}/${data?.indicatorNumber}/${item?.validationState}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="text-tiny font-bold truncate"
                        >
                          <Icon
                            name="icon-file-excel"
                            classname=" text-blue mr-1 text-lg"
                          />
                        </a>
                      </Tooltip>
                    </div>
                    {item?.title == 'Invalid' && (
                      <div className="w-[20%]">
                        <span className=" text-buttonBlue">
                          {item?.percent}
                        </span>
                        {/* <a onClick={() => invalidModalVisibleClick(item)}>
                          <span className=" text-buttonBlue">
                            {item?.percent}
                          </span>
                        </a> */}
                      </div>
                    )}
                    {item?.title != 'Invalid' && (
                      <span className="w-[20%]">{item?.percent}</span>
                    )}
                    <div className="w-[40%] text-left flex flex-row items-center my-1">
                      <div className={`w-3 h-3 rounded ${item?.color} ml-1`} />
                      <span> {item?.name} :</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {!queryStatusClick && (
        <div className="bg-white w-[300px] h-[450px] px-4 py-4 rounded-lg border-b-4 border-black ml-4">
          <div className="w-[100%] flex flex-row items-center justify-start ">
            <span className=" font-bold">{data?.periodTitle}</span>
            <a onClick={() => detailsModalVisibleClick('testFetails')}>
              {/* <span className=" font-bold mr-2 text-buttonBlue">(جزئیات)</span> */}
            </a>
          </div>
          <div className="w-[100%] flex flex-row justify-between my-8 ">
            <div className="flex flex-col justify-center">
              <div>
                <span className=" text-gray">تاریخ ارسال :</span>
                <span className=" text-gray">
                  {convertDateToJalali(data?.sentDate)}
                </span>
              </div>
              <div>
                <span className=" text-gray">شماره اندیکاتور :</span>
                <span className=" text-gray"> {data?.indicatorNumber}</span>
              </div>
            </div>
            <PieChart
              data={pieChartData}
              title="وضعیت بسته"
              width={125}
              height={125}
            />
          </div>
          <div className="w-[100%] flex flex-col">
            {cardItems?.map((item: any) => {
              return (
                <div className=" flex flex-row-reverse w-[100%] items-center justify-center text-center">
                  <div className="w-[40%] flex flex-row-reverse items-center">
                    <Tooltip title="استعلام">
                      <a
                        href={
                          baseUrl +
                          `Invoice/ExportFinishedInvoiceByPeriodId/${data?.periodId}/${data?.indicatorNumber}/${item?.invoiceState}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="text-tiny font-bold truncate"
                      >
                        <Icon
                          name="icon-file-excel"
                          classname=" text-green mr-1 text-lg"
                        />
                      </a>
                    </Tooltip>
                    {/* <Tooltip title="بسته ارسال">
                      <a
                        href={
                          baseUrl +
                          `Invoice/ExportInqueryDetailsByPeriodId/${data?.periodId}/${data?.indicatorNumber}/${item?.invoiceState}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="text-tiny font-bold truncate"
                      >
                        <Icon
                          name="icon-file-excel"
                          classname=" text-blue mr-1 text-lg"
                        />
                      </a>
                    </Tooltip> */}
                  </div>
                  {item?.title == 'Fail' && (
                    <div className="w-[20%]">
                      <span className=" text-buttonBlue">{item?.percent}</span>
                      {/* <a onClick={() => failModalVisibleClick('testFail')}>
                        <span className=" text-buttonBlue">
                          {item?.percent}
                        </span>
                      </a> */}
                    </div>
                  )}
                  {item?.title != 'Fail' && (
                    <span className="w-[20%]">{item?.percent}</span>
                  )}
                  <div className="w-[40%] text-left flex flex-row items-center my-1">
                    <div
                      className={`w-3 h-3 rounded ${item?.color} ml-1 mb-1`}
                    />
                    <span> {item?.title} :</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="w-[100%] flex flex-wrap flex-row items-center justify-around my-4 ">
            <Button
              // onClick={() => setQueryStatusClick(!queryStatusClick)}
              onClick={() => getInqueryStatus()}
              className="text-blue w-[48%]   border-2 border-lightGrayOpacity rounded-lg  "
            >
              وضعیت استعلام
            </Button>
            <Button
              // onClick={() => setQueryStatusClick(!queryStatusClick)}
              onClick={() => resendInvoiceError()}
              className="text-darkGreen  w-[48%]   border-2 border-lightGrayOpacity rounded-lg  "
            >
              ارسال مجدد خطاها
            </Button>
            {data?.cancelStatus == 1 ? (
              <a
                className="text-red w-[48%] border-2 border-lightGrayOpacity rounded-lg  h-8 items-center justify-center flex hover:opacity-50 hover:text-red "
                href={`/user/cancel-package?sendDate=${data?.sentDate}&indicatorNumber=${data?.indicatorNumber}&periodId=${data?.periodId}&perriodTitle=${data?.periodTitle}`}
              >
                ابطال
              </a>
            ) : null}
            {data?.fixStatus == 1 ? (
              <a
                className="text-yellow w-[48%] border-2 border-lightGrayOpacity rounded-lg  h-8 items-center justify-center flex hover:text-yellow hover:opacity-50 "
                href={`/user/send-addenduum?periodId=${data?.periodId}&perriodTitle=${data?.periodTitle}&indicatorNumber=${data?.indicatorNumber}`}
              >
                الحاقیه
              </a>
            ) : null}
            {data?.endStatus == 1 ? (
              <a
                onClick={() => {
                  onEndPeriodClick();
                }}
                className="text-green w-[48%] my-2 border-2 border-lightGrayOpacity rounded-lg  h-8 items-center justify-center flex hover:opacity-50 hover:text-green "
              >
                اختتام
              </a>
            ) : null}
            {data?.reportStatus == 1 ? (
              <a
                href={`/user/report-invoice?periodId=${data?.periodId}&perriodTitle=${data?.periodTitle}&indicatorNumber=${data?.indicatorNumber}`}
                className=" text-purple w-[48%] border-2 border-lightGrayOpacity rounded-lg h-8 items-center justify-center flex hover:opacity-50 hover:text-purple "
              >
                گزارش
              </a>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
export default ProgressCard;
