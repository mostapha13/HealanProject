import withAlert from 'apps/cash-market/src/hoc/withAlert';
import {
  useStates,
  useEffect,
  useState,
  useNavigate,
  useSearchParams,
} from '@tse/utils';
import ImageUploadPreview from 'apps/cash-market/src/components/ImageUploadPreview';
import { Button, TextField, Upload, Icon } from '@tse/components/atoms';
import {
  convertDateAndTimeToJalali,
  convertDateToJalali,
  downloadFile,
  separator,
} from '@tse/tools';
import { uploadFile, downloadFileApi } from 'apps/cash-market/src/Controller';
import { Popconfirm, Radio } from 'antd';
import type { RadioChangeEvent } from 'antd';
import WorkFlow from 'apps/cash-market/src/components/PageFeature/WorkFlow';
import { HeaderTypes } from '@tse/types';
import { Table } from '@tse/components/organism';
import {
  getWholeSale,
  getWholeSaleDocumentTypeNotCertainty,
  getNotCertaintyDocument,
  uploadNotCertaintyDocuments,
  deleteNotCertaintyDocument,
  SaveNotCertainty,
} from 'apps/cash-market/src/Controller/StockMarket/WholeSale';
import NewSelect from 'apps/cash-market/src/components/atoms/NewSelect';
import { DatePicker } from '@tse/components/molecules';

const initialState = {
  id: '',
  pageNo: 1,
  wholeSaleSellData: null,
  wholesaleSeller: [],
  selectedDocumentTypeError: '',
  sumOfCashSharePercent: '',
  isTrackingModalVisible: false,
  trackingNumber: '',
  wholesaleTypeIdEdit: '',
  documentTypeId: '',
  documentTypeIdName: '',
  documentTypeIdError: false,
  permitNo: '',
  permitNoError: false,
  permitDate: '',
  permitDateError: false,
  permitDescription: '',
  permitDescriptionError: false,
  permitFile: null,
  permitFileError: false,
  uploadDocEditMode: false,
  notCertaintyDocumentList: [],
  documentId: '',
  title: '',
  titleError: false,
  wholeSaleDocumentTypeData: [],
  wholeSaleCondition: false,
};
function NotCertaintyRequest({ onAlert }: any) {
  const [state, setState] = useStates<any>(initialState);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    id,
    wholeSaleSellData,
    wholesaleSeller,
    sumOfCashSharePercent,
    isTrackingModalVisible,
    trackingNumber,
    wholesaleTypeIdEdit,
    documentTypeId,
    documentTypeIdName,
    documentTypeIdError,
    permitNo,
    permitNoError,
    permitDate,
    permitDateError,
    permitDescription,
    permitDescriptionError,
    permitFile,
    permitFileError,
    uploadDocEditMode,
    notCertaintyDocumentList,
    documentId,
    title,
    titleError,
    wholeSaleDocumentTypeData,
    wholeSaleCondition,
  } = state;
  const [uploadFileListItemOthers, setUploadFileListItemOthers] = useState<any>(
    []
  );
  const orderId =
    searchParams.get('id') != null ? searchParams.get('id') : null;
  const history =
    searchParams.get('history') != null ? searchParams.get('history') : '';
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
  const uploadDocColumns: HeaderTypes[] = [
    {
      title: 'گیرنده نامه',
      dataIndex: 'documentTypeName',
      className: 'col-span-2 !justify-start',
      key: 'documentTypeName',
    },
    {
      title: 'عنوان',
      dataIndex: 'documentTypeName',
      className: 'col-span-2 !justify-start',
      key: 'documentTypeName',
    },

    {
      title: 'شماره نامه',
      dataIndex: 'permitNo',
      className: 'col-span-1 !justify-start',
      key: 'permitNo',
    },
    {
      title: 'تاریخ نامه',
      dataIndex: 'permitDate',
      className: 'col-span-1 !justify-start',
      key: 'permitDate',
      render: (item: any) => <span>{convertDateToJalali(item)}</span>,
    },
    {
      title: 'توضیحات',
      dataIndex: 'permitDescription',
      className: 'col-span-2 !justify-start',
      key: 'permitDescription',
    },
    {
      title: 'فایل',
      dataIndex: 'permitFile',
      className: 'col-span-2 !justify-center',
      key: 'permitFile',
      render: (item: any) => (
        <a onClick={() => handleDownload(item)}>{item?.fileName}</a>
      ),
    },

    {
      title: 'عملیات',
      dataIndex: 'action',
      key: 'action',
      className: 'col-span-1 !justify-start',
      render: (_: any, item: any) => (
        <div className="flex flex-row items-center justify-center">
          <Icon
            name="icon-edit"
            classname="text-green text-lg cursor-pointer"
            onClick={() => onEditUploadDocument(item)}
          />
          <Popconfirm
            title="آیا اطمینان دارید؟"
            okText="بله"
            cancelText="خیر"
            onConfirm={() => onRemoveUploadDocItem(item?.id)}
          >
            <Icon
              name="icon-delete"
              classname="text-red text-lg cursor-pointer"
            />
          </Popconfirm>
        </div>
      ),
    },
  ];

  useEffect(() => {
    if (orderId) {
      handleGetWholeSale(orderId);
    }
  }, []);
  const handleGetWholeSale = (orderId: any) => {
    getWholeSale({
      orderId: orderId,
      onSuccess: (item) => {
        let isCondition;
        if (item?.wholesaleTypeId === '25e89117-17a8-465d-a1fb-2f1a80888773') {
          isCondition = true;
        } else {
          isCondition = false;
        }
        setState({
          wholeSaleSellData: item,
          wholesaleSeller: item?.wholesaleSellers,
          wholesaleTypeIdEdit: item?.wholesaleTypeId,
          wholeSaleCondition: isCondition,
        });
        handleGetWholeSaleNotCertaintyDocumentType(isCondition);
        handleGetNotCertaintyDocument(item?.id);
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
      permitFileError: false,
      permitFile: res,
    });
  };
  const onRemoveFile = () => {
    setState({
      permitFile: null,
      permitFileError: true,
    });
  };
  const handleDownload = (data: any) => {
    downloadFileApi({
      data: data?.fileId,
      onSuccess: (res: any) => downloadExportFile(res, data?.fileName),
      onFail: (err: any) => console.log('onFail', err),
    });
  };
  const downloadExportFile = (state: any, name: string) => {
    if (state != null) {
      downloadFile(state, name);
    }
  };
  const handleModeChange = (e: RadioChangeEvent) => {
    setState({ changePage: e.target.value });
  };

  const handleGetNotCertaintyDocument = (wholesaleId: string) => {
    getNotCertaintyDocument({
      data: {
        wholesaleId: wholesaleId,
      },
      onSuccess: (res) => {
        setState({
          notCertaintyDocumentList: res,
        });
      },
      onFail,
    });
  };
  const handleGetWholeSaleNotCertaintyDocumentType = (
    isCondition?: boolean
  ) => {
    const data = {
      isConditional: isCondition,
    };
    getWholeSaleDocumentTypeNotCertainty({
      data: data,
      onSuccess: (item) => {
        setState({
          wholeSaleDocumentTypeData: item,
        });
      },
      onFail,
    });
  };
  const onSubmitDocumentClick = () => {
    if (documentTypeId && permitNo && permitDate && permitFile) {
      const data = {
        orderId: orderId,
        id: uploadDocEditMode
          ? documentId
          : '00000000-0000-0000-0000-000000000000',
        wholeSaleId: wholeSaleSellData?.id,
        documentTypeId: documentTypeId,
        permitNo,
        permitDate,
        permitDescription,
        permitFile,
      };
      uploadNotCertaintyDocuments({
        data: data,
        onSuccess: (res) => {
          handleGetNotCertaintyDocument(wholeSaleSellData?.id);
          setState({
            uploadDocEditMode: false,
            documentTypeId: '',
            permitNo: '',
            permitDate: '',
            permitDescription: '',
            permitFile: null,
          });
        },
        onFail,
      });
    } else {
      setState({
        ...(!documentTypeId && { documentTypeIdError: true }),
        ...(!permitNo && { permitNoError: true }),
        ...(!permitDate && { permitDateError: true }),
        ...(!permitFile && { permitFileError: true }),
      });
    }
  };
  const onEditUploadDocument = (item: any) => {
    setState({
      documentId: item?.id,
      documentTypeId: item?.documentTypeId,
      permitNo: item?.permitNo,
      permitDate: item?.permitDate,
      permitDescription: item?.permitDescription,
      permitFile: item?.permitFile,
      uploadDocEditMode: true,
      permitFileError: false,
    });
  };
  const onRemoveUploadDocItem = (id: string) => {
    deleteNotCertaintyDocument({
      data: {
        orderId: orderId,
        id: id,
      },
      onSuccess: (res) => {
        handleGetNotCertaintyDocument(wholeSaleSellData?.id);
      },
      onFail,
    });
  };
  const onSubmitClick = () => {
    SaveNotCertainty({
      data: {
        wholeSaleId: wholeSaleSellData?.id,
      },
      onSuccess: (res) => {
        onAlert({
          type: 'success',
          message: 'اطلاعات با موفقیت ثبت گردید',
        });
        navigate('/cartable');
      },
      onFail,
    });
  };
  return (
    <div className=" border-lightGray border ">
      <div className=" items-start flex border-b-2  justify-between bg-lightGray border-lightGray  px-4">
        <span className=" p-2 font-bold  text-blue ">مکاتبات</span>
      </div>
      <>
        <div className="grid col-span-10 grid-cols-12 gap-4  justify-between mx-4 mt-4 shadow-md p-4 ">
          <div className="2xl:col-span-3 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-3">
            <NewSelect
              label="گیرنده نامه"
              className="col-span-2"
              options={[{ name: '', id: '' }, ...wholeSaleDocumentTypeData]}
              onChange={(value: any) =>
                setState({
                  documentTypeId: value,
                  documentTypeIdError: false,
                  documentTypeIdName: wholeSaleDocumentTypeData.filter(
                    (item: any) => item?.id == value
                  )?.[0]?.name,
                })
              }
              showKey="name"
              selectedKey="id"
              required
              value={documentTypeId}
              errorMessage={state?.documentTypeIdError}
            />
          </div>
          <TextField
            label="عنوان"
            className="2xl:col-span-3 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-3"
            value={title}
            onChange={(value: any) =>
              setState({
                title: value,
                titleError: false,
              })
            }
            // required
            // errorMessage={titleError}
          />
          <TextField
            label="شماره نامه"
            className="2xl:col-span-3 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-3"
            value={permitNo}
            onChange={(value: any) =>
              setState({
                permitNo: value,
                permitNoError: false,
              })
            }
            required
            errorMessage={permitNoError}
          />
          <div className="2xl:col-span-3 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-3 z-10">
            <DatePicker
              label="تاریخ نامه"
              value={permitDate}
              onChange={(value: any) =>
                setState({
                  permitDate: value,
                  permitDateError: '',
                })
              }
              required
              error={permitDateError}
              onClearDate={() => setState({ permitDate: '' })}
            />
          </div>
          <TextField
            label="توضیحات"
            className="2xl:col-span-3 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-3"
            value={permitDescription}
            onChange={(value: any) =>
              setState({
                permitDescription: value,
                permitDescriptionError: false,
              })
            }
            // required
            // errorMessage={documentDescriptionError}
          />
          <div className=" 2xl:col-span-6 xl:col-span-6 lg:col-span-12 md:col-span-12  col-span-6">
            <Upload
              onChange={(file: any) => onChangeFile(file)}
              value={permitFile?.fileName}
              href={permitFile?.link}
              name="documentFile"
              onDelete={() => onRemoveFile()}
              error={permitFileError}
            />
          </div>
          <div className="  col-span-12 flex justify-end items-center">
            <Button
              onClick={onSubmitDocumentClick}
              className="bg-green w-24 h-9 text-white "
            >
              تایید و اضافه
            </Button>
          </div>
          <div className="col-span-12 my-10">
            <Table
              columns={uploadDocColumns}
              className="col-span-12 grid grid-cols-12 text-center"
              dataSource={notCertaintyDocumentList}
              //   scroll={{ x: 'calc(700px + 30%)' }}
              pageSize={1000}
            />
          </div>
        </div>
      </>
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
        {wholesaleTypeIdEdit === '25e89117-17a8-465d-a1fb-2f1a80888773' && (
          <div className="col-span-2 flex flex-col my-2">
            <span className=" font-bold">درصد حصه نقدی :</span>
            <span className=" py-2 ">
              {wholeSaleSellData?.cashSharePercent}
            </span>
          </div>
        )}
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
            <span>مجموع درصد از کل سرمایه : {sumOfCashSharePercent}</span>
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
          <span className=" py-2 ">{wholeSaleSellData?.responsibleMobile}</span>
        </div>
      </div>
      {wholeSaleSellData?.message?.length > 0 && (
        <div className="grid col-span-10 grid-cols-12 gap-4  justify-between mx-4 mt-4">
          <div className=" col-span-12 items-start flex  ">
            <span className="  font-bold text-blue underline">توضیحات :</span>
          </div>
          <div className=" col-span-12  pb-4">
            <Table
              data={wholeSaleSellData?.message}
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
      <div className="flex justify-end mx-4 my-4">
        <a
          href="/cartable"
          className="border-blue border ml-4 text-blue w-[120px] h-[35px]  flex items-center justify-center rounded"
          // onClick={onConfirm}
        >
          بازگشت
        </a>
        <a
          className="  text-white bg-blue w-[120px] h-[35px]  flex items-center justify-center rounded"
          onClick={onSubmitClick}
        >
          ثبت
        </a>
      </div>
    </div>
  );
}
export default withAlert(NotCertaintyRequest);
