import withAlert from 'apps/cash-market/src/hoc/withAlert';
import {
  useStates,
  useEffect,
  useState,
  useNavigate,
  useSearchParams,
} from '@tse/utils';
import ImageUpload from 'apps/cash-market/src/components/ImageUpload';
import ImageUploadPreview from 'apps/cash-market/src/components/ImageUploadPreview';
import {
  Button,
  TextField,
  Modal,
  Select,
  Upload,
} from '@tse/components/atoms';
import {
  convertDateAndTimeJalali,
  convertDateAndTimeToJalali,
  loadFromStorage,
} from '@tse/tools';
import {
  getOrderWorkFlow,
  getTransferStockAttachType,
  getTransferStockByOrderId,
  saveAdditionalDocuments,
  saveBlockData,
  transferStockConfirm,
  transferStockReject,
  uploadFile,
} from 'apps/cash-market/src/Controller';
import { Radio } from 'antd';
import type { RadioChangeEvent } from 'antd';
import WorkFlow from 'apps/cash-market/src/components/PageFeature/WorkFlow';
import { HeaderTypes } from '@tse/types';
import { Table } from '@tse/components/organism';
const initialState = {
  isTrackingModalVisible: false,
  changePage: 'request',
  pageNo: 1,
  publicMessage: '',
  privateMessage: '',
  transferStockData: {},
  isModalConfirmVisible: false,
  isModalRejectVisible: false,
  workFlow: null,
  fileDescription: '',
  fileDescriptionError: '',
  uploadFileError: false,
  uploadFileName: '',
  uploadFileLink: '',
  uploadFileId: '',
  selectedDocumentType: '',
  selectedDocumentTypeName: '',
  allAttachTypeData: [],
  requireAttachDataList: [],
  uploadFileValidate: false,
  requireFileUploadComplete: false,
};
function TransferStockSendAttachment({ onAlert }: any) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useStates<any>(initialState);
  const [uploadFileListItem, setUploadFileListItem] = useState<any>([]);
  const {
    changePage,

    transferStockData,
    fileDescription,
    uploadFileError,
    uploadFileName,
    uploadFileLink,
    uploadFileId,
    selectedDocumentType,
    selectedDocumentTypeName,
    uploadFileValidate,
    allAttachTypeData,
    requireAttachDataList,
    requireFileUploadComplete,
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
    handleGetTransferStock();
  }, []);
  useEffect(() => {
    handleGetTransferStockAttachTypeList(transferStockData?.transferTypeId);
  }, [transferStockData]);
  useEffect(() => {
    checkRequiredData();
  }, [uploadFileListItem]);
  const onFail = (error: any) => {
    onAlert(error);
  };
  const setErrorMessage = (key: string) => {
    const errorMessage = '  ';
    setState({ [`${key}Error`]: errorMessage });
  };
  function handleGetTransferStock() {
    getTransferStockByOrderId({
      orderId: orderId,
      onSuccess: (res) => {
        setState({
          transferStockData: res,
        });
      },
      onFail,
    });
  }
  const onChangePage = (pageNo: number) => {
    setState({
      pageNo,
    });
  };
  const handleModeChange = (e: RadioChangeEvent) => {
    setState({ changePage: e.target.value });
  };
  const checkRequiredData = () => {
    const notAvailable: any = [];
    requireAttachDataList.map((item: any) => {
      uploadFileListItem?.some((data: any) => data?.attachTypeId === item?.id)
        ? null
        : notAvailable.push(item);
    });
    if (notAvailable.length > 0) {
      setState({ uploadFileValidate: true, requireFileUploadComplete: false });
    } else {
      setState({ uploadFileValidate: false, requireFileUploadComplete: true });
    }
  };
  function handleGetTransferStockAttachTypeList(transferTypeId: any) {
    getTransferStockAttachType({
      transferTypeId,
      additionalDocument: true,
      onSuccess: (res) => {
        setState({
          allAttachTypeData: res,
          requireAttachDataList: res.filter(
            (item: any) => item.isRequired == true
          ),
        });
      },
      onFail,
    });
  }
  const onRemoveFile = () => {
    setState({
      uploadFileName: 'حذف گردید',
      uploadFileLink: '',
      uploadFileError: true,
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
  const onUploadFileSubmit = () => {
    if (selectedDocumentType && fileDescription && uploadFileLink) {
      const uploadItem = {
        id: null,
        transferStocId: null,
        attachTypeId: selectedDocumentType,
        description: fileDescription,
        fileId: uploadFileId,
        uploadFileLink: uploadFileLink,
        selectedDocumentTypeName: selectedDocumentTypeName,
        fileName: uploadFileName,
      };
      setUploadFileListItem((item: any) => [...item, uploadItem]);
    } else {
      !selectedDocumentType && setErrorMessage('selectedDocumentType');
      !fileDescription && setErrorMessage('fileDescription');
      !uploadFileLink && setErrorMessage('uploadFile');
    }
  };
  const onDeleteFileList = (id: any) => {
    setUploadFileListItem((item: any) =>
      item.filter((data: any) => data?.fileId != id)
    );
  };
  function onSubmitClick(): void {
    checkRequiredData();
    if (requireFileUploadComplete == true) {
      const data = {
        orderId: orderId,
        transferStockFiles: uploadFileListItem,
      };
      saveAdditionalDocuments({ data, onSuccess: onSuccessSave, onFail });
    } else {
      onAlert({
        type: 'error',
        message: 'لطفا مدارک را به طور کامل بارگذاری نمایید.',
      });
    }
  }
  const onSuccessSave = (res: any) => {
    // setState({
    //   isTrackingModalVisible: true,
    //   trackingNumber: res?.trackingNumber,
    // });
    onAlert({
      type: 'success',
      message: 'اطلاعات با موفقیت ثبت گردید',
    });
    setTimeout(() => {
      // setState({ isTrackingModalVisible: false });
      navigate('/cartable');
    }, 2000);
  };
  return (
    <div>
      <div className="border-2 border-lightGray">
        <div className="w-full grid grid-cols-10 ">
          <div className=" col-span-10 items-start flex border-b-2  justify-between bg-lightGray border-lightGray  px-4">
            <div className=" flex flex-row">
              <span className=" p-2 font-bold ">درخواست :</span>
              <span className=" p-2  ">{transferStockData?.workFlowName}</span>
            </div>
            <div className=" flex flex-row">
              <span className=" p-2 font-bold ">کد پیگیری :</span>
              <span className=" p-2  ">
                {transferStockData?.trackingNumber}
              </span>
            </div>
            <div className=" flex flex-row">
              <span className=" p-2 font-bold ">وضعیت :</span>
              <span className=" p-2  ">
                {transferStockData?.orderStatusName}
              </span>
            </div>
          </div>
          <div className=" col-span-10 items-center flex border-b-2  justify-center bg-[#FFEFEF] border-lightGray py-2  px-4">
            <span className=" font-bold text-red">{`مهلت ارسال مدارک تکمیلی : ${convertDateAndTimeJalali(
              transferStockData?.submissionDeadline
            )}`}</span>
          </div>
          <div className="grid col-span-10 grid-cols-10 gap-4 justify-between mx-4 mt-4">
            <div className="col-span-2 flex flex-row items-center ">
              <div className=" font-bold w-4 h-4 bg-blue rounded-full" />
              <span className=" py-2 mx-2">
                {transferStockData?.transferTypeName}
              </span>
            </div>
          </div>
          <div className="grid col-span-10 grid-cols-10 gap-4 justify-between mx-4 mt-4">
            <div className="col-span-2 flex flex-col">
              <span className=" font-bold">نوع تسویه :</span>
              <span className=" py-2 ">
                {transferStockData?.clearingTypeName}
              </span>
            </div>
            <div className="col-span-2 flex flex-col">
              <span className=" font-bold">نماد :</span>
              <span className=" py-2 ">{transferStockData?.symbol}</span>
            </div>
            <div className="col-span-2 flex flex-col">
              <span className=" font-bold">نام شرکت :</span>
              <span className=" py-2 ">{transferStockData?.symbolName}</span>
            </div>
            <div className="col-span-2 flex flex-col">
              <span className=" font-bold">حجم معامله :</span>
              <span className=" py-2 ">{transferStockData?.tradeVolume}</span>
            </div>
            <div className="col-span-2 flex flex-col">
              <span className=" font-bold">قیمت :</span>
              <span className=" py-2 ">{transferStockData?.tradePrice}</span>
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
              <span className=" py-2 ">
                {transferStockData?.buyerPersonTypeName}
              </span>
            </div>
            <div className="col-span-2 flex flex-col">
              <span className=" font-bold">نام خریدار :</span>
              <span className=" py-2 ">{transferStockData?.buyerFname}</span>
            </div>
            <div className="col-span-2 flex flex-col">
              <span className=" font-bold">نام خانوادگی/نام شرکت خریدار :</span>
              <span className=" py-2 ">{transferStockData?.buyerLname}</span>
            </div>
            <div className="col-span-2 flex flex-col">
              <span className=" font-bold">کارگزار خریدار :</span>
              <span className=" py-2 ">
                {transferStockData?.buyerBrokerName}
              </span>
            </div>
            <div className="col-span-2 flex flex-col">
              <span className=" font-bold">کد معامله گر خریدار :</span>
              <span className=" py-2 ">
                {transferStockData?.buyerTraderCode}
              </span>
            </div>
            <div className="col-span-2 flex flex-col">
              <span className=" font-bold">کد بورسی خریدار :</span>
              <span className=" py-2 ">{transferStockData?.buyerCode}</span>
            </div>
            <div className="col-span-2 flex flex-col">
              <span className=" font-bold">کد بورسی قدیم خریدار :</span>
              <span className=" py-2 ">
                {transferStockData?.buyerOldBourseCode}
              </span>
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
                {transferStockData?.sellerPersonTypeName}
              </span>
            </div>
            <div className="col-span-2 flex flex-col">
              <span className=" font-bold">نام فروشنده :</span>
              <span className=" py-2 ">{transferStockData?.sellerFname}</span>
            </div>
            <div className="col-span-2 flex flex-col">
              <span className=" font-bold">
                نام خانوادگی/نام شرکت فروشنده :
              </span>
              <span className=" py-2 ">{transferStockData?.sellerLname}</span>
            </div>
            <div className="col-span-2 flex flex-col">
              <span className=" font-bold">کارگزار فروشنده :</span>
              <span className=" py-2 ">
                {transferStockData?.sellerBrokerName}
              </span>
            </div>
            <div className="col-span-2 flex flex-col">
              <span className=" font-bold">کد معامله گر فروشنده :</span>
              <span className=" py-2 ">
                {transferStockData?.sellerTraderCode}
              </span>
            </div>
            <div className="col-span-2 flex flex-col">
              <span className=" font-bold">کد بورسی فروشنده :</span>
              <span className=" py-2 ">{transferStockData?.sellerCode}</span>
            </div>
            <div className="col-span-2 flex flex-col">
              <span className=" font-bold">کد بورسی قدیم فروشنده :</span>
              <span className=" py-2 ">
                {transferStockData?.sellerOldBourseCode}
              </span>
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
              <span className=" py-2 ">
                {transferStockData?.responsibleName}
              </span>
            </div>
            <div className="col-span-2 flex flex-col">
              <span className=" font-bold">سمت :</span>
              <span className=" py-2 ">
                {transferStockData?.responsiblePost}
              </span>
            </div>
            <div className="col-span-2 flex flex-col">
              <span className=" font-bold">شماره همراه :</span>
              <span className=" py-2 ">
                {transferStockData?.responsibleMobile}
              </span>
            </div>
          </div>
          <div className="grid col-span-10 grid-cols-10 gap-4  justify-between mx-4 mt-4 ">
            <div className=" col-span-10 items-start flex  ">
              <span className="  font-bold text-blue underline">مدارک :</span>
            </div>
            <div className=" col-span-10 grid grid-cols-4 pb-4 bg-[#EEEBFF] mb-4 px-4">
              {transferStockData?.transferStockFiles?.length > 0 &&
                transferStockData?.transferStockFiles?.map(
                  (item: any, index: any) => (
                    <ImageUploadPreview
                      className="2xl:col-span-1 xl:col-span-2 lg:col-span-2 md:col-span-4  col-span-1"
                      data={item}
                      onAlert={onAlert}
                    />
                  )
                )}
            </div>
          </div>
          <div className="grid col-span-12 grid-cols-12 gap-4  justify-between mx-4 mt-4">
            <div className=" col-span-12 items-start flex flex-col mt-4 ">
              <span className=" p-2 font-bold text-blue underline">
                بارگذاری مدارک تکمیلی :
              </span>
              <span className="p-2 text-red ">
                {uploadFileValidate
                  ? 'مدارک را به طور کامل بارگذاری نمایید.'
                  : ''}
              </span>
            </div>
            <div className="grid grid-cols-12 col-span-12 gap-4  items-center bg-lightGray  p-6 ">
              <div className="2xl:col-span-3 xl:col-span-4 lg:col-span-5 md:col-span-6 col-span-3 mx-4">
                <Select
                  label="نوع مدرک"
                  className=" col-span-3"
                  options={[{ name: '', id: '' }, ...allAttachTypeData]}
                  onChange={(value: any) => {
                    setState({
                      selectedDocumentType: value,
                      selectedDocumentTypeName: allAttachTypeData.filter(
                        (item: any) => item?.id === value
                      )?.[0]?.name,
                    });
                  }}
                  showKey="name"
                  selectedKey="id"
                />
              </div>

              <TextField
                label="توضیحات"
                className="2xl:col-span-2 xl:col-span-4 lg:col-span-5 md:col-span-6  col-span-2"
                value={fileDescription}
                onChange={(value: any) =>
                  setState({
                    fileDescription: value,
                    fileDescriptionError: '',
                  })
                }
                required
                errorMessage={state?.fileDescriptionError}
              />
              <div className=" 2xl:col-span-4 xl:col-span-10 lg:col-span-12 md:col-span-12  col-span-3 mr-4">
                <Upload
                  onChange={(file: any) => onChangeFile(file)}
                  value={uploadFileName}
                  href={uploadFileLink}
                  name="uploadFile"
                  onDelete={() => onRemoveFile()}
                  error={uploadFileError}
                />
              </div>
              <div className=" 2xl:col-span-3 xl:col-span-2 lg:col-span-4 md:col-span-5  col-span-2 flex rounded-full ml-2 justify-end">
                <Button
                  className="border-green border text-white bg-green w-[100px]"
                  onClick={onUploadFileSubmit}
                >
                  ثبت
                </Button>
              </div>
            </div>
            <div className="grid col-span-10 grid-cols-12 gap-4  justify-between mx-4 mt-4 mb-4">
              <div className=" col-span-3  bg-lightGray py-2">
                {requireAttachDataList.map((item: any) => {
                  return (
                    <div className="flex flex-row items-center px-4 py-1">
                      <div
                        className={`w-4 h-4  rounded-full border-2 border-gray ${
                          uploadFileListItem?.some(
                            (data: any) => data?.attachTypeId === item?.id
                          )
                            ? 'bg-green'
                            : 'bg-red'
                        } `}
                      ></div>
                      <span className="mr-4"> {item.name}</span>
                    </div>
                  );
                })}
              </div>
              <div className=" col-span-9 grid grid-cols-6 ">
                {uploadFileListItem.length > 0 &&
                  uploadFileListItem.map((item: any, index: any) => (
                    <ImageUpload
                      className="2xl:col-span-2 xl:col-span-3 lg:col-span-3 md:col-span-6  col-span-1"
                      data={item}
                      onAlert={onAlert}
                      onDeleteFile={onDeleteFileList}
                    />
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {!history && (
        <div className="flex justify-end my-4">
          <Button
            className="border-blue border bg-blue text-white w-[100px]"
            onClick={onSubmitClick}
          >
            ثبت
          </Button>
        </div>
      )}
    </div>
  );
}
export default withAlert(TransferStockSendAttachment);
