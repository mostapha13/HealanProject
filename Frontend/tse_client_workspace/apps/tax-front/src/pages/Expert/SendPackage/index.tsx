import {
  Button,
  Select,
  Image,
  Icon,
  TextField,
  Upload,
} from '@tse/components/atoms';
import type { ErrorType, HeaderTypes, onAlertProps } from '@tse/types';
import { useEffect, useNavigate, useRef, useState } from '@tse/utils';
import withAlert from '../../../hoc/withAlert';
import { SimpleForm } from '@tse/components/molecules';
import type { ListType } from '@tse/types';
import { Table } from 'apps/tax-front/src/components/Table';
import { Modal, Radio } from 'antd';
import type { RadioChangeEvent } from 'antd';
import { FILE_BASE_URL } from 'apps/tax-front/src/constants';
import TextArea from 'antd/lib/input/TextArea';
import completeGif from 'apps/tax-front/src/assets/gif/complete.gif';
import inProgressGif from 'apps/tax-front/src/assets/gif/inProgress.gif';
import { uploader } from 'apps/tax-front/src/controller/Upload';
import { baseUrl } from '../../../constants';
import LoadingModal from 'apps/tax-front/src/components/Loading';

const token = 'cbxnvxmbvmnoasoadho';
import {
  getIndicatorNumber,
  getAllPeriod,
  getTransactionFee,
  sendInvoiceData,
  getExcelTransactionFee,
} from './service';
import { separator } from '@tse/tools';
interface SendPackageTypes {
  onAlert: onAlertProps;
}

function SendPackage({ onAlert }: SendPackageTypes) {
  const [firstLoading, setFirstLoading] = useState(false);
  const [isCompleteModalVisible, setCompleteModalVisible] =
    useState<boolean>(false);
  const [isInProgressModalVisible, setInProgressModalVisible] =
    useState<boolean>(false);
  const [sendMessage, setSendMessage] = useState('');
  const [dataImportMode, setDataImportMode] = useState('excel');
  const [samatSendTtpe, setSamatSendTtpe] = useState('1');
  const [excelSendType, setExcelSendType] = useState('1');
  const [uploadFileValue, setUploadFileValue] = useState(null);
  const [uploadFileLink, setUploadFileLink] = useState('');
  const [uploadFileId, setUploadFileId] = useState('');
  const [indicatorNumber, setIndicatorNumber] = useState();
  const [allPeriodData, setAllPeriodData] = useState<any>([]);
  const [sematTransactionData, setSematTransactionData] = useState<any[]>([]);
  const [formInputData, setFormInputData] = useState<any>();
  const [lastMessage, setLastMessage] = useState('');
  const [periodId, setPeriodId] = useState('');
  const [excelTranactionFee, setExcelTranactionFee] = useState<any[]>([]);
  const [showwDetailLoading, setShowDetailLoading] = useState(false);
  const [visibleLoading, setVisibleLoading] = useState(false);
  const [sendInvoiceType, setSendInvoiceType] = useState('sendSemat');
  const [sendExcelMessage, setSendExcelMessage] = useState('');
  const [sendExcelUploadFileValue, setSendExcelUploadFileValue] =
    useState(null);
  const [sendExcelUploadFileLink, setSendExcelUploadFileLink] = useState('');
  const [sendExcelUploadFileId, setSendExcelUploadFileId] = useState('');
  const [onlyExcelSendType, setOnlyExcelSendType] = useState('1');
  const [sendOnlyExcelTranactionFee, setSendOnlyExcelTranactionFee] = useState<
    any[]
  >([]);
  const [sendOnlyExcelFileError, setSendOnlyExcelFileError] = useState(false);

  const ref = useRef(null);
  const childRef: any = useRef();
  const uploadUrl = `${FILE_BASE_URL}Upload`;
  const navigate = useNavigate();

  useEffect(() => {
    handleGetIndicatorNumber();
    handleGetAllPeriod();
  }, []);

  const onSubmitForm = (data: any) => {
    setFirstLoading(true);
    setFormInputData(data);
    setPeriodId(data?.period);
    setVisibleLoading(true);
    getTransactionFee({
      periodId: data?.period,
      customerType: data?.customerType,
      onSuccess: (res) => {
        setFirstLoading(false);
        setShowDetailLoading(true);
        setVisibleLoading(false);
        const arrayData = [];
        arrayData.push(res?.data);
        setSematTransactionData(arrayData);
      },
      onFail,
    });
  };
  const onChangeFile = (e: any) => {
    const formData = e?.target?.files?.[0] as File;
    setVisibleLoading(true);
    uploader({
      url: uploadUrl,
      file: formData,
      onSuccess: (res: any) => {
        setUploadFileValue(res?.fileName);
        setUploadFileLink(res?.link);
        setUploadFileId(res?.fileId);
        getExcelTransactionFee({
          excelUrl: res?.fileId,
          periodId: periodId,
          onSuccess: (res) => {
            setVisibleLoading(false);
            const arrayData = [];
            arrayData.push(res?.data);
            setExcelTranactionFee(arrayData);
          },
          onFail,
        });
        onAlert({
          type: 'success',
          message: 'فایل با موفقیت آپلود گردید',
        });
      },
      onFail,
    });
  };
  const onSuccessUpload = (res: any) => {};
  const onDeleteFileClick = () => {
    setUploadFileValue(null);
    setUploadFileLink('');
    setUploadFileId('');
    setExcelTranactionFee([]);
  };
  function handleGetIndicatorNumber() {
    getIndicatorNumber({
      onSuccess: (res) => {
        setIndicatorNumber(res?.data?.currentIndicatorNumber);
      },
      onFail,
    });
  }
  function handleGetAllPeriod() {
    getAllPeriod({
      onSuccess: (res) => {
        setAllPeriodData(res?.data);
      },
      onFail,
    });
  }
  const handleModeChange = (e: RadioChangeEvent) => {
    setDataImportMode(e.target.value);
  };
  const handleSamatSendType = (e: RadioChangeEvent) => {
    setSamatSendTtpe(e.target.value);
  };
  const handleSendInvoiceType = (e: RadioChangeEvent) => {
    setSendInvoiceType(e.target.value);
  };
  const handleExcelSendType = (e: RadioChangeEvent) => {
    setExcelSendType(e.target.value);
  };
  const handleOnlyExcelSendType = (e: RadioChangeEvent) => {
    setOnlyExcelSendType(e.target.value);
  };

  function onFail(error: ErrorType) {
    onAlert?.({ message: error?.data?.message || error.data, ...error });
    // setIsloading(false);
  }
  function sendPackageFail(error: ErrorType) {
    onAlert?.({ message: error?.data?.message || error.data, ...error });
    setInProgressModalVisible(false);
    // setIsloading(false);
  }
  const onSuccessPackageSend = (res: any) => {
    setInProgressModalVisible(false);
    setCompleteModalVisible(true);
    setTimeout(() => {
      setCompleteModalVisible(false);
      navigate('/user/dashboard');
    }, 5000);
  };
  const onSendButtonClick = () => {
    sendInvoiceData({
      indicatorNumber: indicatorNumber,
      periodId: formInputData?.period,
      sematInty: samatSendTtpe,
      isMain: 1,
      customerType: formInputData?.customerType,
      excelFileName: uploadFileId,
      excelInty: excelSendType,
      message: lastMessage,
      excelOnly: 0,
      onSuccess: (res) => {
        onSuccessPackageSend(res);
      },
      onFail: (err: ErrorType) => {
        sendPackageFail(err);
      },
    });
    setInProgressModalVisible(true);
  };
  const onChangeSendExcelFile = (e: any) => {
    const formData = e?.target?.files?.[0] as File;
    setVisibleLoading(true);
    uploader({
      url: uploadUrl,
      file: formData,
      onSuccess: (res: any) => {
        setSendExcelUploadFileValue(res?.fileName);
        setSendExcelUploadFileLink(res?.link);
        setSendExcelUploadFileId(res?.fileId);
        setSendOnlyExcelFileError(false);
        getExcelTransactionFee({
          excelUrl: res?.fileId,
          periodId: periodId,
          onSuccess: (res) => {
            setVisibleLoading(false);
            const arrayData = [];
            arrayData.push(res?.data);
            setSendOnlyExcelTranactionFee(arrayData);
          },
          onFail,
        });
        onAlert({
          type: 'success',
          message: 'فایل با موفقیت آپلود گردید',
        });
      },
      onFail,
    });
  };
  const onDeleteSendExcelFileClick = () => {
    setSendExcelUploadFileValue(null);
    setSendExcelUploadFileLink('');
    setSendExcelUploadFileId('');
    setSendOnlyExcelTranactionFee([]);
  };
  const onSendExcelButtonClick = () => {
    if (sendExcelUploadFileId) {
      sendInvoiceData({
        indicatorNumber: indicatorNumber,
        periodId: formInputData?.period,
        sematInty: 0,
        isMain: 1,
        customerType: formInputData?.customerType,
        excelFileName: sendExcelUploadFileId,
        excelInty: onlyExcelSendType,
        message: sendExcelMessage,
        excelOnly: 1,
        onSuccess: (res) => {
          onSuccessPackageSend(res);
        },
        onFail: (err: ErrorType) => {
          sendPackageFail(err);
        },
      });
      setInProgressModalVisible(true);
    } else {
      !sendExcelUploadFileId && setSendOnlyExcelFileError(true);
    }
  };

  const tableHeaderSemat: HeaderTypes[] = [
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
      dataIndex: 'fileCount',
      key: 'fileCount',
      className: 'col-span-4',
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'جمع مبلغ',
      dataIndex: 'transactionSum',
      key: 'transactionSum',
      className: 'col-span-4',
      render: (item: any) => <span>{separator(item)}</span>,
    },
  ];
  const formList: ListType[] = [
    {
      itemType: 'select',
      className: 'col-span-2',
      label: 'نوع  خریدار',
      required: true,
      require: 'نوع خریدار نمی تواند خالی باشد',
      name: 'customerType',
      options: [
        { name: '', value: '' },
        { name: 'حقیقی', value: '1' },
        { name: 'حقوقی', value: '2' },
      ],
    },
    {
      itemType: 'select',
      className: 'col-span-2',
      label: 'دوره',
      required: true,
      require: 'دوره نمی تواند خالی باشد',
      name: 'period',

      options: [
        { name: '', value: '' },
        ...allPeriodData?.map((item: any) => ({
          name: item?.title,
          value: item?.id,
        })),
      ],
    },
    {
      itemType: 'input',
      className: 'col-span-2',
      label: 'شرح',
      required: false,
      // require: 'شرح نمی تواند خالی باشد',
      name: 'description',
    },
    {
      itemType: 'input',
      className: 'col-span-2',
      label: 'شماره اندیکاتور',
      value: indicatorNumber,
      disabled: true,
      required: false,
      // require: 'شماره اندیکاتور نمی تواند خالی باشد',
      name: 'indicatorNumber',
    },

    {
      itemType: 'button',
      value: 'نمایش',
      className: 'col-span-4 grid justify-end ',
      buttonClassName: 'bg-buttonBlue border-2 border-lightBlue',
      buttonTitleClassName: 'text-white',
    },
  ];

  const CompleteModal = () => {
    return (
      <>
        <Modal
          visible={isCompleteModalVisible}
          closable={false}
          style={{ textAlign: 'center', padding: '0px' }}
          title={''}
          footer={null}
          centered
        >
          <div className="flex justify-center flex-col items-center">
            <Image className="w-[240px] h-[240px]" src={completeGif} alt="" />
            <span className=" font-bold mt-4">
              صورتحساب با موفقیت ارسال شد.
            </span>
            {/* <Image src={srcImage} className="" /> */}
          </div>
        </Modal>
      </>
    );
  };
  const InProgressModal = () => {
    return (
      <>
        <Modal
          visible={isInProgressModalVisible}
          closable={false}
          style={{ textAlign: 'center', padding: '0px' }}
          title={''}
          footer={null}
          centered
        >
          <div className="flex justify-center flex-col items-center">
            <Image className="w-[240px] h-[240px]" src={inProgressGif} alt="" />
            <span className=" font-bold mt-4">
              اطلاعات در حال ارسال می باشد.
            </span>
            {/* <Image src={srcImage} className="" /> */}
          </div>
        </Modal>
      </>
    );
  };

  return (
    <div className=" p-10 ">
      <div className=" px-6 py-3 grid grid-cols-12  mb-3 border-li shadow-[0_0px_5px_rgba(0,0,0,0.2)]">
        <span className=" col-span-12 border-b-2 border-lightGray text-base font-bold">
          ارسال صورتحساب
        </span>

        <div className=" col-span-12 grid grid-cols-12 ">
          <div className=" col-span-12 grid grid-cols-12 ">
            <div className="col-span-12 py-6 ">
              {allPeriodData != undefined && (
                <SimpleForm
                  list={formList}
                  className="col-span-12 grid grid-cols-12 pl-2 gap-4"
                  onSubmit={onSubmitForm}
                  values={sendMessage}
                  reference={childRef}
                  isLoading={firstLoading}
                />
              )}
            </div>
          </div>
          {showwDetailLoading ? (
            <div className=" col-span-12">
              <div className=" col-span-12 mt-6 flex-row ">
                <span className="ml-6 font-bold">نوع ارسال :</span>
                <Radio.Group
                  defaultValue="1"
                  onChange={handleSendInvoiceType}
                  value={sendInvoiceType}
                  style={{ marginBottom: 5 }}
                >
                  <Radio value="sendSemat">سمات و اکسل</Radio>
                  <Radio value="sendExcel">اکسل</Radio>
                </Radio.Group>
              </div>
              {sendInvoiceType == 'sendSemat' && (
                <div className=" col-span-12">
                  <div className=" col-span-12 flex flex-1 justify-between mt-8 mb-2 ">
                    <span className="text-base font-bold">
                      سرجمع کارمزد معاملات
                    </span>
                    <div>
                      {formInputData?.customerType && (
                        <a
                          href={
                            baseUrl +
                            `Invoice/ExportTransactionFeeByPeriodIdToExcel/${formInputData?.period}/${formInputData?.customerType}`
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
                            سرجمع
                          </span>
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="col-span-12 border-2 border-grayBackground">
                    <Table
                      // className="py-6"
                      columns={tableHeaderSemat}
                      data={sematTransactionData}
                      pageSize={1}
                      totalPages={1}
                      onChangePage={() => console.log('')}
                      onChange={() => console.log('')}
                    />
                  </div>
                  <div className=" col-span-12 mt-6 flex-row ">
                    <span className="ml-6 font-bold">الگوی ارسال :</span>
                    <Radio.Group
                      defaultValue="1"
                      onChange={handleSamatSendType}
                      value={samatSendTtpe}
                      style={{ marginBottom: 5 }}
                    >
                      <Radio value="1">نوع 1</Radio>
                      <Radio value="2">نوع 2</Radio>
                    </Radio.Group>
                  </div>
                  <div className="col-span-12 mt-12 border-t-2 border-lightGray py-6">
                    <span className="ml-6 font-bold">
                      بارگذاری سایر اطلاعات :
                    </span>
                    <div className="col-span-12  py-6 ">
                      <div className="grid grid-cols-12 ">
                        <Upload
                          className="col-span-4"
                          name={'cancelationExcel'}
                          // label={'فایل جهت ابطال موارد'}
                          onChange={(file: any) => onChangeFile(file)}
                          value={uploadFileValue}
                          // onDelete={() => setUploadFileValue(null)}
                          onDelete={onDeleteFileClick}
                          link={uploadFileLink}
                          // error={orderFile1Error}
                          fileFormat=".xlsx,.xls"
                        />
                        <div className=" col-span-8 mt-6 px-20 flex-row ">
                          <span className="ml-6 font-bold">الگوی ارسال :</span>
                          <Radio.Group
                            defaultValue="1"
                            onChange={handleExcelSendType}
                            value={excelSendType}
                            style={{ marginBottom: 5 }}
                          >
                            <Radio value="1">نوع 1</Radio>
                            <Radio value="2">نوع 2</Radio>
                          </Radio.Group>
                        </div>
                      </div>
                      <div className=" col-span-12 flex flex-1 justify-between mt-8 mb-2">
                        <span className="text-base font-bold">سرجمع اکسل</span>
                        {/* <div>
                  <a>
                    <Icon
                      name="icon-file-excel"
                      classname=" text-green ml-1 text-lg"
                    />
                    <span className="text-base font-bold underline ">
                      سرجمع
                    </span>
                  </a>
                </div> */}
                      </div>
                      <div className="border-2 border-grayBackground">
                        <Table
                          // className="mt-6"
                          columns={tableHeaderExcel}
                          data={excelTranactionFee}
                          pageSize={1}
                          totalPages={1}
                          onChangePage={() => console.log('')}
                          onChange={() => console.log('')}
                        />
                      </div>
                    </div>
                  </div>
                  <div className=" col-span-12 flex flex-col   my-6 ">
                    <span className="text-base font-bold col-span-12">
                      ارسال پیام
                    </span>
                    <TextField
                      className="col-span-12 border-2 border-lightGray mt-2"
                      onChange={(e: string) => setLastMessage(e)}
                      value={lastMessage}
                      tag="textarea"
                    />
                  </div>

                  <div className="col-span-12 flex flex-row items-center justify-end my-4">
                    <Button
                      onClick={() => onSendButtonClick()}
                      className="text-white bg-buttonBlue  border-2 border-buttonBlue rounded-md px-4 mr-4 w-36 "
                    >
                      ارسال به مدیر
                    </Button>
                  </div>
                </div>
              )}
              {sendInvoiceType == 'sendExcel' && (
                <div className="col-span-12 grid grid-cols-12 my-6">
                  <Upload
                    className="col-span-4"
                    name={'cancelationExcel'}
                    onChange={(file: any) => onChangeSendExcelFile(file)}
                    value={sendExcelUploadFileValue}
                    onDelete={onDeleteSendExcelFileClick}
                    link={sendExcelUploadFileLink}
                    error={sendOnlyExcelFileError}
                    fileFormat=".xlsx,.xls"
                  />
                  <div className=" col-span-8 mt-6 px-20 flex-row ">
                    <span className="ml-6 font-bold">الگوی ارسال :</span>
                    <Radio.Group
                      defaultValue="1"
                      onChange={handleOnlyExcelSendType}
                      value={onlyExcelSendType}
                      style={{ marginBottom: 5 }}
                    >
                      <Radio value="1">نوع 1</Radio>
                      <Radio value="2">نوع 2</Radio>
                    </Radio.Group>
                  </div>
                  <div className=" col-span-12 flex flex-1 justify-between mt-8 mb-2">
                    <span className="text-base font-bold">سرجمع اکسل</span>
                  </div>
                  <div className="border-2 col-span-12 border-grayBackground">
                    <Table
                      // className="mt-6"
                      columns={tableHeaderExcel}
                      data={sendOnlyExcelTranactionFee}
                      pageSize={1}
                      totalPages={1}
                      onChangePage={() => console.log('')}
                      onChange={() => console.log('')}
                    />
                  </div>
                  <div className=" col-span-12 flex flex-col   my-6 ">
                    <span className="text-base font-bold col-span-12">
                      ارسال پیام
                    </span>
                    <TextField
                      className="col-span-12 border-2 border-lightGray mt-2"
                      onChange={(e: string) => setSendExcelMessage(e)}
                      value={sendExcelMessage}
                      tag="textarea"
                    />
                  </div>
                  <div className="col-span-12 flex flex-row items-center justify-end my-4">
                    <Button
                      onClick={() => onSendExcelButtonClick()}
                      className="text-white bg-buttonBlue  border-2 border-buttonBlue rounded-md px-4 mr-4 w-36 "
                    >
                      ارسال به مدیر
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
      <CompleteModal />
      <InProgressModal />
      <LoadingModal visible={visibleLoading} />
    </div>
  );
}
export default withAlert(SendPackage);
