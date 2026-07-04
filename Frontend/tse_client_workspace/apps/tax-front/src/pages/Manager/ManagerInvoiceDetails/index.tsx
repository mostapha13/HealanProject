import {
  Button,
  Select,
  Image,
  Icon,
  TextField,
  Modal,
} from '@tse/components/atoms';
import type { ErrorType, HeaderTypes, onAlertProps } from '@tse/types';
import { useEffect, useRef, useSearchParams, useState } from '@tse/utils';
import withAlert from '../../../hoc/withAlert';
import { Radio } from 'antd';
import type { RadioChangeEvent } from 'antd';
import { Table } from 'apps/tax-front/src/components/Table';
import WorkFlow from 'apps/tax-front/src/components/WorkFlow';
import { convertDateToJalali, separator } from '@tse/tools';
import {
  getTransactionFee,
  getExcelTransactionFee,
  managerConfirmedInvoice,
  managerRejectedInvoice,
} from './service';
import { baseUrl } from 'apps/tax-front/src/constants';

interface InvoiceDetailsTypes {
  onAlert: onAlertProps;
}
type Action = {
  person: number;
  time: number;
  description: string;
};
function ManagerInvoiceDetails({ onAlert }: InvoiceDetailsTypes) {
  const [isLoading, setLoading] = useState<boolean>(false);
  const [changePage, setChangePage] = useState('invoice');
  const [tranactionFeeData, setTranactionFeeData] = useState<any[]>([]);
  const [excelTranactionFeeData, setExcelTranactionFeeData] = useState<any[]>(
    []
  );
  const [message, setMessage] = useState('');
  const [isModalConfirmVisible, setIsModalConfirmVisible] = useState(false);
  const [isModalRejectVisible, setIsModalRejectVisible] = useState(false);

  const handleModeChange = (e: RadioChangeEvent) => {
    setChangePage(e.target.value);
  };
  const [searchParams] = useSearchParams();
  const description: any = searchParams.get('desc');
  const inty: any = searchParams.get('inty');
  const sendDate: any = searchParams.get('sendDate');
  const indicatorNumber: any = searchParams.get('indicatorNumber');
  const periodId: any = searchParams.get('periodId');
  const tableHeader: HeaderTypes[] = [
    {
      title: 'تعداد رکورد',
      dataIndex: 'countTransactionFee',
      key: 'countTransactionFee',
      className: 'col-span-4',
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'جمع مبلغ',
      dataIndex: 'sumFee',
      key: 'sumFee',
      className: 'col-span-4',
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'مجموع کارمزد',
      dataIndex: 'sumVolume',
      key: 'sumVolume',
      className: 'col-span-4',
      render: (item: any) => <span>{separator(item)}</span>,
    },
  ];
  const tableHeaderExcel: HeaderTypes[] = [
    {
      title: 'تعداد رکورد',
      dataIndex: 'countTransactionFee',
      key: 'countTransactionFee',
      className: 'col-span-4',
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'جمع مبلغ',
      dataIndex: 'sumFee',
      key: 'sumFee',
      className: 'col-span-4',
      render: (item: any) => <span>{separator(item)}</span>,
    },
  ];
  const messageTableHeader: HeaderTypes[] = [
    {
      title: 'متن پیام',
      dataIndex: 'text',
      key: 'text',
      className: 'col-span-6',
    },
    {
      title: 'تاریخ ارسال',
      dataIndex: 'date',
      key: 'date',
      className: 'col-span-3',
    },
    {
      title: 'فرستنده',
      dataIndex: 'sender',
      key: 'sender',
      className: 'col-span-3',
    },
  ];
  useEffect(() => {
    handleTransactionFee();
    handleExcelTransactionFee();
  }, []);
  function onFail(error: ErrorType) {
    onAlert?.({ message: error?.data?.message || error.data, ...error });
    // setIsloading(false);
  }
  function handleTransactionFee() {
    getTransactionFee({
      periodId: periodId,
      indicatorNumber: indicatorNumber,
      onSuccess: (res) => {
        const arrayData = [];
        arrayData.push(res?.data);
        setTranactionFeeData(arrayData);
      },
      onFail,
    });
  }
  function handleExcelTransactionFee() {
    getExcelTransactionFee({
      periodId: periodId,
      indicatorNumber: indicatorNumber,
      onSuccess: (res) => {
        const arrayData = [];
        arrayData.push(res?.data);
        setExcelTranactionFeeData(arrayData);
      },
      onFail,
    });
  }
  const messageDataSource = [
    {
      text: '',
      date: '',
      sender: '',
    },
  ];
  const workFlowMockData = {
    Groups: [
      {
        Group_ID: 1,
        Group_Name: 'کارشناس مالی',
      },
      {
        Group_ID: 2,
        Group_Name: 'مدیر مالی',
      },
    ],
    WorkFlow: [
      {
        Group_ID: 1,
        Form_Name: 'تست',
        Order_Date: '1380/01/02',
      },
      {
        Group_ID: 2,
        Form_Name: 'تست',
        Order_Date: '1380/01/03',
      },
      {
        Group_ID: 1,
        Form_Name: 'تست',
        Order_Date: '1380/01/04',
      },
      {
        Group_ID: 2,
        Form_Name: 'تست',
        Order_Date: '1380/01/05',
      },
      {
        Group_ID: 1,
        Form_Name: 'تست',
        Order_Date: '1380/01/06',
      },
    ],
  };
  const onConfirmClick = () => {
    setIsModalConfirmVisible(false);
    setLoading(true);
    managerConfirmedInvoice({
      indicatorNumber: indicatorNumber,
      periodId: periodId,
      responseStatus: '',
      description: message,
      onSuccess: (res) => {
        if (res?.isSuccess) {
          onAlert({
            type: 'success',
            message: 'اطلاعات با موفقیت تایید گردید',
          });
        }
        setLoading(false);
      },
      onFail,
    });
  };
  const onCancelClick = () => {
    setIsModalRejectVisible(false);
    setLoading(true);
    managerRejectedInvoice({
      indicatorNumber: indicatorNumber,
      periodId: periodId,
      responseStatus: '',
      description: message,
      onSuccess: (res) => {
        if (res?.isSuccess) {
          onAlert({
            type: 'success',
            message: 'اطلاعات تایید نگردید',
          });
        }
        setLoading(false);
      },
      onFail,
    });
  };
  const onOkModalConfirmClick = () => {
    onConfirmClick();
  };
  const onOkModalRejectClick = () => {
    onCancelClick();
  };
  const InvoiceComponent = () => {
    return (
      <>
        <div className="mt-6">
          <div className=" col-span-12 flex flex-1 justify-between mt-8 mb-2 ">
            <span className=" text-tiny font-bold">سرجمع کارمزد معاملات</span>
            <div>
              <a
                href={
                  baseUrl +
                  `Invoice/ExportTransactionFeeByPeriodIdToExcelManager/${periodId}/${indicatorNumber}`
                }
                target="_blank"
                rel="noreferrer"
                className="text-tiny font-bold truncate"
              >
                <Icon
                  name="icon-file-excel"
                  classname=" text-green ml-1 text-lg"
                />
                <span className="text-base font-bold underline ">
                  فایل اکسل
                </span>
              </a>
            </div>
          </div>
          <div className="mt-4 border-2 border-grayBackground">
            <Table
              columns={tableHeader}
              data={tranactionFeeData}
              pageSize={1}
              totalPages={1}
              onChangePage={() => console.log('')}
              onChange={() => console.log('')}
            />
          </div>
        </div>
        <div className="mt-4">
          <div className=" col-span-12 flex flex-1 justify-between mt-8 mb-2 ">
            <span className=" text-tiny font-bold">سرجمع اکسل</span>
            <div>
              <a
                href={
                  baseUrl +
                  `Invoice/ExportExcelTransactionByPeriodIdManager/${periodId}/${indicatorNumber}`
                }
                target="_blank"
                rel="noreferrer"
                className="text-tiny font-bold truncate"
              >
                <Icon
                  name="icon-file-excel"
                  classname=" text-green ml-1 text-lg"
                />
                <span className="text-base font-bold underline ">
                  فایل اکسل
                </span>
              </a>
            </div>
          </div>
          <div className="mt-4 border-2 border-grayBackground">
            <Table
              // className="mt-6"
              columns={tableHeaderExcel}
              data={excelTranactionFeeData}
              pageSize={1}
              totalPages={1}
              onChangePage={() => console.log('')}
              onChange={() => console.log('')}
            />
          </div>
        </div>
        <div className="mt-4">
          <span className=" text-tiny font-bold">پیام ها</span>
          <div className="mt-4 border-2 border-grayBackground">
            <Table
              // className="grid grid-cols-12"
              columns={messageTableHeader}
              data={messageDataSource}
              pageSize={5}
              totalPages={1}
              onChangePage={() => console.log('')}
              onChange={() => console.log('')}
              withRow={true}
            />
          </div>
        </div>
        <div>
          <div className=" col-span-12 flex flex-col   my-6 ">
            <span className="text-base font-bold col-span-12">ارسال پیام</span>
            <TextField
              className="col-span-12 border-2 border-lightGray mt-2"
              onChange={(e: string) => setMessage(e)}
              value={message}
              tag="textarea"
            />
          </div>
          {!isLoading && (
            <div className="col-span-12 flex flex-row items-center justify-end  my-6">
              <a href={`/user/dashboard`} className="text-buttonBlue   mx-8 ">
                بازگشت
              </a>
              <Button
                onClick={() => setIsModalConfirmVisible(true)}
                className="text-green  border-2 border-green rounded-md mx-4 px-4 w-36 "
              >
                تایید
              </Button>
              <Button
                onClick={() => setIsModalRejectVisible(true)}
                className="text-red  border-2 border-red rounded-md mr-4 px-4 w-36 "
              >
                عدم تایید
              </Button>
            </div>
          )}
        </div>
      </>
    );
  };
  return (
    <div className="p-10 mx-4 my-4 shadow-[0_0px_5px_rgba(0,0,0,0.2)]">
      <div className="my-1">
        <Radio.Group onChange={handleModeChange} value={changePage}>
          <Radio.Button value="invoice">فرآیند فعلی</Radio.Button>
          <Radio.Button value="workflow">گردش کار</Radio.Button>
        </Radio.Group>
      </div>
      <div className="flex bg-headerGray py-4 justify-between px-4">
        <div>
          <span className=" text-lightGray">شرح : </span>
          <span className="text-white">{description}</span>
        </div>
        <div>
          <span className=" text-lightGray">تاریخ ارسال : </span>
          <span className="text-white">{convertDateToJalali(sendDate)}</span>
        </div>
        <div>
          <span className=" text-lightGray">شماره اندیکاتور : </span>
          <span className="text-white">{indicatorNumber}</span>
        </div>
      </div>
      {changePage == 'invoice' && <InvoiceComponent />}
      {changePage == 'workflow' && <WorkFlow data={workFlowMockData} />}
      <Modal
        handleOk={() => onOkModalConfirmClick()}
        handleCancel={() => setIsModalConfirmVisible(false)}
        isModalVisible={isModalConfirmVisible}
        title={`آیا نسبت به تایید صورتحساب اطمینان دارید`}
      ></Modal>
      <Modal
        handleOk={() => onOkModalRejectClick()}
        handleCancel={() => setIsModalRejectVisible(false)}
        isModalVisible={isModalRejectVisible}
        title={`آیا نسبت به عدم تایید صورتحساب اطمینان دارید`}
      ></Modal>
    </div>
  );
}
export default withAlert(ManagerInvoiceDetails);
