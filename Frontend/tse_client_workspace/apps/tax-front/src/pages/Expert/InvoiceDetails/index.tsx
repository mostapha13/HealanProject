import {
  Button,
  Select,
  Image,
  Icon,
  Modal,
  TextField,
} from '@tse/components/atoms';
import type { ErrorType, HeaderTypes, onAlertProps } from '@tse/types';
import {
  useEffect,
  useLocation,
  useNavigate,
  useRecoilState,
  useRef,
  useSearchParams,
  useState,
} from '@tse/utils';
import withAlert from '../../../hoc/withAlert';
import { Radio } from 'antd';
import type { RadioChangeEvent } from 'antd';
import { Table } from 'apps/tax-front/src/components/Table';
import WorkFlow from 'apps/tax-front/src/components/WorkFlow';
import {
  convertDateToJalali,
  separator,
  convertDateAndTimeToJalali,
} from '@tse/tools';
import {
  getTransactionFee,
  getExcelTransactionFee,
  managerConfirmedInvoice,
  managerRejectedInvoice,
  getMessagesWorkFlow,
  getWorkFlowData,
} from './service';
import { baseUrl } from 'apps/tax-front/src/constants';
import { userInfoTaxAtom } from 'apps/tax-front/src/store/userProfile';
import React from 'react';
import LoadingModal from 'apps/tax-front/src/components/Loading';

interface InvoiceDetailsTypes {
  onAlert: onAlertProps;
}
type Action = {
  person: number;
  time: number;
  description: string;
};
interface WorkFlowItem {
  workFlowUserGroupKey: number;
  workFlowUserGroupId: string;
  sender: string;
  workFlowName: string;
  workFlowDate: string;
}
interface Group {
  Group_ID: number;
  Group_Name: string;
}
interface Form {
  Group_ID: number;
  Form_Name: string;
  Order_Date: string;
}
function InvoiceDetails({ onAlert }: InvoiceDetailsTypes) {
  const navigate = useNavigate();
  const [isLoading, setLoading] = useState<boolean>(false);
  const [changePage, setChangePage] = useState('invoice');
  const [tranactionFeeData, setTranactionFeeData] = useState<any[]>([]);
  const [excelTranactionFeeData, setExcelTranactionFeeData] = useState<any[]>(
    []
  );
  const [messageWorkFlowData, setMessageWorkFlowData] = useState<any[]>([]);
  const [workFlowData, setWorkFlowData] = useState<any[]>([]);
  const [workFlowConvertData, setWorkFlowConvertData] = useState<any>();

  const [message, setMessage] = useState('');
  const [isModalConfirmVisible, setIsModalConfirmVisible] = useState(false);
  const [isModalRejectVisible, setIsModalRejectVisible] = useState(false);
  const [info, setInfo] = useRecoilState(userInfoTaxAtom);
  const [isManagerUser, setIsManagerUser] = useState(false);
  const [visibleLoading, setVisibleLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const description: any = searchParams.get('desc');
  const inty: any = searchParams.get('inty');
  const sendDate: any = searchParams.get('sendDate');
  const indicatorNumber: any = searchParams.get('indicatorNumber');
  const periodId: any = searchParams.get('periodId');
  const invoiceState: any = searchParams.get('state');
  const orderId: any = searchParams.get('orderId');
  const handleModeChange = (e: RadioChangeEvent) => {
    setChangePage(e.target.value);
  };
  const hasManagerRole = info?.roleInfos.some(
    (roleInfo) => roleInfo?.roleName === 'TaxAdmin'
  );
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
      dataIndex: 'sumVolume',
      key: 'sumVolume',
      className: 'col-span-4',
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'مجموع کارمزد',
      dataIndex: 'sumFee',
      key: 'sumFee',
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
      dataIndex: 'comment',
      key: 'comment',
      className: 'col-span-6',
    },
    {
      title: 'تاریخ ارسال',
      dataIndex: 'commentDate',
      key: 'commentDate',
      className: 'col-span-3',
      render: (item: any) => <span>{convertDateAndTimeToJalali(item)}</span>,
    },
    {
      title: 'فرستنده',
      dataIndex: 'marketUserName',
      key: 'marketUserName',
      className: 'col-span-3',
    },
  ];
  useEffect(() => {
    setVisibleLoading(true);
    handleTransactionFee();
    handleExcelTransactionFee();
    handleGetMessageWorkFlow();
    handleGetWorkFlowData();
  }, []);
  useEffect(() => {
    setIsManagerUser(hasManagerRole);
  }, [hasManagerRole]);

  function onFail(error: ErrorType) {
    onAlert?.({ message: error?.data?.message || error.data, ...error });
    setVisibleLoading(false);
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
        setVisibleLoading(false);
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
  function handleGetMessageWorkFlow() {
    getMessagesWorkFlow({
      orderId: orderId,
      onSuccess: (res) => {
        setMessageWorkFlowData(res?.data);
      },
      onFail,
    });
  }
  function handleGetWorkFlowData() {
    getWorkFlowData({
      orderId: orderId,
      onSuccess: (res) => {
        setWorkFlowData(res?.data?.workFlowItems);
      },
      onFail,
    });
  }
  useEffect(() => {
    const workFlowMockData = {
      Groups: [] as Group[],
      WorkFlow: [] as Form[],
    };

    const groupMapping: { [key: string]: number } = {
      FinancialExpert: 2,
      FinancialManager: 1,
    };

    workFlowData.forEach((item: WorkFlowItem) => {
      const { workFlowUserGroupId, sender, workFlowName, workFlowDate } = item;

      const groupID = groupMapping[workFlowUserGroupId];
      if (groupID !== undefined) {
        const existingGroup = workFlowMockData.Groups.find(
          (group) => group.Group_ID === groupID
        );
        if (!existingGroup) {
          workFlowMockData.Groups.push({
            Group_ID: groupID,
            Group_Name: sender,
          });
        }

        workFlowMockData.WorkFlow.push({
          Group_ID: groupID,
          Form_Name: workFlowName,
          Order_Date: convertDateAndTimeToJalali(workFlowDate),
        });
      }
    });
    setWorkFlowConvertData(workFlowMockData);
  }, [workFlowData]);

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
          navigate('/user/dashboard');
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
          navigate('/user/dashboard');
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
      {changePage == 'invoice' && (
        <div>
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
            </div>{' '}
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
                data={messageWorkFlowData}
                pageSize={100}
                totalPages={1}
                onChangePage={() => console.log('')}
                onChange={() => console.log('')}
                withRow={true}
              />
            </div>
          </div>

          {isManagerUser ? (
            <div>
              <div className=" col-span-12 flex flex-col   my-6 ">
                <span className="text-base font-bold col-span-12 mb-4">
                  ارسال پیام
                </span>
                <TextField
                  className="col-span-12 border-2 border-lightGray mt-2"
                  onChange={(e: any) => setMessage(e)}
                  label="متن پیام"
                  value={message}
                  type="text"
                  // multiline
                  // tag="textarea"
                />
              </div>
              {!isLoading && (
                <div className="col-span-12 flex flex-row items-center justify-end  my-6">
                  <a
                    href={`/user/dashboard`}
                    className="text-buttonBlue   mx-8 "
                  >
                    بازگشت
                  </a>
                  {invoiceState == 1 ? (
                    <div className="flex flex-row items-center">
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
                  ) : null}
                </div>
              )}
            </div>
          ) : (
            <div className="col-span-12 flex flex-row items-center justify-end my-6">
              <a href={`/user/dashboard`}>
                <Button className="text-buttonBlue  border-2 border-buttonBlue rounded-md px-4 w-36 ">
                  بازگشت
                </Button>
              </a>
            </div>
          )}
        </div>
      )}
      {changePage == 'workflow' && <WorkFlow data={workFlowConvertData} />}
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
      <LoadingModal visible={visibleLoading} />
    </div>
  );
}
export default withAlert(InvoiceDetails);
