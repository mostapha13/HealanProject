import withAlert from 'apps/cash-market/src/hoc/withAlert';
import {
  useStates,
  useEffect,
  useState,
  useNavigate,
  useSearchParams,
} from '@tse/utils';
import ImageUploadPreview from 'apps/cash-market/src/components/ImageUploadPreview';
import {
  Button,
  TextField,
  Modal,
  Collapse,
  Upload,
  Image,
} from '@tse/components/atoms';
import {
  convertDateAndTime,
  convertDateAndTimeJalali,
  convertDateAndTimeToJalali,
  convertDateToJalali,
  downloadFile,
  loadFromStorage,
  separator,
} from '@tse/tools';
import {
  getOrderWorkFlow,
  getInitialSupplyByOrderId,
  initialSupplyConfirm,
  initialSupplyReject,
  uploadFile,
  closeFormStock,
} from 'apps/cash-market/src/Controller';
import { Radio } from 'antd';
import type { RadioChangeEvent } from 'antd';
import WorkFlow from 'apps/cash-market/src/components/PageFeature/WorkFlow';
import { HeaderTypes } from '@tse/types';
import { Table } from '@tse/components/organism';
import {
  endWholeSale,
  exportWholesaleForm1,
  exportWholesaleNotification,
  exportWholesaleToCeo,
  getCancellationWholesaleAttachType,
  getCancellationWholesaleByOrderId,
  getWholeSale,
  getWholeSaleCategory,
  getWholeSaleDocumentList,
  getWholeSaleTradeTypes,
  saveCancellationWholesale,
  saveWholeSaleTradeType,
  saveWholesaleDetailExpert,
  uploadDocuments,
  wholeSaleReject,
} from 'apps/cash-market/src/Controller/StockMarket/WholeSale';
import NewSelect from 'apps/cash-market/src/components/atoms/NewSelect';
import pdfLogo from 'apps/cash-market/src/assets/images/pdfLogo.png';
import { FILE_BASE_URL } from 'apps/cash-market/src/constants';
import { DatePicker } from '@tse/components/molecules';
import ImageUpload from 'apps/cash-market/src/components/ImageUpload';
import { Modal as AntModal } from 'antd';

const initialState = {
  id: '',
  changePage: 'request',
  pageNo: 1,
  publicMessage: '',
  privateMessage: '',
  wholeSaleSellData: null,
  wholesaleSeller: [],
  requireAttachDataList: [],
  uploadFileValidate: false,
  requireFileUploadComplete: false,
  uploadFileData: null,
  cancellationWholesaleAttachTypeData: [],
  selectedDocumentType: '',
  selectedDocumentTypeName: '',
  selectedDocumentTypeError: '',
  fileDescription: '',
  uploadFileDataError: false,
  sumOfCashSharePercent: '',
  editModeData: null,
  isTrackingModalVisible: false,
  trackingNumber: '',
  wholesaleTypeIdEdit: '',
  isModalCloseFormVisible: false,
};
function CanellationRequestSellWholesale({ onAlert }: any) {
  const [state, setState] = useStates<any>(initialState);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    id,
    publicMessage,
    privateMessage,
    wholeSaleSellData,
    wholesaleSeller,
    requireAttachDataList,
    uploadFileValidate,
    requireFileUploadComplete,
    uploadFileData,
    cancellationWholesaleAttachTypeData,
    selectedDocumentType,
    selectedDocumentTypeName,
    fileDescription,
    uploadFileDataError,
    sumOfCashSharePercent,
    editModeData,
    isTrackingModalVisible,
    trackingNumber,
    wholesaleTypeIdEdit,
    isModalCloseFormVisible,
  } = state;
  const [uploadFileListItem, setUploadFileListItem] = useState<any>([]);
  const [uploadFileListItemOthers, setUploadFileListItemOthers] = useState<any>(
    []
  );
  const orderId =
    searchParams.get('id') != null ? searchParams.get('id') : null;

  const wholesaleInstrumentId =
    searchParams.get('wholesaleInstrumentId') != null
      ? searchParams.get('wholesaleInstrumentId')
      : null;
  const wholesaleId =
    searchParams.get('wholesaleId') != null
      ? searchParams.get('wholesaleId')
      : null;
  const wholesaleOrderId =
    searchParams.get('wholesaleOrderId') != null
      ? searchParams.get('wholesaleOrderId')
      : null;
  const wholesaleTypeId =
    searchParams.get('wholesaleTypeId') != null
      ? searchParams.get('wholesaleTypeId')
      : null;
  const sellerColumns: HeaderTypes[] = [
    {
      title: 'شناسه',
      dataIndex: 'tableId',
      className: 'col-span-1 !justify-start',
      key: 'tableId',
    },
    {
      title: 'حقیقی/حقوقی',
      dataIndex: 'personTypeName',
      className: 'col-span-2 !justify-start',
      key: 'personTypeName',
    },
    {
      title: 'نام عرضه کننده',
      dataIndex: 'sellerName',
      className: 'col-span-2 !justify-start',
      key: 'sellerName',
    },
    {
      title: 'نام خانوادگی/نام شرکت',
      dataIndex: 'sellerFamily',
      className: 'col-span-2 !justify-start',
      key: 'sellerFamily',
    },
    {
      title: 'کد بورسی',
      dataIndex: 'sellerCode',
      className: 'col-span-1 !justify-center',
      key: 'sellerCode',
    },
    {
      title: 'تعداد سهم',
      dataIndex: 'shareCount',
      className: 'col-span-1 !justify-center',
      key: 'shareCount',
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'درصد فروش از کل معامله',
      dataIndex: 'cashSharePercent',
      className: 'col-span-2 !justify-center',
      key: 'cashSharePercent',
    },
  ];
  const columns: HeaderTypes[] = [
    {
      title: 'کاربر ',
      dataIndex: 'marketUserName',
      key: 'marketUserName',
      className: 'col-span-2 !justify-start',
    },
    {
      title: 'نوع پیام ',
      dataIndex: 'isPrivate',
      key: 'isPrivate',
      className: 'col-span-2 !justify-start',
      render: (item: any) => <span>{item === true ? 'خصوصی' : 'عمومی'}</span>,
    },
    {
      title: 'تاریخ ',
      dataIndex: 'commentDate',
      key: 'commentDate',
      className: 'col-span-2 !justify-start',
      render: (item: any) => <span>{convertDateAndTimeToJalali(item)}</span>,
    },
    {
      title: 'پیام ',
      dataIndex: 'comment',
      key: 'comment',
      className: 'col-span-5 !justify-start',
    },
  ];
  useEffect(() => {
    if (orderId) {
      /////edit mode
      handleGetCancellationWholesaleByOrderId(orderId);
    } else {
      /////first request
      handleGetWholeSale(wholesaleOrderId);
      handleGetCancellationWholesaleAttachType(wholesaleTypeId);
    }
  }, []);
  const handleGetWholeSale = (orderId: any) => {
    getWholeSale({
      orderId: orderId,
      onSuccess: (item) => {
        setState({
          wholeSaleSellData: item,
          wholesaleSeller: item?.wholesaleSellers,
          //   wholeSaleDetail: item?.wholeSaleDetail[0],
          wholesaleTypeIdEdit: item?.wholesaleTypeId,
        });
        // if (isPublishNotice) {
        //   handleExportForm1(item?.id);
        // }
      },
      onFail,
    });
  };
  useEffect(() => {
    let uploadFileListItemOthers: any = [];
    wholesaleSeller?.forEach((data: any) => {
      data?.wholesaleSellerFiles?.forEach((file: any) => {
        uploadFileListItemOthers.push(file);
      });
    });
    setUploadFileListItemOthers(uploadFileListItemOthers);
    const sumOfCashSharePercent = wholesaleSeller?.reduce(
      (acc: any, curr: any) => acc + parseFloat(curr.cashSharePercent),
      0
    );
    setState({
      sumOfCashSharePercent: sumOfCashSharePercent,
    });
  }, [wholesaleSeller]);

  useEffect(() => {
    checkRequiredData();
  }, [uploadFileListItem, requireAttachDataList]);
  const handleGetCancellationWholesaleAttachType = (
    wholesaleTypeIdValue: string | null
  ) => {
    const data = {
      WholesaleTypeId: wholesaleTypeIdValue,
    };
    getCancellationWholesaleAttachType({
      data: data,
      onSuccess: (res) => {
        setState({
          cancellationWholesaleAttachTypeData: res,
          requireAttachDataList: res.filter(
            (item: any) => item.isRequired && !item.isMultiple
          ),
        });
      },
      onFail,
    });
  };
  const handleGetCancellationWholesaleByOrderId = (orderId: string) => {
    const data = {
      OrderId: orderId,
    };
    getCancellationWholesaleByOrderId({
      data: data,
      onSuccess: (res) => {
        setState({
          id: res?.cancellationWholesale?.id,
          editModeData: res,
        });
        setUploadFileListItem(
          res?.cancellationWholesale?.cancellationWholesaleFiles
        );
        handleGetWholeSale(res?.cancellationWholesale?.wholesaleOrderId);
        handleGetCancellationWholesaleAttachType(
          res?.cancellationWholesale?.wholesaleTypeId
        );
      },
      onFail,
    });
  };
  const checkRequiredData = () => {
    const notAvailable: any = [];
    requireAttachDataList?.map((item: any) => {
      uploadFileListItem?.some((data: any) => data?.attachTypeId === item?.id)
        ? null
        : notAvailable.push(item);
    });
    if (notAvailable?.length > 0) {
      setState({ uploadFileValidate: true, requireFileUploadComplete: false });
    } else {
      setState({ uploadFileValidate: false, requireFileUploadComplete: true });
    }
  };

  const onFail = (error: any) => {
    onAlert(error);
  };
  const setErrorMessage = (key: string) => {
    const errorMessage = '  ';
    setState({ [`${key}Error`]: errorMessage });
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
      uploadFileDataError: false,
      uploadFileData: res,
    });
  };
  const onRemoveFile = () => {
    setState({
      uploadFileData: null,
      uploadFileError: true,
    });
  };
  const onUploadFileSubmit = () => {
    if (selectedDocumentType && uploadFileData) {
      const uploadItem = {
        id: '00000000-0000-0000-0000-000000000000',
        wholesaleId:
          orderId != null ? orderId : '00000000-0000-0000-0000-000000000000',
        attachTypeId: selectedDocumentType,
        description: fileDescription,
        fileName: uploadFileData?.fileName,
        fileId: uploadFileData?.fileId,
        link: uploadFileData?.link,
        fileType: uploadFileData?.fileType,
        attachTypeName: selectedDocumentTypeName,
      };
      setUploadFileListItem((item: any) => [...item, uploadItem]);
      setState({
        selectedDocumentTypeName: '',
        fileDescription: '',
        uploadFileData: null,
        selectedDocumentType: '',
      });
    } else {
      !selectedDocumentType && setErrorMessage('selectedDocumentType');
      !uploadFileData && setErrorMessage('uploadFileData');
    }
  };
  const onDeleteFileList = (id: any) => {
    setUploadFileListItem((item: any) =>
      item.filter((data: any) => data?.fileId != id)
    );
  };
  const onSubmitDocumentClick = () => {
    checkRequiredData();
    if (requireFileUploadComplete === true) {
      const data = {
        id: orderId ? id : '00000000-0000-0000-0000-000000000000',
        orderId: orderId ? orderId : '00000000-0000-0000-0000-000000000000',
        wholesaleId: orderId
          ? editModeData?.cancellationWholesale?.wholesaleId
          : wholesaleId,
        wholesaleOrderId: orderId
          ? editModeData?.cancellationWholesale?.wholesaleOrderId
          : wholesaleOrderId,
        wholesaleInstrumentId: orderId
          ? editModeData?.cancellationWholesale?.wholesaleInstrumentId
          : wholesaleInstrumentId,
        wholesaleTypeId: orderId
          ? editModeData?.cancellationWholesale?.wholesaleTypeId
          : wholesaleTypeId,
        cancellationwholesaleFiles: uploadFileListItem,
      };
      saveCancellationWholesale({
        data: data,
        onSuccess: (res) => {
          setState({
            isTrackingModalVisible: true,
            trackingNumber: res?.trackingNumber,
          });
          setTimeout(() => {
            setState({ isTrackingModalVisible: false });
            navigate('/cartable');
          }, 4000);
        },
        onFail,
      });
    }
    // else {
    //   !wholesaleReturnReasonTypeId &&
    //     setErrorMessage('wholesaleReturnReasonTypeId');
    // }
  };
  const onCloseForm = () => {
    const data = {
      orderId: orderId,
    };
    closeFormStock({
      data: data,
      onSuccess: (res) => {
        onAlert({
          type: 'success',
          message: 'درخواست شما ابطال گردید',
        });
        navigate('/cartable');
      },
      onFail,
    });
  };
  const TrackingModal = () => {
    return (
      <>
        <AntModal
          visible={isTrackingModalVisible}
          closable={false}
          style={{ textAlign: 'center', padding: '0px' }}
          title={'انصراف از فروش عمده'}
          footer={null}
          centered
          width={400}
        >
          <div className="flex justify-center flex-col items-center">
            <span className=" font-bold  my-4">
              اطلاعات شما با موفقیت ارسال شد.
            </span>
            <span className="text-blue text-base">
              کد پیگیری : {trackingNumber}
            </span>
          </div>
        </AntModal>
      </>
    );
  };
  return (
    <>
      <div className="w-full grid grid-cols-10 border-lightGray border ">
        <div className=" items-start flex border-b-2 col-span-10  justify-start  border-lightGray  px-4">
          <span className=" p-2 font-bold ">درخواست انصراف از فروش عمده</span>
        </div>
        <div className="grid col-span-10 grid-cols-10 gap-4 justify-between mx-4 mt-2 ">
          <div className="col-span-2 flex flex-row items-center ">
            <div className=" font-bold w-4 h-4 bg-blue rounded-full" />
            <span className=" py-2 mx-2">
              {wholeSaleSellData?.wholesaleTradeTypesName}
            </span>
          </div>
        </div>
        <div className="grid col-span-10 grid-cols-10 gap-4 justify-between mx-4 mt-2">
          <div className="col-span-2 flex flex-row items-center ">
            <div className=" font-bold w-4 h-4 bg-blue rounded-full" />
            <span className=" py-2 mx-2">
              {wholeSaleSellData?.wholesaleTypeName}
            </span>
          </div>
        </div>
        <div className=" col-span-10 items-start flex mt-2">
          <span className=" p-2 font-bold text-blue underline">
            اطلاعات عرضه :
          </span>
        </div>
        <div className="grid col-span-10 grid-cols-10 gap-4 justify-between mx-4">
          <div className="col-span-2 flex flex-col my-2">
            <span className=" font-bold">نماد :</span>
            <span className=" py-2 ">{wholeSaleSellData?.symbol}</span>
          </div>
          <div className="col-span-2 flex flex-col my-2">
            <span className=" font-bold">نام شرکت :</span>
            <span className=" py-2 ">{wholeSaleSellData?.symbolName}</span>
          </div>
          <div className="col-span-2 flex flex-col my-2">
            <span className=" font-bold">تعداد کل سهام شرکت :</span>
            <span className=" py-2 ">
              {separator(wholeSaleSellData?.tradeTotalNumber)}
            </span>
          </div>
          <div className="col-span-2 flex flex-col my-2">
            <span className=" font-bold">تعداد سهام قابل عرضه :</span>
            <span className=" py-2 ">
              {separator(wholeSaleSellData?.tradeVolume)}
            </span>
          </div>
          <div className="col-span-2 flex flex-col my-2">
            <span className=" font-bold">درصد سهام قابل عرضه :</span>
            <span className=" py-2 ">{wholeSaleSellData?.tradePercent}</span>
          </div>
          <div className="col-span-2 flex flex-col my-2">
            <span className=" font-bold">قیمت پایه :</span>
            <span className=" py-2 ">
              {separator(wholeSaleSellData?.basePrice)}
            </span>
          </div>
          {wholesaleTypeId === '25e89117-17a8-465d-a1fb-2f1a80888773' ||
          wholesaleTypeIdEdit === '25e89117-17a8-465d-a1fb-2f1a80888773' ? (
            <div className="col-span-2 flex flex-col my-2">
              <span className=" font-bold">درصد حصه نقدی :</span>
              <span className=" py-2 ">
                {wholeSaleSellData?.cashSharePercent}
              </span>
            </div>
          ) : null}
          <div className="col-span-2 flex flex-col my-2">
            <span className=" font-bold">تاریخ عرضه :</span>
            <span className=" py-2 ">
              {convertDateToJalali(wholeSaleSellData?.tradeDate)}
            </span>
          </div>
        </div>

        <div className="grid col-span-10 grid-cols-10 gap-4  justify-between mx-4 mt-4">
          <div className=" col-span-10 items-start flex mt-2 ">
            <span className=" p-2 font-bold text-blue underline">
              اطلاعات عرضه کنندگان :
            </span>
          </div>

          <div className="col-span-10 py-2 pl-4">
            <div className=" col-span-10 flex flex-row justify-end">
              <span>مجموع تعداد : {wholesaleSeller?.length} </span>
              <span className="mx-2 font-extra-bold"> | </span>
              <span> مجموع درصد از کل سرمایه : {sumOfCashSharePercent}</span>
            </div>
            <Table
              columns={sellerColumns}
              className="col-span-10 grid grid-cols-12 text-center"
              dataSource={wholeSaleSellData?.wholesaleSellers}
              pageSize={1000}
              scrollX={300}
            />
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
            <span className=" py-2 ">{wholeSaleSellData?.responsibleName}</span>
          </div>
          <div className="col-span-2 flex flex-col">
            <span className=" font-bold">سمت :</span>
            <span className=" py-2 ">{wholeSaleSellData?.responsiblePost}</span>
          </div>
          <div className="col-span-2 flex flex-col">
            <span className=" font-bold">شماره همراه :</span>
            <span className=" py-2 ">
              {wholeSaleSellData?.responsibleMobile}
            </span>
          </div>
        </div>
        {editModeData?.cancellationWholesale?.cancellationWholesaleMessage
          ?.length > 0 && (
          <div className="grid col-span-10 grid-cols-12 gap-4  justify-between mx-4 mt-4">
            <div className=" col-span-12 items-start flex  ">
              <span className="  font-bold text-blue underline">توضیحات :</span>
            </div>
            <div className=" col-span-12  pb-4">
              <Table
                data={
                  editModeData?.cancellationWholesale
                    ?.cancellationWholesaleMessage
                }
                columns={columns}
                wrapperClassName="!mt-4"
                //   onChangePage={onChangePage}
                totalPages={1}
                pageSize={1000}
                className="col-span-12 grid grid-cols-12 "
              />
            </div>
          </div>
        )}
        <div className="grid col-span-10 grid-cols-10 gap-4  justify-between mx-4 mt-4 ">
          <div className=" col-span-10 items-start flex  ">
            <span className="  font-bold text-blue underline">مدارک :</span>
          </div>
          <div className=" col-span-10 grid grid-cols-4 pb-4 bg-[#EEEBFF] mb-4 px-4">
            {wholeSaleSellData?.publicFiles?.length > 0 &&
              wholeSaleSellData?.publicFiles?.map((item: any, index: any) => (
                <ImageUploadPreview
                  className="2xl:col-span-1 xl:col-span-2 lg:col-span-2 md:col-span-4  col-span-1"
                  data={item}
                  onAlert={onAlert}
                />
              ))}
          </div>
        </div>
        {uploadFileListItemOthers?.length > 0 && (
          <div className="grid col-span-10 grid-cols-10 gap-4  justify-between mx-4 mt-4 ">
            <div className=" col-span-10 items-start flex  ">
              <span className="  font-bold text-blue underline">
                مدارک و مستندات عرضه کننده :
              </span>
            </div>
            {wholeSaleSellData?.wholesaleSellers?.map(
              (parentItem: any, index: any) => (
                <div className="grid col-span-10 grid-cols-12 gap-4  justify-between  mt-4 mb-4 bg-[#EEEBFF]">
                  <div className="col-span-12">
                    <span className=" font-bold m-4">{`${parentItem?.sellerFamily} `}</span>
                  </div>

                  <div className=" col-span-12 grid grid-cols-4 pb-4  mb-4 px-4">
                    {uploadFileListItemOthers?.map(
                      (item: any, index: any) =>
                        item?.tableId === parentItem?.tableId && (
                          <ImageUploadPreview
                            className="2xl:col-span-1 xl:col-span-2 lg:col-span-2 md:col-span-4  col-span-1"
                            data={item}
                            onAlert={onAlert}
                          />
                        )
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        )}
        <div className=" col-span-10 items-start flex mt-2 px-4">
          <span className=" p-2 font-bold text-blue underline">
            مدارک و مستندات انصراف از فروش :
          </span>
          <span className="p-2 text-red ">
            {uploadFileValidate ? 'مدارک را به طور کامل بارگذاری نمایید.' : ''}
          </span>
        </div>
        <div className="grid col-span-10 grid-cols-10 gap-4  justify-between mx-4 mt-4 border-2 border-lightGray p-4">
          <div className="2xl:col-span-2 xl:col-span-5 lg:col-span-5 md:col-span-5 col-span-2 mx-2 ">
            <NewSelect
              label="نوع مدرک"
              className=" col-span-2"
              options={[
                { name: '', id: '' },
                ...cancellationWholesaleAttachTypeData,
              ]}
              onChange={(value: any) => {
                setState({
                  selectedDocumentType: value,
                  selectedDocumentTypeError: false,
                  selectedDocumentTypeName:
                    cancellationWholesaleAttachTypeData.filter(
                      (item: any) => item?.id === value
                    )?.[0]?.name,
                  selectedDocumentTypeIsMultiple:
                    cancellationWholesaleAttachTypeData.filter(
                      (item: any) => item?.id === value
                    )?.[0]?.isMultiple,
                });
              }}
              showKey="name"
              selectedKey="id"
              required
              value={selectedDocumentType}
              errorMessage={state?.selectedDocumentTypeError}
            />
          </div>

          <TextField
            label="توضیحات"
            className="2xl:col-span-2 xl:col-span-5 lg:col-span-5 md:col-span-5  col-span-2"
            value={fileDescription}
            onChange={(value: any) =>
              setState({
                fileDescription: value,
                fileDescriptionError: '',
              })
            }
            // required
            // errorMessage={state?.fileDescriptionError}
          />
          <div className=" 2xl:col-span-4 xl:col-span-10 lg:col-span-10 md:col-span-10 col-span-3 mr-4">
            <Upload
              onChange={(file: any) => onChangeFile(file)}
              value={uploadFileData?.fileName}
              href={uploadFileData?.link}
              name="uploadFile"
              onDelete={() => onRemoveFile()}
              error={uploadFileDataError}
            />
          </div>
          <div className=" 2xl:col-span-2 xl:col-span-10 lg:col-span-10 md:col-span-10  col-span-2 flex rounded-full ml-2 justify-end">
            <Button
              className="border-green border text-white bg-green w-[110px]"
              onClick={onUploadFileSubmit}
            >
              بارگذاری مدارک
            </Button>
          </div>
        </div>
        <Collapse
          className="shadow-[0_0px_4px_rgba(0,0,0,0.2)] bg-[#EEEBFF] rounded-sm p-1 mb-3 col-span-12 gap-4  justify-between mx-4 mt-4"
          title="مدارک و مستندات انصراف از فروش"
          expanded={true}
        >
          <div className="grid col-span-10 grid-cols-12 gap-4  justify-between mx-4 mt-4 mb-4">
            <div className=" col-span-3  bg-lightGray py-2">
              {requireAttachDataList?.map((item: any) => {
                return (
                  <div className="flex flex-row items-center px-4 py-1">
                    <div className="w-4">
                      <div
                        className={`w-4 h-4  rounded-full border-2 border-gray ${
                          uploadFileListItem?.some(
                            (data: any) => data?.attachTypeId === item?.id
                          )
                            ? 'bg-green'
                            : 'bg-red'
                        } `}
                      />
                    </div>
                    <span className="mr-4"> {item.name}</span>
                  </div>
                );
              })}
            </div>
            <div className=" col-span-9 grid grid-cols-6 ">
              {uploadFileListItem?.length > 0 &&
                uploadFileListItem?.map((item: any, index: any) => (
                  <ImageUpload
                    className="2xl:col-span-3 xl:col-span-3 lg:col-span-3 md:col-span-6  col-span-3"
                    data={item}
                    onAlert={onAlert}
                    onDeleteFile={onDeleteFileList}
                  />
                ))}
            </div>
          </div>
        </Collapse>
        <TrackingModal />
      </div>
      <div className="flex justify-end my-4">
        <a
          href="/cartable"
          className="border-blue border  text-blue w-[120px] h-[35px]  flex items-center justify-center rounded ml-4"
          // onClick={onConfirm}
        >
          بازگشت
        </a>
        {orderId && (
          <a
            className="border-red border text-red w-[120px] h-[35px] flex items-center justify-center rounded "
            onClick={() => setState({ isModalCloseFormVisible: true })}
          >
            ابطال
          </a>
        )}
        <a
          className="  text-white bg-blue w-[120px] h-[35px]  flex items-center justify-center rounded mr-4"
          onClick={onSubmitDocumentClick}
        >
          ثبت
        </a>
      </div>
      <Modal
        handleOk={() => onCloseForm()}
        handleCancel={() => setState({ isModalCloseFormVisible: false })}
        isModalVisible={isModalCloseFormVisible}
        title={`آیا نسبت به ابطال درخواست خود اطمینان دارید؟`}
      />
    </>
  );
}
export default withAlert(CanellationRequestSellWholesale);
