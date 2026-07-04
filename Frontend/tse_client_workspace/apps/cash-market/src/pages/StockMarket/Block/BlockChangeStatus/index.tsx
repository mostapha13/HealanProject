import withAlert from 'apps/cash-market/src/hoc/withAlert';
import {
  useStates,
  useEffect,
  useState,
  useNavigate,
  useSearchParams,
} from '@tse/utils';
import ImageUploadPreview from 'apps/cash-market/src/components/ImageUploadPreview';
import { Button, TextField, Upload, Modal } from '@tse/components/atoms';
import {
  convertDateAndTimeToJalali,
  downloadFile,
  loadFromStorage,
} from '@tse/tools';
import {
  exportBlockNotification,
  getOrderWorkFlow,
  getTransferBlocksByOrderId,
  saveBlockData,
  transferBlockEnd,
  transferBlockReject,
  uploadFile,
} from 'apps/cash-market/src/Controller';
import { Radio } from 'antd';
import type { RadioChangeEvent } from 'antd';
import WorkFlow from 'apps/cash-market/src/components/PageFeature/WorkFlow';
import { HeaderTypes } from '@tse/types';
import { Table } from '@tse/components/organism';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import { BASE_URL } from '../../../../constants';

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
const initialState = {
  isTrackingModalVisible: false,
  changePage: 'request',
  pageNo: 1,
  publicMessage: '',
  privateMessage: '',
  chnageStatus: false,
  uploadFileError: false,
  uploadFileName: '',
  uploadFileLink: '',
  uploadFileId: '',
  blockData: {},
  isModalConfirmVisible: false,
  isModalRejectVisible: false,
  workFlow: null,
  exportBlockNotificationData: null,
};
function BlockChangeStatus({ onAlert }: any) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useStates<any>(initialState);
  const {
    isTrackingModalVisible,
    changePage,
    pageNo,
    publicMessage,
    privateMessage,
    chnageStatus,
    uploadFileError,
    uploadFileName,
    uploadFileLink,
    uploadFileId,
    blockData,
    isModalConfirmVisible,
    isModalRejectVisible,
    workFlow,
    exportBlockNotificationData,
  } = state;

  const orderId = searchParams.get('id') != null ? searchParams.get('id') : '';
  const history =
    searchParams.get('history') != null ? searchParams.get('history') : '';

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
  useEffect(() => {
    handleGetTransferBlock();
    getWorkFlow();
    if (!history) {
      handleExportBlockNotification();
    }
  }, []);
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
  function handleGetTransferBlock() {
    getTransferBlocksByOrderId({
      orderId: orderId,
      onSuccess: (res) => {
        setState({
          blockData: res,
        });
      },
      onFail,
    });
  }
  const onOkModalConfirmClick = () => {
    setState({ isModalConfirmVisible: false });
    transferBlockEnd({
      orderId: orderId,
      publicMessage: publicMessage,
      privateMessage: privateMessage,
      transferBlockFileName: uploadFileId,
      transferBlockState: chnageStatus ? 1 : 2,
      onSuccess: (res) => {
        if (res?.succeeded) {
          onAlert({
            type: 'success',
            message: 'اطلاعات با موفقیت تایید گردید',
          });
          navigate('/cartable');
        }
      },
      onFail,
    });
  };
  const onRejectClick = () => {
    setState({ isModalRejectVisible: false });
    transferBlockReject({
      orderId: orderId,
      publicMessage: publicMessage,
      privateMessage: privateMessage,
      onSuccess: (res) => {
        if (res?.succeeded) {
          onAlert({
            type: 'success',
            message: 'درخواست شما با موفقیت ثبت گردید.',
          });
          navigate('/cartable');
        }
      },
      onFail,
    });
  };
  const onChangeFile = (e: any) => {
    uploadFile({
      data: e.target.files[0],
      onSuccess: (res: any) => onSuccessUpload(res),
      onFail,
    });
  };

  const onSuccessUpload = (res: any) => {
    setState({
      uploadFileName: res?.fileName,
      uploadFileLink: res?.link,
      uploadFileId: res?.fileId,
      uploadFileError: false,
    });
  };
  const onRemoveFile = () => {
    setState({
      uploadFileName: 'حذف گردید',
      uploadFileLink: '',
      uploadFileError: true,
    });
  };
  useEffect(() => {}, [chnageStatus]);
  function handleExportBlockNotification() {
    exportBlockNotification({
      orderId: orderId,
      onSuccess: (res) => {
        setState({
          exportBlockNotificationData: res,
        });
      },
      onFail,
    });
  }
  const downloadExportFile = () => {
    if (exportBlockNotificationData != null) {
      downloadFile(exportBlockNotificationData, 'exportWord.docx');
    }
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
                <span className=" p-2  ">{blockData?.workFlowName} </span>
              </div>
              <div className=" flex flex-row">
                <span className=" p-2 font-bold ">کد پیگیری :</span>
                <span className=" p-2  ">{blockData?.trackingNumber}</span>
              </div>
              <div className=" flex flex-row">
                <span className=" p-2 font-bold ">وضعیت :</span>
                <span className=" p-2  ">{blockData?.orderStatusName}</span>
              </div>
            </div>
            <div className="grid col-span-10 grid-cols-10 gap-4 justify-between mx-4 mt-4">
              <div className="col-span-2 flex flex-col">
                <span className=" font-bold">نماد :</span>
                <span className=" py-2 ">{blockData?.symbol}</span>
              </div>
              <div className="col-span-2 flex flex-col">
                <span className=" font-bold">نام شرکت :</span>
                <span className=" py-2 ">{blockData?.symbolName}</span>
              </div>
              <div className="col-span-2 flex flex-col">
                <span className=" font-bold">حجم معامله :</span>
                <span className=" py-2 ">{blockData?.tradeVolume}</span>
              </div>
              <div className="col-span-2 flex flex-col">
                <span className=" font-bold">قیمت :</span>
                <span className=" py-2 ">{blockData?.tradePrice}</span>
              </div>
            </div>
            <div className="grid col-span-10 grid-cols-10 gap-4  justify-between mx-4 mt-4">
              <div className=" col-span-10 items-start flex  ">
                <span className="  font-bold text-blue underline">
                  اطلاعات خریدار :
                </span>
              </div>
              <div className="col-span-2 flex flex-col">
                <span className=" font-bold">نوع شخصیت :</span>
                <span className=" py-2 ">{blockData?.buyerPersonTypeName}</span>
              </div>
              <div className="col-span-2 flex flex-col">
                <span className=" font-bold">نام خریدار :</span>
                <span className=" py-2 ">{blockData?.buyerFname}</span>
              </div>
              <div className="col-span-3 flex flex-col">
                <span className=" font-bold">
                  نام خانوادگی/نام شرکت خریدار :
                </span>
                <span className=" py-2 ">{blockData?.buyerLname}</span>
              </div>
              <div className="col-span-2 flex flex-col">
                <span className=" font-bold">کارگزار خریدار :</span>
                <span className=" py-2 ">{blockData?.buyerBrokerName}</span>
              </div>
              <div className="col-span-2 flex flex-col">
                <span className=" font-bold">کد بورسی :</span>
                <span className=" py-2 ">{blockData?.buyerCode}</span>
              </div>
            </div>
            <div className="grid col-span-10 grid-cols-10 gap-4  justify-between mx-4 mt-4">
              <div className=" col-span-10 items-start flex  ">
                <span className="  font-bold text-blue underline">
                  اطلاعات فروشنده :
                </span>
              </div>
              <div className="col-span-2 flex flex-col">
                <span className=" font-bold">نوع شخصیت :</span>
                <span className=" py-2 ">
                  {blockData?.sellerPersonTypeName}
                </span>
              </div>
              <div className="col-span-2 flex flex-col">
                <span className=" font-bold">نام فروشنده :</span>
                <span className=" py-2 ">{blockData?.sellerFname}</span>
              </div>
              <div className="col-span-3 flex flex-col">
                <span className=" font-bold">
                  نام خانوادگی/نام شرکت فروشنده :
                </span>
                <span className=" py-2 ">{blockData?.sellerLname}</span>
              </div>
              <div className="col-span-2 flex flex-col">
                <span className=" font-bold">کارگزار فروشنده :</span>
                <span className=" py-2 ">{blockData?.sellerBrokerName}</span>
              </div>
              <div className="col-span-2 flex flex-col">
                <span className=" font-bold">کد بورسی :</span>
                <span className=" py-2 ">{blockData?.sellerCode}</span>
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
                <span className=" py-2 ">{blockData?.responsibleName}</span>
              </div>
              <div className="col-span-2 flex flex-col">
                <span className=" font-bold">سمت :</span>
                <span className=" py-2 ">{blockData?.responsiblePost}</span>
              </div>
              <div className="col-span-2 flex flex-col">
                <span className=" font-bold">شماره همراه :</span>
                <span className=" py-2 ">{blockData?.responsibleMobile}</span>
              </div>
            </div>
            <div className="grid col-span-10 grid-cols-12 gap-4  justify-between mx-4 mt-4">
              <div className=" col-span-12 items-start flex  ">
                <span className="  font-bold text-blue underline">
                  توضیحات :
                </span>
              </div>
              <div className=" col-span-12  pb-4">
                <Table
                  data={blockData?.message}
                  columns={columns}
                  wrapperClassName="!mt-4"
                  onChangePage={onChangePage}
                  totalPages={1}
                  pageSize={10}
                  className="col-span-12 grid grid-cols-12 "
                />
              </div>
            </div>
            <div className="grid col-span-10 grid-cols-10 gap-4  justify-between mx-4 mt-4 ">
              <div className=" col-span-10 items-start flex  ">
                <span className="  font-bold text-blue underline">مدارک :</span>
              </div>
              <div className=" col-span-10 grid grid-cols-4 pb-4 bg-[#EEEBFF] mb-4 px-4">
                {blockData?.transferBlockFile?.length > 0 &&
                  blockData?.transferBlockFile?.map((item: any, index: any) => (
                    <ImageUploadPreview
                      className="2xl:col-span-1 xl:col-span-2 lg:col-span-2 md:col-span-4  col-span-1"
                      data={item}
                      onAlert={onAlert}
                    />
                  ))}
              </div>
            </div>
            <div className="col-span-10  grid-cols-12  grid  items-center px-4 mt-8 mb-4">
              <FormControlLabel
                control={<Checkbox checked={chnageStatus} />}
                label="معامله انجام شد."
                className="!m-0 !text-extratiny col-span-3"
                onClick={() => setState({ chnageStatus: !chnageStatus })}
              />
              <div className=" col-span-5 mr-4">
                <Upload
                  onChange={(file: any) => onChangeFile(file)}
                  value={uploadFileName}
                  href={uploadFileLink}
                  name="uploadFile"
                  onDelete={() => onRemoveFile()}
                  error={uploadFileError}
                />
              </div>
            </div>
            <div className=" col-span-10 bg-lightGray py-4">
              <span className="  font-bold text-blue underline px-4">
                توضیحات :
              </span>
              <div className="  px-10 my-4">
                <TextField
                  multiline
                  className=" bg-white"
                  label="پیام عمومی"
                  onChange={(e: any) => setState({ publicMessage: e })}
                  value={publicMessage}
                  fullWidth
                />
              </div>
              <div className="  px-10 my-4">
                <TextField
                  multiline
                  className=" bg-white"
                  label="پیام محرمانه"
                  onChange={(e: any) => setState({ privateMessage: e })}
                  value={privateMessage}
                  fullWidth
                />
              </div>
            </div>
          </div>
        )}
      </div>
      {changePage == 'workflow' && <WorkFlow data={workFlow} />}
      {changePage != 'workflow' && (
        <div className="flex justify-end my-4">
          <a
            href="/cartable"
            className="border-blue border mx-2 text-blue w-[120px]   flex items-center justify-center rounded"
            // onClick={onConfirm}
          >
            بازگشت
          </a>
          {!history && (
            <>
              {/* <a
                // href="/stock/request-block"
                className="border-blue border mx-4 text-blue w-[120px] h-[35px]  flex items-center justify-center rounded"
                onClick={downloadExportFile}
              >
                دانلود اطلاعیه
              </a> */}
              <a
                className="border-green border mx-2 text-green w-[120px] h-[35px]  flex items-center justify-center rounded"
                onClick={() => setState({ isModalConfirmVisible: true })}
              >
                تایید و اختتام
              </a>
              {/* <a
                // href="/stock/request-block"
                className="border-red border mr-2  text-red w-[120px] h-[35px]  flex items-center justify-center rounded"
                onClick={() => setState({ isModalRejectVisible: true })}
              >
                عدم تایید
              </a> */}
            </>
          )}
        </div>
      )}
      <Modal
        handleOk={() => onOkModalConfirmClick()}
        handleCancel={() => setState({ isModalConfirmVisible: false })}
        isModalVisible={isModalConfirmVisible}
        title={`آیا نسبت به تایید و اختتام اطمینان دارید؟`}
        okText="  بله "
        cancelText="خیر"
      ></Modal>
      <Modal
        handleOk={() => onRejectClick()}
        handleCancel={() => setState({ isModalRejectVisible: false })}
        isModalVisible={isModalRejectVisible}
        title={`آیا نسبت به عدم تایید اطلاعات اطمینان دارید؟`}
        okText="  بله "
        cancelText="خیر"
      ></Modal>
    </div>
  );
}
export default withAlert(BlockChangeStatus);
