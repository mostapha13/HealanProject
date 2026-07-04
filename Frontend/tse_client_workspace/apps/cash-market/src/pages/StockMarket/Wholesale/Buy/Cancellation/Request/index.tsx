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
  Icon,
  Modal,
  Upload,
  Collapse,
} from '@tse/components/atoms';
import { Modal as AntModal } from 'antd';

import {
  convertDateAndTime,
  convertDateAndTimeJalali,
  convertDateAndTimeToJalali,
  convertDateToJalali,
  downloadFile,
} from '@tse/tools';
import {
  closeFormStock,
  downloadFileApi,
  getOrderWorkFlow,
  uploadFile,
} from 'apps/cash-market/src/Controller';
import { Modal as AntMoadl, Popconfirm, Radio } from 'antd';
import type { RadioChangeEvent } from 'antd';
import WorkFlow from 'apps/cash-market/src/components/PageFeature/WorkFlow';
import { HeaderTypes } from '@tse/types';
import { Table } from '@tse/components/organism';
import {
  getCancellationWholesaleBuyAttachType,
  getCancellationWholesaleBuyByOrderId,
  getWholesaleBuy,
  getWholesaleReturnReasons,
  saveCancellationWholesaleBuy,
} from 'apps/cash-market/src/Controller/StockMarket/WholeSale';
import NewSelect from 'apps/cash-market/src/components/atoms/NewSelect';
import ImageUpload from 'apps/cash-market/src/components/ImageUpload';
import { Modal as ConfirmModal } from '@tse/components/atoms';

const initialState = {
  id: '',
  changePage: 'request',
  pageNo: 1,
  wholesalebuyData: {},
  wholesaleBuyer: [],
  workFlow: null,
  publicMessage: '',
  privateMessage: '',
  isBoardMemberVisible: false,
  wholesaleReturnReasonsData: [],
  wholesaleReturnReasonTypeId: '',
  wholesaleReturnReasonTypeName: '',
  boardMemberData: [],
  description: '',
  uploadFileData: null,
  cancellationWholesaleBuyAttachTypeData: [],
  selectedDocumentType: '',
  selectedDocumentTypeName: '',
  selectedDocumentTypeError: '',
  fileDescription: '',
  uploadFileDataError: false,
  requireAttachDataList: [],
  uploadFileValidate: false,
  requireFileUploadComplete: false,
  isTrackingModalVisible: false,
  trackingNumber: '',
  editModeData: null,
  isModalCloseFormVisible: false,
};
function RequestCancelBuyWholesale({ onAlert }: any) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useStates<any>(initialState);
  const [uploadFileListItem, setUploadFileListItem] = useState<any>([]);
  const [uploadFileListItemOthers, setUploadFileListItemOthers] = useState<any>(
    []
  );
  const {
    id,
    changePage,
    wholesalebuyData,
    wholesaleBuyer,
    workFlow,
    publicMessage,
    privateMessage,
    boardMemberData,
    isBoardMemberVisible,
    wholesaleReturnReasonsData,
    wholesaleReturnReasonTypeId,
    wholesaleReturnReasonTypeName,
    description,
    wholesaleBuyReturnFiles,
    uploadFileData,
    cancellationWholesaleBuyAttachTypeData,
    selectedDocumentType,
    selectedDocumentTypeName,
    selectedDocumentTypeError,
    fileDescription,
    uploadFileDataError,
    requireAttachDataList,
    uploadFileValidate,
    requireFileUploadComplete,
    isTrackingModalVisible,
    trackingNumber,
    editModeData,
    isModalCloseFormVisible,
  } = state;
  const orderId =
    searchParams.get('id') != null ? searchParams.get('id') : null;

  const wholesaleBuyInstrumentId =
    searchParams.get('wholesaleBuyInstrumentId') != null
      ? searchParams.get('wholesaleBuyInstrumentId')
      : null;
  const wholesaleBuyId =
    searchParams.get('wholesaleBuyId') != null
      ? searchParams.get('wholesaleBuyId')
      : null;
  const wholesaleBuyOrderId =
    searchParams.get('wholesaleBuyOrderId') != null
      ? searchParams.get('wholesaleBuyOrderId')
      : null;

  const history =
    searchParams.get('history') != null ? searchParams.get('history') : '';

  const buyerColumns: HeaderTypes[] = [
    {
      title: 'شناسه',
      dataIndex: 'tableId',
      className: 'col-span-1 !justify-start',
      key: 'tableId',
    },
    {
      title: 'نوع شخصیت',
      dataIndex: 'personTypeName',
      className: 'col-span-1 !justify-start',
      key: 'personTypeName',
    },
    {
      title: 'نام متقاضی',
      dataIndex: 'fname',
      className: 'col-span-1 !justify-start',
      key: 'fname',
    },
    {
      title: 'نام خانوادگی/نام شرکت',
      dataIndex: 'lname',
      className: 'col-span-2 !justify-start',
      key: 'lname',
    },
    {
      title: 'کد ملی/شناسه شرکت',
      dataIndex: 'buyerCode',
      className: 'col-span-1 !justify-start',
      key: 'buyerCode',
    },
    {
      title: 'تعداد سهام یا حق تقدم سهام مورد تقاضا',
      dataIndex: 'buyCount',
      className: 'col-span-2 !justify-center',
      key: 'buyCount',
    },
    {
      title: 'درصد خرید از کل سهام عرضه شده',
      dataIndex: 'buyPercent',
      className: 'col-span-2 !justify-center',
      key: 'buyPercent',
    },
    {
      title: 'اطلاعات مدیران',
      dataIndex: 'hasBuyerInfoBoard',
      className: 'col-span-1 !justify-center',
      key: 'hasBuyerInfoBoard',
      render: (item: any, record: any) => (
        <div className="flex flex-row items-center justify-center">
          {record?.personTypeId === 'cafd25d9-4948-4b97-b3ec-9761e4496e01' ||
          record?.personTypeId === '5882faca-e9d3-4329-b19c-c92eec610c62' ? (
            <Icon
              name="icon-managers-info"
              classname={`${
                item ? 'text-green' : 'text-red'
              } text-lg cursor-pointer`}
              onClick={() =>
                setState({
                  boardMemberData: record?.wholesaleBuyerInfoBoards,
                  isBoardMemberVisible: true,
                })
              }
            />
          ) : null}
        </div>
      ),
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
  const boardMembercolumns: HeaderTypes[] = [
    {
      title: 'نام',
      dataIndex: 'fname',
      key: 'fname',
      className: 'col-span-3 !justify-start',
    },
    {
      title: 'نام خانوادگی',
      dataIndex: 'lname',
      key: 'lname',
      className: 'col-span-4 !justify-start',
    },
    {
      title: 'کد ملی',
      dataIndex: 'buyerCode',
      key: 'buyerCode',
      className: 'col-span-4 !justify-start',
    },
  ];

  useEffect(() => {
    handleGetWholesaleReturnReasons();
    handleGetCancellationWholesaleBuyAttachType();
    if (orderId) {
      /////edit mode
      handleGetCancellationWholesaleBuyByOrderId(orderId);
    } else {
      /////first request
      handleGetWholesaleBuy(wholesaleBuyOrderId);
    }
  }, []);

  useEffect(() => {
    let uploadFileListItemOthers: any = [];
    wholesaleBuyer?.forEach((data: any) => {
      data?.wholesaleBuyerFiles?.forEach((file: any) => {
        uploadFileListItemOthers.push(file);
      });
    });
    setUploadFileListItemOthers(uploadFileListItemOthers);
  }, [wholesaleBuyer]);
  useEffect(() => {
    checkRequiredData();
  }, [uploadFileListItem, requireAttachDataList]);

  const handleGetWholesaleBuy = (orderId: any) => {
    getWholesaleBuy({
      orderId: orderId,
      onSuccess: (item) => {
        setState({
          wholesalebuyData: item,
          wholesaleBuyer: item?.wholesaleBuyerInfos,
        });
      },
      onFail,
    });
  };
  const handleGetWholesaleReturnReasons = () => {
    getWholesaleReturnReasons({
      onSuccess: (item) => {
        setState({
          wholesaleReturnReasonsData: item,
        });
      },
      onFail,
    });
  };
  const handleGetCancellationWholesaleBuyAttachType = () => {
    getCancellationWholesaleBuyAttachType({
      onSuccess: (res) => {
        setState({
          cancellationWholesaleBuyAttachTypeData: res,
          requireAttachDataList: res.filter(
            (item: any) => item.isRequired && !item.isMultiple
          ),
        });
      },
      onFail,
    });
  };

  const handleGetCancellationWholesaleBuyByOrderId = (orderId: string) => {
    getCancellationWholesaleBuyByOrderId({
      data: {
        OrderId: orderId,
      },
      onSuccess: (res) => {
        setState({
          id: res?.cancellationWholesale?.id,
          editModeData: res,
          wholesaleReturnReasonTypeId:
            res?.cancellationWholesale?.wholesaleReturnReasonTypeId,
          description: res?.cancellationWholesale?.description,
        });
        setUploadFileListItem(
          res?.cancellationWholesale?.cancellationWholesaleByeFiles
        );
        handleGetWholesaleBuy(res?.cancellationWholesale?.wholesaleBuyOrderId);
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
  const onDeleteFileList = (id: any) => {
    setUploadFileListItem((item: any) =>
      item.filter((data: any) => data?.fileId != id)
    );
  };
  const onFail = (error: any) => {
    onAlert(error);
  };
  const setErrorMessage = (key: string) => {
    const errorMessage = '  ';
    setState({ [`${key}Error`]: errorMessage });
  };

  const downloadExportFile = (state: any, name: string) => {
    if (state != null) {
      downloadFile(state, name);
    }
  };

  const handleDownload = (data: any) => {
    downloadFileApi({
      data: data?.fileId,
      onSuccess: (res: any) => downloadExportFile(res, data?.fileName),
      onFail: (err: any) => console.log('onFail', err),
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
      // !fileDescription && setErrorMessage('fileDescription');
      !uploadFileData && setErrorMessage('uploadFileData');
    }
  };
  const onSubmitDocumentClick = () => {
    checkRequiredData();
    if (wholesaleReturnReasonTypeId && requireFileUploadComplete === true) {
      const data = {
        id: orderId ? id : '00000000-0000-0000-0000-000000000000',
        orderId: orderId ? orderId : '00000000-0000-0000-0000-000000000000',
        wholesaleBuyInstrumentId: orderId
          ? editModeData?.cancellationWholesale?.wholesaleBuyInstrumentId
          : wholesaleBuyInstrumentId,
        wholesaleBuyId: orderId
          ? editModeData?.cancellationWholesale?.wholesaleBuyId
          : wholesaleBuyId,
        wholesaleBuyOrderId: orderId
          ? editModeData?.cancellationWholesale?.wholesaleBuyOrderId
          : wholesaleBuyOrderId,
        wholesaleReturnReasonTypeId: parseInt(wholesaleReturnReasonTypeId),
        description: description,
        wholesaleBuyReturnFiles: uploadFileListItem,
      };
      saveCancellationWholesaleBuy({
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
    } else {
      !wholesaleReturnReasonTypeId &&
        setErrorMessage('wholesaleReturnReasonTypeId');
    }
  };
  const TrackingModal = () => {
    return (
      <>
        <AntModal
          visible={isTrackingModalVisible}
          closable={false}
          style={{ textAlign: 'center', padding: '0px' }}
          title={'انصراف از خرید عمده/عودت وجه خرید عمده'}
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

  const BoardMemberModal = () => {
    return (
      <>
        <AntMoadl
          visible={isBoardMemberVisible}
          closable={true}
          style={{ textAlign: 'center', padding: '0px' }}
          title={'اطلاعات مدیران'}
          footer={null}
          centered
          width={'50%'}
          onCancel={() => setState({ isBoardMemberVisible: false })}
        >
          <Table
            columns={boardMembercolumns}
            className="col-span-12 grid grid-cols-12 text-center"
            dataSource={boardMemberData}
            pageSize={1000}
            scrollX={200}
          />
        </AntMoadl>
      </>
    );
  };
  return (
    <>
      <div className="border-2 border-lightGray">
        <div className="w-full grid grid-cols-10 ">
          <div className="grid col-span-10 grid-cols-10 gap-4 justify-between mx-4 mt-2 ">
            <div className="col-span-10 flex flex-row items-center ">
              <div className=" font-bold w-4 h-4 bg-blue rounded-full" />
              <span className=" py-2 mx-2 font-bold">نوع فروش :</span>
              <span className=" py-2 mx-2">
                {wholesalebuyData?.wholesaleTypeName}
              </span>
            </div>
          </div>

          <div className="grid col-span-10 grid-cols-10 gap-4  justify-between mx-4 mt-4">
            <div className=" col-span-10 items-start flex mt-2 ">
              <span className=" p-2 font-bold text-blue underline">
                متقاضیان خرید :
              </span>
            </div>

            <div className="col-span-10 py-2 pl-4">
              <Table
                columns={buyerColumns}
                className="col-span-10 grid grid-cols-12 text-center"
                dataSource={wholesalebuyData?.wholesaleBuyerInfos}
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
              <span className=" py-2 ">
                {wholesalebuyData?.responsibleName}
              </span>
            </div>
            <div className="col-span-2 flex flex-col">
              <span className=" font-bold">سمت :</span>
              <span className=" py-2 ">
                {wholesalebuyData?.responsiblePost}
              </span>
            </div>
            <div className="col-span-2 flex flex-col">
              <span className=" font-bold">شماره همراه :</span>
              <span className=" py-2 ">
                {wholesalebuyData?.responsibleMobile}
              </span>
            </div>
          </div>
          {editModeData?.cancellationWholesale?.cancellationWholesaleMessage
            ?.length > 0 && (
            <div className="grid col-span-10 grid-cols-12 gap-4  justify-between mx-4 mt-4">
              <div className=" col-span-12 items-start flex  ">
                <span className="  font-bold text-blue underline">
                  توضیحات :
                </span>
              </div>
              <div className=" col-span-12  pb-4 ml-4">
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
          <div className="grid col-span-10 grid-cols-10 gap-4  justify-between mx-4 mt-8 ">
            <div className=" col-span-10 items-start flex  ">
              <span className="  font-bold text-blue underline">مدارک :</span>
            </div>
            <div className=" col-span-10 grid grid-cols-4 pb-4 bg-[#EEEBFF] mb-4 px-4">
              {wholesalebuyData?.publicFiles?.length > 0 &&
                wholesalebuyData?.publicFiles?.map((item: any, index: any) => (
                  <ImageUploadPreview
                    className="2xl:col-span-1 xl:col-span-2 lg:col-span-2 md:col-span-4  col-span-1"
                    data={item}
                    onAlert={onAlert}
                  />
                ))}
            </div>
          </div>
          <div className="grid col-span-10 grid-cols-10 gap-4  justify-between mx-4 mt-4 ">
            <div className=" col-span-10 items-start flex  ">
              <span className="  font-bold text-blue underline">
                مدارک و مستندات متقاضی خرید :
              </span>
            </div>
            {uploadFileListItemOthers?.length > 0 &&
              wholesaleBuyer?.map((parentItem: any, index: any) => (
                <div className="grid col-span-10 grid-cols-12 gap-4  justify-between  mt-4 mb-4 bg-[#EEEBFF]">
                  <div className="col-span-12">
                    <span className=" font-bold m-4">{`${parentItem?.lname} `}</span>
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
              ))}
          </div>
          <div className="grid col-span-10 grid-cols-10 gap-4  justify-between mx-4 mt-4 ">
            <div className=" col-span-10 items-start flex  ">
              <span className="  font-bold text-blue underline">
                علت درخواست :
              </span>
            </div>
            <div className="2xl:col-span-3 xl:col-span-3 lg:col-span-3 md:col-span-12 col-span-3 mx-2">
              <NewSelect
                label="علت درخواست عودت وجه"
                className=" col-span-2"
                options={[{ name: '', id: '' }, ...wholesaleReturnReasonsData]}
                onChange={(value: any) => {
                  setState({
                    wholesaleReturnReasonTypeId: value,
                    wholesaleReturnReasonTypeIdError: false,
                    wholesaleReturnReasonTypeName:
                      wholesaleReturnReasonsData.filter(
                        (item: any) => item?.id === value
                      )?.[0]?.name,
                  });
                }}
                showKey="name"
                selectedKey="id"
                required
                value={wholesaleReturnReasonTypeId}
                errorMessage={state?.wholesaleReturnReasonTypeIdError}
              />
            </div>
            <TextField
              label="توضیحات"
              className="2xl:col-span-7 xl:col-span-7 lg:col-span-7 md:col-span-12  col-span-7"
              value={description}
              onChange={(value: any) =>
                setState({
                  description: value,
                })
              }
              // required
              // errorMessage={state?.fileDescriptionError}
            />
          </div>

          <div className=" col-span-10 items-start flex mt-2 ">
            <span className=" p-2 font-bold text-blue underline">
              مدارک و مستندات عودت 10% :
            </span>
            <span className="p-2 text-red ">
              {uploadFileValidate
                ? 'مدارک را به طور کامل بارگذاری نمایید.'
                : ''}
            </span>
          </div>
          <div className="grid col-span-10 grid-cols-10 gap-4  justify-between mx-4 mt-4 border-2 border-lightGray p-4">
            <div className="2xl:col-span-2 xl:col-span-5 lg:col-span-5 md:col-span-5 col-span-2 mx-2 ">
              <NewSelect
                label="نوع مدرک"
                className=" col-span-2"
                options={[
                  { name: '', id: '' },
                  ...cancellationWholesaleBuyAttachTypeData,
                ]}
                onChange={(value: any) => {
                  setState({
                    selectedDocumentType: value,
                    selectedDocumentTypeError: false,
                    selectedDocumentTypeName:
                      cancellationWholesaleBuyAttachTypeData.filter(
                        (item: any) => item?.id === value
                      )?.[0]?.name,
                    selectedDocumentTypeIsMultiple:
                      cancellationWholesaleBuyAttachTypeData.filter(
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
            title="مدارک و مستندات عودت 10 %"
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
        </div>
      </div>
      <div className="flex justify-end my-4">
        <a
          href="/cartable"
          className="border-blue border  text-blue w-[120px] h-[35px]  flex items-center justify-center ml-4 rounded"
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
          className="border-blue border bg-blue w-[120px] h-[35px] text-white flex items-center justify-center mr-4 rounded"
          onClick={onSubmitDocumentClick}
        >
          ثبت
        </a>
      </div>
      <BoardMemberModal />
      <TrackingModal />
      <ConfirmModal
        handleOk={() => onCloseForm()}
        handleCancel={() => setState({ isModalCloseFormVisible: false })}
        isModalVisible={isModalCloseFormVisible}
        title={`آیا نسبت به ابطال درخواست خود اطمینان دارید؟`}
      />
    </>
  );
}
export default withAlert(RequestCancelBuyWholesale);
