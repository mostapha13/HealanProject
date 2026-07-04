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
} from '@tse/components/atoms';
import {
  convertDateAndTime,
  convertDateAndTimeJalali,
  convertDateAndTimeToJalali,
  convertDateToJalali,
  downloadFile,
  loadFromSession,
  loadFromStorage,
  separator,
} from '@tse/tools';
import {
  getOrderWorkFlow,
  getInitialSupplyByOrderId,
  initialSupplyConfirm,
  initialSupplyReject,
  exportInitialSupplyNotification,
  uploadFile,
} from 'apps/cash-market/src/Controller';
import { Radio } from 'antd';
import type { RadioChangeEvent } from 'antd';
import WorkFlow from 'apps/cash-market/src/components/PageFeature/WorkFlow';
import { HeaderTypes } from '@tse/types';
import { Table } from '@tse/components/organism';
import {
  getWholeSale,
  getWholeSaleCategory,
  getWholeSaleDocumentList,
  getWholeSaleTradeTypes,
  saveWholesaleDetailExpert,
  wholeSaleReject,
} from 'apps/cash-market/src/Controller/StockMarket/WholeSale';
import NewSelect from 'apps/cash-market/src/components/atoms/NewSelect';
import { DatePicker } from '@tse/components/molecules';
const initialState = {
  changePage: 'request',
  pageNo: 1,
  wholeSaleCashData: {},
  workFlow: null,
  wholesaleSellerFiles: [],
  sumOfCashSharePercent: '',
  attachExpanded: true,
  typeTransactionExpanded: true,
  publicMessage: '',
  privateMessage: '',
  isModalConfirmVisible: false,
  isModalRejectVisible: false,
  sharePercent: '',
  sharePercentError: '',
  wholeSaleTradeTypesId: '',
  wholeSaleTradeTypesIdError: '',
  wholeSaleTradeTypesList: [],
  wholeSaleCategoryId: '',
  wholeSaleCategoryIdError: '',
  wholeSaleCategoryList: [],
  shareholdersLastMettingPercent: '',
  shareholdersLastMettingPercentError: '',
  shareholdersLastMettingFile: '',
  shareholdersLastMettingFileError: '',
  shareholdersLastMettingFileName: '',
  shareholdersLastMettingFileLink: '',
  shareholdersLastMettingFileObj: null,
  shareholdersOneYearsAgoMettingPercent: '',
  shareholdersOneYearsAgoMettingPercentError: '',
  shareholdersOneYearsAgoMettingFile: '',
  shareholdersOneYearsAgoMettingFileError: '',
  shareholdersOneYearsAgoMettingFileName: '',
  shareholdersOneYearsAgoMettingFileLink: '',
  shareholdersOneYearsAgoMettingFileObj: null,
  shareholdersTwoYearsAgoMettingPercent: '',
  shareholdersTwoYearsAgoMettingPercentError: '',
  shareholdersTwoYearsAgoMettingFile: '',
  shareholdersTwoYearsAgoMettingFileError: '',
  shareholdersTwoYearsAgoMettingFileName: '',
  shareholdersTwoYearsAgoMettingFileLink: '',
  shareholdersTwoYearsAgoMettingFileObj: null,
  numberOfBoard: '',
  numberOfBoardError: '',
  numberOfBoardFile: '',
  numberOfBoardFileError: '',
  numberOfBoardFileName: '',
  numberOfBoardFileLink: '',
  numberOfBoardFileObj: null,
  mettingAverage: '',
  mettingMin: '',
  ownershipMin: '',
  boardMax: '',
  companyControl: '',
  detailDescription: '',
  wholeSaleDocumentListData: [],
  deadlineDateCertainty: '',
  deadlineDateCertaintyError: '',
  wholesaleTypeId: '',
  wholeSaleCondition: false,
  sharePercentStatus: null,
};
function WholeSaleSellExpertRequestDetails({ onAlert }: any) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useStates<any>(initialState);
  const [uploadFileListItemOthers, setUploadFileListItemOthers] = useState<any>(
    []
  );
  const {
    changePage,
    wholeSaleCashData,
    workFlow,
    wholesaleSeller,
    sumOfCashSharePercent,
    attachExpanded,
    typeTransactionExpanded,
    publicMessage,
    privateMessage,
    isModalConfirmVisible,
    isModalRejectVisible,
    sharePercent,
    wholeSaleTradeTypesId,
    wholeSaleTradeTypesList,
    wholeSaleCategoryId,
    wholeSaleCategoryList,
    shareholdersLastMettingPercent,
    shareholdersLastMettingPercentError,
    shareholdersLastMettingFile,
    shareholdersLastMettingFileError,
    shareholdersLastMettingFileName,
    shareholdersLastMettingFileLink,
    shareholdersLastMettingFileObj,
    shareholdersOneYearsAgoMettingPercent,
    shareholdersOneYearsAgoMettingPercentError,
    shareholdersOneYearsAgoMettingFile,
    shareholdersOneYearsAgoMettingFileError,
    shareholdersOneYearsAgoMettingFileName,
    shareholdersOneYearsAgoMettingFileLink,
    shareholdersOneYearsAgoMettingFileObj,
    shareholdersTwoYearsAgoMettingPercent,
    shareholdersTwoYearsAgoMettingPercentError,
    shareholdersTwoYearsAgoMettingFile,
    shareholdersTwoYearsAgoMettingFileError,
    shareholdersTwoYearsAgoMettingFileName,
    shareholdersTwoYearsAgoMettingFileLink,
    shareholdersTwoYearsAgoMettingFileObj,
    numberOfBoard,
    numberOfBoardError,
    numberOfBoardFile,
    numberOfBoardFileError,
    numberOfBoardFileName,
    numberOfBoardFileLink,
    numberOfBoardFileObj,
    mettingAverage,
    mettingMin,
    ownershipMin,
    boardMax,
    companyControl,
    detailDescription,
    wholeSaleDocumentListData,
    deadlineDateCertainty,
    wholesaleTypeId,
    wholeSaleCondition,
    sharePercentStatus,
  } = state;
  const orderId =
    searchParams.get('id') != null
      ? searchParams.get('id')
      : '0f89d35f-77ed-4e1d-e211-08dc5789dd68';
  const history =
    searchParams.get('history') != null ? searchParams.get('history') : '';
  const isCashMarketBroker = loadFromSession('isCashMarketBroker');
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
      className: 'col-span-1 !justify-start',
      key: 'sellerCode',
    },
    {
      title: 'تعداد سهم',
      dataIndex: 'shareCount',
      className: 'col-span-1 !justify-start',
      key: 'shareCount',
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'درصد فروش از کل معامله',
      dataIndex: 'cashSharePercent',
      className: 'col-span-2 !justify-start',
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
  const documentListTable: HeaderTypes[] = [
    {
      title: 'فرستنده',
      dataIndex: 'senderName',
      key: 'senderName',
      className: 'col-span-3 !justify-start',
    },
    {
      title: 'نوع معامله ',
      dataIndex: 'tradeTypeName',
      key: 'tradeTypeName',
      className: 'col-span-2 !justify-start',
    },
    {
      title: 'دسته بندی نماد ',
      dataIndex: 'categoryName',
      key: 'categoryName',
      className: 'col-span-3 !justify-start',
    },
    {
      title: 'تاریخ ارسال ',
      dataIndex: 'persianCreatedDate',
      key: 'persianCreatedDate',
      className: 'col-span-3 !justify-start',
      // render: (item: any) => <span>{convertDateAndTimeToJalali(item)}</span>,
    },
  ];

  useEffect(() => {
    handleGetWholeSale(orderId);
    getWorkFlow();
    getWholeSaleCategoryList();
    handleGetWholeSaleDocumentList(orderId);
  }, []);
  useEffect(() => {
    let isCondition;
    if (wholesaleTypeId === '25e89117-17a8-465d-a1fb-2f1a80888773') {
      isCondition = true;
    } else {
      isCondition = false;
    }
    setState({ wholeSaleCondition: isCondition });
  }, [wholesaleTypeId]);
  useEffect(() => {
    let uploadFileListItemOthers: any = [];
    wholesaleSeller?.forEach((data: any) => {
      data?.wholesaleSellerFiles?.forEach((file: any) => {
        uploadFileListItemOthers.push(file);
      });
    });
    setUploadFileListItemOthers(uploadFileListItemOthers);
  }, [wholesaleSeller]);
  useEffect(() => {
    const sumOfCashSharePercent = wholesaleSeller?.reduce(
      (acc: any, curr: any) => acc + parseFloat(curr.cashSharePercent),
      0
    );
    setState({
      sumOfCashSharePercent: sumOfCashSharePercent,
    });
  }, [wholesaleSeller]);
  useEffect(() => {
    let sum =
      parseFloat(shareholdersLastMettingPercent) +
      parseFloat(shareholdersOneYearsAgoMettingPercent) +
      parseFloat(shareholdersTwoYearsAgoMettingPercent);
    let average = sum / 3;
    if (
      shareholdersLastMettingPercent != '' &&
      shareholdersOneYearsAgoMettingPercent != '' &&
      shareholdersTwoYearsAgoMettingPercent != ''
    ) {
      setState({ mettingAverage: average.toFixed(2) });
      if (average < parseFloat(shareholdersLastMettingPercent)) {
        setState({ mettingMin: average.toFixed(2) });
      } else {
        setState({
          mettingMin: parseFloat(shareholdersLastMettingPercent).toFixed(2),
        });
      }
    } else {
      setState({ mettingAverage: '', mettingMin: '' });
    }
  }, [
    shareholdersLastMettingPercent,
    shareholdersOneYearsAgoMettingPercent,
    shareholdersTwoYearsAgoMettingPercent,
  ]);
  useEffect(() => {
    let ownership = (1 / (1 + parseInt(numberOfBoard))) * mettingMin;
    if (mettingMin != '' && numberOfBoard != '') {
      setState({ ownershipMin: ownership.toFixed(2) });
    } else {
      setState({ ownershipMin: '' });
    }
  }, [numberOfBoard, mettingAverage]);
  useEffect(() => {
    let board = Math.ceil(numberOfBoard / 2);
    if (numberOfBoard != '') {
      setState({ boardMax: board });
    } else {
      setState({ boardMax: '' });
    }
  }, [numberOfBoard]);
  useEffect(() => {
    let companyCo = (1 / (1 + parseInt(numberOfBoard))) * mettingMin * boardMax;
    if (mettingMin != '' && numberOfBoard != '' && boardMax != '') {
      setState({ companyControl: companyCo.toFixed(2) });
    } else {
      setState({ companyControl: '' });
    }
  }, [numberOfBoard, mettingAverage, boardMax]);
  useEffect(() => {
    getWholeSaleTradeTypesList();
    if (sharePercent !== '') {
      let sharePercentLet = '';
      if (sharePercent < 5) {
        sharePercentLet = 'below';
      } else if (sharePercent >= 5 && sharePercent < 50) {
        //همه موارد select
        sharePercentLet = 'within';
      } else if (sharePercent >= 50) {
        sharePercentLet = 'above';
      }
      setState({
        sharePercentStatus: sharePercentLet,
        wholeSaleTradeTypesId: '',
      });
    }
  }, [sharePercent]);
  const handleGetWholeSale = (orderId: any) => {
    getWholeSale({
      orderId: orderId,
      onSuccess: (item) => {
        setState({
          wholeSaleCashData: item,
          wholesaleSeller: item?.wholesaleSellers,
          wholesaleTypeId: item?.wholesaleTypeId,
          sharePercent: item?.tradePercent,
        });
      },
      onFail,
    });
  };
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
  const handleGetWholeSaleDocumentList = (orderId: any) => {
    getWholeSaleDocumentList({
      orderId: orderId,
      onSuccess: (item) => {
        setState({
          wholeSaleDocumentListData: item,
        });
      },
      onFail,
    });
  };
  const getWholeSaleTradeTypesList = () => {
    getWholeSaleTradeTypes({
      onSuccess: (res) => {
        if (sharePercent < 5) {
          //غیر مدیریتی
          setState({
            wholeSaleTradeTypesList: res?.filter(
              (item: any) => item?.id === '39e2deee-0ed4-407c-b701-c6e940df4601'
            ),
          });
        } else if (sharePercent >= 50) {
          //کنترلی
          setState({
            wholeSaleTradeTypesList: res?.filter(
              (item: any) => item?.id === '1bb16800-d339-4d03-8d7a-aa7ffb3f1d6e'
            ),
          });
        } else {
          setState({
            wholeSaleTradeTypesList: res,
            // wholeSaleTradeTypesId: res?.[0]?.id,
          });
        }
      },
      onFail,
    });
  };
  const getWholeSaleCategoryList = () => {
    getWholeSaleCategory({
      onSuccess: (res) => {
        setState({
          wholeSaleCategoryList: res,
        });
      },
      onFail,
    });
  };
  const onFail = (error: any) => {
    onAlert(error);
  };
  const setErrorMessage = (key: string) => {
    const errorMessage = '  ';
    setState({ [`${key}Error`]: errorMessage });
  };
  const onChangePage = (pageNo: number) => {
    setState({
      pageNo,
    });
  };
  const handleModeChange = (e: RadioChangeEvent) => {
    setState({ changePage: e.target.value });
  };
  const onRemoveFile = (state: string) => {
    let fileName = state + 'Name';
    let fileLink = state + 'Link';
    let fileError = state + 'Error';

    setState({
      [fileName]: 'حذف گردید',
      [fileLink]: '',
      [fileError]: true,
    });
  };
  const onChangeFile = (e: any, state: string) => {
    uploadFile({
      data: e.target.files[0],
      onSuccess: (res: any) => {
        let fileName = state + 'Name';
        let fileLink = state + 'Link';
        let fileError = state + 'Error';
        let fileObj = state + 'Obj';

        setState({
          [fileName]: res?.fileName,
          [fileLink]: res?.link,
          [state]: res?.fileId,
          [fileError]: false,
          [fileObj]: res,
        });
      },
      onFail,
    });
  };
  const onConfirmClick = () => {
    if (sharePercent && wholeSaleTradeTypesId && wholeSaleCategoryId) {
      if (sharePercentStatus === 'within') {
        if (
          shareholdersLastMettingPercent &&
          shareholdersOneYearsAgoMettingPercent &&
          shareholdersTwoYearsAgoMettingPercent &&
          numberOfBoard
        ) {
          if (wholeSaleCondition) {
            if (deadlineDateCertainty) {
              setState({ isModalConfirmVisible: true });
            } else {
              !deadlineDateCertainty &&
                setErrorMessage('deadlineDateCertainty');
            }
          } else {
            setState({ isModalConfirmVisible: true });
          }
        } else {
          !shareholdersLastMettingPercent &&
            setErrorMessage('shareholdersLastMettingPercent');
          !shareholdersOneYearsAgoMettingPercent &&
            setErrorMessage('shareholdersOneYearsAgoMettingPercent');
          !shareholdersTwoYearsAgoMettingPercent &&
            setErrorMessage('shareholdersTwoYearsAgoMettingPercent');
          !numberOfBoard && setErrorMessage('numberOfBoard');
        }
      } else if (sharePercentStatus !== 'within') {
        if (wholeSaleCondition) {
          if (deadlineDateCertainty) {
            setState({ isModalConfirmVisible: true });
          } else {
            !deadlineDateCertainty && setErrorMessage('deadlineDateCertainty');
          }
        } else {
          setState({ isModalConfirmVisible: true });
        }
      }
    } else {
      setState({ typeTransactionExpanded: true });
      !sharePercent && setErrorMessage('sharePercent');
      !wholeSaleTradeTypesId && setErrorMessage('wholeSaleTradeTypesId');
      !wholeSaleCategoryId && setErrorMessage('wholeSaleCategoryId');
    }

    // if (
    //   sharePercent &&
    //   wholeSaleTradeTypesId &&
    //   wholeSaleCategoryId &&
    //   shareholdersLastMettingPercent &&
    //   shareholdersOneYearsAgoMettingPercent &&
    //   shareholdersTwoYearsAgoMettingPercent &&
    //   numberOfBoard
    // ) {
    //   if (wholeSaleCondition) {
    //     if (deadlineDateCertainty) {
    //       setState({ isModalConfirmVisible: true });
    //     } else {
    //       !deadlineDateCertainty && setErrorMessage('deadlineDateCertainty');
    //     }
    //   } else {
    //     setState({ isModalConfirmVisible: true });
    //   }
    // } else {
    //   setState({ typeTransactionExpanded: true });
    //   !sharePercent && setErrorMessage('sharePercent');
    //   !wholeSaleTradeTypesId && setErrorMessage('wholeSaleTradeTypesId');
    //   !wholeSaleCategoryId && setErrorMessage('wholeSaleCategoryId');
    //   !shareholdersLastMettingPercent &&
    //     setErrorMessage('shareholdersLastMettingPercent');
    //   !shareholdersOneYearsAgoMettingPercent &&
    //     setErrorMessage('shareholdersOneYearsAgoMettingPercent');
    //   !shareholdersTwoYearsAgoMettingPercent &&
    //     setErrorMessage('shareholdersTwoYearsAgoMettingPercent');
    //   !numberOfBoard && setErrorMessage('numberOfBoard');
    // }
  };
  const onOkModalConfirmClick = () => {
    const data = {
      wholeSaleId: wholeSaleCashData?.id,
      sharePercent: parseFloat(sharePercent),
      wholeSaleTradeTypesId: wholeSaleTradeTypesId,
      wholeSaleCategoryId: wholeSaleCategoryId,
      deadlineDateCertainty: wholeSaleCondition ? deadlineDateCertainty : null,
      shareholdersLastMettingPercent: parseFloat(
        shareholdersLastMettingPercent
      ),
      shareholdersLastMettingFile: shareholdersLastMettingFileObj,
      shareholdersOneYearsAgoMettingPercent: parseFloat(
        shareholdersOneYearsAgoMettingPercent
      ),
      shareholdersOneYearsAgoMettingFile: shareholdersOneYearsAgoMettingFileObj,
      shareholdersTwoYearsAgoMettingPercent: parseFloat(
        shareholdersTwoYearsAgoMettingPercent
      ),
      shareholdersTwoYearsAgoMettingFile: shareholdersTwoYearsAgoMettingFileObj,
      numberOfBoard: parseInt(numberOfBoard),
      numberOfBoardFile: numberOfBoardFileObj,
      mettingAverage: parseFloat(mettingAverage),
      mettingMin: parseFloat(mettingMin),
      ownershipMin: parseFloat(ownershipMin),
      boardMax: boardMax !== '' ? boardMax : null,
      companyControl: parseFloat(companyControl),
      // detailDescription: detailDescription,
      orderId: orderId,
      publicMessage: publicMessage,
      privateMessage: privateMessage,
    };
    saveWholesaleDetailExpert({
      data,
      onSuccess: (res) => {
        if (res?.succeeded) {
          setState({ isModalConfirmVisible: false });
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
    const data = {
      orderId: orderId,
      publicMessage: publicMessage,
      privateMessage: privateMessage,
    };
    wholeSaleReject({
      data: data,
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

  return (
    <div>
      <div className="border-2 border-lightGray">
        <div className="my-1">
          <Radio.Group onChange={handleModeChange} value={changePage}>
            <Radio.Button value="request">فرآیند فعلی</Radio.Button>
            <Radio.Button value="workflow">گردش کار</Radio.Button>
          </Radio.Group>
        </div>
        <div className=" col-span-10 items-start flex border-b-2  justify-between bg-lightGray border-lightGray  px-4">
          <div className=" flex flex-row">
            <span className=" p-2 font-bold ">درخواست :</span>
            <span className=" p-2  ">{wholeSaleCashData?.workFlowName}</span>
          </div>
          <div className=" flex flex-row">
            <span className=" p-2 font-bold ">کد پیگیری :</span>
            <span className=" p-2  ">{wholeSaleCashData?.trackingNumber}</span>
          </div>
          <div className=" flex flex-row">
            <span className=" p-2 font-bold ">وضعیت :</span>
            <span className=" p-2  ">{wholeSaleCashData?.orderStatusName}</span>
          </div>
        </div>
        {changePage == 'request' && (
          <>
            <Collapse
              className="shadow-[0_0px_4px_rgba(0,0,0,0.2)] rounded-sm p-1 mb-3 col-span-12 gap-4  justify-between mx-4 mt-4"
              title={`بررسی مدارک متقاضی فروش سهام ${wholeSaleCashData?.symbolName}`}
              expanded={attachExpanded}
              onChange={(e: any, isOpen: boolean) =>
                setState({ attachExpanded: isOpen })
              }
            >
              <div className="w-full grid grid-cols-10 ">
                <div className="grid col-span-10 grid-cols-10 gap-4 justify-between mx-4 mt-2 ">
                  <div className="col-span-2 flex flex-row items-center ">
                    <div className=" font-bold w-4 h-4 bg-blue rounded-full" />
                    <span className=" py-2 mx-2">
                      {wholeSaleCashData?.wholesaleTradeTypesName}
                    </span>
                  </div>
                </div>
                <div className="grid col-span-10 grid-cols-10 gap-4 justify-between mx-4 mt-2">
                  <div className="col-span-2 flex flex-row items-center ">
                    <div className=" font-bold w-4 h-4 bg-blue rounded-full" />
                    <span className=" py-2 mx-2">
                      {wholeSaleCashData?.wholesaleTypeName}
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
                    <span className=" py-2 ">{wholeSaleCashData?.symbol}</span>
                  </div>
                  <div className="col-span-2 flex flex-col my-2">
                    <span className=" font-bold">نام شرکت :</span>
                    <span className=" py-2 ">
                      {wholeSaleCashData?.symbolName}
                    </span>
                  </div>
                  <div className="col-span-2 flex flex-col my-2">
                    <span className=" font-bold">تعداد کل سهام شرکت :</span>
                    <span className=" py-2 ">
                      {separator(wholeSaleCashData?.tradeTotalNumber)}
                    </span>
                  </div>
                  <div className="col-span-2 flex flex-col my-2">
                    <span className=" font-bold">تعداد سهام قابل عرضه :</span>
                    <span className=" py-2 ">
                      {separator(wholeSaleCashData?.tradeVolume)}
                    </span>
                  </div>
                  <div className="col-span-2 flex flex-col my-2">
                    <span className=" font-bold">درصد سهام قابل عرضه :</span>
                    <span className=" py-2 ">
                      {wholeSaleCashData?.tradePercent}
                    </span>
                  </div>
                  <div className="col-span-2 flex flex-col my-2">
                    <span className=" font-bold">قیمت پایه :</span>
                    <span className=" py-2 ">
                      {separator(wholeSaleCashData?.basePrice)}
                    </span>
                  </div>
                  {wholeSaleCondition && (
                    <div className="col-span-2 flex flex-col my-2">
                      <span className=" font-bold">درصد حصه نقدی :</span>
                      <span className=" py-2 ">
                        {wholeSaleCashData?.cashSharePercent}
                      </span>
                    </div>
                  )}
                  <div className="col-span-2 flex flex-col my-2">
                    <span className=" font-bold">تاریخ عرضه :</span>
                    <span className=" py-2 ">
                      {convertDateToJalali(wholeSaleCashData?.tradeDate)}
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
                      <span>
                        {' '}
                        مجموع درصد از کل سرمایه : {sumOfCashSharePercent}
                      </span>
                    </div>
                    <Table
                      columns={sellerColumns}
                      className="col-span-10 grid grid-cols-12 text-center"
                      dataSource={wholeSaleCashData?.wholesaleSellers}
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
                      {wholeSaleCashData?.responsibleName}
                    </span>
                  </div>
                  <div className="col-span-2 flex flex-col">
                    <span className=" font-bold">سمت :</span>
                    <span className=" py-2 ">
                      {wholeSaleCashData?.responsiblePost}
                    </span>
                  </div>
                  <div className="col-span-2 flex flex-col">
                    <span className=" font-bold">شماره همراه :</span>
                    <span className=" py-2 ">
                      {wholeSaleCashData?.responsibleMobile}
                    </span>
                  </div>
                </div>
                {wholeSaleCashData?.message?.length > 0 && (
                  <div className="grid col-span-10 grid-cols-12 gap-4  justify-between mx-4 mt-4">
                    <div className=" col-span-12 items-start flex  ">
                      <span className="  font-bold text-blue underline">
                        توضیحات :
                      </span>
                    </div>
                    <div className=" col-span-12  pb-4">
                      <Table
                        data={wholeSaleCashData?.message}
                        columns={columns}
                        wrapperClassName="!mt-4"
                        onChangePage={onChangePage}
                        totalPages={1}
                        pageSize={10}
                        className="col-span-12 grid grid-cols-12 "
                      />
                    </div>
                  </div>
                )}
                <div className="grid col-span-10 grid-cols-10 gap-4  justify-between mx-4 mt-4 ">
                  <div className=" col-span-10 items-start flex  ">
                    <span className="  font-bold text-blue underline">
                      مدارک :
                    </span>
                  </div>
                  <div className=" col-span-10 grid grid-cols-4 pb-4 bg-[#EEEBFF] mb-4 px-4">
                    {wholeSaleCashData?.publicFiles?.length > 0 &&
                      wholeSaleCashData?.publicFiles?.map(
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
                <div className="grid col-span-10 grid-cols-10 gap-4  justify-between mx-4 mt-4 ">
                  {uploadFileListItemOthers?.length > 0 && (
                    <div className=" col-span-10 items-start flex  ">
                      <span className="  font-bold text-blue underline">
                        مدارک و مستندات عرضه کننده :
                      </span>
                    </div>
                  )}
                  {uploadFileListItemOthers?.length > 0 &&
                    wholeSaleCashData?.wholesaleSellers?.map(
                      (parentItem: any, index: any) => (
                        <div className="grid col-span-10 grid-cols-12 gap-4  justify-between  mt-4 mb-4 bg-[#EEEBFF]">
                          <div className="col-span-12">
                            <span className=" font-bold m-4">{`${parentItem?.sellerFamily}`}</span>
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
                      label="پیام خصوصی"
                      onChange={(e: any) => setState({ privateMessage: e })}
                      value={privateMessage}
                      fullWidth
                    />
                  </div>
                </div>
              </div>
            </Collapse>
            {!isCashMarketBroker && (
              <Collapse
                className="shadow-[0_0px_4px_rgba(0,0,0,0.2)] rounded-sm p-1 mb-3 col-span-12 gap-4  justify-between mx-4 mt-4"
                title="تعیین نوع معامله"
                expanded={typeTransactionExpanded}
                onChange={(e: any, isOpen: boolean) =>
                  setState({ typeTransactionExpanded: isOpen })
                }
              >
                <div className="w-full grid grid-cols-12 ">
                  <div className="grid col-span-12 grid-cols-12 gap-4  justify-between mx-4 mt-4">
                    <TextField
                      label="درصد سهام قابل عرضه"
                      className="2xl:col-span-3 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2"
                      value={sharePercent}
                      onChange={(value: any) => {
                        setState({
                          sharePercent: value,
                          sharePercentError: '',
                        });
                      }}
                      required
                      errorMessage={state?.sharePercentError}
                      type="number"
                      max={100}
                    />
                    <div className="2xl:col-span-3 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2">
                      <NewSelect
                        label="نوع معامله"
                        className="col-span-2"
                        options={[
                          { name: '', id: '' },
                          ...wholeSaleTradeTypesList,
                        ]}
                        onChange={(value: any) =>
                          setState({
                            wholeSaleTradeTypesId: value,
                            wholeSaleTradeTypesIdError: false,
                            // personTypeName: personalityType.filter(
                            //   (item: any) => item?.id == value
                            // )?.[0]?.name,
                          })
                        }
                        showKey="name"
                        selectedKey="id"
                        required
                        value={wholeSaleTradeTypesId}
                        errorMessage={state?.wholeSaleTradeTypesIdError}
                      />
                    </div>
                    <div className="2xl:col-span-3 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2">
                      <NewSelect
                        label="دسته بندی نماد"
                        className="col-span-2"
                        options={[
                          { name: '', id: '' },
                          ...wholeSaleCategoryList,
                        ]}
                        onChange={(value: any) =>
                          setState({
                            wholeSaleCategoryId: value,
                            wholeSaleCategoryIdError: false,
                            // personTypeName: personalityType.filter(
                            //   (item: any) => item?.id == value
                            // )?.[0]?.name,
                          })
                        }
                        showKey="name"
                        selectedKey="id"
                        required
                        value={wholeSaleCategoryId}
                        errorMessage={state?.wholeSaleCategoryIdError}
                      />
                    </div>
                    <div className="2xl:col-span-3 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-3 z-10">
                      <DatePicker
                        label="مهلت ارسال مدارک"
                        value={deadlineDateCertainty}
                        onChange={(value: any) =>
                          setState({
                            deadlineDateCertainty: value,
                            deadlineDateCertaintyError: '',
                          })
                        }
                        required
                        error={state?.deadlineDateCertaintyError}
                        onClearDate={() =>
                          setState({ deadlineDateCertainty: '' })
                        }
                        position="auto"
                      />
                    </div>
                  </div>
                  {sharePercentStatus === 'within' && (
                    <>
                      <div className="grid col-span-12 grid-cols-12 gap-4 gap-y-8  justify-between mx-4  mt-12">
                        <div className=" col-span-12 2xl:col-span-12 xl:col-span-12 lg:col-span-12 md:col-span-12">
                          <span className=" text-tiny">
                            درصد سهامداران حاضر در جلسه انتخاب اعضای هیئت مدیره
                            (آخرین دوره)
                          </span>
                          <div className=" col-span-12 grid grid-cols-12 gap-4 grid-flow-row justify-between my-2">
                            <TextField
                              label="درصد سهام"
                              className="2xl:col-span-3 xl:col-span-6 lg:col-span-6 md:col-span-12  col-span-3"
                              value={shareholdersLastMettingPercent}
                              onChange={(value: any) => {
                                setState({
                                  shareholdersLastMettingPercent: value,
                                  shareholdersLastMettingPercentError: '',
                                });
                              }}
                              required
                              errorMessage={
                                state?.shareholdersLastMettingPercentError
                              }
                              type="number"
                              max={100}
                            />
                            <div className=" 2xl:col-span-4 xl:col-span-6 lg:col-span-6 md:col-span-12 col-span-3 mr-4">
                              <Upload
                                onChange={(file: any) =>
                                  onChangeFile(
                                    file,
                                    'shareholdersLastMettingFile'
                                  )
                                }
                                value={shareholdersLastMettingFileName}
                                href={shareholdersLastMettingFileLink}
                                name="shareholdersLastMettingFile"
                                onDelete={() =>
                                  onRemoveFile('shareholdersLastMettingFile')
                                }
                                error={state.shareholdersLastMettingFileError}
                              />
                            </div>
                          </div>
                        </div>
                        <div className=" col-span-12 2xl:col-span-12 xl:col-span-12 lg:col-span-12 md:col-span-12">
                          <span className=" text-tiny">
                            درصد سهامداران حاضر در جلسه انتخاب اعضای هیئت مدیره
                            (دوره قبل)
                          </span>
                          <div className=" col-span-12 grid grid-cols-12 gap-4 grid-flow-row justify-between my-2">
                            <TextField
                              label="درصد سهام"
                              className="2xl:col-span-3 xl:col-span-6 lg:col-span-6 md:col-span-12  col-span-3"
                              value={shareholdersOneYearsAgoMettingPercent}
                              onChange={(value: any) => {
                                setState({
                                  shareholdersOneYearsAgoMettingPercent: value,
                                  shareholdersOneYearsAgoMettingPercentError:
                                    '',
                                });
                              }}
                              required
                              errorMessage={
                                state?.shareholdersOneYearsAgoMettingPercentError
                              }
                              type="number"
                              max={100}
                            />
                            <div className=" 2xl:col-span-4 xl:col-span-6 lg:col-span-6 md:col-span-12 col-span-3 mr-4">
                              <Upload
                                onChange={(file: any) =>
                                  onChangeFile(
                                    file,
                                    'shareholdersOneYearsAgoMettingFile'
                                  )
                                }
                                value={shareholdersOneYearsAgoMettingFileName}
                                href={shareholdersOneYearsAgoMettingFileLink}
                                name="shareholdersOneYearsAgoMettingFile"
                                onDelete={() =>
                                  onRemoveFile(
                                    'shareholdersOneYearsAgoMettingFile'
                                  )
                                }
                                error={
                                  state.shareholdersOneYearsAgoMettingFileError
                                }
                              />
                            </div>
                          </div>
                        </div>
                        <div className=" col-span-12 2xl:col-span-12 xl:col-span-12 lg:col-span-12 md:col-span-12">
                          <span className=" text-tiny">
                            درصد سهامداران حاضر در جلسه انتخاب اعضای هیئت مدیره
                            (دو دوره قبل)
                          </span>
                          <div className=" col-span-12 grid grid-cols-12 gap-4 grid-flow-row justify-between my-2">
                            <TextField
                              label="درصد سهام"
                              className="2xl:col-span-3 xl:col-span-6 lg:col-span-6 md:col-span-12  col-span-3"
                              value={shareholdersTwoYearsAgoMettingPercent}
                              onChange={(value: any) => {
                                setState({
                                  shareholdersTwoYearsAgoMettingPercent: value,
                                  shareholdersTwoYearsAgoMettingPercentError:
                                    '',
                                });
                              }}
                              required
                              errorMessage={
                                state?.shareholdersTwoYearsAgoMettingPercentError
                              }
                              type="number"
                              max={100}
                            />
                            <div className=" 2xl:col-span-4 xl:col-span-6 lg:col-span-6 md:col-span-12 col-span-3 mr-4">
                              <Upload
                                onChange={(file: any) =>
                                  onChangeFile(
                                    file,
                                    'shareholdersTwoYearsAgoMettingFile'
                                  )
                                }
                                value={shareholdersTwoYearsAgoMettingFileName}
                                href={shareholdersTwoYearsAgoMettingFileLink}
                                name="shareholdersTwoYearsAgoMettingFile"
                                onDelete={() =>
                                  onRemoveFile(
                                    'shareholdersTwoYearsAgoMettingFile'
                                  )
                                }
                                error={
                                  state.shareholdersTwoYearsAgoMettingFileError
                                }
                              />
                            </div>
                          </div>
                        </div>
                        <div className=" col-span-12 2xl:col-span-12 xl:col-span-12 lg:col-span-12 md:col-span-12">
                          <span className=" text-tiny">
                            تعداد اعضا هیئت مدیره
                          </span>
                          <div className=" col-span-12 grid grid-cols-12 gap-4 grid-flow-row justify-between my-2">
                            <TextField
                              label="تعداد"
                              className="2xl:col-span-3 xl:col-span-6 lg:col-span-6 md:col-span-12  col-span-3"
                              value={numberOfBoard}
                              onChange={(value: any) => {
                                setState({
                                  numberOfBoard: value,
                                  numberOfBoardError: '',
                                });
                              }}
                              required
                              errorMessage={state?.numberOfBoardError}
                              type="numeric"
                            />
                            <div className=" 2xl:col-span-4 xl:col-span-6 lg:col-span-6 md:col-span-12 col-span-3 mr-4">
                              <Upload
                                onChange={(file: any) =>
                                  onChangeFile(file, 'numberOfBoardFile')
                                }
                                value={numberOfBoardFileName}
                                href={numberOfBoardFileLink}
                                name="numberOfBoardFile"
                                onDelete={() =>
                                  onRemoveFile('numberOfBoardFile')
                                }
                                error={state.numberOfBoardFileError}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="grid col-span-12 grid-cols-10 gap-4  justify-between mx-4  mt-8">
                        <div className=" col-span-5 2xl:col-span-5 xl:col-span-5 lg:col-span-10 md:col-span-10 flex flex-col ">
                          <span className="">میانگین درصد حضور :</span>
                          <span className=" py-2 ">% {mettingAverage}</span>
                        </div>
                        <div className=" col-span-5 2xl:col-span-5 xl:col-span-5 lg:col-span-10 md:col-span-10 flex flex-col ">
                          <span className="">حداقل درصد حضور سهامداران :</span>
                          <span className=" py-2 ">% {mettingMin}</span>
                        </div>
                        <div className=" col-span-5 2xl:col-span-5 xl:col-span-5 lg:col-span-10 md:col-span-10 flex flex-col ">
                          <span className="">
                            حداقل درصد تملک سهام لازم جهت اخذ یک سیت مدیریتی :
                          </span>
                          <span className=" py-2 ">% {ownershipMin}</span>
                        </div>
                        <div className=" col-span-5 2xl:col-span-5 xl:col-span-5 lg:col-span-10 md:col-span-10 flex flex-col ">
                          <span className="">
                            اکثریت تعداد اعضا هیئت مدیره جهت کنترل شرکت :
                          </span>
                          <span className=" py-2 ">{boardMax}</span>
                        </div>
                        <div className=" col-span-5 2xl:col-span-5 xl:col-span-5 lg:col-span-10 md:col-span-10 flex flex-col ">
                          <span className="">
                            درصد سهام لازم برای کنترل شرکت (بر اساس فرمول مصوب
                            شورای معاونین) :
                          </span>
                          <span className=" py-2 ">% {companyControl}</span>
                        </div>
                      </div>
                    </>
                  )}
                  {/* <div className="col-span-12  px-4 my-4">
                  <TextField
                    multiline
                    className=" bg-white"
                    label="توضیحات"
                    onChange={(e: any) => setState({ detailDescription: e })}
                    value={detailDescription}
                    fullWidth
                  />
                </div> */}
                  {wholeSaleDocumentListData?.length > 0 && (
                    <div className="col-span-12 grid-cols-12 gap-4  justify-between mx-4  mt-8">
                      <Table
                        columns={documentListTable}
                        className="col-span-12 grid grid-cols-12 text-center"
                        dataSource={wholeSaleDocumentListData}
                        pageSize={1000}
                      />
                    </div>
                  )}
                </div>
              </Collapse>
            )}
          </>
        )}
      </div>
      {changePage == 'workflow' && <WorkFlow data={workFlow} />}
      {changePage != 'workflow' ? (
        <div className="flex justify-end my-4">
          <a
            href="/cartable"
            className="border-blue border ml-4 text-blue w-[120px] h-[35px]  flex items-center justify-center rounded"
            // onClick={onConfirm}
          >
            بازگشت
          </a>
          {!history && (
            <>
              <a
                // href="/stock/request-block"
                className="border-green border mx-4 text-green w-[120px] h-[35px]  flex items-center justify-center rounded"
                onClick={onConfirmClick}
              >
                تایید
              </a>
              <a
                // href="/stock/request-block"
                className="border-red border mr-4 text-red w-[120px] h-[35px]  flex items-center justify-center rounded"
                onClick={() => setState({ isModalRejectVisible: true })}
              >
                عدم تایید
              </a>
            </>
          )}
        </div>
      ) : null}
      <Modal
        handleOk={() => onOkModalConfirmClick()}
        handleCancel={() => setState({ isModalConfirmVisible: false })}
        isModalVisible={isModalConfirmVisible}
        title={`آیا نسبت به تایید اطلاعات اطمینان دارید؟`}
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
export default withAlert(WholeSaleSellExpertRequestDetails);
