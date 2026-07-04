/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import {
  Button,
  TextField,
  Dropdown,
  NewSelectSearch,
} from '@tse/components/atoms';
import { SymbolModal, Table } from '@tse/components/organism';
import { DatePicker } from '@tse/components/molecules';
import { useEffect, useStates, useNavigate, useState } from '@tse/utils';
import {
  getInstrumentList,
  getNotificationList,
  readNotification,
} from '../../Controller';
import withAlert from '../../hoc/withAlert';
import {
  convertDate,
  loadFromStorage,
  convertDateAndTimeJalali,
} from '@tse/tools';
import { HeaderTypes, TableOnChange } from '@tse/types';
import NewSelect from '../../components/atoms/NewSelect';
const typeData = [
  {
    name: 'همه پیام‌ها',
    id: 'All',
  },
  {
    name: 'خوانده نشده',
    id: 'Unreaded',
  },
  {
    name: 'خوانده شده',
    id: 'Readed',
  },
];

const initialState = {
  notificationData: [],
  View_Type: 'All',
  FromDate: '',
  ToDate: '',
  PageNumber: '',
  PageSize: 10,
};

function Messages({ onAlert }: any) {
  const [state, setState] = useStates<any>(initialState);
  const { notificationData, View_Type, FromDate, ToDate, PageSize } = state;
  const tableHeader: HeaderTypes[] = [
    {
      title: 'تاریخ و ساعت',
      dataIndex: 'notif_Date',
      key: 'notif_Date',
      className: 'col-span-3',
      render: (item: any) => <span>{convertDateAndTimeJalali(item)}</span>,
    },
    {
      title: 'نماد',
      dataIndex: 'instrument',
      key: 'instrument',
      className: 'col-span-3',
      render: (item: any, record: any) => (
        <span
          className=" text-black"
          // href={`${record.formUrl}?id=${record.orderId}`}
        >
          {item?.symbol}
        </span>
      ),
    },
    {
      title: 'پیام',
      dataIndex: 'messageText',
      key: 'messageText',
      className: 'col-span-4',
      render: (item: any, record: any) => (
        <span
          className={`${
            record?.status == 'Unreaded' ? 'text-black' : ' text-darkGray'
          }`}
          // onClick={() => handleReadNotification(item, record)}
          // href={`${record.formUrl}?id=${record.orderId}`}
        >
          {item}
        </span>
      ),
    },
    {
      title: 'وضعیت',
      dataIndex: 'messageText',
      key: 'messageText',
      className: 'col-span-1',
      render: (item: any, record: any) => (
        <a
          className={`${
            record?.status == 'Unreaded'
              ? 'text-black font-bold'
              : ' text-darkGray  cursor-not-allowed'
          }`}
          onClick={() => handleReadNotification(item, record)}
          // href={`${record.formUrl}?id=${record.orderId}`}
        >
          {`${record?.status == 'Unreaded' ? 'مشاهده' : 'مشاهده شده'}`}
        </a>
      ),
    },
  ];
  useEffect(() => {
    getNotificationListData(1);
  }, []);
  const handleReadNotification = (item: any, record: any) => {
    if (record?.status == 'Unreaded') {
      const data = {
        NotificationId: record?.notificationId,
      };
      readNotification({
        data: data,
        onSuccess: (res: any) => {
          getNotificationListData(1);
        },
        onFail,
      });
    }
  };
  const getNotificationListData = (pageNo: any) => {
    const data = {
      View_Type: View_Type,
      PageNumber: pageNo,
      PageSize: PageSize,
      FromDate: FromDate,
      ToDate: ToDate,
    };
    getNotificationList({
      data: data,
      onSuccess: onSuccessNotificationData,
      onFail,
    });
  };
  const onSuccessNotificationData = (res: any) => {
    setState({ notificationData: res });
  };

  const onFail = (error: any) => {
    onAlert(error);
  };

  const onChange = (key: string, value: any) => {
    setState({
      [key]: value,
    });
  };

  const onSearch = () => {
    getNotificationListData(1);
  };
  const onChangePage = (pageNo: number) => {
    getNotificationListData(pageNo);
  };
  return (
    <div className="shadow-[0_0px_4px_rgba(0,0,0,0.2)] rounded-sm p-3">
      <span className="font-bold">لیست پیام‌ها</span>
      <div className="grid grid-cols-12 gap-4 mt-8 mb-2">
        <div className="2xl:col-span-3 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2">
          <NewSelect
            label="نوع پیام"
            options={typeData}
            onChange={(value: any, e: any) => {
              setState({ View_Type: value });
            }}
            showKey="name"
            selectedKey="id"
            errorMessage={state?.clearingTypeError}
            value={View_Type}
          />
        </div>
        <div className="col-span-3 !z-10">
          <DatePicker
            label="از تاریخ"
            onChange={(value: string) => onChange('FromDate', value)}
            value={FromDate}
            onClearDate={() => onChange('FromDate', '')}
          />
        </div>
        <div className="col-span-3 !z-10">
          <DatePicker
            label="تا تاریخ"
            onChange={(value: string) => onChange('ToDate', value)}
            value={ToDate}
            onClearDate={() => onChange('ToDate', '')}
          />
        </div>
        <div className="col-span-3 flex justify-end">
          <Button
            className="bg-blue text-white w-[120px]"
            onClick={() => onSearch()}
          >
            جستجو
          </Button>
        </div>
      </div>

      <div className="mt-4 col-span-12">
        <Table
          columns={tableHeader}
          className="col-span-12 grid grid-cols-12 "
          data={notificationData?.items}
          onChangePage={onChangePage}
          totalPages={notificationData?.totalPages}
          pageSize={PageSize}
          //   onChange={handleChangeTable}
        />
      </div>
    </div>
  );
}

export default withAlert(Messages);
