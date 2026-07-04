import { SimpleForm } from '@tse/components/molecules';
import { ListType, ErrorType, onAlertProps, HeaderTypes } from '@tse/types';
import {
  useState,
  useEffect,
  useRef,
  request,
  useSearchParams,
  useNavigate,
} from '@tse/utils';
import withAlert from '../../../hoc/withAlert';
import { Radio, RadioChangeEvent } from 'antd';
import { ExtendedTable } from '@tse/components/organism';
import { Button, Icon, Modal, TextField, Upload } from '@tse/components/atoms';
import { FILE_BASE_URL } from 'apps/tax-front/src/constants';
import { uploader } from 'apps/tax-front/src/controller/Upload';
import { Table } from 'apps/tax-front/src/components/Table';
import { convertDateToJalali, separator } from '@tse/tools';
import { baseUrl } from '../../../constants';
import {
  cancelInvoice,
  getCancelInvoiceTransactionFee,
  getExcelTransactionFee,
} from './service';
import LoadingModal from 'apps/tax-front/src/components/Loading';

interface SetSamatOffsetType {
  onAlert: onAlertProps;
}

function CancelationPackage(props: SetSamatOffsetType) {
  const { onAlert } = props;
  const navigate = useNavigate();
  const [values, setValues] = useState({});
  const [isLoading, setLoading] = useState(false);
  const [deleteMode, setDeleteMode] = useState('allData');
  const [uploadFileValue, setUploadFileValue] = useState(null);
  const [uploadFileLink, setUploadFileLink] = useState('');
  const [uploadFileId, setUploadFileId] = useState('');
  const [searchParams] = useSearchParams();
  const [visibleLoading, setVisibleLoading] = useState(false);
  const [firstLoadingVisible, setFirstLoadingVisible] = useState(false);
  const [isModalDeleteAllVisible, setIsModalDeleteAllVisible] = useState(false);
  const [isModalDeleteExcelVisible, setIsModalDeleteExcelVisible] =
    useState(false);

  const [cancelInvoiceTransactionFee, setCancelInvoiceTransactionFee] =
    useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [excelMessage, setExcelMessage] = useState('');
  const [excelTranactionFee, setExcelTranactionFee] = useState<any[]>([]);
  const [showExcelPage, setShowExcelPage] = useState(false);
  const sendDate: any = searchParams.get('sendDate');
  const indicatorNumber: any = searchParams.get('indicatorNumber');
  const periodId: any = searchParams.get('periodId');
  const perriodTitle: any = searchParams.get('perriodTitle');
  const childRef: any = useRef();
  const gridRef: any = useRef();
  const uploadUrl = `${FILE_BASE_URL}Upload`;
  function onFail(error: ErrorType) {
    onAlert?.({ message: error?.data?.message || error.data, ...error });
    setVisibleLoading(false);
  }

  const data = [
    {
      countTransactionFee: 12351,
      sumFee: 23156312,
      sumVolume: 32211322,
    },
  ];
  // const columns: any = [
  //   {
  //     headerName: 'تاریخ',
  //     field: 'lasttradedate',
  //     cellClass: 'text-center',
  //     flex: 1,
  //     headerClass: '!pr-2',
  //   },
  //   {
  //     headerName: 'زمان',
  //     field: 'tradevolume',
  //     flex: 1,
  //     headerClass: '!pr-2',

  //     cellClass: 'text-center',
  //   },
  //   {
  //     headerName: 'مکان',
  //     field: 'tradevalue',
  //     flex: 1,
  //     headerClass: '!pr-2',
  //     cellClass: 'text-center',
  //   },
  // ];
  const tableHeaderAll: HeaderTypes[] = [
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
  useEffect(() => {
    setFirstLoadingVisible(true);
    handleGetCancelInvoiceTransactionFee();
  }, []);
  function handleGetCancelInvoiceTransactionFee() {
    getCancelInvoiceTransactionFee({
      periodId: periodId,
      indicatorNumber: indicatorNumber,
      onSuccess: (res) => {
        const arrayData = [];
        arrayData.push(res?.data);
        setCancelInvoiceTransactionFee(arrayData);
        setFirstLoadingVisible(false);
      },
      onFail,
    });
  }

  const handleModeChange = (e: RadioChangeEvent) => {
    setDeleteMode(e.target.value);
  };
  const onChangeFile = (e: any) => {
    setVisibleLoading(true);
    console.log('e.target', e);
    const formData = e?.target?.files?.[0] as File;
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
            setVisibleLoading(false);
          },
          onFail,
        });
        onAlert({
          type: 'success',
          message: 'فایل با موفقیت آپلود گردید',
        });
        setShowExcelPage(true);
      },
      onFail,
    });
  };
  const onSuccessUpload = (res: any) => {};
  const onDeleteAllClick = () => {
    setIsModalDeleteAllVisible(true);
  };
  const onOkModalDeleteAllClick = () => {
    setIsModalDeleteAllVisible(false);
    setVisibleLoading(true);
    cancelInvoice({
      periodId: periodId,
      indicatorNumber: indicatorNumber,
      cancelAll: true,
      excelFileName: '',
      message: message,
      onSuccess: (res) => {
        // setLoading(false);
        if (res?.data?.isSuccess) {
          onAlert({
            type: 'success',
            message: 'اطلاعات با موفقیت ابطال گردید',
          });
          navigate('/user/dashboard');
          setVisibleLoading(false);
        }
        // setVisibleLoading(false);
      },
      onFail,
    });
  };
  const onDeleteFileClick = () => {
    setIsModalDeleteExcelVisible(true);
  };
  const onOkModalDeleteExcelClick = () => {
    setIsModalDeleteExcelVisible(false);
    setVisibleLoading(true);
    cancelInvoice({
      periodId: periodId,
      indicatorNumber: indicatorNumber,
      cancelAll: false,
      excelFileName: uploadFileId,
      message: excelMessage,
      onSuccess: (res) => {
        // setLoading(false);
        if (res?.data?.isSuccess) {
          onAlert({
            type: 'success',
            message: 'اطلاعات با موفقیت ابطال گردید',
          });
          setVisibleLoading(false);
          navigate('/user/dashboard');
        }
        // setVisibleLoading(false);
      },
      onFail,
    });
  };

  return (
    <div className="p-10">
      <div className="px-6">
        <h2 className="col-span-full text-lg font-medium border-b-2 py-4 border-lightGray">
          ابطال
        </h2>
        <div className="flex bg-headerGray py-4 justify-between px-4">
          <div>
            <span className=" text-lightGray">شرح : </span>
            <span className="text-white">{perriodTitle}</span>
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
      </div>
      <div className="col-span-12 mt-12 border-t-2 border-lightGray px-6 py-6">
        <Radio.Group
          defaultValue="excel"
          onChange={handleModeChange}
          value={deleteMode}
          style={{ marginBottom: 5 }}
        >
          <Radio value="allData">ابطال همه</Radio>
          <Radio value="custom">ابطال چند مورد</Radio>
        </Radio.Group>
        {deleteMode === 'allData' && (
          <div className="col-span-12 py-6 ">
            <div className=" col-span-12 flex justify-end mb-4">
              <a
                href={
                  baseUrl +
                  `Invoice/ExportCancelInvoiceTransactionFeeByPeriodIdToExcelManager/${periodId}/${indicatorNumber}`
                }
                target="_blank"
                rel="noreferrer"
                className="text-tiny font-bold truncate "
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
            {/* <ExtendedTable
              rowGroupPanelShow="never"
              gridRef={gridRef}
              columnDefs={columns}
              rowData={data}
              paginationPageSize={28}
              enableRtl={true}
              animateRows
              pagination
              className={`
            col-span-12 md:col-span-12 sm:col-span-12 xs:col-span-12 mt-4 h-[600px] `}
            /> */}
            <div className="border-2 border-grayBackground ">
              <Table
                className="col-span-12 md:col-span-12 sm:col-span-12 xs:col-span-12 mt-4"
                columns={tableHeaderAll}
                data={cancelInvoiceTransactionFee}
                pageSize={1}
                totalPages={1}
                onChangePage={() => console.log('')}
                onChange={() => console.log('')}
              />
            </div>
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
            <a className="flex items-end justify-end mt-6">
              <Button
                onClick={onDeleteAllClick}
                className="text-white bg-buttonBlue  border-2 border-lightGrayOpacity rounded-md w-[180px] mt-4 "
              >
                ابطال و ارسال به مدیر
              </Button>
            </a>
          </div>
        )}
        {deleteMode === 'custom' && (
          <div className="col-span-12   py-6">
            <span className="col-span-12 font-semibold  px-2 ">
              فایل اکسل مربوط به موارد ابطالی را آپلود نمایید.
            </span>
            <div className=" grid grid-cols-12 col-span-12">
              <div className="2xl:col-span-3 xl:col-span-4 lg:col-span-5 md: col-span-6 sm:col-span-12 py-6 ">
                {/* <SimpleForm
                list={uploadList}
                className="col-span-12 grid grid-cols-12 pl-2 gap-4"
                onSubmit={onSubmitForm}
                values={sendMessage}
                reference={childRef}
                // isLoading={loading}
              /> */}
                <Upload
                  name={'cancelationExcel'}
                  // label={'فایل جهت ابطال موارد'}
                  onChange={(file: any) => onChangeFile(file)}
                  value={uploadFileValue}
                  onDelete={() => {
                    setUploadFileValue(null);
                    setShowExcelPage(false);
                  }}
                  link={uploadFileLink}
                  // error={orderFile1Error}
                  fileFormat=".xlsx,.xls"
                />
              </div>
            </div>
            {/* <ExtendedTable
              rowGroupPanelShow="never"
              gridRef={gridRef}
              columnDefs={columns}
              rowData={data}
              paginationPageSize={28}
              enableRtl={true}
              animateRows
              pagination
              className={`
            col-span-12 md:col-span-12 sm:col-span-12 xs:col-span-12 mt-4 h-[600px] `}
            /> */}
            {showExcelPage ? (
              <div>
                <div className="border-2 border-grayBackground ">
                  <Table
                    className="col-span-12 md:col-span-12 sm:col-span-12 xs:col-span-12 mt-4"
                    columns={tableHeaderExcel}
                    data={excelTranactionFee}
                    pageSize={1}
                    totalPages={1}
                    onChangePage={() => console.log('')}
                    onChange={() => console.log('')}
                  />
                </div>
                <div className=" col-span-12 flex flex-col   my-6 ">
                  <span className="text-base font-bold col-span-12 mb-4">
                    ارسال پیام
                  </span>
                  <TextField
                    className="col-span-12 border-2 border-lightGray mt-2"
                    onChange={(e: any) => setExcelMessage(e)}
                    label="متن پیام"
                    value={excelMessage}
                    type="text"
                    // multiline
                    // tag="textarea"
                  />
                </div>
                <a
                  // href="expert/send-addenduum?id=102426"
                  className="flex items-end justify-end mt-6 col-span-12"
                >
                  <Button
                    onClick={onDeleteFileClick}
                    className="text-white  bg-buttonBlue  border-2 border-lightGrayOpacity rounded-md w-[180px] mt-4 "
                  >
                    ابطال و ارسال به مدیر
                  </Button>
                </a>
              </div>
            ) : null}
          </div>
        )}
      </div>
      <LoadingModal visible={visibleLoading} />
      <LoadingModal visible={firstLoadingVisible} />
      <Modal
        handleOk={() => onOkModalDeleteAllClick()}
        handleCancel={() => setIsModalDeleteAllVisible(false)}
        isModalVisible={isModalDeleteAllVisible}
        title={`آیا نسبت به ابطال دوره انتخابی اطمینان دارید؟`}
      ></Modal>
      <Modal
        handleOk={() => onOkModalDeleteExcelClick()}
        handleCancel={() => setIsModalDeleteExcelVisible(false)}
        isModalVisible={isModalDeleteExcelVisible}
        title={`آیا نسبت به ابطال اطلاعات فایل ارسالی اطمینان دارید؟`}
      ></Modal>
    </div>
  );
}

export default withAlert(CancelationPackage);
